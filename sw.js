// يعمل التطبيق دون إنترنت بعد أول فتح
const VERSION = 'subha-v8';
const FILES = [
 "./",
 "index.html",
 "css/app.css",
 "js/fadl.js",
 "js/voice.js",
 "js/strand.js",
 "js/app.js",
 "manifest.webmanifest",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/apple-touch-icon.png",
 "assets/beads/bead_agate_0.webp",
 "assets/beads/bead_agate_1.webp",
 "assets/beads/bead_agate_2.webp",
 "assets/beads/bead_amber_0.webp",
 "assets/beads/bead_amber_1.webp",
 "assets/beads/bead_amber_2.webp",
 "assets/beads/bead_jade_0.webp",
 "assets/beads/bead_jade_1.webp",
 "assets/beads/bead_jade_2.webp",
 "assets/beads/bead_lapis_0.webp",
 "assets/beads/bead_lapis_1.webp",
 "assets/beads/bead_lapis_2.webp",
 "assets/beads/bead_olive_0.webp",
 "assets/beads/bead_olive_1.webp",
 "assets/beads/bead_olive_2.webp",
 "assets/beads/bead_pearl_0.webp",
 "assets/beads/bead_pearl_1.webp",
 "assets/beads/bead_pearl_2.webp",
 "assets/beads/bead_turquoise_0.webp",
 "assets/beads/bead_turquoise_1.webp",
 "assets/beads/bead_turquoise_2.webp",
 "assets/beads/bead_yusr_0.webp",
 "assets/beads/bead_yusr_1.webp",
 "assets/beads/bead_yusr_2.webp",
 "assets/beads/disc_agate.webp",
 "assets/beads/disc_amber.webp",
 "assets/beads/disc_jade.webp",
 "assets/beads/disc_lapis.webp",
 "assets/beads/disc_olive.webp",
 "assets/beads/disc_pearl.webp",
 "assets/beads/disc_turquoise.webp",
 "assets/beads/disc_yusr.webp",
 "assets/beads/imam_agate.webp",
 "assets/beads/imam_amber.webp",
 "assets/beads/imam_jade.webp",
 "assets/beads/imam_lapis.webp",
 "assets/beads/imam_olive.webp",
 "assets/beads/imam_pearl.webp",
 "assets/beads/imam_turquoise.webp",
 "assets/beads/imam_yusr.webp",
 "assets/sounds/clack_1.wav",
 "assets/sounds/clack_2.wav",
 "assets/sounds/clack_3.wav",
 "assets/sounds/done.wav",
 "assets/fonts/markazi_bold.ttf",
 "assets/fonts/markazi_medium.ttf",
 "assets/fonts/markazi_regular.ttf",
 "assets/fonts/markazi_semibold.ttf"
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // الكود: الشبكة أولًا لتصل التحديثات، ثم النسخة المحفوظة. والصور والأصوات: المحفوظة أولًا.
  const url = new URL(e.request.url);
  const code = /\.(html|js|css|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (code) {
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
