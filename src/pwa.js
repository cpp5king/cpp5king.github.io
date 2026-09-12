(function(root){
  'use strict';
  const doc=root.document;
  const panel=doc?.querySelector?.('#mobile-install');
  const message=doc?.querySelector?.('#mobile-install-message');
  const installButton=doc?.querySelector?.('#pwa-install-button');
  const isMobile=/Android|iPhone|iPad|iPod/i.test(root.navigator?.userAgent||'') || root.matchMedia?.('(max-width: 760px)').matches;
  const standalone=root.matchMedia?.('(display-mode: standalone)').matches || root.navigator?.standalone===true;
  const secure=root.location?.protocol==='https:' || (root.location?.protocol==='http:' && ['localhost','127.0.0.1','[::1]'].includes(root.location?.hostname));
  const VERSION='4.8.5';

  // Safari / iOS 容易長時間保留舊 service worker。使用版本化 SW URL + updateViaCache:none
  // 強制更新檢查；新版接手後僅自動重新整理一次。
  if(secure && 'serviceWorker' in root.navigator){
    root.addEventListener('load',async()=>{
      try{
        const registration=await root.navigator.serviceWorker.register(`./service-worker.js?v=${VERSION}`,{updateViaCache:'none'});
        if(registration?.update)await registration.update();
      }catch(_){/* 離線時維持既有離線版本 */}
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