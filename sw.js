// عامل الخدمة للنسخة المستقلة (GitHub Pages): يجعل التطبيق قابلاً للتثبيت على الهاتف،
// ويعرض آخر نسخة محفوظة من الصفحة الرئيسية إن انقطع الاتصال. لا يحفظ غيرها، فلا تبقى نسخة قديمة عالقة.
const CACHE = 'bidaya-shell-v2';
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.add('./')).catch(() => undefined));
});
self.addEventListener('activate', (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
);
// يحفظ الصفحة الرئيسية للتطبيق وحدها: صفحات أخرى على الموقع نفسه (مثل /lab/) لا تمرّ من هنا، فلا تحلّ محلّ التطبيق.
const ROOT = new URL('./', self.registration.scope).pathname;
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  const path = new URL(e.request.url).pathname;
  if (path !== ROOT && path !== ROOT + 'index.html') return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put('./', copy)).catch(() => undefined);
        return r;
      })
      .catch(() => caches.match('./').then((r) => r || Response.error())),
  );
});

// إشعارات الجهاز: ملاحظة الشيخ، وتذكيرات الدرس والحفظ والغياب. الضغط يفتح الشاشة المعنية.
self.addEventListener('push', (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = { title: 'بداية الهداية', body: e.data ? e.data.text() : '' };
  }
  e.waitUntil(
    self.registration.showNotification(d.title || 'بداية الهداية', {
      body: d.body || '',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      dir: 'rtl',
      lang: 'ar',
      tag: d.tag || undefined,
      data: { route: d.route || 'inbox' },
    }),
  );
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(`./#${e.notification.data?.route || 'inbox'}`, self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.registration.scope) && 'focus' in c) {
          c.navigate(url).catch(() => undefined);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
