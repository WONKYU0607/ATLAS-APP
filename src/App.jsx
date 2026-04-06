import { useState, useEffect, useRef, Component } from 'react'
import Globe from 'globe.gl'
import { AUTO_I18N } from './auto-i18n'

// ── 실제 관광지 사진 (Wikipedia + Wikimedia Commons 검색) ─────────────
function SpotImage({ wikiTitle, spotName, cityName, fallback, className, style, alt }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    setSrc(null)
    let cancelled = false
    const keyword = wikiTitle || spotName || ''
    if (!keyword) { setSrc(fallback); return }

    const tryWiki = async (title) => {
      try {
        const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=600&origin=*`)
        const data = await res.json()
        const page = Object.values(data?.query?.pages || {})[0]
        return page?.thumbnail?.source || null
      } catch { return null }
    }

    const searchWiki = async (query) => {
      try {
        const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&prop=pageimages&format=json&pithumbsize=600&origin=*`)
        const data = await res.json()
        const pages = Object.values(data?.query?.pages || {})
        for (const page of pages) {
          if (page?.thumbnail?.source) return page.thumbnail.source
        }
        return null
      } catch { return null }
    }

    // Wikimedia Commons에서 실사진 검색
    const searchCommons = async (query) => {
      try {
        const res = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|mime&iiurlwidth=600&format=json&origin=*`)
        const data = await res.json()
        const pages = Object.values(data?.query?.pages || {})
        for (const p of pages) {
          const info = p?.imageinfo?.[0]
          if (info?.thumburl && info.mime?.startsWith('image/jpeg')) return info.thumburl
        }
        return null
      } catch { return null }
    }

    const loadImage = async () => {
      // 1차: wikiTitle 정확 매칭
      let img = await tryWiki(keyword)
      if (!cancelled && img) { setSrc(img); return }

      // 2차: 영어만 추출
      const enKeyword = keyword.replace(/[가-힣]+/g, '').trim()
      if (enKeyword && enKeyword !== keyword) {
        img = await tryWiki(enKeyword)
        if (!cancelled && img) { setSrc(img); return }
      }

      // 3차: spotName
      if (spotName && spotName !== keyword) {
        const enSpot = spotName.replace(/[가-힣]+/g, '').trim()
        if (enSpot) {
          img = await tryWiki(enSpot)
          if (!cancelled && img) { setSrc(img); return }
        }
      }

      // 4차: Wikipedia 검색 (도시명 포함)
      const searchQuery = keyword + (cityName ? ' ' + cityName : '')
      img = await searchWiki(searchQuery)
      if (!cancelled && img) { setSrc(img); return }

      // 5차: Wikimedia Commons 실사진 검색
      img = await searchCommons(keyword + ' photo')
      if (!cancelled && img) { setSrc(img); return }

      // 6차: 도시명 + spotName으로 Commons 재검색
      if (cityName) {
        img = await searchCommons(spotName + ' ' + cityName)
        if (!cancelled && img) { setSrc(img); return }
      }

      // 최종 fallback
      if (!cancelled) setSrc(fallback)
    }

    loadImage()
    return () => { cancelled = true }
  }, [wikiTitle, spotName, cityName, fallback])

  return (
    <img
      className={className}
      src={src || fallback}
      alt={alt || ''}
      style={style}
      onError={e => { e.target.src = fallback; e.target.onerror = null }}
    />
  )
}

// ── 관광지 사진 갤러리 (Wikimedia Commons 실사진 + 필터링 강화) ──────────
function SpotGallery({ wikiTitle, spotName, cityName, fallback, style }) {
  const [images, setImages] = useState([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setImages([]); setIdx(0); setLoading(true)
    let cancelled = false
    const keyword = wikiTitle || spotName || ''
    if (!keyword) { setLoading(false); return }

    // 그림/아이콘/지도 필터
    const badPattern = /\b(icon|logo|flag|map|symbol|coat|seal|crest|commons|wiki|button|arrow|edit|stub|diagram|drawing|plan|layout|svg|sign|medal|badge|emblem|silhouette|panorama_from|location|locator|position)\b/i

    const fetchImages = async () => {
      const results = []

      try {
        // 1단계: Wikimedia Commons에서 실사진 검색 (가장 좋은 소스)
        const commonsRes = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(keyword + (cityName ? ' ' + cityName : '') + ' photo')}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=800&format=json&origin=*`)
        const commonsData = await commonsRes.json()
        const commonsPages = Object.values(commonsData?.query?.pages || {})
        for (const p of commonsPages) {
          const info = p?.imageinfo?.[0]
          if (!info) continue
          // 실사진만: JPEG, 최소 400px, 아이콘/지도 제외
          if (info.mime?.startsWith('image/jpeg') && info.width > 400 && info.height > 300) {
            const title = p.title || ''
            if (!badPattern.test(title)) {
              results.push(info.thumburl || info.url)
            }
          }
        }
      } catch {}

      // 2단계: 부족하면 Wikipedia 문서 이미지 추가
      if (results.length < 4) {
        try {
          const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(keyword)}&prop=images&imlimit=15&format=json&origin=*`)
          const wikiData = await wikiRes.json()
          const page = Object.values(wikiData?.query?.pages || {})[0]
          const files = (page?.images || [])
            .map(img => img.title)
            .filter(t => /\.jpe?g$/i.test(t))  // JPEG만 (PNG는 보통 아이콘/다이어그램)
            .filter(t => !badPattern.test(t))
            .slice(0, 6)

          if (files.length > 0) {
            const infoRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${files.map(t => encodeURIComponent(t)).join('|')}&prop=imageinfo&iiprop=url|size&iiurlwidth=800&format=json&origin=*`)
            const infoData = await infoRes.json()
            const infoPages = Object.values(infoData?.query?.pages || {})
            for (const tp of infoPages) {
              const info = tp?.imageinfo?.[0]
              // 실사진 필터: 최소 크기 + 가로세로 비율 체크 (너무 좁으면 배너/로고)
              if (info?.thumburl && info.width > 400 && info.height > 250 && info.width / info.height < 4) {
                if (!results.includes(info.thumburl)) results.push(info.thumburl)
              }
            }
          }
        } catch {}
      }

      if (!cancelled) {
        setImages(results.length > 0 ? results.slice(0, 8) : (fallback ? [fallback] : []))
        setLoading(false)
      }
    }

    fetchImages()
    return () => { cancelled = true }
  }, [wikiTitle, spotName, fallback])

  const goNext = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % images.length) }
  const goPrev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length) }

  if (loading) return (
    <div style={{...style, display:'flex',alignItems:'center',justifyContent:'center',background:'#1e293b'}}>
      <div style={{width:20,height:20,borderRadius:'50%',border:'2px solid #475569',borderTopColor:'#94a3b8',animation:'spin .7s linear infinite'}}/>
    </div>
  )
  if (images.length === 0) return <div style={{...style, background:'#1e293b'}}/>

  return (
    <div style={{...style, position:'relative', overflow:'hidden'}}>
      <img
        src={images[idx]}
        alt=""
        style={{width:'100%',height:'100%',objectFit:'cover',display:'block',transition:'opacity 0.3s'}}
        onError={e => { e.target.src = fallback; e.target.onerror = null }}
      />
      {images.length > 1 && (
        <>
          {/* 좌우 화살표 */}
          <button onClick={goPrev} style={{
            position:'absolute',left:6,top:'50%',transform:'translateY(-50%)',
            width:28,height:28,borderRadius:'50%',border:'none',
            background:'rgba(0,0,0,0.5)',color:'white',fontSize:14,
            cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
            opacity:0.7,transition:'opacity .2s',
          }} onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.7'}>‹</button>
          <button onClick={goNext} style={{
            position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',
            width:28,height:28,borderRadius:'50%',border:'none',
            background:'rgba(0,0,0,0.5)',color:'white',fontSize:14,
            cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
            opacity:0.7,transition:'opacity .2s',
          }} onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.7'}>›</button>
          {/* 하단 도트 인디케이터 */}
          <div style={{position:'absolute',bottom:6,left:'50%',transform:'translateX(-50%)',display:'flex',gap:4}}>
            {images.map((_, i) => (
              <div key={i} onClick={e => { e.stopPropagation(); setIdx(i) }} style={{
                width: i === idx ? 16 : 6, height:6, borderRadius:3,
                background: i === idx ? 'white' : 'rgba(255,255,255,0.5)',
                cursor:'pointer', transition:'all .2s',
              }}/>
            ))}
          </div>
          {/* 사진 카운터 */}
          <div style={{position:'absolute',top:8,left:8,background:'rgba(0,0,0,0.6)',borderRadius:10,padding:'2px 8px',fontSize:10,color:'white',fontWeight:600}}>
            {idx+1} / {images.length}
          </div>
        </>
      )}
    </div>
  )
}

// ── 에러 바운더리 (흰 화면 방지) ─────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(e) { console.error('App error caught:', e) }
  render() {
    if (this.state.hasError) return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0f172a',color:'white',fontFamily:'Inter,sans-serif',gap:16}}>
        <div style={{fontSize:32}}>⚠️</div>
        <div style={{fontSize:18,fontWeight:700}}>잠시 오류가 발생했어요</div>
        <button onClick={()=>window.location.reload()} style={{background:'#3b82f6',color:'white',border:'none',borderRadius:10,padding:'10px 24px',cursor:'pointer',fontSize:14,fontWeight:600}}>새로고침</button>
      </div>
    )
    return this.props.children
  }
}

// ── 국가별 주요 도시 데이터 ──────────────────────────────────────────────
const COUNTRY_CITIES = {
  "South Korea": [
    { name:"서울", lat:37.57, lng:126.98, emoji:"🏙️", color:"#e74c3c" },
    { name:"부산", lat:35.18, lng:129.07, emoji:"🌊", color:"#3498db" },
    { name:"제주", lat:33.50, lng:126.53, emoji:"🌺", color:"#2ecc71" },
    { name:"경주", lat:35.85, lng:129.22, emoji:"🏛️", color:"#f39c12" },
    { name:"인천", lat:37.46, lng:126.71, emoji:"✈️", color:"#9b59b6" },
    { name:"대구", lat:35.87, lng:128.60, emoji:"🍎", color:"#e67e22" },
    { name:"전주", lat:35.82, lng:127.15, emoji:"🥘", color:"#8e44ad" },
    { name:"강릉", lat:37.75, lng:128.88, emoji:"🏖️", color:"#2980b9" },
    { name:"수원", lat:37.27, lng:127.01, emoji:"🏰", color:"#c0392b" },
    { name:"광주", lat:35.16, lng:126.85, emoji:"🎨", color:"#1abc9c" },
    { name:"여수", lat:34.74, lng:127.74, emoji:"🌉", color:"#3498db" },
    { name:"속초", lat:38.19, lng:128.59, emoji:"🏔️", color:"#2ecc71" },
    { name:"통영", lat:34.85, lng:128.43, emoji:"🎵", color:"#9b59b6" },
  ],
  "Japan": [
    { name:"도쿄", lat:35.68, lng:139.69, emoji:"🗼", color:"#e74c3c" },
    { name:"교토", lat:35.01, lng:135.77, emoji:"⛩️", color:"#9b59b6" },
    { name:"오사카", lat:34.69, lng:135.50, emoji:"🏯", color:"#f39c12" },
    { name:"삿포로", lat:43.06, lng:141.35, emoji:"❄️", color:"#3498db" },
    { name:"나라", lat:34.68, lng:135.83, emoji:"🦌", color:"#2ecc71" },
    { name:"나고야", lat:35.18, lng:136.91, emoji:"🏯", color:"#e67e22" },
    { name:"후쿠오카", lat:33.59, lng:130.40, emoji:"🍜", color:"#c0392b" },
    { name:"히로시마", lat:34.39, lng:132.45, emoji:"☮️", color:"#8e44ad" },
    { name:"고베", lat:34.69, lng:135.19, emoji:"🥩", color:"#16a085" },
    { name:"오키나와", lat:26.21, lng:127.68, emoji:"🏖️", color:"#2980b9" },
    { name:"가나자와", lat:36.56, lng:136.66, emoji:"🎋", color:"#27ae60" },
    { name:"하코네", lat:35.23, lng:139.02, emoji:"🌋", color:"#e74c3c" },
  ],
  "China": [
    { name:"베이징", lat:39.90, lng:116.41, emoji:"🏯", color:"#e74c3c" },
    { name:"상하이", lat:31.23, lng:121.47, emoji:"🌆", color:"#3498db" },
    { name:"시안", lat:34.34, lng:108.94, emoji:"🏺", color:"#f39c12" },
    { name:"구이린", lat:25.27, lng:110.29, emoji:"⛰️", color:"#2ecc71" },
    { name:"청두", lat:30.57, lng:104.07, emoji:"🐼", color:"#9b59b6" },
    { name:"항저우", lat:30.27, lng:120.15, emoji:"🍵", color:"#16a085" },
    { name:"장자제", lat:29.13, lng:110.48, emoji:"🏔️", color:"#27ae60" },
    { name:"리장", lat:26.87, lng:100.22, emoji:"🌸", color:"#c0392b" },
    { name:"황산", lat:30.13, lng:118.17, emoji:"🌄", color:"#e67e22" },
    { name:"홍콩", lat:22.35, lng:114.15, emoji:"🌃", color:"#2980b9" },
    { name:"마카오", lat:22.20, lng:113.56, emoji:"🎲", color:"#f39c12" },
    { name:"쑤저우", lat:31.30, lng:120.62, emoji:"🏮", color:"#8e44ad" },
  ],
  "France": [
    { name:"파리", lat:48.86, lng:2.35, emoji:"🗼", color:"#2ecc71" },
    { name:"니스", lat:43.72, lng:7.20, emoji:"🌊", color:"#3498db" },
    { name:"리옹", lat:45.75, lng:4.83, emoji:"🍷", color:"#9b59b6" },
    { name:"보르도", lat:44.84, lng:-0.58, emoji:"🍇", color:"#e74c3c" },
    { name:"마르세유", lat:43.30, lng:5.37, emoji:"⛵", color:"#e67e22" },
    { name:"몽생미셸", lat:48.62, lng:-1.48, emoji:"🏰", color:"#8e44ad" },
    { name:"스트라스부르", lat:48.57, lng:7.65, emoji:"🥨", color:"#16a085" },
    { name:"앙시", lat:45.92, lng:6.08, emoji:"🏔️", color:"#2980b9" },
    { name:"툴루즈", lat:43.60, lng:1.44, emoji:"✈️", color:"#c0392b" },
  ],
  "Italy": [
    { name:"로마", lat:41.90, lng:12.50, emoji:"🏛️", color:"#9b59b6" },
    { name:"베네치아", lat:45.44, lng:12.32, emoji:"🚤", color:"#3498db" },
    { name:"피렌체", lat:43.77, lng:11.25, emoji:"🎨", color:"#e74c3c" },
    { name:"밀라노", lat:45.47, lng:9.19, emoji:"👗", color:"#2ecc71" },
    { name:"나폴리", lat:40.85, lng:14.27, emoji:"🍕", color:"#f39c12" },
    { name:"아말피", lat:40.63, lng:14.60, emoji:"🌊", color:"#16a085" },
    { name:"시칠리아", lat:37.60, lng:14.02, emoji:"🍋", color:"#e67e22" },
    { name:"친퀘테레", lat:44.13, lng:9.67, emoji:"🎨", color:"#8e44ad" },
    { name:"볼로냐", lat:44.50, lng:11.34, emoji:"🍝", color:"#c0392b" },
    { name:"시에나", lat:43.32, lng:11.33, emoji:"🏰", color:"#f39c12" },
    { name:"폼페이", lat:40.75, lng:14.49, emoji:"🌋", color:"#7f8c8d" },
  ],
  "Spain": [
    { name:"바르셀로나", lat:41.39, lng:2.17, emoji:"🏟️", color:"#3498db" },
    { name:"마드리드", lat:40.42, lng:-3.70, emoji:"🎨", color:"#e74c3c" },
    { name:"세비야", lat:37.39, lng:-5.99, emoji:"💃", color:"#f39c12" },
    { name:"그라나다", lat:37.18, lng:-3.60, emoji:"🏰", color:"#9b59b6" },
    { name:"발렌시아", lat:39.47, lng:-0.38, emoji:"🥘", color:"#e67e22" },
    { name:"빌바오", lat:43.26, lng:-2.93, emoji:"🎭", color:"#16a085" },
    { name:"산세바스티안", lat:43.32, lng:-1.98, emoji:"🍽️", color:"#27ae60" },
    { name:"말라가", lat:36.72, lng:-4.42, emoji:"☀️", color:"#c0392b" },
    { name:"톨레도", lat:39.86, lng:-4.02, emoji:"🗡️", color:"#2980b9" },
    { name:"산티아고데콤포스텔라", lat:42.87, lng:-8.50, emoji:"⛪", color:"#8e44ad" },
  ],
  "Germany": [
    { name:"베를린", lat:52.52, lng:13.40, emoji:"🏛️", color:"#3498db" },
    { name:"뮌헨", lat:48.14, lng:11.58, emoji:"🍺", color:"#e74c3c" },
    { name:"함부르크", lat:53.55, lng:9.99, emoji:"⚓", color:"#2ecc71" },
    { name:"로텐부르크", lat:49.38, lng:10.18, emoji:"🏰", color:"#f39c12" },
    { name:"프랑크푸르트", lat:50.11, lng:8.70, emoji:"🏦", color:"#9b59b6" },
    { name:"쾰른", lat:50.93, lng:6.96, emoji:"⛪", color:"#e67e22" },
    { name:"드레스덴", lat:51.05, lng:13.74, emoji:"🎭", color:"#8e44ad" },
    { name:"하이델베르크", lat:49.40, lng:8.69, emoji:"🏰", color:"#16a085" },
    { name:"퓌센", lat:47.60, lng:10.70, emoji:"🏰", color:"#c0392b" },
  ],
  "United Kingdom": [
    { name:"런던", lat:51.51, lng:-0.13, emoji:"👑", color:"#7c3aed" },
    { name:"에든버러", lat:55.95, lng:-3.19, emoji:"🏰", color:"#3498db" },
    { name:"맨체스터", lat:53.48, lng:-2.24, emoji:"⚽", color:"#e74c3c" },
    { name:"바스", lat:51.38, lng:-2.36, emoji:"🛁", color:"#2ecc71" },
    { name:"옥스퍼드", lat:51.75, lng:-1.26, emoji:"📚", color:"#9b59b6" },
    { name:"케임브리지", lat:52.20, lng:0.12, emoji:"🎓", color:"#e67e22" },
    { name:"요크", lat:53.96, lng:-1.08, emoji:"🏛️", color:"#8e44ad" },
    { name:"리버풀", lat:53.41, lng:-2.98, emoji:"🎸", color:"#16a085" },
    { name:"코츠월즈", lat:51.83, lng:-1.80, emoji:"🌿", color:"#27ae60" },
    { name:"글래스고", lat:55.86, lng:-4.25, emoji:"🏙️", color:"#2980b9" },
  ],
  "United States of America": [
    { name:"뉴욕", lat:40.71, lng:-74.01, emoji:"🗽", color:"#3498db" },
    { name:"로스앤젤레스", lat:34.05, lng:-118.24, emoji:"🎬", color:"#e74c3c" },
    { name:"샌프란시스코", lat:37.77, lng:-122.42, emoji:"🌉", color:"#f39c12" },
    { name:"라스베이거스", lat:36.17, lng:-115.14, emoji:"🎰", color:"#9b59b6" },
    { name:"마이애미", lat:25.77, lng:-80.19, emoji:"🌴", color:"#2ecc71" },
    { name:"시카고", lat:41.88, lng:-87.63, emoji:"🌆", color:"#8e44ad" },
    { name:"워싱턴DC", lat:38.91, lng:-77.04, emoji:"🏛️", color:"#16a085" },
    { name:"보스턴", lat:42.36, lng:-71.06, emoji:"🦞", color:"#c0392b" },
    { name:"뉴올리언스", lat:29.95, lng:-90.07, emoji:"🎷", color:"#e67e22" },
    { name:"시애틀", lat:47.61, lng:-122.33, emoji:"☕", color:"#2980b9" },
    { name:"하와이", lat:21.31, lng:-157.85, emoji:"🌺", color:"#16a085" },
    { name:"그랜드캐니언", lat:36.10, lng:-112.11, emoji:"🏜️", color:"#e67e22" },
    { name:"옐로스톤", lat:44.43, lng:-110.59, emoji:"🌋", color:"#27ae60" },
    { name:"샌디에이고", lat:32.72, lng:-117.16, emoji:"🌞", color:"#f39c12" },
    { name:"덴버", lat:39.74, lng:-104.98, emoji:"🏔️", color:"#8B4513" },
    { name:"내슈빌", lat:36.17, lng:-86.78, emoji:"🎸", color:"#c0392b" },
    { name:"포틀랜드", lat:45.52, lng:-122.68, emoji:"🌲", color:"#27ae60" },
    { name:"피닉스", lat:33.45, lng:-112.07, emoji:"🌵", color:"#e67e22" },
    { name:"올랜도", lat:28.54, lng:-81.38, emoji:"🎡", color:"#9b59b6" },
    { name:"나이아가라폭포", lat:43.08, lng:-79.07, emoji:"💧", color:"#3498db" },
  ],
  "Australia": [
    { name:"시드니", lat:-33.87, lng:151.21, emoji:"🎭", color:"#1abc9c" },
    { name:"멜버른", lat:-37.81, lng:144.96, emoji:"🏙️", color:"#3498db" },
    { name:"케언즈", lat:-16.92, lng:145.77, emoji:"🐠", color:"#2ecc71" },
    { name:"울루루", lat:-25.34, lng:131.04, emoji:"🪨", color:"#e67e22" },
    { name:"브리즈번", lat:-27.47, lng:153.02, emoji:"☀️", color:"#e74c3c" },
    { name:"퍼스", lat:-31.95, lng:115.86, emoji:"🌅", color:"#9b59b6" },
    { name:"골드코스트", lat:-28.02, lng:153.43, emoji:"🏄", color:"#f39c12" },
    { name:"그레이트배리어리프", lat:-18.29, lng:147.70, emoji:"🐠", color:"#16a085" },
    { name:"태즈메이니아", lat:-41.46, lng:145.97, emoji:"🌿", color:"#27ae60" },
  ],
  "Thailand": [
    { name:"방콕", lat:13.76, lng:100.50, emoji:"🛕", color:"#00bcd4" },
    { name:"치앙마이", lat:18.79, lng:98.98, emoji:"🐘", color:"#2ecc71" },
    { name:"푸켓", lat:7.89, lng:98.40, emoji:"🏖️", color:"#3498db" },
    { name:"파타야", lat:12.93, lng:100.88, emoji:"🌊", color:"#e74c3c" },
    { name:"코사무이", lat:9.51, lng:100.06, emoji:"🌴", color:"#f39c12" },
    { name:"아유타야", lat:14.35, lng:100.56, emoji:"🏛️", color:"#9b59b6" },
    { name:"크라비", lat:8.09, lng:98.91, emoji:"🏝️", color:"#16a085" },
    { name:"치앙라이", lat:19.91, lng:99.83, emoji:"⛩️", color:"#9b59b6" },
    { name:"코피피", lat:7.74, lng:98.77, emoji:"🐚", color:"#8e44ad" },
  ],
  "India": [
    { name:"뭄바이", lat:19.08, lng:72.88, emoji:"🌆", color:"#b45309" },
    { name:"뉴델리", lat:28.61, lng:77.21, emoji:"🕌", color:"#e74c3c" },
    { name:"아그라", lat:27.18, lng:78.02, emoji:"🕌", color:"#f39c12" },
    { name:"바라나시", lat:25.32, lng:83.01, emoji:"🙏", color:"#9b59b6" },
    { name:"고아", lat:15.30, lng:74.09, emoji:"🏖️", color:"#2ecc71" },
    { name:"자이푸르", lat:26.91, lng:75.79, emoji:"🏰", color:"#e67e22" },
    { name:"우다이푸르", lat:24.57, lng:73.68, emoji:"🏯", color:"#8e44ad" },
    { name:"콜카타", lat:22.57, lng:88.36, emoji:"🌸", color:"#16a085" },
    { name:"케랄라", lat:10.85, lng:76.27, emoji:"🌴", color:"#27ae60" },
    { name:"암리차르", lat:31.63, lng:74.87, emoji:"🛕", color:"#f39c12" },
  ],
  "United Arab Emirates": [
    { name:"두바이", lat:25.20, lng:55.27, emoji:"🏗️", color:"#f39c12" },
    { name:"아부다비", lat:24.47, lng:54.37, emoji:"🕌", color:"#3498db" },
    { name:"샤르자", lat:25.36, lng:55.42, emoji:"🏺", color:"#2ecc71" },
  ],
  "Turkey": [
    { name:"이스탄불", lat:41.01, lng:28.98, emoji:"🕌", color:"#b45309" },
    { name:"카파도키아", lat:38.64, lng:34.83, emoji:"🎈", color:"#e74c3c" },
    { name:"파묵칼레", lat:37.92, lng:29.12, emoji:"💎", color:"#3498db" },
    { name:"안탈리아", lat:36.90, lng:30.70, emoji:"🌊", color:"#2ecc71" },
    { name:"에페소", lat:37.94, lng:27.34, emoji:"🏛️", color:"#9b59b6" },
    { name:"보드룸", lat:37.03, lng:27.43, emoji:"⛵", color:"#8e44ad" },
    { name:"트라브존", lat:41.00, lng:39.72, emoji:"🌿", color:"#16a085" },
  ],
  "Greece": [
    { name:"산토리니", lat:36.39, lng:25.46, emoji:"🏛️", color:"#1e40af" },
    { name:"아테네", lat:37.98, lng:23.73, emoji:"🏛️", color:"#e74c3c" },
    { name:"미코노스", lat:37.44, lng:25.33, emoji:"💃", color:"#3498db" },
    { name:"크레타", lat:35.24, lng:25.02, emoji:"🌿", color:"#2ecc71" },
    { name:"로도스", lat:36.43, lng:28.22, emoji:"🌹", color:"#f39c12" },
    { name:"코르푸", lat:39.62, lng:19.92, emoji:"🏝️", color:"#9b59b6" },
    { name:"메테오라", lat:39.72, lng:21.63, emoji:"🏔️", color:"#8e44ad" },
  ],
  "Egypt": [
    { name:"카이로", lat:30.04, lng:31.24, emoji:"🔺", color:"#e67e22" },
    { name:"룩소르", lat:25.69, lng:32.64, emoji:"🏺", color:"#f39c12" },
    { name:"아스완", lat:24.09, lng:32.90, emoji:"⛵", color:"#e74c3c" },
    { name:"알렉산드리아", lat:31.20, lng:29.92, emoji:"📚", color:"#3498db" },
    { name:"후르가다", lat:27.26, lng:33.81, emoji:"🐠", color:"#16a085" },
    { name:"샤름엘셰이크", lat:27.91, lng:34.33, emoji:"🏖️", color:"#2ecc71" },
  ],
  "Morocco": [
    { name:"마라케시", lat:31.63, lng:-7.98, emoji:"🕌", color:"#e74c3c" },
    { name:"페스", lat:34.03, lng:-5.00, emoji:"🏺", color:"#f39c12" },
    { name:"카사블랑카", lat:33.59, lng:-7.62, emoji:"🌊", color:"#3498db" },
    { name:"셰프샤우엔", lat:35.17, lng:-5.27, emoji:"💙", color:"#2980b9" },
    { name:"에사우이라", lat:31.51, lng:-9.76, emoji:"⛵", color:"#2ecc71" },
    { name:"메르주가", lat:31.08, lng:-4.01, emoji:"🏜️", color:"#e67e22" },
  ],
  "Vietnam": [
    { name:"하노이", lat:21.03, lng:105.85, emoji:"🏮", color:"#be123c" },
    { name:"호찌민시", lat:10.78, lng:106.70, emoji:"🛵", color:"#e74c3c" },
    { name:"하롱베이", lat:20.91, lng:107.18, emoji:"⛵", color:"#3498db" },
    { name:"호이안", lat:15.88, lng:108.34, emoji:"🏮", color:"#f39c12" },
    { name:"다낭", lat:16.05, lng:108.22, emoji:"🌉", color:"#2ecc71" },
    { name:"후에", lat:16.46, lng:107.60, emoji:"🏰", color:"#9b59b6" },
    { name:"사파", lat:22.34, lng:103.84, emoji:"🌾", color:"#27ae60" },
    { name:"푸꾸옥", lat:10.29, lng:103.98, emoji:"🌴", color:"#8e44ad" },
    { name:"나트랑", lat:12.24, lng:109.19, emoji:"🏖️", color:"#2980b9" },
    { name:"닌빈", lat:20.25, lng:105.97, emoji:"⛰️", color:"#16a085" },
  ],
  "Indonesia": [
    { name:"발리", lat:-8.41, lng:115.19, emoji:"🌺", color:"#0e7490" },
    { name:"자카르타", lat:-6.21, lng:106.85, emoji:"🏙️", color:"#3498db" },
    { name:"족자카르타", lat:-7.80, lng:110.36, emoji:"🏛️", color:"#f39c12" },
    { name:"코모도", lat:-8.55, lng:119.49, emoji:"🦎", color:"#2ecc71" },
    { name:"롬복", lat:-8.57, lng:116.36, emoji:"🌋", color:"#e74c3c" },
    { name:"보로부두르", lat:-7.61, lng:110.20, emoji:"🕌", color:"#e67e22" },
    { name:"라자암팟", lat:-1.08, lng:130.87, emoji:"🐠", color:"#16a085" },
  ],
  "Malaysia": [
    { name:"쿠알라룸푸르", lat:3.15, lng:101.70, emoji:"🏙️", color:"#3498db" },
    { name:"페낭", lat:5.41, lng:100.33, emoji:"🍜", color:"#e74c3c" },
    { name:"코타키나발루", lat:5.98, lng:116.07, emoji:"🏔️", color:"#2ecc71" },
    { name:"랑카위", lat:6.35, lng:99.80, emoji:"🏝️", color:"#f39c12" },
    { name:"말라카", lat:2.19, lng:102.25, emoji:"🏛️", color:"#9b59b6" },
  ],
  "Singapore": [
    { name:"싱가포르", lat:1.36, lng:103.82, emoji:"🦁", color:"#991b1b" },
  ],
  "Cambodia": [
    { name:"씨엠립", lat:13.37, lng:103.87, emoji:"🏛️", color:"#e74c3c" },
    { name:"프놈펜", lat:11.56, lng:104.93, emoji:"🏙️", color:"#3498db" },
    { name:"시아누크빌", lat:10.63, lng:103.50, emoji:"🏖️", color:"#2ecc71" },
    { name:"시아누크빌", lat:10.63, lng:103.50, emoji:"🏖️", color:"#3498db" }],
  "Myanmar": [
    { name:"양곤", lat:16.87, lng:96.19, emoji:"🛕", color:"#f39c12" },
    { name:"바간", lat:21.17, lng:94.86, emoji:"🏯", color:"#e74c3c" },
    { name:"만달레이", lat:21.97, lng:96.08, emoji:"🌉", color:"#9b59b6" },
    { name:"인레호수", lat:20.53, lng:96.90, emoji:"🚣", color:"#3498db" },
  ],
  "Nepal": [
    { name:"카트만두", lat:27.70, lng:85.32, emoji:"🕌", color:"#e74c3c" },
    { name:"포카라", lat:28.21, lng:83.99, emoji:"🏔️", color:"#3498db" },
    { name:"치트완", lat:27.52, lng:84.35, emoji:"🦏", color:"#2ecc71" },
    { name:"룸비니", lat:27.48, lng:83.28, emoji:"🙏", color:"#f39c12" },
  ],
  "Sri Lanka": [
    { name:"콜롬보", lat:6.93, lng:79.85, emoji:"🌿", color:"#2ecc71" },
    { name:"캔디", lat:7.29, lng:80.63, emoji:"🐘", color:"#e74c3c" },
    { name:"갈레", lat:6.03, lng:80.22, emoji:"🏰", color:"#3498db" },
    { name:"시기리야", lat:7.96, lng:80.76, emoji:"🦁", color:"#f39c12" },
    { name:"누와라엘리야", lat:6.97, lng:80.78, emoji:"🍵", color:"#9b59b6" },
  ],
  "Philippines": [
    { name:"마닐라", lat:14.60, lng:120.98, emoji:"🏙️", color:"#e74c3c" },
    { name:"팔라완", lat:9.84, lng:118.74, emoji:"🏝️", color:"#3498db" },
    { name:"보라카이", lat:11.97, lng:121.92, emoji:"🌴", color:"#f39c12" },
    { name:"세부", lat:10.32, lng:123.89, emoji:"🐬", color:"#2ecc71" },
    { name:"시아르가오", lat:9.85, lng:126.05, emoji:"🏄", color:"#9b59b6" },
    { name:"시아르가오", lat:9.85, lng:126.05, emoji:"🏄", color:"#2ecc71" }],
  "Portugal": [
    { name:"리스본", lat:38.72, lng:-9.14, emoji:"🏙️", color:"#92400e" },
    { name:"포르투", lat:41.15, lng:-8.61, emoji:"🍷", color:"#e74c3c" },
    { name:"신트라", lat:38.80, lng:-9.39, emoji:"🏰", color:"#2ecc71" },
    { name:"알가르브", lat:37.09, lng:-8.23, emoji:"🌊", color:"#3498db" },
    { name:"코임브라", lat:40.20, lng:-8.41, emoji:"📚", color:"#e67e22" },
    { name:"마데이라", lat:32.65, lng:-16.91, emoji:"🌺", color:"#8e44ad" },
  ],
  "Netherlands": [
    { name:"암스테르담", lat:52.37, lng:4.90, emoji:"🚲", color:"#c2410c" },
    { name:"로테르담", lat:51.92, lng:4.48, emoji:"🌉", color:"#3498db" },
    { name:"헤이그", lat:52.08, lng:4.31, emoji:"⚖️", color:"#2ecc71" },
    { name:"위트레흐트", lat:52.09, lng:5.12, emoji:"⛪", color:"#9b59b6" },
    { name:"마스트리흐트", lat:50.86, lng:5.70, emoji:"🍷", color:"#8e44ad" },
  ],
  "Czechia": [
    { name:"프라하", lat:50.08, lng:14.44, emoji:"🏰", color:"#065f46" },
    { name:"체스키크룸로프", lat:48.82, lng:14.32, emoji:"🏯", color:"#e74c3c" },
    { name:"브르노", lat:49.19, lng:16.61, emoji:"🏙️", color:"#3498db" },
    { name:"체스키크룸로프", lat:48.81, lng:14.32, emoji:"🏰", color:"#e67e22" },
    { name:"카를로비바리", lat:50.23, lng:12.88, emoji:"♨️", color:"#3498db" }],
  "Austria": [
    { name:"빈", lat:48.22, lng:16.35, emoji:"🎵", color:"#5b21b6" },
    { name:"잘츠부르크", lat:47.80, lng:13.04, emoji:"🎶", color:"#3498db" },
    { name:"인스브루크", lat:47.27, lng:11.39, emoji:"⛷️", color:"#2ecc71" },
    { name:"할슈타트", lat:47.56, lng:13.65, emoji:"🏔️", color:"#e74c3c" },
    { name:"그라츠", lat:47.08, lng:15.43, emoji:"🏛️", color:"#f39c12" },
  ],
  "Switzerland": [
    { name:"취리히", lat:47.38, lng:8.54, emoji:"🏦", color:"#e74c3c" },
    { name:"제네바", lat:46.21, lng:6.19, emoji:"⌚", color:"#3498db" },
    { name:"인터라켄", lat:46.69, lng:7.86, emoji:"🏔️", color:"#2ecc71" },
    { name:"루체른", lat:47.05, lng:8.31, emoji:"🌉", color:"#9b59b6" },
    { name:"체르마트", lat:46.05, lng:7.75, emoji:"⛷️", color:"#e67e22" },
    { name:"베른", lat:46.95, lng:7.44, emoji:"🐻", color:"#8e44ad" },
  ],
  "Hungary": [
    { name:"부다페스트", lat:47.50, lng:19.04, emoji:"🏰", color:"#e74c3c" },
    { name:"에게르", lat:47.90, lng:20.38, emoji:"🍷", color:"#9b59b6" },
    { name:"에게르", lat:47.90, lng:20.38, emoji:"🏰", color:"#e74c3c" },
    { name:"페치", lat:46.07, lng:18.23, emoji:"🕌", color:"#f39c12" }],
  "Slovenia": [
    { name:"류블랴나", lat:46.05, lng:14.51, emoji:"🏰", color:"#3498db" },
    { name:"블레드", lat:46.37, lng:14.11, emoji:"🏔️", color:"#2ecc71" },
    { name:"피란", lat:45.53, lng:13.57, emoji:"⛵", color:"#e74c3c" },
    { name:"마리보르", lat:46.56, lng:15.65, emoji:"🍷", color:"#9b59b6" },
  ],
  "Croatia": [
    { name:"두브로브니크", lat:42.66, lng:18.05, emoji:"🌊", color:"#3498db" },
    { name:"자그레브", lat:45.81, lng:15.98, emoji:"🏙️", color:"#e74c3c" },
    { name:"플리트비체", lat:44.88, lng:15.62, emoji:"💧", color:"#2ecc71" },
    { name:"스플리트", lat:43.51, lng:16.44, emoji:"🏛️", color:"#f39c12" },
    { name:"흐바르", lat:43.17, lng:16.44, emoji:"🌞", color:"#9b59b6" },
  ],
  "Norway": [
    { name:"오슬로", lat:59.91, lng:10.75, emoji:"🏙️", color:"#3498db" },
    { name:"베르겐", lat:60.39, lng:5.32, emoji:"⛵", color:"#2ecc71" },
    { name:"플롬", lat:60.86, lng:7.11, emoji:"🌊", color:"#e74c3c" },
    { name:"트롬쇠", lat:69.65, lng:18.96, emoji:"🌌", color:"#9b59b6" },
    { name:"로포텐", lat:68.23, lng:13.99, emoji:"🎣", color:"#8e44ad" },
    { name:"게이랑에르", lat:62.10, lng:7.21, emoji:"🏔️", color:"#16a085" },
  ],
  "Sweden": [
    { name:"스톡홀름", lat:59.33, lng:18.07, emoji:"👑", color:"#2980b9" },
    { name:"예테보리", lat:57.71, lng:11.97, emoji:"🚢", color:"#e74c3c" },
    { name:"말뫼", lat:55.60, lng:13.00, emoji:"🌉", color:"#2ecc71" },
    { name:"아비스코", lat:68.35, lng:18.83, emoji:"🌌", color:"#9b59b6" },
  ],
  "Denmark": [
    { name:"코펜하겐", lat:55.68, lng:12.57, emoji:"🧜", color:"#3498db" },
    { name:"오르후스", lat:56.15, lng:10.21, emoji:"🎨", color:"#2ecc71" },
    { name:"오덴세", lat:55.40, lng:10.38, emoji:"📖", color:"#e74c3c" },
    { name:"빌룬드", lat:55.73, lng:9.13, emoji:"🧱", color:"#f1c40f" }],
  "Finland": [
    { name:"헬싱키", lat:60.17, lng:24.94, emoji:"🏛️", color:"#2980b9" },
    { name:"로바니에미", lat:66.50, lng:25.72, emoji:"🎅", color:"#3498db" },
    { name:"탐페레", lat:61.50, lng:23.77, emoji:"🏭", color:"#e74c3c" },
    { name:"투르쿠", lat:60.45, lng:22.27, emoji:"🏛️", color:"#3498db" }],
  "Iceland": [
    { name:"레이캬비크", lat:64.13, lng:-21.82, emoji:"🌋", color:"#1e3a8a" },
    { name:"아퀴레이리", lat:65.68, lng:-18.10, emoji:"❄️", color:"#3498db" },
    { name:"블루라군", lat:63.88, lng:-22.45, emoji:"💙", color:"#2ecc71" },
    { name:"요쿨살론", lat:64.05, lng:-16.18, emoji:"🧊", color:"#9b59b6" },
    { name:"골든서클", lat:64.31, lng:-20.12, emoji:"♨️", color:"#e74c3c" },
  ],
  "Poland": [
    { name:"크라쿠프", lat:50.06, lng:19.94, emoji:"🏰", color:"#e74c3c" },
    { name:"바르샤바", lat:52.23, lng:21.01, emoji:"🏙️", color:"#3498db" },
    { name:"브로츠와프", lat:51.11, lng:17.04, emoji:"🌉", color:"#2ecc71" },
    { name:"그단스크", lat:54.35, lng:18.65, emoji:"⚓", color:"#f39c12" },
    { name:"자코파네", lat:49.30, lng:19.95, emoji:"⛷️", color:"#9b59b6" },
  ],
  "Russia": [
    { name:"모스크바", lat:55.75, lng:37.62, emoji:"🕌", color:"#e74c3c" },
    { name:"상트페테르부르크", lat:59.95, lng:30.32, emoji:"🏛️", color:"#3498db" },
    { name:"바이칼호", lat:53.50, lng:108.17, emoji:"🌊", color:"#2ecc71" },
    { name:"소치", lat:43.60, lng:39.73, emoji:"🏖️", color:"#f39c12" },
    { name:"블라디보스토크", lat:43.12, lng:131.89, emoji:"⚓", color:"#9b59b6" },
  ],
  "South Africa": [
    { name:"케이프타운", lat:-33.92, lng:18.42, emoji:"🏔️", color:"#2ecc71" },
    { name:"요하네스버그", lat:-26.20, lng:28.04, emoji:"🏙️", color:"#3498db" },
    { name:"더반", lat:-29.86, lng:31.02, emoji:"🌊", color:"#e74c3c" },
    { name:"크루거국립공원", lat:-23.99, lng:31.55, emoji:"🦁", color:"#f39c12" },
    { name:"드라켄즈버그", lat:-29.30, lng:29.42, emoji:"🏔️", color:"#16a085" },
  ],
  "Kenya": [
    { name:"나이로비", lat:-1.29, lng:36.82, emoji:"🦁", color:"#14532d" },
    { name:"마사이마라", lat:-1.49, lng:35.15, emoji:"🐘", color:"#2ecc71" },
    { name:"몸바사", lat:-4.05, lng:39.67, emoji:"🌊", color:"#3498db" },
    { name:"암보셀리", lat:-2.65, lng:37.26, emoji:"🐘", color:"#e67e22" },
    { name:"라무", lat:-2.27, lng:40.90, emoji:"⛵", color:"#f39c12" },
  ],
  "Tanzania": [
    { name:"잔지바르", lat:-6.16, lng:39.20, emoji:"🏖️", color:"#3498db" },
    { name:"세렝게티", lat:-2.33, lng:34.83, emoji:"🦁", color:"#2ecc71" },
    { name:"킬리만자로", lat:-3.07, lng:37.35, emoji:"🏔️", color:"#e74c3c" },
    { name:"응고롱고로", lat:-3.26, lng:35.52, emoji:"🦏", color:"#9b59b6" },
  ],
  "Jordan": [
    { name:"페트라", lat:30.33, lng:35.44, emoji:"🏺", color:"#b45309" },
    { name:"암만", lat:31.95, lng:35.93, emoji:"🕌", color:"#3498db" },
    { name:"와디럼", lat:29.58, lng:35.42, emoji:"🏜️", color:"#e67e22" },
    { name:"아카바", lat:29.53, lng:35.01, emoji:"🤿", color:"#2ecc71" },
  ],
  "Israel": [
    { name:"예루살렘", lat:31.77, lng:35.22, emoji:"✡️", color:"#3498db" },
    { name:"텔아비브", lat:32.09, lng:34.79, emoji:"🌆", color:"#e74c3c" },
    { name:"마사다", lat:31.32, lng:35.35, emoji:"🏔️", color:"#f39c12" },
    { name:"사해", lat:31.56, lng:35.47, emoji:"🌊", color:"#9b59b6" },
  ],
  "Canada": [
    { name:"밴쿠버", lat:49.28, lng:-123.12, emoji:"🏔️", color:"#9f1239" },
    { name:"토론토", lat:43.65, lng:-79.38, emoji:"🏙️", color:"#3498db" },
    { name:"퀘벡시티", lat:46.81, lng:-71.21, emoji:"🏰", color:"#2ecc71" },
    { name:"밴프", lat:51.18, lng:-115.57, emoji:"🏞️", color:"#e67e22" },
    { name:"몬트리올", lat:45.50, lng:-73.57, emoji:"🎭", color:"#9b59b6" },
    { name:"오타와", lat:45.42, lng:-75.70, emoji:"🏛️", color:"#16a085" },
    { name:"나이아가라폴스", lat:43.09, lng:-79.07, emoji:"💧", color:"#c0392b" },
    { name:"빅토리아", lat:48.43, lng:-123.37, emoji:"🌸", color:"#27ae60" },
  ],
  "Cuba": [
    { name:"하바나", lat:23.11, lng:-82.37, emoji:"🚗", color:"#7c2d12" },
    { name:"트리니다드", lat:21.80, lng:-79.98, emoji:"🎵", color:"#e74c3c" },
    { name:"바라데로", lat:23.15, lng:-81.24, emoji:"🏖️", color:"#3498db" },
    { name:"비냘레스", lat:22.62, lng:-83.71, emoji:"🌿", color:"#2ecc71" },
  ],
  "Argentina": [
    { name:"부에노스아이레스", lat:-34.60, lng:-58.38, emoji:"💃", color:"#0369a1" },
    { name:"파타고니아", lat:-41.83, lng:-68.91, emoji:"🏔️", color:"#2ecc71" },
    { name:"이과수", lat:-25.69, lng:-54.44, emoji:"💧", color:"#3498db" },
    { name:"멘도사", lat:-32.89, lng:-68.83, emoji:"🍷", color:"#9b59b6" },
    { name:"우수아이아", lat:-54.80, lng:-68.30, emoji:"🌎", color:"#16a085" },
    { name:"살타", lat:-24.79, lng:-65.41, emoji:"🌄", color:"#e67e22" },
  ],
  "Brazil": [
    { name:"리우데자네이루", lat:-22.91, lng:-43.17, emoji:"🏖️", color:"#27ae60" },
    { name:"상파울루", lat:-23.55, lng:-46.63, emoji:"🏙️", color:"#3498db" },
    { name:"마나우스", lat:-3.10, lng:-60.02, emoji:"🌿", color:"#2ecc71" },
    { name:"포스두이과수", lat:-25.52, lng:-54.59, emoji:"💧", color:"#00bcd4" },
    { name:"살바도르", lat:-12.97, lng:-38.50, emoji:"🎭", color:"#e74c3c" },
    { name:"브라질리아", lat:-15.78, lng:-47.93, emoji:"🏛️", color:"#9b59b6" },
    { name:"포르탈레자", lat:-3.72, lng:-38.54, emoji:"🏖️", color:"#f39c12" },
  ],
  "Mexico": [
    { name:"멕시코시티", lat:19.43, lng:-99.13, emoji:"🏛️", color:"#166534" },
    { name:"칸쿤", lat:21.16, lng:-86.85, emoji:"🏖️", color:"#3498db" },
    { name:"과달라하라", lat:20.66, lng:-103.35, emoji:"🌮", color:"#e74c3c" },
    { name:"오악사카", lat:17.07, lng:-96.72, emoji:"🎨", color:"#9b59b6" },
    { name:"툴룸", lat:20.21, lng:-87.46, emoji:"🌴", color:"#f39c12" },
    { name:"과나후아토", lat:21.02, lng:-101.26, emoji:"🎭", color:"#e67e22" },
    { name:"치첸이트사", lat:20.68, lng:-88.57, emoji:"🏛️", color:"#8e44ad" },
  ],
  "Colombia": [
    { name:"보고타", lat:4.71, lng:-74.07, emoji:"🏙️", color:"#f39c12" },
    { name:"카르타헤나", lat:10.40, lng:-75.51, emoji:"🏰", color:"#e74c3c" },
    { name:"메데인", lat:6.25, lng:-75.56, emoji:"🌸", color:"#2ecc71" },
    { name:"살렌토", lat:4.63, lng:-75.57, emoji:"☕", color:"#9b59b6" },
  ],
  "Peru": [
    { name:"마추픽추", lat:-13.16, lng:-72.55, emoji:"🏔️", color:"#15803d" },
    { name:"쿠스코", lat:-13.53, lng:-71.97, emoji:"🏛️", color:"#78350f" },
    { name:"리마", lat:-12.05, lng:-77.04, emoji:"🏙️", color:"#3498db" },
    { name:"나스카", lat:-14.74, lng:-75.13, emoji:"🌀", color:"#e67e22" },
    { name:"티티카카호수", lat:-15.84, lng:-69.33, emoji:"🚣", color:"#2ecc71" },
    { name:"아레키파", lat:-16.41, lng:-71.54, emoji:"🌋", color:"#9b59b6" },
  ],
  "Chile": [
    { name:"산티아고", lat:-33.45, lng:-70.67, emoji:"🏙️", color:"#e74c3c" },
    { name:"발파라이소", lat:-33.05, lng:-71.62, emoji:"🎨", color:"#3498db" },
    { name:"아타카마", lat:-22.91, lng:-68.20, emoji:"🏜️", color:"#e67e22" },
    { name:"토레스델파이네", lat:-50.94, lng:-73.41, emoji:"🏔️", color:"#2ecc71" },
    { name:"이스터섬", lat:-27.11, lng:-109.35, emoji:"🗿", color:"#8e44ad" },
  ],
  "New Zealand": [
    { name:"퀸스타운", lat:-45.03, lng:168.66, emoji:"🏔️", color:"#065f46" },
    { name:"오클랜드", lat:-36.85, lng:174.76, emoji:"🌉", color:"#3498db" },
    { name:"로토루아", lat:-38.14, lng:176.25, emoji:"♨️", color:"#e74c3c" },
    { name:"웰링턴", lat:-41.29, lng:174.78, emoji:"🎭", color:"#9b59b6" },
    { name:"밀포드사운드", lat:-44.67, lng:167.93, emoji:"🏔️", color:"#f39c12" },
    { name:"호비튼", lat:-37.86, lng:175.68, emoji:"🧙", color:"#8e44ad" },
    { name:"크라이스트처치", lat:-43.53, lng:172.64, emoji:"🏙️", color:"#e74c3c" },
  ],
  "Saudi Arabia": [
    { name:"리야드", lat:24.69, lng:46.72, emoji:"🕌", color:"#2ecc71" },
    { name:"제다", lat:21.49, lng:39.19, emoji:"🌊", color:"#3498db" },
    { name:"알울라", lat:26.62, lng:37.92, emoji:"🏔️", color:"#e67e22" },
    { name:"메카", lat:21.39, lng:39.86, emoji:"🕋", color:"#f39c12" },
  ],
  "Iran": [
    { name:"테헤란", lat:35.69, lng:51.39, emoji:"🏙️", color:"#e74c3c" },
    { name:"이스파한", lat:32.66, lng:51.68, emoji:"🕌", color:"#3498db" },
    { name:"시라즈", lat:29.59, lng:52.58, emoji:"🌹", color:"#2ecc71" },
    { name:"페르세폴리스", lat:29.93, lng:52.89, emoji:"🏛️", color:"#f39c12" },
  ],
  "Uzbekistan": [
    { name:"사마르칸트", lat:39.65, lng:66.96, emoji:"🕌", color:"#e74c3c" },
    { name:"부하라", lat:39.77, lng:64.43, emoji:"🏺", color:"#f39c12" },
    { name:"히바", lat:41.38, lng:60.36, emoji:"🏯", color:"#3498db" },
    { name:"타슈켄트", lat:41.30, lng:69.24, emoji:"🏙️", color:"#2ecc71" },
  ],
  "Ethiopia": [
    { name:"아디스아바바", lat:9.03, lng:38.74, emoji:"🏙️", color:"#2ecc71" },
    { name:"랄리벨라", lat:12.03, lng:39.04, emoji:"⛪", color:"#e74c3c" },
    { name:"악숨", lat:14.13, lng:38.73, emoji:"🏛️", color:"#f39c12" },
    { name:"다나킬사막", lat:14.24, lng:40.30, emoji:"🌋", color:"#e67e22" },
  ],
  "Ghana": [
    { name:"아크라", lat:5.56, lng:-0.20, emoji:"🏙️", color:"#f39c12" },
    { name:"케이프코스트", lat:5.10, lng:-1.25, emoji:"🏰", color:"#3498db" },
    { name:"쿠마시", lat:6.69, lng:-1.62, emoji:"👑", color:"#2ecc71" },
    { name:"케이프코스트", lat:5.10, lng:-1.25, emoji:"🏰", color:"#e67e22" }],
  "Ireland": [
    { name:"더블린", lat:53.35, lng:-6.26, emoji:"🍀", color:"#2ecc71" },
    { name:"골웨이", lat:53.27, lng:-9.05, emoji:"🎵", color:"#3498db" },
    { name:"코크", lat:51.90, lng:-8.47, emoji:"🍀", color:"#27ae60" },
    { name:"킬라니", lat:52.06, lng:-9.51, emoji:"🌿", color:"#2ecc71" }],
  "Belgium": [
    { name:"브뤼셀", lat:50.85, lng:4.35, emoji:"🧇", color:"#f39c12" },
    { name:"브뤼헤", lat:51.21, lng:3.22, emoji:"🏰", color:"#3498db" },
    { name:"브뤼헤", lat:51.21, lng:3.22, emoji:"🏛️", color:"#8e44ad" },
    { name:"안트베르펜", lat:51.22, lng:4.40, emoji:"💎", color:"#e74c3c" },
    { name:"겐트", lat:51.05, lng:3.72, emoji:"🏰", color:"#2ecc71" }],
  "Taiwan": [
    { name:"타이베이", lat:25.03, lng:121.57, emoji:"🏙️", color:"#e74c3c" },
    { name:"지우펀", lat:25.11, lng:121.84, emoji:"🏮", color:"#f39c12" },
    { name:"가오슝", lat:22.63, lng:120.30, emoji:"🌊", color:"#3498db" },
    { name:"타이난", lat:22.99, lng:120.20, emoji:"🏛️", color:"#9b59b6" },
    { name:"타이중", lat:24.16, lng:120.65, emoji:"🌿", color:"#2ecc71" },
    { name:"화롄", lat:23.99, lng:121.60, emoji:"🏔️", color:"#16a085" },
    { name:"타로코", lat:24.18, lng:121.62, emoji:"⛰️", color:"#e67e22" },
  ],
  "Maldives": [
    { name:"말레", lat:4.18, lng:73.51, emoji:"🏝️", color:"#3498db" },
  ],
  "Costa Rica": [
    { name:"산호세", lat:9.93, lng:-84.08, emoji:"🌿", color:"#2ecc71" },
    { name:"아레날", lat:10.46, lng:-84.70, emoji:"🌋", color:"#e74c3c" },
    { name:"아레날", lat:10.46, lng:-84.64, emoji:"🌋", color:"#e74c3c" },
    { name:"몬테베르데", lat:10.31, lng:-84.82, emoji:"🌿", color:"#27ae60" }],
  "Panama": [
    { name:"파나마시티", lat:8.98, lng:-79.52, emoji:"🏙️", color:"#3498db" },
    { name:"보카스델토로", lat:9.34, lng:-82.24, emoji:"🏝️", color:"#2980b9" }],
  "Ecuador": [
    { name:"키토", lat:-0.18, lng:-78.47, emoji:"🏔️", color:"#e74c3c" },
    { name:"갈라파고스", lat:-0.95, lng:-90.97, emoji:"🐢", color:"#2ecc71" },
    { name:"바뇨스", lat:-1.40, lng:-78.42, emoji:"🌋", color:"#e74c3c" },
    { name:"오타발로", lat:0.23, lng:-78.26, emoji:"🎨", color:"#9b59b6" }],
  "Romania": [
    { name:"부쿠레슈티", lat:44.43, lng:26.10, emoji:"🏛️", color:"#3498db" },
    { name:"브라쇼프", lat:45.66, lng:25.61, emoji:"🏰", color:"#e74c3c" },
    { name:"브라쇼브", lat:45.65, lng:25.61, emoji:"🏔️", color:"#2ecc71" },
    { name:"시비우", lat:45.80, lng:24.15, emoji:"🏘️", color:"#e67e22" }],
  "Georgia": [
    { name:"트빌리시", lat:41.72, lng:44.80, emoji:"⛪", color:"#9b59b6" },
    { name:"카즈베기", lat:42.65, lng:44.66, emoji:"🏔️", color:"#3498db" },
    { name:"메스티아", lat:43.05, lng:42.73, emoji:"🗼", color:"#2ecc71" },
    { name:"시그나기", lat:41.62, lng:45.92, emoji:"🍷", color:"#e74c3c" },
  ],
  "Montenegro": [
    { name:"코토르", lat:42.45, lng:18.77, emoji:"🏰", color:"#3498db" },
    { name:"코토르", lat:42.42, lng:18.77, emoji:"🏔️", color:"#2c3e50" },
    { name:"부드바", lat:42.29, lng:18.84, emoji:"🏖️", color:"#e67e22" }],
  "Mongolia": [
    { name:"울란바토르", lat:47.92, lng:106.91, emoji:"🏙️", color:"#e74c3c" },
    { name:"테를지", lat:47.80, lng:107.42, emoji:"🏔️", color:"#27ae60" }],
  "Laos": [
    { name:"루앙프라방", lat:19.89, lng:102.14, emoji:"🛕", color:"#f39c12" },
    { name:"비엔티안", lat:17.97, lng:102.63, emoji:"🏙️", color:"#3498db" },
    { name:"방비엥", lat:18.92, lng:102.45, emoji:"🏔️", color:"#2ecc71" }],
  "Tunisia": [
    { name:"튀니스", lat:36.81, lng:10.17, emoji:"🕌", color:"#e74c3c" },
    { name:"카르타고", lat:36.85, lng:10.32, emoji:"🏛️", color:"#e67e22" },
    { name:"시디부사이드", lat:36.87, lng:10.35, emoji:"🏘️", color:"#3498db" }],
  "Oman": [
    { name:"무스카트", lat:23.59, lng:58.38, emoji:"🕌", color:"#f39c12" },
    { name:"니즈와", lat:22.93, lng:57.53, emoji:"🏰", color:"#e67e22" }],
  "Qatar": [
    { name:"도하", lat:25.30, lng:51.53, emoji:"🏙️", color:"#3498db" },
    { name:"알주바라", lat:25.73, lng:50.72, emoji:"🏛️", color:"#c0392b" }],
  "Bolivia": [
    { name:"라파스", lat:-16.50, lng:-68.15, emoji:"🏔️", color:"#e74c3c" },
    { name:"우유니", lat:-20.46, lng:-66.83, emoji:"🪞", color:"#3498db" },
    { name:"수크레", lat:-19.04, lng:-65.26, emoji:"🏛️", color:"#e74c3c" }],
  "Dominican Republic": [
    { name:"푼타카나", lat:18.58, lng:-68.40, emoji:"🏖️", color:"#2ecc71" },
    { name:"푼타카나", lat:18.58, lng:-68.40, emoji:"🌴", color:"#2ecc71" }],
  "Guatemala": [
    { name:"안티구아", lat:14.56, lng:-90.73, emoji:"🌋", color:"#e74c3c" },
    { name:"안티구아", lat:14.56, lng:-90.73, emoji:"🏛️", color:"#f39c12" }],
  "Jamaica": [
    { name:"킹스턴", lat:18.00, lng:-76.79, emoji:"🎵", color:"#f39c12" },
    { name:"몬테고베이", lat:18.47, lng:-77.92, emoji:"🏖️", color:"#3498db" },
    { name:"네그릴", lat:18.27, lng:-78.35, emoji:"🏖️", color:"#f39c12" }],
  "Latvia": [
    { name:"리가", lat:56.95, lng:24.12, emoji:"🏛️", color:"#9b59b6" },
    { name:"유르말라", lat:56.97, lng:23.77, emoji:"🏖️", color:"#2980b9" }],
  "Lithuania": [
    { name:"빌뉴스", lat:54.69, lng:25.28, emoji:"🏰", color:"#e74c3c" },
    { name:"카우나스", lat:54.90, lng:23.90, emoji:"🏛️", color:"#2ecc71" },
    { name:"트라카이", lat:54.65, lng:24.93, emoji:"🏰", color:"#e74c3c" }],
  "Estonia": [
    { name:"탈린", lat:59.43, lng:24.75, emoji:"🏰", color:"#3498db" },
    { name:"타르투", lat:58.38, lng:26.72, emoji:"🎓", color:"#3498db" }],
  "Cyprus": [
    { name:"파포스", lat:34.77, lng:32.43, emoji:"🏛️", color:"#f39c12" },
    { name:"파포스", lat:34.78, lng:32.42, emoji:"🏛️", color:"#f39c12" },
    { name:"리마솔", lat:34.68, lng:33.04, emoji:"🏖️", color:"#3498db" }],
  "Albania": [
    { name:"티라나", lat:41.33, lng:19.82, emoji:"🏙️", color:"#e74c3c" },
    { name:"베라트", lat:40.71, lng:19.95, emoji:"🏘️", color:"#e74c3c" },
    { name:"사란다", lat:39.87, lng:20.01, emoji:"🏖️", color:"#2980b9" }],
  "Serbia": [
    { name:"베오그라드", lat:44.80, lng:20.47, emoji:"🏰", color:"#3498db" },
    { name:"노비사드", lat:45.25, lng:19.85, emoji:"🏰", color:"#9b59b6" }],
  "Namibia": [
    { name:"빈트후크", lat:-22.56, lng:17.08, emoji:"🏜️", color:"#e67e22" },
    { name:"소수스블레이", lat:-24.73, lng:15.29, emoji:"🏜️", color:"#e74c3c" },
    { name:"소수스블레이", lat:-24.73, lng:15.29, emoji:"🏜️", color:"#f39c12" }],
  "Zimbabwe": [
    { name:"빅토리아폴스", lat:-17.92, lng:25.86, emoji:"💧", color:"#3498db" },
  ],
  "Fiji": [
    { name:"나디", lat:-17.77, lng:177.95, emoji:"🏝️", color:"#2ecc71" },
    { name:"마마누카", lat:-17.77, lng:177.10, emoji:"🏝️", color:"#3498db" }],
  "Madagascar": [
    { name:"안타나나리보", lat:-18.88, lng:47.51, emoji:"🦎", color:"#2ecc71" },
    { name:"노시베", lat:-13.33, lng:48.27, emoji:"🏝️", color:"#2980b9" }],
  "Mauritius": [
    { name:"포트루이스", lat:-20.16, lng:57.50, emoji:"🏝️", color:"#3498db" },
  ],
  "Lebanon": [
    { name:"베이루트", lat:33.89, lng:35.51, emoji:"🏙️", color:"#e74c3c" },
    { name:"비블로스", lat:34.12, lng:35.65, emoji:"🏛️", color:"#e67e22" },
    { name:"바알베크", lat:34.01, lng:36.21, emoji:"🏛️", color:"#c0392b" }],
  "Ukraine": [
    { name:"키이우", lat:50.45, lng:30.52, emoji:"🏛️", color:"#3498db" },
    { name:"르비우", lat:49.84, lng:24.03, emoji:"🏰", color:"#2ecc71" },
    { name:"오데사", lat:46.48, lng:30.74, emoji:"🏖️", color:"#3498db" },
    { name:"체르니우치", lat:48.29, lng:25.94, emoji:"🏛️", color:"#9b59b6" }],
  "Pakistan": [
    { name:"라호르", lat:31.52, lng:74.30, emoji:"🕌", color:"#2ecc71" },
    { name:"이슬라마바드", lat:33.69, lng:73.04, emoji:"🏙️", color:"#3498db" },
    { name:"훈자", lat:36.32, lng:74.65, emoji:"🏔️", color:"#2ecc71" }],
  "Luxembourg": [
    { name:"룩셈부르크시티", lat:49.61, lng:6.13, emoji:"🏰", color:"#9b59b6" },
  ],
  "Slovakia": [
    { name:"브라티슬라바", lat:48.16, lng:17.12, emoji:"🏰", color:"#3498db" },
    { name:"코시체", lat:48.72, lng:21.26, emoji:"🏛️", color:"#e74c3c" }],
  "Bulgaria": [
    { name:"소피아", lat:42.70, lng:23.32, emoji:"⛪", color:"#e74c3c" },
    { name:"플로브디프", lat:42.15, lng:24.75, emoji:"🏛️", color:"#3498db" },
    { name:"벨리코투르노보", lat:43.08, lng:25.63, emoji:"🏰", color:"#e74c3c" }],
  "Rwanda": [
    { name:"키갈리", lat:-1.94, lng:30.06, emoji:"🏙️", color:"#2ecc71" },
    { name:"무산제", lat:-1.50, lng:29.63, emoji:"🦍", color:"#27ae60" }],
  "Senegal": [
    { name:"다카르", lat:14.72, lng:-17.47, emoji:"🌍", color:"#f39c12" },
    { name:"생루이", lat:16.02, lng:-16.50, emoji:"🏘️", color:"#f39c12" }],
  "Kazakhstan": [
    { name:"알마티", lat:43.24, lng:76.95, emoji:"🏔️", color:"#3498db" },
  ],
  // ── 나머지 국가 (수도) ──
  "Afghanistan": [{ name:"카불", lat:34.53, lng:69.17, emoji:"🏔️", color:"#e67e22" }],
  "Algeria": [{ name:"알제", lat:36.75, lng:3.04, emoji:"🕌", color:"#e74c3c" }],
  "Angola": [{ name:"루안다", lat:-8.84, lng:13.23, emoji:"🏙️", color:"#f39c12" }],
  "Armenia": [{ name:"예레반", lat:40.18, lng:44.51, emoji:"⛪", color:"#9b59b6" }],
  "Azerbaijan": [{ name:"바쿠", lat:40.41, lng:49.87, emoji:"🔥", color:"#e74c3c" }],
  "Bahrain": [{ name:"마나마", lat:26.23, lng:50.59, emoji:"🏙️", color:"#3498db" }],
  "Bangladesh": [{ name:"다카", lat:23.81, lng:90.41, emoji:"🕌", color:"#2ecc71" }],
  "Belarus": [{ name:"민스크", lat:53.90, lng:27.57, emoji:"🏛️", color:"#3498db" }],
  "Belize": [{ name:"벨리즈시티", lat:17.50, lng:-88.20, emoji:"🏝️", color:"#2ecc71" }],
  "Benin": [{ name:"코토누", lat:6.37, lng:2.39, emoji:"🌍", color:"#f39c12" }],
  "Bhutan": [{ name:"팀부", lat:27.47, lng:89.64, emoji:"🛕", color:"#e67e22" }],
  "Bosnia and Herzegovina": [{ name:"사라예보", lat:43.86, lng:18.41, emoji:"🏰", color:"#e74c3c" },
    { name:"모스타르", lat:43.34, lng:17.81, emoji:"🌉", color:"#2ecc71" }],
  "Botswana": [{ name:"가보로네", lat:-24.65, lng:25.91, emoji:"🐘", color:"#2ecc71" }],
  "Brunei": [{ name:"반다르스리브가완", lat:4.94, lng:114.95, emoji:"🕌", color:"#f39c12" }],
  "Burkina Faso": [{ name:"와가두구", lat:12.37, lng:-1.52, emoji:"🌍", color:"#e67e22" }],
  "Burundi": [{ name:"기테가", lat:-3.43, lng:29.93, emoji:"🌍", color:"#2ecc71" }],
  "Cabo Verde": [{ name:"프라이아", lat:14.93, lng:-23.51, emoji:"🏝️", color:"#3498db" }],
  "Cameroon": [{ name:"야운데", lat:3.87, lng:11.52, emoji:"🌍", color:"#2ecc71" }],
  "Central African Republic": [{ name:"방기", lat:4.36, lng:18.56, emoji:"🌍", color:"#e67e22" }],
  "Chad": [{ name:"은자메나", lat:12.13, lng:15.05, emoji:"🌍", color:"#f39c12" }],
  "Comoros": [{ name:"모로니", lat:-11.70, lng:43.26, emoji:"🏝️", color:"#3498db" }],
  "Democratic Republic of the Congo": [{ name:"킨샤사", lat:-4.44, lng:15.27, emoji:"🌍", color:"#2ecc71" }],
  "Djibouti": [{ name:"지부티시", lat:11.59, lng:43.15, emoji:"🏙️", color:"#e74c3c" }],
  "El Salvador": [{ name:"산살바도르", lat:13.69, lng:-89.19, emoji:"🌋", color:"#3498db" }],
  "Equatorial Guinea": [{ name:"말라보", lat:3.75, lng:8.78, emoji:"🌍", color:"#2ecc71" }],
  "Eritrea": [{ name:"아스마라", lat:15.34, lng:38.93, emoji:"🏛️", color:"#e74c3c" }],
  "Eswatini": [{ name:"음바바네", lat:-26.31, lng:31.14, emoji:"🌍", color:"#9b59b6" }],
  "Gabon": [{ name:"리브르빌", lat:0.39, lng:9.45, emoji:"🌿", color:"#2ecc71" }],
  "Gambia": [{ name:"반줄", lat:13.45, lng:-16.58, emoji:"🌍", color:"#f39c12" }],
  "Guinea": [{ name:"코나크리", lat:9.64, lng:-13.58, emoji:"🌍", color:"#e67e22" }],
  "Guinea-Bissau": [{ name:"비사우", lat:11.86, lng:-15.60, emoji:"🌍", color:"#2ecc71" }],
  "Guyana": [{ name:"조지타운", lat:6.80, lng:-58.16, emoji:"🌿", color:"#2ecc71" }],
  "Haiti": [{ name:"포르토프랭스", lat:18.54, lng:-72.34, emoji:"🏙️", color:"#e74c3c" }],
  "Honduras": [{ name:"테구시갈파", lat:14.07, lng:-87.19, emoji:"🌋", color:"#3498db" }],
  "Iraq": [{ name:"바그다드", lat:33.31, lng:44.37, emoji:"🕌", color:"#e67e22" }],
  "Ivory Coast": [{ name:"아비장", lat:5.36, lng:-4.01, emoji:"🌍", color:"#f39c12" }],
  "Kosovo": [{ name:"프리슈티나", lat:42.66, lng:21.17, emoji:"🏛️", color:"#3498db" }],
  "Kuwait": [{ name:"쿠웨이트시티", lat:29.38, lng:47.99, emoji:"🏙️", color:"#f39c12" }],
  "Kyrgyzstan": [{ name:"비슈케크", lat:42.87, lng:74.59, emoji:"🏔️", color:"#3498db" }],
  "Lesotho": [{ name:"마세루", lat:-29.31, lng:27.48, emoji:"🏔️", color:"#2ecc71" }],
  "Liberia": [{ name:"몬로비아", lat:6.30, lng:-10.80, emoji:"🌍", color:"#e74c3c" }],
  "Libya": [{ name:"트리폴리", lat:32.90, lng:13.18, emoji:"🏛️", color:"#e67e22" }],
  "Malawi": [{ name:"릴롱궤", lat:-13.97, lng:33.79, emoji:"🌍", color:"#2ecc71" }],
  "Mali": [{ name:"바마코", lat:12.64, lng:-8.00, emoji:"🌍", color:"#f39c12" }],
  "Mauritania": [{ name:"누악쇼트", lat:18.09, lng:-15.98, emoji:"🏜️", color:"#e67e22" }],
  "Moldova": [{ name:"키시나우", lat:47.01, lng:28.86, emoji:"🏛️", color:"#9b59b6" }],
  "Mozambique": [{ name:"마푸토", lat:-25.97, lng:32.57, emoji:"🌍", color:"#e74c3c" }],
  "Nicaragua": [{ name:"마나과", lat:12.11, lng:-86.24, emoji:"🌋", color:"#3498db" }],
  "Niger": [{ name:"니아메", lat:13.51, lng:2.11, emoji:"🌍", color:"#f39c12" }],
  "Nigeria": [{ name:"라고스", lat:6.52, lng:3.38, emoji:"🏙️", color:"#2ecc71" }, { name:"아부자", lat:9.06, lng:7.49, emoji:"🏛️", color:"#e74c3c" }],
  "North Korea": [{ name:"평양", lat:39.02, lng:125.75, emoji:"🏛️", color:"#e74c3c" }],
  "North Macedonia": [{ name:"스코페", lat:41.99, lng:21.43, emoji:"🏛️", color:"#e67e22" },
    { name:"오흐리드", lat:41.12, lng:20.80, emoji:"🏖️", color:"#3498db" }],
  "Papua New Guinea": [{ name:"포트모르즈비", lat:-6.31, lng:147.15, emoji:"🌿", color:"#2ecc71" }],
  "Paraguay": [{ name:"아순시온", lat:-25.26, lng:-57.58, emoji:"🏙️", color:"#3498db" }],
  "Republic of the Congo": [{ name:"브라자빌", lat:-4.27, lng:15.28, emoji:"🌍", color:"#2ecc71" }],
  "Sierra Leone": [{ name:"프리타운", lat:8.47, lng:-13.23, emoji:"🌍", color:"#f39c12" }],
  "Somalia": [{ name:"모가디슈", lat:2.05, lng:45.32, emoji:"🌍", color:"#e74c3c" }],
  "South Sudan": [{ name:"주바", lat:4.85, lng:31.60, emoji:"🌍", color:"#2ecc71" }],
  "Sudan": [{ name:"하르툼", lat:15.50, lng:32.56, emoji:"🏜️", color:"#e67e22" }],
  "Suriname": [{ name:"파라마리보", lat:5.85, lng:-55.20, emoji:"🌿", color:"#2ecc71" }],
  "Syria": [{ name:"다마스쿠스", lat:33.51, lng:36.29, emoji:"🕌", color:"#e67e22" }],
  "Tajikistan": [{ name:"두샨베", lat:38.56, lng:68.77, emoji:"🏔️", color:"#3498db" }],
  "Timor-Leste": [{ name:"딜리", lat:-8.56, lng:125.57, emoji:"🏝️", color:"#e74c3c" }],
  "Togo": [{ name:"로메", lat:6.14, lng:1.21, emoji:"🌍", color:"#f39c12" }],
  "Trinidad and Tobago": [{ name:"포트오브스페인", lat:10.65, lng:-61.51, emoji:"🎵", color:"#e74c3c" }],
  "Turkmenistan": [{ name:"아시가바트", lat:37.96, lng:58.38, emoji:"🏛️", color:"#f39c12" }],
  "Uganda": [{ name:"캄팔라", lat:0.35, lng:32.58, emoji:"🌍", color:"#2ecc71" }],
  "Uruguay": [{ name:"몬테비데오", lat:-34.88, lng:-56.16, emoji:"🏙️", color:"#3498db" }],
  "Venezuela": [{ name:"카라카스", lat:10.49, lng:-66.88, emoji:"🏙️", color:"#e74c3c" }],
  "Yemen": [{ name:"사나", lat:15.35, lng:44.21, emoji:"🕌", color:"#e67e22" }],
  "Zambia": [{ name:"루사카", lat:-15.39, lng:28.32, emoji:"🌍", color:"#2ecc71" }],
}


// 국가명 한국어 매핑
// 국가명 다국어 번역 (Intl.DisplayNames 기반)
const COUNTRY_ISO = {
"South Korea":"KR","Japan":"JP","China":"CN","France":"FR","United States of America":"US",
"Australia":"AU","United Arab Emirates":"AE","Italy":"IT","Thailand":"TH","Egypt":"EG",
"Brazil":"BR","Morocco":"MA","Spain":"ES","South Africa":"ZA","Indonesia":"ID",
"United Kingdom":"GB","Turkey":"TR","Greece":"GR","Peru":"PE","Jordan":"JO",
"Netherlands":"NL","India":"IN","Germany":"DE","Vietnam":"VN","Argentina":"AR",
"Mexico":"MX","Colombia":"CO","Portugal":"PT","Czechia":"CZ","Austria":"AT",
"Switzerland":"CH","Croatia":"HR","Hungary":"HU","Poland":"PL","Cambodia":"KH",
"Malaysia":"MY","Singapore":"SG","Philippines":"PH","Myanmar":"MM","Nepal":"NP",
"Sri Lanka":"LK","Cuba":"CU","Chile":"CL","Canada":"CA","New Zealand":"NZ",
"Norway":"NO","Sweden":"SE","Denmark":"DK","Finland":"FI","Iceland":"IS",
"Russia":"RU","Kenya":"KE","Tanzania":"TZ","Israel":"IL","Taiwan":"TW",
"Ireland":"IE","Belgium":"BE","Maldives":"MV","Saudi Arabia":"SA","Iran":"IR",
"Uzbekistan":"UZ","Laos":"LA","Mongolia":"MN","Romania":"RO","Georgia":"GE",
"Ecuador":"EC","Bolivia":"BO","Ethiopia":"ET","Ghana":"GH","Panama":"PA",
"Montenegro":"ME","Tunisia":"TN","Oman":"OM","Qatar":"QA","Costa Rica":"CR","Slovenia":"SI",
"Dominican Republic":"DO","Guatemala":"GT","Jamaica":"JM","Latvia":"LV",
"Lithuania":"LT","Estonia":"EE","Cyprus":"CY","Albania":"AL","Serbia":"RS",
"Namibia":"NA","Zimbabwe":"ZW","Fiji":"FJ","Madagascar":"MG","Mauritius":"MU",
"Lebanon":"LB","Ukraine":"UA","Pakistan":"PK","Luxembourg":"LU","Slovakia":"SK",
"Bulgaria":"BG","Rwanda":"RW","Senegal":"SN","Kazakhstan":"KZ",
"Afghanistan":"AF","Algeria":"DZ","Angola":"AO","Armenia":"AM","Azerbaijan":"AZ",
"Bahrain":"BH","Bangladesh":"BD","Belarus":"BY","Belize":"BZ","Benin":"BJ",
"Bhutan":"BT","Bosnia and Herzegovina":"BA","Botswana":"BW","Brunei":"BN",
"Burkina Faso":"BF","Burundi":"BI","Cabo Verde":"CV","Cameroon":"CM",
"Central African Republic":"CF","Chad":"TD","Comoros":"KM",
"Democratic Republic of the Congo":"CD","Djibouti":"DJ","El Salvador":"SV",
"Equatorial Guinea":"GQ","Eritrea":"ER","Eswatini":"SZ","Gabon":"GA",
"Gambia":"GM","Guinea":"GN","Guinea-Bissau":"GW","Guyana":"GY","Haiti":"HT",
"Honduras":"HN","Iraq":"IQ","Ivory Coast":"CI","Kosovo":"XK","Kuwait":"KW",
"Kyrgyzstan":"KG","Lesotho":"LS","Liberia":"LR","Libya":"LY","Malawi":"MW",
"Mali":"ML","Mauritania":"MR","Moldova":"MD","Mozambique":"MZ","Nicaragua":"NI",
"Niger":"NE","Nigeria":"NG","North Korea":"KP","North Macedonia":"MK",
"Papua New Guinea":"PG","Paraguay":"PY","Republic of the Congo":"CG",
"Sierra Leone":"SL","Somalia":"SO","South Sudan":"SS","Sudan":"SD",
"Suriname":"SR","Syria":"SY","Tajikistan":"TJ","Timor-Leste":"TL","Togo":"TG",
"Trinidad and Tobago":"TT","Turkmenistan":"TM","Uganda":"UG","Uruguay":"UY",
"Venezuela":"VE","Yemen":"YE","Zambia":"ZM",
}
// Intl이 반환하는 공식명 대신 관용명을 쓰는 경우 (선택적 오버라이드)
const COUNTRY_NAME_OVERRIDE = {
  KR:{ko:"대한민국"},US:{ko:"미국",ja:"アメリカ"},GB:{ko:"영국"},CN:{ko:"중국"},
  AE:{ko:"아랍에미리트"},ZA:{ko:"남아공",ja:"南アフリカ"},NZ:{ko:"뉴질랜드"},
}

const intlRegionMap = lang => lang === 'zh' ? 'zh-Hans' : lang
const getCountryDisplayName = (enName, targetLang) => {
  if (targetLang === 'en') return enName
  const iso = COUNTRY_ISO[enName]
  if (!iso) return enName
  const override = COUNTRY_NAME_OVERRIDE[iso]?.[targetLang]
  if (override) return override
  try { return new Intl.DisplayNames([intlRegionMap(targetLang)], {type:'region'}).of(iso) }
  catch { return enName }
}

const LANG_OPTIONS = [
  { code:'en', label:'English', flag:'🇺🇸' },
  { code:'ko', label:'한국어', flag:'🇰🇷' },
  { code:'ja', label:'日本語', flag:'🇯🇵' },
  { code:'zh', label:'中文', flag:'🇨🇳' },
]

// UI 번역 문자열
const T = {
  appSub:{ko:'세계 여행 탐험가',en:'World Travel Explorer',ja:'世界旅行エクスプローラー',zh:'世界旅行探索家'},
  search:{ko:'도시, 국가, 관광지 검색…',en:'Search city, country, attraction…',ja:'都市・国・観光地を検索…',zh:'搜索城市、国家、景点…'},
  nCities:{ko:'개 도시',en:' cities',ja:'都市',zh:'个城市'},
  countryInfo:{ko:'국가정보',en:'Country Info',ja:'国情報',zh:'国家信息'},
  close:{ko:'✕',en:'✕',ja:'✕',zh:'✕'},
  hintMain:{ko:'✦ 나라를 클릭하면 도시 핀이 나타납니다 · 드래그로 지구 회전',en:'✦ Click a country to see city pins · Drag to rotate the globe',ja:'✦ 国をクリックで都市ピン表示 · ドラッグで地球回転',zh:'✦ 点击国家显示城市标记 · 拖拽旋转地球'},
  hintCity:{ko:'핀을 클릭하세요',en:'Click a pin',ja:'ピンをクリック',zh:'点击标记'},
  clickExplore:{ko:'클릭하여 도시 탐색',en:'Click to explore cities',ja:'クリックして都市を探索',zh:'点击探索城市'},
  noCity:{ko:'등록된 도시 정보가 없습니다',en:'No city data available',ja:'登録都市情報なし',zh:'暂无城市信息'},
  spots:{ko:'추천 관광지',en:'Top Attractions',ja:'おすすめ観光地',zh:'推荐景点'},
  spotsUnit:{ko:'곳',en:'',ja:'ヶ所',zh:'处'},
  loading:{ko:'관광 정보 불러오는 중...',en:'Loading travel info...',ja:'観光情報を読み込み中...',zh:'正在加载旅游信息...'},
  loadingShort:{ko:'관광 정보를 불러오는 중입니다...',en:'Loading travel information...',ja:'観光情報を読み込んでいます...',zh:'正在加载旅游信息...'},
  retry:{ko:'다시 불러오기',en:'Retry',ja:'再読み込み',zh:'重新加载'},
  retryMsg:{ko:'관광 정보를 불러오지 못했어요.\n다시 시도해볼게요!',en:'Failed to load travel info.\nLet us try again!',ja:'観光情報の取得に失敗しました。\nもう一度お試しください！',zh:'加载旅游信息失败。\n让我们再试一次！'},
  mapsBtn:{ko:'최신 운영시간 · 리뷰 보기',en:'Hours · Reviews on Maps',ja:'最新営業時間・レビュー',zh:'最新营业时间·评价'},
  official:{ko:'공식 홈페이지',en:'Official Site',ja:'公式サイト',zh:'官方网站'},
  wikiDetail:{ko:'상세 정보',en:'Details',ja:'詳細情報',zh:'详细信息'},
  refNote:{ko:'*참고용',en:'*Reference',ja:'*参考',zh:'*仅供参考'},
  humidity:{ko:'습도',en:'Humidity',ja:'湿度',zh:'湿度'},
  cityInfoHint:{ko:'✦ 지도 위 도시 핀을 클릭하면 관광 정보를 볼 수 있어요',en:'✦ Click a city pin on the map to see travel info',ja:'✦ 地図上の都市ピンをクリックで観光情報を表示',zh:'✦ 点击地图上的城市标记查看旅游信息'},
  errTitle:{ko:'잠시 오류가 발생했어요',en:'Something went wrong',ja:'エラーが発生しました',zh:'出现了一些问题'},
  errBtn:{ko:'새로고침',en:'Refresh',ja:'リロード',zh:'刷新'},
  lCapital:{ko:'수도',en:'Capital',ja:'首都',zh:'首都'},
  lPop:{ko:'인구',en:'Population',ja:'人口',zh:'人口'},
  lArea:{ko:'면적',en:'Area',ja:'面積',zh:'面积'},
  lLang:{ko:'언어',en:'Language',ja:'言語',zh:'语言'},
  lCurrency:{ko:'통화',en:'Currency',ja:'通貨',zh:'货币'},
  lTimezone:{ko:'시간대',en:'Timezone',ja:'時間帯',zh:'时区'},
  lBestSeason:{ko:'추천 여행 시기',en:'Best Season',ja:'おすすめ季節',zh:'最佳旅游季节'},
  lVisa:{ko:'비자(한국)',en:'Visa (Korea)',ja:'ビザ(韓国)',zh:'签证(韩国)'},
  lVoltage:{ko:'전압',en:'Voltage',ja:'電圧',zh:'电压'},
  lCallCode:{ko:'국가번호',en:'Dial code',ja:'国番号',zh:'国际区号'},
  lDrive:{ko:'운전방향',en:'Driving side',ja:'走行方向',zh:'行驶方向'},
  lCityCount:{ko:'도시 수',en:'Cities',ja:'都市数',zh:'城市数'},
  registered:{ko:'개 등록',en:' listed',ja:'件登録',zh:'个已录入'},
  // ── 코스 플래너 번역 ──
  myCourse:{ko:'내 코스',en:'My Course',ja:'マイコース',zh:'我的路线'},
  coursePlanner:{ko:'코스 플래너',en:'Course Planner',ja:'コースプランナー',zh:'行程规划'},
  coursePlace:{ko:'곳',en:' places',ja:'ヶ所',zh:'处'},
  courseDay:{ko:'일',en:' days',ja:'日間',zh:'天'},
  courseDeleteAll:{ko:'전체삭제',en:'Clear all',ja:'全削除',zh:'全部删除'},
  courseDownloadPPT:{ko:'PPT',en:'PPT',ja:'PPT',zh:'PPT'},
  courseDownloadWord:{ko:'Word',en:'Word',ja:'Word',zh:'Word'},
  courseDeleteConfirm:{ko:'코스를 모두 비울까요?',en:'Clear all course items?',ja:'コースを全て削除しますか？',zh:'清空所有路线？'},
  courseComplete:{ko:'✓ 완료',en:'✓ Done',ja:'✓ 完了',zh:'✓ 完成'},
  courseEmptyTitle:{ko:'이 날에 장소가 없습니다',en:'No places for this day',ja:'この日の予定はありません',zh:'这一天没有安排'},
  courseEmptyDesc:{ko:'다른 Day에서 이동하거나 지도에서 ＋ 버튼으로 추가하세요',en:'Move from another day or add from the map with ＋',ja:'他のDayから移動するか、地図の＋で追加してください',zh:'从其他天移动或在地图上用＋添加'},
  courseMove:{ko:'이동',en:'Move',ja:'移動',zh:'移动'},
  courseDelete:{ko:'삭제',en:'Delete',ja:'削除',zh:'删除'},
  courseTotal:{ko:'총',en:'Total',ja:'合計',zh:'共'},
  courseHour:{ko:'시간',en:'h',ja:'時間',zh:'小时'},
  courseMin:{ko:'분',en:'m',ja:'分',zh:'分钟'},
  courseAddToTrip:{ko:'코스에 추가',en:'Add to course',ja:'コースに追加',zh:'添加到路线'},
  favToggle:{ko:'즐겨찾기',en:'Favorite',ja:'お気に入り',zh:'收藏'},
  aiAutoGen:{ko:'AI 코스 자동 생성',en:'AI auto-generate',ja:'AIコース自動生成',zh:'AI自动生成路线'},
  mapsRating:{ko:'Google Maps에서 최신 별점 확인',en:'Check rating on Google Maps',ja:'Google Mapsで最新評価を確認',zh:'在Google Maps上查看最新评分'},
  multiSelect:{ko:'중복 선택 가능',en:'Multi-select',ja:'複数選択可',zh:'可多选'},
  aiSummaryIn:{ko:'에서',en:' —',ja:'で',zh:'，'},
  aiSummaryDuring:{ko:' 동안',en:'',ja:'',zh:''},
  courseDeparture:{ko:'출발일',en:'Departure',ja:'出発日',zh:'出发日'},
  courseDepartureOpt:{ko:'출발일 (선택)',en:'Departure date (optional)',ja:'出発日（任意）',zh:'出发日（选填）'},
  courseSpot:{ko:'관광지',en:'Attraction',ja:'観光地',zh:'景点'},
  courseHotspot:{ko:'핫플',en:'Hot spot',ja:'ホットスポット',zh:'热门'},
  courseRestaurant:{ko:'맛집',en:'Restaurant',ja:'グルメ',zh:'美食'},
  courseTransit:{ko:'대중교통',en:'Transit',ja:'公共交通',zh:'公共交通'},
  courseWalking:{ko:'도보',en:'Walking',ja:'徒歩',zh:'步行'},
  courseDriving:{ko:'차량',en:'Driving',ja:'車',zh:'驾车'},
  courseNoRoute:{ko:'경로 없음',en:'No route',ja:'ルートなし',zh:'无路线'},
  courseCalc:{ko:'경로 계산 중...',en:'Calculating...',ja:'ルート計算中...',zh:'计算路线...'},
  // ── AI 코스 생성 번역 ──
  aiCourse:{ko:'AI 코스 생성',en:'AI Course',ja:'AIコース生成',zh:'AI路线生成'},
  aiTitle:{ko:'AI 코스 자동 생성',en:'AI Course Generator',ja:'AIコース自動生成',zh:'AI路线自动生成'},
  aiSubtitle:{ko:'도시와 조건을 선택하면 최적 코스를 짜드려요',en:'Select city & options to generate the best itinerary',ja:'都市と条件を選択して最適コースを作成',zh:'选择城市和条件，生成最佳路线'},
  aiSelectCity:{ko:'도시 선택',en:'Select City',ja:'都市を選択',zh:'选择城市'},
  aiSearchCity:{ko:'도시 이름 검색 (예: 파리, Tokyo, 서울)',en:'Search city (e.g. Paris, Tokyo, Seoul)',ja:'都市名で検索（例：パリ、東京）',zh:'搜索城市（如：巴黎、东京、首尔）'},
  aiTheme:{ko:'관광 테마',en:'Travel Theme',ja:'観光テーマ',zh:'旅游主题'},
  aiThemeAll:{ko:'종합',en:'All',ja:'総合',zh:'综合'},
  aiThemeHistory:{ko:'역사',en:'History',ja:'歴史',zh:'历史'},
  aiThemeNature:{ko:'자연',en:'Nature',ja:'自然',zh:'自然'},
  aiThemeFood:{ko:'음식',en:'Food',ja:'グルメ',zh:'美食'},
  aiThemeHotspot:{ko:'핫플',en:'Hot Place',ja:'注目スポット',zh:'热门'},
  aiThemeRestaurant:{ko:'맛집',en:'Restaurant',ja:'名店',zh:'美食店'},
  aiDaysLabel:{ko:'여행 일수',en:'Trip Days',ja:'旅行日数',zh:'旅行天数'},
  aiDayUnit:{ko:'일',en:'D',ja:'日',zh:'天'},
  aiHoursLabel:{ko:'관광 시간',en:'Tour Hours',ja:'観光時間',zh:'游览时间'},
  aiHourUnit:{ko:'시간',en:'h',ja:'時間',zh:'小时'},
  aiPreview1h:{ko:' 1시간 핵심만 빠르게',en:' 1h quick highlights',ja:' 1時間でハイライトのみ',zh:' 1小时快速精华'},
  aiPreview2h:{ko:' 2시간 주요 명소 위주',en:' 2h main attractions',ja:' 2時間で主要スポット',zh:' 2小时主要景点'},
  aiPreview4h:{ko:' 4시간 알차게',en:' 4h solid itinerary',ja:' 4時間しっかり巡る',zh:' 4小时充实游'},
  aiPreview6h:{ko:' 6시간 깊이 있게',en:' 6h in-depth tour',ja:' 6時間じっくり巡る',zh:' 6小时深度游'},
  aiPreview8h:{ko:' 8시간 하루 종일',en:' 8h full day tour',ja:' 8時間終日ツアー',zh:' 8小时全天游'},
  aiTransport:{ko:'이동 수단',en:'Transport',ja:'移動手段',zh:'交通方式'},
  aiGenerate:{ko:'코스 자동 생성',en:'Generate Course',ja:'コース自動生成',zh:'自动生成路线'},
  aiGenerating:{ko:'코스 생성 중...',en:'Generating...',ja:'コース生成中...',zh:'正在生成路线...'},
  aiPreviewText:{ko:'코스를 생성합니다.',en:'will be generated.',ja:'コースを生成します。',zh:'的路线。'},
  // ── 사이드 패널 번역 ──
  hotspots:{ko:'핫플레이스',en:'Hot Places',ja:'ホットプレイス',zh:'热门景点'},
  hotTab:{ko:'🔥핫플',en:'🔥Hot',ja:'🔥注目',zh:'🔥热门'},
  foodTab:{ko:'🍽맛집',en:'🍽Food',ja:'🍽グルメ',zh:'🍽美食'},
  foodRestaurant:{ko:'음식점',en:'Restaurant',ja:'レストラン',zh:'餐厅'},
  foodCafe:{ko:'카페',en:'Café',ja:'カフェ',zh:'咖啡'},
  foodBar:{ko:'술집',en:'Bar',ja:'バー',zh:'酒吧'},
  openNow:{ko:'● 영업중',en:'● Open',ja:'● 営業中',zh:'● 营业中'},
  closedNow:{ko:'● 영업종료',en:'● Closed',ja:'● 営業終了',zh:'● 已关闭'},
  noData:{ko:'데이터가 없습니다',en:'No data available',ja:'データがありません',zh:'暂无数据'},
  // ── 공유/즐겨찾기 번역 ──
  linkCopy:{ko:'🔗 링크 복사',en:'🔗 Copy Link',ja:'🔗 リンクコピー',zh:'🔗 复制链接'},
  shareBtn:{ko:'📤 공유하기',en:'📤 Share',ja:'📤 共有',zh:'📤 分享'},
  shareTitle:{ko:'공유하기',en:'Share',ja:'共有する',zh:'分享'},
  favTitle:{ko:'⭐ 즐겨찾기',en:'⭐ Favorites',ja:'⭐ お気に入り',zh:'⭐ 收藏'},
  favDeleteAll:{ko:'전체 삭제',en:'Clear all',ja:'全削除',zh:'全部删除'},
  favEmpty:{ko:'즐겨찾기가 없습니다',en:'No favorites yet',ja:'お気に入りなし',zh:'暂无收藏'},
  favDeleteConfirm:{ko:'즐겨찾기를 모두 삭제할까요?',en:'Delete all favorites?',ja:'お気に入りを全削除しますか？',zh:'删除所有收藏？'},
  favCity:{ko:'도시',en:'Cities',ja:'都市',zh:'城市'},
  favSpot:{ko:'관광지',en:'Attractions',ja:'観光地',zh:'景点'},
  favHotspot:{ko:'핫플레이스',en:'Hot Places',ja:'ホットスポット',zh:'热门'},
  favFood:{ko:'맛집',en:'Restaurants',ja:'グルメ',zh:'美食'},
  linkCopied:{ko:'✅ 링크가 복사되었습니다!',en:'✅ Link copied!',ja:'✅ リンクをコピーしました！',zh:'✅ 链接已复制！'},
  linkCopyFail:{ko:'링크 복사에 실패했습니다',en:'Failed to copy link',ja:'リンクのコピーに失敗しました',zh:'复制链接失败'},
  linkCopiedKakao:{ko:'✅ 링크가 복사되었습니다! 카카오톡에 붙여넣기 해주세요.',en:'✅ Link copied! Paste it in KakaoTalk.',ja:'✅ リンクをコピーしました！KakaoTalkに貼り付けてください。',zh:'✅ 链接已复制！请粘贴到KakaoTalk。'},
  linkCopiedInsta:{ko:'✅ 링크가 복사되었습니다! 인스타그램 DM이나 스토리에 붙여넣기 해주세요.',en:'✅ Link copied! Paste it in Instagram DM or Story.',ja:'✅ リンクをコピーしました！Instagram DMかストーリーに貼り付けてください。',zh:'✅ 链接已复制！请粘贴到Instagram私信或故事。'},
  shareText:{ko:'의 핫플레이스와 맛집을 확인해보세요!',en:' — Check out the hotspots and restaurants!',ja:'のホットスポットとグルメをチェック！',zh:'的热门景点和美食等你来！'},
  shareTitleSuffix:{ko:' - ATLAS 여행 가이드',en:' - ATLAS Travel Guide',ja:' - ATLAS 旅行ガイド',zh:' - ATLAS 旅行指南'},
  // ── 메뉴 번역 ──
  menuTitle:{ko:'메뉴',en:'Menu',ja:'メニュー',zh:'菜单'},
  menuSavedCourses:{ko:'저장된 코스',en:'Saved Courses',ja:'保存済みコース',zh:'已保存路线'},
  menuNoSaved:{ko:'저장된 코스가 없습니다',en:'No saved courses',ja:'保存済みコースなし',zh:'暂无保存路线'},
  courseSave:{ko:'코스 저장하기',en:'Save Course',ja:'コース保存',zh:'保存路线'},
  courseSaved:{ko:'✅ 코스가 저장되었습니다!',en:'✅ Course saved!',ja:'✅ コースを保存しました！',zh:'✅ 路线已保存！'},
  courseLoad:{ko:'불러오기',en:'Load',ja:'読込',zh:'加载'},
  courseTypeManual:{ko:'수동',en:'Manual',ja:'手動',zh:'手动'},
  courseTypeAi:{ko:'AI',en:'AI',ja:'AI',zh:'AI'},
}

// 관광지 유형 번역
const SPOT_TYPE_I18N = {
  "역사":{en:"History",ja:"歴史",zh:"历史"},
  "문화":{en:"Culture",ja:"文化",zh:"文化"},
  "자연":{en:"Nature",ja:"自然",zh:"自然"},
  "음식":{en:"Food",ja:"グルメ",zh:"美食"},
  "랜드마크":{en:"Landmark",ja:"ランドマーク",zh:"地标"},
  "도시":{en:"City",ja:"都市",zh:"城市"},
}


// 도시명 다국어 [en, ja, zh]
const CITY_I18N = {
// 한국
"서울":["Seoul","ソウル","首尔"],"부산":["Busan","釜山","釜山"],"제주":["Jeju","済州","济州"],"경주":["Gyeongju","慶州","庆州"],"인천":["Incheon","仁川","仁川"],"대구":["Daegu","大邱","大邱"],"전주":["Jeonju","全州","全州"],"강릉":["Gangneung","江陵","江陵"],"수원":["Suwon","水原","水原"],"광주":["Gwangju","光州","光州"],"여수":["Yeosu","麗水","丽水"],"속초":["Sokcho","束草","束草"],"통영":["Tongyeong","統営","统营"],
// 일본
"도쿄":["Tokyo","東京","东京"],"교토":["Kyoto","京都","京都"],"오사카":["Osaka","大阪","大阪"],"삿포로":["Sapporo","札幌","札幌"],"나라":["Nara","奈良","奈良"],"나고야":["Nagoya","名古屋","名古屋"],"후쿠오카":["Fukuoka","福岡","福冈"],"히로시마":["Hiroshima","広島","广岛"],"고베":["Kobe","神戸","神户"],"오키나와":["Okinawa","沖縄","冲绳"],"가나자와":["Kanazawa","金沢","金泽"],"하코네":["Hakone","箱根","箱根"],
// 중국
"베이징":["Beijing","北京","北京"],"상하이":["Shanghai","上海","上海"],"시안":["Xi'an","西安","西安"],"구이린":["Guilin","桂林","桂林"],"청두":["Chengdu","成都","成都"],"항저우":["Hangzhou","杭州","杭州"],"장자제":["Zhangjiajie","張家界","张家界"],"리장":["Lijiang","麗江","丽江"],"황산":["Huangshan","黄山","黄山"],"홍콩":["Hong Kong","香港","香港"],"마카오":["Macau","マカオ","澳门"],"쑤저우":["Suzhou","蘇州","苏州"],
// 프랑스
"파리":["Paris","パリ","巴黎"],"니스":["Nice","ニース","尼斯"],"리옹":["Lyon","リヨン","里昂"],"보르도":["Bordeaux","ボルドー","波尔多"],"마르세유":["Marseille","マルセイユ","马赛"],"몽생미셸":["Mont-Saint-Michel","モン・サン・ミシェル","圣米歇尔山"],"스트라스부르":["Strasbourg","ストラスブール","斯特拉斯堡"],"앙시":["Annecy","アヌシー","安纳西"],"툴루즈":["Toulouse","トゥールーズ","图卢兹"],
// 이탈리아
"로마":["Rome","ローマ","罗马"],"베네치아":["Venice","ヴェネツィア","威尼斯"],"피렌체":["Florence","フィレンツェ","佛罗伦萨"],"밀라노":["Milan","ミラノ","米兰"],"나폴리":["Naples","ナポリ","那不勒斯"],"아말피":["Amalfi","アマルフィ","阿马尔菲"],"시칠리아":["Sicily","シチリア","西西里"],"친퀘테레":["Cinque Terre","チンクエテッレ","五渔村"],"볼로냐":["Bologna","ボローニャ","博洛尼亚"],"시에나":["Siena","シエナ","锡耶纳"],"폼페이":["Pompeii","ポンペイ","庞贝"],
// 스페인
"바르셀로나":["Barcelona","バルセロナ","巴塞罗那"],"마드리드":["Madrid","マドリード","马德里"],"세비야":["Seville","セビリア","塞维利亚"],"그라나다":["Granada","グラナダ","格拉纳达"],"발렌시아":["Valencia","バレンシア","巴伦西亚"],"빌바오":["Bilbao","ビルバオ","毕尔巴鄂"],"산세바스티안":["San Sebastián","サンセバスチャン","圣塞巴斯蒂安"],"말라가":["Málaga","マラガ","马拉加"],"톨레도":["Toledo","トレド","托莱多"],"산티아고데콤포스텔라":["Santiago de Compostela","サンティアゴ・デ・コンポステーラ","圣地亚哥-德孔波斯特拉"],
// 독일
"베를린":["Berlin","ベルリン","柏林"],"뮌헨":["Munich","ミュンヘン","慕尼黑"],"함부르크":["Hamburg","ハンブルク","汉堡"],"로텐부르크":["Rothenburg","ローテンブルク","罗滕堡"],"프랑크푸르트":["Frankfurt","フランクフルト","法兰克福"],"쾰른":["Cologne","ケルン","科隆"],"드레스덴":["Dresden","ドレスデン","德累斯顿"],"하이델베르크":["Heidelberg","ハイデルベルク","海德堡"],"퓌센":["Füssen","フュッセン","菲森"],
// 영국
"런던":["London","ロンドン","伦敦"],"에든버러":["Edinburgh","エディンバラ","爱丁堡"],"맨체스터":["Manchester","マンチェスター","曼彻斯特"],"바스":["Bath","バース","巴斯"],"옥스퍼드":["Oxford","オックスフォード","牛津"],"케임브리지":["Cambridge","ケンブリッジ","剑桥"],"요크":["York","ヨーク","约克"],"리버풀":["Liverpool","リバプール","利物浦"],"코츠월즈":["Cotswolds","コッツウォルズ","科茨沃尔德"],"글래스고":["Glasgow","グラスゴー","格拉斯哥"],
// 미국
"뉴욕":["New York","ニューヨーク","纽约"],"로스앤젤레스":["Los Angeles","ロサンゼルス","洛杉矶"],"샌프란시스코":["San Francisco","サンフランシスコ","旧金山"],"라스베이거스":["Las Vegas","ラスベガス","拉斯维加斯"],"마이애미":["Miami","マイアミ","迈阿密"],"시카고":["Chicago","シカゴ","芝加哥"],"워싱턴DC":["Washington D.C.","ワシントンD.C.","华盛顿"],"보스턴":["Boston","ボストン","波士顿"],"뉴올리언스":["New Orleans","ニューオーリンズ","新奥尔良"],"시애틀":["Seattle","シアトル","西雅图"],"하와이":["Hawaii","ハワイ","夏威夷"],"그랜드캐니언":["Grand Canyon","グランドキャニオン","大峡谷"],"옐로스톤":["Yellowstone","イエローストーン","黄石"],"샌디에이고":["San Diego","サンディエゴ","圣迭戈"],"덴버":["Denver","デンバー","丹佛"],"내슈빌":["Nashville","ナッシュビル","纳什维尔"],"포틀랜드":["Portland","ポートランド","波特兰"],"피닉스":["Phoenix","フェニックス","凤凰城"],"올랜도":["Orlando","オーランド","奥兰多"],"나이아가라폭포":["Niagara Falls","ナイアガラの滝","尼亚加拉大瀑布"],
// 호주
"시드니":["Sydney","シドニー","悉尼"],"멜버른":["Melbourne","メルボルン","墨尔本"],"케언즈":["Cairns","ケアンズ","凯恩斯"],"울루루":["Uluru","ウルル","乌卢鲁"],"브리즈번":["Brisbane","ブリスベン","布里斯班"],"퍼스":["Perth","パース","珀斯"],"골드코스트":["Gold Coast","ゴールドコースト","黄金海岸"],"그레이트배리어리프":["Great Barrier Reef","グレートバリアリーフ","大堡礁"],"태즈메이니아":["Tasmania","タスマニア","塔斯马尼亚"],
// 태국
"방콕":["Bangkok","バンコク","曼谷"],"치앙마이":["Chiang Mai","チェンマイ","清迈"],"푸켓":["Phuket","プーケット","普吉岛"],"파타야":["Pattaya","パタヤ","芭提雅"],"코사무이":["Koh Samui","サムイ島","苏梅岛"],"아유타야":["Ayutthaya","アユタヤ","大城"],"크라비":["Krabi","クラビ","甲米"],"치앙라이":["Chiang Rai","チェンライ","清莱"],"코피피":["Koh Phi Phi","ピピ島","皮皮岛"],
// 인도
"뭄바이":["Mumbai","ムンバイ","孟买"],"뉴델리":["New Delhi","ニューデリー","新德里"],"아그라":["Agra","アグラ","阿格拉"],"바라나시":["Varanasi","バラナシ","瓦拉纳西"],"고아":["Goa","ゴア","果阿"],"자이푸르":["Jaipur","ジャイプール","斋浦尔"],"우다이푸르":["Udaipur","ウダイプル","乌代浦尔"],"콜카타":["Kolkata","コルカタ","加尔各答"],"케랄라":["Kerala","ケララ","喀拉拉"],"암리차르":["Amritsar","アムリトサル","阿姆利则"],
// UAE
"두바이":["Dubai","ドバイ","迪拜"],"아부다비":["Abu Dhabi","アブダビ","阿布扎比"],"샤르자":["Sharjah","シャールジャ","沙迦"],
// 터키
"이스탄불":["Istanbul","イスタンブール","伊斯坦布尔"],"카파도키아":["Cappadocia","カッパドキア","卡帕多奇亚"],"파묵칼레":["Pamukkale","パムッカレ","棉花堡"],"안탈리아":["Antalya","アンタルヤ","安塔利亚"],"에페소":["Ephesus","エフェソス","以弗所"],"보드룸":["Bodrum","ボドルム","博德鲁姆"],"트라브존":["Trabzon","トラブゾン","特拉布宗"],
// 그리스
"산토리니":["Santorini","サントリーニ","圣托里尼"],"아테네":["Athens","アテネ","雅典"],"미코노스":["Mykonos","ミコノス","米科诺斯"],"크레타":["Crete","クレタ","克里特"],"로도스":["Rhodes","ロドス","罗德岛"],"코르푸":["Corfu","コルフ","科孚"],"메테오라":["Meteora","メテオラ","迈泰奥拉"],
// 이집트
"카이로":["Cairo","カイロ","开罗"],"룩소르":["Luxor","ルクソール","卢克索"],"아스완":["Aswan","アスワン","阿斯旺"],"알렉산드리아":["Alexandria","アレクサンドリア","亚历山大"],"후르가다":["Hurghada","フルガダ","赫尔格达"],"샤름엘셰이크":["Sharm El Sheikh","シャルム・エル・シェイク","沙姆沙伊赫"],
// 모로코
"마라케시":["Marrakech","マラケシュ","马拉喀什"],"페스":["Fes","フェズ","非斯"],"카사블랑카":["Casablanca","カサブランカ","卡萨布兰卡"],"셰프샤우엔":["Chefchaouen","シャウエン","舍夫沙万"],"에사우이라":["Essaouira","エッサウィラ","索维拉"],"메르주가":["Merzouga","メルズーガ","梅尔祖卡"],
// 베트남
"하노이":["Hanoi","ハノイ","河内"],"호찌민시":["Ho Chi Minh City","ホーチミン","胡志明市"],"하롱베이":["Ha Long Bay","ハロン湾","下龙湾"],"호이안":["Hoi An","ホイアン","会安"],"다낭":["Da Nang","ダナン","岘港"],"후에":["Hue","フエ","顺化"],"사파":["Sapa","サパ","沙巴"],"푸꾸옥":["Phu Quoc","フーコック","富国岛"],"나트랑":["Nha Trang","ニャチャン","芽庄"],"닌빈":["Ninh Binh","ニンビン","宁平"],
// 인도네시아
"발리":["Bali","バリ","巴厘岛"],"자카르타":["Jakarta","ジャカルタ","雅加达"],"족자카르타":["Yogyakarta","ジョグジャカルタ","日惹"],"코모도":["Komodo","コモド","科莫多"],"롬복":["Lombok","ロンボク","龙目岛"],"보로부두르":["Borobudur","ボロブドゥール","婆罗浮屠"],"라자암팟":["Raja Ampat","ラジャ・アンパット","拉贾安帕特"],
// 말레이시아
"쿠알라룸푸르":["Kuala Lumpur","クアラルンプール","吉隆坡"],"페낭":["Penang","ペナン","槟城"],"코타키나발루":["Kota Kinabalu","コタキナバル","哥打京那巴鲁"],"랑카위":["Langkawi","ランカウイ","兰卡威"],"말라카":["Malacca","マラッカ","马六甲"],
// 싱가포르·캄보디아·미얀마
"싱가포르":["Singapore","シンガポール","新加坡"],"씨엠립":["Siem Reap","シェムリアップ","暹粒"],"프놈펜":["Phnom Penh","プノンペン","金边"],"시아누크빌":["Sihanoukville","シアヌークビル","西哈努克"],"양곤":["Yangon","ヤンゴン","仰光"],"바간":["Bagan","バガン","蒲甘"],"만달레이":["Mandalay","マンダレー","曼德勒"],"인레호수":["Inle Lake","インレー湖","茵莱湖"],
// 네팔·스리랑카·필리핀
"카트만두":["Kathmandu","カトマンズ","加德满都"],"포카라":["Pokhara","ポカラ","博卡拉"],"치트완":["Chitwan","チトワン","奇特旺"],"룸비니":["Lumbini","ルンビニ","蓝毗尼"],"콜롬보":["Colombo","コロンボ","科伦坡"],"캔디":["Kandy","キャンディ","康提"],"갈레":["Galle","ゴール","加勒"],"시기리야":["Sigiriya","シーギリヤ","狮子岩"],"누와라엘리야":["Nuwara Eliya","ヌワラエリヤ","努沃勒埃利耶"],"마닐라":["Manila","マニラ","马尼拉"],"팔라완":["Palawan","パラワン","巴拉望"],"보라카이":["Boracay","ボラカイ","长滩岛"],"세부":["Cebu","セブ","宿务"],"시아르가오":["Siargao","シアルガオ","锡亚高"],
// 포르투갈·네덜란드·체코·오스트리아·스위스
"리스본":["Lisbon","リスボン","里斯本"],"포르투":["Porto","ポルト","波尔图"],"신트라":["Sintra","シントラ","辛特拉"],"알가르브":["Algarve","アルガルヴェ","阿尔加维"],"코임브라":["Coimbra","コインブラ","科英布拉"],"마데이라":["Madeira","マデイラ","马德拉"],"암스테르담":["Amsterdam","アムステルダム","阿姆斯特丹"],"로테르담":["Rotterdam","ロッテルダム","鹿特丹"],"헤이그":["The Hague","ハーグ","海牙"],"위트레흐트":["Utrecht","ユトレヒト","乌得勒支"],"마스트리흐트":["Maastricht","マーストリヒト","马斯特里赫特"],"프라하":["Prague","プラハ","布拉格"],"체스키크룸로프":["Český Krumlov","チェスキー・クルムロフ","克鲁姆洛夫"],"브르노":["Brno","ブルノ","布尔诺"],"빈":["Vienna","ウィーン","维也纳"],"잘츠부르크":["Salzburg","ザルツブルク","萨尔茨堡"],"인스브루크":["Innsbruck","インスブルック","因斯布鲁克"],"할슈타트":["Hallstatt","ハルシュタット","哈尔施塔特"],"그라츠":["Graz","グラーツ","格拉茨"],"취리히":["Zurich","チューリッヒ","苏黎世"],"제네바":["Geneva","ジュネーヴ","日内瓦"],"인터라켄":["Interlaken","インターラーケン","因特拉肯"],"루체른":["Lucerne","ルツェルン","卢塞恩"],"체르마트":["Zermatt","ツェルマット","采尔马特"],"베른":["Bern","ベルン","伯尔尼"],
// 헝가리·슬로베니아·크로아티아
"부다페스트":["Budapest","ブダペスト","布达佩斯"],"에게르":["Eger","エゲル","埃格尔"],"류블랴나":["Ljubljana","リュブリャナ","卢布尔雅那"],"블레드":["Bled","ブレッド","布莱德"],"피란":["Piran","ピラン","皮兰"],"마리보르":["Maribor","マリボル","马里博尔"],"두브로브니크":["Dubrovnik","ドゥブロヴニク","杜布罗夫尼克"],"자그레브":["Zagreb","ザグレブ","萨格勒布"],"플리트비체":["Plitvice","プリトヴィツェ","普利特维采"],"스플리트":["Split","スプリト","斯普利特"],"흐바르":["Hvar","フヴァル","赫瓦尔"],
// 북유럽
"오슬로":["Oslo","オスロ","奥斯陆"],"베르겐":["Bergen","ベルゲン","卑尔根"],"플롬":["Flåm","フロム","弗洛姆"],"트롬쇠":["Tromsø","トロムソ","特罗姆瑟"],"로포텐":["Lofoten","ロフォーテン","罗弗敦"],"게이랑에르":["Geiranger","ガイランゲル","盖朗厄尔"],"스톡홀름":["Stockholm","ストックホルム","斯德哥尔摩"],"예테보리":["Gothenburg","ヨーテボリ","哥德堡"],"말뫼":["Malmö","マルメ","马尔默"],"아비스코":["Abisko","アビスコ","阿比斯库"],"코펜하겐":["Copenhagen","コペンハーゲン","哥本哈根"],"오르후스":["Aarhus","オーフス","奥胡斯"],"오덴세":["Odense","オーデンセ","欧登塞"],"헬싱키":["Helsinki","ヘルシンキ","赫尔辛基"],"로바니에미":["Rovaniemi","ロヴァニエミ","罗瓦涅米"],"탐페레":["Tampere","タンペレ","坦佩雷"],"레이캬비크":["Reykjavik","レイキャヴィーク","雷克雅未克"],"아퀴레이리":["Akureyri","アークレイリ","阿库雷里"],"블루라군":["Blue Lagoon","ブルーラグーン","蓝湖"],"요쿨살론":["Jökulsárlón","ヨークルスアゥルロゥン","杰古沙龙"],"골든서클":["Golden Circle","ゴールデンサークル","黄金圈"],"브뤼헤":["Bruges","ブリュージュ","布鲁日"],"안트베르펜":["Antwerp","アントワープ","安特卫普"],"겐트":["Ghent","ゲント","根特"],"코크":["Cork","コーク","科克"],"킬라니":["Killarney","キラーニー","基拉尼"],"에게르":["Eger","エゲル","埃格尔"],"페치":["Pécs","ペーチ","佩奇"],"브라쇼브":["Brașov","ブラショフ","布拉索夫"],"시비우":["Sibiu","シビウ","锡比乌"],"플로브디프":["Plovdiv","プロヴディフ","普罗夫迪夫"],"벨리코투르노보":["Veliko Tarnovo","ヴェリコタルノヴォ","大特尔诺沃"],"체스키크룸로프":["Český Krumlov","チェスキークルムロフ","捷克克鲁姆洛夫"],"카를로비바리":["Karlovy Vary","カルロヴィヴァリ","卡罗维发利"],"코토르":["Kotor","コトル","科托尔"],"부드바":["Budva","ブドヴァ","布德瓦"],"베라트":["Berat","ベラト","培拉特"],"사란다":["Sarandë","サランダ","萨兰达"],"노비사드":["Novi Sad","ノヴィサド","诺维萨德"],"코시체":["Košice","コシツェ","科希策"],"파포스":["Paphos","パフォス","帕福斯"],"리마솔":["Limassol","リマソール","利马索尔"],"모스타르":["Mostar","モスタル","莫斯塔尔"],"오흐리드":["Ohrid","オフリド","奥赫里德"],"카르타고":["Carthage","カルタゴ","迦太基"],"시디부사이드":["Sidi Bou Said","シディブサイド","西迪布赛义德"],"아레날":["Arenal","アレナル","阿雷纳尔"],"몬테베르데":["Monteverde","モンテベルデ","蒙特维多"],"안티구아":["Antigua Guatemala","アンティグア","安提瓜"],"비블로스":["Byblos","ビブロス","朱拜勒"],"바알베크":["Baalbek","バールベック","巴尔贝克"],"테를지":["Terelj","テレルジ","特勒吉"],"방비엥":["Vang Vieng","バンビエン","万荣"],"빌룬드":["Billund","ビルン","比隆"],"투르쿠":["Turku","トゥルク","图尔库"],"유르말라":["Jūrmala","ユールマラ","尤尔马拉"],"카우나스":["Kaunas","カウナス","考纳斯"],"트라카이":["Trakai","トラカイ","特拉凯"],"타르투":["Tartu","タルトゥ","塔尔图"],"푼타카나":["Punta Cana","プンタカナ","蓬塔卡纳"],"보카스델토로":["Bocas del Toro","ボカスデルトロ","博卡斯德尔托罗"],"바뇨스":["Baños","バニョス","巴尼奥斯"],"오타발로":["Otavalo","オタバロ","奥塔瓦洛"],"수크레":["Sucre","スクレ","苏克雷"],"네그릴":["Negril","ネグリル","内格里尔"],"니즈와":["Nizwa","ニズワ","尼兹瓦"],"생루이":["Saint-Louis","サンルイ","圣路易"],"무산제":["Musanze","ムサンゼ","穆桑泽"],"노시베":["Nosy Be","ノシベ","诺西贝"],"케이프코스트":["Cape Coast","ケープコースト","海岸角"],"소수스블레이":["Sossusvlei","ソススフレイ","索苏斯弗雷"],"시아르가오":["Siargao","シアルガオ","锡亚高"],"시아누크빌":["Sihanoukville","シアヌークビル","西哈努克城"],"오데사":["Odesa","オデッサ","敖德萨"],"체르니우치":["Chernivtsi","チェルニウツィー","切尔诺夫策"],"훈자":["Hunza","フンザ","罕萨"],"마마누카":["Mamanuca","ママヌカ","玛玛努卡"],"알주바라":["Al Zubarah","アルズバラ","祖巴拉"],
// 폴란드·러시아
"크라쿠프":["Kraków","クラクフ","克拉科夫"],"바르샤바":["Warsaw","ワルシャワ","华沙"],"브로츠와프":["Wrocław","ヴロツワフ","弗罗茨瓦夫"],"그단스크":["Gdańsk","グダンスク","格但斯克"],"자코파네":["Zakopane","ザコパネ","扎科帕内"],"모스크바":["Moscow","モスクワ","莫斯科"],"상트페테르부르크":["St. Petersburg","サンクトペテルブルク","圣彼得堡"],"바이칼호":["Lake Baikal","バイカル湖","贝加尔湖"],"소치":["Sochi","ソチ","索契"],"블라디보스토크":["Vladivostok","ウラジオストク","海参崴"],
// 아프리카
"케이프타운":["Cape Town","ケープタウン","开普敦"],"요하네스버그":["Johannesburg","ヨハネスブルグ","约翰内斯堡"],"더반":["Durban","ダーバン","德班"],"크루거국립공원":["Kruger National Park","クルーガー国立公園","克鲁格国家公园"],"드라켄즈버그":["Drakensberg","ドラケンスバーグ","德拉肯斯堡"],"나이로비":["Nairobi","ナイロビ","内罗毕"],"마사이마라":["Masai Mara","マサイマラ","马赛马拉"],"몸바사":["Mombasa","モンバサ","蒙巴萨"],"암보셀리":["Amboseli","アンボセリ","安博塞利"],"라무":["Lamu","ラム","拉穆"],"잔지바르":["Zanzibar","ザンジバル","桑给巴尔"],"세렝게티":["Serengeti","セレンゲティ","塞伦盖蒂"],"킬리만자로":["Kilimanjaro","キリマンジャロ","乞力马扎罗"],"응고롱고로":["Ngorongoro","ンゴロンゴロ","恩戈罗恩戈罗"],
// 중동
"페트라":["Petra","ペトラ","佩特拉"],"암만":["Amman","アンマン","安曼"],"와디럼":["Wadi Rum","ワディ・ラム","瓦迪拉姆"],"아카바":["Aqaba","アカバ","亚喀巴"],"예루살렘":["Jerusalem","エルサレム","耶路撒冷"],"텔아비브":["Tel Aviv","テルアビブ","特拉维夫"],"마사다":["Masada","マサダ","马萨达"],"사해":["Dead Sea","死海","死海"],
// 캐나다
"밴쿠버":["Vancouver","バンクーバー","温哥华"],"토론토":["Toronto","トロント","多伦多"],"퀘벡시티":["Quebec City","ケベックシティ","魁北克城"],"밴프":["Banff","バンフ","班夫"],"몬트리올":["Montreal","モントリオール","蒙特利尔"],"오타와":["Ottawa","オタワ","渥太华"],"나이아가라폴스":["Niagara Falls","ナイアガラの滝","尼亚加拉瀑布"],"빅토리아":["Victoria","ビクトリア","维多利亚"],
// 쿠바·아르헨·브라질
"하바나":["Havana","ハバナ","哈瓦那"],"트리니다드":["Trinidad","トリニダード","特立尼达"],"바라데로":["Varadero","バラデロ","巴拉德罗"],"비냘레스":["Viñales","ビニャーレス","维尼亚莱斯"],"부에노스아이레스":["Buenos Aires","ブエノスアイレス","布宜诺斯艾利斯"],"파타고니아":["Patagonia","パタゴニア","巴塔哥尼亚"],"이과수":["Iguazu","イグアス","伊瓜苏"],"멘도사":["Mendoza","メンドーサ","门多萨"],"우수아이아":["Ushuaia","ウシュアイア","乌斯怀亚"],"살타":["Salta","サルタ","萨尔塔"],"리우데자네이루":["Rio de Janeiro","リオデジャネイロ","里约热内卢"],"상파울루":["São Paulo","サンパウロ","圣保罗"],"마나우스":["Manaus","マナウス","马瑙斯"],"포스두이과수":["Foz do Iguaçu","フォス・ド・イグアス","伊瓜苏瀑布"],"살바도르":["Salvador","サルヴァドール","萨尔瓦多"],"브라질리아":["Brasília","ブラジリア","巴西利亚"],"포르탈레자":["Fortaleza","フォルタレザ","福塔雷萨"],
// 멕시코·콜롬비아·페루·칠레
"멕시코시티":["Mexico City","メキシコシティ","墨西哥城"],"칸쿤":["Cancún","カンクン","坎昆"],"과달라하라":["Guadalajara","グアダラハラ","瓜达拉哈拉"],"오악사카":["Oaxaca","オアハカ","瓦哈卡"],"툴룸":["Tulum","トゥルム","图卢姆"],"과나후아토":["Guanajuato","グアナフアト","瓜纳华托"],"치첸이트사":["Chichén Itzá","チチェン・イッツァ","奇琴伊察"],"보고타":["Bogotá","ボゴタ","波哥大"],"카르타헤나":["Cartagena","カルタヘナ","卡塔赫纳"],"메데인":["Medellín","メデジン","麦德林"],"살렌토":["Salento","サレント","萨伦托"],"마추픽추":["Machu Picchu","マチュ・ピチュ","马丘比丘"],"쿠스코":["Cusco","クスコ","库斯科"],"리마":["Lima","リマ","利马"],"나스카":["Nazca","ナスカ","纳斯卡"],"티티카카호수":["Lake Titicaca","チチカカ湖","的的喀喀湖"],"아레키파":["Arequipa","アレキパ","阿雷基帕"],"산티아고":["Santiago","サンティアゴ","圣地亚哥"],"발파라이소":["Valparaíso","バルパライソ","瓦尔帕莱索"],"아타카마":["Atacama","アタカマ","阿塔卡马"],"토레스델파이네":["Torres del Paine","トレス・デル・パイネ","百内"],"이스터섬":["Easter Island","イースター島","复活节岛"],
// 뉴질랜드
"퀸스타운":["Queenstown","クイーンズタウン","皇后镇"],"오클랜드":["Auckland","オークランド","奥克兰"],"로토루아":["Rotorua","ロトルア","罗托鲁瓦"],"웰링턴":["Wellington","ウェリントン","惠灵顿"],"밀포드사운드":["Milford Sound","ミルフォード・サウンド","米尔福德峡湾"],"호비튼":["Hobbiton","ホビトン","霍比屯"],"크라이스트처치":["Christchurch","クライストチャーチ","基督城"],
// 사우디·이란·우즈벡
"리야드":["Riyadh","リヤド","利雅得"],"제다":["Jeddah","ジェッダ","吉达"],"알울라":["AlUla","アルウラ","欧拉"],"메카":["Mecca","メッカ","麦加"],"테헤란":["Tehran","テヘラン","德黑兰"],"이스파한":["Isfahan","イスファハーン","伊斯法罕"],"시라즈":["Shiraz","シーラーズ","设拉子"],"페르세폴리스":["Persepolis","ペルセポリス","波斯波利斯"],"사마르칸트":["Samarkand","サマルカンド","撒马尔罕"],"부하라":["Bukhara","ブハラ","布哈拉"],"히바":["Khiva","ヒヴァ","希瓦"],"타슈켄트":["Tashkent","タシケント","塔什干"],
// 에티오피아·가나·아일랜드·벨기에·대만·몰디브
"아디스아바바":["Addis Ababa","アディスアベバ","亚的斯亚贝巴"],"랄리벨라":["Lalibela","ラリベラ","拉利贝拉"],"악숨":["Axum","アクスム","阿克苏姆"],"다나킬사막":["Danakil Desert","ダナキル砂漠","达纳基尔沙漠"],"아크라":["Accra","アクラ","阿克拉"],"케이프코스트":["Cape Coast","ケープコースト","海岸角"],"쿠마시":["Kumasi","クマシ","库马西"],"더블린":["Dublin","ダブリン","都柏林"],"골웨이":["Galway","ゴールウェイ","戈尔韦"],"브뤼셀":["Brussels","ブリュッセル","布鲁塞尔"],"브뤼헤":["Bruges","ブルージュ","布鲁日"],"타이베이":["Taipei","台北","台北"],"지우펀":["Jiufen","九份","九份"],"가오슝":["Kaohsiung","高雄","高雄"],"타이난":["Tainan","台南","台南"],"타이중":["Taichung","台中","台中"],"화롄":["Hualien","花蓮","花莲"],"타로코":["Taroko","太魯閣","太鲁阁"],"말레":["Malé","マレ","马累"],
// 코스타리카·파나마·에콰도르·루마니아·조지아·몬테네그로·몽골·라오스
"산호세":["San José","サンホセ","圣何塞"],"아레날":["Arenal","アレナル","阿雷纳尔"],"파나마시티":["Panama City","パナマシティ","巴拿马城"],"키토":["Quito","キト","基多"],"갈라파고스":["Galápagos","ガラパゴス","加拉帕戈斯"],"부쿠레슈티":["Bucharest","ブカレスト","布加勒斯特"],"브라쇼프":["Brașov","ブラショフ","布拉索夫"],"트빌리시":["Tbilisi","トビリシ","第比利斯"],"카즈베기":["Kazbegi","カズベギ","卡兹别吉"],"메스티아":["Mestia","メスティア","梅斯蒂亚"],"시그나기":["Sighnaghi","シグナギ","希纳吉"],"코토르":["Kotor","コトル","科托尔"],"울란바토르":["Ulaanbaatar","ウランバートル","乌兰巴托"],"루앙프라방":["Luang Prabang","ルアンパバーン","琅勃拉邦"],"비엔티안":["Vientiane","ビエンチャン","万象"],
// 소규모 국가 수도 등
"튀니스":["Tunis","チュニス","突尼斯"],"무스카트":["Muscat","マスカット","马斯喀特"],"도하":["Doha","ドーハ","多哈"],"라파스":["La Paz","ラパス","拉巴斯"],"우유니":["Uyuni","ウユニ","乌尤尼"],"푼타카나":["Punta Cana","プンタカナ","蓬塔卡纳"],"안티구아":["Antigua","アンティグア","安提瓜"],"킹스턴":["Kingston","キングストン","金斯敦"],"몬테고베이":["Montego Bay","モンテゴ・ベイ","蒙特哥湾"],"리가":["Riga","リガ","里加"],"빌뉴스":["Vilnius","ヴィリニュス","维尔纽斯"],"탈린":["Tallinn","タリン","塔林"],"파포스":["Paphos","パフォス","帕福斯"],"티라나":["Tirana","ティラナ","地拉那"],"베오그라드":["Belgrade","ベオグラード","贝尔格莱德"],"빈트후크":["Windhoek","ウィントフック","温得和克"],"소수스블레이":["Sossusvlei","ソッサスフレイ","索苏斯弗莱"],"빅토리아폴스":["Victoria Falls","ヴィクトリアフォールズ","维多利亚瀑布"],"나디":["Nadi","ナンディ","楠迪"],"안타나나리보":["Antananarivo","アンタナナリボ","塔那那利佛"],"포트루이스":["Port Louis","ポートルイス","路易港"],"베이루트":["Beirut","ベイルート","贝鲁特"],"키이우":["Kyiv","キーウ","基辅"],"르비우":["Lviv","リヴィウ","利沃夫"],"라호르":["Lahore","ラホール","拉合尔"],"이슬라마바드":["Islamabad","イスラマバード","伊斯兰堡"],"룩셈부르크시티":["Luxembourg City","ルクセンブルク","卢森堡"],"브라티슬라바":["Bratislava","ブラチスラバ","布拉迪斯拉发"],"소피아":["Sofia","ソフィア","索菲亚"],"키갈리":["Kigali","キガリ","基加利"],"다카르":["Dakar","ダカール","达喀尔"],"알마티":["Almaty","アルマトイ","阿拉木图"],
// 나머지 수도 도시
"카불":["Kabul","カブール","喀布尔"],"알제":["Algiers","アルジェ","阿尔及尔"],"루안다":["Luanda","ルアンダ","罗安达"],"예레반":["Yerevan","エレバン","埃里温"],"바쿠":["Baku","バクー","巴库"],"마나마":["Manama","マナーマ","麦纳麦"],"다카":["Dhaka","ダッカ","达卡"],"민스크":["Minsk","ミンスク","明斯克"],"벨리즈시티":["Belize City","ベリーズシティ","伯利兹城"],"코토누":["Cotonou","コトヌー","科托努"],"팀부":["Thimphu","ティンプー","廷布"],"사라예보":["Sarajevo","サラエボ","萨拉热窝"],"가보로네":["Gaborone","ハボローネ","哈博罗内"],"반다르스리브가완":["Bandar Seri Begawan","バンダルスリブガワン","斯里巴加湾"],"와가두구":["Ouagadougou","ワガドゥグー","瓦加杜古"],"기테가":["Gitega","ギテガ","基特加"],"프라이아":["Praia","プライア","普拉亚"],"야운데":["Yaoundé","ヤウンデ","雅温得"],"방기":["Bangui","バンギ","班吉"],"은자메나":["N'Djamena","ンジャメナ","恩贾梅纳"],"모로니":["Moroni","モロニ","莫罗尼"],"킨샤사":["Kinshasa","キンシャサ","金沙萨"],"지부티시":["Djibouti City","ジブチ","吉布提"],"산살바도르":["San Salvador","サンサルバドル","圣萨尔瓦多"],"말라보":["Malabo","マラボ","马拉博"],"아스마라":["Asmara","アスマラ","阿斯马拉"],"음바바네":["Mbabane","ムババネ","姆巴巴内"],"리브르빌":["Libreville","リーブルヴィル","利伯维尔"],"반줄":["Banjul","バンジュール","班珠尔"],"코나크리":["Conakry","コナクリ","科纳克里"],"비사우":["Bissau","ビサウ","比绍"],"조지타운":["Georgetown","ジョージタウン","乔治敦"],"포르토프랭스":["Port-au-Prince","ポルトープランス","太子港"],"테구시갈파":["Tegucigalpa","テグシガルパ","特古西加尔巴"],"바그다드":["Baghdad","バグダッド","巴格达"],"아비장":["Abidjan","アビジャン","阿比让"],"프리슈티나":["Pristina","プリシュティナ","普里什蒂纳"],"쿠웨이트시티":["Kuwait City","クウェート","科威特城"],"비슈케크":["Bishkek","ビシュケク","比什凯克"],"마세루":["Maseru","マセル","马塞卢"],"몬로비아":["Monrovia","モンロビア","蒙罗维亚"],"트리폴리":["Tripoli","トリポリ","的黎波里"],"릴롱궤":["Lilongwe","リロングウェ","利隆圭"],"바마코":["Bamako","バマコ","巴马科"],"누악쇼트":["Nouakchott","ヌアクショット","努瓦克肖特"],"키시나우":["Chișinău","キシナウ","基希讷乌"],"마푸토":["Maputo","マプト","马普托"],"마나과":["Managua","マナグア","马那瓜"],"니아메":["Niamey","ニアメ","尼亚美"],"라고스":["Lagos","ラゴス","拉各斯"],"아부자":["Abuja","アブジャ","阿布贾"],"평양":["Pyongyang","平壌","平壤"],"스코페":["Skopje","スコピエ","斯科普里"],"포트모르즈비":["Port Moresby","ポートモレスビー","莫尔兹比港"],"아순시온":["Asunción","アスンシオン","亚松森"],"브라자빌":["Brazzaville","ブラザヴィル","布拉柴维尔"],"프리타운":["Freetown","フリータウン","弗里敦"],"모가디슈":["Mogadishu","モガディシュ","摩加迪沙"],"주바":["Juba","ジュバ","朱巴"],"하르툼":["Khartoum","ハルツーム","喀土穆"],"파라마리보":["Paramaribo","パラマリボ","帕拉马里博"],"다마스쿠스":["Damascus","ダマスカス","大马士革"],"두샨베":["Dushanbe","ドゥシャンベ","杜尚别"],"딜리":["Dili","ディリ","帝力"],"로메":["Lomé","ロメ","洛美"],"포트오브스페인":["Port of Spain","ポートオブスペイン","西班牙港"],"아시가바트":["Ashgabat","アシガバート","阿什哈巴德"],"캄팔라":["Kampala","カンパラ","坎帕拉"],"몬테비데오":["Montevideo","モンテビデオ","蒙得维的亚"],"카라카스":["Caracas","カラカス","加拉加斯"],"사나":["Sana'a","サナア","萨那"],"루사카":["Lusaka","ルサカ","卢萨卡"],
}


// ── 국가 기본정보 데이터 ──────────────────────────────────────────────
// 국기 이모지 → ISO 코드 → 이미지 URL 변환
const flagEmojiToCode = (emoji) => {
  if (!emoji) return null
  const codePoints = [...emoji].map(c => c.codePointAt(0))
  if (codePoints.length < 2) return null
  const code = codePoints.map(cp => String.fromCharCode(cp - 0x1F1E6 + 65)).join('')
  return code.length === 2 ? code.toLowerCase() : null
}
const getFlagImg = (emoji, size = 20) => {
  const code = flagEmojiToCode(emoji)
  if (!code) return null
  return `https://flagcdn.com/w${size <= 20 ? 40 : 80}/${code}.png`
}

const COUNTRY_INFO = {
  "South Korea": { capital:"서울", population:"5,200만", area:"100,210 km²", lang:"한국어", currency:"원 (KRW)", timezone:"UTC+9", bestSeason:"Mar–May, Sep–Nov", visa:"—", voltage:"220V / 60Hz", callCode:"+82", drive:"우측", tagline:"한류와 전통이 공존하는 다이나믹 코리아", continent:"아시아", emoji:"🇰🇷" },
  "Japan": { capital:"도쿄", population:"1억 2,500만", area:"377,975 km²", lang:"일본어", currency:"엔 (JPY)", timezone:"UTC+9", bestSeason:"Mar–May, Oct–Nov", visa:"90일 무비자", voltage:"100V / 50·60Hz", callCode:"+81", drive:"좌측", tagline:"전통과 첨단이 어우러진 사무라이의 나라", continent:"아시아", emoji:"🇯🇵" },
  "China": { capital:"베이징", population:"14억 2,600만", area:"9,596,960 km²", lang:"중국어(보통화)", currency:"위안 (CNY)", timezone:"UTC+8", bestSeason:"Apr–May, Sep–Oct", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+86", drive:"우측", tagline:"5천 년 문명의 대륙", continent:"아시아", emoji:"🇨🇳" },
  "Thailand": { capital:"방콕", population:"7,200만", area:"513,120 km²", lang:"태국어", currency:"바트 (THB)", timezone:"UTC+7", bestSeason:"Nov–Feb", visa:"90일 무비자", voltage:"220V / 50Hz", callCode:"+66", drive:"좌측", tagline:"미소의 나라, 황금빛 사원의 땅", continent:"아시아", emoji:"🇹🇭" },
  "Vietnam": { capital:"하노이", population:"1억 30만", area:"331,210 km²", lang:"베트남어", currency:"동 (VND)", timezone:"UTC+7", bestSeason:"Feb–Apr, Aug–Oct", visa:"45일 무비자", voltage:"220V / 50Hz", callCode:"+84", drive:"우측", tagline:"아시아의 떠오르는 보석", continent:"아시아", emoji:"🇻🇳" },
  "India": { capital:"뉴델리", population:"14억 4,200만", area:"3,287,263 km²", lang:"힌디어·영어", currency:"루피 (INR)", timezone:"UTC+5:30", bestSeason:"Oct–Mar", visa:"e-비자", voltage:"230V / 50Hz", callCode:"+91", drive:"좌측", tagline:"신비로운 색채의 다양성 대국", continent:"아시아", emoji:"🇮🇳" },
  "Indonesia": { capital:"자카르타", population:"2억 7,800만", area:"1,904,569 km²", lang:"인도네시아어", currency:"루피아 (IDR)", timezone:"UTC+7~9", bestSeason:"May–Sep", visa:"30일 무비자", voltage:"230V / 50Hz", callCode:"+62", drive:"좌측", tagline:"만 섬의 열대 낙원", continent:"아시아", emoji:"🇮🇩" },
  "Malaysia": { capital:"쿠알라룸푸르", population:"3,400만", area:"330,803 km²", lang:"말레이어·영어", currency:"링깃 (MYR)", timezone:"UTC+8", bestSeason:"Mar–Oct", visa:"90일 무비자", voltage:"240V / 50Hz", callCode:"+60", drive:"좌측", tagline:"다민족 문화의 열대 보석", continent:"아시아", emoji:"🇲🇾" },
  "Singapore": { capital:"싱가포르", population:"592만", area:"733 km²", lang:"영어·중국어·말레이어·타밀어", currency:"싱가포르달러 (SGD)", timezone:"UTC+8", bestSeason:"Feb–Apr", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+65", drive:"좌측", tagline:"아시아의 보석, 가든시티", continent:"아시아", emoji:"🇸🇬" },
  "Cambodia": { capital:"프놈펜", population:"1,700만", area:"181,035 km²", lang:"크메르어", currency:"리엘 (KHR)", timezone:"UTC+7", bestSeason:"Nov–Mar", visa:"도착 비자", voltage:"230V / 50Hz", callCode:"+855", drive:"우측", tagline:"앙코르 문명의 신비로운 나라", continent:"아시아", emoji:"🇰🇭" },
  "Myanmar": { capital:"네피도", population:"5,400만", area:"676,578 km²", lang:"미얀마어", currency:"짯 (MMK)", timezone:"UTC+6:30", bestSeason:"Nov–Feb", visa:"e-비자", voltage:"230V / 50Hz", callCode:"+95", drive:"우측", tagline:"황금빛 파고다의 나라", continent:"아시아", emoji:"🇲🇲" },
  "Nepal": { capital:"카트만두", population:"3,000만", area:"147,181 km²", lang:"네팔어", currency:"루피 (NPR)", timezone:"UTC+5:45", bestSeason:"Mar–May, Oct–Nov", visa:"도착 비자", voltage:"230V / 50Hz", callCode:"+977", drive:"좌측", tagline:"히말라야의 지붕 위 나라", continent:"아시아", emoji:"🇳🇵" },
  "Sri Lanka": { capital:"스리자야와르데네푸라코테", population:"2,200만", area:"65,610 km²", lang:"싱할라어·타밀어", currency:"루피 (LKR)", timezone:"UTC+5:30", bestSeason:"Dec–Mar", visa:"e-비자", voltage:"230V / 50Hz", callCode:"+94", drive:"좌측", tagline:"인도양의 진주, 차와 향신료의 섬", continent:"아시아", emoji:"🇱🇰" },
  "Philippines": { capital:"마닐라", population:"1억 1,500만", area:"300,000 km²", lang:"필리핀어·영어", currency:"페소 (PHP)", timezone:"UTC+8", bestSeason:"Dec–May", visa:"30일 무비자", voltage:"220V / 60Hz", callCode:"+63", drive:"우측", tagline:"7천 개 섬의 열대 낙원", continent:"아시아", emoji:"🇵🇭" },
  "United Arab Emirates": { capital:"아부다비", population:"1,000만", area:"83,600 km²", lang:"아랍어·영어", currency:"디르함 (AED)", timezone:"UTC+4", bestSeason:"Oct–Apr", visa:"30일 무비자", voltage:"230V / 50Hz", callCode:"+971", drive:"우측", tagline:"사막 위에 세운 미래 도시", continent:"아시아(중동)", emoji:"🇦🇪" },
  "Turkey": { capital:"앙카라", population:"8,500만", area:"783,562 km²", lang:"터키어", currency:"리라 (TRY)", timezone:"UTC+3", bestSeason:"Apr–Jun, Sep–Oct", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+90", drive:"우측", tagline:"동서양 문명의 교차로", continent:"아시아/유럽", emoji:"🇹🇷" },
  "Jordan": { capital:"암만", population:"1,130만", area:"89,342 km²", lang:"아랍어", currency:"디나르 (JOD)", timezone:"UTC+3", bestSeason:"Mar–May, Sep–Nov", visa:"도착 비자", voltage:"230V / 50Hz", callCode:"+962", drive:"우측", tagline:"페트라와 사해의 고대 왕국", continent:"아시아(중동)", emoji:"🇯🇴" },
  "Israel": { capital:"예루살렘", population:"980만", area:"22,145 km²", lang:"히브리어·아랍어", currency:"셰켈 (ILS)", timezone:"UTC+2", bestSeason:"Mar–May, Sep–Nov", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+972", drive:"우측", tagline:"세 종교의 성지, 역사의 땅", continent:"아시아(중동)", emoji:"🇮🇱" },
  "France": { capital:"파리", population:"6,800만", area:"643,801 km²", lang:"프랑스어", currency:"유로 (EUR)", timezone:"UTC+1", bestSeason:"Apr–Jun, Sep–Oct", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+33", drive:"우측", tagline:"예술과 낭만의 나라", continent:"유럽", emoji:"🇫🇷" },
  "Italy": { capital:"로마", population:"5,900만", area:"301,340 km²", lang:"이탈리아어", currency:"유로 (EUR)", timezone:"UTC+1", bestSeason:"Apr–Jun, Sep–Oct", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+39", drive:"우측", tagline:"로마 제국과 르네상스의 고향", continent:"유럽", emoji:"🇮🇹" },
  "Spain": { capital:"마드리드", population:"4,750만", area:"505,370 km²", lang:"스페인어", currency:"유로 (EUR)", timezone:"UTC+1", bestSeason:"Apr–Jun, Sep–Oct", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+34", drive:"우측", tagline:"태양과 정열의 나라", continent:"유럽", emoji:"🇪🇸" },
  "Germany": { capital:"베를린", population:"8,400만", area:"357,022 km²", lang:"독일어", currency:"유로 (EUR)", timezone:"UTC+1", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+49", drive:"우측", tagline:"맥주와 기술, 동화의 나라", continent:"유럽", emoji:"🇩🇪" },
  "United Kingdom": { capital:"런던", population:"6,740만", area:"242,495 km²", lang:"영어", currency:"파운드 (GBP)", timezone:"UTC+0", bestSeason:"May–Sep", visa:"6개월 무비자", voltage:"230V / 50Hz", callCode:"+44", drive:"좌측", tagline:"해가 지지 않는 역사의 나라", continent:"유럽", emoji:"🇬🇧" },
  "Portugal": { capital:"리스본", population:"1,030만", area:"92,212 km²", lang:"포르투갈어", currency:"유로 (EUR)", timezone:"UTC+0", bestSeason:"Mar–May, Sep–Oct", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+351", drive:"우측", tagline:"대항해시대의 낭만적 시작점", continent:"유럽", emoji:"🇵🇹" },
  "Netherlands": { capital:"암스테르담", population:"1,780만", area:"41,543 km²", lang:"네덜란드어", currency:"유로 (EUR)", timezone:"UTC+1", bestSeason:"Apr–May, Jun–Aug", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+31", drive:"우측", tagline:"풍차와 튤립, 자유의 나라", continent:"유럽", emoji:"🇳🇱" },
  "Czechia": { capital:"프라하", population:"1,080만", area:"78,867 km²", lang:"체코어", currency:"코루나 (CZK)", timezone:"UTC+1", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+420", drive:"우측", tagline:"동화 같은 중세 도시의 나라", continent:"유럽", emoji:"🇨🇿" },
  "Austria": { capital:"빈", population:"910만", area:"83,871 km²", lang:"독일어", currency:"유로 (EUR)", timezone:"UTC+1", bestSeason:"Jun–Aug, Dec–Mar", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+43", drive:"우측", tagline:"음악과 알프스의 나라", continent:"유럽", emoji:"🇦🇹" },
  "Switzerland": { capital:"베른", population:"880만", area:"41,284 km²", lang:"독일어·프랑스어·이탈리아어·로만슈어", currency:"프랑 (CHF)", timezone:"UTC+1", bestSeason:"Jun–Sep, Dec–Mar", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+41", drive:"우측", tagline:"알프스 중심의 정밀한 나라", continent:"유럽", emoji:"🇨🇭" },
  "Hungary": { capital:"부다페스트", population:"970만", area:"93,028 km²", lang:"헝가리어", currency:"포린트 (HUF)", timezone:"UTC+1", bestSeason:"Apr–Jun, Sep–Oct", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+36", drive:"우측", tagline:"다뉴브 강의 진주", continent:"유럽", emoji:"🇭🇺" },
  "Croatia": { capital:"자그레브", population:"390만", area:"56,594 km²", lang:"크로아티아어", currency:"유로 (EUR)", timezone:"UTC+1", bestSeason:"Jun–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+385", drive:"우측", tagline:"아드리아해의 보석", continent:"유럽", emoji:"🇭🇷" },
  "Slovenia": { capital:"류블랴나", population:"215만", area:"20,273 km²", lang:"슬로베니아어", currency:"유로 (EUR)", timezone:"UTC+1", bestSeason:"Jun–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+386", drive:"우측", tagline:"알프스와 아드리아해 사이의 초록 나라", continent:"유럽", emoji:"🇸🇮" },
  "Greece": { capital:"아테네", population:"1,050만", area:"131,957 km²", lang:"그리스어", currency:"유로 (EUR)", timezone:"UTC+2", bestSeason:"Apr–Jun, Sep–Oct", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+30", drive:"우측", tagline:"서양 문명의 요람", continent:"유럽", emoji:"🇬🇷" },
  "Norway": { capital:"오슬로", population:"550만", area:"385,207 km²", lang:"노르웨이어", currency:"크로네 (NOK)", timezone:"UTC+1", bestSeason:"Jun–Aug", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+47", drive:"우측", tagline:"피오르드와 오로라의 나라", continent:"유럽", emoji:"🇳🇴" },
  "Sweden": { capital:"스톡홀름", population:"1,050만", area:"450,295 km²", lang:"스웨덴어", currency:"크로나 (SEK)", timezone:"UTC+1", bestSeason:"Jun–Aug", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+46", drive:"우측", tagline:"디자인과 복지의 스칸디나비아", continent:"유럽", emoji:"🇸🇪" },
  "Denmark": { capital:"코펜하겐", population:"590만", area:"43,094 km²", lang:"덴마크어", currency:"크로네 (DKK)", timezone:"UTC+1", bestSeason:"Jun–Aug", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+45", drive:"우측", tagline:"행복한 동화의 나라, 휘게의 본고장", continent:"유럽", emoji:"🇩🇰" },
  "Finland": { capital:"헬싱키", population:"560만", area:"338,145 km²", lang:"핀란드어·스웨덴어", currency:"유로 (EUR)", timezone:"UTC+2", bestSeason:"Jun–Aug", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+358", drive:"우측", tagline:"산타와 사우나, 오로라의 나라", continent:"유럽", emoji:"🇫🇮" },
  "Iceland": { capital:"레이캬비크", population:"38만", area:"103,000 km²", lang:"아이슬란드어", currency:"크로나 (ISK)", timezone:"UTC+0", bestSeason:"Jun–Aug", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+354", drive:"우측", tagline:"불과 얼음의 나라", continent:"유럽", emoji:"🇮🇸" },
  "Poland": { capital:"바르샤바", population:"3,800만", area:"312,685 km²", lang:"폴란드어", currency:"즈워티 (PLN)", timezone:"UTC+1", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+48", drive:"우측", tagline:"중세 유럽의 숨은 보석", continent:"유럽", emoji:"🇵🇱" },
  "Russia": { capital:"모스크바", population:"1억 4,600만", area:"17,098,242 km²", lang:"러시아어", currency:"루블 (RUB)", timezone:"UTC+3~12", bestSeason:"May–Sep", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+7", drive:"우측", tagline:"세계 최대 영토의 대국", continent:"유럽/아시아", emoji:"🇷🇺" },
  "Egypt": { capital:"카이로", population:"1억 500만", area:"1,001,450 km²", lang:"아랍어", currency:"파운드 (EGP)", timezone:"UTC+2", bestSeason:"Oct–Apr", visa:"도착 비자", voltage:"220V / 50Hz", callCode:"+20", drive:"우측", tagline:"피라미드와 나일강의 고대 문명", continent:"아프리카", emoji:"🇪🇬" },
  "Morocco": { capital:"라바트", population:"3,700만", area:"446,550 km²", lang:"아랍어·베르베르어·프랑스어", currency:"디르함 (MAD)", timezone:"UTC+1", bestSeason:"Mar–May, Sep–Nov", visa:"90일 무비자", voltage:"220V / 50Hz", callCode:"+212", drive:"우측", tagline:"아프리카와 유럽이 만나는 이색 왕국", continent:"아프리카", emoji:"🇲🇦" },
  "South Africa": { capital:"프리토리아", population:"6,000만", area:"1,219,090 km²", lang:"영어 외 11개 공용어", currency:"랜드 (ZAR)", timezone:"UTC+2", bestSeason:"Oct–Apr", visa:"30일 무비자", voltage:"230V / 50Hz", callCode:"+27", drive:"좌측", tagline:"무지개 나라, 야생과 문명의 조화", continent:"아프리카", emoji:"🇿🇦" },
  "Kenya": { capital:"나이로비", population:"5,500만", area:"580,367 km²", lang:"스와힐리어·영어", currency:"실링 (KES)", timezone:"UTC+3", bestSeason:"Jun–Oct, Dec–Mar", visa:"e-비자", voltage:"240V / 50Hz", callCode:"+254", drive:"좌측", tagline:"사파리의 본고장", continent:"아프리카", emoji:"🇰🇪" },
  "Tanzania": { capital:"도도마", population:"6,500만", area:"945,087 km²", lang:"스와힐리어·영어", currency:"실링 (TZS)", timezone:"UTC+3", bestSeason:"Jun–Oct", visa:"도착 비자", voltage:"230V / 50Hz", callCode:"+255", drive:"좌측", tagline:"킬리만자로와 세렝게티의 나라", continent:"아프리카", emoji:"🇹🇿" },
  "United States of America": { capital:"워싱턴 D.C.", population:"3억 3,500만", area:"9,833,517 km²", lang:"영어", currency:"달러 (USD)", timezone:"UTC-5~-10", bestSeason:"Mar–May, Sep–Nov", visa:"ESTA 필요", voltage:"120V / 60Hz", callCode:"+1", drive:"우측", tagline:"자유와 다양성의 초강대국", continent:"북아메리카", emoji:"🇺🇸" },
  "Canada": { capital:"오타와", population:"4,000만", area:"9,984,670 km²", lang:"영어·프랑스어", currency:"달러 (CAD)", timezone:"UTC-3.5~-8", bestSeason:"Jun–Sep", visa:"eTA 필요", voltage:"120V / 60Hz", callCode:"+1", drive:"우측", tagline:"대자연과 다문화의 나라", continent:"북아메리카", emoji:"🇨🇦" },
  "Mexico": { capital:"멕시코시티", population:"1억 3,000만", area:"1,964,375 km²", lang:"스페인어", currency:"페소 (MXN)", timezone:"UTC-6~-8", bestSeason:"Nov–Apr", visa:"180일 무비자", voltage:"127V / 60Hz", callCode:"+52", drive:"우측", tagline:"마야·아즈텍 문명과 타코의 나라", continent:"북아메리카", emoji:"🇲🇽" },
  "Cuba": { capital:"하바나", population:"1,100만", area:"110,861 km²", lang:"스페인어", currency:"페소 (CUP)", timezone:"UTC-5", bestSeason:"Nov–Apr", visa:"관광카드 필요", voltage:"110/220V / 60Hz", callCode:"+53", drive:"우측", tagline:"시간이 멈춘 카리브해의 진주", continent:"북아메리카", emoji:"🇨🇺" },
  "Brazil": { capital:"브라질리아", population:"2억 1,600만", area:"8,515,770 km²", lang:"포르투갈어", currency:"헤알 (BRL)", timezone:"UTC-3~-5", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"127/220V / 60Hz", callCode:"+55", drive:"우측", tagline:"삼바와 아마존의 열정 대륙", continent:"남아메리카", emoji:"🇧🇷" },
  "Argentina": { capital:"부에노스아이레스", population:"4,600만", area:"2,780,400 km²", lang:"스페인어", currency:"페소 (ARS)", timezone:"UTC-3", bestSeason:"Oct–Apr", visa:"90일 무비자", voltage:"220V / 50Hz", callCode:"+54", drive:"우측", tagline:"탱고와 파타고니아의 나라", continent:"남아메리카", emoji:"🇦🇷" },
  "Peru": { capital:"리마", population:"3,400만", area:"1,285,216 km²", lang:"스페인어·케추아어", currency:"솔 (PEN)", timezone:"UTC-5", bestSeason:"May–Oct", visa:"90일 무비자", voltage:"220V / 60Hz", callCode:"+51", drive:"우측", tagline:"잉카 문명과 마추픽추의 나라", continent:"남아메리카", emoji:"🇵🇪" },
  "Colombia": { capital:"보고타", population:"5,200만", area:"1,138,910 km²", lang:"스페인어", currency:"페소 (COP)", timezone:"UTC-5", bestSeason:"Dec–Mar, Jun–Aug", visa:"90일 무비자", voltage:"110V / 60Hz", callCode:"+57", drive:"우측", tagline:"커피와 에메랄드의 나라", continent:"남아메리카", emoji:"🇨🇴" },
  "Chile": { capital:"산티아고", population:"1,950만", area:"756,102 km²", lang:"스페인어", currency:"페소 (CLP)", timezone:"UTC-4", bestSeason:"Nov–Mar", visa:"90일 무비자", voltage:"220V / 50Hz", callCode:"+56", drive:"우측", tagline:"세계에서 가장 긴 나라", continent:"남아메리카", emoji:"🇨🇱" },
  "Australia": { capital:"캔버라", population:"2,620만", area:"7,692,024 km²", lang:"영어", currency:"달러 (AUD)", timezone:"UTC+8~+11", bestSeason:"Sep–Nov, Mar–May", visa:"ETA 필요", voltage:"230V / 50Hz", callCode:"+61", drive:"좌측", tagline:"코알라와 오페라하우스의 대륙", continent:"오세아니아", emoji:"🇦🇺" },
  "New Zealand": { capital:"웰링턴", population:"520만", area:"268,021 km²", lang:"영어·마오리어", currency:"달러 (NZD)", timezone:"UTC+12", bestSeason:"Dec–Feb, Sep–Nov", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+64", drive:"좌측", tagline:"반지의 제왕 촬영지, 청정 자연", continent:"오세아니아", emoji:"🇳🇿" },
  "Maldives": { capital:"말레", population:"52만", area:"298 km²", lang:"디베히어", currency:"루피아 (MVR)", timezone:"UTC+5", bestSeason:"Nov–Apr", visa:"30일 무비자", voltage:"230V / 50Hz", callCode:"+960", drive:"좌측", tagline:"인도양의 수중 파라다이스", continent:"아시아", emoji:"🇲🇻" },
  "Taiwan": { capital:"타이베이", population:"2,380만", area:"36,193 km²", lang:"중국어(정체)", currency:"신 타이완 달러 (TWD)", timezone:"UTC+8", bestSeason:"Sep–Nov", visa:"90일 무비자", voltage:"110V / 60Hz", callCode:"+886", drive:"우측", tagline:"야시장과 자연이 어우러진 보물섬", continent:"아시아", emoji:"🇹🇼" },
  "Ireland": { capital:"더블린", population:"510만", area:"70,273 km²", lang:"영어·아일랜드어", currency:"유로 (EUR)", timezone:"UTC+0", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+353", drive:"좌측", tagline:"에메랄드빛 초원의 섬나라", continent:"유럽", emoji:"🇮🇪" },
  "Belgium": { capital:"브뤼셀", population:"1,170만", area:"30,528 km²", lang:"네덜란드어·프랑스어·독일어", currency:"유로 (EUR)", timezone:"UTC+1", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+32", drive:"우측", tagline:"초콜릿과 와플, 유럽의 심장", continent:"유럽", emoji:"🇧🇪" },
  "Costa Rica": { capital:"산호세", population:"520만", area:"51,100 km²", lang:"스페인어", currency:"콜론 (CRC)", timezone:"UTC-6", bestSeason:"Dec–Apr", visa:"90일 무비자", voltage:"120V / 60Hz", callCode:"+506", drive:"우측", tagline:"생태관광의 천국, 푸라비다!", continent:"북아메리카", emoji:"🇨🇷" },
  "Saudi Arabia": { capital:"리야드", population:"3,600만", area:"2,149,690 km²", lang:"아랍어", currency:"리얄 (SAR)", timezone:"UTC+3", bestSeason:"Oct–Apr", visa:"e-비자", voltage:"220V / 60Hz", callCode:"+966", drive:"우측", tagline:"이슬람의 성지, 사막의 왕국", continent:"아시아(중동)", emoji:"🇸🇦" },
  "Iran": { capital:"테헤란", population:"8,700만", area:"1,648,195 km²", lang:"페르시아어", currency:"리얄 (IRR)", timezone:"UTC+3:30", bestSeason:"Mar–May, Sep–Nov", visa:"도착 비자", voltage:"220V / 50Hz", callCode:"+98", drive:"우측", tagline:"페르시아 문명의 찬란한 유산", continent:"아시아(중동)", emoji:"🇮🇷" },
  "Uzbekistan": { capital:"타슈켄트", population:"3,500만", area:"448,978 km²", lang:"우즈베크어", currency:"숨 (UZS)", timezone:"UTC+5", bestSeason:"Apr–Jun, Sep–Oct", visa:"30일 무비자", voltage:"220V / 50Hz", callCode:"+998", drive:"우측", tagline:"실크로드의 푸른 보석", continent:"아시아", emoji:"🇺🇿" },
  "Laos": { capital:"비엔티안", population:"750만", area:"236,800 km²", lang:"라오어", currency:"킵 (LAK)", timezone:"UTC+7", bestSeason:"Oct–Apr", visa:"15일 무비자", voltage:"230V / 50Hz", callCode:"+856", drive:"우측", tagline:"조용한 아침의 나라", continent:"아시아", emoji:"🇱🇦" },
  "Mongolia": { capital:"울란바토르", population:"340만", area:"1,564,116 km²", lang:"몽골어", currency:"투그릭 (MNT)", timezone:"UTC+8", bestSeason:"Jun–Aug", visa:"30일 무비자", voltage:"220V / 50Hz", callCode:"+976", drive:"우측", tagline:"칭기즈칸의 끝없는 초원", continent:"아시아", emoji:"🇲🇳" },
  "Romania": { capital:"부쿠레슈티", population:"1,900만", area:"238,391 km²", lang:"루마니아어", currency:"레우 (RON)", timezone:"UTC+2", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+40", drive:"우측", tagline:"드라큘라 전설과 카르파티아 산맥", continent:"유럽", emoji:"🇷🇴" },
  "Georgia": { capital:"트빌리시", population:"370만", area:"69,700 km²", lang:"조지아어", currency:"라리 (GEL)", timezone:"UTC+4", bestSeason:"May–Oct", visa:"1년 무비자", voltage:"220V / 50Hz", callCode:"+995", drive:"우측", tagline:"와인의 발상지, 코카서스의 보석", continent:"아시아/유럽", emoji:"🇬🇪" },
  "Ecuador": { capital:"키토", population:"1,800만", area:"283,561 km²", lang:"스페인어", currency:"달러 (USD)", timezone:"UTC-5", bestSeason:"Jun–Sep", visa:"90일 무비자", voltage:"120V / 60Hz", callCode:"+593", drive:"우측", tagline:"적도의 나라, 갈라파고스의 고향", continent:"남아메리카", emoji:"🇪🇨" },
  "Bolivia": { capital:"수크레", population:"1,200만", area:"1,098,581 km²", lang:"스페인어·케추아어·아이마라어", currency:"볼리비아노 (BOB)", timezone:"UTC-4", bestSeason:"May–Oct", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+591", drive:"우측", tagline:"하늘의 거울, 우유니 소금사막", continent:"남아메리카", emoji:"🇧🇴" },
  // ── 추가 국가 (101개) ──
  "Ethiopia": { capital:"아디스아바바", population:"1억 2,700만", area:"1,104,300 km²", lang:"암하라어", currency:"비르 (ETB)", timezone:"UTC+3", bestSeason:"Oct–Mar", visa:"e-비자", voltage:"220V / 50Hz", callCode:"+251", drive:"우측", tagline:"커피의 발상지, 아프리카의 지붕", continent:"아프리카", emoji:"🇪🇹" },
  "Ghana": { capital:"아크라", population:"3,400만", area:"238,533 km²", lang:"영어", currency:"세디 (GHS)", timezone:"UTC+0", bestSeason:"Nov–Mar", visa:"도착 비자", voltage:"230V / 50Hz", callCode:"+233", drive:"우측", tagline:"서아프리카의 금빛 해안", continent:"아프리카", emoji:"🇬🇭" },
  "Panama": { capital:"파나마시티", population:"440만", area:"75,417 km²", lang:"스페인어", currency:"발보아 (PAB)·달러 (USD)", timezone:"UTC-5", bestSeason:"Dec–Apr", visa:"180일 무비자", voltage:"120V / 60Hz", callCode:"+507", drive:"우측", tagline:"두 대양을 잇는 운하의 나라", continent:"북아메리카", emoji:"🇵🇦" },
  "Montenegro": { capital:"포드고리차", population:"62만", area:"13,812 km²", lang:"몬테네그로어", currency:"유로 (EUR)", timezone:"UTC+1", bestSeason:"Jun–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+382", drive:"우측", tagline:"아드리아해의 숨은 보석", continent:"유럽", emoji:"🇲🇪" },
  "Tunisia": { capital:"튀니스", population:"1,200만", area:"163,610 km²", lang:"아랍어·프랑스어", currency:"디나르 (TND)", timezone:"UTC+1", bestSeason:"Apr–Jun, Sep–Oct", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+216", drive:"우측", tagline:"카르타고의 유산이 남은 지중해 보석", continent:"아프리카", emoji:"🇹🇳" },
  "Oman": { capital:"무스카트", population:"540만", area:"309,500 km²", lang:"아랍어", currency:"리얄 (OMR)", timezone:"UTC+4", bestSeason:"Oct–Mar", visa:"e-비자", voltage:"240V / 50Hz", callCode:"+968", drive:"우측", tagline:"아라비아의 숨겨진 보물", continent:"아시아(중동)", emoji:"🇴🇲" },
  "Qatar": { capital:"도하", population:"280만", area:"11,586 km²", lang:"아랍어", currency:"리얄 (QAR)", timezone:"UTC+3", bestSeason:"Nov–Mar", visa:"도착 비자", voltage:"240V / 50Hz", callCode:"+974", drive:"우측", tagline:"사막 위의 초현대적 도시", continent:"아시아(중동)", emoji:"🇶🇦" },
  "Dominican Republic": { capital:"산토도밍고", population:"1,100만", area:"48,671 km²", lang:"스페인어", currency:"페소 (DOP)", timezone:"UTC-4", bestSeason:"Dec–Apr", visa:"30일 무비자", voltage:"120V / 60Hz", callCode:"+1-809", drive:"우측", tagline:"카리브해의 열대 파라다이스", continent:"북아메리카", emoji:"🇩🇴" },
  "Guatemala": { capital:"과테말라시티", population:"1,800만", area:"108,889 km²", lang:"스페인어", currency:"케찰 (GTQ)", timezone:"UTC-6", bestSeason:"Nov–Apr", visa:"90일 무비자", voltage:"120V / 60Hz", callCode:"+502", drive:"우측", tagline:"마야 문명의 심장부", continent:"북아메리카", emoji:"🇬🇹" },
  "Jamaica": { capital:"킹스턴", population:"300만", area:"10,991 km²", lang:"영어", currency:"달러 (JMD)", timezone:"UTC-5", bestSeason:"Nov–Mar", visa:"90일 무비자", voltage:"110V / 50Hz", callCode:"+1-876", drive:"좌측", tagline:"레게 음악과 블루마운틴의 섬", continent:"북아메리카", emoji:"🇯🇲" },
  "Latvia": { capital:"리가", population:"190만", area:"64,589 km²", lang:"라트비아어", currency:"유로 (EUR)", timezone:"UTC+2", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+371", drive:"우측", tagline:"발트해의 아르누보 보석", continent:"유럽", emoji:"🇱🇻" },
  "Lithuania": { capital:"빌뉴스", population:"280만", area:"65,300 km²", lang:"리투아니아어", currency:"유로 (EUR)", timezone:"UTC+2", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+370", drive:"우측", tagline:"발트 3국의 역사적 중심", continent:"유럽", emoji:"🇱🇹" },
  "Estonia": { capital:"탈린", population:"136만", area:"45,228 km²", lang:"에스토니아어", currency:"유로 (EUR)", timezone:"UTC+2", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+372", drive:"우측", tagline:"디지털 강국, 중세 동화의 도시", continent:"유럽", emoji:"🇪🇪" },
  "Cyprus": { capital:"니코시아", population:"130만", area:"9,251 km²", lang:"그리스어·터키어", currency:"유로 (EUR)", timezone:"UTC+2", bestSeason:"Apr–Jun, Sep–Oct", visa:"90일 무비자", voltage:"240V / 50Hz", callCode:"+357", drive:"좌측", tagline:"아프로디테가 태어난 지중해의 섬", continent:"유럽/아시아", emoji:"🇨🇾" },
  "Albania": { capital:"티라나", population:"290만", area:"28,748 km²", lang:"알바니아어", currency:"레크 (ALL)", timezone:"UTC+1", bestSeason:"Jun–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+355", drive:"우측", tagline:"유럽의 마지막 비밀 해변", continent:"유럽", emoji:"🇦🇱" },
  "Serbia": { capital:"베오그라드", population:"670만", area:"77,474 km²", lang:"세르비아어", currency:"디나르 (RSD)", timezone:"UTC+1", bestSeason:"Apr–Oct", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+381", drive:"우측", tagline:"발칸의 활기찬 심장", continent:"유럽", emoji:"🇷🇸" },
  "Namibia": { capital:"빈트후크", population:"260만", area:"824,292 km²", lang:"영어", currency:"달러 (NAD)", timezone:"UTC+2", bestSeason:"May–Oct", visa:"90일 무비자", voltage:"220V / 50Hz", callCode:"+264", drive:"좌측", tagline:"붉은 사막과 별하늘의 나라", continent:"아프리카", emoji:"🇳🇦" },
  "Zimbabwe": { capital:"하라레", population:"1,600만", area:"390,757 km²", lang:"영어·쇼나어·은데벨레어", currency:"달러 (ZWL)", timezone:"UTC+2", bestSeason:"May–Oct", visa:"도착 비자", voltage:"220V / 50Hz", callCode:"+263", drive:"좌측", tagline:"빅토리아 폭포의 나라", continent:"아프리카", emoji:"🇿🇼" },
  "Fiji": { capital:"수바", population:"93만", area:"18,274 km²", lang:"영어·피지어·힌디어", currency:"달러 (FJD)", timezone:"UTC+12", bestSeason:"May–Oct", visa:"120일 무비자", voltage:"240V / 50Hz", callCode:"+679", drive:"좌측", tagline:"남태평양의 열대 낙원", continent:"오세아니아", emoji:"🇫🇯" },
  "Madagascar": { capital:"안타나나리보", population:"3,000만", area:"587,041 km²", lang:"말라가시어·프랑스어", currency:"아리아리 (MGA)", timezone:"UTC+3", bestSeason:"Apr–Oct", visa:"도착 비자", voltage:"220V / 50Hz", callCode:"+261", drive:"우측", tagline:"독특한 생태계의 보물섬", continent:"아프리카", emoji:"🇲🇬" },
  "Mauritius": { capital:"포트루이스", population:"130만", area:"2,040 km²", lang:"영어·프랑스어·크레올어", currency:"루피 (MUR)", timezone:"UTC+4", bestSeason:"May–Sep", visa:"무비자", voltage:"230V / 50Hz", callCode:"+230", drive:"좌측", tagline:"인도양의 무지개빛 낙원", continent:"아프리카", emoji:"🇲🇺" },
  "Lebanon": { capital:"베이루트", population:"540만", area:"10,400 km²", lang:"아랍어·프랑스어", currency:"파운드 (LBP)", timezone:"UTC+2", bestSeason:"Mar–May, Sep–Nov", visa:"도착 비자", voltage:"220V / 50Hz", callCode:"+961", drive:"우측", tagline:"중동의 파리, 페니키아의 후예", continent:"아시아(중동)", emoji:"🇱🇧" },
  "Ukraine": { capital:"키이우", population:"3,700만", area:"603,550 km²", lang:"우크라이나어", currency:"흐리브냐 (UAH)", timezone:"UTC+2", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+380", drive:"우측", tagline:"동유럽의 광활한 대지", continent:"유럽", emoji:"🇺🇦" },
  "Pakistan": { capital:"이슬라마바드", population:"2억 4,000만", area:"881,913 km²", lang:"우르두어·영어", currency:"루피 (PKR)", timezone:"UTC+5", bestSeason:"Oct–Mar", visa:"e-비자", voltage:"230V / 50Hz", callCode:"+92", drive:"좌측", tagline:"인더스 문명의 요람", continent:"아시아", emoji:"🇵🇰" },
  "Luxembourg": { capital:"룩셈부르크시티", population:"66만", area:"2,586 km²", lang:"룩셈부르크어·프랑스어·독일어", currency:"유로 (EUR)", timezone:"UTC+1", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+352", drive:"우측", tagline:"작지만 부유한 유럽의 심장", continent:"유럽", emoji:"🇱🇺" },
  "Slovakia": { capital:"브라티슬라바", population:"550만", area:"49,035 km²", lang:"슬로바키아어", currency:"유로 (EUR)", timezone:"UTC+1", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+421", drive:"우측", tagline:"타트라 산맥과 고성의 나라", continent:"유럽", emoji:"🇸🇰" },
  "Bulgaria": { capital:"소피아", population:"650만", area:"110,879 km²", lang:"불가리아어", currency:"레프 (BGN)", timezone:"UTC+2", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+359", drive:"우측", tagline:"장미와 요구르트의 나라", continent:"유럽", emoji:"🇧🇬" },
  "Rwanda": { capital:"키갈리", population:"1,400만", area:"26,338 km²", lang:"키냐르완다어·영어·프랑스어", currency:"프랑 (RWF)", timezone:"UTC+2", bestSeason:"Jun–Sep, Dec–Feb", visa:"도착 비자", voltage:"230V / 50Hz", callCode:"+250", drive:"우측", tagline:"천 개의 언덕, 고릴라의 안식처", continent:"아프리카", emoji:"🇷🇼" },
  "Senegal": { capital:"다카르", population:"1,800만", area:"196,722 km²", lang:"프랑스어·월로프어", currency:"세파프랑 (XOF)", timezone:"UTC+0", bestSeason:"Nov–May", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+221", drive:"우측", tagline:"서아프리카의 활기찬 관문", continent:"아프리카", emoji:"🇸🇳" },
  "Kazakhstan": { capital:"아스타나", population:"2,000만", area:"2,724,900 km²", lang:"카자흐어·러시아어", currency:"텡게 (KZT)", timezone:"UTC+5~6", bestSeason:"May–Sep", visa:"30일 무비자", voltage:"220V / 50Hz", callCode:"+7", drive:"우측", tagline:"중앙아시아의 대초원 강국", continent:"아시아", emoji:"🇰🇿" },
  "Afghanistan": { capital:"카불", population:"4,200만", area:"652,230 km²", lang:"다리어·파슈토어", currency:"아프가니 (AFN)", timezone:"UTC+4:30", bestSeason:"Apr–Jun, Sep–Oct", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+93", drive:"우측", tagline:"실크로드의 교차로", continent:"아시아", emoji:"🇦🇫" },
  "Algeria": { capital:"알제", population:"4,600만", area:"2,381,741 km²", lang:"아랍어·베르베르어", currency:"디나르 (DZD)", timezone:"UTC+1", bestSeason:"Mar–May, Oct–Nov", visa:"비자 필요", voltage:"230V / 50Hz", callCode:"+213", drive:"우측", tagline:"아프리카 최대 영토의 사하라 나라", continent:"아프리카", emoji:"🇩🇿" },
  "Angola": { capital:"루안다", population:"3,600만", area:"1,246,700 km²", lang:"포르투갈어", currency:"콴자 (AOA)", timezone:"UTC+1", bestSeason:"May–Oct", visa:"e-비자", voltage:"220V / 50Hz", callCode:"+244", drive:"우측", tagline:"아프리카 서남부의 떠오르는 나라", continent:"아프리카", emoji:"🇦🇴" },
  "Armenia": { capital:"예레반", population:"300만", area:"29,743 km²", lang:"아르메니아어", currency:"드람 (AMD)", timezone:"UTC+4", bestSeason:"May–Oct", visa:"180일 무비자", voltage:"230V / 50Hz", callCode:"+374", drive:"우측", tagline:"노아의 방주가 머문 아라라트의 나라", continent:"아시아/유럽", emoji:"🇦🇲" },
  "Azerbaijan": { capital:"바쿠", population:"1,040만", area:"86,600 km²", lang:"아제르바이잔어", currency:"마나트 (AZN)", timezone:"UTC+4", bestSeason:"Apr–Jun, Sep–Oct", visa:"e-비자", voltage:"220V / 50Hz", callCode:"+994", drive:"우측", tagline:"불의 나라, 카스피해의 보석", continent:"아시아/유럽", emoji:"🇦🇿" },
  "Bahrain": { capital:"마나마", population:"150만", area:"786 km²", lang:"아랍어", currency:"디나르 (BHD)", timezone:"UTC+3", bestSeason:"Nov–Apr", visa:"e-비자", voltage:"230V / 50Hz", callCode:"+973", drive:"우측", tagline:"페르시아만의 진주 섬나라", continent:"아시아(중동)", emoji:"🇧🇭" },
  "Bangladesh": { capital:"다카", population:"1억 7,300만", area:"147,570 km²", lang:"벵골어", currency:"타카 (BDT)", timezone:"UTC+6", bestSeason:"Nov–Feb", visa:"도착 비자", voltage:"220V / 50Hz", callCode:"+880", drive:"좌측", tagline:"황금빛 벵골, 물의 나라", continent:"아시아", emoji:"🇧🇩" },
  "Belarus": { capital:"민스크", population:"930만", area:"207,600 km²", lang:"벨라루스어·러시아어", currency:"루블 (BYN)", timezone:"UTC+3", bestSeason:"Apr–Oct", visa:"30일 무비자", voltage:"220V / 50Hz", callCode:"+375", drive:"우측", tagline:"동유럽의 녹색 심장", continent:"유럽", emoji:"🇧🇾" },
  "Belize": { capital:"벨모판", population:"43만", area:"22,966 km²", lang:"영어", currency:"달러 (BZD)", timezone:"UTC-6", bestSeason:"Nov–Apr", visa:"90일 무비자", voltage:"110/220V / 60Hz", callCode:"+501", drive:"우측", tagline:"카리브해의 마야 유적과 블루홀", continent:"북아메리카", emoji:"🇧🇿" },
  "Benin": { capital:"포르토노보", population:"1,350만", area:"112,622 km²", lang:"프랑스어", currency:"세파프랑 (XOF)", timezone:"UTC+1", bestSeason:"Nov–Mar", visa:"e-비자", voltage:"220V / 50Hz", callCode:"+229", drive:"우측", tagline:"부두교의 발상지", continent:"아프리카", emoji:"🇧🇯" },
  "Bhutan": { capital:"팀부", population:"78만", area:"38,394 km²", lang:"종카어", currency:"눌트럼 (BTN)", timezone:"UTC+6", bestSeason:"Mar–May, Sep–Nov", visa:"관광세 필요", voltage:"230V / 50Hz", callCode:"+975", drive:"좌측", tagline:"행복지수의 나라, 히말라야의 왕국", continent:"아시아", emoji:"🇧🇹" },
  "Bosnia and Herzegovina": { capital:"사라예보", population:"320만", area:"51,197 km²", lang:"보스니아어·크로아티아어·세르비아어", currency:"마르카 (BAM)", timezone:"UTC+1", bestSeason:"Apr–Oct", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+387", drive:"우측", tagline:"동서양 문화가 교차하는 발칸의 보석", continent:"유럽", emoji:"🇧🇦" },
  "Botswana": { capital:"가보로네", population:"260만", area:"581,730 km²", lang:"영어·츠와나어", currency:"풀라 (BWP)", timezone:"UTC+2", bestSeason:"Apr–Oct", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+267", drive:"좌측", tagline:"오카방고 델타의 야생 왕국", continent:"아프리카", emoji:"🇧🇼" },
  "Brunei": { capital:"반다르스리브가완", population:"45만", area:"5,765 km²", lang:"말레이어·영어", currency:"달러 (BND)", timezone:"UTC+8", bestSeason:"Feb–Apr", visa:"90일 무비자", voltage:"240V / 50Hz", callCode:"+673", drive:"좌측", tagline:"보르네오의 황금빛 모스크 왕국", continent:"아시아", emoji:"🇧🇳" },
  "Burkina Faso": { capital:"와가두구", population:"2,300만", area:"274,200 km²", lang:"프랑스어", currency:"세파프랑 (XOF)", timezone:"UTC+0", bestSeason:"Nov–Mar", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+226", drive:"우측", tagline:"정직한 사람들의 나라", continent:"아프리카", emoji:"🇧🇫" },
  "Burundi": { capital:"기테가", population:"1,300만", area:"27,834 km²", lang:"키룬디어·프랑스어", currency:"프랑 (BIF)", timezone:"UTC+2", bestSeason:"Jun–Sep", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+257", drive:"우측", tagline:"아프리카의 심장부", continent:"아프리카", emoji:"🇧🇮" },
  "Cabo Verde": { capital:"프라이아", population:"60만", area:"4,033 km²", lang:"포르투갈어", currency:"에스쿠도 (CVE)", timezone:"UTC-1", bestSeason:"Nov–Jun", visa:"도착 비자", voltage:"220V / 50Hz", callCode:"+238", drive:"우측", tagline:"대서양의 화산섬 군도", continent:"아프리카", emoji:"🇨🇻" },
  "Cameroon": { capital:"야운데", population:"2,900만", area:"475,442 km²", lang:"프랑스어·영어", currency:"세파프랑 (XAF)", timezone:"UTC+1", bestSeason:"Nov–Mar", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+237", drive:"우측", tagline:"아프리카의 축소판", continent:"아프리카", emoji:"🇨🇲" },
  "Central African Republic": { capital:"방기", population:"550만", area:"622,984 km²", lang:"프랑스어·상고어", currency:"세파프랑 (XAF)", timezone:"UTC+1", bestSeason:"Dec–Apr", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+236", drive:"우측", tagline:"아프리카 대륙의 중심", continent:"아프리카", emoji:"🇨🇫" },
  "Chad": { capital:"은자메나", population:"1,800만", area:"1,284,000 km²", lang:"프랑스어·아랍어", currency:"세파프랑 (XAF)", timezone:"UTC+1", bestSeason:"Nov–Feb", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+235", drive:"우측", tagline:"사하라와 사헬의 만남", continent:"아프리카", emoji:"🇹🇩" },
  "Comoros": { capital:"모로니", population:"90만", area:"2,235 km²", lang:"코모로어·아랍어·프랑스어", currency:"프랑 (KMF)", timezone:"UTC+3", bestSeason:"May–Oct", visa:"도착 비자", voltage:"220V / 50Hz", callCode:"+269", drive:"우측", tagline:"인도양의 향기로운 섬", continent:"아프리카", emoji:"🇰🇲" },
  "Democratic Republic of the Congo": { capital:"킨샤사", population:"1억 200만", area:"2,344,858 km²", lang:"프랑스어", currency:"프랑 (CDF)", timezone:"UTC+1~2", bestSeason:"Jun–Sep", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+243", drive:"우측", tagline:"콩고강의 거대한 초록빛 심장", continent:"아프리카", emoji:"🇨🇩" },
  "Djibouti": { capital:"지부티시", population:"110만", area:"23,200 km²", lang:"프랑스어·아랍어", currency:"프랑 (DJF)", timezone:"UTC+3", bestSeason:"Oct–Apr", visa:"e-비자", voltage:"220V / 50Hz", callCode:"+253", drive:"우측", tagline:"아프리카의 뿔 관문", continent:"아프리카", emoji:"🇩🇯" },
  "El Salvador": { capital:"산살바도르", population:"640만", area:"21,041 km²", lang:"스페인어", currency:"달러 (USD)", timezone:"UTC-6", bestSeason:"Nov–Apr", visa:"90일 무비자", voltage:"115V / 60Hz", callCode:"+503", drive:"우측", tagline:"중미의 화산과 서핑의 나라", continent:"북아메리카", emoji:"🇸🇻" },
  "Equatorial Guinea": { capital:"말라보", population:"170만", area:"28,051 km²", lang:"스페인어·프랑스어·포르투갈어", currency:"세파프랑 (XAF)", timezone:"UTC+1", bestSeason:"Jun–Aug", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+240", drive:"우측", tagline:"기니만의 열대 왕국", continent:"아프리카", emoji:"🇬🇶" },
  "Eritrea": { capital:"아스마라", population:"360만", area:"117,600 km²", lang:"티그리냐어·아랍어", currency:"낙파 (ERN)", timezone:"UTC+3", bestSeason:"Oct–Apr", visa:"비자 필요", voltage:"230V / 50Hz", callCode:"+291", drive:"우측", tagline:"홍해의 아르데코 수도", continent:"아프리카", emoji:"🇪🇷" },
  "Eswatini": { capital:"음바바네", population:"120만", area:"17,364 km²", lang:"스와티어·영어", currency:"릴랑게니 (SZL)", timezone:"UTC+2", bestSeason:"Apr–Sep", visa:"30일 무비자", voltage:"230V / 50Hz", callCode:"+268", drive:"좌측", tagline:"아프리카 마지막 절대왕정", continent:"아프리카", emoji:"🇸🇿" },
  "Gabon": { capital:"리브르빌", population:"240만", area:"267,668 km²", lang:"프랑스어", currency:"세파프랑 (XAF)", timezone:"UTC+1", bestSeason:"Jun–Aug", visa:"e-비자", voltage:"220V / 50Hz", callCode:"+241", drive:"우측", tagline:"적도 아프리카의 초록 보석", continent:"아프리카", emoji:"🇬🇦" },
  "Gambia": { capital:"반줄", population:"270만", area:"11,295 km²", lang:"영어", currency:"달라시 (GMD)", timezone:"UTC+0", bestSeason:"Nov–May", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+220", drive:"우측", tagline:"아프리카 대륙 최소 국가", continent:"아프리카", emoji:"🇬🇲" },
  "Guinea": { capital:"코나크리", population:"1,400만", area:"245,857 km²", lang:"프랑스어", currency:"프랑 (GNF)", timezone:"UTC+0", bestSeason:"Nov–Apr", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+224", drive:"우측", tagline:"서아프리카의 물의 탑", continent:"아프리카", emoji:"🇬🇳" },
  "Guinea-Bissau": { capital:"비사우", population:"210만", area:"36,125 km²", lang:"포르투갈어", currency:"세파프랑 (XOF)", timezone:"UTC+0", bestSeason:"Nov–May", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+245", drive:"우측", tagline:"비자고스 군도의 자연 낙원", continent:"아프리카", emoji:"🇬🇼" },
  "Guyana": { capital:"조지타운", population:"80만", area:"214,969 km²", lang:"영어", currency:"달러 (GYD)", timezone:"UTC-4", bestSeason:"Feb–Apr, Aug–Oct", visa:"90일 무비자", voltage:"240V / 60Hz", callCode:"+592", drive:"좌측", tagline:"남미의 영어권 열대 우림", continent:"남아메리카", emoji:"🇬🇾" },
  "Haiti": { capital:"포르토프랭스", population:"1,200만", area:"27,750 km²", lang:"프랑스어·아이티크레올어", currency:"구르드 (HTG)", timezone:"UTC-5", bestSeason:"Dec–Apr", visa:"90일 무비자", voltage:"110V / 60Hz", callCode:"+509", drive:"우측", tagline:"카리브해 최초의 흑인 공화국", continent:"북아메리카", emoji:"🇭🇹" },
  "Honduras": { capital:"테구시갈파", population:"1,050만", area:"112,090 km²", lang:"스페인어", currency:"렘피라 (HNL)", timezone:"UTC-6", bestSeason:"Nov–Apr", visa:"90일 무비자", voltage:"120V / 60Hz", callCode:"+504", drive:"우측", tagline:"마야 유적 코판의 나라", continent:"북아메리카", emoji:"🇭🇳" },
  "Iraq": { capital:"바그다드", population:"4,400만", area:"438,317 km²", lang:"아랍어·쿠르드어", currency:"디나르 (IQD)", timezone:"UTC+3", bestSeason:"Oct–Apr", visa:"도착 비자", voltage:"230V / 50Hz", callCode:"+964", drive:"우측", tagline:"메소포타미아 문명의 발상지", continent:"아시아(중동)", emoji:"🇮🇶" },
  "Ivory Coast": { capital:"야무수크로", population:"2,900만", area:"322,463 km²", lang:"프랑스어", currency:"세파프랑 (XOF)", timezone:"UTC+0", bestSeason:"Nov–Mar", visa:"e-비자", voltage:"220V / 50Hz", callCode:"+225", drive:"우측", tagline:"서아프리카의 경제 수도", continent:"아프리카", emoji:"🇨🇮" },
  "Kosovo": { capital:"프리슈티나", population:"180만", area:"10,887 km²", lang:"알바니아어·세르비아어", currency:"유로 (EUR)", timezone:"UTC+1", bestSeason:"Apr–Sep", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+383", drive:"우측", tagline:"발칸의 젊은 나라", continent:"유럽", emoji:"🇽🇰" },
  "Kuwait": { capital:"쿠웨이트시티", population:"470만", area:"17,818 km²", lang:"아랍어", currency:"디나르 (KWD)", timezone:"UTC+3", bestSeason:"Oct–Apr", visa:"e-비자", voltage:"240V / 50Hz", callCode:"+965", drive:"우측", tagline:"페르시아만의 석유 부국", continent:"아시아(중동)", emoji:"🇰🇼" },
  "Kyrgyzstan": { capital:"비슈케크", population:"700만", area:"199,951 km²", lang:"키르기스어·러시아어", currency:"솜 (KGS)", timezone:"UTC+6", bestSeason:"Jun–Sep", visa:"60일 무비자", voltage:"220V / 50Hz", callCode:"+996", drive:"우측", tagline:"중앙아시아의 스위스", continent:"아시아", emoji:"🇰🇬" },
  "Lesotho": { capital:"마세루", population:"230만", area:"30,355 km²", lang:"소토어·영어", currency:"로티 (LSL)", timezone:"UTC+2", bestSeason:"Oct–Apr", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+266", drive:"좌측", tagline:"하늘의 왕국, 아프리카의 스위스", continent:"아프리카", emoji:"🇱🇸" },
  "Liberia": { capital:"몬로비아", population:"540만", area:"111,369 km²", lang:"영어", currency:"달러 (LRD)", timezone:"UTC+0", bestSeason:"Nov–Apr", visa:"비자 필요", voltage:"120V / 60Hz", callCode:"+231", drive:"우측", tagline:"자유의 땅, 아프리카 최초 공화국", continent:"아프리카", emoji:"🇱🇷" },
  "Libya": { capital:"트리폴리", population:"700만", area:"1,759,540 km²", lang:"아랍어", currency:"디나르 (LYD)", timezone:"UTC+2", bestSeason:"Mar–May, Sep–Nov", visa:"비자 필요", voltage:"230V / 50Hz", callCode:"+218", drive:"우측", tagline:"사하라와 지중해가 만나는 땅", continent:"아프리카", emoji:"🇱🇾" },
  "Malawi": { capital:"릴롱궤", population:"2,100만", area:"118,484 km²", lang:"영어·체와어", currency:"콰차 (MWK)", timezone:"UTC+2", bestSeason:"Apr–Oct", visa:"도착 비자", voltage:"230V / 50Hz", callCode:"+265", drive:"좌측", tagline:"아프리카의 따뜻한 심장", continent:"아프리카", emoji:"🇲🇼" },
  "Mali": { capital:"바마코", population:"2,300만", area:"1,240,192 km²", lang:"프랑스어", currency:"세파프랑 (XOF)", timezone:"UTC+0", bestSeason:"Nov–Feb", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+223", drive:"우측", tagline:"팀북투와 사하라의 나라", continent:"아프리카", emoji:"🇲🇱" },
  "Mauritania": { capital:"누악쇼트", population:"480만", area:"1,030,700 km²", lang:"아랍어", currency:"우기야 (MRU)", timezone:"UTC+0", bestSeason:"Apr–Oct", visa:"도착 비자", voltage:"220V / 50Hz", callCode:"+222", drive:"우측", tagline:"사하라 서쪽 끝의 사막 나라", continent:"아프리카", emoji:"🇲🇷" },
  "Moldova": { capital:"키시나우", population:"260만", area:"33,851 km²", lang:"루마니아어", currency:"레우 (MDL)", timezone:"UTC+2", bestSeason:"Apr–Oct", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+373", drive:"우측", tagline:"유럽의 숨겨진 와인 나라", continent:"유럽", emoji:"🇲🇩" },
  "Mozambique": { capital:"마푸토", population:"3,300만", area:"801,590 km²", lang:"포르투갈어", currency:"메티칼 (MZN)", timezone:"UTC+2", bestSeason:"Apr–Oct", visa:"도착 비자", voltage:"220V / 50Hz", callCode:"+258", drive:"좌측", tagline:"인도양의 긴 해안선", continent:"아프리카", emoji:"🇲🇿" },
  "Nicaragua": { capital:"마나과", population:"690만", area:"130,373 km²", lang:"스페인어", currency:"코르도바 (NIO)", timezone:"UTC-6", bestSeason:"Nov–Apr", visa:"90일 무비자", voltage:"120V / 60Hz", callCode:"+505", drive:"우측", tagline:"호수와 화산의 나라", continent:"북아메리카", emoji:"🇳🇮" },
  "Niger": { capital:"니아메", population:"2,700만", area:"1,267,000 km²", lang:"프랑스어", currency:"세파프랑 (XOF)", timezone:"UTC+1", bestSeason:"Nov–Feb", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+227", drive:"우측", tagline:"사하라 남쪽 사헬의 나라", continent:"아프리카", emoji:"🇳🇪" },
  "Nigeria": { capital:"아부자", population:"2억 2,400만", area:"923,768 km²", lang:"영어", currency:"나이라 (NGN)", timezone:"UTC+1", bestSeason:"Apr–Oct", visa:"비자 필요", voltage:"240V / 50Hz", callCode:"+234", drive:"우측", tagline:"아프리카의 거인, 놀리우드의 나라", continent:"아프리카", emoji:"🇳🇬" },
  "North Korea": { capital:"평양", population:"2,600만", area:"120,538 km²", lang:"한국어", currency:"원 (KPW)", timezone:"UTC+9", bestSeason:"Apr–Oct", visa:"특별 비자 필요", voltage:"220V / 50Hz", callCode:"+850", drive:"우측", tagline:"한반도 북쪽의 폐쇄된 나라", continent:"아시아", emoji:"🇰🇵" },
  "North Macedonia": { capital:"스코페", population:"210만", area:"25,713 km²", lang:"마케도니아어", currency:"디나르 (MKD)", timezone:"UTC+1", bestSeason:"Apr–Oct", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+389", drive:"우측", tagline:"알렉산더 대왕의 고향", continent:"유럽", emoji:"🇲🇰" },
  "Papua New Guinea": { capital:"포트모르즈비", population:"1,000만", area:"462,840 km²", lang:"영어·톡피신어·히리모투어", currency:"키나 (PGK)", timezone:"UTC+10", bestSeason:"May–Oct", visa:"도착 비자", voltage:"240V / 50Hz", callCode:"+675", drive:"좌측", tagline:"800개 언어의 열대 다양성", continent:"오세아니아", emoji:"🇵🇬" },
  "Paraguay": { capital:"아순시온", population:"720만", area:"406,752 km²", lang:"스페인어·과라니어", currency:"과라니 (PYG)", timezone:"UTC-4", bestSeason:"May–Sep", visa:"90일 무비자", voltage:"220V / 50Hz", callCode:"+595", drive:"우측", tagline:"남미의 심장, 이중 언어의 나라", continent:"남아메리카", emoji:"🇵🇾" },
  "Republic of the Congo": { capital:"브라자빌", population:"600만", area:"342,000 km²", lang:"프랑스어", currency:"세파프랑 (XAF)", timezone:"UTC+1", bestSeason:"Jun–Aug", visa:"비자 필요", voltage:"230V / 50Hz", callCode:"+242", drive:"우측", tagline:"콩고강변의 열대림 나라", continent:"아프리카", emoji:"🇨🇬" },
  "Sierra Leone": { capital:"프리타운", population:"870만", area:"71,740 km²", lang:"영어", currency:"레온 (SLE)", timezone:"UTC+0", bestSeason:"Nov–Apr", visa:"도착 비자", voltage:"230V / 50Hz", callCode:"+232", drive:"우측", tagline:"서아프리카의 해변 보석", continent:"아프리카", emoji:"🇸🇱" },
  "Somalia": { capital:"모가디슈", population:"1,800만", area:"637,657 km²", lang:"소말리어·아랍어", currency:"실링 (SOS)", timezone:"UTC+3", bestSeason:"Nov–Mar", visa:"도착 비자", voltage:"220V / 50Hz", callCode:"+252", drive:"우측", tagline:"아프리카의 뿔", continent:"아프리카", emoji:"🇸🇴" },
  "South Sudan": { capital:"주바", population:"1,100만", area:"644,329 km²", lang:"영어", currency:"파운드 (SSP)", timezone:"UTC+2", bestSeason:"Dec–Apr", visa:"비자 필요", voltage:"230V / 50Hz", callCode:"+211", drive:"우측", tagline:"세계에서 가장 젊은 나라", continent:"아프리카", emoji:"🇸🇸" },
  "Sudan": { capital:"하르툼", population:"4,800만", area:"1,861,484 km²", lang:"아랍어·영어", currency:"파운드 (SDG)", timezone:"UTC+2", bestSeason:"Nov–Mar", visa:"비자 필요", voltage:"230V / 50Hz", callCode:"+249", drive:"우측", tagline:"나일강이 만나는 누비아의 땅", continent:"아프리카", emoji:"🇸🇩" },
  "Suriname": { capital:"파라마리보", population:"62만", area:"163,820 km²", lang:"네덜란드어", currency:"달러 (SRD)", timezone:"UTC-3", bestSeason:"Feb–Apr, Aug–Oct", visa:"관광카드 필요", voltage:"127/220V / 60Hz", callCode:"+597", drive:"좌측", tagline:"남미의 네덜란드 유산", continent:"남아메리카", emoji:"🇸🇷" },
  "Syria": { capital:"다마스쿠스", population:"2,200만", area:"185,180 km²", lang:"아랍어", currency:"파운드 (SYP)", timezone:"UTC+3", bestSeason:"Mar–May, Sep–Nov", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+963", drive:"우측", tagline:"세계에서 가장 오래된 수도", continent:"아시아(중동)", emoji:"🇸🇾" },
  "Tajikistan": { capital:"두샨베", population:"1,000만", area:"143,100 km²", lang:"타지크어", currency:"소모니 (TJS)", timezone:"UTC+5", bestSeason:"May–Oct", visa:"e-비자", voltage:"220V / 50Hz", callCode:"+992", drive:"우측", tagline:"파미르 고원의 지붕", continent:"아시아", emoji:"🇹🇯" },
  "Timor-Leste": { capital:"딜리", population:"140만", area:"14,874 km²", lang:"테툼어·포르투갈어", currency:"달러 (USD)", timezone:"UTC+9", bestSeason:"May–Oct", visa:"도착 비자", voltage:"220V / 50Hz", callCode:"+670", drive:"좌측", tagline:"동남아시아의 가장 젊은 나라", continent:"아시아", emoji:"🇹🇱" },
  "Togo": { capital:"로메", population:"900만", area:"56,785 km²", lang:"프랑스어", currency:"세파프랑 (XOF)", timezone:"UTC+0", bestSeason:"Nov–Mar", visa:"도착 비자", voltage:"220V / 50Hz", callCode:"+228", drive:"우측", tagline:"서아프리카의 가늘고 긴 나라", continent:"아프리카", emoji:"🇹🇬" },
  "Trinidad and Tobago": { capital:"포트오브스페인", population:"140만", area:"5,130 km²", lang:"영어", currency:"달러 (TTD)", timezone:"UTC-4", bestSeason:"Jan–May", visa:"90일 무비자", voltage:"115V / 60Hz", callCode:"+1-868", drive:"좌측", tagline:"카리브해 카니발의 섬", continent:"남아메리카", emoji:"🇹🇹" },
  "Turkmenistan": { capital:"아시가바트", population:"640만", area:"488,100 km²", lang:"투르크멘어", currency:"마나트 (TMT)", timezone:"UTC+5", bestSeason:"Mar–May, Sep–Nov", visa:"비자 필요", voltage:"220V / 50Hz", callCode:"+993", drive:"우측", tagline:"카라쿰 사막의 하얀 대리석 도시", continent:"아시아", emoji:"🇹🇲" },
  "Uganda": { capital:"캄팔라", population:"4,800만", area:"241,038 km²", lang:"영어·스와힐리어", currency:"실링 (UGX)", timezone:"UTC+3", bestSeason:"Jun–Sep, Dec–Feb", visa:"e-비자", voltage:"240V / 50Hz", callCode:"+256", drive:"좌측", tagline:"아프리카의 진주, 마운틴고릴라의 나라", continent:"아프리카", emoji:"🇺🇬" },
  "Uruguay": { capital:"몬테비데오", population:"350만", area:"176,215 km²", lang:"스페인어", currency:"페소 (UYU)", timezone:"UTC-3", bestSeason:"Nov–Mar", visa:"90일 무비자", voltage:"230V / 50Hz", callCode:"+598", drive:"우측", tagline:"남미의 스위스, 진보의 나라", continent:"남아메리카", emoji:"🇺🇾" },
  "Venezuela": { capital:"카라카스", population:"2,850만", area:"916,445 km²", lang:"스페인어", currency:"볼리바르 (VES)", timezone:"UTC-4", bestSeason:"Dec–Apr", visa:"90일 무비자", voltage:"120V / 60Hz", callCode:"+58", drive:"우측", tagline:"앙헬 폭포와 카리브 해변의 나라", continent:"남아메리카", emoji:"🇻🇪" },
  "Yemen": { capital:"사나", population:"3,400만", area:"527,968 km²", lang:"아랍어", currency:"리얄 (YER)", timezone:"UTC+3", bestSeason:"Oct–Mar", visa:"비자 필요", voltage:"230V / 50Hz", callCode:"+967", drive:"우측", tagline:"아라비아 반도의 고대 왕국", continent:"아시아(중동)", emoji:"🇾🇪" },
  "Zambia": { capital:"루사카", population:"2,000만", area:"752,618 km²", lang:"영어", currency:"콰차 (ZMW)", timezone:"UTC+2", bestSeason:"May–Oct", visa:"e-비자", voltage:"230V / 50Hz", callCode:"+260", drive:"좌측", tagline:"빅토리아 폭포의 또 다른 관문", continent:"아프리카", emoji:"🇿🇲" },
}

// ── 국가 정보 다국어 번역 시스템 (Intl API 기반) ──────────────────
const LANG_CODE = {
'한국어':'ko','일본어':'ja','영어':'en','중국어':'zh','중국어(보통화)':'zh','중국어(정체)':'zh-Hant',
'프랑스어':'fr','스페인어':'es','독일어':'de','이탈리아어':'it','포르투갈어':'pt','러시아어':'ru',
'아랍어':'ar','힌디어':'hi','태국어':'th','베트남어':'vi','인도네시아어':'id','말레이어':'ms',
'터키어':'tr','폴란드어':'pl','네덜란드어':'nl','체코어':'cs','헝가리어':'hu','그리스어':'el',
'스웨덴어':'sv','노르웨이어':'no','덴마크어':'da','핀란드어':'fi','아이슬란드어':'is',
'크로아티아어':'hr','세르비아어':'sr','불가리아어':'bg','루마니아어':'ro','우크라이나어':'uk',
'슬로바키아어':'sk','알바니아어':'sq','리투아니아어':'lt','라트비아어':'lv','에스토니아어':'et',
'조지아어':'ka','아르메니아어':'hy','아제르바이잔어':'az','카자흐어':'kk','우즈베크어':'uz',
'투르크멘어':'tk','키르기스어':'ky','타지크어':'tg','몽골어':'mn','페르시아어':'fa',
'히브리어':'he','쿠르드어':'ku','우르두어':'ur','벵골어':'bn','싱할라어':'si','타밀어':'ta',
'네팔어':'ne','미얀마어':'my','크메르어':'km','라오어':'lo','필리핀어':'fil','마오리어':'mi',
'피지어':'fj','사모아어':'sm','톡피신어':'tpi','히리모투어':'ho','테툼어':'tet',
'스와힐리어':'sw','암하라어':'am','소말리어':'so','티그리냐어':'ti','월로프어':'wo',
'키냐르완다어':'rw','키룬디어':'rn','마케도니아어':'mk','몬테네그로어':'cnr',
'보스니아어':'bs','룩셈부르크어':'lb','아일랜드어':'ga','로만슈어':'rm',
'마다가스카르어':'mg','디베히어':'dv','종카어':'dz','파슈토어':'ps','다리어':'prs',
'벨라루스어':'be','과라니어':'gn','케추아어':'qu','아이마라어':'ay','아이티크레올어':'ht',
'크레올어':'ht','코모로어':'zdj','상고어':'sg','소토어':'st','츠와나어':'tn',
'쇼나어':'sn','은데벨레어':'nd','스와티어':'ss','체와어':'ny','베르베르어':'ber',
'말라가시어':'mg',
}
const CONTINENT_I18N = {
  '아시아':{en:'Asia',ja:'アジア',zh:'亚洲'},
  '아시아(중동)':{en:'Asia (Middle East)',ja:'アジア（中東）',zh:'亚洲（中东）'},
  '아시아/유럽':{en:'Asia / Europe',ja:'アジア/ヨーロッパ',zh:'亚洲/欧洲'},
  '유럽':{en:'Europe',ja:'ヨーロッパ',zh:'欧洲'},
  '유럽/아시아':{en:'Europe / Asia',ja:'ヨーロッパ/アジア',zh:'欧洲/亚洲'},
  '북아메리카':{en:'North America',ja:'北アメリカ',zh:'北美洲'},
  '남아메리카':{en:'South America',ja:'南アメリカ',zh:'南美洲'},
  '아프리카':{en:'Africa',ja:'アフリカ',zh:'非洲'},
  '오세아니아':{en:'Oceania',ja:'オセアニア',zh:'大洋洲'},
}
const DRIVE_I18N = {'우측':{en:'Right',ja:'右側通行',zh:'靠右行驶'},'좌측':{en:'Left',ja:'左側通行',zh:'靠左行驶'}}
const translateVisa = (v, lang) => {
  if (lang==='ko') return v
  const m = v.match(/^(\d+)(일|개월) 무비자$/)
  if (m) { const n=m[1],u=m[2]==='일'?{en:'day',ja:'日',zh:'天'}:{en:'month',ja:'ヶ月',zh:'个月'}; return lang==='en'?`${n}-${u[lang]} visa-free`:lang==='ja'?`${n}${u[lang]}ビザ免除`:`${n}${u[lang]}免签` }
  if (v==='1년 무비자') return lang==='en'?'1-year visa-free':lang==='ja'?'1年ビザ免除':'1年免签'
  if (v==='무비자') return lang==='en'?'Visa-free':lang==='ja'?'ビザ免除':'免签'
  if (v==='비자 필요') return lang==='en'?'Visa required':lang==='ja'?'ビザ必要':'需要签证'
  if (v==='특별 비자 필요') return lang==='en'?'Special visa required':lang==='ja'?'特別ビザ必要':'需要特别签证'
  if (v==='도착 비자') return lang==='en'?'Visa on arrival':lang==='ja'?'到着ビザ':'落地签'
  if (v==='e-비자') return lang==='en'?'e-Visa':lang==='ja'?'e-ビザ':'电子签证'
  if (v==='ETA 필요'||v==='eTA 필요') return lang==='en'?'ETA required':lang==='ja'?'ETA必要':'需要ETA'
  if (v==='ESTA 필요') return lang==='en'?'ESTA required':lang==='ja'?'ESTA必要':'需要ESTA'
  if (v==='관광세 필요') return lang==='en'?'Tourist tax required':lang==='ja'?'観光税必要':'需要旅游税'
  if (v==='관광카드 필요') return lang==='en'?'Tourist card required':lang==='ja'?'ツーリストカード必要':'需要旅游卡'
  if (v==='—') return '—'
  return v
}
const translateTimeDiff = (v, lang) => {
  if (lang==='ko'||v==='—') return v
  if (v==='시차 없음') return lang==='en'?'No time diff.':lang==='ja'?'時差なし':'无时差'
  const m = v.match(/^([+-]?[\d.]+)(시간)$/)
  if (m) return lang==='en'?`${m[1]} hr`:lang==='ja'?`${m[1]}時間`:`${m[1]}小时`
  const m2 = v.match(/^(.+)~(.+)(시간)$/)
  if (m2) return lang==='en'?`${m2[1]}~${m2[2]} hr`:lang==='ja'?`${m2[1]}~${m2[2]}時間`:`${m2[1]}~${m2[2]}小时`
  return v
}
// 관광지 openTime/price 한국어 패턴 번역
const translatePopulation = (v, lang) => {
  if (lang === 'ko' || !v) return v
  // Parse Korean number: "14억 2,600만" → number
  let total = 0
  const eok = v.match(/([\d,]+)억/)
  const man = v.match(/([\d,]+)만/)
  if (eok) total += parseFloat(eok[1].replace(/,/g, '')) * 100000000
  if (man) total += parseFloat(man[1].replace(/,/g, '')) * 10000
  if (total === 0) return v
  if (lang === 'ja') {
    // Japanese uses same 億/万 system
    if (total >= 100000000) return `${(total/100000000).toFixed(total%100000000===0?0:1)}億人`
    return `${Math.round(total/10000)}万人`
  }
  if (lang === 'zh') {
    if (total >= 100000000) return `${(total/100000000).toFixed(total%100000000===0?0:1)}亿`
    return `${Math.round(total/10000)}万`
  }
  // English
  if (total >= 1000000000) return `${(total/1000000000).toFixed(total%1000000000<50000000?1:2)}B`
  if (total >= 1000000) return `${(total/1000000).toFixed(total%1000000<50000?0:1)}M`
  if (total >= 1000) return `${Math.round(total/1000)}K`
  return total.toLocaleString()
}
const KO_WORD_MAP = {
  en:{무료:'Free',시간:'Hours',일몰:'sunset',일출:'sunrise',성인:'Adult',어린이:'Child',학생:'Student',
  '계절별':'seasonal','시즌별 상이':'varies','야외':'outdoor','입산':'hiking','투어':'tour',
  '외국인':'foreign','케이블카':'cable car','페리 포함':'incl. ferry','통합권':'combo',
  '구역입장료':'zone entry','보트투어':'boat tour','1일권':'1-day pass','화~일':'Tue-Sun',
  '월·수~토':'Mon,Wed-Sat','화~목,토,일':'Tue-Thu,Sat,Sun','비무슬림':'non-Muslim','수도원별':'per monastery',
  원:'KRW',바트:'THB',위안:'CNY',엔:'JPY',루피:'IDR'},
  ja:{무료:'無料',시간:'時間',일몰:'日没',일출:'日の出',성인:'大人',어린이:'子供',학생:'学生',
  '계절별':'季節別','시즌별 상이':'季節により異なる','야외':'屋外','투어':'ツアー','외국인':'外国人',
  '케이블카':'ケーブルカー','통합권':'統合券','보트투어':'ボートツアー','1일권':'1日券',원:'ウォン'},
  zh:{무료:'免费',시간:'小时',일몰:'日落',일출:'日出',성인:'成人',어린이:'儿童',학생:'学生',
  '계절별':'按季节','시즌별 상이':'因季节而异','야외':'户外','투어':'旅游团','외국인':'外国人',
  '케이블카':'缆车','통합권':'套票','보트투어':'游船','1일권':'一日票',원:'韩元'},
}
const translateSpotField = (str, lang) => {
  if (!str || lang === 'ko') return str
  const map = KO_WORD_MAP[lang] || KO_WORD_MAP.en
  let result = str
  // Sort keys by length (longest first) to avoid partial replacements
  const keys = Object.keys(map).sort((a,b) => b.length - a.length)
  for (const k of keys) result = result.replaceAll(k, map[k])
  return result
}
// Intl API 기반 자동 번역
const intlLangMap = lang => lang === 'zh' ? 'zh-Hans' : lang
const translateLangNames = (koLangStr, targetLang) => {
  if (!koLangStr) return koLangStr
  // "영어 외 11개 공용어" 같은 특수 케이스
  if (koLangStr.includes('외')) {
    const m = koLangStr.match(/(.+?) 외 (.+)/)
    if (m) { const first = translateLangNames(m[1], targetLang); return targetLang==='en'?`${first} + ${m[2]}`:targetLang==='ja'?`${first} 他${m[2]}`:`${first} 等${m[2]}` }
  }
  return koLangStr.split('·').map(l => {
    const code = LANG_CODE[l.trim()]
    if (!code) return l.trim()
    try { return new Intl.DisplayNames([intlLangMap(targetLang)], {type:'language'}).of(code) } catch { return l.trim() }
  }).join(' · ')
}
const translateCurrency = (koCurrStr, targetLang) => {
  if (!koCurrStr) return koCurrStr
  const m = koCurrStr.match(/\((\w+)\)/)
  if (!m) return koCurrStr
  const code = m[1]
  try {
    const name = new Intl.DisplayNames([intlLangMap(targetLang)], {type:'currency'}).of(code)
    return `${name} (${code})`
  } catch { return koCurrStr }
}
// 수도 + 태그라인만 수동 번역 (Intl로 처리 불가한 부분)
const COUNTRY_I18N = {
"South Korea":{en:["Seoul","Dynamic Korea — where tradition meets K-wave"],ja:["ソウル","韓流と伝統が共存するダイナミックコリア"],zh:["首尔","韩流与传统共存的活力韩国"]},
"Japan":{en:["Tokyo","Land of tradition and cutting-edge innovation"],ja:["東京","伝統と先端が調和する侍の国"],zh:["东京","传统与尖端并存的武士之国"]},
"China":{en:["Beijing","5,000 years of civilization"],ja:["北京","5千年文明の大陸"],zh:["北京","五千年文明的大陆"]},
"Thailand":{en:["Bangkok","Land of Smiles and golden temples"],ja:["バンコク","微笑みの国、黄金の寺院の地"],zh:["曼谷","微笑之国，金色佛寺之地"]},
"Vietnam":{en:["Hanoi","Asia's rising jewel"],ja:["ハノイ","アジアの新しい宝石"],zh:["河内","亚洲崛起的宝石"]},
"India":{en:["New Delhi","Land of mystical diversity"],ja:["ニューデリー","神秘的な多様性の大国"],zh:["新德里","神秘色彩的多样性大国"]},
"Indonesia":{en:["Jakarta","Tropical paradise of ten thousand islands"],ja:["ジャカルタ","万の島々の熱帯の楽園"],zh:["雅加达","万岛热带天堂"]},
"Malaysia":{en:["Kuala Lumpur","A tropical gem of multicultural harmony"],ja:["クアラルンプール","多民族文化の熱帯の宝石"],zh:["吉隆坡","多民族文化的热带宝石"]},
"Singapore":{en:["Singapore","Asia's jewel, the Garden City"],ja:["シンガポール","アジアの宝石、ガーデンシティ"],zh:["新加坡","亚洲的宝石，花园城市"]},
"Cambodia":{en:["Phnom Penh","Mystical land of Angkor civilization"],ja:["プノンペン","アンコール文明の神秘の国"],zh:["金边","吴哥文明的神秘之国"]},
"Myanmar":{en:["Naypyidaw","Land of golden pagodas"],ja:["ネーピードー","黄金のパゴダの国"],zh:["内比都","金色佛塔之国"]},
"Nepal":{en:["Kathmandu","Country atop the roof of the Himalayas"],ja:["カトマンズ","ヒマラヤの屋根の上の国"],zh:["加德满都","喜马拉雅屋脊上的国度"]},
"Sri Lanka":{en:["Sri Jayawardenepura Kotte","Pearl of the Indian Ocean"],ja:["スリジャヤワルダナプラコッテ","インド洋の真珠"],zh:["斯里贾亚瓦德纳普拉科特","印度洋上的珍珠"]},
"Philippines":{en:["Manila","Tropical paradise of 7,000 islands"],ja:["マニラ","7千の島々の熱帯の楽園"],zh:["马尼拉","七千座岛屿的热带天堂"]},
"United Arab Emirates":{en:["Abu Dhabi","Futuristic cities built on the desert"],ja:["アブダビ","砂漠の上に建てた未来都市"],zh:["阿布扎比","沙漠上建起的未来之城"]},
"Turkey":{en:["Ankara","Crossroads of Eastern and Western civilizations"],ja:["アンカラ","東西文明の交差路"],zh:["安卡拉","东西方文明的十字路口"]},
"Jordan":{en:["Amman","Ancient kingdom of Petra and the Dead Sea"],ja:["アンマン","ペトラと死海の古代王国"],zh:["安曼","佩特拉与死海的古老王国"]},
"Israel":{en:["Jerusalem","Holy land of three religions"],ja:["エルサレム","三宗教の聖地、歴史の地"],zh:["耶路撒冷","三大宗教的圣地"]},
"France":{en:["Paris","Land of art and romance"],ja:["パリ","芸術とロマンの国"],zh:["巴黎","艺术与浪漫之国"]},
"Italy":{en:["Rome","Home of the Roman Empire and Renaissance"],ja:["ローマ","ローマ帝国とルネサンスの故郷"],zh:["罗马","罗马帝国与文艺复兴的故乡"]},
"Spain":{en:["Madrid","Land of sun and passion"],ja:["マドリード","太陽と情熱の国"],zh:["马德里","阳光与热情之国"]},
"Germany":{en:["Berlin","Land of beer, tech and fairy tales"],ja:["ベルリン","ビールと技術と童話の国"],zh:["柏林","啤酒、科技与童话之国"]},
"United Kingdom":{en:["London","A storied nation where the sun never set"],ja:["ロンドン","太陽の沈まない歴史の国"],zh:["伦敦","日不落的历史之国"]},
"Portugal":{en:["Lisbon","Romantic starting point of the Age of Discovery"],ja:["リスボン","大航海時代のロマンの出発点"],zh:["里斯本","大航海时代的浪漫起点"]},
"Netherlands":{en:["Amsterdam","Land of windmills, tulips and freedom"],ja:["アムステルダム","風車とチューリップと自由の国"],zh:["阿姆斯特丹","风车、郁金香与自由之国"]},
"Czechia":{en:["Prague","Land of fairy-tale medieval cities"],ja:["プラハ","童話のような中世都市の国"],zh:["布拉格","童话般中世纪城市之国"]},
"Austria":{en:["Vienna","Land of music and the Alps"],ja:["ウィーン","音楽とアルプスの国"],zh:["维也纳","音乐与阿尔卑斯之国"]},
"Switzerland":{en:["Bern","Precision country at the heart of the Alps"],ja:["ベルン","アルプスの中心の精密な国"],zh:["伯尔尼","阿尔卑斯山中心的精密之国"]},
"Hungary":{en:["Budapest","Pearl of the Danube"],ja:["ブダペスト","ドナウの真珠"],zh:["布达佩斯","多瑙河上的明珠"]},
"Croatia":{en:["Zagreb","Jewel of the Adriatic"],ja:["ザグレブ","アドリア海の宝石"],zh:["萨格勒布","亚得里亚海的宝石"]},
"Slovenia":{en:["Ljubljana","Green country between Alps and Adriatic"],ja:["リュブリャナ","アルプスとアドリア海の緑の国"],zh:["卢布尔雅那","阿尔卑斯与亚得里亚海之间的绿色国度"]},
"Greece":{en:["Athens","Cradle of Western civilization"],ja:["アテネ","西洋文明の揺りかご"],zh:["雅典","西方文明的摇篮"]},
"Norway":{en:["Oslo","Land of fjords and northern lights"],ja:["オスロ","フィヨルドとオーロラの国"],zh:["奥斯陆","峡湾与极光之国"]},
"Sweden":{en:["Stockholm","Scandinavian design and welfare"],ja:["ストックホルム","デザインと福祉のスカンジナビア"],zh:["斯德哥尔摩","设计与福利的斯堪的纳维亚"]},
"Denmark":{en:["Copenhagen","Happy land of fairy tales and hygge"],ja:["コペンハーゲン","幸せな童話の国、ヒュッゲの本場"],zh:["哥本哈根","童话王国，许格的发源地"]},
"Finland":{en:["Helsinki","Land of Santa, saunas and aurora"],ja:["ヘルシンキ","サンタとサウナとオーロラの国"],zh:["赫尔辛基","圣诞老人、桑拿与极光之国"]},
"Iceland":{en:["Reykjavik","Land of fire and ice"],ja:["レイキャヴィーク","火と氷の国"],zh:["雷克雅未克","冰与火之国"]},
"Poland":{en:["Warsaw","Hidden gem of medieval Europe"],ja:["ワルシャワ","中世ヨーロッパの隠れた宝石"],zh:["华沙","中世纪欧洲的隐藏宝石"]},
"Russia":{en:["Moscow","Largest country on Earth"],ja:["モスクワ","世界最大の国"],zh:["莫斯科","世界上面积最大的国家"]},
"Egypt":{en:["Cairo","Land of pharaohs and pyramids"],ja:["カイロ","ファラオとピラミッドの国"],zh:["开罗","法老与金字塔之国"]},
"Morocco":{en:["Rabat","Exotic land of colors and scents"],ja:["ラバト","色と香りのエキゾチックな国"],zh:["拉巴特","色彩与芳香的异域之国"]},
"South Africa":{en:["Pretoria","Rainbow nation at Africa's southern tip"],ja:["プレトリア","アフリカ南端の虹の国"],zh:["比勒陀利亚","非洲南端的彩虹之国"]},
"Kenya":{en:["Nairobi","Land of the Great Migration"],ja:["ナイロビ","大移動の地"],zh:["内罗毕","大迁徙之地"]},
"Tanzania":{en:["Dodoma","Home of Kilimanjaro and Serengeti"],ja:["ドドマ","キリマンジャロとセレンゲティの地"],zh:["多多马","乞力马扎罗与塞伦盖蒂的故乡"]},
"United States of America":{en:["Washington, D.C.","Land of freedom and the American Dream"],ja:["ワシントンD.C.","自由とアメリカンドリームの国"],zh:["华盛顿","自由与美国梦之国"]},
"Canada":{en:["Ottawa","Vast land of maple and nature"],ja:["オタワ","メープルと自然の広大な国"],zh:["渥太华","枫叶与自然的辽阔之国"]},
"Mexico":{en:["Mexico City","Land of ancient Aztec and Maya civilizations"],ja:["メキシコシティ","古代アステカ・マヤ文明の地"],zh:["墨西哥城","古代阿兹特克与玛雅文明之地"]},
"Cuba":{en:["Havana","Caribbean island of vintage cars and salsa"],ja:["ハバナ","クラシックカーとサルサのカリブ海の島"],zh:["哈瓦那","老爷车与萨尔萨的加勒比海之岛"]},
"Brazil":{en:["Brasília","Land of samba, carnival and the Amazon"],ja:["ブラジリア","サンバとカーニバルとアマゾンの国"],zh:["巴西利亚","桑巴、狂欢节与亚马逊之国"]},
"Argentina":{en:["Buenos Aires","Land of tango and Patagonia"],ja:["ブエノスアイレス","タンゴとパタゴニアの国"],zh:["布宜诺斯艾利斯","探戈与巴塔哥尼亚之国"]},
"Peru":{en:["Lima","Land of the Inca Empire and Machu Picchu"],ja:["リマ","インカ帝国とマチュピチュの地"],zh:["利马","印加帝国与马丘比丘之地"]},
"Colombia":{en:["Bogotá","Enchanting land of emeralds and coffee"],ja:["ボゴタ","エメラルドとコーヒーの魅力的な国"],zh:["波哥大","翡翠与咖啡的迷人之国"]},
"Chile":{en:["Santiago","Long strip of land from desert to glacier"],ja:["サンティアゴ","砂漠から氷河までの細長い国"],zh:["圣地亚哥","从沙漠到冰川的狭长之国"]},
"Australia":{en:["Canberra","Continent of unique wildlife and vast outback"],ja:["キャンベラ","固有の野生動物と広大なアウトバックの大陸"],zh:["堪培拉","独特野生动物与广袤内陆的大陆"]},
"New Zealand":{en:["Wellington","Pure nature of Middle-earth"],ja:["ウェリントン","中つ国の純粋な自然"],zh:["惠灵顿","中土世界的纯净自然"]},
"Maldives":{en:["Malé","Paradise of turquoise atolls"],ja:["マレ","ターコイズブルーの環礁の楽園"],zh:["马累","绿松石色环礁的天堂"]},
"Taiwan":{en:["Taipei","Friendly island of night markets and hot springs"],ja:["台北","夜市と温泉のフレンドリーな島"],zh:["台北","夜市与温泉的友善之岛"]},
"Ireland":{en:["Dublin","Emerald Isle of literature and Guinness"],ja:["ダブリン","文学とギネスのエメラルドの島"],zh:["都柏林","文学与吉尼斯的翡翠之岛"]},
"Belgium":{en:["Brussels","Land of chocolate, waffles and beer"],ja:["ブリュッセル","チョコとワッフルとビールの国"],zh:["布鲁塞尔","巧克力、华夫饼与啤酒之国"]},
"Costa Rica":{en:["San José","Pure life in the tropical paradise"],ja:["サンホセ","熱帯の楽園のピュアライフ"],zh:["圣何塞","热带天堂的纯净生活"]},
"Saudi Arabia":{en:["Riyadh","Holy land of Islam and desert kingdom"],ja:["リヤド","イスラムの聖地と砂漠の王国"],zh:["利雅得","伊斯兰圣地与沙漠王国"]},
"Iran":{en:["Tehran","Ancient Persia of 2,500 years"],ja:["テヘラン","2500年のペルシャ文明"],zh:["德黑兰","两千五百年的波斯文明"]},
"Uzbekistan":{en:["Tashkent","Blue pearl of the Silk Road"],ja:["タシケント","シルクロードの青い真珠"],zh:["塔什干","丝绸之路上的蓝色明珠"]},
"Laos":{en:["Vientiane","Serene land of temples and nature"],ja:["ヴィエンチャン","静けさの中の寺院と自然の国"],zh:["万象","宁静的寺庙与自然之国"]},
"Mongolia":{en:["Ulaanbaatar","Vast steppe of Genghis Khan"],ja:["ウランバートル","チンギス・ハンの広大な草原"],zh:["乌兰巴托","成吉思汗的辽阔草原"]},
"Romania":{en:["Bucharest","Land of Dracula's castles and Carpathians"],ja:["ブカレスト","ドラキュラの城とカルパチア山脈の国"],zh:["布加勒斯特","德古拉城堡与喀尔巴阡山之国"]},
"Georgia":{en:["Tbilisi","Wine cradle at the crossroads of Europe and Asia"],ja:["トビリシ","ヨーロッパとアジアの交差点のワインの揺りかご"],zh:["第比利斯","欧亚交汇处的葡萄酒摇篮"]},
"Ecuador":{en:["Quito","Where the equator meets the Andes"],ja:["キト","赤道とアンデスが出会う場所"],zh:["基多","赤道与安第斯山脉交汇之地"]},
"Bolivia":{en:["Sucre","Sky-high mirror of Uyuni and Andean culture"],ja:["スクレ","ウユニの天空の鏡とアンデス文化"],zh:["苏克雷","乌尤尼天空之镜与安第斯文化"]},
"Ethiopia":{en:["Addis Ababa","Africa's oldest independent civilization"],ja:["アディスアベバ","アフリカ最古の独立文明"],zh:["亚的斯亚贝巴","非洲最古老的独立文明"]},
"Ghana":{en:["Accra","Gateway to West Africa"],ja:["アクラ","西アフリカへの玄関口"],zh:["阿克拉","通往西非的门户"]},
"Panama":{en:["Panama City","Bridge of the Americas and global canal"],ja:["パナマシティ","アメリカ大陸の橋と世界の運河"],zh:["巴拿马城","美洲桥梁与世界运河"]},
"Montenegro":{en:["Podgorica","Mediterranean hidden gem"],ja:["ポドゴリツァ","地中海の隠れた宝石"],zh:["波德戈里察","地中海的隐秘宝石"]},
"Tunisia":{en:["Tunis","Gateway to the Sahara and Carthage"],ja:["チュニス","サハラとカルタゴへの入口"],zh:["突尼斯","撒哈拉与迦太基的入口"]},
"Oman":{en:["Muscat","Jewel of the Arabian Peninsula"],ja:["マスカット","アラビア半島の宝石"],zh:["马斯喀特","阿拉伯半岛的宝石"]},
"Qatar":{en:["Doha","Futuristic desert oasis"],ja:["ドーハ","未来的な砂漠のオアシス"],zh:["多哈","未来沙漠绿洲"]},
"Dominican Republic":{en:["Santo Domingo","Caribbean paradise"],ja:["サントドミンゴ","カリブ海の楽園"],zh:["圣多明各","加勒比天堂"]},
"Guatemala":{en:["Guatemala City","Heart of Maya civilization"],ja:["グアテマラシティ","マヤ文明の中心地"],zh:["危地马拉城","玛雅文明的中心"]},
"Jamaica":{en:["Kingston","Island of reggae rhythm"],ja:["キングストン","レゲエのリズムの島"],zh:["金斯敦","雷鬼节奏之岛"]},
"Latvia":{en:["Riga","Art Nouveau jewel of the Baltics"],ja:["リガ","バルト海のアールヌーヴォーの宝石"],zh:["里加","波罗的海的新艺术瑰宝"]},
"Lithuania":{en:["Vilnius","Medieval charm at the Baltic crossroads"],ja:["ヴィリニュス","バルト海の中世の魅力"],zh:["维尔纽斯","波罗的海的中世纪魅力"]},
"Estonia":{en:["Tallinn","Digital nation with a fairy-tale old town"],ja:["タリン","童話のような旧市街のデジタル国家"],zh:["塔林","童话般老城的数字国家"]},
"Cyprus":{en:["Nicosia","Mediterranean island of Aphrodite"],ja:["ニコシア","アフロディーテの地中海の島"],zh:["尼科西亚","阿芙洛狄忒的地中海之岛"]},
"Albania":{en:["Tirana","Hidden gem of the Mediterranean"],ja:["ティラナ","地中海の隠れた宝石"],zh:["地拉那","地中海的隐秘宝石"]},
"Serbia":{en:["Belgrade","Vibrant crossroads of Balkan culture"],ja:["ベオグラード","バルカン文化の交差点"],zh:["贝尔格莱德","巴尔干文化的十字路口"]},
"Namibia":{en:["Windhoek","Land of the oldest desert"],ja:["ウィントフック","世界最古の砂漠の地"],zh:["温得和克","最古老沙漠之地"]},
"Zimbabwe":{en:["Harare","Land of Victoria Falls"],ja:["ハラレ","ビクトリアの滝の地"],zh:["哈拉雷","维多利亚瀑布之地"]},
"Fiji":{en:["Suva","South Pacific paradise"],ja:["スバ","南太平洋の楽園"],zh:["苏瓦","南太平洋天堂"]},
"Madagascar":{en:["Antananarivo","Unique biodiversity island"],ja:["アンタナナリボ","生物多様性のユニークな島"],zh:["塔那那利佛","独特的生物多样性之岛"]},
"Mauritius":{en:["Port Louis","Tropical gem of the Indian Ocean"],ja:["ポートルイス","インド洋の熱帯の宝石"],zh:["路易港","印度洋的热带宝石"]},
"Lebanon":{en:["Beirut","Ancient Phoenicia meets vibrant nightlife"],ja:["ベイルート","古代フェニキアと活気あるナイトライフ"],zh:["贝鲁特","古代腓尼基与活力夜生活"]},
"Ukraine":{en:["Kyiv","Golden-domed churches and resilient spirit"],ja:["キーウ","黄金のドーム教会と不屈の精神"],zh:["基辅","金色穹顶教堂与不屈精神"]},
"Pakistan":{en:["Islamabad","Land of K2 and ancient Indus civilization"],ja:["イスラマバード","K2と古代インダス文明の地"],zh:["伊斯兰堡","K2与古印度河文明之地"]},
"Luxembourg":{en:["Luxembourg City","Tiny grand duchy of medieval castles"],ja:["ルクセンブルク市","中世の城の小さな大公国"],zh:["卢森堡市","中世纪城堡的袖珍大公国"]},
"Slovakia":{en:["Bratislava","Charming Danube capital"],ja:["ブラチスラバ","ドナウの魅力的な首都"],zh:["布拉迪斯拉发","迷人的多瑙河首都"]},
"Bulgaria":{en:["Sofia","Land of roses, yogurt and Thracian culture"],ja:["ソフィア","バラとヨーグルトの国"],zh:["索菲亚","玫瑰与酸奶之国"]},
"Rwanda":{en:["Kigali","Africa's phoenix — land of a thousand hills"],ja:["キガリ","アフリカの不死鳥—千の丘の国"],zh:["基加利","非洲凤凰——千丘之国"]},
"Senegal":{en:["Dakar","Vibrant West African gateway"],ja:["ダカール","活気ある西アフリカの玄関口"],zh:["达喀尔","充满活力的西非门户"]},
"Kazakhstan":{en:["Astana","Heart of the Eurasian steppe"],ja:["アスタナ","ユーラシアの草原の中心"],zh:["阿斯塔纳","欧亚大草原的心脏"]},
"Afghanistan":{en:["Kabul","Rugged crossroads of ancient empires"]},
"Algeria":{en:["Algiers","Gateway to the Sahara and Roman ruins"]},
"Angola":{en:["Luanda","Resource-rich nation on Africa's west coast"]},
"Armenia":{en:["Yerevan","Ancient Christian nation beneath Mt. Ararat"]},
"Azerbaijan":{en:["Baku","Land of fire on the Caspian shore"]},
"Bahrain":{en:["Manama","Pearl of the Persian Gulf"]},
"Bangladesh":{en:["Dhaka","Land of rivers and vibrant culture"]},
"Belarus":{en:["Minsk","Forested heart of Eastern Europe"]},
"Belize":{en:["Belmopan","Caribbean meets Central American jungle"]},
"Benin":{en:["Porto-Novo","Birthplace of Voodoo culture"]},
"Bhutan":{en:["Thimphu","Himalayan kingdom of Gross National Happiness"]},
"Bosnia and Herzegovina":{en:["Sarajevo","Crossroads of East and West in the Balkans"]},
"Botswana":{en:["Gaborone","Home of the Okavango Delta"]},
"Brunei":{en:["Bandar Seri Begawan","Tiny oil-rich sultanate on Borneo"]},
"Burkina Faso":{en:["Ouagadougou","Land of Honest People"]},
"Burundi":{en:["Gitega","Heart of Africa by Lake Tanganyika"]},
"Cabo Verde":{en:["Praia","Atlantic archipelago of music and color"]},
"Cameroon":{en:["Yaoundé","Africa in miniature"]},
"Central African Republic":{en:["Bangui","Wild heart of the continent"]},
"Chad":{en:["N'Djamena","Where the Sahara meets the Sahel"]},
"Comoros":{en:["Moroni","Perfume islands of the Indian Ocean"]},
"Democratic Republic of the Congo":{en:["Kinshasa","Vast nation of the Congo River basin"]},
"Djibouti":{en:["Djibouti","Strategic gateway to the Red Sea"]},
"El Salvador":{en:["San Salvador","Land of volcanoes in Central America"]},
"Equatorial Guinea":{en:["Malabo","Oil-rich nation on the Gulf of Guinea"]},
"Eritrea":{en:["Asmara","Art Deco capital on the Red Sea coast"]},
"Eswatini":{en:["Mbabane","Africa's last absolute monarchy"]},
"Gabon":{en:["Libreville","Equatorial rainforest sanctuary"]},
"Gambia":{en:["Banjul","Smiling Coast of Africa"]},
"Guinea":{en:["Conakry","West Africa's resource-rich heartland"]},
"Guinea-Bissau":{en:["Bissau","Bijagós archipelago and mangrove coast"]},
"Guyana":{en:["Georgetown","South America's only English-speaking country"]},
"Haiti":{en:["Port-au-Prince","First Black-led republic"]},
"Honduras":{en:["Tegucigalpa","Land of Maya ruins and Caribbean reefs"]},
"Iraq":{en:["Baghdad","Cradle of Mesopotamian civilization"]},
"Ivory Coast":{en:["Yamoussoukro","West Africa's economic powerhouse"]},
"Kosovo":{en:["Pristina","Europe's youngest nation"]},
"Kuwait":{en:["Kuwait City","Pearl-diving heritage on the Persian Gulf"]},
"Kyrgyzstan":{en:["Bishkek","Switzerland of Central Asia"]},
"Lesotho":{en:["Maseru","Mountain kingdom in the sky"]},
"Liberia":{en:["Monrovia","Africa's oldest republic"]},
"Libya":{en:["Tripoli","Ancient Roman ruins on the Mediterranean"]},
"Malawi":{en:["Lilongwe","Warm heart of Africa"]},
"Mali":{en:["Bamako","Land of Timbuktu and the Niger River"]},
"Mauritania":{en:["Nouakchott","Where the Sahara meets the Atlantic"]},
"Moldova":{en:["Chișinău","Europe's wine country hidden gem"]},
"Mozambique":{en:["Maputo","Indian Ocean coast of pristine beaches"]},
"Nicaragua":{en:["Managua","Land of lakes and volcanoes"]},
"Niger":{en:["Niamey","Gateway to the Sahara"]},
"Nigeria":{en:["Abuja","Africa's most populous nation"]},
"North Korea":{en:["Pyongyang","The Hermit Kingdom"]},
"North Macedonia":{en:["Skopje","Ancient land of Alexander the Great"]},
"Papua New Guinea":{en:["Port Moresby","World's most linguistically diverse country"]},
"Paraguay":{en:["Asunción","Heart of South America"]},
"Republic of the Congo":{en:["Brazzaville","Congo River basin and lush rainforests"]},
"Sierra Leone":{en:["Freetown","Beautiful beaches on West Africa's coast"]},
"Somalia":{en:["Mogadishu","Land of the longest African coastline"]},
"South Sudan":{en:["Juba","World's newest country"]},
"Sudan":{en:["Khartoum","Where the Blue and White Nile meet"]},
"Suriname":{en:["Paramaribo","South America's Dutch-speaking gem"]},
"Syria":{en:["Damascus","One of the world's oldest cities"]},
"Tajikistan":{en:["Dushanbe","Roof of the World along the Pamir Highway"]},
"Timor-Leste":{en:["Dili","Southeast Asia's youngest nation"]},
"Togo":{en:["Lomé","Narrow West African nation of diverse landscapes"]},
"Trinidad and Tobago":{en:["Port of Spain","Carnival capital of the Caribbean"]},
"Turkmenistan":{en:["Ashgabat","White marble city of the Karakum Desert"]},
"Uganda":{en:["Kampala","Pearl of Africa"]},
"Uruguay":{en:["Montevideo","Progressive gem on the River Plate"]},
"Venezuela":{en:["Caracas","Home of Angel Falls, world's tallest waterfall"]},
"Yemen":{en:["Sana'a","Ancient kingdom of the Arabian Peninsula"]},
"Zambia":{en:["Lusaka","Another gateway to Victoria Falls"]},
}
const translateCountryInfo = (info, cName, lang) => {
  if (!info || lang === 'ko') return info
  const i18n = COUNTRY_I18N[cName]
  const getField = (idx) => {
    if (!i18n) return undefined
    return i18n[lang]?.[idx] || i18n.en?.[idx] || undefined
  }
  return {
    ...info,
    capital: getField(0) || info.capital,
    population: translatePopulation(info.population, lang),
    lang: translateLangNames(info.lang, lang),
    currency: translateCurrency(info.currency, lang),
    tagline: getField(1) || info.tagline,
    continent: CONTINENT_I18N[info.continent]?.[lang] || info.continent,
    drive: DRIVE_I18N[info.drive]?.[lang] || info.drive,
    visa: translateVisa(info.visa, lang),
    bestSeason: info.bestSeason,
  }
}

const CITY_DATA_I18N = {
// ── 서울 ──
"서울":{
en:{description:"Seoul is Asia's premier city where 600 years of Joseon Dynasty history coexists with K-pop culture and cutting-edge technology. The unique blend of ancient palaces and modern skyscrapers attracts tens of millions of travelers each year.",spots:{"경복궁":{name:"Gyeongbokgung Palace",desc:"The grandest of Joseon's five palaces, featuring hourly Royal Guard ceremonies. Geunjeongjeon Hall and Gyeonghoeru Pavilion showcase the finest of Joseon architecture."},"북촌 한옥마을":{name:"Bukchon Hanok Village",desc:"A neighborhood lined with 600-year-old traditional Korean houses offering a glimpse into Joseon-era aristocratic life. The scenery with Inwangsan Mountain as backdrop is breathtaking."},"N서울타워":{name:"N Seoul Tower",desc:"A tower atop Namsan offering 360-degree panoramic views of all Seoul. The night view is especially stunning, making it a must-visit for couples."},"광장시장":{name:"Gwangjang Market",desc:"Seoul's first traditional market, opened in 1905, famous for bindaetteok pancakes, yukhoe raw beef, and mayak kimbap. A living history of Korean street food culture."},"창덕궁":{name:"Changdeokgung Palace",desc:"A UNESCO World Heritage palace with a beautiful Secret Garden called Biwon. The scenery transforms magically with each season."}}},
ja:{description:"ソウルは朝鮮王朝600年の歴史とK-POP文化、最先端技術が共存するアジア最高の都市です。古宮と現代のビルが調和した独特の魅力で、毎年数千万人の旅行者を魅了しています。",spots:{"경복궁":{name:"景福宮",desc:"朝鮮5大宮殿の中で最も壮大で、毎時守門将交代式が行われます。勤政殿と慶会楼は朝鮮建築の精髄を見せてくれます。"},"북촌 한옥마을":{name:"北村韓屋村",desc:"600年の歴史を持つ伝統韓屋が並ぶ路地で、朝鮮時代の両班生活を垣間見ることができます。仁王山を背景にした風景は絶品です。"},"N서울타워":{name:"Nソウルタワー",desc:"南山の頂上にそびえるタワーで、ソウル全域を360度見渡せます。夜景が特に美しく、カップルの必見スポットです。"},"광장시장":{name:"広蔵市場",desc:"1905年開場のソウル初の伝統市場で、ビンデトク、ユッケ、麻薬キンパが有名です。韓国の伝統グルメ文化の生きた歴史です。"},"창덕궁":{name:"昌徳宮",desc:"秘苑と呼ばれる美しい秘密の庭園があるユネスコ世界文化遺産の宮殿です。季節ごとに異なる風景が広がります。"}}},
zh:{description:"首尔是朝鲜王朝600年历史与K-pop文化、尖端科技共存的亚洲顶级城市。古宫与现代建筑交相辉映的独特魅力，每年吸引数千万旅客。",spots:{"경복궁":{name:"景福宫",desc:"朝鲜五大宫殿中最为壮观，每小时举行守门将换岗仪式。勤政殿和庆会楼展现了朝鲜建筑的精髓。"},"북촌 한옥마을":{name:"北村韩屋村",desc:"拥有600年历史的传统韩屋街区，可以一窥朝鲜时代贵族生活。以仁王山为背景的风景令人赞叹。"},"N서울타워":{name:"N首尔塔",desc:"矗立于南山之巅的地标塔，可360度俯瞰首尔全景。夜景尤为壮观，是情侣必去之地。"},"광장시장":{name:"广藏市场",desc:"1905年开业的首尔第一个传统市场，以绿豆煎饼、生拌牛肉和麻药紫菜卷闻名。是韩国传统美食文化的活化石。"},"창덕궁":{name:"昌德宫",desc:"拥有被称为'秘苑'的美丽秘密花园的联合国教科文组织世界遗产宫殿。四季呈现不同景致。"}}}
},
// ── 부산 ──
"부산":{
en:{description:"Busan is South Korea's second-largest city, a charming port city where beautiful beaches, fresh seafood, and unique culture blend together. From Haeundae Beach to Gamcheon Culture Village, it overflows with diverse attractions.",spots:{"해운대 해변":{name:"Haeundae Beach",desc:"Korea's premier beach resort visited by millions every summer. Cafés and restaurants line the beachfront."},"감천문화마을":{name:"Gamcheon Culture Village",desc:"Pastel-colored houses cascade down the hillside, earning it the nickname 'Korea's Machu Picchu.' Art installations and photo spots are hidden throughout."},"자갈치시장":{name:"Jagalchi Fish Market",desc:"Korea's largest seafood market where you can taste the freshest raw fish and seafood. The bustling energy of Busan's fish market aunties is part of the experience."},"해동용궁사":{name:"Haedong Yonggungsa Temple",desc:"A rare seaside temple perched on oceanfront cliffs. The sunrise view from the temple, illuminated by morning light over the East Sea, is simply magnificent."},"태종대":{name:"Taejongdae",desc:"Dramatic coastal cliffs and a lighthouse overlooking the open sea toward Japan. The Danubi train ride along the cliff-top path is the best way to enjoy it."}}},
ja:{description:"釜山は韓国第2の都市で、美しい海辺と新鮮な海の幸、独特の文化が調和した港町です。海雲台ビーチから甘川文化村まで、多彩な魅力にあふれています。",spots:{"해운대 해변":{name:"海雲台ビーチ",desc:"韓国最高のビーチリゾートで、夏には数百万人が訪れます。ビーチ沿いにカフェやレストランが軒を連ねます。"},"감천문화마을":{name:"甘川文化村",desc:"パステルカラーの家が山腹に段々と並ぶ村で、韓国のマチュピチュと呼ばれています。あちこちにアート作品やフォトスポットが隠れています。"},"자갈치시장":{name:"チャガルチ市場",desc:"韓国最大の海産物市場で、最も新鮮な刺身や海の幸を味わえます。活気あふれる釜山のおばちゃんたちのエネルギーも見どころです。"},"해동용궁사":{name:"海東龍宮寺",desc:"海辺の断崖に建つ珍しい海辺の寺院です。朝日に照らされた東海を背景にした日の出の景色は圧巻です。"},"태종대":{name:"太宗台",desc:"日本方面を望む断崖絶壁と灯台。崖沿いのダヌビ列車に乗って楽しむのが最高です。"}}},
zh:{description:"釜山是韩国第二大城市，是美丽海滩、新鲜海鲜与独特文化融合的迷人港口城市。从海云台海滩到甘川文化村，处处洋溢着多彩魅力。",spots:{"해운대 해변":{name:"海云台海滩",desc:"韩国最著名的海水浴场，每年夏天吸引数百万游客。海滩沿线咖啡厅和餐厅林立。"},"감천문화마을":{name:"甘川文化村",desc:"彩色房屋沿山坡层叠而建，被誉为'韩国的马丘比丘'。各处隐藏着艺术作品和拍照点。"},"자갈치시장":{name:"札嘎其市场",desc:"韩国最大的海鲜市场，可以品尝最新鲜的生鱼片和海鲜。釜山鱼市大妈们的热情活力也是一道风景。"},"해동용궁사":{name:"海东龙宫寺",desc:"建在海边悬崖上的罕见海滨寺庙。晨光照耀下的东海日出景色壮丽无比。"},"태종대":{name:"太宗台",desc:"可眺望日本方向的壮观海岸悬崖和灯塔。乘坐悬崖边的丹努比小火车是最佳游览方式。"}}}
},
// ── 제주 ──
"제주":{
en:{description:"Jeju Island is a UNESCO World Natural Heritage volcanic island boasting unique landscapes and culture. Mount Hallasan, Seongsan Ilchulbong, and Yongmeori Coast display nature's finest work.",spots:{"성산일출봉":{name:"Seongsan Ilchulbong",desc:"A UNESCO Natural Heritage tuff cone formed 5,000 years ago by an underwater volcanic eruption. The sunrise from the summit is one of Korea's most spectacular views."},"한라산":{name:"Mount Hallasan",desc:"South Korea's highest peak at 1,950m and a UNESCO Natural Heritage site. Trails lead through different vegetation zones to the summit crater lake of Baengnokdam."},"만장굴":{name:"Manjanggul Cave",desc:"One of the world's finest lava tubes at 7.4km long, a UNESCO Natural Heritage site. The 7.6-meter lava column inside is the world's largest."},"협재 해변":{name:"Hyeopjae Beach",desc:"A stunning beach with emerald waters and white sand, with Biyangdo Island in view. The shallow, calm waters make it perfect for families."},"우도":{name:"Udo Island",desc:"A small island off Jeju's east coast with coral sand beaches, peanut ice cream, and charming cycling paths. Often called 'Jeju within Jeju.'"}}},
ja:{description:"済州島はユネスコ世界自然遺産に登録された火山島で、独特な自然景観と文化を誇ります。漢拏山、城山日出峰、龍頭海岸など、天恵の自然が広がります。",spots:{"성산일출봉":{name:"城山日出峰",desc:"5千年前の海底噴火で形成されたユネスコ自然遺産の凝灰丘です。山頂からの日の出は韓国で最も壮大な絶景の一つです。"},"한라산":{name:"漢拏山",desc:"標高1,950mの韓国最高峰でユネスコ自然遺産。登山道を通じて異なる植生帯を抜け、山頂の白鹿潭火口湖に到達できます。"},"만장굴":{name:"万丈窟",desc:"全長7.4kmの世界最高の溶岩洞窟でユネスコ自然遺産。内部の7.6mの溶岩柱は世界最大です。"},"협재 해변":{name:"挟才ビーチ",desc:"エメラルドの海と白い砂浜が美しく、飛揚島が見えるビーチ。浅く穏やかな水深で家族連れに最適です。"},"우도":{name:"牛島",desc:"済州島東部の小島で、珊瑚砂ビーチ、ピーナッツアイスクリーム、魅力的なサイクリングコースがあります。'済州の中の済州'と呼ばれています。"}}},
zh:{description:"济州岛是联合国教科文组织世界自然遗产火山岛，拥有独特的自然景观和文化。汉拿山、城山日出峰、龙头海岸等展现大自然的杰作。",spots:{"성산일출봉":{name:"城山日出峰",desc:"5000年前海底火山喷发形成的联合国教科文组织自然遗产凝灰丘。山顶的日出是韩国最壮观的景色之一。"},"한라산":{name:"汉拿山",desc:"海拔1950米的韩国最高峰，联合国教科文组织自然遗产。沿登山道穿越不同植被带，可达山顶白鹿潭火口湖。"},"만장굴":{name:"万丈窟",desc:"全长7.4公里的世界顶级熔岩洞，联合国教科文组织自然遗产。内部7.6米的熔岩柱为世界之最。"},"협재 해변":{name:"挟才海滩",desc:"翡翠色海水与白沙滩交相辉映，可眺望飞扬岛。水浅浪缓，非常适合家庭游玩。"},"우도":{name:"牛岛",desc:"济州岛东部的小岛，有珊瑚沙滩、花生冰淇淋和迷人的自行车道。被称为'济州中的济州'。"}}}
},
// ── 도쿄 ──
"도쿄":{
en:{description:"Tokyo is the world's largest metropolis where tradition and ultra-modernity coexist in perfect harmony. Between towering skyscrapers lie serene shrines, and cutting-edge technology meets centuries-old artisan culture.",spots:{"센소지(아사쿠사)":{name:"Sensoji Temple (Asakusa)",desc:"Tokyo's oldest temple founded in 628 AD. The massive Kaminarimon gate with its iconic red lantern is a symbol of Tokyo."},"시부야 스크램블 교차로":{name:"Shibuya Scramble Crossing",desc:"The world's busiest pedestrian crossing where up to 3,000 people cross simultaneously. A living symbol of Tokyo's pulsing energy."},"메이지 신궁":{name:"Meiji Shrine",desc:"A shrine surrounded by 100,000 trees in the heart of the city, dedicated to Emperor Meiji. A serene oasis that contrasts dramatically with surrounding Harajuku."},"도쿄 스카이트리":{name:"Tokyo Skytree",desc:"The world's tallest broadcasting tower at 634m. On clear days, Mt. Fuji is visible from the observation deck."},"츠키지·도요스 시장":{name:"Tsukiji & Toyosu Market",desc:"The world's largest fish market. Early morning tuna auctions and the freshest sushi breakfast are unforgettable experiences."}}},
ja:{description:"東京は伝統と超現代が完璧に共存する世界最大のメトロポリスです。高層ビルの間にたたずむ神社、最先端技術と伝統の職人文化が独特のハーモニーを奏でます。",spots:{"센소지(아사쿠사)":{name:"浅草寺",desc:"628年に創建された東京最古の寺院。巨大な雷門と赤提灯は東京のシンボルです。"},"시부야 스크램블 교차로":{name:"渋谷スクランブル交差点",desc:"最大3,000人が同時に渡る世界一忙しい交差点。東京の脈動するエネルギーの象徴です。"},"메이지 신궁":{name:"明治神宮",desc:"都心に10万本の木々に囲まれた明治天皇を祀る神社。原宿の喧騒とは対照的な静寂のオアシスです。"},"도쿄 스카이트리":{name:"東京スカイツリー",desc:"高さ634mの世界一高い電波塔。晴れた日には展望台から富士山が見えます。"},"츠키지·도요스 시장":{name:"築地・豊洲市場",desc:"世界最大の魚市場。早朝のマグロ競りと最高に新鮮な寿司の朝食は忘れられない体験です。"}}},
zh:{description:"东京是传统与超现代完美共存的世界最大都市。摩天大楼间矗立着宁静的神社，尖端科技与百年匠人文化交织出独特的和谐。",spots:{"센소지(아사쿠사)":{name:"浅草寺",desc:"建于628年的东京最古老寺庙。巨大的雷门和标志性的红灯笼是东京的象征。"},"시부야 스크램블 교차로":{name:"涩谷十字路口",desc:"最多3000人同时通过的世界最繁忙人行横道。是东京脉动能量的生动象征。"},"메이지 신궁":{name:"明治神宫",desc:"位于市中心、被10万棵树木环绕的供奉明治天皇的神社。与周围原宿的喧嚣形成鲜明对比的宁静绿洲。"},"도쿄 스카이트리":{name:"东京晴空塔",desc:"高634米的世界最高广播塔。晴天时从观景台可以眺望富士山。"},"츠키지·도요스 시장":{name:"筑地·丰洲市场",desc:"世界最大的鱼市场。清晨的金枪鱼拍卖和最新鲜的寿司早餐是难忘的体验。"}}}
},
// ── 교토 ──
"교토":{
en:{description:"Kyoto was Japan's capital from 794 to 1868, an ancient city of a thousand years with over 2,000 shrines and temples. Geisha culture, traditional tea ceremony, and beautiful gardens showcase the essence of Japan.",spots:{"금각사":{name:"Kinkaku-ji (Golden Pavilion)",desc:"A pavilion covered in brilliant gold leaf reflected in a mirror pond. One of Kyoto's most iconic and photographed sights."},"후시미이나리 신사":{name:"Fushimi Inari Shrine",desc:"Famous for its tunnel of 10,000 vermillion torii gates winding up Mt. Inari. The mystical atmosphere intensifies as you climb higher."},"기요미즈데라":{name:"Kiyomizu-dera Temple",desc:"A UNESCO World Heritage temple renowned for its wooden stage jutting out from the hillside. The panoramic view of Kyoto from the stage is breathtaking."},"아라시야마 대나무숲":{name:"Arashiyama Bamboo Grove",desc:"A path through towering bamboo that creates an otherworldly atmosphere. The rustling sound of bamboo in the wind is selected as one of Japan's 100 Soundscapes."},"기온 거리":{name:"Gion District",desc:"Kyoto's famous geisha district where you might spot a maiko in traditional dress. The preserved wooden machiya townhouses evoke old Kyoto's charm."}}},
ja:{description:"京都は794年から1868年まで日本の都であった千年の古都で、2,000以上の神社仏閣があります。芸妓文化、伝統的な茶道、美しい庭園が日本の真髄を見せてくれます。",spots:{"금각사":{name:"金閣寺",desc:"金箔に覆われた楼閣が鏡湖池に映る絶景。京都で最も象徴的で、最も撮影される名所の一つです。"},"후시미이나리 신사":{name:"伏見稲荷大社",desc:"稲荷山を登る1万本の朱色の鳥居のトンネルで有名です。登るほどに神秘的な雰囲気が増します。"},"기요미즈데라":{name:"清水寺",desc:"山腹から張り出した木造の舞台で知られるユネスコ世界遺産の寺院。舞台からの京都のパノラマビューは圧巻です。"},"아라시야마 대나무숲":{name:"嵐山竹林",desc:"そびえ立つ竹が異世界のような雰囲気を醸し出す小道。風に揺れる竹のさざめきは日本の音風景100選に選ばれています。"},"기온 거리":{name:"祇園",desc:"伝統装束の舞妓に出会えるかもしれない京都の花街。保存された木造の町家が古都の風情を漂わせます。"}}},
zh:{description:"京都从794年到1868年一直是日本的首都，拥有2000多座神社和寺庙的千年古都。艺伎文化、传统茶道和优美的庭园展现了日本文化的精髓。",spots:{"금각사":{name:"金阁寺",desc:"金箔覆盖的楼阁倒映在镜湖池中。京都最具标志性、最常被拍摄的景点之一。"},"후시미이나리 신사":{name:"伏见稻荷大社",desc:"以蜿蜒上稻荷山的万座朱红色鸟居隧道而闻名。越往上走，神秘气氛越浓。"},"기요미즈데라":{name:"清水寺",desc:"以从山腰伸出的木造舞台闻名的联合国教科文组织世界遗产寺庙。从舞台上眺望京都全景令人叹为观止。"},"아라시야마 대나무숲":{name:"岚山竹林",desc:"高耸的竹子营造出超凡脱俗的氛围的小径。风中竹子的沙沙声被选为日本百大音景之一。"},"기온 거리":{name:"祇园",desc:"可能邂逅身着传统服饰舞伎的京都著名花街。保存完好的木造町屋散发着古都的韵味。"}}}
},
// ── 오사카 ──
"오사카":{
en:{description:"Osaka is Japan's culinary capital and a city of merchants bursting with humor and vitality. Street food like takoyaki and okonomiyaki abound, and Dotonbori's dazzling neon signs are iconic.",spots:{"도톤보리":{name:"Dotonbori",desc:"Osaka's most vibrant entertainment district along the canal, famous for its giant animated signs including the iconic Glico Running Man."},"오사카성":{name:"Osaka Castle",desc:"A symbol of Osaka built by Toyotomi Hideyoshi in 1583. The castle tower museum and surrounding park with 3,000 cherry trees are magnificent."},"구로몬 시장":{name:"Kuromon Market",desc:"Known as 'Osaka's Kitchen' with a 190-year history. Fresh sashimi, grilled seafood, and seasonal fruits offer an unforgettable food tour."},"유니버설 스튜디오 재팬":{name:"Universal Studios Japan",desc:"Western Japan's largest theme park featuring the Wizarding World of Harry Potter and Nintendo World. A must-visit for families and film fans alike."}}},
ja:{description:"大阪は日本の美食の都であり、ユーモアと活気にあふれた商人の街です。たこ焼き、お好み焼きなどの食べ歩きグルメが満載で、道頓堀の華やかなネオンが象徴的です。",spots:{"도톤보리":{name:"道頓堀",desc:"運河沿いの大阪で最も活気あるエンターテインメント街。グリコの看板をはじめとする巨大な動く看板で有名です。"},"오사카성":{name:"大阪城",desc:"1583年に豊臣秀吉が築いた大阪のシンボル。天守閣博物館と3,000本の桜がある周辺公園は壮観です。"},"구로몬 시장":{name:"黒門市場",desc:"190年の歴史を持つ'大阪の台所'。新鮮な刺身、焼き海鮮、旬の果物で忘れられないフードツアーが楽しめます。"},"유니버설 스튜디오 재팬":{name:"ユニバーサル・スタジオ・ジャパン",desc:"ハリー・ポッターの魔法界やニンテンドーワールドを擁する西日本最大のテーマパーク。家族連れにも映画ファンにも必見です。"}}},
zh:{description:"大阪是日本的美食之都，充满幽默和活力的商人城市。章鱼烧、大阪烧等街头小吃应有尽有，道顿堀的璀璨霓虹招牌是其标志。",spots:{"도톤보리":{name:"道顿堀",desc:"运河沿岸大阪最热闹的娱乐街区，以格力高跑步人等巨型动态招牌闻名。"},"오사카성":{name:"大阪城",desc:"1583年丰臣秀吉建造的大阪象征。天守阁博物馆和种有3000棵樱花树的周边公园壮观无比。"},"구로몬 시장":{name:"黑门市场",desc:"有190年历史的'大阪厨房'。新鲜刺身、烤海鲜和时令水果带来难忘的美食之旅。"},"유니버설 스튜디오 재팬":{name:"日本环球影城",desc:"拥有哈利波特魔法世界和任天堂世界的西日本最大主题乐园。家庭和电影迷必去。"}}}
},
// ── 파리 ──
"파리":{
en:{description:"Paris is the undisputed capital of art, fashion, and gastronomy. From the Eiffel Tower and Louvre to charming cafés along the Seine, every corner tells a romantic story.",spots:{"에펠탑":{name:"Eiffel Tower",desc:"The ultimate symbol of Paris, built in 1889. The panoramic view from 300m high and the sparkling night illumination are unforgettable."},"루브르 박물관":{name:"Louvre Museum",desc:"The world's largest and most visited museum, home to the Mona Lisa and Venus de Milo. Over 380,000 works spanning 9,000 years of history."},"몽마르트르":{name:"Montmartre",desc:"An artistic hilltop neighborhood crowned by the white Sacré-Cœur Basilica. Artists set up easels in Place du Tertre, continuing a century-old tradition."},"노트르담 대성당":{name:"Notre-Dame Cathedral",desc:"A Gothic masterpiece built over 180 years, severely damaged by fire in 2019 and now being restored. An enduring symbol of Paris on Île de la Cité."},"샹젤리제 거리":{name:"Champs-Élysées",desc:"One of the world's most famous avenues stretching 2km from the Arc de Triomphe. Luxury boutiques, cafés, and cinemas line this grand boulevard."}}},
ja:{description:"パリは芸術、ファッション、美食の揺るぎない首都です。エッフェル塔やルーブルからセーヌ川沿いの魅力的なカフェまで、どの角にもロマンチックな物語があります。",spots:{"에펠탑":{name:"エッフェル塔",desc:"1889年に建てられたパリの究極のシンボル。300mの高さからのパノラマビューと夜のきらめくイルミネーションは忘れられません。"},"루브르 박물관":{name:"ルーブル美術館",desc:"モナ・リザとミロのヴィーナスを所蔵する世界最大かつ最も来場者の多い美術館。9,000年の歴史にまたがる38万点以上の作品があります。"},"몽마르트르":{name:"モンマルトル",desc:"白いサクレ・クール聖堂が頂に立つ芸術的な丘の街。テルトル広場では画家たちが100年の伝統を受け継いでイーゼルを立てています。"},"노트르담 대성당":{name:"ノートルダム大聖堂",desc:"180年かけて建てられたゴシック建築の傑作。2019年の火災で大きな被害を受け、現在修復中。シテ島のパリの不朽のシンボルです。"},"샹젤리제 거리":{name:"シャンゼリゼ通り",desc:"凱旋門から2km続く世界で最も有名な大通りの一つ。高級ブティック、カフェ、映画館が並ぶ壮大な通りです。"}}},
zh:{description:"巴黎是无可争议的艺术、时尚和美食之都。从埃菲尔铁塔和卢浮宫到塞纳河畔迷人的咖啡馆，每个角落都诉说着浪漫故事。",spots:{"에펠탑":{name:"埃菲尔铁塔",desc:"1889年建造的巴黎终极象征。300米高空的全景视野和夜晚闪烁的灯光令人难忘。"},"루브르 박물관":{name:"卢浮宫",desc:"收藏蒙娜丽莎和断臂维纳斯的世界最大、参观人数最多的博物馆。横跨9000年历史的38万余件藏品。"},"몽마르트르":{name:"蒙马特",desc:"白色圣心大教堂矗立山顶的艺术街区。画家们在小丘广场支起画架，延续着百年传统。"},"노트르담 대성당":{name:"巴黎圣母院",desc:"历时180年建造的哥特式杰作，2019年大火严重受损后正在修复中。矗立在西岱岛上的巴黎不朽象征。"},"샹젤리제 거리":{name:"香榭丽舍大街",desc:"从凯旋门延伸2公里的世界最著名大道之一。奢侈品店、咖啡馆和电影院沿着这条壮丽林荫道排列。"}}}
},
// ── 로마 ──
"로마":{
en:{description:"Rome is the Eternal City where layers of 3,000 years of history are visible at every turn. The Colosseum, Vatican, Trevi Fountain and countless ancient ruins make the entire city a living open-air museum.",spots:{"콜로세움":{name:"Colosseum",desc:"The iconic amphitheater of the Roman Empire that held 50,000 spectators for gladiator battles. A breathtaking monument even after 2,000 years."},"바티칸 시국":{name:"Vatican City",desc:"The world's smallest independent state and heart of the Catholic world. The Sistine Chapel's ceiling painted by Michelangelo is humanity's greatest artistic masterpiece."},"트레비 분수":{name:"Trevi Fountain",desc:"Rome's most beautiful Baroque fountain. Legend says tossing a coin ensures your return to Rome — about €3,000 is thrown in daily."},"판테온":{name:"Pantheon",desc:"A 2,000-year-old temple with the world's largest unreinforced concrete dome. Light streaming through the 9-meter oculus creates a mystical atmosphere."},"스페인 광장":{name:"Spanish Steps",desc:"The famous 135-step stairway connecting the piazza to Trinità dei Monti church above. A beloved gathering spot and the setting for 'Roman Holiday.'"}}},
ja:{description:"ローマは至るところに3,000年の歴史の層が見える永遠の都です。コロッセオ、バチカン、トレビの泉、無数の古代遺跡が都市全体を生きた野外博物館にしています。",spots:{"콜로세움":{name:"コロッセオ",desc:"剣闘士の戦いのために5万人を収容したローマ帝国の象徴的な円形闘技場。2,000年を経てもなお圧巻のモニュメントです。"},"바티칸 시국":{name:"バチカン市国",desc:"世界最小の独立国でカトリック世界の中心。ミケランジェロが描いたシスティーナ礼拝堂の天井画は人類最高の芸術傑作です。"},"트레비 분수":{name:"トレビの泉",desc:"ローマで最も美しいバロック様式の噴水。コインを投げるとローマに戻れるという伝説があり、毎日約3,000ユーロが投げ込まれます。"},"판테온":{name:"パンテオン",desc:"世界最大の無筋コンクリートドームを持つ2,000年の神殿。直径9mのオクルスから差し込む光が神秘的な雰囲気を生み出します。"},"스페인 광장":{name:"スペイン広場",desc:"広場からトリニタ・デイ・モンティ教会を結ぶ135段の有名な階段。'ローマの休日'の舞台としても愛される憩いの場です。"}}},
zh:{description:"罗马是一座处处可见3000年历史层叠的永恒之城。斗兽场、梵蒂冈、特莱维喷泉和无数古迹让整座城市成为一座活的露天博物馆。",spots:{"콜로세움":{name:"斗兽场",desc:"可容纳5万名观众观看角斗士战斗的罗马帝国标志性圆形竞技场。历经2000年依然令人叹为观止。"},"바티칸 시국":{name:"梵蒂冈",desc:"世界最小的独立国家，天主教世界的中心。米开朗基罗绘制的西斯廷教堂天顶画是人类最伟大的艺术杰作。"},"트레비 분수":{name:"特莱维喷泉",desc:"罗马最美的巴洛克式喷泉。传说投一枚硬币就能重返罗马——每天约有3000欧元被投入。"},"판테온":{name:"万神殿",desc:"拥有世界最大无筋混凝土穹顶的2000年神庙。阳光从9米直径的天眼射入，营造出神秘氛围。"},"스페인 광장":{name:"西班牙广场",desc:"连接广场与山上天主圣三教堂的135级著名台阶。是深受喜爱的聚集地，也是《罗马假日》的取景地。"}}}
},
// ── 런던 ──
"런던":{
en:{description:"London is a city where centuries of royal history meets cutting-edge culture. From Big Ben and the Tower of London to the West End and Camden Market, it offers endless diversity.",spots:{"빅벤·웨스트민스터":{name:"Big Ben & Westminster",desc:"London's most iconic landmark and the Houses of Parliament along the Thames. The 160-year-old clock tower is a symbol recognized worldwide."},"런던탑":{name:"Tower of London",desc:"A 1,000-year-old fortress that has served as a royal palace, prison, and treasury. Home to the spectacular Crown Jewels."},"대영박물관":{name:"British Museum",desc:"One of the world's greatest museums with free admission. Over 8 million artifacts including the Rosetta Stone and Parthenon sculptures."},"버킹엄 궁전":{name:"Buckingham Palace",desc:"The official residence of the British monarch. The elaborate Changing of the Guard ceremony is one of London's top free attractions."},"타워브릿지":{name:"Tower Bridge",desc:"London's most photographed bridge with its iconic Victorian Gothic towers. The glass walkway 42m above the Thames offers stunning views."}}},
ja:{description:"ロンドンは何世紀にもわたる王室の歴史と最先端の文化が出会う都市です。ビッグベンやロンドン塔からウエストエンドやカムデンマーケットまで、無限の多様性を提供します。",spots:{"빅벤·웨스트민스터":{name:"ビッグベン＆ウェストミンスター",desc:"テムズ川沿いの国会議事堂とロンドンで最も象徴的なランドマーク。160年の歴史を持つ時計塔は世界中で認識されるシンボルです。"},"런던탑":{name:"ロンドン塔",desc:"王宮、監獄、宝物庫として使われてきた1,000年の歴史を持つ要塞。見事な王冠の宝石が収められています。"},"대영박물관":{name:"大英博物館",desc:"入場無料の世界最高の博物館の一つ。ロゼッタストーンやパルテノン彫刻を含む800万点以上の収蔵品があります。"},"버킹엄 궁전":{name:"バッキンガム宮殿",desc:"英国君主の公邸。精巧な衛兵交代式はロンドンの無料アトラクションのトップの一つです。"},"타워브릿지":{name:"タワーブリッジ",desc:"象徴的なヴィクトリアンゴシック様式の塔を持つロンドンで最も撮影される橋。テムズ川の42m上にあるガラスの歩道からは素晴らしい景色が楽しめます。"}}},
zh:{description:"伦敦是数百年皇室历史与前沿文化交汇的城市。从大本钟和伦敦塔到西区和卡姆登市场，提供无尽的多样性。",spots:{"빅벤·웨스트민스터":{name:"大本钟与威斯敏斯特",desc:"泰晤士河畔的国会大厦和伦敦最标志性的地标。160年历史的钟楼是全球公认的象征。"},"런던탑":{name:"伦敦塔",desc:"曾用作皇宫、监狱和金库的千年堡垒。收藏着壮观的皇冠珠宝。"},"대영박물관":{name:"大英博物馆",desc:"免费入场的世界最伟大博物馆之一。拥有包括罗塞塔石碑和帕特农雕塑在内的800多万件藏品。"},"버킹엄 궁전":{name:"白金汉宫",desc:"英国君主的官邸。精心编排的卫兵换岗仪式是伦敦最热门的免费景点之一。"},"타워브릿지":{name:"塔桥",desc:"拥有标志性维多利亚哥特式塔楼的伦敦最常被拍摄的桥。泰晤士河上方42米的玻璃步道提供绝佳视野。"}}}
},
// ── 뉴욕 ──
"뉴욕":{
en:{description:"New York is the city that never sleeps — the cultural and financial capital of the world. The Manhattan skyline, Broadway shows, and incredible diversity make it an endlessly fascinating metropolis.",spots:{"자유의 여신상":{name:"Statue of Liberty",desc:"A gift from France in 1886 and a universal symbol of freedom. The crown observation deck offers spectacular views of Manhattan."},"센트럴파크":{name:"Central Park",desc:"A 341-hectare green oasis in the heart of Manhattan. Joggers, musicians, and horse carriages create a cinematic New York scene."},"타임스스퀘어":{name:"Times Square",desc:"The dazzling 'Crossroads of the World' illuminated by massive digital billboards. Over 50 million visitors experience this electric atmosphere annually."},"엠파이어스테이트빌딩":{name:"Empire State Building",desc:"The 1931 Art Deco masterpiece that defined the Manhattan skyline. The 86th-floor observatory offers 360-degree views spanning 130km on clear days."},"브루클린 브릿지":{name:"Brooklyn Bridge",desc:"The 1883 Gothic masterpiece connecting Manhattan and Brooklyn. Walking across at sunset with the skyline glowing behind you is pure New York magic."}}},
ja:{description:"ニューヨークは眠らない街——世界の文化と金融の首都です。マンハッタンのスカイライン、ブロードウェイのショー、驚異的な多様性が、尽きることのない魅力を放つ大都市です。",spots:{"자유의 여신상":{name:"自由の女神",desc:"1886年にフランスから贈られた自由の普遍的シンボル。王冠の展望台からはマンハッタンの壮観な眺めが広がります。"},"센트럴파크":{name:"セントラルパーク",desc:"マンハッタンの中心にある341ヘクタールの緑のオアシス。ジョガー、ミュージシャン、馬車が映画のようなニューヨークの風景を生み出します。"},"타임스스퀘어":{name:"タイムズスクエア",desc:"巨大なデジタル看板に照らされた眩い'世界の交差点'。毎年5,000万人以上がこの電撃的な雰囲気を体験します。"},"엠파이어스테이트빌딩":{name:"エンパイアステートビル",desc:"1931年のアールデコの傑作でマンハッタンのスカイラインを象徴。86階の展望台からは晴天時130kmにわたる360度の眺望が楽しめます。"},"브루클린 브릿지":{name:"ブルックリン橋",desc:"1883年にマンハッタンとブルックリンを結んだゴシック建築の傑作。夕暮れ時にスカイラインを背に歩くのは純粋なニューヨークの魔法です。"}}},
zh:{description:"纽约是不夜城——世界文化与金融之都。曼哈顿天际线、百老汇演出和令人惊叹的多样性，使其成为永远令人着迷的大都市。",spots:{"자유의 여신상":{name:"自由女神像",desc:"1886年法国赠送的自由的普世象征。皇冠观景台可欣赏曼哈顿壮观景色。"},"센트럴파크":{name:"中央公园",desc:"曼哈顿中心341公顷的绿色绿洲。慢跑者、音乐家和马车营造出电影般的纽约场景。"},"타임스스퀘어":{name:"时代广场",desc:"被巨型数字广告牌照亮的炫目'世界十字路口'。每年超过5000万游客体验这种电气化的氛围。"},"엠파이어스테이트빌딩":{name:"帝国大厦",desc:"1931年的装饰艺术杰作，定义了曼哈顿天际线。86层观景台晴天可享受130公里范围的360度视野。"},"브루클린 브릿지":{name:"布鲁克林大桥",desc:"1883年连接曼哈顿和布鲁克林的哥特式杰作。日落时分背着天际线行走，是纯正的纽约魔法。"}}}
},
// ── 방콕 ──
"방콕":{
en:{description:"Bangkok is a vibrant city where golden temples, bustling markets, and modern skyscrapers create an intoxicating mix. Thai cuisine, from street food to fine dining, is a world-class culinary experience.",spots:{"왕궁·에메랄드 사원":{name:"Grand Palace & Wat Phra Kaew",desc:"The dazzling former royal residence and Thailand's most sacred temple housing the Emerald Buddha. A masterpiece of Thai architecture and craftsmanship."},"왓아룬(새벽사원)":{name:"Wat Arun (Temple of Dawn)",desc:"A stunning riverside temple decorated with colorful porcelain. The silhouette against the Chao Phraya River sunset is Bangkok's most iconic view."},"짜뚜짝 주말시장":{name:"Chatuchak Weekend Market",desc:"One of the world's largest outdoor markets with over 15,000 stalls. From vintage clothing to exotic pets, you can find virtually anything here."},"카오산 로드":{name:"Khao San Road",desc:"The legendary backpacker hub pulsing with energy day and night. Street food stalls, bars, and travelers from around the world create a unique atmosphere."},"왓포(와불사원)":{name:"Wat Pho",desc:"Home to the magnificent 46-meter reclining gold Buddha. Also the birthplace of traditional Thai massage — treat yourself after sightseeing."}}},
ja:{description:"バンコクは黄金の寺院、賑やかな市場、近代的な高層ビルが酔いしれるようなミックスを生み出す活気ある都市です。屋台料理から高級レストランまで、タイ料理は世界クラスの美食体験です。",spots:{"왕궁·에메랄드 사원":{name:"王宮＆ワット・プラケオ",desc:"かつての王宮とエメラルド仏を安置するタイで最も神聖な寺院。タイ建築と職人技の傑作です。"},"왓아룬(새벽사원)":{name:"ワット・アルン（暁の寺）",desc:"色鮮やかな陶磁器で装飾された川沿いの見事な寺院。チャオプラヤー川の夕暮れに浮かぶシルエットはバンコクで最も象徴的な光景です。"},"짜뚜짝 주말시장":{name:"チャトゥチャック・ウィークエンドマーケット",desc:"15,000以上の屋台がある世界最大の屋外市場の一つ。ビンテージ衣料からエキゾチックなペットまで、ほぼ何でも見つかります。"},"카오산 로드":{name:"カオサン通り",desc:"昼も夜もエネルギーに満ちた伝説のバックパッカーの聖地。屋台、バー、世界中の旅行者が独特の雰囲気を生み出します。"},"왓포(와불사원)":{name:"ワット・ポー",desc:"壮大な46mの涅槃仏がある寺院。伝統的なタイマッサージの発祥地でもあり、観光の後にぜひ体験を。"}}},
zh:{description:"曼谷是金色寺庙、热闹市场和现代摩天大楼交织出迷人混搭的活力城市。从街头小吃到高级餐厅，泰国料理是世界级的美食体验。",spots:{"왕궁·에메랄드 사원":{name:"大皇宫和玉佛寺",desc:"辉煌的前皇家宫殿和供奉玉佛的泰国最神圣的寺庙。泰国建筑和工艺的杰作。"},"왓아룬(새벽사원)":{name:"郑王庙（黎明寺）",desc:"以彩色瓷器装饰的壮丽河畔寺庙。湄南河夕阳下的剪影是曼谷最标志性的景观。"},"짜뚜짝 주말시장":{name:"恰图恰周末市场",desc:"拥有15000多个摊位的世界最大露天市场之一。从古着到珍奇宠物，几乎什么都能找到。"},"카오산 로드":{name:"考山路",desc:"日夜充满活力的传奇背包客圣地。街头小吃摊、酒吧和来自世界各地的旅行者营造出独特氛围。"},"왓포(와불사원)":{name:"卧佛寺",desc:"拥有壮观的46米卧金佛的寺庙。也是传统泰式按摩的发源地——游览后不妨犒劳自己。"}}}
},
// ── 시드니 ──
"시드니":{
en:{description:"Sydney is Australia's harbor jewel, home to the iconic Opera House and Harbour Bridge. World-class beaches, vibrant food scenes, and a laid-back lifestyle make it one of the world's most livable cities.",spots:{"시드니 오페라하우스":{name:"Sydney Opera House",desc:"The UNESCO World Heritage masterpiece with its iconic sail-shaped roof. Catch a performance or take a guided tour of this architectural wonder."},"하버브릿지":{name:"Sydney Harbour Bridge",desc:"The 'Coathanger' bridge offers the iconic BridgeClimb experience — scaling to the summit for breathtaking 360-degree harbor views."},"본다이 비치":{name:"Bondi Beach",desc:"Sydney's most famous beach and a mecca for surfers worldwide. The Bondi to Coogee coastal walk offers spectacular cliff-top ocean views."},"더 록스":{name:"The Rocks",desc:"Sydney's oldest neighborhood with cobblestone streets dating to 1788. Weekend markets, historic pubs, and waterfront dining make it endlessly charming."}}},
ja:{description:"シドニーは象徴的なオペラハウスとハーバーブリッジを擁するオーストラリアの港の宝石です。世界クラスのビーチ、活気あるフードシーン、のんびりしたライフスタイルが世界で最も住みやすい都市の一つにしています。",spots:{"시드니 오페라하우스":{name:"シドニー・オペラハウス",desc:"象徴的な帆の形の屋根を持つユネスコ世界遺産の傑作。公演を観たり、この建築の驚異のガイドツアーに参加してみてください。"},"하버브릿지":{name:"シドニー・ハーバーブリッジ",desc:"'コートハンガー'橋では象徴的なブリッジクライム体験ができ、頂上からの360度の港の絶景を楽しめます。"},"본다이 비치":{name:"ボンダイビーチ",desc:"シドニーで最も有名なビーチで、世界中のサーファーの聖地。ボンダイからクージーへの海岸散歩道は壮大な崖の上の海の景色を楽しめます。"},"더 록스":{name:"ザ・ロックス",desc:"1788年に遡る石畳の通りがあるシドニー最古の地区。週末マーケット、歴史的なパブ、ウォーターフロントのダイニングが魅力的です。"}}},
zh:{description:"悉尼是拥有标志性歌剧院和海港大桥的澳大利亚港湾明珠。世界级海滩、活跃的美食场景和悠闲的生活方式使其成为全球最宜居城市之一。",spots:{"시드니 오페라하우스":{name:"悉尼歌剧院",desc:"拥有标志性帆形屋顶的联合国教科文组织世界遗产杰作。观看演出或参加这座建筑奇迹的导览之旅。"},"하버브릿지":{name:"悉尼海港大桥",desc:"'衣架'大桥提供标志性的攀桥体验——登上顶峰，欣赏360度令人叹为观止的港湾景色。"},"본다이 비치":{name:"邦迪海滩",desc:"悉尼最著名的海滩，全球冲浪者的圣地。邦迪到库吉的海岸步道提供壮观的悬崖海景。"},"더 록스":{name:"岩石区",desc:"悉尼最古老的街区，鹅卵石街道可追溯至1788年。周末市场、历史酒吧和海滨餐厅令人流连忘返。"}}}
},
"베이징":{
en:{description:"Beijing is China's 3,000-year-old capital where the Forbidden City, Great Wall, and Tiananmen Square concentrate the essence of Chinese history. Imperial grandeur and modern development coexist.",spots:{"자금성(고궁박물원)":{name:"Forbidden City",desc:"The world's largest palace complex where 24 emperors of the Ming and Qing dynasties resided. A UNESCO World Heritage site with 9,999 rooms."},"만리장성(바다링)":{name:"Great Wall (Badaling)",desc:"The greatest architectural feat in human history. The Badaling section offers the easiest access to walk along the endless wall."},"천단(텐탄)":{name:"Temple of Heaven",desc:"Where Ming and Qing emperors performed sacrificial rites to Heaven. The circular Hall of Prayer is an architectural marvel."},"이화원":{name:"Summer Palace",desc:"The imperial summer retreat featuring Kunming Lake and Longevity Hill in beautiful harmony. The painted Long Corridor is a highlight."},"왕푸징 먹자골목":{name:"Wangfujing Street",desc:"Beijing's busiest commercial street offering scorpion skewers, lamb kebabs and various Chinese street foods. A paradise for shopping and eating."}}},
ja:{description:"北京は3,000年の歴史を持つ中国の首都で、紫禁城、万里の長城、天安門広場など中国の歴史の核心が凝縮された都市です。帝国の壮大さと現代の発展が共存しています。",spots:{"자금성(고궁박물원)":{name:"紫禁城（故宮博物院）",desc:"明・清時代の24人の皇帝が居住した世界最大の宮殿群。9,999の部屋を持つユネスコ世界文化遺産です。"},"만리장성(바다링)":{name:"万里の長城（八達嶺）",desc:"人類史上最大の建築物。八達嶺セクションは最もアクセスが良く、果てしなく続く長城を歩けます。"},"천단(텐탄)":{name:"天壇",desc:"明・清時代の皇帝が天に祭祀を行った場所。円形の祈年殿の建築美は圧巻です。"},"이화원":{name:"頤和園",desc:"昆明湖と万寿山が美しく調和した清朝皇室の夏の離宮。長い回廊の彩色画が特に見事です。"},"왕푸징 먹자골목":{name:"王府井",desc:"サソリの串焼き、羊肉串など多彩な中国の屋台グルメが楽しめる北京最大の繁華街。ショッピングとグルメの天国です。"}}},
zh:{description:"北京是有着3000年历史的中国首都，故宫、长城、天安门广场等中国历史精华汇聚于此。帝都的恢宏与现代化发展并存。",spots:{"자금성(고궁박물원)":{name:"故宫博物院",desc:"明清两代24位皇帝居住的世界最大宫殿群。拥有9999间房间的联合国教科文组织世界文化遗产。"},"만리장성(바다링)":{name:"长城（八达岭）",desc:"人类历史上最伟大的建筑壮举。八达岭段交通最便利，可沿着无尽的城墙漫步。"},"천단(텐탄)":{name:"天坛",desc:"明清皇帝举行祭天大典的场所。圆形祈年殿的建筑之美令人叹为观止。"},"이화원":{name:"颐和园",desc:"昆明湖与万寿山和谐相融的清朝皇家夏宫。长廊的彩绘尤为精彩。"},"왕푸징 먹자골목":{name:"王府井",desc:"北京最繁华的商业街，可品尝蝎子串、羊肉串等各种中国街头美食。购物与美食的天堂。"}}}
},
"상하이":{
en:{description:"Shanghai is China's largest economic hub where European architecture along the Bund contrasts dramatically with Pudong's futuristic skyscrapers. A unique blend of East meets West.",spots:{"와이탄(외탄)":{name:"The Bund",desc:"A row of 1920s-30s European-style buildings along the Huangpu River, symbolizing Shanghai. At night, the dazzling Pudong skyline across the river is spectacular."},"동방명주탑":{name:"Oriental Pearl Tower",desc:"Shanghai's 468m landmark with a thrilling transparent glass floor observation deck. An essential element of Shanghai's skyline."},"예원(위위안)":{name:"Yu Garden",desc:"A traditional Ming Dynasty garden with exquisite landscaping and architecture. Famous for xiaolongbao soup dumplings in the surrounding bazaar."},"난징루(남경로)":{name:"Nanjing Road",desc:"One of the world's longest shopping streets, always bustling with crowds. Neon signs light up brilliantly at night."}}},
ja:{description:"上海は中国最大の経済都市で、外灘のヨーロッパ風建築と浦東の超高層ビルが劇的なコントラストを見せる華やかな都市です。東洋と西洋の文化が融合した独特の魅力があります。",spots:{"와이탄(외탄)":{name:"外灘（バンド）",desc:"黄浦江沿いに並ぶ1920〜30年代のヨーロッパ風建築群で上海のシンボル。夜は対岸の浦東の華やかな夜景が壮観です。"},"동방명주탑":{name:"東方明珠塔",desc:"高さ468mの上海のランドマークで、透明ガラスの床の展望台がスリル満点。上海のスカイラインの核心です。"},"예원(위위안)":{name:"豫園",desc:"精巧な造園と建築が見事な明代の伝統庭園。周辺の商店街の小籠包が有名です。"},"난징루(남경로)":{name:"南京路",desc:"世界で最も長いショッピングストリートの一つで常に人波で賑わう歩行者天国。夜はネオンが華やかに輝きます。"}}},
zh:{description:"上海是中国最大的经济城市，外滩的欧式建筑与浦东的未来感摩天大楼形成鲜明对比。东西方文化融合的独特魅力。",spots:{"와이탄(외탄)":{name:"外滩",desc:"黄浦江畔一排20-30年代欧式建筑群，是上海的象征。夜晚对岸浦东璀璨的天际线蔚为壮观。"},"동방명주탑":{name:"东方明珠塔",desc:"468米高的上海地标，透明玻璃地板观景台惊险刺激。上海天际线的核心元素。"},"예원(위위안)":{name:"豫园",desc:"精致造园与建筑的明代传统园林。周边商圈的小笼包闻名遐迩。"},"난징루(남경로)":{name:"南京路",desc:"世界最长的购物街之一，永远人头攒动。夜晚霓虹灯璀璨夺目。"}}}
},
"홍콩":{
en:{description:"Hong Kong is a dazzling city where East meets West — skyscrapers tower over traditional temples, and world-class dining coexists with humble street stalls.",spots:{"빅토리아 피크":{name:"Victoria Peak",desc:"The best viewpoint to see Hong Kong's legendary skyline. Take the Peak Tram up and watch the city light up at dusk."},"스타 페리":{name:"Star Ferry",desc:"An iconic ferry crossing Victoria Harbour since 1888. One of the world's most scenic and affordable rides."},"란콰이펑":{name:"Lan Kwai Fong",desc:"Hong Kong's legendary nightlife district packed with bars and restaurants. The energy here peaks on weekend evenings."},"몽콕 야시장":{name:"Mong Kok Night Market",desc:"A bustling night market for street food, electronics, and bargains. Experience Hong Kong's raw, vibrant street culture."}}},
ja:{description:"香港は東洋と西洋が出会う眩い都市—超高層ビルが伝統的な寺院を見下ろし、世界クラスのダイニングと庶民的な屋台が共存しています。",spots:{"빅토리아 피크":{name:"ビクトリア・ピーク",desc:"香港の伝説的なスカイラインを見るベストポイント。ピーク・トラムで登り、夕暮れに街が輝く様を眺めましょう。"},"스타 페리":{name:"スターフェリー",desc:"1888年からビクトリア・ハーバーを横断する象徴的なフェリー。世界で最も景色が良くお手頃な乗り物の一つ。"},"란콰이펑":{name:"蘭桂坊",desc:"バーやレストランが密集する香港の伝説的なナイトライフエリア。週末の夜にエネルギーが最高潮に達します。"},"몽콕 야시장":{name:"旺角ナイトマーケット",desc:"屋台グルメ、電子機器、バーゲン品が並ぶ賑やかな夜市。香港のリアルで活気ある街の文化を体験できます。"}}},
zh:{description:"香港是东西方交汇的璀璨都市——摩天大楼俯瞰传统庙宇，世界级餐饮与街边小摊共存。",spots:{"빅토리아 피크":{name:"太平山顶",desc:"欣赏香港传奇天际线的最佳观景点。乘坐山顶缆车上山，看黄昏时城市亮起灯火。"},"스타 페리":{name:"天星小轮",desc:"自1888年起横渡维多利亚港的标志性渡轮。世界上最具风景且最实惠的交通工具之一。"},"란콰이펑":{name:"兰桂坊",desc:"酒吧和餐厅密集的香港传奇夜生活区。周末夜晚能量达到巅峰。"},"몽콕 야시장":{name:"旺角夜市",desc:"街头小吃、电子产品和便宜货云集的热闹夜市。体验香港最真实、最有活力的街头文化。"}}}
},
"바르셀로나":{
en:{description:"Barcelona is a Mediterranean jewel where Gaudí's fantastical architecture, beautiful beaches, and passionate Catalan culture create an irresistible atmosphere.",spots:{"사그라다 파밀리아":{name:"Sagrada Família",desc:"Gaudí's unfinished masterpiece, under construction since 1882. The interplay of light through stained glass inside is a transcendent experience."},"구엘공원":{name:"Park Güell",desc:"Gaudí's whimsical park overlooking the city, decorated with colorful mosaic tiles. The serpentine bench on the main terrace is iconic."},"람블라스 거리":{name:"Las Ramblas",desc:"Barcelona's most famous 1.2km tree-lined pedestrian avenue stretching from Plaça Catalunya to the waterfront."},"고딕지구":{name:"Gothic Quarter",desc:"A labyrinth of medieval streets and plazas hiding the magnificent Barcelona Cathedral. Every narrow alley holds a surprise."},"캄프누":{name:"Camp Nou",desc:"Home of FC Barcelona and Europe's largest stadium. The museum showcasing Barça's legendary history is a must for football fans."}}},
ja:{description:"バルセロナはガウディの幻想的な建築、美しいビーチ、情熱的なカタルーニャ文化が魅惑的な雰囲気を生み出す地中海の宝石です。",spots:{"사그라다 파밀리아":{name:"サグラダ・ファミリア",desc:"1882年から建設中のガウディ未完の傑作。内部のステンドグラスを通す光の饗宴は超越的な体験です。"},"구엘공원":{name:"グエル公園",desc:"カラフルなモザイクタイルで装飾された、街を見下ろすガウディの風変わりな公園。メインテラスの蛇行するベンチが象徴的です。"},"람블라스 거리":{name:"ランブラス通り",desc:"カタルーニャ広場からウォーターフロントまで続く1.2kmの並木道。バルセロナで最も有名な遊歩道です。"},"고딕지구":{name:"ゴシック地区",desc:"壮大なバルセロナ大聖堂を隠す中世の路地と広場の迷路。すべての路地にサプライズが待っています。"},"캄프누":{name:"カンプ・ノウ",desc:"FCバルセロナの本拠地でヨーロッパ最大のスタジアム。バルサの伝説的な歴史を展示するミュージアムはサッカーファン必見です。"}}},
zh:{description:"巴塞罗那是地中海明珠，高迪的奇幻建筑、美丽海滩和热情的加泰罗尼亚文化营造出令人无法抗拒的氛围。",spots:{"사그라다 파밀리아":{name:"圣家堂",desc:"高迪自1882年起建造的未完成杰作。彩色玻璃窗透射的光影是超凡脱俗的体验。"},"구엘공원":{name:"桂尔公园",desc:"用彩色马赛克装饰的高迪奇幻公园，俯瞰整座城市。主平台上蜿蜒的长椅是标志性景观。"},"람블라스 거리":{name:"兰布拉大街",desc:"从加泰罗尼亚广场延伸到海滨的1.2公里林荫步行大道，巴塞罗那最著名的街道。"},"고딕지구":{name:"哥特区",desc:"隐藏着壮丽巴塞罗那大教堂的中世纪街巷迷宫。每条窄巷都藏着惊喜。"},"캄프누":{name:"诺坎普球场",desc:"巴塞罗那足球俱乐部主场，欧洲最大球场。展示巴萨传奇历史的博物馆是球迷必去之地。"}}}
},
"베를린":{
en:{description:"Berlin is a city reborn from history, where remnants of the Cold War coexist with cutting-edge art and nightlife. Its creative energy and cultural diversity are unmatched in Europe.",spots:{"브란덴부르크 문":{name:"Brandenburg Gate",desc:"The 18th-century neoclassical gate that symbolizes German reunification. Once stranded in no-man's-land between East and West, it now stands as a beacon of freedom."},"베를린 장벽 기념관":{name:"Berlin Wall Memorial",desc:"The most significant preserved section of the Wall with an outdoor exhibition documenting the division and its human cost."},"박물관 섬":{name:"Museum Island",desc:"A UNESCO World Heritage complex of five world-class museums on an island in the Spree River. The Pergamon Museum's monumental ancient artifacts are breathtaking."},"국회의사당":{name:"Reichstag Building",desc:"The German parliament building with Norman Foster's stunning glass dome. Free visits to the dome offer panoramic city views."},"체크포인트 찰리":{name:"Checkpoint Charlie",desc:"The most famous Cold War crossing point between East and West Berlin. The nearby museum tells gripping stories of escape attempts."}}},
ja:{description:"ベルリンは歴史から生まれ変わった都市で、冷戦の遺構と最先端のアートやナイトライフが共存しています。そのクリエイティブなエネルギーと文化的多様性はヨーロッパで類を見ません。",spots:{"브란덴부르크 문":{name:"ブランデンブルク門",desc:"ドイツ再統一を象徴する18世紀の新古典主義の門。かつて東西の無人地帯に取り残されていた門は、今は自由の象徴です。"},"베를린 장벽 기념관":{name:"ベルリンの壁記念館",desc:"壁の最も重要な保存区間で、分断とその人的代償を記録する屋外展示があります。"},"박물관 섬":{name:"博物館島",desc:"シュプレー川の島にある5つの世界クラスの博物館からなるユネスコ世界遺産。ペルガモン博物館の巨大な古代遺物は圧巻です。"},"국회의사당":{name:"連邦議会議事堂",desc:"ノーマン・フォスター設計の見事なガラスドームを持つドイツ連邦議会。ドームへの無料訪問でパノラマの街の景色を楽しめます。"},"체크포인트 찰리":{name:"チェックポイント・チャーリー",desc:"東西ベルリン間で最も有名な冷戦時の検問所。近くの博物館には脱出劇のスリリングな物語が展示されています。"}}},
zh:{description:"柏林是从历史中重生的城市，冷战遗迹与前沿艺术和夜生活共存。其创造力和文化多样性在欧洲无与伦比。",spots:{"브란덴부르크 문":{name:"勃兰登堡门",desc:"象征德国统一的18世纪新古典主义大门。曾被困在东西方无人区的大门，如今是自由的灯塔。"},"베를린 장벽 기념관":{name:"柏林墙纪念馆",desc:"保存最完整的柏林墙段，户外展览记录了分裂及其人道代价。"},"박물관 섬":{name:"博物馆岛",desc:"施普雷河岛上的联合国教科文组织世界遗产，拥有五座世界级博物馆。佩加蒙博物馆的宏伟古代文物令人叹为观止。"},"국회의사당":{name:"国会大厦",desc:"拥有诺曼·福斯特设计的壮观玻璃穹顶的德国联邦议院。免费参观穹顶可享全景城市风光。"},"체크포인트 찰리":{name:"查理检查站",desc:"冷战时期东西柏林之间最著名的过境点。附近的博物馆讲述了扣人心弦的逃亡故事。"}}}
},
"삿포로":{
en:{description:"Sapporo is Hokkaido's capital, world-famous for its Snow Festival, fresh seafood, and ramen. It offers different charms across all four seasons — winter skiing and summer lavender fields.",spots:{"삿포로 눈축제장":{name:"Sapporo Snow Festival",desc:"One of Japan's largest winter events held every February in Odori Park. Massive snow and ice sculptures transform the city into a winter wonderland."},"오도리 공원":{name:"Odori Park",desc:"A 1.5km green belt running through the city center. Hosts the Snow Festival in winter, beer gardens in summer, and autumn food festivals."},"니조 시장":{name:"Nijo Market",desc:"A 100-year-old market overflowing with Hokkaido's freshest seafood. Uni, crab, and salmon roe bowls are legendary breakfast choices."},"시로이 고이비토 파크":{name:"Shiroi Koibito Park",desc:"The factory of Hokkaido's famous white chocolate cookie. Watch the production line, try cookie-making, and enjoy the European-style garden."}}},
ja:{description:"札幌は北海道の首都で、雪まつり、新鮮な海の幸、ラーメンで世界的に有名です。冬のスキーから夏のラベンダー畑まで、四季折々の魅力を楽しめます。",spots:{"삿포로 눈축제장":{name:"さっぽろ雪まつり",desc:"毎年2月に大通公園で開催される日本最大級の冬のイベント。巨大な雪像と氷像が街をウィンターワンダーランドに変えます。"},"오도리 공원":{name:"大通公園",desc:"市街地を貫く1.5kmの緑地帯。冬は雪まつり、夏はビアガーデン、秋はフードフェスティバルの会場になります。"},"니조 시장":{name:"二条市場",desc:"北海道の最も新鮮な海の幸があふれる100年の歴史を持つ市場。ウニ、カニ、いくら丼は伝説的な朝食メニューです。"},"시로이 고이비토 파크":{name:"白い恋人パーク",desc:"北海道の有名なホワイトチョコクッキーの工場。製造ラインの見学やお菓子作り体験、ヨーロッパ風の庭園が楽しめます。"}}},
zh:{description:"札幌是北海道的首府，以雪祭、新鲜海鲜和拉面闻名于世。冬季滑雪、夏季薰衣草田，四季各有不同魅力。",spots:{"삿포로 눈축제장":{name:"札幌雪祭",desc:"每年2月在大通公园举办的日本最大冬季活动之一。巨大的雪雕和冰雕将城市变成冬季仙境。"},"오도리 공원":{name:"大通公园",desc:"贯穿市中心的1.5公里绿色长廊。冬有雪祭，夏有啤酒花园，秋有美食节。"},"니조 시장":{name:"二条市场",desc:"拥有百年历史、满溢北海道最新鲜海鲜的市场。海胆、螃蟹和鲑鱼籽盖饭是传奇早餐之选。"},"시로이 고이비토 파크":{name:"白色恋人公园",desc:"北海道著名白巧克力饼干的工厂。参观生产线、体验制作饼干，还有欧式花园可供漫步。"}}}
},
"치앙마이":{
en:{description:"Chiang Mai is northern Thailand's cultural capital, surrounded by mountains and over 300 ancient temples. Night markets, elephant sanctuaries, and Thai cooking classes make it a traveler favorite.",spots:{"왓프라탓 도이수텝":{name:"Wat Phra That Doi Suthep",desc:"A stunning golden temple perched atop Doi Suthep mountain. Climb the 309-step Naga staircase for panoramic views of Chiang Mai below."},"올드시티 사원 투어":{name:"Old City Temple Tour",desc:"Explore over 30 temples within the ancient walled city. Wat Chedi Luang and Wat Phra Singh are the most impressive."},"선데이 워킹스트리트":{name:"Sunday Walking Street",desc:"A massive night market stretching along Ratchadamnoen Road every Sunday. Local crafts, street food, and live music create an unforgettable evening."},"코끼리보호구역":{name:"Elephant Sanctuary",desc:"Ethical sanctuaries where you can feed, bathe, and walk with rescued elephants in their natural habitat. A life-changing experience."}}},
ja:{description:"チェンマイは山々に囲まれた300以上の古代寺院を持つ北タイの文化的首都です。ナイトマーケット、象のサンクチュアリ、タイ料理教室が旅行者に人気です。",spots:{"왓프라탓 도이수텝":{name:"ワット・プラタート・ドイ・ステープ",desc:"ドイ・ステープ山の頂上にそびえる見事な金色の寺院。309段のナーガの階段を登るとチェンマイのパノラマビューが広がります。"},"올드시티 사원 투어":{name:"旧市街寺院巡り",desc:"城壁に囲まれた旧市街内の30以上の寺院を探索。ワット・チェディ・ルアンとワット・プラ・シンが最も印象的です。"},"선데이 워킹스트리트":{name:"サンデー・ウォーキングストリート",desc:"毎週日曜にラチャダムヌン通りに広がる巨大なナイトマーケット。地元の工芸品、屋台グルメ、ライブ音楽で忘れられない夜を。"},"코끼리보호구역":{name:"エレファント・サンクチュアリ",desc:"救助されたゾウに餌をやり、一緒に水浴びし、自然の中を歩ける倫理的な保護施設。人生を変える体験です。"}}},
zh:{description:"清迈是被群山环绕、拥有300多座古寺的泰国北部文化之都。夜市、大象保护区和泰式烹饪课程使其成为旅行者的最爱。",spots:{"왓프라탓 도이수텝":{name:"双龙寺",desc:"矗立在素贴山顶的金碧辉煌的寺庙。攀登309级纳迦阶梯可俯瞰清迈全景。"},"올드시티 사원 투어":{name:"古城寺庙之旅",desc:"探索古城墙内30多座寺庙。柴迪隆寺和帕辛寺最为壮观。"},"선데이 워킹스트리트":{name:"周日步行街",desc:"每周日沿拉差丹农路铺展的大型夜市。当地手工艺品、街头美食和现场音乐营造难忘夜晚。"},"코끼리보호구역":{name:"大象保护区",desc:"在自然栖息地中喂养、沐浴和陪伴被救助大象的伦理保护区。改变人生的体验。"}}}
},
"푸켓":{
en:{description:"Phuket is Thailand's largest island, a tropical paradise with crystal-clear waters, white-sand beaches, and vibrant nightlife. From luxury resorts to backpacker hostels, it caters to all travelers.",spots:{"파통 비치":{name:"Patong Beach",desc:"Phuket's most famous and liveliest beach. By day, water sports and sunbathing; by night, Bangla Road's legendary nightlife comes alive."},"피피섬 투어":{name:"Phi Phi Islands Tour",desc:"Speedboat to the stunning islands made famous by the movie 'The Beach.' Maya Bay's turquoise lagoon is one of the world's most beautiful."},"올드타운 푸켓":{name:"Old Phuket Town",desc:"Colorful Sino-Portuguese shophouses lining charming streets. Instagrammable cafés, street art, and authentic Thai-Chinese culture."},"팡아만":{name:"Phang Nga Bay",desc:"A breathtaking seascape of towering limestone karsts rising from emerald waters. James Bond Island from 'The Man with the Golden Gun' is the highlight."}}},
ja:{description:"プーケットはタイ最大の島で、透明な海、白砂のビーチ、活気あるナイトライフを誇るトロピカルパラダイスです。高級リゾートからバックパッカー向けまで全ての旅行者に対応しています。",spots:{"파통 비치":{name:"パトンビーチ",desc:"プーケットで最も有名で活気のあるビーチ。昼はマリンスポーツと日光浴、夜はバングラ通りの伝説的なナイトライフ。"},"피피섬 투어":{name:"ピピ島ツアー",desc:"映画『ザ・ビーチ』で有名になった美しい島々へスピードボートで。マヤベイのターコイズブルーのラグーンは世界で最も美しい場所の一つ。"},"올드타운 푸켓":{name:"オールドタウン・プーケット",desc:"魅力的な通りに並ぶカラフルなシノ・ポルトギーゼ建築。インスタ映えカフェ、ストリートアート、タイ・中国の本格文化が楽しめます。"},"팡아만":{name:"パンガー湾",desc:"エメラルドの海からそびえる石灰岩のカルスト地形の息を飲む海景。『007 黄金銃を持つ男』のジェームス・ボンド島がハイライトです。"}}},
zh:{description:"普吉岛是泰国最大的岛屿，以清澈海水、白沙滩和活力夜生活著称的热带天堂。从奢华度假村到背包客旅舍，适合所有旅行者。",spots:{"파통 비치":{name:"芭东海滩",desc:"普吉岛最著名、最热闹的海滩。白天水上运动和日光浴，夜晚邦古拉街传奇夜生活上演。"},"피피섬 투어":{name:"皮皮岛之旅",desc:"乘快艇前往因电影《海滩》而闻名的美丽群岛。玛雅湾的碧绿泻湖是世界最美的地方之一。"},"올드타운 푸켓":{name:"普吉老城",desc:"迷人街道两旁排列着色彩缤纷的中葡建筑。网红咖啡馆、街头艺术和正宗泰华文化。"},"팡아만":{name:"攀牙湾",desc:"翡翠色海面上耸立着巨大石灰岩喀斯特地貌的壮丽海景。《金枪人》中的詹姆斯·邦德岛是最大亮点。"}}}
},
"베네치아":{
en:{description:"Venice is a floating city of over 100 islands connected by 400 bridges, where cars don't exist and gondolas glide through romantic canals.",spots:{"산마르코 광장":{name:"St. Mark's Square",desc:"The heart of Venice, lined by the stunning Basilica, Doge's Palace, and the iconic Bell Tower."},"리알토 다리":{name:"Rialto Bridge",desc:"The oldest and most famous bridge over the Grand Canal, built in 1591."},"두칼레 궁전":{name:"Doge's Palace",desc:"A Gothic masterpiece that was the center of Venetian power for centuries."},"부라노 섬":{name:"Burano Island",desc:"A tiny island famous for its rainbow-colored fishermen's houses and lace-making tradition."}}},
ja:{description:"ヴェネツィアは400の橋で結ばれた100以上の島からなる水上都市で、ゴンドラがロマンチックな運河を滑ります。",spots:{"산마르코 광장":{name:"サン・マルコ広場",desc:"壮大な聖堂、ドゥカーレ宮殿に囲まれたヴェネツィアの心臓。"},"리알토 다리":{name:"リアルト橋",desc:"1591年に建てられた大運河に架かる最古で最も有名な橋。"},"두칼레 궁전":{name:"ドゥカーレ宮殿",desc:"何世紀にもわたりヴェネツィアの権力の中心だったゴシック建築の傑作。"},"부라노 섬":{name:"ブラーノ島",desc:"虹色の漁師の家々とレース編みの伝統で有名な小さな島。"}}},
zh:{description:"威尼斯是由400座桥连接100多个岛屿的水上城市，贡多拉在浪漫运河中穿行。",spots:{"산마르코 광장":{name:"圣马可广场",desc:"威尼斯的心脏，壮丽大教堂和总督府环绕。"},"리알토 다리":{name:"里亚托桥",desc:"1591年建造的大运河上最古老最著名的桥。"},"두칼레 궁전":{name:"总督宫",desc:"数百年来威尼斯权力中心的哥特式杰作。"},"부라노 섬":{name:"布拉诺岛",desc:"以彩虹色渔民房屋和蕾丝工艺闻名的小岛。"}}}
},
"피렌체":{
en:{description:"Florence is the birthplace of the Renaissance, where Brunelleschi's dome dominates the skyline and masterpieces fill world-class museums.",spots:{"두오모(대성당)":{name:"Florence Cathedral (Duomo)",desc:"The iconic red-tiled dome by Brunelleschi. Climb 463 steps for the most spectacular view of Florence."},"우피치 미술관":{name:"Uffizi Gallery",desc:"Premier art museum housing Botticelli's Birth of Venus and works by Leonardo and Raphael."},"베키오 다리":{name:"Ponte Vecchio",desc:"Medieval bridge lined with jewelry shops spanning the Arno River."},"미켈란젤로 광장":{name:"Piazzale Michelangelo",desc:"The ultimate panoramic viewpoint over Florence. Sunset here is unforgettable."}}},
ja:{description:"フィレンツェはルネサンス発祥の地で、ブルネレスキのドームがスカイラインを支配し傑作が美術館を満たしています。",spots:{"두오모(대성당)":{name:"フィレンツェ大聖堂",desc:"ブルネレスキ設計の赤いタイルのドーム。463段登ると壮観な眺め。"},"우피치 미술관":{name:"ウフィツィ美術館",desc:"ボッティチェリのヴィーナスの誕生やレオナルド作品を所蔵する世界屈指の美術館。"},"베키오 다리":{name:"ポンテ・ヴェッキオ",desc:"アルノ川に架かる宝飾店が並ぶ中世の石橋。"},"미켈란젤로 광장":{name:"ミケランジェロ広場",desc:"フィレンツェ全体を見渡す究極のパノラマスポット。夕暮れの眺めは忘れられません。"}}},
zh:{description:"佛罗伦萨是文艺复兴发源地，布鲁内莱斯基穹顶主导天际线，杰作充满世界级博物馆。",spots:{"두오모(대성당)":{name:"佛罗伦萨大教堂",desc:"布鲁内莱斯基的标志性红瓦穹顶。攀463级台阶登顶赏全景。"},"우피치 미술관":{name:"乌菲齐美术馆",desc:"收藏波提切利维纳斯诞生及达芬奇拉斐尔作品的顶级美术馆。"},"베키오 다리":{name:"老桥",desc:"横跨阿诺河两侧排列珠宝店的中世纪石桥。"},"미켈란젤로 광장":{name:"米开朗基罗广场",desc:"俯瞰佛罗伦萨全景的终极观景台。日落景色终生难忘。"}}}
},
"샌프란시스코":{
en:{description:"San Francisco is a city of iconic hills, the Golden Gate Bridge, and a fiercely independent spirit.",spots:{"금문교":{name:"Golden Gate Bridge",desc:"The world's most photographed bridge spanning 2.7km. Walking across with fog rolling beneath is quintessential SF."},"알카트라즈":{name:"Alcatraz Island",desc:"The infamous former federal prison. The audio tour with actual inmates' voices is haunting."},"피셔맨스 워프":{name:"Fisherman's Wharf",desc:"SF's most popular waterfront — sea lions at Pier 39, clam chowder in sourdough bowls, and bay views."},"케이블카":{name:"Cable Cars",desc:"Iconic cable cars climbing SF's steep hills since 1873. The Powell-Hyde line has the best views."}}},
ja:{description:"サンフランシスコは象徴的な坂道、ゴールデン・ゲート・ブリッジ、独立した精神を持つ都市です。",spots:{"금문교":{name:"ゴールデン・ゲート・ブリッジ",desc:"全長2.7kmの世界で最も撮影される橋。霧の中を歩くのはSFの真髄体験。"},"알카트라즈":{name:"アルカトラズ島",desc:"悪名高い旧連邦刑務所。囚人の声が聞けるオーディオツアーは忘れられません。"},"피셔맨스 워프":{name:"フィッシャーマンズ・ワーフ",desc:"ピア39のアシカ、クラムチャウダー、湾の景色が楽しめる人気ウォーターフロント。"},"케이블카":{name:"ケーブルカー",desc:"1873年から急坂を登るケーブルカー。パウエル-ハイドラインの眺めが最高。"}}},
zh:{description:"旧金山是拥有标志性山丘、金门大桥和独立精神的城市。",spots:{"금문교":{name:"金门大桥",desc:"横跨海湾2.7公里的世界最常被拍摄的桥。雾中步行是最经典的旧金山体验。"},"알카트라즈":{name:"恶魔岛",desc:"臭名昭著的前联邦监狱。真实囚犯声音的语音导览令人难忘。"},"피셔맨스 워프":{name:"渔人码头",desc:"39号码头海狮、酸面包蛤蜊浓汤和海湾风光——旧金山最受欢迎的滨水区。"},"케이블카":{name:"缆车",desc:"自1873年攀行陡坡的标志性缆车。鲍威尔-海德线风景最佳。"}}}
},
"라스베이거스":{
en:{description:"Las Vegas is the entertainment capital of the world, a neon oasis in the Nevada desert.",spots:{"더 스트립":{name:"The Strip",desc:"The legendary 6.8km boulevard of mega-resorts. Bellagio fountains at night are mesmerizing."},"프리몬트 스트리트":{name:"Fremont Street",desc:"Old Vegas downtown covered by a spectacular LED canopy with zip lines and street performers."},"그랜드캐니언 투어":{name:"Grand Canyon Tour",desc:"Must-do day trip. Helicopter tours or the glass Skywalk are bucket-list experiences."},"시르크 뒤 솔레이유":{name:"Cirque du Soleil",desc:"Multiple permanent shows — breathtaking fusion of acrobatics, art, and music."}}},
ja:{description:"ラスベガスはネバダ砂漠のネオンのオアシス、世界のエンターテインメントの首都です。",spots:{"더 스트립":{name:"ザ・ストリップ",desc:"メガリゾートが並ぶ6.8kmの大通り。夜のベラージオ噴水は見とれるほど。"},"프리몬트 스트리트":{name:"フリーモント・ストリート",desc:"LEDキャノピーに覆われたオールドベガス。ジップラインや大道芸人が楽しめます。"},"그랜드캐니언 투어":{name:"グランドキャニオンツアー",desc:"必須の日帰り旅行。ヘリコプターツアーやガラスのスカイウォークは一生の思い出に。"},"시르크 뒤 솔레이유":{name:"シルク・ドゥ・ソレイユ",desc:"複数の常設ショー。アクロバット、アート、音楽の息を飲む融合です。"}}},
zh:{description:"拉斯维加斯是世界娱乐之都，内华达沙漠中的霓虹绿洲。",spots:{"더 스트립":{name:"拉斯维加斯大道",desc:"排列超级度假村的6.8公里传奇大道。百乐宫喷泉夜景令人着迷。"},"프리몬트 스트리트":{name:"弗里蒙特街",desc:"壮观LED天幕覆盖的老维加斯市中心，有滑索和街头表演。"},"그랜드캐니언 투어":{name:"大峡谷之旅",desc:"必做一日游。直升机游览或玻璃天空步道是遗愿清单级体验。"},"시르크 뒤 솔레이유":{name:"太阳马戏团",desc:"多个常驻演出——杂技、艺术和音乐的震撼融合。"}}}
},
"마추픽추":{
en:{description:"Machu Picchu is the legendary lost city of the Incas at 2,430m in the Andes — a New Seven Wonder of the World.",spots:{"마추픽추 성채":{name:"Machu Picchu Citadel",desc:"The stunning Inca citadel hidden among peaks. Temple of the Sun and agricultural terraces showcase Inca genius."},"와이나픽추":{name:"Huayna Picchu",desc:"The steep peak behind Machu Picchu with the classic postcard view. Limited to 400/day."},"잉카 트레일":{name:"Inca Trail",desc:"Legendary 4-day trek through cloud forests arriving at sunrise through the Sun Gate."},"아구아스 칼리엔테스":{name:"Aguas Calientes",desc:"Gateway town with hot springs and markets. The train through Sacred Valley is scenic."}}},
ja:{description:"マチュ・ピチュはアンデス標高2,430mの伝説のインカの失われた都市、新世界七不思議の一つです。",spots:{"마추픽추 성채":{name:"マチュ・ピチュ城塞",desc:"山頂に隠されたインカの城塞。太陽の神殿と農業テラスがインカの天才を示しています。"},"와이나픽추":{name:"ワイナ・ピチュ",desc:"定番の絵葉書の眺めが楽しめる急峻な峰。1日400人限定。"},"잉카 트레일":{name:"インカ・トレイル",desc:"雲霧林を通り日の出に太陽の門から到達する伝説の4日間トレッキング。"},"아구아스 칼리엔테스":{name:"アグアス・カリエンテス",desc:"温泉とマーケットがある麓の町。聖なる谷を抜ける列車も風光明媚です。"}}},
zh:{description:"马丘比丘是安第斯山脉海拔2430米的传说中印加失落之城，新世界七大奇迹之一。",spots:{"마추픽추 성채":{name:"马丘比丘城堡",desc:"隐藏在山峰间的壮观印加城堡。太阳神殿和农业梯田展示印加工程天才。"},"와이나픽추":{name:"瓦伊纳比丘",desc:"经典明信片般景色的陡峭山峰。每日限400人。"},"잉카 트레일":{name:"印加古道",desc:"穿越云雾森林、日出时通过太阳门抵达的传奇4天徒步之旅。"},"아구아스 칼리엔테스":{name:"热水镇",desc:"山脚下有温泉和市场的门户小镇。穿越圣谷的火车风景秀丽。"}}}
},

"경주":{
en:{description:"Gyeongju was the capital of the thousand-year Silla Kingdom, and the entire city is called an outdoor museum. Countless UNESCO heritage sites including Bulguksa Temple, Seokguram Grotto, and Cheomseongdae Observatory are scattered throughout the city.",spots:{"불국사":{name:"Bulguksa Temple",desc:"A UNESCO World Heritage temple representing the pinnacle of Silla Buddhism, with Dabotap and Seokgatap pagodas showcasing exquisite stone craftsmanship."},"석굴암":{name:"Seokguram Grotto",desc:"A UNESCO World Heritage grotto featuring a magnificent Buddha statue. The scientific construction technique that prevents condensation is astounding."},"첨성대":{name:"Cheomseongdae Observatory",desc:"The world's oldest surviving astronomical observatory built in 632 AD. A symbol of Silla's advanced scientific culture."},"대릉원":{name:"Daereungwon Tomb Complex",desc:"A complex of massive Silla royal tombs. The Cheonmachong Tomb contains a famous mural of a heavenly horse."},"안압지":{name:"Anapji Pond",desc:"A Silla palace pond with beautiful nighttime illumination. The reflection of pavilions on the water creates a dreamlike atmosphere."}}},
ja:{description:"慶州は千年新羅王国の都で、都市全体が野外博物館と呼ばれています。仏国寺、石窟庵、瞻星台など数多くのユネスコ遺産が市内各所にあります。",spots:{"불국사":{name:"仏国寺",desc:"新羅仏教の精髄を代表するユネスコ世界文化遺産の寺院で、多宝塔と石迦塔が精巧な石造工芸を見せます。"},"석굴암":{name:"石窟庵",desc:"壮大な仏像があるユネスコ世界文化遺産の石窟です。結露を防ぐ科学的な建築技法に驚かされます。"},"첨성대":{name:"瞻星台",desc:"632年に建てられた世界最古の現存天文台です。新羅の先進的な科学文化の象徴です。"},"대릉원":{name:"大陵苑",desc:"巨大な新羅王陵群です。天馬塚には有名な天馬図の壁画があります。"},"안압지":{name:"雁鴨池",desc:"新羅宮殿の池で夜景照明が美しいです。水面に映る亭子の姿が幻想的です。"}}},
zh:{description:"庆州是千年新罗王国的都城，整座城市被称为露天博物馆。佛国寺、石窟庵、瞻星台等众多联合国教科文组织遗产遍布全城。",spots:{"불국사":{name:"佛国寺",desc:"代表新罗佛教精髓的联合国教科文组织世界文化遗产寺庙，多宝塔和释迦塔展现精湛的石造工艺。"},"석굴암":{name:"石窟庵",desc:"拥有壮观佛像的联合国教科文组织世界文化遗产石窟。防止结露的科学建筑技法令人惊叹。"},"첨성대":{name:"瞻星台",desc:"公元632年建造的世界现存最古老的天文台。是新罗先进科学文化的象征。"},"대릉원":{name:"大陵苑",desc:"巨大的新罗王陵群。天马冢内有著名的天马图壁画。"},"안압지":{name:"雁鸭池",desc:"新罗宫殿池塘，夜景照明美轮美奂。水面倒映的亭子如梦似幻。"}}}
},

// ── Slovenia ──
"류블랴나":{
en:{description:"Ljubljana is Slovenia's charming capital nestled between the Alps and the Adriatic, known for its medieval castle, the iconic Triple Bridge, and a vibrant café culture along the Ljubljanica River.",spots:{"류블랴나 성":{name:"Ljubljana Castle",desc:"A medieval castle atop a hill in the city center. Take the funicular up for sweeping views of Ljubljana's rooftops and the Alps beyond."},"트리플 브릿지":{name:"Triple Bridge",desc:"Three parallel bridges over the Ljubljanica River, the city's most beloved landmark surrounded by lively riverside cafés."},"류블랴나 중앙시장":{name:"Central Market",desc:"An outdoor riverside market offering fresh local produce, Slovenian cheeses, honey, and seasonal specialties."}}},
ja:{description:"リュブリャナはアルプスとアドリア海の間に位置するスロベニアの魅力的な首都。中世の城、トリプルブリッジ、リュブリャニツァ川沿いの活気あるカフェ文化が魅力です。",spots:{"류블랴나 성":{name:"リュブリャナ城",desc:"市内の丘の上にある中世の城。ケーブルカーで登るとリュブリャナの屋根とアルプスの絶景が広がります。"},"트리플 브릿지":{name:"トリプルブリッジ",desc:"リュブリャニツァ川に架かる3本の並行した橋。川沿いのカフェに囲まれた最愛のランドマーク。"},"류블랴나 중앙시장":{name:"中央市場",desc:"新鮮な地元食材、スロベニアのチーズ、蜂蜜、旬の特産品が並ぶ川沿いの野外市場。"}}},
zh:{description:"卢布尔雅那是斯洛文尼亚迷人的首都，坐落在阿尔卑斯山与亚得里亚海之间，以中世纪城堡、标志性三桥和卢布尔雅尼察河畔的咖啡馆文化著称。",spots:{"류블랴나 성":{name:"卢布尔雅那城堡",desc:"市中心山丘上的中世纪城堡。乘坐缆车登顶，可俯瞰卢布尔雅那屋顶和远处的阿尔卑斯山。"},"트리플 브릿지":{name:"三桥",desc:"横跨卢布尔雅尼察河的三座平行桥，是城市最受欢迎的地标，周围咖啡馆林立。"},"류블랴나 중앙시장":{name:"中央市场",desc:"提供新鲜当地农产品、斯洛文尼亚奶酪、蜂蜜和时令特产的河畔露天市场。"}}}
},
"블레드":{
en:{description:"Bled is a fairy-tale destination in the Julian Alps, where an emerald lake, a clifftop castle, and a tiny island church combine to create one of Europe's most postcard-perfect landscapes.",spots:{"블레드 성":{name:"Bled Castle",desc:"Slovenia's oldest castle perched on a 100m cliff. The views of Lake Bled and the Alps from the ramparts are breathtaking."},"블레드 섬 성모 교회":{name:"Bled Island Church",desc:"A Baroque church on a tiny island in the lake, reached by traditional pletna rowboats. Ring the wishing bell inside for good luck."},"빈트가르 협곡":{name:"Vintgar Gorge",desc:"A stunning 1.6km gorge with emerald-green water, carved by the Radovna River. Wooden walkways lead through the canyon."}}},
ja:{description:"ブレッドはユリアンアルプスのおとぎ話のような目的地。エメラルドグリーンの湖、断崖の城、小さな島の教会がヨーロッパ屈指の絶景を生み出しています。",spots:{"블레드 성":{name:"ブレッド城",desc:"100mの断崖にそびえるスロベニア最古の城。城壁からのブレッド湖とアルプスの眺めは息を飲む美しさ。"},"블레드 섬 성모 교회":{name:"ブレッド島の聖母教会",desc:"伝統的なプレトナボートで渡る湖の小島にあるバロック様式の教会。中の願いの鐘を鳴らすと幸運が訪れます。"},"빈트가르 협곡":{name:"ヴィントガル渓谷",desc:"ラドヴナ川が刻むエメラルドグリーンの1.6kmの渓谷。木製の遊歩道が峡谷を縫います。"}}},
zh:{description:"布莱德是朱利安阿尔卑斯山中的童话胜地，翡翠湖泊、悬崖城堡和小岛教堂共同构成了欧洲最如画的景观之一。",spots:{"블레드 성":{name:"布莱德城堡",desc:"矗立于100米悬崖上的斯洛文尼亚最古老城堡。从城垛眺望布莱德湖和阿尔卑斯山，令人叹为观止。"},"블레드 섬 성모 교회":{name:"布莱德岛圣母教堂",desc:"乘坐传统平底船抵达湖中小岛上的巴洛克式教堂。摇响许愿钟据说能带来好运。"},"빈트가르 협곡":{name:"文特加尔峡谷",desc:"拉多夫纳河冲刷而成的1.6公里翡翠峡谷，木质栈道穿峡而行，景色迷人。"}}}
},
"피란":{
en:{description:"Piran is a medieval Venetian-style harbor town perched on a narrow peninsula, with labyrinthine alleys, orange rooftops, and stunning Adriatic Sea views.",spots:{"타르티니 광장":{name:"Tartini Square",desc:"Piran's elegant main square named after the violin virtuoso Giuseppe Tartini. Beautiful Venetian-style buildings wrap around the semicircular piazza."},"성 조르지오 성당 종탑":{name:"St. George's Cathedral Bell Tower",desc:"Climb the bell tower of this hilltop cathedral for a panoramic 360-degree view of Piran's old town and the Adriatic Sea."}}},
ja:{description:"ピランは細い半島に突き出た中世のヴェネツィア風の港町。迷路のような路地、オレンジ色の屋根、素晴らしいアドリア海の眺めが魅力です。",spots:{"타르티니 광장":{name:"タルティーニ広場",desc:"ヴァイオリンの名手ジュゼッペ・タルティーニにちなんで名付けられた優美な広場。半円形の広場を囲むヴェネツィア様式の建物が美しい。"},"성 조르지오 성당 종탑":{name:"聖ゲオルギウス大聖堂の鐘楼",desc:"丘の上の大聖堂の鐘楼に登ると、ピランの旧市街とアドリア海のパノラマが広がります。"}}},
zh:{description:"皮兰是一座坐落在狭窄半岛上的中世纪威尼斯风格港口小城，拥有迷宫般的小巷、橙色屋顶和壮丽的亚得里亚海景色。",spots:{"타르티니 광장":{name:"塔尔蒂尼广场",desc:"以小提琴大师塔尔蒂尼命名的优雅广场，威尼斯式建筑环绕半圆形广场，美不胜收。"},"성 조르지오 성당 종탑":{name:"圣乔治大教堂钟楼",desc:"登上山顶教堂的钟楼，可360度俯瞰皮兰老城和亚得里亚海全景。"}}}
},
"마리보르":{
en:{description:"Maribor is Slovenia's second city, home to the world's oldest vine and a beautifully preserved old town along the Drava River. It's the heart of Slovenian wine country.",spots:{"올드 바인 하우스":{name:"Old Vine House",desc:"Home to the world's oldest vine, over 400 years old. Wine from this remarkable vine is presented to world leaders as a state gift."},"마리보르 성":{name:"Maribor Castle",desc:"A 15th-century castle on the banks of the Drava River, now housing the Regional Museum with exhibits on local history and culture."}}},
ja:{description:"マリボルはスロベニア第2の都市。世界最古のブドウの木とドラヴァ川沿いの美しく保存された旧市街を持つ、スロベニアワインの中心地です。",spots:{"올드 바인 하우스":{name:"オールド・ヴァイン・ハウス",desc:"樹齢400年以上の世界最古のブドウの木が生きる博物館。このブドウから作られたワインは世界の指導者への国家的な贈り物として贈られます。"},"마리보르 성":{name:"マリボル城",desc:"ドラヴァ川沿いの15世紀の城で、現在は地域の歴史と文化を展示する地域博物館になっています。"}}},
zh:{description:"马里博尔是斯洛文尼亚第二大城市，拥有世界上最古老的葡萄藤和德拉瓦河畔保存完好的老城区，是斯洛文尼亚葡萄酒之乡的中心。",spots:{"올드 바인 하우스":{name:"老葡萄藤之家",desc:"世界最古老的葡萄藤（树龄逾400年）的所在地。这株葡萄藤酿制的葡萄酒被作为国礼赠送给世界各国领导人。"},"마리보르 성":{name:"马里博尔城堡",desc:"德拉瓦河畔的15世纪城堡，现为地区博物馆，展示当地历史与文化。"}}}
},

// ── Georgia new cities ──
"카즈베기":{
en:{description:"Kazbegi is a dramatic mountain village in the Greater Caucasus at 1,740m, famous for the Gergeti Trinity Church perched impossibly above the clouds and the snow-capped peak of Mt. Kazbek.",spots:{"게르게티 삼위일체 교회":{name:"Gergeti Trinity Church",desc:"A 14th-century church sitting at 2,170m above sea level. The view with snow-capped Mt. Kazbek behind it is Georgia's most iconic image."},"카즈베기 국립공원":{name:"Kazbegi National Park",desc:"A national park centered on Mt. Kazbek (5,047m). Paradise for trekkers and hikers seeking epic Caucasus mountain scenery."}}},
ja:{description:"カズベギは大コーカサス山脈の海抜1,740mにある劇的な山岳村。雲の上にそびえるゲルゲティ三位一体教会とカズベキ山の雪峰が有名です。",spots:{"게르게티 삼위일체 교회":{name:"ゲルゲティ三位一体教会",desc:"海抜2,170mに立つ14世紀の教会。雪を戴くカズベキ山を背にした光景はジョージアで最も象徴的な絶景です。"},"카즈베기 국립공원":{name:"カズベギ国立公園",desc:"カズベキ山(5,047m)を中心とした国立公園。コーカサスの雄大な山岳風景を求めるトレッカーの楽園です。"}}},
zh:{description:"卡兹别吉是大高加索山脉海拔1740米处的壮丽山村，以悬挂云端的格尔格提三一教堂和白雪皑皑的卡兹别克山著称。",spots:{"게르게티 삼위일체 교회":{name:"格尔格提三一教堂",desc:"坐落在海拔2170米处的14世纪教堂，以雪峰卡兹别克山为背景的景色是格鲁吉亚最标志性的画面。"},"카즈베기 국립공원":{name:"卡兹别吉国家公园",desc:"以卡兹别克山(5047米)为核心的国家公园，是寻访壮观高加索山岳风光的徒步天堂。"}}}
},
"메스티아":{
en:{description:"Mestia is the main settlement of the Svan region, a UNESCO World Heritage area known for its unique medieval stone towers and the spectacular Caucasus peaks including Mt. Ushba.",spots:{"스반 탑":{name:"Svan Towers",desc:"Medieval defensive stone towers built by the Svan people to protect against invaders. Over 20 towers still stand throughout the village, now a UNESCO World Heritage site."},"메스티아 박물관":{name:"Svaneti History Museum",desc:"Houses rare medieval icons, gold and silver artifacts, and armor from the Svan people — treasures that survived centuries of isolation in the high Caucasus."}}},
ja:{description:"メスティアはスヴァン地方の中心集落。ユネスコ世界遺産に登録された独特の中世の石の塔とウシュバ山をはじめとするコーカサスの山々が壮観です。",spots:{"스반 탑":{name:"スヴァンの塔",desc:"外敵から身を守るためにスヴァン人が建てた中世の防衛石塔。村内に20以上の塔が現存しユネスコ世界遺産に登録されています。"},"메스티아 박물관":{name:"スヴァネティ歴史博物館",desc:"高コーカサスの孤立した地で何世紀も守られた中世の聖像画、金銀工芸品、甲冑などが収蔵されています。"}}},
zh:{description:"梅斯蒂亚是斯万地区的主要聚居地，以独特的中世纪石塔和包括乌什巴山在内的壮丽高加索山峰而闻名，被列为联合国教科文组织世界遗产。",spots:{"스반 탑":{name:"斯万塔楼",desc:"斯万人为抵御入侵者而建造的中世纪防御石塔，村内仍保存20余座，已被列入联合国教科文组织世界遗产名录。"},"메스티아 박물관":{name:"斯万涅季历史博物馆",desc:"收藏在高加索山中与世隔绝数百年的珍贵中世纪圣像、金银器和铠甲等文物。"}}}
},
"시그나기":{
en:{description:"Sighnaghi is a hilltop 'city of love' in the Kakheti wine region, famous for its 18th-century walls enclosing cobblestone streets, panoramic Alazani Valley views, and excellent Georgian wine.",spots:{"시그나기 성벽":{name:"Sighnaghi Walls",desc:"18th-century walls with 28 towers encircling the hilltop town. The view over vineyards and the Alazani River valley stretching to the Caucasus is spectacular."},"보드베 수녀원":{name:"Bodbe Monastery",desc:"A 9th-century Georgian Orthodox monastery containing the tomb of St. Nino, who brought Christianity to Georgia. A sacred pilgrimage site."}}},
ja:{description:"シグナギはカヘティのワイン地方の丘の上の'愛の街'。18世紀の城壁と石畳の通り、アラザニ渓谷のパノラマビュー、そして最高のジョージアワインで知られています。",spots:{"시그나기 성벽":{name:"シグナギの城壁",desc:"28の塔を持つ18世紀の城壁が丘の町を囲んでいます。ブドウ畑とアラザニ川の渓谷がコーカサスまで広がる絶景が楽しめます。"},"보드베 수녀원":{name:"ボドベ修道院",desc:"ジョージアにキリスト教をもたらした聖ニノの墓がある9世紀のジョージア正教会修道院。神聖な巡礼地です。"}}},
zh:{description:"希纳吉是卡赫季葡萄酒产区的山顶'爱之城'，以18世纪城墙围绕的鹅卵石街道、阿拉扎尼河谷全景和优质格鲁吉亚葡萄酒著称。",spots:{"시그나기 성벽":{name:"希纳吉城墙",desc:"拥有28座塔楼的18世纪城墙环绕山顶小城，葡萄园与阿拉扎尼河谷延伸至高加索山脉的全景令人叹为观止。"},"보드베 수녀원":{name:"博德贝修道院",desc:"供奉将基督教传入格鲁吉亚的圣尼诺之墓的9世纪东正教修道院，是重要的圣地。"}}}
},

// ── Taiwan new cities ──
"가오슝":{
en:{description:"Kaohsiung is Taiwan's second-largest city and main port, known for the iconic Dragon and Tiger Pagodas, vibrant Love River Harbor, and some of Taiwan's best seafood.",spots:{"용호탑":{name:"Dragon and Tiger Pagodas",desc:"Seven-story dragon and tiger towers rising from Lotus Pond. Enter through the dragon's mouth and exit through the tiger's for good fortune — a beloved local tradition."},"러브하버":{name:"Love River Harbor",desc:"Kaohsiung's romantic waterfront district with beautiful night views, lined with cafés and restaurants."},"치진섬":{name:"Cijin Island",desc:"A small island a 10-minute ferry ride away, famous for its seafood street and relaxed cycling paths along the coast."}}},
ja:{description:"高雄は台湾第2の都市、主要港湾都市で、象徴的な龍虎塔、活気あるラブリバーハーバー、台湾最高の海鮮料理で知られています。",spots:{"용호탑":{name:"龍虎塔",desc:"蓮池潭に立つ7層の龍塔と虎塔。龍の口から入り虎の口から出ると幸運が訪れるという地元の言い伝えがあります。"},"러브하버":{name:"愛河ハーバー",desc:"美しい夜景とカフェ・レストランが並ぶ高雄の浪漫的なウォーターフロント地区。"},"치진섬":{name:"旗津島",desc:"フェリーで10分の小さな島。海産物通りとのんびりとした海岸サイクリングコースが有名です。"}}},
zh:{description:"高雄是台湾第二大城市和主要港口，以标志性的龙虎塔、活力四射的爱河港区和台湾最棒的海鲜著称。",spots:{"용호탑":{name:"龙虎塔",desc:"耸立于莲池潭的七层龙塔与虎塔。从龙口入、虎口出据说可带来好运，是深受当地人喜爱的传统。"},"러브하버":{name:"爱河港区",desc:"高雄浪漫的滨水区，夜景迷人，两岸咖啡馆和餐厅林立。"},"치진섬":{name:"旗津岛",desc:"乘渡轮10分钟即达的小岛，以海鲜街和悠闲的海岸自行车道著称。"}}}
},
"타이난":{
en:{description:"Tainan is Taiwan's oldest city, called 'the Kyoto of Taiwan.' With over 300 temples, colonial-era forts, and outstanding local cuisine, it's the cultural and culinary soul of the island.",spots:{"안핑 고성":{name:"Fort Zeelandia (Anping)",desc:"Taiwan's first fort, built by the Dutch East India Company in the 17th century. Its red brick walls and tropical trees make for a stunning historical setting."},"적감루":{name:"Chihkan Tower",desc:"Built on a Dutch-era fort in the 17th century, this Chinese-style complex is one of Tainan's most recognized landmarks."}}},
ja:{description:"台南は台湾最古の都市で「台湾の京都」と呼ばれています。300以上の寺院、植民地時代の砦、そして素晴らしいローカルグルメが島の文化と食の魂を体現しています。",spots:{"안핑 고성":{name:"安平古堡（ゼーランジア城）",desc:"17世紀にオランダ東インド会社が建てた台湾最初の要塞。赤レンガの壁と熱帯樹木が歴史的な情景を織りなします。"},"적감루":{name:"赤崁楼",desc:"17世紀のオランダ時代の砦の上に建てられた中国様式の建物群。台南で最も有名なランドマークの一つです。"}}},
zh:{description:"台南是台湾最古老的城市，被称为'台湾的京都'。拥有300多座寺庙、殖民时代的堡垒和出色的本地美食，是全岛的文化与美食之魂。",spots:{"안핑 고성":{name:"安平古堡（热兰遮城）",desc:"17世纪荷兰东印度公司建造的台湾第一座堡垒，红砖城墙与热带树木相映成趣，历史氛围浓郁。"},"적감루":{name:"赤崁楼",desc:"建于17世纪荷兰时代堡垒之上的中式建筑群，是台南最具代表性的地标之一。"}}}
},
"타이중":{
en:{description:"Taichung is a vibrant cultural city in central Taiwan, home to the whimsical Rainbow Village, the creative Fengjia Night Market, and world-class museums.",spots:{"레인보우 빌리지":{name:"Rainbow Village",desc:"A colorful mural village saved from demolition by one elderly painter. Now a beloved Instagram landmark packed with quirky, vivid artwork."},"펑자 야시장":{name:"Fengjia Night Market",desc:"One of Taiwan's largest night markets and the birthplace of many creative street food innovations beloved island-wide."}}},
ja:{description:"台中は台湾中部の活気ある文化都市で、ユニークなレインボービレッジ、創造的な逢甲夜市、世界水準の博物館があります。",spots:{"레인보우 빌리지":{name:"彩虹眷村",desc:"一人の老画家が取り壊しから救った色彩豊かな壁画の村。ユニークで鮮やかなアートが詰まった人気のインスタスポット。"},"펑자 야시장":{name:"逢甲夜市",desc:"台湾最大の夜市の一つで、島全体で愛される多くの創造的な屋台グルメの発祥地。"}}},
zh:{description:"台中是台湾中部充满活力的文化城市，拥有奇趣彩虹眷村、创意逢甲夜市和世界级博物馆。",spots:{"레인보우 빌리지":{name:"彩虹眷村",desc:"由一位老画家独力拯救免遭拆除的彩色壁画村，如今是深受喜爱的网红打卡圣地，处处是奇趣鲜艳的艺术作品。"},"펑자 야시장":{name:"逢甲夜市",desc:"台湾最大的夜市之一，也是许多深受全岛喜爱的创意街头美食的发源地。"}}}
},
"화롄":{
en:{description:"Hualien is the gateway to Taiwan's dramatic east coast, where the Pacific Ocean meets the Central Mountain Range. It's the base for exploring the world-famous Taroko Gorge.",spots:{"칠성담 해변":{name:"Qixingtan Beach",desc:"A striking beach of black pebbles with a breathtaking backdrop of the Central Mountain Range on one side and the Pacific Ocean on the other."},"화롄 야시장":{name:"Hualien Night Market",desc:"A lively night market blending indigenous Amis flavors with classic Taiwanese street food — a great introduction to local culture."}}},
ja:{description:"花蓮は台湾の劇的な東海岸への玄関口で、太平洋と中央山脈が出会う場所。世界的に有名な太魯閣渓谷探検の拠点です。",spots:{"칠성담 해변":{name:"七星潭海岸",desc:"黒い砂利の印象的なビーチ。片側に中央山脈、もう片側に太平洋が広がる息を呑む景観が楽しめます。"},"화롄 야시장":{name:"花蓮夜市",desc:"アミ族の先住民料理と台湾の定番屋台グルメが融合した活気ある夜市。地元文化の入口としても最適。"}}},
zh:{description:"花莲是台湾壮丽东海岸的门户，太平洋与中央山脉在此交汇，是探索举世闻名的太鲁阁峡谷的基地。",spots:{"칠성담 해변":{name:"七星潭海岸",desc:"由黑色卵石铺就的壮丽海岸，一侧是中央山脉，另一侧是太平洋，景色令人屏息。"},"화롄 야시장":{name:"花莲夜市",desc:"融合阿美族原住民风味与经典台湾街头美食的热闹夜市，体验当地文化的绝佳窗口。"}}}
},
"타로코":{
en:{description:"Taroko National Park is one of Taiwan's most spectacular natural wonders, featuring a vast marble gorge carved by the Liwu River, with towering cliffs, waterfalls, and alpine scenery.",spots:{"타로코 협곡":{name:"Taroko Gorge",desc:"A 19km marble gorge with sheer white cliffs plunging into a turquoise river. One of Asia's most breathtaking natural landscapes."},"청수단애":{name:"Qingshui Cliffs",desc:"Dramatic 1,000m cliffs dropping straight into the Pacific Ocean. Considered one of the world's top ten scenic coastal cliffs."}}},
ja:{description:"太魯閣国立公園は台湾で最も壮大な自然の奇跡の一つ。立久喜渓が刻む巨大な大理石の渓谷、聳え立つ断崖、滝、高山の絶景が広がります。",spots:{"타로코 협곡":{name:"太魯閣渓谷",desc:"清流に迫る垂直の白い断崖が続く19kmの大理石渓谷。アジア屈指の息を飲む自然景観です。"},"청수단애":{name:"清水断崖",desc:"太平洋に向かって1,000mの絶壁が落ちる壮観な海岸断崖。世界10大絶景海岸の一つに数えられます。"}}},
zh:{description:"太鲁阁国家公园是台湾最壮观的自然奇观之一，立雾溪开凿出的巨大大理石峡谷、峭壁、瀑布和高山景色令人叹为观止。",spots:{"타로코 협곡":{name:"太鲁阁峡谷",desc:"绵延19公里的大理石峡谷，笔直的白色峭壁直逼翡翠色河流，是亚洲最令人屏息的自然景观之一。"},"청수단애":{name:"清水断崖",desc:"1000米峭壁直坠太平洋的壮观海岸，被誉为世界十大海岸绝景之一。"}}}
},

// ── US new cities ──
"덴버":{
en:{description:"Denver, the 'Mile High City,' sits at 1,600m and serves as the gateway to the Rocky Mountains. It blends outdoor adventure with a thriving arts, food, and craft beer culture.",spots:{"록키 마운틴 국립공원":{name:"Rocky Mountain National Park",desc:"72 peaks over 4,000m within one national park. Trail Ridge Road is one of the world's highest paved drives, offering sweeping alpine vistas."},"16번가 몰":{name:"16th Street Mall",desc:"Denver's pedestrian-only main street, buzzing with restaurants, shops, and live entertainment from morning to night."},"덴버 미술관":{name:"Denver Art Museum",desc:"A striking Daniel Libeskind-designed building housing an outstanding collection of Native American art and Western American masters."}}},
ja:{description:"デンバーは標高1,600mの'マイルハイシティ'。ロッキー山脈の玄関口として、アウトドアの冒険と活気あるアート・グルメ・クラフトビール文化を融合しています。",spots:{"록키 마운틴 국립공원":{name:"ロッキーマウンテン国立公園",desc:"72の4,000m超の峰を擁する国立公園。トレイルリッジロードは世界で最も高い舗装道路の一つで、壮大な高山の展望が楽しめます。"},"16번가 몰":{name:"16番街モール",desc:"朝から夜までレストラン、ショップ、ライブエンタメで賑わうデンバーの歩行者専用メインストリート。"},"덴버 미술관":{name:"デンバー美術館",desc:"ダニエル・リベスキンド設計の印象的な建物に、アメリカ先住民の芸術と西部アメリカ絵画の優れたコレクションを収蔵。"}}},
zh:{description:"丹佛是海拔1600米的'一英里高城'，是落基山脉的门户，将户外探险与蓬勃的艺术、美食和精酿啤酒文化完美融合。",spots:{"록키 마운틴 국립공원":{name:"落基山国家公园",desc:"公园内72座超过4000米的山峰。山脊路是世界上海拔最高的铺装公路之一，提供壮阔的高山全景。"},"16번가 몰":{name:"第16街步行街",desc:"丹佛从早到晚充满餐厅、商店和现场表演的步行主街道。"},"덴버 미술관":{name:"丹佛艺术博物馆",desc:"由丹尼尔·里伯斯金设计的造型独特的博物馆，收藏有卓越的美国原住民艺术和西部美国画作。"}}}
},
"내슈빌":{
en:{description:"Nashville is the 'Music City,' world capital of country music. Beyond honky-tonk bars on Broadway, it's a city of incredible live music, hot chicken, and Southern hospitality.",spots:{"브로드웨이 혼키 통크 거리":{name:"Broadway Honky Tonk Row",desc:"Dozens of bars with live country music playing 24/7. This electric strip is the beating heart of Nashville's legendary music scene."},"컨트리 뮤직 명예의 전당":{name:"Country Music Hall of Fame",desc:"The world's largest popular music museum, celebrating the legends of country music with instruments, costumes, and personal memorabilia."},"그랜드 올 오프리":{name:"Grand Ole Opry",desc:"The world's longest-running live radio show since 1925, still performing weekly. An essential Nashville experience for any music lover."}}},
ja:{description:"ナッシュビルは'ミュージックシティ'、カントリーミュージックの世界首都。ブロードウェイのホンキートンクバーを超え、素晴らしいライブ音楽、ホットチキン、南部のおもてなしの街です。",spots:{"브로드웨이 혼키 통크 거리":{name:"ブロードウェイ・ホンキートンク通り",desc:"24時間ライブカントリーミュージックが流れる数十のバーが並ぶ電気的な通り。ナッシュビルの伝説的な音楽シーンの中心地。"},"컨트리 뮤직 명예의 전당":{name:"カントリーミュージック殿堂",desc:"楽器、衣装、個人の思い出の品でカントリーミュージックの伝説を称える世界最大のポピュラー音楽博物館。"},"그랜드 올 오프리":{name:"グランド・オール・オープリ",desc:"1925年から続く世界最長のライブラジオ番組で、毎週公演が行われます。音楽愛好家には必須のナッシュビル体験。"}}},
zh:{description:"纳什维尔是'音乐城'，乡村音乐的世界之都。除了百老汇的酒吧，这里还是令人惊叹的现场音乐、辣鸡和南方热情好客的城市。",spots:{"브로드웨이 혼키 통크 거리":{name:"百老汇乡村酒吧街",desc:"24小时现场乡村音乐不间断的数十家酒吧，是纳什维尔传奇音乐场景跳动的心脏。"},"컨트리 뮤직 명예의 전당":{name:"乡村音乐名人堂",desc:"世界最大的流行音乐博物馆，以乐器、服装和个人纪念品向乡村音乐传奇致敬。"},"그랜드 올 오프리":{name:"大奥普里",desc:"自1925年以来持续运营的世界最长现场广播节目，每周仍有演出，是音乐爱好者必访的纳什维尔圣地。"}}}
},
"포틀랜드":{
en:{description:"Portland is Oregon's largest city, celebrated for its indie bookshops, world-class coffee, creative food scene, and stunning access to the Columbia River Gorge and Mt. Hood.",spots:{"파월스 서점":{name:"Powell's Books",desc:"The world's largest independent bookstore, occupying an entire city block with rooms devoted to every genre — a genuine Portland landmark."},"컬럼비아 리버 협곡":{name:"Columbia River Gorge",desc:"A scenic 130km gorge on the Oregon-Washington border, home to dozens of waterfalls including the magnificent 189m Multnomah Falls."},"파이어니어 코트하우스 스퀘어":{name:"Pioneer Courthouse Square",desc:"Portland's beloved 'living room' — a central plaza hosting farmers markets, festivals, and an outdoor ice rink in winter."}}},
ja:{description:"ポートランドはオレゴン州最大の都市。独立系書店、世界クラスのコーヒー、創造的なフードシーン、そしてコロンビア川渓谷とマウントフッドへの素晴らしいアクセスで知られています。",spots:{"파월스 서점":{name:"パウエルズ・ブックス",desc:"1ブロック全体を占める世界最大の独立系書店。あらゆるジャンルの部屋があるポートランドの本物のランドマーク。"},"컬럼비아 리버 협곡":{name:"コロンビア川渓谷",desc:"オレゴン・ワシントン州境の景観豊かな130kmの渓谷。壮大な189mのマルトノマ滝を含む数十の滝があります。"},"파이어니어 코트하우스 스퀘어":{name:"パイオニア・コートハウス・スクエア",desc:"ポートランド市民に愛される'居間'。ファーマーズマーケット、フェスティバル、冬はアイスリンクが開かれる中央広場。"}}},
zh:{description:"波特兰是俄勒冈州最大城市，以独立书店、世界级咖啡、创意美食场景以及通往哥伦比亚河峡谷和胡德山的绝佳通道而著称。",spots:{"파월스 서점":{name:"鲍威尔书店",desc:"占据整个街区的世界最大独立书店，每种类型各有专属书房，是波特兰真正的地标。"},"컬럼비아 리버 협곡":{name:"哥伦比亚河峡谷",desc:"俄勒冈与华盛顿州界上景色壮丽的130公里峡谷，拥有数十处瀑布，包括壮观的189米马特诺玛瀑布。"},"파이어니어 코트하우스 스퀘어":{name:"先锋法院广场",desc:"波特兰深受市民喜爱的'客厅'——举办农贸市场、节庆活动和冬季溜冰场的中央广场。"}}}
},
"피닉스":{
en:{description:"Phoenix is a sun-soaked desert metropolis in the Sonoran Desert, known for world-class golf, luxury spas, nearby Sedona red rock country, and stunning saguaro cactus landscapes.",spots:{"사구아로 국립공원":{name:"Saguaro National Park",desc:"A park of towering saguaro cacti — the iconic symbol of the American Southwest. Sunsets silhouetting the giant cacti are unforgettable."},"세도나":{name:"Sedona",desc:"A mystical red rock landscape and New Age spiritual destination 2 hours from Phoenix, famous for dramatic buttes, vortex sites, and world-class spas."},"데저트 보태니컬 가든":{name:"Desert Botanical Garden",desc:"One of the world's premier desert plant collections, with over 50,000 plants from the Sonoran Desert and beyond."}}},
ja:{description:"フェニックスはソノラ砂漠の日射しあふれる砂漠の大都市。世界クラスのゴルフ、ラグジュアリースパ、近郊のセドナの赤岩地帯、そして印象的なサグアロサボテンの景観で知られています。",spots:{"사구아로 국립공원":{name:"サグアロ国立公園",desc:"アメリカ南西部の象徴的なサグアロサボテンがそびえる公園。夕日に浮かぶ巨大なサボテンのシルエットは忘れられません。"},"세도나":{name:"セドナ",desc:"フェニックスから2時間の神秘的な赤岩の景観とニューエイジの聖地。劇的な岩山、気エネルギースポット、世界クラスのスパで有名。"},"데저트 보태니컬 가든":{name:"デザート・ボタニカル・ガーデン",desc:"ソノラ砂漠をはじめとする5万種以上の植物を展示する世界屈指の砂漠植物園。"}}},
zh:{description:"凤凰城是索诺兰沙漠中阳光充沛的沙漠大都市，以世界级高尔夫球场、奢华水疗、塞多纳红岩景观和壮观的巨人柱仙人掌景色著称。",spots:{"사구아로 국립공원":{name:"巨人柱国家公园",desc:"美国西南部标志性巨人柱仙人掌的公园，日落时分仙人掌的剪影景色令人难忘。"},"세도나":{name:"塞多纳",desc:"距凤凰城2小时的神秘红岩景观与新纪元灵性圣地，以壮观岩台、能量漩涡和世界级水疗著称。"},"데저트 보태니컬 가든":{name:"沙漠植物园",desc:"收藏5万余株索诺兰沙漠植物的世界顶级沙漠植物园。"}}}
},
"올랜도":{
en:{description:"Orlando is the world's theme park capital, home to Walt Disney World, Universal Orlando, and SeaWorld. Beyond the parks, NASA's Kennedy Space Center adds another dimension of wonder.",spots:{"월트 디즈니 월드":{name:"Walt Disney World",desc:"The world's most visited theme park resort with four full parks — Magic Kingdom, EPCOT, Hollywood Studios, and Animal Kingdom — plus two water parks."},"유니버설 올랜도":{name:"Universal Orlando",desc:"Home to The Wizarding World of Harry Potter and Super Nintendo World. Epic rides and immersive themed lands make it a must-visit."},"케네디 우주센터":{name:"Kennedy Space Center",desc:"NASA's historic launch facility. Visitors can see real rockets up close, learn about space history, and sometimes witness actual launches."}}},
ja:{description:"オーランドは世界のテーマパークの首都。ウォルト・ディズニー・ワールド、ユニバーサル・オーランド、シーワールドが集結。NASAのケネディ宇宙センターも別次元の驚きを加えます。",spots:{"월트 디즈니 월드":{name:"ウォルト・ディズニー・ワールド",desc:"マジックキングダム、エプコット、ハリウッドスタジオ、アニマルキングダムの4パークと2つのウォーターパークを持つ世界最多来場者のリゾート。"},"유니버설 올랜도":{name:"ユニバーサル・オーランド",desc:"ハリー・ポッターの魔法界とスーパー・ニンテンドー・ワールドがあるリゾート。壮大なライドと没入型テーマランドは必訪です。"},"케네디 우주센터":{name:"ケネディ宇宙センター",desc:"NASAの歴史的な発射施設。実物のロケットを間近で見学し、宇宙の歴史を学び、時には実際の打上げを目撃できます。"}}},
zh:{description:"奥兰多是世界主题公园之都，拥有华特迪士尼世界、环球奥兰多和海洋世界。除公园外，NASA肯尼迪航天中心更增添了另一维度的震撼体验。",spots:{"월트 디즈니 월드":{name:"华特迪士尼世界",desc:"全球最多游客的主题乐园度假区，拥有魔法王国、未来世界、好莱坞影城和动物王国四大园区及两个水上乐园。"},"유니버설 올랜도":{name:"环球奥兰多",desc:"拥有哈利波特魔法世界和超级任天堂世界，震撼的游乐设施和沉浸式主题园区令人必访。"},"케네디 우주센터":{name:"肯尼迪航天中心",desc:"NASA的历史性发射场，游客可近距离观看真实火箭、了解航天历史，有时还能亲眼目睹真实发射。"}}}
},
"나이아가라폭포":{
en:{description:"Niagara Falls straddles the US-Canada border and is one of the world's great natural wonders — 2.4 million liters of water per second plunge over the horseshoe-shaped falls in a thunderous spectacle.",spots:{"호스슈 폭포":{name:"Horseshoe Falls",desc:"The most powerful of the three Niagara falls, best viewed from the Canadian side. The Maid of the Mist boat tour brings you right into the misty heart of the falls."},"나이아가라 폭포 야경":{name:"Niagara Falls Illumination",desc:"Every evening the falls are dramatically lit with colorful lights. Views from the casino tower observation deck take in the entire horseshoe panorama."},"나이아가라 온 더 레이크":{name:"Niagara-on-the-Lake",desc:"A picturesque 19th-century town 20 minutes from the falls, famous for its acclaimed Shaw Theatre Festival and renowned wineries."}}},
ja:{description:"ナイアガラの滝は米カナダ国境にまたがる世界的な自然の奇観。毎秒240万リットルの水が馬蹄形の滝を轟音とともに流れ落ちます。",spots:{"호스슈 폭포":{name:"ホースシュー滝",desc:"3つのナイアガラの滝で最も豪快な滝で、カナダ側からの眺めが最高。霧の乙女号ボートツアーで滝のミストの中心に迫ります。"},"나이아가라 폭포 야경":{name:"ナイアガラの滝イルミネーション",desc:"毎晩カラフルなライトが滝を劇的に照らし出します。カジノタワーの展望台からは馬蹄形全体のパノラマが楽しめます。"},"나이아가라 온 더 레이크":{name:"ナイアガラ・オン・ザ・レイク",desc:"滝から20分のピクチャレスクな19世紀の町。著名なショー演劇祭とワイナリーで有名です。"}}},
zh:{description:"尼亚加拉瀑布横跨美加边界，是世界伟大的自然奇观之一——每秒240万升的水以雷霆之势倾泻而下，蔚为壮观。",spots:{"호스슈 폭포":{name:"马蹄瀑布",desc:"尼亚加拉三瀑中最为壮观的一个，从加拿大侧观赏效果最佳。'雾中少女'游船直抵飞瀑迷雾的中心地带。"},"나이아가라 폭포 야경":{name:"尼亚加拉瀑布夜间灯光秀",desc:"每晚五彩灯光将瀑布映照得分外壮丽，从赌场观景台可将整个马蹄形瀑布全景尽收眼底。"},"나이아가라 온 더 레이크":{name:"尼亚加拉湖上镇",desc:"距瀑布20分钟的如画19世纪小镇，以备受赞誉的萧伯纳戏剧节和知名酒庄著称。"}}}
}
}


// 전 세계 도시 사전 관광 데이터
const CITY_DATA = {
// ────────────────────────── 대한민국 ──────────────────────────
"서울": { description:"서울은 600년 조선왕조의 역사와 K-팝 문화, 첨단 기술이 공존하는 아시아 최고의 도시입니다. 고궁과 현대 빌딩이 어우러진 독특한 매력으로 매년 수천만 명의 여행자를 끌어들입니다.", spots:[
  {name:"경복궁", wikiTitle:"Gyeongbokgung", type:"역사", desc:"조선 5대 궁궐 중 가장 웅장하며 매시간 수문장 교대식이 열립니다. 근정전과 경회루는 조선 건축의 정수를 보여줍니다.", rating:4.8, openTime:"09:00~18:00", price:"성인 3,000원", website:"https://royal.khs.go.kr/ROYAL/contents/menuInfo-gbg.do?grpCode=gbg"},
  {name:"북촌 한옥마을", wikiTitle:"Bukchon Hanok Village", type:"문화", desc:"600년 된 전통 한옥이 즐비한 골목으로 조선시대 양반 생활을 엿볼 수 있습니다. 인왕산을 배경으로 한 풍경이 일품입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://bukchon.seoul.go.kr"},
  {name:"N서울타워", wikiTitle:"N Seoul Tower", type:"랜드마크", desc:"남산 정상에 솟아오른 타워로 서울 전역을 360도로 내려다볼 수 있습니다. 야경이 특히 아름다워 연인들의 필수 코스입니다.", rating:4.6, openTime:"10:00~23:00", price:"성인 21,000원", website:"https://www.nseoultower.co.kr"},
  {name:"광장시장", wikiTitle:"Gwangjang Market", type:"음식", desc:"1905년에 문을 연 서울 최초의 전통시장으로 빈대떡, 육회, 마약김밥이 유명합니다. 한국 전통 먹거리 문화의 살아있는 역사입니다.", rating:4.7, openTime:"09:00~23:00", price:"무료", website:"https://www.gwangjangmarket.co.kr"},
  {name:"창덕궁", wikiTitle:"Changdeokgung", type:"역사", desc:"비원(후원)이라 불리는 아름다운 비밀 정원이 있는 유네스코 세계문화유산 궁궐입니다. 계절마다 다른 풍경이 펼쳐집니다.", rating:4.8, openTime:"09:00~17:30", price:"성인 3,000원", website:"https://royal.khs.go.kr/ROYAL/contents/menuInfo-cdk.do?grpCode=cdk"},
]},
"부산": { description:"부산은 대한민국 제2의 도시로 아름다운 해변과 신선한 해산물, 독특한 문화가 어우러진 항구 도시입니다. 해운대 해변부터 감천문화마을까지 다채로운 매력이 넘칩니다.", spots:[
  {name:"해운대 해변", wikiTitle:"Haeundae Beach", type:"자연", desc:"대한민국 최고의 해수욕장으로 여름이면 수백만 명이 찾는 부산의 대표 관광지입니다. 해변을 따라 카페와 레스토랑이 즐비합니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://www.haeundae.go.kr"},
  {name:"감천문화마을", wikiTitle:"Gamcheon Culture Village", type:"문화", desc:"산비탈에 파스텔톤 집들이 계단식으로 늘어선 마을로 한국의 마추픽추라 불립니다. 곳곳에 예술 작품과 포토존이 숨어 있습니다.", rating:4.6, openTime:"09:00~18:00", price:"무료", website:"https://www.gamcheon.or.kr"},
  {name:"자갈치시장", wikiTitle:"Jagalchi Market", type:"음식", desc:"대한민국 최대의 수산시장으로 싱싱한 회와 해산물을 현장에서 맛볼 수 있습니다. 2층 식당에서 바다를 바라보며 식사할 수 있습니다.", rating:4.5, openTime:"05:00~22:00", price:"무료", website:"https://www.jagalchimarket.or.kr"},
  {name:"태종대", wikiTitle:"Taejongdae", type:"자연", desc:"기암절벽과 등대가 어우러진 부산 남쪽 끝자락의 절경입니다. 맑은 날에는 일본 쓰시마 섬까지 보일 정도로 전망이 뛰어납니다.", rating:4.6, openTime:"04:00~24:00", price:"무료", website:"https://www.taejongdae.or.kr"},
  {name:"광안대교", wikiTitle:"Gwangan Bridge", type:"랜드마크", desc:"부산의 야경을 대표하는 다이아몬드 브릿지로 광안리 해변에서 바라보는 야경이 장관입니다. 매년 불꽃축제가 열립니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Gwangan_Bridge"},
]},
"제주": { description:"제주도는 유네스코 세계자연유산에 등재된 화산섬으로 독특한 자연경관과 문화를 자랑합니다. 한라산, 성산일출봉, 용머리해안 등 천혜의 자연이 펼쳐집니다.", spots:[
  {name:"성산일출봉", wikiTitle:"Seongsan Ilchulbong", type:"자연", desc:"10만 년 전 해저 화산 폭발로 만들어진 거대한 분화구로 유네스코 세계자연유산입니다. 일출 명소로 새벽부터 많은 등산객이 찾습니다.", rating:4.8, openTime:"일출 1시간 전~20:00", price:"성인 5,000원", website:"https://www.visitjeju.net"},
  {name:"한라산", wikiTitle:"Hallasan", type:"자연", desc:"해발 1,950m 대한민국 최고봉으로 사계절 다른 풍경을 선사합니다. 백록담까지 오르는 트레킹 코스는 도전적이지만 보람찬 경험입니다.", rating:4.9, openTime:"05:00~12:00(입산)", price:"무료", website:"https://www.hallasan.go.kr"},
  {name:"만장굴", wikiTitle:"Manjanggul", type:"자연", desc:"세계 최장급 용암동굴로 총 길이 약 7.4km에 달합니다. 내부의 용암 석주와 종유석이 신비로운 지하 세계를 연출합니다.", rating:4.6, openTime:"09:00~18:00", price:"성인 4,000원", website:"https://www.visitjeju.net"},
  {name:"협재해변", wikiTitle:"Hyeopjae Beach", type:"자연", desc:"에메랄드빛 투명한 바다와 새하얀 모래사장이 어우러진 제주 서쪽의 대표 해변입니다. 비양도를 배경으로 한 석양이 특히 아름답습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://www.visitjeju.net"},
  {name:"제주 동문시장", wikiTitle:"Dongmun Market", type:"음식", desc:"제주의 대표 전통시장으로 흑돼지, 갈치조림, 감귤 등 제주 특산물을 만날 수 있습니다. 야시장도 운영되어 밤에도 활기찹니다.", rating:4.5, openTime:"08:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Dongmun_Market"},
]},
"경주": { description:"경주는 천년 신라왕국의 수도로 도시 전체가 노천 박물관이라 불립니다. 불국사, 석굴암, 첨성대 등 수많은 유네스코 유산이 도시 곳곳에 자리하고 있습니다.", spots:[
  {name:"불국사", wikiTitle:"Bulguksa", type:"역사", desc:"신라 경덕왕 때 창건된 유네스코 세계문화유산 사찰입니다. 다보탑과 석가탑, 청운교·백운교 등 신라 불교 예술의 정수를 만날 수 있습니다.", rating:4.8, openTime:"07:00~18:00", price:"성인 6,000원", website:"https://www.bulguksa.or.kr"},
  {name:"석굴암", wikiTitle:"Seokguram", type:"역사", desc:"토함산 정상 부근에 자리한 인공 석굴 사원으로 본존불상의 미소가 유명합니다. 일출 시 동해 바다와 함께 보는 풍경이 장관입니다.", rating:4.7, openTime:"06:30~18:00", price:"성인 6,000원", website:"https://www.sukgulam.org"},
  {name:"첨성대", wikiTitle:"Cheomseongdae", type:"역사", desc:"선덕여왕 때 건립된 동양 최고(最古)의 천문관측대입니다. 362개의 돌로 쌓아올린 우아한 곡선이 신라인의 과학 수준을 보여줍니다.", rating:4.5, openTime:"09:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Cheomseongdae"},
  {name:"안압지(동궁과 월지)", wikiTitle:"Donggung Palace and Wolji Pond", type:"역사", desc:"신라 왕궁의 별궁과 연못으로 야경이 특히 아름다운 곳입니다. 연못에 비친 건물의 반영이 환상적인 풍경을 연출합니다.", rating:4.7, openTime:"09:00~22:00", price:"성인 3,000원", website:"https://en.wikipedia.org/wiki/Anapji"},
]},
"인천": { description:"인천은 대한민국의 관문 도시로 차이나타운, 송도국제도시, 아름다운 섬들이 어우러진 매력적인 항구 도시입니다. 개항 역사와 현대적 도시 개발이 공존합니다.", spots:[
  {name:"차이나타운", wikiTitle:"Incheon Chinatown", type:"문화", desc:"한국 유일의 차이나타운으로 1883년 개항 이후 형성된 역사적 거리입니다. 짜장면 박물관과 다양한 중화 요리를 즐길 수 있습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Incheon_Chinatown"},
  {name:"송도 센트럴파크", wikiTitle:"Songdo Central Park", type:"도시", desc:"바닷물을 끌어와 만든 독특한 해수 공원으로 수상택시와 카약을 즐길 수 있습니다. 첨단 도시 송도의 랜드마크입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Songdo_International_Business_District"},
  {name:"월미도", wikiTitle:"Wolmi_Island", type:"자연", desc:"인천 앞바다의 작은 섬으로 놀이공원과 해산물 먹거리가 가득한 관광지입니다. 디스코 팡팡과 바이킹은 필수 체험입니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Wolmido"},
  {name:"인천상륙작전기념관", wikiTitle:"Incheon Landing Operation Memorial Hall", type:"역사", desc:"한국전쟁 당시 맥아더 장군의 인천상륙작전을 기념하는 기념관입니다. 전쟁 역사와 평화의 소중함을 되새기는 공간입니다.", rating:4.3, openTime:"09:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Battle_of_Inchon"},
]},
"대구": { description:"대구는 분지 지형의 뜨거운 도시로 화려한 약령시 역사와 근대 문화골목, 맛있는 음식으로 유명합니다. 팔공산과 앞산 등 주변 자연경관도 뛰어납니다.", spots:[
  {name:"동화사", wikiTitle:"Donghwasa", type:"역사", desc:"팔공산 자락에 자리한 1,500년 역사의 고찰로 통일약사여래대불이 유명합니다. 사계절 아름다운 풍경이 펼쳐지는 명찰입니다.", rating:4.5, openTime:"08:30~18:00", price:"성인 3,000원", website:"https://www.donghwasa.net"},
  {name:"근대문화골목", wikiTitle:"Daegu", type:"문화", desc:"일제강점기부터 한국전쟁까지의 근대 역사를 걸으며 체험할 수 있는 골목입니다. 이상화 고택과 계산성당이 대표 명소입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Daegu"},
  {name:"서문시장", wikiTitle:"Seomun Market", type:"음식", desc:"조선시대부터 이어져온 대구의 대표 전통시장입니다. 납작만두와 칼국수, 야시장의 다양한 먹거리가 유명합니다.", rating:4.5, openTime:"09:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Seomun_Market"},
  {name:"팔공산 케이블카", wikiTitle:"Palgongsan", type:"자연", desc:"해발 1,193m 팔공산을 케이블카로 편하게 오를 수 있습니다. 정상에서 바라보는 대구 시내 전경이 장관입니다.", rating:4.4, openTime:"09:00~18:00", price:"성인 12,000원", website:"https://en.wikipedia.org/wiki/Palgongsan"},
]},
"전주": { description:"전주는 한국의 맛과 멋의 도시로 전주한옥마을과 비빔밥으로 세계적으로 유명합니다. 유네스코 음식창의도시로 선정된 미식의 도시입니다.", spots:[
  {name:"전주한옥마을", wikiTitle:"Jeonju Hanok Village", type:"문화", desc:"700여 채의 한옥이 모여 있는 대한민국 최대 한옥마을입니다. 한복 체험, 전통 공예, 한지 만들기 등 다양한 체험이 가능합니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://hanok.jeonju.go.kr"},
  {name:"경기전", wikiTitle:"Gyeonggijeon", type:"역사", desc:"조선 태조 이성계의 어진(초상화)을 모신 사당으로 전주한옥마을의 중심입니다. 대나무 숲길이 특히 아름다워 인기 포토존입니다.", rating:4.6, openTime:"09:00~18:00", price:"성인 3,000원", website:"https://en.wikipedia.org/wiki/Gyeonggijeon"},
  {name:"전주 남부시장", wikiTitle:"Jeonju", type:"음식", desc:"전주의 대표 전통시장으로 청년몰이 유명합니다. 전주비빔밥, 콩나물국밥, 피순대 등 전주의 맛을 집약한 곳입니다.", rating:4.5, openTime:"09:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Jeonju"},
  {name:"오목대", wikiTitle:"Omokdae", type:"역사", desc:"한옥마을을 한눈에 내려다볼 수 있는 전망대로 이성계가 왜구를 물리친 후 축하연을 벌인 곳입니다. 석양 때 방문하면 최고입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Jeonju"},
]},
"강릉": { description:"강릉은 동해안의 보석 같은 도시로 아름다운 해변과 커피 문화, 신사임당과 율곡의 유적으로 유명합니다. 2018 평창 동계올림픽의 주요 경기가 열린 도시이기도 합니다.", spots:[
  {name:"경포대", wikiTitle:"Gyeongpodae", type:"자연", desc:"강릉의 대표 해변으로 호수와 바다가 함께 어우러진 절경입니다. 봄에는 벚꽃, 여름에는 해수욕으로 사시사철 인기입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Gyeongpo_Beach"},
  {name:"오죽헌", wikiTitle:"Ojukheon", type:"역사", desc:"율곡 이이와 신사임당이 태어난 곳으로 대한민국 보물 제165호입니다. 5천원권과 5만원권 지폐 속 인물들의 생가입니다.", rating:4.5, openTime:"09:00~18:00", price:"성인 3,000원", website:"https://en.wikipedia.org/wiki/Ojukheon"},
  {name:"안목 커피거리", wikiTitle:"Gangneung", type:"문화", desc:"강릉은 한국의 커피 수도로 불리며 안목해변을 따라 수십 개의 개성 넘치는 카페가 줄지어 있습니다. 바다를 보며 커피를 즐기는 최고의 장소입니다.", rating:4.5, openTime:"10:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Gangneung"},
  {name:"정동진", wikiTitle:"Jeongdongjin", type:"자연", desc:"해돋이 명소로 세계에서 바다에 가장 가까운 기차역이 있습니다. 모래시계 공원과 함께 일출을 감상하는 것이 인생 경험입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Jeongdongjin"},
]},
"수원": { description:"수원은 정조대왕의 효심이 담긴 화성과 최첨단 삼성 캠퍼스가 공존하는 역사·기술 도시입니다. 유네스코 세계문화유산 수원화성은 한국 성곽 건축의 백미입니다.", spots:[
  {name:"수원화성", wikiTitle:"Hwaseong Fortress", type:"역사", desc:"정조대왕이 아버지 사도세자를 위해 축조한 유네스코 세계문화유산 성곽입니다. 5.7km 성곽길을 따라 걸으며 48개의 시설물을 감상할 수 있습니다.", rating:4.8, openTime:"09:00~18:00", price:"성인 1,000원", website:"https://www.swcf.or.kr"},
  {name:"화성행궁", wikiTitle:"Hwaseong Fortress", type:"역사", desc:"정조대왕이 수원 행차 시 머물던 임시 궁궐입니다. 국내 최대 규모의 행궁으로 화려한 건축미를 자랑합니다.", rating:4.6, openTime:"09:00~18:00", price:"성인 1,500원", website:"https://en.wikipedia.org/wiki/Hwaseong_Haenggung"},
  {name:"수원 통닭거리", wikiTitle:"Korean fried chicken", type:"음식", desc:"수원의 명물 왕갈비와 통닭을 맛볼 수 있는 먹자골목입니다. 40년 전통의 치킨 맛집들이 즐비합니다.", rating:4.4, openTime:"11:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Suwon"},
  {name:"광교호수공원", wikiTitle:"Suwon", type:"자연", desc:"수원 광교 신도시에 조성된 대규모 호수공원으로 산책과 자전거 라이딩에 완벽합니다. 호수 위 커브 다리는 포토 스팟입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Suwon"},
]},
"광주": { description:"광주는 대한민국 민주주의의 성지이자 예술과 문화의 도시입니다. 광주 비엔날레와 무등산, 풍부한 미식 문화가 여행자를 매료시킵니다.", spots:[
  {name:"무등산", wikiTitle:"Mudeungsan", type:"자연", desc:"해발 1,187m의 광주 진산으로 국립공원으로 지정되어 있습니다. 주상절리대인 서석대와 입석대의 풍경이 장관입니다.", rating:4.6, openTime:"일출~일몰", price:"무료", website:"https://en.wikipedia.org/wiki/Mudeungsan"},
  {name:"5·18 민주화운동기록관", wikiTitle:"May 18th National Cemetery", type:"역사", desc:"1980년 광주 민주화운동의 역사를 기록한 기념관입니다. 대한민국 민주주의 발전의 역사를 생생하게 체험할 수 있습니다.", rating:4.7, openTime:"09:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Gwangju_Uprising"},
  {name:"양림동 펭귄마을", wikiTitle:"Gwangju", type:"문화", desc:"폐가와 골목을 예술 작품으로 변신시킨 마을 재생 프로젝트입니다. 빈티지한 분위기 속에 카페와 갤러리가 어우러져 있습니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Gwangju"},
  {name:"광주 송정역시장", wikiTitle:"Gwangju", type:"음식", desc:"떡갈비, 오리탕 등 광주의 대표 먹거리를 만날 수 있는 전통시장입니다. KTX 송정역 바로 옆이라 접근성이 좋습니다.", rating:4.4, openTime:"09:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Gwangju"},
]},

// ────────────────────────── 일본 ──────────────────────────
"도쿄": { description:"도쿄는 전통과 초현대가 완벽하게 공존하는 세계 최대의 메트로폴리스입니다. 고층 빌딩 사이 고즈넉한 신사, 최첨단 기술과 전통 장인 문화가 독특한 조화를 이룹니다.", spots:[
  {name:"센소지", wikiTitle:"Sensō-ji", type:"역사", desc:"628년에 창건된 도쿄에서 가장 오래된 사찰로 아사쿠사의 상징입니다. 거대한 카미나리몬(뇌문)과 나카미세 상점가가 유명합니다.", rating:4.7, openTime:"06:00~17:00", price:"무료", website:"https://www.senso-ji.jp"},
  {name:"시부야 스크램블 교차로", wikiTitle:"Shibuya Crossing", type:"도시", desc:"한 번에 3,000명이 동시에 건너는 세계에서 가장 유명한 교차로입니다. 시부야의 대형 스크린과 네온사인이 도쿄의 활기를 상징합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Shibuya_Crossing"},
  {name:"메이지 신궁", wikiTitle:"Meiji Shrine", type:"역사", desc:"도심 한가운데 울창한 숲에 둘러싸인 신사로 메이지 천황을 모시고 있습니다. 70만㎡의 숲은 도시의 허파 역할을 합니다.", rating:4.6, openTime:"일출~일몰", price:"무료", website:"https://www.meijijingu.or.jp"},
  {name:"도쿄 스카이트리", wikiTitle:"Tokyo Skytree", type:"랜드마크", desc:"높이 634m의 세계에서 가장 높은 전파탑으로 전망대에서 관동 평야 전체를 조망할 수 있습니다. 맑은 날에는 후지산도 보입니다.", rating:4.5, openTime:"10:00~21:00", price:"성인 2,100엔~", website:"https://www.tokyo-skytree.jp"},
  {name:"츠키지 장외시장", wikiTitle:"Tsukiji fish market", type:"음식", desc:"세계 최대 수산시장이었던 츠키지의 장외시장으로 신선한 초밥과 해산물을 즐길 수 있습니다. 이른 아침부터 활기가 넘칩니다.", rating:4.6, openTime:"05:00~14:00", price:"무료", website:"https://www.tsukiji.or.jp"},
]},
"교토": { description:"교토는 794년부터 1868년까지 일본의 수도였던 천년 고도로 2,000개 이상의 신사와 사찰이 있습니다. 게이샤 문화, 전통 다도, 아름다운 정원이 일본의 정수를 보여줍니다.", spots:[
  {name:"금각사(킨카쿠지)", wikiTitle:"Kinkaku-ji", type:"역사", desc:"순금으로 덮인 3층 누각이 거울못에 반사되는 모습이 장관인 세계문화유산입니다. 일본을 대표하는 아이콘적 건축물입니다.", rating:4.8, openTime:"09:00~17:00", price:"성인 500엔", website:"https://www.shokoku-ji.jp/kinkakuji/"},
  {name:"후시미이나리 대사", wikiTitle:"Fushimi Inari-taisha", type:"역사", desc:"1만 개 이상의 주홍색 도리이(신사 문)가 산을 따라 끝없이 이어지는 장관을 연출합니다. 일본에서 가장 인기 있는 신사입니다.", rating:4.9, openTime:"24시간", price:"무료", website:"https://inari.jp"},
  {name:"아라시야마 대나무 숲", wikiTitle:"Arashiyama", type:"자연", desc:"하늘 높이 솟은 대나무가 빽빽이 들어찬 환상적인 산책로입니다. 바람에 흔들리는 대나무 소리가 세상의 소음을 잊게 합니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://www.kyoto-arashiyama.jp"},
  {name:"기요미즈데라", wikiTitle:"Kiyomizu-dera", type:"역사", desc:"높이 13m의 나무 무대에서 교토 시내를 한눈에 바라볼 수 있는 세계문화유산 사찰입니다. 벚꽃과 단풍 시즌이 특히 아름답습니다.", rating:4.8, openTime:"06:00~18:00", price:"성인 400엔", website:"https://www.kiyomizudera.or.jp"},
  {name:"니시키 시장", wikiTitle:"Nishiki Market", type:"음식", desc:"400년 역사의 교토의 부엌으로 불리는 전통 식재료 시장입니다. 교토 특산물인 유바(두부 껍질), 절임 반찬, 화과자를 맛볼 수 있습니다.", rating:4.5, openTime:"09:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Nishiki_Market"},
]},
"오사카": { description:"오사카는 일본의 미식 수도이자 유머와 활기가 넘치는 상인의 도시입니다. 다코야키, 오코노미야키 등 먹을거리가 넘치며 도톤보리의 화려한 네온사인이 상징적입니다.", spots:[
  {name:"오사카성", wikiTitle:"Osaka Castle", type:"역사", desc:"도요토미 히데요시가 1583년에 축조한 일본의 대표적인 성곽입니다. 봄에는 벚꽃으로 둘러싸인 성의 풍경이 장관을 이룹니다.", rating:4.6, openTime:"09:00~17:00", price:"성인 600엔", website:"https://www.osakacastle.net"},
  {name:"도톤보리", wikiTitle:"Dōtonbori", type:"도시", desc:"글리코 간판으로 유명한 오사카 최고의 번화가로 네온사인과 먹거리가 가득합니다. 오사카의 식도락 문화를 대표하는 거리입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://www.dotonbori.or.jp"},
  {name:"구로몬 시장", wikiTitle:"Kuromon Market", type:"음식", desc:"오사카의 부엌으로 불리는 170년 역사의 전통시장입니다. 신선한 해산물 꼬치와 참치 초밥, 와규를 저렴하게 맛볼 수 있습니다.", rating:4.5, openTime:"09:00~18:00", price:"무료", website:"https://www.kuromon.com"},
  {name:"유니버설 스튜디오 재팬", wikiTitle:"Universal Studios Japan", type:"랜드마크", desc:"헐리우드 영화를 테마로 한 대형 테마파크로 해리포터와 슈퍼마리오 존이 인기입니다. 일본 최고의 테마파크 중 하나입니다.", rating:4.7, openTime:"09:00~21:00", price:"성인 8,600엔~", website:"https://www.usj.co.jp"},
]},
"삿포로": { description:"삿포로는 홋카이도의 수도로 눈축제, 신선한 해산물, 라멘으로 세계적으로 유명합니다. 겨울 스키와 여름 라벤더 밭 등 사계절 다른 매력을 선사합니다.", spots:[
  {name:"삿포로 눈축제장(오도리 공원)", wikiTitle:"Sapporo Snow Festival", type:"문화", desc:"매년 2월 열리는 세계 3대 눈축제 중 하나로 거대한 눈·얼음 조각이 전시됩니다. 오도리 공원을 중심으로 1.5km에 걸쳐 펼쳐집니다.", rating:4.8, openTime:"24시간(공원)", price:"무료", website:"https://www.snowfes.com"},
  {name:"니조 시장", wikiTitle:"Hakodate Morning Market", type:"음식", desc:"100년 이상 역사를 가진 삿포로 대표 시장으로 게, 성게, 연어알 등 신선한 해산물을 맛볼 수 있습니다. 해산물 덮밥이 특히 인기입니다.", rating:4.5, openTime:"07:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Nij%C5%8D_Market"},
  {name:"모이와산 전망대", wikiTitle:"Mount Moiwa", type:"자연", desc:"삿포로 시내를 360도로 조망할 수 있는 야경 명소입니다. 일본 신 3대 야경에 선정된 로맨틱한 전망대입니다.", rating:4.6, openTime:"11:00~22:00", price:"로프웨이 왕복 2,100엔", website:"https://mt-moiwa.jp"},
  {name:"삿포로 맥주 박물관", wikiTitle:"Sapporo Beer Museum", type:"문화", desc:"일본에서 가장 오래된 맥주 브랜드 삿포로의 역사를 배울 수 있는 박물관입니다. 한정 생맥주 시음이 하이라이트입니다.", rating:4.4, openTime:"11:00~20:00", price:"무료(시음별도)", website:"https://www.sapporobeer.jp/brewery/s_museum/"},
]},
"나라": { description:"나라는 710~784년 일본 최초의 수도로 거대한 대불과 자유롭게 돌아다니는 사슴으로 유명합니다. 세계문화유산 사찰과 신사가 밀집한 고도입니다.", spots:[
  {name:"도다이지(동대사)", wikiTitle:"Todaiji", type:"역사", desc:"세계 최대의 목조 건물 안에 높이 15m의 나라 대불이 안치된 세계문화유산입니다. 1,200년 이상의 역사를 자랑합니다.", rating:4.8, openTime:"07:30~17:30", price:"성인 600엔", website:"https://www.todaiji.or.jp"},
  {name:"나라 공원", wikiTitle:"Nara Park", type:"자연", desc:"1,200여 마리의 사슴이 자유롭게 돌아다니는 공원으로 사슴 센베(과자)를 주며 교감할 수 있습니다. 벚꽃 시즌이 특히 아름답습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Nara_Park"},
  {name:"가스가타이샤", wikiTitle:"Kasuga-taisha", type:"역사", desc:"주홍색 기둥이 인상적인 신사로 3,000개의 석등과 동등이 신비로운 분위기를 연출합니다. 만토로(등불 축제) 때가 환상적입니다.", rating:4.6, openTime:"06:30~17:30", price:"성인 500엔", website:"https://www.kasugataisha.or.jp"},
  {name:"이스이엔 정원", wikiTitle:"Isuien Garden", type:"자연", desc:"메이지 시대에 조성된 일본식 정원으로 도다이지를 배경으로 한 차경(借景) 기법이 아름답습니다. 고즈넉한 산책에 완벽합니다.", rating:4.5, openTime:"09:30~16:30", price:"성인 1,200엔", website:"https://en.wikipedia.org/wiki/Isui-en"},
]},
"나고야": { description:"나고야는 일본 중부의 산업 수도로 도요타의 본거지이자 독자적인 미식 문화 '나고야메시'로 유명합니다. 전국시대 역사의 중심지이기도 합니다.", spots:[
  {name:"나고야성", wikiTitle:"Nagoya Castle", type:"역사", desc:"1612년 도쿠가와 이에야스가 축조한 성으로 금빛 샤치호코(돌고래 장식)가 상징입니다. 혼마루 어전의 화려한 벽화가 볼거리입니다.", rating:4.5, openTime:"09:00~16:30", price:"성인 500엔", website:"https://www.nagoyajo.city.nagoya.jp"},
  {name:"아츠타 신궁", wikiTitle:"Atsuta Shrine", type:"역사", desc:"일본 3대 신기 중 하나인 구사나기노츠루기를 모신 유서 깊은 신궁입니다. 이세 신궁 다음으로 중요한 신사로 여겨집니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://www.atsutajingu.or.jp"},
  {name:"오스 상점가", wikiTitle:"Ōsu, Nagoya", type:"도시", desc:"1,200개 이상의 상점이 밀집한 나고야 최대의 상점가입니다. 빈티지 의류, 서브컬처 샵, 다국적 먹거리가 가득합니다.", rating:4.4, openTime:"10:00~20:00", price:"무료", website:"https://en.wikipedia.org/wiki/%C5%8Csu"},
  {name:"히츠마부시(장어덮밥)", wikiTitle:"Hitsumabushi", type:"음식", desc:"나고야의 대표 명물 요리로 장어를 세 가지 방법으로 즐기는 독특한 메뉴입니다. 아츠타 호라이켄이 원조 맛집으로 유명합니다.", rating:4.6, openTime:"11:00~14:00, 16:30~20:30", price:"약 3,500엔~", website:"https://en.wikipedia.org/wiki/Hitsumabushi"},
]},
"후쿠오카": { description:"후쿠오카는 규슈 최대의 도시로 돈코츠 라멘과 야타이(포장마차) 문화로 일본 미식 여행의 성지입니다. 한국에서 가장 가까운 일본 대도시로 접근성이 뛰어납니다.", spots:[
  {name:"나카스 야타이", wikiTitle:"Yatai", type:"음식", desc:"하카타 강변에 늘어선 포장마차 거리로 후쿠오카만의 독특한 문화입니다. 돈코츠 라멘, 야키토리, 오뎅을 즐기며 현지인과 어울릴 수 있습니다.", rating:4.6, openTime:"18:00~02:00", price:"무료", website:"https://en.wikipedia.org/wiki/Yatai_(food_stall)"},
  {name:"다자이후 텐만구", wikiTitle:"Dazaifu Tenman-gū", type:"역사", desc:"학문의 신 스가와라 미치자네를 모신 신사로 매년 수험생들의 참배가 이어집니다. 참배로의 우메가에모치(매화떡)가 명물입니다.", rating:4.5, openTime:"06:00~19:00", price:"무료", website:"https://www.dazaifutenmangu.or.jp"},
  {name:"캐널시티 하카타", wikiTitle:"Canal City Hakata", type:"도시", desc:"거대한 쇼핑·엔터테인먼트 복합시설로 중앙의 운하와 분수 쇼가 인상적입니다. 라멘 스타디움에서 전국 라멘을 맛볼 수 있습니다.", rating:4.3, openTime:"10:00~21:00", price:"무료", website:"https://canalcity.co.jp"},
  {name:"오호리 공원", wikiTitle:"Ohori Park", type:"자연", desc:"후쿠오카 중심부에 위치한 아름다운 호수 공원으로 일본식 정원과 미술관이 있습니다. 2km 조깅 코스가 시민들에게 사랑받습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/%C5%8Chori_Park"},
]},
"히로시마": { description:"히로시마는 원폭의 비극을 딛고 평화의 도시로 부활한 감동적인 곳입니다. 평화기념공원과 인근 미야지마 섬의 해상 도리이가 대표 관광지입니다.", spots:[
  {name:"원폭 돔", wikiTitle:"Hiroshima Peace Memorial", type:"역사", desc:"1945년 원자폭탄 투하의 참상을 전하는 세계문화유산입니다. 반전과 평화의 상징으로 전 세계인의 방문이 이어집니다.", rating:4.8, openTime:"24시간(외관)", price:"무료", website:"https://en.wikipedia.org/wiki/Hiroshima_Peace_Memorial"},
  {name:"이츠쿠시마 신사(미야지마)", wikiTitle:"Itsukushima Shrine", type:"역사", desc:"바다 위에 떠 있는 듯한 주홍색 대형 도리이로 유명한 세계문화유산입니다. 만조 때 바다에 잠긴 도리이의 풍경이 환상적입니다.", rating:4.9, openTime:"06:30~18:00", price:"성인 300엔", website:"https://en.wikipedia.org/wiki/Itsukushima_Shrine"},
  {name:"히로시마 평화기념관", wikiTitle:"Hiroshima Peace Memorial Museum", type:"역사", desc:"원폭 피해자들의 유품과 기록을 전시한 박물관으로 평화의 소중함을 깊이 느낄 수 있습니다. 방문 후 큰 여운이 남는 곳입니다.", rating:4.7, openTime:"08:30~18:00", price:"성인 200엔", website:"https://en.wikipedia.org/wiki/Hiroshima_Peace_Memorial_Museum"},
  {name:"히로시마풍 오코노미야키", wikiTitle:"Okonomiyaki", type:"음식", desc:"히로시마 특유의 겹겹이 쌓아 만드는 오코노미야키를 맛볼 수 있습니다. 오코노미무라 빌딩에 수십 개의 전문점이 모여 있습니다.", rating:4.5, openTime:"11:00~21:00", price:"약 1,000엔~", website:"https://en.wikipedia.org/wiki/Okonomiyaki"},
]},
"고베": { description:"고베는 개항 이래 이국적인 분위기가 매력인 항구 도시로 세계적인 와규 고베 비프의 본고장입니다. 산과 바다 사이에 자리한 아름다운 도시 경관이 특징입니다.", spots:[
  {name:"고베 포트타워", wikiTitle:"Kobe Port Tower", type:"랜드마크", desc:"고베항의 랜드마크인 빨간색 전망 타워로 항구와 시가지를 360도로 조망할 수 있습니다. 야경이 특히 아름답습니다.", rating:4.4, openTime:"09:00~21:00", price:"성인 700엔", website:"https://en.wikipedia.org/wiki/Kobe_Port_Tower"},
  {name:"기타노 이진칸", wikiTitle:"Kitano-chō", type:"문화", desc:"개항 당시 외국인들이 살던 서양식 저택들이 모여 있는 이국적인 거리입니다. 각국의 건축 양식을 비교하며 산책하기 좋습니다.", rating:4.5, openTime:"09:00~18:00", price:"개별 입장료 상이", website:"https://en.wikipedia.org/wiki/Kitano-ch%C5%8D"},
  {name:"고베 비프 스테이크", wikiTitle:"Kobe beef", type:"음식", desc:"세계 3대 와규 중 하나인 고베 비프를 본고장에서 맛보는 특별한 경험입니다. 철판구이 스타일로 눈앞에서 구워줍니다.", rating:4.8, openTime:"11:00~22:00", price:"약 8,000엔~", website:"https://en.wikipedia.org/wiki/Kobe_beef"},
  {name:"아리마 온천", wikiTitle:"Arima Onsen", type:"자연", desc:"일본 3대 온천 중 하나로 1,000년 이상의 역사를 자랑합니다. 금빛의 킨센(금천)과 투명한 긴센(은천) 두 종류의 온천수가 유명합니다.", rating:4.6, openTime:"08:00~22:00", price:"킨노유 650엔~", website:"https://en.wikipedia.org/wiki/Arima_Onsen"},
]},
"오키나와": { description:"오키나와는 일본 최남단의 아열대 섬으로 에메랄드빛 바다와 독자적인 류큐 문화가 매력입니다. 다이빙, 스노클링, 전통 음악 등 본토와는 전혀 다른 일본을 경험할 수 있습니다.", spots:[
  {name:"슈리성", wikiTitle:"Shuri Castle", type:"역사", desc:"류큐 왕국의 왕궁이었던 세계문화유산으로 2019년 화재 후 복원 중입니다. 중국과 일본 건축이 융합된 독특한 양식이 특징입니다.", rating:4.5, openTime:"08:30~18:00", price:"성인 400엔", website:"https://en.wikipedia.org/wiki/Shuri_Castle"},
  {name:"추라우미 수족관", wikiTitle:"Okinawa Churaumi Aquarium", type:"랜드마크", desc:"세계 최대급 수조에서 고래상어와 만타가오리가 유영하는 모습을 볼 수 있는 수족관입니다. 오키나와 최고의 관광지 중 하나입니다.", rating:4.8, openTime:"08:30~18:30", price:"성인 2,180엔", website:"https://churaumi.okinawa/"},
  {name:"만좌모", wikiTitle:"Cape Manzamo", type:"자연", desc:"코끼리 코 모양의 기암절벽과 투명한 바다가 어우러진 절경입니다. 석양이 특히 아름다워 오키나와 대표 포토 스팟입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Cape_Manzamo"},
  {name:"국제거리", wikiTitle:"Kokusai Street", type:"도시", desc:"나하 시내 약 1.6km의 메인 스트리트로 오키나와 기념품과 먹거리가 가득합니다. 사탕수수 아이스크림과 시사(사자상) 기념품이 인기입니다.", rating:4.3, openTime:"10:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Kokusai_Street"},
]},
"가나자와": { description:"가나자와는 일본 3대 정원 겐로쿠엔과 보존된 에도시대 거리로 유명한 호쿠리쿠의 보석입니다. 전통 공예와 해산물 문화가 잘 보존된 문화 도시입니다.", spots:[
  {name:"겐로쿠엔", wikiTitle:"Kenroku-en", type:"자연", desc:"일본 3대 정원 중 하나로 사계절 각기 다른 아름다움을 선사합니다. 특히 겨울의 유키츠리(눈 대비 나무 보호)가 상징적입니다.", rating:4.8, openTime:"07:00~18:00", price:"성인 320엔", website:"https://en.wikipedia.org/wiki/Kenroku-en"},
  {name:"히가시 차야가이", wikiTitle:"Higashi Chaya District", type:"문화", desc:"에도시대 게이샤 거리의 모습을 그대로 간직한 전통 찻집 거리입니다. 금박 아이스크림과 전통 화과자가 명물입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Higashi_Chaya_District"},
  {name:"오미초 시장", wikiTitle:"Ōmi-chō Market", type:"음식", desc:"300년 역사의 가나자와 대표 시장으로 일본해의 신선한 해산물이 가득합니다. 노도구로(기름눈볼대) 초밥이 특히 유명합니다.", rating:4.6, openTime:"09:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Ōmi-chō_Market"},
  {name:"21세기 미술관", wikiTitle:"21st Century Museum of Contemporary Art, Kanazawa", type:"문화", desc:"레안드로 에를리치의 수영장 작품으로 유명한 현대미술관입니다. 원형 유리 건물 자체가 하나의 예술 작품입니다.", rating:4.5, openTime:"10:00~18:00", price:"전시별 상이", website:"https://en.wikipedia.org/wiki/21st_Century_Museum_of_Contemporary_Art,_Kanazawa"},
]},
"하코네": { description:"하코네는 도쿄에서 1시간 거리의 온천 휴양지로 후지산 전망과 노천 온천, 미술관이 유명합니다. 로프웨이, 유람선, 등산열차로 이동하는 것 자체가 관광입니다.", spots:[
  {name:"아시노코 호수", wikiTitle:"Lake Ashi", type:"자연", desc:"후지산을 배경으로 해적선 유람선이 운항하는 화산 호수입니다. 맑은 날 호수에 비친 후지산의 역(逆)후지가 장관입니다.", rating:4.7, openTime:"09:00~17:00", price:"유람선 1,200엔~", website:"https://en.wikipedia.org/wiki/Lake_Ashi"},
  {name:"오와쿠다니", wikiTitle:"Owakudani", type:"자연", desc:"약 3,000년 전 화산 폭발로 형성된 유황 분기 지대입니다. 유황으로 삶은 검은 달걀을 먹으면 7년 수명이 늘어난다는 전설이 있습니다.", rating:4.5, openTime:"09:00~17:00", price:"로프웨이 별도", website:"https://en.wikipedia.org/wiki/%C5%8Cwakudani"},
  {name:"하코네 조각의 숲 미술관", wikiTitle:"Hakone Open-Air Museum", type:"문화", desc:"야외에 조각 작품들이 전시된 미술관으로 피카소관도 있습니다. 자연과 예술이 어우러진 독특한 공간입니다.", rating:4.6, openTime:"09:00~17:00", price:"성인 1,600엔", website:"https://en.wikipedia.org/wiki/Hakone_Open-Air_Museum"},
  {name:"하코네 유모토 온천", wikiTitle:"Hakone", type:"자연", desc:"하코네의 관문으로 수많은 온천 료칸과 당일 온천 시설이 모여 있습니다. 도쿄 근교 최고의 온천 체험을 할 수 있습니다.", rating:4.5, openTime:"시설마다 상이", price:"당일 온천 1,500엔~", website:"https://en.wikipedia.org/wiki/Hakone"},
]},

// ────────────────────────── 중국 ──────────────────────────
"베이징": { description:"베이징은 3,000년 역사의 중국 수도로 자금성, 만리장성, 천안문 광장 등 중국 역사의 핵심이 집약된 도시입니다. 현대적 발전과 황제의 도시가 공존합니다.", spots:[
  {name:"자금성(고궁박물원)", wikiTitle:"Forbidden City", type:"역사", desc:"명·청 시대 24명의 황제가 거주한 세계 최대 궁전 단지입니다. 9,999칸의 방이 있으며 유네스코 세계문화유산입니다.", rating:4.9, openTime:"08:30~17:00", price:"60위안", website:"https://www.dpm.org.cn"},
  {name:"만리장성(바다링)", wikiTitle:"Great Wall of China", type:"역사", desc:"인류 역사상 가장 거대한 건축물로 바다링 구간이 가장 접근성이 좋습니다. 성벽 위에서 끝없이 이어지는 장성을 감상할 수 있습니다.", rating:4.9, openTime:"06:30~19:00", price:"40위안", website:"https://en.wikipedia.org/wiki/Great_Wall_of_China"},
  {name:"천단(텐탄)", wikiTitle:"Temple of Heaven", type:"역사", desc:"명·청 시대 황제가 하늘에 제사를 올린 유네스코 세계문화유산입니다. 원형 기년전의 아름다운 건축미가 압도적입니다.", rating:4.7, openTime:"06:00~21:00", price:"34위안", website:"https://en.wikipedia.org/wiki/Temple_of_Heaven"},
  {name:"이화원", wikiTitle:"Summer Palace", type:"역사", desc:"청나라 황실의 여름 별궁으로 쿤밍호와 만수산이 어우러진 아름다운 정원입니다. 긴 회랑의 채색화가 특히 볼만합니다.", rating:4.7, openTime:"06:30~18:00", price:"30위안", website:"https://en.wikipedia.org/wiki/Summer_Palace"},
  {name:"왕푸징 먹자골목", wikiTitle:"Wangfujing", type:"음식", desc:"베이징 최대의 번화가로 전갈꼬치, 양고기 꼬치 등 다양한 중국 길거리 음식을 맛볼 수 있습니다. 쇼핑과 먹거리의 천국입니다.", rating:4.3, openTime:"09:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Wangfujing"},
]},
"상하이": { description:"상하이는 중국 최대의 경제 도시로 와이탄의 유럽풍 건축과 푸둥의 초고층 빌딩이 대비를 이루는 화려한 도시입니다. 동서양 문화가 융합된 독특한 매력이 있습니다.", spots:[
  {name:"와이탄(외탄)", wikiTitle:"The Bund", type:"랜드마크", desc:"황푸강변에 늘어선 1920~30년대 유럽풍 건축물군으로 상하이의 상징입니다. 밤에는 맞은편 푸둥의 화려한 야경을 감상할 수 있습니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/The_Bund"},
  {name:"동방명주탑", wikiTitle:"Oriental Pearl Tower", type:"랜드마크", desc:"높이 468m의 상하이 랜드마크로 투명 바닥 전망대가 스릴 넘칩니다. 상하이 스카이라인의 핵심 요소입니다.", rating:4.5, openTime:"08:00~21:30", price:"160위안~", website:"https://en.wikipedia.org/wiki/Oriental_Pearl_Tower"},
  {name:"예원(위위안)", wikiTitle:"Yu Garden", type:"역사", desc:"명나라 시대에 조성된 전통 정원으로 정교한 조경과 건축이 돋보입니다. 주변 예원상장의 소룡포와 각종 간식이 유명합니다.", rating:4.5, openTime:"08:30~17:00", price:"40위안", website:"https://en.wikipedia.org/wiki/Yu_Garden"},
  {name:"난징루(남경로)", wikiTitle:"Nanjing Road", type:"도시", desc:"세계에서 가장 긴 쇼핑 거리 중 하나로 항상 인파로 붐비는 보행자 전용 거리입니다. 밤에는 네온사인이 화려하게 빛납니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Nanjing_Road"},
]},
"시안": { description:"시안은 13개 왕조의 수도였던 중국 고대 문명의 요람으로 진시황 병마용갱이 있는 역사 도시입니다. 실크로드의 출발점으로 동서양 문화의 교차점이었습니다.", spots:[
  {name:"진시황 병마용", wikiTitle:"Terracotta Army", type:"역사", desc:"2,200년 전 진시황제의 무덤을 지키는 8,000여 개의 실물 크기 병사 조각입니다. 20세기 최대의 고고학 발견으로 꼽히는 세계문화유산입니다.", rating:4.9, openTime:"08:30~18:00", price:"120위안", website:"http://www.bmy.com.cn"},
  {name:"시안 성벽", wikiTitle:"Fortifications of Xi'an", type:"역사", desc:"명나라 때 쌓은 중국에서 가장 잘 보존된 고대 성벽으로 둘레 14km입니다. 성벽 위에서 자전거를 타며 시안 시내를 조망할 수 있습니다.", rating:4.7, openTime:"08:00~22:00", price:"54위안", website:"https://en.wikipedia.org/wiki/Fortifications_of_Xi%27an"},
  {name:"대안탑(대기러기탑)", wikiTitle:"Giant Wild Goose Pagoda", type:"역사", desc:"당나라 현장법사가 인도에서 가져온 불경을 보관하기 위해 세운 7층 탑입니다. 1,300년 역사의 시안 상징물입니다.", rating:4.5, openTime:"08:00~18:00", price:"40위안", website:"https://en.wikipedia.org/wiki/Giant_Wild_Goose_Pagoda"},
  {name:"회민가(무슬림 거리)", wikiTitle:"Muslim Quarter, Xi'an", type:"음식", desc:"시안의 대표 먹자골목으로 양꼬치, 량피(냉면), 비앙비앙면 등 서북 중국 요리를 맛볼 수 있습니다. 밤이면 더욱 활기찬 야시장이 됩니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Muslim_Quarter,_Xi%27an"},
]},
"구이린": { description:"구이린은 수묵화 같은 카르스트 지형이 리강을 따라 펼쳐지는 세계적인 절경의 도시입니다. 중국 20위안 지폐의 배경이 될 만큼 아름다운 자연경관을 자랑합니다.", spots:[
  {name:"리강 유람", wikiTitle:"Li River", type:"자연", desc:"구이린에서 양숴까지 약 83km의 리강 유람은 중국 최고의 풍경 중 하나입니다. 기이한 봉우리와 맑은 강물이 한 폭의 산수화를 이룹니다.", rating:4.9, openTime:"08:00~17:00", price:"210위안~", website:"https://en.wikipedia.org/wiki/Li_River_(Guangxi)"},
  {name:"양숴 서가", wikiTitle:"Yangshuo", type:"자연", desc:"카르스트 봉우리에 둘러싸인 작은 마을로 자전거 타며 전원 풍경을 감상하기 완벽합니다. 서가(西街)의 카페와 레스토랑도 매력적입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Yangshuo_County"},
  {name:"상비산", wikiTitle:"Elephant Trunk Hill", type:"자연", desc:"코끼리가 물을 마시는 모양의 기암으로 구이린의 상징입니다. 리강변에 자리하여 구이린 시내에서 쉽게 방문할 수 있습니다.", rating:4.4, openTime:"06:00~22:00", price:"70위안", website:"https://en.wikipedia.org/wiki/Elephant_Trunk_Hill"},
  {name:"룽지 다랭이 논", wikiTitle:"Longsheng Rice Terrace", type:"자연", desc:"산비탈을 따라 층층이 조성된 계단식 논으로 용의 등뼈라는 뜻입니다. 수확기인 가을에 황금빛으로 물드는 풍경이 장관입니다.", rating:4.6, openTime:"08:00~18:00", price:"80위안", website:"https://en.wikipedia.org/wiki/Longsheng_Rice_Terrace"},
]},
"청두": { description:"청두는 쓰촨성의 수도로 귀여운 자이언트 판다와 매운 쓰촨 요리의 본고장입니다. 유네스코 미식창의도시로 마파두부, 훠궈 등 풍부한 미식 문화를 자랑합니다.", spots:[
  {name:"청두 판다 번식 연구기지", wikiTitle:"Chengdu Research Base of Giant Panda Breeding", type:"자연", desc:"100마리 이상의 자이언트 판다를 자연에 가까운 환경에서 관찰할 수 있습니다. 아기 판다를 볼 수 있는 세계적 인기 관광지입니다.", rating:4.8, openTime:"07:30~18:00", price:"55위안", website:"https://www.panda.org.cn"},
  {name:"진리 고거리", wikiTitle:"Jinli", type:"문화", desc:"삼국지의 무후사 옆에 자리한 전통 거리로 쓰촨식 건축과 먹거리, 공예품이 가득합니다. 밤에 붉은 등불이 켜지면 특히 아름답습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Jinli"},
  {name:"쓰촨 훠궈", wikiTitle:"Hot pot", type:"음식", desc:"마라(麻辣) 국물에 각종 재료를 넣어 먹는 쓰촨 훠궈는 중국 최고의 미식 경험입니다. 얼얼한 화자오(화초) 향이 중독적입니다.", rating:4.7, openTime:"11:00~02:00", price:"약 80위안~", website:"https://en.wikipedia.org/wiki/Hot_pot"},
  {name:"르서우(인민공원)", wikiTitle:"People's Park, Chengdu", type:"문화", desc:"청두 시민들의 삶을 엿볼 수 있는 도심 공원으로 차를 마시며 여유를 즐기는 다관 문화가 인상적입니다. 맞선 코너도 유명합니다.", rating:4.3, openTime:"06:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/People%27s_Park_(Chengdu)"},
]},
"항저우": { description:"항저우는 마르코 폴로가 세계에서 가장 아름다운 도시라 극찬한 곳으로 서호의 절경이 유명합니다. 용정차의 산지이자 알리바바 본사가 있는 IT 도시이기도 합니다.", spots:[
  {name:"서호(시후)", wikiTitle:"West Lake", type:"자연", desc:"유네스코 세계문화유산으로 호수 주변의 정자, 탑, 다리, 버드나무가 한 폭의 수묵화를 이룹니다. 유람선을 타며 감상하는 것이 최고입니다.", rating:4.8, openTime:"24시간", price:"무료(유람선 별도)", website:"https://en.wikipedia.org/wiki/West_Lake"},
  {name:"링인사(영은사)", wikiTitle:"Lingyin Temple", type:"역사", desc:"1,700년 역사의 중국 10대 사찰 중 하나로 거대한 석불 조각과 고요한 분위기가 인상적입니다. 비래봉의 석각 군상도 필수 코스입니다.", rating:4.6, openTime:"07:00~18:00", price:"75위안(통합)", website:"https://en.wikipedia.org/wiki/Lingyin_Temple"},
  {name:"용정차 마을", wikiTitle:"Longjing tea", type:"문화", desc:"중국 최고급 녹차 용정(롱징)차의 산지로 차밭 사이를 걸으며 갓 따낸 차를 시음할 수 있습니다. 봄 청명절 무렵이 최적기입니다.", rating:4.5, openTime:"08:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Longjing_tea"},
  {name:"허팡제(하방가)", wikiTitle:"Hangzhou", type:"음식", desc:"남송 시대 거리를 재현한 전통 상업가로 항저우 특산 간식과 차, 공예품을 즐길 수 있습니다. 동파육 등 항저우 요리도 맛볼 수 있습니다.", rating:4.3, openTime:"09:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Hangzhou"},
]},
"장자제": { description:"장자제는 영화 아바타의 할렐루야 산 모티브가 된 곳으로 수천 개의 사암 기둥이 구름 위로 솟아오른 경이로운 풍경입니다. 중국 최초의 국가삼림공원입니다.", spots:[
  {name:"장자제 국가삼림공원", wikiTitle:"Zhangjiajie National Forest Park", type:"자연", desc:"3,000개 이상의 사암 기둥이 솟아오른 초현실적 풍경의 유네스코 세계자연유산입니다. 아바타의 판도라 행성 영감을 준 곳입니다.", rating:4.9, openTime:"07:00~18:00", price:"225위안(4일 유효)", website:"https://en.wikipedia.org/wiki/Zhangjiajie_National_Forest_Park"},
  {name:"장자제 유리다리", wikiTitle:"Zhangjiajie Glass Bridge", type:"랜드마크", desc:"높이 300m, 길이 430m의 세계 최장 유리 바닥 다리입니다. 투명한 바닥 아래로 펼쳐진 협곡이 스릴 넘치는 경험을 선사합니다.", rating:4.5, openTime:"07:00~17:00", price:"138위안", website:"https://en.wikipedia.org/wiki/Zhangjiajie_Glass_Bridge"},
  {name:"톈먼산", wikiTitle:"Tianmen Mountain", type:"자연", desc:"세계 최장 케이블카를 타고 올라가 하늘문(천문동)을 지나는 코스가 압도적입니다. 절벽 유리 잔도 걷기도 인기 체험입니다.", rating:4.7, openTime:"08:00~18:00", price:"258위안(통합)", website:"https://en.wikipedia.org/wiki/Tianmen_Mountain"},
  {name:"바이롱 엘리베이터", wikiTitle:"Bailong Elevator", type:"랜드마크", desc:"높이 326m의 세계 최고 높이 야외 엘리베이터로 기네스북에 등재되어 있습니다. 수직 절벽을 2분 만에 올라가며 절경을 감상합니다.", rating:4.4, openTime:"07:30~17:00", price:"72위안", website:"https://en.wikipedia.org/wiki/Bailong_Elevator"},
]},
"리장": { description:"리장은 나시족의 고대 도시로 유네스코 세계문화유산에 등재된 구시가지와 위롱쉐산(옥룡설산)의 장엄한 풍경이 매력입니다. 소수민족 문화가 살아 숨쉬는 곳입니다.", spots:[
  {name:"리장고성", wikiTitle:"Old Town of Lijiang", type:"문화", desc:"800년 역사의 나시족 고대 도시로 유네스코 세계문화유산입니다. 돌길과 수로, 전통 가옥이 어우러진 아름다운 거리가 펼쳐집니다.", rating:4.6, openTime:"24시간", price:"50위안(유지비)", website:"https://en.wikipedia.org/wiki/Old_Town_of_Lijiang"},
  {name:"옥룡설산(위롱쉐산)", wikiTitle:"Jade Dragon Snow Mountain", type:"자연", desc:"해발 5,596m의 만년설산으로 케이블카를 타고 해발 4,506m 빙하 공원까지 올라갈 수 있습니다. 웅장한 설산의 위용이 압도적입니다.", rating:4.7, openTime:"07:00~18:00", price:"100위안+케이블카", website:"https://en.wikipedia.org/wiki/Jade_Dragon_Snow_Mountain"},
  {name:"인상리장 공연", wikiTitle:"Impression, Lijiang", type:"문화", desc:"장이머우 감독이 연출한 대형 야외 공연으로 옥룡설산을 배경으로 펼쳐집니다. 소수민족의 문화와 자연이 어우러진 장관입니다.", rating:4.5, openTime:"13:30, 15:30 공연", price:"190위안~", website:"https://en.wikipedia.org/wiki/Impressions_(concert_series)"},
  {name:"슈허고진", wikiTitle:"Shuhe Ancient Town", type:"문화", desc:"리장 고성보다 조용하고 한적한 나시족 고대 마을입니다. 좁은 골목과 수로를 따라 걸으며 전통 생활상을 엿볼 수 있습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Shuhe_Ancient_Town"},
]},
"황산": { description:"황산은 중국 산수화의 원조로 기이한 소나무, 기암괴석, 운해, 온천의 4절(四絶)로 유명합니다. 이백, 서하객 등 수많은 시인과 화가의 영감의 원천이었습니다.", spots:[
  {name:"황산 풍경구", wikiTitle:"Huangshan", type:"자연", desc:"유네스코 세계유산으로 72개의 봉우리와 운해가 만드는 초현실적 풍경이 장관입니다. 일출과 운해가 만나는 순간이 하이라이트입니다.", rating:4.9, openTime:"06:30~16:30(케이블카)", price:"190위안+케이블카", website:"https://en.wikipedia.org/wiki/Huangshan"},
  {name:"시디·홍춘 마을", wikiTitle:"Xidi", type:"문화", desc:"명·청 시대 안후이 상인들의 마을로 유네스코 세계문화유산입니다. 백벽흑기와의 전통 건축이 수묵화 같은 풍경을 연출합니다.", rating:4.6, openTime:"07:00~17:30", price:"104위안", website:"https://en.wikipedia.org/wiki/Xidi"},
  {name:"영객송", wikiTitle:"Huangshan", type:"자연", desc:"황산을 대표하는 소나무로 천 년 이상 절벽에서 자라며 양팔을 벌려 손님을 맞이하는 형상입니다. 중국인이 가장 사랑하는 나무입니다.", rating:4.5, openTime:"황산 입장 시", price:"포함", website:"https://en.wikipedia.org/wiki/Huangshan"},
  {name:"툰시 고가(둔계 옛거리)", wikiTitle:"Tunxi District", type:"문화", desc:"송나라 시대부터 이어진 상업 거리로 전통 차, 먹물, 붓 등 문방사우를 판매합니다. 안후이 요리인 취두부(냄새나는 두부)가 명물입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Tunxi_District"},
]},
"홍콩": { description:"홍콩은 동양과 서양이 만나는 세계적인 금융·쇼핑 도시로 빅토리아 피크의 야경과 딤섬 문화가 유명합니다. 작은 면적에 압축된 다양한 문화와 미식이 매력입니다.", spots:[
  {name:"빅토리아 피크", wikiTitle:"Victoria Peak", type:"랜드마크", desc:"해발 552m에서 홍콩의 스카이라인을 한눈에 조망할 수 있는 최고의 전망대입니다. 피크 트램을 타고 올라가는 것 자체가 경험입니다.", rating:4.7, openTime:"10:00~23:00", price:"피크트램 왕복 HK$88", website:"https://www.thepeak.com.hk"},
  {name:"스타의 거리(침사추이)", wikiTitle:"Tsim Sha Tsui", type:"도시", desc:"빅토리아 항구를 바라보며 홍콩 영화 스타들의 핸드프린트를 감상할 수 있습니다. 매일 밤 심포니 오브 라이트 쇼가 펼쳐집니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Tsim_Sha_Tsui"},
  {name:"란콰이퐁", wikiTitle:"Lan Kwai Fong", type:"도시", desc:"홍콩 최고의 나이트라이프 거리로 바와 레스토랑이 밀집해 있습니다. 세계 각국의 음식과 함께 홍콩의 밤을 즐길 수 있습니다.", rating:4.3, openTime:"18:00~04:00", price:"무료", website:"https://en.wikipedia.org/wiki/Lan_Kwai_Fong"},
  {name:"딤섬 레스토랑", wikiTitle:"Dim sum", type:"음식", desc:"홍콩의 대표 미식 문화인 딤섬(점심)을 즐기는 얌차 경험은 필수입니다. 하가우, 시우마이, 차슈바오 등 다양한 메뉴가 있습니다.", rating:4.6, openTime:"07:00~15:00", price:"약 HK$100~", website:"https://en.wikipedia.org/wiki/Dim_sum"},
]},
"마카오": { description:"마카오는 포르투갈 식민지 역사가 남긴 유럽풍 건축과 세계 최대의 카지노 산업이 공존하는 독특한 도시입니다. 유네스코 세계문화유산 역사지구가 매력적입니다.", spots:[
  {name:"성 바울 성당 유적", wikiTitle:"Ruins of St. Paul's", type:"역사", desc:"17세기에 지어진 동양 최대의 성당 유적으로 마카오의 상징입니다. 화재로 전면부만 남았지만 정교한 조각이 인상적입니다.", rating:4.5, openTime:"24시간(외관)", price:"무료", website:"https://en.wikipedia.org/wiki/Ruins_of_St._Paul%27s"},
  {name:"세나도 광장", wikiTitle:"Senado Square", type:"문화", desc:"포르투갈 스타일의 물결 무늬 모자이크 바닥이 인상적인 마카오 중심 광장입니다. 파스텔 색상의 유럽풍 건물들이 둘러싸고 있습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Senado_Square"},
  {name:"마카오 타워", wikiTitle:"Macau Tower", type:"랜드마크", desc:"높이 338m의 타워로 세계에서 가장 높은 번지점프(233m)를 체험할 수 있습니다. 전망대에서 마카오와 주하이를 한눈에 볼 수 있습니다.", rating:4.3, openTime:"10:00~21:00", price:"MOP 165", website:"https://en.wikipedia.org/wiki/Macau_Tower"},
  {name:"에그타르트(파스텔 데 나타)", wikiTitle:"Pastel de nata", type:"음식", desc:"마카오의 명물 포르투갈 에그타르트로 바삭한 페이스트리와 부드러운 커스터드의 조화가 완벽합니다. 로드 스토우 베이커리가 원조입니다.", rating:4.6, openTime:"07:00~22:00", price:"약 MOP 13", website:"https://en.wikipedia.org/wiki/Pastel_de_nata"},
]},
"쑤저우": { description:"쑤저우는 동양의 베네치아로 불리며 2,500년 역사의 정원 문화와 수로가 아름다운 도시입니다. 유네스코에 등재된 고전 정원들이 중국 원림 예술의 정수를 보여줍니다.", spots:[
  {name:"졸정원(줘정위안)", wikiTitle:"Humble Administrator's Garden", type:"자연", desc:"중국 4대 정원 중 하나로 유네스코 세계문화유산입니다. 연못과 정자, 회랑이 정교하게 배치된 명나라 원림 예술의 걸작입니다.", rating:4.7, openTime:"07:30~17:30", price:"70위안", website:"https://en.wikipedia.org/wiki/Humble_Administrator%27s_Garden"},
  {name:"호구탑(호랑이 언덕)", wikiTitle:"Tiger Hill", type:"역사", desc:"1,000년 이상 기울어진 중국판 피사의 사탑이 있는 언덕입니다. 오왕 합려의 묘가 있다고 전해지며 검지(검의 연못) 전설이 유명합니다.", rating:4.4, openTime:"07:30~18:00", price:"60위안", website:"https://en.wikipedia.org/wiki/Tiger_Hill_(Suzhou)"},
  {name:"핑장로(평강로)", wikiTitle:"Suzhou", type:"문화", desc:"송나라 시대부터 이어진 수로변 거리로 수저우의 전통적인 수향 마을 풍경을 간직하고 있습니다. 배를 타고 수로를 유람할 수 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Suzhou"},
  {name:"쑤저우 박물관(신관)", wikiTitle:"Suzhou Museum", type:"문화", desc:"건축 거장 I.M. 페이가 설계한 현대와 전통이 조화된 박물관입니다. 건물 자체가 예술 작품이며 쑤저우의 역사 유물을 전시합니다.", rating:4.6, openTime:"09:00~17:00", price:"무료(예약 필수)", website:"https://en.wikipedia.org/wiki/Suzhou_Museum"},
]},

// ────────────────────────── 프랑스 ──────────────────────────
"파리": { description:"파리는 예술, 패션, 미식의 세계 수도로 에펠탑, 루브르, 세느강이 로맨틱한 분위기를 자아냅니다. 수백 년간 인류 문화의 중심지로서 끊임없는 영감을 선사합니다.", spots:[
  {name:"에펠탑", wikiTitle:"Eiffel Tower", type:"랜드마크", desc:"1889년 세계박람회를 위해 건설된 높이 330m의 파리 상징물입니다. 야간 조명이 매시 정각마다 반짝이는 모습이 로맨틱합니다.", rating:4.7, openTime:"09:30~23:45", price:"€26.80~", website:"https://www.toureiffel.paris"},
  {name:"루브르 박물관", wikiTitle:"Louvre", type:"문화", desc:"세계 최대의 미술관으로 모나리자, 밀로의 비너스 등 38만 점의 소장품을 보유하고 있습니다. 유리 피라미드 입구가 상징적입니다.", rating:4.8, openTime:"09:00~18:00(월·수~토)", price:"€22", website:"https://www.louvre.fr"},
  {name:"노트르담 대성당", wikiTitle:"Notre-Dame de Paris", type:"역사", desc:"850년 역사의 고딕 건축 걸작으로 2019년 화재 후 복원되었습니다. 센강의 시테섬에 자리하여 파리의 역사적 심장부입니다.", rating:4.7, openTime:"복원 후 공개", price:"무료", website:"https://en.wikipedia.org/wiki/Notre-Dame_de_Paris"},
  {name:"몽마르트르(사크레쾨르)", wikiTitle:"Sacré-Cœur, Paris", type:"문화", desc:"파리 북쪽 언덕 위 하얀 성당에서 파리 시내를 한눈에 조망할 수 있습니다. 화가들의 거리 테르트르 광장이 예술적 분위기를 더합니다.", rating:4.6, openTime:"06:00~22:30", price:"무료", website:"https://www.sacre-coeur-montmartre.com"},
  {name:"오르세 미술관", wikiTitle:"Musée d'Orsay", type:"문화", desc:"인상주의 회화의 세계 최대 컬렉션을 보유한 미술관으로 모네, 르누아르, 고흐의 걸작을 만날 수 있습니다. 기차역을 개조한 건물이 독특합니다.", rating:4.7, openTime:"09:30~18:00", price:"€16", website:"https://www.musee-orsay.fr"},
]},
"니스": { description:"니스는 코트다쥐르(프랑스 리비에라)의 중심 도시로 지중해의 푸른 바다와 화려한 해변이 매력적입니다. 마티스, 샤갈 등 예술가들이 사랑한 빛의 도시입니다.", spots:[
  {name:"프로메나드 데 장글레", wikiTitle:"Promenade des Anglais", type:"도시", desc:"니스 해변을 따라 7km 이어지는 산책로로 코트다쥐르의 상징입니다. 파란 의자에 앉아 지중해를 바라보는 것이 니스의 정수입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Promenade_des_Anglais"},
  {name:"니스 구시가지(비유 니스)", wikiTitle:"Vieux Nice", type:"문화", desc:"좁은 골목과 파스텔 색 건물이 매력적인 구시가로 살레야 광장의 꽃시장이 유명합니다. 소카(병아리콩 전)를 꼭 맛보세요.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Nice"},
  {name:"샤갈 미술관", wikiTitle:"Musée Marc Chagall", type:"문화", desc:"마르크 샤갈의 성서 연작을 전시한 미술관으로 스테인드글라스가 아름답습니다. 예술가가 직접 기증한 작품들이 감동적입니다.", rating:4.5, openTime:"10:00~18:00", price:"€10", website:"https://en.wikipedia.org/wiki/Mus%C3%A9e_Marc_Chagall"},
  {name:"성 언덕(콜린 뒤 샤토)", wikiTitle:"Castle Hill, Nice", type:"자연", desc:"니스 구시가 옆 언덕으로 항구와 해변, 도시를 한눈에 조망할 수 있는 최고의 전망대입니다. 폭포와 정원이 어우러져 있습니다.", rating:4.6, openTime:"08:30~20:00", price:"무료", website:"https://en.wikipedia.org/wiki/Castle_Hill,_Nice"},
]},
"리옹": { description:"리옹은 프랑스 미식의 수도로 폴 보퀴즈 등 세계적인 셰프를 배출한 곳입니다. 로마 시대 유적과 르네상스 건축이 어우러진 유네스코 세계문화유산 도시입니다.", spots:[
  {name:"리옹 구시가(비유 리옹)", wikiTitle:"Vieux Lyon", type:"문화", desc:"르네상스 건축이 밀집한 유네스코 세계문화유산 지구로 비밀 통로 트라불이 유명합니다. 중세 골목을 걸으며 시간 여행을 합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Vieux_Lyon"},
  {name:"푸르비에르 대성당", wikiTitle:"Basilica of Notre-Dame de Fourvière", type:"역사", desc:"리옹을 내려다보는 언덕 위 화려한 바실리카로 내부의 모자이크가 눈부십니다. 리옹의 상징이자 최고의 전망 포인트입니다.", rating:4.7, openTime:"07:00~19:00", price:"무료", website:"https://en.wikipedia.org/wiki/Basilica_of_Notre-Dame_de_Fourvière"},
  {name:"폴 보퀴즈 시장", wikiTitle:"Les Halles de Lyon – Paul Bocuse", type:"음식", desc:"프랑스 요리의 신 폴 보퀴즈의 이름을 딴 실내 시장으로 최고급 식재료와 리옹 특산물이 모여 있습니다. 미식 여행의 필수 코스입니다.", rating:4.7, openTime:"07:00~22:30", price:"무료", website:"https://en.wikipedia.org/wiki/Les_Halles_de_Lyon_%E2%80%93_Paul_Bocuse"},
  {name:"로마 극장", wikiTitle:"Ancient Theatre of Fourvière", type:"역사", desc:"기원전 15년에 건설된 프랑스에서 가장 오래된 로마 극장입니다. 여름에는 뉘 드 푸르비에르 축제가 열립니다.", rating:4.4, openTime:"07:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Ancient_Theatre_of_Fourvi%C3%A8re"},
]},
"보르도": { description:"보르도는 세계 와인의 수도로 유네스코 세계문화유산에 등재된 아름다운 도시입니다. 가론강변의 우아한 18세기 건축과 세계 최고의 와인 산지가 함께합니다.", spots:[
  {name:"라 시테 뒤 뱅(와인 박물관)", wikiTitle:"La Cité du Vin", type:"문화", desc:"와인의 역사와 문화를 체험하는 세계적인 박물관으로 독특한 곡선형 건축이 인상적입니다. 최상층에서 보르도 와인을 시음할 수 있습니다.", rating:4.5, openTime:"10:00~19:00", price:"€22", website:"https://en.wikipedia.org/wiki/La_Cité_du_Vin"},
  {name:"생테밀리옹", wikiTitle:"Saint-Émilion", type:"문화", desc:"보르도 인근의 유네스코 세계문화유산 와인 마을로 중세 건축과 포도밭이 어우러진 풍경이 그림 같습니다. 와이너리 투어가 인기입니다.", rating:4.7, openTime:"투어 시간 상이", price:"투어 €25~", website:"https://en.wikipedia.org/wiki/Saint-%C3%89milion"},
  {name:"물의 거울(미루아 도)", wikiTitle:"Miroir d'eau", type:"랜드마크", desc:"보르도 부르스 광장 앞 세계 최대 반사 수면으로 건물과 하늘이 거울처럼 비칩니다. 특히 석양 때의 반영이 환상적입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Miroir_d%27eau"},
  {name:"보르도 대극장", wikiTitle:"Grand Théâtre de Bordeaux", type:"문화", desc:"18세기 신고전주의 건축의 걸작으로 12개의 거대한 코린트식 기둥이 인상적입니다. 파리 오페라 하우스의 영감이 된 건물입니다.", rating:4.4, openTime:"가이드 투어", price:"€6", website:"https://en.wikipedia.org/wiki/Grand_Th%C3%A9%C3%A2tre_de_Bordeaux"},
]},
"마르세유": { description:"마르세유는 프랑스에서 가장 오래된 도시로 2,600년 역사의 항구 도시입니다. 지중해의 활기와 다문화적 매력, 부야베스 요리가 유명합니다.", spots:[
  {name:"노트르담 드 라 가르드", wikiTitle:"Notre-Dame de la Garde", type:"역사", desc:"마르세유 최고 지점의 성당으로 황금빛 마리아상이 도시를 내려다봅니다. 마르세유 전체와 지중해를 360도로 조망할 수 있습니다.", rating:4.7, openTime:"07:00~19:00", price:"무료", website:"https://en.wikipedia.org/wiki/Notre-Dame_de_la_Garde"},
  {name:"구항(비유 포르)", wikiTitle:"Old Port of Marseille", type:"도시", desc:"마르세유의 심장부인 구항구로 매일 아침 신선한 어시장이 열립니다. 해안 카페에서 부야베스를 즐기며 항구를 바라봅니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Old_Port_of_Marseille"},
  {name:"칼랑크 국립공원", wikiTitle:"Calanques National Park", type:"자연", desc:"하얀 석회암 절벽과 터키석 빛 바다가 어우러진 지중해 절경입니다. 하이킹과 카약으로 숨겨진 해변을 탐험할 수 있습니다.", rating:4.8, openTime:"일출~일몰", price:"무료", website:"https://en.wikipedia.org/wiki/Calanques_National_Park"},
  {name:"뮈쌩(MuCEM)", wikiTitle:"MuCEM", type:"문화", desc:"유럽 지중해 문명 박물관으로 현대적인 격자 건축이 인상적입니다. 옥상 테라스에서 바다와 구항을 동시에 조망할 수 있습니다.", rating:4.4, openTime:"10:00~19:00", price:"€11", website:"https://en.wikipedia.org/wiki/MuCEM"},
]},
"몽생미셸": { description:"몽생미셸은 조수 간만에 따라 바다에 떠 있다 육지와 연결되는 섬 위의 수도원으로 세계적인 기적의 건축물입니다. 프랑스에서 가장 많이 방문하는 명소 중 하나입니다.", spots:[
  {name:"몽생미셸 수도원", wikiTitle:"Mont-Saint-Michel", type:"역사", desc:"8세기에 건설이 시작된 유네스코 세계문화유산 수도원으로 하늘을 찌르는 첨탑이 인상적입니다. 만조 때 바다에 떠 있는 듯한 풍경이 환상적입니다.", rating:4.9, openTime:"09:00~19:00", price:"€11", website:"https://en.wikipedia.org/wiki/Mont-Saint-Michel"},
  {name:"그랑 뤼", wikiTitle:"Mont-Saint-Michel", type:"문화", desc:"섬 입구부터 수도원까지 이어지는 좁은 골목으로 기념품 가게와 레스토랑이 줄지어 있습니다. 명물 오믈렛을 맛볼 수 있습니다.", rating:4.3, openTime:"09:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Mont-Saint-Michel"},
  {name:"야간 조명 관람", wikiTitle:"Mont-Saint-Michel", type:"랜드마크", desc:"해질 무렵부터 수도원에 조명이 켜지면 몽생미셸이 황금빛으로 빛납니다. 본토 쪽에서 바라보는 야경이 특히 감동적입니다.", rating:4.7, openTime:"일몰 후", price:"무료", website:"https://en.wikipedia.org/wiki/Mont-Saint-Michel"},
]},
"스트라스부르": { description:"스트라스부르는 프랑스와 독일 문화가 만나는 알자스 지방의 수도로 목조 건물이 아기자기한 쁘띠 프랑스 지구가 유명합니다. 유럽의회 소재지이기도 합니다.", spots:[
  {name:"스트라스부르 대성당", wikiTitle:"Strasbourg Cathedral", type:"역사", desc:"높이 142m의 고딕 양식 대성당으로 분홍빛 사암이 독특합니다. 내부의 천문시계와 스테인드글라스가 걸작입니다.", rating:4.7, openTime:"07:00~19:00", price:"무료(전망대 €8)", website:"https://en.wikipedia.org/wiki/Strasbourg_Cathedral"},
  {name:"쁘띠 프랑스", wikiTitle:"Petite France, Strasbourg", type:"문화", desc:"일강변의 목조 가옥들이 동화 속 마을 같은 풍경을 연출하는 유네스코 세계문화유산 지구입니다. 수로를 따라 산책하기 완벽합니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Petite_France,_Strasbourg"},
  {name:"유럽의회", wikiTitle:"European Parliament", type:"도시", desc:"EU 유럽의회 본부로 가이드 투어를 통해 유럽 민주주의의 현장을 체험할 수 있습니다. 현대적 건축물이 인상적입니다.", rating:4.2, openTime:"가이드 투어", price:"무료", website:"https://en.wikipedia.org/wiki/European_Parliament"},
  {name:"크리스마스 마켓", wikiTitle:"Strasbourg_Cathedral", type:"문화", desc:"1570년부터 이어진 유럽에서 가장 오래된 크리스마스 마켓입니다. 뱅쇼, 쿠글로프, 전통 장식품이 겨울 분위기를 가득 채웁니다.", rating:4.8, openTime:"11~12월", price:"무료", website:"https://en.wikipedia.org/wiki/Strasbourg_Christmas_market"},
]},
"앙시": { description:"앙시는 알프스 산기슭의 보석 같은 호수 도시로 프랑스의 베네치아라 불립니다. 투명한 호수와 중세 운하, 파스텔 건물이 동화 같은 풍경을 만들어냅니다.", spots:[
  {name:"앙시 호수", wikiTitle:"Lake Annecy", type:"자연", desc:"유럽에서 가장 깨끗한 호수 중 하나로 알프스를 배경으로 에메랄드빛 물이 펼쳐집니다. 수영, 카약, 패러글라이딩 등을 즐길 수 있습니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Lake_Annecy"},
  {name:"팔레 드 릴(섬의 궁전)", wikiTitle:"Palais de l'Île", type:"역사", desc:"티우강 한가운데 삼각형 모양으로 자리한 12세기 건물로 앙시의 아이콘입니다. 과거 감옥과 법원으로 사용되었습니다.", rating:4.5, openTime:"10:30~18:00", price:"€4", website:"https://en.wikipedia.org/wiki/Palais_de_l%27%C3%8Ele"},
  {name:"앙시 구시가", wikiTitle:"Annecy", type:"문화", desc:"운하를 따라 파스텔 색 건물과 꽃이 가득한 중세 마을입니다. 카페에 앉아 운하를 바라보며 시간을 보내기 좋습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Annecy"},
]},
"툴루즈": { description:"툴루즈는 장밋빛 도시(La Ville Rose)라는 별명의 프랑스 남서부 도시로 에어버스 본사가 위치한 항공우주 산업의 중심지입니다.", spots:[
  {name:"카피톨 광장", wikiTitle:"Place du Capitole", type:"도시", desc:"툴루즈의 중심 광장으로 장밋빛 벽돌 건물이 둘러싸고 있습니다. 시청 건물의 화려한 내부 장식이 볼만합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Place_du_Capitole"},
  {name:"시테 드 레스파스(우주 도시)", wikiTitle:"Cité de l'espace", type:"문화", desc:"에어버스와 아리안 로켓의 고장답게 우주 탐사를 체험할 수 있는 테마파크입니다. 실물 크기 우주정거장 모형이 인상적입니다.", rating:4.5, openTime:"10:00~18:00", price:"€25", website:"https://en.wikipedia.org/wiki/Cité_de_l'espace"},
  {name:"생세르냉 대성당", wikiTitle:"Basilica of Saint-Sernin, Toulouse", type:"역사", desc:"유네스코 세계문화유산으로 유럽 최대의 로마네스크 성당입니다. 산티아고 순례길의 중요한 경유지입니다.", rating:4.5, openTime:"08:30~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Basilica_of_Saint-Sernin,_Toulouse"},
]},

// ────────────────────────── 이탈리아 ──────────────────────────
"로마": { description:"로마는 2,500년 역사의 영원한 도시로 콜로세움, 판테온, 바티칸 등 서양 문명의 핵심 유산이 집약된 곳입니다. 거리 자체가 거대한 야외 박물관입니다.", spots:[
  {name:"콜로세움", wikiTitle:"Colosseum", type:"역사", desc:"서기 80년에 완공된 로마 제국 최대의 원형경기장으로 5만 명을 수용할 수 있었습니다. 세계 7대 불가사의 중 하나인 유네스코 세계문화유산입니다.", rating:4.8, openTime:"09:00~19:00", price:"€18", website:"https://www.colosseo.it"},
  {name:"바티칸 박물관·시스티나 예배당", wikiTitle:"Vatican Museums", type:"문화", desc:"미켈란젤로의 천지창조가 있는 시스티나 예배당을 포함한 세계 최대급 미술 컬렉션입니다. 라파엘로의 아테네 학당도 필수 관람입니다.", rating:4.9, openTime:"08:00~19:00", price:"€17", website:"https://www.museivaticani.va"},
  {name:"판테온", wikiTitle:"Pantheon, Rome", type:"역사", desc:"2,000년 전 로마 시대에 건설된 신전으로 돔 천장의 오쿨루스(구멍)에서 쏟아지는 빛이 신비롭습니다. 입장료가 없어 더욱 매력적입니다.", rating:4.7, openTime:"09:00~19:00", price:"€5", website:"https://en.wikipedia.org/wiki/Pantheon,_Rome"},
  {name:"트레비 분수", wikiTitle:"Trevi Fountain", type:"랜드마크", desc:"바로크 양식의 로마 최대 분수로 동전을 던지면 로마에 다시 돌아온다는 전설이 있습니다. 야경이 특히 로맨틱합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Trevi_Fountain"},
  {name:"트라스테베레", wikiTitle:"Trastevere", type:"음식", desc:"로마에서 가장 매력적인 동네로 좁은 골목에 현지 레스토랑과 바가 밀집해 있습니다. 진정한 로마의 밤 문화를 경험할 수 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Trastevere"},
]},
"베네치아": { description:"베네치아는 118개의 섬을 400여 개의 다리가 연결한 수상 도시로 세상 어디에도 없는 독특한 경관을 자랑합니다. 곤돌라, 산마르코 광장, 무라노 유리가 상징적입니다.", spots:[
  {name:"산마르코 광장", wikiTitle:"St Mark's Square", type:"랜드마크", desc:"나폴레옹이 유럽의 응접실이라 극찬한 베네치아의 중심 광장입니다. 산마르코 대성당, 두칼레 궁전, 종루가 둘러싸고 있습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/St_Mark%27s_Square"},
  {name:"곤돌라 유람", wikiTitle:"Gondola", type:"문화", desc:"베네치아의 상징인 곤돌라를 타고 좁은 수로를 누비는 로맨틱한 경험입니다. 탄식의 다리 아래를 지나가는 코스가 인기입니다.", rating:4.6, openTime:"09:00~19:00", price:"€80(30분)", website:"https://en.wikipedia.org/wiki/Gondola"},
  {name:"리알토 다리", wikiTitle:"Rialto Bridge", type:"역사", desc:"대운하를 가로지르는 베네치아에서 가장 오래된 다리로 셰익스피어의 베니스의 상인 배경입니다. 다리 위 상점에서 기념품을 살 수 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Rialto_Bridge"},
  {name:"부라노 섬", wikiTitle:"Burano", type:"문화", desc:"무지개빛 파스텔 색상의 집들이 늘어선 작은 섬으로 레이스 공예의 전통이 있습니다. 인스타그램 사진 찍기에 완벽한 곳입니다.", rating:4.7, openTime:"24시간", price:"수상버스 요금", website:"https://en.wikipedia.org/wiki/Burano"},
]},
"피렌체": { description:"피렌체는 르네상스 발상지로 미켈란젤로의 다비드상, 우피치 미술관, 두오모가 있는 세계적인 예술 도시입니다. 도시 전체가 유네스코 세계문화유산입니다.", spots:[
  {name:"피렌체 두오모(산타마리아 델 피오레)", wikiTitle:"Florence Cathedral", type:"역사", desc:"브루넬레스키가 설계한 거대한 붉은 돔이 피렌체 스카이라인을 지배합니다. 463개 계단을 올라가면 도시 전체를 조망할 수 있습니다.", rating:4.8, openTime:"10:00~17:00", price:"돔 €30", website:"https://www.duomo.firenze.it"},
  {name:"우피치 미술관", wikiTitle:"Uffizi Gallery", type:"문화", desc:"보티첼리의 비너스의 탄생, 레오나르도 다빈치 작품 등 르네상스 걸작을 소장한 세계적 미술관입니다.", rating:4.8, openTime:"08:15~18:50", price:"€25", website:"https://www.uffizi.it"},
  {name:"베키오 다리(폰테 베키오)", wikiTitle:"Ponte Vecchio", type:"랜드마크", desc:"아르노강 위 보석상들이 늘어선 중세 다리로 피렌체의 상징입니다. 석양 때 강변에서 바라보는 풍경이 특히 로맨틱합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Ponte_Vecchio"},
  {name:"미켈란젤로 광장", wikiTitle:"Piazzale Michelangelo", type:"랜드마크", desc:"피렌체 남쪽 언덕 위 광장으로 두오모와 아르노강이 한눈에 보이는 최고의 전망대입니다. 석양 때 방문하면 잊을 수 없는 풍경입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Piazzale_Michelangelo"},
]},
"밀라노": { description:"밀라노는 이탈리아의 패션과 디자인의 수도로 두오모 대성당, 최후의 만찬 벽화, 세계적인 쇼핑 거리가 유명합니다. 세련되고 모던한 이탈리아를 대표합니다.", spots:[
  {name:"밀라노 두오모", wikiTitle:"Milan Cathedral", type:"역사", desc:"600년에 걸쳐 완성된 세계 최대의 고딕 성당으로 지붕 위에 올라가면 밀라노 시내와 알프스를 조망할 수 있습니다.", rating:4.8, openTime:"09:00~19:00", price:"€5~€16(옥상)", website:"https://www.duomomilano.it"},
  {name:"최후의 만찬(산타마리아 델레 그라치에)", wikiTitle:"The Last Supper (Leonardo da Vinci)", type:"문화", desc:"레오나르도 다빈치의 걸작 벽화를 직접 볼 수 있는 세계문화유산입니다. 사전 예약 필수이며 15분만 관람할 수 있습니다.", rating:4.9, openTime:"08:15~18:45", price:"€15", website:"https://en.wikipedia.org/wiki/The_Last_Supper_(Leonardo_da_Vinci)"},
  {name:"갈레리아 비토리오 에마누엘레 2세", wikiTitle:"Galleria Vittorio Emanuele II", type:"도시", desc:"1877년에 완공된 세계에서 가장 오래된 쇼핑몰로 화려한 유리 천장과 모자이크 바닥이 인상적입니다. 프라다, 루이비통 등 명품 브랜드가 입점해 있습니다.", rating:4.6, openTime:"10:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Galleria_Vittorio_Emanuele_II"},
  {name:"나빌리 운하", wikiTitle:"Navigli", type:"도시", desc:"밀라노의 운하 지구로 아페리티보(저녁 전 음료) 문화를 즐기기 완벽합니다. 빈티지 숍과 갤러리가 밀집한 트렌디한 동네입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Navigli"},
]},
"나폴리": { description:"나폴리는 피자의 발상지이자 베수비오 화산과 폼페이 유적의 관문 도시입니다. 카오틱하지만 열정적인 남이탈리아의 매력이 넘치는 곳입니다.", spots:[
  {name:"나폴리 역사지구", wikiTitle:"Historic centre of Naples", type:"역사", desc:"유네스코 세계문화유산으로 2,800년 역사의 골목길이 살아있는 도시입니다. 스파카나폴리 거리의 활기가 나폴리의 정수입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Historic_centre_of_Naples"},
  {name:"나폴리 피자", wikiTitle:"Neapolitan pizza", type:"음식", desc:"세계 피자의 원조 나폴리에서 진정한 마르게리타를 맛보는 경험은 필수입니다. 다 미켈레, 소르빌로 등 전설적인 피자집이 즐비합니다.", rating:4.8, openTime:"11:00~23:00", price:"약 €5~10", website:"https://en.wikipedia.org/wiki/Neapolitan_pizza"},
  {name:"산타 루치아 해안", wikiTitle:"Santa Lucia, Naples", type:"자연", desc:"나폴리만과 베수비오 화산을 한눈에 바라볼 수 있는 해안 산책로입니다. 달걀성(카스텔 델로보)이 바다 위에 떠 있는 듯합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Santa_Lucia,_Naples"},
  {name:"나폴리 지하 도시", wikiTitle:"Napoli Sotterranea", type:"역사", desc:"나폴리 지하 40m에 숨겨진 그리스-로마 시대 터널과 수로입니다. 2차 대전 때 방공호로 사용된 역사도 있습니다.", rating:4.5, openTime:"10:00~18:00", price:"€12", website:"https://en.wikipedia.org/wiki/Napoli_Sotterranea"},
]},
"아말피": { description:"아말피 해안은 절벽을 따라 형형색색 건물들이 매달려 있는 세계에서 가장 아름다운 해안 도로입니다. 유네스코 세계문화유산으로 이탈리아 남부 여행의 하이라이트입니다.", spots:[
  {name:"포지타노", wikiTitle:"Positano", type:"도시", desc:"절벽에 파스텔 색 건물이 계단식으로 늘어선 아말피 해안의 보석입니다. 좁은 골목과 부티크, 해변이 어우러진 낭만적인 마을입니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Positano"},
  {name:"라벨로", wikiTitle:"Ravello", type:"자연", desc:"해발 350m 절벽 위의 마을로 빌라 루폴로와 빌라 침브로네의 정원 테라스에서 바라보는 해안 전경이 환상적입니다.", rating:4.6, openTime:"09:00~20:00", price:"빌라 입장 €7~", website:"https://en.wikipedia.org/wiki/Ravello"},
  {name:"아말피 대성당", wikiTitle:"Amalfi Cathedral", type:"역사", desc:"9세기에 건설된 아랍-노르만 양식의 대성당으로 화려한 파사드와 천국의 회랑이 인상적입니다. 62개 계단 위에 장엄하게 서 있습니다.", rating:4.5, openTime:"09:00~19:00", price:"€3", website:"https://en.wikipedia.org/wiki/Amalfi_Cathedral"},
  {name:"신들의 길(센티에로 데이 데이)", wikiTitle:"Path of the Gods", type:"자연", desc:"아말피 해안 절벽을 따라 걷는 7.8km 하이킹 코스로 지중해와 해안 마을의 절경을 감상합니다. 세계 최고의 해안 트레킹 중 하나입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Path_of_the_Gods"},
]},
"시칠리아": { description:"시칠리아는 지중해 최대의 섬으로 그리스, 아랍, 노르만 문화가 혼합된 독특한 문화유산과 에트나 화산, 아름다운 해변이 매력입니다.", spots:[
  {name:"에트나 화산", wikiTitle:"Mount Etna", type:"자연", desc:"유럽 최대의 활화산으로 높이 3,357m입니다. 케이블카와 4WD로 분화구 근처까지 올라가 용암 지대를 체험할 수 있습니다.", rating:4.7, openTime:"투어 시간 상이", price:"투어 €60~", website:"https://en.wikipedia.org/wiki/Mount_Etna"},
  {name:"아그리젠토 신전의 계곡", wikiTitle:"Valle dei Templi", type:"역사", desc:"기원전 5세기 그리스 신전 유적으로 유네스코 세계문화유산입니다. 특히 콘코르디아 신전의 보존 상태가 뛰어납니다.", rating:4.7, openTime:"08:30~20:00", price:"€12", website:"https://en.wikipedia.org/wiki/Valle_dei_Templi"},
  {name:"타오르미나", wikiTitle:"Taormina", type:"도시", desc:"에트나 화산과 이오니아해를 동시에 바라보는 절벽 위 마을입니다. 고대 그리스 극장에서 바라보는 전망이 숨이 멎을 정도입니다.", rating:4.6, openTime:"09:00~19:00", price:"극장 €10", website:"https://en.wikipedia.org/wiki/Taormina"},
  {name:"팔레르모 시장(발라로)", wikiTitle:"Ballarò", type:"음식", desc:"팔레르모의 활기 넘치는 전통시장으로 시칠리아 길거리 음식의 천국입니다. 아란치니(주먹밥), 판넬레(병아리콩 튀김)가 명물입니다.", rating:4.4, openTime:"07:00~20:00", price:"무료", website:"https://en.wikipedia.org/wiki/Ballar%C3%B2"},
]},
"친퀘테레": { description:"친퀘테레는 리구리아 해안 절벽에 자리한 5개의 알록달록한 어촌 마을로 유네스코 세계문화유산입니다. 하이킹 트레일로 연결된 마을들 사이의 절경이 매력입니다.", spots:[
  {name:"마나롤라", wikiTitle:"Manarola", type:"도시", desc:"친퀘테레에서 가장 포토제닉한 마을로 절벽 위 색색의 건물과 바다가 어우러진 풍경이 엽서 같습니다. 석양 때가 특히 아름답습니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Manarola"},
  {name:"베르나차", wikiTitle:"Vernazza", type:"도시", desc:"아름다운 항구가 있는 친퀘테레의 보석으로 성채에서 바라보는 전경이 장관입니다. 마을 식당에서 먹는 해산물 파스타가 일품입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Vernazza"},
  {name:"센티에로 아주로(파란 길)", wikiTitle:"Cinque Terre", type:"자연", desc:"5개 마을을 연결하는 해안 절벽 하이킹 코스로 지중해의 절경을 감상하며 걸을 수 있습니다. 세계적으로 유명한 트레킹 코스입니다.", rating:4.7, openTime:"일출~일몰", price:"친퀘테레 카드 €16", website:"https://en.wikipedia.org/wiki/Cinque_Terre"},
  {name:"리오마조레", wikiTitle:"Riomaggiore", type:"도시", desc:"친퀘테레 최남단 마을로 좁은 골목과 색색의 건물이 절벽을 따라 이어집니다. 사랑의 길(비아 델라모레)의 시작점이기도 합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Riomaggiore"},
]},
"볼로냐": { description:"볼로냐는 유럽에서 가장 오래된 대학 도시이자 이탈리아 미식의 수도로 볼로네제 라구, 토르텔리니, 모르타델라의 본고장입니다.", spots:[
  {name:"볼로냐 두 탑", wikiTitle:"Two Towers (Bologna)", type:"역사", desc:"12세기에 건설된 아시넬리 탑(97m)과 가리센다 탑으로 볼로냐의 상징입니다. 498계단을 올라가면 시내 전체를 조망합니다.", rating:4.5, openTime:"09:30~19:30", price:"€5", website:"https://en.wikipedia.org/wiki/Two_Towers_(Bologna)"},
  {name:"산 페트로니오 대성당", wikiTitle:"Basilica of San Petronio", type:"역사", desc:"세계에서 6번째로 큰 성당으로 미완성의 파사드가 독특합니다. 내부의 거대한 일영계가 볼거리입니다.", rating:4.4, openTime:"07:45~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Basilica_of_San_Petronio"},
  {name:"메르카토 디 메초(중앙시장)", wikiTitle:"Bologna", type:"음식", desc:"볼로냐의 중앙 시장으로 파르미지아노 레자노, 프로슈토, 수제 파스타 등 에밀리아로마냐 특산물을 맛볼 수 있습니다.", rating:4.6, openTime:"07:00~24:00", price:"무료", website:"https://en.wikipedia.org/wiki/Bologna"},
  {name:"포르티코(아치 회랑)", wikiTitle:"Porticoes of Bologna", type:"문화", desc:"시내 전체 62km에 걸친 아치형 회랑으로 유네스코 세계문화유산입니다. 비 오는 날에도 우산 없이 도시를 산책할 수 있습니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Porticoes_of_Bologna"},
]},
"시에나": { description:"시에나는 토스카나 언덕 위의 중세 도시로 조개껍데기 모양의 캄포 광장과 팔리오 경마 축제로 유명합니다. 피렌체와 라이벌이었던 독립 도시국가의 자부심이 느껴집니다.", spots:[
  {name:"캄포 광장(피아차 델 캄포)", wikiTitle:"Piazza del Campo", type:"역사", desc:"세계에서 가장 아름다운 광장 중 하나로 조개껍데기 모양의 독특한 형태입니다. 매년 여름 팔리오 경마가 이곳에서 열립니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Piazza_del_Campo"},
  {name:"시에나 두오모", wikiTitle:"Siena Cathedral", type:"역사", desc:"이탈리아 고딕 건축의 걸작으로 흑백 줄무늬 대리석 외관이 독특합니다. 내부의 니콜라 피사노 설교단과 모자이크 바닥이 화려합니다.", rating:4.7, openTime:"10:30~18:00", price:"€6~€15", website:"https://en.wikipedia.org/wiki/Siena_Cathedral"},
  {name:"만자 탑", wikiTitle:"Torre del Mangia", type:"랜드마크", desc:"캄포 광장의 시청 건물에 솟아있는 높이 102m의 탑으로 시에나와 토스카나 전원을 360도로 조망합니다. 400계단을 올라가야 합니다.", rating:4.5, openTime:"10:00~19:00", price:"€10", website:"https://en.wikipedia.org/wiki/Torre_del_Mangia"},
]},
"폼페이": { description:"폼페이는 서기 79년 베수비오 화산 폭발로 순식간에 매몰된 고대 로마 도시입니다. 약 2,000년간 화산재 아래 보존된 도시 전체가 발굴되어 고대 생활상을 생생하게 전합니다.", spots:[
  {name:"폼페이 유적지", wikiTitle:"Pompeii", type:"역사", desc:"화산재 속에 보존된 고대 로마 도시 유적으로 유네스코 세계문화유산입니다. 도로, 주택, 목욕탕, 원형극장 등이 그대로 남아있습니다.", rating:4.8, openTime:"09:00~19:00", price:"€18", website:"https://www.pompeiisites.org"},
  {name:"비너스의 집", wikiTitle:"Pompeii", type:"역사", desc:"부유한 로마인의 저택으로 화려한 벽화와 모자이크가 당시 상류층 생활을 보여줍니다. 정원에서 베수비오 화산이 보입니다.", rating:4.5, openTime:"유적지 입장 시", price:"포함", website:"https://pompeiisites.org"},
  {name:"폼페이 원형극장", wikiTitle:"Amphitheatre of Pompeii", type:"역사", desc:"현존하는 가장 오래된 석조 원형극장 중 하나로 약 2만 명을 수용했습니다. 콜로세움보다 앞서 지어진 역사적 건축물입니다.", rating:4.4, openTime:"유적지 입장 시", price:"포함", website:"https://en.wikipedia.org/wiki/Amphitheatre_of_Pompeii"},
  {name:"베수비오 화산", wikiTitle:"Mount Vesuvius", type:"자연", desc:"폼페이를 멸망시킨 활화산으로 분화구까지 하이킹할 수 있습니다. 정상에서 나폴리만과 폼페이 유적을 한눈에 조망합니다.", rating:4.6, openTime:"09:00~16:00", price:"€10", website:"https://en.wikipedia.org/wiki/Mount_Vesuvius"},
]},

// ────────────────────────── 스페인 ──────────────────────────
"바르셀로나": { description:"바르셀로나는 가우디의 건축과 지중해 해변, 카탈루냐 문화가 어우러진 스페인 제2의 도시입니다. 사그라다 파밀리아부터 람블라스 거리까지 예술이 살아 숨쉽니다.", spots:[
  {name:"사그라다 파밀리아", wikiTitle:"Sagrada Família", type:"랜드마크", desc:"가우디가 1882년부터 착공한 미완성 대성당으로 자연에서 영감받은 독창적 건축이 압도적입니다. 2026년 완공 예정인 세계문화유산입니다.", rating:4.9, openTime:"09:00~20:00", price:"€26", website:"https://sagradafamilia.org"},
  {name:"구엘 공원", wikiTitle:"Park Güell", type:"문화", desc:"가우디가 설계한 동화 같은 공원으로 모자이크 도마뱀과 물결 벤치가 유명합니다. 바르셀로나 시내를 한눈에 조망할 수 있습니다.", rating:4.6, openTime:"09:30~19:30", price:"€10", website:"https://parkguell.barcelona"},
  {name:"람블라스 거리", wikiTitle:"La Rambla", type:"도시", desc:"바르셀로나의 중심 보행자 거리로 꽃시장, 거리 공연, 카페가 즐비합니다. 끝에 있는 보케리아 시장의 먹거리가 환상적입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/La_Rambla,_Barcelona"},
  {name:"고딕 지구", wikiTitle:"Barri Gòtic", type:"역사", desc:"2,000년 역사의 로마 시대 유적부터 중세 건축까지 남아있는 구시가입니다. 미로 같은 골목에 숨겨진 광장과 카페가 매력적입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Barri_G%C3%B2tic"},
]},
"마드리드": { description:"마드리드는 스페인의 수도로 프라도 미술관, 왕궁, 활기찬 밤문화가 매력적인 도시입니다. 유럽에서 가장 늦게까지 깨어있는 도시로 에너지가 넘칩니다.", spots:[
  {name:"프라도 미술관", wikiTitle:"Museo del Prado", type:"문화", desc:"벨라스케스, 고야, 엘 그레코 등 스페인 거장들의 걸작을 소장한 세계 3대 미술관입니다. 8,000점 이상의 회화가 전시됩니다.", rating:4.8, openTime:"10:00~20:00", price:"€15", website:"https://www.museodelprado.es"},
  {name:"마드리드 왕궁", wikiTitle:"Royal Palace of Madrid", type:"역사", desc:"유럽에서 가장 큰 왕궁 중 하나로 3,418개의 방이 있습니다. 화려한 왕좌의 방과 무기 박물관이 볼거리입니다.", rating:4.6, openTime:"10:00~20:00", price:"€14", website:"https://en.wikipedia.org/wiki/Royal_Palace_of_Madrid"},
  {name:"레티로 공원", wikiTitle:"Buen Retiro Park", type:"자연", desc:"마드리드 중심부의 거대한 공원으로 수정궁(팔라시오 데 크리스탈)과 보트 호수가 있습니다. 현지인들의 주말 휴식 공간입니다.", rating:4.5, openTime:"06:00~24:00", price:"무료", website:"https://en.wikipedia.org/wiki/Buen_Retiro_Park"},
  {name:"산미겔 시장", wikiTitle:"Mercado de San Miguel", type:"음식", desc:"아름다운 철골 구조의 미식 시장으로 타파스, 하몽, 와인 등 스페인 미식을 한곳에서 즐길 수 있습니다.", rating:4.4, openTime:"10:00~24:00", price:"무료", website:"https://en.wikipedia.org/wiki/Mercado_de_San_Miguel"},
]},
"세비야": { description:"세비야는 플라멩코와 투우의 도시로 스페인 남부 안달루시아의 수도입니다. 화려한 무데하르 양식 건축과 열정적인 축제 문화가 매력적입니다.", spots:[
  {name:"알카사르 궁전", wikiTitle:"Alcázar of Seville", type:"역사", desc:"무어-기독교 양식이 혼합된 화려한 왕궁으로 유네스코 세계문화유산입니다. 드라마 왕좌의 게임 촬영지로도 유명합니다.", rating:4.8, openTime:"09:30~19:00", price:"€14.50", website:"https://en.wikipedia.org/wiki/Alcázar_of_Seville"},
  {name:"세비야 대성당·히랄다 탑", wikiTitle:"Seville Cathedral", type:"역사", desc:"세계 최대의 고딕 성당으로 콜럼버스의 무덤이 있습니다. 히랄다 탑에 올라가면 세비야 전체를 조망할 수 있습니다.", rating:4.7, openTime:"10:45~18:00", price:"€11", website:"https://en.wikipedia.org/wiki/Seville_Cathedral"},
  {name:"스페인 광장(플라사 데 에스파냐)", wikiTitle:"Plaza de España, Seville", type:"랜드마크", desc:"1929년 만국박람회를 위해 건설된 반원형 광장으로 스페인 각 지방을 표현한 타일 장식이 화려합니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Plaza_de_Espa%C3%B1a,_Seville"},
  {name:"트리아나 지구", wikiTitle:"Triana, Seville", type:"문화", desc:"플라멩코의 발상지로 과달키비르강 건너편의 전통 지구입니다. 도자기 공방, 타파스 바, 플라멩코 공연장이 밀집해 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Triana,_Seville"},
]},
"그라나다": { description:"그라나다는 이슬람 건축의 최고 걸작 알함브라 궁전이 있는 도시로 시에라네바다 산맥을 배경으로 무어 문화와 기독교 문화가 조화를 이룹니다.", spots:[
  {name:"알함브라 궁전", wikiTitle:"Alhambra", type:"역사", desc:"무어 왕조의 마지막 보루로 정교한 아라베스크 장식과 아름다운 정원이 감탄을 자아냅니다. 유네스코 세계문화유산으로 사전 예약 필수입니다.", rating:4.9, openTime:"08:30~20:00", price:"€14", website:"https://www.alhambra-patronato.es"},
  {name:"알바이신 지구", wikiTitle:"Albaicín", type:"문화", desc:"무어 시대의 좁은 골목과 하얀 집들이 미로처럼 이어진 세계문화유산 지구입니다. 산니콜라스 전망대에서 알함브라 야경이 최고입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Albaic%C3%ADn"},
  {name:"그라나다 대성당·왕실 예배당", wikiTitle:"Royal Chapel of Granada", type:"역사", desc:"이사벨 여왕과 페르난도 왕의 안장지로 스페인 레콘키스타의 역사를 전합니다. 르네상스 양식의 대성당도 인상적입니다.", rating:4.5, openTime:"10:00~18:30", price:"€5", website:"https://en.wikipedia.org/wiki/Royal_Chapel_of_Granada"},
  {name:"사크로몬테 동굴 플라멩코", wikiTitle:"Sacromonte", type:"문화", desc:"히타노(집시) 문화의 중심지로 동굴 안에서 펼쳐지는 원초적인 플라멩코 공연이 압도적입니다. 그라나다 방문의 하이라이트입니다.", rating:4.6, openTime:"공연 21:00~", price:"€25~35", website:"https://en.wikipedia.org/wiki/Sacromonte"},
]},
"발렌시아": { description:"발렌시아는 스페인 동부 지중해안의 도시로 파에야의 발상지이자 미래 도시 예술과학도시가 유명합니다. 전통과 현대가 조화로운 매력적인 도시입니다.", spots:[
  {name:"예술과학도시", wikiTitle:"City of Arts and Sciences", type:"랜드마크", desc:"칼라트라바가 설계한 미래적 건축 단지로 수족관, 과학관, 오페라하우스가 있습니다. 물에 비친 건물의 반영이 SF 영화 같습니다.", rating:4.7, openTime:"10:00~21:00", price:"시설별 상이", website:"https://www.cac.es"},
  {name:"발렌시아 중앙시장", wikiTitle:"Mercado Central, Valencia", type:"음식", desc:"아르누보 건축의 유럽 최대 생시장 중 하나로 신선한 해산물과 과일이 가득합니다. 현지에서 파에야 재료를 맛보기 좋습니다.", rating:4.5, openTime:"07:30~15:00", price:"무료", website:"https://en.wikipedia.org/wiki/Mercado_Central,_Valencia"},
  {name:"라 로하(실크 거래소)", wikiTitle:"Llotja de la Seda", type:"역사", desc:"15세기 고딕 양식의 실크 거래소로 유네스코 세계문화유산입니다. 나선형 기둥이 야자수 숲 같은 분위기를 연출합니다.", rating:4.5, openTime:"10:00~19:00", price:"€2", website:"https://en.wikipedia.org/wiki/Llotja_de_la_Seda"},
]},
"빌바오": { description:"빌바오는 바스크 지방의 중심 도시로 구겐하임 미술관으로 도시 재생에 성공한 대표 사례입니다. 바스크 미식 문화와 독특한 정체성이 매력적입니다.", spots:[
  {name:"구겐하임 미술관 빌바오", wikiTitle:"Guggenheim Museum Bilbao", type:"문화", desc:"프랭크 게리가 설계한 티타늄 외벽의 건축물로 건물 자체가 예술 작품입니다. 제프 쿤스의 강아지 화분 조각이 상징적입니다.", rating:4.7, openTime:"10:00~20:00", price:"€16", website:"https://www.guggenheim-bilbao.eus"},
  {name:"카스코 비에호(구시가)", wikiTitle:"Bilbao", type:"문화", desc:"7개의 골목으로 이루어진 빌바오의 구시가로 핀초스 바가 밀집해 있습니다. 바스크 미식 문화를 제대로 경험할 수 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Bilbao"},
  {name:"비스카야 다리", wikiTitle:"Vizcaya Bridge", type:"역사", desc:"세계 최초의 운반 다리로 유네스코 세계문화유산입니다. 곤돌라를 타고 강을 건너는 독특한 경험을 할 수 있습니다.", rating:4.3, openTime:"10:00~20:00", price:"€10(전망대)", website:"https://en.wikipedia.org/wiki/Vizcaya_Bridge"},
]},
"말라가": { description:"말라가는 코스타델솔의 중심 도시이자 피카소의 고향으로 햇살 가득한 지중해 해변과 풍부한 문화가 매력적입니다.", spots:[
  {name:"피카소 미술관", wikiTitle:"Museo Picasso Málaga", type:"문화", desc:"파블로 피카소의 고향에 자리한 미술관으로 285점의 작품을 소장하고 있습니다. 16세기 궁전을 개조한 건물도 아름답습니다.", rating:4.5, openTime:"10:00~19:00", price:"€12", website:"https://en.wikipedia.org/wiki/Museo_Picasso_Málaga"},
  {name:"알카사바", wikiTitle:"Alcazaba of Málaga", type:"역사", desc:"11세기 무어 시대의 요새로 말라가 항구와 시내를 조망할 수 있습니다. 아름다운 정원과 분수가 이슬람 건축의 매력을 전합니다.", rating:4.4, openTime:"09:00~20:00", price:"€3.50", website:"https://en.wikipedia.org/wiki/Alcazaba_of_M%C3%A1laga"},
  {name:"말라가 해변(말라게타)", wikiTitle:"Málaga", type:"자연", desc:"도심에서 걸어갈 수 있는 아름다운 해변으로 연중 따뜻한 날씨를 즐길 수 있습니다. 해변 치링기토(바)에서 생선구이가 명물입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/M%C3%A1laga"},
]},
"톨레도": { description:"톨레도는 세 종교(기독교, 이슬람, 유대교)가 공존했던 도시로 도시 전체가 유네스코 세계문화유산입니다. 타호강에 둘러싸인 언덕 위 중세 도시의 풍경이 장관입니다.", spots:[
  {name:"톨레도 대성당", wikiTitle:"Toledo Cathedral", type:"역사", desc:"스페인 고딕 건축의 걸작으로 엘 그레코의 작품들이 소장되어 있습니다. 화려한 성물실과 투명문이 인상적입니다.", rating:4.7, openTime:"10:00~18:00", price:"€12.50", website:"https://en.wikipedia.org/wiki/Toledo_Cathedral"},
  {name:"알카사르", wikiTitle:"Alcázar of Toledo", type:"역사", desc:"톨레도 최고 지점에 자리한 요새로 로마 시대부터 사용되었습니다. 현재는 군사 박물관으로 톨레도의 파노라마 전망을 제공합니다.", rating:4.4, openTime:"10:00~17:00", price:"€5", website:"https://en.wikipedia.org/wiki/Alc%C3%A1zar_of_Toledo"},
  {name:"산토 토메 교회(엘 그레코)", wikiTitle:"Iglesia de Santo Tomé", type:"문화", desc:"엘 그레코의 대표작 오르가스 백작의 매장이 있는 교회입니다. 마니에리즘 회화의 걸작을 직접 감상할 수 있습니다.", rating:4.5, openTime:"10:00~18:45", price:"€3", website:"https://en.wikipedia.org/wiki/Iglesia_de_Santo_Tom%C3%A9,_Toledo"},
]},
"산티아고데콤포스텔라": { description:"산티아고데콤포스텔라는 카미노(순례길)의 최종 목적지로 세계 3대 기독교 성지 중 하나입니다. 중세 순례 도시의 분위기가 그대로 남아있습니다.", spots:[
  {name:"산티아고 대성당", wikiTitle:"Cathedral of Santiago de Compostela", type:"역사", desc:"사도 야고보의 유해가 모셔진 성당으로 순례자들의 최종 목적지입니다. 보타푸메이로(거대한 향로)가 흔들리는 미사가 감동적입니다.", rating:4.8, openTime:"07:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Cathedral_of_Santiago_de_Compostela"},
  {name:"오브라도이로 광장", wikiTitle:"Praza do Obradoiro", type:"문화", desc:"대성당 앞 광장으로 800km 카미노를 완주한 순례자들이 도착하는 감동의 장소입니다. 다양한 건축 양식의 건물이 둘러싸고 있습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Praza_do_Obradoiro"},
  {name:"구시가 산책", wikiTitle:"Santiago de Compostela", type:"문화", desc:"화강암 건물과 좁은 골목이 중세 분위기를 자아내는 유네스코 세계문화유산 구시가입니다. 풀포(문어요리)와 알바리뇨 와인이 명물입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Santiago_de_Compostela"},
]},

// ────────────────────────── 독일 ──────────────────────────
"베를린": { description:"베를린은 독일의 수도로 분단과 통일의 역사, 활기찬 현대 예술과 밤문화가 공존하는 도시입니다. 자유로운 분위기와 다양한 문화가 유럽에서 가장 창의적인 도시를 만듭니다.", spots:[
  {name:"브란덴부르크 문", wikiTitle:"Brandenburg Gate", type:"역사", desc:"독일 통일의 상징인 신고전주의 양식의 문으로 베를린의 아이콘입니다. 동서 베를린을 나누었던 역사적 현장입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://www.visitberlin.de"},
  {name:"베를린 장벽 기념관·이스트사이드 갤러리", wikiTitle:"East Side Gallery", type:"역사", desc:"베를린 장벽의 잔존 구간에 세계 각국 예술가들이 그린 벽화가 1.3km에 걸쳐 있습니다. 형제의 키스 등 유명한 작품이 많습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/East_Side_Gallery"},
  {name:"박물관 섬", wikiTitle:"Museum Island", type:"문화", desc:"슈프레강 섬 위 5개 세계적 박물관이 모인 유네스코 세계문화유산입니다. 네페르티티 흉상이 있는 신박물관이 특히 유명합니다.", rating:4.7, openTime:"10:00~18:00", price:"€21(통합)", website:"https://www.smb.museum"},
  {name:"홀로코스트 추모비", wikiTitle:"Memorial to the Murdered Jews of Europe", type:"역사", desc:"2,711개의 콘크리트 블록이 파도처럼 늘어선 추모 공간으로 나치 학살의 역사를 기억합니다. 지하 정보센터도 방문할 수 있습니다.", rating:4.6, openTime:"24시간(추모비)", price:"무료", website:"https://en.wikipedia.org/wiki/Memorial_to_the_Murdered_Jews_of_Europe"},
]},
"뮌헨": { description:"뮌헨은 바이에른 주의 수도로 옥토버페스트, 맥주 문화, 알프스 근접성으로 유명합니다. 독일 특유의 전통과 현대적 세련됨이 조화로운 도시입니다.", spots:[
  {name:"마리엔 광장·신시청사", wikiTitle:"Marienplatz", type:"랜드마크", desc:"뮌헨의 중심 광장으로 신고딕 양식의 신시청사와 매일 11시에 작동하는 글로켄슈필(시계탑 인형극)이 유명합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Marienplatz"},
  {name:"호프브로이하우스", wikiTitle:"Hofbräuhaus am Platzl", type:"음식", desc:"1589년에 설립된 세계에서 가장 유명한 맥주홀입니다. 1리터 맥주잔과 전통 바이에른 음악, 학센(족발) 요리가 명물입니다.", rating:4.5, openTime:"09:00~23:30", price:"맥주 약 €12", website:"https://en.wikipedia.org/wiki/Hofbräuhaus_am_Platzl"},
  {name:"님펜부르크 궁전", wikiTitle:"Nymphenburg Palace", type:"역사", desc:"바이에른 왕가의 여름 별궁으로 화려한 바로크 건축과 광대한 정원이 아름답습니다. 루트비히 2세의 출생지이기도 합니다.", rating:4.5, openTime:"09:00~18:00", price:"€8", website:"https://en.wikipedia.org/wiki/Nymphenburg_Palace"},
  {name:"잉글리셔 가르텐", wikiTitle:"English Garden, Munich", type:"자연", desc:"센트럴 파크보다 큰 뮌헨 시내 공원으로 아이스바흐 서핑이 명물입니다. 맥주 정원에서 밤나무 아래 맥주를 즐깁니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/English_Garden,_Munich"},
]},
"함부르크": { description:"함부르크는 독일 최대의 항구 도시로 엘베강변의 창고 지구와 미니어처 원더랜드, 활기찬 레퍼반 밤문화가 유명합니다.", spots:[
  {name:"미니어처 원더랜드", wikiTitle:"Miniatur Wunderland", type:"문화", desc:"세계 최대의 모형 철도 전시관으로 정교하게 재현된 도시와 풍경이 감탄을 자아냅니다. 어린이와 성인 모두에게 인기입니다.", rating:4.8, openTime:"08:00~21:00", price:"€20", website:"https://en.wikipedia.org/wiki/Miniatur_Wunderland"},
  {name:"슈파이히어슈타트(창고 지구)", wikiTitle:"Speicherstadt", type:"역사", desc:"세계 최대의 벽돌 창고 단지로 유네스코 세계문화유산입니다. 운하를 따라 늘어선 붉은 벽돌 건물의 야경이 로맨틱합니다.", rating:4.5, openTime:"24시간(외관)", price:"무료", website:"https://en.wikipedia.org/wiki/Speicherstadt"},
  {name:"엘프필하모니", wikiTitle:"Elbphilharmonie", type:"문화", desc:"파도 모양의 유리 건축이 인상적인 세계적 콘서트 홀입니다. 무료 전망 플라자에서 항구와 도시 전경을 감상할 수 있습니다.", rating:4.6, openTime:"플라자 09:00~24:00", price:"플라자 무료", website:"https://en.wikipedia.org/wiki/Elbphilharmonie"},
]},
"로텐부르크": { description:"로텐부르크는 독일 로맨틱 가도의 보석으로 중세 성벽과 목조 건물이 완벽하게 보존된 동화 같은 마을입니다. 크리스마스 장식의 본고장이기도 합니다.", spots:[
  {name:"중세 성벽 산책", wikiTitle:"Rothenburg ob der Tauber", type:"역사", desc:"완벽하게 보존된 중세 성벽 위를 걸으며 마을 전체를 조망할 수 있습니다. 성문과 탑이 중세 시대로 시간여행을 하는 느낌을 줍니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Rothenburg_ob_der_Tauber"},
  {name:"마르크트 광장", wikiTitle:"Rothenburg ob der Tauber", type:"문화", desc:"시청사와 마이스터트룽크(명주잔) 시계가 있는 로텐부르크의 중심 광장입니다. 슈네발렌(눈덩이 과자)을 맛보세요.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Rothenburg_ob_der_Tauber"},
  {name:"케테 볼파르트 크리스마스 박물관", wikiTitle:"Käthe Wohlfahrt", type:"문화", desc:"1년 내내 크리스마스 장식을 판매하는 상점이자 박물관입니다. 독일 전통 크리스마스 문화를 체험할 수 있는 독특한 곳입니다.", rating:4.4, openTime:"09:00~18:00", price:"€5(박물관)", website:"https://en.wikipedia.org/wiki/K%C3%A4the_Wohlfahrt"},
]},
"프랑크푸르트": { description:"프랑크푸르트는 유럽의 금융 중심지이자 괴테의 고향으로 현대적 스카이라인과 전통 사과주 문화가 공존합니다.", spots:[
  {name:"뢰머베르크 광장", wikiTitle:"Römerberg", type:"역사", desc:"프랑크푸르트 구시가의 중심 광장으로 15세기 목조 건물들이 재건되어 있습니다. 크리스마스 마켓이 특히 유명합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/R%C3%B6merberg"},
  {name:"마인타워 전망대", wikiTitle:"Main Tower", type:"랜드마크", desc:"높이 200m의 전망대에서 프랑크푸르트 스카이라인과 마인강을 한눈에 조망합니다. 마인해튼이라 불리는 도시의 진면목을 봅니다.", rating:4.3, openTime:"10:00~21:00", price:"€9", website:"https://en.wikipedia.org/wiki/Main_Tower"},
  {name:"작센하우젠 사과주 지구", wikiTitle:"Sachsenhausen", type:"음식", desc:"마인강 남쪽의 전통 지구로 프랑크푸르트 명물 사과주(아펠바인)와 그뤼네 조세(허브소스) 요리를 즐길 수 있습니다.", rating:4.4, openTime:"17:00~01:00", price:"무료", website:"https://en.wikipedia.org/wiki/Sachsenhausen_(Frankfurt_am_Main)"},
]},
"쾰른": { description:"쾰른은 독일 서부의 대도시로 장엄한 쾰른 대성당과 카니발 축제, 쾰시 맥주 문화가 유명합니다. 라인강변의 매력적인 도시입니다.", spots:[
  {name:"쾰른 대성당", wikiTitle:"Cologne Cathedral", type:"역사", desc:"높이 157m의 쌍둥이 첨탑이 인상적인 고딕 성당으로 유네스코 세계문화유산입니다. 533개 계단을 올라가면 라인강과 시내를 조망합니다.", rating:4.8, openTime:"06:00~21:00", price:"무료(탑 €6)", website:"https://www.koelner-dom.de"},
  {name:"호엔촐레른 다리", wikiTitle:"Hohenzollern Bridge", type:"랜드마크", desc:"쾰른 대성당 옆 라인강을 가로지르는 다리로 수만 개의 사랑의 자물쇠가 걸려 있습니다. 대성당과 함께 사진 찍기 좋은 포인트입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Hohenzollern_Bridge"},
  {name:"쾰시 맥주 양조장", wikiTitle:"Kölsch (beer)", type:"음식", desc:"쾰른의 전통 맥주 쾰시를 200ml 작은 잔에 마시는 독특한 문화를 체험합니다. 빈 잔 위에 코스터를 올려놓아야 멈춥니다.", rating:4.4, openTime:"11:00~24:00", price:"쾰시 약 €2", website:"https://en.wikipedia.org/wiki/K%C3%B6lsch_(beer)"},
]},
"드레스덴": { description:"드레스덴은 엘베의 피렌체라 불리는 바로크 건축의 보고로 2차 대전 폭격에서 복원된 감동적인 역사를 가진 도시입니다.", spots:[
  {name:"프라우엔 교회", wikiTitle:"Dresden Frauenkirche", type:"역사", desc:"2차 대전 폭격으로 파괴된 후 시민들의 힘으로 재건된 바로크 성당입니다. 돔에 올라가면 드레스덴 전경을 볼 수 있습니다.", rating:4.7, openTime:"10:00~18:00", price:"무료(돔 €8)", website:"https://en.wikipedia.org/wiki/Dresden_Frauenkirche"},
  {name:"츠빙거 궁전", wikiTitle:"Zwinger (Dresden)", type:"문화", desc:"바로크 건축의 걸작으로 내부에 라파엘로의 시스티나 마돈나를 소장한 미술관이 있습니다. 분수 정원이 아름답습니다.", rating:4.6, openTime:"10:00~18:00", price:"€14", website:"https://www.der-dresdner-zwinger.de"},
  {name:"군주의 행렬 벽화", wikiTitle:"Fürstenzug", type:"역사", desc:"25,000장의 마이센 도자기 타일로 만든 102m 길이의 벽화입니다. 작센의 역대 군주들이 행진하는 장면을 묘사합니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/F%C3%BCrstenzug"},
]},
"하이델베르크": { description:"하이델베르크는 독일에서 가장 오래된 대학 도시로 네카어강변의 로맨틱한 성과 구시가가 시인과 철학자들의 사랑을 받은 곳입니다.", spots:[
  {name:"하이델베르크 성", wikiTitle:"Heidelberg Castle", type:"역사", desc:"13세기에 건설되어 전쟁으로 일부 폐허가 된 성으로 낭만적 폐허의 아름다움이 독특합니다. 세계 최대 와인통(22만 리터)이 있습니다.", rating:4.6, openTime:"08:00~18:00", price:"€9", website:"https://www.schloss-heidelberg.de"},
  {name:"철학자의 길", wikiTitle:"Philosophenweg", type:"자연", desc:"네카어강 건너편 산책로로 하이델베르크 성과 구시가, 강의 전경이 한눈에 들어옵니다. 헤겔과 마크 트웨인이 걸었던 길입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Philosophenweg"},
  {name:"구시가(하우프트슈트라세)", wikiTitle:"Heidelberg", type:"문화", desc:"1.6km의 보행자 거리로 바로크와 르네상스 건축이 즐비합니다. 대학교 학생감옥과 성령교회도 볼만합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Heidelberg"},
]},
"퓌센": { description:"퓌센은 바이에른 알프스 산기슭의 마을로 디즈니 성의 모델이 된 노이슈반슈타인 성이 있습니다. 로맨틱 가도의 남쪽 끝점이기도 합니다.", spots:[
  {name:"노이슈반슈타인 성", wikiTitle:"Neuschwanstein Castle", type:"역사", desc:"루트비히 2세가 건설한 동화 같은 성으로 디즈니 잠자는 숲속의 미녀 성의 모델입니다. 알프스를 배경으로 한 풍경이 환상적입니다.", rating:4.8, openTime:"09:00~18:00", price:"€15", website:"https://www.neuschwanstein.de"},
  {name:"호엔슈방가우 성", wikiTitle:"Hohenschwangau Castle", type:"역사", desc:"노이슈반슈타인 성 맞은편의 노란색 성으로 루트비히 2세가 어린 시절을 보낸 곳입니다. 두 성을 함께 방문하기 좋습니다.", rating:4.4, openTime:"09:00~18:00", price:"€21", website:"https://en.wikipedia.org/wiki/Hohenschwangau_Castle"},
  {name:"마리엔 다리", wikiTitle:"Marienbrücke", type:"자연", desc:"협곡 위 다리에서 노이슈반슈타인 성을 정면으로 바라보는 최고의 포토 스팟입니다. 엽서에 나오는 그 각도의 사진을 찍을 수 있습니다.", rating:4.6, openTime:"24시간(날씨에 따라)", price:"무료", website:"https://en.wikipedia.org/wiki/Marienbrücke"},
]},

// ────────────────────────── 영국 ──────────────────────────
"런던": { description:"런던은 세계 문화와 금융의 수도로 빅벤, 버킹엄 궁전, 대영박물관 등 수많은 아이콘이 있는 도시입니다. 2,000년 역사와 최신 트렌드가 공존합니다.", spots:[
  {name:"대영박물관", wikiTitle:"British Museum", type:"문화", desc:"세계 최대급 박물관으로 로제타석, 이집트 미라, 파르테논 조각 등 800만 점의 소장품을 보유합니다. 입장 무료로 인류 문명의 보고입니다.", rating:4.8, openTime:"10:00~17:00", price:"무료", website:"https://www.britishmuseum.org"},
  {name:"버킹엄 궁전", wikiTitle:"Buckingham Palace", type:"역사", desc:"영국 왕실의 공식 거주지로 근위병 교대식이 유명합니다. 여름에는 왕궁 내부 투어도 가능합니다.", rating:4.5, openTime:"교대식 11:00", price:"내부 투어 £33", website:"https://www.rct.uk/visit/buckingham-palace"},
  {name:"타워 브릿지", wikiTitle:"Tower Bridge", type:"랜드마크", desc:"1894년 완공된 런던의 상징으로 개폐식 다리의 유리 통로에서 템즈강을 내려다볼 수 있습니다. 야경이 특히 인상적입니다.", rating:4.6, openTime:"09:30~18:00", price:"£12.30", website:"https://en.wikipedia.org/wiki/Tower_Bridge"},
  {name:"웨스트민스터 궁전(빅벤)", wikiTitle:"Palace of Westminster", type:"역사", desc:"영국 국회의사당으로 빅벤이라 불리는 시계탑이 런던의 아이콘입니다. 템즈강변에서 바라보는 야경이 장엄합니다.", rating:4.7, openTime:"외관 24시간", price:"무료(외관)", website:"https://en.wikipedia.org/wiki/Palace_of_Westminster"},
  {name:"보로 마켓", wikiTitle:"Borough Market", type:"음식", desc:"1,000년 역사의 런던 최고 식재료 시장으로 세계 각국의 미식을 맛볼 수 있습니다. 토요일이 가장 활기찹니다.", rating:4.5, openTime:"10:00~17:00", price:"무료", website:"https://boroughmarket.org.uk"},
]},
"에든버러": { description:"에든버러는 스코틀랜드의 수도로 중세 올드타운과 조지안 양식의 뉴타운이 유네스코 세계문화유산입니다. 에든버러 성과 프린지 페스티벌이 유명합니다.", spots:[
  {name:"에든버러 성", wikiTitle:"Edinburgh Castle", type:"역사", desc:"캐슬록 위에 자리한 스코틀랜드의 상징으로 매일 오후 1시에 대포가 발사됩니다. 스코틀랜드 왕관 보석을 볼 수 있습니다.", rating:4.7, openTime:"09:30~18:00", price:"£19.50", website:"https://www.edinburghcastle.scot"},
  {name:"로열 마일", wikiTitle:"Royal Mile", type:"문화", desc:"에든버러 성에서 홀리루드 궁전까지 이어지는 1.6km의 역사적 거리입니다. 위스키 박물관, 세인트 자일스 대성당이 줄지어 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Royal_Mile"},
  {name:"아서스 시트", wikiTitle:"Arthur's Seat", type:"자연", desc:"시내 한가운데 251m 사화산 봉우리로 에든버러 전체와 포스만을 조망합니다. 30~45분 등반으로 최고의 전망을 얻습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Arthur%27s_Seat"},
  {name:"스카치 위스키 체험관", wikiTitle:"Scotch Whisky Experience", type:"문화", desc:"스코틀랜드 위스키 제조 과정을 배우고 시음하는 체험관입니다. 세계 최대의 위스키 컬렉션을 볼 수 있습니다.", rating:4.4, openTime:"10:00~18:00", price:"£19~", website:"https://en.wikipedia.org/wiki/Scotch_Whisky_Experience"},
]},
"맨체스터": { description:"맨체스터는 산업혁명의 발상지이자 세계적인 축구 도시입니다. 뮤직 씬, 나이트라이프, 문화 시설이 풍부한 영국 북부의 중심 도시입니다.", spots:[
  {name:"올드 트래포드", wikiTitle:"Old Trafford", type:"랜드마크", desc:"맨체스터 유나이티드의 홈구장으로 꿈의 극장이라 불립니다. 경기일이 아닌 날에도 스타디움 투어가 가능합니다.", rating:4.6, openTime:"투어 09:30~16:30", price:"£29", website:"https://en.wikipedia.org/wiki/Old_Trafford"},
  {name:"노던 쿼터", wikiTitle:"Northern Quarter, Manchester", type:"문화", desc:"빈티지 숍, 독립 카페, 그래피티가 가득한 맨체스터의 힙한 동네입니다. 라이브 음악과 크래프트 맥주 씬이 활발합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Northern_Quarter,_Manchester"},
  {name:"과학산업박물관", wikiTitle:"Science and Industry Museum", type:"문화", desc:"산업혁명의 발상지에서 그 역사를 체험하는 무료 박물관입니다. 세계 최초의 기차역 건물에 자리하고 있습니다.", rating:4.3, openTime:"10:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Science_and_Industry_Museum"},
]},
"바스": { description:"바스는 로마 시대 온천과 조지안 건축의 아름다운 도시로 도시 전체가 유네스코 세계문화유산입니다. 제인 오스틴의 소설 배경으로도 유명합니다.", spots:[
  {name:"로만 바스(로마 온천)", wikiTitle:"Roman Baths (Bath)", type:"역사", desc:"2,000년 전 로마인들이 건설한 온천 시설이 놀랍도록 잘 보존되어 있습니다. 온천수를 직접 맛볼 수 있는 독특한 경험을 제공합니다.", rating:4.7, openTime:"09:00~18:00", price:"£28", website:"https://www.romanbaths.co.uk"},
  {name:"로열 크레센트", wikiTitle:"Royal Crescent", type:"역사", desc:"30개의 집이 반원형으로 이어진 18세기 조지안 건축의 걸작입니다. No.1 Royal Crescent 박물관에서 당시 생활상을 엿봅니다.", rating:4.5, openTime:"외관 24시간", price:"박물관 £12", website:"https://en.wikipedia.org/wiki/Royal_Crescent"},
  {name:"서미스 바스 스파", wikiTitle:"Thermae Bath Spa", type:"자연", desc:"바스의 천연 온천수를 이용한 현대적 스파입니다. 옥상 노천 온천에서 바스 시내를 바라보며 목욕할 수 있습니다.", rating:4.5, openTime:"09:00~21:00", price:"£40~", website:"https://en.wikipedia.org/wiki/Thermae_Bath_Spa"},
]},
"옥스퍼드": { description:"옥스퍼드는 세계에서 가장 오래된 영어권 대학 도시로 꿈 같은 첨탑의 도시라 불립니다. 해리포터 촬영지로도 유명합니다.", spots:[
  {name:"보들리안 도서관", wikiTitle:"Bodleian Library", type:"문화", desc:"1602년 설립된 유럽에서 가장 오래된 도서관 중 하나로 해리포터 촬영지입니다. 디비니티 스쿨의 고딕 천장이 압도적입니다.", rating:4.6, openTime:"투어 시간대", price:"투어 £9~", website:"https://visit.bodleian.ox.ac.uk"},
  {name:"크라이스트 처치 칼리지", wikiTitle:"Christ Church, Oxford", type:"역사", desc:"옥스퍼드에서 가장 유명한 칼리지로 해리포터 그레이트 홀의 모델이 된 식당이 있습니다. 앨리스 인 원더랜드의 영감을 준 곳이기도 합니다.", rating:4.5, openTime:"10:00~17:00", price:"£18", website:"https://www.chch.ox.ac.uk"},
  {name:"래드클리프 카메라", wikiTitle:"Radcliffe Camera", type:"랜드마크", desc:"원형 도서관 건물로 옥스퍼드의 아이콘입니다. 영화와 TV에 수없이 등장한 건물로 주변 광장에서 바라보는 모습이 아름답습니다.", rating:4.4, openTime:"외관만 관람", price:"무료", website:"https://en.wikipedia.org/wiki/Radcliffe_Camera"},
]},
"케임브리지": { description:"케임브리지는 뉴턴, 다윈, 호킹을 배출한 세계적인 대학 도시로 캠강변의 아름다운 칼리지들과 펀팅(뱃놀이)이 매력적입니다.", spots:[
  {name:"킹스 칼리지 채플", wikiTitle:"King's College Chapel, Cambridge", type:"역사", desc:"영국 고딕 건축의 걸작으로 세계 최대의 부채꼴 석조 천장과 루벤스의 동방박사 경배가 있습니다. 캠강변에서 바라보는 전경이 아이코닉합니다.", rating:4.7, openTime:"09:30~15:30", price:"£11", website:"https://www.kings.cam.ac.uk/chapel"},
  {name:"펀팅(캠강 뱃놀이)", wikiTitle:"Punt (boat)", type:"자연", desc:"긴 장대로 캠강을 따라 이동하는 전통 뱃놀이로 칼리지들의 뒷정원을 감상합니다. 케임브리지 방문의 필수 경험입니다.", rating:4.6, openTime:"10:00~일몰", price:"£20~", website:"https://en.wikipedia.org/wiki/Punt_(boat)"},
  {name:"수학의 다리", wikiTitle:"Mathematical Bridge", type:"랜드마크", desc:"퀸즈 칼리지의 목조 다리로 못을 사용하지 않고 수학적 원리로 설계되었다는 전설이 유명합니다.", rating:4.3, openTime:"24시간(외관)", price:"무료", website:"https://en.wikipedia.org/wiki/Mathematical_Bridge"},
]},
"요크": { description:"요크는 바이킹과 중세 역사가 살아 숨쉬는 잉글랜드 북부의 보석입니다. 완벽히 보존된 중세 성벽과 요크 민스터 대성당이 유명합니다.", spots:[
  {name:"요크 민스터", wikiTitle:"York Minster", type:"역사", desc:"북유럽 최대의 고딕 대성당으로 세계 최대 중세 스테인드글라스가 있습니다. 중앙 탑에 올라가면 요크셔 평원이 펼쳐집니다.", rating:4.7, openTime:"09:30~16:30", price:"£16", website:"https://yorkminster.org"},
  {name:"섐블스", wikiTitle:"The Shambles", type:"문화", desc:"해리포터 다이애건 앨리의 영감이 된 중세 골목으로 기울어진 목조 건물이 양쪽에 늘어서 있습니다. 영국에서 가장 사진 찍히는 거리입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/The_Shambles"},
  {name:"요크 성벽 산책", wikiTitle:"York city walls", type:"역사", desc:"영국에서 가장 잘 보존된 3.4km 중세 성벽을 따라 도시를 한 바퀴 걸을 수 있습니다. 약 2시간의 역사 산책입니다.", rating:4.4, openTime:"08:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/York_city_walls"},
]},
"리버풀": { description:"리버풀은 비틀즈의 고향이자 세계적인 축구 도시로 음악과 해양 역사가 풍부한 항구 도시입니다.", spots:[
  {name:"비틀즈 스토리", wikiTitle:"The Beatles Story", type:"문화", desc:"비틀즈의 탄생부터 해체까지를 체험하는 앨버트 독의 박물관입니다. 매튜 스트리트의 캐번 클럽도 함께 방문하세요.", rating:4.5, openTime:"09:00~17:00", price:"£18", website:"https://www.beatlesstory.com"},
  {name:"앨버트 독", wikiTitle:"Albert Dock", type:"역사", desc:"유네스코 세계문화유산 해안가의 재개발 지구로 테이트 리버풀, 해양박물관 등이 있습니다. 레스토랑과 바가 밀집한 활기찬 곳입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Albert_Dock"},
  {name:"안필드", wikiTitle:"Anfield", type:"랜드마크", desc:"리버풀 FC의 홈구장으로 You'll Never Walk Alone이 울려퍼지는 축구 성지입니다. 스타디움 투어에서 선수들의 터널을 걸어봅니다.", rating:4.6, openTime:"투어 시간대", price:"£22", website:"https://en.wikipedia.org/wiki/Anfield"},
]},
"코츠월즈": { description:"코츠월즈는 꿀색 돌로 지어진 마을들이 완만한 구릉에 펼쳐진 영국 시골의 이상향입니다. 전원적인 풍경과 아기자기한 마을이 동화 속에 들어온 듯합니다.", spots:[
  {name:"바이버리", wikiTitle:"Bibury", type:"문화", desc:"윌리엄 모리스가 영국에서 가장 아름다운 마을이라 극찬한 곳입니다. 알링턴 로우의 14세기 석조 코티지가 엽서 같은 풍경입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Bibury"},
  {name:"버턴온더워터", wikiTitle:"Bourton-on-the-Water", type:"문화", desc:"코츠월즈의 베네치아라 불리는 마을로 윈드러시강이 마을 중앙을 흐릅니다. 미니어처 마을과 향수 공장이 인기입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Bourton-on-the-Water"},
  {name:"스토우온더월드", wikiTitle:"Stow-on-the-Wold", type:"문화", desc:"코츠월즈 언덕 꼭대기의 시장 마을로 앤틱 숍과 전통 펍이 매력적입니다. 반지의 제왕 문 모티브가 된 성 에드워드 교회가 유명합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Stow-on-the-Wold"},
]},
"글래스고": { description:"글래스고는 스코틀랜드 최대의 도시로 찰스 레니 매킨토시의 아르누보 건축과 활발한 예술 씬, 세계적 수준의 무료 박물관이 매력적입니다.", spots:[
  {name:"켈빈그로브 미술관·박물관", wikiTitle:"Kelvingrove Art Gallery and Museum", type:"문화", desc:"달리의 십자가의 성 요한의 그리스도 등 8,000점을 전시하는 무료 박물관입니다. 붉은 사암 건물 자체도 아름답습니다.", rating:4.6, openTime:"10:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Kelvingrove_Art_Gallery_and_Museum"},
  {name:"글래스고 대성당", wikiTitle:"Glasgow Cathedral", type:"역사", desc:"스코틀랜드 본토에서 유일하게 종교개혁을 온전히 넘긴 중세 성당입니다. 지하 묘소의 고딕 기둥숲이 인상적입니다.", rating:4.4, openTime:"10:00~16:00", price:"무료", website:"https://en.wikipedia.org/wiki/Glasgow_Cathedral"},
  {name:"네크로폴리스", wikiTitle:"Glasgow Necropolis", type:"역사", desc:"글래스고 대성당 뒤편 언덕의 빅토리안 묘지로 시내를 내려다보는 전망이 좋습니다. 정교한 묘비 조각이 예술적입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Glasgow_Necropolis"},
]},

// ────────────────────────── 미국 ──────────────────────────
"뉴욕": { description:"뉴욕은 세계 문화·금융의 수도로 자유의 여신상, 타임스 스퀘어, 센트럴 파크 등 수많은 아이콘이 있습니다. 끊임없는 에너지와 다양성이 매력인 도시입니다.", spots:[
  {name:"자유의 여신상", wikiTitle:"Statue of Liberty", type:"랜드마크", desc:"1886년 프랑스가 기증한 미국의 상징으로 높이 93m입니다. 리버티섬에서 맨해튼 스카이라인을 바라보는 전망이 감동적입니다.", rating:4.7, openTime:"09:00~17:00", price:"$24(페리 포함)", website:"https://www.nps.gov/stli/"},
  {name:"센트럴 파크", wikiTitle:"Central Park", type:"자연", desc:"맨해튼 한가운데 3.4km² 규모의 도시공원으로 뉴욕 시민들의 휴식처입니다. 보우 브리지, 베데스다 분수 등 영화 속 장소가 곳곳에 있습니다.", rating:4.7, openTime:"06:00~01:00", price:"무료", website:"https://www.centralparknyc.org"},
  {name:"타임스 스퀘어", wikiTitle:"Times Square", type:"도시", desc:"세계에서 가장 화려한 교차로로 거대한 LED 광고판과 브로드웨이 극장가가 있습니다. 밤이면 낮보다 더 밝게 빛나는 곳입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://www.timessquarenyc.org"},
  {name:"메트로폴리탄 미술관", wikiTitle:"Metropolitan Museum of Art", type:"문화", desc:"세계 3대 미술관 중 하나로 200만 점의 소장품을 보유합니다. 이집트 신전부터 현대미술까지 5,000년 인류 예술사를 만날 수 있습니다.", rating:4.8, openTime:"10:00~17:00", price:"$30", website:"https://www.metmuseum.org"},
  {name:"엠파이어 스테이트 빌딩", wikiTitle:"Empire State Building", type:"랜드마크", desc:"1931년 완공된 높이 443m의 아르데코 마천루로 86층 전망대에서 맨해튼 360도 전경을 감상합니다. 영화 수십 편의 촬영지입니다.", rating:4.6, openTime:"10:00~24:00", price:"$44", website:"https://en.wikipedia.org/wiki/Empire_State_Building"},
]},
"로스앤젤레스": { description:"로스앤젤레스는 할리우드와 비벌리힐스, 산타모니카 해변으로 유명한 엔터테인먼트의 수도입니다. 1년 내내 화창한 날씨와 다양한 문화가 매력입니다.", spots:[
  {name:"할리우드 명예의 거리", wikiTitle:"Hollywood Walk of Fame", type:"문화", desc:"2,700개 이상의 별이 인도에 새겨진 할리우드 대로입니다. 차이니즈 시어터의 스타 핸드프린트도 함께 볼 수 있습니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Hollywood_Walk_of_Fame"},
  {name:"산타모니카 피어", wikiTitle:"Santa Monica Pier", type:"자연", desc:"태평양이 펼쳐진 해변의 유서 깊은 부두로 놀이공원과 수족관이 있습니다. 루트66의 종착지로 석양이 특히 아름답습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Santa_Monica_Pier"},
  {name:"게티 센터", wikiTitle:"Getty Center", type:"문화", desc:"리처드 마이어가 설계한 미술관으로 반 고흐, 모네 등의 작품을 무료로 관람합니다. LA 전경을 조망하는 정원이 아름답습니다.", rating:4.7, openTime:"10:00~17:30", price:"무료(주차 $20)", website:"https://en.wikipedia.org/wiki/Getty_Center"},
  {name:"그리피스 천문대", wikiTitle:"Griffith Observatory", type:"랜드마크", desc:"할리우드 사인과 LA 시내를 한눈에 바라보는 무료 천문대입니다. 영화 라라랜드 촬영지로 야경이 로맨틱합니다.", rating:4.6, openTime:"12:00~22:00", price:"무료", website:"https://griffithobservatory.org"},
]},
"샌프란시스코": { description:"샌프란시스코는 금문교, 케이블카, 가파른 언덕으로 유명한 서부 해안의 보석입니다. 실리콘밸리와 인접한 혁신의 도시이기도 합니다.", spots:[
  {name:"금문교", wikiTitle:"Golden Gate Bridge", type:"랜드마크", desc:"1937년 완공된 길이 2.7km의 현수교로 샌프란시스코의 상징입니다. 안개 속에서 붉은 다리가 드러나는 장면이 영화 같습니다.", rating:4.8, openTime:"24시간", price:"무료(통행료 남행 $9)", website:"https://www.goldengate.org"},
  {name:"피셔맨스 워프·피어 39", wikiTitle:"Fisherman's Wharf, San Francisco", type:"도시", desc:"해안가의 관광 지구로 바다사자 군락과 해산물 레스토랑이 유명합니다. 클램 차우더를 빵 그릇에 담아 먹는 것이 명물입니다.", rating:4.4, openTime:"10:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Fisherman's_Wharf,_San_Francisco"},
  {name:"알카트라즈 섬", wikiTitle:"Alcatraz Island", type:"역사", desc:"악명 높은 연방 교도소가 있던 섬으로 오디오 투어로 탈옥 시도 등의 역사를 생생하게 체험합니다. 반드시 사전 예약 필수입니다.", rating:4.7, openTime:"페리 09:00~16:00", price:"$42", website:"https://en.wikipedia.org/wiki/Alcatraz_Island"},
  {name:"케이블카", wikiTitle:"San Francisco cable car system", type:"문화", desc:"1873년부터 운행 중인 세계 마지막 수동 케이블카 시스템입니다. 급경사 언덕을 오르내리며 도시를 구경하는 것 자체가 관광입니다.", rating:4.5, openTime:"06:30~23:00", price:"$8", website:"https://en.wikipedia.org/wiki/San_Francisco_cable_car_system"},
]},
"라스베이거스": { description:"라스베이거스는 네바다 사막 한가운데 세워진 오락의 도시로 화려한 카지노, 쇼, 레스토랑이 넘칩니다. 그랜드캐니언 여행의 관문이기도 합니다.", spots:[
  {name:"라스베이거스 스트립", wikiTitle:"Las Vegas Strip", type:"도시", desc:"6.8km의 메인 도로에 세계적인 호텔-카지노들이 늘어서 있습니다. 벨라지오 분수 쇼와 네온사인의 밤 풍경이 압도적입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Las_Vegas_Strip"},
  {name:"벨라지오 분수 쇼", wikiTitle:"Fountains of Bellagio", type:"랜드마크", desc:"음악에 맞춰 물줄기가 춤추는 무료 분수 쇼로 라스베이거스의 대표 볼거리입니다. 15~30분 간격으로 공연됩니다.", rating:4.7, openTime:"15:00~24:00", price:"무료", website:"https://en.wikipedia.org/wiki/Fountains_of_Bellagio"},
  {name:"프리몬트 스트리트", wikiTitle:"Fremont Street Experience", type:"문화", desc:"올드 라스베이거스의 메인 거리로 거대한 LED 천장 쇼와 집라인이 명물입니다. 스트립보다 빈티지한 분위기를 즐깁니다.", rating:4.3, openTime:"18:00~02:00(쇼)", price:"무료", website:"https://en.wikipedia.org/wiki/Fremont_Street_Experience"},
]},
"마이애미": { description:"마이애미는 아르데코 건축과 라틴 문화, 아름다운 해변이 어우러진 플로리다의 열대 도시입니다. 사우스 비치의 화려한 나이트라이프가 유명합니다.", spots:[
  {name:"사우스 비치", wikiTitle:"South Beach", type:"자연", desc:"아르데코 건축물이 줄지어 있는 마이애미의 대표 해변입니다. 오션 드라이브의 파스텔 색 건물과 야자수가 열대 분위기를 완성합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/South_Beach"},
  {name:"리틀 하바나", wikiTitle:"Little Havana", type:"문화", desc:"쿠바 이민자들의 커뮤니티로 카예 오초 거리에서 쿠바 커피와 시가를 즐기며 라틴 음악을 듣습니다. 도미노 공원이 명물입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Little_Havana"},
  {name:"아르데코 역사지구", wikiTitle:"Miami Beach Architectural District", type:"문화", desc:"1920~30년대 아르데코 건축물 800여 채가 밀집한 지구입니다. 파스텔 색상의 건물들이 네온사인과 어우러져 독특한 분위기를 연출합니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Miami_Beach_Architectural_District"},
]},
"시카고": { description:"시카고는 미국 건축의 수도로 마천루의 발상지이며 딥디시 피자, 블루스 음악, 미술관으로 유명한 오대호변의 대도시입니다.", spots:[
  {name:"밀레니엄 파크(클라우드 게이트)", wikiTitle:"Cloud Gate", type:"랜드마크", desc:"거울 같은 콩 모양 조각 클라우드 게이트(The Bean)가 있는 시카고의 대표 공원입니다. 시카고 스카이라인이 거울면에 반사됩니다.", rating:4.6, openTime:"06:00~23:00", price:"무료", website:"https://en.wikipedia.org/wiki/Cloud_Gate"},
  {name:"시카고 건축 보트 투어", wikiTitle:"Architecture of Chicago", type:"문화", desc:"시카고강을 따라 유명 건축물을 해설과 함께 감상하는 보트 투어입니다. 세계 최고의 도시 건축 투어로 꼽힙니다.", rating:4.8, openTime:"투어 시간대", price:"$47~", website:"https://en.wikipedia.org/wiki/Architecture_of_Chicago"},
  {name:"시카고 미술관", wikiTitle:"Art Institute of Chicago", type:"문화", desc:"쇠라의 그랑드자트섬의 일요일 오후, 에드워드 호퍼의 나이트호크스 등 걸작을 소장한 세계적 미술관입니다.", rating:4.8, openTime:"11:00~18:00", price:"$35", website:"https://en.wikipedia.org/wiki/Art_Institute_of_Chicago"},
]},
"워싱턴DC": { description:"워싱턴DC는 미국의 수도로 백악관, 링컨 기념관, 스미소니언 박물관군 등 미국 민주주의와 역사의 심장부입니다. 대부분의 박물관이 무료입니다.", spots:[
  {name:"내셔널 몰·링컨 기념관", wikiTitle:"Lincoln Memorial", type:"역사", desc:"링컨 대통령의 거대한 좌상이 있는 기념관으로 마틴 루터 킹의 'I Have a Dream' 연설 장소입니다. 워싱턴 기념탑까지 이어지는 내셔널 몰이 장엄합니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://www.nps.gov/linc/"},
  {name:"스미소니언 자연사 박물관", wikiTitle:"National Museum of Natural History", type:"문화", desc:"호프 다이아몬드와 공룡 화석 등이 전시된 세계 최대 자연사 박물관입니다. 입장 무료로 하루를 보내기 완벽합니다.", rating:4.7, openTime:"10:00~17:30", price:"무료", website:"https://naturalhistory.si.edu"},
  {name:"백악관", wikiTitle:"White House", type:"역사", desc:"미국 대통령의 관저로 외부에서 바라보며 미국 민주주의의 상징을 감상합니다. 사전 신청으로 내부 투어도 가능합니다.", rating:4.3, openTime:"외관 24시간", price:"무료", website:"https://en.wikipedia.org/wiki/White_House"},
]},
"보스턴": { description:"보스턴은 미국 건국 역사의 중심지로 하버드, MIT 등 명문 대학과 자유의 길(프리덤 트레일)이 유명합니다.", spots:[
  {name:"프리덤 트레일", wikiTitle:"Freedom Trail", type:"역사", desc:"보스턴 시내 4km에 걸친 빨간 벽돌 선을 따라 미국 독립혁명의 16개 역사 유적지를 방문합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Freedom_Trail"},
  {name:"하버드 대학교", wikiTitle:"Harvard University", type:"문화", desc:"1636년 설립된 미국 최고(最古)의 대학으로 캠퍼스 투어가 인기입니다. 존 하버드 동상의 왼발을 만지면 행운이 온다는 전설이 있습니다.", rating:4.5, openTime:"캠퍼스 24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Harvard_University"},
  {name:"퀸시 마켓", wikiTitle:"Quincy Market", type:"음식", desc:"1826년에 세워진 역사적 시장으로 뉴잉글랜드 클램 차우더와 랍스터 롤이 명물입니다. 보스턴 미식 여행의 시작점입니다.", rating:4.3, openTime:"10:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Quincy_Market"},
]},
"뉴올리언스": { description:"뉴올리언스는 재즈의 발상지이자 프랑스 식민지 역사, 크리올 문화가 독특한 미국에서 가장 이색적인 도시입니다. 마디그라 축제와 미식이 유명합니다.", spots:[
  {name:"프렌치 쿼터", wikiTitle:"French Quarter", type:"문화", desc:"프랑스 식민지 시대 건축과 재즈 클럽, 레스토랑이 밀집한 뉴올리언스의 심장부입니다. 버번 스트리트의 밤문화가 전설적입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/French_Quarter"},
  {name:"잭슨 광장", wikiTitle:"Jackson Square", type:"역사", desc:"프렌치 쿼터의 중심 광장으로 세인트 루이스 대성당과 거리 예술가들이 특별한 분위기를 만듭니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Jackson_Square_(New_Orleans)"},
  {name:"카페 뒤 몽드", wikiTitle:"Café Du Monde", type:"음식", desc:"1862년부터 영업 중인 뉴올리언스의 상징적 카페로 분말 설탕이 잔뜩 뿌려진 베녜(튀김 도넛)와 치커리 커피가 명물입니다.", rating:4.5, openTime:"24시간", price:"약 $5~", website:"https://en.wikipedia.org/wiki/Café_Du_Monde"},
]},
"시애틀": { description:"시애틀은 스타벅스 1호점과 스페이스 니들, 그런지 음악의 발상지로 태평양 북서부의 문화 중심지입니다. 아마존, 마이크로소프트 등 IT 기업의 본거지이기도 합니다.", spots:[
  {name:"파이크 플레이스 마켓", wikiTitle:"Pike Place Market", type:"음식", desc:"1907년 개장한 미국에서 가장 오래된 공영 시장입니다. 스타벅스 1호점, 껌벽, 생선 던지기 퍼포먼스가 유명합니다.", rating:4.7, openTime:"09:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Pike_Place_Market"},
  {name:"스페이스 니들", wikiTitle:"Space Needle", type:"랜드마크", desc:"1962년 세계박람회를 위해 건설된 시애틀의 상징입니다. 전망대에서 레이니어산과 퓨젯사운드를 조망합니다.", rating:4.5, openTime:"10:00~21:00", price:"$39~", website:"https://en.wikipedia.org/wiki/Space_Needle"},
  {name:"뮤지엄 오브 팝 컬처", wikiTitle:"Museum of Pop Culture", type:"문화", desc:"프랭크 게리가 설계한 독특한 건물에 록 음악, SF, 게임 문화를 전시합니다. 지미 헨드릭스와 너바나의 유품이 있습니다.", rating:4.4, openTime:"10:00~17:00", price:"$32", website:"https://en.wikipedia.org/wiki/Museum_of_Pop_Culture"},
]},
"하와이": { description:"하와이는 태평양의 낙원으로 열대 해변, 화산, 서핑, 훌라 문화가 매력적입니다. 와이키키 해변과 다이아몬드 헤드가 오아후 섬의 대표 명소입니다.", spots:[
  {name:"와이키키 해변", wikiTitle:"Waikiki", type:"자연", desc:"호놀룰루의 대표 해변으로 다이아몬드 헤드를 배경으로 서핑과 수영을 즐깁니다. 석양이 특히 아름다운 세계적 해변입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://www.gohawaii.com"},
  {name:"다이아몬드 헤드", wikiTitle:"Diamond Head", type:"자연", desc:"오아후 섬의 사화산으로 정상까지 약 40분 등반하면 와이키키와 태평양의 절경이 펼쳐집니다. 하와이 필수 트레킹 코스입니다.", rating:4.7, openTime:"06:00~18:00", price:"$5", website:"https://en.wikipedia.org/wiki/Diamond_Head,_Hawaii"},
  {name:"진주만(펄하버)", wikiTitle:"Attack on Pearl Harbor", type:"역사", desc:"1941년 일본의 기습 공격지로 USS 애리조나 기념관에서 침몰한 전함 위를 걸으며 역사를 되새깁니다.", rating:4.6, openTime:"07:00~17:00", price:"무료(예약필수)", website:"https://www.nps.gov/perl/"},
]},
"그랜드캐니언": { description:"그랜드캐니언은 콜로라도강이 20억 년에 걸쳐 만든 지구상에서 가장 장엄한 협곡입니다. 깊이 1,800m, 길이 446km의 압도적 스케일에 누구나 말을 잃습니다.", spots:[
  {name:"사우스 림", wikiTitle:"Grand Canyon", type:"자연", desc:"그랜드캐니언에서 가장 접근성이 좋은 구간으로 수많은 전망대가 있습니다. 일출과 석양 때 협곡의 색이 변하는 모습이 장관입니다.", rating:4.9, openTime:"24시간", price:"차량 $35", website:"https://www.nps.gov/grca/"},
  {name:"브라이트 엔젤 트레일", wikiTitle:"Bright Angel Trail", type:"자연", desc:"사우스 림에서 협곡 바닥까지 내려가는 대표 하이킹 코스입니다. 왕복 약 8시간으로 체력 준비가 필요합니다.", rating:4.7, openTime:"24시간", price:"공원 입장료 포함", website:"https://en.wikipedia.org/wiki/Bright_Angel_Trail"},
  {name:"그랜드캐니언 스카이워크", wikiTitle:"Grand Canyon Skywalk", type:"랜드마크", desc:"협곡 위 유리 바닥 전망대로 발 아래 1,200m 아래가 보이는 스릴 넘치는 경험입니다. 웨스트 림에 위치합니다.", rating:4.3, openTime:"09:00~17:00", price:"$57", website:"https://en.wikipedia.org/wiki/Grand_Canyon_Skywalk"},
]},
"옐로스톤": { description:"옐로스톤은 세계 최초의 국립공원으로 간헐천, 열수 온천, 야생동물이 가득한 지구의 경이입니다. 올드 페이스풀 간헐천이 대표 명소입니다.", spots:[
  {name:"올드 페이스풀 간헐천", wikiTitle:"Old Faithful", type:"자연", desc:"약 90분 간격으로 50m 이상 물기둥을 뿜어내는 세계에서 가장 유명한 간헐천입니다. 자연의 경이로움을 온몸으로 느낍니다.", rating:4.8, openTime:"24시간", price:"차량 $35", website:"https://www.nps.gov/yell/"},
  {name:"그랜드 프리즈매틱 스프링", wikiTitle:"Grand Prismatic Spring", type:"자연", desc:"지름 113m의 미국 최대 열수 온천으로 무지개빛 색상이 초현실적입니다. 주변 전망대에서 내려다보는 모습이 환상적입니다.", rating:4.9, openTime:"24시간", price:"공원 입장료 포함", website:"https://en.wikipedia.org/wiki/Grand_Prismatic_Spring"},
  {name:"옐로스톤 그랜드 캐니언", wikiTitle:"Grand Canyon of the Yellowstone", type:"자연", desc:"옐로스톤강이 만든 협곡과 93m 높이의 로어 폭포가 장관입니다. 아티스트 포인트에서 바라보는 전경이 그림 같습니다.", rating:4.7, openTime:"24시간", price:"공원 입장료 포함", website:"https://en.wikipedia.org/wiki/Grand_Canyon_of_the_Yellowstone"},
]},
"샌디에이고": { description:"샌디에이고는 캘리포니아 최남단의 해변 도시로 연중 온화한 기후와 발보아 파크, 동물원으로 유명합니다.", spots:[
  {name:"샌디에이고 동물원", wikiTitle:"San Diego Zoo", type:"자연", desc:"세계에서 가장 유명한 동물원 중 하나로 4,000마리 이상의 동물을 자연 서식지와 유사한 환경에서 만날 수 있습니다.", rating:4.7, openTime:"09:00~21:00", price:"$69", website:"https://en.wikipedia.org/wiki/San_Diego_Zoo"},
  {name:"발보아 파크", wikiTitle:"Balboa Park", type:"문화", desc:"17개의 박물관과 정원이 있는 거대한 문화공원입니다. 스패니시 리바이벌 건축이 아름답고 무료 공연도 자주 열립니다.", rating:4.6, openTime:"24시간", price:"무료(박물관별)", website:"https://en.wikipedia.org/wiki/Balboa_Park"},
  {name:"코로나도 해변", wikiTitle:"Coronado, California", type:"자연", desc:"금빛 모래가 빛나는 미국 최고의 해변 중 하나입니다. 유서 깊은 호텔 델 코로나도와 함께 이 지역의 상징입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Coronado,_California"},
]},
"덴버": { description:"덴버는 로키산맥 관문 도시로 해발 1,600m의 '마일하이 시티'입니다. 스키 리조트 접근성과 활기찬 예술·음식 문화가 매력입니다.", spots:[
  {name:"록키 마운틴 국립공원", wikiTitle:"Rocky Mountain National Park", type:"자연", desc:"4,000m급 봉우리 72개가 솟은 장엄한 국립공원. 트레일 리지 로드는 세계 최고의 드라이브 코스 중 하나입니다.", rating:4.9, openTime:"24시간", price:"$35(차량)", website:"https://en.wikipedia.org/wiki/Rocky_Mountain_National_Park"},
  {name:"16번가 몰", wikiTitle:"16th Street Mall", type:"도시", desc:"덴버 도심을 가로지르는 보행자 전용 거리. 레스토랑, 쇼핑, 공연이 어우러진 활기찬 공간입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/16th_Street_Mall"},
  {name:"덴버 미술관", wikiTitle:"Denver Art Museum", type:"문화", desc:"다니엘 리베스킨트가 설계한 독특한 외관의 미술관. 아메리카 원주민 예술 컬렉션이 미국 최고 수준입니다.", rating:4.5, openTime:"10:00~17:00", price:"$10~", website:"https://en.wikipedia.org/wiki/Denver_Art_Museum"},
]},
"내슈빌": { description:"내슈빌은 컨트리 음악의 수도로 라이브 음악과 뜨거운 치킨, 버번 위스키로 유명한 테네시의 문화 중심지입니다.", spots:[
  {name:"브로드웨이 혼키 통크 거리", wikiTitle:"Broadway (Nashville)", type:"문화", desc:"24시간 라이브 컨트리 음악이 흘러나오는 술집과 공연장이 빽빽이 들어선 내슈빌의 심장부입니다.", rating:4.5, openTime:"24시간", price:"무료(입장)", website:"https://en.wikipedia.org/wiki/Broadway_(Nashville)"},
  {name:"컨트리 뮤직 명예의 전당", wikiTitle:"Country Music Hall of Fame and Museum", type:"문화", desc:"컨트리 음악의 역사와 전설적인 아티스트들의 유물을 전시하는 세계 최대의 음악 박물관 중 하나입니다.", rating:4.6, openTime:"09:00~17:00", price:"$29.95", website:"https://en.wikipedia.org/wiki/Country_Music_Hall_of_Fame_and_Museum"},
  {name:"그랜드 올 오프리", wikiTitle:"Grand Ole Opry", type:"문화", desc:"1925년 시작된 세계에서 가장 오래된 라이브 컨트리 음악 방송 프로그램으로 지금도 매주 공연이 펼쳐집니다.", rating:4.7, openTime:"공연 시간대", price:"$40~", website:"https://en.wikipedia.org/wiki/Grand_Ole_Opry"},
]},
"포틀랜드": { description:"포틀랜드는 오리건주의 최대 도시로 커피·도넛·독립 서점 문화와 인근 마운트 후드, 컬럼비아 협곡의 자연이 어우러집니다.", spots:[
  {name:"파월스 서점", wikiTitle:"Powell's Books", type:"문화", desc:"전체 블록 한 구역을 차지하는 세계 최대의 독립 서점. 신간과 중고책이 함께 있으며 희귀본 섹션도 유명합니다.", rating:4.7, openTime:"09:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Powell%27s_Books"},
  {name:"컬럼비아 리버 협곡", wikiTitle:"Columbia River Gorge", type:"자연", desc:"멀트노마 폭포(189m)를 포함한 수십 개의 폭포가 있는 장엄한 협곡. 하이킹과 윈드서핑의 성지입니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Columbia_River_Gorge"},
  {name:"파이어니어 코트하우스 스퀘어", wikiTitle:"Pioneer Courthouse Square", type:"도시", desc:"포틀랜드의 거실이라 불리는 중심 광장. 연중 이벤트와 파머스 마켓, 아이스링크 등이 열립니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Pioneer_Courthouse_Square"},
]},
"피닉스": { description:"피닉스는 소노란 사막 한가운데 솟아난 미국 5대 도시로 선인장 숲, 스파 리조트, 세계적인 골프장으로 유명합니다.", spots:[
  {name:"사구아로 국립공원", wikiTitle:"Saguaro National Park", type:"자연", desc:"거대한 사구아로 선인장 숲이 펼쳐지는 국립공원. 일몰 때 붉게 물드는 선인장 실루엣이 장관입니다.", rating:4.7, openTime:"일출~일몰", price:"$25(차량)", website:"https://en.wikipedia.org/wiki/Saguaro_National_Park"},
  {name:"세도나", wikiTitle:"Sedona, Arizona", type:"자연", desc:"붉은 사암 지형이 신비로운 기운을 내뿜는 뉴에이지 성지. 하이킹, 지프 투어, 스파가 인기입니다.", rating:4.8, openTime:"24시간", price:"Red Rock Pass $5~", website:"https://en.wikipedia.org/wiki/Sedona,_Arizona"},
  {name:"데저트 보태니컬 가든", wikiTitle:"Desert Botanical Garden", type:"자연", desc:"소노란 사막의 식물 50,000여 그루를 전시하는 세계 최고의 사막 식물원입니다.", rating:4.5, openTime:"07:00~20:00", price:"$29.95", website:"https://en.wikipedia.org/wiki/Desert_Botanical_Garden"},
]},
"올랜도": { description:"올랜도는 세계 최대의 테마파크 집결지로 월트 디즈니 월드, 유니버설, 씨월드 등이 모여 있는 꿈의 도시입니다.", spots:[
  {name:"월트 디즈니 월드", wikiTitle:"Walt Disney World Resort", type:"문화", desc:"세계 최대의 테마파크 리조트. 매직 킹덤, 엡콧, 할리우드 스튜디오, 애니멀 킹덤 등 4개 파크와 워터파크를 포함합니다.", rating:4.7, openTime:"09:00~22:00", price:"$109~", website:"https://en.wikipedia.org/wiki/Walt_Disney_World_Resort"},
  {name:"유니버설 올랜도", wikiTitle:"Universal Orlando Resort", type:"문화", desc:"해리포터 마법사의 세계와 슈퍼 닌텐도 월드가 있는 테마파크. 아이맥스급 라이드가 인기입니다.", rating:4.6, openTime:"09:00~21:00", price:"$109~", website:"https://en.wikipedia.org/wiki/Universal_Orlando_Resort"},
  {name:"케네디 우주센터", wikiTitle:"Kennedy Space Center", type:"문화", desc:"NASA의 발사 기지에서 실제 우주선과 로켓을 가까이서 볼 수 있습니다. 우주비행사와의 만남 프로그램도 운영합니다.", rating:4.6, openTime:"09:00~18:00", price:"$75", website:"https://en.wikipedia.org/wiki/Kennedy_Space_Center_Visitor_Complex"},
]},
"나이아가라폭포": { description:"나이아가라 폭포는 미국과 캐나다 국경에 걸쳐 있는 세계 3대 폭포로 초당 240만 리터의 물이 떨어지는 장대한 자연의 힘을 느낄 수 있습니다.", spots:[
  {name:"호스슈 폭포", wikiTitle:"Horseshoe Falls", type:"자연", desc:"나이아가라 폭포 중 가장 크고 웅장한 캐나다 측 폭포. '안개 속의 아가씨' 보트 투어에서 폭포 바로 아래까지 접근합니다.", rating:4.9, openTime:"24시간", price:"무료(보트 투어 $30~)", website:"https://en.wikipedia.org/wiki/Horseshoe_Falls"},
  {name:"나이아가라 폭포 야경", wikiTitle:"Niagara Falls", type:"자연", desc:"매일 밤 컬러풀한 조명이 폭포를 물들이는 장관. 카지노 타워 전망대에서 한눈에 조망합니다.", rating:4.8, openTime:"일몰 후", price:"무료", website:"https://en.wikipedia.org/wiki/Niagara_Falls"},
  {name:"나이아가라 온 더 레이크", wikiTitle:"Niagara-on-the-Lake", type:"문화", desc:"폭포에서 20분 거리의 그림 같은 소도시. 와이너리 투어와 쇼 극장이 유명합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Niagara-on-the-Lake"},
]},

// ────────────────────────── 호주 ──────────────────────────
"시드니": { description:"시드니는 호주 최대의 도시로 오페라 하우스와 하버 브릿지, 본다이 해변이 상징적입니다. 아름다운 항구와 현대적 도시가 조화를 이룹니다.", spots:[
  {name:"시드니 오페라 하우스", wikiTitle:"Sydney Opera House", type:"랜드마크", desc:"요른 웃손이 설계한 20세기 건축의 걸작으로 유네스코 세계문화유산입니다. 항구를 배경으로 한 조개껍데기 형태가 아이코닉합니다.", rating:4.8, openTime:"투어 09:00~17:00", price:"투어 A$43", website:"https://www.sydneyoperahouse.com"},
  {name:"시드니 하버 브릿지", wikiTitle:"Sydney Harbour Bridge", type:"랜드마크", desc:"세계에서 가장 넓은 단일 아치 다리로 정상까지 올라가는 브릿지 클라임이 인기입니다. 항구와 오페라 하우스를 내려다봅니다.", rating:4.6, openTime:"24시간", price:"클라임 A$174~", website:"https://www.bridgeclimb.com"},
  {name:"본다이 해변", wikiTitle:"Bondi Beach", type:"자연", desc:"시드니에서 가장 유명한 해변으로 서핑과 수영의 메카입니다. 본다이에서 쿠지까지의 해안 산책로가 절경입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Bondi_Beach"},
  {name:"록스 지구", wikiTitle:"The Rocks, Sydney", type:"문화", desc:"시드니에서 가장 오래된 지구로 영국 식민지 시대 건물과 주말 마켓이 매력적입니다. 펍과 레스토랑이 밀집해 있습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/The_Rocks,_Sydney"},
]},
"멜버른": { description:"멜버른은 호주의 문화 수도로 카페 문화, 그래피티 골목, 스포츠, 예술이 가득한 도시입니다. 세계에서 가장 살기 좋은 도시로 자주 선정됩니다.", spots:[
  {name:"호시어 레인", wikiTitle:"Hosier Lane", type:"문화", desc:"멜버른의 대표 그래피티 골목으로 건물 전체가 거대한 캔버스입니다. 수시로 바뀌는 거리 예술 작품을 감상합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Hosier_Lane"},
  {name:"그레이트 오션 로드", wikiTitle:"Great Ocean Road", type:"자연", desc:"멜버른 근교의 세계적인 해안 드라이브 코스로 12사도 바위가 하이라이트입니다. 절벽과 바다의 장엄한 풍경이 펼쳐집니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Great_Ocean_Road"},
  {name:"퀸 빅토리아 마켓", wikiTitle:"Queen Victoria Market", type:"음식", desc:"1878년부터 운영된 멜버른 최대의 야외 시장입니다. 신선한 식재료, 의류, 기념품까지 다양한 상품이 있습니다.", rating:4.3, openTime:"06:00~15:00", price:"무료", website:"https://en.wikipedia.org/wiki/Queen_Victoria_Market"},
  {name:"멜버른 커피 문화", wikiTitle:"Melbourne", type:"음식", desc:"세계 최고 수준의 카페 문화를 자랑하는 도시로 골목 곳곳에 독립 카페가 숨어 있습니다. 플랫 화이트의 본고장입니다.", rating:4.5, openTime:"07:00~17:00", price:"커피 A$5~", website:"https://en.wikipedia.org/wiki/Melbourne"},
]},
"케언즈": { description:"케언즈는 그레이트 배리어 리프와 데인트리 열대우림의 관문 도시입니다. 두 개의 유네스코 세계유산이 만나는 지구상 유일한 곳입니다.", spots:[
  {name:"그레이트 배리어 리프", wikiTitle:"Great Barrier Reef", type:"자연", desc:"세계 최대의 산호초로 길이 2,300km에 걸쳐 있습니다. 스노클링과 다이빙으로 1,500종의 열대어와 산호를 만날 수 있습니다.", rating:4.9, openTime:"투어 08:00~", price:"투어 A$200~", website:"https://www.gbrmpa.gov.au"},
  {name:"데인트리 열대우림", wikiTitle:"Daintree Rainforest", type:"자연", desc:"1.8억 년 역사의 세계 최고(最古) 열대우림입니다. 크로커다일 리버 크루즈와 정글 트레킹이 인기입니다.", rating:4.7, openTime:"투어 시간대", price:"투어 A$150~", website:"https://en.wikipedia.org/wiki/Daintree_Rainforest"},
  {name:"쿠란다 열대우림 마을", wikiTitle:"Kuranda, Queensland", type:"문화", desc:"스카이레일 곤돌라를 타고 열대우림 위를 날아 도착하는 산악 마을입니다. 나비 정원과 원주민 문화 체험이 있습니다.", rating:4.4, openTime:"09:00~15:00", price:"스카이레일 A$57", website:"https://en.wikipedia.org/wiki/Kuranda,_Queensland"},
]},
"울루루": { description:"울루루(에어즈 록)는 호주 아웃백 한가운데 솟아오른 거대한 사암 단일암으로 원주민 아낭구족의 성지입니다. 일출과 석양에 빛깔이 변하는 모습이 장관입니다.", spots:[
  {name:"울루루", wikiTitle:"Uluru", type:"자연", desc:"높이 348m, 둘레 9.4km의 세계 최대 단일 암석으로 유네스코 세계유산입니다. 시간에 따라 주황색에서 붉은색, 보라색으로 변합니다.", rating:4.9, openTime:"일출 전~일몰", price:"A$38(3일)", website:"https://parksaustralia.gov.au/uluru/"},
  {name:"카타추타(올가스)", wikiTitle:"Kata Tjuta", type:"자연", desc:"울루루에서 25km 떨어진 36개의 거대한 돔 바위군입니다. 바위 사이 바람의 계곡 트레킹이 신비로운 경험입니다.", rating:4.7, openTime:"일출~일몰", price:"울루루 입장권 포함", website:"https://en.wikipedia.org/wiki/Kata_Tjuta"},
  {name:"필드 오브 라이트", wikiTitle:"Field of Light (Uluru)", type:"문화", desc:"5만 개 이상의 LED 꽃이 사막에 펼쳐지는 환상적인 빛 설치 예술입니다. 울루루를 배경으로 별빛과 함께 감상합니다.", rating:4.6, openTime:"일몰 후", price:"A$45~", website:"https://en.wikipedia.org/wiki/Field_of_Light_(Uluru)"},
]},
"브리즈번": { description:"브리즈번은 퀸즈랜드의 수도로 1년 내내 따뜻한 날씨와 사우스뱅크, 론파인 코알라 보호구역이 매력적인 친화적 도시입니다.", spots:[
  {name:"사우스뱅크 파크랜드", wikiTitle:"South Bank Parklands", type:"도시", desc:"브리즈번강변의 문화·레저 공간으로 인공해변과 수영장이 있습니다. 레스토랑과 갤러리가 밀집한 활기찬 지역입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/South_Bank_Parklands"},
  {name:"론파인 코알라 보호구역", wikiTitle:"Lone Pine Koala Sanctuary", type:"자연", desc:"세계 최초·최대의 코알라 보호구역으로 코알라를 안아볼 수 있습니다. 캥거루에게 먹이를 주는 체험도 인기입니다.", rating:4.5, openTime:"09:00~17:00", price:"A$49", website:"https://en.wikipedia.org/wiki/Lone_Pine_Koala_Sanctuary"},
  {name:"스토리 브릿지 클라임", wikiTitle:"Story Bridge", type:"랜드마크", desc:"브리즈번의 상징적 다리를 정상까지 올라가는 모험 투어입니다. 도시와 강의 파노라마 전망이 보상으로 주어집니다.", rating:4.3, openTime:"투어 시간대", price:"A$149~", website:"https://en.wikipedia.org/wiki/Story_Bridge"},
]},
"퍼스": { description:"퍼스는 호주 서해안의 외진 대도시로 아름다운 해변, 와인 산지, 독특한 자연이 매력적입니다. 지중해성 기후로 야외 활동에 완벽합니다.", spots:[
  {name:"로트네스트 섬(쿼카)", wikiTitle:"Rottnest Island", type:"자연", desc:"세계에서 가장 행복한 동물 쿼카를 만날 수 있는 섬입니다. 자전거로 섬을 돌며 아름다운 해변과 스노클링을 즐깁니다.", rating:4.7, openTime:"페리 시간대", price:"페리 A$60~", website:"https://en.wikipedia.org/wiki/Rottnest_Island"},
  {name:"킹스 파크", wikiTitle:"Kings Park, Perth", type:"자연", desc:"퍼스 시내를 내려다보는 거대한 공원으로 서호주 고유 야생화와 보태니컬 가든이 아름답습니다. 전쟁 기념관도 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Kings_Park,_Perth"},
  {name:"피너클스 사막", wikiTitle:"The Pinnacles", type:"자연", desc:"퍼스에서 2시간 거리의 기이한 석회암 기둥군입니다. 마치 외계 행성 같은 풍경이 독특한 포토 스팟입니다.", rating:4.4, openTime:"09:00~17:00", price:"A$15", website:"https://en.wikipedia.org/wiki/The_Pinnacles_(Western_Australia)"},
]},
"골드코스트": { description:"골드코스트는 57km 황금빛 해변과 세계적인 서핑 포인트, 테마파크가 밀집한 호주 최고의 휴양지입니다.", spots:[
  {name:"서퍼스 파라다이스", wikiTitle:"Surfers Paradise, Queensland", type:"자연", desc:"골드코스트의 중심 해변으로 서핑, 수영, 나이트라이프가 어우러집니다. 해변 마켓과 고층 빌딩 스카이라인이 독특합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Surfers_Paradise,_Queensland"},
  {name:"스프링브룩 국립공원", wikiTitle:"Springbrook National Park", type:"자연", desc:"곤드와나 열대우림의 일부로 반딧불이 동굴과 폭포가 있습니다. 내추럴 브릿지의 야간 반딧불이 투어가 환상적입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Springbrook_National_Park"},
  {name:"커럼빈 야생동물 보호구역", wikiTitle:"Currumbin Wildlife Sanctuary", type:"자연", desc:"코알라, 캥거루, 악어 등 호주 토착 동물을 만날 수 있는 보호구역입니다. 로리킷 새떼 먹이주기가 인기 체험입니다.", rating:4.4, openTime:"09:00~16:00", price:"A$55", website:"https://en.wikipedia.org/wiki/Currumbin_Wildlife_Sanctuary"},
]},
"그레이트배리어리프": { description:"그레이트 배리어 리프는 우주에서도 보이는 세계 최대의 산호초 생태계로 2,300km에 걸쳐 있습니다. 다이빙과 스노클링의 성지입니다.", spots:[
  {name:"산호초 스노클링/다이빙", wikiTitle:"Great Barrier Reef", type:"자연", desc:"1,500종의 물고기와 400종의 산호를 만나는 세계 최고의 해양 체험입니다. 초보자도 쉽게 즐길 수 있는 스노클링부터 전문 다이빙까지 가능합니다.", rating:4.9, openTime:"투어 08:00~", price:"A$200~", website:"https://www.gbrmpa.gov.au"},
  {name:"화이트헤이븐 비치", wikiTitle:"Whitehaven Beach", type:"자연", desc:"98% 순도의 실리카 모래로 이루어진 세계에서 가장 아름다운 해변 중 하나입니다. 힐 인렛 전망대에서 바라보는 모래와 바다의 패턴이 환상적입니다.", rating:4.8, openTime:"투어 시간대", price:"투어 A$150~", website:"https://en.wikipedia.org/wiki/Whitehaven_Beach"},
  {name:"헤론 아일랜드", wikiTitle:"Heron Island", type:"자연", desc:"산호초 한가운데 자리한 작은 섬으로 해변에서 바로 스노클링이 가능합니다. 거북이 산란지로도 유명합니다.", rating:4.6, openTime:"리조트 운영 시", price:"숙박 요금 별도", website:"https://en.wikipedia.org/wiki/Heron_Island_(Queensland)"},
]},
"태즈메이니아": { description:"태즈메이니아는 호주 남쪽의 섬으로 때묻지 않은 원시 자연과 미식 문화가 매력적입니다. 세계에서 가장 깨끗한 공기와 물이 있습니다.", spots:[
  {name:"크래들 마운틴", wikiTitle:"Cradle Mountain", type:"자연", desc:"태즈메이니아를 대표하는 산으로 도브 호수에 비친 산의 반영이 아이코닉합니다. 오버랜드 트랙의 출발점이기도 합니다.", rating:4.8, openTime:"일출~일몰", price:"A$28(공원)", website:"https://en.wikipedia.org/wiki/Cradle_Mountain"},
  {name:"호바트 살라망카 마켓", wikiTitle:"Salamanca Market", type:"음식", desc:"매주 토요일 열리는 호바트의 대표 시장으로 태즈메이니아 특산물, 공예품, 굴, 치즈를 즐길 수 있습니다.", rating:4.5, openTime:"토요일 08:30~15:00", price:"무료", website:"https://en.wikipedia.org/wiki/Salamanca_Market"},
  {name:"프레시넷 국립공원(와인글라스 베이)", wikiTitle:"Wineglass Bay", type:"자연", desc:"와인잔 모양의 완벽한 곡선을 가진 해변으로 세계 10대 해변에 선정됩니다. 전망대까지 약 1시간 하이킹 후 보이는 풍경이 보상입니다.", rating:4.7, openTime:"24시간", price:"A$24(공원)", website:"https://en.wikipedia.org/wiki/Wineglass_Bay"},
]},

// ────────────────────────── 태국 ──────────────────────────
"방콕": { description:"방콕은 화려한 왕궁과 사원, 활기찬 길거리 음식, 쇼핑이 어우러진 동남아 최대의 관광 도시입니다. 전통과 현대가 혼재된 카오틱한 매력이 넘칩니다.", spots:[
  {name:"왕궁과 왓프라깨우", wikiTitle:"Grand Palace (Bangkok)", type:"역사", desc:"1782년부터 태국 왕실의 상징인 화려한 궁전과 에메랄드 불상을 모신 사원입니다. 태국 건축 예술의 정수를 보여줍니다.", rating:4.7, openTime:"08:30~15:30", price:"500바트", website:"https://en.wikipedia.org/wiki/Grand_Palace_(Bangkok)"},
  {name:"왓아룬(새벽 사원)", wikiTitle:"Wat Arun", type:"역사", desc:"차오프라야강변에 솟아오른 높이 79m의 탑으로 방콕의 상징입니다. 도자기 조각으로 장식된 탑이 석양에 빛나는 모습이 장관입니다.", rating:4.6, openTime:"08:00~18:00", price:"100바트", website:"https://en.wikipedia.org/wiki/Wat_Arun"},
  {name:"카오산 로드", wikiTitle:"Khaosan Road", type:"도시", desc:"세계 배낭여행자들의 성지로 게스트하우스, 바, 길거리 음식이 가득합니다. 밤이면 클럽과 바의 음악으로 거리가 축제 분위기입니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Khaosan_Road"},
  {name:"짜뚜짝 주말시장", wikiTitle:"Chatuchak weekend market", type:"음식", desc:"세계 최대 규모의 야외 시장으로 15,000개 이상의 점포가 있습니다. 의류, 공예품, 음식, 반려동물까지 없는 것이 없습니다.", rating:4.5, openTime:"토·일 09:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Chatuchak_Weekend_Market"},
]},
"치앙마이": { description:"치앙마이는 태국 북부의 문화 수도로 300개 이상의 사원과 산악 부족 문화, 코끼리 보호구역이 매력적인 도시입니다. 방콕보다 여유롭고 자연 친화적입니다.", spots:[
  {name:"도이수텝 사원", wikiTitle:"Wat Phra That Doi Suthep", type:"역사", desc:"치앙마이를 내려다보는 산 정상의 황금 사원으로 306개 계단(또는 케이블카)을 올라야 합니다. 맑은 날 전망이 장관입니다.", rating:4.6, openTime:"06:00~18:00", price:"30바트", website:"https://en.wikipedia.org/wiki/Wat_Phra_That_Doi_Suthep"},
  {name:"구시가(올드타운)", wikiTitle:"Chiang_Mai_Night_Bazaar", type:"문화", desc:"사각형 해자로 둘러싸인 구시가에 수백 개의 사원이 밀집해 있습니다. 선데이 워킹 스트리트 야시장이 특히 인기입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Chiang_Mai"},
  {name:"코끼리 자연 공원", wikiTitle:"Elephant Nature Park", type:"자연", desc:"구조된 코끼리들을 윤리적으로 돌보는 보호구역입니다. 코끼리에게 먹이를 주고 함께 목욕하는 체험이 감동적입니다.", rating:4.8, openTime:"투어 시간대", price:"약 2,500바트", website:"https://en.wikipedia.org/wiki/Elephant_Nature_Park"},
  {name:"나이트 바자", wikiTitle:"Chiang Mai Night Bazaar", type:"음식", desc:"매일 밤 열리는 야시장으로 수공예품, 의류, 태국 길거리 음식이 가득합니다. 흥정하는 재미가 있습니다.", rating:4.3, openTime:"18:00~24:00", price:"무료", website:"https://en.wikipedia.org/wiki/Chiang_Mai_Night_Bazaar"},
]},
"푸켓": { description:"푸켓은 태국 최대의 섬으로 에메랄드빛 안다만해의 아름다운 해변과 리조트, 나이트라이프로 세계적인 휴양지입니다.", spots:[
  {name:"파통 해변", wikiTitle:"Patong", type:"자연", desc:"푸켓에서 가장 활기찬 해변으로 수상 스포츠와 밤문화의 중심지입니다. 방라로드의 바와 클럽이 밤을 화려하게 수놓습니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Patong"},
  {name:"팡아만(제임스 본드 섬)", wikiTitle:"Phang Nga Bay", type:"자연", desc:"석회암 기둥이 바다 위로 솟아오른 환상적인 풍경의 만입니다. 007 영화 촬영지인 제임스 본드 섬이 하이라이트입니다.", rating:4.7, openTime:"투어 08:00~", price:"투어 약 1,500바트", website:"https://en.wikipedia.org/wiki/Phang_Nga_Bay"},
  {name:"올드 푸켓 타운", wikiTitle:"Phuket", type:"문화", desc:"중국-포르투갈 건축 양식의 컬러풀한 구시가입니다. 카페, 갤러리, 스트리트 아트가 인스타그래머블한 분위기를 만듭니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Phuket_(city)"},
]},
"파타야": { description:"파타야는 방콕에서 2시간 거리의 해변 리조트 도시로 수상 스포츠, 나이트라이프, 가성비 좋은 즐거움이 가득합니다.", spots:[
  {name:"진리의 성소", wikiTitle:"Sanctuary of Truth", type:"문화", desc:"못을 사용하지 않고 나무로만 지어진 높이 105m의 사원 건축물입니다. 정교한 나무 조각이 경이로운 예술 작품입니다.", rating:4.5, openTime:"08:00~18:00", price:"500바트", website:"https://en.wikipedia.org/wiki/Sanctuary_of_Truth"},
  {name:"코란 섬", wikiTitle:"Ko Lan", type:"자연", desc:"파타야 앞바다의 작은 섬으로 맑은 바다에서 스노클링과 수영을 즐깁니다. 파타야보다 훨씬 깨끗한 해변이 매력적입니다.", rating:4.4, openTime:"페리 07:00~18:30", price:"페리 30바트", website:"https://en.wikipedia.org/wiki/Ko_Lan"},
  {name:"워킹 스트리트", wikiTitle:"Pattaya", type:"도시", desc:"파타야의 대표 밤문화 거리로 네온사인과 음악이 넘칩니다. 클럽, 바, 쇼가 끊이지 않는 나이트라이프의 중심지입니다.", rating:4.0, openTime:"18:00~03:00", price:"무료", website:"https://en.wikipedia.org/wiki/Walking_Street,_Pattaya"},
]},
"코사무이": { description:"코사무이는 태국 만의 아름다운 열대 섬으로 고급 리조트와 코코넛 나무 해변, 스쿠버 다이빙이 매력적인 휴양지입니다.", spots:[
  {name:"앙통 국립공원", wikiTitle:"Mu Ko Ang Thong", type:"자연", desc:"42개의 섬으로 이루어진 해양 국립공원으로 카약, 스노클링, 하이킹을 즐깁니다. 에메랄드 라군의 전망이 환상적입니다.", rating:4.6, openTime:"투어 시간대", price:"투어 약 2,000바트", website:"https://en.wikipedia.org/wiki/Mu_Ko_Ang_Thong"},
  {name:"빅부다(왓프라야이)", wikiTitle:"Wat Phra Yai", type:"역사", desc:"코사무이 북동쪽 작은 섬 위에 자리한 높이 12m의 황금 불상입니다. 코사무이의 랜드마크로 바다 전망이 아름답습니다.", rating:4.3, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Wat_Phra_Yai"},
  {name:"차웡 해변", wikiTitle:"Chaweng Beach", type:"자연", desc:"코사무이에서 가장 긴 해변으로 백사장과 맑은 바다가 아름답습니다. 해변을 따라 레스토랑과 바가 줄지어 있습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Chaweng"},
]},
"아유타야": { description:"아유타야는 1350~1767년 시암 왕국의 수도로 웅장한 사원 유적이 도시 곳곳에 남아있는 유네스코 세계문화유산 도시입니다. 방콕에서 당일 여행으로 인기입니다.", spots:[
  {name:"왓마하탓(나무 속 부처)", wikiTitle:"Wat Mahathat (Ayutthaya)", type:"역사", desc:"보리수 나무뿌리에 감싸진 부처 머리가 유명한 사원 유적입니다. 아유타야를 상징하는 사진 포인트로 필수 방문지입니다.", rating:4.6, openTime:"08:00~18:00", price:"50바트", website:"https://en.wikipedia.org/wiki/Wat_Mahathat_(Ayutthaya)"},
  {name:"왓프라시산펫", wikiTitle:"Wat Phra Si Sanphet", type:"역사", desc:"아유타야에서 가장 중요한 왕실 사원으로 세 개의 체디(탑)가 상징적입니다. 방콕 왕궁의 왓프라깨우에 해당하는 사원이었습니다.", rating:4.5, openTime:"08:00~18:00", price:"50바트", website:"https://en.wikipedia.org/wiki/Wat_Phra_Si_Sanphet"},
  {name:"코끼리 타기 체험", wikiTitle:"Ayutthaya", type:"문화", desc:"유적지를 배경으로 코끼리를 타는 전통적인 체험이 가능합니다. 아유타야 시대 왕족들의 이동 수단이었습니다.", rating:4.0, openTime:"09:00~17:00", price:"약 400바트", website:"https://en.wikipedia.org/wiki/Ayutthaya_(city)"},
]},
"크라비": { description:"크라비는 태국 남부 안다만해의 보석으로 석회암 절벽, 에메랄드빛 바다, 맹그로브 숲이 어우러진 자연의 낙원입니다.", spots:[
  {name:"라일레이 해변", wikiTitle:"Railay Beach", type:"자연", desc:"석회암 절벽으로 둘러싸인 보트로만 접근 가능한 해변입니다. 록클라이밍, 카약, 스노클링을 즐기기 최적의 환경입니다.", rating:4.7, openTime:"24시간", price:"무료(보트 약 200바트)", website:"https://en.wikipedia.org/wiki/Railay_Beach"},
  {name:"4개 섬 투어", wikiTitle:"Krabi", type:"자연", desc:"포다 섬, 치킨 섬, 탑 섬, 프라낭 동굴 해변을 하루에 둘러보는 인기 투어입니다. 스노클링과 수영의 천국입니다.", rating:4.5, openTime:"투어 09:00~", price:"약 1,000바트", website:"https://en.wikipedia.org/wiki/Krabi"},
  {name:"타이거 케이브 사원", wikiTitle:"Tiger Cave Temple", type:"역사", desc:"1,237개 계단을 올라가면 정상에서 크라비와 안다만해의 360도 절경을 볼 수 있습니다. 도전적이지만 보상이 큰 곳입니다.", rating:4.5, openTime:"07:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Tiger_Cave_Temple"},
]},
"코피피": { description:"코피피는 영화 더 비치의 촬영지로 유명한 태국의 섬으로 투명한 에메랄드빛 바다와 석회암 절벽이 환상적인 열대 낙원입니다.", spots:[
  {name:"마야 베이", wikiTitle:"Maya Bay", type:"자연", desc:"레오나르도 디카프리오 주연 영화 더 비치의 촬영지로 절벽에 둘러싸인 비밀 해변입니다. 자연 복원 후 다시 개방되어 방문 가능합니다.", rating:4.7, openTime:"10:00~16:00", price:"400바트", website:"https://en.wikipedia.org/wiki/Maya_Bay"},
  {name:"피피 뷰포인트", wikiTitle:"Phi Phi Islands", type:"자연", desc:"피피 돈 섬의 전망대로 양쪽 만과 섬의 좁은 허리 부분을 한눈에 조망합니다. 일출과 석양 때가 가장 아름답습니다.", rating:4.5, openTime:"24시간", price:"30바트", website:"https://en.wikipedia.org/wiki/Phi_Phi_Islands"},
  {name:"스노클링 투어", wikiTitle:"Phi Phi Islands", type:"자연", desc:"피피 레이 섬 주변의 맑은 바다에서 열대어와 산호를 만나는 스노클링입니다. 대절 롱테일 보트로 여러 스팟을 방문합니다.", rating:4.4, openTime:"투어 09:00~", price:"약 800바트", website:"https://en.wikipedia.org/wiki/Phi_Phi_Islands"},
]},

// ────────────────────────── 인도 ──────────────────────────
"뭄바이": { description:"뭄바이는 인도의 경제 수도이자 볼리우드의 본거지로 식민지 건축과 현대적 스카이라인이 공존합니다.", spots:[
  {name:"인도의 문(게이트웨이 오브 인디아)", wikiTitle:"Gateway of India", type:"랜드마크", desc:"1924년 영국 식민지 시대에 건설된 뭄바이의 상징적 아치문입니다. 아라비아해를 바라보며 인도의 역사를 느낍니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Gateway_of_India"},
  {name:"차트라파티 시바지 역", wikiTitle:"Chhatrapati Shivaji Maharaj Terminus", type:"역사", desc:"빅토리안 고딕과 인도 전통 양식이 혼합된 유네스코 세계문화유산 기차역입니다. 현재도 운영 중인 살아있는 유산입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Chhatrapati_Shivaji_Maharaj_Terminus"},
  {name:"엘레판타 동굴", wikiTitle:"Elephanta Caves", type:"역사", desc:"뭄바이 항구의 섬에 자리한 힌두교 석굴 사원으로 7세기 시바 조각이 걸작입니다. 페리를 타고 방문합니다.", rating:4.3, openTime:"09:00~17:30", price:"₹40", website:"https://en.wikipedia.org/wiki/Elephanta_Caves"},
]},
"뉴델리": { description:"뉴델리는 인도의 수도로 무굴 제국의 유산과 영국 식민지 건축, 현대 인도가 공존하는 거대한 도시입니다.", spots:[
  {name:"쿠트브 미나르", wikiTitle:"Qutb Minar", type:"역사", desc:"높이 72.5m의 세계에서 가장 높은 벽돌 첨탑으로 13세기에 건설된 유네스코 세계문화유산입니다.", rating:4.5, openTime:"07:00~17:00", price:"₹35", website:"https://en.wikipedia.org/wiki/Qutb_Minar"},
  {name:"후마윤의 무덤", wikiTitle:"Humayun's tomb", type:"역사", desc:"타지마할의 영감이 된 무굴 건축으로 유네스코 세계문화유산입니다. 대칭적인 정원과 붉은 사암 건축이 아름답습니다.", rating:4.5, openTime:"일출~일몰", price:"₹35", website:"https://en.wikipedia.org/wiki/Humayun%27s_tomb"},
  {name:"레드 포트", wikiTitle:"Red Fort", type:"역사", desc:"무굴 제국의 황궁으로 붉은 사암으로 축조된 거대한 성곽입니다. 매년 독립기념일에 총리가 연설하는 상징적 장소입니다.", rating:4.3, openTime:"09:30~16:30", price:"₹35", website:"https://en.wikipedia.org/wiki/Red_Fort"},
  {name:"찬드니 촉(올드 델리 시장)", wikiTitle:"Chandni Chowk", type:"음식", desc:"17세기부터 이어진 올드 델리의 대표 시장으로 향신료, 직물, 길거리 음식이 가득합니다. 파란타와 챠트가 명물입니다.", rating:4.2, openTime:"09:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Chandni_Chowk"},
]},
"아그라": { description:"아그라는 무굴 제국의 수도였던 도시로 세계 7대 불가사의 중 하나인 타지마할이 있습니다.", spots:[
  {name:"타지마할", wikiTitle:"Taj Mahal", type:"역사", desc:"무굴 황제 샤자한이 사랑하는 아내를 위해 22년간 건설한 대리석 영묘입니다. 세계에서 가장 아름다운 건축물로 칭송됩니다.", rating:4.9, openTime:"일출~일몰(금요일 휴관)", price:"₹1,100(외국인)", website:"https://www.tajmahal.gov.in"},
  {name:"아그라 포트", wikiTitle:"Agra Fort", type:"역사", desc:"타지마할에서 2.5km 떨어진 무굴 황궁으로 유네스코 세계문화유산입니다. 포트에서 바라보는 타지마할 전경이 인상적입니다.", rating:4.5, openTime:"06:00~18:00", price:"₹650(외국인)", website:"https://www.tajmahal.gov.in"},
  {name:"파테푸르 시크리", wikiTitle:"Fatehpur Sikri", type:"역사", desc:"아크바르 대제가 건설한 유령 도시로 유네스코 세계문화유산입니다. 붉은 사암 건축이 완벽하게 보존되어 있습니다.", rating:4.4, openTime:"일출~일몰", price:"₹610(외국인)", website:"https://en.wikipedia.org/wiki/Fatehpur_Sikri"},
]},
"바라나시": { description:"바라나시는 힌두교의 가장 성스러운 도시로 갠지스강변의 가트(계단식 목욕터)와 화장 의식이 삶과 죽음의 순환을 보여줍니다.", spots:[
  {name:"갠지스강 가트", wikiTitle:"Ghats in Varanasi", type:"문화", desc:"84개의 가트에서 힌두교도들이 목욕과 기도를 하는 모습은 인도 문화의 핵심입니다. 일출 때 보트를 타고 감상하는 것을 추천합니다.", rating:4.7, openTime:"24시간", price:"보트 약 ₹300~", website:"https://en.wikipedia.org/wiki/Ghats_in_Varanasi"},
  {name:"갠지스강 아르띠 의식", wikiTitle:"Ganga aarti", type:"문화", desc:"매일 저녁 다샤슈와메드 가트에서 불꽃과 종소리로 갠지스강에 제사를 올리는 장엄한 의식입니다.", rating:4.8, openTime:"매일 저녁 약 18:45", price:"무료", website:"https://en.wikipedia.org/wiki/Ganga_aarti"},
  {name:"사르나트", wikiTitle:"Sarnath", type:"역사", desc:"석가모니가 첫 설법을 한 불교의 4대 성지 중 하나입니다. 다메크 스투파와 고고학 박물관이 있습니다.", rating:4.4, openTime:"일출~일몰", price:"₹25", website:"https://en.wikipedia.org/wiki/Sarnath"},
]},
"고아": { description:"고아는 포르투갈 식민지 역사가 남긴 교회와 열대 해변, 트랜스 음악 씬이 독특한 인도의 해변 휴양지입니다.", spots:[
  {name:"봄 제수스 성당", wikiTitle:"Basilica of Bom Jesus", type:"역사", desc:"성 프란치스코 하비에르의 유해가 안치된 16세기 바로크 성당으로 유네스코 세계문화유산입니다.", rating:4.4, openTime:"09:00~18:30", price:"무료", website:"https://en.wikipedia.org/wiki/Basilica_of_Bom_Jesus"},
  {name:"팔로렘 해변", wikiTitle:"Palolem", type:"자연", desc:"초승달 모양의 아름다운 해변으로 고아에서 가장 인기 있는 해변 중 하나입니다. 카약과 돌핀 투어가 인기입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Palolem"},
  {name:"올드 고아 유적", wikiTitle:"Old Goa", type:"역사", desc:"포르투갈 식민지 시대의 교회와 수도원이 밀집한 유네스코 세계문화유산 지구입니다.", rating:4.3, openTime:"09:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Old_Goa"},
]},
"자이푸르": { description:"자이푸르는 핑크 시티라 불리는 라자스탄의 수도로 화려한 궁전과 요새, 전통 시장이 매력적인 도시입니다.", spots:[
  {name:"암베르 포트", wikiTitle:"Amer Fort", type:"역사", desc:"라자스탄 최고의 요새로 힌두-무굴 건축이 융합된 화려한 궁전입니다. 거울의 방(시쉬 마할)이 특히 아름답습니다.", rating:4.7, openTime:"08:00~17:30", price:"₹500(외국인)", website:"https://en.wikipedia.org/wiki/Amer_Fort"},
  {name:"하와 마할(바람의 궁전)", wikiTitle:"Hawa Mahal", type:"역사", desc:"953개의 작은 창문이 있는 5층 분홍색 궁전으로 자이푸르의 상징입니다. 왕비들이 창문을 통해 거리를 내려다보았습니다.", rating:4.5, openTime:"09:00~17:00", price:"₹200(외국인)", website:"https://en.wikipedia.org/wiki/Hawa_Mahal"},
  {name:"잔타르 만타르(천문대)", wikiTitle:"Jantar Mantar, Jaipur", type:"역사", desc:"18세기에 건설된 세계 최대의 석조 천문관측기구 모음으로 유네스코 세계문화유산입니다.", rating:4.3, openTime:"09:00~17:00", price:"₹200(외국인)", website:"https://en.wikipedia.org/wiki/Jantar_Mantar,_Jaipur"},
]},
"우다이푸르": { description:"우다이푸르는 호수의 도시로 불리며 로맨틱한 궁전과 호수가 어우러진 라자스탄의 보석입니다.", spots:[
  {name:"시티 팰리스", wikiTitle:"City Palace, Udaipur", type:"역사", desc:"피촐라 호수변에 자리한 라자스탄 최대의 궁전 단지입니다. 호수와 도시가 어우러진 전경이 장관입니다.", rating:4.6, openTime:"09:30~17:30", price:"₹300", website:"https://en.wikipedia.org/wiki/City_Palace,_Udaipur"},
  {name:"피촐라 호수", wikiTitle:"Lake Pichola", type:"자연", desc:"호수 한가운데 떠 있는 듯한 레이크 팰리스 호텔이 환상적입니다. 보트를 타고 호수를 유람하는 것이 최고의 경험입니다.", rating:4.5, openTime:"10:00~18:00", price:"보트 약 ₹400~", website:"https://en.wikipedia.org/wiki/Lake_Pichola"},
]},
"콜카타": { description:"콜카타는 인도의 문화 수도로 영국 식민지 시대 건축과 벵골 문화, 마더 테레사의 유산이 있는 도시입니다.", spots:[
  {name:"빅토리아 메모리얼", wikiTitle:"Victoria Memorial, Kolkata", type:"역사", desc:"백색 대리석으로 건설된 영국 식민지 시대의 기념관으로 콜카타의 랜드마크입니다. 아름다운 정원에 둘러싸여 있습니다.", rating:4.4, openTime:"10:00~17:00", price:"₹30", website:"https://en.wikipedia.org/wiki/Victoria_Memorial,_Kolkata"},
  {name:"하우라 다리", wikiTitle:"Howrah Bridge", type:"랜드마크", desc:"후글리강을 가로지르는 캔틸레버 다리로 매일 10만 대의 차량이 통과합니다. 일출 때의 풍경이 포토제닉합니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Howrah_Bridge"},
  {name:"마더 테레사의 집", wikiTitle:"Mother Teresa", type:"문화", desc:"마더 테레사가 설립한 사랑의 선교회 본부로 그녀의 무덤이 있습니다. 겸손한 삶의 흔적에 깊은 감동을 받습니다.", rating:4.5, openTime:"08:00~12:00, 15:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Mother_Teresa"},
]},
"케랄라": { description:"케랄라는 인도의 신의 나라로 불리며 야자수와 백워터(물길), 아유르베다, 향신료 정원이 매력적인 열대 낙원입니다.", spots:[
  {name:"알레피 백워터", wikiTitle:"Alleppey", type:"자연", desc:"야자수에 둘러싸인 수로를 하우스보트로 유람하는 케랄라 최고의 경험입니다. 현지 생활을 가까이서 관찰합니다.", rating:4.7, openTime:"투어 시간대", price:"하우스보트 약 ₹5,000~", website:"https://en.wikipedia.org/wiki/Alleppey"},
  {name:"무나르 차밭", wikiTitle:"Munnar", type:"자연", desc:"해발 1,600m의 고원에 끝없이 펼쳐진 녹차 밭이 장관입니다. 서늘한 기후와 안개 낀 산맥의 풍경이 아름답습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Munnar"},
  {name:"코친 포트", wikiTitle:"Fort Kochi", type:"문화", desc:"포르투갈, 네덜란드, 영국 식민지 역사가 층층이 쌓인 매력적인 해안 마을입니다. 중국식 어망과 유대인 회당이 독특합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Fort_Kochi"},
]},
"암리차르": { description:"암리차르는 시크교의 가장 성스러운 도시로 황금 사원이 있으며, 인도-파키스탄 국경의 화거 의식으로도 유명합니다.", spots:[
  {name:"황금 사원(하리만디르 사히브)", wikiTitle:"Harmandir Sahib", type:"역사", desc:"시크교의 최고 성지로 황금으로 덮인 사원이 인공 호수에 비치는 모습이 장엄합니다. 무료 식당에서 매일 10만 명에게 식사를 제공합니다.", rating:4.9, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Harmandir_Sahib"},
  {name:"화거 국경 의식", wikiTitle:"Wagah", type:"문화", desc:"인도-파키스탄 국경에서 매일 저녁 열리는 국기 하강 의식입니다. 양국 군인들의 퍼포먼스와 관중의 열기가 압도적입니다.", rating:4.6, openTime:"매일 저녁", price:"무료", website:"https://en.wikipedia.org/wiki/Wagah"},
]},

// ────────────────────────── 아랍에미리트·터키·그리스 등 ──────────────────────────
"두바이": { description:"두바이는 사막 위에 세워진 초현대적 도시로 세계 최고층 빌딩 부르즈 할리파와 인공섬, 럭셔리 쇼핑이 상징적입니다.", spots:[
  {name:"부르즈 할리파", wikiTitle:"Burj Khalifa", type:"랜드마크", desc:"높이 828m의 세계 최고층 빌딩으로 148층 전망대에서 두바이 전역을 조망합니다. 매일 저녁 분수 쇼가 인상적입니다.", rating:4.7, openTime:"전망대 10:00~22:00", price:"AED 169~", website:"https://www.burjkhalifa.ae"},
  {name:"두바이 몰", wikiTitle:"Dubai Mall", type:"도시", desc:"세계 최대 쇼핑몰로 1,200개 매장, 수족관, 아이스링크까지 있습니다. 부르즈 할리파 분수 쇼를 바로 앞에서 볼 수 있습니다.", rating:4.5, openTime:"10:00~24:00", price:"무료", website:"https://thedubaimall.com"},
  {name:"올드 두바이(바스타키야)", wikiTitle:"Al Fahidi Historical Neighbourhood", type:"문화", desc:"현대적 두바이와 대비되는 전통 지구로 바르질(풍탑) 건축과 두바이 박물관이 있습니다. 아브라(전통 보트)로 크릭을 건너봅니다.", rating:4.3, openTime:"24시간", price:"아브라 1디르함", website:"https://en.wikipedia.org/wiki/Al_Fahidi_Historical_Neighbourhood"},
  {name:"사막 사파리", wikiTitle:"Dubai", type:"자연", desc:"4WD로 사막 듄 바싱을 즐기고 베두인 캠프에서 낙타 타기, 바비큐, 벨리댄스를 경험합니다. 사막의 석양이 환상적입니다.", rating:4.5, openTime:"오후 투어", price:"AED 200~", website:"https://en.wikipedia.org/wiki/Dubai"},
]},
"아부다비": { description:"아부다비는 UAE의 수도로 셰이크 자이드 모스크와 루브르 아부다비 등 세계적 문화 시설이 매력적인 도시입니다.", spots:[
  {name:"셰이크 자이드 그랜드 모스크", wikiTitle:"Sheikh Zayed Grand Mosque", type:"역사", desc:"세계에서 가장 화려한 모스크 중 하나로 82개의 돔과 세계 최대 수제 카펫이 있습니다. 순백의 대리석이 햇빛에 반짝입니다.", rating:4.9, openTime:"09:00~22:00", price:"무료", website:"https://www.szgmc.gov.ae"},
  {name:"루브르 아부다비", wikiTitle:"Louvre Abu Dhabi", type:"문화", desc:"장 누벨이 설계한 비의 돔 아래 세계 문명의 걸작을 전시하는 미술관입니다. 파리 루브르와의 협력으로 탄생했습니다.", rating:4.7, openTime:"10:00~18:30", price:"AED 63", website:"https://en.wikipedia.org/wiki/Louvre_Abu_Dhabi"},
  {name:"야스 섬", wikiTitle:"Yas Island", type:"도시", desc:"페라리 월드, 야스 워터월드, F1 서킷이 있는 엔터테인먼트 섬입니다. 세계에서 가장 빠른 롤러코스터를 체험합니다.", rating:4.4, openTime:"12:00~20:00", price:"AED 375(페라리월드)", website:"https://en.wikipedia.org/wiki/Yas_Island"},
]},
"샤르자": { description:"샤르자는 UAE의 문화 수도로 이슬람 예술 박물관과 전통 수크(시장)가 매력적인 도시입니다.", spots:[
  {name:"샤르자 이슬람 문명 박물관", wikiTitle:"Sharjah Museum of Islamic Civilization", type:"문화", desc:"5,000점 이상의 이슬람 예술 작품과 유물을 전시하는 박물관입니다. 이슬람 과학과 문화의 황금기를 체험합니다.", rating:4.3, openTime:"08:00~20:00", price:"AED 10", website:"https://en.wikipedia.org/wiki/Sharjah_Museum_of_Islamic_Civilization"},
  {name:"블루 수크(중앙시장)", wikiTitle:"Sharjah", type:"문화", desc:"이슬람 건축의 아름다운 시장으로 금, 보석, 향신료, 전통 공예품을 구입합니다. 파란 타일 장식이 인상적입니다.", rating:4.1, openTime:"09:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Sharjah"},
  {name:"알 노르 섬", wikiTitle:"Sharjah", type:"자연", desc:"코르니체 해안가의 작은 섬으로 나비 정원과 조각 공원이 있습니다. 가족 산책과 사진 촬영에 좋습니다.", rating:4.0, openTime:"09:00~23:00", price:"AED 15", website:"https://en.wikipedia.org/wiki/Sharjah"},
]},
"이스탄불": { description:"이스탄불은 유럽과 아시아가 만나는 세계 유일의 대륙 간 도시로 비잔틴과 오스만 제국의 유산이 켜켜이 쌓여 있습니다.", spots:[
  {name:"아야 소피아", wikiTitle:"Hagia Sophia", type:"역사", desc:"537년 건설된 비잔틴 건축의 걸작으로 성당, 모스크를 거쳐 현재 모스크로 운영 중입니다. 거대한 돔과 모자이크가 압도적입니다.", rating:4.8, openTime:"24시간(예배 시간 제외)", price:"무료", website:"https://en.wikipedia.org/wiki/Hagia_Sophia"},
  {name:"블루 모스크(술탄아흐메트)", wikiTitle:"Blue Mosque", type:"역사", desc:"6개의 미나렛과 2만 장의 이즈닉 푸른 타일로 장식된 오스만 건축의 걸작입니다. 아야 소피아 맞은편에 자리합니다.", rating:4.6, openTime:"예배 시간 외", price:"무료", website:"https://en.wikipedia.org/wiki/Blue_Mosque"},
  {name:"그랜드 바자르", wikiTitle:"Grand Bazaar, Istanbul", type:"문화", desc:"1461년부터 운영된 세계에서 가장 오래되고 큰 실내 시장으로 4,000개 이상의 점포가 있습니다. 카펫, 보석, 향신료 쇼핑의 천국입니다.", rating:4.4, openTime:"08:30~19:00", price:"무료", website:"https://en.wikipedia.org/wiki/Grand_Bazaar,_Istanbul"},
  {name:"보스포루스 해협 크루즈", wikiTitle:"Bosphorus", type:"자연", desc:"유럽과 아시아 사이 해협을 유람하며 궁전, 요새, 해안 마을을 감상합니다. 이스탄불의 진면목을 바다에서 볼 수 있습니다.", rating:4.6, openTime:"투어 시간대", price:"약 25TL~", website:"https://en.wikipedia.org/wiki/Bosphorus"},
]},
"카파도키아": { description:"카파도키아는 수천만 년 화산 활동과 침식이 만든 기이한 바위 지형과 동굴 마을이 있는 초현실적 풍경의 땅입니다. 열기구 투어가 세계적으로 유명합니다.", spots:[
  {name:"열기구 투어", wikiTitle:"Cappadocia", type:"자연", desc:"일출 때 수백 개의 열기구가 동시에 떠오르는 세계에서 가장 유명한 열기구 체험입니다. 버섯 바위와 계곡 위를 날아봅니다.", rating:4.9, openTime:"새벽 투어", price:"약 €200~", website:"https://en.wikipedia.org/wiki/Cappadocia"},
  {name:"괴레메 야외 박물관", wikiTitle:"Göreme National Park", type:"역사", desc:"바위를 깎아 만든 비잔틴 교회와 프레스코 벽화가 보존된 유네스코 세계문화유산입니다. 암굴 교회의 벽화가 인상적입니다.", rating:4.7, openTime:"08:00~19:00", price:"100TL", website:"https://en.wikipedia.org/wiki/G%C3%B6reme_National_Park"},
  {name:"데린쿠유 지하도시", wikiTitle:"Derinkuyu underground city", type:"역사", desc:"지하 8층 깊이의 고대 지하도시로 2만 명이 거주할 수 있었습니다. 미로 같은 통로와 방이 경이롭습니다.", rating:4.5, openTime:"08:00~17:00", price:"60TL", website:"https://en.wikipedia.org/wiki/Derinkuyu_underground_city"},
]},
"파묵칼레": { description:"파묵칼레는 솜의 성이란 뜻의 순백 석회 계단식 온천으로 푸른 온천수가 하얀 석회층 위로 흐르는 초현실적 풍경입니다.", spots:[
  {name:"석회 계단식 온천", wikiTitle:"Pamukkale", type:"자연", desc:"수천 년간 석회질 온천수가 만든 하얀 계단식 지형으로 유네스코 세계유산입니다. 맨발로 온천수를 걸으며 자연의 경이를 체험합니다.", rating:4.7, openTime:"06:30~21:00", price:"200TL", website:"https://en.wikipedia.org/wiki/Pamukkale"},
  {name:"히에라폴리스", wikiTitle:"Hierapolis", type:"역사", desc:"파묵칼레 위의 고대 로마 온천 도시 유적입니다. 원형극장과 네크로폴리스(묘지)가 잘 보존되어 있습니다.", rating:4.4, openTime:"파묵칼레 입장 시", price:"포함", website:"https://en.wikipedia.org/wiki/Hierapolis"},
  {name:"클레오파트라 풀", wikiTitle:"Pamukkale", type:"자연", desc:"고대 로마 기둥이 잠겨있는 35°C 천연 온천 수영장입니다. 클레오파트라가 이곳에서 목욕했다는 전설이 있습니다.", rating:4.3, openTime:"08:00~19:00", price:"추가 130TL", website:"https://en.wikipedia.org/wiki/Pamukkale"},
]},
"안탈리아": { description:"안탈리아는 터키 남부 지중해안의 휴양 도시로 로마 유적, 터키석 빛 바다, 아름다운 해변이 매력적입니다.", spots:[
  {name:"칼레이치(구시가)", wikiTitle:"Kaleiçi", type:"문화", desc:"오스만 시대 목조 건물과 로마 유적이 공존하는 구시가입니다. 좁은 골목에 카페, 부티크 호텔, 기념품 가게가 밀집해 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Kalei%C3%A7i"},
  {name:"뒤덴 폭포", wikiTitle:"Lower Düden Waterfall", type:"자연", desc:"바다 절벽으로 직접 떨어지는 독특한 폭포로 유람선에서 가까이 감상할 수 있습니다. 안탈리아 해안의 하이라이트입니다.", rating:4.4, openTime:"09:00~19:00", price:"6TL", website:"https://en.wikipedia.org/wiki/D%C3%BCden_Waterfalls"},
  {name:"아스펜도스 원형극장", wikiTitle:"Aspendos", type:"역사", desc:"세계에서 가장 잘 보존된 로마 원형극장으로 1만 5천 명을 수용합니다. 현재도 공연이 열릴 만큼 음향이 뛰어납니다.", rating:4.6, openTime:"08:00~19:00", price:"100TL", website:"https://en.wikipedia.org/wiki/Aspendos"},
]},
"에페소": { description:"에페소는 세계 7대 불가사의 아르테미스 신전이 있던 고대 그리스-로마 도시 유적입니다.", spots:[
  {name:"에페소 유적지", wikiTitle:"Ephesus", type:"역사", desc:"세계에서 가장 잘 보존된 로마 도시 유적 중 하나로 셀수스 도서관, 대극장이 인상적입니다. 한때 25만 명이 살았던 대도시입니다.", rating:4.8, openTime:"08:00~19:00", price:"200TL", website:"https://en.wikipedia.org/wiki/Ephesus"},
  {name:"셀수스 도서관", wikiTitle:"Library of Celsus", type:"역사", desc:"에페소의 상징으로 2세기에 건설된 화려한 파사드가 복원되어 있습니다. 고대 세계 3대 도서관 중 하나였습니다.", rating:4.7, openTime:"에페소 입장 시", price:"포함", website:"https://en.wikipedia.org/wiki/Library_of_Celsus"},
]},
"보드룸": { description:"보드룸은 에게해의 생트로페라 불리는 터키의 고급 휴양지로 하얀 건물과 푸른 바다가 매력적입니다.", spots:[
  {name:"보드룸 성(성 베드로 성)", wikiTitle:"Bodrum Castle", type:"역사", desc:"15세기 십자군이 건설한 성으로 수중 고고학 박물관이 있습니다. 항구를 내려다보는 위치가 인상적입니다.", rating:4.4, openTime:"08:00~18:00", price:"110TL", website:"https://en.wikipedia.org/wiki/Bodrum_Castle"},
  {name:"보드룸 해변·바 스트리트", wikiTitle:"Bodrum", type:"도시", desc:"낮에는 아름다운 해변에서 휴식, 밤에는 바 스트리트에서 터키 나이트라이프를 즐깁니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Bodrum"},
]},
"트라브존": { description:"트라브존은 흑해 연안의 역사 도시로 절벽에 매달린 쉬멜라 수도원이 유명합니다.", spots:[
  {name:"쉬멜라 수도원", wikiTitle:"Sümela Monastery", type:"역사", desc:"해발 1,200m 절벽에 붙어있는 4세기 그리스 정교회 수도원입니다. 암벽에 그려진 프레스코 벽화가 경이롭습니다.", rating:4.6, openTime:"09:00~18:00", price:"60TL", website:"https://en.wikipedia.org/wiki/S%C3%BCmela_Monastery"},
  {name:"우중괼 고원", wikiTitle:"Uzungöl", type:"자연", desc:"트라브존 근교의 산속 호수 마을로 안개에 싸인 전나무 숲과 호수가 스위스 같은 풍경을 연출합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Uzung%C3%B6l"},
]},
"산토리니": { description:"산토리니는 에게해의 보석으로 하얀 건물과 파란 돔 지붕, 칼데라 절벽 위의 마을, 세계 최고의 석양으로 유명합니다.", spots:[
  {name:"이아(오이아) 석양", wikiTitle:"Oia, Greece", type:"자연", desc:"세계에서 가장 아름다운 석양을 감상할 수 있는 마을입니다. 하얀 건물 사이로 지는 석양의 골든 아워가 환상적입니다.", rating:4.9, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Oia,_Greece"},
  {name:"피라(티라)", wikiTitle:"Fira", type:"도시", desc:"산토리니의 수도로 칼데라 절벽 위에 자리한 마을입니다. 케이블카를 타고 항구와 마을 사이를 오가며 절경을 감상합니다.", rating:4.6, openTime:"24시간", price:"케이블카 €6", website:"https://en.wikipedia.org/wiki/Fira"},
  {name:"아크로티리 유적", wikiTitle:"Akrotiri (prehistoric city)", type:"역사", desc:"3,600년 전 화산 폭발로 묻힌 미노아 문명 도시 유적입니다. 에게해의 폼페이라 불리며 프레스코 벽화가 보존되어 있습니다.", rating:4.4, openTime:"08:00~20:00", price:"€12", website:"https://en.wikipedia.org/wiki/Akrotiri_(prehistoric_city)"},
  {name:"레드 비치", wikiTitle:"Santorini", type:"자연", desc:"붉은 화산 절벽에 둘러싸인 독특한 해변으로 산토리니만의 지질학적 경관을 보여줍니다. 수영과 스노클링이 가능합니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Santorini"},
]},
"아테네": { description:"아테네는 서양 문명의 요람으로 2,500년 역사의 파르테논 신전, 아크로폴리스가 도시를 내려다봅니다.", spots:[
  {name:"아크로폴리스·파르테논 신전", wikiTitle:"Acropolis of Athens", type:"역사", desc:"서양 문명의 상징인 기원전 5세기 파르테논 신전이 있는 성채 언덕입니다. 유네스코 세계문화유산으로 인류 역사의 핵심입니다.", rating:4.8, openTime:"08:00~20:00", price:"€20", website:"https://en.wikipedia.org/wiki/Acropolis_of_Athens"},
  {name:"플라카 지구", wikiTitle:"Plaka", type:"문화", desc:"아크로폴리스 아래 좁은 골목에 타베르나(식당), 기념품 가게가 밀집한 구시가입니다. 그리스 음식과 우조를 즐기기 좋습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Plaka"},
  {name:"아크로폴리스 박물관", wikiTitle:"Acropolis Museum", type:"문화", desc:"아크로폴리스 발굴품을 전시하는 현대적 박물관으로 유리 바닥 아래 고대 유적도 볼 수 있습니다.", rating:4.7, openTime:"09:00~17:00", price:"€10", website:"https://en.wikipedia.org/wiki/Acropolis_Museum"},
]},
"미코노스": { description:"미코노스는 에게해의 파티 섬으로 풍차, 하얀 골목, 세계적인 나이트라이프가 매력적인 그리스의 대표 휴양지입니다.", spots:[
  {name:"리틀 베니스", wikiTitle:"Mykonos (town)", type:"문화", desc:"바다 위로 돌출된 중세 건물에 카페와 바가 자리한 미코노스의 가장 로맨틱한 지구입니다. 석양이 특히 아름답습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mykonos"},
  {name:"미코노스 풍차", wikiTitle:"Mykonos", type:"랜드마크", desc:"카토밀리 풍차는 미코노스의 상징으로 16세기부터 곡물을 분쇄하던 풍차입니다. 석양 배경으로 포토제닉합니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mykonos"},
  {name:"파라다이스 비치", wikiTitle:"Paradise Beach", type:"자연", desc:"미코노스에서 가장 유명한 파티 해변으로 DJ 음악과 함께 수영과 일광욕을 즐깁니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mykonos"},
]},
"크레타": { description:"크레타는 그리스 최대의 섬으로 미노아 문명의 발상지이며 아름다운 해변과 협곡, 전통 음식이 매력적입니다.", spots:[
  {name:"크노소스 궁전", wikiTitle:"Knossos", type:"역사", desc:"미노아 문명의 중심 궁전으로 미노타우르스 미궁 전설의 배경입니다. 아서 에반스가 복원한 프레스코 벽화가 인상적입니다.", rating:4.5, openTime:"08:00~20:00", price:"€15", website:"https://en.wikipedia.org/wiki/Knossos"},
  {name:"엘라포니시 해변", wikiTitle:"Elafonisi", type:"자연", desc:"핑크빛 모래와 터키석 빛 바다가 어우러진 크레타 최고의 해변입니다. 얕은 물에서 걸어서 작은 섬까지 갈 수 있습니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Elafonisi"},
  {name:"사마리아 협곡", wikiTitle:"Samariá Gorge", type:"자연", desc:"유럽에서 가장 긴 협곡 중 하나(16km)로 하이킹 코스가 유명합니다. 5~7시간 소요되는 도전적이지만 보람찬 트레킹입니다.", rating:4.6, openTime:"07:00~15:00(5~10월)", price:"€5", website:"https://en.wikipedia.org/wiki/Samari%C3%A1_Gorge"},
]},
"로도스": { description:"로도스는 고대 7대 불가사의 로도스 거상이 있던 섬으로 중세 기사단의 성곽이 잘 보존된 유네스코 세계유산 도시입니다.", spots:[
  {name:"로도스 올드타운", wikiTitle:"Medieval Rhodes", type:"역사", desc:"유럽에서 가장 잘 보존된 중세 성곽 도시 중 하나로 유네스코 세계문화유산입니다. 기사의 거리가 인상적입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Medieval_Rhodes"},
  {name:"린도스", wikiTitle:"Lindos", type:"역사", desc:"절벽 위 고대 아크로폴리스와 하얀 마을, 청록색 바다가 어우러진 로도스 최고의 명소입니다.", rating:4.7, openTime:"08:00~20:00", price:"€12", website:"https://en.wikipedia.org/wiki/Lindos"},
]},
"코르푸": { description:"코르푸는 이오니아해의 녹색 섬으로 베네치아 건축과 올리브 숲, 아름다운 해변이 조화로운 곳입니다.", spots:[
  {name:"코르푸 올드타운", wikiTitle:"Old Town of Corfu", type:"문화", desc:"베네치아 지배의 영향이 남은 유네스코 세계문화유산 구시가입니다. 좁은 골목과 광장이 이탈리아 분위기를 자아냅니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Old_Town_of_Corfu"},
  {name:"팔레오카스트리차", wikiTitle:"Paleokastritsa", type:"자연", desc:"에메랄드빛 만과 동굴이 있는 코르푸 서해안의 해변 마을입니다. 보트 투어로 숨겨진 해변을 탐험합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Paleokastritsa"},
]},
"메테오라": { description:"메테오라는 높은 사암 기둥 위에 세워진 수도원들로 유명한 세계문화유산입니다. 공중에 매달린 듯한 수도원의 풍경이 경이롭습니다.", spots:[
  {name:"메테오라 수도원", wikiTitle:"Meteora", type:"역사", desc:"최대 400m 높이의 사암 기둥 위에 자리한 6개의 활동 중인 수도원입니다. 유네스코 세계유산으로 이 세상의 풍경이 아닌 듯합니다.", rating:4.9, openTime:"09:00~17:00(수도원별)", price:"€3(각 수도원)", website:"https://en.wikipedia.org/wiki/Meteora"},
  {name:"그레이트 메테오론 수도원", wikiTitle:"Great Meteoron", type:"역사", desc:"메테오라에서 가장 크고 오래된 수도원으로 14세기에 건립되었습니다. 내부 프레스코 벽화와 전망이 압도적입니다.", rating:4.7, openTime:"09:00~17:00", price:"€3", website:"https://en.wikipedia.org/wiki/Great_Meteoron"},
]},

// ────────────────────────── 베트남 ──────────────────────────
"하노이": { description:"하노이는 천년 역사를 간직한 베트남의 수도로, 프랑스 식민지 시대 건축물과 전통 사원이 어우러진 매력적인 도시입니다. 호안끼엠 호수를 중심으로 구시가지의 활기찬 거리와 맛있는 쌀국수가 여행자를 맞이합니다.", spots:[
  {name:"호안끼엠 호수", wikiTitle:"Hoan Kiem Lake", type:"자연", desc:"하노이 중심에 자리한 호수로 거북이 전설이 깃든 도시의 심장입니다. 호수 위 옥산사와 붉은 다리가 아름다운 풍경을 만듭니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Hoan_Kiem_Lake"},
  {name:"하노이 구시가지 36거리", wikiTitle:"Hanoi Old Quarter", type:"문화", desc:"36개 직업 길드 거리로 이루어진 구시가지로 각 거리마다 특화된 상품을 판매합니다. 오토바이와 노점상의 활기가 넘칩니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Hanoi_Old_Quarter"},
  {name:"호치민 묘소", wikiTitle:"Ho Chi Minh Mausoleum", type:"역사", desc:"베트남 건국의 아버지 호치민이 안치된 대리석 묘소입니다. 엄숙한 분위기 속에서 베트남 현대사를 느낄 수 있습니다.", rating:4.4, openTime:"07:30~10:30(화~목,토,일)", price:"무료", website:"https://en.wikipedia.org/wiki/Ho_Chi_Minh_Mausoleum"},
  {name:"문묘", wikiTitle:"Temple of Literature, Hanoi", type:"역사", desc:"1070년에 세워진 베트남 최초의 대학으로 공자를 모시는 사원입니다. 아름다운 정원과 전통 건축이 인상적입니다.", rating:4.6, openTime:"08:00~17:00", price:"30,000 VND", website:"https://en.wikipedia.org/wiki/Temple_of_Literature,_Hanoi"},
  {name:"분짜 거리", wikiTitle:"Hanoi", type:"음식", desc:"숯불에 구운 돼지고기와 쌀국수를 느억맘 소스에 찍어 먹는 하노이 대표 음식입니다. 오바마 대통령도 방문한 분짜 흐엉리엔이 유명합니다.", rating:4.7, openTime:"10:00~14:00", price:"40,000~60,000 VND", website:"https://en.wikipedia.org/wiki/Vietnamese_cuisine"},
]},
"호찌민시": { description:"호찌민시는 베트남 최대의 경제 도시로 프랑스 식민지 시대의 우아한 건축물과 현대적 고층 빌딩이 공존합니다. 에너지 넘치는 거리와 맛있는 길거리 음식이 매력적입니다.", spots:[
  {name:"노트르담 대성당", wikiTitle:"Notre-Dame Cathedral Basilica of Saigon", type:"역사", desc:"1880년 프랑스 식민지 시대에 건설된 붉은 벽돌 성당으로 호찌민시의 상징입니다. 로마네스크 양식의 두 첨탑이 인상적입니다.", rating:4.5, openTime:"08:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Notre-Dame_Cathedral_Basilica_of_Saigon"},
  {name:"벤탄 시장", wikiTitle:"Ben Thanh Market", type:"음식", desc:"1914년부터 운영된 호찌민시의 대표 시장으로 현지 음식, 기념품, 의류 등 모든 것을 만날 수 있습니다.", rating:4.3, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Ben_Thanh_Market"},
  {name:"전쟁박물관", wikiTitle:"War Remnants Museum", type:"역사", desc:"베트남 전쟁의 참상을 보여주는 박물관으로 전쟁 사진과 무기, 장비가 전시되어 있습니다. 강렬한 감동을 주는 장소입니다.", rating:4.6, openTime:"07:30~18:00", price:"40,000 VND", website:"https://en.wikipedia.org/wiki/War_Remnants_Museum"},
  {name:"구찌 터널", wikiTitle:"Cu Chi tunnels", type:"역사", desc:"베트남전 당시 게릴라들이 사용한 거대한 지하 터널 네트워크입니다. 실제 터널 내부를 체험할 수 있습니다.", rating:4.5, openTime:"07:00~17:00", price:"110,000 VND", website:"https://en.wikipedia.org/wiki/Cu_Chi_tunnels"},
]},
"하롱베이": { description:"하롱베이는 약 1,600개의 석회암 섬과 기둥이 에메랄드빛 바다 위에 솟아오른 유네스코 세계자연유산입니다. 크루즈 투어로 신비로운 카르스트 지형을 감상할 수 있습니다.", spots:[
  {name:"하롱베이 크루즈", wikiTitle:"Ha Long Bay", type:"자연", desc:"1~2박 크루즈로 기암괴석 사이를 항해하며 카약, 수영, 동굴 탐험을 즐길 수 있습니다. 일출과 일몰이 장관입니다.", rating:4.8, openTime:"연중무휴", price:"1박 $80~300", website:"https://en.wikipedia.org/wiki/Ha_Long_Bay"},
  {name:"승솟동굴", wikiTitle:"Sung Sot Cave", type:"자연", desc:"하롱베이 최대 규모의 석회동굴로 내부에 거대한 석순과 종유석이 환상적인 세계를 만듭니다.", rating:4.6, openTime:"08:00~17:00", price:"크루즈 포함", website:"https://en.wikipedia.org/wiki/Sung_Sot_Cave"},
  {name:"티톱섬", wikiTitle:"Ti Top Island", type:"자연", desc:"정상까지 계단을 올라가면 하롱베이 전경을 한눈에 볼 수 있는 전망대가 있습니다. 작은 해변에서 수영도 가능합니다.", rating:4.4, openTime:"08:00~17:00", price:"크루즈 포함", website:"https://en.wikipedia.org/wiki/Ti_Top_Island"},
]},
"호이안": { description:"호이안은 15~19세기 국제 무역항의 모습이 고스란히 보존된 유네스코 세계문화유산 도시입니다. 밤이 되면 수천 개의 등불이 켜지며 환상적인 분위기를 연출합니다.", spots:[
  {name:"호이안 고대 도시", wikiTitle:"Hoi An Ancient Town", type:"역사", desc:"일본식 다리, 중국 사원, 프랑스 식민지 건물이 어우러진 보존된 무역항 도시입니다. 등불 축제가 특히 유명합니다.", rating:4.8, openTime:"08:00~21:00", price:"120,000 VND(통합권)", website:"https://en.wikipedia.org/wiki/Hoi_An_Ancient_Town"},
  {name:"일본교(내원교)", wikiTitle:"Japanese Covered Bridge", type:"역사", desc:"1593년 일본 상인들이 건설한 호이안의 상징적인 지붕 다리입니다. 20만 동 지폐에도 그려져 있습니다.", rating:4.6, openTime:"08:00~21:00", price:"통합권 포함", website:"https://en.wikipedia.org/wiki/Japanese_Covered_Bridge"},
  {name:"안방 비치", wikiTitle:"Hoi An", type:"자연", desc:"호이안 시내에서 자전거로 10분 거리의 아름다운 해변으로 세계적으로 유명한 숨은 보석입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/An_Bàng"},
  {name:"호이안 까오라우", wikiTitle:"Hoi An", type:"음식", desc:"호이안에서만 먹을 수 있는 특별한 면요리로 독특한 면 식감과 돼지고기, 허브 조합이 일품입니다.", rating:4.6, openTime:"06:00~21:00", price:"30,000~50,000 VND", website:"https://en.wikipedia.org/wiki/Cao_lau"},
]},
"다낭": { description:"다낭은 베트남 중부의 해안 도시로 아름다운 해변과 바나힐 등 현대적 관광지가 조화를 이룹니다. 호이안과 후에를 잇는 관광 거점 도시입니다.", spots:[
  {name:"바나힐 골든브릿지", wikiTitle:"Golden Bridge (Vietnam)", type:"랜드마크", desc:"거대한 두 손이 받치고 있는 듯한 독특한 디자인의 보행교로 해발 1,400m에서 탁 트인 전망을 즐길 수 있습니다.", rating:4.7, openTime:"07:00~22:00", price:"850,000 VND", website:"https://en.wikipedia.org/wiki/Golden_Bridge_(Vietnam)"},
  {name:"미케 해변", wikiTitle:"My Khe Beach", type:"자연", desc:"미국 포브스지가 세계에서 가장 매력적인 해변 중 하나로 선정한 해변입니다. 서핑과 수영 모두 즐길 수 있습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/My_Khe_Beach"},
  {name:"오행산(마블 마운틴)", wikiTitle:"Marble Mountains (Vietnam)", type:"자연", desc:"다섯 개의 대리석 산으로 이루어져 있으며 내부에 동굴 사원과 전망대가 있습니다. 베트남 전쟁 당시의 역사도 간직하고 있습니다.", rating:4.5, openTime:"07:00~17:30", price:"40,000 VND", website:"https://en.wikipedia.org/wiki/Marble_Mountains_(Vietnam)"},
  {name:"용교(드래곤 브릿지)", wikiTitle:"Dragon Bridge (Da Nang)", type:"랜드마크", desc:"용 모양으로 설계된 666m 길이의 다리로 주말 밤 9시에 용의 입에서 불과 물을 뿜는 쇼가 펼쳐집니다.", rating:4.4, openTime:"24시간(쇼 토·일 21:00)", price:"무료", website:"https://en.wikipedia.org/wiki/Dragon_Bridge_(Da_Nang)"},
]},
"후에": { description:"후에는 베트남 마지막 왕조 응우옌 왕조의 수도였던 도시로 황궁과 황제릉이 유네스코 세계유산으로 등재되어 있습니다. 향강을 따라 펼쳐지는 고즈넉한 풍경이 매력적입니다.", spots:[
  {name:"후에 황궁", wikiTitle:"Imperial City, Huế", type:"역사", desc:"응우옌 왕조의 궁궐로 베이징 자금성을 모델로 건설되었습니다. 전쟁으로 일부 파괴되었으나 복원이 진행 중입니다.", rating:4.6, openTime:"07:00~17:30", price:"200,000 VND", website:"https://en.wikipedia.org/wiki/Imperial_City,_Huế"},
  {name:"카이딘 황제릉", wikiTitle:"Khai Dinh", type:"역사", desc:"동서양 건축이 융합된 독특한 양식의 황제릉으로 정교한 모자이크 장식이 압도적입니다.", rating:4.5, openTime:"07:00~17:30", price:"150,000 VND", website:"https://en.wikipedia.org/wiki/Khải_Định"},
  {name:"티엔무 사원", wikiTitle:"Thiên Mụ Pagoda", type:"역사", desc:"향강 언덕 위에 자리한 7층 팔각탑으로 후에의 상징입니다. 1601년에 건립된 베트남에서 가장 유명한 사원 중 하나입니다.", rating:4.5, openTime:"08:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Thiên_Mụ_Pagoda"},
]},
"사파": { description:"사파는 베트남 북부 산악 지대에 자리한 소수민족의 터전으로 계단식 논과 안개 낀 산봉우리가 만드는 풍경이 장관입니다. 트레킹과 홈스테이로 소수민족 문화를 체험할 수 있습니다.", spots:[
  {name:"판시판산", wikiTitle:"Fansipan", type:"자연", desc:"해발 3,143m로 인도차이나 반도 최고봉입니다. 케이블카로 정상 근처까지 올라갈 수 있어 접근이 수월합니다.", rating:4.7, openTime:"07:30~17:30", price:"700,000 VND(케이블카)", website:"https://en.wikipedia.org/wiki/Fansipan"},
  {name:"무엉호아 계곡", wikiTitle:"Sa Pa", type:"자연", desc:"사파에서 가장 아름다운 계단식 논이 펼쳐지는 계곡으로 소수민족 마을과 고대 암각화가 있습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mường_Hoa_valley"},
  {name:"깟깟 마을", wikiTitle:"Cat Cat village", type:"문화", desc:"흑몽족이 거주하는 전통 마을로 폭포와 대나무 숲이 어우러져 있습니다. 전통 직물 짜기 체험이 가능합니다.", rating:4.4, openTime:"07:00~18:00", price:"70,000 VND", website:"https://en.wikipedia.org/wiki/Cát_Cát"},
]},
"푸꾸옥": { description:"푸꾸옥은 베트남 최대의 섬으로 에메랄드빛 바다와 새하얀 모래사장이 펼쳐진 열대 낙원입니다. 최근 리조트 개발이 활발하여 동남아시아의 새로운 휴양지로 떠오르고 있습니다.", spots:[
  {name:"사오 비치", wikiTitle:"Phu Quoc", type:"자연", desc:"푸꾸옥 남동쪽의 새하얀 모래사장과 투명한 바다가 아름다운 해변입니다. 야자수 그늘 아래 휴식을 즐기기에 완벽합니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Phu_Quoc"},
  {name:"빈원더스 푸꾸옥", wikiTitle:"Vinpearl", type:"도시", desc:"베트남 최대 규모의 놀이공원 겸 리조트 단지로 워터파크, 사파리, 수족관 등이 한곳에 모여 있습니다.", rating:4.5, openTime:"09:00~21:00", price:"750,000 VND", website:"https://en.wikipedia.org/wiki/VinWonders"},
  {name:"푸꾸옥 야시장", wikiTitle:"Phu Quoc", type:"음식", desc:"신선한 해산물 구이와 베트남 현지 음식을 저렴하게 즐길 수 있는 활기찬 야시장입니다.", rating:4.4, openTime:"17:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Phu_Quoc"},
]},
"닌빈": { description:"닌빈은 '육지의 하롱베이'로 불리는 석회암 카르스트 지형이 논과 강 사이로 솟아오른 비경의 땅입니다. 짱안 생태관광지구는 유네스코 세계유산으로 등재되어 있습니다.", spots:[
  {name:"짱안 보트투어", wikiTitle:"Tràng An", type:"자연", desc:"석회암 동굴과 계곡 사이를 배로 지나며 감상하는 코스로 킹콩 영화 촬영지이기도 합니다. 유네스코 세계유산입니다.", rating:4.7, openTime:"07:00~16:00", price:"250,000 VND", website:"https://en.wikipedia.org/wiki/Tràng_An"},
  {name:"바이딘 사원", wikiTitle:"Bai Dinh Temple", type:"역사", desc:"동남아시아 최대 규모의 불교 사원 단지로 500개 이상의 아라한 석상이 줄지어 있습니다.", rating:4.5, openTime:"06:00~18:00", price:"100,000 VND(전기차)", website:"https://en.wikipedia.org/wiki/Bái_Đính_Temple"},
  {name:"항무아 전망대", wikiTitle:"Hang Mua", type:"자연", desc:"500개의 계단을 올라가면 닌빈 전체의 논과 카르스트 산이 한눈에 펼쳐지는 절경을 볼 수 있습니다.", rating:4.6, openTime:"06:00~18:00", price:"100,000 VND", website:"https://en.wikipedia.org/wiki/Hang_Múa"},
]},

// ────────────────────────── 인도네시아 ──────────────────────────
"발리": { description:"발리는 신들의 섬이라 불리는 인도네시아 최고의 관광지로 힌두 사원, 계단식 논, 아름다운 해변이 조화를 이룹니다. 우붓의 예술 문화와 쿠타의 서핑 문화가 공존하는 매혹적인 섬입니다.", spots:[
  {name:"울루와뚜 사원", wikiTitle:"Uluwatu Temple", type:"역사", desc:"70m 높이 절벽 위에 자리한 바다 사원으로 일몰 시간의 케착 댄스 공연이 유명합니다.", rating:4.7, openTime:"07:00~19:00", price:"50,000 IDR", website:"https://en.wikipedia.org/wiki/Uluwatu_Temple"},
  {name:"뜨갈랄랑 라이스 테라스", wikiTitle:"Tegallalang Rice Terrace", type:"자연", desc:"우붓 북쪽의 아름다운 계단식 논으로 전통 수바크 관개 시스템이 유네스코에 등재되어 있습니다.", rating:4.6, openTime:"08:00~18:00", price:"15,000 IDR", website:"https://en.wikipedia.org/wiki/Tegallalang"},
  {name:"따나롯 사원", wikiTitle:"Tanah Lot", type:"역사", desc:"바다 위 바위 위에 세워진 힌두 사원으로 밀물 시 섬처럼 변합니다. 발리 최고의 일몰 명소입니다.", rating:4.7, openTime:"07:00~19:00", price:"60,000 IDR", website:"https://en.wikipedia.org/wiki/Tanah_Lot"},
  {name:"우붓 원숭이 숲", wikiTitle:"Ubud Monkey Forest", type:"자연", desc:"300마리 이상의 원숭이가 서식하는 열대우림 성소로 고대 사원과 거대한 반얀 나무가 있습니다.", rating:4.4, openTime:"08:30~18:00", price:"80,000 IDR", website:"https://www.monkeyforestubud.com"},
  {name:"스미냑 해변", wikiTitle:"Seminyak", type:"자연", desc:"발리 최고의 비치클럽과 레스토랑이 모여있는 세련된 해변 지역으로 서핑과 석양이 유명합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Seminyak"},
]},
"자카르타": { description:"자카르타는 인도네시아의 수도이자 동남아시아 최대 도시 중 하나로 다양한 문화와 역사가 공존합니다. 식민지 시대 건축물과 현대적 마천루, 활기찬 시장이 매력적입니다.", spots:[
  {name:"이스티클랄 모스크", wikiTitle:"Istiqlal Mosque", type:"역사", desc:"동남아시아 최대의 이슬람 사원으로 12만 명을 수용할 수 있습니다. 인도네시아 독립을 기념하여 건설되었습니다.", rating:4.5, openTime:"04:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Istiqlal_Mosque,_Jakarta"},
  {name:"모나스(국가독립기념탑)", wikiTitle:"National Monument (Indonesia)", type:"랜드마크", desc:"132m 높이의 탑 꼭대기에 35kg의 금으로 만든 불꽃이 빛납니다. 전망대에서 자카르타 시내를 조망할 수 있습니다.", rating:4.4, openTime:"08:00~16:00", price:"15,000 IDR", website:"https://en.wikipedia.org/wiki/National_Monument_(Indonesia)"},
  {name:"코타 뚜아(구시가지)", wikiTitle:"Kota Tua", type:"역사", desc:"네덜란드 식민지 시대의 건축물이 보존된 올드타운으로 역사 박물관과 카페가 모여 있습니다.", rating:4.3, openTime:"24시간", price:"무료(박물관 별도)", website:"https://en.wikipedia.org/wiki/Kota_Tua_Jakarta"},
]},
"족자카르타": { description:"족자카르타는 자바 문화의 중심지로 술탄의 왕궁과 세계적 유산인 보로부두르, 프람바난 사원이 인근에 있습니다. 전통 바틱 공예와 예술의 도시로도 유명합니다.", spots:[
  {name:"프람바난 사원", wikiTitle:"Prambanan", type:"역사", desc:"9세기에 건설된 동남아 최대의 힌두 사원 유적으로 유네스코 세계유산입니다. 47m 높이의 시바 신전이 압도적입니다.", rating:4.7, openTime:"06:00~17:00", price:"$25(외국인)", website:"https://borobudurpark.com/temple/prambanan"},
  {name:"크라톤 왕궁", wikiTitle:"Kraton Ngayogyakarta Hadiningrat", type:"역사", desc:"현재도 술탄이 거주하는 살아있는 왕궁으로 자바 전통 건축의 정수를 보여줍니다.", rating:4.4, openTime:"08:30~14:00", price:"15,000 IDR", website:"https://en.wikipedia.org/wiki/Kraton_Ngayogyakarta_Hadiningrat"},
  {name:"말리오보로 거리", wikiTitle:"Malioboro", type:"도시", desc:"족자카르타의 메인 쇼핑 거리로 바틱, 은세공품, 전통 공예품을 살 수 있습니다. 밤에는 길거리 음식 노점이 펼쳐집니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Malioboro"},
]},
"코모도": { description:"코모도 국립공원은 세계에서 유일하게 코모도 드래곤을 야생에서 만날 수 있는 유네스코 세계유산입니다. 핑크 비치와 환상적인 스노클링 포인트도 유명합니다.", spots:[
  {name:"코모도 국립공원", wikiTitle:"Komodo National Park", type:"자연", desc:"세계 최대 도마뱀 코모도 드래곤이 서식하는 곳으로 약 3,000마리가 야생에서 생활합니다.", rating:4.8, openTime:"08:00~17:00", price:"350,000 IDR", website:"https://www.komodonationalpark.org"},
  {name:"핑크 비치", wikiTitle:"Pink Beach", type:"자연", desc:"산호 가루가 섞여 분홍빛을 띠는 희귀한 해변으로 스노클링 명소입니다.", rating:4.7, openTime:"08:00~17:00", price:"공원 입장료 포함", website:"https://www.komodonationalpark.org"},
]},
"롬복": { description:"롬복은 발리 동쪽에 위치한 섬으로 린자니 화산과 길리 제도의 투명한 바다가 매력적입니다. 발리보다 조용하고 자연 그대로의 모습을 간직하고 있습니다.", spots:[
  {name:"린자니 산", wikiTitle:"Mount Rinjani", type:"자연", desc:"해발 3,726m의 활화산으로 분화구 내 초승달 모양의 호수가 장관입니다. 2~3일 트레킹 코스가 인기입니다.", rating:4.7, openTime:"연중(우기 제외)", price:"150,000 IDR", website:"https://en.wikipedia.org/wiki/Mount_Rinjani"},
  {name:"길리 트라왕안", wikiTitle:"Gili Trawangan", type:"자연", desc:"롬복 옆의 작은 산호섬으로 자동차가 없고 자전거와 마차만 다닙니다. 다이빙과 스노클링의 천국입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Gili_Trawangan"},
]},
"보로부두르": { description:"보로부두르는 9세기에 건설된 세계 최대의 불교 사원으로 유네스코 세계유산입니다. 안개 속에서 일출과 함께 드러나는 사원의 실루엣은 잊을 수 없는 장면입니다.", spots:[
  {name:"보로부두르 사원", wikiTitle:"Borobudur", type:"역사", desc:"504개의 불상과 2,672개의 부조 패널이 새겨진 세계 최대 불교 유적입니다. 일출 투어가 특히 인기입니다.", rating:4.8, openTime:"06:00~17:00", price:"$25(외국인)", website:"https://borobudurpark.com"},
  {name:"문두 사원", wikiTitle:"Mendut", type:"역사", desc:"보로부두르 인근의 불교 사원으로 3m 높이의 거대한 불상이 모셔져 있습니다.", rating:4.3, openTime:"07:00~17:00", price:"10,000 IDR", website:"https://en.wikipedia.org/wiki/Mendut"},
]},
"라자암팟": { description:"라자암팟은 1,500개 이상의 섬으로 이루어진 인도네시아 최동단의 다이빙 천국입니다. 지구상에서 가장 풍부한 해양 생물 다양성을 자랑하는 미지의 낙원입니다.", spots:[
  {name:"라자암팟 해양공원", wikiTitle:"Raja Ampat Islands", type:"자연", desc:"전 세계 산호 종의 75%가 서식하는 곳으로 만타레이, 상어 등 대형 해양생물을 만날 수 있습니다.", rating:4.9, openTime:"연중", price:"1,000,000 IDR(환경세)", website:"https://en.wikipedia.org/wiki/Raja_Ampat_Islands"},
  {name:"피아네모 전망대", wikiTitle:"Raja Ampat Islands", type:"자연", desc:"석회암 섬들이 에메랄드빛 바다 위에 흩어진 전경을 볼 수 있는 전망대입니다. 계단을 올라가면 숨막히는 파노라마가 펼쳐집니다.", rating:4.8, openTime:"06:00~18:00", price:"입장료 포함", website:"https://en.wikipedia.org/wiki/Raja_Ampat_Islands"},
]},

// ────────────────────────── 말레이시아 ──────────────────────────
"쿠알라룸푸르": { description:"쿠알라룸푸르는 말레이시아의 수도로 페트로나스 트윈타워가 상징하는 현대적 스카이라인과 다문화가 공존하는 역동적인 도시입니다.", spots:[
  {name:"페트로나스 트윈타워", wikiTitle:"Petronas Towers", type:"랜드마크", desc:"452m 높이의 세계적 랜드마크로 41층 스카이브리지와 86층 전망대에서 도시를 조망할 수 있습니다.", rating:4.7, openTime:"09:00~21:00", price:"RM80", website:"https://www.petronastwintowers.com.my"},
  {name:"바투 동굴", wikiTitle:"Batu Caves", type:"역사", desc:"272개의 무지개색 계단을 올라가면 거대한 석회동굴 속 힌두 사원이 나타납니다. 42m 높이의 금색 무루간 신상이 인상적입니다.", rating:4.6, openTime:"06:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Batu_Caves"},
  {name:"잘란 알로 푸드스트리트", wikiTitle:"Jalan Alor", type:"음식", desc:"쿠알라룸푸르 최대의 길거리 음식 거리로 사테, 호끼엔미, 두리안 등 말레이시아 음식을 맛볼 수 있습니다.", rating:4.5, openTime:"17:00~03:00", price:"무료", website:"https://en.wikipedia.org/wiki/Jalan_Alor"},
]},
"페낭": { description:"페낭은 '동양의 진주'로 불리는 말레이시아의 미식 수도입니다. 조지타운의 유네스코 세계유산 거리와 독특한 스트리트 아트가 매력적입니다.", spots:[
  {name:"조지타운", wikiTitle:"George Town, Penang", type:"역사", desc:"영국 식민지 시대 건축물과 중국, 인도, 말레이 문화가 융합된 유네스코 세계유산 도시입니다. 유명한 스트리트 아트가 곳곳에 있습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/George_Town,_Penang"},
  {name:"켁록시 사원", wikiTitle:"Kek Lok Si", type:"역사", desc:"동남아시아 최대 규모의 불교 사원으로 30m 높이의 관음상과 7층 탑이 인상적입니다.", rating:4.5, openTime:"09:00~18:00", price:"무료(탑 RM2)", website:"https://en.wikipedia.org/wiki/Kek_Lok_Si"},
  {name:"페낭 아삼 락사", wikiTitle:"George Town, Penang", type:"음식", desc:"CNN이 세계 7대 음식으로 선정한 페낭의 대표 음식으로 새콤한 생선 국물 면요리입니다.", rating:4.6, openTime:"08:00~17:00", price:"RM5~10", website:"https://en.wikipedia.org/wiki/Asam_laksa"},
]},
"코타키나발루": { description:"코타키나발루는 보르네오 섬 말레이시아 사바주의 주도로 동남아 최고봉 키나발루산과 아름다운 섬들이 있는 자연의 보고입니다.", spots:[
  {name:"키나발루 산", wikiTitle:"Mount Kinabalu", type:"자연", desc:"해발 4,095m의 동남아시아 최고봉으로 유네스코 세계유산입니다. 2일 등반 코스가 인기입니다.", rating:4.8, openTime:"연중", price:"RM200(입산료)", website:"https://en.wikipedia.org/wiki/Mount_Kinabalu"},
  {name:"툰쿠 압둘 라만 해양공원", wikiTitle:"Tunku Abdul Rahman National Park", type:"자연", desc:"5개의 아름다운 섬으로 이루어진 해양공원으로 스노클링과 다이빙이 훌륭합니다.", rating:4.5, openTime:"08:00~17:00", price:"RM10(입장료)", website:"https://en.wikipedia.org/wiki/Tunku_Abdul_Rahman_National_Park"},
]},
"랑카위": { description:"랑카위는 99개의 섬으로 이루어진 안다만 해의 보석으로 유네스코 세계 지질공원에 지정된 면세 섬입니다. 아름다운 해변과 맹그로브 숲, 스카이브릿지가 유명합니다.", spots:[
  {name:"랑카위 스카이브릿지", wikiTitle:"Langkawi Sky Bridge", type:"랜드마크", desc:"해발 660m에 설치된 125m 길이의 곡선형 보행교로 아찔한 전망과 스릴을 동시에 즐길 수 있습니다.", rating:4.6, openTime:"09:30~19:00", price:"RM35(케이블카+다리)", website:"https://en.wikipedia.org/wiki/Langkawi_Sky_Bridge"},
  {name:"킬림 지오포레스트 파크", wikiTitle:"Kilim Karst Geoforest Park", type:"자연", desc:"맹그로브 숲과 석회암 기둥 사이를 보트로 탐험하며 독수리, 원숭이를 만날 수 있습니다.", rating:4.5, openTime:"09:00~17:00", price:"RM35(보트투어)", website:"https://en.wikipedia.org/wiki/Kilim_Karst_Geoforest_Park"},
  {name:"탄중루 해변", wikiTitle:"Tanjung Rhu", type:"자연", desc:"랑카위에서 가장 아름다운 해변으로 고운 백사장과 석회암 기둥이 어우러진 비경입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Tanjung_Rhu"},
]},
"말라카": { description:"말라카는 15세기 해상 무역의 중심지였던 역사 도시로 포르투갈, 네덜란드, 영국의 식민 유산이 층층이 쌓여 있는 유네스코 세계유산입니다.", spots:[
  {name:"더치 스퀘어", wikiTitle:"Dutch Square, Malacca", type:"역사", desc:"17세기 네덜란드 식민지 시대의 붉은 건물들이 모여있는 말라카의 중심 광장입니다. 크라이스트 처치가 랜드마크입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Dutch_Square,_Malacca"},
  {name:"존커 스트리트", wikiTitle:"Jonker Walk", type:"문화", desc:"앤티크 가게, 카페, 갤러리가 즐비한 문화 거리로 금요~일요 밤에 야시장이 열립니다.", rating:4.4, openTime:"10:00~22:00(야시장 금~일)", price:"무료", website:"https://en.wikipedia.org/wiki/Jonker_Walk"},
  {name:"어포사 요새", wikiTitle:"A Famosa", type:"역사", desc:"1511년 포르투갈이 건설한 동남아시아에서 가장 오래된 유럽 건축물 유적입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/A_Famosa"},
]},

// ────────────────────────── 싱가포르 ──────────────────────────
"싱가포르": { description:"싱가포르는 동남아시아의 도시 국가로 미래지향적 건축물과 다문화가 어우러진 깨끗하고 안전한 도시입니다. 마리나베이 샌즈부터 호커센터의 길거리 음식까지 다채로운 경험을 선사합니다.", spots:[
  {name:"마리나베이 샌즈", wikiTitle:"Marina Bay Sands", type:"랜드마크", desc:"세 개의 타워 위에 배 모양 스카이파크가 올려진 상징적 건축물입니다. 인피니티 풀과 전망대가 유명합니다.", rating:4.7, openTime:"09:30~22:00(전망대)", price:"S$26(전망대)", website:"https://www.marinabaysands.com"},
  {name:"가든스 바이 더 베이", wikiTitle:"Gardens by the Bay", type:"자연", desc:"미래지향적 슈퍼트리 그로브와 클라우드 포레스트, 플라워 돔이 있는 거대한 식물원입니다.", rating:4.8, openTime:"05:00~02:00(야외)", price:"S$28(온실)", website:"https://www.gardensbythebay.com.sg"},
  {name:"센토사 섬", wikiTitle:"Sentosa", type:"도시", desc:"유니버셜 스튜디오, 아쿠아리움, 해변이 모여있는 복합 리조트 섬입니다.", rating:4.5, openTime:"24시간", price:"무료(개별 시설 유료)", website:"https://www.sentosa.com.sg"},
  {name:"호커 센터", wikiTitle:"Singapore", type:"음식", desc:"싱가포르의 유네스코 무형유산인 호커 문화를 체험할 수 있는 곳으로 칠리크랩, 치킨라이스 등을 S$3~5에 즐길 수 있습니다.", rating:4.6, openTime:"06:00~23:00", price:"S$3~8", website:"https://en.wikipedia.org/wiki/Hawker_centre"},
  {name:"차이나타운", wikiTitle:"Chinatown, Singapore", type:"문화", desc:"불아사원, 스리마리암만 사원, 잠자마 모스크가 한 블록 안에 공존하는 다문화 지구입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Chinatown,_Singapore"},
]},

// ────────────────────────── 캄보디아 ──────────────────────────
"씨엠립": { description:"씨엠립은 세계 최대의 종교 유적 앙코르와트의 관문 도시입니다. 크메르 제국의 영화를 간직한 수백 개의 사원이 밀림 속에 펼쳐져 있습니다.", spots:[
  {name:"앙코르와트", wikiTitle:"Angkor Wat", type:"역사", desc:"12세기에 건설된 세계 최대의 종교 건축물로 캄보디아 국기에도 그려져 있습니다. 일출이 특히 장관입니다.", rating:4.9, openTime:"05:00~17:30", price:"$37(1일권)", website:"https://www.angkorenterprise.gov.kh"},
  {name:"앙코르 톰", wikiTitle:"Angkor Thom", type:"역사", desc:"바이욘 사원의 216개 거대한 미소 짓는 얼굴이 있는 크메르 제국의 마지막 수도입니다.", rating:4.8, openTime:"07:30~17:30", price:"앙코르 패스 포함", website:"https://www.angkorenterprise.gov.kh"},
  {name:"따프롬 사원", wikiTitle:"Ta Prohm", type:"역사", desc:"거대한 나무뿌리가 사원을 감싸고 있는 신비로운 유적으로 영화 '툼레이더' 촬영지입니다.", rating:4.7, openTime:"07:30~17:30", price:"앙코르 패스 포함", website:"https://en.wikipedia.org/wiki/Ta_Prohm"},
  {name:"펍스트리트", wikiTitle:"Pub Street, Siem Reap", type:"도시", desc:"씨엠립의 번화가로 레스토랑, 바, 야시장이 모여있는 활기찬 거리입니다.", rating:4.2, openTime:"17:00~02:00", price:"무료", website:"https://en.wikipedia.org/wiki/Pub_Street,_Siem_Reap"},
]},
"프놈펜": { description:"프놈펜은 캄보디아의 수도로 왕궁의 황금빛 지붕과 메콩강이 어우러진 도시입니다. 크메르 루즈의 아픈 역사도 함께 간직하고 있습니다.", spots:[
  {name:"왕궁과 은사원", wikiTitle:"Royal Palace, Phnom Penh", type:"역사", desc:"1866년에 건설된 캄보디아 국왕의 공식 거주지로 에메랄드 불상이 모셔진 은사원이 유명합니다.", rating:4.5, openTime:"08:00~17:00", price:"$10", website:"https://en.wikipedia.org/wiki/Royal_Palace,_Phnom_Penh"},
  {name:"투올슬렝 학살 박물관", wikiTitle:"Tuol Sleng Genocide Museum", type:"역사", desc:"크메르 루즈 시절 S-21 수용소였던 곳을 박물관으로 전환한 곳으로 캄보디아 비극의 역사를 전합니다.", rating:4.6, openTime:"08:00~17:00", price:"$5", website:"https://en.wikipedia.org/wiki/Tuol_Sleng_Genocide_Museum"},
  {name:"센트럴 마켓", wikiTitle:"Central Market (Phnom Penh)", type:"문화", desc:"1937년에 건설된 아르데코 양식의 거대한 시장으로 보석, 의류, 음식 등 모든 것을 판매합니다.", rating:4.3, openTime:"07:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Central_Market_(Phnom_Penh)"},
]},
"시아누크빌": { description:"시아누크빌은 캄보디아 남부의 해안 도시로 아름다운 섬과 해변이 있는 휴양지입니다. 롱 세트 비치와 인근 코롱섬이 특히 인기입니다.", spots:[
  {name:"코롱섬", wikiTitle:"Koh Rong", type:"자연", desc:"투명한 바다와 새하얀 모래사장이 펼쳐진 원시 그대로의 섬으로 밤에는 플랑크톤 야광을 볼 수 있습니다.", rating:4.6, openTime:"24시간", price:"무료(페리 $15)", website:"https://en.wikipedia.org/wiki/Koh_Rong"},
  {name:"오트레스 비치", wikiTitle:"Otres Beach", type:"자연", desc:"시아누크빌에서 가장 조용하고 아름다운 해변으로 배낭여행자들에게 인기 있는 힐링 명소입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Otres_Beach"},
]},

// ────────────────────────── 미얀마 ──────────────────────────
"양곤": { description:"양곤은 미얀마 최대 도시로 황금빛 쉐다곤 파고다가 도시를 지배하는 불교 문화의 중심지입니다. 영국 식민지 시대의 건축물이 많이 남아있습니다.", spots:[
  {name:"쉐다곤 파고다", wikiTitle:"Shwedagon Pagoda", type:"역사", desc:"2,600년 역사의 99m 높이 황금탑으로 미얀마 불교의 성지입니다. 5,000개 이상의 다이아몬드와 보석으로 장식되어 있습니다.", rating:4.9, openTime:"04:00~22:00", price:"$10", website:"https://en.wikipedia.org/wiki/Shwedagon_Pagoda"},
  {name:"보족 아웅산 시장", wikiTitle:"Bogyoke Aung San Market", type:"문화", desc:"보석, 수공예품, 전통 의상을 판매하는 양곤 최대의 시장입니다. 미얀마 루비와 사파이어가 유명합니다.", rating:4.3, openTime:"09:00~17:00(화~일)", price:"무료", website:"https://en.wikipedia.org/wiki/Bogyoke_Aung_San_Market"},
]},
"바간": { description:"바간은 11~13세기에 건설된 2,000개 이상의 불탑과 사원이 평원에 펼쳐진 세계적 유적지입니다. 열기구를 타고 바라보는 일출의 바간 풍경은 세계 최고의 장관 중 하나입니다.", spots:[
  {name:"바간 사원 평원", wikiTitle:"Bagan", type:"역사", desc:"42km²에 걸쳐 2,000개 이상의 불교 유적이 흩어져 있는 세계유산입니다. 자전거나 전기바이크로 탐험할 수 있습니다.", rating:4.9, openTime:"일출~일몰", price:"$25(구역입장료)", website:"https://en.wikipedia.org/wiki/Bagan"},
  {name:"아난다 사원", wikiTitle:"Ananda Temple", type:"역사", desc:"1105년에 완성된 바간에서 가장 아름다운 사원으로 네 방향에 각각 9m 높이의 불상이 서 있습니다.", rating:4.7, openTime:"일출~일몰", price:"구역입장료 포함", website:"https://en.wikipedia.org/wiki/Ananda_Temple"},
]},
"만달레이": { description:"만달레이는 미얀마의 문화 수도로 마지막 왕조의 수도였던 역사와 전통이 살아있는 도시입니다. 우베인 다리의 일몰은 미얀마 여행의 하이라이트입니다.", spots:[
  {name:"우베인 다리", wikiTitle:"U Bein Bridge", type:"랜드마크", desc:"1849년에 건설된 세계에서 가장 긴 티크 목재 다리(1.2km)로 일몰 풍경이 압도적으로 아름답습니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/U_Bein_Bridge"},
  {name:"만달레이 궁전", wikiTitle:"Mandalay Palace", type:"역사", desc:"미얀마 마지막 왕조 콘바웅 왕조의 궁전으로 거대한 해자에 둘러싸여 있습니다.", rating:4.3, openTime:"07:30~16:30", price:"$10", website:"https://en.wikipedia.org/wiki/Mandalay_Palace"},
]},
"인레호수": { description:"인레호수는 해발 880m 고원에 위치한 담수호로 한 발로 노를 젓는 독특한 인타족 어부와 수상 마을, 떠다니는 정원이 유명합니다.", spots:[
  {name:"인레호수 보트투어", wikiTitle:"Inle Lake", type:"자연", desc:"한 발로 노를 젓는 인타족 어부와 수상 마을, 떠다니는 토마토 정원을 보트로 탐험합니다.", rating:4.7, openTime:"06:00~17:00", price:"$10(구역입장료)", website:"https://en.wikipedia.org/wiki/Inle_Lake"},
  {name:"파웅다우우 파고다", wikiTitle:"Phaung Daw Oo Pagoda", type:"역사", desc:"인레호수에서 가장 신성한 수상 사원으로 금박으로 뒤덮인 5개의 작은 불상이 모셔져 있습니다.", rating:4.4, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Phaung_Daw_Oo_Pagoda"},
]},

// ────────────────────────── 네팔 ──────────────────────────
"카트만두": { description:"카트만두는 히말라야 산맥 아래 분지에 자리한 네팔의 수도로 고대 힌두·불교 사원이 가득한 신비로운 도시입니다.", spots:[
  {name:"보드나트 스투파", wikiTitle:"Boudhanath", type:"역사", desc:"네팔 최대의 불교 스투파로 거대한 부처의 눈이 사방을 바라보고 있습니다. 티베트 불교의 성지입니다.", rating:4.7, openTime:"05:00~21:00", price:"Rs 400", website:"https://en.wikipedia.org/wiki/Boudhanath"},
  {name:"더르바르 광장", wikiTitle:"Kathmandu Durbar Square", type:"역사", desc:"네팔 왕국의 옛 왕궁 광장으로 중세 네와르 건축의 정수를 보여줍니다. 유네스코 세계유산입니다.", rating:4.5, openTime:"07:00~19:00", price:"Rs 1,000", website:"https://en.wikipedia.org/wiki/Kathmandu_Durbar_Square"},
  {name:"스와얌부나트(원숭이 사원)", wikiTitle:"Swayambhunath", type:"역사", desc:"2,500년 역사의 불교 사원으로 365개 계단을 올라가면 카트만두 계곡 전경이 펼쳐집니다.", rating:4.6, openTime:"04:00~21:00", price:"Rs 200", website:"https://en.wikipedia.org/wiki/Swayambhunath"},
  {name:"타멜 거리", wikiTitle:"Thamel", type:"도시", desc:"배낭여행자의 천국으로 레스토랑, 트레킹 장비점, 기념품 가게가 밀집한 활기찬 거리입니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Thamel"},
]},
"포카라": { description:"포카라는 안나푸르나 산맥의 관문 도시로 페와 호수와 설산이 어우러진 평화로운 풍경이 트레커들의 사랑을 받는 곳입니다.", spots:[
  {name:"페와 호수", wikiTitle:"Phewa Lake", type:"자연", desc:"안나푸르나 설산이 호수에 비치는 장관이 유명합니다. 보트를 타고 호수 가운데 탈바라히 사원에 갈 수 있습니다.", rating:4.6, openTime:"24시간", price:"무료(보트 Rs 500)", website:"https://en.wikipedia.org/wiki/Phewa_Lake"},
  {name:"안나푸르나 베이스캠프 트레킹", wikiTitle:"Annapurna Base Camp", type:"자연", desc:"세계에서 가장 인기 있는 트레킹 코스 중 하나로 7~12일간 히말라야 설산을 오릅니다.", rating:4.9, openTime:"연중(10~11월 최적)", price:"TIMS Rs 2,000", website:"https://en.wikipedia.org/wiki/Annapurna_Base_Camp"},
  {name:"세계 평화 탑", wikiTitle:"World Peace Pagoda, Pokhara", type:"역사", desc:"언덕 위에 자리한 하얀 불탑에서 안나푸르나와 페와 호수의 파노라마를 감상할 수 있습니다.", rating:4.4, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/World_Peace_Pagoda,_Pokhara"},
]},
"치트완": { description:"치트완 국립공원은 히말라야 남쪽 타라이 평원의 야생동물 보호구역으로 유네스코 세계유산입니다. 인도코뿔소와 벵골호랑이가 서식합니다.", spots:[
  {name:"치트완 국립공원", wikiTitle:"Chitwan National Park", type:"자연", desc:"932km² 면적의 보호구역으로 코끼리 사파리, 카누 투어, 정글 워킹으로 야생동물을 관찰합니다.", rating:4.6, openTime:"연중", price:"Rs 2,000", website:"https://en.wikipedia.org/wiki/Chitwan_National_Park"},
  {name:"타루족 문화 체험", wikiTitle:"Tharu people", type:"문화", desc:"치트완 원주민 타루족의 전통 춤과 문화를 체험할 수 있습니다. 스틱 댄스가 특히 유명합니다.", rating:4.3, openTime:"저녁 공연", price:"Rs 500", website:"https://en.wikipedia.org/wiki/Tharu_people"},
]},
"룸비니": { description:"룸비니는 석가모니 부처가 탄생한 곳으로 전 세계 불교의 성지입니다. 유네스코 세계유산으로 각국의 불교 사원이 모여 있습니다.", spots:[
  {name:"마야데비 사원", wikiTitle:"Maya Devi Temple", type:"역사", desc:"부처 탄생지에 세워진 사원으로 발굴된 고대 유적과 아소카 왕의 석주가 보존되어 있습니다.", rating:4.7, openTime:"06:00~17:30", price:"Rs 200", website:"https://en.wikipedia.org/wiki/Maya_Devi_Temple"},
  {name:"룸비니 정원", wikiTitle:"Lumbini", type:"역사", desc:"세계 각국이 기증한 불교 사원들이 모여있는 평화의 정원입니다. 한국 사원도 있습니다.", rating:4.5, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Lumbini"},
]},

// ────────────────────────── 스리랑카 ──────────────────────────
"콜롬보": { description:"콜롬보는 스리랑카의 수도이자 최대 도시로 식민지 시대 건축물과 불교 사원, 현대적 쇼핑몰이 공존합니다.", spots:[
  {name:"간가라마야 사원", wikiTitle:"Gangaramaya Temple", type:"역사", desc:"콜롬보에서 가장 중요한 불교 사원으로 독특한 건축과 다양한 불교 유물이 전시되어 있습니다.", rating:4.5, openTime:"05:30~22:00", price:"Rs 300", website:"https://en.wikipedia.org/wiki/Gangaramaya_Temple"},
  {name:"골페이스 그린", wikiTitle:"Galle Face Green", type:"도시", desc:"인도양을 따라 펼쳐진 도심 공원으로 일몰 시간에 현지인과 관광객이 모여 즐깁니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Galle_Face_Green"},
]},
"캔디": { description:"캔디는 스리랑카의 옛 수도로 불치사에 부처의 치아 사리가 보관된 불교 성지입니다. 호수 주변의 아름다운 풍경과 식물원이 유명합니다.", spots:[
  {name:"불치사(스리 달라다 말리가와)", wikiTitle:"Temple of the Tooth", type:"역사", desc:"부처의 치아가 모셔진 스리랑카에서 가장 신성한 사원입니다. 유네스코 세계유산입니다.", rating:4.7, openTime:"05:30~20:00", price:"Rs 2,000", website:"https://sridaladamaligawa.lk"},
  {name:"페라데니야 식물원", wikiTitle:"Royal Botanical Gardens, Peradeniya", type:"자연", desc:"147에이커 규모의 열대 식물원으로 자이언트 자바 무화과나무와 난초원이 특히 볼만합니다.", rating:4.5, openTime:"07:30~17:00", price:"Rs 2,000", website:"https://en.wikipedia.org/wiki/Royal_Botanical_Gardens,_Peradeniya"},
]},
"갈레": { description:"갈레는 스리랑카 남부의 항구도시로 17세기 네덜란드가 건설한 요새가 유네스코 세계유산입니다. 요새 안의 카페와 부티크 숍이 매력적입니다.", spots:[
  {name:"갈레 포트", wikiTitle:"Galle Fort", type:"역사", desc:"1588년 포르투갈이 건설하고 네덜란드가 확장한 해안 요새로 성벽 위를 걸으며 인도양을 조망할 수 있습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Galle_Fort"},
  {name:"일본 평화탑", wikiTitle:"Japanese Peace Pagoda, Unawatuna", type:"역사", desc:"갈레 인근 우나와투나 언덕 위의 하얀 불탑에서 아름다운 해안 전경을 감상할 수 있습니다.", rating:4.3, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Japanese_Peace_Pagoda,_Unawatuna"},
]},
"시기리야": { description:"시기리야는 5세기에 거대한 바위 위에 건설된 고대 궁궐 요새로 유네스코 세계유산입니다. '하늘의 요새'라 불리는 이곳의 프레스코 벽화와 전망이 경이롭습니다.", spots:[
  {name:"시기리야 요새", wikiTitle:"Sigiriya", type:"역사", desc:"200m 높이 바위 위에 건설된 5세기 궁궐 유적입니다. 사자 발톱 입구와 프레스코 벽화가 유명합니다.", rating:4.8, openTime:"07:00~17:30", price:"$30", website:"https://en.wikipedia.org/wiki/Sigiriya"},
  {name:"피두랑갈라 바위", wikiTitle:"Pidurangala Rock", type:"자연", desc:"시기리야 건너편의 바위로 올라가면 시기리야 요새의 전경을 바라보는 최고의 뷰포인트입니다.", rating:4.6, openTime:"06:00~18:00", price:"Rs 500", website:"https://en.wikipedia.org/wiki/Pidurangala_Rock"},
]},
"누와라엘리야": { description:"누와라엘리야는 해발 1,868m의 고원 도시로 '리틀 잉글랜드'라 불리며 영국 식민지 시대의 분위기가 남아 있습니다. 스리랑카 최고의 차 산지입니다.", spots:[
  {name:"차 농장 투어", wikiTitle:"Ceylon tea", type:"문화", desc:"스리랑카 홍차(실론티)의 본고장으로 차밭 사이를 걸으며 차 제조 과정을 견학할 수 있습니다.", rating:4.5, openTime:"08:00~17:00", price:"Rs 500", website:"https://en.wikipedia.org/wiki/Ceylon_tea"},
  {name:"호르턴 플레인스", wikiTitle:"Horton Plains National Park", type:"자연", desc:"세계의 끝(World's End)이라 불리는 절벽에서 880m 아래 차밭과 마을을 내려다보는 장관이 펼쳐집니다.", rating:4.7, openTime:"06:00~18:00", price:"Rs 3,000", website:"https://en.wikipedia.org/wiki/Horton_Plains_National_Park"},
]},

// ────────────────────────── 필리핀 ──────────────────────────
"마닐라": { description:"마닐라는 필리핀의 수도로 스페인 식민지 시대의 인트라무로스 요새와 현대적 도시가 공존하는 활기찬 메트로폴리스입니다.", spots:[
  {name:"인트라무로스", wikiTitle:"Intramuros", type:"역사", desc:"스페인이 16세기에 건설한 성벽 도시로 산 아구스틴 성당(유네스코 유산)과 산티아고 요새가 있습니다.", rating:4.5, openTime:"08:00~18:00", price:"₱75(요새)", website:"https://en.wikipedia.org/wiki/Intramuros"},
  {name:"산 아구스틴 성당", wikiTitle:"San Agustin Church (Manila)", type:"역사", desc:"1607년에 완공된 필리핀에서 가장 오래된 석조 교회로 유네스코 세계유산입니다.", rating:4.5, openTime:"08:00~12:00, 13:00~18:00", price:"₱200", website:"https://en.wikipedia.org/wiki/San_Agustin_Church_(Manila)"},
  {name:"리잘 공원", wikiTitle:"Rizal Park", type:"도시", desc:"필리핀 국민 영웅 호세 리잘을 기리는 60헥타르의 도심 공원으로 독립의 상징적 장소입니다.", rating:4.3, openTime:"05:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Rizal_Park"},
]},
"팔라완": { description:"팔라완은 세계에서 가장 아름다운 섬으로 여러 차례 선정된 필리핀의 보석입니다. 엘니도의 석회암 절벽과 푸에르토 프린세사 지하강이 대표적입니다.", spots:[
  {name:"엘니도", wikiTitle:"El Nido, Palawan", type:"자연", desc:"에메랄드빛 라군과 석회암 절벽에 둘러싸인 섬들이 환상적인 아일랜드 호핑 투어의 성지입니다.", rating:4.9, openTime:"연중", price:"₱200(환경세)", website:"https://www.elnidopalawan.com"},
  {name:"푸에르토 프린세사 지하강", wikiTitle:"Puerto Princesa Subterranean River National Park", type:"자연", desc:"8.2km 길이의 세계 최장급 지하 하천으로 유네스코 세계유산입니다. 보트로 동굴 내부를 탐험합니다.", rating:4.7, openTime:"08:00~16:00", price:"₱500", website:"https://en.wikipedia.org/wiki/Puerto_Princesa_Subterranean_River_National_Park"},
]},
"보라카이": { description:"보라카이는 4km의 새하얀 화이트비치로 유명한 세계적 해변 휴양지입니다. 투명한 바다와 화려한 석양이 여행자를 매료시킵니다.", spots:[
  {name:"화이트 비치", wikiTitle:"White Beach (Boracay)", type:"자연", desc:"4km의 새하얀 파우더 모래와 터키옥빛 바다가 펼쳐진 세계적 해변입니다.", rating:4.8, openTime:"24시간", price:"무료(환경세 ₱300)", website:"https://en.wikipedia.org/wiki/White_Beach_(Boracay)"},
  {name:"디몰 비치", wikiTitle:"Boracay", type:"자연", desc:"거대한 바위 사이의 작은 해변으로 보라카이에서 가장 아름다운 일몰을 볼 수 있는 숨은 명소입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Boracay"},
]},
"세부": { description:"세부는 필리핀 최초의 스페인 식민지로 역사적 유적과 환상적인 해양 액티비티가 공존합니다. 오슬롭의 고래상어 체험이 특히 유명합니다.", spots:[
  {name:"오슬롭 고래상어 체험", wikiTitle:"Oslob, Cebu", type:"자연", desc:"거대한 고래상어와 함께 수영할 수 있는 세계적으로 유명한 체험 스폿입니다.", rating:4.6, openTime:"06:00~12:00", price:"₱1,000", website:"https://en.wikipedia.org/wiki/Oslob,_Cebu"},
  {name:"산토니뇨 성당", wikiTitle:"Basilica del Santo Niño", type:"역사", desc:"1565년에 건립된 필리핀에서 가장 오래된 가톨릭 성당으로 아기 예수상이 모셔져 있습니다.", rating:4.4, openTime:"05:00~20:00", price:"무료", website:"https://en.wikipedia.org/wiki/Basilica_del_Santo_Niño"},
  {name:"카와산 폭포", wikiTitle:"Kawasan Falls", type:"자연", desc:"세부 남부의 다층 폭포로 에메랄드빛 물웅덩이에서 수영과 캐녀닝을 즐길 수 있습니다.", rating:4.6, openTime:"06:00~17:00", price:"₱45", website:"https://en.wikipedia.org/wiki/Kawasan_Falls"},
]},
"시아르가오": { description:"시아르가오는 필리핀 동부의 서핑 수도로 클라우드나인 파도와 원시 자연이 매력적인 떠오르는 여행지입니다.", spots:[
  {name:"클라우드 나인", wikiTitle:"Cloud 9 (surfing)", type:"자연", desc:"세계적으로 유명한 서핑 스폿으로 두꺼운 튜브 파도가 서퍼들의 꿈의 무대입니다.", rating:4.7, openTime:"24시간", price:"₱50(전망대)", website:"https://en.wikipedia.org/wiki/Cloud_9_(surfing)"},
  {name:"네이키드 아일랜드", wikiTitle:"Siargao", type:"자연", desc:"야자수 한 그루만 있는 작은 모래섬으로 스노클링과 사진 촬영의 천국입니다.", rating:4.5, openTime:"06:00~17:00", price:"₱200(보트)", website:"https://en.wikipedia.org/wiki/Siargao"},
]},

// ────────────────────────── 이집트 ──────────────────────────
"카이로": { description:"카이로는 이집트의 수도로 기자 피라미드와 이슬람 건축의 보고가 공존하는 아프리카 최대의 도시입니다. 나일강을 끼고 7,000년 문명의 유산이 펼쳐집니다.", spots:[
  {name:"기자 피라미드", wikiTitle:"Giza pyramid complex", type:"역사", desc:"세계 7대 불가사의 중 유일하게 현존하는 건축물로 쿠푸, 카프레, 멘카우레 3개의 대피라미드가 있습니다.", rating:4.8, openTime:"07:00~17:00", price:"EGP 200", website:"https://en.wikipedia.org/wiki/Giza_pyramid_complex"},
  {name:"스핑크스", wikiTitle:"Great Sphinx of Giza", type:"역사", desc:"인간의 머리와 사자의 몸을 한 73m 길이의 거대 석상으로 피라미드를 수호하고 있습니다.", rating:4.7, openTime:"07:00~17:00", price:"피라미드 입장료 포함", website:"https://en.wikipedia.org/wiki/Great_Sphinx_of_Giza"},
  {name:"이집트 박물관", wikiTitle:"Egyptian Museum", type:"문화", desc:"투탕카멘의 황금 마스크를 포함해 12만 점 이상의 고대 이집트 유물을 소장한 세계적 박물관입니다.", rating:4.6, openTime:"09:00~17:00", price:"EGP 200", website:"https://en.wikipedia.org/wiki/Egyptian_Museum"},
  {name:"칸 엘 칼릴리 시장", wikiTitle:"Khan el-Khalili", type:"문화", desc:"14세기부터 이어진 중동 최대의 바자르로 향신료, 보석, 수공예품이 미로 같은 골목에 가득합니다.", rating:4.4, openTime:"09:00~23:00", price:"무료", website:"https://en.wikipedia.org/wiki/Khan_el-Khalili"},
]},
"룩소르": { description:"룩소르는 고대 이집트의 수도 테베가 있던 곳으로 세계 최대의 야외 박물관이라 불립니다. 왕가의 계곡과 카르낙 신전이 압도적입니다.", spots:[
  {name:"왕가의 계곡", wikiTitle:"Valley of the Kings", type:"역사", desc:"투탕카멘을 포함한 63명의 파라오 무덤이 발굴된 곳으로 무덤 내부의 벽화가 3,000년 전 색채를 유지하고 있습니다.", rating:4.8, openTime:"06:00~17:00", price:"EGP 240", website:"https://en.wikipedia.org/wiki/Valley_of_the_Kings"},
  {name:"카르낙 신전", wikiTitle:"Karnak", type:"역사", desc:"4,000년에 걸쳐 건설된 세계 최대의 종교 건축 단지로 134개의 거대 기둥이 줄지어 선 대열주실이 압도적입니다.", rating:4.8, openTime:"06:00~17:30", price:"EGP 150", website:"https://en.wikipedia.org/wiki/Karnak"},
  {name:"룩소르 신전", wikiTitle:"Luxor Temple", type:"역사", desc:"나일강변에 자리한 아멘호텝 3세의 신전으로 야간 조명이 특히 아름답습니다.", rating:4.6, openTime:"06:00~22:00", price:"EGP 100", website:"https://en.wikipedia.org/wiki/Luxor_Temple"},
]},
"아스완": { description:"아스완은 이집트 남부 누비아 문화의 중심지로 나일강이 가장 아름다운 구간을 흐르는 곳입니다. 아부심벨 신전 투어의 거점 도시이기도 합니다.", spots:[
  {name:"아부심벨 대신전", wikiTitle:"Abu Simbel temples", type:"역사", desc:"람세스 2세가 건설한 거대한 암굴 신전으로 20m 높이의 파라오 좌상 4개가 입구를 지킵니다. 댐 건설로 통째로 이전한 것으로도 유명합니다.", rating:4.9, openTime:"05:00~18:00", price:"EGP 255", website:"https://en.wikipedia.org/wiki/Abu_Simbel_temples"},
  {name:"필레 신전", wikiTitle:"Philae", type:"역사", desc:"나일강 섬 위에 자리한 이시스 여신의 사원으로 보트로만 접근할 수 있습니다. 밤의 음향·조명 쇼가 유명합니다.", rating:4.6, openTime:"07:00~16:00", price:"EGP 150", website:"https://en.wikipedia.org/wiki/Philae"},
]},
"알렉산드리아": { description:"알렉산드리아는 알렉산더 대왕이 건설한 지중해 항구 도시로 고대 세계 최대의 도서관이 있던 곳입니다. 현대적 알렉산드리아 도서관이 그 전통을 잇고 있습니다.", spots:[
  {name:"알렉산드리아 도서관", wikiTitle:"Bibliotheca Alexandrina", type:"문화", desc:"고대 알렉산드리아 도서관을 기념하여 2002년에 개관한 현대식 도서관으로 독특한 원반형 건축이 인상적입니다.", rating:4.5, openTime:"10:00~19:00", price:"EGP 70", website:"https://www.bibalex.org"},
  {name:"카이트바이 요새", wikiTitle:"Citadel of Qaitbay", type:"역사", desc:"15세기에 건설된 해안 요새로 고대 세계 7대 불가사의인 파로스 등대 자리에 세워졌습니다.", rating:4.4, openTime:"08:00~17:00", price:"EGP 60", website:"https://en.wikipedia.org/wiki/Citadel_of_Qaitbay"},
]},
"후르가다": { description:"후르가다는 홍해 연안 최대의 리조트 도시로 산호초와 열대어가 가득한 다이빙·스노클링의 천국입니다.", spots:[
  {name:"기프툰 섬", wikiTitle:"Giftun Islands", type:"자연", desc:"투명한 홍해에서 스노클링과 다이빙을 즐길 수 있는 아름다운 섬으로 돌고래와 함께 수영이 가능합니다.", rating:4.6, openTime:"08:00~17:00", price:"$25(보트투어)", website:"https://en.wikipedia.org/wiki/Giftun_Islands"},
  {name:"사하라 사막 사파리", wikiTitle:"Eastern Desert", type:"자연", desc:"쿼드바이크나 지프로 사막을 달리며 베두인 마을을 방문하고 별이 쏟아지는 밤하늘을 감상합니다.", rating:4.4, openTime:"오후~저녁", price:"$30~50", website:"https://en.wikipedia.org/wiki/Eastern_Desert"},
]},
"샤름엘셰이크": { description:"샤름엘셰이크는 시나이 반도 끝자락에 위치한 고급 리조트 도시로 홍해 최고의 다이빙 포인트와 시나이 산이 인근에 있습니다.", spots:[
  {name:"라스 무함마드 국립공원", wikiTitle:"Ras Muhammad", type:"자연", desc:"세계 최고의 다이빙 스폿 중 하나로 맹그로브 숲과 산호초가 만나는 독특한 생태계를 자랑합니다.", rating:4.7, openTime:"08:00~17:00", price:"$10", website:"https://en.wikipedia.org/wiki/Ras_Muhammad"},
  {name:"나마 베이", wikiTitle:"Naama Bay", type:"도시", desc:"샤름엘셰이크의 중심 해변으로 레스토랑, 쇼핑, 수상 스포츠를 모두 즐길 수 있습니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Naama_Bay"},
]},

// ────────────────────────── 모로코 ──────────────────────────
"마라케시": { description:"마라케시는 '붉은 도시'라 불리는 모로코의 옛 수도로 제마 엘프나 광장의 활기와 미로 같은 수크(시장)가 감각을 압도합니다.", spots:[
  {name:"제마 엘프나 광장", wikiTitle:"Jemaa el-Fnaa", type:"문화", desc:"뱀 부리는 사람, 음악가, 곡예사가 모이는 아프리카에서 가장 활기찬 광장입니다. 유네스코 무형유산입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Jemaa_el-Fnaa"},
  {name:"마조렐 정원", wikiTitle:"Majorelle Garden", type:"자연", desc:"이브 생로랑이 복원한 선명한 파란색 정원으로 선인장과 열대식물이 아름답습니다.", rating:4.6, openTime:"08:00~18:00", price:"MAD 70", website:"https://www.jardinmajorelle.com"},
  {name:"바히아 궁전", wikiTitle:"Bahia Palace", type:"역사", desc:"19세기 대재상의 궁전으로 정교한 젤리즈 타일과 삼나무 조각이 이슬람 건축의 정수를 보여줍니다.", rating:4.5, openTime:"09:00~17:00", price:"MAD 70", website:"https://en.wikipedia.org/wiki/Bahia_Palace"},
]},
"페스": { description:"페스는 세계에서 가장 큰 차 없는 도시 구역을 가진 모로코의 문화 수도입니다. 9,000개 이상의 미로 같은 골목과 중세 그대로의 풍경이 타임슬립한 듯한 경험을 선사합니다.", spots:[
  {name:"페스 엘 발리(구시가지)", wikiTitle:"Fes el Bali", type:"역사", desc:"세계 최대의 차 없는 도시 구역으로 9,400개 골목에 모스크, 마드라사, 수크가 밀집해 있습니다. 유네스코 세계유산입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Fes_el_Bali"},
  {name:"슈아라 가죽 염색장", wikiTitle:"Chouara tannery", type:"문화", desc:"11세기부터 이어진 전통 가죽 염색장으로 알록달록한 염색 구덩이들이 장관입니다.", rating:4.5, openTime:"08:00~18:00", price:"MAD 20(팁)", website:"https://en.wikipedia.org/wiki/Chouara_tannery"},
]},
"카사블랑카": { description:"카사블랑카는 모로코 최대의 경제 도시로 아르데코 건축과 현대적 스카이라인, 세계에서 가장 높은 미나렛이 있는 모스크가 공존합니다.", spots:[
  {name:"하산 2세 모스크", wikiTitle:"Hassan II Mosque", type:"역사", desc:"대서양 위에 지어진 모스크로 210m 높이의 미나렛은 세계에서 가장 높습니다. 비무슬림도 내부 견학이 가능합니다.", rating:4.8, openTime:"09:00~14:00(투어)", price:"MAD 130", website:"https://en.wikipedia.org/wiki/Hassan_II_Mosque"},
  {name:"올드 메디나", wikiTitle:"Old Medina of Casablanca", type:"문화", desc:"카사블랑카의 전통 시장 지구로 향신료, 수공예품, 현지 음식을 만날 수 있습니다.", rating:4.2, openTime:"08:00~20:00", price:"무료", website:"https://en.wikipedia.org/wiki/Old_Medina_of_Casablanca"},
]},
"셰프샤우엔": { description:"셰프샤우엔은 '블루 시티'로 불리는 리프 산맥 속의 작은 마을로 건물 전체가 파란색으로 칠해진 동화 같은 풍경으로 유명합니다.", spots:[
  {name:"메디나(블루시티)", wikiTitle:"Chefchaouen", type:"문화", desc:"온통 파란색으로 칠해진 골목과 건물이 환상적인 포토제닉 마을입니다. 15세기 무어인이 건설했습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Chefchaouen"},
  {name:"스페인 모스크 전망대", wikiTitle:"Chefchaouen", type:"랜드마크", desc:"마을 외곽 언덕에서 파란 마을 전체와 리프 산맥을 한눈에 볼 수 있는 최고의 전망대입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Chefchaouen"},
]},
"에사우이라": { description:"에사우이라는 대서양 연안의 바람의 도시로 18세기 요새와 푸른 어선, 갈매기가 어우러진 유네스코 세계유산 항구 도시입니다.", spots:[
  {name:"에사우이라 메디나", wikiTitle:"Medina of Essaouira", type:"역사", desc:"18세기 유럽과 이슬람 건축이 융합된 항구 도시의 구시가지입니다. 유네스코 세계유산입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Medina_of_Essaouira"},
  {name:"스칼라 드 라 빌", wikiTitle:"Essaouira", type:"역사", desc:"18세기 해안 방어 요새로 대포가 줄지어 있으며 대서양의 거대한 파도를 바라보는 전망이 멋집니다.", rating:4.4, openTime:"09:00~18:00", price:"MAD 10", website:"https://en.wikipedia.org/wiki/Essaouira"},
]},
"메르주가": { description:"메르주가는 사하라 사막의 관문으로 에르그 셰비 모래 사구에서 낙타 트레킹과 사막 캠핑을 즐길 수 있는 꿈같은 곳입니다.", spots:[
  {name:"에르그 셰비 사구", wikiTitle:"Erg Chebbi", type:"자연", desc:"높이 150m까지 이르는 거대한 사하라 모래 사구로 일출·일몰의 색채 변화가 경이롭습니다.", rating:4.8, openTime:"24시간", price:"낙타투어 MAD 300~", website:"https://en.wikipedia.org/wiki/Erg_Chebbi"},
  {name:"사막 캠프 별 관측", wikiTitle:"Sahara", type:"자연", desc:"사하라 사막 한가운데 텐트에서 밤하늘의 은하수를 감상하는 잊을 수 없는 경험입니다.", rating:4.7, openTime:"야간", price:"1박 MAD 500~", website:"https://en.wikipedia.org/wiki/Erg_Chebbi"},
]},

// ────────────────────────── 포르투갈 ──────────────────────────
"리스본": { description:"리스본은 일곱 언덕 위에 세워진 포르투갈의 수도로 대항해 시대의 영광과 파두 음악, 파스텔 드 나타의 도시입니다. 노란 트램이 좁은 골목을 오르내리는 풍경이 상징적입니다.", spots:[
  {name:"벨렝 탑", wikiTitle:"Belém Tower", type:"역사", desc:"대항해 시대의 출발점이었던 16세기 요새 탑으로 유네스코 세계유산입니다. 마누엘 양식의 정교한 조각이 돋보입니다.", rating:4.6, openTime:"10:00~17:30", price:"€8", website:"https://www.patrimoniocultural.gov.pt"},
  {name:"제로니무스 수도원", wikiTitle:"Jerónimos Monastery", type:"역사", desc:"바스코 다 가마의 항해 성공을 기념하여 건설된 유네스코 세계유산 수도원으로 마누엘 건축의 걸작입니다.", rating:4.7, openTime:"10:00~17:30", price:"€10", website:"https://www.patrimoniocultural.gov.pt"},
  {name:"28번 트램", wikiTitle:"Tram 28", type:"도시", desc:"리스본의 좁은 언덕 골목을 오르내리는 노란 빈티지 트램으로 도시의 주요 명소를 지나갑니다.", rating:4.5, openTime:"06:00~23:00", price:"€3.5", website:"https://en.wikipedia.org/wiki/Tram_28"},
  {name:"파스텔 드 벨렝", wikiTitle:"Pastéis de Belém", type:"음식", desc:"1837년부터 비밀 레시피로 만들어온 원조 에그타르트 가게입니다. 시나몬을 뿌려 먹는 것이 정석입니다.", rating:4.7, openTime:"08:00~23:00", price:"€1.5", website:"https://en.wikipedia.org/wiki/Pastéis_de_Belém"},
]},
"포르투": { description:"포르투는 포트와인의 산지이자 아줄레주(청백 타일) 건축이 아름다운 포르투갈 제2의 도시입니다. 도우루강변의 풍경이 유네스코 세계유산입니다.", spots:[
  {name:"리브라리아 레요", wikiTitle:"Livraria Lello", type:"문화", desc:"1906년 개관한 세계에서 가장 아름다운 서점 중 하나로 해리포터의 영감이 된 곳으로 알려져 있습니다.", rating:4.5, openTime:"09:00~19:00", price:"€5(구매시 차감)", website:"https://www.livrarialello.pt"},
  {name:"상벤투 기차역", wikiTitle:"São Bento railway station", type:"역사", desc:"2만 개의 아줄레주 타일로 장식된 기차역으로 포르투갈 역사의 주요 장면이 묘사되어 있습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/São_Bento_railway_station"},
  {name:"도우루강 와이너리 투어", wikiTitle:"Vila Nova de Gaia", type:"음식", desc:"도우루강 남쪽 빌라노바데가이아에 모여있는 포트와인 와이너리에서 시음과 투어를 즐길 수 있습니다.", rating:4.6, openTime:"10:00~18:00", price:"€15~20", website:"https://en.wikipedia.org/wiki/Port_wine"},
]},
"신트라": { description:"신트라는 리스본 근교의 동화 같은 마을로 안개 낀 숲속에 화려한 궁전과 성이 숨어 있는 유네스코 세계유산입니다.", spots:[
  {name:"페나 궁전", wikiTitle:"Pena Palace", type:"역사", desc:"선명한 노란색과 빨간색의 낭만주의 건축 궁전으로 산꼭대기에서 대서양까지 조망할 수 있습니다.", rating:4.7, openTime:"09:30~18:30", price:"€14", website:"https://www.parquesdesintra.pt"},
  {name:"무어 성", wikiTitle:"Castle of the Moors", type:"역사", desc:"8세기 무어인이 건설한 산성으로 성벽을 따라 걸으며 신트라 계곡과 대서양을 조망할 수 있습니다.", rating:4.5, openTime:"09:30~18:00", price:"€8", website:"https://www.parquesdesintra.pt"},
]},
"알가르브": { description:"알가르브는 포르투갈 최남단의 해안 지역으로 황금빛 절벽과 동굴, 맑은 바다가 유럽 최고의 해변 휴양지로 꼽힙니다.", spots:[
  {name:"베나길 동굴", wikiTitle:"Benagil Cave", type:"자연", desc:"바다 동굴 천장에 뚫린 구멍으로 햇빛이 쏟아져 내리는 환상적인 자연 조형물입니다. 보트나 카약으로만 접근 가능합니다.", rating:4.8, openTime:"09:00~17:00", price:"€20~30(보트)", website:"https://en.wikipedia.org/wiki/Benagil_Cave"},
  {name:"폰타 다 피에다드", wikiTitle:"Ponta da Piedade", type:"자연", desc:"황금빛 석회암 절벽과 기암괴석이 대서양 위로 솟아오른 알가르브의 대표 절경입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Ponta_da_Piedade"},
]},
"코임브라": { description:"코임브라는 유럽에서 가장 오래된 대학 중 하나인 코임브라 대학교가 있는 학술 도시로 유네스코 세계유산입니다.", spots:[
  {name:"코임브라 대학교", wikiTitle:"University of Coimbra", type:"역사", desc:"1290년에 설립된 포르투갈 최고의 대학으로 요아니나 도서관의 바로크 장식이 압도적입니다.", rating:4.6, openTime:"09:00~17:00", price:"€12.5", website:"https://en.wikipedia.org/wiki/University_of_Coimbra"},
  {name:"구 대성당(세 벨랴)", wikiTitle:"Old Cathedral of Coimbra", type:"역사", desc:"12세기 로마네스크 양식의 요새형 대성당으로 포르투갈 가장 중요한 중세 건축물 중 하나입니다.", rating:4.4, openTime:"10:00~17:30", price:"€2.5", website:"https://en.wikipedia.org/wiki/Old_Cathedral_of_Coimbra"},
]},
"마데이라": { description:"마데이라는 대서양의 진주로 불리는 포르투갈의 화산섬으로 열대 정원, 해안 절벽, 레바다 트레킹으로 유명합니다.", spots:[
  {name:"카보 지랑 전망대", wikiTitle:"Cabo Girão", type:"자연", desc:"유럽 최고 높이(580m)의 해안 절벽 전망대로 유리 바닥 스카이워크에서 아래를 내려다볼 수 있습니다.", rating:4.7, openTime:"09:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Cabo_Girão"},
  {name:"레바다 트레킹", wikiTitle:"Levada", type:"자연", desc:"관개 수로를 따라 걷는 마데이라 특유의 트레킹 코스로 열대우림과 폭포를 지나갑니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Levada"},
]},

// ────────────────────────── 네덜란드 ──────────────────────────
"암스테르담": { description:"암스테르담은 운하와 자전거, 튤립의 도시로 자유로운 분위기와 세계적 미술관이 매력적인 네덜란드의 수도입니다.", spots:[
  {name:"안네 프랑크의 집", wikiTitle:"Anne Frank House", type:"역사", desc:"2차대전 중 안네 프랑크 가족이 숨어 살았던 은신처로 전쟁의 비극을 생생히 전합니다.", rating:4.7, openTime:"09:00~22:00", price:"€16", website:"https://www.annefrank.org"},
  {name:"국립미술관(레이크스뮤지엄)", wikiTitle:"Rijksmuseum", type:"문화", desc:"렘브란트의 '야경'을 소장한 네덜란드 최고의 미술관으로 80만 점의 예술품을 보유하고 있습니다.", rating:4.8, openTime:"09:00~17:00", price:"€22.5", website:"https://www.rijksmuseum.nl"},
  {name:"반 고흐 미술관", wikiTitle:"Van Gogh Museum", type:"문화", desc:"빈센트 반 고흐의 작품 200여 점을 소장한 세계 최대의 고흐 컬렉션입니다.", rating:4.7, openTime:"09:00~18:00", price:"€20", website:"https://www.vangoghmuseum.nl"},
  {name:"운하 크루즈", wikiTitle:"Canals of Amsterdam", type:"도시", desc:"유네스코 세계유산인 165개 운하를 보트로 유람하며 17세기 황금기 건축물을 감상합니다.", rating:4.5, openTime:"09:00~22:00", price:"€16~20", website:"https://en.wikipedia.org/wiki/Canals_of_Amsterdam"},
]},
"로테르담": { description:"로테르담은 2차대전 폭격 후 재건된 현대 건축의 실험장으로 유럽에서 가장 혁신적인 스카이라인을 자랑합니다.", spots:[
  {name:"큐브 하우스", wikiTitle:"Cube house", type:"랜드마크", desc:"45도 기울어진 큐브 모양의 주거 건축물로 네덜란드 혁신 건축의 상징입니다.", rating:4.4, openTime:"10:00~17:00", price:"€3(모델하우스)", website:"https://en.wikipedia.org/wiki/Cube_house"},
  {name:"마르크트할", wikiTitle:"Markthal", type:"음식", desc:"거대한 아치형 건물 내부에 거대한 벽화와 함께 음식 시장이 펼쳐지는 현대 건축의 걸작입니다.", rating:4.5, openTime:"10:00~20:00", price:"무료", website:"https://en.wikipedia.org/wiki/Markthal"},
  {name:"에라스무스 다리", wikiTitle:"Erasmusbrug", type:"랜드마크", desc:"백조의 목 형상을 한 802m 길이의 사장교로 로테르담의 상징적 랜드마크입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Erasmusbrug"},
]},
"헤이그": { description:"헤이그는 네덜란드의 행정 수도이자 국제사법재판소가 있는 세계 평화와 정의의 도시입니다.", spots:[
  {name:"마우리츠호이스 미술관", wikiTitle:"Mauritshuis", type:"문화", desc:"베르메르의 '진주 귀걸이 소녀'와 렘브란트의 '튈프 박사의 해부학 강의'를 소장한 미술관입니다.", rating:4.7, openTime:"10:00~18:00", price:"€17.5", website:"https://www.mauritshuis.nl"},
  {name:"평화궁", wikiTitle:"Peace Palace", type:"역사", desc:"국제사법재판소가 있는 네오르네상스 건축물로 세계 평화의 상징입니다.", rating:4.4, openTime:"10:00~17:00(가이드투어)", price:"€10.5", website:"https://en.wikipedia.org/wiki/Peace_Palace"},
]},
"위트레흐트": { description:"위트레흐트는 돔 타워가 상징하는 중세 대학 도시로 운하를 따라 카페와 레스토랑이 들어선 독특한 하층 부두가 매력적입니다.", spots:[
  {name:"돔 타워", wikiTitle:"Dom Tower of Utrecht", type:"역사", desc:"112m 높이의 네덜란드에서 가장 높은 교회 탑으로 465개 계단을 올라가면 멀리 암스테르담까지 보입니다.", rating:4.5, openTime:"10:00~17:00", price:"€12.5", website:"https://en.wikipedia.org/wiki/Dom_Tower_of_Utrecht"},
  {name:"운하 하층 부두(워프)", wikiTitle:"Oudegracht", type:"도시", desc:"수면 아래 1층에 카페와 레스토랑이 들어선 위트레흐트만의 독특한 운하 구조입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Oudegracht"},
]},
"마스트리흐트": { description:"마스트리흐트는 네덜란드 최남단의 중세 도시로 EU 탄생지(마스트리흐트 조약)이며 미식과 역사가 풍부합니다.", spots:[
  {name:"도미니카넨 서점", wikiTitle:"Selexyz Dominicanen", type:"문화", desc:"13세기 고딕 교회를 개조한 세계에서 가장 아름다운 서점 중 하나입니다.", rating:4.6, openTime:"10:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Selexyz_Dominicanen"},
  {name:"프리트호프 광장", wikiTitle:"Maastricht", type:"도시", desc:"마스트리흐트의 중심 광장으로 카페 테라스가 둘러싸고 있으며 성세르바스 성당이 인접해 있습니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Maastricht"},
]},

// ────────────────────────── 체코 ──────────────────────────
"프라하": { description:"프라하는 '백 개의 첨탑의 도시'로 불리는 체코의 수도로 고딕, 바로크, 아르누보 건축이 완벽하게 보존된 유럽에서 가장 아름다운 도시 중 하나입니다.", spots:[
  {name:"카를교", wikiTitle:"Charles Bridge", type:"역사", desc:"1357년에 건설이 시작된 블타바 강 위의 석조 다리로 30개의 바로크 성인상이 양쪽에 늘어서 있습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Charles_Bridge"},
  {name:"프라하 성", wikiTitle:"Prague Castle", type:"역사", desc:"세계 최대의 고대 성곽 단지로 성 비투스 대성당, 구 왕궁, 황금 소로가 포함되어 있습니다.", rating:4.8, openTime:"06:00~22:00", price:"CZK 350", website:"https://www.hrad.cz"},
  {name:"구시가지 광장", wikiTitle:"Old Town Square (Prague)", type:"역사", desc:"틴 성당과 천문시계가 있는 프라하의 심장으로 매 시간 천문시계의 인형극이 펼쳐집니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Old_Town_Square_(Prague)"},
  {name:"천문시계", wikiTitle:"Prague astronomical clock", type:"랜드마크", desc:"1410년에 제작된 세계에서 가장 오래된 작동하는 천문시계로 매 시간 12사도 인형이 나타납니다.", rating:4.6, openTime:"24시간(내부 09:00~21:00)", price:"CZK 250(타워)", website:"https://en.wikipedia.org/wiki/Prague_astronomical_clock"},
]},
"체스키크룸로프": { description:"체스키크룸로프는 블타바 강이 S자로 감싸 안은 중세 마을로 13세기 그대로의 모습이 보존된 유네스코 세계유산입니다.", spots:[
  {name:"체스키크룸로프 성", wikiTitle:"Český Krumlov Castle", type:"역사", desc:"프라하 성 다음으로 체코에서 두 번째로 큰 성으로 바로크 극장과 아름다운 정원이 있습니다.", rating:4.7, openTime:"09:00~17:00", price:"CZK 260", website:"https://en.wikipedia.org/wiki/Český_Krumlov_Castle"},
  {name:"구시가지", wikiTitle:"Český Krumlov", type:"역사", desc:"블타바 강이 감싸 안은 중세 마을로 좁은 골목과 르네상스 건물이 동화 속 세계 같습니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Český_Krumlov"},
]},
"브르노": { description:"브르노는 체코 제2의 도시로 멘델이 유전 법칙을 발견한 곳이며 기능주의 건축의 걸작 투겐트하트 별장이 있습니다.", spots:[
  {name:"투겐트하트 별장", wikiTitle:"Villa Tugendhat", type:"역사", desc:"미스 반 데어 로에가 설계한 기능주의 건축의 걸작으로 유네스코 세계유산입니다.", rating:4.5, openTime:"10:00~18:00", price:"CZK 350", website:"https://en.wikipedia.org/wiki/Villa_Tugendhat"},
  {name:"슈필베르크 성", wikiTitle:"Špilberk Castle", type:"역사", desc:"13세기 왕궁 겸 요새로 브르노 시내를 한눈에 조망할 수 있는 전망대가 있습니다.", rating:4.3, openTime:"09:00~17:00", price:"CZK 120", website:"https://en.wikipedia.org/wiki/Špilberk_Castle"},
]},

// ────────────────────────── 오스트리아 ──────────────────────────
"빈": { description:"빈은 음악의 수도로 모차르트, 베토벤, 슈트라우스가 활동했던 오스트리아의 수도입니다. 합스부르크 왕조의 화려한 궁전과 카페 문화가 매력적입니다.", spots:[
  {name:"쇤브룬 궁전", wikiTitle:"Schönbrunn Palace", type:"역사", desc:"합스부르크 왕조의 여름 궁전으로 1,441개의 방과 아름다운 바로크 정원이 있는 유네스코 세계유산입니다.", rating:4.8, openTime:"09:00~17:00", price:"€22", website:"https://www.schoenbrunn.at"},
  {name:"성 슈테판 대성당", wikiTitle:"St. Stephen's Cathedral, Vienna", type:"역사", desc:"빈의 상징인 고딕 성당으로 137m 높이의 남탑에서 도시 전경을 조망할 수 있습니다.", rating:4.7, openTime:"06:00~22:00", price:"€6(타워)", website:"https://en.wikipedia.org/wiki/St._Stephen's_Cathedral,_Vienna"},
  {name:"벨베데레 궁전", wikiTitle:"Belvedere, Vienna", type:"문화", desc:"클림트의 '키스'를 소장한 미술관 겸 바로크 궁전으로 정원에서 빈 시가지가 한눈에 보입니다.", rating:4.6, openTime:"10:00~18:00", price:"€16", website:"https://www.belvedere.at"},
  {name:"카페 자허", wikiTitle:"Café Sacher", type:"음식", desc:"1832년부터 이어온 원조 자허토르테(초콜릿 케이크)를 맛볼 수 있는 빈의 전설적 카페입니다.", rating:4.5, openTime:"08:00~24:00", price:"€8~12", website:"https://www.sacher.com"},
]},
"잘츠부르크": { description:"잘츠부르크는 모차르트의 탄생지이자 영화 '사운드 오브 뮤직'의 배경으로 알프스 산맥 아래 바로크 건축이 아름다운 도시입니다.", spots:[
  {name:"호엔잘츠부르크 요새", wikiTitle:"Hohensalzburg Fortress", type:"역사", desc:"유럽 최대의 완전 보존된 중세 성으로 도시 위 언덕에서 잘츠부르크와 알프스의 파노라마를 선사합니다.", rating:4.7, openTime:"09:00~17:00", price:"€13.80", website:"https://www.salzburg-burgen.at"},
  {name:"모차르트 생가", wikiTitle:"Mozart's birthplace", type:"문화", desc:"1756년 모차르트가 태어난 게트라이데 거리의 노란 건물로 그의 유품과 악기가 전시되어 있습니다.", rating:4.4, openTime:"09:00~17:30", price:"€12", website:"https://en.wikipedia.org/wiki/Mozart's_birthplace"},
  {name:"미라벨 정원", wikiTitle:"Mirabell Palace", type:"자연", desc:"'사운드 오브 뮤직'의 도레미송 촬영지로 호엔잘츠부르크 요새를 배경으로 한 정원이 아름답습니다.", rating:4.5, openTime:"06:00~일몰", price:"무료", website:"https://en.wikipedia.org/wiki/Mirabell_Palace"},
]},
"인스브루크": { description:"인스브루크는 알프스에 둘러싸인 티롤 주의 주도로 중세 구시가지와 스키 리조트가 공존하는 동계 스포츠의 메카입니다.", spots:[
  {name:"황금 지붕", wikiTitle:"Goldenes Dachl", type:"역사", desc:"2,657개의 금박 구리 타일로 덮인 발코니로 1500년 막시밀리안 1세가 건설한 인스브루크의 상징입니다.", rating:4.4, openTime:"10:00~17:00", price:"€5(박물관)", website:"https://en.wikipedia.org/wiki/Goldenes_Dachl"},
  {name:"노르트케테 케이블카", wikiTitle:"Nordkette", type:"자연", desc:"도심에서 케이블카로 20분이면 해발 2,334m 알프스 전망대에 도달합니다. 도시와 알프스를 동시에 조망합니다.", rating:4.7, openTime:"08:30~17:30", price:"€39.50", website:"https://en.wikipedia.org/wiki/Nordkette"},
]},
"할슈타트": { description:"할슈타트는 알프스 호수 옆 절벽에 자리한 작은 마을로 세계에서 가장 아름다운 호수 마을로 꼽히는 유네스코 세계유산입니다.", spots:[
  {name:"할슈타트 전망대", wikiTitle:"Hallstatt", type:"자연", desc:"호수와 알프스 산맥, 파스텔색 마을이 한 폭의 그림처럼 펼쳐지는 세계적으로 유명한 뷰포인트입니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Hallstatt"},
  {name:"할슈타트 소금광산", wikiTitle:"Hallstatt salt mine", type:"역사", desc:"7,000년 역사의 세계에서 가장 오래된 소금광산으로 지하 미끄럼틀과 지하 호수를 체험할 수 있습니다.", rating:4.5, openTime:"09:30~16:00", price:"€36", website:"https://en.wikipedia.org/wiki/Hallstatt_salt_mine"},
]},
"그라츠": { description:"그라츠는 오스트리아 제2의 도시로 중세 구시가지와 현대 건축이 조화를 이루며 유네스코 세계유산으로 등재되어 있습니다.", spots:[
  {name:"슐로스베르크(성산)", wikiTitle:"Schloßberg", type:"역사", desc:"시계탑이 상징인 언덕으로 그라츠 시내 전경을 조망할 수 있습니다. 엘리베이터나 계단으로 올라갈 수 있습니다.", rating:4.5, openTime:"24시간", price:"무료(리프트 €2.5)", website:"https://en.wikipedia.org/wiki/Schloßberg"},
  {name:"쿤스트하우스", wikiTitle:"Kunsthaus Graz", type:"문화", desc:"'친화적 외계인'이라 불리는 독특한 외형의 현대미술관으로 그라츠의 혁신적 건축을 대표합니다.", rating:4.3, openTime:"10:00~17:00", price:"€11", website:"https://en.wikipedia.org/wiki/Kunsthaus_Graz"},
]},

// ────────────────────────── 스위스 ──────────────────────────
"취리히": { description:"취리히는 스위스 최대의 도시로 깨끗한 호수와 알프스 배경, 구시가지의 매력이 공존하는 금융과 문화의 중심지입니다.", spots:[
  {name:"취리히 호수", wikiTitle:"Lake Zurich", type:"자연", desc:"알프스를 배경으로 한 맑은 호수로 유람선, 수영, 산책을 즐길 수 있습니다.", rating:4.5, openTime:"24시간", price:"무료(유람선 CHF 9~)", website:"https://en.wikipedia.org/wiki/Lake_Zurich"},
  {name:"반호프슈트라세", wikiTitle:"Bahnhofstrasse", type:"도시", desc:"세계에서 가장 비싼 쇼핑 거리 중 하나로 명품 부티크와 스위스 초콜릿 매장이 줄지어 있습니다.", rating:4.3, openTime:"24시간(매장별)", price:"무료", website:"https://en.wikipedia.org/wiki/Bahnhofstrasse"},
  {name:"그로스뮌스터", wikiTitle:"Grossmünster", type:"역사", desc:"12세기 로마네스크 양식의 교회로 취리히의 상징입니다. 타워에서 구시가지와 호수를 조망할 수 있습니다.", rating:4.4, openTime:"10:00~18:00", price:"CHF 5(타워)", website:"https://en.wikipedia.org/wiki/Grossmünster"},
]},
"제네바": { description:"제네바는 레만 호수변에 자리한 국제기구의 도시로 UN 유럽 본부와 적십자 본부가 있으며 알프스와 몽블랑을 조망할 수 있습니다.", spots:[
  {name:"제트 도 제네바", wikiTitle:"Jet d'Eau", type:"랜드마크", desc:"140m 높이로 솟아오르는 레만 호수의 분수로 제네바의 상징입니다.", rating:4.5, openTime:"3~10월 주간", price:"무료", website:"https://en.wikipedia.org/wiki/Jet_d'Eau"},
  {name:"UN 유럽 본부", wikiTitle:"Palace of Nations", type:"역사", desc:"유엔 유럽 사무국으로 가이드 투어를 통해 내부를 견학할 수 있습니다.", rating:4.3, openTime:"10:00~16:00", price:"CHF 15", website:"https://en.wikipedia.org/wiki/Palace_of_Nations"},
  {name:"구시가지", wikiTitle:"Old Town of Geneva", type:"역사", desc:"성 피에르 대성당과 좁은 골목, 앤티크 가게가 어우러진 제네바의 역사 지구입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Old_Town_of_Geneva"},
]},
"인터라켄": { description:"인터라켄은 융프라우요흐 '유럽의 지붕'으로 가는 관문 도시로 툰 호수와 브리엔츠 호수 사이에 자리한 알프스 여행의 베이스캠프입니다.", spots:[
  {name:"융프라우요흐", wikiTitle:"Jungfraujoch", type:"자연", desc:"유럽에서 가장 높은 기차역(3,454m)에서 알레치 빙하와 알프스 파노라마를 감상할 수 있습니다.", rating:4.8, openTime:"연중(기차 08:00~)", price:"CHF 240(왕복)", website:"https://www.jungfrau.ch"},
  {name:"하더 쿨름 전망대", wikiTitle:"Harder Kulm", type:"자연", desc:"인터라켄 위 1,322m 전망대에서 아이거, 묀히, 융프라우 삼봉과 두 호수를 동시에 조망합니다.", rating:4.6, openTime:"4~11월", price:"CHF 35(푸니쿨라)", website:"https://www.jungfrau.ch/en-gb/harder-kulm"},
]},
"루체른": { description:"루체른은 스위스에서 가장 아름다운 도시로 중세 목조 다리와 루체른 호수, 필라투스 산이 어우러진 그림 같은 풍경을 자랑합니다.", spots:[
  {name:"카펠교", wikiTitle:"Chapel Bridge", type:"역사", desc:"1333년에 건설된 유럽에서 가장 오래된 목조 지붕 다리로 내부에 17세기 삼각형 그림이 걸려 있습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://www.luzern.com"},
  {name:"필라투스 산", wikiTitle:"Mount Pilatus", type:"자연", desc:"세계에서 가장 가파른 톱니바퀴 열차로 올라가는 2,128m 봉우리에서 73개 알프스 봉우리를 조망합니다.", rating:4.7, openTime:"5~10월", price:"CHF 72(골든라운드트립)", website:"https://www.pilatus.ch"},
  {name:"빈사의 사자상", wikiTitle:"Lion Monument", type:"역사", desc:"마크 트웨인이 세계에서 가장 슬프고 감동적인 석조물이라 한 바위에 새겨진 사자 조각입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Lion_Monument"},
]},
"체르마트": { description:"체르마트는 마터호른 봉우리 아래 자리한 자동차 없는 알프스 마을로 세계 최고의 스키 리조트이자 등산 기지입니다.", spots:[
  {name:"마터호른", wikiTitle:"Matterhorn", type:"자연", desc:"4,478m의 피라미드형 봉우리로 알프스에서 가장 상징적인 산입니다. 토블로네 초콜릿 로고의 모델이기도 합니다.", rating:4.9, openTime:"연중(전망대별)", price:"CHF 100(고르너그라트)", website:"https://www.zermatt.ch"},
  {name:"고르너그라트 전망대", wikiTitle:"Gornergrat", type:"자연", desc:"톱니바퀴 열차로 3,089m에 올라 마터호른과 고르너 빙하를 정면으로 바라볼 수 있습니다.", rating:4.8, openTime:"07:00~(계절별)", price:"CHF 100(왕복)", website:"https://www.gornergrat.ch"},
]},
"베른": { description:"베른은 스위스의 수도로 아레강이 감싸 안은 중세 구시가지 전체가 유네스코 세계유산입니다. 아인슈타인이 상대성 이론을 구상한 도시이기도 합니다.", spots:[
  {name:"베른 구시가지", wikiTitle:"Old City of Bern", type:"역사", desc:"6km에 달하는 아케이드와 분수, 시계탑이 이어지는 중세 도시로 유네스코 세계유산입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Old_City_(Bern)"},
  {name:"치트글로게 시계탑", wikiTitle:"Zytglogge", type:"역사", desc:"13세기 천문시계탑으로 매 시간 인형극이 펼쳐집니다. 아인슈타인이 이 시계를 보며 시간에 대해 사색했다고 합니다.", rating:4.4, openTime:"24시간(내부 투어별)", price:"CHF 15(투어)", website:"https://en.wikipedia.org/wiki/Zytglogge"},
  {name:"아레강 수영", wikiTitle:"Aare (river)", type:"자연", desc:"여름이면 베른 시민들이 청록색 아레강에서 물살을 타며 자연 수영을 즐기는 독특한 도시 문화입니다.", rating:4.5, openTime:"여름 시즌", price:"무료", website:"https://en.wikipedia.org/wiki/Aare_(river)"},
]},

// ────────────────────────── 헝가리 ──────────────────────────
"부다페스트": { description:"부다페스트는 다뉴브 강이 가르는 부다와 페스트가 합쳐진 도시로 온천 문화와 야경이 세계적으로 유명한 동유럽의 보석입니다.", spots:[
  {name:"세체니 온천", wikiTitle:"Széchenyi thermal bath", type:"문화", desc:"유럽 최대의 노천 온천으로 네오바로크 양식의 화려한 건물에서 16개의 실내외 풀을 즐길 수 있습니다.", rating:4.6, openTime:"06:00~22:00", price:"HUF 6,800", website:"https://www.szechenyibath.hu"},
  {name:"부다 왕궁", wikiTitle:"Buda Castle", type:"역사", desc:"다뉴브 강변 언덕 위의 왕궁으로 헝가리 국립 갤러리와 부다페스트 역사 박물관이 입주해 있습니다.", rating:4.5, openTime:"10:00~18:00", price:"HUF 3,400", website:"https://en.wikipedia.org/wiki/Buda_Castle"},
  {name:"국회의사당", wikiTitle:"Hungarian Parliament Building", type:"랜드마크", desc:"다뉴브 강변의 네오고딕 건축물로 야경이 특히 아름답습니다. 세계에서 세 번째로 큰 의사당입니다.", rating:4.7, openTime:"08:00~18:00(투어)", price:"HUF 6,700", website:"https://www.parlament.hu/en"},
  {name:"어부의 요새", wikiTitle:"Fisherman's Bastion", type:"랜드마크", desc:"네오로마네스크 양식의 전망대로 다뉴브 강과 국회의사당을 정면으로 바라보는 최고의 포토스팟입니다.", rating:4.6, openTime:"09:00~19:00", price:"HUF 1,200", website:"https://en.wikipedia.org/wiki/Fisherman's_Bastion"},
  {name:"센트럴 마켓 홀", wikiTitle:"Great Market Hall (Budapest)", type:"음식", desc:"1897년에 개장한 부다페스트 최대의 시장으로 굴라시, 랑고시 등 헝가리 전통 음식을 맛볼 수 있습니다.", rating:4.5, openTime:"06:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Great_Market_Hall_(Budapest)"},
]},
"에게르": { description:"에게르는 헝가리 북부의 바로크 도시로 오스만 제국의 침략을 막아낸 요새와 유명한 에게르 불스블러드 와인의 고향입니다.", spots:[
  {name:"에게르 성", wikiTitle:"Castle of Eger", type:"역사", desc:"1552년 오스만 대군에 맞서 영웅적으로 방어한 역사적 요새입니다. 성벽에서 에게르 시내를 조망합니다.", rating:4.4, openTime:"10:00~18:00", price:"HUF 2,000", website:"https://en.wikipedia.org/wiki/Castle_of_Eger"},
  {name:"미녀의 골짜기 와인마을", wikiTitle:"Eger, Hungary", type:"음식", desc:"수십 개의 와인 셀러가 모인 골짜기로 유명한 에게르 불스블러드 레드 와인을 시음할 수 있습니다.", rating:4.5, openTime:"10:00~20:00", price:"HUF 500~(시음)", website:"https://en.wikipedia.org/wiki/Egri_Bikavér"},
]},

// ────────────────────────── 슬로베니아 ──────────────────────────
"류블랴나": { description:"류블랴나는 알프스와 아드리아해 사이에 자리한 슬로베니아의 수도로 중세 성과 류블랴니차 강변의 카페 문화가 매력적인 아담한 도시입니다.", spots:[
  {name:"류블랴나 성", wikiTitle:"Ljubljana Castle", type:"역사", desc:"시내 언덕 위에 솟은 중세 성으로 케이블카로 오르면 도시 전경과 알프스 산맥이 한눈에 보입니다.", rating:4.6, openTime:"09:00~21:00", price:"€13", website:"https://en.wikipedia.org/wiki/Ljubljana_Castle"},
  {name:"트리플 브릿지", wikiTitle:"Triple Bridge (Ljubljana)", type:"랜드마크", desc:"류블랴니차 강을 가로지르는 세 개의 다리가 나란히 놓인 도시의 상징. 다리 주변 노천 카페 문화가 유명합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Triple_Bridge_(Ljubljana)"},
  {name:"류블랴나 중앙시장", wikiTitle:"Central Market, Ljubljana", type:"음식", desc:"강변을 따라 펼쳐지는 야외 시장으로 신선한 채소, 치즈, 꿀 등 슬로베니아 특산품을 만날 수 있습니다.", rating:4.4, openTime:"06:00~16:00", price:"무료", website:"https://en.wikipedia.org/wiki/Central_Market,_Ljubljana"},
]},
"블레드": { description:"블레드는 줄리안 알프스 산자락의 에메랄드빛 호수에 작은 섬과 절벽 위 성이 어우러진 동화 같은 풍경으로 유럽 최고의 비경 중 하나입니다.", spots:[
  {name:"블레드 성", wikiTitle:"Bled Castle", type:"역사", desc:"100m 절벽 위에 솟은 슬로베니아 최고(最古)의 성. 블레드 호수와 알프스를 배경으로 한 전망이 압도적입니다.", rating:4.7, openTime:"08:00~20:00", price:"€15", website:"https://en.wikipedia.org/wiki/Bled_Castle"},
  {name:"블레드 섬 성모 교회", wikiTitle:"Church of the Assumption of Mary (Bled)", type:"역사", desc:"호수 한가운데 섬에 세워진 바로크 성당. 전통 나무배 플레트나를 타고 건너가 99계단을 오릅니다.", rating:4.8, openTime:"08:00~19:00", price:"€14(플레트나 포함)", website:"https://en.wikipedia.org/wiki/Bled_Island"},
  {name:"빈트가르 협곡", wikiTitle:"Vintgar Gorge", type:"자연", desc:"블레드에서 4km 거리의 아름다운 협곡. 에메랄드빛 라도브나 강 위 목조 데크를 따라 1.6km 트레킹합니다.", rating:4.7, openTime:"08:00~18:00", price:"€10", website:"https://en.wikipedia.org/wiki/Vintgar_Gorge"},
]},
"피란": { description:"피란은 아드리아해에 돌출된 반도 끝에 자리한 중세 베네치아풍 항구 도시로 미로 같은 골목과 오렌지 지붕, 지중해 풍광이 일품입니다.", spots:[
  {name:"타르티니 광장", wikiTitle:"Tartini Square", type:"역사", desc:"베이올리니스트 타르티니의 동상이 서 있는 피란의 중심 광장. 베네치아풍 건물들이 반원으로 둘러싼 아름다운 공간입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Tartini_Square"},
  {name:"성 조르지오 성당 종탑", wikiTitle:"Cathedral of St. George, Piran", type:"역사", desc:"언덕 위 성당의 종탑에서 피란 구시가지와 아드리아해를 360도로 조망할 수 있습니다.", rating:4.5, openTime:"10:00~17:00", price:"€2", website:"https://en.wikipedia.org/wiki/Cathedral_of_St._George,_Piran"},
]},
"마리보르": { description:"마리보르는 슬로베니아 제2의 도시이자 세계에서 가장 오래된 포도나무가 있는 와인 도시로 드라바 강변의 구시가지가 아름답습니다.", spots:[
  {name:"올드 바인 하우스", wikiTitle:"Old Vine House", type:"문화", desc:"수령 400년이 넘는 세계 최고령 포도나무가 살아있는 박물관. 이 포도나무에서 나온 와인은 세계 지도자들에게 선물로 증정됩니다.", rating:4.5, openTime:"10:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Old_Vine_House"},
  {name:"마리보르 성", wikiTitle:"Maribor Castle", type:"역사", desc:"드라바 강변에 자리한 15세기 성으로 현재는 지역 역사 박물관으로 사용됩니다.", rating:4.3, openTime:"10:00~18:00", price:"€3", website:"https://en.wikipedia.org/wiki/Maribor_Castle"},
]},

// ────────────────────────── 크로아티아 ──────────────────────────
"두브로브니크": { description:"두브로브니크는 '아드리아해의 진주'로 불리는 중세 성벽 도시로 드라마 '왕좌의 게임' 촬영지로 더욱 유명해졌습니다.", spots:[
  {name:"성벽 걷기", wikiTitle:"Walls of Dubrovnik", type:"역사", desc:"2km에 달하는 중세 성벽 위를 걸으며 아드리아해와 주황빛 지붕의 구시가지를 조망하는 코스입니다.", rating:4.8, openTime:"08:00~18:30", price:"€35", website:"https://www.dubrovnik.hr"},
  {name:"스르지 산 전망대", wikiTitle:"Srđ", type:"자연", desc:"케이블카로 올라가면 두브로브니크 구시가지와 아드리아해의 숨막히는 전경이 펼쳐집니다.", rating:4.7, openTime:"09:00~24:00", price:"€27(왕복)", website:"https://en.wikipedia.org/wiki/Srđ"},
  {name:"올드타운 스트라둔 거리", wikiTitle:"Stradun", type:"역사", desc:"두브로브니크 구시가지의 메인 거리로 대리석 바닥이 빛나는 300m의 아름다운 보행거리입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Stradun_(street)"},
]},
"자그레브": { description:"자그레브는 크로아티아의 수도로 상부의 중세 구시가지와 하부의 근대 도시가 공존하는 문화와 카페의 도시입니다.", spots:[
  {name:"반 옐라치치 광장", wikiTitle:"Ban Jelačić Square", type:"도시", desc:"자그레브의 중심 광장으로 카페 테라스가 둘러싸고 있으며 트램이 오가는 활기찬 장소입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Ban_Jelačić_Square"},
  {name:"성 마르크 교회", wikiTitle:"St. Mark's Church, Zagreb", type:"역사", desc:"알록달록한 모자이크 타일 지붕에 자그레브와 크로아티아의 문장이 새겨진 상징적 교회입니다.", rating:4.4, openTime:"외관 24시간", price:"무료", website:"https://en.wikipedia.org/wiki/St._Mark's_Church,_Zagreb"},
  {name:"돌라츠 시장", wikiTitle:"Dolac (market)", type:"음식", desc:"자그레브 최대의 노천 시장으로 신선한 과일, 치즈, 현지 먹거리를 만날 수 있습니다.", rating:4.4, openTime:"06:00~14:00", price:"무료", website:"https://en.wikipedia.org/wiki/Dolac_(market)"},
]},
"플리트비체": { description:"플리트비체 호수 국립공원은 16개의 에메랄드빛 호수가 계단식 폭포로 연결된 크로아티아 최고의 자연유산입니다.", spots:[
  {name:"플리트비체 호수 국립공원", wikiTitle:"Plitvice Lakes National Park", type:"자연", desc:"16개 호수와 92개 폭포가 울창한 숲속에서 계단식으로 이어지는 유네스코 세계유산입니다.", rating:4.9, openTime:"07:00~20:00(여름)", price:"€30(여름)", website:"https://np-plitvicka-jezera.hr"},
]},
"스플리트": { description:"스플리트는 디오클레티아누스 로마 황제의 궁전을 중심으로 발전한 아드리아해 연안의 역사 도시입니다.", spots:[
  {name:"디오클레티아누스 궁전", wikiTitle:"Diocletian's Palace", type:"역사", desc:"4세기 로마 황제의 은퇴 궁전으로 현재도 사람들이 거주하는 살아있는 유적입니다. 유네스코 세계유산입니다.", rating:4.7, openTime:"24시간", price:"무료(지하실 €8)", website:"https://en.wikipedia.org/wiki/Diocletian's_Palace"},
  {name:"리바 해변 산책로", wikiTitle:"Split", type:"도시", desc:"아드리아해를 따라 이어지는 야자수 산책로로 카페와 레스토랑이 줄지어 있습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Split,_Croatia"},
]},
"흐바르": { description:"흐바르는 아드리아해에서 가장 햇빛이 많은 섬으로 라벤더 밭과 고대 도시, 파티 문화가 어우러진 크로아티아의 인기 휴양지입니다.", spots:[
  {name:"흐바르 요새(스파뇰라)", wikiTitle:"Fortress Fortica (Hvar)", type:"역사", desc:"16세기 베네치아 요새에서 흐바르 타운과 파클레니 제도의 장관이 한눈에 펼쳐집니다.", rating:4.5, openTime:"08:00~21:00", price:"HRK 40", website:"https://en.wikipedia.org/wiki/Fortress_Fortica_(Hvar)"},
  {name:"파클레니 제도", wikiTitle:"Pakleni Islands", type:"자연", desc:"투명한 바다와 소나무 숲이 아름다운 무인도 군으로 보트 투어와 수영의 천국입니다.", rating:4.6, openTime:"보트투어 09:00~", price:"HRK 150(보트)", website:"https://en.wikipedia.org/wiki/Pakleni_Islands"},
]},

// ────────────────────────── 북유럽 ──────────────────────────
"오슬로": { description:"오슬로는 피오르와 숲에 둘러싸인 노르웨이의 수도로 바이킹 역사와 현대 건축, 뭉크의 '절규'가 공존하는 도시입니다.", spots:[
  {name:"비겔란 조각공원", wikiTitle:"Vigeland sculpture park", type:"문화", desc:"구스타브 비겔란의 212개 조각 작품이 전시된 세계 최대의 조각공원으로 '분노한 아이' 상이 유명합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Vigeland_sculpture_park"},
  {name:"오슬로 오페라하우스", wikiTitle:"Oslo Opera House", type:"랜드마크", desc:"빙하를 형상화한 현대 건축물로 지붕 위를 걸으며 오슬로 피오르를 조망할 수 있습니다.", rating:4.5, openTime:"외관 24시간", price:"무료(공연 별도)", website:"https://en.wikipedia.org/wiki/Oslo_Opera_House"},
  {name:"뭉크 미술관", wikiTitle:"Munch Museum", type:"문화", desc:"에드바르트 뭉크의 '절규'를 포함한 28,000여 점의 작품을 소장한 미술관입니다.", rating:4.5, openTime:"10:00~18:00", price:"NOK 160", website:"https://en.wikipedia.org/wiki/Munch_Museum"},
]},
"베르겐": { description:"베르겐은 노르웨이 서해안의 관문 도시로 한자동맹 시대의 형형색색 목조 건물 브뤼겐이 유네스코 세계유산입니다.", spots:[
  {name:"브뤼겐", wikiTitle:"Bryggen", type:"역사", desc:"14세기 한자동맹 시대의 형형색색 목조 상점가로 유네스코 세계유산입니다. 현재 갤러리와 레스토랑으로 사용됩니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Bryggen"},
  {name:"플뢰위엔 전망대", wikiTitle:"Fløyen", type:"자연", desc:"푸니쿨라로 320m 전망대에 올라가면 베르겐 시내와 7개 산, 피오르의 파노라마를 감상합니다.", rating:4.7, openTime:"07:30~23:00", price:"NOK 105(왕복)", website:"https://en.wikipedia.org/wiki/Fløyen"},
]},
"플롬": { description:"플롬은 세계에서 가장 아름다운 기차 노선인 플롬 철도의 출발점으로 노르웨이 피오르 관광의 핵심 거점입니다.", spots:[
  {name:"플롬 철도", wikiTitle:"Flåm Line", type:"랜드마크", desc:"세계에서 가장 가파른 일반 철도 노선으로 계곡, 폭포, 눈 덮인 산을 지나는 20km 구간이 장관입니다.", rating:4.8, openTime:"연중(편수 다름)", price:"NOK 470", website:"https://www.visitflam.com"},
  {name:"네뢰위피오르", wikiTitle:"Nærøyfjord", type:"자연", desc:"유네스코 세계유산으로 좁은 피오르 양쪽에 절벽이 솟아있는 노르웨이에서 가장 극적인 피오르입니다.", rating:4.8, openTime:"크루즈 시즌별", price:"NOK 500(크루즈)", website:"https://en.wikipedia.org/wiki/Nærøyfjord"},
]},
"트롬쇠": { description:"트롬쇠는 북극권 내에 위치한 노르웨이 북부의 도시로 오로라 관측과 백야를 체험할 수 있는 북극 탐험의 관문입니다.", spots:[
  {name:"북극 대성당", wikiTitle:"Arctic Cathedral", type:"랜드마크", desc:"삼각형의 독특한 현대 건축으로 빙산을 형상화한 트롬쇠의 상징적 교회입니다.", rating:4.5, openTime:"14:00~18:00", price:"NOK 70", website:"https://www.ishavskatedralen.no"},
  {name:"오로라 관측", wikiTitle:"Aurora borealis", type:"자연", desc:"9월~3월 트롬쇠 교외에서 녹색, 보라색 오로라가 밤하늘을 수놓는 장관을 볼 수 있습니다.", rating:4.9, openTime:"9~3월 야간", price:"투어 NOK 1,000~", website:"https://www.visitnorway.com/things-to-do/nature-attractions/northern-lights"},
]},
"로포텐": { description:"로포텐 제도는 노르웨이 북부의 극적인 산과 바다가 어우러진 섬으로 어촌 마을의 붉은 목조 가옥(로르부)이 상징적입니다.", spots:[
  {name:"레이네 마을", wikiTitle:"Reine", type:"자연", desc:"피오르와 뾰족한 산봉우리를 배경으로 붉은 어부 오두막이 늘어선 세계에서 가장 아름다운 마을 중 하나입니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Reine"},
  {name:"라인브링엔 전망대", wikiTitle:"Reinebringen", type:"자연", desc:"레이네 마을 위 448m 전망대에서 피오르와 산, 마을이 한눈에 들어오는 숨막히는 풍경을 감상합니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Reinebringen"},
]},
"게이랑에르": { description:"게이랑에르는 유네스코 세계유산인 게이랑에르피오르의 마을로 절벽에서 쏟아지는 폭포와 깊은 피오르가 장관입니다.", spots:[
  {name:"게이랑에르피오르", wikiTitle:"Geirangerfjord", type:"자연", desc:"유네스코 세계유산인 15km 길이의 피오르로 '일곱 자매 폭포'와 '신랑 폭포'가 유명합니다.", rating:4.9, openTime:"연중(크루즈 5~9월)", price:"무료(크루즈 별도)", website:"https://www.visitnorway.com/places-to-go/fjord-norway/the-geirangerfjord"},
  {name:"달스니바 전망대", wikiTitle:"Dalsnibba", type:"자연", desc:"해발 1,476m 전망대에서 게이랑에르피오르와 주변 산의 압도적 파노라마를 조망합니다.", rating:4.7, openTime:"6~10월", price:"NOK 120", website:"https://en.wikipedia.org/wiki/Dalsnibba"},
]},

"스톡홀름": { description:"스톡홀름은 14개의 섬 위에 세워진 스웨덴의 수도로 노벨상 시상식이 열리는 도시입니다. 감라스탄 구시가지의 중세 골목이 매력적입니다.", spots:[
  {name:"감라스탄(구시가지)", wikiTitle:"Gamla stan", type:"역사", desc:"13세기부터 이어진 중세 구시가지로 좁은 자갈길 골목과 파스텔색 건물이 동화 같은 분위기를 만듭니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Gamla_stan"},
  {name:"바사 박물관", wikiTitle:"Vasa Museum", type:"문화", desc:"1628년 처녀 항해에서 침몰한 전함 바사호를 인양하여 전시한 세계 유일의 17세기 군함 박물관입니다.", rating:4.8, openTime:"10:00~17:00", price:"SEK 190", website:"https://www.vasamuseet.se"},
  {name:"스톡홀름 시청", wikiTitle:"Stockholm City Hall", type:"랜드마크", desc:"노벨상 만찬이 열리는 블루홀과 황금 모자이크의 골든홀이 있는 스톡홀름의 상징적 건물입니다.", rating:4.5, openTime:"09:00~16:00(투어)", price:"SEK 140", website:"https://en.wikipedia.org/wiki/Stockholm_City_Hall"},
]},
"예테보리": { description:"예테보리는 스웨덴 제2의 도시로 해산물 미식, 놀이공원 리세베리, 군도의 아름다운 섬이 매력적인 서해안 도시입니다.", spots:[
  {name:"리세베리 놀이공원", wikiTitle:"Liseberg", type:"도시", desc:"북유럽 최대의 놀이공원으로 크리스마스 시즌 장식이 특히 유명합니다.", rating:4.5, openTime:"10:00~22:00(시즌별)", price:"SEK 100(입장)", website:"https://www.liseberg.se"},
  {name:"예테보리 군도", wikiTitle:"Gothenburg archipelago", type:"자연", desc:"20개 이상의 차 없는 섬으로 이루어진 군도로 페리를 타고 섬을 돌며 수영과 하이킹을 즐깁니다.", rating:4.6, openTime:"페리 시간표별", price:"SEK 50(페리)", website:"https://en.wikipedia.org/wiki/Gothenburg_archipelago"},
]},
"말뫼": { description:"말뫼는 스웨덴 최남단의 도시로 코펜하겐과 외레순드 다리로 연결되어 있으며 현대 건축과 다문화가 공존합니다.", spots:[
  {name:"터닝 토르소", wikiTitle:"Turning Torso", type:"랜드마크", desc:"190m 높이로 90도 비틀어진 북유럽 최고층 건물로 말뫼의 상징적 현대 건축물입니다.", rating:4.3, openTime:"외관 관람", price:"무료", website:"https://en.wikipedia.org/wiki/Turning_Torso"},
  {name:"외레순드 다리", wikiTitle:"Øresund Bridge", type:"랜드마크", desc:"스웨덴과 덴마크를 연결하는 8km의 복합 다리로 차와 기차 모두 이용 가능합니다.", rating:4.4, openTime:"24시간", price:"SEK 560(차량)", website:"https://en.wikipedia.org/wiki/Øresund_Bridge"},
]},
"아비스코": { description:"아비스코는 스웨덴 북극권 내의 작은 마을로 오로라 관측 최적지이자 유럽 최고의 트레킹 코스 쿵스레덴의 출발점입니다.", spots:[
  {name:"아비스코 국립공원", wikiTitle:"Abisko National Park", type:"자연", desc:"오로라 관측의 최적지로 알려진 국립공원으로 여름에는 백야 속 트레킹을 즐길 수 있습니다.", rating:4.7, openTime:"연중", price:"무료", website:"https://en.wikipedia.org/wiki/Abisko_National_Park"},
  {name:"오로라 스카이 스테이션", wikiTitle:"Abisko", type:"자연", desc:"리프트로 올라가는 산 위 전망대에서 맑은 밤하늘의 오로라를 최상의 조건에서 관측할 수 있습니다.", rating:4.8, openTime:"11~3월 야간", price:"SEK 850", website:"https://en.wikipedia.org/wiki/Abisko"},
]},

"코펜하겐": { description:"코펜하겐은 안데르센의 인어공주 동상과 티볼리 공원이 있는 덴마크의 수도로 자전거 문화와 뉴노르딕 요리로 유명합니다.", spots:[
  {name:"티볼리 공원", wikiTitle:"Tivoli Gardens", type:"도시", desc:"1843년 개장한 세계에서 두 번째로 오래된 놀이공원으로 월트 디즈니에게 영감을 주었습니다.", rating:4.6, openTime:"11:00~23:00(시즌별)", price:"DKK 155", website:"https://www.tivoli.dk"},
  {name:"뉘하운", wikiTitle:"Nyhavn", type:"도시", desc:"형형색색 타운하우스가 줄지어 선 운하 거리로 코펜하겐에서 가장 사랑받는 풍경입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Nyhavn"},
  {name:"인어공주 동상", wikiTitle:"The Little Mermaid (statue)", type:"랜드마크", desc:"안데르센 동화를 모티브로 1913년에 설치된 코펜하겐의 상징적 청동상입니다.", rating:4.0, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/The_Little_Mermaid_(statue)"},
]},
"오르후스": { description:"오르후스는 덴마크 제2의 도시로 2017년 유럽 문화수도로 선정된 젊고 역동적인 예술 도시입니다.", spots:[
  {name:"아로스 미술관", wikiTitle:"ARoS Aarhus Art Museum", type:"문화", desc:"옥상의 무지개빛 파노라마 통로 'Your Rainbow Panorama'에서 도시를 형형색색으로 감상할 수 있습니다.", rating:4.6, openTime:"10:00~21:00(화~일)", price:"DKK 150", website:"https://www.aros.dk"},
  {name:"덴 감레 비", wikiTitle:"Den Gamle By", type:"문화", desc:"세계 최초의 야외 박물관으로 16~20세기 덴마크의 마을을 재현한 살아있는 역사 박물관입니다.", rating:4.5, openTime:"10:00~17:00", price:"DKK 175", website:"https://www.dengamleby.dk"},
]},
"오덴세": { description:"오덴세는 한스 크리스티안 안데르센의 고향으로 동화의 도시 분위기가 가득합니다. 덴마크 세 번째로 큰 도시입니다.", spots:[
  {name:"안데르센 생가 & 박물관", wikiTitle:"Hans Christian Andersen Museum", type:"문화", desc:"안데르센이 태어난 집과 그의 삶·작품을 다룬 박물관으로 일본 건축가 구마 겐고가 설계한 신관이 인상적입니다.", rating:4.5, openTime:"10:00~18:00", price:"DKK 170", website:"https://hcandersenshus.dk"},
  {name:"오덴세 구시가지", wikiTitle:"Odense", type:"역사", desc:"색색의 목조 건물과 조약돌 거리가 어우러진 동화 같은 분위기의 도심입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Odense"},
]},


// ────────────────── 추가 도시 (700개 달성) ──────────────────
// 벨기에
"브뤼헤": { description:"브뤼헤는 중세 건축물이 완벽히 보존된 벨기에의 보석 같은 운하 도시입니다.", spots:[
  {name:"마르크트 광장", wikiTitle:"Markt (Bruges)", type:"역사", desc:"중세 종탑과 길드 하우스가 둘러싼 브뤼헤의 심장부입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Markt_(Bruges)"},
  {name:"벨포르트 종탑", wikiTitle:"Belfry of Bruges", type:"랜드마크", desc:"83m 높이의 중세 종탑으로 366개 계단을 올라가면 도시 전경이 펼쳐집니다.", rating:4.6, openTime:"09:30~18:00", price:"€14", website:"https://en.wikipedia.org/wiki/Belfry_of_Bruges"},
  {name:"성혈 성당", wikiTitle:"Basilica of the Holy Blood", type:"종교", desc:"12세기에 십자군이 가져온 예수의 성혈 유물을 모신 성당입니다.", rating:4.5, openTime:"09:30~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Basilica_of_the_Holy_Blood"},
]},
"안트베르펜": { description:"안트베르펜은 다이아몬드 거래의 세계 수도이자 루벤스의 고향, 패션의 도시입니다.", spots:[
  {name:"안트베르펜 대성당", wikiTitle:"Cathedral of Our Lady (Antwerp)", type:"종교", desc:"루벤스의 걸작이 걸린 벨기에 최대의 고딕 성당입니다.", rating:4.7, openTime:"10:00~17:00", price:"€12", website:"https://en.wikipedia.org/wiki/Cathedral_of_Our_Lady_(Antwerp)"},
  {name:"중앙역", wikiTitle:"Antwerpen-Centraal railway station", type:"랜드마크", desc:"세계에서 가장 아름다운 기차역으로 꼽히는 네오바로크 건축물입니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Antwerpen-Centraal_railway_station"},
  {name:"MAS 박물관", wikiTitle:"Museum aan de Stroom", type:"문화", desc:"항구 지역의 현대적 박물관으로 옥상에서 도시 전경을 감상할 수 있습니다.", rating:4.5, openTime:"10:00~17:00", price:"€10", website:"https://en.wikipedia.org/wiki/Museum_aan_de_Stroom"},
]},
"겐트": { description:"겐트는 중세 건축과 활기찬 대학 문화가 어우러진 벨기에의 숨겨진 보석입니다.", spots:[
  {name:"그라벤스틴 성", wikiTitle:"Gravensteen", type:"역사", desc:"12세기 플랑드르 백작의 성으로 해자에 둘러싸인 장엄한 중세 요새입니다.", rating:4.5, openTime:"10:00~18:00", price:"€12", website:"https://en.wikipedia.org/wiki/Gravensteen"},
  {name:"성 바보 대성당", wikiTitle:"Saint Bavo's Cathedral, Ghent", type:"종교", desc:"반 에이크 형제의 걸작 '어린양에 대한 경배'가 있는 성당입니다.", rating:4.7, openTime:"08:30~17:00", price:"€4", website:"https://en.wikipedia.org/wiki/Saint_Bavo%27s_Cathedral,_Ghent"},
]},
"코크": { description:"코크는 아일랜드 제2의 도시로 활기찬 음식 문화와 역사가 어우러진 항구 도시입니다.", spots:[
  {name:"잉글리시 마켓", wikiTitle:"English Market", type:"음식", desc:"1788년부터 운영된 실내 시장으로 아일랜드 최고의 로컬 푸드를 만날 수 있습니다.", rating:4.6, openTime:"08:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/English_Market"},
  {name:"블라니 성", wikiTitle:"Blarney Castle", type:"역사", desc:"말재주를 선물한다는 블라니 스톤으로 유명한 중세 성입니다.", rating:4.5, openTime:"09:00~18:00", price:"€18", website:"https://en.wikipedia.org/wiki/Blarney_Castle"},
]},
"킬라니": { description:"킬라니는 아일랜드 남서부의 자연 경관이 빼어난 관광 도시로 링 오브 케리의 출발점입니다.", spots:[
  {name:"킬라니 국립공원", wikiTitle:"Killarney National Park", type:"자연", desc:"아일랜드 최초의 국립공원으로 호수와 산, 레드디어가 서식합니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Killarney_National_Park"},
  {name:"링 오브 케리", wikiTitle:"Ring of Kerry", type:"자연", desc:"아일랜드에서 가장 유명한 179km 해안 드라이브 코스입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Ring_of_Kerry"},
]},
"에게르": { description:"에게르는 바로크 건축과 유명한 에게르 와인, 터키식 온천으로 유명한 헝가리의 역사 도시입니다.", spots:[
  {name:"에게르 성", wikiTitle:"Eger Castle", type:"역사", desc:"1552년 오스만 제국의 공격을 막아낸 영웅적 전투로 유명한 성입니다.", rating:4.5, openTime:"10:00~18:00", price:"HUF 2,200", website:"https://en.wikipedia.org/wiki/Eger_Castle"},
  {name:"미나렛", wikiTitle:"Minaret of Eger", type:"역사", desc:"유럽 최북단의 오스만 미나렛으로 40m 높이의 좁은 나선 계단을 올라갈 수 있습니다.", rating:4.3, openTime:"10:00~18:00", price:"HUF 500", website:"https://en.wikipedia.org/wiki/Minaret_of_Eger"},
]},
"페치": { description:"페치는 로마 시대부터 이어진 다문화 역사와 예술의 도시로 헝가리 남부의 보석입니다.", spots:[
  {name:"세체니 광장", wikiTitle:"Széchenyi Square (Pécs)", type:"역사", desc:"페치의 중심 광장으로 모스크와 성당이 공존하는 독특한 풍경을 자랑합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/P%C3%A9cs"},
  {name:"초기 기독교 묘지", wikiTitle:"Early Christian Necropolis of Pécs", type:"역사", desc:"4세기 초기 기독교 지하 묘지로 유네스코 세계유산입니다.", rating:4.5, openTime:"10:00~18:00", price:"HUF 2,000", website:"https://en.wikipedia.org/wiki/Early_Christian_Necropolis_of_P%C3%A9cs"},
]},
"브라쇼브": { description:"브라쇼브는 트란실바니아의 중심 도시로 중세 성벽과 카르파티아 산맥에 둘러싸인 동화 같은 곳입니다.", spots:[
  {name:"블랙 처치", wikiTitle:"Black Church (Brașov)", type:"역사", desc:"트란실바니아 최대의 고딕 교회로 화재 후 검게 변한 외벽이 특징입니다.", rating:4.6, openTime:"10:00~19:00", price:"RON 15", website:"https://en.wikipedia.org/wiki/Black_Church_(Bra%C8%99ov)"},
  {name:"브란 성", wikiTitle:"Bran Castle", type:"역사", desc:"드라큘라의 성으로 알려진 중세 요새로 브라쇼브 인근 산 위에 자리합니다.", rating:4.3, openTime:"09:00~18:00", price:"RON 50", website:"https://en.wikipedia.org/wiki/Bran_Castle"},
]},
"시비우": { description:"시비우는 루마니아에서 가장 아름다운 중세 도시로 2007년 유럽 문화수도였습니다.", spots:[
  {name:"대광장", wikiTitle:"Piața Mare, Sibiu", type:"역사", desc:"바로크 건물들이 둘러싼 시비우의 중심 광장으로 브루켄탈 궁전이 있습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Pia%C8%9Ba_Mare,_Sibiu"},
  {name:"거짓말쟁이 다리", wikiTitle:"Bridge of Lies", type:"랜드마크", desc:"루마니아 최초의 철제 다리로 거짓말을 하면 무너진다는 전설이 있습니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Bridge_of_Lies_(Sibiu)"},
]},
"플로브디프": { description:"플로브디프는 유럽에서 가장 오래된 도시 중 하나로 7,000년의 역사를 간직한 불가리아의 문화 수도입니다.", spots:[
  {name:"로마 원형극장", wikiTitle:"Plovdiv Roman theatre", type:"역사", desc:"2세기에 건설된 로마 원형극장으로 7,000석 규모이며 여전히 공연이 열립니다.", rating:4.7, openTime:"09:00~18:00", price:"BGN 5", website:"https://en.wikipedia.org/wiki/Plovdiv_Roman_theatre"},
  {name:"구시가지", wikiTitle:"Old town of Plovdiv", type:"역사", desc:"19세기 불가리아 부흥기 건축물이 보존된 언덕 위의 아름다운 구시가입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Old_town_of_Plovdiv"},
]},
"벨리코투르노보": { description:"벨리코투르노보는 중세 불가리아 제국의 수도로 절벽 위에 세워진 장엄한 요새 도시입니다.", spots:[
  {name:"차레베츠 요새", wikiTitle:"Tsarevets (fortress)", type:"역사", desc:"제2 불가리아 제국의 왕궁과 성당이 있던 언덕 위의 요새입니다.", rating:4.6, openTime:"08:00~19:00", price:"BGN 6", website:"https://en.wikipedia.org/wiki/Tsarevets_(fortress)"},
]},
"체스키크룸로프": { description:"체스키크룸로프는 블타바 강이 감싸 도는 체코의 동화 같은 중세 마을로 유네스코 세계유산입니다.", spots:[
  {name:"체스키크룸로프 성", wikiTitle:"Český Krumlov Castle", type:"역사", desc:"프라하 성 다음으로 큰 체코 제2의 성으로 바로크 극장이 보존되어 있습니다.", rating:4.7, openTime:"09:00~17:00", price:"CZK 300", website:"https://en.wikipedia.org/wiki/%C4%8Cesk%C3%BD_Krumlov_Castle"},
  {name:"구시가지", wikiTitle:"Český Krumlov", type:"역사", desc:"블타바 강변의 중세 건물과 좁은 골목이 그대로 보존된 유네스코 세계유산입니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/%C4%8Cesk%C3%BD_Krumlov"},
]},
"카를로비바리": { description:"카를로비바리는 14세기부터 유럽 왕족들이 찾은 체코 최고의 온천 도시입니다.", spots:[
  {name:"밀 콜로네이드", wikiTitle:"Mill Colonnade", type:"랜드마크", desc:"5개의 온천수가 솟는 네오르네상스 양식의 아름다운 주랑입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mill_Colonnade"},
]},
"코토르": { description:"코토르는 아드리아해의 숨겨진 보석으로 중세 성벽과 피오르드 같은 만이 절경을 이루는 도시입니다.", spots:[
  {name:"코토르 구시가지", wikiTitle:"Kotor", type:"역사", desc:"베네치아 시대의 건축물이 보존된 유네스코 세계유산 구시가입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Kotor"},
  {name:"성 요한 요새", wikiTitle:"Fortifications of Kotor", type:"역사", desc:"1,350개 계단을 올라가면 코토르만의 숨막히는 전경이 펼쳐집니다.", rating:4.8, openTime:"08:00~20:00", price:"€8", website:"https://en.wikipedia.org/wiki/Fortifications_of_Kotor"},
]},
"부드바": { description:"부드바는 2,500년 역사의 아드리아해 해변 리조트 도시로 몬테네그로 관광의 중심입니다.", spots:[
  {name:"부드바 구시가지", wikiTitle:"Budva", type:"역사", desc:"좁은 골목과 베네치아 시대 건물이 반도 위에 자리한 아름다운 구시가입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Budva"},
  {name:"스베티 스테판", wikiTitle:"Sveti Stefan", type:"자연", desc:"아드리아해의 작은 섬 위에 세워진 럭셔리 리조트 마을로 절경을 자랑합니다.", rating:4.6, openTime:"외부 관람", price:"무료", website:"https://en.wikipedia.org/wiki/Sveti_Stefan"},
]},
"베라트": { description:"베라트는 '천 개의 창문의 도시'로 불리는 알바니아의 유네스코 세계유산 도시입니다.", spots:[
  {name:"베라트 성", wikiTitle:"Berat Castle", type:"역사", desc:"언덕 위의 13세기 성채로 내부에 주민이 거주하는 살아있는 유산입니다.", rating:4.5, openTime:"24시간", price:"ALK 200", website:"https://en.wikipedia.org/wiki/Berat_Castle"},
  {name:"망갈렘 지구", wikiTitle:"Mangalem", type:"역사", desc:"오스만 시대 하얀 집들이 계단식으로 줄지어선 유네스코 등재 역사 지구입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mangalem"},
]},
"사란다": { description:"사란다는 알바니아 남부의 아름다운 해안 도시로 그리스 코르푸 섬이 바라보이는 리조트입니다.", spots:[
  {name:"블루아이", wikiTitle:"Blue Eye (water spring)", type:"자연", desc:"깊이를 알 수 없는 신비로운 청록색 용천수로 알바니아의 자연 경이입니다.", rating:4.7, openTime:"24시간", price:"ALL 50", website:"https://en.wikipedia.org/wiki/Blue_Eye_(water_spring)"},
]},
"노비사드": { description:"노비사드는 세르비아 제2의 도시로 EXIT 페스티벌과 다뉴브 강변 요새로 유명합니다.", spots:[
  {name:"페트로바라딘 요새", wikiTitle:"Petrovaradin Fortress", type:"역사", desc:"다뉴브강 위의 거대한 18세기 요새로 EXIT 음악 축제가 열리는 장소입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Petrovaradin_Fortress"},
]},
"모스타르": { description:"모스타르는 오스만 시대의 아름다운 다리로 유명한 보스니아의 역사 도시입니다.", spots:[
  {name:"스타리 모스트", wikiTitle:"Stari Most", type:"역사", desc:"16세기 오스만 시대에 건설된 아치형 돌다리로 유네스코 세계유산입니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Stari_Most"},
]},
"오흐리드": { description:"오흐리드는 유럽에서 가장 오래된 호수 중 하나인 오흐리드 호수변의 유네스코 세계유산 도시입니다.", spots:[
  {name:"성 요한 카네오 교회", wikiTitle:"Church of St. John at Kaneo", type:"종교", desc:"오흐리드 호수 절벽 위에 자리한 13세기 교회로 북마케도니아의 상징입니다.", rating:4.8, openTime:"09:00~17:00", price:"MKD 100", website:"https://en.wikipedia.org/wiki/Church_of_St._John_at_Kaneo"},
]},
"카르타고": { description:"카르타고는 로마와 대적했던 고대 문명의 유적이 남아있는 튀니지의 역사 도시입니다.", spots:[
  {name:"카르타고 유적", wikiTitle:"Carthage", type:"역사", desc:"페니키아인이 세운 고대 도시 유적으로 유네스코 세계유산입니다.", rating:4.5, openTime:"08:00~17:00", price:"TND 12", website:"https://en.wikipedia.org/wiki/Carthage"},
  {name:"안토니누스 목욕탕", wikiTitle:"Antonine Baths", type:"역사", desc:"아프리카 최대의 로마 목욕탕 유적으로 지중해가 내려다보입니다.", rating:4.4, openTime:"08:00~17:00", price:"포함", website:"https://en.wikipedia.org/wiki/Antonine_Baths"},
]},
"시디부사이드": { description:"시디부사이드는 하얀 벽과 파란 문이 인상적인 튀니지의 지중해 절벽 마을입니다.", spots:[
  {name:"시디부사이드 마을", wikiTitle:"Sidi Bou Said", type:"도시", desc:"흰색과 파란색으로 통일된 건물들이 지중해를 배경으로 펼쳐지는 예술가의 마을입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Sidi_Bou_Said"},
]},
"아레날": { description:"아레날은 활화산과 열대우림이 만나는 코스타리카의 어드벤처 수도입니다.", spots:[
  {name:"아레날 화산", wikiTitle:"Arenal Volcano", type:"자연", desc:"코스타리카에서 가장 활발한 화산으로 온천과 하이킹이 인기입니다.", rating:4.7, openTime:"08:00~16:00", price:"$15", website:"https://en.wikipedia.org/wiki/Arenal_Volcano"},
  {name:"라포르투나 폭포", wikiTitle:"La Fortuna Waterfall", type:"자연", desc:"70m 높이의 폭포로 500개 계단을 내려가 수영할 수 있습니다.", rating:4.6, openTime:"07:30~17:00", price:"$18", website:"https://en.wikipedia.org/wiki/La_Fortuna_Waterfall"},
]},
"몬테베르데": { description:"몬테베르데는 구름 숲 보호구역으로 유명한 코스타리카의 생태 관광 명소입니다.", spots:[
  {name:"몬테베르데 구름숲", wikiTitle:"Monteverde Cloud Forest Reserve", type:"자연", desc:"해발 1,400m의 열대 구름숲으로 케찰 등 희귀 조류의 서식지입니다.", rating:4.8, openTime:"07:00~16:00", price:"$25", website:"https://en.wikipedia.org/wiki/Monteverde_Cloud_Forest_Reserve"},
]},
"안티구아": { description:"안티구아 과테말라는 스페인 식민지 시대의 건축물이 보존된 유네스코 세계유산 도시입니다.", spots:[
  {name:"산타카탈리나 아치", wikiTitle:"Santa Catalina Arch", type:"랜드마크", desc:"과테말라에서 가장 유명한 랜드마크로 아구아 화산을 배경으로 한 사진이 유명합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Santa_Catalina_Arch,_Antigua_Guatemala"},
]},
"비블로스": { description:"비블로스는 7,000년 역사의 세계에서 가장 오래된 도시 중 하나로 레바논의 보석입니다.", spots:[
  {name:"비블로스 성", wikiTitle:"Byblos Castle", type:"역사", desc:"십자군이 12세기에 세운 성으로 페니키아·로마 유적 위에 자리합니다.", rating:4.5, openTime:"09:00~18:00", price:"LBP 5,000", website:"https://en.wikipedia.org/wiki/Byblos_Castle"},
]},
"바알베크": { description:"바알베크는 로마 제국 최대의 신전 유적이 남아있는 레바논의 고대 도시입니다.", spots:[
  {name:"바알베크 신전", wikiTitle:"Baalbek", type:"역사", desc:"목성 신전의 거대한 기둥이 남아있는 로마 시대 최대 규모의 신전 유적입니다.", rating:4.8, openTime:"08:30~18:00", price:"LBP 5,000", website:"https://en.wikipedia.org/wiki/Baalbek"},
]},
"테를지": { description:"테를지는 울란바토르 인근의 국립공원으로 몽골 유목 문화를 체험할 수 있는 대초원입니다.", spots:[
  {name:"테를지 국립공원", wikiTitle:"Gorkhi-Terelj National Park", type:"자연", desc:"거북바위와 초원이 어우러진 몽골의 대표적 국립공원으로 게르 체험이 가능합니다.", rating:4.6, openTime:"24시간", price:"MNT 3,000", website:"https://en.wikipedia.org/wiki/Gorkhi-Terelj_National_Park"},
]},
"방비엥": { description:"방비엥은 라오스의 자연 어드벤처 수도로 석회암 절벽과 남쏭 강의 절경이 펼쳐집니다.", spots:[
  {name:"블루 라군", wikiTitle:"Vang Vieng", type:"자연", desc:"석회암 동굴과 에메랄드빛 자연 수영장이 어우러진 라오스의 명소입니다.", rating:4.5, openTime:"08:00~17:00", price:"LAK 10,000", website:"https://en.wikipedia.org/wiki/Vang_Vieng"},
]},
"빌룬드": { description:"빌룬드는 레고의 탄생지로 레고랜드 테마파크가 있는 덴마크의 작은 도시입니다.", spots:[
  {name:"레고랜드", wikiTitle:"Legoland Billund", type:"랜드마크", desc:"세계 최초의 레고랜드 테마파크로 6천만 개 이상의 레고 블록으로 세계를 재현했습니다.", rating:4.5, openTime:"10:00~18:00", price:"DKK 449", website:"https://en.wikipedia.org/wiki/Legoland_Billund"},
  {name:"레고 하우스", wikiTitle:"Lego House", type:"문화", desc:"BIG 건축사무소가 설계한 레고 체험 뮤지엄으로 창의력의 세계가 펼쳐집니다.", rating:4.7, openTime:"10:00~18:00", price:"DKK 229", website:"https://en.wikipedia.org/wiki/Lego_House_(museum)"},
]},
"투르쿠": { description:"투르쿠는 핀란드에서 가장 오래된 도시로 중세 성과 아우라 강변의 문화가 매력적입니다.", spots:[
  {name:"투르쿠 성", wikiTitle:"Turku Castle", type:"역사", desc:"13세기에 건설된 핀란드 최대의 중세 성으로 역사 박물관이 있습니다.", rating:4.5, openTime:"10:00~18:00", price:"€12", website:"https://en.wikipedia.org/wiki/Turku_Castle"},
]},
"코시체": { description:"코시체는 슬로바키아 제2의 도시로 2013년 유럽 문화수도, 고딕 성당이 아름다운 곳입니다.", spots:[
  {name:"성 엘리자베스 대성당", wikiTitle:"Cathedral of St. Elisabeth, Košice", type:"종교", desc:"유럽 최동단의 고딕 대성당으로 슬로바키아 최대의 교회입니다.", rating:4.6, openTime:"09:00~17:00", price:"€3", website:"https://en.wikipedia.org/wiki/Cathedral_of_St._Elisabeth,_Ko%C5%A1ice"},
]},
"파포스": { description:"파포스는 아프로디테 탄생 전설의 무대로 고대 유적이 풍부한 키프로스의 해안 도시입니다.", spots:[
  {name:"파포스 고고학 공원", wikiTitle:"Paphos Archaeological Park", type:"역사", desc:"로마 시대 모자이크 바닥이 보존된 유네스코 세계유산입니다.", rating:4.7, openTime:"08:30~17:00", price:"€4.50", website:"https://en.wikipedia.org/wiki/Paphos_Archaeological_Park"},
  {name:"아프로디테 바위", wikiTitle:"Aphrodite's Rock", type:"자연", desc:"미의 여신 아프로디테가 바다 거품에서 태어났다는 전설의 해안 바위입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Aphrodite%27s_Rock"},
]},
"리마솔": { description:"리마솔은 키프로스 제2의 도시로 해변 리조트와 고대 유적, 와인 산지가 어우러진 곳입니다.", spots:[
  {name:"리마솔 성", wikiTitle:"Limassol Castle", type:"역사", desc:"리처드 사자심왕이 결혼식을 올린 중세 성으로 중세 박물관이 있습니다.", rating:4.3, openTime:"09:00~17:00", price:"€4.50", website:"https://en.wikipedia.org/wiki/Limassol_Castle"},
]},
"유르말라": { description:"유르말라는 리가 인근의 발트해 해변 리조트로 32km의 백사장이 펼쳐지는 휴양 도시입니다.", spots:[
  {name:"유르말라 해변", wikiTitle:"Jūrmala", type:"자연", desc:"발트해 연안 최대의 해변 리조트로 아르누보 목조 건축이 보존되어 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/J%C5%ABrmala"},
]},
"카우나스": { description:"카우나스는 리투아니아 제2의 도시로 아르데코 건축과 전간기 모더니즘이 독특한 곳입니다.", spots:[
  {name:"카우나스 성", wikiTitle:"Kaunas Castle", type:"역사", desc:"14세기 고딕 양식의 성으로 리투아니아에서 가장 오래된 석조 요새입니다.", rating:4.3, openTime:"10:00~18:00", price:"€3", website:"https://en.wikipedia.org/wiki/Kaunas_Castle"},
]},
"트라카이": { description:"트라카이는 호수 위의 붉은 벽돌 성으로 유명한 리투아니아의 옛 수도입니다.", spots:[
  {name:"트라카이 섬 성", wikiTitle:"Trakai Island Castle", type:"역사", desc:"갈베 호수 위 섬에 지어진 15세기 고딕 성으로 리투아니아의 상징입니다.", rating:4.7, openTime:"10:00~19:00", price:"€10", website:"https://en.wikipedia.org/wiki/Trakai_Island_Castle"},
]},
"타르투": { description:"타르투는 에스토니아에서 가장 오래된 대학 도시로 지적인 분위기와 젊은 에너지가 넘칩니다.", spots:[
  {name:"타르투 대학교", wikiTitle:"University of Tartu", type:"문화", desc:"1632년 설립된 에스토니아 최고의 대학으로 역사적인 메인 빌딩이 인상적입니다.", rating:4.5, openTime:"외부 관람", price:"무료", website:"https://en.wikipedia.org/wiki/University_of_Tartu"},
]},
"푼타카나": { description:"푼타카나는 도미니카 공화국 동부의 세계적인 비치 리조트 지역입니다.", spots:[
  {name:"바바로 비치", wikiTitle:"Bávaro", type:"자연", desc:"코코넛 야자수와 터콰이즈 바다가 어우러진 카리브해 최고의 해변입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/B%C3%A1varo"},
]},
"보카스델토로": { description:"보카스델토로는 카리브해의 열대 군도로 파나마의 대표 해양 관광지입니다.", spots:[
  {name:"스타피쉬 비치", wikiTitle:"Bocas del Toro", type:"자연", desc:"얕은 바다에 불가사리가 가득한 천연 비치로 카리브해의 숨겨진 낙원입니다.", rating:4.6, openTime:"24시간", price:"보트 $5", website:"https://en.wikipedia.org/wiki/Bocas_del_Toro"},
]},
"바뇨스": { description:"바뇨스는 에콰도르 안데스 산맥의 온천 도시로 화산과 폭포, 어드벤처의 도시입니다.", spots:[
  {name:"악마의 물솥 폭포", wikiTitle:"Pailón del Diablo", type:"자연", desc:"에콰도르에서 가장 유명한 폭포로 바위 틈 사이로 들어가 폭포 뒤를 볼 수 있습니다.", rating:4.7, openTime:"08:00~17:00", price:"$2", website:"https://en.wikipedia.org/wiki/Pail%C3%B3n_del_Diablo"},
]},
"오타발로": { description:"오타발로는 안데스 산맥의 원주민 시장으로 유명한 에콰도르의 문화 도시입니다.", spots:[
  {name:"오타발로 시장", wikiTitle:"Otavalo", type:"문화", desc:"남미 최대의 원주민 시장으로 직물, 수공예품을 만날 수 있습니다.", rating:4.5, openTime:"토요일 07:00~14:00", price:"무료", website:"https://en.wikipedia.org/wiki/Otavalo"},
]},
"수크레": { description:"수크레는 볼리비아의 헌법상 수도로 하얀 식민지 건축물이 아름다운 유네스코 세계유산 도시입니다.", spots:[
  {name:"수크레 역사 지구", wikiTitle:"Sucre", type:"역사", desc:"하얀 석회 건물이 줄지어선 식민지 시대 역사 지구로 유네스코 세계유산입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Sucre"},
]},
"네그릴": { description:"네그릴은 자메이카 서부의 11km 백사장과 절벽 다이빙으로 유명한 카리브해 리조트입니다.", spots:[
  {name:"세븐마일 비치", wikiTitle:"Seven Mile Beach (Jamaica)", type:"자연", desc:"자메이카에서 가장 유명한 해변으로 석양이 아름다운 카리브해의 낙원입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Seven_Mile_Beach_(Jamaica)"},
]},
"니즈와": { description:"니즈와는 오만 내륙의 옛 수도로 거대한 원형 요새와 전통 수크가 매력적인 역사 도시입니다.", spots:[
  {name:"니즈와 요새", wikiTitle:"Nizwa Fort", type:"역사", desc:"17세기에 건설된 거대한 원형 탑의 요새로 오만에서 가장 많이 방문하는 유적입니다.", rating:4.6, openTime:"09:00~16:00", price:"OMR 5", website:"https://en.wikipedia.org/wiki/Nizwa_Fort"},
]},
"생루이": { description:"생루이는 세네갈 북부의 식민지 시대 건축물이 보존된 유네스코 세계유산 섬 도시입니다.", spots:[
  {name:"생루이 섬", wikiTitle:"Saint-Louis, Senegal", type:"역사", desc:"세네갈 강 위의 섬 도시로 프랑스 식민지 시대 건축물이 보존된 유네스코 세계유산입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Saint-Louis,_Senegal"},
]},
"무산제": { description:"무산제는 르완다 북서부의 화산 지대로 멸종 위기 산악 고릴라 트레킹의 출발지입니다.", spots:[
  {name:"화산 국립공원", wikiTitle:"Volcanoes National Park", type:"자연", desc:"멸종 위기 산악 고릴라를 만날 수 있는 르완다의 보호 구역입니다.", rating:4.9, openTime:"06:00~18:00", price:"$1,500", website:"https://en.wikipedia.org/wiki/Volcanoes_National_Park"},
]},
"노시베": { description:"노시베는 마다가스카르 북서쪽의 열대 섬으로 아름다운 해변과 여우원숭이가 서식합니다.", spots:[
  {name:"노시베 해변", wikiTitle:"Nosy Be", type:"자연", desc:"마다가스카르 최고의 해변 리조트 섬으로 스노클링과 다이빙이 유명합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Nosy_Be"},
]},
"케이프코스트": { description:"케이프코스트는 가나의 옛 수도로 대서양 노예무역의 역사가 남아있는 해안 도시입니다.", spots:[
  {name:"케이프코스트 성", wikiTitle:"Cape Coast Castle", type:"역사", desc:"대서양 노예무역의 거점이었던 유네스코 세계유산으로 가슴 아픈 역사의 현장입니다.", rating:4.6, openTime:"09:00~16:30", price:"GHS 90", website:"https://en.wikipedia.org/wiki/Cape_Coast_Castle"},
]},
"소수스블레이": { description:"소수스블레이는 나미비아의 붉은 모래 사막으로 세계에서 가장 높은 사구가 있는 초현실적 풍경입니다.", spots:[
  {name:"소수스블레이 사구", wikiTitle:"Sossusvlei", type:"자연", desc:"높이 300m 이상의 붉은 모래 사구와 하얀 소금 호수가 만드는 초현실적 풍경입니다.", rating:4.9, openTime:"일출~일몰", price:"N$80", website:"https://en.wikipedia.org/wiki/Sossusvlei"},
  {name:"데드블레이", wikiTitle:"Deadvlei", type:"자연", desc:"900년 전 말라죽은 나무들이 하얀 소금 바닥 위에 서있는 초현실적 장소입니다.", rating:4.8, openTime:"일출~일몰", price:"포함", website:"https://en.wikipedia.org/wiki/Deadvlei"},
]},
"시아르가오": { description:"시아르가오는 필리핀의 서핑 수도로 클라우드 나인 파도와 열대 섬 호핑이 유명합니다.", spots:[
  {name:"클라우드 나인", wikiTitle:"Cloud 9 (surfing)", type:"자연", desc:"세계적으로 유명한 서핑 스팟으로 두꺼운 배럴 파도가 서퍼들의 성지입니다.", rating:4.7, openTime:"24시간", price:"PHP 50", website:"https://en.wikipedia.org/wiki/Cloud_9_(surfing)"},
]},
"시아누크빌": { description:"시아누크빌은 캄보디아 남부의 해변 도시로 아름다운 섬들과 해양 액티비티의 거점입니다.", spots:[
  {name:"롱 세트 비치", wikiTitle:"Sihanoukville", type:"자연", desc:"캄보디아에서 가장 긴 해변으로 백사장과 야자수가 늘어선 열대 낙원입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Sihanoukville"},
]},
"오데사": { description:"오데사는 우크라이나 남부의 흑해 연안 항구 도시로 유럽적 건축미와 해변이 매력적입니다.", spots:[
  {name:"포템킨 계단", wikiTitle:"Potemkin Stairs", type:"랜드마크", desc:"192개의 거대한 계단으로 영화 '전함 포템킨'으로 유명한 오데사의 상징입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Potemkin_Stairs"},
  {name:"오데사 오페라 극장", wikiTitle:"Odesa National Academic Opera and Ballet Theater", type:"문화", desc:"유럽에서 가장 아름다운 오페라 극장 중 하나로 화려한 인테리어가 인상적입니다.", rating:4.7, openTime:"공연 시간", price:"UAH 100~", website:"https://en.wikipedia.org/wiki/Odesa_National_Academic_Opera_and_Ballet_Theater"},
]},
"체르니우치": { description:"체르니우치는 우크라이나 서부의 합스부르크 시대 건축물이 아름다운 도시입니다.", spots:[
  {name:"체르니우치 대학교", wikiTitle:"Chernivtsi University", type:"문화", desc:"체코 건축가가 설계한 유네스코 세계유산 건물로 비잔틴·무어 양식이 독특합니다.", rating:4.7, openTime:"09:00~17:00", price:"UAH 60", website:"https://en.wikipedia.org/wiki/Chernivtsi_University"},
]},
"훈자": { description:"훈자는 파키스탄 북부 카라코람 산맥의 해발 2,500m 고원 마을로 히말라야 절경의 보고입니다.", spots:[
  {name:"카리마바드", wikiTitle:"Karimabad", type:"자연", desc:"라카포시와 울타르 봉우리가 병풍처럼 둘러싼 훈자 계곡의 중심 마을입니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Karimabad,_Hunza"},
]},
"마마누카": { description:"마마누카는 피지 본섬 서쪽의 화산 군도로 영화 캐스트어웨이 촬영지입니다.", spots:[
  {name:"마마누카 제도", wikiTitle:"Mamanuca Islands", type:"자연", desc:"20여 개의 열대 섬으로 이루어진 군도로 세계적인 다이빙과 서핑 명소입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mamanuca_Islands"},
]},
"알주바라": { description:"알주바라는 카타르 북부의 유네스코 세계유산 고고학 유적지입니다.", spots:[
  {name:"알주바라 요새", wikiTitle:"Al Zubarah", type:"역사", desc:"18세기 진주 무역의 중심지였던 고고학 유적으로 유네스코 세계유산입니다.", rating:4.3, openTime:"09:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Al_Zubarah"},
]},

// ────────────────────────── 누락 도시 추가 ──────────────────────────

// 캐나다
"밴쿠버": { description:"밴쿠버는 태평양과 산맥 사이에 자리한 캐나다 서부 최대 도시로 자연과 도시가 완벽히 조화를 이룹니다.", spots:[
  {name:"스탠리 파크", wikiTitle:"Stanley Park", type:"자연", desc:"1,000에이커의 도심 공원으로 시월을 따라 이어지는 시월 산책로가 유명합니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://vancouver.ca/parks-recreation-culture/stanley-park.aspx"},
  {name:"캐필라노 현수교", wikiTitle:"Capilano Suspension Bridge", type:"자연", desc:"70m 높이, 140m 길이의 현수교에서 열대우림 위를 걷는 스릴을 즐길 수 있습니다.", rating:4.5, openTime:"09:00~18:00", price:"CAD 62", website:"https://www.capbridge.com"},
  {name:"그랜빌 아일랜드", wikiTitle:"Granville Island", type:"도시", desc:"공공시장, 갤러리, 공방이 모여있는 문화 예술 지구입니다.", rating:4.6, openTime:"09:00~19:00", price:"무료", website:"https://en.wikipedia.org/wiki/Granville_Island"},
]},
"토론토": { description:"토론토는 CN타워가 상징하는 캐나다 최대 도시로 다문화와 현대 예술이 어우러진 국제도시입니다.", spots:[
  {name:"CN 타워", wikiTitle:"CN Tower", type:"랜드마크", desc:"553m 높이의 타워로 유리 바닥 전망대와 에지워크 체험이 인기입니다.", rating:4.6, openTime:"09:00~22:00", price:"CAD 43", website:"https://www.cntower.ca"},
  {name:"로열 온타리오 박물관", wikiTitle:"Royal Ontario Museum", type:"문화", desc:"세계 문화와 자연사를 아우르는 캐나다 최대 박물관입니다.", rating:4.5, openTime:"10:00~17:30", price:"CAD 23", website:"https://www.rom.on.ca"},
  {name:"켄싱턴 마켓", wikiTitle:"Kensington Market, Toronto", type:"도시", desc:"빈티지 숍, 다국적 레스토랑, 카페가 모인 보헤미안 동네입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Kensington_Market,_Toronto"},
]},
"퀘벡시티": { description:"퀘벡시티는 북미 유일의 성벽 도시로 유네스코 세계유산인 구시가지의 프랑스풍 건축이 유럽에 온 듯한 분위기를 자아냅니다.", spots:[
  {name:"샤토 프롱트낙", wikiTitle:"Château Frontenac", type:"랜드마크", desc:"세계에서 가장 많이 사진 찍히는 호텔로 퀘벡시티의 상징입니다.", rating:4.7, openTime:"외관 24시간", price:"무료(외관)", website:"https://www.fairmont.com/frontenac-quebec"},
  {name:"쁘띠 샹플랭 거리", wikiTitle:"Petit Champlain", type:"역사", desc:"북미에서 가장 오래된 상업 거리로 프랑스풍 부티크와 카페가 줄지어 있습니다.", rating:4.6, openTime:"10:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Petit_Champlain"},
]},
"밴프": { description:"밴프는 캐나다 로키 산맥 속 최초의 국립공원으로 에메랄드빛 호수와 눈 덮인 봉우리가 장관입니다.", spots:[
  {name:"레이크 루이스", wikiTitle:"Lake Louise", type:"자연", desc:"빅토리아 빙하에서 녹아내린 물이 만든 터키옥빛 호수로 캐나다 로키의 보석입니다.", rating:4.9, openTime:"24시간", price:"공원입장 CAD 10.5", website:"https://www.banfflakelouise.com"},
  {name:"밴프 곤돌라", wikiTitle:"Banff Gondola", type:"자연", desc:"설퍼산 정상까지 곤돌라로 올라가면 6개의 산맥을 동시에 조망할 수 있습니다.", rating:4.6, openTime:"08:00~21:00", price:"CAD 72", website:"https://en.wikipedia.org/wiki/Banff_Gondola"},
]},
"몬트리올": { description:"몬트리올은 프랑스어를 사용하는 북미 최대 도시로 유럽풍 구시가지와 세계적 미식, 재즈 페스티벌로 유명합니다.", spots:[
  {name:"노트르담 대성당", wikiTitle:"Notre-Dame Basilica (Montreal)", type:"역사", desc:"화려한 파란빛 내부와 7,000개의 파이프 오르간이 인상적인 고딕 양식 성당입니다.", rating:4.7, openTime:"09:00~16:30", price:"CAD 8", website:"https://en.wikipedia.org/wiki/Notre-Dame_Basilica_(Montreal)"},
  {name:"올드 몬트리올", wikiTitle:"Old Montreal", type:"역사", desc:"자갈길과 17세기 건축물이 보존된 구시가지로 마차 투어가 인기입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Old_Montreal"},
]},
"오타와": { description:"오타와는 캐나다의 수도로 의회 언덕과 국립 박물관, 리도 운하가 어우러진 정치·문화의 중심지입니다.", spots:[
  {name:"의회 언덕", wikiTitle:"Parliament Hill", type:"랜드마크", desc:"캐나다 연방 의회가 자리한 네오고딕 건축물로 여름 근위병 교대식이 유명합니다.", rating:4.5, openTime:"가이드투어 예약", price:"무료", website:"https://en.wikipedia.org/wiki/Parliament_Hill"},
  {name:"리도 운하", wikiTitle:"Rideau Canal", type:"역사", desc:"유네스코 세계유산으로 겨울에는 세계 최대의 천연 스케이트 링크가 됩니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Rideau_Canal"},
]},
"나이아가라폴스": { description:"나이아가라 폭포는 캐나다와 미국 국경에 걸친 세계 3대 폭포 중 하나로 매초 280만 리터의 물이 쏟아지는 장관입니다.", spots:[
  {name:"나이아가라 폭포", wikiTitle:"Niagara Falls", type:"자연", desc:"캐나다 쪽 호스슈 폭포가 가장 웅장하며 보트 투어로 폭포 아래까지 접근 가능합니다.", rating:4.8, openTime:"24시간", price:"무료(보트 CAD 28)", website:"https://www.niagarafallstourism.com"},
]},
"빅토리아": { description:"빅토리아는 브리티시컬럼비아주의 주도로 영국풍 정원과 건축이 아름다운 해안 도시입니다.", spots:[
  {name:"부차트 가든", wikiTitle:"Butchart Gardens", type:"자연", desc:"100년 이상 역사의 세계적 정원으로 계절마다 다른 꽃이 피어납니다.", rating:4.7, openTime:"09:00~17:00", price:"CAD 37", website:"https://www.butchartgardens.com"},
]},

// 남미
"리우데자네이루": { description:"리우데자네이루는 코르코바도 산의 예수상과 코파카바나 해변, 삼바 카니발로 유명한 브라질의 상징적 도시입니다.", spots:[
  {name:"코르코바도 예수상", wikiTitle:"Christ the Redeemer (statue)", type:"랜드마크", desc:"해발 710m 정상에 서 있는 30m 높이 예수상으로 세계 신 7대 불가사의입니다.", rating:4.8, openTime:"08:00~19:00", price:"R$90", website:"https://www.cristoredentoroficial.com.br"},
  {name:"슈가로프 산", wikiTitle:"Sugarloaf Mountain", type:"자연", desc:"케이블카 2번을 타고 정상에 오르면 리우의 해안선과 도시 전경이 한눈에 들어옵니다.", rating:4.7, openTime:"08:00~21:00", price:"R$130", website:"https://en.wikipedia.org/wiki/Sugarloaf_Mountain"},
  {name:"코파카바나 해변", wikiTitle:"Copacabana", type:"자연", desc:"4km의 백사장이 펼쳐진 세계에서 가장 유명한 해변입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Copacabana,_Rio_de_Janeiro"},
]},
"상파울루": { description:"상파울루는 남미 최대의 메트로폴리스로 미식, 예술, 다문화가 공존하는 브라질의 경제 수도입니다.", spots:[
  {name:"상파울루 미술관", wikiTitle:"São Paulo Museum of Art", type:"문화", desc:"공중에 떠 있는 듯한 독특한 건축과 라틴아메리카 최고의 미술 컬렉션을 자랑합니다.", rating:4.5, openTime:"10:00~18:00", price:"R$60", website:"https://en.wikipedia.org/wiki/São_Paulo_Museum_of_Art"},
]},
"마나우스": { description:"마나우스는 아마존 열대우림의 관문 도시로 두 강의 만남(검은강과 흰강)이 유명합니다.", spots:[
  {name:"아마존 강 투어", wikiTitle:"Amazon River", type:"자연", desc:"세계 최대 열대우림을 보트로 탐험하며 핑크 돌고래와 원주민 마을을 만납니다.", rating:4.7, openTime:"연중", price:"$50~150", website:"https://en.wikipedia.org/wiki/Amazon_River"},
]},
"포스두이과수": { description:"포스두이과수는 브라질 측에서 이과수 폭포를 감상할 수 있는 관문 도시입니다.", spots:[
  {name:"이과수 폭포", wikiTitle:"Iguazu Falls", type:"자연", desc:"275개의 폭포가 2.7km에 걸쳐 쏟아지는 세계 최대급 폭포로 악마의 목구멍이 하이라이트입니다.", rating:4.9, openTime:"09:00~17:00", price:"R$72", website:"https://iguazuargentina.com"},
]},
"살바도르": { description:"살바도르는 브라질 최초의 수도로 아프리카 문화가 깊이 뿌리내린 활기찬 도시입니다.", spots:[
  {name:"펠로우리뉴 역사지구", wikiTitle:"Pelourinho", type:"역사", desc:"파스텔색 식민지 건물이 줄지어 선 유네스코 세계유산 지구입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Pelourinho"},
]},
"브라질리아": { description:"브라질리아는 1960년 비행기 모양으로 설계된 계획도시로 유네스코 세계유산인 브라질의 수도입니다.", spots:[
  {name:"브라질리아 대성당", wikiTitle:"Cathedral of Brasília", type:"역사", desc:"오스카 니마이어가 설계한 곡선형 현대 건축의 걸작입니다.", rating:4.5, openTime:"08:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Cathedral_of_Brasília"},
]},
"포르탈레자": { description:"포르탈레자는 브라질 북동부의 해변 도시로 아름다운 사구와 해변이 유명합니다.", spots:[
  {name:"제리코아코아라 해변", wikiTitle:"Jericoacoara", type:"자연", desc:"바람과 파도가 만든 모래사구와 청록빛 바다가 환상적인 해변입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Jericoacoara"},
]},
"부에노스아이레스": { description:"부에노스아이레스는 탱고의 본고장으로 유럽풍 건축과 라틴 열정이 공존하는 아르헨티나의 수도입니다.", spots:[
  {name:"라 보카(카미니토)", wikiTitle:"La Boca", type:"문화", desc:"형형색색 양철 건물이 줄지어 선 탱고 발상지로 거리 공연이 펼쳐집니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/La_Boca"},
  {name:"레콜레타 묘지", wikiTitle:"La Recoleta Cemetery", type:"역사", desc:"에바 페론이 잠든 곳으로 정교한 조각의 묘소 6,400기가 예술 작품 같습니다.", rating:4.6, openTime:"08:00~17:30", price:"무료", website:"https://en.wikipedia.org/wiki/La_Recoleta_Cemetery"},
]},
"파타고니아": { description:"파타고니아는 남미 남단의 광활한 자연 지역으로 빙하와 호수, 야생동물이 가득한 모험의 땅입니다.", spots:[
  {name:"페리토 모레노 빙하", wikiTitle:"Perito Moreno Glacier", type:"자연", desc:"5km 폭, 60m 높이의 거대한 빙하가 천둥 같은 소리와 함께 무너지는 장관을 볼 수 있습니다.", rating:4.9, openTime:"08:00~18:00", price:"ARS 5,000", website:"https://en.wikipedia.org/wiki/Perito_Moreno_Glacier"},
]},
"이과수": { description:"이과수는 아르헨티나 측에서 이과수 폭포를 감상하는 관문 도시입니다.", spots:[
  {name:"이과수 폭포 아르헨티나", wikiTitle:"Iguazu Falls", type:"자연", desc:"악마의 목구멍 위에서 내려다보는 코스가 아르헨티나 측 하이라이트입니다.", rating:4.9, openTime:"08:00~18:00", price:"ARS 8,000", website:"https://iguazuargentina.com"},
]},
"멘도사": { description:"멘도사는 안데스 산맥 기슭의 와인 수도로 말벡 와인과 아콩카과 산이 유명합니다.", spots:[
  {name:"멘도사 와이너리 투어", wikiTitle:"Argentine wine", type:"음식", desc:"세계적 말벡 와인의 본고장에서 포도밭과 와이너리를 투어합니다.", rating:4.6, openTime:"10:00~17:00", price:"$20~50", website:"https://en.wikipedia.org/wiki/Argentine_wine"},
]},
"우수아이아": { description:"우수아이아는 세계 최남단 도시로 남극 크루즈의 출발점이자 '세계의 끝' 표지판이 있는 곳입니다.", spots:[
  {name:"티에라 델 푸에고 국립공원", wikiTitle:"Tierra del Fuego National Park", type:"자연", desc:"세계 최남단 국립공원으로 빙하 호수와 아한대 숲이 어우러진 비경입니다.", rating:4.6, openTime:"08:00~18:00", price:"ARS 3,500", website:"https://en.wikipedia.org/wiki/Tierra_del_Fuego_National_Park"},
]},
"살타": { description:"살타는 아르헨티나 북서부의 식민지 도시로 안데스 고원과 무지개 산이 유명합니다.", spots:[
  {name:"우마우아카 협곡", wikiTitle:"Quebrada de Humahuaca", type:"자연", desc:"유네스코 세계유산으로 7색 산과 잉카 유적이 어우러진 안데스 협곡입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Quebrada_de_Humahuaca"},
]},

// 페루·칠레·콜롬비아
"마추픽추": { description:"마추픽추는 해발 2,430m 안데스 산중에 숨겨진 잉카 제국의 공중 도시로 세계 신 7대 불가사의입니다.", spots:[
  {name:"마추픽추 유적", wikiTitle:"Machu Picchu", type:"역사", desc:"15세기 잉카 황제 파차쿠텍이 건설한 석조 도시로 구름 속 풍경이 경이롭습니다.", rating:4.9, openTime:"06:00~17:00", price:"$50", website:"https://www.machupicchu.gob.pe"},
]},
"쿠스코": { description:"쿠스코는 잉카 제국의 옛 수도로 식민지 건축과 잉카 석조 기술이 공존하는 유네스코 세계유산 도시입니다.", spots:[
  {name:"아르마스 광장", wikiTitle:"Plaza de Armas, Cusco", type:"역사", desc:"잉카 시대부터 도시의 중심이었던 광장으로 대성당과 식민지 건축이 둘러싸고 있습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Plaza_de_Armas,_Cusco"},
  {name:"삭사이와만", wikiTitle:"Sacsayhuamán", type:"역사", desc:"수백 톤 무게의 돌을 이음새 없이 쌓아올린 잉카 요새로 건축 기술이 경이롭습니다.", rating:4.7, openTime:"07:00~17:30", price:"S/70(통합권)", website:"https://en.wikipedia.org/wiki/Sacsayhuamán"},
]},
"리마": { description:"리마는 페루의 수도로 식민지 역사와 세계적 미식 문화가 공존하는 남미의 미식 수도입니다.", spots:[
  {name:"리마 역사지구", wikiTitle:"Historic Centre of Lima", type:"역사", desc:"유네스코 세계유산으로 대성당, 산프란시스코 수도원 등 식민지 건축의 보고입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Historic_Centre_of_Lima"},
]},
"나스카": { description:"나스카는 사막 위에 그려진 거대한 지상화로 유명한 미스터리의 땅입니다.", spots:[
  {name:"나스카 라인", wikiTitle:"Nazca Lines", type:"역사", desc:"2,000년 전 사막에 그려진 거대한 동물과 기하학 문양으로 경비행기에서만 전체를 볼 수 있습니다.", rating:4.6, openTime:"경비행기 07:00~15:00", price:"$80~120", website:"https://en.wikipedia.org/wiki/Nazca_Lines"},
]},
"티티카카호수": { description:"티티카카 호수는 해발 3,812m에 위치한 세계에서 가장 높은 대형 항행 가능 호수입니다.", spots:[
  {name:"우로스 떠다니는 섬", wikiTitle:"Floating islands of Lake Titicaca", type:"문화", desc:"갈대로 만든 인공 섬 위에서 우로스 원주민이 전통 생활을 영위하고 있습니다.", rating:4.5, openTime:"보트투어 07:00~", price:"S/15", website:"https://en.wikipedia.org/wiki/Floating_islands_of_Lake_Titicaca"},
]},
"아레키파": { description:"아레키파는 흰 화산석으로 지어진 '하얀 도시'로 콜카 캐니언 투어의 거점입니다.", spots:[
  {name:"콜카 캐니언", wikiTitle:"Colca Canyon", type:"자연", desc:"그랜드캐니언보다 2배 깊은 협곡에서 안데스 콘도르가 날아다니는 장관을 볼 수 있습니다.", rating:4.7, openTime:"24시간", price:"S/70", website:"https://en.wikipedia.org/wiki/Colca_Canyon"},
]},
"산티아고": { description:"산티아고는 안데스 산맥을 배경으로 한 칠레의 수도로 와인과 미식, 현대 문화가 매력적입니다.", spots:[
  {name:"산크리스토발 언덕", wikiTitle:"San Cristóbal Hill", type:"자연", desc:"케이블카로 올라가면 산티아고 시내와 안데스 산맥의 파노라마가 펼쳐집니다.", rating:4.5, openTime:"08:30~20:00", price:"CLP 3,300", website:"https://en.wikipedia.org/wiki/San_Cristóbal_Hill"},
]},
"발파라이소": { description:"발파라이소는 알록달록한 집과 거리 예술이 가득한 태평양 항구 도시로 유네스코 세계유산입니다.", spots:[
  {name:"아센소르(케이블 엘리베이터)", wikiTitle:"Valparaíso", type:"도시", desc:"가파른 언덕을 오르는 100년 된 케이블 엘리베이터 15기가 도시의 상징입니다.", rating:4.5, openTime:"07:00~23:00", price:"CLP 300", website:"https://en.wikipedia.org/wiki/Valparaíso"},
]},
"아타카마": { description:"아타카마 사막은 세계에서 가장 건조한 사막으로 달의 계곡과 간헐천, 별 관측이 유명합니다.", spots:[
  {name:"달의 계곡", wikiTitle:"Valle de la Luna (Chile)", type:"자연", desc:"달 표면처럼 침식된 지형에서 일몰 시 붉은빛으로 물드는 장관을 감상합니다.", rating:4.7, openTime:"08:00~19:00", price:"CLP 3,000", website:"https://en.wikipedia.org/wiki/Valle_de_la_Luna_(Chile)"},
]},
"토레스델파이네": { description:"토레스 델 파이네는 세 개의 화강암 탑이 상징인 파타고니아 최고의 국립공원입니다.", spots:[
  {name:"토레스 델 파이네 국립공원", wikiTitle:"Torres del Paine National Park", type:"자연", desc:"빙하, 호수, 화강암 봉우리가 어우러진 남미 최고의 트레킹 명소입니다.", rating:4.9, openTime:"연중", price:"CLP 21,000", website:"https://torresdelpaine.com"},
]},
"이스터섬": { description:"이스터섬은 태평양 한가운데 외딴 섬으로 900개의 거대한 모아이 석상이 미스터리를 간직하고 있습니다.", spots:[
  {name:"라노 라라쿠", wikiTitle:"Rano Raraku", type:"역사", desc:"모아이 석상이 만들어진 채석장으로 400개 이상의 미완성 석상이 흩어져 있습니다.", rating:4.8, openTime:"09:00~17:00", price:"$80", website:"https://en.wikipedia.org/wiki/Rano_Raraku"},
]},
"보고타": { description:"보고타는 해발 2,640m에 위치한 콜롬비아의 수도로 황금 박물관과 활기찬 거리가 매력적입니다.", spots:[
  {name:"황금 박물관", wikiTitle:"Museo del Oro", type:"문화", desc:"55,000점 이상의 프리콜롬비아 황금 유물을 소장한 세계 최대 금 박물관입니다.", rating:4.7, openTime:"09:00~18:00", price:"COP 5,000", website:"https://en.wikipedia.org/wiki/Museo_del_Oro"},
]},
"카르타헤나": { description:"카르타헤나는 카리브해의 보석으로 식민지 시대 성벽 도시가 유네스코 세계유산입니다.", spots:[
  {name:"성벽 도시", wikiTitle:"Cartagena, Colombia", type:"역사", desc:"16세기 스페인 식민지 성벽이 둘러싼 구시가지로 파스텔색 건물이 매력적입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Cartagena,_Colombia"},
]},
"메데인": { description:"메데인은 '영원한 봄의 도시'로 혁신적 도시 재생과 쾌적한 기후가 매력적인 콜롬비아 제2의 도시입니다.", spots:[
  {name:"코무나 13", wikiTitle:"Comuna 13", type:"도시", desc:"에스컬레이터로 오르는 언덕 마을에 화려한 그래피티 아트가 가득합니다.", rating:4.5, openTime:"10:00~17:00", price:"투어 $10~20", website:"https://en.wikipedia.org/wiki/Comuna_13"},
]},
"살렌토": { description:"살렌토는 콜롬비아 커피 삼각지대의 작은 마을로 왁스팜 야자나무 계곡이 유명합니다.", spots:[
  {name:"코코라 계곡", wikiTitle:"Cocora Valley", type:"자연", desc:"높이 60m의 왁스팜 야자나무가 안개 낀 계곡에 줄지어 선 초현실적 풍경입니다.", rating:4.8, openTime:"08:00~16:00", price:"COP 10,000", website:"https://en.wikipedia.org/wiki/Cocora_Valley"},
]},

// 멕시코
"멕시코시티": { description:"멕시코시티는 아즈텍 제국 위에 세워진 멕시코의 수도로 프리다 칼로, 테오티와칸 등 풍부한 문화유산이 있습니다.", spots:[
  {name:"테오티와칸", wikiTitle:"Teotihuacan", type:"역사", desc:"태양의 피라미드와 달의 피라미드가 있는 고대 도시로 아메리카 대륙 최대 유적입니다.", rating:4.8, openTime:"09:00~17:00", price:"MXN 85", website:"https://en.wikipedia.org/wiki/Teotihuacan"},
  {name:"국립인류학 박물관", wikiTitle:"National Museum of Anthropology (Mexico)", type:"문화", desc:"아즈텍 달력석 등 메소아메리카 문명의 보물을 소장한 세계적 박물관입니다.", rating:4.7, openTime:"09:00~19:00", price:"MXN 85", website:"https://en.wikipedia.org/wiki/National_Museum_of_Anthropology_(Mexico)"},
]},
"칸쿤": { description:"칸쿤은 카리브해의 터키옥빛 바다와 마야 유적이 어우러진 멕시코 최고의 리조트 도시입니다.", spots:[
  {name:"치첸이트사", wikiTitle:"Chichen Itza", type:"역사", desc:"쿠쿨칸 피라미드가 상징인 마야 문명 최대 유적지로 세계 신 7대 불가사의입니다.", rating:4.8, openTime:"08:00~17:00", price:"MXN 571", website:"https://www.chichenitza.com"},
  {name:"이슬라 무헤레스", wikiTitle:"Isla Mujeres", type:"자연", desc:"칸쿤 앞바다의 작은 섬으로 스노클링과 한적한 해변이 매력적입니다.", rating:4.6, openTime:"페리 05:30~23:30", price:"MXN 300(페리)", website:"https://en.wikipedia.org/wiki/Isla_Mujeres"},
]},
"과달라하라": { description:"과달라하라는 마리아치 음악과 테킬라의 본고장으로 멕시코 전통 문화의 중심지입니다.", spots:[
  {name:"테킬라 마을", wikiTitle:"Tequila, Jalisco", type:"문화", desc:"유네스코 세계유산인 아가베 농장과 테킬라 증류소를 투어합니다.", rating:4.5, openTime:"투어 09:00~", price:"$30~60", website:"https://en.wikipedia.org/wiki/Tequila,_Jalisco"},
]},
"오악사카": { description:"오악사카는 원주민 문화와 미식이 풍부한 멕시코 남부의 문화 도시입니다.", spots:[
  {name:"몬테 알반", wikiTitle:"Monte Albán", type:"역사", desc:"해발 1,940m 산 위에 건설된 사포텍 문명의 유적지로 유네스코 세계유산입니다.", rating:4.6, openTime:"10:00~17:00", price:"MXN 85", website:"https://en.wikipedia.org/wiki/Monte_Albán"},
]},
"툴룸": { description:"툴룸은 카리브해 절벽 위의 마야 유적과 에메랄드빛 해변이 어우러진 보헤미안 리조트 타운입니다.", spots:[
  {name:"툴룸 유적", wikiTitle:"Tulum", type:"역사", desc:"카리브해 절벽 위에 자리한 마야 성벽 도시로 바다를 배경으로 한 유적이 장관입니다.", rating:4.5, openTime:"08:00~17:00", price:"MXN 85", website:"https://en.wikipedia.org/wiki/Tulum_(Maya_city)"},
]},
"과나후아토": { description:"과나후아토는 지하 터널 도로와 알록달록한 집이 계단식으로 들어선 유네스코 세계유산 도시입니다.", spots:[
  {name:"피필라 전망대", wikiTitle:"Guanajuato", type:"도시", desc:"산 위 전망대에서 알록달록한 도시 전경을 한눈에 내려다볼 수 있습니다.", rating:4.6, openTime:"24시간", price:"케이블카 MXN 30", website:"https://en.wikipedia.org/wiki/Guanajuato"},
]},
"치첸이트사": { description:"치첸이트사는 마야 문명 최대의 고고학 유적지로 쿠쿨칸 피라미드가 상징입니다.", spots:[
  {name:"쿠쿨칸 피라미드", wikiTitle:"El Castillo, Chichen Itza", type:"역사", desc:"춘·추분에 뱀의 그림자가 계단을 타고 내려오는 천문학적 설계가 경이롭습니다.", rating:4.8, openTime:"08:00~17:00", price:"MXN 571", website:"https://www.chichenitza.com"},
]},

// 쿠바
"하바나": { description:"하바나는 클래식카와 식민지 건축, 쿠바 음악이 어우러진 시간이 멈춘 듯한 카리브해의 수도입니다.", spots:[
  {name:"올드 하바나", wikiTitle:"Old Havana", type:"역사", desc:"유네스코 세계유산인 구시가지로 스페인 식민지 시대 건축물이 보존되어 있습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Old_Havana"},
  {name:"말레콘 해안도로", wikiTitle:"Malecón, Havana", type:"도시", desc:"8km의 해안 산책로로 일몰 시 하바나 시민들이 모이는 소셜 공간입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Malecón,_Havana"},
]},
"트리니다드": { description:"트리니다드는 설탕 무역으로 번영한 18세기 식민지 도시가 완벽히 보존된 유네스코 세계유산입니다.", spots:[
  {name:"마요르 광장", wikiTitle:"Trinidad, Cuba", type:"역사", desc:"자갈길과 파스텔색 건물이 어우러진 식민지 시대 광장입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Trinidad,_Cuba"},
]},
"바라데로": { description:"바라데로는 20km의 백사장이 펼쳐진 쿠바 최고의 해변 리조트입니다.", spots:[
  {name:"바라데로 해변", wikiTitle:"Varadero", type:"자연", desc:"카리브해의 터키옥빛 바다와 새하얀 모래사장이 20km 이어지는 쿠바 최고의 해변입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Varadero"},
]},
"비냘레스": { description:"비냘레스는 석회암 봉우리(모고테)와 담배밭이 어우러진 유네스코 세계유산 계곡입니다.", spots:[
  {name:"비냘레스 계곡", wikiTitle:"Viñales Valley", type:"자연", desc:"석회암 기둥과 붉은 땅, 초록 담배밭이 만드는 독특한 풍경의 유네스코 세계유산입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Viñales_Valley"},
]},

// 아프리카
"케이프타운": { description:"케이프타운은 테이블 마운틴과 두 대양이 만나는 희망봉이 있는 남아프리카의 보석 같은 도시입니다.", spots:[
  {name:"테이블 마운틴", wikiTitle:"Table Mountain", type:"자연", desc:"케이블카로 1,085m 정상에 오르면 케이프타운과 대서양, 인도양이 한눈에 들어옵니다.", rating:4.8, openTime:"08:00~18:00", price:"R390", website:"https://www.tablemountain.net"},
  {name:"로벤 섬", wikiTitle:"Robben Island", type:"역사", desc:"넬슨 만델라가 18년간 수감되었던 섬으로 유네스코 세계유산입니다.", rating:4.6, openTime:"09:00~15:00", price:"R400", website:"https://www.robben-island.org.za"},
  {name:"희망봉", wikiTitle:"Cape of Good Hope", type:"자연", desc:"아프리카 대륙 남서쪽 끝단으로 대서양과 인도양이 만나는 상징적 장소입니다.", rating:4.5, openTime:"06:00~18:00", price:"R376", website:"https://en.wikipedia.org/wiki/Cape_of_Good_Hope"},
]},
"요하네스버그": { description:"요하네스버그는 남아프리카 최대 도시로 아파르트헤이트 역사와 현대 아프리카 문화가 공존합니다.", spots:[
  {name:"아파르트헤이트 박물관", wikiTitle:"Apartheid Museum", type:"역사", desc:"남아프리카 인종차별 역사를 생생히 전하는 강렬한 박물관입니다.", rating:4.6, openTime:"09:00~17:00", price:"R120", website:"https://en.wikipedia.org/wiki/Apartheid_Museum"},
]},
"더반": { description:"더반은 인도양 해변과 줄루 문화가 어우러진 남아프리카 동해안의 휴양 도시입니다.", spots:[
  {name:"골든 마일 해변", wikiTitle:"Durban", type:"자연", desc:"서핑과 수영을 즐길 수 있는 6km의 황금빛 해변 산책로입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Durban"},
]},
"크루거국립공원": { description:"크루거 국립공원은 아프리카 빅5를 모두 만날 수 있는 세계 최고의 사파리 명소입니다.", spots:[
  {name:"크루거 사파리", wikiTitle:"Kruger National Park", type:"자연", desc:"사자, 코끼리, 표범, 코뿔소, 버팔로 빅5를 야생에서 관찰하는 사파리입니다.", rating:4.8, openTime:"05:30~18:30", price:"R440", website:"https://www.sanparks.org/parks/kruger"},
]},
"드라켄즈버그": { description:"드라켄즈버그는 남아프리카 최고봉이 있는 산맥으로 유네스코 세계유산입니다.", spots:[
  {name:"드라켄즈버그 산맥", wikiTitle:"Drakensberg", type:"자연", desc:"'용의 산'이라는 뜻의 웅장한 산맥으로 하이킹과 암각화가 유명합니다.", rating:4.6, openTime:"24시간", price:"R80(공원)", website:"https://en.wikipedia.org/wiki/Drakensberg"},
]},
"나이로비": { description:"나이로비는 케냐의 수도이자 동아프리카 사파리의 관문으로 도심 국립공원이 독특합니다.", spots:[
  {name:"나이로비 국립공원", wikiTitle:"Nairobi National Park", type:"자연", desc:"도심 스카이라인을 배경으로 사자, 기린 등 야생동물을 볼 수 있는 독특한 국립공원입니다.", rating:4.5, openTime:"06:00~18:00", price:"$43", website:"https://en.wikipedia.org/wiki/Nairobi_National_Park"},
]},
"마사이마라": { description:"마사이마라는 세렝게티와 이어진 대초원으로 세계 최대의 야생동물 이동을 볼 수 있습니다.", spots:[
  {name:"마사이마라 사파리", wikiTitle:"Maasai Mara", type:"자연", desc:"매년 200만 마리의 누 떼가 대이동하는 세계 최고의 사파리 명소입니다.", rating:4.9, openTime:"연중", price:"$80/일", website:"https://www.maasaimara.com"},
]},
"몸바사": { description:"몸바사는 인도양의 해변 도시로 스와힐리 문화와 역사적 요새가 매력적입니다.", spots:[
  {name:"포트 지저스", wikiTitle:"Fort Jesus", type:"역사", desc:"1593년 포르투갈이 건설한 유네스코 세계유산 해안 요새입니다.", rating:4.4, openTime:"08:00~18:00", price:"KES 1,200", website:"https://en.wikipedia.org/wiki/Fort_Jesus"},
]},
"암보셀리": { description:"암보셀리는 킬리만자로 산을 배경으로 코끼리 떼를 볼 수 있는 케냐 최고의 국립공원입니다.", spots:[
  {name:"암보셀리 국립공원", wikiTitle:"Amboseli National Park", type:"자연", desc:"킬리만자로의 눈 덮인 봉우리를 배경으로 코끼리 떼가 거니는 상징적 풍경입니다.", rating:4.7, openTime:"06:00~18:00", price:"$60", website:"https://en.wikipedia.org/wiki/Amboseli_National_Park"},
]},
"라무": { description:"라무는 케냐 해안의 스와힐리 무역 도시로 600년 역사의 구시가지가 유네스코 세계유산입니다.", spots:[
  {name:"라무 구시가지", wikiTitle:"Lamu Old Town", type:"역사", desc:"차가 없는 좁은 골목의 스와힐리 전통 마을로 당나귀만 오갑니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Lamu_Old_Town"},
]},
"잔지바르": { description:"잔지바르는 스파이스 아일랜드로 불리는 탄자니아의 섬으로 아랍·아프리카 문화가 융합되어 있습니다.", spots:[
  {name:"스톤타운", wikiTitle:"Stone Town", type:"역사", desc:"유네스코 세계유산인 구시가지로 미로 같은 골목에 향신료 향이 가득합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Stone_Town"},
]},
"세렝게티": { description:"세렝게티 국립공원은 200만 마리의 야생동물 대이동이 펼쳐지는 아프리카 최고의 사파리입니다.", spots:[
  {name:"세렝게티 사파리", wikiTitle:"Serengeti National Park", type:"자연", desc:"끝없는 대초원에서 사자, 치타, 누 떼의 야생 드라마를 목격합니다.", rating:4.9, openTime:"연중", price:"$70/일", website:"https://www.serengeti.com"},
]},
"킬리만자로": { description:"킬리만자로는 아프리카 최고봉(5,895m)으로 만년설이 덮인 적도 위의 산입니다.", spots:[
  {name:"킬리만자로 등반", wikiTitle:"Mount Kilimanjaro", type:"자연", desc:"세계 7대 정상 중 하나로 5~9일 트레킹으로 정상 우후루 피크에 오릅니다.", rating:4.8, openTime:"연중(1~3월,6~10월 최적)", price:"$1,500~4,000", website:"https://www.tanzaniaparks.go.tz"},
]},
"응고롱고로": { description:"응고롱고로 분화구는 세계 최대의 칼데라로 내부에 빅5가 모두 서식합니다.", spots:[
  {name:"응고롱고로 크레이터", wikiTitle:"Ngorongoro Conservation Area", type:"자연", desc:"직경 20km의 거대한 분화구 안에 25,000마리 이상의 동물이 서식합니다.", rating:4.8, openTime:"06:00~18:00", price:"$70", website:"https://en.wikipedia.org/wiki/Ngorongoro_Conservation_Area"},
]},

// 중동
"페트라": { description:"페트라는 붉은 사암 절벽을 깎아 만든 나바테아 왕국의 고대 도시로 세계 신 7대 불가사의입니다.", spots:[
  {name:"알카즈네(보물창고)", wikiTitle:"Al-Khazneh", type:"역사", desc:"좁은 시크 협곡을 지나면 나타나는 40m 높이의 장미빛 석조 신전으로 인디아나 존스 촬영지입니다.", rating:4.9, openTime:"06:00~18:00", price:"JOD 50", website:"https://www.visitpetra.jo"},
]},
"암만": { description:"암만은 요르단의 수도로 로마 유적과 현대 도시가 공존하는 중동의 관문입니다.", spots:[
  {name:"암만 시타델", wikiTitle:"Amman Citadel", type:"역사", desc:"3,000년 역사의 언덕 위 유적지에서 암만 시내를 조망합니다.", rating:4.4, openTime:"08:00~19:00", price:"JOD 3", website:"https://en.wikipedia.org/wiki/Amman_Citadel"},
]},
"와디럼": { description:"와디럼은 '달의 계곡'으로 불리는 붉은 사막으로 영화 '마션'의 촬영지입니다.", spots:[
  {name:"와디럼 사막 캠프", wikiTitle:"Wadi Rum", type:"자연", desc:"붉은 사암 절벽과 모래 사막에서 베두인 캠프 숙박과 별 관측을 즐깁니다.", rating:4.8, openTime:"연중", price:"JOD 5(입장)+캠프별", website:"https://en.wikipedia.org/wiki/Wadi_Rum"},
]},
"아카바": { description:"아카바는 요르단 유일의 해안 도시로 홍해 다이빙과 스노클링이 유명합니다.", spots:[
  {name:"아카바 산호초", wikiTitle:"Gulf of Aqaba", type:"자연", desc:"홍해의 산호초 사이에서 열대어와 함께 스노클링과 다이빙을 즐깁니다.", rating:4.5, openTime:"08:00~17:00", price:"JOD 15(다이빙)", website:"https://en.wikipedia.org/wiki/Gulf_of_Aqaba"},
]},
"예루살렘": { description:"예루살렘은 유대교, 기독교, 이슬람 3대 종교의 성지가 한 도시에 모여있는 세계에서 가장 신성한 도시입니다.", spots:[
  {name:"통곡의 벽", wikiTitle:"Western Wall", type:"역사", desc:"유대교의 가장 신성한 장소로 솔로몬 성전의 서쪽 벽 잔해입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Western_Wall"},
  {name:"성묘교회", wikiTitle:"Church of the Holy Sepulchre", type:"역사", desc:"예수의 십자가형과 매장, 부활이 이루어진 곳으로 기독교 최고의 성지입니다.", rating:4.7, openTime:"05:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Church_of_the_Holy_Sepulchre"},
]},
"텔아비브": { description:"텔아비브는 지중해 해변과 바우하우스 건축, 활기찬 나이트라이프가 매력적인 이스라엘의 현대 도시입니다.", spots:[
  {name:"야포 구시가지", wikiTitle:"Jaffa", type:"역사", desc:"4,000년 역사의 항구 도시로 갤러리와 레스토랑이 모여있는 예술 지구입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Jaffa"},
]},
"마사다": { description:"마사다는 사해 옆 절벽 위에 자리한 고대 유대인 요새로 유네스코 세계유산입니다.", spots:[
  {name:"마사다 요새", wikiTitle:"Masada", type:"역사", desc:"로마 제국에 맞서 최후 항전한 유대인 요새로 일출 시 케이블카로 올라갑니다.", rating:4.6, openTime:"05:00~17:00", price:"₪31", website:"https://en.wikipedia.org/wiki/Masada"},
]},
"사해": { description:"사해는 해발 -430m 세계에서 가장 낮은 곳에 위치한 염도 34%의 호수로 물에 둥둥 뜹니다.", spots:[
  {name:"사해 해변", wikiTitle:"Dead Sea", type:"자연", desc:"높은 염도로 몸이 저절로 뜨는 신기한 체험과 천연 머드팩이 유명합니다.", rating:4.5, openTime:"08:00~17:00", price:"₪50", website:"https://en.wikipedia.org/wiki/Dead_Sea"},
]},

// 러시아
"모스크바": { description:"모스크바는 크렘린과 붉은 광장이 상징하는 러시아의 수도로 제정 러시아의 웅장한 유산이 가득합니다.", spots:[
  {name:"크렘린", wikiTitle:"Moscow Kremlin", type:"역사", desc:"러시아 대통령 관저이자 중세 요새로 성당, 궁전, 무기고가 모여있습니다.", rating:4.7, openTime:"09:30~18:00", price:"₽700", website:"https://www.kreml.ru"},
  {name:"성 바실리 대성당", wikiTitle:"Saint Basil's Cathedral", type:"역사", desc:"양파 모양의 알록달록한 돔이 상징적인 러시아 건축의 아이콘입니다.", rating:4.8, openTime:"10:00~18:00", price:"₽500", website:"https://en.wikipedia.org/wiki/Saint_Basil's_Cathedral"},
]},
"상트페테르부르크": { description:"상트페테르부르크는 에르미타주 박물관과 운하가 아름다운 러시아의 문화 수도입니다.", spots:[
  {name:"에르미타주 박물관", wikiTitle:"Hermitage Museum", type:"문화", desc:"300만 점의 소장품을 가진 세계 4대 박물관 중 하나로 겨울 궁전에 자리합니다.", rating:4.9, openTime:"10:30~18:00", price:"₽500", website:"https://www.hermitagemuseum.org"},
  {name:"피터호프 궁전", wikiTitle:"Peterhof Palace", type:"역사", desc:"'러시아의 베르사유'로 불리며 150개의 황금 분수가 장관입니다.", rating:4.7, openTime:"09:00~20:00", price:"₽600", website:"https://en.wikipedia.org/wiki/Peterhof_Palace"},
]},
"바이칼호": { description:"바이칼 호수는 세계에서 가장 깊고(1,642m) 오래된 호수로 투명한 얼음이 유명합니다.", spots:[
  {name:"바이칼 호수", wikiTitle:"Lake Baikal", type:"자연", desc:"지구 민물의 20%를 담고 있는 유네스코 세계유산으로 겨울 투명 얼음이 장관입니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Lake_Baikal"},
]},
"소치": { description:"소치는 흑해 연안의 러시아 최대 휴양지로 2014 동계올림픽 개최 도시입니다.", spots:[
  {name:"로사 쿠토르 스키 리조트", wikiTitle:"Rosa Khutor", type:"자연", desc:"2014 동계올림픽 알파인 스키 경기장으로 사계절 관광이 가능합니다.", rating:4.5, openTime:"10:00~17:00", price:"₽1,500", website:"https://en.wikipedia.org/wiki/Rosa_Khutor"},
]},
"블라디보스토크": { description:"블라디보스토크는 시베리아 횡단 열차의 종점으로 태평양과 접한 러시아 극동의 항구 도시입니다.", spots:[
  {name:"금각만 대교", wikiTitle:"Russky Bridge", type:"랜드마크", desc:"세계 최장 사장교로 블라디보스토크의 상징적 랜드마크입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Russky_Bridge"},
]},

// 사우디·이란·우즈벡·에티오피아·가나
"리야드": { description:"리야드는 사우디아라비아의 수도로 현대적 마천루와 전통 시장이 공존합니다.", spots:[
  {name:"킹덤 센터 타워", wikiTitle:"Kingdom Centre", type:"랜드마크", desc:"302m 높이의 타워로 꼭대기 스카이 브릿지에서 리야드 전경을 조망합니다.", rating:4.4, openTime:"10:00~23:00", price:"SAR 63", website:"https://en.wikipedia.org/wiki/Kingdom_Centre"},
]},
"제다": { description:"제다는 홍해 연안의 상업 도시로 메카 순례의 관문이자 유네스코 세계유산 구시가지가 있습니다.", spots:[
  {name:"알발라드 구시가지", wikiTitle:"Al-Balad", type:"역사", desc:"산호석으로 지어진 전통 건물의 유네스코 세계유산 역사 지구입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Al-Balad"},
]},
"알울라": { description:"알울라는 사우디아라비아 북부의 고대 유적지로 나바테아 왕국의 무덤이 있는 사막의 보석입니다.", spots:[
  {name:"마다인 살레", wikiTitle:"Hegra (archaeological site)", type:"역사", desc:"페트라와 비슷한 나바테아 왕국의 암굴 무덤 유적으로 유네스코 세계유산입니다.", rating:4.7, openTime:"07:00~19:00", price:"SAR 95", website:"https://en.wikipedia.org/wiki/Hegra_(archaeological_site)"},
]},
"메카": { description:"메카는 이슬람교의 최고 성지로 전 세계 무슬림의 순례 목적지입니다.", spots:[
  {name:"마스지드 알하람", wikiTitle:"Masjid al-Haram", type:"역사", desc:"세계 최대의 모스크로 중앙에 카바 신전이 자리합니다. 비무슬림 입장 불가입니다.", rating:4.9, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Masjid_al-Haram"},
]},
"테헤란": { description:"테헤란은 이란의 수도로 페르시아 문명의 보물과 현대 도시가 공존합니다.", spots:[
  {name:"골레스탄 궁전", wikiTitle:"Golestan Palace", type:"역사", desc:"카자르 왕조의 궁전으로 거울의 방이 유명한 유네스코 세계유산입니다.", rating:4.5, openTime:"09:00~16:30", price:"IRR 500,000", website:"https://en.wikipedia.org/wiki/Golestan_Palace"},
]},
"이스파한": { description:"이스파한은 '세계의 절반'이라 불리는 페르시아의 보석으로 이맘 광장이 유네스코 세계유산입니다.", spots:[
  {name:"이맘 광장", wikiTitle:"Naqsh-e Jahan Square", type:"역사", desc:"세계에서 두 번째로 큰 광장으로 이맘 모스크, 알리카푸 궁전이 둘러싸고 있습니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Naqsh-e_Jahan_Square"},
]},
"시라즈": { description:"시라즈는 페르세폴리스의 관문이자 시와 장미의 도시로 페르시아 문화의 심장입니다.", spots:[
  {name:"나시르 알 몰크 모스크", wikiTitle:"Nasir-ol-Molk Mosque", type:"역사", desc:"스테인드글라스를 통해 무지개빛이 쏟아지는 '핑크 모스크'입니다.", rating:4.7, openTime:"08:00~11:30", price:"IRR 200,000", website:"https://en.wikipedia.org/wiki/Nasir-ol-Molk_Mosque"},
]},
"페르세폴리스": { description:"페르세폴리스는 아케메네스 제국의 수도였던 고대 유적으로 유네스코 세계유산입니다.", spots:[
  {name:"페르세폴리스 유적", wikiTitle:"Persepolis", type:"역사", desc:"다리우스 1세가 건설한 제국의 의전 수도로 거대한 석조 궁전과 부조가 남아있습니다.", rating:4.8, openTime:"08:00~17:00", price:"IRR 500,000", website:"https://en.wikipedia.org/wiki/Persepolis"},
]},
"사마르칸트": { description:"사마르칸트는 실크로드의 교차점으로 티무르 제국의 화려한 이슬람 건축이 보존된 유네스코 세계유산 도시입니다.", spots:[
  {name:"레기스탄 광장", wikiTitle:"Registan", type:"역사", desc:"세 개의 웅장한 마드라사가 광장을 둘러싼 중앙아시아 최고의 건축물입니다.", rating:4.9, openTime:"08:00~19:00", price:"$6", website:"https://en.wikipedia.org/wiki/Registan"},
]},
"부하라": { description:"부하라는 2,500년 역사의 실크로드 도시로 중앙아시아에서 가장 잘 보존된 중세 이슬람 도시입니다.", spots:[
  {name:"아르크 요새", wikiTitle:"Ark of Bukhara", type:"역사", desc:"2,000년 역사의 부하라 에미르 궁전 겸 요새입니다.", rating:4.5, openTime:"09:00~17:00", price:"$4", website:"https://en.wikipedia.org/wiki/Ark_of_Bukhara"},
]},
"히바": { description:"히바는 실크로드의 오아시스 도시로 이찬칼라 내성 전체가 유네스코 세계유산입니다.", spots:[
  {name:"이찬칼라", wikiTitle:"Itchan Kala", type:"역사", desc:"완벽히 보존된 중세 이슬람 도시로 미완성 미나렛 칼타 미노르가 상징입니다.", rating:4.6, openTime:"08:00~18:00", price:"$8", website:"https://en.wikipedia.org/wiki/Itchan_Kala"},
]},
"타슈켄트": { description:"타슈켄트는 우즈베키스탄의 수도로 소비에트와 이슬람 건축이 독특하게 공존합니다.", spots:[
  {name:"초르수 바자르", wikiTitle:"Chorsu Bazaar", type:"문화", desc:"거대한 돔 아래 향신료, 과일, 수공예품이 가득한 중앙아시아 최대 바자르입니다.", rating:4.4, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Chorsu_Bazaar"},
]},
"아디스아바바": { description:"아디스아바바는 에티오피아의 수도이자 아프리카 연합 본부가 있는 아프리카의 정치 수도입니다.", spots:[
  {name:"에티오피아 국립박물관", wikiTitle:"National Museum of Ethiopia", type:"문화", desc:"320만 년 전 인류 화석 '루시'를 소장한 박물관입니다.", rating:4.3, openTime:"08:30~17:30", price:"ETB 10", website:"https://en.wikipedia.org/wiki/National_Museum_of_Ethiopia"},
]},
"랄리벨라": { description:"랄리벨라는 12세기에 바위를 깎아 만든 11개의 암굴 교회가 있는 에티오피아 기독교의 성지입니다.", spots:[
  {name:"암굴 교회", wikiTitle:"Churches of Lalibela", type:"역사", desc:"단일 바위를 위에서 아래로 깎아 만든 교회 11개가 유네스코 세계유산입니다.", rating:4.8, openTime:"06:00~17:00", price:"$50", website:"https://en.wikipedia.org/wiki/Rock-Hewn_Churches,_Lalibela"},
]},
"악숨": { description:"악숨은 악숨 왕국의 고대 수도로 오벨리스크와 시바 여왕 전설이 있는 역사 도시입니다.", spots:[
  {name:"악숨 오벨리스크", wikiTitle:"Obelisk of Axum", type:"역사", desc:"1,700년 된 24m 높이 화강암 석비로 유네스코 세계유산입니다.", rating:4.4, openTime:"08:00~17:00", price:"ETB 200", website:"https://en.wikipedia.org/wiki/Obelisk_of_Axum"},
]},
"다나킬사막": { description:"다나킬 사막은 지구에서 가장 뜨겁고 낮은 곳 중 하나로 유황 온천과 소금 호수가 외계 행성 같습니다.", spots:[
  {name:"다나킬 함몰지", wikiTitle:"Danakil Depression", type:"자연", desc:"유황 분출구와 형형색색 소금 결정이 만드는 초현실적 풍경입니다.", rating:4.5, openTime:"투어 전용", price:"$200~(3박4일)", website:"https://en.wikipedia.org/wiki/Danakil_Depression"},
]},
"아크라": { description:"아크라는 가나의 수도로 대서양 해안의 노예 무역 역사와 활기찬 시장이 있습니다.", spots:[
  {name:"제임스 타운", wikiTitle:"James Town, Accra", type:"역사", desc:"아크라 원주민 가(Ga) 족의 전통 어업 마을로 등대와 식민지 유적이 있습니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/James_Town,_Accra"},
]},
"케이프코스트": { description:"케이프코스트는 가나 남부의 역사 도시로 노예 무역 시대의 요새가 유네스코 세계유산입니다.", spots:[
  {name:"케이프코스트 성", wikiTitle:"Cape Coast Castle", type:"역사", desc:"대서양 노예 무역의 중심지였던 요새로 유네스코 세계유산입니다.", rating:4.6, openTime:"09:00~16:30", price:"GHS 80", website:"https://en.wikipedia.org/wiki/Cape_Coast_Castle"},
]},
"쿠마시": { description:"쿠마시는 아샨티 왕국의 수도로 가나의 문화와 전통 공예의 중심지입니다.", spots:[
  {name:"케제티아 시장", wikiTitle:"Kejetia Market", type:"문화", desc:"서아프리카 최대의 야외 시장으로 10,000개 이상의 노점이 있습니다.", rating:4.2, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Kejetia_Market"},
]},

// 뉴질랜드
"퀸스타운": { description:"퀸스타운은 번지점프의 발상지이자 모험 스포츠의 수도로 와카티푸 호수와 리마커블즈 산맥이 장관입니다.", spots:[
  {name:"밀포드 사운드", wikiTitle:"Milford Sound", type:"자연", desc:"피오르드랜드 국립공원의 하이라이트로 깎아지른 절벽과 폭포가 장관입니다.", rating:4.9, openTime:"크루즈 08:00~", price:"NZD 70~", website:"https://en.wikipedia.org/wiki/Milford_Sound/Piopiotahi"},
  {name:"카와라우 번지점프", wikiTitle:"Bungee jumping", type:"도시", desc:"세계 최초의 상업 번지점프 사이트로 43m 다리에서 뛰어내립니다.", rating:4.5, openTime:"09:00~17:00", price:"NZD 205", website:"https://www.bungy.co.nz"},
]},
"오클랜드": { description:"오클랜드는 뉴질랜드 최대 도시로 항구와 화산, 폴리네시아 문화가 어우러진 도시입니다.", spots:[
  {name:"스카이 타워", wikiTitle:"Sky Tower (Auckland)", type:"랜드마크", desc:"328m 뉴질랜드 최고층 타워에서 스카이워크와 스카이점프 체험이 가능합니다.", rating:4.4, openTime:"09:00~22:00", price:"NZD 33", website:"https://en.wikipedia.org/wiki/Sky_Tower_(Auckland)"},
]},
"로토루아": { description:"로토루아는 지열 활동이 활발한 마오리 문화의 중심지로 간헐천과 온천이 유명합니다.", spots:[
  {name:"테푸이아", wikiTitle:"Te Puia", type:"문화", desc:"포후투 간헐천과 마오리 공연, 키위새를 볼 수 있는 지열 공원입니다.", rating:4.5, openTime:"08:00~18:00", price:"NZD 70", website:"https://www.tepuia.com"},
]},
"웰링턴": { description:"웰링턴은 뉴질랜드의 수도로 카페 문화와 영화(반지의 제왕) 산업이 번성한 문화 도시입니다.", spots:[
  {name:"테파파 박물관", wikiTitle:"Museum of New Zealand Te Papa Tongarewa", type:"문화", desc:"뉴질랜드의 자연과 마오리 문화를 다루는 국립박물관으로 입장 무료입니다.", rating:4.6, openTime:"10:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Museum_of_New_Zealand_Te_Papa_Tongarewa"},
]},
"밀포드사운드": { description:"밀포드 사운드는 뉴질랜드 남섬의 피오르드로 수직 절벽과 폭포가 장관인 세계유산입니다.", spots:[
  {name:"밀포드 사운드 크루즈", wikiTitle:"Milford Sound", type:"자연", desc:"마이터 피크와 스털링 폭포를 배로 지나며 감상하는 뉴질랜드 최고의 경관입니다.", rating:4.9, openTime:"08:00~17:00", price:"NZD 70~", website:"https://en.wikipedia.org/wiki/Milford_Sound/Piopiotahi"},
]},
"호비튼": { description:"호비튼은 반지의 제왕·호빗 영화 촬영 세트로 실제 호빗 마을을 체험할 수 있습니다.", spots:[
  {name:"호비튼 무비 세트", wikiTitle:"Hobbiton Movie Set", type:"문화", desc:"44개의 호빗 집이 보존된 촬영지로 그린 드래곤 펍에서 에일 맥주를 즐깁니다.", rating:4.7, openTime:"09:00~17:00", price:"NZD 89", website:"https://www.hobbitontours.com"},
]},

// 핀란드·아이슬란드·폴란드
"헬싱키": { description:"헬싱키는 북유럽 디자인과 사우나 문화, 아르누보 건축이 매력적인 핀란드의 수도입니다.", spots:[
  {name:"수오멘린나 해상 요새", wikiTitle:"Suomenlinna", type:"역사", desc:"6개 섬에 걸친 18세기 해상 요새로 유네스코 세계유산입니다.", rating:4.6, openTime:"24시간", price:"무료(페리)", website:"https://www.suomenlinna.fi"},
  {name:"템펠리아우키오 교회", wikiTitle:"Temppeliaukio Church", type:"역사", desc:"바위를 파서 만든 독특한 지하 교회로 자연 음향이 뛰어납니다.", rating:4.4, openTime:"10:00~17:00", price:"€5", website:"https://en.wikipedia.org/wiki/Temppeliaukio_Church"},
]},
"로바니에미": { description:"로바니에미는 북극권 위의 도시로 산타클로스 마을과 오로라 관측이 유명합니다.", spots:[
  {name:"산타클로스 마을", wikiTitle:"Santa Claus Village", type:"문화", desc:"북극선 위에 자리한 산타의 공식 거주지로 연중 크리스마스 분위기입니다.", rating:4.5, openTime:"10:00~17:00", price:"무료(체험별)", website:"https://santaclausvillage.info"},
]},
"탐페레": { description:"탐페레는 두 호수 사이에 자리한 핀란드 제2의 도시로 사우나 문화의 본고장입니다.", spots:[
  {name:"라우하니에미 공공 사우나", wikiTitle:"Tampere", type:"문화", desc:"호수 옆 전통 공공 사우나에서 핀란드 사우나 문화를 체험합니다.", rating:4.4, openTime:"14:00~20:00", price:"€8", website:"https://en.wikipedia.org/wiki/Tampere"},
]},
"레이캬비크": { description:"레이캬비크는 세계 최북단 수도로 블루라군과 오로라, 고래 관측의 거점 도시입니다.", spots:[
  {name:"할그림스키르캬 교회", wikiTitle:"Hallgrímskirkja", type:"랜드마크", desc:"73m 높이의 현무암 기둥을 모티브로 한 교회로 레이캬비크의 상징입니다.", rating:4.5, openTime:"09:00~17:00", price:"ISK 1,000(타워)", website:"https://www.hallgrimskirkja.is"},
  {name:"골든서클 투어", wikiTitle:"Golden Circle", type:"자연", desc:"굴포스 폭포, 게이시르 간헐천, 씽벨리르 국립공원을 하루에 돌아보는 인기 코스입니다.", rating:4.7, openTime:"투어별", price:"ISK 10,000~", website:"https://www.visiticeland.com"},
]},
"아퀴레이리": { description:"아퀴레이리는 아이슬란드 북부의 수도로 고래 관측과 미바튼 호수 투어의 거점입니다.", spots:[
  {name:"미바튼 호수", wikiTitle:"Lake Mývatn", type:"자연", desc:"화산 분화구와 지열 지대에 둘러싸인 호수로 이색적 풍경이 펼쳐집니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Lake_Mývatn"},
]},
"블루라군": { description:"블루라군은 아이슬란드의 상징적 지열 온천으로 유백색 온천수에서의 입욕 경험이 유명합니다.", spots:[
  {name:"블루 라군 온천", wikiTitle:"Blue Lagoon (geothermal spa)", type:"자연", desc:"38°C 지열 온천수에서 실리카 머드팩을 하며 용암 지대를 감상합니다.", rating:4.6, openTime:"07:00~22:00", price:"ISK 11,990~", website:"https://www.bluelagoon.com"},
]},
"요쿨살론": { description:"요쿨살론은 빙하 조각이 떠다니는 빙하 석호로 아이슬란드 최고의 자연 경관입니다.", spots:[
  {name:"요쿨살론 빙하 석호", wikiTitle:"Jökulsárlón", type:"자연", desc:"빙하에서 떨어져 나온 파란 빙산이 호수에 떠다니는 환상적인 풍경입니다.", rating:4.9, openTime:"24시간", price:"무료(보트 ISK 6,600)", website:"https://www.visiticeland.com"},
]},
"골든서클": { description:"골든서클은 아이슬란드에서 가장 인기 있는 관광 루트로 폭포, 간헐천, 국립공원을 하루에 돌아봅니다.", spots:[
  {name:"굴포스 폭포", wikiTitle:"Gullfoss", type:"자연", desc:"이중 계단식 폭포로 엄청난 양의 물이 협곡으로 쏟아지는 장관입니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://www.visiticeland.com"},
]},
"크라쿠프": { description:"크라쿠프는 폴란드의 옛 수도로 바벨 성과 중세 구시가지가 아름다운 유네스코 세계유산 도시입니다.", spots:[
  {name:"바벨 성", wikiTitle:"Wawel Castle", type:"역사", desc:"폴란드 왕들이 거주한 고딕-르네상스 궁전으로 대성당과 용 동굴이 유명합니다.", rating:4.7, openTime:"09:30~17:00", price:"PLN 30~", website:"https://www.wawel.krakow.pl"},
  {name:"비엘리치카 소금광산", wikiTitle:"Wieliczka Salt Mine", type:"역사", desc:"700년 역사의 지하 소금 도시로 소금으로 만든 예배당이 경이롭습니다.", rating:4.7, openTime:"07:30~19:30", price:"PLN 120", website:"https://www.wieliczka-saltmine.com"},
]},
"바르샤바": { description:"바르샤바는 2차대전 파괴 후 복원된 폴란드의 수도로 유네스코 세계유산인 구시가지가 부활의 상징입니다.", spots:[
  {name:"바르샤바 구시가지", wikiTitle:"Warsaw Old Town", type:"역사", desc:"전쟁 후 시민들이 원래 모습으로 재건한 유네스코 세계유산입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Warsaw_Old_Town"},
]},
"브로츠와프": { description:"브로츠와프는 오데르강의 12개 섬과 130개 다리로 이루어진 폴란드의 '작은 베니스'입니다.", spots:[
  {name:"난쟁이 동상 찾기", wikiTitle:"Wrocław's dwarfs", type:"문화", desc:"시내 곳곳에 숨겨진 300개 이상의 작은 난쟁이 동상을 찾는 재미가 있습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Wrocław's_dwarfs"},
]},
"그단스크": { description:"그단스크는 발트해 연안의 항구 도시로 한자동맹 시대의 부유함과 호박 가공 전통이 살아있습니다.", spots:[
  {name:"긴 시장 거리", wikiTitle:"Long Market, Gdańsk", type:"역사", desc:"한자동맹 시대의 화려한 건물이 줄지어 선 그단스크의 메인 거리입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Long_Market,_Gdańsk"},
]},
"자코파네": { description:"자코파네는 타트라 산맥 기슭의 겨울 스포츠 도시로 폴란드의 알프스라 불립니다.", spots:[
  {name:"타트라 국립공원", wikiTitle:"Tatra National Park, Poland", type:"자연", desc:"폴란드 최고봉 리시산을 품은 고산 국립공원으로 하이킹이 인기입니다.", rating:4.6, openTime:"24시간", price:"PLN 8", website:"https://en.wikipedia.org/wiki/Tatra_National_Park,_Poland"},
]},

// ────────────────────────── 추가 국가 ──────────────────────────
"더블린": { description:"더블린은 기네스 맥주와 문학의 도시로 제임스 조이스, 오스카 와일드를 배출한 아일랜드의 수도입니다.", spots:[
  {name:"트리니티 칼리지", wikiTitle:"Trinity College Dublin", type:"역사", desc:"1592년 설립된 아일랜드 최고의 대학으로 켈스의 서가 유명합니다.", rating:4.7, openTime:"08:30~17:00", price:"€18", website:"https://en.wikipedia.org/wiki/Trinity_College_Dublin"},
  {name:"기네스 스토어하우스", wikiTitle:"Guinness Storehouse", type:"문화", desc:"기네스 맥주의 역사를 배우고 옥상 바에서 더블린 전경과 함께 한 잔을 즐깁니다.", rating:4.5, openTime:"09:30~19:00", price:"€26", website:"https://en.wikipedia.org/wiki/Guinness_Storehouse"},
  {name:"템플 바", wikiTitle:"Temple Bar, Dublin", type:"도시", desc:"라이브 아이리시 음악과 펍이 가득한 더블린의 문화 중심 거리입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Temple_Bar,_Dublin"},
]},
"골웨이": { description:"골웨이는 아일랜드 서해안의 보헤미안 도시로 전통 음악과 모허 절벽 투어의 거점입니다.", spots:[
  {name:"모허 절벽", wikiTitle:"Cliffs of Moher", type:"자연", desc:"214m 높이의 수직 절벽이 대서양과 만나는 아일랜드 최고의 절경입니다.", rating:4.8, openTime:"08:00~19:00", price:"€8", website:"https://en.wikipedia.org/wiki/Cliffs_of_Moher"},
]},
"브뤼셀": { description:"브뤼셀은 EU 본부가 있는 벨기에의 수도로 그랑플라스 광장과 초콜릿, 와플이 유명합니다.", spots:[
  {name:"그랑플라스", wikiTitle:"Grand-Place", type:"역사", desc:"유네스코 세계유산으로 화려한 길드 하우스에 둘러싸인 유럽에서 가장 아름다운 광장입니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Grand-Place"},
  {name:"오줌싸개 소년상", wikiTitle:"Manneken Pis", type:"랜드마크", desc:"61cm의 작은 동상이지만 브뤼셀의 상징으로 계절마다 옷을 갈아입힙니다.", rating:4.0, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Manneken_Pis"},
]},
"브뤼헤": { description:"브뤼헤는 '북유럽의 베니스'로 불리는 벨기에의 중세 도시로 운하와 초콜릿 가게가 매력적입니다.", spots:[
  {name:"브뤼헤 운하 투어", wikiTitle:"Bruges", type:"역사", desc:"운하를 따라 중세 건물을 보트에서 감상하는 유네스코 세계유산 도시입니다.", rating:4.7, openTime:"10:00~18:00", price:"€12", website:"https://en.wikipedia.org/wiki/Bruges"},
]},
"타이베이": { description:"타이베이는 대만의 수도로 야시장 미식, 101 타워, 전통 사원이 어우러진 활기찬 도시입니다.", spots:[
  {name:"타이베이 101", wikiTitle:"Taipei 101", type:"랜드마크", desc:"508m 높이의 대나무 모양 초고층 빌딩으로 전망대에서 도시 전경을 감상합니다.", rating:4.6, openTime:"09:00~22:00", price:"NT$600", website:"https://en.wikipedia.org/wiki/Taipei_101"},
  {name:"스린 야시장", wikiTitle:"Shilin Night Market", type:"음식", desc:"대만 최대의 야시장으로 소룽바오, 닭튀김, 버블티 등 먹거리 천국입니다.", rating:4.5, openTime:"16:00~00:00", price:"무료", website:"https://en.wikipedia.org/wiki/Shilin_Night_Market"},
  {name:"룽산사", wikiTitle:"Lungshan Temple (Wanhua District)", type:"역사", desc:"1738년에 건립된 타이베이에서 가장 오래된 사원으로 정교한 조각이 인상적입니다.", rating:4.4, openTime:"06:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Lungshan_Temple_(Wanhua_District)"},
]},
"지우펀": { description:"지우펀은 산비탈의 계단식 골목과 홍등이 지브리 애니메이션 '센과 치히로'를 떠올리게 하는 마을입니다.", spots:[
  {name:"지우펀 올드스트리트", wikiTitle:"Jiufen", type:"문화", desc:"붉은 등불이 걸린 좁은 골목에 차집, 토란볼 가게, 기념품점이 빼곡합니다.", rating:4.5, openTime:"10:00~20:00", price:"무료", website:"https://en.wikipedia.org/wiki/Jiufen"},
]},
"가오슝": { description:"가오슝은 대만 제2의 도시로 러브하버, 용호탑, 활기찬 야시장이 인상적인 항구 도시입니다.", spots:[
  {name:"용호탑", wikiTitle:"Dragon and Tiger Pagodas", type:"역사", desc:"蓮池潭 연지담 호수 위에 세워진 7층 용탑과 호랑이탑. 용의 입으로 들어가 호랑이 입으로 나오면 행운이 온다는 전설이 있습니다.", rating:4.5, openTime:"07:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Dragon_and_Tiger_Pagodas"},
  {name:"러브하버", wikiTitle:"Love River (Kaohsiung)", type:"도시", desc:"가오슝의 낭만적인 항구 지구로 야경이 아름답고 카페와 레스토랑이 즐비합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Love_River_(Kaohsiung)"},
  {name:"치진섬", wikiTitle:"Cijin District", type:"자연", desc:"페리로 10분이면 닿는 작은 섬으로 해산물 거리와 자전거 코스가 유명합니다.", rating:4.4, openTime:"24시간", price:"페리 NT$15", website:"https://en.wikipedia.org/wiki/Cijin_District"},
]},
"타이난": { description:"타이난은 대만에서 가장 오래된 도시로 '대만의 교토'라 불리며 300여 개의 사원과 맛집이 집중돼 있습니다.", spots:[
  {name:"안핑 고성", wikiTitle:"Fort Zeelandia", type:"역사", desc:"17세기 네덜란드가 쌓은 포르모사 최초의 요새. 붉은 벽돌과 열대 수목이 어우러집니다.", rating:4.5, openTime:"08:30~17:30", price:"NT$50", website:"https://en.wikipedia.org/wiki/Fort_Zeelandia_(Taiwan)"},
  {name:"적감루", wikiTitle:"Chihkan Tower", type:"역사", desc:"17세기 네덜란드가 건설한 요새 위에 지어진 중국식 건물로 타이난의 상징입니다.", rating:4.4, openTime:"08:30~21:00", price:"NT$50", website:"https://en.wikipedia.org/wiki/Chihkan_Tower"},
]},
"타이중": { description:"타이중은 대만 중부의 문화 도시로 레인보우 빌리지, 국립 자연과학 박물관, 미식 거리가 풍부합니다.", spots:[
  {name:"레인보우 빌리지", wikiTitle:"Rainbow Village, Taichung", type:"문화", desc:"황영부 할아버지가 혼자 그린 형형색색의 벽화 마을. 철거 위기에서 관광 명소로 살아남았습니다.", rating:4.5, openTime:"06:00~19:00", price:"무료", website:"https://en.wikipedia.org/wiki/Rainbow_Village,_Taichung"},
  {name:"펑자 야시장", wikiTitle:"Fengjia Night Market", type:"음식", desc:"대만 최대 규모의 야시장 중 하나로 창의적인 길거리 음식의 발상지입니다.", rating:4.5, openTime:"17:00~01:00", price:"무료", website:"https://en.wikipedia.org/wiki/Fengjia_Night_Market"},
]},
"화롄": { description:"화롄은 타이완 동부 해안의 관문 도시로 태평양과 중앙산맥이 만나는 웅장한 자연 경관을 자랑합니다.", spots:[
  {name:"칠성담 해변", wikiTitle:"Qixingtan Beach", type:"자연", desc:"검은 자갈로 유명한 해변에서 중앙산맥과 태평양의 장관이 동시에 펼쳐집니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Qixingtan_Beach"},
  {name:"화롄 야시장", wikiTitle:"Hualien", type:"음식", desc:"아미족 원주민 문화와 대만 미식이 어우러진 현지인 단골 야시장입니다.", rating:4.3, openTime:"17:00~23:00", price:"무료", website:"https://en.wikipedia.org/wiki/Hualien_City"},
]},
"타로코": { description:"타로코 협곡은 대리석으로 이루어진 세계 최대급 협곡으로 대만 최고의 자연 경관을 자랑하는 국립공원입니다.", spots:[
  {name:"타로코 협곡", wikiTitle:"Taroko Gorge", type:"자연", desc:"19km에 걸쳐 펼쳐진 순백의 대리석 협곡. 입곡 터널, 연자구 폭포 등 절경이 이어집니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Taroko_Gorge"},
  {name:"청수단애", wikiTitle:"Qingshui Cliffs", type:"자연", desc:"태평양을 향해 1,000m 직벽으로 깎아지른 절벽. 세계 10대 절경 중 하나로 꼽힙니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Qingshui_Cliffs"},
]},
"말레": { description:"몰디브의 수도 말레는 1,200개 산호섬으로 이루어진 인도양의 열대 낙원으로 가는 관문입니다.", spots:[
  {name:"수상 빌라 리조트", wikiTitle:"Maldives", type:"자연", desc:"투명한 바다 위 수상 빌라에서 산호초 스노클링과 돌고래를 만나는 꿈의 휴양지입니다.", rating:4.9, openTime:"연중", price:"리조트별", website:"https://en.wikipedia.org/wiki/Maldives"},
]},
"산호세": { description:"산호세는 코스타리카의 수도로 열대우림과 화산, 야생동물의 보고인 에코투어리즘의 메카입니다.", spots:[
  {name:"마누엘 안토니오 국립공원", wikiTitle:"Manuel Antonio National Park", type:"자연", desc:"열대우림과 백사장이 만나는 곳으로 원숭이, 나무늘보를 야생에서 만납니다.", rating:4.7, openTime:"07:00~16:00", price:"$18", website:"https://en.wikipedia.org/wiki/Manuel_Antonio_National_Park"},
]},
"아레날": { description:"아레날은 활화산과 온천이 어우러진 코스타리카의 모험 관광 중심지입니다.", spots:[
  {name:"아레날 화산", wikiTitle:"Arenal Volcano", type:"자연", desc:"원뿔형 활화산 아래 열대우림 트레킹과 화산 온천을 즐깁니다.", rating:4.6, openTime:"08:00~16:00", price:"$15", website:"https://en.wikipedia.org/wiki/Arenal_Volcano"},
]},
"파나마시티": { description:"파나마시티는 파나마 운하와 현대적 스카이라인이 공존하는 중미의 국제 도시입니다.", spots:[
  {name:"파나마 운하", wikiTitle:"Panama Canal", type:"랜드마크", desc:"대서양과 태평양을 잇는 80km 인공 수로로 미라플로레스 전망대에서 관찰합니다.", rating:4.7, openTime:"08:00~17:00", price:"$20", website:"https://en.wikipedia.org/wiki/Panama_Canal"},
]},
"키토": { description:"키토는 해발 2,850m에 위치한 에콰도르의 수도로 유네스코 세계유산 최초 등록 도시입니다.", spots:[
  {name:"키토 구시가지", wikiTitle:"Historic Centre of Quito", type:"역사", desc:"남미에서 가장 잘 보존된 식민지 시대 구시가지로 유네스코 세계유산입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Historic_Centre_of_Quito"},
]},
"갈라파고스": { description:"갈라파고스 제도는 다윈의 진화론이 탄생한 곳으로 독특한 야생동물이 가득한 자연의 보고입니다.", spots:[
  {name:"갈라파고스 국립공원", wikiTitle:"Galápagos National Park", type:"자연", desc:"거대 거북, 바다이구아나, 푸른발 부비새 등 독특한 생물을 만나는 살아있는 진화의 섬입니다.", rating:4.9, openTime:"연중", price:"$100", website:"https://en.wikipedia.org/wiki/Galápagos_National_Park"},
]},
"부쿠레슈티": { description:"부쿠레슈티는 '동유럽의 파리'로 불리는 루마니아의 수도로 세계 최대 의회 궁전이 있습니다.", spots:[
  {name:"의회 궁전", wikiTitle:"Palace of the Parliament", type:"역사", desc:"세계에서 두 번째로 큰 건물로 차우셰스쿠가 건설한 거대한 궁전입니다.", rating:4.5, openTime:"09:00~17:00", price:"RON 70", website:"https://en.wikipedia.org/wiki/Palace_of_the_Parliament"},
]},
"브라쇼프": { description:"브라쇼프는 트란실바니아의 중세 도시로 드라큘라 성(브란성)의 관문입니다.", spots:[
  {name:"브란 성(드라큘라 성)", wikiTitle:"Bran Castle", type:"역사", desc:"드라큘라 전설의 배경이 된 14세기 고딕 성으로 카르파티아 산맥 아래 자리합니다.", rating:4.4, openTime:"09:00~18:00", price:"RON 50", website:"https://en.wikipedia.org/wiki/Bran_Castle"},
]},
"트빌리시": { description:"트빌리시는 코카서스 산맥 아래 유럽과 아시아가 만나는 조지아의 수도로 와인과 온천이 유명합니다.", spots:[
  {name:"나리칼라 요새", wikiTitle:"Narikala", type:"역사", desc:"4세기에 건설된 요새에서 트빌리시 구시가지와 쿠라강을 조망합니다.", rating:4.5, openTime:"24시간", price:"무료(케이블카 GEL 2.5)", website:"https://en.wikipedia.org/wiki/Narikala"},
  {name:"유황 온천 지구", wikiTitle:"Abanotubani", type:"문화", desc:"트빌리시의 이름 유래가 된 유황 온천 지구로 돔형 목욕탕이 특징입니다.", rating:4.4, openTime:"09:00~23:00", price:"GEL 30~80", website:"https://en.wikipedia.org/wiki/Abanotubani"},
]},
"카즈베기": { description:"카즈베기는 코카서스 대산맥 해발 2,170m에 자리한 산악 마을로 게르게티 삼위일체 교회와 카즈베기산의 절경이 펼쳐집니다.", spots:[
  {name:"게르게티 삼위일체 교회", wikiTitle:"Gergeti Trinity Church", type:"역사", desc:"해발 2,170m 산 위에 홀로 선 14세기 교회. 카즈베기산을 배경으로 한 풍경이 조지아 최고의 절경으로 꼽힙니다.", rating:4.9, openTime:"10:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Gergeti_Trinity_Church"},
  {name:"카즈베기 국립공원", wikiTitle:"Kazbegi National Park", type:"자연", desc:"만년설로 덮인 카즈베기봉(5,047m)을 품은 국립공원. 트레킹, 하이킹 천국입니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Kazbegi_National_Park"},
]},
"메스티아": { description:"메스티아는 스반 지방의 중심 마을로 유네스코 세계유산인 스반 탑들과 코카서스 최고봉 우쉬바산이 인상적입니다.", spots:[
  {name:"스반 탑", wikiTitle:"Svan towers", type:"역사", desc:"중세 스반 족이 적의 침입을 막기 위해 쌓은 돌탑. 마을 곳곳에 20여 개가 남아 있어 유네스코 세계유산에 등재됐습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Svan_towers"},
  {name:"메스티아 박물관", wikiTitle:"Svaneti Museum of History and Ethnography", type:"문화", desc:"스반 지방의 중세 아이콘화, 금·은공예품, 갑옷 등 귀중한 유물을 소장한 박물관입니다.", rating:4.4, openTime:"10:00~17:00", price:"GEL 10", website:"https://en.wikipedia.org/wiki/Svaneti_Museum_of_History_and_Ethnography"},
]},
"시그나기": { description:"시그나기는 조지아 와인의 산지 카헤티 지방의 작은 산악 마을로 포도밭 전망과 알라자니 계곡이 아름다운 '사랑의 도시'입니다.", spots:[
  {name:"시그나기 성벽", wikiTitle:"Sighnaghi", type:"역사", desc:"18세기에 지어진 28개 탑을 연결한 성벽이 마을을 둘러싸고 있으며, 카헤티 포도밭과 알라자니 계곡 전망이 환상적입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Sighnaghi"},
  {name:"보드베 수녀원", wikiTitle:"Bodbe Monastery", type:"역사", desc:"조지아를 기독교화한 성 니노의 무덤이 있는 9세기 수녀원. 조지아 정교 신자들의 성지입니다.", rating:4.7, openTime:"09:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Bodbe_Monastery"},
]},
"코토르": { description:"코토르는 아드리아해 피오르 끝에 자리한 중세 성벽 도시로 유네스코 세계유산입니다.", spots:[
  {name:"코토르 성벽", wikiTitle:"Kotor", type:"역사", desc:"1,350개 계단을 올라가면 코토르 만과 구시가지의 숨막히는 전경이 펼쳐집니다.", rating:4.7, openTime:"08:00~20:00", price:"€8", website:"https://en.wikipedia.org/wiki/Kotor"},
]},
"울란바토르": { description:"울란바토르는 몽골의 수도로 광활한 초원과 유목 문화, 칭기즈칸의 유산이 살아있습니다.", spots:[
  {name:"칭기즈칸 기마상", wikiTitle:"Equestrian statue of Genghis Khan", type:"랜드마크", desc:"40m 높이의 세계 최대 기마상으로 머리 부분 전망대에서 초원을 조망합니다.", rating:4.5, openTime:"09:00~18:00", price:"MNT 10,000", website:"https://en.wikipedia.org/wiki/Equestrian_statue_of_Genghis_Khan"},
]},
"루앙프라방": { description:"루앙프라방은 메콩강변의 유네스코 세계유산 도시로 새벽 탁발 행렬이 유명한 라오스의 옛 수도입니다.", spots:[
  {name:"새벽 탁발", wikiTitle:"Alms giving ceremony of Luang Prabang", type:"문화", desc:"매일 새벽 수백 명의 승려가 줄지어 탁발하는 경건한 의식입니다.", rating:4.6, openTime:"새벽 05:30~", price:"무료", website:"https://en.wikipedia.org/wiki/Luang_Prabang"},
  {name:"꽝시 폭포", wikiTitle:"Kuang Si Falls", type:"자연", desc:"청록빛 물이 석회암 계단을 타고 흘러내리는 3단 폭포로 수영도 가능합니다.", rating:4.8, openTime:"08:00~17:00", price:"LAK 20,000", website:"https://en.wikipedia.org/wiki/Kuang_Si_Falls"},
]},
"비엔티안": { description:"비엔티안은 메콩강변의 라오스 수도로 프랑스 식민지 건축과 불교 사원이 어우러진 한적한 도시입니다.", spots:[
  {name:"탓루앙", wikiTitle:"Pha That Luang", type:"역사", desc:"라오스의 국가 상징인 황금 불탑으로 16세기에 건설되었습니다.", rating:4.4, openTime:"08:00~17:00", price:"LAK 10,000", website:"https://en.wikipedia.org/wiki/Pha_That_Luang"},
]},
"튀니스": { description:"튀니스는 튀니지의 수도로 고대 카르타고 유적과 이슬람 메디나가 공존합니다.", spots:[
  {name:"카르타고 유적", wikiTitle:"Carthage", type:"역사", desc:"로마에 맞선 고대 페니키아 도시의 유적으로 유네스코 세계유산입니다.", rating:4.5, openTime:"08:00~17:00", price:"TND 12", website:"https://en.wikipedia.org/wiki/Carthage"},
]},
"무스카트": { description:"무스카트는 오만의 수도로 술탄 카부스 모스크와 아라비아해의 피오르가 아름다운 도시입니다.", spots:[
  {name:"술탄 카부스 대모스크", wikiTitle:"Sultan Qaboos Grand Mosque", type:"역사", desc:"오만 최대의 모스크로 세계에서 두 번째로 큰 수제 카펫이 있습니다.", rating:4.7, openTime:"08:00~11:00(비무슬림)", price:"무료", website:"https://en.wikipedia.org/wiki/Sultan_Qaboos_Grand_Mosque"},
]},
"도하": { description:"도하는 카타르의 수도로 이슬람 예술 박물관과 미래지향적 건축이 인상적인 걸프의 신흥 도시입니다.", spots:[
  {name:"이슬람 예술 박물관", wikiTitle:"Museum of Islamic Art, Doha", type:"문화", desc:"I.M. 페이가 설계한 건축 걸작으로 14세기에 걸친 이슬람 예술을 소장합니다.", rating:4.7, openTime:"09:00~19:00", price:"무료", website:"https://en.wikipedia.org/wiki/Museum_of_Islamic_Art,_Doha"},
  {name:"수크 와키프", wikiTitle:"Souq Waqif", type:"문화", desc:"전통 시장을 현대적으로 복원한 곳으로 향신료, 매, 레스토랑이 가득합니다.", rating:4.5, openTime:"07:00~23:00", price:"무료", website:"https://en.wikipedia.org/wiki/Souq_Waqif"},
]},
"라파스": { description:"라파스는 해발 3,640m의 세계에서 가장 높은 수도로 케이블카가 대중교통인 독특한 도시입니다.", spots:[
  {name:"텔레페리코 케이블카", wikiTitle:"Mi Teleférico", type:"도시", desc:"10개 노선의 도시형 케이블카에서 안데스와 라파스 전경을 공중에서 감상합니다.", rating:4.5, openTime:"06:00~22:00", price:"BOB 3", website:"https://en.wikipedia.org/wiki/Mi_Teleférico"},
]},
"우유니": { description:"우유니 소금사막은 세계 최대의 소금 평원으로 우기에는 하늘을 비추는 거울이 됩니다.", spots:[
  {name:"우유니 소금사막", wikiTitle:"Salar de Uyuni", type:"자연", desc:"10,582km²의 소금 평원이 비가 내리면 세계 최대의 자연 거울이 됩니다.", rating:4.9, openTime:"투어 전용", price:"$30~50/일", website:"https://en.wikipedia.org/wiki/Salar_de_Uyuni"},
]},
"푼타카나": { description:"푼타카나는 카리브해의 올인클루시브 리조트가 즐비한 도미니카 공화국 최고의 휴양지입니다.", spots:[
  {name:"바바로 비치", wikiTitle:"Punta Cana", type:"자연", desc:"야자수와 백사장이 32km 이어지는 카리브해 최고의 해변입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Punta_Cana"},
]},
"안티구아": { description:"안티구아 과테말라는 3개의 화산에 둘러싸인 스페인 식민지 시대의 유네스코 세계유산 도시입니다.", spots:[
  {name:"안티구아 구시가지", wikiTitle:"Antigua Guatemala", type:"역사", desc:"화산과 식민지 유적이 어우러진 유네스코 세계유산 도시로 스페인어 학교가 유명합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Antigua_Guatemala"},
]},
"킹스턴": { description:"킹스턴은 자메이카의 수도로 레게 음악과 밥 말리의 고향입니다.", spots:[
  {name:"밥 말리 박물관", wikiTitle:"Bob Marley Museum", type:"문화", desc:"레게의 전설 밥 말리가 살았던 집을 박물관으로 전환한 곳입니다.", rating:4.4, openTime:"09:30~17:00", price:"$25", website:"https://en.wikipedia.org/wiki/Bob_Marley_Museum"},
]},
"몬테고베이": { description:"몬테고베이는 자메이카 최고의 해변 리조트 도시로 닥터스 케이브 비치가 유명합니다.", spots:[
  {name:"닥터스 케이브 비치", wikiTitle:"Doctor's Cave Beach", type:"자연", desc:"투명한 카리브해 바다와 백사장이 아름다운 자메이카 대표 해변입니다.", rating:4.5, openTime:"08:30~17:00", price:"$6", website:"https://en.wikipedia.org/wiki/Doctor's_Cave_Beach"},
]},
"리가": { description:"리가는 발트 3국 최대 도시로 아르누보 건축과 중세 구시가지가 유네스코 세계유산인 라트비아의 수도입니다.", spots:[
  {name:"리가 구시가지", wikiTitle:"Riga", type:"역사", desc:"한자동맹 시대의 건축과 800개 이상의 아르누보 건물이 공존하는 유네스코 세계유산입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Riga"},
]},
"빌뉴스": { description:"빌뉴스는 바로크 건축의 보고인 리투아니아의 수도로 유네스코 세계유산 구시가지가 매력적입니다.", spots:[
  {name:"빌뉴스 구시가지", wikiTitle:"Vilnius Old Town", type:"역사", desc:"유럽 최대의 바로크 구시가지 중 하나로 유네스코 세계유산입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Vilnius_Old_Town"},
]},
"탈린": { description:"탈린은 중세 성벽과 탑이 완벽히 보존된 에스토니아의 수도로 디지털 혁신 국가의 얼굴이기도 합니다.", spots:[
  {name:"탈린 구시가지", wikiTitle:"Tallinn Old Town", type:"역사", desc:"13세기 중세 성벽과 탑이 완벽히 보존된 유네스코 세계유산 도시입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Tallinn_Old_Town"},
]},
"파포스": { description:"파포스는 아프로디테 탄생 전설의 섬 키프로스의 고대 도시로 유네스코 세계유산 모자이크가 유명합니다.", spots:[
  {name:"파포스 고고학 공원", wikiTitle:"Paphos Archaeological Park", type:"역사", desc:"로마 시대 모자이크 바닥이 보존된 유네스코 세계유산 유적지입니다.", rating:4.6, openTime:"08:30~17:00", price:"€4.5", website:"https://en.wikipedia.org/wiki/Paphos_Archaeological_Park"},
]},
"티라나": { description:"티라나는 알바니아의 수도로 오스만과 이탈리아 건축, 활기찬 카페 문화가 매력적인 발칸의 숨은 보석입니다.", spots:[
  {name:"스칸데르베그 광장", wikiTitle:"Skanderbeg Square", type:"도시", desc:"알바니아 국민 영웅의 이름을 딴 중심 광장으로 도시의 심장입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Skanderbeg_Square"},
]},
"베오그라드": { description:"베오그라드는 다뉴브와 사바강이 만나는 세르비아의 수도로 요새와 나이트라이프가 유명합니다.", spots:[
  {name:"칼레메그단 요새", wikiTitle:"Belgrade Fortress", type:"역사", desc:"2,000년 역사의 요새에서 두 강의 합류점과 도시 전경을 조망합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Belgrade_Fortress"},
]},
"빈트후크": { description:"빈트후크는 나미비아의 수도로 독일 식민지 건축과 아프리카 문화가 독특하게 공존합니다.", spots:[
  {name:"크리스투스 교회", wikiTitle:"Christ Church, Windhoek", type:"역사", desc:"독일 식민지 시대의 루터교 교회로 빈트후크의 상징적 랜드마크입니다.", rating:4.2, openTime:"외관 24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Christ_Church,_Windhoek"},
]},
"소수스블레이": { description:"소수스블레이는 세계에서 가장 높은 붉은 모래사구가 있는 나미브 사막의 하이라이트입니다.", spots:[
  {name:"듄 45", wikiTitle:"Dune 45", type:"자연", desc:"높이 170m의 별 모양 붉은 사구로 일출 시 빛과 그림자의 대비가 경이롭습니다.", rating:4.8, openTime:"일출~일몰", price:"NAD 80", website:"https://en.wikipedia.org/wiki/Dune_45"},
  {name:"데드블레이", wikiTitle:"Deadvlei", type:"자연", desc:"900년 된 검은 고목이 하얀 소금 평원에 서 있는 초현실적 풍경입니다.", rating:4.9, openTime:"일출~일몰", price:"소수스블레이 포함", website:"https://en.wikipedia.org/wiki/Deadvlei"},
]},
"빅토리아폴스": { description:"빅토리아 폭포는 잠비아와 짐바브웨 국경에 걸친 세계 3대 폭포 중 하나로 원주민이 '천둥치는 연기'라 부릅니다.", spots:[
  {name:"빅토리아 폭포", wikiTitle:"Victoria Falls", type:"자연", desc:"폭 1.7km, 높이 108m에서 분당 5억 리터의 물이 쏟아지는 세계유산 폭포입니다.", rating:4.9, openTime:"06:00~18:00", price:"$30", website:"https://en.wikipedia.org/wiki/Victoria_Falls"},
]},
"나디": { description:"나디는 피지의 관문 도시로 333개 섬으로 이루어진 남태평양 낙원으로 가는 출발점입니다.", spots:[
  {name:"마나 아일랜드", wikiTitle:"Mamanuca Islands", type:"자연", desc:"영화 '캐스트 어웨이' 촬영지로 산호초 스노클링과 리조트 휴양이 유명합니다.", rating:4.7, openTime:"연중", price:"리조트별", website:"https://en.wikipedia.org/wiki/Mamanuca_Islands"},
]},
"안타나나리보": { description:"안타나나리보는 마다가스카르의 수도로 여우원숭이와 바오밥 나무 등 독특한 생태계의 관문입니다.", spots:[
  {name:"바오밥 나무길", wikiTitle:"Avenue of the Baobabs", type:"자연", desc:"800년 된 거대한 바오밥 나무가 도로 양쪽에 줄지어 선 마다가스카르의 상징적 풍경입니다.", rating:4.7, openTime:"24시간", price:"MGA 10,000", website:"https://en.wikipedia.org/wiki/Avenue_of_the_Baobabs"},
]},
"포트루이스": { description:"포트루이스는 모리셔스의 수도로 인도양의 에메랄드빛 바다와 7색 대지가 유명합니다.", spots:[
  {name:"샤마렐 7색 대지", wikiTitle:"Chamarel", type:"자연", desc:"화산 활동으로 7가지 색의 흙이 층을 이루는 독특한 지질 현상입니다.", rating:4.5, openTime:"08:30~17:00", price:"MUR 350", website:"https://en.wikipedia.org/wiki/Chamarel"},
]},
"베이루트": { description:"베이루트는 '중동의 파리'로 불리는 레바논의 수도로 페니키아 유적과 활기찬 나이트라이프가 공존합니다.", spots:[
  {name:"비블로스", wikiTitle:"Byblos", type:"역사", desc:"7,000년 역사의 세계에서 가장 오래된 도시 중 하나로 유네스코 세계유산입니다.", rating:4.6, openTime:"09:00~18:00", price:"LBP 150,000", website:"https://en.wikipedia.org/wiki/Byblos"},
]},
"키이우": { description:"키이우는 우크라이나의 수도로 황금빛 돔의 교회와 1,000년 역사의 동유럽 문화가 깃든 도시입니다.", spots:[
  {name:"성 소피아 대성당", wikiTitle:"Saint Sophia Cathedral, Kyiv", type:"역사", desc:"11세기 비잔틴 모자이크가 보존된 유네스코 세계유산 성당입니다.", rating:4.6, openTime:"10:00~18:00", price:"UAH 100", website:"https://en.wikipedia.org/wiki/Saint_Sophia_Cathedral,_Kyiv"},
]},
"르비우": { description:"르비우는 우크라이나 서부의 문화 수도로 합스부르크 건축과 커피 문화가 매력적입니다.", spots:[
  {name:"르비우 구시가지", wikiTitle:"Lviv", type:"역사", desc:"르네상스·바로크·고딕 건축이 혼합된 유네스코 세계유산 도시입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Lviv"},
]},
"라호르": { description:"라호르는 무굴 제국의 문화 수도였던 파키스탄 제2의 도시로 화려한 이슬람 건축이 가득합니다.", spots:[
  {name:"바드샤히 모스크", wikiTitle:"Badshahi Mosque", type:"역사", desc:"1673년 무굴 황제 아우랑제브가 건설한 세계 최대급 모스크입니다.", rating:4.6, openTime:"08:00~20:00", price:"무료", website:"https://en.wikipedia.org/wiki/Badshahi_Mosque"},
  {name:"라호르 요새", wikiTitle:"Lahore Fort", type:"역사", desc:"무굴 제국의 궁전 겸 요새로 거울의 궁전(시시 마할)이 유명합니다.", rating:4.5, openTime:"08:30~17:00", price:"PKR 500", website:"https://en.wikipedia.org/wiki/Lahore_Fort"},
]},
"이슬라마바드": { description:"이슬라마바드는 1960년대 계획도시로 건설된 파키스탄의 수도로 파이살 모스크가 랜드마크입니다.", spots:[
  {name:"파이살 모스크", wikiTitle:"Faisal Mosque", type:"역사", desc:"텐트 모양의 독특한 디자인으로 10만 명을 수용하는 세계 최대급 모스크입니다.", rating:4.5, openTime:"04:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Faisal_Mosque"},
]},
"룩셈부르크시티": { description:"룩셈부르크시티는 절벽 위에 자리한 요새 도시로 유네스코 세계유산인 구시가지가 아름답습니다.", spots:[
  {name:"복 카제마트", wikiTitle:"Bock casemates", type:"역사", desc:"963년부터 이어진 17km 지하 터널 요새로 유네스코 세계유산입니다.", rating:4.4, openTime:"10:00~17:00", price:"€7", website:"https://en.wikipedia.org/wiki/Bock_casemates"},
]},
"브라티슬라바": { description:"브라티슬라바는 다뉴브 강변의 슬로바키아 수도로 중세 성과 오스트리아-헝가리 건축이 매력적입니다.", spots:[
  {name:"브라티슬라바 성", wikiTitle:"Bratislava Castle", type:"역사", desc:"다뉴브 강 위 언덕의 흰 성에서 슬로바키아, 오스트리아, 헝가리 3국을 동시에 조망합니다.", rating:4.4, openTime:"10:00~18:00", price:"€10", website:"https://en.wikipedia.org/wiki/Bratislava_Castle"},
]},
"소피아": { description:"소피아는 불가리아의 수도로 로마 유적, 비잔틴 교회, 오스만 모스크가 한 도시에 공존합니다.", spots:[
  {name:"알렉산드르 네프스키 대성당", wikiTitle:"Alexander Nevsky Cathedral, Sofia", type:"역사", desc:"황금 돔이 인상적인 발칸 최대의 정교회 성당입니다.", rating:4.6, openTime:"07:00~19:00", price:"무료", website:"https://en.wikipedia.org/wiki/Alexander_Nevsky_Cathedral,_Sofia"},
]},
"키갈리": { description:"키갈리는 아프리카에서 가장 깨끗한 도시로 알려진 르완다의 수도이자 마운틴 고릴라 트레킹의 관문입니다.", spots:[
  {name:"볼카노스 국립공원(고릴라 트레킹)", wikiTitle:"Volcanoes National Park", type:"자연", desc:"세계에서 멸종위기 마운틴 고릴라를 야생에서 만날 수 있는 몇 안 되는 곳입니다.", rating:4.9, openTime:"06:00~18:00", price:"$1,500", website:"https://en.wikipedia.org/wiki/Volcanoes_National_Park"},
]},
"다카르": { description:"다카르는 세네갈의 수도로 고레섬의 노예 무역 역사와 활기찬 서아프리카 문화가 공존합니다.", spots:[
  {name:"고레섬", wikiTitle:"Gorée", type:"역사", desc:"대서양 노예 무역의 중심지였던 섬으로 유네스코 세계유산입니다.", rating:4.5, openTime:"페리 06:30~22:30", price:"CFA 5,200(페리)", website:"https://en.wikipedia.org/wiki/Gorée"},
]},
"알마티": { description:"알마티는 천산산맥 아래 카자흐스탄 최대 도시로 소비에트 건축과 자연이 어우러진 중앙아시아의 관문입니다.", spots:[
  {name:"빅 알마티 호수", wikiTitle:"Big Almaty Lake", type:"자연", desc:"해발 2,511m의 청록빛 빙하 호수로 천산산맥의 장엄한 파노라마가 펼쳐집니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Big_Almaty_Lake"},
]},

// ── 나머지 국가 수도 ──
"카불": { description:"카불은 아프가니스탄의 수도로 힌두쿠시 산맥에 둘러싸인 3,500년 역사의 실크로드 도시입니다.", spots:[
  {name:"바부르 정원", wikiTitle:"Gardens of Babur", type:"역사", desc:"무굴 제국 창시자 바부르의 묘지가 있는 역사적 정원입니다.", rating:4.3, openTime:"08:00~17:00", price:"$1", website:"https://en.wikipedia.org/wiki/Gardens_of_Babur"},
]},
"알제": { description:"알제는 알제리의 수도로 지중해를 내려다보는 카스바(구시가지)가 유네스코 세계유산입니다.", spots:[
  {name:"카스바", wikiTitle:"Casbah of Algiers", type:"역사", desc:"오스만 시대의 미로 같은 골목이 보존된 유네스코 세계유산입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Casbah_of_Algiers"},
]},
"루안다": { description:"루안다는 앙골라의 수도로 대서양 해안의 활기찬 항구 도시입니다.", spots:[
  {name:"포르탈레자 드 상미겔", wikiTitle:"Fortress of São Miguel", type:"역사", desc:"16세기 포르투갈이 건설한 해안 요새로 도시의 역사를 전합니다.", rating:4.2, openTime:"09:00~17:00", price:"AOA 500", website:"https://en.wikipedia.org/wiki/Fortress_of_São_Miguel"},
]},
"예레반": { description:"예레반은 아르메니아의 수도로 아라라트 산을 배경으로 한 분홍빛 도시입니다.", spots:[
  {name:"캐스케이드 계단", wikiTitle:"Yerevan Cascade", type:"랜드마크", desc:"거대한 석회암 계단 위 현대미술 전시와 아라라트산 전망이 인상적입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Yerevan_Cascade"},
]},
"바쿠": { description:"바쿠는 아제르바이잔의 수도로 '바람의 도시'라 불리며 현대 건축과 고대 성벽이 공존합니다.", spots:[
  {name:"이체리셰헤르(내성)", wikiTitle:"Icherisheher", type:"역사", desc:"12세기 성벽에 둘러싸인 구시가지로 유네스코 세계유산입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Icherisheher"},
  {name:"플레임 타워", wikiTitle:"Flame Towers", type:"랜드마크", desc:"불꽃 모양의 3개 초고층 빌딩으로 밤에 LED 쇼가 펼쳐집니다.", rating:4.4, openTime:"외관 24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Flame_Towers"},
]},
"마나마": { description:"마나마는 바레인의 수도로 페르시아만의 금융 중심지이자 고대 딜문 문명의 유적이 있습니다.", spots:[
  {name:"바레인 요새", wikiTitle:"Bahrain Fort", type:"역사", desc:"4,000년 역사의 딜문 문명 유적으로 유네스코 세계유산입니다.", rating:4.4, openTime:"08:00~20:00", price:"무료", website:"https://en.wikipedia.org/wiki/Bahrain_Fort"},
]},
"다카": { description:"다카는 방글라데시의 수도로 인구 2,200만의 세계에서 가장 밀집된 도시 중 하나입니다.", spots:[
  {name:"라르바그 요새", wikiTitle:"Lalbagh Fort", type:"역사", desc:"17세기 무굴 제국 시대의 미완성 요새로 아름다운 정원이 있습니다.", rating:4.2, openTime:"10:00~17:00", price:"BDT 20", website:"https://en.wikipedia.org/wiki/Lalbagh_Fort"},
]},
"민스크": { description:"민스크는 벨라루스의 수도로 소비에트 건축과 넓은 대로가 특징적인 도시입니다.", spots:[
  {name:"독립광장", wikiTitle:"Independence Square, Minsk", type:"도시", desc:"유럽 최대급 광장 중 하나로 소비에트 시대 건축의 웅장함이 느껴집니다.", rating:4.1, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Independence_Square,_Minsk"},
]},
"벨리즈시티": { description:"벨리즈시티는 벨리즈 최대 도시로 세계 2위 산호초 그레이트 블루홀의 관문입니다.", spots:[
  {name:"그레이트 블루홀", wikiTitle:"Great Blue Hole", type:"자연", desc:"직경 300m, 깊이 124m의 거대한 해중 싱크홀로 다이빙 성지입니다.", rating:4.8, openTime:"투어 전용", price:"$250~", website:"https://en.wikipedia.org/wiki/Great_Blue_Hole"},
]},
"코토누": { description:"코토누는 베냉의 경제 수도로 서아프리카의 활기찬 시장과 부두교 문화가 살아있습니다.", spots:[
  {name:"간비에 수상마을", wikiTitle:"Ganvie", type:"문화", desc:"아프리카의 베니스로 불리는 호수 위 수상 가옥 마을입니다.", rating:4.3, openTime:"보트투어", price:"CFA 5,000", website:"https://en.wikipedia.org/wiki/Ganvie"},
]},
"팀부": { description:"팀부는 부탄의 수도로 신호등이 없는 세계 유일의 수도이며 히말라야 불교 문화의 중심입니다.", spots:[
  {name:"타시초 종", wikiTitle:"Tashichho Dzong", type:"역사", desc:"부탄 정부 청사이자 승원으로 부탄 전통 건축의 정수입니다.", rating:4.6, openTime:"17:00~18:00(관광)", price:"무료", website:"https://en.wikipedia.org/wiki/Tashichho_Dzong"},
]},
"사라예보": { description:"사라예보는 보스니아의 수도로 동서양 문화가 만나는 곳에 모스크, 교회, 성당이 한 거리에 공존합니다.", spots:[
  {name:"바슈차르시야", wikiTitle:"Baščaršija", type:"역사", desc:"15세기 오스만 시대의 구시가지 바자르로 동양과 서양이 만나는 거리입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Baščaršija"},
]},
"가보로네": { description:"가보로네는 보츠와나의 수도로 오카방고 델타와 초베 국립공원 사파리의 관문입니다.", spots:[
  {name:"오카방고 델타", wikiTitle:"Okavango Delta", type:"자연", desc:"사막 한가운데 펼쳐진 세계 최대의 내륙 삼각주로 유네스코 세계유산입니다.", rating:4.9, openTime:"연중", price:"투어별", website:"https://en.wikipedia.org/wiki/Okavango_Delta"},
]},
"반다르스리브가완": { description:"반다르스리브가완은 브루나이의 수도로 황금빛 모스크와 수상마을이 인상적입니다.", spots:[
  {name:"오마르 알리 사이푸딘 모스크", wikiTitle:"Omar Ali Saifuddien Mosque", type:"역사", desc:"인공 호수 위에 떠있는 듯한 황금 돔의 모스크로 아시아에서 가장 아름다운 모스크 중 하나입니다.", rating:4.6, openTime:"08:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Omar_Ali_Saifuddien_Mosque"},
]},
"와가두구": { description:"와가두구는 부르키나파소의 수도로 서아프리카 영화제(FESPACO)의 본고장입니다.", spots:[
  {name:"FESPACO 영화제", wikiTitle:"FESPACO", type:"문화", desc:"아프리카 최대 영화제로 2년마다 개최됩니다.", rating:4.0, openTime:"격년 2~3월", price:"행사별", website:"https://en.wikipedia.org/wiki/FESPACO"},
]},
"기테가": { description:"기테가는 부룬디의 수도로 아프리카 대호수 지역의 문화 중심지입니다.", spots:[
  {name:"기테가 국립박물관", wikiTitle:"Gitega", type:"문화", desc:"부룬디의 역사와 전통 문화를 전시하는 국립박물관입니다.", rating:3.8, openTime:"08:00~17:00", price:"BIF 5,000", website:"https://en.wikipedia.org/wiki/Gitega"},
]},
"프라이아": { description:"프라이아는 카보베르데의 수도로 대서양 위 화산섬의 아프리카-포르투갈 혼합 문화가 매력적입니다.", spots:[
  {name:"시다드 벨랴", wikiTitle:"Cidade Velha", type:"역사", desc:"포르투갈 최초의 열대 식민지 정착지로 유네스코 세계유산입니다.", rating:4.3, openTime:"24시간", price:"CVE 500", website:"https://en.wikipedia.org/wiki/Cidade_Velha"},
]},
"야운데": { description:"야운데는 카메룬의 수도로 7개의 언덕 위에 자리한 열대 도시입니다.", spots:[
  {name:"야운데 통일기념탑", wikiTitle:"Reunification Monument", type:"랜드마크", desc:"카메룬 영어권과 프랑스어권의 통일을 상징하는 기념물입니다.", rating:3.9, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Reunification_Monument"},
]},
"방기": { description:"방기는 중앙아프리카공화국의 수도로 우방기 강변에 자리한 도시입니다.", spots:[
  {name:"보갈리 폭포", wikiTitle:"Boali Falls", type:"자연", desc:"높이 50m의 폭포로 방기 근교의 대표 자연 명소입니다.", rating:4.0, openTime:"24시간", price:"CFA 2,000", website:"https://en.wikipedia.org/wiki/Boali_Falls"},
]},
"은자메나": { description:"은자메나는 차드의 수도로 사하라 사막과 사헬 지대가 만나는 곳에 위치합니다.", spots:[
  {name:"은자메나 대모스크", wikiTitle:"N'Djamena Grand Mosque", type:"역사", desc:"차드 최대의 모스크로 도시의 대표적 랜드마크입니다.", rating:3.8, openTime:"기도시간 외", price:"무료", website:"https://en.wikipedia.org/wiki/N%27Djamena"},
]},
"모로니": { description:"모로니는 코모로의 수도로 인도양의 화산섬에 자리한 아랍-아프리카 혼합 문화 도시입니다.", spots:[
  {name:"카르탈라 화산", wikiTitle:"Mount Karthala", type:"자연", desc:"세계에서 가장 큰 활화산 분화구 중 하나가 있는 화산입니다.", rating:4.2, openTime:"가이드 투어", price:"$50~", website:"https://en.wikipedia.org/wiki/Mount_Karthala"},
]},
"킨샤사": { description:"킨샤사는 콩고민주공화국의 수도로 아프리카에서 3번째로 큰 메트로폴리스입니다.", spots:[
  {name:"킨샤사 국립박물관", wikiTitle:"Kinshasa", type:"문화", desc:"콩고의 전통 예술과 역사를 전시하는 국립박물관입니다.", rating:3.9, openTime:"09:00~17:00", price:"CDF 5,000", website:"https://en.wikipedia.org/wiki/Kinshasa"},
]},
"지부티시": { description:"지부티는 홍해와 아덴만이 만나는 전략적 요충지의 소국 수도입니다.", spots:[
  {name:"아살 호수", wikiTitle:"Lake Assal (Djibouti)", type:"자연", desc:"해발 -155m의 아프리카에서 가장 낮은 곳이자 세계에서 가장 짠 호수입니다.", rating:4.3, openTime:"24시간", price:"$10", website:"https://en.wikipedia.org/wiki/Lake_Assal_(Djibouti)"},
]},
"산살바도르": { description:"산살바도르는 엘살바도르의 수도로 화산에 둘러싸인 중미의 활기찬 도시입니다.", spots:[
  {name:"호야 데 세렌", wikiTitle:"Joya de Cerén", type:"역사", desc:"화산재에 묻힌 마야 농촌 마을로 '중미의 폼페이'라 불리는 유네스코 세계유산입니다.", rating:4.3, openTime:"09:00~16:00", price:"$3", website:"https://en.wikipedia.org/wiki/Joya_de_Cerén"},
]},
"말라보": { description:"말라보는 적도 기니의 수도로 비오코 섬의 열대 도시입니다.", spots:[
  {name:"말라보 대성당", wikiTitle:"Malabo", type:"역사", desc:"스페인 식민지 시대의 네오고딕 성당으로 도시의 랜드마크입니다.", rating:3.8, openTime:"미사시간", price:"무료", website:"https://en.wikipedia.org/wiki/Malabo"},
]},
"아스마라": { description:"아스마라는 에리트레아의 수도로 아르데코·미래주의 이탈리아 건축이 보존된 유네스코 세계유산 도시입니다.", spots:[
  {name:"아스마라 아르데코 건축", wikiTitle:"Asmara", type:"역사", desc:"1930년대 이탈리아 건축이 완벽히 보존된 '아프리카의 작은 로마'입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Asmara"},
]},
"음바바네": { description:"음바바네는 에스와티니(스와질란드)의 수도로 아프리카 마지막 절대군주제 국가입니다.", spots:[
  {name:"음란카 자연보호구역", wikiTitle:"Mlilwane Wildlife Sanctuary", type:"자연", desc:"자전거와 도보로 야생동물을 만나는 에스와티니 최초의 보호구역입니다.", rating:4.3, openTime:"06:00~18:00", price:"SZL 50", website:"https://en.wikipedia.org/wiki/Mlilwane_Wildlife_Sanctuary"},
]},
"리브르빌": { description:"리브르빌은 가봉의 수도로 열대우림과 대서양이 만나는 적도의 도시입니다.", spots:[
  {name:"로페 국립공원", wikiTitle:"Lopé National Park", type:"자연", desc:"고릴라와 맨드릴이 서식하는 열대우림 유네스코 세계유산입니다.", rating:4.5, openTime:"가이드 투어", price:"CFA 10,000", website:"https://en.wikipedia.org/wiki/Lopé_National_Park"},
]},
"반줄": { description:"반줄은 감비아의 수도로 감비아 강 하구의 작은 나라의 중심지입니다.", spots:[
  {name:"쿤타 킨테 섬", wikiTitle:"James Island (The Gambia)", type:"역사", desc:"대서양 노예무역 시대의 유적이 남아있는 유네스코 세계유산 섬입니다.", rating:4.2, openTime:"보트투어", price:"GMD 200", website:"https://en.wikipedia.org/wiki/James_Island_(The_Gambia)"},
]},
"코나크리": { description:"코나크리는 기니의 수도로 대서양 연안의 서아프리카 문화 중심지입니다.", spots:[
  {name:"일 드 로스", wikiTitle:"Îles de Los", type:"자연", desc:"코나크리 앞바다의 작은 섬들로 해변 휴양이 가능합니다.", rating:4.0, openTime:"페리 운행", price:"GNF 50,000", website:"https://en.wikipedia.org/wiki/Îles_de_Los"},
]},
"비사우": { description:"비사우는 기니비사우의 수도로 포르투갈 식민지 유적이 남아있는 서아프리카의 작은 도시입니다.", spots:[
  {name:"비자고스 군도", wikiTitle:"Bijagós Archipelago", type:"자연", desc:"88개 섬으로 이루어진 군도로 유네스코 생물권보전지역입니다.", rating:4.3, openTime:"보트투어", price:"투어별", website:"https://en.wikipedia.org/wiki/Bijagós_Archipelago"},
]},
"조지타운": { description:"조지타운은 가이아나의 수도로 남미 유일의 영어권 국가 수도입니다.", spots:[
  {name:"카이에투르 폭포", wikiTitle:"Kaieteur Falls", type:"자연", desc:"세계에서 가장 높은 단일 낙하 폭포(226m)로 아마존 열대우림에 숨겨져 있습니다.", rating:4.8, openTime:"경비행기 투어", price:"$200~", website:"https://en.wikipedia.org/wiki/Kaieteur_Falls"},
]},
"포르토프랭스": { description:"포르토프랭스는 아이티의 수도로 카리브해 최초의 흑인 독립국의 수도입니다.", spots:[
  {name:"시타델 라페리에르", wikiTitle:"Citadelle Laferrière", type:"역사", desc:"카리브해 최대의 요새로 유네스코 세계유산입니다.", rating:4.4, openTime:"08:00~17:00", price:"$5", website:"https://en.wikipedia.org/wiki/Citadelle_Laferrière"},
]},
"테구시갈파": { description:"테구시갈파는 온두라스의 수도로 코판 마야 유적의 관문 도시입니다.", spots:[
  {name:"코판 유적", wikiTitle:"Copán", type:"역사", desc:"마야 문명의 예술 중심지로 정교한 석조 조각이 유명한 유네스코 세계유산입니다.", rating:4.6, openTime:"08:00~16:00", price:"$15", website:"https://en.wikipedia.org/wiki/Copán"},
]},
"바그다드": { description:"바그다드는 이라크의 수도로 8세기 압바스 왕조의 수도이자 이슬람 황금기의 중심지였습니다.", spots:[
  {name:"알무스탄시리야 마드라사", wikiTitle:"Al-Mustansiriya University", type:"역사", desc:"1227년에 설립된 세계 최초의 대학 중 하나입니다.", rating:4.3, openTime:"09:00~14:00", price:"무료", website:"https://en.wikipedia.org/wiki/Al-Mustansiriya_University"},
]},
"아비장": { description:"아비장은 코트디부아르의 경제 수도로 서아프리카 최대의 프랑스어권 도시입니다.", spots:[
  {name:"평화의 성모 대성당", wikiTitle:"Basilica of Our Lady of Peace", type:"역사", desc:"기네스북에 등재된 세계 최대의 성당으로 바티칸 성 베드로 대성당보다 큽니다.", rating:4.5, openTime:"08:00~17:00", price:"CFA 2,000", website:"https://en.wikipedia.org/wiki/Basilica_of_Our_Lady_of_Peace"},
]},
"프리슈티나": { description:"프리슈티나는 코소보의 수도로 오스만 유적과 현대 유럽이 공존하는 발칸의 젊은 도시입니다.", spots:[
  {name:"뉴본 기념물", wikiTitle:"Newborn monument", type:"랜드마크", desc:"2008년 독립을 기념하는 대형 NEWBORN 글자 조형물입니다.", rating:4.1, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Newborn_monument"},
]},
"쿠웨이트시티": { description:"쿠웨이트시티는 쿠웨이트의 수도로 페르시아만의 부유한 석유 국가 수도입니다.", spots:[
  {name:"쿠웨이트 타워", wikiTitle:"Kuwait Towers", type:"랜드마크", desc:"세 개의 물방울 모양 타워로 쿠웨이트의 상징적 랜드마크입니다.", rating:4.4, openTime:"08:00~23:00", price:"KWD 3", website:"https://en.wikipedia.org/wiki/Kuwait_Towers"},
]},
"비슈케크": { description:"비슈케크는 키르기스스탄의 수도로 천산산맥 아래 자리한 중앙아시아의 녹색 도시입니다.", spots:[
  {name:"알라아르차 국립공원", wikiTitle:"Ala Archa National Park", type:"자연", desc:"비슈케크 근교의 천산산맥 국립공원으로 빙하와 알파인 트레킹이 유명합니다.", rating:4.5, openTime:"24시간", price:"KGS 80", website:"https://en.wikipedia.org/wiki/Ala_Archa_National_Park"},
]},
"마세루": { description:"마세루는 레소토의 수도로 '하늘의 왕국'이라 불리는 산악 국가의 관문입니다.", spots:[
  {name:"타바보시우 산", wikiTitle:"Thaba Bosiu", type:"역사", desc:"레소토 건국의 성산으로 모슈슈 1세 왕의 요새가 있습니다.", rating:4.1, openTime:"08:00~17:00", price:"LSL 20", website:"https://en.wikipedia.org/wiki/Thaba_Bosiu"},
]},
"몬로비아": { description:"몬로비아는 라이베리아의 수도로 미국 해방 노예들이 건설한 서아프리카 해안 도시입니다.", spots:[
  {name:"프로비던스 아일랜드", wikiTitle:"Providence Island (Monrovia)", type:"역사", desc:"라이베리아 건국의 출발점으로 해방 노예들이 처음 상륙한 섬입니다.", rating:4.0, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Providence_Island_(Monrovia)"},
]},
"트리폴리": { description:"트리폴리는 리비아의 수도로 로마 유적 렙티스 마그나의 관문 도시입니다.", spots:[
  {name:"렙티스 마그나", wikiTitle:"Leptis Magna", type:"역사", desc:"아프리카에서 가장 잘 보존된 로마 유적으로 유네스코 세계유산입니다.", rating:4.7, openTime:"08:00~17:00", price:"LYD 5", website:"https://en.wikipedia.org/wiki/Leptis_Magna"},
]},
"릴롱궤": { description:"릴롱궤는 말라위의 수도로 아프리카의 호수 나라 말라위의 중심지입니다.", spots:[
  {name:"말라위 호수", wikiTitle:"Lake Malawi", type:"자연", desc:"아프리카에서 3번째로 큰 호수로 1,000종 이상의 시클리드 물고기가 서식합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Lake_Malawi"},
]},
"바마코": { description:"바마코는 말리의 수도로 니제르 강변에 자리한 서아프리카 문화의 중심지입니다.", spots:[
  {name:"팀북투", wikiTitle:"Timbuktu", type:"역사", desc:"사하라 사막의 전설적 학문 도시로 유네스코 세계유산입니다.", rating:4.5, openTime:"가이드 투어", price:"CFA 5,000", website:"https://en.wikipedia.org/wiki/Timbuktu"},
]},
"누악쇼트": { description:"누악쇼트는 모리타니아의 수도로 사하라 사막과 대서양이 만나는 곳에 자리합니다.", spots:[
  {name:"방 다르건 국립공원", wikiTitle:"Banc d'Arguin National Park", type:"자연", desc:"사막과 바다가 만나는 곳에 수백만 마리의 철새가 모이는 유네스코 세계유산입니다.", rating:4.5, openTime:"가이드 투어", price:"MRU 200", website:"https://en.wikipedia.org/wiki/Banc_d%27Arguin_National_Park"},
]},
"키시나우": { description:"키시나우는 몰도바의 수도로 와인 생산과 소비에트 건축이 특징인 동유럽의 숨겨진 도시입니다.", spots:[
  {name:"밀레슈티 미치 와이너리", wikiTitle:"Mileștii Mici", type:"문화", desc:"세계 최대의 와인 컬렉션(200만 병)을 보유한 지하 와이너리입니다.", rating:4.5, openTime:"투어 예약", price:"MDL 250", website:"https://en.wikipedia.org/wiki/Mileștii_Mici"},
]},
"마푸토": { description:"마푸토는 모잠비크의 수도로 포르투갈 식민지 건축과 인도양 해변이 어우러진 도시입니다.", spots:[
  {name:"마푸토 중앙역", wikiTitle:"Maputo railway station", type:"역사", desc:"에펠의 제자가 설계한 아르누보 건축의 기차역으로 아프리카에서 가장 아름다운 역입니다.", rating:4.4, openTime:"06:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Maputo_railway_station"},
]},
"마나과": { description:"마나과는 니카라과의 수도로 화산 호수와 혁명 역사가 공존하는 중미의 도시입니다.", spots:[
  {name:"마사야 화산", wikiTitle:"Masaya Volcano", type:"자연", desc:"활화산 분화구에서 붉은 용암을 직접 내려다볼 수 있는 국립공원입니다.", rating:4.5, openTime:"09:00~16:45", price:"$10", website:"https://en.wikipedia.org/wiki/Masaya_Volcano"},
]},
"니아메": { description:"니아메는 니제르의 수도로 니제르 강변의 사헬 지대 도시입니다.", spots:[
  {name:"니제르 국립박물관", wikiTitle:"Niamey", type:"문화", desc:"니제르의 전통 문화와 공룡 화석을 전시하는 박물관입니다.", rating:3.9, openTime:"08:00~17:00", price:"CFA 1,000", website:"https://en.wikipedia.org/wiki/Niamey"},
]},
"라고스": { description:"라고스는 나이지리아 최대 도시로 아프리카 최대의 경제 허브이자 음악·패션의 중심지입니다.", spots:[
  {name:"나이키 아트 갤러리", wikiTitle:"Nike Art Gallery", type:"문화", desc:"나이지리아 현대 미술의 중심으로 8,000점 이상의 작품을 소장합니다.", rating:4.3, openTime:"09:00~19:00", price:"무료", website:"https://en.wikipedia.org/wiki/Nike_Art_Gallery"},
]},
"아부자": { description:"아부자는 나이지리아의 수도로 1991년 건설된 계획도시입니다.", spots:[
  {name:"아소 록", wikiTitle:"Aso Rock", type:"자연", desc:"아부자의 상징인 거대한 화강암 바위로 대통령궁이 그 아래 자리합니다.", rating:4.1, openTime:"외관 24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Aso_Rock"},
]},
"평양": { description:"평양은 북한의 수도로 주체사상탑과 대동강이 상징적인 세계에서 가장 폐쇄적인 수도입니다.", spots:[
  {name:"주체사상탑", wikiTitle:"Juche Tower", type:"랜드마크", desc:"170m 높이의 탑으로 대동강변에서 평양 시내를 조망합니다.", rating:4.0, openTime:"투어 전용", price:"투어 포함", website:"https://en.wikipedia.org/wiki/Juche_Tower"},
]},
"스코페": { description:"스코페는 북마케도니아의 수도로 스코페 구시가지 바자르와 마더 테레사의 고향입니다.", spots:[
  {name:"스코페 올드 바자르", wikiTitle:"Old Bazaar, Skopje", type:"역사", desc:"발칸에서 가장 큰 오스만 시대 바자르로 500년 역사가 살아있습니다.", rating:4.3, openTime:"09:00~19:00", price:"무료", website:"https://en.wikipedia.org/wiki/Old_Bazaar,_Skopje"},
]},
"포트모르즈비": { description:"포트모르즈비는 파푸아뉴기니의 수도로 800개 이상의 언어가 사용되는 다양성의 나라입니다.", spots:[
  {name:"코코다 트레일", wikiTitle:"Kokoda Track", type:"자연", desc:"2차대전 격전지를 따라가는 96km 정글 트레킹 코스입니다.", rating:4.4, openTime:"건기(5~10월)", price:"$200~(가이드)", website:"https://en.wikipedia.org/wiki/Kokoda_Track"},
]},
"아순시온": { description:"아순시온은 파라과이의 수도로 남미에서 가장 오래된 도시 중 하나입니다.", spots:[
  {name:"판테온 나시오날", wikiTitle:"National Pantheon of the Heroes", type:"역사", desc:"파리 앵발리드를 본뜬 파라과이의 국가 영웅 묘소입니다.", rating:4.1, openTime:"07:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/National_Pantheon_of_the_Heroes"},
]},
"브라자빌": { description:"브라자빌은 콩고공화국의 수도로 콩고강 건너 킨샤사와 마주보는 유일한 수도 쌍입니다.", spots:[
  {name:"브라자빌 대성당", wikiTitle:"Basilica of Sainte-Anne-du-Congo", type:"역사", desc:"초록 지붕이 인상적인 콩고의 대표적 가톨릭 성당입니다.", rating:4.0, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Basilica_of_Sainte-Anne-du-Congo"},
]},
"프리타운": { description:"프리타운은 시에라리온의 수도로 해방 노예들이 세운 '자유의 마을'입니다.", spots:[
  {name:"코튼 트리", wikiTitle:"Cotton Tree (Sierra Leone)", type:"역사", desc:"1792년 해방 노예들이 아래서 감사 기도를 드린 500년 된 거대한 나무입니다.", rating:4.1, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Cotton_Tree_(Sierra_Leone)"},
]},
"모가디슈": { description:"모가디슈는 소말리아의 수도로 인도양 해안의 고대 무역 도시입니다.", spots:[
  {name:"리도 비치", wikiTitle:"Mogadishu", type:"자연", desc:"모가디슈 시민들의 해변 휴식처로 도시 재건의 상징입니다.", rating:3.8, openTime:"일출~일몰", price:"무료", website:"https://en.wikipedia.org/wiki/Mogadishu"},
]},
"주바": { description:"주바는 남수단의 수도로 2011년 독립한 세계에서 가장 젊은 국가의 수도입니다.", spots:[
  {name:"백나일 강", wikiTitle:"White Nile", type:"자연", desc:"나일강의 원류인 백나일이 주바를 관통합니다.", rating:3.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/White_Nile"},
]},
"하르툼": { description:"하르툼은 수단의 수도로 청나일과 백나일이 합류하는 지점에 자리합니다.", spots:[
  {name:"나일강 합류점", wikiTitle:"Khartoum", type:"자연", desc:"청나일과 백나일이 만나 나일강이 되는 지점을 투티 섬에서 볼 수 있습니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Khartoum"},
]},
"파라마리보": { description:"파라마리보는 수리남의 수도로 네덜란드 식민지 건축이 유네스코 세계유산인 남미의 숨은 보석입니다.", spots:[
  {name:"파라마리보 역사지구", wikiTitle:"Historic inner city of Paramaribo", type:"역사", desc:"네덜란드 식민지 목조 건축이 보존된 유네스코 세계유산입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Historic_inner_city_of_Paramaribo"},
]},
"다마스쿠스": { description:"다마스쿠스는 시리아의 수도로 5,000년 역사의 세계에서 가장 오래 사람이 살아온 도시 중 하나입니다.", spots:[
  {name:"우마이야 모스크", wikiTitle:"Umayyad Mosque", type:"역사", desc:"이슬람 초기의 가장 위대한 건축물로 세례 요한의 머리가 안치되어 있습니다.", rating:4.7, openTime:"08:00~19:00", price:"SYP 150", website:"https://en.wikipedia.org/wiki/Umayyad_Mosque"},
]},
"두샨베": { description:"두샨베는 타지키스탄의 수도로 파미르 고원 트레킹의 관문 도시입니다.", spots:[
  {name:"파미르 하이웨이", wikiTitle:"Pamir Highway", type:"자연", desc:"세계에서 두 번째로 높은 국제 도로로 4,655m 고개를 넘는 전설의 루트입니다.", rating:4.7, openTime:"5~10월", price:"$50~/일(투어)", website:"https://en.wikipedia.org/wiki/Pamir_Highway"},
]},
"딜리": { description:"딜리는 동티모르의 수도로 2002년 독립한 동남아시아 최연소 국가의 수도입니다.", spots:[
  {name:"크리스토 레이 상", wikiTitle:"Cristo Rei of Dili", type:"랜드마크", desc:"27m 높이의 예수상으로 언덕에서 딜리 만의 파노라마가 펼쳐집니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Cristo_Rei_of_Dili"},
]},
"로메": { description:"로메는 토고의 수도로 기니만에 면한 서아프리카 해안 도시입니다.", spots:[
  {name:"로메 그랑 마르셰", wikiTitle:"Lomé Grand Market", type:"문화", desc:"서아프리카 최대의 시장 중 하나로 부두교 용품도 판매합니다.", rating:4.0, openTime:"07:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Lomé"},
]},
"포트오브스페인": { description:"포트오브스페인은 트리니다드토바고의 수도로 카리브해 최대의 카니발이 열리는 도시입니다.", spots:[
  {name:"트리니다드 카니발", wikiTitle:"Trinidad and Tobago Carnival", type:"문화", desc:"리우 카니발과 쌍벽을 이루는 카리브해 최대 축제로 매년 2~3월 개최됩니다.", rating:4.7, openTime:"2~3월", price:"관람 무료", website:"https://en.wikipedia.org/wiki/Trinidad_and_Tobago_Carnival"},
]},
"아시가바트": { description:"아시가바트는 투르크메니스탄의 수도로 하얀 대리석 건물로 가득한 '하얀 도시'입니다.", spots:[
  {name:"지옥의 문", wikiTitle:"Darvaza gas crater", type:"자연", desc:"50년 넘게 타오르는 직경 70m의 천연가스 분화구입니다.", rating:4.6, openTime:"24시간", price:"$10(입장)", website:"https://en.wikipedia.org/wiki/Darvaza_gas_crater"},
]},
"캄팔라": { description:"캄팔라는 우간다의 수도로 빅토리아 호수 북안의 7개 언덕 위에 자리한 도시입니다.", spots:[
  {name:"부윈디 원시림(고릴라 트레킹)", wikiTitle:"Bwindi Impenetrable National Park", type:"자연", desc:"세계 마운틴 고릴라의 절반이 서식하는 유네스코 세계유산 숲입니다.", rating:4.9, openTime:"08:00~", price:"$700", website:"https://en.wikipedia.org/wiki/Bwindi_Impenetrable_National_Park"},
]},
"몬테비데오": { description:"몬테비데오는 우루과이의 수도로 남미에서 가장 살기 좋은 도시로 꼽히는 라플라타강변의 도시입니다.", spots:[
  {name:"시우다드 비에하", wikiTitle:"Ciudad Vieja, Montevideo", type:"역사", desc:"아르데코와 식민지 건축이 공존하는 구시가지로 카페와 갤러리가 가득합니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Ciudad_Vieja,_Montevideo"},
]},
"카라카스": { description:"카라카스는 베네수엘라의 수도로 아빌라 산 아래 자리한 남미의 대도시입니다.", spots:[
  {name:"아빌라 산 국립공원", wikiTitle:"Waraira Repano", type:"자연", desc:"케이블카로 2,765m 정상에 오르면 카라카스와 카리브해가 한눈에 보입니다.", rating:4.5, openTime:"06:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Waraira_Repano"},
]},
"사나": { description:"사나는 예멘의 수도로 2,500년 역사의 구시가지가 유네스코 세계유산인 아라비아반도의 고대 도시입니다.", spots:[
  {name:"사나 구시가지", wikiTitle:"Old City of Sana'a", type:"역사", desc:"6,000채의 다층 흙벽 건물이 밀집한 세계에서 가장 오래된 도시 중 하나입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Old_City_of_Sana%27a"},
]},
"루사카": { description:"루사카는 잠비아의 수도로 빅토리아 폭포와 남루앙과 사파리의 관문 도시입니다.", spots:[
  {name:"사우스 루앙과 국립공원", wikiTitle:"South Luangwa National Park", type:"자연", desc:"아프리카 최고의 워킹 사파리 명소로 표범 관찰률이 가장 높은 곳입니다.", rating:4.7, openTime:"06:00~18:00", price:"$25", website:"https://en.wikipedia.org/wiki/South_Luangwa_National_Park"},
]},

// ── 2026 트렌딩 도시 ──
"여수": { description:"여수는 남해안의 항구 도시로 여수 밤바다와 오동도, 해상 케이블카가 유명한 대한민국의 떠오르는 여행지입니다.", spots:[
  {name:"여수 해상 케이블카", wikiTitle:"Yeosu", type:"랜드마크", desc:"바다 위를 가로지르는 케이블카에서 여수 앞바다와 돌산대교의 야경을 감상합니다.", rating:4.6, openTime:"09:00~21:30", price:"성인 15,000원", website:"https://en.wikipedia.org/wiki/Yeosu"},
  {name:"오동도", wikiTitle:"Odongdo", type:"자연", desc:"동백꽃이 만발하는 아름다운 섬으로 방파제 산책로를 따라 걸어서 들어갑니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Odongdo"},
  {name:"여수 낭만포차", wikiTitle:"Yeosu", type:"음식", desc:"해변가 포장마차에서 신선한 해산물 안주와 함께 여수 밤바다를 즐깁니다.", rating:4.4, openTime:"17:00~02:00", price:"무료(식사별)", website:"https://en.wikipedia.org/wiki/Yeosu"},
]},
"속초": { description:"속초는 설악산과 동해 바다가 만나는 강원도의 관광 도시로 대포항 회, 속초 중앙시장이 유명합니다.", spots:[
  {name:"설악산 국립공원", wikiTitle:"Seoraksan", type:"자연", desc:"대한민국을 대표하는 명산으로 울산바위, 비선대, 대청봉 등 절경이 가득합니다.", rating:4.8, openTime:"탐방로별 상이", price:"무료", website:"https://en.wikipedia.org/wiki/Seoraksan"},
  {name:"속초 중앙시장", wikiTitle:"Sokcho", type:"음식", desc:"닭강정, 순대, 회 등 강원도 먹거리가 가득한 전통시장입니다.", rating:4.5, openTime:"08:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Sokcho"},
  {name:"영금정 일출", wikiTitle:"Sokcho", type:"자연", desc:"동해 바다 위 바위에서 보는 일출이 장관인 속초의 명소입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Sokcho"},
]},
"통영": { description:"통영은 '한국의 나폴리'로 불리는 남해안 도시로 해상 풍경과 굴, 충무김밥이 유명합니다.", spots:[
  {name:"통영 한려해상 케이블카", wikiTitle:"Tongyeong", type:"자연", desc:"한려해상국립공원의 섬들을 공중에서 감상하는 대한민국 최장 케이블카입니다.", rating:4.6, openTime:"09:00~18:00", price:"성인 15,000원", website:"https://en.wikipedia.org/wiki/Tongyeong"},
  {name:"동피랑 벽화마을", wikiTitle:"Tongyeong", type:"문화", desc:"언덕 위 마을 담벼락에 다채로운 벽화가 그려진 통영의 포토스팟입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Tongyeong"},
]},
"나트랑": { description:"나트랑은 베트남 남부의 해변 리조트 도시로 맑은 바다와 스노클링, 저렴한 물가로 인기가 급상승 중입니다.", spots:[
  {name:"빈펄랜드", wikiTitle:"Vinpearl", type:"랜드마크", desc:"섬 위의 대형 테마파크로 케이블카를 타고 바다를 건너 들어갑니다.", rating:4.4, openTime:"08:00~21:00", price:"VND 880,000", website:"https://en.wikipedia.org/wiki/Vinpearl"},
  {name:"혼문 섬 스노클링", wikiTitle:"Nha Trang", type:"자연", desc:"투명한 바다에서 산호초와 열대어를 만나는 나트랑 최고의 스노클링 포인트입니다.", rating:4.5, openTime:"보트투어 08:00~", price:"VND 300,000", website:"https://en.wikipedia.org/wiki/Nha_Trang"},
]},
"치앙라이": { description:"치앙라이는 태국 최북단의 도시로 백색사원과 골든트라이앵글로 2026년 떠오르는 여행지입니다.", spots:[
  {name:"왓롱쿤(백색사원)", wikiTitle:"Wat Rong Khun", type:"역사", desc:"눈부신 흰색과 거울 조각으로 뒤덮인 초현실적 현대 불교 사원입니다.", rating:4.7, openTime:"08:00~17:00", price:"THB 100", website:"https://en.wikipedia.org/wiki/Wat_Rong_Khun"},
  {name:"블루 템플", wikiTitle:"Wat Rong Suea Ten", type:"역사", desc:"짙은 파란색과 금장식으로 꾸며진 백색사원의 자매 사원입니다.", rating:4.5, openTime:"07:00~20:00", price:"무료", website:"https://en.wikipedia.org/wiki/Wat_Rong_Suea_Ten"},
]},
"크라이스트처치": { description:"크라이스트처치는 2026년 글로벌 트렌딩 1위 도시로 지진 이후 혁신적으로 재건된 뉴질랜드 남섬의 관문입니다.", spots:[
  {name:"크라이스트처치 식물원", wikiTitle:"Christchurch Botanic Gardens", type:"자연", desc:"에이번 강변의 아름다운 식물원으로 150년 역사의 장미원이 유명합니다.", rating:4.6, openTime:"07:00~18:30", price:"무료", website:"https://en.wikipedia.org/wiki/Christchurch_Botanic_Gardens"},
  {name:"아서스 패스", wikiTitle:"Arthur's Pass", type:"자연", desc:"서던알프스를 관통하는 국립공원으로 뉴질랜드 최고의 고산 트레킹을 즐깁니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Arthur%27s_Pass"},
]},
"산세바스티안": { description:"산세바스티안은 바스크 지방의 미식 수도로 인구 대비 미슐랭 스타 레스토랑이 세계 최다이며 2026년 핫 데스티네이션입니다.", spots:[
  {name:"라콘차 해변", wikiTitle:"La Concha (San Sebastián)", type:"자연", desc:"유럽 최고의 도심 해변으로 조개껍데기 모양의 만이 아름답습니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/La_Concha_(San_Sebastián)"},
  {name:"파르테 비에하(구시가지)", wikiTitle:"San Sebastián", type:"음식", desc:"핀초스(바스크 타파스) 바가 밀집한 구시가지에서 바 호핑을 즐깁니다.", rating:4.7, openTime:"12:00~23:00", price:"무료", website:"https://en.wikipedia.org/wiki/San_Sebastián"},
]},
}

const DEFAULT_CITY_DATA = (cityName) => ({
  weather:{temp:Math.floor(Math.random()*20)+10,condition:"구름 조금",icon:"⛅",humidity:Math.floor(Math.random()*40)+45},
  description:`${cityName}은(는) 독특한 문화적 경험과 아름다운 자연 풍경, 잊을 수 없는 추억을 선사하는 매력적인 여행지입니다.`,
  spots:[
    {name:`${cityName} 구시가지`,wikiTitle:cityName,type:"역사",desc:"도시의 풍부한 문화 유산을 보여주는 아름답게 보존된 역사 지구입니다.",rating:4.5},
    {name:`${cityName} 국립 박물관`,wikiTitle:`${cityName} museum`,type:"문화",desc:"이 지역의 훌륭한 예술 작품과 유물, 역사를 전시하는 세계적 수준의 기관입니다.",rating:4.4},
    {name:`${cityName} 시립 공원`,wikiTitle:`${cityName} park`,type:"자연",desc:"도시 중심부에 자리한 사랑받는 녹지 오아시스로 계절마다 다른 정원을 즐길 수 있습니다.",rating:4.6},
    {name:`${cityName} 전통 시장`,wikiTitle:`${cityName} market`,type:"음식",desc:"신선한 농산물과 길거리 음식, 수공예품이 가득한 활기찬 로컬 시장입니다.",rating:4.3},
  ]
})

// 카테고리별 폴백 플레이스홀더 (실사진 못 찾을 때만 사용)
const TYPE_EMOJI = { "문화":"🎭","자연":"🌿","랜드마크":"⭐","도시":"🏙️","역사":"🏛️","음식":"🍽️" }
const getImg = (type) => {
  const colors = { "문화":"8b5cf6","자연":"10b981","랜드마크":"f59e0b","도시":"3b82f6","역사":"f97316","음식":"ec4899" }
  const c = colors[type] || '64748b'
  const emoji = TYPE_EMOJI[type] || '📍'
  // SVG 플레이스홀더 (그라디언트 + 이모지)
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#${c}" stop-opacity="0.8"/><stop offset="100%" stop-color="#0f172a" stop-opacity="0.9"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><text x="200" y="140" text-anchor="middle" font-size="48">${emoji}</text><text x="200" y="185" text-anchor="middle" font-family="sans-serif" font-size="13" fill="rgba(255,255,255,0.5)">사진을 불러오는 중...</text></svg>`)}`
}

const TYPE_COLORS = {
  "문화":"#8b5cf6","자연":"#10b981","랜드마크":"#f59e0b",
  "도시":"#3b82f6","역사":"#f97316","음식":"#ec4899",
  Culture:"#8b5cf6",Nature:"#10b981",Landmark:"#f59e0b",
  Urban:"#3b82f6",History:"#f97316",Food:"#ec4899"
}

function App() {
  const globeContainerRef = useRef(null)
  const globeRef = useRef(null)
  const handleCityClickRef = useRef(null)  // ref to always-fresh click handler
  const justClickedCityRef = useRef(false) // 도시 클릭 직후 polygon 클릭 무시용
  const [countries, setCountries] = useState([])
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [selectedCity, setSelectedCity] = useState(null)
    const [activeTab, setActiveTab] = useState('hotspots')
  const [tabsCollapsed, setTabsCollapsed] = useState(true)
  const [hotspots, setHotspots] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [foodCategory, setFoodCategory] = useState('restaurant') // 'restaurant' | 'cafe' | 'bar'

  // API 사용량 추적 및 제한
  const MAX_DAILY_CALLS = 300
  const [dailyUsage, setDailyUsage] = useState({ count: 0, date: '' })
  
  const getApiUsage = () => {
    try {
      const stored = localStorage.getItem('api_daily_usage')
      if (!stored) return { count: 0, date: new Date().toDateString() }
      
      const { count, date } = JSON.parse(stored)
      const today = new Date().toDateString()
      
      // 날짜가 다르면 리셋
      if (date !== today) {
        return { count: 0, date: today }
      }
      
      return { count, date }
    } catch {
      return { count: 0, date: new Date().toDateString() }
    }
  }
  
  const incrementApiUsage = (calls = 2) => {
    const usage = getApiUsage()
    const newUsage = {
      count: usage.count + calls,
      date: usage.date
    }
    localStorage.setItem('api_daily_usage', JSON.stringify(newUsage))
    setDailyUsage(newUsage)
    return newUsage
  }
  
  const checkApiLimit = () => {
    const usage = getApiUsage()
    setDailyUsage(usage)
    return usage.count < MAX_DAILY_CALLS
  }


  const [cityData, setCityData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [hoveredCountry, setHoveredCountry] = useState(null)
  const [showCountryInfo, setShowCountryInfo] = useState(false)
  const [lang, setLang] = useState('en')
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [sidePanel, setSidePanel] = useState(null) // 'hotspots' | 'restaurants' | null
  const [showFavorites, setShowFavorites] = useState(false)
  const [showHamburger, setShowHamburger] = useState(false)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768)
  const [savedCourses, setSavedCourses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('atlas_saved_courses') || '[]') } catch { return [] }
  })
  const saveCourseToList = (courseType = 'manual') => {
    // courseDays가 비어있으면 courseItems로부터 자동 생성
    let days = courseDays
    if (days.length === 0 && courseItems.length > 0) {
      days = [{ items: [...courseItems] }]
      setCourseDays(days); localStorage.setItem('atlas_course_days', JSON.stringify(days))
    }
    if (days.length === 0 || days.every(d => d.items.length === 0)) return
    const allCityNames = [...new Set(days.flatMap(d => (d.items||[]).map(it => it.cityDisplayName)).filter(Boolean))]
    const name = allCityNames.length > 0 ? allCityNames.join(' · ') : 'My Course'
    const saved = {
      id: Date.now(), name: `${name} ${days.length}${lang==='ko'?'일':'D'}`,
      type: courseType,
      days: days, transport: courseTransport, tripStart: courseTripStart,
      createdAt: Date.now()
    }
    const newList = [saved, ...savedCourses]
    setSavedCourses(newList); localStorage.setItem('atlas_saved_courses', JSON.stringify(newList))
    return saved
  }
  const loadSavedCourse = (saved) => {
    const days = saved.days || []
    setCourseDays(days); localStorage.setItem('atlas_course_days', JSON.stringify(days))
    const flat = days.flatMap(d => d.items || []); saveCourse(flat)
    setCourseTransport(saved.transport || 'transit')
    if (saved.tripStart) saveTripStart(saved.tripStart)
    setActiveDayTab(0); setShowCoursePlanner(true); setShowHamburger(false)
    setCourseSource(saved.type || 'manual')
  }
  const deleteSavedCourse = (id) => {
    const newList = savedCourses.filter(c => c.id !== id)
    setSavedCourses(newList); localStorage.setItem('atlas_saved_courses', JSON.stringify(newList))
  }

  // ── 코스 담기 + 플래너 ──────────────────────────────────
  const [courseItems, setCourseItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('atlas_course') || '[]') } catch { return [] }
  })
  const [showCourseBasket, setShowCourseBasket] = useState(false)
  const [courseDays, setCourseDays] = useState(() => {
    try { return JSON.parse(localStorage.getItem('atlas_course_days') || '[]') } catch { return [] }
  })
  const [showCoursePlanner, setShowCoursePlanner] = useState(false)
  const [routeCache, setRouteCache] = useState({})
  const [loadingRoutes, setLoadingRoutes] = useState(false)
  const [courseTransport, setCourseTransport] = useState('transit')
  const [dragItem, setDragItem] = useState(null)
  const [activeDayTab, setActiveDayTab] = useState(0)
  const [courseTripStart, setCourseTripStart] = useState(() => {
    try { return localStorage.getItem('atlas_trip_start') || '' } catch { return '' }
  })
  const saveTripStart = (d) => { setCourseTripStart(d); localStorage.setItem('atlas_trip_start', d) }
  const getDayDate = (dayIdx) => {
    if (!courseTripStart) return null
    const d = new Date(courseTripStart)
    d.setDate(d.getDate() + dayIdx)
    return d
  }
  const formatDate = (d) => {
    if (!d) return ''
    const dayNames = {
      ko:['일','월','화','수','목','금','토'],
      en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
      ja:['日','月','火','水','木','金','土'],
      zh:['日','一','二','三','四','五','六'],
    }
    const days = dayNames[lang] || dayNames.en
    return `${d.getMonth()+1}/${d.getDate()} (${days[d.getDay()]})`
  }

  // ── AI 코스 자동 생성 (알고리즘 기반, 비용 없음) ──────────────
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiCity, setAiCity] = useState(null)
  const [aiTheme, setAiTheme] = useState(['종합'])
  const toggleAiTheme = (key) => {
    if (key === '종합') { setAiTheme(['종합']); return }
    let next = aiTheme.filter(k => k !== '종합')
    if (next.includes(key)) next = next.filter(k => k !== key)
    else next = [...next, key]
    if (next.length === 0) next = ['종합']
    setAiTheme(next)
  }
  const [aiDays, setAiDays] = useState(2)
  const [aiTransport, setAiTransport] = useState('transit')
  const [aiHours, setAiHours] = useState(4)
  const [aiCitySearch, setAiCitySearch] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [courseSource, setCourseSource] = useState('manual') // 'manual' | 'ai'

  const allCitiesFlat = Object.entries(COUNTRY_CITIES).flatMap(([co, cs]) =>
    cs.map(c => ({ ...c, countryEn: co, countryKo: getCountryDisplayName(co, lang) }))
  )
  const aiCityResults = aiCitySearch.length >= 1
    ? allCitiesFlat.filter(c =>
        c.name.includes(aiCitySearch) ||
        (CITY_I18N[c.name]?.[0]||'').toLowerCase().includes(aiCitySearch.toLowerCase()) ||
        c.countryKo?.includes(aiCitySearch)
      ).slice(0, 8)
    : []

  const haversine = (lat1,lng1,lat2,lng2) => {
    const R=6371,toR=Math.PI/180,dLat=(lat2-lat1)*toR,dLng=(lng2-lng1)*toR
    const a=Math.sin(dLat/2)**2+Math.cos(lat1*toR)*Math.cos(lat2*toR)*Math.sin(dLng/2)**2
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
  }
  // 가까운 순서대로 정렬 (nearest neighbor)
  const sortByProximity = (items, startLat, startLng) => {
    if (items.length <= 1) return items
    const sorted = []; const remaining = [...items]
    let curLat = startLat, curLng = startLng
    while (remaining.length > 0) {
      let minDist = Infinity, minIdx = 0
      remaining.forEach((it, i) => {
        const d = haversine(curLat, curLng, it._lat||curLat, it._lng||curLng)
        if (d < minDist) { minDist = d; minIdx = i }
      })
      const picked = remaining.splice(minIdx, 1)[0]
      sorted.push(picked); curLat = picked._lat||curLat; curLng = picked._lng||curLng
    }
    return sorted
  }

  const generateAiCourse = () => {
    if (!aiCity) return
    setAiGenerating(true)
    setTimeout(() => {
      const cityKey = aiCity.name || aiCity._koName
      const staticData = CITY_DATA[cityKey]
      const cityLat = aiCity.lat, cityLng = aiCity.lng

      // 1) 장소 수집
      let attractions = []; let foodPlaces = []
      if (staticData?.spots) {
        staticData.spots.forEach(s => {
          const item = {
            source: 'spot', name: s.name, displayName: s.name,
            cityName: cityKey, cityDisplayName: getCityName(cityKey),
            type: s.type, rating: s.rating || 4.0, wikiTitle: s.wikiTitle,
            lat: cityLat, lng: cityLng, _lat: cityLat, _lng: cityLng,
            emoji: s.type==='자연'?'🌿':s.type==='역사'?'🏛️':s.type==='음식'?'🍽️':s.type==='문화'?'🎭':s.type==='랜드마크'?'🏙️':'📍'
          }
          if (s.type === '음식') foodPlaces.push(item)
          else attractions.push(item)
        })
      }
      // Google Places 데이터도 활용 (현재 로드된 것)
      if (hotspots.length > 0) {
        hotspots.forEach(p => {
          if (!attractions.some(a => a.name === p.name)) {
            attractions.push({
              source:'hotspot', name:p.name, displayName:p.name,
              cityName:cityKey, cityDisplayName:getCityName(cityKey),
              rating:p.rating||4.0, place_id:p.place_id, vicinity:p.vicinity,
              lat:cityLat, lng:cityLng, _lat:p.geometry?.location?.lat||cityLat, _lng:p.geometry?.location?.lng||cityLng,
              emoji:'📍', photo_ref:p.photos?.[0]?.photo_reference||null
            })
          }
        })
      }
      if (restaurants.length > 0) {
        restaurants.forEach(p => {
          if (!foodPlaces.some(f => f.name === p.name)) {
            foodPlaces.push({
              source:'restaurant', name:p.name, displayName:p.name,
              cityName:cityKey, cityDisplayName:getCityName(cityKey),
              rating:p.rating||4.0, place_id:p.place_id, vicinity:p.vicinity,
              lat:cityLat, lng:cityLng, _lat:p.geometry?.location?.lat||cityLat, _lng:p.geometry?.location?.lng||cityLng,
              emoji:'🍽️', photo_ref:p.photos?.[0]?.photo_reference||null
            })
          }
        })
      }

      // 2) 테마 필터
      const themes = aiTheme
      if (!themes.includes('종합')) {
        let filteredAttr = []
        let extraFood = []
        if (themes.includes('역사')) filteredAttr.push(...attractions.filter(a => ['역사','문화','랜드마크'].includes(a.type)))
        if (themes.includes('자연')) filteredAttr.push(...attractions.filter(a => ['자연'].includes(a.type)))
        if (themes.includes('핫플')) filteredAttr.push(...attractions.filter(a => a.source === 'hotspot'))
        if (themes.includes('음식')) extraFood.push(...foodPlaces.slice(0, 6))
        if (themes.includes('맛집')) extraFood.push(...foodPlaces.slice(0, 8))
        // 중복 제거
        const seen = new Set()
        filteredAttr = filteredAttr.filter(a => { if (seen.has(a.name)) return false; seen.add(a.name); return true })
        extraFood = extraFood.filter(f => { if (seen.has(f.name)) return false; seen.add(f.name); return true })
        // 테마에 관광지 유형이 없으면 기존 관광지에서 보충
        if (filteredAttr.length < 3 && !themes.includes('음식') && !themes.includes('맛집')) {
          attractions.forEach(a => { if (!seen.has(a.name)) { filteredAttr.push(a); seen.add(a.name) } })
        }
        if (themes.includes('음식') || themes.includes('맛집')) {
          attractions = [...filteredAttr.slice(0, Math.max(2, filteredAttr.length)), ...extraFood]
          foodPlaces = foodPlaces.filter(f => !seen.has(f.name))
        } else {
          attractions = filteredAttr
        }
      }

      // 3) 별점순 정렬
      attractions.sort((a,b) => (b.rating||0) - (a.rating||0))
      foodPlaces.sort((a,b) => (b.rating||0) - (a.rating||0))

      // 4) 시간별 하루 장소 수
      const perDay = aiHours <= 1 ? 2 : aiHours <= 2 ? 3 : aiHours <= 4 ? 5 : aiHours <= 6 ? 7 : 9
      const mealsPerDay = aiHours <= 2 ? 1 : 2

      // 5) 날짜별 배분
      const days = []
      let attrIdx = 0, foodIdx = 0
      for (let d = 0; d < aiDays; d++) {
        const dayItems = []
        // 오전 관광
        const morningCount = Math.ceil(perDay * 0.4)
        for (let i = 0; i < morningCount && attrIdx < attractions.length; i++) {
          dayItems.push({ ...attractions[attrIdx], _slot: 'morning' }); attrIdx++
        }
        // 점심
        if (foodIdx < foodPlaces.length) {
          dayItems.push({ ...foodPlaces[foodIdx], _slot: 'lunch' }); foodIdx++
        }
        // 오후 관광
        const afternoonCount = perDay - morningCount
        for (let i = 0; i < afternoonCount && attrIdx < attractions.length; i++) {
          dayItems.push({ ...attractions[attrIdx], _slot: 'afternoon' }); attrIdx++
        }
        // 저녁
        if (mealsPerDay >= 2 && foodIdx < foodPlaces.length) {
          dayItems.push({ ...foodPlaces[foodIdx], _slot: 'dinner' }); foodIdx++
        }
        // 동선 최적화 (시간대별 그룹 내에서 가까운 순)
        const morning = sortByProximity(dayItems.filter(i=>i._slot==='morning'), cityLat, cityLng)
        const lunch = dayItems.filter(i=>i._slot==='lunch')
        const lastMorning = morning[morning.length-1]
        const afternoon = sortByProximity(dayItems.filter(i=>i._slot==='afternoon'), lastMorning?._lat||cityLat, lastMorning?._lng||cityLng)
        const dinner = dayItems.filter(i=>i._slot==='dinner')
        const ordered = [...morning, ...lunch, ...afternoon, ...dinner].map(({_slot,_lat,_lng,...rest})=>({...rest, addedAt:Date.now()}))
        days.push({ items: ordered })
      }

      // 6) 플래너에 로드 + 자동 저장
      saveCourseDays(days)
      setCourseTransport(aiTransport)
      setActiveDayTab(0)
      setShowAiModal(false)
      setShowCoursePlanner(true)
      setCourseSource('ai')
      // AI 코스 자동 저장
      setTimeout(() => {
        const cityName2 = getCityName(cityKey)
        const aiSaved = {
          id: Date.now(), name: `${cityName2} ${days.length}${lang==='ko'?'일':'D'}`,
          type: 'ai',
          days, transport: aiTransport, tripStart: courseTripStart,
          createdAt: Date.now()
        }
        setSavedCourses(prev => { const nl = [aiSaved, ...prev]; localStorage.setItem('atlas_saved_courses', JSON.stringify(nl)); return nl })
      }, 100)
      setAiGenerating(false)
    }, 600) // 약간의 딜레이로 생성 중 느낌
  }

  const saveCourse = (items) => { setCourseItems(items); localStorage.setItem('atlas_course', JSON.stringify(items)) }
  const addToCourse = (item) => {
    // 토글: 이미 있으면 제거
    if (courseItems.some(c => c.name === item.name && c.source === item.source)) {
      const newItems = courseItems.filter(c => !(c.name === item.name && c.source === item.source))
      saveCourse(newItems)
      if (courseDays.length > 0) {
        const days = courseDays.map(d => ({ ...d, items: d.items.filter(di => !(di.name === item.name && di.source === item.source)) }))
        setCourseDays(days); localStorage.setItem('atlas_course_days', JSON.stringify(days))
      }
      return
    }
    // 새 아이템 추가
    const newItem = { ...item, addedAt: Date.now() }
    const newItems = [...courseItems, newItem]
    saveCourse(newItems)
    // courseDays에도 추가 (없으면 Day 1 자동 생성)
    if (courseDays.length > 0) {
      const days = courseDays.map(d => ({ ...d, items: [...d.items] }))
      days[days.length - 1].items.push(newItem)
      setCourseDays(days); localStorage.setItem('atlas_course_days', JSON.stringify(days))
    } else {
      const days = [{ items: [newItem] }]
      setCourseDays(days); localStorage.setItem('atlas_course_days', JSON.stringify(days))
    }
    // 플래너 자동 표시
    setShowCoursePlanner(true)
    setCourseSource('manual')
  }
  const removeFromCourse = (idx) => {
    const item = courseItems[idx]
    saveCourse(courseItems.filter((_, i) => i !== idx))
    if (courseDays.length > 0) {
      const days = courseDays.map(d => ({ ...d, items: d.items.filter(di => !(di.name === item.name && di.source === item.source)) }))
      setCourseDays(days); localStorage.setItem('atlas_course_days', JSON.stringify(days))
    }
  }
  const isInCourse = (name, source) => courseItems.some(c => c.name === name && c.source === source)
  const reorderCourse = (fromIdx, toIdx) => { const arr = [...courseItems]; const [m] = arr.splice(fromIdx, 1); arr.splice(toIdx, 0, m); saveCourse(arr) }

  // 코스 플래너 helpers
  const saveCourseDays = (days) => {
    setCourseDays(days); localStorage.setItem('atlas_course_days', JSON.stringify(days))
    const flat = days.flatMap(d => d.items); saveCourse(flat)
  }
  const openCoursePlanner = () => {
    if (courseDays.length === 0 && courseItems.length > 0) {
      const days = [{ items: [...courseItems] }]
      setCourseDays(days); localStorage.setItem('atlas_course_days', JSON.stringify(days))
    }
    setShowCoursePlanner(true); setShowCourseBasket(false); setActiveDayTab(0)
  }
  const addCourseDay = () => { saveCourseDays([...courseDays, { items: [] }]) }
  const removeCourseDay = (dayIdx) => {
    const days = courseDays.map(d => ({ ...d, items: [...d.items] }))
    const removed = days.splice(dayIdx, 1)[0].items
    if (days.length === 0) days.push({ items: removed })
    else days[Math.min(dayIdx, days.length - 1)].items.push(...removed)
    saveCourseDays(days)
    if (activeDayTab >= days.length) setActiveDayTab(Math.max(0, days.length - 1))
  }
  const reorderInDay = (dayIdx, fromIdx, toIdx) => {
    if (fromIdx === toIdx) return
    const days = courseDays.map(d => ({ ...d, items: [...d.items] }))
    const [m] = days[dayIdx].items.splice(fromIdx, 1); days[dayIdx].items.splice(toIdx, 0, m)
    saveCourseDays(days)
  }
  const moveToDayFn = (fromDay, itemIdx, toDay) => {
    const days = courseDays.map(d => ({ ...d, items: [...d.items] }))
    const [m] = days[fromDay].items.splice(itemIdx, 1); days[toDay].items.push(m)
    saveCourseDays(days)
  }
  const removeFromDay = (dayIdx, itemIdx) => {
    const days = courseDays.map(d => ({ ...d, items: [...d.items] }))
    days[dayIdx].items.splice(itemIdx, 1)
    saveCourseDays(days)
  }

  // Directions API
  const getDirQuery = (item) => item.place_id ? `place_id:${item.place_id}` : `${item.wikiTitle || item.name}, ${item.cityDisplayName || item.cityName}`
  const getRouteKey = (a, b, mode) => `${getDirQuery(a)}|${getDirQuery(b)}|${mode}`

  const fetchAllRoutes = async (days, mode) => {
    setLoadingRoutes(true)
    const results = {}; const fetches = []
    days.forEach(day => {
      for (let i = 0; i < day.items.length - 1; i++) {
        const key = getRouteKey(day.items[i], day.items[i + 1], mode)
        if (!routeCache[key] && !fetches.some(f => f.key === key)) {
          fetches.push({ key, o: getDirQuery(day.items[i]), d: getDirQuery(day.items[i + 1]) })
        }
      }
    })
    await Promise.all(fetches.map(async ({ key, o, d }) => {
      try {
        const res = await fetch(`/api/directions?origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}&mode=${mode}&language=${lang==='zh'?'zh-CN':lang}`)
        const data = await res.json()
        if (data.routes?.[0]?.legs?.[0]) {
          const leg = data.routes[0].legs[0]
          results[key] = { distance: leg.distance.text, duration: leg.duration.text, durationSec: leg.duration.value }
        } else { results[key] = { distance: '—', duration: null, durationSec: 0, noRoute: true } }
      } catch { results[key] = { distance: '—', duration: null, durationSec: 0, noRoute: true } }
    }))
    setRouteCache(prev => ({ ...prev, ...results }))
    setLoadingRoutes(false)
  }

  // 플래너 열릴 때/day 변경 시 경로 자동 로드
  useEffect(() => {
    if (showCoursePlanner && courseDays.length > 0) {
      const hasUncached = courseDays.some(day => {
        for (let i = 0; i < day.items.length - 1; i++) {
          if (!routeCache[getRouteKey(day.items[i], day.items[i + 1], courseTransport)]) return true
        }
        return false
      })
      if (hasUncached) fetchAllRoutes(courseDays, courseTransport)
    }
  }, [showCoursePlanner, courseDays, courseTransport])

  // 언어 변경 시 경로 캐시 초기화 (Directions API 응답 언어가 다름)
  useEffect(() => { setRouteCache({}) }, [lang])

  // 모바일 감지
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 즐겨찾기 (localStorage 저장)
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('atlas_favorites') || '[]') } catch { return [] }
  })
  const saveFavorites = (newFavs) => { setFavorites(newFavs); localStorage.setItem('atlas_favorites', JSON.stringify(newFavs)) }
  const isFav = (type, name) => favorites.some(f => f.type === type && f.name === name)
  const toggleFav = (item) => {
    if (isFav(item.type, item.name)) { saveFavorites(favorites.filter(f => !(f.type === item.type && f.name === item.name))) }
    else { saveFavorites([...favorites, { ...item, addedAt: Date.now() }]) }
  }

  // 다국어 헬퍼
  const t = (key) => {
    const val = T[key]?.[lang]
    if (val !== undefined && val !== null) return val
    const ko = T[key]?.['ko']
    return ko !== undefined ? ko : key
  }
  const getCountryName = (enName) => getCountryDisplayName(enName, lang)
  const getCityName = (koName) => {
    if (lang === 'ko') return koName
    const tr = CITY_I18N[koName]
    if (!tr) return koName
    if (lang === 'en') return tr[0] || koName
    if (lang === 'ja') return tr[1] || koName
    if (lang === 'zh') return tr[2] || koName
    return koName
  }
  const getSpotType = (koType) => {
    if (lang === 'ko') return koType
    return SPOT_TYPE_I18N[koType]?.[lang] || koType
  }
  // 관광 패널 번역 헬퍼
  const trCity = (cityKey) => {
    if (lang === 'ko' || !cityKey) return null
    // 1차: CITY_DATA_I18N 수동 번역
    const manual = CITY_DATA_I18N[cityKey]?.[lang]
    if (manual) return manual
    // 2차: 영어 fallback (ja/zh도 영어 번역이라도 표시)
    if (lang !== 'en') {
      const enFallback = CITY_DATA_I18N[cityKey]?.['en']
      if (enFallback) return enFallback
    }
    // 3차: AUTO_I18N 자동 번역 데이터
    const autoData = AUTO_I18N?.[cityKey]
    if (autoData) {
      const autoLang = autoData[lang] || autoData['en']
      if (autoLang) return autoLang
    }
    return null
  }
  const trDesc = (cityKey) => trCity(cityKey)?.description || null
  const trSpot = (cityKey, spotName) => {
    const cityTr = trCity(cityKey)
    // wikiTitle 가져오기 (name이 null일 때 fallback용)
    const getWikiName = () => {
      if (lang === 'ko') return null
      const cityData2 = CITY_DATA[cityKey]
      const spot = cityData2?.spots?.find(s => s.name === spotName)
      return spot?.wikiTitle || null
    }
    if (cityTr?.spots) {
      // 1차: 정확한 키 매칭
      const exact = cityTr.spots[spotName]
      if (exact) {
        // name이 null이면 wikiTitle로 대체
        if (!exact.name) {
          const wikiName = getWikiName()
          return { name: wikiName || spotName, desc: exact.desc || '' }
        }
        return exact
      }
      // 2차: 퍼지 매칭
      const fuzzyKey = Object.keys(cityTr.spots).find(
        k => k.startsWith(spotName) || spotName.startsWith(k)
      )
      if (fuzzyKey) {
        const fuzzy = cityTr.spots[fuzzyKey]
        if (!fuzzy.name) {
          const wikiName = getWikiName()
          return { name: wikiName || spotName, desc: fuzzy.desc || '' }
        }
        return fuzzy
      }
    }
    // 번역 데이터 자체가 없는 경우 → wikiTitle fallback
    if (lang !== 'ko') {
      const wikiName = getWikiName()
      if (wikiName) return { name: wikiName, desc: '' }
    }
    return null
  }

  // 코스 아이템 동적 번역 (저장 시점 언어와 현재 언어가 다를 때)
  const getCourseItemName = (item) => {
    if (item.source === 'city') return getCityName(item.name || item.cityName)
    if (item.source === 'spot') {
      const tr = trSpot(item.cityName, item.name)
      if (tr?.name) return tr.name
      if (item.wikiTitle && lang !== 'ko') return item.wikiTitle
    }
    // hotspot/restaurant은 Google Places에서 온 이름 → 원래 언어 유지
    return item.displayName || item.name
  }
  const getCourseItemCity = (item) => getCityName(item.cityName || item.name)

  // ── 코스 다운로드 (PPT / Word) ──
  const downloadCoursePPT = async () => {
    if (!window.PptxGenJS) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js'
      document.head.appendChild(script)
      await new Promise((res, rej) => { script.onload = res; script.onerror = rej })
    }
    const pptx = new window.PptxGenJS()
    pptx.layout = 'LAYOUT_WIDE'
    pptx.author = 'ATLAS Travel Explorer'
    const cityNames = [...new Set(courseDays.flatMap(d => d.items.map(i => getCourseItemCity(i))))]
    const dateRange = courseTripStart ? `${formatDate(getDayDate(0))} – ${formatDate(getDayDate(courseDays.length-1))}` : ''
    const transportLabel = courseTransport === 'transit' ? (lang==='ko'?'대중교통':'Transit') : courseTransport === 'walking' ? (lang==='ko'?'도보':'Walking') : (lang==='ko'?'차량':'Driving')

    // ── 표지 ──
    const cover = pptx.addSlide()
    cover.background = { color: '0f172a' }
    // 장식 바
    cover.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: 'c8856a' } })
    cover.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 6.6, w: 13.33, h: 0.9, fill: { color: '1e293b' } })
    cover.addText('ATLAS', { x: 0.7, y: 1.5, w: 10, fontSize: 14, color: 'c8856a', fontFace: 'Arial', bold: true, charSpacing: 12 })
    cover.addText(cityNames.join('  ·  '), { x: 0.7, y: 2.1, w: 11, fontSize: 40, color: 'FFFFFF', fontFace: 'Arial', bold: true, lineSpacingMultiple: 1.2 })
    cover.addText(`${lang==='ko'?'여행 일정표':'Travel Itinerary'}`, { x: 0.7, y: 3.4, w: 10, fontSize: 18, color: '94a3b8', fontFace: 'Arial' })
    const infoLines = []
    if (dateRange) infoLines.push(`📅  ${dateRange}`)
    infoLines.push(`📍  ${courseItems.length} ${lang==='ko'?'곳':'places'}  ·  ${courseDays.length} ${lang==='ko'?'일':'days'}`)
    infoLines.push(`🚗  ${transportLabel}`)
    cover.addText(infoLines.join('\n'), { x: 0.7, y: 4.2, w: 10, fontSize: 14, color: '64748b', fontFace: 'Arial', lineSpacingMultiple: 1.8 })
    cover.addText('ATLAS World Travel Explorer', { x: 0.7, y: 6.75, w: 10, fontSize: 10, color: '475569', fontFace: 'Arial' })

    // ── Day별 슬라이드 ──
    courseDays.forEach((day, di) => {
      // 장소가 6개 초과 시 슬라이드 분할
      const pageSize = 6
      const pages = []
      for (let i = 0; i < day.items.length; i += pageSize) pages.push(day.items.slice(i, i + pageSize))

      // Day 총 이동시간 계산
      let totalSec = 0
      for (let i = 0; i < day.items.length - 1; i++) {
        const rk = getRouteKey(day.items[i], day.items[i + 1], courseTransport)
        if (routeCache[rk]?.durationSec) totalSec += routeCache[rk].durationSec
      }
      const totalMin = Math.round(totalSec / 60)
      const totalStr = totalMin > 0 ? (Math.floor(totalMin/60) > 0 ? `${Math.floor(totalMin/60)}h ${totalMin%60}m` : `${totalMin}m`) : ''

      pages.forEach((pageItems, pi) => {
        const slide = pptx.addSlide()
        slide.background = { color: 'FFFFFF' }

        // 상단 컬러 바
        slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: 'c8856a' } })

        // Day 헤더
        slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0.08, w: 13.33, h: 0.85, fill: { color: 'faf8f5' } })
        slide.addText(`Day ${di + 1}`, { x: 0.6, y: 0.15, w: 2, h: 0.7, fontSize: 26, color: 'c8856a', bold: true, fontFace: 'Arial' })
        const headerRight = []
        if (courseTripStart) headerRight.push(formatDate(getDayDate(di)))
        headerRight.push(`${day.items.length} ${lang==='ko'?'곳':'places'}`)
        if (totalStr) headerRight.push(totalStr)
        slide.addText(headerRight.join('   ·   '), { x: 3, y: 0.15, w: 9.5, h: 0.7, fontSize: 12, color: '94a3b8', fontFace: 'Arial', align: 'right' })
        if (pages.length > 1) slide.addText(`(${pi+1}/${pages.length})`, { x: 2.2, y: 0.15, w: 0.8, h: 0.7, fontSize: 10, color: 'b0a89e', fontFace: 'Arial' })

        // 테이블 헤더 + 장소
        const rows = []
        const headerRow = [
          { text: '#', options: { fill: { color: 'c8856a' }, color: 'FFFFFF', bold: true, fontSize: 10, align: 'center' } },
          { text: lang==='ko'?'장소':'Place', options: { fill: { color: 'c8856a' }, color: 'FFFFFF', bold: true, fontSize: 10 } },
          { text: lang==='ko'?'도시':'City', options: { fill: { color: 'c8856a' }, color: 'FFFFFF', bold: true, fontSize: 10 } },
          { text: lang==='ko'?'유형':'Type', options: { fill: { color: 'c8856a' }, color: 'FFFFFF', bold: true, fontSize: 10, align: 'center' } },
          { text: lang==='ko'?'별점':'Rating', options: { fill: { color: 'c8856a' }, color: 'FFFFFF', bold: true, fontSize: 10, align: 'center' } },
          { text: lang==='ko'?'이동':'Route', options: { fill: { color: 'c8856a' }, color: 'FFFFFF', bold: true, fontSize: 10, align: 'center' } },
        ]
        rows.push(headerRow)

        const startIdx = pi * pageSize
        pageItems.forEach((item, localIdx) => {
          const idx = startIdx + localIdx
          const typeName = item.source === 'spot' ? (lang==='ko'?'관광지':'Attraction') : item.source === 'hotspot' ? (lang==='ko'?'핫플':'Hot Place') : (lang==='ko'?'맛집':'Restaurant')
          const bgColor = idx % 2 === 0 ? 'FFFFFF' : 'faf8f5'

          // 경로 정보
          let routeText = ''
          if (idx < day.items.length - 1) {
            const rk = getRouteKey(day.items[idx], day.items[idx + 1], courseTransport)
            const route = routeCache[rk]
            if (route && !route.noRoute) routeText = `${route.duration}\n${route.distance}`
          }

          rows.push([
            { text: `${idx + 1}`, options: { fill: { color: bgColor }, color: 'c8856a', bold: true, fontSize: 12, align: 'center' } },
            { text: getCourseItemName(item), options: { fill: { color: bgColor }, color: '1a1714', bold: true, fontSize: 12 } },
            { text: getCourseItemCity(item), options: { fill: { color: bgColor }, color: '64748b', fontSize: 10 } },
            { text: typeName, options: { fill: { color: bgColor }, color: '64748b', fontSize: 10, align: 'center' } },
            { text: item.rating ? `★ ${item.rating}` : '-', options: { fill: { color: bgColor }, color: item.rating ? 'd97706' : 'b0a89e', fontSize: 10, align: 'center', bold: !!item.rating } },
            { text: routeText, options: { fill: { color: bgColor }, color: '94a3b8', fontSize: 8, align: 'center' } },
          ])
        })

        slide.addTable(rows, {
          x: 0.5, y: 1.15, w: 12.3,
          border: { type: 'solid', pt: 0.5, color: 'e2e8f0' },
          colW: [0.6, 4.5, 2.5, 1.5, 1.2, 2],
          rowH: [0.35, ...pageItems.map(() => 0.7)],
          fontFace: 'Arial',
          autoPage: false,
        })

        // 하단
        slide.addText('ATLAS World Travel Explorer', { x: 0.5, y: 7.0, w: 12, fontSize: 8, color: 'b0a89e', fontFace: 'Arial' })
      })
    })

    pptx.writeFile({ fileName: `ATLAS_${cityNames[0]||'Trip'}_${courseDays.length}Days.pptx` })
  }

  const downloadCourseWord = () => {
    const cityNames = [...new Set(courseDays.flatMap(d => d.items.map(i => getCourseItemCity(i))))]
    const dateRange = courseTripStart ? `${formatDate(getDayDate(0))} – ${formatDate(getDayDate(courseDays.length-1))}` : ''
    const transport = courseTransport === 'transit' ? (lang==='ko'?'대중교통':'Transit') : courseTransport === 'walking' ? (lang==='ko'?'도보':'Walking') : (lang==='ko'?'차량':'Driving')

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<style>
  @page { margin: 2cm; }
  body { font-family: 'Malgun Gothic','Segoe UI',Arial,sans-serif; color: #1a1714; line-height: 1.6; }
  .cover { text-align: center; padding-top: 120px; page-break-after: always; }
  .cover h1 { font-size: 14px; color: #c8856a; letter-spacing: 8px; margin: 0 0 20px; }
  .cover .city { font-size: 36px; font-weight: 800; color: #1a1714; margin: 0 0 8px; }
  .cover .sub { font-size: 16px; color: #94a3b8; margin: 0 0 40px; }
  .cover .info { font-size: 13px; color: #64748b; line-height: 2.2; }
  .cover .line { width: 60px; height: 3px; background: #c8856a; margin: 30px auto; }
  .day-section { page-break-before: always; }
  .day-section:first-of-type { page-break-before: avoid; }
  .day-header { background: #faf8f5; border-left: 4px solid #c8856a; padding: 12px 18px; margin: 0 0 16px; }
  .day-header h2 { font-size: 22px; color: #1a1714; margin: 0; display: inline; }
  .day-header .date { font-size: 13px; color: #c8856a; margin-left: 12px; }
  .day-header .summary { font-size: 11px; color: #94a3b8; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 0 0 16px; }
  th { background: #c8856a; color: white; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; }
  th:first-child { text-align: center; width: 40px; }
  td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; vertical-align: middle; }
  tr:nth-child(even) td { background: #fafaf8; }
  .num { text-align: center; font-weight: 700; color: #c8856a; font-size: 14px; }
  .place { font-weight: 700; color: #1a1714; }
  .type-badge { display: inline-block; background: #f5f0ea; color: #8b7355; padding: 2px 10px; border-radius: 10px; font-size: 10px; font-weight: 600; }
  .rating { color: #d97706; font-weight: 700; }
  .route-row td { padding: 4px 12px 4px 52px; border-bottom: 1px solid #f8fafc; }
  .route-text { color: #64748b; font-size: 11px; }
  .day-total { text-align: right; font-size: 11px; color: #94a3b8; padding: 4px 0 0; margin: 0 0 10px; }
  .footer { text-align: center; font-size: 9px; color: #b0a89e; border-top: 1px solid #e8e2da; padding-top: 12px; margin-top: 40px; }
</style></head><body>`

    // ── 표지 페이지 ──
    html += `<div class="cover">
      <h1>A T L A S</h1>
      <div class="line"></div>
      <div class="city">${cityNames.join('  ·  ')}</div>
      <div class="sub">${lang==='ko'?'여행 일정표':'Travel Itinerary'}</div>
      <div class="line"></div>
      <div class="info">`
    if (dateRange) html += `📅  ${dateRange}<br>`
    html += `📍  ${courseItems.length} ${lang==='ko'?'곳':'places'}  ·  ${courseDays.length} ${lang==='ko'?'일':'days'}<br>`
    html += `🚗  ${transport}`
    html += `</div></div>`

    // ── Day별 (각 Day 새 페이지) ──
    courseDays.forEach((day, di) => {
      html += `<div class="day-section">`

      // Day 총 이동시간
      let totalSec = 0
      for (let i = 0; i < day.items.length - 1; i++) {
        const rk = getRouteKey(day.items[i], day.items[i + 1], courseTransport)
        if (routeCache[rk]?.durationSec) totalSec += routeCache[rk].durationSec
      }
      const totalMin = Math.round(totalSec / 60)
      const totalStr = totalMin > 0 ? (Math.floor(totalMin/60) > 0 ? `${Math.floor(totalMin/60)}h ${totalMin%60}m` : `${totalMin}m`) : ''

      html += `<div class="day-header">
        <h2>Day ${di + 1}</h2>`
      if (courseTripStart) html += `<span class="date">${formatDate(getDayDate(di))}</span>`
      html += `<div class="summary">${day.items.length} ${lang==='ko'?'곳':'places'}${totalStr ? `  ·  ${lang==='ko'?'총 이동':'Total'} ${totalStr}` : ''}</div>
      </div>`

      html += `<table><tr>
        <th>#</th>
        <th>${lang==='ko'?'장소':'Place'}</th>
        <th>${lang==='ko'?'도시':'City'}</th>
        <th>${lang==='ko'?'유형':'Type'}</th>
        <th>${lang==='ko'?'별점':'Rating'}</th>
      </tr>`

      day.items.forEach((item, idx) => {
        const typeName = item.source === 'spot' ? (lang==='ko'?'관광지':'Attraction') : item.source === 'hotspot' ? (lang==='ko'?'핫플':'Hot Place') : (lang==='ko'?'맛집':'Restaurant')
        html += `<tr>
          <td class="num">${idx + 1}</td>
          <td class="place">${getCourseItemName(item)}</td>
          <td>${getCourseItemCity(item)}</td>
          <td><span class="type-badge">${typeName}</span></td>
          <td class="${item.rating ? 'rating' : ''}">${item.rating ? '★ ' + item.rating : '-'}</td>
        </tr>`

        if (idx < day.items.length - 1) {
          const rk = getRouteKey(day.items[idx], day.items[idx + 1], courseTransport)
          const route = routeCache[rk]
          if (route && !route.noRoute) {
            html += `<tr class="route-row"><td colspan="5"><span class="route-text">↓  ${route.duration}  ·  ${route.distance}</span></td></tr>`
          }
        }
      })
      html += `</table></div>`
    })

    html += `<div class="footer">Generated by ATLAS World Travel Explorer</div>`
    html += `</body></html>`

    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ATLAS_${cityNames[0]||'Trip'}_${courseDays.length}Days.doc`
    a.click()
    URL.revokeObjectURL(url)
  }


  // Load world GeoJSON (커스텀 간소화 50m 우선 → 110m fallback)
  useEffect(() => {
    const load110m = () => fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
      .then(r => r.json())
    
    const processGeo = (data) => {
      const fixed = data.features.map(feat => {
        const geom = feat.geometry
        if (geom.type === 'Polygon') {
          return { ...feat, geometry: { ...geom, coordinates: [geom.coordinates[0]] } }
        }
        if (geom.type === 'MultiPolygon') {
          return { ...feat, geometry: { ...geom, coordinates: geom.coordinates.map(poly => [poly[0]]) } }
        }
        return feat
      })
      setCountries(fixed)
    }
    
    // 커스텀 파일 우선 시도, 없으면 110m fallback
    fetch('/countries.json')
      .then(r => { if (!r.ok) throw new Error('no local'); return r.json() })
      .then(data => setCountries(data.features))
      .catch(() => load110m().then(processGeo).catch(() => {}))
  }, [])

  // Init Globe with ESRI satellite tile engine (Google Earth급 해상도)
  useEffect(() => {
    if (globeRef.current || !globeContainerRef.current) return

    const globe = Globe()(globeContainerRef.current)
      .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
      .showAtmosphere(true)
      .atmosphereColor('#3a7bd5')
      .atmosphereAltitude(0.14)
      .width(window.innerWidth)
      .height(window.innerHeight)

    // ESRI World Imagery 위성 타일 (줌 레벨별 자동 로딩 → 구글어스급 해상도)
    globe.globeTileEngineUrl((x, y, level) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${level}/${y}/${x}`
    )

    // Three.js 렌더러 품질 최대화
    const renderer = globe.renderer()
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3))
      renderer.antialias = true
    }

    globe.camera().position.z = 260
    globe.controls().autoRotate = false
    globe.controls().zoomSpeed = 1.5
    globe.controls().minPolarAngle = 0
    globe.controls().maxPolarAngle = Math.PI
    globe.controls().enableDamping = true
    globe.controls().dampingFactor = 0.12
    globe.controls().rotateSpeed = 1.0
    globeRef.current = globe

    // 초기 화면: 대한민국 중심
    setTimeout(() => globe.pointOfView({ lat: 36, lng: 127.8, altitude: window.innerWidth <= 768 ? 3.0 : 2.2 }), 300)

    // ── 뒷면 라벨 숨기기 (지구 뒤쪽 라벨 안 보이게) ──
    const hideBackLabels = () => {
      if (!globeRef.current) return
      const pov = globeRef.current.pointOfView()
      const camLat = pov.lat * Math.PI / 180
      const camLng = pov.lng * Math.PI / 180
      // 시야각 좁게: 정면 ~45도 이내만 표시
      const maxAngle = Math.min(0.75, 0.35 + pov.altitude * 0.18)

      const container = globeContainerRef.current
      if (!container) return
      container.querySelectorAll('[data-lat]').forEach(el => {
        const lat = parseFloat(el.dataset.lat) * Math.PI / 180
        const lng = parseFloat(el.dataset.lng) * Math.PI / 180
        const angle = Math.acos(Math.max(-1, Math.min(1,
          Math.sin(camLat) * Math.sin(lat) +
          Math.cos(camLat) * Math.cos(lat) * Math.cos(lng - camLng)
        )))
        el.style.opacity = angle < maxAngle ? '1' : '0'
        el.style.transition = 'opacity 0.3s'
      })
    }
    const labelInterval = setInterval(hideBackLabels, 100)

    const onResize = () => {
      globe.width(window.innerWidth)
      // 모바일 키보드로 인한 높이 변화 무시
      if (window.innerWidth > 768) {
        globe.height(window.innerHeight)
      }
    }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); clearInterval(labelInterval) }
  }, [])

  // URL 파라미터에서 도시 읽기 (?city=서울&lat=37.5&lng=127)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cityParam = params.get('city')
    const lat = params.get('lat')
    const lng = params.get('lng')

    if (cityParam && lat && lng) {
      // COUNTRY_CITIES에서 도시 검색
      let foundCity = null
      let foundCountry = null
      for (const [country, cities] of Object.entries(COUNTRY_CITIES)) {
        const match = cities.find(c => c.name === cityParam || c.name === decodeURIComponent(cityParam))
        if (match) {
          foundCity = { ...match, countryEn: country }
          foundCountry = country
          break
        }
      }

      if (foundCity) {
        // Globe 준비 대기 후 handleCityClick 호출
        const tryNavigate = () => {
          if (globeRef.current && handleCityClickRef.current) {
            // 먼저 국가 선택
            const feat = countries.find(f => f.properties?.NAME === foundCountry)
            if (feat) setSelectedCountry(feat)
            // 도시 클릭 (fetchCityData 포함)
            handleCityClickRef.current(foundCity)
          } else {
            setTimeout(tryNavigate, 200)
          }
        }
        // Globe 초기화 후 실행 (약간의 지연)
        setTimeout(tryNavigate, 500)
      }
    }
  }, [countries])

  // ── 도시 라벨 (지구본 표면에 HTML로 표시) ──────────────────────────
  // 대양 라벨 데이터
  const OCEAN_LABELS = [
    { lat: 0, lng: -140, name: lang==='ko'?'태평양':lang==='ja'?'太平洋':lang==='zh'?'太平洋':'Pacific Ocean', _type: 'ocean' },
    { lat: 30, lng: -45, name: lang==='ko'?'대서양':lang==='ja'?'大西洋':lang==='zh'?'大西洋':'Atlantic Ocean', _type: 'ocean' },
    { lat: -15, lng: 75, name: lang==='ko'?'인도양':lang==='ja'?'インド洋':lang==='zh'?'印度洋':'Indian Ocean', _type: 'ocean' },
    { lat: 75, lng: 0, name: lang==='ko'?'북극해':lang==='ja'?'北極海':lang==='zh'?'北冰洋':'Arctic Ocean', _type: 'ocean' },
    { lat: -60, lng: 0, name: lang==='ko'?'남극해':lang==='ja'?'南極海':lang==='zh'?'南冰洋':'Southern Ocean', _type: 'ocean' },
    { lat: -30, lng: -140, name: lang==='ko'?'남태평양':lang==='ja'?'南太平洋':lang==='zh'?'南太平洋':'South Pacific', _type: 'ocean' },
    { lat: -30, lng: -15, name: lang==='ko'?'남대서양':lang==='ja'?'南大西洋':lang==='zh'?'南大西洋':'South Atlantic', _type: 'ocean' },
    // 지리 기준선 라벨
    { lat: 0.8, lng: 50, name: lang==='ko'?'적도 (Equator)':lang==='ja'?'赤道':'Equator', _type: 'geoline' },
    { lat: 10, lng: 175, name: lang==='ko'?'날짜변경선':lang==='ja'?'日付変更線':lang==='zh'?'国际日期变更线':'International Date Line', _type: 'geoline' },
  ]

  useEffect(() => {
    if (!globeRef.current) return
    const globe = globeRef.current

    if (!selectedCountry) {
      const labelItems = countries.map(feat => ({
        lat: feat.properties.LABEL_Y || 0,
        lng: feat.properties.LABEL_X || 0,
        name: getCountryName(feat.properties.NAME),
        nameEn: feat.properties.NAME,
        _type: 'country',
      })).filter(d => d.lat !== 0 || d.lng !== 0)
      globe.htmlElementsData([...labelItems, ...OCEAN_LABELS])
      return
    }

    const countryEn = selectedCountry.properties.NAME
    const cities = (COUNTRY_CITIES[countryEn] || []).map(c => ({ ...c, name: getCityName(c.name), _koName: c.name, countryEn, _type: 'city' }))
    const countryLabels = countries.map(feat => ({
      lat: feat.properties.LABEL_Y || 0,
      lng: feat.properties.LABEL_X || 0,
      name: getCountryName(feat.properties.NAME),
      nameEn: feat.properties.NAME,
      _type: 'country',
    })).filter(d => (d.lat !== 0 || d.lng !== 0) && d.nameEn !== countryEn)

    globe.htmlElementsData([...countryLabels, ...cities, ...OCEAN_LABELS])
  }, [selectedCountry, selectedCity, countries, lang])



  // API 사용량 초기화
  useEffect(() => {
    const usage = getApiUsage()
    setDailyUsage(usage)
    console.log(`📊 오늘 API 사용량: ${usage.count}/300건`)
  }, [])

  // selectedCity 변경 시 핫플레이스/맛집 데이터 로드
  useEffect(() => {
    if (selectedCity) {
      fetchPlacesData(selectedCity)
      setShowSharePopup(false)
      setSidePanel(null)
      setFoodCategory('restaurant')
    } else {
      setHotspots([])
      setRestaurants([])
      setActiveTab('hotspots')
    }
  }, [selectedCity, lang])

  // 맛집 카테고리 변경 시 다시 로드
  useEffect(() => {
    if (selectedCity && sidePanel === 'restaurants') {
      setRestaurants([])
      setLoadingPlaces(true)
      fetchFoodData(selectedCity, foodCategory).finally(() => setLoadingPlaces(false))
    }
  }, [foodCategory])



  // HTML 요소 렌더링
  useEffect(() => {
    if (!globeRef.current) return
    const globe = globeRef.current

    globe
      .htmlLat(d => d.lat)
      .htmlLng(d => d.lng)
      .htmlAltitude(d => d._type === 'city' ? 0.012 : d._type === 'ocean' ? 0.003 : d._type === 'geoline' ? 0.002 : 0.005)
      .htmlElement(d => {
        const el = document.createElement('div')
        el.dataset.lat = d.lat
        el.dataset.lng = d.lng

        if (d._type === 'geoline') {
          el.style.cssText = 'pointer-events:none;'
          const isEquator = d.name.includes('적도') || d.name.includes('Equator') || d.name.includes('赤道')
          const isDate = !isEquator
          el.innerHTML = `<div style="
            transform:translate(-50%,-50%);
            font-family:Pretendard,Inter,sans-serif;
            font-size:8px;
            font-weight:600;
            letter-spacing:2px;
            color:${isEquator ? 'rgba(239,68,68,0.55)' : 'rgba(251,191,36,0.65)'};
            white-space:nowrap;
            user-select:none;
          ">${d.name}</div>`
        } else if (d._type === 'ocean') {
          el.style.cssText = 'pointer-events:none;'
          el.innerHTML = `<div style="
            transform:translate(-50%,-50%);
            font-family:Pretendard,Inter,sans-serif;
            font-size:11px;
            font-weight:500;
            font-style:italic;
            letter-spacing:6px;
            color:rgba(130,190,255,0.6);
            text-shadow:0 0 8px rgba(0,40,100,0.5);
            white-space:nowrap;
            user-select:none;
          ">${d.name}</div>`
        } else if (d._type === 'city') {
          const isSelected = (selectedCity?._koName || selectedCity?.name) === (d._koName || d.name)
          el.style.cssText = 'cursor:pointer;pointer-events:all;'
          const inner = document.createElement('div')
          inner.style.cssText = `
            transform:translate(-50%,-50%);
            font-family:Pretendard,Inter,system-ui,sans-serif;
            font-size:${isSelected ? '14px' : '12px'};
            font-weight:700;
            color:${isSelected ? '#2563eb' : 'rgba(255,255,255,0.95)'};
            text-shadow:0 1px 6px rgba(0,0,0,1),0 0 12px rgba(0,0,0,0.9);
            white-space:nowrap;
            user-select:none;
            padding:4px 10px;
            border-radius:6px;
            background:transparent;
            transition:all 0.2s ease;
            border:none;
          `
          inner.textContent = d.name
          el.appendChild(inner)
          el.onmouseenter = () => {
            inner.style.fontSize = '15px'
            inner.style.background = 'transparent'
            inner.style.border = 'none'
            inner.style.color = '#93c5fd'
            inner.style.transform = 'translate(-50%,-50%) scale(1.1)'
          }
          el.onmouseleave = () => {
            inner.style.fontSize = isSelected ? '14px' : '12px'
            inner.style.background = 'transparent'
            inner.style.border = 'none'
            inner.style.color = isSelected ? '#2563eb' : 'rgba(255,255,255,0.95)'
            inner.style.transform = 'translate(-50%,-50%) scale(1)'
          }
          el.onclick = () => {
            justClickedCityRef.current = true
            setTimeout(() => { justClickedCityRef.current = false }, 400)
            handleCityClickRef.current?.(d)
          }
        } else {
          const hasCities = COUNTRY_CITIES[d.nameEn]
          el.style.cssText = 'pointer-events:none;'
          el.innerHTML = `<div style="
            transform:translate(-50%,-50%);
            font-family:Pretendard,Inter,sans-serif;
            font-size:${hasCities ? '13px' : '10px'};
            font-weight:${hasCities ? '700' : '400'};
            color:${hasCities ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)'};
            text-shadow:0 1px 4px rgba(0,0,0,1),0 0 10px rgba(0,0,0,0.8);
            white-space:nowrap;
            user-select:none;
          ">${d.name}</div>`
        }
        return el
      })
  }, [countries, selectedCountry, selectedCity])

  // ── 지리 기준선 (적도, 날짜변경선) ───────────────────────────────
  useEffect(() => {
    if (!globeRef.current) return
    const globe = globeRef.current
    const lines = []
    const step = 5

    // 적도 (latitude 0) - 점선
    for (let lng = -180; lng < 180; lng += step) {
      lines.push({ startLat: 0, startLng: lng, endLat: 0, endLng: lng + step, _line: 'equator' })
    }
    // 날짜변경선 (실제 경로 - 러시아/알래스카, 키리바시, 사모아 등 우회)
    const dlPoints = [
      [70, 180],     // 북극 시작
      [67, 180],     // 베링해
      [65.5, 169],   // 러시아 쪽으로 꺾임 (축치반도 우회)
      [60, 169],
      [53, 169],     // 베링해협 러시아-알래스카 사이
      [52.5, 172],
      [50, 177],
      [48, 180],     // 알류샨 열도 남쪽으로 복귀
      [45, 180],
      [30, 180],
      [15, 180],
      [5, 180],      // 적도 부근
      [5, 172.5],    // 키리바시 서쪽으로 꺾임
      [0, 172.5],
      [-5, 172.5],
      [-7.5, 175],
      [-10, 180],    // 복귀
      [-12.5, -172.5], // 사모아/통가 구간 (서경으로 넘어감)
      [-15, -172.5],
      [-30, -172.5],
      [-45, -172.5],
      [-50, 180],    // 뉴질랜드 남쪽에서 180도 복귀
      [-60, 180],
      [-70, 180],    // 남극 끝
    ]
    for (let i = 0; i < dlPoints.length - 1; i++) {
      lines.push({
        startLat: dlPoints[i][0], startLng: dlPoints[i][1],
        endLat: dlPoints[i+1][0], endLng: dlPoints[i+1][1],
        _line: 'dateline'
      })
    }

    globe
      .arcsData(lines)
      .arcColor(d => d._line === 'equator' ? 'rgba(239,68,68,0.7)' : 'rgba(251,191,36,0.6)')
      .arcStroke(0.4)
      .arcDashLength(0.15)
      .arcDashGap(0.15)
      .arcDashAnimateTime(0)
      .arcAltitude(0.001)
  }, [])

  // Update polygons
  useEffect(() => {
    if (!globeRef.current || countries.length === 0) return
    const globe = globeRef.current
    const hasSelection = !!selectedCountry

    globe
      .polygonsData(countries)
      .polygonCapColor(feat => {
        const name = feat.properties.NAME
        if (hasSelection) {
          if (selectedCountry?.properties.NAME === name) return 'rgba(59,130,246,0.22)'
          if (hoveredCountry === name) return 'rgba(255,220,50,0.35)'
          return 'rgba(0,0,0,0)'
        }
        if (hoveredCountry === name) return 'rgba(255,220,50,0.35)'
        return COUNTRY_CITIES[name] ? 'rgba(34,197,94,0.08)' : 'rgba(200,220,180,0.04)'
      })
      .polygonSideColor(() => 'rgba(0,0,0,0)')
      .polygonStrokeColor(feat => {
        const name = feat.properties.NAME
        if (hasSelection) {
          if (selectedCountry?.properties.NAME === name) return 'rgba(59,130,246,0.7)'
          if (hoveredCountry === name) return 'rgba(255,220,50,0.7)'
          return 'rgba(255,255,255,0.12)'
        }
        if (hoveredCountry === name) return 'rgba(255,220,50,0.7)'
        return 'rgba(255,255,255,0.35)'
      })
      .polygonAltitude(feat => {
        const name = feat.properties.NAME
        if (hasSelection && selectedCountry?.properties.NAME === name) return 0.006
        if (hoveredCountry === name) return 0.005
        return 0.003
      })
      .polygonLabel(() => '')
      .onPolygonHover(feat => {
        // 국가 선택 중에는 다른 나라 호버 완전 차단
        if (hasSelection) return
        setHoveredCountry(feat ? feat.properties.NAME : null)
      })
      .onPolygonClick(feat => {
        // 국가 선택 중에는 다른 나라 클릭 완전 차단 (국경 근처 도시 오클릭 방지)
        if (hasSelection) return
        if (justClickedCityRef.current) return
        handleCountryClick(feat)
      })
  }, [countries, hoveredCountry, selectedCountry, lang])


  // 국가별 최적 줌 레벨 (수동 튜닝)
  const COUNTRY_ZOOM = {
    // 아시아
    "South Korea": { alt: 0.22, lat: 36.0, lng: 127.8 },
    "Japan": { alt: 0.35, lat: 36.5, lng: 138.0 },
    "China": { alt: 0.8, lat: 35.0, lng: 105.0 },
    "India": { alt: 0.6, lat: 22.0, lng: 79.0 },
    "Thailand": { alt: 0.35, lat: 14.0, lng: 100.5 },
    "Vietnam": { alt: 0.4, lat: 16.0, lng: 107.5 },
    "Indonesia": { alt: 0.7, lat: -2.5, lng: 118.0 },
    "Malaysia": { alt: 0.35, lat: 4.0, lng: 109.0 },
    "Singapore": { alt: 0.08, lat: 1.35, lng: 103.82 },
    "Cambodia": { alt: 0.2, lat: 12.5, lng: 105.0 },
    "Myanmar": { alt: 0.45, lat: 19.5, lng: 96.5 },
    "Nepal": { alt: 0.2, lat: 28.2, lng: 84.5 },
    "Sri Lanka": { alt: 0.18, lat: 7.8, lng: 80.7 },
    "Philippines": { alt: 0.5, lat: 12.0, lng: 122.0 },
    "United Arab Emirates": { alt: 0.15, lat: 24.5, lng: 54.5 },
    "Saudi Arabia": { alt: 0.6, lat: 24.0, lng: 44.0 },
    "Iran": { alt: 0.55, lat: 33.0, lng: 53.5 },
    "Uzbekistan": { alt: 0.35, lat: 41.3, lng: 64.5 },
    // 유럽
    "France": { alt: 0.3, lat: 46.6, lng: 2.5 },
    "Italy": { alt: 0.32, lat: 42.5, lng: 12.5 },
    "Spain": { alt: 0.35, lat: 40.0, lng: -3.5 },
    "Germany": { alt: 0.28, lat: 51.0, lng: 10.5 },
    "United Kingdom": { alt: 0.3, lat: 54.0, lng: -2.5 },
    "Portugal": { alt: 0.25, lat: 39.6, lng: -8.0 },
    "Netherlands": { alt: 0.12, lat: 52.2, lng: 5.3 },
    "Czechia": { alt: 0.15, lat: 49.8, lng: 15.5 },
    "Austria": { alt: 0.15, lat: 47.5, lng: 14.0 },
    "Switzerland": { alt: 0.12, lat: 46.8, lng: 8.2 },
    "Hungary": { alt: 0.15, lat: 47.2, lng: 19.5 },
    "Croatia": { alt: 0.2, lat: 44.5, lng: 16.0 },
    "Greece": { alt: 0.28, lat: 38.5, lng: 23.5 },
    "Turkey": { alt: 0.45, lat: 39.0, lng: 35.0 },
    "Norway": { alt: 0.55, lat: 64.0, lng: 12.0 },
    "Sweden": { alt: 0.5, lat: 62.0, lng: 16.0 },
    "Denmark": { alt: 0.14, lat: 56.0, lng: 10.0 },
    "Finland": { alt: 0.4, lat: 64.0, lng: 26.0 },
    "Iceland": { alt: 0.2, lat: 64.9, lng: -18.5 },
    "Poland": { alt: 0.22, lat: 52.0, lng: 19.5 },
    "Russia": { alt: 1.8, lat: 62.0, lng: 95.0 },
    // 아프리카
    "Egypt": { alt: 0.4, lat: 27.0, lng: 30.5 },
    "Morocco": { alt: 0.3, lat: 32.0, lng: -6.0 },
    "South Africa": { alt: 0.5, lat: -29.0, lng: 25.0 },
    "Kenya": { alt: 0.3, lat: 0.5, lng: 37.5 },
    "Tanzania": { alt: 0.35, lat: -6.5, lng: 35.0 },
    "Ethiopia": { alt: 0.4, lat: 9.0, lng: 39.5 },
    "Ghana": { alt: 0.22, lat: 7.5, lng: -1.5 },
    // 아메리카
    "United States of America": { alt: 1.2, lat: 39.0, lng: -98.0 },
    "Canada": { alt: 1.5, lat: 58.0, lng: -98.0 },
    "Mexico": { alt: 0.55, lat: 23.5, lng: -102.5 },
    "Brazil": { alt: 0.9, lat: -10.0, lng: -52.0 },
    "Argentina": { alt: 0.9, lat: -35.0, lng: -65.0 },
    "Peru": { alt: 0.5, lat: -10.0, lng: -76.0 },
    "Chile": { alt: 1.0, lat: -33.0, lng: -71.0 },
    "Colombia": { alt: 0.4, lat: 4.5, lng: -73.0 },
    "Cuba": { alt: 0.22, lat: 22.0, lng: -79.5 },
    // 오세아니아
    "Australia": { alt: 1.0, lat: -26.0, lng: 134.0 },
    "New Zealand": { alt: 0.45, lat: -41.5, lng: 173.0 },
    // 중동
    "Jordan": { alt: 0.15, lat: 31.3, lng: 36.3 },
    "Israel": { alt: 0.12, lat: 31.5, lng: 35.0 },
    // 추가 국가
    "Ireland": { alt: 0.18, lat: 53.4, lng: -8.0 },
    "Belgium": { alt: 0.1, lat: 50.5, lng: 4.5 },
    "Taiwan": { alt: 0.15, lat: 23.7, lng: 121.0 },
    "Maldives": { alt: 0.12, lat: 3.2, lng: 73.2 },
    "Costa Rica": { alt: 0.12, lat: 10.0, lng: -84.0 },
    "Panama": { alt: 0.12, lat: 9.0, lng: -79.5 },
    "Ecuador": { alt: 0.25, lat: -1.5, lng: -78.5 },
    "Romania": { alt: 0.2, lat: 46.0, lng: 25.0 },
    "Georgia": { alt: 0.12, lat: 42.3, lng: 43.5 },
    "Montenegro": { alt: 0.08, lat: 42.7, lng: 19.4 },
    "Slovenia": { alt: 0.1, lat: 46.1, lng: 14.8 },
    "Mongolia": { alt: 0.6, lat: 47.5, lng: 105.0 },
    "Laos": { alt: 0.3, lat: 18.5, lng: 103.5 },
    "Tunisia": { alt: 0.2, lat: 34.5, lng: 9.5 },
    "Oman": { alt: 0.25, lat: 22.0, lng: 57.5 },
    "Qatar": { alt: 0.08, lat: 25.3, lng: 51.2 },
    "Bolivia": { alt: 0.45, lat: -17.0, lng: -65.0 },
    "Dominican Republic": { alt: 0.15, lat: 19.0, lng: -70.0 },
    "Guatemala": { alt: 0.18, lat: 15.5, lng: -90.3 },
    "Jamaica": { alt: 0.1, lat: 18.1, lng: -77.3 },
    "Latvia": { alt: 0.12, lat: 57.0, lng: 24.5 },
    "Lithuania": { alt: 0.12, lat: 55.2, lng: 24.0 },
    "Estonia": { alt: 0.12, lat: 59.0, lng: 25.5 },
    "Cyprus": { alt: 0.1, lat: 35.1, lng: 33.4 },
    "Albania": { alt: 0.12, lat: 41.3, lng: 20.0 },
    "Serbia": { alt: 0.18, lat: 44.5, lng: 20.9 },
    "Namibia": { alt: 0.5, lat: -22.0, lng: 17.5 },
    "Zimbabwe": { alt: 0.3, lat: -19.0, lng: 29.5 },
    "Fiji": { alt: 0.15, lat: -18.0, lng: 178.0 },
    "Madagascar": { alt: 0.45, lat: -19.0, lng: 47.0 },
    "Mauritius": { alt: 0.08, lat: -20.2, lng: 57.5 },
    "Lebanon": { alt: 0.08, lat: 33.9, lng: 35.9 },
    "Ukraine": { alt: 0.4, lat: 49.0, lng: 31.5 },
    "Pakistan": { alt: 0.5, lat: 30.5, lng: 69.5 },
    "Luxembourg": { alt: 0.06, lat: 49.6, lng: 6.1 },
    "Slovakia": { alt: 0.12, lat: 48.7, lng: 19.7 },
    "Bulgaria": { alt: 0.18, lat: 42.7, lng: 25.5 },
    "Rwanda": { alt: 0.08, lat: -2.0, lng: 29.9 },
    "Senegal": { alt: 0.2, lat: 14.5, lng: -14.5 },
    "Kazakhstan": { alt: 0.8, lat: 48.0, lng: 67.0 },
  }

  const getCountryAltitude = (feat) => {
    const name = feat.properties.NAME
    // 사전 정의된 줌이 있으면 사용
    if (COUNTRY_ZOOM[name]) return COUNTRY_ZOOM[name].alt
    // 없으면 바운딩박스 기반 계산
    try {
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
      const processCoord = (c) => {
        if (Array.isArray(c[0])) { c.forEach(processCoord) }
        else {
          minLat = Math.min(minLat, c[1]); maxLat = Math.max(maxLat, c[1])
          minLng = Math.min(minLng, c[0]); maxLng = Math.max(maxLng, c[0])
        }
      }
      processCoord(feat.geometry.coordinates)
      const latSpan = maxLat - minLat
      const lngSpan = maxLng - minLng
      const span = Math.max(latSpan, lngSpan)
      // 더 세밀한 줌 매핑
      if (span < 2)  return 0.08
      if (span < 4)  return 0.12
      if (span < 6)  return 0.18
      if (span < 10) return 0.25
      if (span < 15) return 0.35
      if (span < 25) return 0.5
      if (span < 40) return 0.7
      if (span < 60) return 0.9
      if (span < 100) return 1.2
      return 1.8
    } catch { return 0.5 }
  }

  // 국가 클릭 시 중심점도 최적화
  const getCountryCenter = (feat) => {
    const name = feat.properties.NAME
    if (COUNTRY_ZOOM[name]) {
      return { lat: COUNTRY_ZOOM[name].lat, lng: COUNTRY_ZOOM[name].lng }
    }
    return { lat: feat.properties.LABEL_Y || 0, lng: feat.properties.LABEL_X || 0 }
  }

  const handleCountryClick = (feat) => {
    if (!feat || !globeRef.current) return
    const globe = globeRef.current

    // 툴팁 숨김 (DOM 삭제X, display:none만)
    globe.polygonLabel(() => '')
    setHoveredCountry(null)
    if (globeContainerRef.current) {
      const tooltip = globeContainerRef.current.querySelector(':scope > div:last-of-type')
      if (tooltip && tooltip.style?.position === 'absolute') {
        tooltip.style.display = 'none'
      }
    }

    const clickedName = feat.properties.NAME

    // 같은 나라 다시 클릭하면 원상복구
    if (selectedCountry?.properties.NAME === clickedName) {
      closeCountry()
      return
    }

    setSelectedCountry(feat)
    setSelectedCity(null)
    setCityData(null)
    setHoveredCountry(null)
    setShowCountryInfo(false)

    const center = getCountryCenter(feat)
    const altitude = getCountryAltitude(feat)
    const mobileAlt = window.innerWidth <= 768 ? altitude * 1.5 : altitude

    globe.controls().autoRotate = false
    globe.pointOfView({ lat: center.lat, lng: center.lng, altitude: mobileAlt }, 1300)
  }

  const handleCityClick = (city) => {
    try {
      if (!globeRef.current) return
      setSelectedCity(city)
      setSelectedSpot(null)
      setCityData(null)
      setShowCountryInfo(false)
      fetchCityData(city)
      // 국가 줌보다 더 가까이 줌인
      const countryName = city.countryEn || selectedCountry?.properties?.NAME
      const cz = countryName && COUNTRY_ZOOM[countryName]
      const baseAlt = cz ? cz.alt : 0.3
      const cityAlt = Math.max(Math.min(baseAlt * 0.45, 0.15), 0.06)
      const finalCityAlt = window.innerWidth <= 768 ? cityAlt * 1.4 : cityAlt
      globeRef.current.pointOfView({ lat: city.lat, lng: city.lng, altitude: finalCityAlt }, 900)
    } catch(e) { console.error('city click error:', e) }
  }

  handleCityClickRef.current = handleCityClick

  // ── 도시 관광 데이터 로드 (사전 데이터 기반, AI 불필요) ──────────────────


  // 캐시 관리 함수들
  const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24시간
  
  const getCachedData = (key) => {
    try {
      const cached = localStorage.getItem(key)
      if (!cached) return null
      
      const { data, timestamp } = JSON.parse(cached)
      
      // 24시간 이내면 캐시 사용
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data
      }
      
      // 만료된 캐시 삭제
      localStorage.removeItem(key)
      return null
    } catch {
      return null
    }
  }
  
  const setCachedData = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.warn('Cache storage failed:', error)
    }
  }



  // Google Places API 호출

  // 링크 공유 함수
  const shareCity = (city) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?city=${encodeURIComponent(city.name)}&lat=${city.lat}&lng=${city.lng}`
    return shareUrl
  }

  const copyLink = (city) => {
    const url = shareCity(city)
    navigator.clipboard.writeText(url).then(() => {
      alert(t('linkCopied'))
    }).catch(() => {
      alert(t('linkCopyFail'))
    })
  }

  const shareNative = async (city) => {
    const shareUrl = shareCity(city)
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ATLAS - ${city.name}`,
          text: `${getCityName(city._koName||city.name)}${t('shareText')}`,
          url: shareUrl
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyLink(city)
        }
      }
    } else {
      copyLink(city)
    }
  }



  const fetchPlacesData = async (city) => {
    if (!city?.lat || !city?.lng) return
    
    setLoadingPlaces(true)
    
    // 관광 패널 spots 이름 수집 (중복 필터용)
    const cityKey = city._koName || city.name
    const staticSpots = CITY_DATA[cityKey]?.spots || []
    const spotNames = new Set()
    staticSpots.forEach(s => {
      if (s.name) spotNames.add(s.name.toLowerCase().replace(/\s+/g, ''))
      if (s.wikiTitle) spotNames.add(s.wikiTitle.toLowerCase().replace(/\s+/g, ''))
      if (s.wikiTitle) {
        s.wikiTitle.split(/[\s_()]+/).forEach(w => {
          if (w.length >= 4) spotNames.add(w.toLowerCase())
        })
      }
    })

    const isDuplicate = (placeName) => {
      const normalized = placeName.toLowerCase().replace(/\s+/g, '')
      if (spotNames.has(normalized)) return true
      for (const keyword of spotNames) {
        if (keyword.length >= 4 && normalized.includes(keyword)) return true
        if (keyword.length >= 4 && keyword.includes(normalized.replace(/\s+/g, ''))) return true
      }
      return false
    }

    try {
      // 핫플레이스 (관광명소, 박물관, 공원 등)
      const hotspotRes = await fetch(
        `/api/places?lat=${city.lat}&lng=${city.lng}&type=tourist_attraction|museum|park|point_of_interest&language=${lang==='zh'?'zh-CN':lang}`
      )
      const hotspotData = await hotspotRes.json()
      
      if (hotspotData.results) {
        const filterHotspots = (minReviews) => hotspotData.results
          .filter(p => p.rating && p.rating >= 4.0)
          .filter(p => p.user_ratings_total && p.user_ratings_total >= minReviews)
          .filter(p => !isDuplicate(p.name))
          .sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0))

        let topHotspots = filterHotspots(1000)
        if (topHotspots.length < 3) topHotspots = filterHotspots(500)
        if (topHotspots.length < 3) topHotspots = filterHotspots(300)
        
        setHotspots(topHotspots)
      }
      
      // 맛집도 함께 로드
      await fetchFoodData(city, foodCategory)
      
    } catch (error) {
      console.error('Failed to fetch places:', error)
    } finally {
      setLoadingPlaces(false)
    }
  }

  // 맛집 카테고리별 데이터 로드
  const fetchFoodData = async (city, category) => {
    if (!city?.lat || !city?.lng) return
    
    // 동서양 공통으로 잘 잡히도록 넓게 매핑
    const typeMap = {
      restaurant: 'restaurant',           // 전 세계 공통
      cafe: 'cafe|bakery',                // 카페 + 베이커리/디저트숍 (아시아 디저트 카페 포함)
      bar: 'bar|night_club'               // 바/펍/이자카야 + 클럽
    }
    const apiType = typeMap[category] || 'restaurant'
    
    // 카테고리별 제외 키워드
    const excludeKeywords = {
      restaurant: ['hotel', 'hostel', 'resort', 'motel', 'lodge', 'suites', '호텔', '리조트', '모텔', 'guesthouse', 'pension', '펜션'],
      cafe: ['hotel', 'hostel', 'resort', '호텔', '리조트', 'guesthouse'],
      bar: ['hotel', 'hostel', 'resort', '호텔', '리조트', 'guesthouse', 'karaoke', '노래방']
    }
    const excludeTypes = {
      restaurant: ['lodging', 'hotel', 'resort'],
      cafe: ['lodging', 'hotel'],
      bar: ['lodging', 'hotel']
    }
    const keywords = excludeKeywords[category] || excludeKeywords.restaurant
    const badTypes = excludeTypes[category] || excludeTypes.restaurant

    try {
      const res = await fetch(
        `/api/places?lat=${city.lat}&lng=${city.lng}&type=${apiType}&language=${lang==='zh'?'zh-CN':lang}`
      )
      const data = await res.json()
      
      if (data.results) {
        const filterResults = (minReviews) => data.results
          .filter(p => {
            if (!p.rating || p.rating < 3.0) return false
            if (!p.user_ratings_total || p.user_ratings_total < minReviews) return false
            const nameLower = (p.name || '').toLowerCase()
            if (keywords.some(kw => nameLower.includes(kw))) return false
            if (p.types && p.types.some(t => badTypes.includes(t))) return false
            return true
          })
          .sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0))

        let results = filterResults(1000)
        if (results.length < 3) results = filterResults(500)
        if (results.length < 3) results = filterResults(300)
        
        setRestaurants(results)
      }
    } catch (error) {
      console.error('Failed to fetch food data:', error)
    }
  }

  const fetchCityData = async (city) => {
    try {
      // 1. 사전 데이터 (240개 도시 전체 포함)
      const cityKey = city._koName || city.name
      const staticData = CITY_DATA[cityKey]
      if (staticData) {
        const base = { ...staticData }
        if (!base.weather) base.weather = { temp: '—', condition: '...', icon: '🌤️', humidity: '—' }
        setCityData(base)
        setLoading(false)
        fetchWeather(city.lat, city.lng).then(w => {
          if (w) setCityData(prev => prev ? { ...prev, weather: w } : prev)
        }).catch(() => {})
        return
      }

      // 2. 사전 데이터 없는 경우 기본 데이터 사용
      const fallback = DEFAULT_CITY_DATA(cityKey)
      setCityData(fallback)
      setLoading(false)
      fetchWeather(city.lat, city.lng).then(w => {
        if (w) setCityData(prev => prev ? { ...prev, weather: w } : prev)
      }).catch(() => {})
    } catch(e) {
      console.error('fetchCityData error:', e)
      const cityKey2 = city._koName || city.name
      setCityData({
        weather: { temp: '—', condition: '—', icon: '🌤️', humidity: '—' },
        description: `${cityKey2}`,
        spots: DEFAULT_CITY_DATA(cityKey2).spots,
      })
      setLoading(false)
    }
  }

  // OpenWeatherMap 실시간 날씨
  const fetchWeather = async (lat, lng) => {
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || ''
    if (!API_KEY) return null
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric&lang=${lang==='ko'?'kr':lang==='zh'?'zh_cn':lang}`
      )
      const d = await res.json()
      if (d.cod !== 200) return null
      const condition = d.weather[0].description
      const temp = Math.round(d.main.temp)
      const humidity = d.main.humidity
      const id = d.weather[0].id
      let icon = '⛅'
      if (id >= 200 && id < 300) icon = '⛈️'
      else if (id >= 300 && id < 400) icon = '🌦️'
      else if (id >= 500 && id < 600) icon = '🌧️'
      else if (id >= 600 && id < 700) icon = '❄️'
      else if (id >= 700 && id < 800) icon = '🌫️'
      else if (id === 800) icon = '☀️'
      else if (id > 800) icon = '⛅'
      return { temp, condition, icon, humidity }
    } catch { return null }
  }


  const closePanel = () => {
    setSelectedCity(null); setCityData(null); setSelectedSpot(null); setSidePanel(null)
    if (selectedCountry && globeRef.current) {
      const center = getCountryCenter(selectedCountry)
      const altitude = getCountryAltitude(selectedCountry)
      const mAlt = window.innerWidth <= 768 ? altitude * 1.5 : altitude
      globeRef.current.pointOfView({ lat: center.lat, lng: center.lng, altitude: mAlt }, 900)
    }
  }

  const closeCountry = () => {
    // 줌아웃 없이 상태만 초기화 — 현재 뷰 그대로 유지
    setSelectedCountry(null); setSelectedCity(null); setCityData(null); setSelectedSpot(null); setShowCountryInfo(false)
  }

  // Search: all cities + all spots across all countries
  const allCities = Object.entries(COUNTRY_CITIES).flatMap(([country, cities]) =>
    cities.map(c => ({ ...c, _koName: c.name, countryEn: country, countryKo: getCountryName(country), _searchType: 'city' }))
  )
  // Build spot search index
  const allSpots = Object.entries(CITY_DATA).flatMap(([cityName, data]) => {
    const city = allCities.find(c => (c._koName || c.name) === cityName)
    if (!city || !data.spots) return []
    return data.spots.map(spot => ({
      ...city,
      spotName: spot.name,
      spotType: spot.type,
      _searchType: 'spot',
    }))
  })
  const searchItems = [...allCities, ...allSpots]
  const filtered = searchQuery.length >= 1
    ? searchItems.filter(c => {
        const q = searchQuery.toLowerCase()
        const koName = c._koName || c.name
        const trName = getCityName(koName)?.toLowerCase() || ''
        if (c._searchType === 'spot') {
          return c.spotName?.toLowerCase().includes(q) || koName?.toLowerCase().includes(q) || trName.includes(q)
        }
        return koName?.includes(searchQuery) || trName.includes(q) || c.countryKo?.toLowerCase().includes(q) || c.countryEn?.toLowerCase().includes(q)
      }).slice(0, 10)
    : []

  const countryKo = selectedCountry ? getCountryName(selectedCountry.properties.NAME) : ''

  return (
    <div style={{width:'100vw',height:'100vh',overflow:'hidden',position:'relative',fontFamily:"'Pretendard','Inter',system-ui,sans-serif",background:'#000'}}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:2px}
        .panel{animation:sIn .42s cubic-bezier(.16,1,.3,1)}
        .countryInfoPanel{animation:cInfoIn .35s cubic-bezier(.16,1,.3,1)}
        @keyframes cInfoIn{from{opacity:0;transform:translateX(-50%) translateY(12px) scale(.97)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
        @keyframes sIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes sharePopIn{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes sidePanelIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes courseBasketIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes coursePop{0%{transform:scale(1)}50%{transform:scale(1.25)}100%{transform:scale(1)}}
        @keyframes courseSlideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes coursePlannerIn{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes aiModalIn{from{opacity:0;transform:translate(-50%,-50%) scale(.94)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        @keyframes aiPulse{0%,100%{opacity:.6}50%{opacity:1}}
        .drag-over{border-color:#3b82f6!important;background:#eff6ff!important}
        .card{transition:transform .18s,box-shadow .18s;cursor:pointer}
        .card:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,.13)!important}
        .cimg{transition:transform .4s}.card:hover .cimg{transform:scale(1.06)}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:768px){
          .panel{animation:mobileSlideUp .35s cubic-bezier(.16,1,.3,1)!important}
          @keyframes mobileSlideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
          ::-webkit-scrollbar{width:2px}
        }
      `}</style>

      {/* Globe */}
      <div ref={globeContainerRef} style={{position:'absolute',inset:0,zIndex:0}}/>

      {/* Header */}
      <div style={{
        position:'absolute',top:0,left:0,right:isMobile?0:(selectedCity?(sidePanel?840:420):0),zIndex:1000,
        background:'linear-gradient(to bottom,rgba(0,0,0,.65) 0%,transparent 100%)',
        padding:isMobile?'12px 12px 40px':'16px 20px 50px',pointerEvents:'none',
        transition:'right .42s cubic-bezier(.16,1,.3,1)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:isMobile?4:12,pointerEvents:'all'}}>
          <div style={{display:'flex',alignItems:'center',gap:isMobile?4:10,position:'relative'}}>
            <div onClick={()=>{setShowHamburger(v=>!v);setShowLangMenu(false)}} style={{width:isMobile?28:40,height:isMobile?28:40,borderRadius:isMobile?8:11,background:'linear-gradient(135deg,#2563eb,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(37,99,235,.4)',cursor:'pointer',transition:'transform .15s'}}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
              <svg width={isMobile?"16":"20"} height={isMobile?"16":"20"} viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div style={{fontSize:isMobile?12:20,fontWeight:800,letterSpacing:'-.5px',color:'white',lineHeight:1}}>ATLAS</div>
              {!isMobile && <div style={{fontSize:9,color:'rgba(255,255,255,.6)',letterSpacing:'2.5px',textTransform:'uppercase'}}>{t('appSub')}</div>}
            </div>
            {/* Hamburger Dropdown */}
            {showHamburger && (
              <div style={{position:'absolute',top:'calc(100% + 10px)',left:0,background:'rgba(15,23,42,.97)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,.15)',borderRadius:16,overflow:'hidden',zIndex:2001,boxShadow:'0 16px 48px rgba(0,0,0,.5)',width:isMobile?Math.min(340,window.innerWidth-24):340,maxHeight:'75vh',overflowY:'auto'}}>
                {/* 저장된 코스 */}
                <div style={{padding:'16px 16px 10px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                  {/* AI 코스 */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <span style={{fontSize:13,fontWeight:700,color:'#a78bfa'}}>🤖 AI {t('menuSavedCourses')}</span>
                    <span style={{fontSize:11,color:'#64748b'}}>{savedCourses.filter(sc=>sc.type==='ai').length}</span>
                  </div>
                  {savedCourses.filter(sc=>sc.type==='ai').length === 0 ? (
                    <div style={{padding:'10px 0',textAlign:'center',color:'#64748b',fontSize:11}}>{t('menuNoSaved')}</div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:6}}>
                      {savedCourses.filter(sc=>sc.type==='ai').map((sc) => (
                        <div key={sc.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,background:'rgba(139,92,246,.08)',border:'1px solid rgba(139,92,246,.2)'}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:'white',lineHeight:1.4}}>{(() => {
                              const cities = [...new Set((sc.days||[]).flatMap(d=>(d.items||[]).map(it=>getCityName(it.cityName||it.name))).filter(Boolean))]
                              return cities.length > 0 ? `${cities.join(' · ')} ${(sc.days||[]).length}${lang==='ko'?'일':'D'}` : sc.name
                            })()}</div>
                            <div style={{fontSize:10,color:'#64748b',marginTop:2}}>{(sc.days||[]).reduce((a,d)=>a+(d.items||[]).length,0)}{t('coursePlace')} · {(sc.days||[]).length}{t('courseDay')}</div>
                          </div>
                          <button onClick={()=>loadSavedCourse(sc)} style={{background:'#7c3aed',border:'none',color:'white',padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer'}}>{t('courseLoad')}</button>
                          <button onClick={()=>{if(confirm(t('courseDeleteConfirm')))deleteSavedCourse(sc.id)}} style={{background:'none',border:'none',color:'#ef4444',fontSize:14,cursor:'pointer',padding:2}}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 수동 코스 */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,marginTop:14}}>
                    <span style={{fontSize:13,fontWeight:700,color:'#93c5fd'}}>📝 {t('courseTypeManual')} {t('menuSavedCourses')}</span>
                    <span style={{fontSize:11,color:'#64748b'}}>{savedCourses.filter(sc=>sc.type!=='ai').length}</span>
                  </div>
                  {savedCourses.filter(sc=>sc.type!=='ai').length === 0 ? (
                    <div style={{padding:'10px 0',textAlign:'center',color:'#64748b',fontSize:11}}>{t('menuNoSaved')}</div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:5}}>
                      {savedCourses.filter(sc=>sc.type!=='ai').map((sc) => (
                        <div key={sc.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.2)'}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:'white',lineHeight:1.4}}>{(() => {
                              const cities = [...new Set((sc.days||[]).flatMap(d=>(d.items||[]).map(it=>getCityName(it.cityName||it.name))).filter(Boolean))]
                              return cities.length > 0 ? `${cities.join(' · ')} ${(sc.days||[]).length}${lang==='ko'?'일':'D'}` : sc.name
                            })()}</div>
                            <div style={{fontSize:10,color:'#64748b',marginTop:2}}>{(sc.days||[]).reduce((a,d)=>a+(d.items||[]).length,0)}{t('coursePlace')} · {(sc.days||[]).length}{t('courseDay')}</div>
                          </div>
                          <button onClick={()=>loadSavedCourse(sc)} style={{background:'#3b82f6',border:'none',color:'white',padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer'}}>{t('courseLoad')}</button>
                          <button onClick={()=>{if(confirm(t('courseDeleteConfirm')))deleteSavedCourse(sc.id)}} style={{background:'none',border:'none',color:'#ef4444',fontSize:14,cursor:'pointer',padding:2}}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* 즐겨찾기 */}
                <div style={{padding:'12px 16px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                    <span style={{fontSize:14,fontWeight:700,color:'white'}}>{t('favTitle')}</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:11,color:'#64748b'}}>{favorites.length}</span>
                      {favorites.length > 0 && (
                        <button onClick={()=>{if(confirm(t('favDeleteConfirm')))saveFavorites([])}}
                          style={{background:'none',border:'none',color:'#ef4444',fontSize:10,cursor:'pointer',fontWeight:600}}>{t('favDeleteAll')}</button>
                      )}
                    </div>
                  </div>
                  {favorites.length === 0 ? (
                    <div style={{padding:'16px 0',textAlign:'center',color:'#64748b',fontSize:12}}>{t('favEmpty')}</div>
                  ) : (
                    <div>
                      {favorites.filter(f=>f.type==='city').length > 0 && (
                        <div style={{marginBottom:6}}>
                          <div style={{fontSize:10,color:'#94a3b8',letterSpacing:2,padding:'4px 0',textTransform:'uppercase'}}>{t('favCity')}</div>
                          {favorites.filter(f=>f.type==='city').map((f,i)=>(
                            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 8px',borderRadius:8,cursor:'pointer',transition:'background .15s'}}
                              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.08)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                              onClick={()=>{const allC=Object.entries(COUNTRY_CITIES).flatMap(([co,cs])=>cs.map(c=>({...c,countryEn:co})));const city=allC.find(c=>c.name===f._koName);if(city){const feat=countries.find(ft=>ft.properties?.NAME===city.countryEn);if(feat)setSelectedCountry(feat);setTimeout(()=>handleCityClickRef.current?.(city),300)};setShowHamburger(false)}}>
                              <span style={{fontSize:16}}>{f.emoji||'📍'}</span>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:12,fontWeight:600,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.displayName||f.name}</div>
                                <div style={{fontSize:10,color:'#94a3b8'}}>{f.countryName||''}</div>
                              </div>
                              <button onClick={e=>{e.stopPropagation();toggleFav(f)}} style={{background:'none',border:'none',color:'#fbbf24',fontSize:14,cursor:'pointer',padding:2}}>⭐</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {favorites.filter(f=>f.type==='spot').length > 0 && (
                        <div style={{marginBottom:6}}>
                          <div style={{fontSize:10,color:'#94a3b8',letterSpacing:2,padding:'4px 0',textTransform:'uppercase'}}>{t('favSpot')}</div>
                          {favorites.filter(f=>f.type==='spot').map((f,i)=>(
                            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 8px',borderRadius:8,cursor:'pointer',transition:'background .15s'}}
                              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.08)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                              onClick={()=>{if(f.cityName){const allC=Object.entries(COUNTRY_CITIES).flatMap(([co,cs])=>cs.map(c=>({...c,countryEn:co})));const city=allC.find(c=>c.name===f.cityName);if(city){const feat=countries.find(ft=>ft.properties?.NAME===city.countryEn);if(feat)setSelectedCountry(feat);setTimeout(()=>handleCityClickRef.current?.(city),300);setTimeout(()=>{const spot=CITY_DATA[f.cityName]?.spots?.find(s=>s.name===f.name);if(spot)setSelectedSpot(spot)},1200)}};setShowHamburger(false)}}>
                              <span style={{fontSize:13,width:24,height:24,borderRadius:6,background:'rgba(251,191,36,.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>📍</span>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:12,fontWeight:600,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                                <div style={{fontSize:10,color:'#94a3b8'}}>{f.cityDisplayName||f.cityName||''}</div>
                              </div>
                              <button onClick={e=>{e.stopPropagation();toggleFav(f)}} style={{background:'none',border:'none',color:'#fbbf24',fontSize:14,cursor:'pointer',padding:2}}>⭐</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {favorites.filter(f=>f.type==='hotspot'||f.type==='restaurant').length > 0 && (
                        <div>
                          <div style={{fontSize:10,color:'#94a3b8',letterSpacing:2,padding:'4px 0',textTransform:'uppercase'}}>{t('favHotspot')} · {t('favFood')}</div>
                          {favorites.filter(f=>f.type==='hotspot'||f.type==='restaurant').map((f,i)=>(
                            <a key={i} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.name)}&query_place_id=${f.place_id||''}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{display:'flex',alignItems:'center',gap:8,padding:'7px 8px',borderRadius:8,textDecoration:'none',transition:'background .15s'}}
                              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.08)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                              <span style={{fontSize:10,width:24,height:24,borderRadius:6,background:f.type==='hotspot'?'#f5f0ea':'#eef5ea',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:f.type==='hotspot'?'#c8856a':'#6fa870'}}>{f.type==='hotspot'?'H':'F'}</span>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:12,fontWeight:600,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                                <div style={{fontSize:10,color:'#94a3b8'}}>{f.rating?`★ ${f.rating}`:''} {f.cityDisplayName||''}</div>
                              </div>
                              <button onClick={e=>{e.preventDefault();e.stopPropagation();toggleFav(f)}} style={{background:'none',border:'none',color:'#fbbf24',fontSize:14,cursor:'pointer',padding:2}}>⭐</button>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Language Selector */}
          <div style={{position:'relative',marginLeft:isMobile?0:8}}>
            <button onClick={()=>{setShowLangMenu(v=>!v);setShowFavorites(false);setShowHamburger(false)}}
              style={{display:'flex',alignItems:'center',gap:isMobile?2:5,background:'rgba(255,255,255,.12)',border:'1px solid rgba(255,255,255,.2)',borderRadius:isMobile?14:20,padding:isMobile?'3px 6px':'5px 12px 5px 8px',cursor:'pointer',color:'white',fontSize:isMobile?10:12,fontWeight:600,backdropFilter:'blur(8px)',transition:'all .2s'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.22)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.12)'}>
              <span style={{fontSize:isMobile?12:16}}>{LANG_OPTIONS.find(l=>l.code===lang)?.flag}</span>
              {!isMobile && <span>{LANG_OPTIONS.find(l=>l.code===lang)?.label}</span>}
              <span style={{fontSize:8,marginLeft:2}}>{showLangMenu?'▲':'▼'}</span>
            </button>
            {showLangMenu && (
              <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,background:'rgba(15,23,42,.95)',backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,.15)',borderRadius:12,overflow:'hidden',zIndex:2001,boxShadow:'0 8px 24px rgba(0,0,0,.4)',minWidth:140}}>
                {LANG_OPTIONS.map(l=>(
                  <div key={l.code}
                    onClick={()=>{setLang(l.code);setShowLangMenu(false)}}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',cursor:'pointer',background:lang===l.code?'rgba(59,130,246,.25)':'transparent',borderLeft:lang===l.code?'3px solid #3b82f6':'3px solid transparent',transition:'all .15s'}}
                    onMouseEnter={e=>{if(lang!==l.code)e.currentTarget.style.background='rgba(255,255,255,.08)'}}
                    onMouseLeave={e=>{if(lang!==l.code)e.currentTarget.style.background='transparent'}}>
                    <span style={{fontSize:18}}>{l.flag}</span>
                    <span style={{color:'white',fontSize:13,fontWeight:lang===l.code?700:500}}>{l.label}</span>
                    {lang===l.code && <span style={{marginLeft:'auto',fontSize:11,color:'#60a5fa'}}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* AI Course Button */}
          <div style={{marginLeft:isMobile?0:4}}>
            <button onClick={()=>{setShowAiModal(true);setShowLangMenu(false);setShowFavorites(false);setShowHamburger(false)}}
              style={{display:'flex',alignItems:'center',gap:isMobile?3:6,background:showAiModal?'rgba(200,133,106,.35)':'rgba(255,255,255,.13)',border:showAiModal?'1px solid rgba(200,133,106,.6)':'1px solid rgba(255,255,255,.22)',borderRadius:isMobile?14:20,padding:isMobile?'3px 7px':'6px 14px',cursor:'pointer',color:'white',fontSize:isMobile?9:12,fontWeight:600,backdropFilter:'blur(8px)',transition:'all .2s',letterSpacing:'.1px'}}
              onMouseEnter={e=>e.currentTarget.style.background=showAiModal?'rgba(200,133,106,.45)':'rgba(255,255,255,.22)'}
              onMouseLeave={e=>e.currentTarget.style.background=showAiModal?'rgba(200,133,106,.35)':'rgba(255,255,255,.13)'}>
              <div style={{width:isMobile?14:16,height:isMobile?14:16,borderRadius:4,background:'rgba(255,255,255,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:isMobile?7:9,fontWeight:800,letterSpacing:0}}>AI</div>
              {!isMobile && <span>{t('aiCourse')}</span>}
            </button>
          </div>
          <div style={{marginLeft:'auto',position:'relative'}}>
            <span style={{position:'absolute',left:isMobile?8:11,top:'50%',transform:'translateY(-50%)',fontSize:isMobile?11:13,color:'#94a3b8',pointerEvents:'none'}}>🔍</span>
            <input placeholder={t('search')} value={searchQuery}
              onChange={e=>{setSearchQuery(e.target.value);setShowDrop(true)}}
              onFocus={()=>setShowDrop(true)}
              onBlur={()=>setTimeout(()=>setShowDrop(false),150)}
              style={{padding:isMobile?'6px 10px 6px 28px':'9px 14px 9px 33px',borderRadius:isMobile?16:22,fontSize:isMobile?10:13,width:isMobile?140:215,background:'rgba(255,255,255,.95)',border:'1.5px solid #e2e8f0',color:'#1e293b',outline:'none',boxShadow:'0 2px 12px rgba(0,0,0,.2)'}}/>
            {showDrop && filtered.length>0 && (
              <div style={{position:'absolute',top:'calc(100% + 7px)',right:0,background:'white',border:'1.5px solid #e2e8f0',borderRadius:14,overflow:'hidden',width:isMobile?'80vw':250,zIndex:2000,boxShadow:'0 12px 32px rgba(0,0,0,.15)'}}>
                {filtered.slice(0,8).map((c,i)=>(
                  <div key={i} onMouseDown={()=>{
                    const feat = countries.find(f => f.properties.NAME === c.countryEn)
                    if (feat) { setSelectedCountry(feat); }
                    setTimeout(() => handleCityClick(c), 300)
                    if (c._searchType === 'spot') {
                      // 관광지 검색 → 도시로 이동 후 해당 관광지 펼침
                      const spotData = CITY_DATA[c._koName || c.name]
                      if (spotData) {
                        setTimeout(() => {
                          const spot = spotData.spots?.find(s => s.name === c.spotName)
                          if (spot) setSelectedSpot(spot)
                        }, 800)
                      }
                    }
                    setSearchQuery(''); setShowDrop(false)
                  }}
                    style={{padding:'10px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:10,borderBottom:i<7?'1px solid #f1f5f9':'none'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                    onMouseLeave={e=>e.currentTarget.style.background='white'}>
                    {getFlagImg(COUNTRY_INFO[c.countryEn]?.emoji) ? (
                      <img src={getFlagImg(COUNTRY_INFO[c.countryEn]?.emoji)} alt="" style={{width:22,height:16,objectFit:'cover',borderRadius:2,border:'1px solid #e2e8f0',flexShrink:0}}/>
                    ) : (
                      <span style={{fontSize:20}}>{c.emoji}</span>
                    )}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {c._searchType === 'spot' ? (trSpot(c._koName || c.name, c.spotName)?.name || c.spotName) : getCityName(c._koName || c.name)}
                      </div>
                      <div style={{fontSize:11,color:'#94a3b8'}}>
                        {c._searchType === 'spot'
                          ? `${getCityName(c._koName || c.name)}, ${c.countryKo}`
                          : c.countryKo}
                      </div>
                    </div>
                    {c._searchType === 'spot' && c.spotType && (
                      <span style={{fontSize:9,padding:'2px 6px',borderRadius:8,background:TYPE_COLORS[c.spotType]||'#64748b',color:'white',fontWeight:700,flexShrink:0}}>{getSpotType(c.spotType)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Country selected badge + info panel */}
      {selectedCountry && !selectedCity && (() => {
        const cName = selectedCountry.properties.NAME
        const rawInfo = COUNTRY_INFO[cName]
        const info = translateCountryInfo(rawInfo, cName, lang)
        const cities = COUNTRY_CITIES[cName]
        return (
          <>
            {/* Bottom bar */}
            <div style={{
              position:'absolute',bottom:isMobile?12:24,
              left:'50%',transform:'translateX(-50%)',
              zIndex:1001,background:'rgba(255,255,255,.96)',backdropFilter:'blur(14px)',
              border:'1.5px solid #e2e8f0',borderRadius:isMobile?20:40,
              padding:isMobile?'8px 14px':'10px 20px',fontSize:isMobile?11:13,color:'#1e293b',
              boxShadow:'0 4px 24px rgba(0,0,0,.18)',
              display:'flex',alignItems:'center',gap:isMobile?6:12,
              whiteSpace:isMobile?'normal':'nowrap',
              maxWidth:isMobile?'92vw':'none',
              flexWrap:isMobile?'wrap':'nowrap',
              justifyContent:isMobile?'center':'flex-start',
            }}>
              {info && <span style={{fontSize:isMobile?16:20}}>{info.emoji}</span>}
              <span style={{fontWeight:700,fontSize:isMobile?13:15}}>{countryKo}</span>
              {info && !isMobile && <span style={{fontSize:11,color:'#64748b',fontWeight:500}}>{info.tagline}</span>}
              <span style={{color:'#94a3b8',fontSize:12}}>
                {cities ? `${cities.length}${t('nCities')}` : ''}
              </span>
              {info && (
                <button onClick={()=>setShowCountryInfo(v=>!v)}
                  style={{background: showCountryInfo ? '#3b82f6' : '#f0f9ff',border: showCountryInfo ? '1.5px solid #3b82f6' : '1.5px solid #bae6fd',borderRadius:20,padding:'5px 14px',cursor:'pointer',fontSize:11.5,color: showCountryInfo ? 'white' : '#0369a1',fontWeight:700,transition:'all .2s',display:'flex',alignItems:'center',gap:4}}>
                  📋 {t('countryInfo')} {showCountryInfo ? '▾' : '▸'}
                </button>
              )}
              <button onClick={closeCountry}
                style={{background:'#f1f5f9',border:'none',borderRadius:20,padding:'5px 12px',cursor:'pointer',fontSize:12,color:'#64748b',fontWeight:600}}>
                ✕
              </button>
            </div>

            {/* Country Info Panel */}
            {showCountryInfo && info && (
              <div className="countryInfoPanel" style={{
                position:'absolute',bottom:isMobile?90:68,left:'50%',transform:'translateX(-50%)',
                zIndex:1000,width:isMobile?'95vw':480,maxWidth:'95vw',
                maxHeight:isMobile?'65vh':'none',overflowY:isMobile?'auto':'hidden',
                background:'rgba(255,255,255,.97)',backdropFilter:'blur(16px)',
                border:'1.5px solid #e2e8f0',borderRadius:18,
                boxShadow:'0 12px 48px rgba(0,0,0,.22)',
                overflow:'hidden',
              }}>
                {/* Header */}
                <div style={{
                  background:`linear-gradient(135deg, ${cities?.[0]?.color || '#3b82f6'}18, ${cities?.[1]?.color || '#8b5cf6'}12)`,
                  borderBottom:'1px solid #e2e8f0',padding:'16px 20px',
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                    <span style={{fontSize:28}}>{info.emoji}</span>
                    <div>
                      <div style={{fontSize:20,fontWeight:800,color:'#0f172a',letterSpacing:'-.3px'}}>{countryKo}</div>
                      <div style={{fontSize:11.5,color:'#64748b',fontWeight:500}}>{cName} · {info.continent}</div>
                    </div>
                  </div>
                  <div style={{fontSize:13,color:'#475569',fontStyle:'italic',lineHeight:1.5}}>"{info.tagline}"</div>
                </div>

                {/* Info Grid */}
                <div style={{padding:'14px 20px 18px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0'}}>
                  {[
                    { icon:'🏛️', label:t('lCapital'), value:info.capital },
                    { icon:'👥', label:t('lPop'), value:info.population },
                    { icon:'📐', label:t('lArea'), value:info.area },
                    { icon:'🗣️', label:t('lLang'), value:info.lang },
                    { icon:'💰', label:t('lCurrency'), value:info.currency },
                    { icon:'🕐', label:t('lTimezone'), value:info.timezone },
                    { icon:'🌤️', label:t('lBestSeason'), value:info.bestSeason },
                    { icon:'🛂', label:t('lVisa'), value:info.visa },
                    { icon:'🔌', label:t('lVoltage'), value:info.voltage },
                    { icon:'📞', label:t('lCallCode'), value:info.callCode },
                    { icon:'🚗', label:t('lDrive'), value:info.drive },
                    { icon:'🌍', label:t('lCityCount'), value: cities ? `${cities.length}${t('registered')}` : '—' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display:'flex',alignItems:'center',gap:9,
                      padding:'9px 4px',
                      borderBottom: i < 10 ? '1px solid #f1f5f9' : 'none',
                    }}>
                      <span style={{fontSize:15,flexShrink:0,width:22,textAlign:'center'}}>{item.icon}</span>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:10,color:'#94a3b8',fontWeight:600,letterSpacing:'.5px',lineHeight:1}}>{item.label}</div>
                        <div style={{fontSize:12.5,color:'#1e293b',fontWeight:600,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer hint */}
                <div style={{borderTop:'1px solid #f1f5f9',padding:'10px 20px',textAlign:'center'}}>
                  <span style={{fontSize:11,color:'#94a3b8'}}>{t('cityInfoHint')}</span>
                </div>
              </div>
            )}
          </>
        )
      })()}

      {/* Hint */}
      {!selectedCountry && (
        <div style={{position:'absolute',bottom:isMobile?12:24,left:'50%',transform:'translateX(-50%)',zIndex:1000,background:'rgba(255,255,255,.9)',backdropFilter:'blur(12px)',border:'1.5px solid rgba(255,255,255,.5)',borderRadius:40,padding:isMobile?'7px 14px':'9px 20px',fontSize:isMobile?10:12,color:'#475569',whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(0,0,0,.2)',pointerEvents:'none'}}>
          {t('hintMain')}
        </div>
      )}



      {/* Side Panel */}
      {selectedCity && (
        <>
        {/* 사이드 탭 (핫플 / 맛집) - 패널 왼쪽에 고정 */}
        {!isMobile && <div style={{position:'absolute',top:120,right:sidePanel?840:420,zIndex:1001,display:'flex',flexDirection:'column',gap:4,transition:'right .3s cubic-bezier(.16,1,.3,1)'}}>
          <button
            onClick={() => setSidePanel(sidePanel === 'hotspots' ? null : 'hotspots')}
            style={{
              writingMode:'vertical-rl',textOrientation:'mixed',
              padding:'16px 7px',fontSize:11,fontWeight:600,letterSpacing:'1px',
              background: sidePanel === 'hotspots' ? '#c8856a' : 'rgba(250,248,245,.92)',
              color: sidePanel === 'hotspots' ? '#fff' : '#9a8070',
              border:'none',borderRadius:'10px 0 0 10px',
              cursor:'pointer',backdropFilter:'blur(8px)',
              transition:'all .2s',boxShadow:'-2px 2px 12px rgba(0,0,0,.12)'
            }}
            onMouseEnter={e=>{if(sidePanel!=='hotspots'){e.currentTarget.style.background='rgba(250,248,245,1)';e.currentTarget.style.color='#c8856a'}}}
            onMouseLeave={e=>{if(sidePanel!=='hotspots'){e.currentTarget.style.background='rgba(250,248,245,.92)';e.currentTarget.style.color='#9a8070'}}}
          >{t('hotspots')}</button>
          <button
            onClick={() => setSidePanel(sidePanel === 'restaurants' ? null : 'restaurants')}
            style={{
              writingMode:'vertical-rl',textOrientation:'mixed',
              padding:'16px 7px',fontSize:11,fontWeight:600,letterSpacing:'1px',
              background: sidePanel === 'restaurants' ? '#c8856a' : 'rgba(250,248,245,.92)',
              color: sidePanel === 'restaurants' ? '#fff' : '#9a8070',
              border:'none',borderRadius:'10px 0 0 10px',
              cursor:'pointer',backdropFilter:'blur(8px)',
              transition:'all .2s',boxShadow:'-2px 2px 12px rgba(0,0,0,.12)'
            }}
            onMouseEnter={e=>{if(sidePanel!=='restaurants'){e.currentTarget.style.background='rgba(250,248,245,1)';e.currentTarget.style.color='#c8856a'}}}
            onMouseLeave={e=>{if(sidePanel!=='restaurants'){e.currentTarget.style.background='rgba(250,248,245,.92)';e.currentTarget.style.color='#9a8070'}}}
          >{t('foodTab').replace('🍽','').trim()}</button>
        </div>}

        {/* 사이드 슬라이드 패널 (핫플/맛집 리스트) */}
        {sidePanel && (
          <div style={{
            position:'absolute',top:0,right:isMobile?0:420,bottom:0,width:isMobile?'100%':420,zIndex:isMobile?1002:1000,
            background:'#faf8f5',borderLeft:isMobile?'none':'1px solid #e8e2da',
            overflowY:'auto',
            boxShadow:isMobile?'none':'-8px 0 24px rgba(0,0,0,.08)',
            animation:'sidePanelIn .3s cubic-bezier(.16,1,.3,1)'
          }}>
            {/* 헤더 */}
            <div style={{position:'sticky',top:0,zIndex:10,padding:'16px 16px 12px',background:'linear-gradient(white 87%,transparent)',borderBottom:'1px solid #f1f5f9'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:16,fontWeight:700,color:'#1a1714'}}>
                    {sidePanel === 'hotspots' ? t('hotspots') : foodCategory === 'cafe' ? t('foodCafe') : foodCategory === 'bar' ? t('foodBar') : t('courseRestaurant')}
                  </span>
                  <span style={{fontSize:11,color:'#b0a89e',fontWeight:400}}>
                    {sidePanel === 'hotspots' ? hotspots.length : restaurants.length}{t('coursePlace')}
                  </span>
                </div>
                <button onClick={()=>setSidePanel(null)}
                  style={{background:'#f5f0ea',border:'none',color:'#b0a89e',width:30,height:30,borderRadius:8,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#ede7de'}
                  onMouseLeave={e=>e.currentTarget.style.background='#f5f0ea'}
                >✕</button>
              </div>
              {/* 맛집 카테고리 탭 */}
              {sidePanel === 'restaurants' && (
                <div style={{display:'flex',gap:4,marginTop:10,background:'#f5f0ea',borderRadius:8,padding:3}}>
                  {[
                    {key:'restaurant', label:t('foodRestaurant')},
                    {key:'cafe', label:t('foodCafe')},
                    {key:'bar', label:t('foodBar')},
                  ].map(cat => (
                    <button key={cat.key}
                      onClick={() => setFoodCategory(cat.key)}
                      style={{
                        flex:1,padding:'6px 0',fontSize:11,fontWeight:foodCategory===cat.key?600:400,
                        background:foodCategory===cat.key?'#fff':'none',
                        color:foodCategory===cat.key?'#1a1714':'#b0a89e',
                        border:'none',borderRadius:6,cursor:'pointer',transition:'all .15s'
                      }}
                    >{cat.label}</button>
                  ))}
                </div>
              )}
            </div>

            {/* 리스트 */}
            <div style={{padding:'12px 14px'}}>
              {loadingPlaces ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:60}}>
                  <div style={{width:28,height:28,borderRadius:'50%',border:'2px solid #e0d9d0',borderTopColor:'#c8856a',animation:'spin .7s linear infinite'}}/>
                </div>
              ) : (sidePanel === 'hotspots' ? hotspots : restaurants).length > 0 ? (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {(sidePanel === 'hotspots' ? hotspots : restaurants).map((place, idx) => (
                    <a key={idx}
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id || ''}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        textDecoration:'none',background:'white',
                        border:'1px solid #ede8e0',borderRadius:10,
                        overflow:'hidden',cursor:'pointer',transition:'all .2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#c8b0a0'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(51,65,85,0.15)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#ede8e0'
                        e.currentTarget.style.boxShadow = 'none'
                      }}>
                      <div style={{display:'flex',gap:10,padding:10,alignItems:'center'}}>
                        {place.photos && place.photos.length > 0 ? (
                          <img
                            src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photo_reference=${place.photos[0].photo_reference}&key=${import.meta.env.VITE_GOOGLE_API_KEY}`}
                            alt={place.name}
                            style={{width:66,height:66,borderRadius:8,objectFit:'cover',flexShrink:0}}
                          />
                        ) : (
                          <div style={{width:66,height:66,borderRadius:8,background:'#f5f0ea',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:'#c8b8a8',flexShrink:0,letterSpacing:'.2px'}}>
                            {sidePanel === 'hotspots' ? 'Place' : foodCategory === 'cafe' ? 'Café' : foodCategory === 'bar' ? 'Bar' : 'Food'}
                          </div>
                        )}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:'#1a1714',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {place.name}
                          </div>
                          {place.rating && (
                            <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                              <span style={{fontSize:11,color:'#c8a870',fontWeight:600}}>★ {place.rating}</span>
                              {place.user_ratings_total && (
                                <span style={{fontSize:9,color:'#c8b8a8'}}>({place.user_ratings_total.toLocaleString()})</span>
                              )}
                            </div>
                          )}
                          {sidePanel === 'restaurants' && place.price_level && (
                            <div style={{fontSize:10,color:'#c8b8a8',marginBottom:2}}>{'$'.repeat(place.price_level)}</div>
                          )}
                          {place.vicinity && (
                            <div style={{fontSize:10,color:'#b0a89e',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              {place.vicinity}
                            </div>
                          )}
                          {place.opening_hours && (
                            <div style={{fontSize:9,color: place.opening_hours.open_now ? '#6fa870' : '#c07060',fontWeight:600,marginTop:3}}>
                              {place.opening_hours.open_now ? t('openNow') : t('closedNow')}
                            </div>
                          )}
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:4,flexShrink:0}}>
                          <button onClick={e=>{e.preventDefault();e.stopPropagation();addToCourse({source:sidePanel==='hotspots'?'hotspot':'restaurant',name:place.name,displayName:place.name,cityName:selectedCity?._koName||selectedCity?.name,cityDisplayName:getCityName(selectedCity?._koName||selectedCity?.name),rating:place.rating,place_id:place.place_id,vicinity:place.vicinity,lat:selectedCity?.lat,lng:selectedCity?.lng,emoji:sidePanel==='hotspots'?'📍':foodCategory==='cafe'?'☕':foodCategory==='bar'?'🍻':'🍽️',photo_ref:place.photos?.[0]?.photo_reference||null})}}
                            style={{background:isInCourse(place.name,sidePanel==='hotspots'?'hotspot':'restaurant')?'#c8856a':'#f5f0ea',border:isInCourse(place.name,sidePanel==='hotspots'?'hotspot':'restaurant')?'none':'1px solid #e0d9d0',color:isInCourse(place.name,sidePanel==='hotspots'?'hotspot':'restaurant')?'white':'#c8b8a8',width:28,height:28,borderRadius:6,cursor:'pointer',fontSize:13,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}
                            title={t("courseAddToTrip")}>{isInCourse(place.name,sidePanel==='hotspots'?'hotspot':'restaurant')?'✓':'＋'}</button>
                          <button onClick={e=>{e.preventDefault();e.stopPropagation();toggleFav({type:sidePanel==='hotspots'?'hotspot':'restaurant',name:place.name,place_id:place.place_id,rating:place.rating,user_ratings_total:place.user_ratings_total,vicinity:place.vicinity,cityDisplayName:getCityName(selectedCity?._koName||selectedCity?.name)})}}
                            style={{background:isFav(sidePanel==='hotspots'?'hotspot':'restaurant',place.name)?'#fef3c7':'#f5f0ea',border:isFav(sidePanel==='hotspots'?'hotspot':'restaurant',place.name)?'1px solid #f0c040':'1px solid #e0d9d0',color:isFav(sidePanel==='hotspots'?'hotspot':'restaurant',place.name)?'#c8a020':'#c8b8a8',width:28,height:28,borderRadius:6,cursor:'pointer',fontSize:12,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}
                            title={t("favToggle")}>{isFav(sidePanel==='hotspots'?'hotspot':'restaurant',place.name)?'★':'☆'}</button>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div style={{textAlign:'center',padding:50,color:'#94a3b8',fontSize:13}}>
                  {sidePanel === 'hotspots' ? t('hotspots') : foodCategory === 'cafe' ? t('foodCafe') : foodCategory === 'bar' ? t('foodBar') : t('courseRestaurant')} {t('noData')}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="panel" style={{position:'absolute',top:0,right:0,bottom:0,width:isMobile?'100%':420,zIndex:1000,background:'white',borderLeft:isMobile?'none':'1.5px solid #e2e8f0',overflowY:'auto',boxShadow:isMobile?'none':'-12px 0 40px rgba(0,0,0,.15)'}}>
          <div style={{position:'sticky',top:0,zIndex:10,padding:'20px 20px 14px',background:'linear-gradient(white 87%,transparent)'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
              <div>
                <div style={{fontSize:11,color:'#94a3b8',letterSpacing:'2px',textTransform:'uppercase',marginBottom:4}}>
                  {selectedCity?.emoji || '📍'} {countryKo}
                </div>
                <div style={{fontSize:26,fontWeight:800,letterSpacing:'-.5px',color:'#0f172a'}}>{getCityName(selectedCity?._koName || selectedCity?.name) || ''}</div>
              </div>
              <div style={{display:'flex',gap:5,flexShrink:0}}>
                <button onClick={()=>{const c=allCitiesFlat.find(x=>x.name===(selectedCity?._koName||selectedCity?.name));if(c){setAiCity(c);setShowAiModal(true)}}}
                  style={{background:'#f5f0ea',border:'1px solid #e0d9d0',color:'#c8856a',width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:9,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s',letterSpacing:0}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#c8856a';e.currentTarget.style.color='white';e.currentTarget.style.borderColor='#c8856a'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#f5f0ea';e.currentTarget.style.color='#c8856a';e.currentTarget.style.borderColor='#e0d9d0'}}
                  title={t("aiAutoGen")}>AI</button>
                <button onClick={()=>addToCourse({source:'city',name:selectedCity?._koName||selectedCity?.name,displayName:getCityName(selectedCity?._koName||selectedCity?.name),cityName:selectedCity?._koName||selectedCity?.name,cityDisplayName:getCityName(selectedCity?._koName||selectedCity?.name),emoji:selectedCity?.emoji||'📍',lat:selectedCity?.lat,lng:selectedCity?.lng,rating:null})}
                  style={{background:isInCourse(selectedCity?._koName||selectedCity?.name,'city')?'#c8856a':'#f5f0ea',border:isInCourse(selectedCity?._koName||selectedCity?.name,'city')?'none':'1px solid #e0d9d0',color:isInCourse(selectedCity?._koName||selectedCity?.name,'city')?'white':'#b0a89e',width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}
                  title={t("courseAddToTrip")}>{isInCourse(selectedCity?._koName||selectedCity?.name,'city')?'✓':'＋'}</button>
                <button onClick={()=>toggleFav({type:'city',name:selectedCity?._koName||selectedCity?.name,_koName:selectedCity?._koName||selectedCity?.name,displayName:getCityName(selectedCity?._koName||selectedCity?.name),emoji:selectedCity?.emoji,color:selectedCity?.color,countryEn:selectedCity?.countryEn,countryName:countryKo,lat:selectedCity?.lat,lng:selectedCity?.lng})}
                  style={{background:isFav('city',selectedCity?._koName||selectedCity?.name)?'#fef3c7':'#f5f0ea',border:isFav('city',selectedCity?._koName||selectedCity?.name)?'1px solid #f0c040':'1px solid #e0d9d0',color:isFav('city',selectedCity?._koName||selectedCity?.name)?'#c8a020':'#b0a89e',width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}
                  title={t("favToggle")}>{isFav('city',selectedCity?._koName||selectedCity?.name)?'★':'☆'}</button>
                <button onClick={closePanel}
                  style={{background:'#f5f0ea',border:'1px solid #e0d9d0',color:'#b0a89e',width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .2s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#e8e0d6'}
                  onMouseLeave={e=>e.currentTarget.style.background='#f5f0ea'}>✕</button>
              </div>
            </div>
            {cityData?.weather && !loading && (
              <div style={{display:'flex',alignItems:'center',gap:12,background:'#f8fafc',borderRadius:12,padding:'11px 14px',border:'1.5px solid #e2e8f0'}}>
                <span style={{fontSize:28}}>{cityData.weather.icon || '🌤️'}</span>
                <div>
                  <div style={{fontSize:20,fontWeight:700,color:'#0f172a'}}>{cityData.weather.temp !== undefined ? `${cityData.weather.temp}°C` : '—'}</div>
                  <div style={{fontSize:11,color:'#94a3b8'}}>{cityData.weather.condition || ''}</div>
                </div>
                <div style={{marginLeft:'auto',textAlign:'right'}}>
                  <div style={{fontSize:13,color:'#475569'}}>💧 {cityData.weather.humidity !== undefined ? `${cityData.weather.humidity}%` : '—'}</div>
                  <div style={{fontSize:11,color:'#94a3b8'}}>{t('humidity')}</div>
                </div>
              </div>
            )}
          </div>
          {/* 모바일 전용 탭 (핫플/맛집) */}
          {isMobile && (
            <div style={{display:'flex',gap:6,padding:'0 20px 10px',borderBottom:'1px solid #f1f5f9'}}>
              <button onClick={()=>setSidePanel(sidePanel==='hotspots'?null:'hotspots')}
                style={{flex:1,padding:'8px 0',fontSize:12,fontWeight:600,borderRadius:10,border:'none',cursor:'pointer',
                  background:sidePanel==='hotspots'?'#c8856a':'#f5f0ea',color:sidePanel==='hotspots'?'#fff':'#9a8070',transition:'all .2s'}}>
                {t('hotspots')}
              </button>
              <button onClick={()=>setSidePanel(sidePanel==='restaurants'?null:'restaurants')}
                style={{flex:1,padding:'8px 0',fontSize:12,fontWeight:600,borderRadius:10,border:'none',cursor:'pointer',
                  background:sidePanel==='restaurants'?'#c8856a':'#f5f0ea',color:sidePanel==='restaurants'?'#fff':'#9a8070',transition:'all .2s'}}>
                {t('foodTab').replace('🍽','').trim()}
              </button>
            </div>
          )}
          <div style={{padding:'0 20px 40px'}}>
            {cityData ? (
              <>
                {loading && (
                  <div style={{display:'flex',alignItems:'center',gap:8,background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:10,padding:'10px 14px',marginBottom:14}}>
                    <div style={{width:16,height:16,borderRadius:'50%',border:'2px solid #bae6fd',borderTopColor:'#0ea5e9',animation:'spin .7s linear infinite',flexShrink:0}}/>
                    <span style={{fontSize:12,color:'#0369a1',fontWeight:600}}>{t('loadingShort')}</span>
                  </div>
                )}

                {/* AI 실패 시 재시도 버튼 */}
                {cityData.loadFailed ? (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:280,gap:16,textAlign:'center'}}>
                    <div style={{fontSize:40}}>🔄</div>
                    <div style={{fontSize:14,color:'#64748b',lineHeight:1.6}}>{t('retryMsg').split('\n').map((l,i)=><span key={i}>{l}{i===0&&<br/>}</span>)}</div>
                    <button
                      onClick={() => { setCityData(null); setLoading(true); fetchCityData(cityData.city || selectedCity) }}
                      style={{background:'#3b82f6',color:'white',border:'none',borderRadius:12,padding:'12px 28px',cursor:'pointer',fontSize:14,fontWeight:700,boxShadow:'0 4px 12px rgba(59,130,246,0.4)'}}>
                      {t('retry')}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 도시 설명 - 번역 있으면 표시, ko모드면 한국어, 번역 없으면 숨김 */}
                    {(() => {
                      const cityKey = selectedCity?._koName || selectedCity?.name
                      const desc = lang === 'ko'
                        ? cityData.description
                        : (trDesc(cityKey) || null)
                      return desc ? (
                        <p style={{fontSize:13.5,color:'#475569',lineHeight:1.8,margin:'0 0 20px',borderLeft:`3px solid ${selectedCity?.color||'#3b82f6'}`,paddingLeft:14}}>
                          {desc}
                        </p>
                      ) : null
                    })()}

                    {/* 공유 버튼 */}
                    <div style={{display:'flex',gap:8,marginTop:16,marginBottom:16,position:'relative'}}>
                      <button
                        onClick={() => copyLink(selectedCity)}
                        style={{
                          flex:1,padding:'10px 14px',background:'#f8fafc',
                          border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:13,fontWeight:600,
                          color:'#64748b',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all .2s'
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.background='#3b82f6';e.currentTarget.style.color='white';e.currentTarget.style.borderColor='#3b82f6'}}
                        onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.color='#64748b';e.currentTarget.style.borderColor='#e2e8f0'}}
                      >{t('linkCopy')}</button>
                      <button
                        onClick={() => setShowSharePopup(v => !v)}
                        style={{
                          flex:1,padding:'10px 14px',background:'#3b82f6',border:'none',borderRadius:10,
                          fontSize:13,fontWeight:600,color:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all .2s'
                        }}
                        onMouseEnter={e=>e.currentTarget.style.background='#2563eb'}
                        onMouseLeave={e=>e.currentTarget.style.background='#3b82f6'}
                      >{t('shareBtn')}</button>

                      {/* 공유 팝업 */}
                      {showSharePopup && (
                        <div style={{
                          position:'absolute',top:'calc(100% + 8px)',left:0,right:0,
                          background:'white',borderRadius:14,border:'1.5px solid #e2e8f0',
                          boxShadow:'0 12px 36px rgba(0,0,0,.15)',padding:16,zIndex:100,
                          animation:'sharePopIn .25s cubic-bezier(.16,1,.3,1)'
                        }}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                            <span style={{fontSize:14,fontWeight:700,color:'#1e293b'}}>{t('shareTitle')}</span>
                            <button onClick={()=>setShowSharePopup(false)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#94a3b8',padding:0,lineHeight:1}}>✕</button>
                          </div>
                          <div style={{display:'flex',gap:12,justifyContent:'center'}}>
                            {[
                              { label:'KakaoTalk', emoji:'💬', bg:'#FEE500', color:'#3C1E1E',
                                action: () => {
                                  const url = shareCity(selectedCity)
                                  const text = getCityName(selectedCity._koName||selectedCity.name) + t('shareTitleSuffix')
                                  const mobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
                                  if (mobile) {
                                    window.location.href = `kakaotalk://msg/text/${encodeURIComponent(text + '\n' + url)}`
                                    setTimeout(() => {
                                      navigator.clipboard.writeText(url).then(() => alert(t('linkCopiedKakao'))).catch(()=>{})
                                    }, 1500)
                                  } else {
                                    navigator.clipboard.writeText(url).then(() => alert(t('linkCopiedKakao'))).catch(()=>{})
                                  }
                                  setShowSharePopup(false)
                                }
                              },
                              { label:'Instagram', emoji:'📸', bg:'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color:'#fff',
                                action: () => {
                                  const url = shareCity(selectedCity)
                                  navigator.clipboard.writeText(url).then(() => {
                                    alert(t('linkCopiedInsta'))
                                    const mobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
                                    if (mobile) window.open('instagram://', '_blank')
                                  }).catch(()=>{})
                                  setShowSharePopup(false)
                                }
                              },
                              { label:'X', emoji:'𝕏', bg:'#000', color:'#fff',
                                action: () => {
                                  const url = shareCity(selectedCity)
                                  const text = getCityName(selectedCity._koName||selectedCity.name) + t('shareTitleSuffix')
                                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
                                  setShowSharePopup(false)
                                }
                              },
                              { label:'Facebook', emoji:'f', bg:'#1877F2', color:'#fff',
                                action: () => {
                                  const url = shareCity(selectedCity)
                                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
                                  setShowSharePopup(false)
                                }
                              },
                            ].map((btn,i) => (
                              <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                                <button onClick={btn.action} title={btn.label}
                                  style={{
                                    width:52,height:52,borderRadius:'50%',border:'none',
                                    background:btn.bg,color:btn.color,
                                    fontSize: btn.label==='Facebook' ? 22 : btn.label==='X' ? 18 : 24,
                                    fontWeight: btn.label==='Facebook' ? 800 : 400,
                                    cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
                                    boxShadow:'0 2px 8px rgba(0,0,0,.1)',transition:'transform .15s'
                                  }}
                                  onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'}
                                  onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                                >{btn.emoji}</button>
                                <span style={{fontSize:10,color:'#64748b',fontWeight:500}}>{btn.label}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{marginTop:14,paddingTop:12,borderTop:'1px solid #f1f5f9'}}>
                            <button onClick={() => { copyLink(selectedCity); setShowSharePopup(false) }}
                              style={{
                                width:'100%',padding:'10px',background:'#f8fafc',border:'1.5px solid #e2e8f0',
                                borderRadius:10,fontSize:13,fontWeight:600,color:'#64748b',cursor:'pointer',
                                display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all .2s'
                              }}
                              onMouseEnter={e=>{e.currentTarget.style.background='#e2e8f0'}}
                              onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc'}}
                            >{t('linkCopy')}</button>
                          </div>
                        </div>
                      )}
                    </div>


                    {cityData.spots?.length > 0 && (
                      <>
                        <div style={{fontSize:10,color:'#94a3b8',letterSpacing:'2.5px',textTransform:'uppercase',marginBottom:12}}>
                          {t('spots')} · {cityData.spots.length}{t('spotsUnit')}
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:11}}>
                          {cityData.spots.map((spot,i)=>(
                            <div key={i} className="card"
                              onClick={()=>setSelectedSpot(selectedSpot?.name===spot.name?null:spot)}
                              style={{borderRadius:14,overflow:'hidden',background:'white',border:`1.5px solid ${selectedSpot?.name===spot.name?(selectedCity?.color||'#3b82f6'):'#e2e8f0'}`,boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
                              <div style={{height: selectedSpot?.name===spot.name ? 200 : 142,overflow:'hidden',position:'relative',transition:'height .3s'}}>
                                {selectedSpot?.name===spot.name ? (
                                  <SpotGallery
                                    wikiTitle={spot.wikiTitle}
                                    spotName={spot.name}
                                    cityName={CITY_I18N[selectedCity?._koName||selectedCity?.name]?.[0] || selectedCity?.name}
                                    fallback={spot.img || getImg(spot.type)}
                                    style={{width:'100%',height:'100%'}}
                                  />
                                ) : (
                                  <SpotImage
                                    className="cimg"
                                    wikiTitle={spot.wikiTitle}
                                    spotName={spot.name}
                                    cityName={CITY_I18N[selectedCity?._koName||selectedCity?.name]?.[0] || selectedCity?.name}
                                    alt={spot.name}
                                    fallback={spot.img || getImg(spot.type)}
                                    style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
                                  />
                                )}
                                {selectedSpot?.name!==spot.name && <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,.72) 0%,transparent 55%)'}}/>}
                                <button onClick={e=>{e.stopPropagation();toggleFav({type:'spot',name:spot.name,cityName:selectedCity?._koName||selectedCity?.name,cityDisplayName:getCityName(selectedCity?._koName||selectedCity?.name),wikiTitle:spot.wikiTitle,spotType:spot.type,rating:spot.rating})}}
                                  style={{position:'absolute',top:8,right:8,width:30,height:30,borderRadius:8,background:isFav('spot',spot.name)?'rgba(251,191,36,.9)':'rgba(0,0,0,.4)',border:'none',color:isFav('spot',spot.name)?'white':'rgba(255,255,255,.7)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)',transition:'all .2s',zIndex:2}}
                                  title={t("favToggle")}>{isFav('spot',spot.name)?'★':'☆'}</button>
                                <button onClick={e=>{e.stopPropagation();addToCourse({source:'spot',name:spot.name,displayName:trSpot(selectedCity?._koName||selectedCity?.name,spot.name)?.name||spot.name,cityName:selectedCity?._koName||selectedCity?.name,cityDisplayName:getCityName(selectedCity?._koName||selectedCity?.name),type:spot.type,rating:spot.rating,wikiTitle:spot.wikiTitle,lat:selectedCity?.lat,lng:selectedCity?.lng,emoji:spot.type==='자연'?'🌿':spot.type==='역사'?'🏛️':spot.type==='음식'?'🍽️':spot.type==='문화'?'🎭':'📍'})}}
                                  style={{position:'absolute',top:8,right:44,width:30,height:30,borderRadius:8,background:isInCourse(spot.name,'spot')?'rgba(59,130,246,.9)':'rgba(0,0,0,.4)',border:'none',color:'white',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)',transition:'all .2s',zIndex:2,animation:isInCourse(spot.name,'spot')?'coursePop .3s':'none'}}
                                  title={t("courseAddToTrip")}>{isInCourse(spot.name,'spot')?'✓':'＋'}</button>

                                <div style={{position:'absolute',bottom:10,left:12,right:12,display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
                                  <div>
                                    <div style={{fontSize:13.5,fontWeight:700,color:'white',textShadow:'0 1px 4px rgba(0,0,0,.6)'}}>{trSpot(selectedCity?._koName||selectedCity?.name,spot.name)?.name || spot.name}</div>
                                    <div style={{display:'inline-block',fontSize:10,padding:'2px 9px',borderRadius:20,background:TYPE_COLORS[spot.type]||'#64748b',color:'white',marginTop:4,fontWeight:700}}>{getSpotType(spot.type)}</div>
                                  </div>
                                  {spot.rating > 0 && (
                                    <a href={`https://www.google.com/maps/search/${encodeURIComponent(spot.wikiTitle || spot.name)}+${encodeURIComponent(selectedCity?.name || '')}`}
                                      target="_blank" rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      style={{textDecoration:'none',display:'flex',alignItems:'center',gap:3}}
                                      title={t("mapsRating")}
                                    >
                                      <span style={{fontSize:13,color:'#fbbf24',fontWeight:700}}>★ {spot.rating}</span>
                                    </a>
                                  )}
                                </div>
                              </div>

                              {selectedSpot?.name===spot.name && (
                                <div style={{padding:'12px 14px',borderTop:`1px solid ${(selectedCity?.color||'#3b82f6')}22`,background:`${selectedCity?.color||'#3b82f6'}07`}}>
                                  <p style={{fontSize:12.5,color:'#475569',lineHeight:1.75,marginBottom:10}}>{trSpot(selectedCity?._koName||selectedCity?.name,spot.name)?.desc || (lang === 'ko' ? spot.desc : '')}</p>
                                  {/* 참고 정보 + Google 최신 정보 */}
                                  {(spot.openTime || spot.price) && (
                                    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8,alignItems:'center'}}>
                                      {spot.openTime && (
                                        <div style={{display:'flex',alignItems:'center',gap:4,background:'white',borderRadius:8,padding:'4px 10px',fontSize:11,color:'#475569',border:'1px solid #e2e8f0'}}>
                                          🕐 {translateSpotField(spot.openTime, lang)}
                                        </div>
                                      )}
                                      {spot.price && (
                                        <div style={{display:'flex',alignItems:'center',gap:4,background:'white',borderRadius:8,padding:'4px 10px',fontSize:11,color:'#475569',border:'1px solid #e2e8f0'}}>
                                          🎫 {translateSpotField(spot.price, lang)}
                                        </div>
                                      )}
                                      <span style={{fontSize:9,color:'#94a3b8',fontStyle:'italic'}}>{t('refNote')}</span>
                                    </div>
                                  )}
                                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                                    {/* Google Maps 최신 운영정보 + 리뷰 (메인 버튼) */}
                                    <a
                                      href={`https://www.google.com/maps/search/${encodeURIComponent(spot.wikiTitle || spot.name)}+${encodeURIComponent(selectedCity?.name || '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      style={{
                                        display:'inline-flex',alignItems:'center',gap:6,
                                        background:'#fff',color:'#1a73e8',borderRadius:8,
                                        padding:'7px 14px',fontSize:12,fontWeight:700,
                                        textDecoration:'none',
                                        border:'1.5px solid #dadce0',
                                        boxShadow:'0 1px 4px rgba(0,0,0,0.08)'
                                      }}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ea4335"/></svg>
                                      {t('mapsBtn')}
                                    </a>
                                  {spot.website && (
                                    <a
                                      href={spot.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      style={{
                                        display:'inline-flex',alignItems:'center',gap:6,
                                        background: spot.website?.includes('wikipedia.org') ? '#475569' : (selectedCity?.color || '#3b82f6'),
                                        color:'white',borderRadius:8,
                                        padding:'7px 14px',fontSize:12,fontWeight:700,
                                        textDecoration:'none',
                                        boxShadow:`0 2px 8px ${spot.website?.includes('wikipedia.org') ? '#47556944' : (selectedCity?.color || '#3b82f6') + '44'}`
                                      }}
                                    >
                                      {spot.website?.includes('wikipedia.org') ? `📖 ${t('wikiDetail')}` : `🌐 ${t('official')}`}
                                    </a>
                                  )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:320,gap:16}}>
                <div style={{width:38,height:38,borderRadius:'50%',border:'3px solid #e2e8f0',borderTopColor:(selectedCity?.color||'#3b82f6'),animation:'spin .8s linear infinite'}}/>
                <div style={{fontSize:13,color:'#94a3b8'}}>{t('loading')}</div>
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {/* ── AI 코스 생성 모달 ── */}
      {showAiModal && (
        <>
          <div onClick={()=>setShowAiModal(false)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.5)',zIndex:1300,backdropFilter:'blur(4px)'}}/>
          <div style={{
            position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
            width:Math.min(440,typeof window!=='undefined'?window.innerWidth-40:400),
            background:'white',borderRadius:22,border:'1.5px solid #e2e8f0',
            boxShadow:'0 24px 80px rgba(0,0,0,.3)',zIndex:1301,overflow:'hidden',
            animation:'aiModalIn .3s cubic-bezier(.16,1,.3,1)'
          }}>
            {/* 모달 헤더 */}
            <div style={{padding:'20px 24px 16px',background:'#faf8f5',borderBottom:'1px solid #e8e2da'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:38,height:38,borderRadius:10,background:'#c8856a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'white',fontWeight:700}}>AI</div>
                  <div>
                    <div style={{fontSize:16,fontWeight:700,color:'#1a1714'}}>{t('aiTitle')}</div>
                    <div style={{fontSize:11,color:'#b0a89e',marginTop:1}}>{t('aiSubtitle')}</div>
                  </div>
                </div>
                <button onClick={()=>setShowAiModal(false)} style={{background:'#f0ebe4',border:'none',color:'#b0a89e',width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#e8e0d6'}
                  onMouseLeave={e=>e.currentTarget.style.background='#f0ebe4'}>✕</button>
              </div>
            </div>

            {/* 모달 내용 */}
            <div style={{padding:'18px 24px 24px',display:'flex',flexDirection:'column',gap:16,background:'#faf8f5'}}>
              {/* 도시 선택 */}
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'#1a1714',marginBottom:6}}>{t('aiSelectCity')}</div>
                {aiCity ? (
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'#f5f0ea',border:'1px solid #e0d9d0',borderRadius:10}}>
                    {getFlagImg(COUNTRY_INFO[aiCity.countryEn]?.emoji) ? (
                      <img src={getFlagImg(COUNTRY_INFO[aiCity.countryEn]?.emoji)} alt="" style={{width:22,height:16,objectFit:'cover',borderRadius:2,border:'1px solid #e2e8f0',flexShrink:0}}/>
                    ) : (
                      <span style={{fontSize:18}}>{aiCity.emoji||'📍'}</span>
                    )}
                    <div style={{flex:1}}>
                      <span style={{fontSize:14,fontWeight:600,color:'#1a1714'}}>{getCityName(aiCity.name)}</span>
                      <span style={{fontSize:11,color:'#b0a89e',marginLeft:6}}>{aiCity.countryKo}</span>
                    </div>
                    <button onClick={()=>{setAiCity(null);setAiCitySearch('')}} style={{background:'none',border:'none',color:'#c8b8a8',cursor:'pointer',fontSize:14}}>✕</button>
                  </div>
                ) : (
                  <div style={{position:'relative'}}>
                    <input value={aiCitySearch} onChange={e=>setAiCitySearch(e.target.value)}
                      placeholder={t("aiSearchCity")}
                      style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:13,outline:'none',boxSizing:'border-box',transition:'border .2s'}}
                      onFocus={e=>e.currentTarget.style.borderColor='#3b82f6'}
                      onBlur={e=>e.currentTarget.style.borderColor='#e2e8f0'}/>
                    {aiCityResults.length > 0 && (
                      <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'white',border:'1.5px solid #e2e8f0',borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,.12)',maxHeight:200,overflowY:'auto',zIndex:10}}>
                        {aiCityResults.map((c,i)=>(
                          <div key={i} onClick={()=>{setAiCity(c);setAiCitySearch('')}}
                            style={{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',cursor:'pointer',transition:'background .1s',borderBottom:i<aiCityResults.length-1?'1px solid #f8fafc':'none'}}
                            onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                            onMouseLeave={e=>e.currentTarget.style.background='white'}>
                            {getFlagImg(COUNTRY_INFO[c.countryEn]?.emoji) ? (
                              <img src={getFlagImg(COUNTRY_INFO[c.countryEn]?.emoji)} alt="" style={{width:20,height:14,objectFit:'cover',borderRadius:2,border:'1px solid #e2e8f0',flexShrink:0}}/>
                            ) : (
                              <span style={{fontSize:16}}>{c.emoji||'📍'}</span>
                            )}
                            <span style={{fontSize:13,fontWeight:600,color:'#1e293b'}}>{c.name}</span>
                            <span style={{fontSize:11,color:'#94a3b8'}}>{c.countryKo}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 테마 */}
              <div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#1a1714'}}>{t('aiTheme')}</div>
                  <span style={{fontSize:10,color:'#b0a89e',fontWeight:400}}>({t('multiSelect')})</span>
                </div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  {[{k:'종합',l:t('aiThemeAll')},{k:'역사',l:t('aiThemeHistory')},{k:'자연',l:t('aiThemeNature')},{k:'음식',l:t('aiThemeFood')},{k:'핫플',l:t('aiThemeHotspot')},{k:'맛집',l:t('aiThemeRestaurant')}].map(tm=>(
                    <button key={tm.k} onClick={()=>toggleAiTheme(tm.k)} style={{
                      padding:'7px 14px',fontSize:12,fontWeight:aiTheme.includes(tm.k)?600:400,
                      background:aiTheme.includes(tm.k)?'#c8856a':'#f5f0ea',
                      color:aiTheme.includes(tm.k)?'white':'#a89080',
                      border:aiTheme.includes(tm.k)?'none':'1px solid #e0d9d0',borderRadius:20,cursor:'pointer',
                      transition:'all .15s'
                    }}>{tm.l}</button>
                  ))}
                </div>
              </div>

              {/* 일수 + 강도 */}
              <div style={{display:'flex',gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#1a1714',marginBottom:6}}>{t('aiDaysLabel')}</div>
                  <div style={{display:'flex',gap:4}}>
                    {[1,2,3,4,5].map(n=>(
                      <button key={n} onClick={()=>setAiDays(n)} style={{
                        flex:1,padding:'9px 0',fontSize:13,fontWeight:aiDays===n?700:400,
                        background:aiDays===n?'#c8856a':'#f5f0ea',color:aiDays===n?'white':'#a89080',
                        border:aiDays===n?'none':'1px solid #e0d9d0',borderRadius:8,cursor:'pointer',transition:'all .15s'
                      }}>{n}{t('aiDayUnit')}</button>
                    ))}
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#1a1714',marginBottom:6}}>{t('aiHoursLabel')}</div>
                  <div style={{display:'flex',gap:4}}>
                    {[1,2,4,6,8].map(h=>(
                      <button key={h} onClick={()=>setAiHours(h)} style={{
                        flex:1,padding:'9px 0',fontSize:12,fontWeight:aiHours===h?700:400,
                        background:aiHours===h?'#c8856a':'#f5f0ea',color:aiHours===h?'white':'#a89080',
                        border:aiHours===h?'none':'1px solid #e0d9d0',borderRadius:8,cursor:'pointer',transition:'all .15s'
                      }}>{h}{t('aiHourUnit')}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 출발일 */}
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'#1a1714',marginBottom:6}}>{t('courseDepartureOpt')}</div>
                <input type="date" value={courseTripStart} onChange={e=>saveTripStart(e.target.value)}
                  style={{width:'100%',padding:'10px 14px',border:'1px solid #e0d9d0',borderRadius:10,fontSize:13,outline:'none',boxSizing:'border-box',color:courseTripStart?'#1a1714':'#c8b8a8',fontWeight:700,cursor:'pointer',transition:'border .2s',background:'#f5f0ea'}}
                  onFocus={e=>e.currentTarget.style.borderColor='#c8856a'}
                  onBlur={e=>e.currentTarget.style.borderColor='#e0d9d0'}/>
              </div>

              {/* 이동수단 */}
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'#1a1714',marginBottom:6}}>{t('aiTransport')}</div>
                <div style={{display:'flex',gap:4,background:'#f5f0ea',borderRadius:8,padding:3}}>
                  {[{k:'transit',l:t('courseTransit')},{k:'walking',l:t('courseWalking')},{k:'driving',l:t('courseDriving')}].map(tr=>(
                    <button key={tr.k} onClick={()=>setAiTransport(tr.k)} style={{
                      flex:1,padding:'8px 0',fontSize:12,fontWeight:aiTransport===tr.k?600:400,
                      background:aiTransport===tr.k?'#fff':'none',color:aiTransport===tr.k?'#1a1714':'#b0a89e',
                      border:'none',borderRadius:6,cursor:'pointer',transition:'all .15s'
                    }}>{tr.l}</button>
                  ))}
                </div>
              </div>

              {/* 미리보기 요약 */}
              {aiCity && (
                <div style={{padding:'10px 14px',background:'#f5f0ea',border:'1px solid #e0d9d0',borderRadius:10,fontSize:12,color:'#9a8070',lineHeight:1.7}}>
                  <strong>{getCityName(aiCity.name)}</strong>{t('aiSummaryIn')} <strong>{aiDays}{t('aiDayUnit')}</strong>{t('aiSummaryDuring')} <strong>{aiTheme.map(k=>({종합:t('aiThemeAll'),역사:t('aiThemeHistory'),자연:t('aiThemeNature'),음식:t('aiThemeFood'),핫플:t('aiThemeHotspot'),맛집:t('aiThemeRestaurant')}[k]||k)).join(' + ')}</strong>,
                  {t(aiHours<=1?'aiPreview1h':aiHours<=2?'aiPreview2h':aiHours<=4?'aiPreview4h':aiHours<=6?'aiPreview6h':'aiPreview8h')} {t('aiPreviewText')}
                  {courseTripStart && <><br/>📅 {formatDate(getDayDate(0))} ~ {formatDate(getDayDate(aiDays-1))}</>}
                </div>
              )}

              {/* 생성 버튼 */}
              <button onClick={generateAiCourse} disabled={!aiCity||aiGenerating}
                style={{
                  width:'100%',padding:'14px',fontSize:14,fontWeight:700,
                  background:aiCity?'#c8856a':'#f0ebe4',
                  color:aiCity?'white':'#c8b8a8',border:'none',borderRadius:10,
                  cursor:aiCity&&!aiGenerating?'pointer':'not-allowed',
                  transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:8
                }}>
                {aiGenerating ? (
                  <><div style={{width:18,height:18,borderRadius:'50%',border:'2.5px solid rgba(255,255,255,.3)',borderTopColor:'white',animation:'spin .7s linear infinite'}}/> {t('aiGenerating')}</>
                ) : (
                  <>{t('aiGenerate')}</>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── 코스 플래너 패널 (Warm Cream) ── */}
      {showCoursePlanner && courseDays.length > 0 && (
        <div style={{position:'absolute',top:isMobile?0:72,left:0,bottom:0,width:isMobile?'100%':Math.min(500,typeof window!=='undefined'?window.innerWidth-30:480),zIndex:1100,background:'#faf8f5',borderRight:isMobile?'none':'1px solid #e8e2da',boxShadow:isMobile?'none':'16px 0 48px rgba(0,0,0,.1)',display:'flex',flexDirection:'column',animation:'coursePlannerIn .35s cubic-bezier(.16,1,.3,1)'}}>

          {/* 헤더 */}
          <div style={{padding:'20px 20px 0',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
              <div>
                <div style={{fontSize:19,fontWeight:700,color:'#1a1714',letterSpacing:'-.4px'}}>{t('coursePlanner')}</div>
                <div style={{fontSize:11,color:'#b0a89e',marginTop:3}}>
                  {courseItems.length}{t('coursePlace')} · {courseDays.length}{t('courseDay')}
                  {courseTripStart ? ` · ${formatDate(getDayDate(0))} – ${formatDate(getDayDate(courseDays.length-1))}` : ''}
                </div>
              </div>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <button onClick={downloadCoursePPT}
                  style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e0d9d0',background:'#faf8f5',fontSize:11,fontWeight:600,color:'#c8856a',cursor:'pointer',transition:'all .15s',display:'flex',alignItems:'center',gap:3}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#c8856a';e.currentTarget.style.color='white';e.currentTarget.style.borderColor='#c8856a'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#faf8f5';e.currentTarget.style.color='#c8856a';e.currentTarget.style.borderColor='#e0d9d0'}}
                >📊 {t('courseDownloadPPT')}</button>
                <button onClick={downloadCourseWord}
                  style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e0d9d0',background:'#faf8f5',fontSize:11,fontWeight:600,color:'#3b82f6',cursor:'pointer',transition:'all .15s',display:'flex',alignItems:'center',gap:3}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#3b82f6';e.currentTarget.style.color='white';e.currentTarget.style.borderColor='#3b82f6'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#faf8f5';e.currentTarget.style.color='#3b82f6';e.currentTarget.style.borderColor='#e0d9d0'}}
                >📄 {t('courseDownloadWord')}</button>
                <button
                  onClick={()=>{if(confirm(t('courseDeleteConfirm'))){
                    saveCourse([]);saveCourseDays([]);setRouteCache({});
                    setSavedCourses([]);localStorage.removeItem('atlas_saved_courses');
                    setShowCoursePlanner(false)
                  }}}
                  style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e0d9d0',background:'none',fontSize:11,fontWeight:500,color:'#b0a89e',cursor:'pointer',transition:'all .15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.color='#c0604a';e.currentTarget.style.borderColor='#e8c0b0'}}
                  onMouseLeave={e=>{e.currentTarget.style.color='#b0a89e';e.currentTarget.style.borderColor='#e0d9d0'}}
                >{t('courseDeleteAll')}</button>
                <button onClick={()=>setShowCoursePlanner(false)}
                  style={{width:30,height:30,borderRadius:6,border:'1px solid #e0d9d0',background:'none',color:'#b0a89e',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#f0ebe4'}
                  onMouseLeave={e=>e.currentTarget.style.background='none'}>✕</button>
              </div>
            </div>

            {/* 날짜 */}
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,padding:'8px 12px',background:'#f0ebe4',borderRadius:8,border:'1px solid #e0d9d0'}}>
              <span style={{fontSize:11,color:'#b0a89e',fontWeight:500,flexShrink:0}}>{t('courseDeparture')}</span>
              <input type="date" value={courseTripStart} onChange={e=>saveTripStart(e.target.value)}
                style={{flex:1,fontSize:11,border:'none',background:'none',color:'#1a1714',fontWeight:600,outline:'none',cursor:'pointer'}}/>
              {courseTripStart && <button onClick={()=>saveTripStart('')} style={{background:'none',border:'none',color:'#c8b8a8',fontSize:11,cursor:'pointer',lineHeight:1}}>✕</button>}
            </div>

            {/* 이동수단 */}
            <div style={{display:'flex',gap:2,marginBottom:14,background:'#f0ebe4',borderRadius:8,padding:3,border:'1px solid #e0d9d0'}}>
              {[{key:'transit',label:t('courseTransit')},{key:'walking',label:t('courseWalking')},{key:'driving',label:t('courseDriving')}].map(m=>(
                <button key={m.key} onClick={()=>setCourseTransport(m.key)} style={{
                  flex:1,padding:'6px 0',fontSize:11,fontWeight:600,
                  background:courseTransport===m.key?'#fff':'none',
                  color:courseTransport===m.key?'#1a1714':'#b0a89e',
                  border:'none',borderRadius:6,cursor:'pointer',transition:'all .15s'
                }}>{m.label}</button>
              ))}
            </div>

            {/* Day 탭 */}
            <div style={{display:'flex',gap:4,overflowX:'auto',paddingBottom:16,borderBottom:'1px solid #e8e2da'}}>
              {courseDays.map((_,i)=>(
                <button key={i} onClick={()=>setActiveDayTab(i)} style={{
                  padding:'5px 14px',fontSize:11,fontWeight:activeDayTab===i?700:400,
                  background:activeDayTab===i?'#c8856a':'none',
                  color:activeDayTab===i?'#fff':'#b0a89e',
                  border:activeDayTab===i?'none':'1px solid #e0d9d0',
                  borderRadius:20,cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s',flexShrink:0
                }}>
                  Day {i+1}
                  {courseTripStart && <span style={{fontSize:9,opacity:.7,marginLeft:4}}>{formatDate(getDayDate(i))}</span>}
                  <span style={{fontSize:9,opacity:.6,marginLeft:3}}>({courseDays[i].items.length})</span>
                </button>
              ))}
              <button onClick={addCourseDay}
                style={{padding:'5px 12px',fontSize:13,background:'none',color:'#c8b8a8',border:'1px dashed #d8cfc4',borderRadius:20,cursor:'pointer',flexShrink:0,transition:'all .15s'}}
                onMouseEnter={e=>{e.currentTarget.style.color='#c8856a';e.currentTarget.style.borderColor='#c8856a'}}
                onMouseLeave={e=>{e.currentTarget.style.color='#c8b8a8';e.currentTarget.style.borderColor='#d8cfc4'}}>＋</button>
            </div>
          </div>

          {/* Day 내용 */}
          <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
            {(() => {
              const day = courseDays[activeDayTab]
              if (!day) return null
              const items = day.items
              if (items.length === 0) return (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:200,color:'#c8b8a8',gap:8}}>
                  <div style={{width:40,height:40,border:'1.5px dashed #d8cfc4',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#d8cfc4'}}>+</div>
                  <span style={{fontSize:12,color:'#c8b8a8'}}>{t('courseEmptyTitle')}</span>
                  <span style={{fontSize:11,color:'#d8cfc4'}}>{t('courseEmptyDesc')}</span>
                </div>
              )
              let totalSec = 0
              for (let i = 0; i < items.length - 1; i++) {
                const rk = getRouteKey(items[i], items[i+1], courseTransport)
                if (routeCache[rk]?.durationSec) totalSec += routeCache[rk].durationSec
              }
              const totalMin = Math.round(totalSec / 60)
              const totalHr = Math.floor(totalMin / 60)
              const totalMinRem = totalMin % 60
              return (
                <>
                  {/* Day 요약 */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:12,fontWeight:700,color:'#1a1714'}}>Day {activeDayTab+1}</span>
                      {courseTripStart && <span style={{fontSize:11,color:'#c8856a'}}>{formatDate(getDayDate(activeDayTab))}</span>}
                      <span style={{fontSize:11,color:'#6b7280'}}>{items.length}{t('coursePlace')}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      {totalMin > 0 && <span style={{fontSize:11,color:'#374151',fontWeight:500}}>{totalHr > 0 ? `${totalHr}${t('courseHour')} ${totalMinRem}${t('courseMin')}` : `${totalMin}${t('courseMin')}`}</span>}
                      {loadingRoutes && <div style={{width:12,height:12,borderRadius:'50%',border:'1.5px solid #e0d9d0',borderTopColor:'#c8856a',animation:'spin .7s linear infinite'}}/>}
                      {courseDays.length > 1 && (
                        <button onClick={()=>removeCourseDay(activeDayTab)}
                          style={{fontSize:10,background:'none',border:'1px solid #e0d9d0',color:'#c8b8a8',padding:'3px 8px',borderRadius:5,cursor:'pointer',transition:'all .15s'}}
                          onMouseEnter={e=>{e.currentTarget.style.color='#c0604a';e.currentTarget.style.borderColor='#e8c0b0'}}
                          onMouseLeave={e=>{e.currentTarget.style.color='#c8b8a8';e.currentTarget.style.borderColor='#e0d9d0'}}
                        >{t('courseDelete')}</button>
                      )}
                    </div>
                  </div>

                  {/* 장소 리스트 */}
                  {items.map((item, idx) => {
                    const rk = idx < items.length - 1 ? getRouteKey(items[idx], items[idx+1], courseTransport) : null
                    const route = rk ? routeCache[rk] : null
                    return (
                      <div key={item.name+'-'+idx}>
                        <div
                          draggable
                          onDragStart={e=>{e.dataTransfer.setData('text/plain',JSON.stringify({dayIdx:activeDayTab,itemIdx:idx}));setDragItem({dayIdx:activeDayTab,itemIdx:idx})}}
                          onDragOver={e=>{e.preventDefault();e.currentTarget.style.background='#f0ebe4'}}
                          onDragLeave={e=>e.currentTarget.style.background='#fff'}
                          onDrop={e=>{e.preventDefault();e.currentTarget.style.background='#fff';try{const from=JSON.parse(e.dataTransfer.getData('text/plain'));if(from.dayIdx===activeDayTab)reorderInDay(activeDayTab,from.itemIdx,idx);else moveToDayFn(from.dayIdx,from.itemIdx,activeDayTab)}catch{};setDragItem(null)}}
                          onDragEnd={()=>setDragItem(null)}
                          style={{
                            display:'flex',alignItems:'center',gap:10,padding:'11px 12px',
                            background:'#fff',borderRadius:10,border:'1px solid #ede8e0',
                            cursor:'grab',transition:'background .1s',
                            opacity:dragItem?.dayIdx===activeDayTab&&dragItem?.itemIdx===idx?0.35:1
                          }}
                        >
                          {/* 번호 원형 */}
                          <div style={{width:24,height:24,borderRadius:'50%',flexShrink:0,background:idx===0?'#c8856a':'#e8dfd6',color:idx===0?'#fff':'#a89080',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{idx+1}</div>
                          {/* 드래그 핸들 */}
                          <span style={{fontSize:12,color:'#d8cfc4',flexShrink:0,cursor:'grab',userSelect:'none',letterSpacing:2}}>⠿</span>
                          {/* 정보 */}
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:'#1a1714',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{getCourseItemName(item)}</div>
                            <div style={{display:'flex',alignItems:'center',gap:5,marginTop:3}}>
                              <span style={{fontSize:10,color:'#6b7280'}}>{getCourseItemCity(item)}</span>
                              <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'#f5efe8',color:'#6b5c4f',fontWeight:500}}>
                                {item.source==='spot'?t('courseSpot'):item.source==='hotspot'?t('courseHotspot'):t('courseRestaurant')}
                              </span>
                              {item.rating && <span style={{fontSize:9,color:'#d97706'}}>★{item.rating}</span>}
                            </div>
                          </div>
                          {/* 이동 버튼 → 해당 도시/관광지로 바로 이동 */}
                          <button onClick={()=>{
                            const city = allCitiesFlat.find(c => c.name === item.cityName)
                            if (!city) return
                            const feat = countries.find(f => f.properties.NAME === city.countryEn)
                            if (feat) setSelectedCountry(feat)
                            setTimeout(() => {
                              handleCityClick(city)
                              if (item.source === 'spot' && item.name) {
                                setTimeout(() => {
                                  const spotData = CITY_DATA[item.cityName]
                                  const spot = spotData?.spots?.find(s => s.name === item.name)
                                  if (spot) setSelectedSpot(spot)
                                }, 800)
                              }
                            }, 200)
                            setShowCoursePlanner(false)
                          }}
                            style={{background:'none',border:'1px solid #e0d9d0',color:'#b0a89e',width:24,height:24,borderRadius:5,cursor:'pointer',fontSize:11,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}
                            onMouseEnter={e=>{e.currentTarget.style.color='#3b82f6';e.currentTarget.style.borderColor='#93c5fd';e.currentTarget.style.background='#eff6ff'}}
                            onMouseLeave={e=>{e.currentTarget.style.color='#b0a89e';e.currentTarget.style.borderColor='#e0d9d0';e.currentTarget.style.background='none'}}
                            title="이동">→</button>
                          {/* Day 이동 */}
                          {courseDays.length > 1 && (
                            <select value="" onChange={e=>{if(e.target.value!=='')moveToDayFn(activeDayTab,idx,parseInt(e.target.value));e.target.value=''}}
                              style={{width:56,fontSize:9,padding:'3px 2px',border:'1px solid #e0d9d0',borderRadius:5,color:'#b0a89e',background:'#faf8f5',cursor:'pointer',flexShrink:0}}>
                              <option value="">{t('courseMove')}</option>
                              {courseDays.map((_,di)=>di!==activeDayTab&&<option key={di} value={di}>Day {di+1}</option>)}
                            </select>
                          )}
                          {/* 삭제 */}
                          <button onClick={()=>removeFromDay(activeDayTab,idx)}
                            style={{background:'none',border:'none',color:'#d8cfc4',width:24,height:24,borderRadius:5,cursor:'pointer',fontSize:13,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}
                            onMouseEnter={e=>{e.currentTarget.style.color='#c0604a'}}
                            onMouseLeave={e=>{e.currentTarget.style.color='#d8cfc4'}}>×</button>
                        </div>

                        {/* 경로 */}
                        {idx < items.length - 1 && (
                          <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 0 5px 34px'}}>
                            {route ? (
                              <span style={{fontSize:10,color:'#64748b',fontWeight:500}}>
                                — {route.noRoute ? t('courseNoRoute') : `${route.duration} · ${route.distance}`}
                              </span>
                            ) : loadingRoutes ? (
                              <div style={{width:10,height:10,borderRadius:'50%',border:'1.5px solid #e0d9d0',borderTopColor:'#c8856a',animation:'spin .7s linear infinite'}}/>
                            ) : (
                              <span style={{fontSize:10,color:'#d8cfc4'}}>{t('courseCalc')}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </>
              )
            })()}
          </div>

          {/* 푸터 */}
          <div style={{padding:'14px 20px',borderTop:'1px solid #e8e2da',flexShrink:0,display:'flex',gap:6}}>
            {courseSource === 'ai' ? (
              <div style={{flex:1,padding:'11px',background:'#f5efe8',border:'1px solid #e0d9d0',borderRadius:8,fontSize:12,fontWeight:600,color:'#9a8070',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                {t('courseTypeAi')} — {t('courseSaved')}
              </div>
            ) : (
              <button onClick={()=>{const s=saveCourseToList('manual');if(s)alert(t('courseSaved'));setShowCoursePlanner(false)}}
                style={{flex:1,padding:'11px',background:'#c8856a',border:'none',borderRadius:8,fontSize:12,fontWeight:700,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all .15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#b8745a'}
                onMouseLeave={e=>e.currentTarget.style.background='#c8856a'}>
                {t('courseSave')}
              </button>
            )}
            <button onClick={()=>setShowCoursePlanner(false)}
              style={{padding:'11px 16px',background:'none',border:'1px solid #e0d9d0',borderRadius:8,fontSize:12,fontWeight:500,color:'#b0a89e',cursor:'pointer',transition:'all .15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='#f0ebe4'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}>✕</button>
          </div>
        </div>
      )}

    </div>
  )
}

export default function AppWithBoundary() {
  return <ErrorBoundary><App /></ErrorBoundary>
}
