// Service worker: guarda o app no celular para funcionar sem internet.
// Ao publicar uma nova versão, mude o número abaixo para o celular baixar a atualização.
const VERSION = 'treino-v8';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Página: abre na hora pelo que está guardado e busca a versão nova em segundo plano
  // (internet fraca na academia não atrasa a abertura do app).
  if (req.mode === 'navigate') {
    const net = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put('index.html', c)); } return r; });
    e.respondWith(caches.match('index.html').then(hit => hit || net).catch(() => net));
    e.waitUntil(net.catch(() => {}));
    return;
  }
  // Demais arquivos e fontes: cache primeiro, rede depois (e guarda o que baixar).
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); }
    return r;
  }).catch(() => hit)));
});
