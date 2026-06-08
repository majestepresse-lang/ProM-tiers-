/**
 * ============================================================
 * MAJESTÉ MARKET — sw.js (Service Worker)
 * PWA Offline + Cache Strategy
 * by MAHOUTO X-PRO | Cotonou, Bénin
 * ============================================================
 */

const CACHE_NAME = "majeste-market-v2.0.0";
const STATIC_CACHE = "majeste-static-v2";
const DYNAMIC_CACHE = "majeste-dynamic-v2";

// Ressources à mettre en cache lors de l'installation
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/router.js",
  "/styles.css",
  "/manifest.json",
  "/icon-192.webp",
  "/icon-512.webp",
  "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap",
];

// ── Installation : mise en cache des ressources statiques ──
self.addEventListener("install", (event) => {
  console.log("[SW] Installation en cours...");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Mise en cache des ressources statiques");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Certaines ressources n'ont pu être mises en cache:", err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activation : nettoyage des anciens caches ──
self.addEventListener("activate", (event) => {
  console.log("[SW] Activation...");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => {
            console.log("[SW] Suppression du cache obsolète:", key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// ── Stratégie de fetch : Cache First puis Network ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et Firebase
  if (request.method !== "GET") return;
  if (url.hostname.includes("firebaseio.com")) return;
  if (url.hostname.includes("googleapis.com") && !url.pathname.includes("css")) return;

  // ── Network First pour HTML (toujours contenu frais) ──
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(c => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then(r => r || caches.match("/index.html")))
    );
    return;
  }

  // ── Cache First pour assets statiques (JS, CSS, WebP) ──
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retourner depuis le cache + mise à jour en arrière-plan
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, networkResponse.clone());
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Pas de cache — requête réseau
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          // Mettre en cache dynamiquement
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // Fallback hors-ligne pour les pages HTML
          if (request.headers.get("accept").includes("text/html")) {
            return caches.match("/index.html");
          }
        });
    })
  );
});

// ── Push Notifications Firebase ──
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "MAJESTÉ MARKET";
  const options = {
    body: data.body || "Vous avez une nouvelle notification",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "Voir", icon: "/icons/open.png" },
      { action: "close", title: "Fermer", icon: "/icons/close.png" },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Clic sur notification ──
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "open" || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || "/")
    );
  }
});
