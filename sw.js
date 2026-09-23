/* Service worker de "Fuga de Capital" — hace que la app quede
   guardada por completo en el dispositivo después de la PRIMERA vez
   que se abre con conexión. A partir de esa primera carga, funciona
   sin internet siempre, aunque el teléfono esté en modo avión.

   Como toda la app (React incluido) vive en un único index.html, solo
   hace falta cachear ese archivo — no hay CSS/JS sueltos que cachear
   aparte. */

const CACHE_NAME = "fuga-capital-v1";
const APP_SHELL = ["./", "./index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Cache-first con refresco en segundo plano: si hay copia guardada,
   la sirve al instante (funciona offline) y de paso intenta traer la
   versión más reciente por si hay conexión, para la próxima vez. */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
