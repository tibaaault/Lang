// Service worker minimal, écrit à la main plutôt que généré : il tient en
// trente lignes et on sait exactement ce qu'il met en cache.
//
// Stratégie : le réseau d'abord pour la page (afin de récupérer les mises à
// jour), le cache d'abord pour les fichiers versionnés par le build (leur nom
// contient une empreinte, ils ne changent jamais à URL constante).

const CACHE = 'lang-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigation : réseau d'abord, cache en secours si l'on est hors ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
          return response
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit ?? caches.match(self.registration.scope)),
        ),
    )
    return
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return response
        }),
    ),
  )
})
