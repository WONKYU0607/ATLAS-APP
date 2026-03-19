import { useState, useEffect, useRef, Component } from 'react'
import Globe from 'globe.gl'

// ── 실제 관광지 사진 (Wikipedia API) ────────────────────────────────────
function SpotImage({ wikiTitle, spotName, fallback, className, style, alt }) {
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

    const loadImage = async () => {
      // 1차: wikiTitle 그대로 검색
      let img = await tryWiki(keyword)
      if (!cancelled && img) { setSrc(img); return }

      // 2차: 한글 제거 후 영어만으로 재시도
      const enKeyword = keyword.replace(/[가-힣]+/g, '').trim()
      if (enKeyword && enKeyword !== keyword) {
        img = await tryWiki(enKeyword)
        if (!cancelled && img) { setSrc(img); return }
      }

      // 3차: spotName 으로 시도 (wikiTitle과 다를 경우)
      if (spotName && spotName !== keyword) {
        const enSpot = spotName.replace(/[가-힣]+/g, '').trim()
        if (enSpot) {
          img = await tryWiki(enSpot)
          if (!cancelled && img) { setSrc(img); return }
        }
      }

      // 최종 fallback
      if (!cancelled) setSrc(fallback)
    }

    loadImage()
    return () => { cancelled = true }
  }, [wikiTitle, spotName, fallback])

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
    { name:"홍콩", lat:22.32, lng:114.17, emoji:"🌃", color:"#2980b9" },
    { name:"마카오", lat:22.20, lng:113.55, emoji:"🎲", color:"#f39c12" },
    { name:"쑤저우", lat:31.30, lng:120.62, emoji:"🏮", color:"#8e44ad" },
  ],
  "France": [
    { name:"파리", lat:48.86, lng:2.35, emoji:"🗼", color:"#2ecc71" },
    { name:"니스", lat:43.71, lng:7.26, emoji:"🌊", color:"#3498db" },
    { name:"리옹", lat:45.75, lng:4.83, emoji:"🍷", color:"#9b59b6" },
    { name:"보르도", lat:44.84, lng:-0.58, emoji:"🍇", color:"#e74c3c" },
    { name:"마르세유", lat:43.30, lng:5.37, emoji:"⛵", color:"#e67e22" },
    { name:"몽생미셸", lat:48.64, lng:-1.51, emoji:"🏰", color:"#8e44ad" },
    { name:"스트라스부르", lat:48.57, lng:7.75, emoji:"🥨", color:"#16a085" },
    { name:"앙시", lat:45.90, lng:6.12, emoji:"🏔️", color:"#2980b9" },
    { name:"툴루즈", lat:43.60, lng:1.44, emoji:"✈️", color:"#c0392b" },
  ],
  "Italy": [
    { name:"로마", lat:41.90, lng:12.50, emoji:"🏛️", color:"#9b59b6" },
    { name:"베네치아", lat:45.44, lng:12.32, emoji:"🚤", color:"#3498db" },
    { name:"피렌체", lat:43.77, lng:11.25, emoji:"🎨", color:"#e74c3c" },
    { name:"밀라노", lat:45.46, lng:9.19, emoji:"👗", color:"#2ecc71" },
    { name:"나폴리", lat:40.85, lng:14.27, emoji:"🍕", color:"#f39c12" },
    { name:"아말피", lat:40.63, lng:14.60, emoji:"🌊", color:"#16a085" },
    { name:"시칠리아", lat:37.60, lng:14.02, emoji:"🍋", color:"#e67e22" },
    { name:"친퀘테레", lat:44.13, lng:9.67, emoji:"🎨", color:"#8e44ad" },
    { name:"볼로냐", lat:44.49, lng:11.34, emoji:"🍝", color:"#c0392b" },
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
    { name:"말라가", lat:36.72, lng:-4.42, emoji:"☀️", color:"#c0392b" },
    { name:"톨레도", lat:39.86, lng:-4.02, emoji:"🗡️", color:"#2980b9" },
    { name:"산티아고데콤포스텔라", lat:42.88, lng:-8.54, emoji:"⛪", color:"#8e44ad" },
  ],
  "Germany": [
    { name:"베를린", lat:52.52, lng:13.40, emoji:"🏛️", color:"#3498db" },
    { name:"뮌헨", lat:48.14, lng:11.58, emoji:"🍺", color:"#e74c3c" },
    { name:"함부르크", lat:53.55, lng:9.99, emoji:"⚓", color:"#2ecc71" },
    { name:"로텐부르크", lat:49.38, lng:10.18, emoji:"🏰", color:"#f39c12" },
    { name:"프랑크푸르트", lat:50.11, lng:8.68, emoji:"🏦", color:"#9b59b6" },
    { name:"쾰른", lat:50.93, lng:6.96, emoji:"⛪", color:"#e67e22" },
    { name:"드레스덴", lat:51.05, lng:13.74, emoji:"🎭", color:"#8e44ad" },
    { name:"하이델베르크", lat:49.40, lng:8.69, emoji:"🏰", color:"#16a085" },
    { name:"퓌센", lat:47.57, lng:10.70, emoji:"🏰", color:"#c0392b" },
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
    { name:"샤르자", lat:25.35, lng:55.39, emoji:"🏺", color:"#2ecc71" },
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
    { name:"쿠알라룸푸르", lat:3.14, lng:101.69, emoji:"🏙️", color:"#3498db" },
    { name:"페낭", lat:5.41, lng:100.33, emoji:"🍜", color:"#e74c3c" },
    { name:"코타키나발루", lat:5.98, lng:116.07, emoji:"🏔️", color:"#2ecc71" },
    { name:"랑카위", lat:6.35, lng:99.80, emoji:"🏝️", color:"#f39c12" },
    { name:"말라카", lat:2.19, lng:102.25, emoji:"🏛️", color:"#9b59b6" },
  ],
  "Singapore": [
    { name:"싱가포르", lat:1.35, lng:103.82, emoji:"🦁", color:"#991b1b" },
  ],
  "Cambodia": [
    { name:"씨엠립", lat:13.36, lng:103.86, emoji:"🏛️", color:"#e74c3c" },
    { name:"프놈펜", lat:11.56, lng:104.93, emoji:"🏙️", color:"#3498db" },
    { name:"시아누크빌", lat:10.63, lng:103.50, emoji:"🏖️", color:"#2ecc71" },
  ],
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
  ],
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
    { name:"마스트리흐트", lat:50.85, lng:5.69, emoji:"🍷", color:"#8e44ad" },
  ],
  "Czechia": [
    { name:"프라하", lat:50.08, lng:14.44, emoji:"🏰", color:"#065f46" },
    { name:"체스키크룸로프", lat:48.81, lng:14.32, emoji:"🏯", color:"#e74c3c" },
    { name:"브르노", lat:49.19, lng:16.61, emoji:"🏙️", color:"#3498db" },
  ],
  "Austria": [
    { name:"빈", lat:48.21, lng:16.37, emoji:"🎵", color:"#5b21b6" },
    { name:"잘츠부르크", lat:47.80, lng:13.04, emoji:"🎶", color:"#3498db" },
    { name:"인스브루크", lat:47.27, lng:11.39, emoji:"⛷️", color:"#2ecc71" },
    { name:"할슈타트", lat:47.56, lng:13.65, emoji:"🏔️", color:"#e74c3c" },
    { name:"그라츠", lat:47.07, lng:15.44, emoji:"🏛️", color:"#f39c12" },
  ],
  "Switzerland": [
    { name:"취리히", lat:47.38, lng:8.54, emoji:"🏦", color:"#e74c3c" },
    { name:"제네바", lat:46.20, lng:6.15, emoji:"⌚", color:"#3498db" },
    { name:"인터라켄", lat:46.69, lng:7.86, emoji:"🏔️", color:"#2ecc71" },
    { name:"루체른", lat:47.05, lng:8.31, emoji:"🌉", color:"#9b59b6" },
    { name:"체르마트", lat:46.02, lng:7.75, emoji:"⛷️", color:"#e67e22" },
    { name:"베른", lat:46.95, lng:7.44, emoji:"🐻", color:"#8e44ad" },
  ],
  "Hungary": [
    { name:"부다페스트", lat:47.50, lng:19.04, emoji:"🏰", color:"#e74c3c" },
    { name:"에게르", lat:47.90, lng:20.38, emoji:"🍷", color:"#9b59b6" },
  ],
  "Croatia": [
    { name:"두브로브니크", lat:42.65, lng:18.09, emoji:"🌊", color:"#3498db" },
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
  ],
  "Finland": [
    { name:"헬싱키", lat:60.17, lng:24.94, emoji:"🏛️", color:"#2980b9" },
    { name:"로바니에미", lat:66.50, lng:25.72, emoji:"🎅", color:"#3498db" },
    { name:"탐페레", lat:61.50, lng:23.77, emoji:"🏭", color:"#e74c3c" },
  ],
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
  ],
}


// 국가명 한국어 매핑
const COUNTRY_KO = {
  "South Korea": "대한민국",
  "Japan": "일본",
  "France": "프랑스",
  "United States of America": "미국",
  "Australia": "호주",
  "United Arab Emirates": "아랍에미리트",
  "Italy": "이탈리아",
  "Thailand": "태국",
  "Egypt": "이집트",
  "Brazil": "브라질",
  "Morocco": "모로코",
  "Spain": "스페인",
  "South Africa": "남아프리카",
  "Indonesia": "인도네시아",
  "United Kingdom": "영국",
  "Turkey": "튀르키예",
  "Greece": "그리스",
  "Peru": "페루",
  "Jordan": "요르단",
  "Netherlands": "네덜란드",
  "Czechia": "체코",
  "Portugal": "포르투갈",
  "Singapore": "싱가포르",
  "Argentina": "아르헨티나",
  "India": "인도",
  "Mexico": "멕시코",
  "Canada": "캐나다",
  "Iceland": "아이슬란드",
  "Kenya": "케냐",
  "Cuba": "쿠바",
  "Vietnam": "베트남",
  "Austria": "오스트리아",
  "New Zealand": "뉴질랜드",
  "China": "중국",
  "Germany": "독일",
  "Russia": "러시아",
  "Switzerland": "스위스",
  "Nepal": "네팔",
  "Cambodia": "캄보디아",
  "Sri Lanka": "스리랑카",
  "Tanzania": "탄자니아",
  "Norway": "노르웨이",
  "Hungary": "헝가리",
  "Croatia": "크로아티아",
  "Malaysia": "말레이시아",
  "Afghanistan": "아프가니스탄",
  "Albania": "알바니아",
  "Algeria": "알제리",
  "Angola": "앙골라",
  "Armenia": "아르메니아",
  "Azerbaijan": "아제르바이잔",
  "Bangladesh": "방글라데시",
  "Belgium": "벨기에",
  "Bolivia": "볼리비아",
  "Bosnia and Herzegovina": "보스니아 헤르체고비나",
  "Bulgaria": "불가리아",
  "Cameroon": "카메룬",
  "Chile": "칠레",
  "Colombia": "콜롬비아",
  "Democratic Republic of the Congo": "콩고민주공화국",
  "Denmark": "덴마크",
  "Ecuador": "에콰도르",
  "Ethiopia": "에티오피아",
  "Finland": "핀란드",
  "Ghana": "가나",
  "Guatemala": "과테말라",
  "Honduras": "온두라스",
  "Iran": "이란",
  "Iraq": "이라크",
  "Ireland": "아일랜드",
  "Israel": "이스라엘",
  "Kazakhstan": "카자흐스탄",
  "Kuwait": "쿠웨이트",
  "Laos": "라오스",
  "Lebanon": "레바논",
  "Libya": "리비아",
  "Madagascar": "마다가스카르",
  "Mali": "말리",
  "Mauritania": "모리타니",
  "Mongolia": "몽골",
  "Mozambique": "모잠비크",
  "Myanmar": "미얀마",
  "Namibia": "나미비아",
  "Niger": "니제르",
  "Nigeria": "나이지리아",
  "North Korea": "북한",
  "Oman": "오만",
  "Pakistan": "파키스탄",
  "Panama": "파나마",
  "Papua New Guinea": "파푸아뉴기니",
  "Paraguay": "파라과이",
  "Philippines": "필리핀",
  "Poland": "폴란드",
  "Qatar": "카타르",
  "Romania": "루마니아",
  "Saudi Arabia": "사우디아라비아",
  "Senegal": "세네갈",
  "Serbia": "세르비아",
  "Slovakia": "슬로바키아",
  "Somalia": "소말리아",
  "Sudan": "수단",
  "Sweden": "스웨덴",
  "Syria": "시리아",
  "Taiwan": "대만",
  "Tajikistan": "타지키스탄",
  "Turkmenistan": "투르크메니스탄",
  "Uganda": "우간다",
  "Ukraine": "우크라이나",
  "Uruguay": "우루과이",
  "Uzbekistan": "우즈베키스탄",
  "Venezuela": "베네수엘라",
  "Yemen": "예멘",
  "Zambia": "잠비아",
  "Zimbabwe": "짐바브웨",
  "Eritrea": "에리트레아",
  "Estonia": "에스토니아",
  "Latvia": "라트비아",
  "Lithuania": "리투아니아",
  "Luxembourg": "룩셈부르크",
  "Moldova": "몰도바",
  "Montenegro": "몬테네그로",
  "North Macedonia": "북마케도니아",
  "Kosovo": "코소보",
  "Belarus": "벨라루스",
  "Georgia": "조지아",
  "Kyrgyzstan": "키르기스스탄",
  "Bhutan": "부탄",
  "Maldives": "몰디브",
  "Brunei": "브루나이",
  "Timor-Leste": "동티모르",
  "Fiji": "피지",
  "Bahrain": "바레인",
  "Cyprus": "키프로스",
  "Djibouti": "지부티",
  "Equatorial Guinea": "적도기니",
  "Eswatini": "에스와티니",
  "Gabon": "가봉",
  "Gambia": "감비아",
  "Guinea": "기니",
  "Guinea-Bissau": "기니비사우",
  "Lesotho": "레소토",
  "Liberia": "라이베리아",
  "Malawi": "말라위",
  "Mauritius": "모리셔스",
  "Niger": "니제르",
  "Republic of the Congo": "콩고공화국",
  "Rwanda": "르완다",
  "Sierra Leone": "시에라리온",
  "South Sudan": "남수단",
  "Togo": "토고",
  "Tunisia": "튀니지",
  "Central African Republic": "중앙아프리카공화국",
  "Chad": "차드",
  "Burundi": "부룬디",
  "Benin": "베냉",
  "Burkina Faso": "부르키나파소",
  "Botswana": "보츠와나",
  "Cabo Verde": "카보베르데",
  "Comoros": "코모로",
  "Ivory Coast": "코트디부아르",
  "Dominican Republic": "도미니카공화국",
  "Haiti": "아이티",
  "Jamaica": "자메이카",
  "Trinidad and Tobago": "트리니다드토바고",
  "Costa Rica": "코스타리카",
  "El Salvador": "엘살바도르",
  "Nicaragua": "니카라과",
  "Belize": "벨리즈",
  "Bolivia": "볼리비아",
  "Guyana": "가이아나",
  "Suriname": "수리남",
}

// 전 세계 도시 사전 관광 데이터
const CITY_DATA = {

// ────────────────────────── 대한민국 ──────────────────────────
"서울": { description:"서울은 600년 조선왕조의 역사와 K-팝 문화, 첨단 기술이 공존하는 아시아 최고의 도시입니다. 고궁과 현대 빌딩이 어우러진 독특한 매력으로 매년 수천만 명의 여행자를 끌어들입니다.", spots:[
  {name:"경복궁", wikiTitle:"Gyeongbokgung", type:"역사", desc:"조선 5대 궁궐 중 가장 웅장하며 매시간 수문장 교대식이 열립니다. 근정전과 경회루는 조선 건축의 정수를 보여줍니다.", rating:4.8, openTime:"09:00~18:00", price:"성인 3,000원", website:"https://www.royalpalace.go.kr"},
  {name:"북촌 한옥마을", wikiTitle:"Bukchon Hanok Village", type:"문화", desc:"600년 된 전통 한옥이 즐비한 골목으로 조선시대 양반 생활을 엿볼 수 있습니다. 인왕산을 배경으로 한 풍경이 일품입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://bukchon.seoul.go.kr"},
  {name:"N서울타워", wikiTitle:"N Seoul Tower", type:"랜드마크", desc:"남산 정상에 솟아오른 타워로 서울 전역을 360도로 내려다볼 수 있습니다. 야경이 특히 아름다워 연인들의 필수 코스입니다.", rating:4.6, openTime:"10:00~23:00", price:"성인 21,000원", website:"https://www.nseoultower.co.kr"},
  {name:"광장시장", wikiTitle:"Gwangjang Market", type:"음식", desc:"1905년에 문을 연 서울 최초의 전통시장으로 빈대떡, 육회, 마약김밥이 유명합니다. 한국 전통 먹거리 문화의 살아있는 역사입니다.", rating:4.7, openTime:"09:00~23:00", price:"무료", website:"https://www.gwangjangmarket.co.kr"},
  {name:"창덕궁", wikiTitle:"Changdeokgung", type:"역사", desc:"비원(후원)이라 불리는 아름다운 비밀 정원이 있는 유네스코 세계문화유산 궁궐입니다. 계절마다 다른 풍경이 펼쳐집니다.", rating:4.8, openTime:"09:00~17:30", price:"성인 3,000원", website:"https://www.cdg.go.kr"},
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
  {name:"안압지(동궁과 월지)", wikiTitle:"Anapji", type:"역사", desc:"신라 왕궁의 별궁과 연못으로 야경이 특히 아름다운 곳입니다. 연못에 비친 건물의 반영이 환상적인 풍경을 연출합니다.", rating:4.7, openTime:"09:00~22:00", price:"성인 3,000원", website:"https://en.wikipedia.org/wiki/Anapji"},
]},
"인천": { description:"인천은 대한민국의 관문 도시로 차이나타운, 송도국제도시, 아름다운 섬들이 어우러진 매력적인 항구 도시입니다. 개항 역사와 현대적 도시 개발이 공존합니다.", spots:[
  {name:"차이나타운", wikiTitle:"Incheon Chinatown", type:"문화", desc:"한국 유일의 차이나타운으로 1883년 개항 이후 형성된 역사적 거리입니다. 짜장면 박물관과 다양한 중화 요리를 즐길 수 있습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Incheon_Chinatown"},
  {name:"송도 센트럴파크", wikiTitle:"Songdo Central Park", type:"도시", desc:"바닷물을 끌어와 만든 독특한 해수 공원으로 수상택시와 카약을 즐길 수 있습니다. 첨단 도시 송도의 랜드마크입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Songdo_International_Business_District"},
  {name:"월미도", wikiTitle:"Wolmido", type:"자연", desc:"인천 앞바다의 작은 섬으로 놀이공원과 해산물 먹거리가 가득한 관광지입니다. 디스코 팡팡과 바이킹은 필수 체험입니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Wolmido"},
  {name:"인천상륙작전기념관", wikiTitle:"Incheon Landing Operation Memorial Hall", type:"역사", desc:"한국전쟁 당시 맥아더 장군의 인천상륙작전을 기념하는 기념관입니다. 전쟁 역사와 평화의 소중함을 되새기는 공간입니다.", rating:4.3, openTime:"09:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Battle_of_Inchon"},
]},
"대구": { description:"대구는 분지 지형의 뜨거운 도시로 화려한 약령시 역사와 근대 문화골목, 맛있는 음식으로 유명합니다. 팔공산과 앞산 등 주변 자연경관도 뛰어납니다.", spots:[
  {name:"동화사", wikiTitle:"Donghwasa", type:"역사", desc:"팔공산 자락에 자리한 1,500년 역사의 고찰로 통일약사여래대불이 유명합니다. 사계절 아름다운 풍경이 펼쳐지는 명찰입니다.", rating:4.5, openTime:"08:30~18:00", price:"성인 3,000원", website:"https://www.donghwasa.net"},
  {name:"근대문화골목", wikiTitle:"Daegu Modern History Street", type:"문화", desc:"일제강점기부터 한국전쟁까지의 근대 역사를 걸으며 체험할 수 있는 골목입니다. 이상화 고택과 계산성당이 대표 명소입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Daegu"},
  {name:"서문시장", wikiTitle:"Seomun Market", type:"음식", desc:"조선시대부터 이어져온 대구의 대표 전통시장입니다. 납작만두와 칼국수, 야시장의 다양한 먹거리가 유명합니다.", rating:4.5, openTime:"09:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Seomun_Market"},
  {name:"팔공산 케이블카", wikiTitle:"Palgongsan", type:"자연", desc:"해발 1,193m 팔공산을 케이블카로 편하게 오를 수 있습니다. 정상에서 바라보는 대구 시내 전경이 장관입니다.", rating:4.4, openTime:"09:00~18:00", price:"성인 12,000원", website:"https://en.wikipedia.org/wiki/Palgongsan"},
]},
"전주": { description:"전주는 한국의 맛과 멋의 도시로 전주한옥마을과 비빔밥으로 세계적으로 유명합니다. 유네스코 음식창의도시로 선정된 미식의 도시입니다.", spots:[
  {name:"전주한옥마을", wikiTitle:"Jeonju Hanok Village", type:"문화", desc:"700여 채의 한옥이 모여 있는 대한민국 최대 한옥마을입니다. 한복 체험, 전통 공예, 한지 만들기 등 다양한 체험이 가능합니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://hanok.jeonju.go.kr"},
  {name:"경기전", wikiTitle:"Gyeonggijeon", type:"역사", desc:"조선 태조 이성계의 어진(초상화)을 모신 사당으로 전주한옥마을의 중심입니다. 대나무 숲길이 특히 아름다워 인기 포토존입니다.", rating:4.6, openTime:"09:00~18:00", price:"성인 3,000원", website:"https://en.wikipedia.org/wiki/Gyeonggijeon"},
  {name:"전주 남부시장", wikiTitle:"Nambu Market", type:"음식", desc:"전주의 대표 전통시장으로 청년몰이 유명합니다. 전주비빔밥, 콩나물국밥, 피순대 등 전주의 맛을 집약한 곳입니다.", rating:4.5, openTime:"09:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Jeonju"},
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
  {name:"화성행궁", wikiTitle:"Hwaseong Haenggung", type:"역사", desc:"정조대왕이 수원 행차 시 머물던 임시 궁궐입니다. 국내 최대 규모의 행궁으로 화려한 건축미를 자랑합니다.", rating:4.6, openTime:"09:00~18:00", price:"성인 1,500원", website:"https://en.wikipedia.org/wiki/Hwaseong_Haenggung"},
  {name:"수원 통닭거리", wikiTitle:"Suwon", type:"음식", desc:"수원의 명물 왕갈비와 통닭을 맛볼 수 있는 먹자골목입니다. 40년 전통의 치킨 맛집들이 즐비합니다.", rating:4.4, openTime:"11:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Suwon"},
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
  {name:"니조 시장", wikiTitle:"Nijo Market", type:"음식", desc:"100년 이상 역사를 가진 삿포로 대표 시장으로 게, 성게, 연어알 등 신선한 해산물을 맛볼 수 있습니다. 해산물 덮밥이 특히 인기입니다.", rating:4.5, openTime:"07:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Nij%C5%8D_Market"},
  {name:"모이와산 전망대", wikiTitle:"Mount Moiwa", type:"자연", desc:"삿포로 시내를 360도로 조망할 수 있는 야경 명소입니다. 일본 신 3대 야경에 선정된 로맨틱한 전망대입니다.", rating:4.6, openTime:"11:00~22:00", price:"로프웨이 왕복 2,100엔", website:"https://mt-moiwa.jp"},
  {name:"삿포로 맥주 박물관", wikiTitle:"Sapporo Beer Museum", type:"문화", desc:"일본에서 가장 오래된 맥주 브랜드 삿포로의 역사를 배울 수 있는 박물관입니다. 한정 생맥주 시음이 하이라이트입니다.", rating:4.4, openTime:"11:00~20:00", price:"무료(시음별도)", website:"https://www.sapporobeer.jp/brewery/s_museum/"},
]},
"나라": { description:"나라는 710~784년 일본 최초의 수도로 거대한 대불과 자유롭게 돌아다니는 사슴으로 유명합니다. 세계문화유산 사찰과 신사가 밀집한 고도입니다.", spots:[
  {name:"도다이지(동대사)", wikiTitle:"Tōdai-ji", type:"역사", desc:"세계 최대의 목조 건물 안에 높이 15m의 나라 대불이 안치된 세계문화유산입니다. 1,200년 이상의 역사를 자랑합니다.", rating:4.8, openTime:"07:30~17:30", price:"성인 600엔", website:"https://www.todaiji.or.jp"},
  {name:"나라 공원", wikiTitle:"Nara Park", type:"자연", desc:"1,200여 마리의 사슴이 자유롭게 돌아다니는 공원으로 사슴 센베(과자)를 주며 교감할 수 있습니다. 벚꽃 시즌이 특히 아름답습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://www3.pref.nara.jp/park"},
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
  {name:"오호리 공원", wikiTitle:"Ōhori Park", type:"자연", desc:"후쿠오카 중심부에 위치한 아름다운 호수 공원으로 일본식 정원과 미술관이 있습니다. 2km 조깅 코스가 시민들에게 사랑받습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/%C5%8Chori_Park"},
]},
"히로시마": { description:"히로시마는 원폭의 비극을 딛고 평화의 도시로 부활한 감동적인 곳입니다. 평화기념공원과 인근 미야지마 섬의 해상 도리이가 대표 관광지입니다.", spots:[
  {name:"원폭 돔", wikiTitle:"Hiroshima Peace Memorial", type:"역사", desc:"1945년 원자폭탄 투하의 참상을 전하는 세계문화유산입니다. 반전과 평화의 상징으로 전 세계인의 방문이 이어집니다.", rating:4.8, openTime:"24시간(외관)", price:"무료", website:"https://hpmmuseum.jp"},
  {name:"이츠쿠시마 신사(미야지마)", wikiTitle:"Itsukushima Shrine", type:"역사", desc:"바다 위에 떠 있는 듯한 주홍색 대형 도리이로 유명한 세계문화유산입니다. 만조 때 바다에 잠긴 도리이의 풍경이 환상적입니다.", rating:4.9, openTime:"06:30~18:00", price:"성인 300엔", website:"https://www.itsukushimajinja.jp"},
  {name:"히로시마 평화기념관", wikiTitle:"Hiroshima Peace Memorial Museum", type:"역사", desc:"원폭 피해자들의 유품과 기록을 전시한 박물관으로 평화의 소중함을 깊이 느낄 수 있습니다. 방문 후 큰 여운이 남는 곳입니다.", rating:4.7, openTime:"08:30~18:00", price:"성인 200엔", website:"https://hpmmuseum.jp"},
  {name:"히로시마풍 오코노미야키", wikiTitle:"Okonomiyaki", type:"음식", desc:"히로시마 특유의 겹겹이 쌓아 만드는 오코노미야키를 맛볼 수 있습니다. 오코노미무라 빌딩에 수십 개의 전문점이 모여 있습니다.", rating:4.5, openTime:"11:00~21:00", price:"약 1,000엔~", website:"https://en.wikipedia.org/wiki/Okonomiyaki"},
]},
"고베": { description:"고베는 개항 이래 이국적인 분위기가 매력인 항구 도시로 세계적인 와규 고베 비프의 본고장입니다. 산과 바다 사이에 자리한 아름다운 도시 경관이 특징입니다.", spots:[
  {name:"고베 포트타워", wikiTitle:"Kobe Port Tower", type:"랜드마크", desc:"고베항의 랜드마크인 빨간색 전망 타워로 항구와 시가지를 360도로 조망할 수 있습니다. 야경이 특히 아름답습니다.", rating:4.4, openTime:"09:00~21:00", price:"성인 700엔", website:"https://en.wikipedia.org/wiki/Kobe_Port_Tower"},
  {name:"기타노 이진칸", wikiTitle:"Kitano-chō", type:"문화", desc:"개항 당시 외국인들이 살던 서양식 저택들이 모여 있는 이국적인 거리입니다. 각국의 건축 양식을 비교하며 산책하기 좋습니다.", rating:4.5, openTime:"09:00~18:00", price:"개별 입장료 상이", website:"https://en.wikipedia.org/wiki/Kitano-ch%C5%8D"},
  {name:"고베 비프 스테이크", wikiTitle:"Kobe beef", type:"음식", desc:"세계 3대 와규 중 하나인 고베 비프를 본고장에서 맛보는 특별한 경험입니다. 철판구이 스타일로 눈앞에서 구워줍니다.", rating:4.8, openTime:"11:00~22:00", price:"약 8,000엔~", website:"https://en.wikipedia.org/wiki/Kobe_beef"},
  {name:"아리마 온천", wikiTitle:"Arima Onsen", type:"자연", desc:"일본 3대 온천 중 하나로 1,000년 이상의 역사를 자랑합니다. 금빛의 킨센(금천)과 투명한 긴센(은천) 두 종류의 온천수가 유명합니다.", rating:4.6, openTime:"08:00~22:00", price:"킨노유 650엔~", website:"https://en.wikipedia.org/wiki/Arima_Onsen"},
]},
"오키나와": { description:"오키나와는 일본 최남단의 아열대 섬으로 에메랄드빛 바다와 독자적인 류큐 문화가 매력입니다. 다이빙, 스노클링, 전통 음악 등 본토와는 전혀 다른 일본을 경험할 수 있습니다.", spots:[
  {name:"슈리성", wikiTitle:"Shuri Castle", type:"역사", desc:"류큐 왕국의 왕궁이었던 세계문화유산으로 2019년 화재 후 복원 중입니다. 중국과 일본 건축이 융합된 독특한 양식이 특징입니다.", rating:4.5, openTime:"08:30~18:00", price:"성인 400엔", website:"https://oki-park.jp/shurijo/"},
  {name:"추라우미 수족관", wikiTitle:"Okinawa Churaumi Aquarium", type:"랜드마크", desc:"세계 최대급 수조에서 고래상어와 만타가오리가 유영하는 모습을 볼 수 있는 수족관입니다. 오키나와 최고의 관광지 중 하나입니다.", rating:4.8, openTime:"08:30~18:30", price:"성인 2,180엔", website:"https://churaumi.okinawa/"},
  {name:"만좌모", wikiTitle:"Cape Manzamo", type:"자연", desc:"코끼리 코 모양의 기암절벽과 투명한 바다가 어우러진 절경입니다. 석양이 특히 아름다워 오키나와 대표 포토 스팟입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Cape_Manzamo"},
  {name:"국제거리", wikiTitle:"Kokusai Street", type:"도시", desc:"나하 시내 약 1.6km의 메인 스트리트로 오키나와 기념품과 먹거리가 가득합니다. 사탕수수 아이스크림과 시사(사자상) 기념품이 인기입니다.", rating:4.3, openTime:"10:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Kokusai_Street"},
]},
"가나자와": { description:"가나자와는 일본 3대 정원 겐로쿠엔과 보존된 에도시대 거리로 유명한 호쿠리쿠의 보석입니다. 전통 공예와 해산물 문화가 잘 보존된 문화 도시입니다.", spots:[
  {name:"겐로쿠엔", wikiTitle:"Kenroku-en", type:"자연", desc:"일본 3대 정원 중 하나로 사계절 각기 다른 아름다움을 선사합니다. 특히 겨울의 유키츠리(눈 대비 나무 보호)가 상징적입니다.", rating:4.8, openTime:"07:00~18:00", price:"성인 320엔", website:"https://www.pref.ishikawa.jp/siro-niwa/kenrokuen/"},
  {name:"히가시 차야가이", wikiTitle:"Higashi Chaya District", type:"문화", desc:"에도시대 게이샤 거리의 모습을 그대로 간직한 전통 찻집 거리입니다. 금박 아이스크림과 전통 화과자가 명물입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Higashi_Chaya_District"},
  {name:"오미초 시장", wikiTitle:"Ōmi-chō Market", type:"음식", desc:"300년 역사의 가나자와 대표 시장으로 일본해의 신선한 해산물이 가득합니다. 노도구로(기름눈볼대) 초밥이 특히 유명합니다.", rating:4.6, openTime:"09:00~18:00", price:"무료", website:"https://ohmicho-ichiba.com"},
  {name:"21세기 미술관", wikiTitle:"21st Century Museum of Contemporary Art, Kanazawa", type:"문화", desc:"레안드로 에를리치의 수영장 작품으로 유명한 현대미술관입니다. 원형 유리 건물 자체가 하나의 예술 작품입니다.", rating:4.5, openTime:"10:00~18:00", price:"전시별 상이", website:"https://www.kanazawa21.jp"},
]},
"하코네": { description:"하코네는 도쿄에서 1시간 거리의 온천 휴양지로 후지산 전망과 노천 온천, 미술관이 유명합니다. 로프웨이, 유람선, 등산열차로 이동하는 것 자체가 관광입니다.", spots:[
  {name:"아시노코 호수", wikiTitle:"Lake Ashi", type:"자연", desc:"후지산을 배경으로 해적선 유람선이 운항하는 화산 호수입니다. 맑은 날 호수에 비친 후지산의 역(逆)후지가 장관입니다.", rating:4.7, openTime:"09:00~17:00", price:"유람선 1,200엔~", website:"https://en.wikipedia.org/wiki/Lake_Ashi"},
  {name:"오와쿠다니", wikiTitle:"Ōwakudani", type:"자연", desc:"약 3,000년 전 화산 폭발로 형성된 유황 분기 지대입니다. 유황으로 삶은 검은 달걀을 먹으면 7년 수명이 늘어난다는 전설이 있습니다.", rating:4.5, openTime:"09:00~17:00", price:"로프웨이 별도", website:"https://en.wikipedia.org/wiki/%C5%8Cwakudani"},
  {name:"하코네 조각의 숲 미술관", wikiTitle:"Hakone Open-Air Museum", type:"문화", desc:"야외에 조각 작품들이 전시된 미술관으로 피카소관도 있습니다. 자연과 예술이 어우러진 독특한 공간입니다.", rating:4.6, openTime:"09:00~17:00", price:"성인 1,600엔", website:"https://www.hakone-oam.or.jp"},
  {name:"하코네 유모토 온천", wikiTitle:"Hakone", type:"자연", desc:"하코네의 관문으로 수많은 온천 료칸과 당일 온천 시설이 모여 있습니다. 도쿄 근교 최고의 온천 체험을 할 수 있습니다.", rating:4.5, openTime:"시설마다 상이", price:"당일 온천 1,500엔~", website:"https://www.hakone.or.jp"},
]},

// ────────────────────────── 중국 ──────────────────────────
"베이징": { description:"베이징은 3,000년 역사의 중국 수도로 자금성, 만리장성, 천안문 광장 등 중국 역사의 핵심이 집약된 도시입니다. 현대적 발전과 황제의 도시가 공존합니다.", spots:[
  {name:"자금성(고궁박물원)", wikiTitle:"Forbidden City", type:"역사", desc:"명·청 시대 24명의 황제가 거주한 세계 최대 궁전 단지입니다. 9,999칸의 방이 있으며 유네스코 세계문화유산입니다.", rating:4.9, openTime:"08:30~17:00", price:"60위안", website:"https://www.dpm.org.cn"},
  {name:"만리장성(바다링)", wikiTitle:"Great Wall of China", type:"역사", desc:"인류 역사상 가장 거대한 건축물로 바다링 구간이 가장 접근성이 좋습니다. 성벽 위에서 끝없이 이어지는 장성을 감상할 수 있습니다.", rating:4.9, openTime:"06:30~19:00", price:"40위안", website:"http://www.mutianyugreatwall.com"},
  {name:"천단(텐탄)", wikiTitle:"Temple of Heaven", type:"역사", desc:"명·청 시대 황제가 하늘에 제사를 올린 유네스코 세계문화유산입니다. 원형 기년전의 아름다운 건축미가 압도적입니다.", rating:4.7, openTime:"06:00~21:00", price:"34위안", website:"http://www.tiantanpark.com"},
  {name:"이화원", wikiTitle:"Summer Palace", type:"역사", desc:"청나라 황실의 여름 별궁으로 쿤밍호와 만수산이 어우러진 아름다운 정원입니다. 긴 회랑의 채색화가 특히 볼만합니다.", rating:4.7, openTime:"06:30~18:00", price:"30위안", website:"https://en.wikipedia.org/wiki/Summer_Palace"},
  {name:"왕푸징 먹자골목", wikiTitle:"Wangfujing", type:"음식", desc:"베이징 최대의 번화가로 전갈꼬치, 양고기 꼬치 등 다양한 중국 길거리 음식을 맛볼 수 있습니다. 쇼핑과 먹거리의 천국입니다.", rating:4.3, openTime:"09:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Wangfujing"},
]},
"상하이": { description:"상하이는 중국 최대의 경제 도시로 와이탄의 유럽풍 건축과 푸둥의 초고층 빌딩이 대비를 이루는 화려한 도시입니다. 동서양 문화가 융합된 독특한 매력이 있습니다.", spots:[
  {name:"와이탄(외탄)", wikiTitle:"The Bund", type:"랜드마크", desc:"황푸강변에 늘어선 1920~30년대 유럽풍 건축물군으로 상하이의 상징입니다. 밤에는 맞은편 푸둥의 화려한 야경을 감상할 수 있습니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://www.meet-in-shanghai.net"},
  {name:"동방명주탑", wikiTitle:"Oriental Pearl Tower", type:"랜드마크", desc:"높이 468m의 상하이 랜드마크로 투명 바닥 전망대가 스릴 넘칩니다. 상하이 스카이라인의 핵심 요소입니다.", rating:4.5, openTime:"08:00~21:30", price:"160위안~", website:"https://en.wikipedia.org/wiki/Oriental_Pearl_Tower"},
  {name:"예원(위위안)", wikiTitle:"Yu Garden", type:"역사", desc:"명나라 시대에 조성된 전통 정원으로 정교한 조경과 건축이 돋보입니다. 주변 예원상장의 소룡포와 각종 간식이 유명합니다.", rating:4.5, openTime:"08:30~17:00", price:"40위안", website:"https://www.yugarden.com.cn"},
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
  {name:"서호(시후)", wikiTitle:"West Lake", type:"자연", desc:"유네스코 세계문화유산으로 호수 주변의 정자, 탑, 다리, 버드나무가 한 폭의 수묵화를 이룹니다. 유람선을 타며 감상하는 것이 최고입니다.", rating:4.8, openTime:"24시간", price:"무료(유람선 별도)", website:"https://www.hzwestlake.gov.cn"},
  {name:"링인사(영은사)", wikiTitle:"Lingyin Temple", type:"역사", desc:"1,700년 역사의 중국 10대 사찰 중 하나로 거대한 석불 조각과 고요한 분위기가 인상적입니다. 비래봉의 석각 군상도 필수 코스입니다.", rating:4.6, openTime:"07:00~18:00", price:"75위안(통합)", website:"https://en.wikipedia.org/wiki/Lingyin_Temple"},
  {name:"용정차 마을", wikiTitle:"Longjing tea", type:"문화", desc:"중국 최고급 녹차 용정(롱징)차의 산지로 차밭 사이를 걸으며 갓 따낸 차를 시음할 수 있습니다. 봄 청명절 무렵이 최적기입니다.", rating:4.5, openTime:"08:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Longjing_tea"},
  {name:"허팡제(하방가)", wikiTitle:"Hefang Street", type:"음식", desc:"남송 시대 거리를 재현한 전통 상업가로 항저우 특산 간식과 차, 공예품을 즐길 수 있습니다. 동파육 등 항저우 요리도 맛볼 수 있습니다.", rating:4.3, openTime:"09:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Hangzhou"},
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
  {name:"툰시 고가(둔계 옛거리)", wikiTitle:"Tunxi Ancient Street", type:"문화", desc:"송나라 시대부터 이어진 상업 거리로 전통 차, 먹물, 붓 등 문방사우를 판매합니다. 안후이 요리인 취두부(냄새나는 두부)가 명물입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Tunxi_District"},
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
  {name:"노트르담 대성당", wikiTitle:"Notre-Dame de Paris", type:"역사", desc:"850년 역사의 고딕 건축 걸작으로 2019년 화재 후 복원되었습니다. 센강의 시테섬에 자리하여 파리의 역사적 심장부입니다.", rating:4.7, openTime:"복원 후 공개", price:"무료", website:"https://www.notredamedeparis.fr"},
  {name:"몽마르트르(사크레쾨르)", wikiTitle:"Sacré-Cœur, Paris", type:"문화", desc:"파리 북쪽 언덕 위 하얀 성당에서 파리 시내를 한눈에 조망할 수 있습니다. 화가들의 거리 테르트르 광장이 예술적 분위기를 더합니다.", rating:4.6, openTime:"06:00~22:30", price:"무료", website:"https://www.sacre-coeur-montmartre.com"},
  {name:"오르세 미술관", wikiTitle:"Musée d'Orsay", type:"문화", desc:"인상주의 회화의 세계 최대 컬렉션을 보유한 미술관으로 모네, 르누아르, 고흐의 걸작을 만날 수 있습니다. 기차역을 개조한 건물이 독특합니다.", rating:4.7, openTime:"09:30~18:00", price:"€16", website:"https://www.musee-orsay.fr"},
]},
"니스": { description:"니스는 코트다쥐르(프랑스 리비에라)의 중심 도시로 지중해의 푸른 바다와 화려한 해변이 매력적입니다. 마티스, 샤갈 등 예술가들이 사랑한 빛의 도시입니다.", spots:[
  {name:"프로메나드 데 장글레", wikiTitle:"Promenade des Anglais", type:"도시", desc:"니스 해변을 따라 7km 이어지는 산책로로 코트다쥐르의 상징입니다. 파란 의자에 앉아 지중해를 바라보는 것이 니스의 정수입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://www.explorenicecotedazur.com"},
  {name:"니스 구시가지(비유 니스)", wikiTitle:"Vieux Nice", type:"문화", desc:"좁은 골목과 파스텔 색 건물이 매력적인 구시가로 살레야 광장의 꽃시장이 유명합니다. 소카(병아리콩 전)를 꼭 맛보세요.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Nice"},
  {name:"샤갈 미술관", wikiTitle:"Musée Marc Chagall", type:"문화", desc:"마르크 샤갈의 성서 연작을 전시한 미술관으로 스테인드글라스가 아름답습니다. 예술가가 직접 기증한 작품들이 감동적입니다.", rating:4.5, openTime:"10:00~18:00", price:"€10", website:"https://en.wikipedia.org/wiki/Mus%C3%A9e_Marc_Chagall"},
  {name:"성 언덕(콜린 뒤 샤토)", wikiTitle:"Castle Hill, Nice", type:"자연", desc:"니스 구시가 옆 언덕으로 항구와 해변, 도시를 한눈에 조망할 수 있는 최고의 전망대입니다. 폭포와 정원이 어우러져 있습니다.", rating:4.6, openTime:"08:30~20:00", price:"무료", website:"https://en.wikipedia.org/wiki/Castle_Hill,_Nice"},
]},
"리옹": { description:"리옹은 프랑스 미식의 수도로 폴 보퀴즈 등 세계적인 셰프를 배출한 곳입니다. 로마 시대 유적과 르네상스 건축이 어우러진 유네스코 세계문화유산 도시입니다.", spots:[
  {name:"리옹 구시가(비유 리옹)", wikiTitle:"Vieux Lyon", type:"문화", desc:"르네상스 건축이 밀집한 유네스코 세계문화유산 지구로 비밀 통로 트라불이 유명합니다. 중세 골목을 걸으며 시간 여행을 합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Vieux_Lyon"},
  {name:"푸르비에르 대성당", wikiTitle:"Basilica of Notre-Dame de Fourvière", type:"역사", desc:"리옹을 내려다보는 언덕 위 화려한 바실리카로 내부의 모자이크가 눈부십니다. 리옹의 상징이자 최고의 전망 포인트입니다.", rating:4.7, openTime:"07:00~19:00", price:"무료", website:"https://www.fourviere.org"},
  {name:"폴 보퀴즈 시장", wikiTitle:"Les Halles de Lyon – Paul Bocuse", type:"음식", desc:"프랑스 요리의 신 폴 보퀴즈의 이름을 딴 실내 시장으로 최고급 식재료와 리옹 특산물이 모여 있습니다. 미식 여행의 필수 코스입니다.", rating:4.7, openTime:"07:00~22:30", price:"무료", website:"https://en.wikipedia.org/wiki/Les_Halles_de_Lyon_%E2%80%93_Paul_Bocuse"},
  {name:"로마 극장", wikiTitle:"Ancient Theatre of Fourvière", type:"역사", desc:"기원전 15년에 건설된 프랑스에서 가장 오래된 로마 극장입니다. 여름에는 뉘 드 푸르비에르 축제가 열립니다.", rating:4.4, openTime:"07:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Ancient_Theatre_of_Fourvi%C3%A8re"},
]},
"보르도": { description:"보르도는 세계 와인의 수도로 유네스코 세계문화유산에 등재된 아름다운 도시입니다. 가론강변의 우아한 18세기 건축과 세계 최고의 와인 산지가 함께합니다.", spots:[
  {name:"라 시테 뒤 뱅(와인 박물관)", wikiTitle:"La Cité du Vin", type:"문화", desc:"와인의 역사와 문화를 체험하는 세계적인 박물관으로 독특한 곡선형 건축이 인상적입니다. 최상층에서 보르도 와인을 시음할 수 있습니다.", rating:4.5, openTime:"10:00~19:00", price:"€22", website:"https://www.laciteduvin.com"},
  {name:"생테밀리옹", wikiTitle:"Saint-Émilion", type:"문화", desc:"보르도 인근의 유네스코 세계문화유산 와인 마을로 중세 건축과 포도밭이 어우러진 풍경이 그림 같습니다. 와이너리 투어가 인기입니다.", rating:4.7, openTime:"투어 시간 상이", price:"투어 €25~", website:"https://en.wikipedia.org/wiki/Saint-%C3%89milion"},
  {name:"물의 거울(미루아 도)", wikiTitle:"Miroir d'eau", type:"랜드마크", desc:"보르도 부르스 광장 앞 세계 최대 반사 수면으로 건물과 하늘이 거울처럼 비칩니다. 특히 석양 때의 반영이 환상적입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Miroir_d%27eau"},
  {name:"보르도 대극장", wikiTitle:"Grand Théâtre de Bordeaux", type:"문화", desc:"18세기 신고전주의 건축의 걸작으로 12개의 거대한 코린트식 기둥이 인상적입니다. 파리 오페라 하우스의 영감이 된 건물입니다.", rating:4.4, openTime:"가이드 투어", price:"€6", website:"https://en.wikipedia.org/wiki/Grand_Th%C3%A9%C3%A2tre_de_Bordeaux"},
]},
"마르세유": { description:"마르세유는 프랑스에서 가장 오래된 도시로 2,600년 역사의 항구 도시입니다. 지중해의 활기와 다문화적 매력, 부야베스 요리가 유명합니다.", spots:[
  {name:"노트르담 드 라 가르드", wikiTitle:"Notre-Dame de la Garde", type:"역사", desc:"마르세유 최고 지점의 성당으로 황금빛 마리아상이 도시를 내려다봅니다. 마르세유 전체와 지중해를 360도로 조망할 수 있습니다.", rating:4.7, openTime:"07:00~19:00", price:"무료", website:"https://en.wikipedia.org/wiki/Notre-Dame_de_la_Garde"},
  {name:"구항(비유 포르)", wikiTitle:"Old Port of Marseille", type:"도시", desc:"마르세유의 심장부인 구항구로 매일 아침 신선한 어시장이 열립니다. 해안 카페에서 부야베스를 즐기며 항구를 바라봅니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Old_Port_of_Marseille"},
  {name:"칼랑크 국립공원", wikiTitle:"Calanques National Park", type:"자연", desc:"하얀 석회암 절벽과 터키석 빛 바다가 어우러진 지중해 절경입니다. 하이킹과 카약으로 숨겨진 해변을 탐험할 수 있습니다.", rating:4.8, openTime:"일출~일몰", price:"무료", website:"https://en.wikipedia.org/wiki/Calanques_National_Park"},
  {name:"뮈쌩(MuCEM)", wikiTitle:"MuCEM", type:"문화", desc:"유럽 지중해 문명 박물관으로 현대적인 격자 건축이 인상적입니다. 옥상 테라스에서 바다와 구항을 동시에 조망할 수 있습니다.", rating:4.4, openTime:"10:00~19:00", price:"€11", website:"https://www.mucem.org"},
]},
"몽생미셸": { description:"몽생미셸은 조수 간만에 따라 바다에 떠 있다 육지와 연결되는 섬 위의 수도원으로 세계적인 기적의 건축물입니다. 프랑스에서 가장 많이 방문하는 명소 중 하나입니다.", spots:[
  {name:"몽생미셸 수도원", wikiTitle:"Mont-Saint-Michel", type:"역사", desc:"8세기에 건설이 시작된 유네스코 세계문화유산 수도원으로 하늘을 찌르는 첨탑이 인상적입니다. 만조 때 바다에 떠 있는 듯한 풍경이 환상적입니다.", rating:4.9, openTime:"09:00~19:00", price:"€11", website:"https://www.abbaye-mont-saint-michel.fr"},
  {name:"그랑 뤼", wikiTitle:"Mont-Saint-Michel", type:"문화", desc:"섬 입구부터 수도원까지 이어지는 좁은 골목으로 기념품 가게와 레스토랑이 줄지어 있습니다. 명물 오믈렛을 맛볼 수 있습니다.", rating:4.3, openTime:"09:00~18:00", price:"무료", website:"https://www.ot-montsaintmichel.com"},
  {name:"야간 조명 관람", wikiTitle:"Mont-Saint-Michel", type:"랜드마크", desc:"해질 무렵부터 수도원에 조명이 켜지면 몽생미셸이 황금빛으로 빛납니다. 본토 쪽에서 바라보는 야경이 특히 감동적입니다.", rating:4.7, openTime:"일몰 후", price:"무료", website:"https://www.ot-montsaintmichel.com"},
]},
"스트라스부르": { description:"스트라스부르는 프랑스와 독일 문화가 만나는 알자스 지방의 수도로 목조 건물이 아기자기한 쁘띠 프랑스 지구가 유명합니다. 유럽의회 소재지이기도 합니다.", spots:[
  {name:"스트라스부르 대성당", wikiTitle:"Strasbourg Cathedral", type:"역사", desc:"높이 142m의 고딕 양식 대성당으로 분홍빛 사암이 독특합니다. 내부의 천문시계와 스테인드글라스가 걸작입니다.", rating:4.7, openTime:"07:00~19:00", price:"무료(전망대 €8)", website:"https://www.cathedrale-strasbourg.fr"},
  {name:"쁘띠 프랑스", wikiTitle:"Petite France, Strasbourg", type:"문화", desc:"일강변의 목조 가옥들이 동화 속 마을 같은 풍경을 연출하는 유네스코 세계문화유산 지구입니다. 수로를 따라 산책하기 완벽합니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Petite_France,_Strasbourg"},
  {name:"유럽의회", wikiTitle:"European Parliament", type:"도시", desc:"EU 유럽의회 본부로 가이드 투어를 통해 유럽 민주주의의 현장을 체험할 수 있습니다. 현대적 건축물이 인상적입니다.", rating:4.2, openTime:"가이드 투어", price:"무료", website:"https://en.wikipedia.org/wiki/European_Parliament"},
  {name:"크리스마스 마켓", wikiTitle:"Strasbourg Christmas market", type:"문화", desc:"1570년부터 이어진 유럽에서 가장 오래된 크리스마스 마켓입니다. 뱅쇼, 쿠글로프, 전통 장식품이 겨울 분위기를 가득 채웁니다.", rating:4.8, openTime:"11~12월", price:"무료", website:"https://en.wikipedia.org/wiki/Strasbourg_Christmas_market"},
]},
"앙시": { description:"앙시는 알프스 산기슭의 보석 같은 호수 도시로 프랑스의 베네치아라 불립니다. 투명한 호수와 중세 운하, 파스텔 건물이 동화 같은 풍경을 만들어냅니다.", spots:[
  {name:"앙시 호수", wikiTitle:"Lake Annecy", type:"자연", desc:"유럽에서 가장 깨끗한 호수 중 하나로 알프스를 배경으로 에메랄드빛 물이 펼쳐집니다. 수영, 카약, 패러글라이딩 등을 즐길 수 있습니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Lake_Annecy"},
  {name:"팔레 드 릴(섬의 궁전)", wikiTitle:"Palais de l'Île", type:"역사", desc:"티우강 한가운데 삼각형 모양으로 자리한 12세기 건물로 앙시의 아이콘입니다. 과거 감옥과 법원으로 사용되었습니다.", rating:4.5, openTime:"10:30~18:00", price:"€4", website:"https://en.wikipedia.org/wiki/Palais_de_l%27%C3%8Ele"},
  {name:"앙시 구시가", wikiTitle:"Annecy", type:"문화", desc:"운하를 따라 파스텔 색 건물과 꽃이 가득한 중세 마을입니다. 카페에 앉아 운하를 바라보며 시간을 보내기 좋습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Annecy"},
]},
"툴루즈": { description:"툴루즈는 장밋빛 도시(La Ville Rose)라는 별명의 프랑스 남서부 도시로 에어버스 본사가 위치한 항공우주 산업의 중심지입니다.", spots:[
  {name:"카피톨 광장", wikiTitle:"Place du Capitole", type:"도시", desc:"툴루즈의 중심 광장으로 장밋빛 벽돌 건물이 둘러싸고 있습니다. 시청 건물의 화려한 내부 장식이 볼만합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Place_du_Capitole"},
  {name:"시테 드 레스파스(우주 도시)", wikiTitle:"Cité de l'espace", type:"문화", desc:"에어버스와 아리안 로켓의 고장답게 우주 탐사를 체험할 수 있는 테마파크입니다. 실물 크기 우주정거장 모형이 인상적입니다.", rating:4.5, openTime:"10:00~18:00", price:"€25", website:"https://en.cite-espace.com"},
  {name:"생세르냉 대성당", wikiTitle:"Basilica of Saint-Sernin, Toulouse", type:"역사", desc:"유네스코 세계문화유산으로 유럽 최대의 로마네스크 성당입니다. 산티아고 순례길의 중요한 경유지입니다.", rating:4.5, openTime:"08:30~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Basilica_of_Saint-Sernin,_Toulouse"},
]},

// ────────────────────────── 이탈리아 ──────────────────────────
"로마": { description:"로마는 2,500년 역사의 영원한 도시로 콜로세움, 판테온, 바티칸 등 서양 문명의 핵심 유산이 집약된 곳입니다. 거리 자체가 거대한 야외 박물관입니다.", spots:[
  {name:"콜로세움", wikiTitle:"Colosseum", type:"역사", desc:"서기 80년에 완공된 로마 제국 최대의 원형경기장으로 5만 명을 수용할 수 있었습니다. 세계 7대 불가사의 중 하나인 유네스코 세계문화유산입니다.", rating:4.8, openTime:"09:00~19:00", price:"€18", website:"https://www.colosseo.it"},
  {name:"바티칸 박물관·시스티나 예배당", wikiTitle:"Vatican Museums", type:"문화", desc:"미켈란젤로의 천지창조가 있는 시스티나 예배당을 포함한 세계 최대급 미술 컬렉션입니다. 라파엘로의 아테네 학당도 필수 관람입니다.", rating:4.9, openTime:"08:00~19:00", price:"€17", website:"https://www.museivaticani.va"},
  {name:"판테온", wikiTitle:"Pantheon, Rome", type:"역사", desc:"2,000년 전 로마 시대에 건설된 신전으로 돔 천장의 오쿨루스(구멍)에서 쏟아지는 빛이 신비롭습니다. 입장료가 없어 더욱 매력적입니다.", rating:4.7, openTime:"09:00~19:00", price:"€5", website:"https://en.wikipedia.org/wiki/Pantheon,_Rome"},
  {name:"트레비 분수", wikiTitle:"Trevi Fountain", type:"랜드마크", desc:"바로크 양식의 로마 최대 분수로 동전을 던지면 로마에 다시 돌아온다는 전설이 있습니다. 야경이 특히 로맨틱합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://www.turismoroma.it"},
  {name:"트라스테베레", wikiTitle:"Trastevere", type:"음식", desc:"로마에서 가장 매력적인 동네로 좁은 골목에 현지 레스토랑과 바가 밀집해 있습니다. 진정한 로마의 밤 문화를 경험할 수 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Trastevere"},
]},
"베네치아": { description:"베네치아는 118개의 섬을 400여 개의 다리가 연결한 수상 도시로 세상 어디에도 없는 독특한 경관을 자랑합니다. 곤돌라, 산마르코 광장, 무라노 유리가 상징적입니다.", spots:[
  {name:"산마르코 광장", wikiTitle:"St Mark's Square", type:"랜드마크", desc:"나폴레옹이 유럽의 응접실이라 극찬한 베네치아의 중심 광장입니다. 산마르코 대성당, 두칼레 궁전, 종루가 둘러싸고 있습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/St_Mark%27s_Square"},
  {name:"곤돌라 유람", wikiTitle:"Gondola", type:"문화", desc:"베네치아의 상징인 곤돌라를 타고 좁은 수로를 누비는 로맨틱한 경험입니다. 탄식의 다리 아래를 지나가는 코스가 인기입니다.", rating:4.6, openTime:"09:00~19:00", price:"€80(30분)", website:"https://en.wikipedia.org/wiki/Gondola"},
  {name:"리알토 다리", wikiTitle:"Rialto Bridge", type:"역사", desc:"대운하를 가로지르는 베네치아에서 가장 오래된 다리로 셰익스피어의 베니스의 상인 배경입니다. 다리 위 상점에서 기념품을 살 수 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Rialto_Bridge"},
  {name:"부라노 섬", wikiTitle:"Burano", type:"문화", desc:"무지개빛 파스텔 색상의 집들이 늘어선 작은 섬으로 레이스 공예의 전통이 있습니다. 인스타그램 사진 찍기에 완벽한 곳입니다.", rating:4.7, openTime:"24시간", price:"수상버스 요금", website:"https://www.veneziaunica.it"},
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
  {name:"메르카토 디 메초(중앙시장)", wikiTitle:"Bologna", type:"음식", desc:"볼로냐의 중앙 시장으로 파르미지아노 레자노, 프로슈토, 수제 파스타 등 에밀리아로마냐 특산물을 맛볼 수 있습니다.", rating:4.6, openTime:"07:00~24:00", price:"무료", website:"https://www.bolognawelcome.com"},
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
  {name:"마드리드 왕궁", wikiTitle:"Royal Palace of Madrid", type:"역사", desc:"유럽에서 가장 큰 왕궁 중 하나로 3,418개의 방이 있습니다. 화려한 왕좌의 방과 무기 박물관이 볼거리입니다.", rating:4.6, openTime:"10:00~20:00", price:"€14", website:"https://www.patrimonionacional.es"},
  {name:"레티로 공원", wikiTitle:"Buen Retiro Park", type:"자연", desc:"마드리드 중심부의 거대한 공원으로 수정궁(팔라시오 데 크리스탈)과 보트 호수가 있습니다. 현지인들의 주말 휴식 공간입니다.", rating:4.5, openTime:"06:00~24:00", price:"무료", website:"https://www.esmadrid.com"},
  {name:"산미겔 시장", wikiTitle:"Mercado de San Miguel", type:"음식", desc:"아름다운 철골 구조의 미식 시장으로 타파스, 하몽, 와인 등 스페인 미식을 한곳에서 즐길 수 있습니다.", rating:4.4, openTime:"10:00~24:00", price:"무료", website:"https://en.wikipedia.org/wiki/Mercado_de_San_Miguel"},
]},
"세비야": { description:"세비야는 플라멩코와 투우의 도시로 스페인 남부 안달루시아의 수도입니다. 화려한 무데하르 양식 건축과 열정적인 축제 문화가 매력적입니다.", spots:[
  {name:"알카사르 궁전", wikiTitle:"Alcázar of Seville", type:"역사", desc:"무어-기독교 양식이 혼합된 화려한 왕궁으로 유네스코 세계문화유산입니다. 드라마 왕좌의 게임 촬영지로도 유명합니다.", rating:4.8, openTime:"09:30~19:00", price:"€14.50", website:"https://www.alcazarsevilla.org"},
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
  {name:"카스코 비에호(구시가)", wikiTitle:"Bilbao", type:"문화", desc:"7개의 골목으로 이루어진 빌바오의 구시가로 핀초스 바가 밀집해 있습니다. 바스크 미식 문화를 제대로 경험할 수 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://www.bilbaoturismo.net"},
  {name:"비스카야 다리", wikiTitle:"Vizcaya Bridge", type:"역사", desc:"세계 최초의 운반 다리로 유네스코 세계문화유산입니다. 곤돌라를 타고 강을 건너는 독특한 경험을 할 수 있습니다.", rating:4.3, openTime:"10:00~20:00", price:"€10(전망대)", website:"https://en.wikipedia.org/wiki/Vizcaya_Bridge"},
]},
"말라가": { description:"말라가는 코스타델솔의 중심 도시이자 피카소의 고향으로 햇살 가득한 지중해 해변과 풍부한 문화가 매력적입니다.", spots:[
  {name:"피카소 미술관", wikiTitle:"Museo Picasso Málaga", type:"문화", desc:"파블로 피카소의 고향에 자리한 미술관으로 285점의 작품을 소장하고 있습니다. 16세기 궁전을 개조한 건물도 아름답습니다.", rating:4.5, openTime:"10:00~19:00", price:"€12", website:"https://www.museopicassomalaga.org"},
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
  {name:"마리엔 광장·신시청사", wikiTitle:"Marienplatz", type:"랜드마크", desc:"뮌헨의 중심 광장으로 신고딕 양식의 신시청사와 매일 11시에 작동하는 글로켄슈필(시계탑 인형극)이 유명합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://www.muenchen.de"},
  {name:"호프브로이하우스", wikiTitle:"Hofbräuhaus am Platzl", type:"음식", desc:"1589년에 설립된 세계에서 가장 유명한 맥주홀입니다. 1리터 맥주잔과 전통 바이에른 음악, 학센(족발) 요리가 명물입니다.", rating:4.5, openTime:"09:00~23:30", price:"맥주 약 €12", website:"https://www.hofbraeuhaus.de"},
  {name:"님펜부르크 궁전", wikiTitle:"Nymphenburg Palace", type:"역사", desc:"바이에른 왕가의 여름 별궁으로 화려한 바로크 건축과 광대한 정원이 아름답습니다. 루트비히 2세의 출생지이기도 합니다.", rating:4.5, openTime:"09:00~18:00", price:"€8", website:"https://en.wikipedia.org/wiki/Nymphenburg_Palace"},
  {name:"잉글리셔 가르텐", wikiTitle:"English Garden, Munich", type:"자연", desc:"센트럴 파크보다 큰 뮌헨 시내 공원으로 아이스바흐 서핑이 명물입니다. 맥주 정원에서 밤나무 아래 맥주를 즐깁니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/English_Garden,_Munich"},
]},
"함부르크": { description:"함부르크는 독일 최대의 항구 도시로 엘베강변의 창고 지구와 미니어처 원더랜드, 활기찬 레퍼반 밤문화가 유명합니다.", spots:[
  {name:"미니어처 원더랜드", wikiTitle:"Miniatur Wunderland", type:"문화", desc:"세계 최대의 모형 철도 전시관으로 정교하게 재현된 도시와 풍경이 감탄을 자아냅니다. 어린이와 성인 모두에게 인기입니다.", rating:4.8, openTime:"08:00~21:00", price:"€20", website:"https://www.miniatur-wunderland.com"},
  {name:"슈파이히어슈타트(창고 지구)", wikiTitle:"Speicherstadt", type:"역사", desc:"세계 최대의 벽돌 창고 단지로 유네스코 세계문화유산입니다. 운하를 따라 늘어선 붉은 벽돌 건물의 야경이 로맨틱합니다.", rating:4.5, openTime:"24시간(외관)", price:"무료", website:"https://en.wikipedia.org/wiki/Speicherstadt"},
  {name:"엘프필하모니", wikiTitle:"Elbphilharmonie", type:"문화", desc:"파도 모양의 유리 건축이 인상적인 세계적 콘서트 홀입니다. 무료 전망 플라자에서 항구와 도시 전경을 감상할 수 있습니다.", rating:4.6, openTime:"플라자 09:00~24:00", price:"플라자 무료", website:"https://www.elbphilharmonie.de"},
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
  {name:"타워 브릿지", wikiTitle:"Tower Bridge", type:"랜드마크", desc:"1894년 완공된 런던의 상징으로 개폐식 다리의 유리 통로에서 템즈강을 내려다볼 수 있습니다. 야경이 특히 인상적입니다.", rating:4.6, openTime:"09:30~18:00", price:"£12.30", website:"https://www.towerbridge.org.uk"},
  {name:"웨스트민스터 궁전(빅벤)", wikiTitle:"Palace of Westminster", type:"역사", desc:"영국 국회의사당으로 빅벤이라 불리는 시계탑이 런던의 아이콘입니다. 템즈강변에서 바라보는 야경이 장엄합니다.", rating:4.7, openTime:"외관 24시간", price:"무료(외관)", website:"https://en.wikipedia.org/wiki/Palace_of_Westminster"},
  {name:"보로 마켓", wikiTitle:"Borough Market", type:"음식", desc:"1,000년 역사의 런던 최고 식재료 시장으로 세계 각국의 미식을 맛볼 수 있습니다. 토요일이 가장 활기찹니다.", rating:4.5, openTime:"10:00~17:00", price:"무료", website:"https://boroughmarket.org.uk"},
]},
"에든버러": { description:"에든버러는 스코틀랜드의 수도로 중세 올드타운과 조지안 양식의 뉴타운이 유네스코 세계문화유산입니다. 에든버러 성과 프린지 페스티벌이 유명합니다.", spots:[
  {name:"에든버러 성", wikiTitle:"Edinburgh Castle", type:"역사", desc:"캐슬록 위에 자리한 스코틀랜드의 상징으로 매일 오후 1시에 대포가 발사됩니다. 스코틀랜드 왕관 보석을 볼 수 있습니다.", rating:4.7, openTime:"09:30~18:00", price:"£19.50", website:"https://www.edinburghcastle.scot"},
  {name:"로열 마일", wikiTitle:"Royal Mile", type:"문화", desc:"에든버러 성에서 홀리루드 궁전까지 이어지는 1.6km의 역사적 거리입니다. 위스키 박물관, 세인트 자일스 대성당이 줄지어 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Royal_Mile"},
  {name:"아서스 시트", wikiTitle:"Arthur's Seat", type:"자연", desc:"시내 한가운데 251m 사화산 봉우리로 에든버러 전체와 포스만을 조망합니다. 30~45분 등반으로 최고의 전망을 얻습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Arthur%27s_Seat"},
  {name:"스카치 위스키 체험관", wikiTitle:"Scotch Whisky Experience", type:"문화", desc:"스코틀랜드 위스키 제조 과정을 배우고 시음하는 체험관입니다. 세계 최대의 위스키 컬렉션을 볼 수 있습니다.", rating:4.4, openTime:"10:00~18:00", price:"£19~", website:"https://www.scotchwhiskyexperience.co.uk"},
]},
"맨체스터": { description:"맨체스터는 산업혁명의 발상지이자 세계적인 축구 도시입니다. 뮤직 씬, 나이트라이프, 문화 시설이 풍부한 영국 북부의 중심 도시입니다.", spots:[
  {name:"올드 트래포드", wikiTitle:"Old Trafford", type:"랜드마크", desc:"맨체스터 유나이티드의 홈구장으로 꿈의 극장이라 불립니다. 경기일이 아닌 날에도 스타디움 투어가 가능합니다.", rating:4.6, openTime:"투어 09:30~16:30", price:"£29", website:"https://en.wikipedia.org/wiki/Old_Trafford"},
  {name:"노던 쿼터", wikiTitle:"Northern Quarter, Manchester", type:"문화", desc:"빈티지 숍, 독립 카페, 그래피티가 가득한 맨체스터의 힙한 동네입니다. 라이브 음악과 크래프트 맥주 씬이 활발합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Northern_Quarter,_Manchester"},
  {name:"과학산업박물관", wikiTitle:"Science and Industry Museum", type:"문화", desc:"산업혁명의 발상지에서 그 역사를 체험하는 무료 박물관입니다. 세계 최초의 기차역 건물에 자리하고 있습니다.", rating:4.3, openTime:"10:00~17:00", price:"무료", website:"https://www.scienceandindustrymuseum.org.uk"},
]},
"바스": { description:"바스는 로마 시대 온천과 조지안 건축의 아름다운 도시로 도시 전체가 유네스코 세계문화유산입니다. 제인 오스틴의 소설 배경으로도 유명합니다.", spots:[
  {name:"로만 바스(로마 온천)", wikiTitle:"Roman Baths (Bath)", type:"역사", desc:"2,000년 전 로마인들이 건설한 온천 시설이 놀랍도록 잘 보존되어 있습니다. 온천수를 직접 맛볼 수 있는 독특한 경험을 제공합니다.", rating:4.7, openTime:"09:00~18:00", price:"£28", website:"https://www.romanbaths.co.uk"},
  {name:"로열 크레센트", wikiTitle:"Royal Crescent", type:"역사", desc:"30개의 집이 반원형으로 이어진 18세기 조지안 건축의 걸작입니다. No.1 Royal Crescent 박물관에서 당시 생활상을 엿봅니다.", rating:4.5, openTime:"외관 24시간", price:"박물관 £12", website:"https://en.wikipedia.org/wiki/Royal_Crescent"},
  {name:"서미스 바스 스파", wikiTitle:"Thermae Bath Spa", type:"자연", desc:"바스의 천연 온천수를 이용한 현대적 스파입니다. 옥상 노천 온천에서 바스 시내를 바라보며 목욕할 수 있습니다.", rating:4.5, openTime:"09:00~21:00", price:"£40~", website:"https://www.thermaebathspa.com"},
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
  {name:"안필드", wikiTitle:"Anfield", type:"랜드마크", desc:"리버풀 FC의 홈구장으로 You'll Never Walk Alone이 울려퍼지는 축구 성지입니다. 스타디움 투어에서 선수들의 터널을 걸어봅니다.", rating:4.6, openTime:"투어 시간대", price:"£22", website:"https://www.liverpoolfc.com/visit-anfield"},
]},
"코츠월즈": { description:"코츠월즈는 꿀색 돌로 지어진 마을들이 완만한 구릉에 펼쳐진 영국 시골의 이상향입니다. 전원적인 풍경과 아기자기한 마을이 동화 속에 들어온 듯합니다.", spots:[
  {name:"바이버리", wikiTitle:"Bibury", type:"문화", desc:"윌리엄 모리스가 영국에서 가장 아름다운 마을이라 극찬한 곳입니다. 알링턴 로우의 14세기 석조 코티지가 엽서 같은 풍경입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Bibury"},
  {name:"버턴온더워터", wikiTitle:"Bourton-on-the-Water", type:"문화", desc:"코츠월즈의 베네치아라 불리는 마을로 윈드러시강이 마을 중앙을 흐릅니다. 미니어처 마을과 향수 공장이 인기입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Bourton-on-the-Water"},
  {name:"스토우온더월드", wikiTitle:"Stow-on-the-Wold", type:"문화", desc:"코츠월즈 언덕 꼭대기의 시장 마을로 앤틱 숍과 전통 펍이 매력적입니다. 반지의 제왕 문 모티브가 된 성 에드워드 교회가 유명합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Stow-on-the-Wold"},
]},
"글래스고": { description:"글래스고는 스코틀랜드 최대의 도시로 찰스 레니 매킨토시의 아르누보 건축과 활발한 예술 씬, 세계적 수준의 무료 박물관이 매력적입니다.", spots:[
  {name:"켈빈그로브 미술관·박물관", wikiTitle:"Kelvingrove Art Gallery and Museum", type:"문화", desc:"달리의 십자가의 성 요한의 그리스도 등 8,000점을 전시하는 무료 박물관입니다. 붉은 사암 건물 자체도 아름답습니다.", rating:4.6, openTime:"10:00~17:00", price:"무료", website:"https://www.glasgowlife.org.uk/museums/kelvingrove"},
  {name:"글래스고 대성당", wikiTitle:"Glasgow Cathedral", type:"역사", desc:"스코틀랜드 본토에서 유일하게 종교개혁을 온전히 넘긴 중세 성당입니다. 지하 묘소의 고딕 기둥숲이 인상적입니다.", rating:4.4, openTime:"10:00~16:00", price:"무료", website:"https://en.wikipedia.org/wiki/Glasgow_Cathedral"},
  {name:"네크로폴리스", wikiTitle:"Glasgow Necropolis", type:"역사", desc:"글래스고 대성당 뒤편 언덕의 빅토리안 묘지로 시내를 내려다보는 전망이 좋습니다. 정교한 묘비 조각이 예술적입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Glasgow_Necropolis"},
]},

// ────────────────────────── 미국 ──────────────────────────
"뉴욕": { description:"뉴욕은 세계 문화·금융의 수도로 자유의 여신상, 타임스 스퀘어, 센트럴 파크 등 수많은 아이콘이 있습니다. 끊임없는 에너지와 다양성이 매력인 도시입니다.", spots:[
  {name:"자유의 여신상", wikiTitle:"Statue of Liberty", type:"랜드마크", desc:"1886년 프랑스가 기증한 미국의 상징으로 높이 93m입니다. 리버티섬에서 맨해튼 스카이라인을 바라보는 전망이 감동적입니다.", rating:4.7, openTime:"09:00~17:00", price:"$24(페리 포함)", website:"https://www.nps.gov/stli/"},
  {name:"센트럴 파크", wikiTitle:"Central Park", type:"자연", desc:"맨해튼 한가운데 3.4km² 규모의 도시공원으로 뉴욕 시민들의 휴식처입니다. 보우 브리지, 베데스다 분수 등 영화 속 장소가 곳곳에 있습니다.", rating:4.7, openTime:"06:00~01:00", price:"무료", website:"https://www.centralparknyc.org"},
  {name:"타임스 스퀘어", wikiTitle:"Times Square", type:"도시", desc:"세계에서 가장 화려한 교차로로 거대한 LED 광고판과 브로드웨이 극장가가 있습니다. 밤이면 낮보다 더 밝게 빛나는 곳입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://www.timessquarenyc.org"},
  {name:"메트로폴리탄 미술관", wikiTitle:"Metropolitan Museum of Art", type:"문화", desc:"세계 3대 미술관 중 하나로 200만 점의 소장품을 보유합니다. 이집트 신전부터 현대미술까지 5,000년 인류 예술사를 만날 수 있습니다.", rating:4.8, openTime:"10:00~17:00", price:"$30", website:"https://www.metmuseum.org"},
  {name:"엠파이어 스테이트 빌딩", wikiTitle:"Empire State Building", type:"랜드마크", desc:"1931년 완공된 높이 443m의 아르데코 마천루로 86층 전망대에서 맨해튼 360도 전경을 감상합니다. 영화 수십 편의 촬영지입니다.", rating:4.6, openTime:"10:00~24:00", price:"$44", website:"https://www.esbnyc.com"},
]},
"로스앤젤레스": { description:"로스앤젤레스는 할리우드와 비벌리힐스, 산타모니카 해변으로 유명한 엔터테인먼트의 수도입니다. 1년 내내 화창한 날씨와 다양한 문화가 매력입니다.", spots:[
  {name:"할리우드 명예의 거리", wikiTitle:"Hollywood Walk of Fame", type:"문화", desc:"2,700개 이상의 별이 인도에 새겨진 할리우드 대로입니다. 차이니즈 시어터의 스타 핸드프린트도 함께 볼 수 있습니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://www.walkoffame.com"},
  {name:"산타모니카 피어", wikiTitle:"Santa Monica Pier", type:"자연", desc:"태평양이 펼쳐진 해변의 유서 깊은 부두로 놀이공원과 수족관이 있습니다. 루트66의 종착지로 석양이 특히 아름답습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://www.santamonicapier.org"},
  {name:"게티 센터", wikiTitle:"Getty Center", type:"문화", desc:"리처드 마이어가 설계한 미술관으로 반 고흐, 모네 등의 작품을 무료로 관람합니다. LA 전경을 조망하는 정원이 아름답습니다.", rating:4.7, openTime:"10:00~17:30", price:"무료(주차 $20)", website:"https://www.getty.edu/visit/center/"},
  {name:"그리피스 천문대", wikiTitle:"Griffith Observatory", type:"랜드마크", desc:"할리우드 사인과 LA 시내를 한눈에 바라보는 무료 천문대입니다. 영화 라라랜드 촬영지로 야경이 로맨틱합니다.", rating:4.6, openTime:"12:00~22:00", price:"무료", website:"https://griffithobservatory.org"},
]},
"샌프란시스코": { description:"샌프란시스코는 금문교, 케이블카, 가파른 언덕으로 유명한 서부 해안의 보석입니다. 실리콘밸리와 인접한 혁신의 도시이기도 합니다.", spots:[
  {name:"금문교", wikiTitle:"Golden Gate Bridge", type:"랜드마크", desc:"1937년 완공된 길이 2.7km의 현수교로 샌프란시스코의 상징입니다. 안개 속에서 붉은 다리가 드러나는 장면이 영화 같습니다.", rating:4.8, openTime:"24시간", price:"무료(통행료 남행 $9)", website:"https://www.goldengate.org"},
  {name:"피셔맨스 워프·피어 39", wikiTitle:"Fisherman's Wharf, San Francisco", type:"도시", desc:"해안가의 관광 지구로 바다사자 군락과 해산물 레스토랑이 유명합니다. 클램 차우더를 빵 그릇에 담아 먹는 것이 명물입니다.", rating:4.4, openTime:"10:00~22:00", price:"무료", website:"https://www.fishermanswharf.org"},
  {name:"알카트라즈 섬", wikiTitle:"Alcatraz Island", type:"역사", desc:"악명 높은 연방 교도소가 있던 섬으로 오디오 투어로 탈옥 시도 등의 역사를 생생하게 체험합니다. 반드시 사전 예약 필수입니다.", rating:4.7, openTime:"페리 09:00~16:00", price:"$42", website:"https://www.alcatrazcruises.com"},
  {name:"케이블카", wikiTitle:"San Francisco cable car system", type:"문화", desc:"1873년부터 운행 중인 세계 마지막 수동 케이블카 시스템입니다. 급경사 언덕을 오르내리며 도시를 구경하는 것 자체가 관광입니다.", rating:4.5, openTime:"06:30~23:00", price:"$8", website:"https://en.wikipedia.org/wiki/San_Francisco_cable_car_system"},
]},
"라스베이거스": { description:"라스베이거스는 네바다 사막 한가운데 세워진 오락의 도시로 화려한 카지노, 쇼, 레스토랑이 넘칩니다. 그랜드캐니언 여행의 관문이기도 합니다.", spots:[
  {name:"라스베이거스 스트립", wikiTitle:"Las Vegas Strip", type:"도시", desc:"6.8km의 메인 도로에 세계적인 호텔-카지노들이 늘어서 있습니다. 벨라지오 분수 쇼와 네온사인의 밤 풍경이 압도적입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Las_Vegas_Strip"},
  {name:"벨라지오 분수 쇼", wikiTitle:"Fountains of Bellagio", type:"랜드마크", desc:"음악에 맞춰 물줄기가 춤추는 무료 분수 쇼로 라스베이거스의 대표 볼거리입니다. 15~30분 간격으로 공연됩니다.", rating:4.7, openTime:"15:00~24:00", price:"무료", website:"https://en.wikipedia.org/wiki/Fountains_of_Bellagio"},
  {name:"프리몬트 스트리트", wikiTitle:"Fremont Street Experience", type:"문화", desc:"올드 라스베이거스의 메인 거리로 거대한 LED 천장 쇼와 집라인이 명물입니다. 스트립보다 빈티지한 분위기를 즐깁니다.", rating:4.3, openTime:"18:00~02:00(쇼)", price:"무료", website:"https://vegasexperience.com"},
]},
"마이애미": { description:"마이애미는 아르데코 건축과 라틴 문화, 아름다운 해변이 어우러진 플로리다의 열대 도시입니다. 사우스 비치의 화려한 나이트라이프가 유명합니다.", spots:[
  {name:"사우스 비치", wikiTitle:"South Beach", type:"자연", desc:"아르데코 건축물이 줄지어 있는 마이애미의 대표 해변입니다. 오션 드라이브의 파스텔 색 건물과 야자수가 열대 분위기를 완성합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/South_Beach"},
  {name:"리틀 하바나", wikiTitle:"Little Havana", type:"문화", desc:"쿠바 이민자들의 커뮤니티로 카예 오초 거리에서 쿠바 커피와 시가를 즐기며 라틴 음악을 듣습니다. 도미노 공원이 명물입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Little_Havana"},
  {name:"아르데코 역사지구", wikiTitle:"Miami Beach Architectural District", type:"문화", desc:"1920~30년대 아르데코 건축물 800여 채가 밀집한 지구입니다. 파스텔 색상의 건물들이 네온사인과 어우러져 독특한 분위기를 연출합니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Miami_Beach_Architectural_District"},
]},
"시카고": { description:"시카고는 미국 건축의 수도로 마천루의 발상지이며 딥디시 피자, 블루스 음악, 미술관으로 유명한 오대호변의 대도시입니다.", spots:[
  {name:"밀레니엄 파크(클라우드 게이트)", wikiTitle:"Cloud Gate", type:"랜드마크", desc:"거울 같은 콩 모양 조각 클라우드 게이트(The Bean)가 있는 시카고의 대표 공원입니다. 시카고 스카이라인이 거울면에 반사됩니다.", rating:4.6, openTime:"06:00~23:00", price:"무료", website:"https://www.chicago.gov/millenniumpark"},
  {name:"시카고 건축 보트 투어", wikiTitle:"Architecture of Chicago", type:"문화", desc:"시카고강을 따라 유명 건축물을 해설과 함께 감상하는 보트 투어입니다. 세계 최고의 도시 건축 투어로 꼽힙니다.", rating:4.8, openTime:"투어 시간대", price:"$47~", website:"https://www.architecture.org"},
  {name:"시카고 미술관", wikiTitle:"Art Institute of Chicago", type:"문화", desc:"쇠라의 그랑드자트섬의 일요일 오후, 에드워드 호퍼의 나이트호크스 등 걸작을 소장한 세계적 미술관입니다.", rating:4.8, openTime:"11:00~18:00", price:"$35", website:"https://www.artic.edu"},
]},
"워싱턴DC": { description:"워싱턴DC는 미국의 수도로 백악관, 링컨 기념관, 스미소니언 박물관군 등 미국 민주주의와 역사의 심장부입니다. 대부분의 박물관이 무료입니다.", spots:[
  {name:"내셔널 몰·링컨 기념관", wikiTitle:"Lincoln Memorial", type:"역사", desc:"링컨 대통령의 거대한 좌상이 있는 기념관으로 마틴 루터 킹의 'I Have a Dream' 연설 장소입니다. 워싱턴 기념탑까지 이어지는 내셔널 몰이 장엄합니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://www.nps.gov/linc/"},
  {name:"스미소니언 자연사 박물관", wikiTitle:"National Museum of Natural History", type:"문화", desc:"호프 다이아몬드와 공룡 화석 등이 전시된 세계 최대 자연사 박물관입니다. 입장 무료로 하루를 보내기 완벽합니다.", rating:4.7, openTime:"10:00~17:30", price:"무료", website:"https://naturalhistory.si.edu"},
  {name:"백악관", wikiTitle:"White House", type:"역사", desc:"미국 대통령의 관저로 외부에서 바라보며 미국 민주주의의 상징을 감상합니다. 사전 신청으로 내부 투어도 가능합니다.", rating:4.3, openTime:"외관 24시간", price:"무료", website:"https://www.whitehouse.gov"},
]},
"보스턴": { description:"보스턴은 미국 건국 역사의 중심지로 하버드, MIT 등 명문 대학과 자유의 길(프리덤 트레일)이 유명합니다.", spots:[
  {name:"프리덤 트레일", wikiTitle:"Freedom Trail", type:"역사", desc:"보스턴 시내 4km에 걸친 빨간 벽돌 선을 따라 미국 독립혁명의 16개 역사 유적지를 방문합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://www.thefreedomtrail.org"},
  {name:"하버드 대학교", wikiTitle:"Harvard University", type:"문화", desc:"1636년 설립된 미국 최고(最古)의 대학으로 캠퍼스 투어가 인기입니다. 존 하버드 동상의 왼발을 만지면 행운이 온다는 전설이 있습니다.", rating:4.5, openTime:"캠퍼스 24시간", price:"무료", website:"https://www.harvard.edu"},
  {name:"퀸시 마켓", wikiTitle:"Quincy Market", type:"음식", desc:"1826년에 세워진 역사적 시장으로 뉴잉글랜드 클램 차우더와 랍스터 롤이 명물입니다. 보스턴 미식 여행의 시작점입니다.", rating:4.3, openTime:"10:00~21:00", price:"무료", website:"https://www.quincy-market.com"},
]},
"뉴올리언스": { description:"뉴올리언스는 재즈의 발상지이자 프랑스 식민지 역사, 크리올 문화가 독특한 미국에서 가장 이색적인 도시입니다. 마디그라 축제와 미식이 유명합니다.", spots:[
  {name:"프렌치 쿼터", wikiTitle:"French Quarter", type:"문화", desc:"프랑스 식민지 시대 건축과 재즈 클럽, 레스토랑이 밀집한 뉴올리언스의 심장부입니다. 버번 스트리트의 밤문화가 전설적입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/French_Quarter"},
  {name:"잭슨 광장", wikiTitle:"Jackson Square", type:"역사", desc:"프렌치 쿼터의 중심 광장으로 세인트 루이스 대성당과 거리 예술가들이 특별한 분위기를 만듭니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Jackson_Square_(New_Orleans)"},
  {name:"카페 뒤 몽드", wikiTitle:"Café Du Monde", type:"음식", desc:"1862년부터 영업 중인 뉴올리언스의 상징적 카페로 분말 설탕이 잔뜩 뿌려진 베녜(튀김 도넛)와 치커리 커피가 명물입니다.", rating:4.5, openTime:"24시간", price:"약 $5~", website:"https://www.cafedumonde.com"},
]},
"시애틀": { description:"시애틀은 스타벅스 1호점과 스페이스 니들, 그런지 음악의 발상지로 태평양 북서부의 문화 중심지입니다. 아마존, 마이크로소프트 등 IT 기업의 본거지이기도 합니다.", spots:[
  {name:"파이크 플레이스 마켓", wikiTitle:"Pike Place Market", type:"음식", desc:"1907년 개장한 미국에서 가장 오래된 공영 시장입니다. 스타벅스 1호점, 껌벽, 생선 던지기 퍼포먼스가 유명합니다.", rating:4.7, openTime:"09:00~18:00", price:"무료", website:"https://www.pikeplacemarket.org"},
  {name:"스페이스 니들", wikiTitle:"Space Needle", type:"랜드마크", desc:"1962년 세계박람회를 위해 건설된 시애틀의 상징입니다. 전망대에서 레이니어산과 퓨젯사운드를 조망합니다.", rating:4.5, openTime:"10:00~21:00", price:"$39~", website:"https://www.spaceneedle.com"},
  {name:"뮤지엄 오브 팝 컬처", wikiTitle:"Museum of Pop Culture", type:"문화", desc:"프랭크 게리가 설계한 독특한 건물에 록 음악, SF, 게임 문화를 전시합니다. 지미 헨드릭스와 너바나의 유품이 있습니다.", rating:4.4, openTime:"10:00~17:00", price:"$32", website:"https://www.mopop.org"},
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
  {name:"샌디에이고 동물원", wikiTitle:"San Diego Zoo", type:"자연", desc:"세계에서 가장 유명한 동물원 중 하나로 4,000마리 이상의 동물을 자연 서식지와 유사한 환경에서 만날 수 있습니다.", rating:4.7, openTime:"09:00~21:00", price:"$69", website:"https://zoo.sandiegozoo.org"},
  {name:"발보아 파크", wikiTitle:"Balboa Park", type:"문화", desc:"17개의 박물관과 정원이 있는 거대한 문화공원입니다. 스패니시 리바이벌 건축이 아름답고 무료 공연도 자주 열립니다.", rating:4.6, openTime:"24시간", price:"무료(박물관별)", website:"https://www.balboapark.org"},
  {name:"코로나도 해변", wikiTitle:"Coronado, California", type:"자연", desc:"금빛 모래가 빛나는 미국 최고의 해변 중 하나입니다. 유서 깊은 호텔 델 코로나도와 함께 이 지역의 상징입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Coronado,_California"},
]},

// ────────────────────────── 호주 ──────────────────────────
"시드니": { description:"시드니는 호주 최대의 도시로 오페라 하우스와 하버 브릿지, 본다이 해변이 상징적입니다. 아름다운 항구와 현대적 도시가 조화를 이룹니다.", spots:[
  {name:"시드니 오페라 하우스", wikiTitle:"Sydney Opera House", type:"랜드마크", desc:"요른 웃손이 설계한 20세기 건축의 걸작으로 유네스코 세계문화유산입니다. 항구를 배경으로 한 조개껍데기 형태가 아이코닉합니다.", rating:4.8, openTime:"투어 09:00~17:00", price:"투어 A$43", website:"https://www.sydneyoperahouse.com"},
  {name:"시드니 하버 브릿지", wikiTitle:"Sydney Harbour Bridge", type:"랜드마크", desc:"세계에서 가장 넓은 단일 아치 다리로 정상까지 올라가는 브릿지 클라임이 인기입니다. 항구와 오페라 하우스를 내려다봅니다.", rating:4.6, openTime:"24시간", price:"클라임 A$174~", website:"https://www.bridgeclimb.com"},
  {name:"본다이 해변", wikiTitle:"Bondi Beach", type:"자연", desc:"시드니에서 가장 유명한 해변으로 서핑과 수영의 메카입니다. 본다이에서 쿠지까지의 해안 산책로가 절경입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://www.sydney.com/destinations/sydney/sydney-east/bondi"},
  {name:"록스 지구", wikiTitle:"The Rocks, Sydney", type:"문화", desc:"시드니에서 가장 오래된 지구로 영국 식민지 시대 건물과 주말 마켓이 매력적입니다. 펍과 레스토랑이 밀집해 있습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/The_Rocks,_Sydney"},
]},
"멜버른": { description:"멜버른은 호주의 문화 수도로 카페 문화, 그래피티 골목, 스포츠, 예술이 가득한 도시입니다. 세계에서 가장 살기 좋은 도시로 자주 선정됩니다.", spots:[
  {name:"호시어 레인", wikiTitle:"Hosier Lane", type:"문화", desc:"멜버른의 대표 그래피티 골목으로 건물 전체가 거대한 캔버스입니다. 수시로 바뀌는 거리 예술 작품을 감상합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Hosier_Lane"},
  {name:"그레이트 오션 로드", wikiTitle:"Great Ocean Road", type:"자연", desc:"멜버른 근교의 세계적인 해안 드라이브 코스로 12사도 바위가 하이라이트입니다. 절벽과 바다의 장엄한 풍경이 펼쳐집니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Great_Ocean_Road"},
  {name:"퀸 빅토리아 마켓", wikiTitle:"Queen Victoria Market", type:"음식", desc:"1878년부터 운영된 멜버른 최대의 야외 시장입니다. 신선한 식재료, 의류, 기념품까지 다양한 상품이 있습니다.", rating:4.3, openTime:"06:00~15:00", price:"무료", website:"https://qvm.com.au"},
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
  {name:"론파인 코알라 보호구역", wikiTitle:"Lone Pine Koala Sanctuary", type:"자연", desc:"세계 최초·최대의 코알라 보호구역으로 코알라를 안아볼 수 있습니다. 캥거루에게 먹이를 주는 체험도 인기입니다.", rating:4.5, openTime:"09:00~17:00", price:"A$49", website:"https://lonepinekoalasanctuary.com"},
  {name:"스토리 브릿지 클라임", wikiTitle:"Story Bridge", type:"랜드마크", desc:"브리즈번의 상징적 다리를 정상까지 올라가는 모험 투어입니다. 도시와 강의 파노라마 전망이 보상으로 주어집니다.", rating:4.3, openTime:"투어 시간대", price:"A$149~", website:"https://en.wikipedia.org/wiki/Story_Bridge"},
]},
"퍼스": { description:"퍼스는 호주 서해안의 외진 대도시로 아름다운 해변, 와인 산지, 독특한 자연이 매력적입니다. 지중해성 기후로 야외 활동에 완벽합니다.", spots:[
  {name:"로트네스트 섬(쿼카)", wikiTitle:"Rottnest Island", type:"자연", desc:"세계에서 가장 행복한 동물 쿼카를 만날 수 있는 섬입니다. 자전거로 섬을 돌며 아름다운 해변과 스노클링을 즐깁니다.", rating:4.7, openTime:"페리 시간대", price:"페리 A$60~", website:"https://www.rottnestisland.com"},
  {name:"킹스 파크", wikiTitle:"Kings Park, Perth", type:"자연", desc:"퍼스 시내를 내려다보는 거대한 공원으로 서호주 고유 야생화와 보태니컬 가든이 아름답습니다. 전쟁 기념관도 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Kings_Park,_Perth"},
  {name:"피너클스 사막", wikiTitle:"The Pinnacles", type:"자연", desc:"퍼스에서 2시간 거리의 기이한 석회암 기둥군입니다. 마치 외계 행성 같은 풍경이 독특한 포토 스팟입니다.", rating:4.4, openTime:"09:00~17:00", price:"A$15", website:"https://en.wikipedia.org/wiki/The_Pinnacles_(Western_Australia)"},
]},
"골드코스트": { description:"골드코스트는 57km 황금빛 해변과 세계적인 서핑 포인트, 테마파크가 밀집한 호주 최고의 휴양지입니다.", spots:[
  {name:"서퍼스 파라다이스", wikiTitle:"Surfers Paradise, Queensland", type:"자연", desc:"골드코스트의 중심 해변으로 서핑, 수영, 나이트라이프가 어우러집니다. 해변 마켓과 고층 빌딩 스카이라인이 독특합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Surfers_Paradise,_Queensland"},
  {name:"스프링브룩 국립공원", wikiTitle:"Springbrook National Park", type:"자연", desc:"곤드와나 열대우림의 일부로 반딧불이 동굴과 폭포가 있습니다. 내추럴 브릿지의 야간 반딧불이 투어가 환상적입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Springbrook_National_Park"},
  {name:"커럼빈 야생동물 보호구역", wikiTitle:"Currumbin Wildlife Sanctuary", type:"자연", desc:"코알라, 캥거루, 악어 등 호주 토착 동물을 만날 수 있는 보호구역입니다. 로리킷 새떼 먹이주기가 인기 체험입니다.", rating:4.4, openTime:"09:00~16:00", price:"A$55", website:"https://currumbinsanctuary.com.au"},
]},
"그레이트배리어리프": { description:"그레이트 배리어 리프는 우주에서도 보이는 세계 최대의 산호초 생태계로 2,300km에 걸쳐 있습니다. 다이빙과 스노클링의 성지입니다.", spots:[
  {name:"산호초 스노클링/다이빙", wikiTitle:"Great Barrier Reef", type:"자연", desc:"1,500종의 물고기와 400종의 산호를 만나는 세계 최고의 해양 체험입니다. 초보자도 쉽게 즐길 수 있는 스노클링부터 전문 다이빙까지 가능합니다.", rating:4.9, openTime:"투어 08:00~", price:"A$200~", website:"https://www.gbrmpa.gov.au"},
  {name:"화이트헤이븐 비치", wikiTitle:"Whitehaven Beach", type:"자연", desc:"98% 순도의 실리카 모래로 이루어진 세계에서 가장 아름다운 해변 중 하나입니다. 힐 인렛 전망대에서 바라보는 모래와 바다의 패턴이 환상적입니다.", rating:4.8, openTime:"투어 시간대", price:"투어 A$150~", website:"https://en.wikipedia.org/wiki/Whitehaven_Beach"},
  {name:"헤론 아일랜드", wikiTitle:"Heron Island", type:"자연", desc:"산호초 한가운데 자리한 작은 섬으로 해변에서 바로 스노클링이 가능합니다. 거북이 산란지로도 유명합니다.", rating:4.6, openTime:"리조트 운영 시", price:"숙박 요금 별도", website:"https://en.wikipedia.org/wiki/Heron_Island_(Queensland)"},
]},
"태즈메이니아": { description:"태즈메이니아는 호주 남쪽의 섬으로 때묻지 않은 원시 자연과 미식 문화가 매력적입니다. 세계에서 가장 깨끗한 공기와 물이 있습니다.", spots:[
  {name:"크래들 마운틴", wikiTitle:"Cradle Mountain", type:"자연", desc:"태즈메이니아를 대표하는 산으로 도브 호수에 비친 산의 반영이 아이코닉합니다. 오버랜드 트랙의 출발점이기도 합니다.", rating:4.8, openTime:"일출~일몰", price:"A$28(공원)", website:"https://en.wikipedia.org/wiki/Cradle_Mountain"},
  {name:"호바트 살라망카 마켓", wikiTitle:"Salamanca Market", type:"음식", desc:"매주 토요일 열리는 호바트의 대표 시장으로 태즈메이니아 특산물, 공예품, 굴, 치즈를 즐길 수 있습니다.", rating:4.5, openTime:"토요일 08:30~15:00", price:"무료", website:"https://www.salamancamarket.com.au"},
  {name:"프레시넷 국립공원(와인글라스 베이)", wikiTitle:"Wineglass Bay", type:"자연", desc:"와인잔 모양의 완벽한 곡선을 가진 해변으로 세계 10대 해변에 선정됩니다. 전망대까지 약 1시간 하이킹 후 보이는 풍경이 보상입니다.", rating:4.7, openTime:"24시간", price:"A$24(공원)", website:"https://en.wikipedia.org/wiki/Wineglass_Bay"},
]},

// ────────────────────────── 태국 ──────────────────────────
"방콕": { description:"방콕은 화려한 왕궁과 사원, 활기찬 길거리 음식, 쇼핑이 어우러진 동남아 최대의 관광 도시입니다. 전통과 현대가 혼재된 카오틱한 매력이 넘칩니다.", spots:[
  {name:"왕궁과 왓프라깨우", wikiTitle:"Grand Palace (Bangkok)", type:"역사", desc:"1782년부터 태국 왕실의 상징인 화려한 궁전과 에메랄드 불상을 모신 사원입니다. 태국 건축 예술의 정수를 보여줍니다.", rating:4.7, openTime:"08:30~15:30", price:"500바트", website:"https://www.royalgrandpalace.th"},
  {name:"왓아룬(새벽 사원)", wikiTitle:"Wat Arun", type:"역사", desc:"차오프라야강변에 솟아오른 높이 79m의 탑으로 방콕의 상징입니다. 도자기 조각으로 장식된 탑이 석양에 빛나는 모습이 장관입니다.", rating:4.6, openTime:"08:00~18:00", price:"100바트", website:"https://www.watarun.net"},
  {name:"카오산 로드", wikiTitle:"Khaosan Road", type:"도시", desc:"세계 배낭여행자들의 성지로 게스트하우스, 바, 길거리 음식이 가득합니다. 밤이면 클럽과 바의 음악으로 거리가 축제 분위기입니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Khaosan_Road"},
  {name:"짜뚜짝 주말시장", wikiTitle:"Chatuchak Weekend Market", type:"음식", desc:"세계 최대 규모의 야외 시장으로 15,000개 이상의 점포가 있습니다. 의류, 공예품, 음식, 반려동물까지 없는 것이 없습니다.", rating:4.5, openTime:"토·일 09:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Chatuchak_Weekend_Market"},
]},
"치앙마이": { description:"치앙마이는 태국 북부의 문화 수도로 300개 이상의 사원과 산악 부족 문화, 코끼리 보호구역이 매력적인 도시입니다. 방콕보다 여유롭고 자연 친화적입니다.", spots:[
  {name:"도이수텝 사원", wikiTitle:"Wat Phra That Doi Suthep", type:"역사", desc:"치앙마이를 내려다보는 산 정상의 황금 사원으로 306개 계단(또는 케이블카)을 올라야 합니다. 맑은 날 전망이 장관입니다.", rating:4.6, openTime:"06:00~18:00", price:"30바트", website:"https://en.wikipedia.org/wiki/Wat_Phra_That_Doi_Suthep"},
  {name:"구시가(올드타운)", wikiTitle:"Chiang Mai", type:"문화", desc:"사각형 해자로 둘러싸인 구시가에 수백 개의 사원이 밀집해 있습니다. 선데이 워킹 스트리트 야시장이 특히 인기입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Chiang_Mai"},
  {name:"코끼리 자연 공원", wikiTitle:"Elephant Nature Park", type:"자연", desc:"구조된 코끼리들을 윤리적으로 돌보는 보호구역입니다. 코끼리에게 먹이를 주고 함께 목욕하는 체험이 감동적입니다.", rating:4.8, openTime:"투어 시간대", price:"약 2,500바트", website:"https://www.elephantnaturepark.org"},
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
  {name:"워킹 스트리트", wikiTitle:"Walking Street, Pattaya", type:"도시", desc:"파타야의 대표 밤문화 거리로 네온사인과 음악이 넘칩니다. 클럽, 바, 쇼가 끊이지 않는 나이트라이프의 중심지입니다.", rating:4.0, openTime:"18:00~03:00", price:"무료", website:"https://en.wikipedia.org/wiki/Walking_Street,_Pattaya"},
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
  {name:"인도의 문(게이트웨이 오브 인디아)", wikiTitle:"Gateway of India", type:"랜드마크", desc:"1924년 영국 식민지 시대에 건설된 뭄바이의 상징적 아치문입니다. 아라비아해를 바라보며 인도의 역사를 느낍니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://www.maharashtratourism.gov.in"},
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
  {name:"봄 제수스 성당", wikiTitle:"Basilica of Bom Jesus", type:"역사", desc:"성 프란치스코 하비에르의 유해가 안치된 16세기 바로크 성당으로 유네스코 세계문화유산입니다.", rating:4.4, openTime:"09:00~18:30", price:"무료", website:"https://www.goa-tourism.com"},
  {name:"팔로렘 해변", wikiTitle:"Palolem", type:"자연", desc:"초승달 모양의 아름다운 해변으로 고아에서 가장 인기 있는 해변 중 하나입니다. 카약과 돌핀 투어가 인기입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Palolem"},
  {name:"올드 고아 유적", wikiTitle:"Old Goa", type:"역사", desc:"포르투갈 식민지 시대의 교회와 수도원이 밀집한 유네스코 세계문화유산 지구입니다.", rating:4.3, openTime:"09:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Old_Goa"},
]},
"자이푸르": { description:"자이푸르는 핑크 시티라 불리는 라자스탄의 수도로 화려한 궁전과 요새, 전통 시장이 매력적인 도시입니다.", spots:[
  {name:"암베르 포트", wikiTitle:"Amer Fort", type:"역사", desc:"라자스탄 최고의 요새로 힌두-무굴 건축이 융합된 화려한 궁전입니다. 거울의 방(시쉬 마할)이 특히 아름답습니다.", rating:4.7, openTime:"08:00~17:30", price:"₹500(외국인)", website:"https://www.amberfort.org"},
  {name:"하와 마할(바람의 궁전)", wikiTitle:"Hawa Mahal", type:"역사", desc:"953개의 작은 창문이 있는 5층 분홍색 궁전으로 자이푸르의 상징입니다. 왕비들이 창문을 통해 거리를 내려다보았습니다.", rating:4.5, openTime:"09:00~17:00", price:"₹200(외국인)", website:"https://en.wikipedia.org/wiki/Hawa_Mahal"},
  {name:"잔타르 만타르(천문대)", wikiTitle:"Jantar Mantar, Jaipur", type:"역사", desc:"18세기에 건설된 세계 최대의 석조 천문관측기구 모음으로 유네스코 세계문화유산입니다.", rating:4.3, openTime:"09:00~17:00", price:"₹200(외국인)", website:"https://en.wikipedia.org/wiki/Jantar_Mantar,_Jaipur"},
]},
"우다이푸르": { description:"우다이푸르는 호수의 도시로 불리며 로맨틱한 궁전과 호수가 어우러진 라자스탄의 보석입니다.", spots:[
  {name:"시티 팰리스", wikiTitle:"City Palace, Udaipur", type:"역사", desc:"피촐라 호수변에 자리한 라자스탄 최대의 궁전 단지입니다. 호수와 도시가 어우러진 전경이 장관입니다.", rating:4.6, openTime:"09:30~17:30", price:"₹300", website:"https://www.eternalmewar.in"},
  {name:"피촐라 호수", wikiTitle:"Lake Pichola", type:"자연", desc:"호수 한가운데 떠 있는 듯한 레이크 팰리스 호텔이 환상적입니다. 보트를 타고 호수를 유람하는 것이 최고의 경험입니다.", rating:4.5, openTime:"10:00~18:00", price:"보트 약 ₹400~", website:"https://en.wikipedia.org/wiki/Lake_Pichola"},
]},
"콜카타": { description:"콜카타는 인도의 문화 수도로 영국 식민지 시대 건축과 벵골 문화, 마더 테레사의 유산이 있는 도시입니다.", spots:[
  {name:"빅토리아 메모리얼", wikiTitle:"Victoria Memorial, Kolkata", type:"역사", desc:"백색 대리석으로 건설된 영국 식민지 시대의 기념관으로 콜카타의 랜드마크입니다. 아름다운 정원에 둘러싸여 있습니다.", rating:4.4, openTime:"10:00~17:00", price:"₹30", website:"https://en.wikipedia.org/wiki/Victoria_Memorial,_Kolkata"},
  {name:"하우라 다리", wikiTitle:"Howrah Bridge", type:"랜드마크", desc:"후글리강을 가로지르는 캔틸레버 다리로 매일 10만 대의 차량이 통과합니다. 일출 때의 풍경이 포토제닉합니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Howrah_Bridge"},
  {name:"마더 테레사의 집", wikiTitle:"Mother Teresa", type:"문화", desc:"마더 테레사가 설립한 사랑의 선교회 본부로 그녀의 무덤이 있습니다. 겸손한 삶의 흔적에 깊은 감동을 받습니다.", rating:4.5, openTime:"08:00~12:00, 15:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Mother_Teresa"},
]},
"케랄라": { description:"케랄라는 인도의 신의 나라로 불리며 야자수와 백워터(물길), 아유르베다, 향신료 정원이 매력적인 열대 낙원입니다.", spots:[
  {name:"알레피 백워터", wikiTitle:"Alleppey", type:"자연", desc:"야자수에 둘러싸인 수로를 하우스보트로 유람하는 케랄라 최고의 경험입니다. 현지 생활을 가까이서 관찰합니다.", rating:4.7, openTime:"투어 시간대", price:"하우스보트 약 ₹5,000~", website:"https://www.keralatourism.org"},
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
  {name:"루브르 아부다비", wikiTitle:"Louvre Abu Dhabi", type:"문화", desc:"장 누벨이 설계한 비의 돔 아래 세계 문명의 걸작을 전시하는 미술관입니다. 파리 루브르와의 협력으로 탄생했습니다.", rating:4.7, openTime:"10:00~18:30", price:"AED 63", website:"https://www.louvreabudhabi.ae"},
  {name:"야스 섬", wikiTitle:"Yas Island", type:"도시", desc:"페라리 월드, 야스 워터월드, F1 서킷이 있는 엔터테인먼트 섬입니다. 세계에서 가장 빠른 롤러코스터를 체험합니다.", rating:4.4, openTime:"12:00~20:00", price:"AED 375(페라리월드)", website:"https://en.wikipedia.org/wiki/Yas_Island"},
]},
"샤르자": { description:"샤르자는 UAE의 문화 수도로 이슬람 예술 박물관과 전통 수크(시장)가 매력적인 도시입니다.", spots:[
  {name:"샤르자 이슬람 문명 박물관", wikiTitle:"Sharjah Museum of Islamic Civilization", type:"문화", desc:"5,000점 이상의 이슬람 예술 작품과 유물을 전시하는 박물관입니다. 이슬람 과학과 문화의 황금기를 체험합니다.", rating:4.3, openTime:"08:00~20:00", price:"AED 10", website:"https://en.wikipedia.org/wiki/Sharjah_Museum_of_Islamic_Civilization"},
  {name:"블루 수크(중앙시장)", wikiTitle:"Central Market, Sharjah", type:"문화", desc:"이슬람 건축의 아름다운 시장으로 금, 보석, 향신료, 전통 공예품을 구입합니다. 파란 타일 장식이 인상적입니다.", rating:4.1, openTime:"09:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Sharjah"},
  {name:"알 노르 섬", wikiTitle:"Sharjah", type:"자연", desc:"코르니체 해안가의 작은 섬으로 나비 정원과 조각 공원이 있습니다. 가족 산책과 사진 촬영에 좋습니다.", rating:4.0, openTime:"09:00~23:00", price:"AED 15", website:"https://en.wikipedia.org/wiki/Sharjah"},
]},
"이스탄불": { description:"이스탄불은 유럽과 아시아가 만나는 세계 유일의 대륙 간 도시로 비잔틴과 오스만 제국의 유산이 켜켜이 쌓여 있습니다.", spots:[
  {name:"아야 소피아", wikiTitle:"Hagia Sophia", type:"역사", desc:"537년 건설된 비잔틴 건축의 걸작으로 성당, 모스크를 거쳐 현재 모스크로 운영 중입니다. 거대한 돔과 모자이크가 압도적입니다.", rating:4.8, openTime:"24시간(예배 시간 제외)", price:"무료", website:"https://muze.gen.tr/muze-detay/ayasofya"},
  {name:"블루 모스크(술탄아흐메트)", wikiTitle:"Blue Mosque", type:"역사", desc:"6개의 미나렛과 2만 장의 이즈닉 푸른 타일로 장식된 오스만 건축의 걸작입니다. 아야 소피아 맞은편에 자리합니다.", rating:4.6, openTime:"예배 시간 외", price:"무료", website:"https://www.sultanahmetcamii.org"},
  {name:"그랜드 바자르", wikiTitle:"Grand Bazaar, Istanbul", type:"문화", desc:"1461년부터 운영된 세계에서 가장 오래되고 큰 실내 시장으로 4,000개 이상의 점포가 있습니다. 카펫, 보석, 향신료 쇼핑의 천국입니다.", rating:4.4, openTime:"08:30~19:00", price:"무료", website:"https://www.grandbazaaristanbul.org"},
  {name:"보스포루스 해협 크루즈", wikiTitle:"Bosphorus", type:"자연", desc:"유럽과 아시아 사이 해협을 유람하며 궁전, 요새, 해안 마을을 감상합니다. 이스탄불의 진면목을 바다에서 볼 수 있습니다.", rating:4.6, openTime:"투어 시간대", price:"약 25TL~", website:"https://istanbul.goturkiye.com"},
]},
"카파도키아": { description:"카파도키아는 수천만 년 화산 활동과 침식이 만든 기이한 바위 지형과 동굴 마을이 있는 초현실적 풍경의 땅입니다. 열기구 투어가 세계적으로 유명합니다.", spots:[
  {name:"열기구 투어", wikiTitle:"Cappadocia", type:"자연", desc:"일출 때 수백 개의 열기구가 동시에 떠오르는 세계에서 가장 유명한 열기구 체험입니다. 버섯 바위와 계곡 위를 날아봅니다.", rating:4.9, openTime:"새벽 투어", price:"약 €200~", website:"https://en.wikipedia.org/wiki/Cappadocia"},
  {name:"괴레메 야외 박물관", wikiTitle:"Göreme National Park", type:"역사", desc:"바위를 깎아 만든 비잔틴 교회와 프레스코 벽화가 보존된 유네스코 세계문화유산입니다. 암굴 교회의 벽화가 인상적입니다.", rating:4.7, openTime:"08:00~19:00", price:"100TL", website:"https://en.wikipedia.org/wiki/G%C3%B6reme_National_Park"},
  {name:"데린쿠유 지하도시", wikiTitle:"Derinkuyu underground city", type:"역사", desc:"지하 8층 깊이의 고대 지하도시로 2만 명이 거주할 수 있었습니다. 미로 같은 통로와 방이 경이롭습니다.", rating:4.5, openTime:"08:00~17:00", price:"60TL", website:"https://en.wikipedia.org/wiki/Derinkuyu_underground_city"},
]},
"파묵칼레": { description:"파묵칼레는 솜의 성이란 뜻의 순백 석회 계단식 온천으로 푸른 온천수가 하얀 석회층 위로 흐르는 초현실적 풍경입니다.", spots:[
  {name:"석회 계단식 온천", wikiTitle:"Pamukkale", type:"자연", desc:"수천 년간 석회질 온천수가 만든 하얀 계단식 지형으로 유네스코 세계유산입니다. 맨발로 온천수를 걸으며 자연의 경이를 체험합니다.", rating:4.7, openTime:"06:30~21:00", price:"200TL", website:"https://www.pamukkale.gov.tr"},
  {name:"히에라폴리스", wikiTitle:"Hierapolis", type:"역사", desc:"파묵칼레 위의 고대 로마 온천 도시 유적입니다. 원형극장과 네크로폴리스(묘지)가 잘 보존되어 있습니다.", rating:4.4, openTime:"파묵칼레 입장 시", price:"포함", website:"https://en.wikipedia.org/wiki/Hierapolis"},
  {name:"클레오파트라 풀", wikiTitle:"Pamukkale", type:"자연", desc:"고대 로마 기둥이 잠겨있는 35°C 천연 온천 수영장입니다. 클레오파트라가 이곳에서 목욕했다는 전설이 있습니다.", rating:4.3, openTime:"08:00~19:00", price:"추가 130TL", website:"https://www.pamukkale.gov.tr"},
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
  {name:"보드룸 해변·바 스트리트", wikiTitle:"Bodrum", type:"도시", desc:"낮에는 아름다운 해변에서 휴식, 밤에는 바 스트리트에서 터키 나이트라이프를 즐깁니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://www.bodrumturkey.com"},
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
  {name:"아크로폴리스·파르테논 신전", wikiTitle:"Acropolis of Athens", type:"역사", desc:"서양 문명의 상징인 기원전 5세기 파르테논 신전이 있는 성채 언덕입니다. 유네스코 세계문화유산으로 인류 역사의 핵심입니다.", rating:4.8, openTime:"08:00~20:00", price:"€20", website:"https://www.theacropolismuseum.gr"},
  {name:"플라카 지구", wikiTitle:"Plaka", type:"문화", desc:"아크로폴리스 아래 좁은 골목에 타베르나(식당), 기념품 가게가 밀집한 구시가입니다. 그리스 음식과 우조를 즐기기 좋습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Plaka"},
  {name:"아크로폴리스 박물관", wikiTitle:"Acropolis Museum", type:"문화", desc:"아크로폴리스 발굴품을 전시하는 현대적 박물관으로 유리 바닥 아래 고대 유적도 볼 수 있습니다.", rating:4.7, openTime:"09:00~17:00", price:"€10", website:"https://www.theacropolismuseum.gr"},
]},
"미코노스": { description:"미코노스는 에게해의 파티 섬으로 풍차, 하얀 골목, 세계적인 나이트라이프가 매력적인 그리스의 대표 휴양지입니다.", spots:[
  {name:"리틀 베니스", wikiTitle:"Mykonos", type:"문화", desc:"바다 위로 돌출된 중세 건물에 카페와 바가 자리한 미코노스의 가장 로맨틱한 지구입니다. 석양이 특히 아름답습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mykonos"},
  {name:"미코노스 풍차", wikiTitle:"Mykonos", type:"랜드마크", desc:"카토밀리 풍차는 미코노스의 상징으로 16세기부터 곡물을 분쇄하던 풍차입니다. 석양 배경으로 포토제닉합니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mykonos"},
  {name:"파라다이스 비치", wikiTitle:"Mykonos", type:"자연", desc:"미코노스에서 가장 유명한 파티 해변으로 DJ 음악과 함께 수영과 일광욕을 즐깁니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mykonos"},
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
  {name:"메테오라 수도원", wikiTitle:"Meteora", type:"역사", desc:"최대 400m 높이의 사암 기둥 위에 자리한 6개의 활동 중인 수도원입니다. 유네스코 세계유산으로 이 세상의 풍경이 아닌 듯합니다.", rating:4.9, openTime:"09:00~17:00(수도원별)", price:"€3(각 수도원)", website:"https://www.visitmeteora.travel"},
  {name:"그레이트 메테오론 수도원", wikiTitle:"Great Meteoron", type:"역사", desc:"메테오라에서 가장 크고 오래된 수도원으로 14세기에 건립되었습니다. 내부 프레스코 벽화와 전망이 압도적입니다.", rating:4.7, openTime:"09:00~17:00", price:"€3", website:"https://en.wikipedia.org/wiki/Great_Meteoron"},
]},

// ────────────────────────── 베트남 ──────────────────────────
"하노이": { description:"하노이는 천년 역사를 간직한 베트남의 수도로, 프랑스 식민지 시대 건축물과 전통 사원이 어우러진 매력적인 도시입니다. 호안끼엠 호수를 중심으로 구시가지의 활기찬 거리와 맛있는 쌀국수가 여행자를 맞이합니다.", spots:[
  {name:"호안끼엠 호수", wikiTitle:"Hoan Kiem Lake", type:"자연", desc:"하노이 중심에 자리한 호수로 거북이 전설이 깃든 도시의 심장입니다. 호수 위 옥산사와 붉은 다리가 아름다운 풍경을 만듭니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://vietnam.travel/things-to-do/hoan-kiem-lake"},
  {name:"하노이 구시가지 36거리", wikiTitle:"Hanoi Old Quarter", type:"문화", desc:"36개 직업 길드 거리로 이루어진 구시가지로 각 거리마다 특화된 상품을 판매합니다. 오토바이와 노점상의 활기가 넘칩니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://vietnam.travel/places-to-go/hanoi"},
  {name:"호치민 묘소", wikiTitle:"Ho Chi Minh Mausoleum", type:"역사", desc:"베트남 건국의 아버지 호치민이 안치된 대리석 묘소입니다. 엄숙한 분위기 속에서 베트남 현대사를 느낄 수 있습니다.", rating:4.4, openTime:"07:30~10:30(화~목,토,일)", price:"무료", website:"https://www.lăngbachochiminh.vn"},
  {name:"문묘", wikiTitle:"Temple of Literature, Hanoi", type:"역사", desc:"1070년에 세워진 베트남 최초의 대학으로 공자를 모시는 사원입니다. 아름다운 정원과 전통 건축이 인상적입니다.", rating:4.6, openTime:"08:00~17:00", price:"30,000 VND", website:"https://vanmieu.com.vn"},
  {name:"분짜 거리", wikiTitle:"Bun cha", type:"음식", desc:"숯불에 구운 돼지고기와 쌀국수를 느억맘 소스에 찍어 먹는 하노이 대표 음식입니다. 오바마 대통령도 방문한 분짜 흐엉리엔이 유명합니다.", rating:4.7, openTime:"10:00~14:00", price:"40,000~60,000 VND", website:"https://vietnam.travel/things-to-do/bun-cha"},
]},
"호찌민시": { description:"호찌민시는 베트남 최대의 경제 도시로 프랑스 식민지 시대의 우아한 건축물과 현대적 고층 빌딩이 공존합니다. 에너지 넘치는 거리와 맛있는 길거리 음식이 매력적입니다.", spots:[
  {name:"노트르담 대성당", wikiTitle:"Notre-Dame Cathedral Basilica of Saigon", type:"역사", desc:"1880년 프랑스 식민지 시대에 건설된 붉은 벽돌 성당으로 호찌민시의 상징입니다. 로마네스크 양식의 두 첨탑이 인상적입니다.", rating:4.5, openTime:"08:00~17:00", price:"무료", website:"https://www.vietnam.travel/places-to-go/ho-chi-minh-city"},
  {name:"벤탄 시장", wikiTitle:"Ben Thanh Market", type:"음식", desc:"1914년부터 운영된 호찌민시의 대표 시장으로 현지 음식, 기념품, 의류 등 모든 것을 만날 수 있습니다.", rating:4.3, openTime:"06:00~18:00", price:"무료", website:"https://vietnam.travel/things-to-do/ben-thanh-market"},
  {name:"전쟁박물관", wikiTitle:"War Remnants Museum", type:"역사", desc:"베트남 전쟁의 참상을 보여주는 박물관으로 전쟁 사진과 무기, 장비가 전시되어 있습니다. 강렬한 감동을 주는 장소입니다.", rating:4.6, openTime:"07:30~18:00", price:"40,000 VND", website:"https://warremnantsmuseum.com"},
  {name:"구찌 터널", wikiTitle:"Cu Chi tunnels", type:"역사", desc:"베트남전 당시 게릴라들이 사용한 거대한 지하 터널 네트워크입니다. 실제 터널 내부를 체험할 수 있습니다.", rating:4.5, openTime:"07:00~17:00", price:"110,000 VND", website:"https://diacuchi.com.vn"},
]},
"하롱베이": { description:"하롱베이는 약 1,600개의 석회암 섬과 기둥이 에메랄드빛 바다 위에 솟아오른 유네스코 세계자연유산입니다. 크루즈 투어로 신비로운 카르스트 지형을 감상할 수 있습니다.", spots:[
  {name:"하롱베이 크루즈", wikiTitle:"Ha Long Bay", type:"자연", desc:"1~2박 크루즈로 기암괴석 사이를 항해하며 카약, 수영, 동굴 탐험을 즐길 수 있습니다. 일출과 일몰이 장관입니다.", rating:4.8, openTime:"연중무휴", price:"1박 $80~300", website:"https://halongbay.com.vn"},
  {name:"승솟동굴", wikiTitle:"Sung Sot Cave", type:"자연", desc:"하롱베이 최대 규모의 석회동굴로 내부에 거대한 석순과 종유석이 환상적인 세계를 만듭니다.", rating:4.6, openTime:"08:00~17:00", price:"크루즈 포함", website:"https://en.wikipedia.org/wiki/Sung_Sot_Cave"},
  {name:"티톱섬", wikiTitle:"Ti Top Island", type:"자연", desc:"정상까지 계단을 올라가면 하롱베이 전경을 한눈에 볼 수 있는 전망대가 있습니다. 작은 해변에서 수영도 가능합니다.", rating:4.4, openTime:"08:00~17:00", price:"크루즈 포함", website:"https://en.wikipedia.org/wiki/Ti_Top_Island"},
]},
"호이안": { description:"호이안은 15~19세기 국제 무역항의 모습이 고스란히 보존된 유네스코 세계문화유산 도시입니다. 밤이 되면 수천 개의 등불이 켜지며 환상적인 분위기를 연출합니다.", spots:[
  {name:"호이안 고대 도시", wikiTitle:"Hoi An Ancient Town", type:"역사", desc:"일본식 다리, 중국 사원, 프랑스 식민지 건물이 어우러진 보존된 무역항 도시입니다. 등불 축제가 특히 유명합니다.", rating:4.8, openTime:"08:00~21:00", price:"120,000 VND(통합권)", website:"https://hoianworldheritage.org.vn"},
  {name:"일본교(내원교)", wikiTitle:"Japanese Covered Bridge", type:"역사", desc:"1593년 일본 상인들이 건설한 호이안의 상징적인 지붕 다리입니다. 20만 동 지폐에도 그려져 있습니다.", rating:4.6, openTime:"08:00~21:00", price:"통합권 포함", website:"https://en.wikipedia.org/wiki/Japanese_Covered_Bridge"},
  {name:"안방 비치", wikiTitle:"An Bang Beach", type:"자연", desc:"호이안 시내에서 자전거로 10분 거리의 아름다운 해변으로 세계적으로 유명한 숨은 보석입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/An_Bàng"},
  {name:"호이안 까오라우", wikiTitle:"Cao lau", type:"음식", desc:"호이안에서만 먹을 수 있는 특별한 면요리로 독특한 면 식감과 돼지고기, 허브 조합이 일품입니다.", rating:4.6, openTime:"06:00~21:00", price:"30,000~50,000 VND", website:"https://en.wikipedia.org/wiki/Cao_lau"},
]},
"다낭": { description:"다낭은 베트남 중부의 해안 도시로 아름다운 해변과 바나힐 등 현대적 관광지가 조화를 이룹니다. 호이안과 후에를 잇는 관광 거점 도시입니다.", spots:[
  {name:"바나힐 골든브릿지", wikiTitle:"Golden Bridge (Vietnam)", type:"랜드마크", desc:"거대한 두 손이 받치고 있는 듯한 독특한 디자인의 보행교로 해발 1,400m에서 탁 트인 전망을 즐길 수 있습니다.", rating:4.7, openTime:"07:00~22:00", price:"850,000 VND", website:"https://banahills.sunworld.vn"},
  {name:"미케 해변", wikiTitle:"My Khe Beach", type:"자연", desc:"미국 포브스지가 세계에서 가장 매력적인 해변 중 하나로 선정한 해변입니다. 서핑과 수영 모두 즐길 수 있습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/My_Khe_Beach"},
  {name:"오행산(마블 마운틴)", wikiTitle:"Marble Mountains (Vietnam)", type:"자연", desc:"다섯 개의 대리석 산으로 이루어져 있으며 내부에 동굴 사원과 전망대가 있습니다. 베트남 전쟁 당시의 역사도 간직하고 있습니다.", rating:4.5, openTime:"07:00~17:30", price:"40,000 VND", website:"https://en.wikipedia.org/wiki/Marble_Mountains_(Vietnam)"},
  {name:"용교(드래곤 브릿지)", wikiTitle:"Dragon Bridge (Da Nang)", type:"랜드마크", desc:"용 모양으로 설계된 666m 길이의 다리로 주말 밤 9시에 용의 입에서 불과 물을 뿜는 쇼가 펼쳐집니다.", rating:4.4, openTime:"24시간(쇼 토·일 21:00)", price:"무료", website:"https://en.wikipedia.org/wiki/Dragon_Bridge_(Da_Nang)"},
]},
"후에": { description:"후에는 베트남 마지막 왕조 응우옌 왕조의 수도였던 도시로 황궁과 황제릉이 유네스코 세계유산으로 등재되어 있습니다. 향강을 따라 펼쳐지는 고즈넉한 풍경이 매력적입니다.", spots:[
  {name:"후에 황궁", wikiTitle:"Imperial City, Huế", type:"역사", desc:"응우옌 왕조의 궁궐로 베이징 자금성을 모델로 건설되었습니다. 전쟁으로 일부 파괴되었으나 복원이 진행 중입니다.", rating:4.6, openTime:"07:00~17:30", price:"200,000 VND", website:"https://hueworldheritage.org.vn"},
  {name:"카이딘 황제릉", wikiTitle:"Khai Dinh", type:"역사", desc:"동서양 건축이 융합된 독특한 양식의 황제릉으로 정교한 모자이크 장식이 압도적입니다.", rating:4.5, openTime:"07:00~17:30", price:"150,000 VND", website:"https://en.wikipedia.org/wiki/Khải_Định"},
  {name:"티엔무 사원", wikiTitle:"Thiên Mụ Pagoda", type:"역사", desc:"향강 언덕 위에 자리한 7층 팔각탑으로 후에의 상징입니다. 1601년에 건립된 베트남에서 가장 유명한 사원 중 하나입니다.", rating:4.5, openTime:"08:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Thiên_Mụ_Pagoda"},
]},
"사파": { description:"사파는 베트남 북부 산악 지대에 자리한 소수민족의 터전으로 계단식 논과 안개 낀 산봉우리가 만드는 풍경이 장관입니다. 트레킹과 홈스테이로 소수민족 문화를 체험할 수 있습니다.", spots:[
  {name:"판시판산", wikiTitle:"Fansipan", type:"자연", desc:"해발 3,143m로 인도차이나 반도 최고봉입니다. 케이블카로 정상 근처까지 올라갈 수 있어 접근이 수월합니다.", rating:4.7, openTime:"07:30~17:30", price:"700,000 VND(케이블카)", website:"https://fansipanlegend.sunworld.vn"},
  {name:"무엉호아 계곡", wikiTitle:"Mường Hoa valley", type:"자연", desc:"사파에서 가장 아름다운 계단식 논이 펼쳐지는 계곡으로 소수민족 마을과 고대 암각화가 있습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mường_Hoa_valley"},
  {name:"깟깟 마을", wikiTitle:"Cat Cat village", type:"문화", desc:"흑몽족이 거주하는 전통 마을로 폭포와 대나무 숲이 어우러져 있습니다. 전통 직물 짜기 체험이 가능합니다.", rating:4.4, openTime:"07:00~18:00", price:"70,000 VND", website:"https://en.wikipedia.org/wiki/Cát_Cát"},
]},
"푸꾸옥": { description:"푸꾸옥은 베트남 최대의 섬으로 에메랄드빛 바다와 새하얀 모래사장이 펼쳐진 열대 낙원입니다. 최근 리조트 개발이 활발하여 동남아시아의 새로운 휴양지로 떠오르고 있습니다.", spots:[
  {name:"사오 비치", wikiTitle:"Phu Quoc", type:"자연", desc:"푸꾸옥 남동쪽의 새하얀 모래사장과 투명한 바다가 아름다운 해변입니다. 야자수 그늘 아래 휴식을 즐기기에 완벽합니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Phu_Quoc"},
  {name:"빈원더스 푸꾸옥", wikiTitle:"VinWonders", type:"도시", desc:"베트남 최대 규모의 놀이공원 겸 리조트 단지로 워터파크, 사파리, 수족관 등이 한곳에 모여 있습니다.", rating:4.5, openTime:"09:00~21:00", price:"750,000 VND", website:"https://en.wikipedia.org/wiki/VinWonders"},
  {name:"푸꾸옥 야시장", wikiTitle:"Phu Quoc Night Market", type:"음식", desc:"신선한 해산물 구이와 베트남 현지 음식을 저렴하게 즐길 수 있는 활기찬 야시장입니다.", rating:4.4, openTime:"17:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Phu_Quoc"},
]},
"닌빈": { description:"닌빈은 '육지의 하롱베이'로 불리는 석회암 카르스트 지형이 논과 강 사이로 솟아오른 비경의 땅입니다. 짱안 생태관광지구는 유네스코 세계유산으로 등재되어 있습니다.", spots:[
  {name:"짱안 보트투어", wikiTitle:"Tràng An", type:"자연", desc:"석회암 동굴과 계곡 사이를 배로 지나며 감상하는 코스로 킹콩 영화 촬영지이기도 합니다. 유네스코 세계유산입니다.", rating:4.7, openTime:"07:00~16:00", price:"250,000 VND", website:"https://quangtrangancomplex.vn"},
  {name:"바이딘 사원", wikiTitle:"Bai Dinh Temple", type:"역사", desc:"동남아시아 최대 규모의 불교 사원 단지로 500개 이상의 아라한 석상이 줄지어 있습니다.", rating:4.5, openTime:"06:00~18:00", price:"100,000 VND(전기차)", website:"https://en.wikipedia.org/wiki/Bái_Đính_Temple"},
  {name:"항무아 전망대", wikiTitle:"Hang Mua", type:"자연", desc:"500개의 계단을 올라가면 닌빈 전체의 논과 카르스트 산이 한눈에 펼쳐지는 절경을 볼 수 있습니다.", rating:4.6, openTime:"06:00~18:00", price:"100,000 VND", website:"https://en.wikipedia.org/wiki/Hang_Múa"},
]},

// ────────────────────────── 인도네시아 ──────────────────────────
"발리": { description:"발리는 신들의 섬이라 불리는 인도네시아 최고의 관광지로 힌두 사원, 계단식 논, 아름다운 해변이 조화를 이룹니다. 우붓의 예술 문화와 쿠타의 서핑 문화가 공존하는 매혹적인 섬입니다.", spots:[
  {name:"울루와뚜 사원", wikiTitle:"Uluwatu Temple", type:"역사", desc:"70m 높이 절벽 위에 자리한 바다 사원으로 일몰 시간의 케착 댄스 공연이 유명합니다.", rating:4.7, openTime:"07:00~19:00", price:"50,000 IDR", website:"https://www.indonesia.travel/gb/en/destinations/bali-nusa-tenggara/uluwatu"},
  {name:"뜨갈랄랑 라이스 테라스", wikiTitle:"Tegallalang Rice Terrace", type:"자연", desc:"우붓 북쪽의 아름다운 계단식 논으로 전통 수바크 관개 시스템이 유네스코에 등재되어 있습니다.", rating:4.6, openTime:"08:00~18:00", price:"15,000 IDR", website:"https://en.wikipedia.org/wiki/Tegallalang"},
  {name:"따나롯 사원", wikiTitle:"Tanah Lot", type:"역사", desc:"바다 위 바위 위에 세워진 힌두 사원으로 밀물 시 섬처럼 변합니다. 발리 최고의 일몰 명소입니다.", rating:4.7, openTime:"07:00~19:00", price:"60,000 IDR", website:"https://www.indonesia.travel/gb/en/destinations/bali-nusa-tenggara/tanah-lot"},
  {name:"우붓 원숭이 숲", wikiTitle:"Ubud Monkey Forest", type:"자연", desc:"300마리 이상의 원숭이가 서식하는 열대우림 성소로 고대 사원과 거대한 반얀 나무가 있습니다.", rating:4.4, openTime:"08:30~18:00", price:"80,000 IDR", website:"https://www.monkeyforestubud.com"},
  {name:"스미냑 해변", wikiTitle:"Seminyak", type:"자연", desc:"발리 최고의 비치클럽과 레스토랑이 모여있는 세련된 해변 지역으로 서핑과 석양이 유명합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Seminyak"},
]},
"자카르타": { description:"자카르타는 인도네시아의 수도이자 동남아시아 최대 도시 중 하나로 다양한 문화와 역사가 공존합니다. 식민지 시대 건축물과 현대적 마천루, 활기찬 시장이 매력적입니다.", spots:[
  {name:"이스티클랄 모스크", wikiTitle:"Istiqlal Mosque", type:"역사", desc:"동남아시아 최대의 이슬람 사원으로 12만 명을 수용할 수 있습니다. 인도네시아 독립을 기념하여 건설되었습니다.", rating:4.5, openTime:"04:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Istiqlal_Mosque,_Jakarta"},
  {name:"모나스(국가독립기념탑)", wikiTitle:"National Monument (Indonesia)", type:"랜드마크", desc:"132m 높이의 탑 꼭대기에 35kg의 금으로 만든 불꽃이 빛납니다. 전망대에서 자카르타 시내를 조망할 수 있습니다.", rating:4.4, openTime:"08:00~16:00", price:"15,000 IDR", website:"https://www.indonesia.travel/gb/en/destinations/java/jakarta"},
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
  {name:"바투 동굴", wikiTitle:"Batu Caves", type:"역사", desc:"272개의 무지개색 계단을 올라가면 거대한 석회동굴 속 힌두 사원이 나타납니다. 42m 높이의 금색 무루간 신상이 인상적입니다.", rating:4.6, openTime:"06:00~21:00", price:"무료", website:"https://www.malaysia.travel/explore/batu-caves"},
  {name:"잘란 알로 푸드스트리트", wikiTitle:"Jalan Alor", type:"음식", desc:"쿠알라룸푸르 최대의 길거리 음식 거리로 사테, 호끼엔미, 두리안 등 말레이시아 음식을 맛볼 수 있습니다.", rating:4.5, openTime:"17:00~03:00", price:"무료", website:"https://en.wikipedia.org/wiki/Jalan_Alor"},
]},
"페낭": { description:"페낭은 '동양의 진주'로 불리는 말레이시아의 미식 수도입니다. 조지타운의 유네스코 세계유산 거리와 독특한 스트리트 아트가 매력적입니다.", spots:[
  {name:"조지타운", wikiTitle:"George Town, Penang", type:"역사", desc:"영국 식민지 시대 건축물과 중국, 인도, 말레이 문화가 융합된 유네스코 세계유산 도시입니다. 유명한 스트리트 아트가 곳곳에 있습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://www.visitpenang.gov.my"},
  {name:"켁록시 사원", wikiTitle:"Kek Lok Si", type:"역사", desc:"동남아시아 최대 규모의 불교 사원으로 30m 높이의 관음상과 7층 탑이 인상적입니다.", rating:4.5, openTime:"09:00~18:00", price:"무료(탑 RM2)", website:"https://en.wikipedia.org/wiki/Kek_Lok_Si"},
  {name:"페낭 아삼 락사", wikiTitle:"Asam laksa", type:"음식", desc:"CNN이 세계 7대 음식으로 선정한 페낭의 대표 음식으로 새콤한 생선 국물 면요리입니다.", rating:4.6, openTime:"08:00~17:00", price:"RM5~10", website:"https://en.wikipedia.org/wiki/Asam_laksa"},
]},
"코타키나발루": { description:"코타키나발루는 보르네오 섬 말레이시아 사바주의 주도로 동남아 최고봉 키나발루산과 아름다운 섬들이 있는 자연의 보고입니다.", spots:[
  {name:"키나발루 산", wikiTitle:"Mount Kinabalu", type:"자연", desc:"해발 4,095m의 동남아시아 최고봉으로 유네스코 세계유산입니다. 2일 등반 코스가 인기입니다.", rating:4.8, openTime:"연중", price:"RM200(입산료)", website:"https://www.mountkinabalu.com"},
  {name:"툰쿠 압둘 라만 해양공원", wikiTitle:"Tunku Abdul Rahman National Park", type:"자연", desc:"5개의 아름다운 섬으로 이루어진 해양공원으로 스노클링과 다이빙이 훌륭합니다.", rating:4.5, openTime:"08:00~17:00", price:"RM10(입장료)", website:"https://en.wikipedia.org/wiki/Tunku_Abdul_Rahman_National_Park"},
]},
"랑카위": { description:"랑카위는 99개의 섬으로 이루어진 안다만 해의 보석으로 유네스코 세계 지질공원에 지정된 면세 섬입니다. 아름다운 해변과 맹그로브 숲, 스카이브릿지가 유명합니다.", spots:[
  {name:"랑카위 스카이브릿지", wikiTitle:"Langkawi Sky Bridge", type:"랜드마크", desc:"해발 660m에 설치된 125m 길이의 곡선형 보행교로 아찔한 전망과 스릴을 동시에 즐길 수 있습니다.", rating:4.6, openTime:"09:30~19:00", price:"RM35(케이블카+다리)", website:"https://www.panoramalangkawi.com"},
  {name:"킬림 지오포레스트 파크", wikiTitle:"Kilim Karst Geoforest Park", type:"자연", desc:"맹그로브 숲과 석회암 기둥 사이를 보트로 탐험하며 독수리, 원숭이를 만날 수 있습니다.", rating:4.5, openTime:"09:00~17:00", price:"RM35(보트투어)", website:"https://en.wikipedia.org/wiki/Kilim_Karst_Geoforest_Park"},
  {name:"탄중루 해변", wikiTitle:"Tanjung Rhu", type:"자연", desc:"랑카위에서 가장 아름다운 해변으로 고운 백사장과 석회암 기둥이 어우러진 비경입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Tanjung_Rhu"},
]},
"말라카": { description:"말라카는 15세기 해상 무역의 중심지였던 역사 도시로 포르투갈, 네덜란드, 영국의 식민 유산이 층층이 쌓여 있는 유네스코 세계유산입니다.", spots:[
  {name:"더치 스퀘어", wikiTitle:"Dutch Square, Malacca", type:"역사", desc:"17세기 네덜란드 식민지 시대의 붉은 건물들이 모여있는 말라카의 중심 광장입니다. 크라이스트 처치가 랜드마크입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Dutch_Square,_Malacca"},
  {name:"존커 스트리트", wikiTitle:"Jonker Walk", type:"문화", desc:"앤티크 가게, 카페, 갤러리가 즐비한 문화 거리로 금요~일요 밤에 야시장이 열립니다.", rating:4.4, openTime:"10:00~22:00(야시장 금~일)", price:"무료", website:"https://en.wikipedia.org/wiki/Jonker_Walk"},
  {name:"어포사 요새", wikiTitle:"A Famosa", type:"역사", desc:"1511년 포르투갈이 건설한 동남아시아에서 가장 오래된 유럽 건축물 유적입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://www.melaka.net"},
]},

// ────────────────────────── 싱가포르 ──────────────────────────
"싱가포르": { description:"싱가포르는 동남아시아의 도시 국가로 미래지향적 건축물과 다문화가 어우러진 깨끗하고 안전한 도시입니다. 마리나베이 샌즈부터 호커센터의 길거리 음식까지 다채로운 경험을 선사합니다.", spots:[
  {name:"마리나베이 샌즈", wikiTitle:"Marina Bay Sands", type:"랜드마크", desc:"세 개의 타워 위에 배 모양 스카이파크가 올려진 상징적 건축물입니다. 인피니티 풀과 전망대가 유명합니다.", rating:4.7, openTime:"09:30~22:00(전망대)", price:"S$26(전망대)", website:"https://www.marinabaysands.com"},
  {name:"가든스 바이 더 베이", wikiTitle:"Gardens by the Bay", type:"자연", desc:"미래지향적 슈퍼트리 그로브와 클라우드 포레스트, 플라워 돔이 있는 거대한 식물원입니다.", rating:4.8, openTime:"05:00~02:00(야외)", price:"S$28(온실)", website:"https://www.gardensbythebay.com.sg"},
  {name:"센토사 섬", wikiTitle:"Sentosa", type:"도시", desc:"유니버셜 스튜디오, 아쿠아리움, 해변이 모여있는 복합 리조트 섬입니다.", rating:4.5, openTime:"24시간", price:"무료(개별 시설 유료)", website:"https://www.sentosa.com.sg"},
  {name:"호커 센터", wikiTitle:"Hawker centre", type:"음식", desc:"싱가포르의 유네스코 무형유산인 호커 문화를 체험할 수 있는 곳으로 칠리크랩, 치킨라이스 등을 S$3~5에 즐길 수 있습니다.", rating:4.6, openTime:"06:00~23:00", price:"S$3~8", website:"https://en.wikipedia.org/wiki/Hawker_centre"},
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
  {name:"쉐다곤 파고다", wikiTitle:"Shwedagon Pagoda", type:"역사", desc:"2,600년 역사의 99m 높이 황금탑으로 미얀마 불교의 성지입니다. 5,000개 이상의 다이아몬드와 보석으로 장식되어 있습니다.", rating:4.9, openTime:"04:00~22:00", price:"$10", website:"https://shwedagonpagoda.com.mm"},
  {name:"보족 아웅산 시장", wikiTitle:"Bogyoke Aung San Market", type:"문화", desc:"보석, 수공예품, 전통 의상을 판매하는 양곤 최대의 시장입니다. 미얀마 루비와 사파이어가 유명합니다.", rating:4.3, openTime:"09:00~17:00(화~일)", price:"무료", website:"https://en.wikipedia.org/wiki/Bogyoke_Aung_San_Market"},
]},
"바간": { description:"바간은 11~13세기에 건설된 2,000개 이상의 불탑과 사원이 평원에 펼쳐진 세계적 유적지입니다. 열기구를 타고 바라보는 일출의 바간 풍경은 세계 최고의 장관 중 하나입니다.", spots:[
  {name:"바간 사원 평원", wikiTitle:"Bagan", type:"역사", desc:"42km²에 걸쳐 2,000개 이상의 불교 유적이 흩어져 있는 세계유산입니다. 자전거나 전기바이크로 탐험할 수 있습니다.", rating:4.9, openTime:"일출~일몰", price:"$25(구역입장료)", website:"https://www.myanmartourism.org"},
  {name:"아난다 사원", wikiTitle:"Ananda Temple", type:"역사", desc:"1105년에 완성된 바간에서 가장 아름다운 사원으로 네 방향에 각각 9m 높이의 불상이 서 있습니다.", rating:4.7, openTime:"일출~일몰", price:"구역입장료 포함", website:"https://www.myanmartourism.org"},
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
  {name:"보드나트 스투파", wikiTitle:"Boudhanath", type:"역사", desc:"네팔 최대의 불교 스투파로 거대한 부처의 눈이 사방을 바라보고 있습니다. 티베트 불교의 성지입니다.", rating:4.7, openTime:"05:00~21:00", price:"Rs 400", website:"https://www.boudhanath.com"},
  {name:"더르바르 광장", wikiTitle:"Kathmandu Durbar Square", type:"역사", desc:"네팔 왕국의 옛 왕궁 광장으로 중세 네와르 건축의 정수를 보여줍니다. 유네스코 세계유산입니다.", rating:4.5, openTime:"07:00~19:00", price:"Rs 1,000", website:"https://en.wikipedia.org/wiki/Kathmandu_Durbar_Square"},
  {name:"스와얌부나트(원숭이 사원)", wikiTitle:"Swayambhunath", type:"역사", desc:"2,500년 역사의 불교 사원으로 365개 계단을 올라가면 카트만두 계곡 전경이 펼쳐집니다.", rating:4.6, openTime:"04:00~21:00", price:"Rs 200", website:"https://en.wikipedia.org/wiki/Swayambhunath"},
  {name:"타멜 거리", wikiTitle:"Thamel", type:"도시", desc:"배낭여행자의 천국으로 레스토랑, 트레킹 장비점, 기념품 가게가 밀집한 활기찬 거리입니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Thamel"},
]},
"포카라": { description:"포카라는 안나푸르나 산맥의 관문 도시로 페와 호수와 설산이 어우러진 평화로운 풍경이 트레커들의 사랑을 받는 곳입니다.", spots:[
  {name:"페와 호수", wikiTitle:"Phewa Lake", type:"자연", desc:"안나푸르나 설산이 호수에 비치는 장관이 유명합니다. 보트를 타고 호수 가운데 탈바라히 사원에 갈 수 있습니다.", rating:4.6, openTime:"24시간", price:"무료(보트 Rs 500)", website:"https://en.wikipedia.org/wiki/Phewa_Lake"},
  {name:"안나푸르나 베이스캠프 트레킹", wikiTitle:"Annapurna Base Camp", type:"자연", desc:"세계에서 가장 인기 있는 트레킹 코스 중 하나로 7~12일간 히말라야 설산을 오릅니다.", rating:4.9, openTime:"연중(10~11월 최적)", price:"TIMS Rs 2,000", website:"https://www.welcomenepal.com"},
  {name:"세계 평화 탑", wikiTitle:"World Peace Pagoda, Pokhara", type:"역사", desc:"언덕 위에 자리한 하얀 불탑에서 안나푸르나와 페와 호수의 파노라마를 감상할 수 있습니다.", rating:4.4, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/World_Peace_Pagoda,_Pokhara"},
]},
"치트완": { description:"치트완 국립공원은 히말라야 남쪽 타라이 평원의 야생동물 보호구역으로 유네스코 세계유산입니다. 인도코뿔소와 벵골호랑이가 서식합니다.", spots:[
  {name:"치트완 국립공원", wikiTitle:"Chitwan National Park", type:"자연", desc:"932km² 면적의 보호구역으로 코끼리 사파리, 카누 투어, 정글 워킹으로 야생동물을 관찰합니다.", rating:4.6, openTime:"연중", price:"Rs 2,000", website:"https://chitwannationalpark.gov.np"},
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
  {name:"시기리야 요새", wikiTitle:"Sigiriya", type:"역사", desc:"200m 높이 바위 위에 건설된 5세기 궁궐 유적입니다. 사자 발톱 입구와 프레스코 벽화가 유명합니다.", rating:4.8, openTime:"07:00~17:30", price:"$30", website:"https://www.sigiriya.lk"},
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
  {name:"푸에르토 프린세사 지하강", wikiTitle:"Puerto Princesa Subterranean River National Park", type:"자연", desc:"8.2km 길이의 세계 최장급 지하 하천으로 유네스코 세계유산입니다. 보트로 동굴 내부를 탐험합니다.", rating:4.7, openTime:"08:00~16:00", price:"₱500", website:"https://www.puerto-undergroundriver.com"},
]},
"보라카이": { description:"보라카이는 4km의 새하얀 화이트비치로 유명한 세계적 해변 휴양지입니다. 투명한 바다와 화려한 석양이 여행자를 매료시킵니다.", spots:[
  {name:"화이트 비치", wikiTitle:"White Beach (Boracay)", type:"자연", desc:"4km의 새하얀 파우더 모래와 터키옥빛 바다가 펼쳐진 세계적 해변입니다.", rating:4.8, openTime:"24시간", price:"무료(환경세 ₱300)", website:"https://en.wikipedia.org/wiki/White_Beach_(Boracay)"},
  {name:"디몰 비치", wikiTitle:"Boracay", type:"자연", desc:"거대한 바위 사이의 작은 해변으로 보라카이에서 가장 아름다운 일몰을 볼 수 있는 숨은 명소입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://www.boracayisland.ph"},
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
  {name:"기자 피라미드", wikiTitle:"Giza pyramid complex", type:"역사", desc:"세계 7대 불가사의 중 유일하게 현존하는 건축물로 쿠푸, 카프레, 멘카우레 3개의 대피라미드가 있습니다.", rating:4.8, openTime:"07:00~17:00", price:"EGP 200", website:"https://www.sca-egypt.org/eng/SITE_Giza.htm"},
  {name:"스핑크스", wikiTitle:"Great Sphinx of Giza", type:"역사", desc:"인간의 머리와 사자의 몸을 한 73m 길이의 거대 석상으로 피라미드를 수호하고 있습니다.", rating:4.7, openTime:"07:00~17:00", price:"피라미드 입장료 포함", website:"https://en.wikipedia.org/wiki/Great_Sphinx_of_Giza"},
  {name:"이집트 박물관", wikiTitle:"Egyptian Museum", type:"문화", desc:"투탕카멘의 황금 마스크를 포함해 12만 점 이상의 고대 이집트 유물을 소장한 세계적 박물관입니다.", rating:4.6, openTime:"09:00~17:00", price:"EGP 200", website:"https://egyptianmuseum.org"},
  {name:"칸 엘 칼릴리 시장", wikiTitle:"Khan el-Khalili", type:"문화", desc:"14세기부터 이어진 중동 최대의 바자르로 향신료, 보석, 수공예품이 미로 같은 골목에 가득합니다.", rating:4.4, openTime:"09:00~23:00", price:"무료", website:"https://en.wikipedia.org/wiki/Khan_el-Khalili"},
]},
"룩소르": { description:"룩소르는 고대 이집트의 수도 테베가 있던 곳으로 세계 최대의 야외 박물관이라 불립니다. 왕가의 계곡과 카르낙 신전이 압도적입니다.", spots:[
  {name:"왕가의 계곡", wikiTitle:"Valley of the Kings", type:"역사", desc:"투탕카멘을 포함한 63명의 파라오 무덤이 발굴된 곳으로 무덤 내부의 벽화가 3,000년 전 색채를 유지하고 있습니다.", rating:4.8, openTime:"06:00~17:00", price:"EGP 240", website:"https://www.thebanmappingproject.com"},
  {name:"카르낙 신전", wikiTitle:"Karnak", type:"역사", desc:"4,000년에 걸쳐 건설된 세계 최대의 종교 건축 단지로 134개의 거대 기둥이 줄지어 선 대열주실이 압도적입니다.", rating:4.8, openTime:"06:00~17:30", price:"EGP 150", website:"https://en.wikipedia.org/wiki/Karnak"},
  {name:"룩소르 신전", wikiTitle:"Luxor Temple", type:"역사", desc:"나일강변에 자리한 아멘호텝 3세의 신전으로 야간 조명이 특히 아름답습니다.", rating:4.6, openTime:"06:00~22:00", price:"EGP 100", website:"https://en.wikipedia.org/wiki/Luxor_Temple"},
]},
"아스완": { description:"아스완은 이집트 남부 누비아 문화의 중심지로 나일강이 가장 아름다운 구간을 흐르는 곳입니다. 아부심벨 신전 투어의 거점 도시이기도 합니다.", spots:[
  {name:"아부심벨 대신전", wikiTitle:"Abu Simbel temples", type:"역사", desc:"람세스 2세가 건설한 거대한 암굴 신전으로 20m 높이의 파라오 좌상 4개가 입구를 지킵니다. 댐 건설로 통째로 이전한 것으로도 유명합니다.", rating:4.9, openTime:"05:00~18:00", price:"EGP 255", website:"https://www.egypt.travel/en/attractions/abu-simbel-temples"},
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
  {name:"바히아 궁전", wikiTitle:"Bahia Palace", type:"역사", desc:"19세기 대재상의 궁전으로 정교한 젤리즈 타일과 삼나무 조각이 이슬람 건축의 정수를 보여줍니다.", rating:4.5, openTime:"09:00~17:00", price:"MAD 70", website:"https://www.visitmarrakech.com"},
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
  {name:"사막 캠프 별 관측", wikiTitle:"Erg Chebbi", type:"자연", desc:"사하라 사막 한가운데 텐트에서 밤하늘의 은하수를 감상하는 잊을 수 없는 경험입니다.", rating:4.7, openTime:"야간", price:"1박 MAD 500~", website:"https://en.wikipedia.org/wiki/Erg_Chebbi"},
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
  {name:"도우루강 와이너리 투어", wikiTitle:"Port wine", type:"음식", desc:"도우루강 남쪽 빌라노바데가이아에 모여있는 포트와인 와이너리에서 시음과 투어를 즐길 수 있습니다.", rating:4.6, openTime:"10:00~18:00", price:"€15~20", website:"https://en.wikipedia.org/wiki/Port_wine"},
]},
"신트라": { description:"신트라는 리스본 근교의 동화 같은 마을로 안개 낀 숲속에 화려한 궁전과 성이 숨어 있는 유네스코 세계유산입니다.", spots:[
  {name:"페나 궁전", wikiTitle:"Pena Palace", type:"역사", desc:"선명한 노란색과 빨간색의 낭만주의 건축 궁전으로 산꼭대기에서 대서양까지 조망할 수 있습니다.", rating:4.7, openTime:"09:30~18:30", price:"€14", website:"https://www.parquesdesintra.pt"},
  {name:"무어 성", wikiTitle:"Castle of the Moors", type:"역사", desc:"8세기 무어인이 건설한 산성으로 성벽을 따라 걸으며 신트라 계곡과 대서양을 조망할 수 있습니다.", rating:4.5, openTime:"09:30~18:00", price:"€8", website:"https://www.parquesdesintra.pt"},
]},
"알가르브": { description:"알가르브는 포르투갈 최남단의 해안 지역으로 황금빛 절벽과 동굴, 맑은 바다가 유럽 최고의 해변 휴양지로 꼽힙니다.", spots:[
  {name:"베나길 동굴", wikiTitle:"Benagil Cave", type:"자연", desc:"바다 동굴 천장에 뚫린 구멍으로 햇빛이 쏟아져 내리는 환상적인 자연 조형물입니다. 보트나 카약으로만 접근 가능합니다.", rating:4.8, openTime:"09:00~17:00", price:"€20~30(보트)", website:"https://www.visitalgarve.pt"},
  {name:"폰타 다 피에다드", wikiTitle:"Ponta da Piedade", type:"자연", desc:"황금빛 석회암 절벽과 기암괴석이 대서양 위로 솟아오른 알가르브의 대표 절경입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Ponta_da_Piedade"},
]},
"코임브라": { description:"코임브라는 유럽에서 가장 오래된 대학 중 하나인 코임브라 대학교가 있는 학술 도시로 유네스코 세계유산입니다.", spots:[
  {name:"코임브라 대학교", wikiTitle:"University of Coimbra", type:"역사", desc:"1290년에 설립된 포르투갈 최고의 대학으로 요아니나 도서관의 바로크 장식이 압도적입니다.", rating:4.6, openTime:"09:00~17:00", price:"€12.5", website:"https://en.wikipedia.org/wiki/University_of_Coimbra"},
  {name:"구 대성당(세 벨랴)", wikiTitle:"Old Cathedral of Coimbra", type:"역사", desc:"12세기 로마네스크 양식의 요새형 대성당으로 포르투갈 가장 중요한 중세 건축물 중 하나입니다.", rating:4.4, openTime:"10:00~17:30", price:"€2.5", website:"https://en.wikipedia.org/wiki/Old_Cathedral_of_Coimbra"},
]},
"마데이라": { description:"마데이라는 대서양의 진주로 불리는 포르투갈의 화산섬으로 열대 정원, 해안 절벽, 레바다 트레킹으로 유명합니다.", spots:[
  {name:"카보 지랑 전망대", wikiTitle:"Cabo Girão", type:"자연", desc:"유럽 최고 높이(580m)의 해안 절벽 전망대로 유리 바닥 스카이워크에서 아래를 내려다볼 수 있습니다.", rating:4.7, openTime:"09:00~21:00", price:"무료", website:"https://www.visitmadeira.com"},
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
  {name:"반호프슈트라세", wikiTitle:"Bahnhofstrasse", type:"도시", desc:"세계에서 가장 비싼 쇼핑 거리 중 하나로 명품 부티크와 스위스 초콜릿 매장이 줄지어 있습니다.", rating:4.3, openTime:"24시간(매장별)", price:"무료", website:"https://www.zuerich.com"},
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
  {name:"아레강 수영", wikiTitle:"Aare (river)", type:"자연", desc:"여름이면 베른 시민들이 청록색 아레강에서 물살을 타며 자연 수영을 즐기는 독특한 도시 문화입니다.", rating:4.5, openTime:"여름 시즌", price:"무료", website:"https://www.bern.com"},
]},

// ────────────────────────── 헝가리 ──────────────────────────
"부다페스트": { description:"부다페스트는 다뉴브 강이 가르는 부다와 페스트가 합쳐진 도시로 온천 문화와 야경이 세계적으로 유명한 동유럽의 보석입니다.", spots:[
  {name:"세체니 온천", wikiTitle:"Széchenyi thermal bath", type:"문화", desc:"유럽 최대의 노천 온천으로 네오바로크 양식의 화려한 건물에서 16개의 실내외 풀을 즐길 수 있습니다.", rating:4.6, openTime:"06:00~22:00", price:"HUF 6,800", website:"https://www.szechenyibath.hu"},
  {name:"부다 왕궁", wikiTitle:"Buda Castle", type:"역사", desc:"다뉴브 강변 언덕 위의 왕궁으로 헝가리 국립 갤러리와 부다페스트 역사 박물관이 입주해 있습니다.", rating:4.5, openTime:"10:00~18:00", price:"HUF 3,400", website:"https://budacastlebudapest.com"},
  {name:"국회의사당", wikiTitle:"Hungarian Parliament Building", type:"랜드마크", desc:"다뉴브 강변의 네오고딕 건축물로 야경이 특히 아름답습니다. 세계에서 세 번째로 큰 의사당입니다.", rating:4.7, openTime:"08:00~18:00(투어)", price:"HUF 6,700", website:"https://www.parlament.hu/en"},
  {name:"어부의 요새", wikiTitle:"Fisherman's Bastion", type:"랜드마크", desc:"네오로마네스크 양식의 전망대로 다뉴브 강과 국회의사당을 정면으로 바라보는 최고의 포토스팟입니다.", rating:4.6, openTime:"09:00~19:00", price:"HUF 1,200", website:"https://en.wikipedia.org/wiki/Fisherman's_Bastion"},
  {name:"센트럴 마켓 홀", wikiTitle:"Great Market Hall (Budapest)", type:"음식", desc:"1897년에 개장한 부다페스트 최대의 시장으로 굴라시, 랑고시 등 헝가리 전통 음식을 맛볼 수 있습니다.", rating:4.5, openTime:"06:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Great_Market_Hall_(Budapest)"},
]},
"에게르": { description:"에게르는 헝가리 북부의 바로크 도시로 오스만 제국의 침략을 막아낸 요새와 유명한 에게르 불스블러드 와인의 고향입니다.", spots:[
  {name:"에게르 성", wikiTitle:"Castle of Eger", type:"역사", desc:"1552년 오스만 대군에 맞서 영웅적으로 방어한 역사적 요새입니다. 성벽에서 에게르 시내를 조망합니다.", rating:4.4, openTime:"10:00~18:00", price:"HUF 2,000", website:"https://en.wikipedia.org/wiki/Castle_of_Eger"},
  {name:"미녀의 골짜기 와인마을", wikiTitle:"Eger wine", type:"음식", desc:"수십 개의 와인 셀러가 모인 골짜기로 유명한 에게르 불스블러드 레드 와인을 시음할 수 있습니다.", rating:4.5, openTime:"10:00~20:00", price:"HUF 500~(시음)", website:"https://en.wikipedia.org/wiki/Egri_Bikavér"},
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
  {name:"브뤼겐", wikiTitle:"Bryggen", type:"역사", desc:"14세기 한자동맹 시대의 형형색색 목조 상점가로 유네스코 세계유산입니다. 현재 갤러리와 레스토랑으로 사용됩니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://www.visitbergen.com/bryggen"},
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
  {name:"스톡홀름 시청", wikiTitle:"Stockholm City Hall", type:"랜드마크", desc:"노벨상 만찬이 열리는 블루홀과 황금 모자이크의 골든홀이 있는 스톡홀름의 상징적 건물입니다.", rating:4.5, openTime:"09:00~16:00(투어)", price:"SEK 140", website:"https://stadshuset.stockholm"},
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
  {name:"아비스코 국립공원", wikiTitle:"Abisko National Park", type:"자연", desc:"오로라 관측의 최적지로 알려진 국립공원으로 여름에는 백야 속 트레킹을 즐길 수 있습니다.", rating:4.7, openTime:"연중", price:"무료", website:"https://www.sverigesnationalparker.se/en/choose-park---702/abisko-national-park"},
  {name:"오로라 스카이 스테이션", wikiTitle:"Aurora Sky Station", type:"자연", desc:"리프트로 올라가는 산 위 전망대에서 맑은 밤하늘의 오로라를 최상의 조건에서 관측할 수 있습니다.", rating:4.8, openTime:"11~3월 야간", price:"SEK 850", website:"https://www.sverigesnationalparker.se/en/choose-park---702/abisko-national-park"},
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
}

const DEFAULT_CITY_DATA = (cityName) => ({
  weather:{temp:Math.floor(Math.random()*20)+10,condition:"구름 조금",icon:"⛅",humidity:Math.floor(Math.random()*40)+45},
  description:`${cityName}은(는) 독특한 문화적 경험과 아름다운 자연 풍경, 잊을 수 없는 추억을 선사하는 매력적인 여행지입니다.`,
  spots:[
    {name:`${cityName} 구시가지`,type:"역사",desc:"도시의 풍부한 문화 유산을 보여주는 아름답게 보존된 역사 지구입니다.",img:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80",rating:4.5},
    {name:`${cityName} 국립 박물관`,type:"문화",desc:"이 지역의 훌륭한 예술 작품과 유물, 역사를 전시하는 세계적 수준의 기관입니다.",img:"https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&q=80",rating:4.4},
    {name:`${cityName} 시립 공원`,type:"자연",desc:"도시 중심부에 자리한 사랑받는 녹지 오아시스로 계절마다 다른 정원을 즐길 수 있습니다.",img:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80",rating:4.6},
    {name:`${cityName} 전통 시장`,type:"음식",desc:"신선한 농산물과 길거리 음식, 수공예품이 가득한 활기찬 로컬 시장입니다.",img:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",rating:4.3},
  ]
})

// 카테고리별 실제 작동하는 Unsplash 이미지 풀
const IMG_POOL = {
  "문화": [
    "photo-1545569341-9eb8b30979d9","photo-1528360983277-13d401cdc186","photo-1538485399081-7191377e8241",
    "photo-1558618666-fcd25c85cd64","photo-1524413840807-0c3cb6fa808d","photo-1499856871958-5b9627545d1a",
  ],
  "역사": [
    "photo-1552832230-c0197dd311b5","photo-1539650116574-75c0c6d73f6e","photo-1467269204594-9661b134dd2b",
    "photo-1548115184-bc6544d06a58","photo-1583623025817-d180a2221d0a","photo-1531572753322-ad063cecc140",
  ],
  "자연": [
    "photo-1441974231531-c6227db76b6e","photo-1506905925346-21bda4d32df4","photo-1559827260-dc66d52bef19",
    "photo-1476514525535-07fb3b4ae5f1","photo-1523428461295-92770e70d7ae","photo-1533104816931-20fa691ff6ca",
  ],
  "랜드마크": [
    "photo-1511739001486-6bfe10ce785f","photo-1485738422979-f5c462d49f74","photo-1512453979798-5ea266f8880c",
    "photo-1513635269975-59663e0ac1ad","photo-1506905925346-21bda4d32df4","photo-1534430480872-3498386e7856",
  ],
  "도시": [
    "photo-1540959733332-eab4deabeeaf","photo-1477959858617-67f85cf4f1df","photo-1546436836-07a91091f160",
    "photo-1480714378408-67cf0d13bc1b","photo-1449824913935-59a10b8d2000","photo-1502602898657-3e91760cbb34",
  ],
  "음식": [
    "photo-1555396273-367ea4eb4db5","photo-1504674900247-0877df9cc836","photo-1567620905732-2d1ec7ab7445",
    "photo-1414235077428-338989a2e8c0","photo-1540189549336-e6e99c3679fe","photo-1565299624946-b28f40a0ae38",
  ],
}
const getImg = (type, seed) => {
  const pool = IMG_POOL[type] || IMG_POOL["랜드마크"]
  // seed 기반 결정적 선택 (렌더 안정성)
  let hash = 0
  const s = seed || type || ''
  for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash) + s.charCodeAt(i)
  const idx = Math.abs(hash) % pool.length
  return `https://images.unsplash.com/${pool[idx]}?w=400&q=80`
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
  const [countries, setCountries] = useState([])
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [selectedCity, setSelectedCity] = useState(null)
  const [cityData, setCityData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [hoveredCountry, setHoveredCountry] = useState(null)

  // Load world GeoJSON
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
      .then(r => r.json())
      .then(data => setCountries(data.features))
      .catch(() => {
        fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
          .then(r => r.json())
          .then(data => {
            // fallback
          })
      })
  }, [])

  // Init Globe with high-res tile-based satellite imagery
  useEffect(() => {
    if (globeRef.current || !globeContainerRef.current) return

    const globe = Globe()(globeContainerRef.current)
      // ESRI World Imagery - 구글 어스급 고해상도 위성 타일
      .globeImageUrl(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/3/2/4`)
      .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
      .showAtmosphere(true)
      .atmosphereColor('#3a7bd5')
      .atmosphereAltitude(0.14)
      .width(window.innerWidth)
      .height(window.innerHeight)

    // 가장 선명한 NASA Blue Marble Next Generation 2048x1024
    globe.globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    globe.bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')

    // Three.js 렌더러 품질 최대화
    const renderer = globe.renderer()
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio * 2, 4))
      renderer.antialias = true
    }

    globe.camera().position.z = 260
    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = 0.35
    globe.controls().zoomSpeed = 1.5
    globeRef.current = globe

    const onResize = () => {
      globe.width(window.innerWidth)
      globe.height(window.innerHeight)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Convert globe lat/lng to screen x/y for React overlay pins
  const [cityScreenCoords, setCityScreenCoords] = useState([])

  useEffect(() => {
    if (!globeRef.current || !selectedCountry) {
      setCityScreenCoords([])
      return
    }
    const countryEn = selectedCountry.properties.NAME
    const cities = (COUNTRY_CITIES[countryEn] || []).map(c => ({ ...c, countryEn }))
    const updateCoords = () => {
      if (!globeRef.current) return
      const globe = globeRef.current
      const W = window.innerWidth - (selectedCity ? 420 : 0)
      const H = window.innerHeight

      const coords = cities.map(city => {
        const sc = globe.getScreenCoords(city.lat, city.lng, 0.01)
        // getScreenCoords가 뒷면이면 화면 밖 좌표 반환 → bounds 체크로 충분
        const visible = sc != null
          && sc.x > 20 && sc.x < W - 20
          && sc.y > 20 && sc.y < H - 20
        return { ...city, sx: sc?.x ?? 0, sy: sc?.y ?? 0, visible }
      })
      setCityScreenCoords(coords)
    }
    updateCoords()
    const id = setInterval(updateCoords, 30)
    return () => clearInterval(id)
  }, [selectedCountry])

  // Country labels via htmlElementsData (no click needed, just display)
  useEffect(() => {
    if (!globeRef.current || countries.length === 0) return
    const globe = globeRef.current

    const labelItems = countries.map(feat => ({
      lat: feat.properties.LABEL_Y || 0,
      lng: feat.properties.LABEL_X || 0,
      name: COUNTRY_KO[feat.properties.NAME] || feat.properties.NAME,
      nameEn: feat.properties.NAME,
      _type: 'label',
    })).filter(d => d.lat !== 0 || d.lng !== 0)

    globe
      .htmlElementsData(labelItems)
      .htmlLat(d => d.lat)
      .htmlLng(d => d.lng)
      .htmlAltitude(0.005)
      .htmlElement(d => {
        const el = document.createElement('div')
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
        return el
      })

    globe.pointsData([])
  }, [countries])

  // Update polygons
  useEffect(() => {
    if (!globeRef.current || countries.length === 0) return
    const globe = globeRef.current
    globe
      .polygonsData(countries)
      .polygonCapColor(feat => {
        const name = feat.properties.NAME
        if (hoveredCountry === name) return 'rgba(255,220,50,0.55)'
        if (selectedCountry?.properties.NAME === name) return 'rgba(59,130,246,0.45)'
        return COUNTRY_CITIES[name] ? 'rgba(34,197,94,0.12)' : 'rgba(200,220,180,0.08)'
      })
      .polygonSideColor(() => 'rgba(0,0,0,0.05)')
      .polygonStrokeColor(() => 'rgba(255,255,255,0.2)')
      .polygonAltitude(feat => {
        const name = feat.properties.NAME
        if (selectedCountry?.properties.NAME === name) return 0.02
        if (hoveredCountry === name) return 0.012
        return 0.003
      })
      .polygonLabel(feat => {
        const name = feat.properties.NAME
        const koName = COUNTRY_KO[name] || name
        const hasCities = COUNTRY_CITIES[name]
        return `<div style="background:rgba(15,23,42,0.92);border-radius:10px;padding:8px 14px;font-family:Pretendard,Inter,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);">
          <div style="font-size:15px;font-weight:700;color:white">${koName}</div>
          ${hasCities ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px">클릭하여 도시 탐색</div>` : ''}
        </div>`
      })
      .onPolygonHover(feat => setHoveredCountry(feat ? feat.properties.NAME : null))
      .onPolygonClick(feat => handleCountryClick(feat))
  }, [countries, hoveredCountry, selectedCountry])

  // Calculate zoom altitude so country fills the screen
  const getCountryAltitude = (feat) => {
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
      const span = Math.max(maxLat - minLat, maxLng - minLng)
      if (span < 3)  return 0.15   // 싱가포르 등 소국
      if (span < 8)  return 0.18   // 한국, 그리스 등
      if (span < 15) return 0.25   // 일본, 영국, 독일
      if (span < 25) return 0.35   // 프랑스, 스페인, 이탈리아
      if (span < 40) return 0.5    // 인도, 멕시코
      if (span < 60) return 0.7    // 호주, 브라질
      if (span < 100) return 1.0   // 미국
      return 1.5                   // 러시아, 캐나다
    } catch { return 0.5 }
  }

  const handleCountryClick = (feat) => {
    if (!feat || !globeRef.current) return
    const globe = globeRef.current
    const clickedName = feat.properties.NAME

    // 같은 나라 다시 클릭하면 원상복구
    if (selectedCountry?.properties.NAME === clickedName) {
      closeCountry()
      return
    }

    setSelectedCountry(feat)
    setSelectedCity(null)
    setCityData(null)

    const lat = feat.properties.LABEL_Y || 0
    const lng = feat.properties.LABEL_X || 0
    const altitude = getCountryAltitude(feat)

    globe.controls().autoRotate = false
    globe.pointOfView({ lat, lng, altitude }, 1300)
  }

  const handleCityClick = (city) => {
    try {
      if (!globeRef.current) return
      setSelectedCity(city)
      setSelectedSpot(null)
      setCityData(null)
      fetchCityData(city)
      globeRef.current.pointOfView({ lat: city.lat, lng: city.lng, altitude: 0.5 }, 900)
    } catch(e) { console.error('city click error:', e) }
  }

  handleCityClickRef.current = handleCityClick

  // ── 도시 관광 데이터 로드 (사전 데이터 기반, AI 불필요) ──────────────────
  const fetchCityData = async (city) => {
    try {
      // 1. 사전 데이터 (240개 도시 전체 포함)
      const staticData = CITY_DATA[city.name]
      if (staticData) {
        const base = { ...staticData }
        if (!base.weather) base.weather = { temp: '—', condition: '날씨 로딩 중', icon: '🌤️', humidity: '—' }
        setCityData(base)
        setLoading(false)
        fetchWeather(city.lat, city.lng).then(w => {
          if (w) setCityData(prev => prev ? { ...prev, weather: w } : prev)
        }).catch(() => {})
        return
      }

      // 2. 사전 데이터 없는 경우 기본 데이터 사용
      const fallback = DEFAULT_CITY_DATA(city.name)
      setCityData(fallback)
      setLoading(false)
      fetchWeather(city.lat, city.lng).then(w => {
        if (w) setCityData(prev => prev ? { ...prev, weather: w } : prev)
      }).catch(() => {})
    } catch(e) {
      console.error('fetchCityData error:', e)
      setCityData({
        weather: { temp: '—', condition: '—', icon: '🌤️', humidity: '—' },
        description: `${city.name}의 관광 정보입니다.`,
        spots: DEFAULT_CITY_DATA(city.name).spots,
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
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric&lang=kr`
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
    setSelectedCity(null); setCityData(null); setSelectedSpot(null)
    if (selectedCountry && globeRef.current) {
      const lat = selectedCountry.properties.LABEL_Y || 0
      const lng = selectedCountry.properties.LABEL_X || 0
      globeRef.current.pointOfView({ lat, lng, altitude: 1.8 }, 900)
    }
  }

  const closeCountry = () => {
    setSelectedCountry(null); setSelectedCity(null); setCityData(null); setSelectedSpot(null)
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true
      globeRef.current.pointOfView({ lat:20, lng:10, altitude:2.5 }, 1000)
    }
  }

  // Search: all cities across all countries
  const allCities = Object.entries(COUNTRY_CITIES).flatMap(([country, cities]) =>
    cities.map(c => ({ ...c, countryEn: country, countryKo: COUNTRY_KO[country] || country }))
  )
  const filtered = searchQuery
    ? allCities.filter(c => c.name.includes(searchQuery) || (c.countryKo && c.countryKo.includes(searchQuery)))
    : []

  const countryKo = selectedCountry ? (COUNTRY_KO[selectedCountry.properties.NAME] || selectedCountry.properties.NAME) : ''

  return (
    <div style={{width:'100vw',height:'100vh',overflow:'hidden',position:'relative',fontFamily:"'Pretendard','Inter',system-ui,sans-serif",background:'#000'}}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:2px}
        .panel{animation:sIn .42s cubic-bezier(.16,1,.3,1)}
        @keyframes sIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        .card{transition:transform .18s,box-shadow .18s;cursor:pointer}
        .card:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,.13)!important}
        .cimg{transition:transform .4s}.card:hover .cimg{transform:scale(1.06)}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Globe */}
      <div ref={globeContainerRef} style={{position:'absolute',inset:0,zIndex:0}}/>

      {/* ── React overlay city pins ── */}
      {cityScreenCoords.filter(c => c.visible).map((city, i) => (
        <div key={i}
          onClick={() => handleCityClick(city)}
          style={{
            position:'absolute',
            left: city.sx,
            top: city.sy,
            transform:'translate(-50%, -100%)',
            zIndex: 500,
            cursor:'pointer',
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            transition:'transform 0.15s',
            pointerEvents:'all',
          }}
          onMouseEnter={e => e.currentTarget.style.transform='translate(-50%,-100%) scale(1.12)'}
          onMouseLeave={e => e.currentTarget.style.transform='translate(-50%,-100%) scale(1)'}
        >
          <div style={{
            background:'rgba(255,255,255,0.97)',
            backdropFilter:'blur(8px)',
            borderRadius:20,
            padding:'4px 11px',
            boxShadow:'0 3px 14px rgba(0,0,0,0.45)',
            border:`2px solid ${city.color}`,
            whiteSpace:'nowrap',
            fontFamily:'Pretendard,Inter,sans-serif',
            fontSize:12,
            fontWeight:700,
            color:'#0f172a',
          }}>{city.name}</div>
          <div style={{width:2,height:6,background:city.color}}/>
          <div style={{width:9,height:9,borderRadius:'50%',background:city.color,border:'2px solid white',boxShadow:`0 0 8px ${city.color}`}}/>
        </div>
      ))}

      {/* Header */}
      <div style={{
        position:'absolute',top:0,left:0,right:selectedCity?420:0,zIndex:1000,
        background:'linear-gradient(to bottom,rgba(0,0,0,.65) 0%,transparent 100%)',
        padding:'16px 20px 50px',pointerEvents:'none',
        transition:'right .42s cubic-bezier(.16,1,.3,1)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:12,pointerEvents:'all'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:40,height:40,borderRadius:11,background:'linear-gradient(135deg,#2563eb,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 4px 16px rgba(37,99,235,.4)'}}>🌐</div>
            <div>
              <div style={{fontSize:20,fontWeight:800,letterSpacing:'-.5px',color:'white',lineHeight:1}}>ATLAS</div>
              <div style={{fontSize:9,color:'rgba(255,255,255,.6)',letterSpacing:'2.5px',textTransform:'uppercase'}}>세계 여행 탐험가</div>
            </div>
          </div>
          <div style={{marginLeft:'auto',position:'relative'}}>
            <span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'#94a3b8',pointerEvents:'none'}}>🔍</span>
            <input placeholder="도시 또는 국가 검색…" value={searchQuery}
              onChange={e=>{setSearchQuery(e.target.value);setShowDrop(true)}}
              onFocus={()=>setShowDrop(true)}
              onBlur={()=>setTimeout(()=>setShowDrop(false),150)}
              style={{padding:'9px 14px 9px 33px',borderRadius:22,fontSize:13,width:215,background:'rgba(255,255,255,.95)',border:'1.5px solid #e2e8f0',color:'#1e293b',outline:'none',boxShadow:'0 2px 12px rgba(0,0,0,.2)'}}/>
            {showDrop && filtered.length>0 && (
              <div style={{position:'absolute',top:'calc(100% + 7px)',right:0,background:'white',border:'1.5px solid #e2e8f0',borderRadius:14,overflow:'hidden',width:250,zIndex:2000,boxShadow:'0 12px 32px rgba(0,0,0,.15)'}}>
                {filtered.slice(0,8).map((c,i)=>(
                  <div key={i} onMouseDown={()=>{
                    // find country feature and fly there first
                    const feat = countries.find(f => f.properties.NAME === c.countryEn)
                    if (feat) { setSelectedCountry(feat); }
                    setTimeout(() => handleCityClick(c), 300)
                    setSearchQuery(''); setShowDrop(false)
                  }}
                    style={{padding:'10px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:10,borderBottom:i<filtered.length-1?'1px solid #f1f5f9':'none'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                    onMouseLeave={e=>e.currentTarget.style.background='white'}>
                    <span style={{fontSize:20}}>{c.emoji}</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>{c.name}</div>
                      <div style={{fontSize:11,color:'#94a3b8'}}>{c.countryKo}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Country selected badge */}
      {selectedCountry && !selectedCity && (
        <div style={{
          position:'absolute',bottom:24,left:'50%',transform:'translateX(-50%)',
          zIndex:1000,background:'rgba(255,255,255,.95)',backdropFilter:'blur(12px)',
          border:'1.5px solid #e2e8f0',borderRadius:40,
          padding:'10px 20px',fontSize:13,color:'#1e293b',
          boxShadow:'0 4px 20px rgba(0,0,0,.15)',
          display:'flex',alignItems:'center',gap:12,whiteSpace:'nowrap'
        }}>
          <span style={{fontWeight:700}}>{countryKo}</span>
          <span style={{color:'#94a3b8',fontSize:12}}>
            {COUNTRY_CITIES[selectedCountry.properties.NAME]
              ? `${COUNTRY_CITIES[selectedCountry.properties.NAME].length}개 도시 · 핀을 클릭하세요`
              : '등록된 도시 정보가 없습니다'}
          </span>
          <button onClick={closeCountry}
            style={{background:'#f1f5f9',border:'none',borderRadius:20,padding:'4px 12px',cursor:'pointer',fontSize:12,color:'#64748b',fontWeight:600}}>
            ✕ 닫기
          </button>
        </div>
      )}

      {/* Hint */}
      {!selectedCountry && (
        <div style={{position:'absolute',bottom:24,left:'50%',transform:'translateX(-50%)',zIndex:1000,background:'rgba(255,255,255,.9)',backdropFilter:'blur(12px)',border:'1.5px solid rgba(255,255,255,.5)',borderRadius:40,padding:'9px 20px',fontSize:12,color:'#475569',whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(0,0,0,.2)',pointerEvents:'none'}}>
          ✦ 나라를 클릭하면 도시 핀이 나타납니다 · 드래그로 지구 회전
        </div>
      )}

      {/* Side Panel */}
      {selectedCity && (
        <div className="panel" style={{position:'absolute',top:0,right:0,bottom:0,width:420,zIndex:1000,background:'white',borderLeft:'1.5px solid #e2e8f0',overflowY:'auto',boxShadow:'-12px 0 40px rgba(0,0,0,.15)'}}>
          <div style={{position:'sticky',top:0,zIndex:10,padding:'20px 20px 14px',background:'linear-gradient(white 87%,transparent)'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
              <div>
                <div style={{fontSize:11,color:'#94a3b8',letterSpacing:'2px',textTransform:'uppercase',marginBottom:4}}>
                  {selectedCity?.emoji || '📍'} {countryKo}
                </div>
                <div style={{fontSize:26,fontWeight:800,letterSpacing:'-.5px',color:'#0f172a'}}>{selectedCity?.name || ''}</div>
              </div>
              <button onClick={closePanel}
                style={{background:'#f1f5f9',border:'1.5px solid #e2e8f0',color:'#64748b',width:34,height:34,borderRadius:9,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}
                onMouseEnter={e=>e.currentTarget.style.background='#e2e8f0'}
                onMouseLeave={e=>e.currentTarget.style.background='#f1f5f9'}>✕</button>
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
                  <div style={{fontSize:11,color:'#94a3b8'}}>습도</div>
                </div>
              </div>
            )}
          </div>
          <div style={{padding:'0 20px 40px'}}>
            {cityData ? (
              <>
                {loading && (
                  <div style={{display:'flex',alignItems:'center',gap:8,background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:10,padding:'10px 14px',marginBottom:14}}>
                    <div style={{width:16,height:16,borderRadius:'50%',border:'2px solid #bae6fd',borderTopColor:'#0ea5e9',animation:'spin .7s linear infinite',flexShrink:0}}/>
                    <span style={{fontSize:12,color:'#0369a1',fontWeight:600}}>관광 정보를 불러오는 중입니다...</span>
                  </div>
                )}

                {/* AI 실패 시 재시도 버튼 */}
                {cityData.loadFailed ? (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:280,gap:16,textAlign:'center'}}>
                    <div style={{fontSize:40}}>🔄</div>
                    <div style={{fontSize:14,color:'#64748b',lineHeight:1.6}}>관광 정보를 불러오지 못했어요.<br/>다시 시도해볼게요!</div>
                    <button
                      onClick={() => { setCityData(null); setLoading(true); fetchCityData(cityData.city || selectedCity) }}
                      style={{background:'#3b82f6',color:'white',border:'none',borderRadius:12,padding:'12px 28px',cursor:'pointer',fontSize:14,fontWeight:700,boxShadow:'0 4px 12px rgba(59,130,246,0.4)'}}>
                      다시 불러오기
                    </button>
                  </div>
                ) : (
                  <>
                    <p style={{fontSize:13.5,color:'#475569',lineHeight:1.8,margin:'0 0 20px',borderLeft:`3px solid ${selectedCity?.color||'#3b82f6'}`,paddingLeft:14}}>
                      {cityData.description}
                    </p>
                    {cityData.spots?.length > 0 && (
                      <>
                        <div style={{fontSize:10,color:'#94a3b8',letterSpacing:'2.5px',textTransform:'uppercase',marginBottom:12}}>
                          추천 관광지 · {cityData.spots.length}곳
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:11}}>
                          {cityData.spots.map((spot,i)=>(
                            <div key={i} className="card"
                              onClick={()=>setSelectedSpot(selectedSpot?.name===spot.name?null:spot)}
                              style={{borderRadius:14,overflow:'hidden',background:'white',border:`1.5px solid ${selectedSpot?.name===spot.name?(selectedCity?.color||'#3b82f6'):'#e2e8f0'}`,boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
                              <div style={{height:142,overflow:'hidden',position:'relative'}}>
                                <SpotImage
                                  className="cimg"
                                  wikiTitle={spot.wikiTitle}
                                  spotName={spot.name}
                                  alt={spot.name}
                                  fallback={spot.img || getImg(spot.type, spot.name)}
                                  style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
                                />
                                <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,.72) 0%,transparent 55%)'}}/>
                                <div style={{position:'absolute',bottom:10,left:12,right:12,display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
                                  <div>
                                    <div style={{fontSize:13.5,fontWeight:700,color:'white',textShadow:'0 1px 4px rgba(0,0,0,.6)'}}>{spot.name}</div>
                                    <div style={{display:'inline-block',fontSize:10,padding:'2px 9px',borderRadius:20,background:TYPE_COLORS[spot.type]||'#64748b',color:'white',marginTop:4,fontWeight:700}}>{spot.type}</div>
                                  </div>
                                  {spot.rating > 0 && <div style={{fontSize:13,color:'#fbbf24',fontWeight:700}}>★ {spot.rating}</div>}
                                </div>
                              </div>
                              {selectedSpot?.name===spot.name && (
                                <div style={{padding:'12px 14px',borderTop:`1px solid ${(selectedCity?.color||'#3b82f6')}22`,background:`${selectedCity?.color||'#3b82f6'}07`}}>
                                  <p style={{fontSize:12.5,color:'#475569',lineHeight:1.75,marginBottom:(spot.openTime||spot.price||spot.website)?10:0}}>{spot.desc}</p>
                                  {(spot.openTime || spot.price) && (
                                    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:spot.website?8:0}}>
                                      {spot.openTime && (
                                        <div style={{display:'flex',alignItems:'center',gap:4,background:'white',borderRadius:8,padding:'4px 10px',fontSize:11,color:'#475569',border:'1px solid #e2e8f0'}}>
                                          🕐 {spot.openTime}
                                        </div>
                                      )}
                                      {spot.price && (
                                        <div style={{display:'flex',alignItems:'center',gap:4,background:'white',borderRadius:8,padding:'4px 10px',fontSize:11,color:'#475569',border:'1px solid #e2e8f0'}}>
                                          🎫 {spot.price}
                                        </div>
                                      )}
                                    </div>
                                  )}
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
                                        padding:'6px 14px',fontSize:12,fontWeight:700,
                                        textDecoration:'none',
                                        boxShadow:`0 2px 8px ${spot.website?.includes('wikipedia.org') ? '#47556944' : (selectedCity?.color || '#3b82f6') + '44'}`
                                      }}
                                    >
                                      {spot.website?.includes('wikipedia.org') ? '📖 상세 정보 보기' : '🌐 공식 홈페이지'}
                                    </a>
                                  )}
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
                <div style={{fontSize:13,color:'#94a3b8'}}>관광 정보 불러오는 중...</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppWithBoundary() {
  return <ErrorBoundary><App /></ErrorBoundary>
}
