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

    // gemini-2.5-flash with thinkingBudget:0 for fast JSON responses
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096,
            thinkingConfig: { thinkingBudget: 0 }
          }
        })
      }
    )

    const data = await response.json()

    if (data.error) {
      // thinkingBudget 미지원시 재시도 (without thinkingConfig)
      const response2 = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 4096 }
          })
        }
      )
      const data2 = await response2.json()
      if (data2.error) return res.status(500).json({ error: data2.error.message })
      const parts2 = data2?.candidates?.[0]?.content?.parts || []
      const text2 = parts2.filter(p => p.text && !p.thought).map(p => p.text).join('')
      return res.status(200).json({ text: text2 })
    }

    const parts = data?.candidates?.[0]?.content?.parts || []
    const text = parts.filter(p => p.text && !p.thought).map(p => p.text).join('')
    return res.status(200).json({ text })

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
