// ── La Catalina · Service Worker ─────────────────────────────────────────────
// Cache offline + notificaciones push.
const CACHE = 'lc-v63';
const ASSETS = [
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone@7.26.4/babel.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(ASSETS.map(u => c.add(u).catch(() => {})))
    )
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // El documento HTML (index.html) es el que dice qué versión de cada
  // js/*.js hay que pedir. Si a ESE lo servimos desde caché primero,
  // un cambio recién subido tarda una recarga de más en aparecer —
  // por eso, sólo para la navegación, va SIEMPRE primero a la red.
  const esNavegacion = e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').includes('text/html');
  if (esNavegacion) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      for (const c of cls) { if (c.url && 'focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
self.addEventListener('push', e => {
  // Todo adentro de waitUntil: si el parseo o el showNotification fallan,
  // igual queda una promesa que el navegador puede esperar (nunca se pierde
  // el evento en silencio).
  e.waitUntil((async () => {
    let data = {};
    try {
      data = e.data ? e.data.json() : {};
    } catch (err) {
      try { data = { body: e.data ? e.data.text() : '' }; } catch (_) {}
    }
    const title = data.title || '🚚 La Catalina';
    const opts = {
      body: data.body || '',
      icon: data.icon || './icon-192.png',
      badge: './icon-192.png',
      tag: data.tag || 'reparto',
      requireInteraction: data.requireInteraction !== false,
      data: { url: './' },
    };
    try {
      await self.registration.showNotification(title, opts);
    } catch (err) {
      try { await self.registration.showNotification('🚚 La Catalina', { body: 'Tenés un aviso nuevo.' }); } catch (_) {}
    }
  })());
});
