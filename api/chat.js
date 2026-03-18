export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'API key not configured' })

  try {
    const { prompt } = req.body
    // gemini-2.0-flash: 무료, 안정적, thinking 없음 → JSON 파싱 안전
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
          }
        })
      }
    )
    const data = await response.json()
    // 모든 텍스트 파트 합치기
    const parts = data?.candidates?.[0]?.content?.parts || []
    const text = parts.map(p => p.text || '').join('')
    return res.status(200).json({ text })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
