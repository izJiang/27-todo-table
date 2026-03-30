const CACHE = '27todo-v1';
const ASSETS = [
  '/27-todo-table/',
  '/27-todo-table/index.html',
  '/27-todo-table/manifest.json',
  '/27-todo-table/icon-192.png',
  '/27-todo-table/icon-512.png',
];

// 安装：预缓存核心资源
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 激活：清除旧缓存
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 请求：网络优先，失败走缓存
self.addEventListener('fetch', e => {
  // 只缓存同源 GET 请求，Supabase API 走网络
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.hostname.includes('supabase')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 成功则更新缓存
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
