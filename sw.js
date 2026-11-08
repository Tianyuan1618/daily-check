/* ============================================================
 *  sw.js — 每日打卡 PWA 服务工作线程
 *  作用：缓存应用外壳（App Shell），实现离线可用与秒开。
 * ============================================================ */

const CACHE = 'daily-check-v1';

// 需要预缓存的应用外壳（与 index.html 中引用的版本保持一致）
const SHELL = [
  './',
  'index.html',
  'style.css?v=20260916d',
  'config.js?v=20260916d',
  'i18n.js?v=20260916d',
  'lunar-javascript.js?v=20260916d',
  'data.js?v=20260916d',
  'app.js?v=20260916d',
  'render.js?v=20260916d',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-192.png',
  'icon-maskable-512.png'
];

// 安装：预缓存外壳，完成后立即激活
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// 请求拦截：
//  - 导航请求（打开页面）→ 网络优先，失败回退到缓存的 index.html（离线可用）
//  - 其他同源 GET → 缓存优先，同时后台更新（stale-while-revalidate）
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 不处理跨域（如 Google Fonts）

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
