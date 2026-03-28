export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  
  const { lat, lng, type = 'restaurant', language = 'ko' } = req.query
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' })
  }
  
  const apiKey = process.env.VITE_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Google API key not configured' })
  }
  
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&language=${language}&key=${apiKey}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    res.status(200).json(data)
  } catch (error) {
    console.error('Places API error:', error)
    res.status(500).json({ error: 'Failed to fetch places' })
  }
}
