export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'API key not configured' })

  try {
    // req.body가 문자열로 올 수도 있으니 방어
    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch { body = {} }
    }
    const prompt = body?.prompt
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' })

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
        })
      }
    )

    const data = await response.json()
    if (data.error) return res.status(200).json({ text: '', error: data.error.message })

    const parts = data?.candidates?.[0]?.content?.parts || []
    const text = parts.filter(p => p.text && !p.thought).map(p => p.text).join('')
    return res.status(200).json({ text })
  } catch (e) {
    // 어떤 경우에도 JSON 반환 (Vercel 에러 페이지 방지)
    return res.status(200).json({ text: '', error: String(e?.message || e) })
  }
}
