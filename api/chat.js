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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            // thinking 비활성화 → 일반 텍스트만 반환
            thinkingConfig: { thinkingBudget: 0 }
          }
        })
      }
    )
    const data = await response.json()
    // 모든 parts에서 텍스트만 합치기 (thinking 제외)
    const parts = data?.candidates?.[0]?.content?.parts || []
    const text = parts
      .filter(p => p.text && !p.thought) // thought 파트 제외
      .map(p => p.text)
      .join('')
    return res.status(200).json({ text })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
