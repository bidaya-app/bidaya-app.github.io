// عامل الخدمة للنسخة المستقلة (GitHub Pages): يجعل التطبيق قابلاً للتثبيت على الهاتف، ويفتحه فوراً وبلا إنترنت.
// هذا قالب: يكتب فيه البناء (الإضافة serviceWorker في vite.config.ts) رقمَ النسخة وقائمةَ ملفاتها، فيصير dist/sw.js.
// - عند التثبيت تُحفظ ملفات النسخة كلها مسبقاً (الصفحة، وملفات assets بأسمائها المختومة، ونص المصحف) في ذاكرة باسم النسخة.
//   ما لم يتغيّر منذ النسخة السابقة يُنسخ من ذاكرتها ولا يُنزَّل من جديد.
// - ملفات assets من الذاكرة أولاً (اسمها يتغيّر إن تغيّر محتواها، فلا تبقى نسخة قديمة عالقة).
// - الصفحة نفسها من الشبكة أولاً (فيأخذ من يفتح التطبيق آخر نسخة)، فإن انقطع الاتصال أو أبطأ أكثر من ٣ ثوانٍ فمن الذاكرة.
// - كل نسخة جديدة تحذف ما قبل السابقة؛ والسابقة تبقى لمن ترك التطبيق مفتوحاً عليها حتى يطلب منها شاشة.
const VERSION = "202611260235-1a58e1268646";
const PRECACHE = [["./","202611260235-1a58e1268646"],["assets/Account-BksbBDzQ.js",null],["assets/ClassView-DNc1AgPa.js",null],["assets/Classes-B3EgQV7E.js",null],["assets/Lessons-VQUCfQdJ.js",null],["assets/Letters-DTfG4w0w.js",null],["assets/Mushaf-CkBjiwBA.js",null],["assets/MushafPages-QGle3UwC.js",null],["assets/PageNotes-BIlxj4yr.js",null],["assets/Prefs-ZFQJ8v44.js",null],["assets/Reference-DpSWcZCk.js",null],["assets/SheikhBox-DEnI1e0O.js",null],["assets/SheikhLibrary-CkVF5FeG.js",null],["assets/SheikhLogin-BgJJQAD5.js",null],["assets/SheikhPlayer-1r4h83qS.js",null],["assets/SheikhReview-B--Bl3gq.js",null],["assets/SheikhTools-Cb89moNq.js",null],["assets/amiri-quran-arabic-400-normal-wRcqfVJx.woff2",null],["assets/amiri-quran-latin-400-normal-w9exIk9i.woff2",null],["assets/clips-DVFF_ZMI.js",null],["assets/dist-C4a64QHS.js",null],["assets/ibm-plex-sans-arabic-arabic-400-normal-CyU-ddYS.woff2",null],["assets/ibm-plex-sans-arabic-arabic-500-normal-C4MQITzh.woff2",null],["assets/ibm-plex-sans-arabic-arabic-700-normal-DrtBj6UE.woff2",null],["assets/ibm-plex-sans-arabic-latin-400-normal-Bo5KPYvw.woff2",null],["assets/ibm-plex-sans-arabic-latin-500-normal-Cd6jVIg7.woff2",null],["assets/ibm-plex-sans-arabic-latin-700-normal-BzSf6GNr.woff2",null],["assets/index-C-_WE7-q.js",null],["assets/index-D8SR0v5e.css",null],["assets/lessons-D0dZ9W4-.js",null],["assets/noto-naskh-arabic-arabic-400-normal-U_i0HMfG.woff2",null],["assets/noto-naskh-arabic-arabic-600-normal-G5n5bgdQ.woff2",null],["assets/noto-naskh-arabic-latin-400-normal-Dajb6q3W.woff2",null],["assets/noto-naskh-arabic-latin-600-normal-DByBVxli.woff2",null],["assets/reem-kufi-arabic-500-normal-CI8P0nls.woff2",null],["assets/reem-kufi-arabic-700-normal-D4RhYlR1.woff2",null],["assets/reem-kufi-latin-500-normal-BQCKG746.woff2",null],["assets/reem-kufi-latin-700-normal-D4MLSEVm.woff2",null],["assets/targets-BzrpKE_V.js",null],["assets/time-BC8j5VF3.js",null],["quran.json","c534bed62186"]]; // [المسار، المراجعة] — المراجعة للملفات التي لا يتغيّر اسمها (الصفحة ونص المصحف)، وnull للمختومة
const ENTRY = "assets/index-C-_WE7-q.js"; // ملف JavaScript الأول لهذه النسخة: الصفحة المحفوظة يجب أن تشير إليه
const PREFIX = 'bidaya-';
const CACHE = PREFIX + VERSION;
const NET_WAIT = 3000;
const SCOPE = self.registration.scope;
const ROOT = new URL('./', SCOPE).pathname;
const ASSETS = ROOT + 'assets/';
const abs = (p) => new URL(p, SCOPE).href;
const REVS = abs('__revisions');
const REVISIONED = new Set(PRECACHE.filter(([, rev]) => rev && rev !== VERSION).map(([p]) => new URL(p, SCOPE).pathname));

async function precache() {
  const cache = await caches.open(CACHE);
  const others = await Promise.all((await caches.keys()).filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.open(k)));
  const revs = await Promise.all(others.map((c) => c.match(REVS).then((r) => (r ? r.json() : {})).catch(() => ({}))));
  const mine = {};
  await Promise.all(
    PRECACHE.map(async ([p, rev]) => {
      const url = abs(p);
      if (rev) mine[url] = rev;
      for (let i = 0; i < others.length; i++) {
        if (rev && revs[i][url] !== rev) continue;
        const r = await others[i].match(url);
        if (r) return cache.put(url, r);
      }
      const r = await fetch(url, { cache: rev ? 'no-cache' : 'default' });
      if (!r.ok) throw new Error(`${p}: ${r.status}`);
      await cache.put(url, r);
    }),
  );
  // إن نُشرت نسخة أخرى أثناء التثبيت فالصفحة المحفوظة لا تطابق ملفاتها: لا تثبيت (يُعاد عند الفتح التالي)
  const page = await cache.match(abs('./'));
  if (!page || !(await page.clone().text()).includes(ENTRY)) throw new Error('mixed build');
  await cache.put(REVS, new Response(JSON.stringify(mine)));
}

self.addEventListener('install', (e) => {
  self.skipWaiting();
  // إن تعذّر التثبيت (ملف ناقص أو انقطاع) تُحذف ذاكرته الناقصة، ويبقى العامل السابق، ويُعاد عند الفتح التالي
  e.waitUntil(precache().catch((err) => caches.delete(CACHE).then(() => Promise.reject(err))));
});

self.addEventListener('activate', (e) =>
  e.waitUntil(
    (async () => {
      // keys بترتيب الإنشاء: آخر ما قبل الحالية هي السابقة فتبقى، وما قبلها يُحذف (ومعه ذاكرة النسخة القديمة bidaya-shell-v2)
      const old = (await caches.keys()).filter((k) => k !== CACHE);
      const keep = old.filter((k) => k.startsWith(PREFIX) && k !== PREFIX + 'shell-v2').pop();
      await Promise.all(old.filter((k) => k !== keep).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  ),
);

const fromCache = () => caches.open(CACHE).then((c) => c.match(abs('./')));

// الصفحة: الشبكة أولاً، ثم الذاكرة إن انقطع الاتصال أو تأخّر الرد
function page(req) {
  const net = fetch(req).then((r) => (r.ok ? r : fromCache().then((c) => c || r)));
  const slow = new Promise((ok) => setTimeout(ok, NET_WAIT)).then(fromCache).then((c) => c || net);
  return Promise.race([net, slow]).catch(() => fromCache().then((c) => c || Response.error()));
}

// ملفات assets: من ذاكرة هذه النسخة أو السابقة، وإلا من الشبكة وتُحفظ (مثل ملفات الفحص الآلي حين تُستعمل)
let mine;
async function asset(e) {
  const own = await (mine ??= caches.open(CACHE));
  const hit = (await own.match(e.request)) || (await caches.match(e.request));
  if (hit) return hit;
  const r = await fetch(e.request);
  if (r.ok && r.type === 'basic' && !e.request.url.endsWith('.wasm')) e.waitUntil(own.put(e.request, r.clone()).catch(() => undefined));
  return r;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // صفحة التطبيق وحدها: صفحات أخرى على الموقع نفسه (مثل /lab/) لا تمرّ من هنا، فلا تحلّ محلّ التطبيق
  if (req.mode === 'navigate') {
    if (url.pathname === ROOT || url.pathname === ROOT + 'index.html') e.respondWith(page(req));
    return;
  }
  if (url.pathname.startsWith(ASSETS)) return e.respondWith(asset(e));
  // نص المصحف وما شابهه: نسخة هذه النسخة المحفوظة، وإلا من الشبكة
  if (REVISIONED.has(url.pathname) && !url.search)
    e.respondWith(caches.open(CACHE).then((c) => c.match(url.href, { ignoreVary: true })).then((r) => r || fetch(req)));
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
