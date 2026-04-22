// ATLAS Service Worker — 오프라인 캐싱 (v2: 네트워크 우선으로 변경)
const CACHE_NAME = 'atlas-v2'
const STATIC_CACHE = 'atlas-static-v2'
const IMG_CACHE = 'atlas-images-v2'

// 설치: skip waiting으로 즉시 활성화
self.addEventListener('install', (e) => {
  self.skipWaiting()
})

// 활성화: 이전 버전(v1 포함) 캐시 모두 삭제
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== IMG_CACHE && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
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

  // 이미지 (국기, 지도 타일 등) → 캐시 우선, 없으면 네트워크 (이미지는 변경 드묾)
  if (e.request.destination === 'image' || url.hostname.includes('flagcdn.com') || url.hostname.includes('unpkg.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached
        return fetch(e.request).then(res => {
          const clone = res.clone()
          caches.open(IMG_CACHE).then(cache => {
            cache.keys().then(keys => { if (keys.length > 200) cache.delete(keys[0]) })
            cache.put(e.request, clone)
          })
          return res
        }).catch(() => new Response('', { status: 404 }))
      })
    )
    return
  }

  // JS/CSS/HTML 등 정적 자산 → 네트워크 우선, 실패 시 캐시 (신규 배포 즉시 반영)
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone()
      caches.open(STATIC_CACHE).then(cache => cache.put(e.request, clone))
      return res
    }).catch(() => caches.match(e.request))
  )
})
