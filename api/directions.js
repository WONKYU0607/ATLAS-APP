export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  
  const { origin, destination, mode = 'transit' } = req.query
  
  if (!origin || !destination) {
    return res.status(400).json({ error: 'origin and destination are required' })
  }
  
  const apiKey = process.env.VITE_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Google API key not configured' })
  }
  
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&language=ko&key=${apiKey}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    res.status(200).json(data)
  } catch (error) {
    console.error('Directions API error:', error)
    res.status(500).json({ error: 'Failed to fetch directions' })
  }
}
