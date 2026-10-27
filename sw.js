// Zontes Putrajaya Ride Hub — resilient network-first offline cache.
// This Service Worker does not touch Firebase Authentication or Firestore messages.
const VERSION='zontes-ride-v1.0.5';
const ASSETS=[
  './','./index.html','./styles.css','./app.js','./config.js','./data.js',
  './manifest.webmanifest','./assets/zontes-logo.jpg','./assets/cameron-convoy.jpg',
  './assets/icon-192.png','./assets/icon-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(VERSION);
    // Failure of one optional asset must not cancel the entire SW installation.
    await Promise.allSettled(ASSETS.map(async path=>{
      const url=new URL(path,self.registration.scope);
      const response=await fetch(url,{cache:'reload'});
      if(!response.ok)throw new Error(`Precache failed: ${url.pathname} (${response.status})`);
      await cache.put(url,response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('zontes-ride-')&&k!==VERSION).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  // Network-first avoids stale app.js/config.js/index.html after GitHub updates.
  event.respondWith((async()=>{
    try{
      const response=await fetch(request);
      if(response.ok){
        const copy=response.clone();
        event.waitUntil(caches.open(VERSION).then(cache=>cache.put(request,copy)).catch(()=>{}));
      }
      return response;
    }catch(err){
      const cached=await caches.match(request);
      if(cached)return cached;
      if(request.mode==='navigate'){
        const offline=await caches.match(new URL('./index.html',self.registration.scope));
        if(offline)return offline;
      }
      return Response.error();
    }
  })());
});
