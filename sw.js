const VERSION = 'zontes-ride-v1.0.3';
const ASSETS = ['./','./index.html','./styles.css','./app.js','./config.js','./data.js','./manifest.webmanifest','./assets/zontes-logo.jpg','./assets/cameron-convoy.jpg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('zontes-ride-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{const clone=response.clone();caches.open(VERSION).then(c=>c.put('./index.html',clone));return response}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(found=>found||fetch(event.request).then(response=>{if(response.ok)caches.open(VERSION).then(c=>c.put(event.request,response.clone()));return response})));
});
