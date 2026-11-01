/* MOMENT 1.0 — offline-first application shell, own-domain requests only. */
'use strict';
const CACHE='moment-adventure-offline-1.0.0';
const FILES=['./','./index.html','./style.css','./game.js','./manifest.webmanifest','./favicon.svg','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('moment-adventure-offline-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(req);
      if(response.ok)cache.put(req,response.clone()).catch(()=>{});
      return response;
    }catch{
      return (await cache.match(req,{ignoreSearch:true})) || (req.mode==='navigate' ? (await cache.match('./index.html')) : undefined) || Response.error();
    }
  })());
});
