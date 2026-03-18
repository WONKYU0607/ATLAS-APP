export default async function handler(req, res) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) {
    return res.status(200).json({ 
      status: '❌ 실패', 
      message: 'GEMINI_API_KEY 환경변수가 없습니다. Vercel Settings → Environment Variables에서 추가해주세요!' 
    })
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: '안녕하세요! 한 문장으로 답해주세요.' }] }] })
      }
    )
    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '응답 없음'
    return res.status(200).json({ status: '✅ 성공', message: 'Gemini API 연결 정상!', response: text })
  } catch (e) {
    return res.status(200).json({ status: '❌ 실패', message: e.message })
  }
}
