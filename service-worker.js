const PROVENANCE='PP-IA-41-7F3C9A21';
const VERSION='4.9.43';
const CACHE_REVISION='release-4.9.43';
const CACHE_NAME='inspection-assistant-4.9.43-pp-7f3c9a21-'+CACHE_REVISION;
const V='?v='+VERSION;
const NAVIGATION_TIMEOUT_MS=6000;
const APP_SHELL=[
  './index.html'+V,
  './manifest.webmanifest'+V,
  './icons/icon-192.png',
  './icons/icon-180.png',
  './src/styles.css'+V,
  './src/choice-cards.css'+V,
  './src/mobile-multiselect.css'+V,
  './src/water-v2-ui.css'+V,
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
  './data/texts/noise-result-map.js'+V,
  './src/noise-text.js'+V,
  './data/templates/catalog.js'+V,
  './data/templates/restaurant-odor.js'+V,
  './data/templates/restaurant-odor-sampling-pending.js'+V,
  './data/templates/noise-main.js'+V,
  './data/templates/water-field.js'+V,
  './data/templates/water-main.js'+V,
  './data/rules/noise-article8.js'+V,
  './data/rules/noise-article9.js'+V,
  './data/water-rules.js'+V,
  './src/noise-zone.js'+V,
  './src/noise-main.js'+V,
  './src/noise-method-guidance.js'+V,
  './src/noise-composite.js'+V,
  './src/noise-boundary.js'+V,
  './src/noise-priority-routing.js'+V,
  './src/noise-mobile-wizard.js'+V,
  './src/noise-approved-drafts.js'+V,
  './data/rules/water-sublaw-core.js'+V,
  './data/rules/water-industry.js'+V,
  './data/rules/water-industry-catalog-v485.js'+V,
  './src/water-law-versions.js'+V,
  './src/water-facts.js'+V,
  './src/water-rule-engine.js'+V,
  './src/water-law.js'+V,
  './src/water-v2-facts.js'+V,
  './src/water-v2-assessment.js'+V,
  './src/water-screening-assist.js'+V,
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
  './src/mobile-wizard.js'+V,
  './src/water-v482.js'+V,
  './src/water-industry-v485.js'+V,
  './src/water-industry-v485-final.js'+V,
  './src/inspection-flow-ui.js'+V,
  './src/water-v2-ui.js'+V,
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

const fetchNetwork=request=>fetch(request,{cache:'no-store'});
const fetchNavigationWithTimeout=request=>{
  let timer;
  return Promise.race([
    fetchNetwork(request),
    new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(new Error('Navigation network timeout')),NAVIGATION_TIMEOUT_MS);
    })
  ]).finally(()=>clearTimeout(timer));
};

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  const isNavigation=event.request.mode==='navigate';
  event.respondWith((async()=>{
    try{
      const response=isNavigation
        ? await fetchNavigationWithTimeout(event.request)
        : await fetchNetwork(event.request);
      if(response&&response.ok){
        const cache=await caches.open(CACHE_NAME);
        await cache.put(event.request,response.clone());
      }
      return response;
    }catch(error){
      const cached=await caches.match(event.request);
      if(cached)return cached;
      if(isNavigation){
        const fallback=(await caches.match('./index.html'+V))||(await caches.match('./index.html'));
        if(fallback)return fallback;
      }
      throw error;
    }
  })());
});