export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const { lat, lng, type = 'restaurant', language = 'ko', keyword = '', query = '', radius = '5000' } = req.query

  const apiKey = process.env.VITE_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Google API key not configured' })
  }

  try {
    let url
    if (query) {
      // ── Text Search: 도시 단위 관광명소 검색 (반경/중심점 한계 없음) ──
      // location+radius는 동명 도시 구분용 soft bias (하드 필터 아님)
      const bias = (lat && lng) ? `&location=${lat},${lng}&radius=50000` : ''
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}${bias}&language=${language}&key=${apiKey}`
    } else {
      // ── Nearby Search: 좌표+반경 (맛집/주변검색 등 기존 호출, 하위호환) ──
      if (!lat || !lng) {
        return res.status(400).json({ error: 'lat and lng are required' })
      }
      const kw = keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''
      url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}${kw}&language=${language}&key=${apiKey}`
    }

    const response = await fetch(url)
    const data = await response.json()

    res.status(200).json(data)
  } catch (error) {
    console.error('Places API error:', error)
    res.status(500).json({ error: 'Failed to fetch places' })
  }
}
