// Service Worker — ทำให้เปิดได้เร็ว/ออฟไลน์ (เปลือกแอป) และรองรับการติดตั้ง PWA
const CACHE = 'ml-mea-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // ข้อมูลสด (Google Apps Script) → ต่อเน็ตเสมอ ไม่แคช
  if (url.hostname.includes('script.google') || url.hostname.includes('googleusercontent')) return;
  // หน้าเว็บ (navigation) → เน็ตก่อน สำรองด้วยแคช (ได้เวอร์ชันใหม่เสมอ ออฟไลน์ก็ยังเปิดได้)
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => {
      caches.open(CACHE).then(c => c.put('./index.html', r.clone()));
      return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // ไฟล์อื่น (ไอคอน/manifest) → แคชก่อน
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
