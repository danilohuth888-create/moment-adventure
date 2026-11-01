'use strict';
const CACHE='moment-adventure-offline-v4';
const ASSETS=['./','./index.html','./style.css','./game.js','./manifest.webmanifest','./favicon.svg','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('moment-adventure-offline-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;event.respondWith((async()=>{const cached=await caches.match(event.request,{ignoreSearch:true});if(cached)return cached;try{return await fetch(event.request)}catch{if(event.request.mode==='navigate')return (await caches.match('./index.html'))||Response.error();return Response.error()}})())});
