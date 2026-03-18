export default async function handler(req, res) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) {
    return res.status(200).json({ status: '❌ 키 없음' })
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: '서울의 유명 관광지 한 곳만 알려줘' }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
        })
      }
    )
    const data = await response.json()
    // 전체 응답 반환
    return res.status(200).json({ 
      fullResponse: data,
      text: data?.candidates?.[0]?.content?.parts?.[0]?.text || '없음',
      status: response.status
    })
  } catch (e) {
    return res.status(200).json({ error: e.message })
  }
}
