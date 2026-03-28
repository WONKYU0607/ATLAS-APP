// api/kakao-places.js — Vercel Serverless Function
// 카카오 로컬 API 프록시 (CORS 우회 + API Key 보호)
// category: FD6(음식점), CE7(카페), AT4(관광명소), CT1(문화시설)

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { lat, lng, category, radius = '3000', size = '15', page = '1', sort = 'distance' } = req.query

  if (!lat || !lng || !category) {
    return res.status(400).json({ error: 'lat, lng, category 파라미터가 필요합니다' })
  }

  const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY
  if (!KAKAO_API_KEY) {
    console.error('KAKAO_REST_API_KEY 환경변수가 없습니다')
    return res.status(500).json({ error: 'KAKAO_REST_API_KEY가 설정되지 않았습니다' })
  }

  try {
    const url = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${category}&x=${lng}&y=${lat}&radius=${radius}&size=${size}&page=${page}&sort=${sort}`

    console.log('Kakao API 호출:', url)

    const response = await fetch(url, {
      headers: {
        'Authorization': `KakaoAK ${KAKAO_API_KEY}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Kakao API error:', response.status, errorText)
      return res.status(response.status).json({ 
        error: 'Kakao API 요청 실패', 
        status: response.status,
        detail: errorText 
      })
    }

    const data = await response.json()
    console.log(`Kakao API 응답: ${data.documents?.length || 0}건 (category: ${category})`)
    return res.status(200).json(data)

  } catch (error) {
    console.error('Kakao proxy error:', error)
    return res.status(500).json({ error: '서버 오류', message: error.message })
  }
}
