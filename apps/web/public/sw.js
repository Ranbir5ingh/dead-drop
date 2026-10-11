/* Dead Drop keeps the hunt live. This worker exists so the app can be installed.
   It does not cache pages, riddles, or photos. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  /* Network only. A cached board would be a lie. */
});
