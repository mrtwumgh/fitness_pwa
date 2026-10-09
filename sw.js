const C='ss-v3',A=['./','index.html','style.css','app.js','manifest.webmanifest','icon-192.png','icon-512.png','badge-96.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!='GET'||!e.request.url.startsWith(self.location.origin))return;e.respondWith(caches.match(e.request).then(r=>{const n=fetch(e.request).then(x=>{const y=x.clone();caches.open(C).then(c=>c.put(e.request,y));return x}).catch(()=>r);return r||n}))});

// Reminder arrives from the worker
self.addEventListener('push',e=>{
  let d={};
  try{d=e.data?e.data.json():{}}catch(_){d={body:e.data&&e.data.text()}}
  e.waitUntil(self.registration.showNotification(d.title||'Strength Start',{
    body:d.body||'',tag:d.tag||'reminder',renotify:true,
    icon:'icon-192.png',badge:'badge-96.png',vibrate:[300,120,300],
    data:{url:'./'}
  }));
});

// Tapping the reminder opens (or focuses) the app
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    for(const c of cs)if('focus'in c)return c.focus();
    return self.clients.openWindow(e.notification.data&&e.notification.data.url||'./');
  }));
});
