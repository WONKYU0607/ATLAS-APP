// ATLAS Service Worker — 오프라인 캐싱
const CACHE_NAME = 'atlas-v1'
const STATIC_CACHE = 'atlas-static-v1'
const IMG_CACHE = 'atlas-images-v1'

// 앱 셸 (빌드 후 index.html만 확실히 캐시)
const PRECACHE = ['/', '/index.html']

// 설치: 앱 셸 프리캐시
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

// 활성화: 오래된 캐시 정리
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== STATIC_CACHE && k !== IMG_CACHE && k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// 요청 인터셉트
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // POST 등 non-GET은 무시
  if (e.request.method !== 'GET') return

  // API 호출 (환율, 위키 등) → 네트워크 우선, 실패 시 캐시
  if (url.hostname.includes('api.') || url.hostname.includes('wikipedia.org') || url.hostname.includes('wikimedia.org') || url.hostname.includes('open.er-api.com')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone))
        return res
      }).catch(() => caches.match(e.request))
    )
    return
  }

  // 이미지 (국기, 지도 타일 등) → 캐시 우선, 없으면 네트워크
  if (e.request.destination === 'image' || url.hostname.includes('flagcdn.com') || url.hostname.includes('unpkg.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached
        return fetch(e.request).then(res => {
          const clone = res.clone()
          caches.open(IMG_CACHE).then(cache => {
            // 이미지 캐시 크기 제한 (최대 200개)
            cache.keys().then(keys => { if (keys.length > 200) cache.delete(keys[0]) })
            cache.put(e.request, clone)
          })
          return res
        }).catch(() => new Response('', { status: 404 }))
      })
    )
    return
  }

  // 정적 자산 (JS/CSS/HTML) → 캐시 우선 + 백그라운드 업데이트
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        const clone = res.clone()
        caches.open(STATIC_CACHE).then(cache => cache.put(e.request, clone))
        return res
      }).catch(() => cached)

      return cached || fetchPromise
    })
  )
})
