// api/places.js
// Vercel 서버리스 함수 - Google Places API 프록시

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // GET 요청만 허용
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { lat, lng, type } = req.query

  if (!lat || !lng || !type) {
    res.status(400).json({ error: 'Missing required parameters: lat, lng, type' })
    return
  }

  const GOOGLE_API_KEY = process.env.VITE_GOOGLE_API_KEY

  if (!GOOGLE_API_KEY) {
    res.status(500).json({ error: 'API key not configured' })
    return
  }

  try {
    // Google Places API 호출
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
      `location=${lat},${lng}&` +
      `radius=3000&` +
      `type=${type}&` +
      `key=${GOOGLE_API_KEY}&` +
      `language=ko`

    const response = await fetch(url)
    const data = await response.json()

    // 성공
    res.status(200).json(data)

  } catch (error) {
    console.error('Places API Error:', error)
    res.status(500).json({ error: 'Failed to fetch places data' })
  }
}
