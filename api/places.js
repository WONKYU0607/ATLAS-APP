export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const { lat, lng, type = 'restaurant', language = 'ko', keyword = '', query = '', radius = '5000', pages = '1' } = req.query

  const apiKey = process.env.VITE_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Google API key not configured' })
  }

  const sleep = (ms) => new Promise(r => setTimeout(r, ms))

  // 한 type에 대해 nearbysearch + 페이지네이션(next_page_token)으로 최대 maxPages 페이지 수집
  const fetchType = async (t) => {
    const kw = keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''
    const base = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${t}${kw}&language=${language}&key=${apiKey}`
    const maxPages = Math.min(3, Math.max(1, parseInt(pages) || 1))
    const out = []
    let url = base, token = null, page = 0
    while (page < maxPages) {
      if (token) { await sleep(2000); url = `${base}&pagetoken=${token}` } // next_page_token은 발급 후 잠시 뒤 유효
      const r = await fetch(url)
      const d = await r.json()
      if (d.results) out.push(...d.results)
      token = d.next_page_token
      page++
      if (!token) break
    }
    return out
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

    // ── Nearby Search: type에 '|'가 여러 개면 각각 호출 후 병합(place_id 중복 제거) ──
    const types = type.split('|').filter(Boolean)
    const seen = new Set()
    const merged = []
    for (const t of types) {
      const arr = await fetchType(t)
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
