const PROVENANCE='PP-IA-41-7F3C9A21';
const VERSION='4.8.4';
const CACHE_NAME='inspection-assistant-4.8.4-pp-7f3c9a21';
const V='?v='+VERSION;
const APP_SHELL=[
  './index.html'+V,
  './manifest.webmanifest'+V,
  './icons/icon-192.png',
  './icons/icon-180.png',
  './src/styles.css'+V,
  './src/choice-cards.css'+V,
  './src/mobile-multiselect.css'+V,
  './data/provenance.js'+V,
  './data/app-meta.js'+V,
  './data/texts/noise-common.js'+V,
  './data/texts/noise-templates.js'+V,
  './data/texts/noise-main.js'+V,
  './data/texts/noise-article8.js'+V,
  './data/texts/noise-article9.js'+V,
  './data/texts/noise-neighbor.js'+V,
  './data/texts/noise-ui.js'+V,
  './data/texts/water-main.js'+V,
  './data/texts/water-field.js'+V,
  './src/noise-format.js'+V,
  './data/texts/noise-documents.js'+V,
  './src/noise-text.js'+V,
  './data/templates/catalog.js'+V,
  './data/templates/restaurant-odor.js'+V,
  './data/templates/restaurant-odor-sampling-pending.js'+V,
  './data/templates/noise-case.js'+V,
  './data/templates/noise-main.js'+V,
  './data/templates/noise-neighbor.js'+V,
  './data/templates/water-field.js'+V,
  './data/templates/water-main.js'+V,
  './data/rules/noise-article8.js'+V,
  './src/noise-article8.js'+V,
  './data/rules/noise-article9.js'+V,
  './src/noise-article9.js'+V,
  './data/templates/noise-article9-documents.js'+V,
  './src/noise-article9-documents.js'+V,
  './src/noise-article9-measurement.js'+V,
  './src/noise-backgrounds.js'+V,
  './src/noise-attempts.js'+V,
  './src/noise-main.js'+V,
  './data/rules/water-article13.js'+V,
  './data/rules/water-article14.js'+V,
  './data/rules/water-article18.js'+V,
  './data/rules/water-article20.js'+V,
  './data/rules/water-article22-35.js'+V,
  './data/rules/water-article26.js'+V,
  './data/rules/water-article27.js'+V,
  './data/rules/water-article7.js'+V,
  './data/rules/water-article18-1.js'+V,
  './data/rules/water-article28.js'+V,
  './data/rules/water-article30.js'+V,
  './data/rules/water-article32.js'+V,
  './data/rules/water-article59.js'+V,
  './data/rules/water-article71.js'+V,
  './data/rules/water-sublaw-core.js'+V,
  './data/rules/water-industry.js'+V,
  './src/water-law-versions.js'+V,
  './src/water-facts.js'+V,
  './src/water-rule-engine.js'+V,
  './src/water-industry.js'+V,
  './src/water-permit-check.js'+V,
  './src/water-workflow.js'+V,
  './src/water-dependencies.js'+V,
  './src/water-assessment.js'+V,
  './src/water-documents.js'+V,
  './src/water-main.js'+V,
  './src/water-field.js'+V,
  './src/draft-engine.js'+V,
  './src/template-loader.js'+V,
  './src/case-file.js'+V,
  './src/case-session.js'+V,
  './src/choice-controls.js'+V,
  './src/ui-profile.js'+V,
  './src/field-renderer.js'+V,
  './src/water-v482.js'+V,
  './src/inspection-flow-ui.js'+V,
  './src/sentence-app.js'+V,
  './src/pwa.js'+V,
  './icons/icon-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    for(const path of APP_SHELL){
      const request=new Request(new URL(path,self.location.href).href,{cache:'reload'});
      const response=await fetch(request);
      if(!response.ok)throw new Error('App shell fetch failed: '+path);
      await cache.put(request,response.clone());
    }
  })());
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(event.request,{cache:'no-store'});
      if(response&&response.ok){
        const cache=await caches.open(CACHE_NAME);
        await cache.put(event.request,response.clone());
      }
      return response;
    }catch(_){
      const cached=await caches.match(event.request);
      if(cached)return cached;
      if(event.request.mode==='navigate'){
        return (await caches.match('./index.html'+V))||(await caches.match('./index.html'));
      }
      throw _;
    }
  })());
});