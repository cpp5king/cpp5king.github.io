(function(root){
  'use strict';
  const doc=root.document;
  const panel=doc?.querySelector?.('#mobile-install');
  const message=doc?.querySelector?.('#mobile-install-message');
  const installButton=doc?.querySelector?.('#pwa-install-button');
  const isMobile=/Android|iPhone|iPad|iPod/i.test(root.navigator?.userAgent||'') || root.matchMedia?.('(max-width: 760px)').matches;
  const standalone=root.matchMedia?.('(display-mode: standalone)').matches || root.navigator?.standalone===true;
  const secure=root.location?.protocol==='https:' || (root.location?.protocol==='http:' && ['localhost','127.0.0.1','[::1]'].includes(root.location?.hostname));
  const VERSION='4.8.6';

  const readPublishedVersion=async()=>{
    try{
      const response=await root.fetch(`./data/app-meta.js?update=${Date.now()}`,{cache:'no-store'});
      if(!response?.ok)return '';
      const text=await response.text();
      return text.match(/version\s*:\s*['\"]([^'\"]+)/)?.[1]||'';
    }catch(_){return '';}
  };

  const moveToPublishedVersion=async(version)=>{
    if(!version||version===VERSION)return;
    try{
      await root.navigator.serviceWorker?.register?.(`./service-worker.js?v=${encodeURIComponent(version)}`,{updateViaCache:'none'});
    }catch(_){/* 下一次開啟仍會再次檢查 */}
    try{
      const target=new URL('./index.html',root.location.href);
      target.searchParams.set('v',version);
      target.searchParams.set('update',String(Date.now()));
      root.location.replace(target.href);
    }catch(_){/* 保留目前可用版本 */}
  };

  // 每次上線時向伺服器確認版本；未來即使瀏覽器仍握有舊 App Shell，
  // 只要這支更新程式已進入裝置，就會自行切到新版本化網址。
  if(secure && 'serviceWorker' in root.navigator){
    root.addEventListener('load',async()=>{
      try{
        const registration=await root.navigator.serviceWorker.register(`./service-worker.js?v=${VERSION}`,{updateViaCache:'none'});
        if(registration?.update)await registration.update();
      }catch(_){/* 離線時維持既有離線版本 */}
      const published=await readPublishedVersion();
      await moveToPublishedVersion(published);
    });
    let refreshing=false;
    root.navigator.serviceWorker.addEventListener?.('controllerchange',()=>{
      if(refreshing)return;
      refreshing=true;
      root.location?.reload?.();
    });
  }

  if(!isMobile||standalone)return;
  if(panel)panel.hidden=false;
  if(!secure){
    if(message)message.textContent='手機版第一次安裝需由 HTTPS 網址開啟；安裝完成後即可離線使用。ZIP 內檔案仍可供 Windows 離線版使用。';
    if(installButton)installButton.hidden=true;
    return;
  }
  const isiOS=/iPhone|iPad|iPod/i.test(root.navigator?.userAgent||'');
  if(isiOS){
    if(message)message.textContent='iPhone／iPad：請用 Safari 開啟，點「分享」→「加入主畫面」。完成後可離線使用。';
    if(installButton)installButton.hidden=true;
    return;
  }
  let deferredPrompt=null;
  root.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();deferredPrompt=event;
    if(message)message.textContent='可將稽查助手安裝到手機主畫面，安裝後可離線使用。';
    if(installButton)installButton.hidden=false;
  });
  installButton?.addEventListener('click',async()=>{
    if(!deferredPrompt)return;
    deferredPrompt.prompt();
    try{await deferredPrompt.userChoice;}catch(_){/* no-op */}
    deferredPrompt=null;installButton.hidden=true;
  });
})(window);
