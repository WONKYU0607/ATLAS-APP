export default async function handler(req, res) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) return res.status(200).json({ status: '❌ GEMINI_API_KEY 없음' })

  try {
    const prompt = `일본 삿포로의 유명 관광지 4곳을 JSON으로만 반환. 다른 텍스트 없이 JSON만:
{"description":"삿포로 소개","spots":[{"name":"관광지명","wikiTitle":"English title","type":"랜드마크","desc":"설명","rating":4.5,"openTime":"09:00~18:00","price":"무료","website":"https://example.com"}]}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
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

    if (data.error) return res.status(200).json({ status: '❌ Gemini 에러', error: data.error })

    const parts = data?.candidates?.[0]?.content?.parts || []
    const allParts = parts.map((p, i) => ({ i, thought: !!p.thought, textLen: p.text?.length || 0, preview: p.text?.slice(0,100) }))
    const text = parts.filter(p => p.text && !p.thought).map(p => p.text).join('')

    // JSON 파싱 시도
    let parsed = null
    try {
      const txt = text.replace(/```json|```/g, '').trim()
      const s = txt.indexOf('{'), e = txt.lastIndexOf('}')
      if (s !== -1 && e !== -1) parsed = JSON.parse(txt.slice(s, e+1))
    } catch(pe) { parsed = { parseError: pe.message, rawText: text.slice(0,300) } }

    return res.status(200).json({
      status: '✅ 성공',
      partsCount: parts.length,
      allParts,
      textLength: text.length,
      parsed
    })
  } catch(e) {
    return res.status(200).json({ status: '❌ 예외', error: e.message })
  }
}
