export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const { lat, lng, type = 'restaurant', language = 'ko', keyword = '', query = '', radius = '5000', pages = '1' } = req.query

  const apiKey = process.env.VITE_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Google API key not configured' })
  }

  const sleep = (ms) => new Promise(r => setTimeout(r, ms))

  // 한 (지점, type)에 대해 nearbysearch + next_page_token 페이지네이션 수집
  const fetchType = async (la, ln, t, rad, maxPages) => {
    const kw = keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''
    const base = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${la},${ln}&radius=${rad}&type=${t}${kw}&language=${language}&key=${apiKey}`
    const out = []
    let url = base, token = null, page = 0
    while (page < maxPages) {
      if (token) { await sleep(2000); url = `${base}&pagetoken=${token}` } // 토큰은 발급 직후 잠시 대기 필요
      const r = await fetch(url)
      const d = await r.json()
      if (d.results) out.push(...d.results)
      token = d.next_page_token
      page++
      if (!token) break
    }
    return out
  }

  // 미터 오프셋 → 위경도
  const offset = (la, ln, dxM, dyM) => {
    const dLat = dyM / 111320
    const dLng = dxM / (111320 * Math.cos(la * Math.PI / 180))
    return [la + dLat, ln + dLng]
  }

  // 동시호출 청크 (QPS 폭주 방지)
  const runChunked = async (tasks, size = 6) => {
    const results = []
    for (let i = 0; i < tasks.length; i += size) {
      const chunk = tasks.slice(i, i + size).map(fn => fn())
      results.push(...await Promise.all(chunk))
    }
    return results
  }

  try {
    if (query) {
      // ── Text Search: 도시 단위 검색 (하위호환) ──
      const bias = (lat && lng) ? `&location=${lat},${lng}&radius=50000` : ''
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}${bias}&language=${language}&key=${apiKey}`
      const data = await (await fetch(url)).json()
      return res.status(200).json(data)
    }

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' })
    }

    const la0 = parseFloat(lat), ln0 = parseFloat(lng)
    const R = Math.max(1000, parseInt(radius) || 5000)
    const types = type.split('|').filter(Boolean)

    // 큰 반경(대도시)=중심+동서남북 5점 격자로 외곽 명소까지 커버 / 작은 반경(맛집 등)=중심 1점
    let points, subRadius, perPages
    if (R > 7000) {
      const d = R * 0.6                  // 오프셋 거리
      const dirs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]   // 중심 + 동/서/남/북
      points = dirs.map(([ex, ny]) => (ex === 0 && ny === 0) ? [la0, ln0] : offset(la0, ln0, ex * d, ny * d))
      subRadius = Math.round(R * 0.55)   // 각 점 반경(서로 겹치게)
      perPages = 1                        // 공간 분산이 페이지네이션을 대체
    } else {
      points = [[la0, ln0]]
      subRadius = R
      perPages = Math.min(3, Math.max(1, parseInt(pages) || 1))
    }

    // (지점 × type) 전부 수집 → place_id 중복 제거 병합
    const tasks = []
    for (const [la, ln] of points) {
      for (const t of types) tasks.push(() => fetchType(la, ln, t, subRadius, perPages))
    }
    const arrays = await runChunked(tasks, 6)
    const seen = new Set()
    const merged = []
    for (const arr of arrays) {
      for (const p of arr) {
        if (p.place_id && !seen.has(p.place_id)) { seen.add(p.place_id); merged.push(p) }
      }
    }
    res.status(200).json({ results: merged, status: 'OK' })
  } catch (error) {
    console.error('Places API error:', error)
    res.status(500).json({ error: 'Failed to fetch places' })
  }
}
