// =============================================================
// sw.js — Service Worker (trabajador en segundo plano)
// -------------------------------------------------------------
// Es un pequeño programa que el navegador guarda aparte. Hace
// que Life OS se abra aunque no tengas internet.
//
// Estrategia "primero la red":
//   1. Intenta descargar el archivo actualizado.
//   2. Si lo consigue, guarda una copia y la usa.
//   3. Si no hay internet, usa la copia guardada.
// Así siempre tienes la última versión cuando hay conexión,
// y la app sigue funcionando cuando no la hay.
//
// Este archivo NO toca tus datos de hábitos (esos están en
// LocalStorage). Solo guarda copias del código de la app.
// =============================================================

const CACHE_NAME = "lifeos-app-v1";

// Archivos que guardamos desde el primer momento.
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/config.js",
  "./js/dates.js",
  "./js/storage.js",
  "./js/habits.js",
  "./js/scoring.js",
  "./js/stats.js",
  "./js/dashboard.js",
  "./js/weekView.js",
  "./js/monthView.js",
  "./js/notifications.js",
  "./js/settingsView.js",
  "./js/remindersView.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

// "install": la primera vez, guardamos todos los archivos.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES))
  );
  self.skipWaiting(); // activar la versión nueva sin esperar
});

// "activate": borramos copias de versiones antiguas del código.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// "fetch": cada vez que la app pide un archivo.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return; // solo nuestros archivos

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) { // solo guardamos respuestas correctas (no errores 404)
          const copy = response.clone(); // una respuesta solo se puede leer una vez
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
