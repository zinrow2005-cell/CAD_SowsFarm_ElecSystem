/* 虎尾場 PWA V11.12.8 — app-shell only; never caches private device records or photos. */
'use strict';
const CACHE_PREFIX = 'huwei-pwa-shell-';
const CACHE_NAME = CACHE_PREFIX + 'v11.12.8';
const APP_SHELL = [
  "./assets/js/jszip-3.10.1.min.js",
  "./assets/js/portable-zip-bridge-v11128.js",
  "./assets/js/floating-tools-v11125.js",
  "./assets/js/network-trace-v11110.js",
  "./assets/css/app.css",
  "./assets/js/status-map-v11109.js",
  "./assets/js/inspection-v11108.js",
  "./assets/js/smart-equipment-v11105.js",
  "./assets/js/equipment-guide-v11100.js",
  "./assets/js/workspaces-v1194.js",
  "./",
  "./index.html",
  "./assets/js/home-v119.js",
  "./assets/js/quick-locate-v1192.js",
  "./assets/js/mobile-field-v1191.js",
  "./manifest.webmanifest",
  "./release.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./assets/js/cad-inline-1.js",
  "./assets/js/field-qa-v11101.js",
  "./assets/js/cad-inline-2.js",
  "./assets/js/circuit-audit-v92.js",
  "./assets/js/cloud-v94.js",
  "./assets/js/device-record-v96.js",
  "./assets/js/equipment-symbols-v90.js",
  "./assets/js/equipment-v94.js",
  "./assets/js/farm-ops-v114.js",
  "./assets/js/feed-network-v111.js",
  "./assets/js/feed-v97.js",
  "./assets/js/icon-magnet-v100.js",
  "./assets/js/magnet-ui-v100.js",
  "./assets/js/photo-circuits-v92.js",
  "./assets/js/photo-index-v118.js",
  "./assets/js/photo-store-v103.js",
  "./assets/js/photo-store-v92.js",
  "./assets/js/photo-tools-v103.js",
  "./assets/js/placement-v90.js",
  "./assets/js/portable-core-v117.js",
  "./assets/js/portable-ui-v117.js",
  "./assets/js/power-board-v113.js",
  "./assets/js/precision-v101.js",
  "./assets/js/secure-transfer-v92.js",
  "./assets/js/sidebar-v95.js",
  "./assets/js/smart-v98.js",
  "./assets/js/stall-capacity-v104.js",
  "./assets/js/stall-geometry-v105.js",
  "./assets/js/stall-links-v109.js",
  "./assets/js/stall-navigation-v1172.js",
  "./assets/js/system-health-v115.js",
  "./assets/js/system-tree-v116.js",
  "./assets/js/two-level-plan-v108.js",
  "./assets/js/ui-v99.js",
  "./assets/js/vent-network-v112.js",
  "./assets/js/water-supply-v110.js",
  "./assets/js/workbench-v90.js"
];
const SHELL_URLS = new Set(APP_SHELL.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Finish all static resources before the worker takes control.
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // No external sites, cloud API, runtime JSON, or user photos are cached.
  if (url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);
  if (!url.pathname.startsWith(scope.pathname)) return;
  if (req.mode !== 'navigate' && !SHELL_URLS.has(url.href)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      // Freshest released code when online, shell is readable when offline.
      const response = await fetch(req, { cache: 'no-cache' });
      if (response.ok && response.type === 'basic') await cache.put(req, response.clone());
      return response;
    } catch (_) {
      // Same-origin navigation falls back to the application's entry point.
      return (await cache.match(req)) || (req.mode === 'navigate' ? await cache.match('./index.html') : undefined) || Response.error();
    }
  })());
});
