import { CITY_DATA_I18N } from './data/cityDataI18n'
import { COUNTRY_I18N, translateCountryInfo } from './data/countryI18n'
import { T, SPOT_TYPE_I18N, CITY_I18N, LANG_CODE, CONTINENT_I18N, DRIVE_I18N, translateVisa, translateTimeDiff, translatePopulation, KO_WORD_MAP, translateSpotField, intlLangMap, translateLangNames, translateCurrency } from './data/translations'
import { CITY_DATA, DEFAULT_CITY_DATA, TYPE_EMOJI, getImg, TYPE_COLORS } from './data/cityData'
import { COUNTRY_ISO, COUNTRY_NAME_OVERRIDE, getCountryDisplayName, LANG_OPTIONS, getFlagImg, COUNTRY_INFO, EMERGENCY_CONTACTS, extractCurrencyCode } from './data/countryInfo'
import { COUNTRY_CITIES } from './data/countryCities'
import { useState, useEffect, useRef, Component } from 'react'
import Globe from 'globe.gl'
import * as THREE from 'three'
import { AUTO_I18N } from './auto-i18n'
import { onAuth, loginEmail, signupEmail, loginGoogle, logout, loadUserData, saveUserData, updateUserProfile, shareCourse, loadSharedCourses, deleteSharedCourse, uploadPhoto, addComment, deleteComment, toggleLike, createJournal, loadJournals, loadJournal, updateJournal, deleteJournal, toggleJournalLike, addJournalComment, deleteJournalComment, uploadJournalPhoto } from './firebase'

// ── 실제 관광지 사진 (Wikipedia + Wikimedia Commons 검색) ─────────────
// 전역 중복 회피: 이미 사용된 이미지 URL을 패널 단위로 추적
// key = `${cityName}:${spotName}` → 해당 스팟이 점유한 이미지 URL
const SPOT_IMAGE_USED = new Map() // url → ownerKey
const SPOT_IMAGE_OWNED = new Map() // ownerKey → url

const claimImage = (url, ownerKey) => {
  if (!url) return false
  const prevOwner = SPOT_IMAGE_USED.get(url)
  if (prevOwner && prevOwner !== ownerKey) return false // 이미 다른 스팟이 사용 중
  // 기존에 이 스팟이 다른 이미지를 쓰고 있었다면 해제
  const prevUrl = SPOT_IMAGE_OWNED.get(ownerKey)
  if (prevUrl && prevUrl !== url) SPOT_IMAGE_USED.delete(prevUrl)
  SPOT_IMAGE_USED.set(url, ownerKey)
  SPOT_IMAGE_OWNED.set(ownerKey, url)
  return true
}

function SpotImage({ wikiTitle, spotName, cityName, fallback, className, style, alt }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    setSrc(null)
    let cancelled = false
    const keyword = wikiTitle || spotName || ''
    const ownerKey = `${cityName || ''}:${spotName || keyword}`
    if (!keyword) { setSrc(fallback); return }

    // 패널 전환 시 이전 소유 이미지 해제
    const prevUrl = SPOT_IMAGE_OWNED.get(ownerKey)
    if (prevUrl) { SPOT_IMAGE_USED.delete(prevUrl); SPOT_IMAGE_OWNED.delete(ownerKey) }

    const trySet = (url) => {
      if (cancelled || !url) return false
      if (!claimImage(url, ownerKey)) return false // 중복이면 skip
      setSrc(url)
      return true
    }

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
        const urls = []
        for (const page of pages) {
          if (page?.thumbnail?.source) urls.push(page.thumbnail.source)
        }
        return urls
      } catch { return [] }
    }

    // Wikimedia Commons에서 실사진 검색 (복수 후보 반환)
    const searchCommons = async (query) => {
      try {
        const res = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|mime&iiurlwidth=600&format=json&origin=*`)
        const data = await res.json()
        const pages = Object.values(data?.query?.pages || {})
        const urls = []
        for (const p of pages) {
          const info = p?.imageinfo?.[0]
          if (info?.thumburl && info.mime?.startsWith('image/jpeg')) urls.push(info.thumburl)
        }
        return urls
      } catch { return [] }
    }

    const loadImage = async () => {
      // 1차: wikiTitle 정확 매칭
      let img = await tryWiki(keyword)
      if (trySet(img)) return

      // 2차: 영어만 추출
      const enKeyword = keyword.replace(/[가-힣]+/g, '').trim()
      if (enKeyword && enKeyword !== keyword) {
        img = await tryWiki(enKeyword)
        if (trySet(img)) return
      }

      // 3차: spotName
      if (spotName && spotName !== keyword) {
        const enSpot = spotName.replace(/[가-힣]+/g, '').trim()
        if (enSpot) {
          img = await tryWiki(enSpot)
          if (trySet(img)) return
        }
      }

      // 4차: Wikipedia 검색 (도시명 포함, 복수 후보 중 미사용 선택)
      const searchQuery = keyword + (cityName ? ' ' + cityName : '')
      const wikiResults = await searchWiki(searchQuery)
      for (const url of wikiResults) if (trySet(url)) return

      // 5차: Wikimedia Commons 실사진 검색 (복수 후보)
      const commonsResults = await searchCommons(keyword + ' photo')
      for (const url of commonsResults) if (trySet(url)) return

      // 6차: 도시명 + spotName으로 Commons 재검색
      if (cityName) {
        const commonsResults2 = await searchCommons(spotName + ' ' + cityName)
        for (const url of commonsResults2) if (trySet(url)) return
      }

      // 최종: 모든 후보가 중복이면 그래도 1차 결과 표시 (빈 화면보단 중복이 나음)
      if (!cancelled && wikiResults[0]) { setSrc(wikiResults[0]); return }
      if (!cancelled && commonsResults[0]) { setSrc(commonsResults[0]); return }

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

function App() {
  // ── Auth 상태 ──
  const [currentUser, setCurrentUser] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' | 'signup'
  const [authEmail, setAuthEmail] = useState('')
  const [authPw, setAuthPw] = useState('')
  const [authName, setAuthName] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [homeCountry, setHomeCountry] = useState(() => localStorage.getItem('atlas_home_country') || '')
  const userSyncRef = useRef(false) // Firestore → localStorage 초기 로드 중복 방지

  // ── 커뮤니티 상태 ──
  const [showCommunity, setShowCommunity] = useState(false)
  const [communityCoursesData, setCommunityCoursesData] = useState([])
  const [communityLoading, setCommunityLoading] = useState(false)
  const [communityExpanded, setCommunityExpanded] = useState(null)
  const [communityContinent, setCommunityContinent] = useState(null)
  const [communityCountry, setCommunityCountry] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [shareModalCourse, setShareModalCourse] = useState(null)
  const [sharePhotos, setSharePhotos] = useState([])
  const [shareUploading, setShareUploading] = useState(false)

  // ── 트래블 피드 (Phase 1) ──
  const [showFeed, setShowFeed] = useState(false)
  const [feedMainTab, setFeedMainTab] = useState('journals') // 'journals' | 'courses'
  const [feedSubTab, setFeedSubTab] = useState('all') // 'all' | 'mine'
  const [feedJournals, setFeedJournals] = useState([])
  const [feedJournalsLoading, setFeedJournalsLoading] = useState(false)
  const [showJournalEditor, setShowJournalEditor] = useState(false)
  const [editingJournal, setEditingJournal] = useState(null) // null=new, object=edit
  const [viewingJournal, setViewingJournal] = useState(null) // 상세 보기
  const [journalForm, setJournalForm] = useState({ title:'', body:'', cities:[], days:1, rating:0, visibility:'public', photos:[] })
  const [journalNewPhotos, setJournalNewPhotos] = useState([]) // File 객체 (업로드 대기)
  const [journalSaving, setJournalSaving] = useState(false)
  const [journalCommentText, setJournalCommentText] = useState('')
  const [journalCitySelectOpen, setJournalCitySelectOpen] = useState(false)
  const [journalCitySearchQ, setJournalCitySearchQ] = useState('')

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

  // 방문 기록 (localStorage 저장)
  const [visited, setVisited] = useState(() => {
    try { return JSON.parse(localStorage.getItem('atlas_visited') || '{}') } catch { return {} }
  })
  // visited = { cities: ['서울','도쿄',...], spots: { '서울': ['경복궁','N서울타워'], '도쿄': ['센소지(아사쿠사)'] } }
  const saveVisited = (v) => { setVisited(v); localStorage.setItem('atlas_visited', JSON.stringify(v)) }
  const isVisitedCity = (cityName) => (visited.cities || []).includes(cityName)
  const isVisitedSpot = (cityName, spotName) => (visited.spots?.[cityName] || []).includes(spotName)
  const toggleVisitedCity = (cityName) => {
    const v = { ...visited, cities: [...(visited.cities || [])], spots: { ...(visited.spots || {}) } }
    if (isVisitedCity(cityName)) {
      v.cities = v.cities.filter(c => c !== cityName)
      delete v.spots[cityName]
    } else {
      v.cities.push(cityName)
    }
    saveVisited(v)
  }
  const toggleVisitedSpot = (cityName, spotName) => {
    const v = { ...visited, cities: [...(visited.cities || [])], spots: { ...(visited.spots || {}) } }
    const citySpots = [...(v.spots[cityName] || [])]
    if (citySpots.includes(spotName)) {
      v.spots[cityName] = citySpots.filter(s => s !== spotName)
      if (v.spots[cityName].length === 0) delete v.spots[cityName]
    } else {
      v.spots[cityName] = [...citySpots, spotName]
      if (!v.cities.includes(cityName)) v.cities.push(cityName)
    }
    saveVisited(v)
  }
  const totalCities = Object.values(COUNTRY_CITIES).flat().length
  const totalSpots = Object.values(CITY_DATA).reduce((a, d) => a + (d.spots?.length || 0), 0)
  const visitedCityCount = (visited.cities || []).length
  const visitedSpotCount = Object.values(visited.spots || {}).reduce((a, s) => a + s.length, 0)
  const [showMyTravels, setShowMyTravels] = useState(false)
  const [visitedExpandCity, setVisitedExpandCity] = useState(null)
  const [visitedExpandContinent, setVisitedExpandContinent] = useState(null)

  // ── 환율 계산기 ──
  const [showCurrencyCalc, setShowCurrencyCalc] = useState(false)
  const [currFrom, setCurrFrom] = useState('KRW')
  const [currTo, setCurrTo] = useState('USD')
  const [currAmount, setCurrAmount] = useState('10000')
  const [currResult, setCurrResult] = useState(null)
  const [currLoading, setCurrLoading] = useState(false)
  const [currRates, setCurrRates] = useState(null)

  const fetchCurrencyRate = async (from, to, amount) => {
    setCurrLoading(true); setCurrResult(null)
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${from}`)
      const data = await res.json()
      if (data.result === 'success' && data.rates?.[to]) {
        setCurrResult(data.rates[to] * Number(amount || 1))
        setCurrRates(data.rates)
      } else {
        setCurrResult('error')
      }
    } catch { setCurrResult('error') }
    setCurrLoading(false)
  }

  // ── Firebase Auth 리스너 ──
  useEffect(() => {
    const unsub = onAuth(async (user) => {
      setCurrentUser(user)
      if (user) {
        // Firestore에서 유저 데이터 로드
        const data = await loadUserData(user.uid)
        if (data) {
          userSyncRef.current = true
          if (data.favorites?.length) { setFavorites(data.favorites); localStorage.setItem('atlas_favorites', JSON.stringify(data.favorites)) }
          if (data.savedCourses?.length) { setSavedCourses(data.savedCourses); localStorage.setItem('atlas_saved_courses', JSON.stringify(data.savedCourses)) }
          if (data.visited && Object.keys(data.visited).length) { setVisited(data.visited); localStorage.setItem('atlas_visited', JSON.stringify(data.visited)) }
          if (data.homeCountry) { setHomeCountry(data.homeCountry); localStorage.setItem('atlas_home_country', data.homeCountry) }
          if (data.lang) { setLang(data.lang); localStorage.setItem('atlas_lang', data.lang) }
          setTimeout(() => { userSyncRef.current = false }, 500)
        } else {
          // 첫 로그인: localStorage → Firestore 마이그레이션
          await saveUserData(user.uid, {
            favorites, savedCourses, visited, homeCountry,
            lang, displayName: user.displayName || '', email: user.email
          })
        }
      }
    })
    return () => unsub()
  }, [])

  // Firestore 자동 동기화 (로그인 중 데이터 변경 시)
  useEffect(() => {
    if (!currentUser || userSyncRef.current) return
    const timer = setTimeout(() => {
      saveUserData(currentUser.uid, { favorites, savedCourses, visited, homeCountry, lang })
    }, 1000) // 1초 디바운스
    return () => clearTimeout(timer)
  }, [favorites, savedCourses, visited, homeCountry, lang, currentUser])

  // Auth 핸들러
  const handleAuth = async () => {
    setAuthError(''); setAuthLoading(true)
    try {
      if (authMode === 'login') {
        await loginEmail(authEmail, authPw)
      } else {
        const cred = await signupEmail(authEmail, authPw)
        if (authName) await updateUserProfile(cred.user, { displayName: authName })
      }
      setShowLoginModal(false); setAuthEmail(''); setAuthPw(''); setAuthName('')
    } catch (e) {
      const msgs = {
        'auth/invalid-email': lang==='ko'?'올바른 이메일을 입력하세요':'Invalid email',
        'auth/wrong-password': lang==='ko'?'비밀번호가 틀렸습니다':'Wrong password',
        'auth/invalid-credential': lang==='ko'?'이메일 또는 비밀번호가 틀렸습니다':'Invalid credentials',
        'auth/email-already-in-use': lang==='ko'?'이미 사용 중인 이메일입니다':'Email already in use',
        'auth/weak-password': lang==='ko'?'비밀번호가 너무 짧습니다 (6자 이상)':'Password too short (min 6)',
      }
      setAuthError(msgs[e.code] || e.message)
    }
    setAuthLoading(false)
  }
  const handleGoogleLogin = async () => {
    setAuthError(''); setAuthLoading(true)
    try { await loginGoogle(); setShowLoginModal(false) }
    catch (e) { setAuthError(e.message) }
    setAuthLoading(false)
  }
  const handleLogout = async () => {
    await logout()
    setCurrentUser(null)
  }

  // 모바일 뒤로가기 = 닫기 (refs for latest state in event handler)
  const backStateRef = useRef({})
  backStateRef.current = { showMyTravels, showHamburger, selectedSpot, sidePanel, selectedCity, selectedCountry, showCountryInfo, lang, showAiModal, showCoursePlanner, showCourseBasket, showCurrencyCalc, showLoginModal, showCommunity, shareModalCourse, showFeed, showJournalEditor, viewingJournal }
  useEffect(() => {
    // 충분한 history 스택 확보 (모바일 브라우저 호환)
    window.history.replaceState({ atlas: true }, '')
    for (let i = 0; i < 50; i++) window.history.pushState({ atlas: true }, '', window.location.href)
    const handlePop = (e) => {
      const s = backStateRef.current
      // 모달/오버레이 먼저 닫기
      if (s.viewingJournal) {
        setViewingJournal(null)
        backStateRef.current = { ...s, viewingJournal: null }
        return
      }
      if (s.showJournalEditor) {
        setShowJournalEditor(false); setEditingJournal(null)
        backStateRef.current = { ...s, showJournalEditor: false }
        return
      }
      if (s.showFeed) {
        setShowFeed(false)
        backStateRef.current = { ...s, showFeed: false }
        return
      }
      if (s.showLoginModal) {
        setShowLoginModal(false)
        backStateRef.current = { ...s, showLoginModal: false }
        return
      }
      if (s.shareModalCourse) {
        setShareModalCourse(null)
        backStateRef.current = { ...s, shareModalCourse: null }
        return
      }
      if (s.showCommunity) {
        setShowCommunity(false); setCommunityContinent(null); setCommunityCountry(null); setCommunityExpanded(null)
        backStateRef.current = { ...s, showCommunity: false }
        return
      }
      if (s.showCurrencyCalc) {
        setShowCurrencyCalc(false)
        backStateRef.current = { ...s, showCurrencyCalc: false }
        return
      }
      if (s.showAiModal) {
        setShowAiModal(false)
        backStateRef.current = { ...s, showAiModal: false }
        return
      }
      if (s.showCoursePlanner) {
        setShowCoursePlanner(false)
        backStateRef.current = { ...s, showCoursePlanner: false }
        return
      }
      if (s.showCourseBasket) {
        setShowCourseBasket(false)
        backStateRef.current = { ...s, showCourseBasket: false }
        return
      }
      if (s.showMyTravels) {
        setShowMyTravels(false)
        backStateRef.current = { ...s, showMyTravels: false }
        return
      }
      if (s.showHamburger) {
        setShowHamburger(false)
        backStateRef.current = { ...s, showHamburger: false }
        return
      }
      if (s.selectedSpot) {
        setSelectedSpot(null)
        backStateRef.current = { ...s, selectedSpot: null }
        return
      }
      if (s.sidePanel) {
        setSidePanel(null)
        backStateRef.current = { ...s, sidePanel: null }
        return
      }
      if (s.selectedCity) {
        setSelectedCity(null); setCityData(null); setSelectedSpot(null); setSidePanel(null)
        setShowCountryInfo(false)
        backStateRef.current = { ...s, selectedCity: null, selectedSpot: null, sidePanel: null, showCountryInfo: false }
        if (s.selectedCountry && globeRef.current) {
          const g = globeRef.current
          const cName = s.selectedCountry.properties?.NAME
          const cz = cName && typeof COUNTRY_ZOOM !== 'undefined' && COUNTRY_ZOOM[cName]
          if (cz) {
            const alt = window.innerWidth <= 768 ? cz.alt * 1.5 : cz.alt
            g.pointOfView({ lat: cz.lat, lng: cz.lng, altitude: alt }, 800)
          }
        }
        return
      }
      if (s.selectedCountry && s.showCountryInfo) {
        setShowCountryInfo(false)
        backStateRef.current = { ...s, showCountryInfo: false }
        return
      }
      if (s.selectedCountry) {
        setSelectedCountry(null); setSelectedCity(null); setCityData(null); setSelectedSpot(null); setShowCountryInfo(false)
        backStateRef.current = { ...s, selectedCountry: null, selectedCity: null, selectedSpot: null, showCountryInfo: false }
        return
      }
      // 아무것도 열려있지 않으면 종료 확인
      const msg = s.lang === 'ko' ? '앱을 종료하시겠습니까?' : 'Exit the app?'
      if (window.confirm(msg)) {
        window.removeEventListener('popstate', handlePop)
        window.location.href = 'about:blank'
      }
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  // 다국어 헬퍼
  const TOOL_I18N = {
    toolTitle:{ko:'여행 도구',en:'Travel Tools',ja:'旅行ツール',zh:'旅行工具'},
    currCalc:{ko:'환율 계산기',en:'Currency Calculator',ja:'為替計算機',zh:'汇率计算器'},
    currFrom:{ko:'보내는 통화',en:'From',ja:'変換元',zh:'从'},
    currTo:{ko:'받는 통화',en:'To',ja:'変換先',zh:'到'},
    currAmount:{ko:'금액',en:'Amount',ja:'金額',zh:'金额'},
    currConvert:{ko:'환산',en:'Convert',ja:'変換',zh:'换算'},
    currSwap:{ko:'통화 바꾸기',en:'Swap',ja:'入替',zh:'交换'},
    currLoading:{ko:'계산 중...',en:'Calculating...',ja:'計算中...',zh:'计算中...'},
    currError:{ko:'환율 조회 실패',en:'Rate fetch failed',ja:'レート取得失敗',zh:'汇率获取失败'},
    emergTitle:{ko:'긴급 연락처',en:'Emergency',ja:'緊急連絡先',zh:'紧急联系'},
    emergPolice:{ko:'경찰',en:'Police',ja:'警察',zh:'警察'},
    emergAmbulance:{ko:'구급',en:'Ambulance',ja:'救急',zh:'急救'},
    emergFire:{ko:'소방',en:'Fire',ja:'消防',zh:'消防'},
    emergTourist:{ko:'관광안내',en:'Tourist',ja:'観光案内',zh:'旅游咨询'},
    emergGeneral:{ko:'통합신고',en:'General',ja:'総合',zh:'综合'},
    emergCall:{ko:'전화하기',en:'Call',ja:'電話する',zh:'拨打'},
  }
  const t = (key) => {
    const tv = TOOL_I18N[key]?.[lang]
    if (tv !== undefined) return tv
    const val = T[key]?.[lang]
    if (val !== undefined && val !== null) return val
    const ko = T[key]?.['ko'] ?? TOOL_I18N[key]?.['ko']
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
    // hotspot/restaurant → 현재 언어로 로드된 데이터에서 place_id로 매칭
    if (item.place_id) {
      const current = [...hotspots, ...restaurants].find(p => p.place_id === item.place_id)
      if (current?.name) return current.name
    }
    return item.displayName || item.name
  }
  const getCourseItemCity = (item) => getCityName(item.cityName || item.name)

  // ── 다국어 코스 빌더 (커뮤니티 공유 시) ──
  const buildItemI18n = (item) => {
    const names = { ko: item.name }
    const cityKey = item.cityName
    const cityI18n = { ko: cityKey }
    if (cityKey && CITY_I18N[cityKey]) {
      const tr = CITY_I18N[cityKey]
      cityI18n.en = tr[0] || cityKey
      cityI18n.ja = tr[1] || tr[0] || cityKey
      cityI18n.zh = tr[2] || tr[0] || cityKey
    }
    if (item.source === 'spot' && cityKey) {
      for (const lg of ['en','ja','zh']) {
        const manual = CITY_DATA_I18N[cityKey]?.[lg]
        const autoD = AUTO_I18N?.[cityKey]?.[lg] || AUTO_I18N?.[cityKey]?.['en']
        const trData = manual || autoD
        if (trData?.spots) {
          const exact = trData.spots[item.name]
          if (exact?.name) { names[lg] = exact.name; continue }
          const fuzzy = Object.keys(trData.spots).find(k => k.startsWith(item.name) || item.name.startsWith(k))
          if (fuzzy && trData.spots[fuzzy]?.name) { names[lg] = trData.spots[fuzzy].name; continue }
        }
        if (item.wikiTitle) names[lg] = names[lg] || item.wikiTitle
        else names[lg] = names[lg] || item.name
      }
    } else {
      for (const lg of ['en','ja','zh']) names[lg] = names[lg] || item.displayName || item.name
    }
    return { names, cityNames: cityI18n }
  }

  const buildCourseI18n = (course) => {
    const newDays = (course.days || []).map(d => ({
      ...d,
      items: (d.items || []).map(it => {
        const i18n = buildItemI18n(it)
        return { ...it, i18n: i18n.names, cityI18n: i18n.cityNames }
      })
    }))
    return { ...course, days: newDays }
  }

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
    if (dateRange) infoLines.push(`●  ${dateRange}`)
    infoLines.push(`●  ${courseItems.length} ${lang==='ko'?'곳':'places'}  ·  ${courseDays.length} ${lang==='ko'?'일':'days'}`)
    infoLines.push(`●  ${transportLabel}`)
    cover.addText(infoLines.join('\n'), { x: 0.7, y: 4.2, w: 10, fontSize: 14, color: '94a3b8', fontFace: 'Arial', lineSpacingMultiple: 1.8 })
    cover.addText('ATLAS World Travel Explorer', { x: 0.7, y: 6.75, w: 10, fontSize: 10, color: '475569', fontFace: 'Arial' })

    // ── Day별 슬라이드 ──
    courseDays.forEach((day, di) => {
      // Day 총 이동시간 계산
      let totalSec = 0
      for (let i = 0; i < day.items.length - 1; i++) {
        const rk = getRouteKey(day.items[i], day.items[i + 1], courseTransport)
        if (routeCache[rk]?.durationSec) totalSec += routeCache[rk].durationSec
      }
      const totalMin = Math.round(totalSec / 60)
      const totalStr = totalMin > 0 ? (Math.floor(totalMin/60) > 0 ? `${Math.floor(totalMin/60)}h ${totalMin%60}m` : `${totalMin}m`) : ''

      const slide = pptx.addSlide()
      slide.background = { color: 'FFFFFF' }

      // 상단 컬러 바
      slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: 'c8856a' } })

      // Day 헤더 배경
      slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0.08, w: 13.33, h: 0.75, fill: { color: 'faf8f5' } })
      slide.addText(`Day ${di + 1}`, { x: 0.6, y: 0.12, w: 2, h: 0.65, fontSize: 24, color: 'c8856a', bold: true, fontFace: 'Arial' })
      const headerRight = []
      if (courseTripStart) headerRight.push(formatDate(getDayDate(di)))
      headerRight.push(`${day.items.length} ${lang==='ko'?'곳':'places'}`)
      if (totalStr) headerRight.push(totalStr)
      slide.addText(headerRight.join('   ·   '), { x: 3, y: 0.12, w: 9.5, h: 0.65, fontSize: 11, color: '64748b', fontFace: 'Arial', align: 'right' })

      // 테이블 — 행 높이를 장소 수에 맞게 자동 조절
      const itemCount = day.items.length
      const maxH = 6.2 // 테이블 최대 높이
      const headerH = 0.32
      const rowH = Math.min(0.6, Math.max(0.35, (maxH - headerH) / itemCount))

      const rows = []
      rows.push([
        { text: '#', options: { fill: { color: 'c8856a' }, color: 'FFFFFF', bold: true, fontSize: 9, align: 'center' } },
        { text: lang==='ko'?'장소':'Place', options: { fill: { color: 'c8856a' }, color: 'FFFFFF', bold: true, fontSize: 9 } },
        { text: lang==='ko'?'도시':'City', options: { fill: { color: 'c8856a' }, color: 'FFFFFF', bold: true, fontSize: 9 } },
        { text: lang==='ko'?'유형':'Type', options: { fill: { color: 'c8856a' }, color: 'FFFFFF', bold: true, fontSize: 9, align: 'center' } },
        { text: lang==='ko'?'별점':'Rating', options: { fill: { color: 'c8856a' }, color: 'FFFFFF', bold: true, fontSize: 9, align: 'center' } },
        { text: lang==='ko'?'이동':'Route', options: { fill: { color: 'c8856a' }, color: 'FFFFFF', bold: true, fontSize: 9, align: 'center' } },
      ])

      day.items.forEach((item, idx) => {
        const typeName = item.source === 'spot' ? (lang==='ko'?'관광지':'Attraction') : item.source === 'hotspot' ? (lang==='ko'?'핫플':'Hot Place') : (lang==='ko'?'맛집':'Restaurant')
        const bgColor = idx % 2 === 0 ? 'FFFFFF' : 'f8f8f6'
        const fs = itemCount > 8 ? 9 : 11

        let routeText = ''
        if (idx < day.items.length - 1) {
          const rk = getRouteKey(day.items[idx], day.items[idx + 1], courseTransport)
          const route = routeCache[rk]
          if (route && !route.noRoute) routeText = `${route.duration}\n${route.distance}`
        }

        rows.push([
          { text: `${idx + 1}`, options: { fill: { color: bgColor }, color: 'c8856a', bold: true, fontSize: fs, align: 'center' } },
          { text: getCourseItemName(item), options: { fill: { color: bgColor }, color: '1a1714', bold: true, fontSize: fs } },
          { text: getCourseItemCity(item), options: { fill: { color: bgColor }, color: '475569', fontSize: fs - 1 } },
          { text: typeName, options: { fill: { color: bgColor }, color: '475569', fontSize: fs - 1, align: 'center' } },
          { text: item.rating ? `★ ${item.rating}` : '-', options: { fill: { color: bgColor }, color: item.rating ? 'b45309' : '94a3b8', fontSize: fs - 1, align: 'center', bold: !!item.rating } },
          { text: routeText, options: { fill: { color: bgColor }, color: '475569', fontSize: itemCount > 8 ? 7 : 8, align: 'center' } },
        ])
      })

      slide.addTable(rows, {
        x: 0.4, y: 1.0, w: 12.5,
        border: { type: 'solid', pt: 0.5, color: 'e2e8f0' },
        colW: [0.5, 4.5, 2.5, 1.5, 1.1, 2.4],
        rowH: [headerH, ...day.items.map(() => rowH)],
        fontFace: 'Arial',
        autoPage: false,
      })

      // 하단 워터마크
      slide.addText('ATLAS World Travel Explorer', { x: 0.5, y: 7.0, w: 12, fontSize: 8, color: 'b0a89e', fontFace: 'Arial' })
    })

    pptx.writeFile({ fileName: `ATLAS_${cityNames[0]||'Trip'}_${courseDays.length}Days.pptx` })
  }


  // Load world GeoJSON (110m 고정, 남극 날짜변경선 ring 제거)
  useEffect(() => {
    const load110m = () => fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
      .then(r => r.json())

    // 경도 180도 이상 span 하는 ring은 렌더링 시 지구 전체 덮음 (남극 등)
    const isValidRing = (ring) => {
      if (!ring || ring.length < 4) return false
      const lngs = ring.map(c => c[0])
      return (Math.max(...lngs) - Math.min(...lngs)) <= 180
    }

    const processGeo = (data) => {
      const fixed = data.features.map(feat => {
        const geom = feat.geometry
        if (!geom) return feat
        if (geom.type === 'Polygon') {
          const validRings = geom.coordinates.filter(isValidRing)
          if (!validRings.length) return { ...feat, geometry: { ...geom, coordinates: [] } }
          return { ...feat, geometry: { ...geom, coordinates: validRings } }
        }
        if (geom.type === 'MultiPolygon') {
          const validPolys = geom.coordinates
            .map(poly => poly.filter(isValidRing))
            .filter(poly => poly.length > 0)
          if (!validPolys.length) return { ...feat, geometry: { ...geom, coordinates: [] } }
          return { ...feat, geometry: { ...geom, coordinates: validPolys } }
        }
        return feat
      })
      console.log('[ATLAS] Loaded', fixed.length, 'country polygons (110m)')
      setCountries(fixed)
    }

    load110m().then(processGeo).catch(err => console.error('[ATLAS] Polygon load failed:', err))
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

    // ── 모바일 더블탭 줌인 ──
    if (window.innerWidth <= 768) {
      let lastTap = 0
      let wasMultiTouch = false
      globeContainerRef.current.addEventListener('touchstart', (e) => {
        if (e.touches.length >= 2) wasMultiTouch = true
      }, { passive: true })
      globeContainerRef.current.addEventListener('touchend', (e) => {
        if (e.touches.length === 0 && wasMultiTouch) { wasMultiTouch = false; return }
        if (wasMultiTouch) return
        const now = Date.now()
        if (now - lastTap < 300) {
          e.preventDefault()
          const g = globeRef.current
          if (g) {
            const pov = g.pointOfView()
            const newAlt = Math.max(pov.altitude * 0.55, 0.05)
            g.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: newAlt }, 600)
          }
        }
        lastTap = now
      }, { passive: false })
    }

    // ── 달 추가 ──
    const scene = globe.scene()
    const moonGeo = new THREE.SphereGeometry(14, 32, 32)
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xddddd8, roughness: 0.85, metalness: 0.0 })
    const moon = new THREE.Mesh(moonGeo, moonMat)
    // 달 텍스처 (로드 실패해도 회색 구체로 보임)
    try {
      new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg',
        (tex) => { moonMat.map = tex; moonMat.color.set(0xffffff); moonMat.needsUpdate = true })
    } catch {}
    const moonDist = 400
    scene.add(moon)

    // 달 공전 애니메이션
    let moonAngle = Math.PI * 0.7
    const animateMoon = () => {
      moonAngle += 0.00025
      moon.position.x = Math.cos(moonAngle) * moonDist
      moon.position.z = Math.sin(moonAngle) * moonDist * 0.65
      moon.position.y = Math.sin(moonAngle * 0.4) * 50 + 60
      moon.rotation.y += 0.0008
      requestAnimationFrame(animateMoon)
    }
    animateMoon()

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

  // Update polygons — effect 분리로 렉 해결
  // A: countries 변경 시에만 polygonsData 호출 (무거움, 1회만)
  useEffect(() => {
    if (!globeRef.current || countries.length === 0) return
    globeRef.current
      .polygonsData(countries)
      .polygonsTransitionDuration(0)
  }, [countries])

  // B: hover/select 변경 시 accessor만 재설정 (가벼움)
  useEffect(() => {
    if (!globeRef.current || countries.length === 0) return
    const globe = globeRef.current
    const hasSelection = !!selectedCountry

    globe
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
        if (hasSelection) return
        setHoveredCountry(feat ? feat.properties.NAME : null)
      })
      .onPolygonClick(feat => {
        if (hasSelection) return
        if (justClickedCityRef.current) return
        handleCountryClick(feat)
      })
  }, [hoveredCountry, selectedCountry, lang, countries])


  // 국가별 최적 줌 레벨 (수동 튜닝)
  const COUNTRY_ZOOM = {
    // 아시아
    "South Korea": { alt: 0.22, lat: 36.0, lng: 127.8 },
    "Japan": { alt: 0.35, lat: 36.5, lng: 138.0 },
    "China": { alt: 1.2, lat: 35.0, lng: 105.0 },
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
                          <button onClick={()=>{
                            if (!currentUser) { setShowLoginModal(true); setShowHamburger(false); return }
                            setShareModalCourse({ days: sc.days||[], transport: sc.transport||'transit', type: 'ai' })
                            setShowHamburger(false)
                          }} title={t('shareBtn')} style={{background:'linear-gradient(135deg,#2563eb,#7c3aed)',border:'none',color:'white',padding:'4px 8px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer'}}>🌍</button>
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
                          <button onClick={()=>{
                            if (!currentUser) { setShowLoginModal(true); setShowHamburger(false); return }
                            setShareModalCourse({ days: sc.days||[], transport: sc.transport||'transit', type: 'manual' })
                            setShowHamburger(false)
                          }} title={t('shareBtn')} style={{background:'linear-gradient(135deg,#2563eb,#7c3aed)',border:'none',color:'white',padding:'4px 8px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer'}}>🌍</button>
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
                                <div style={{fontSize:12,fontWeight:600,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{getCityName(f._koName||f.name)||f.displayName||f.name}</div>
                                <div style={{fontSize:10,color:'#94a3b8'}}>{f.countryEn?getCountryName(f.countryEn):(f.countryName||'')}</div>
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
                                <div style={{fontSize:12,fontWeight:600,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{trSpot(f.cityName, f.name)?.name || f.name}</div>
                                <div style={{fontSize:10,color:'#94a3b8'}}>{getCityName(f.cityName)||f.cityDisplayName||f.cityName||''}</div>
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
                                <div style={{fontSize:12,fontWeight:600,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(f.place_id && [...hotspots,...restaurants].find(p=>p.place_id===f.place_id))?.name || f.name}</div>
                                <div style={{fontSize:10,color:'#94a3b8'}}>{f.rating?`★ ${f.rating}`:''} {getCityName(f.cityName)||f.cityDisplayName||''}</div>
                              </div>
                              <button onClick={e=>{e.preventDefault();e.stopPropagation();toggleFav(f)}} style={{background:'none',border:'none',color:'#fbbf24',fontSize:14,cursor:'pointer',padding:2}}>⭐</button>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 트래블 피드 */}
                <div style={{padding:'12px 16px 14px',borderTop:'1px solid rgba(255,255,255,.08)'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'8px 12px',borderRadius:10,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',transition:'all .15s'}}
                    onClick={async()=>{
                      setShowFeed(true);setShowHamburger(false);setFeedMainTab('journals');setFeedSubTab('all');setFeedJournalsLoading(true)
                      try{
                        const data=await loadJournals({ limitN: 30 })
                        setFeedJournals(data)
                      }catch(e){console.error('[ATLAS] loadJournals failed:',e)}
                      setFeedJournalsLoading(false)
                      // 코스 데이터도 미리 로드 (탭 전환 시 즉시 표시)
                      try{const cd=await loadSharedCourses();setCommunityCoursesData(cd)}catch(e){}
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.12)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,rgba(251,191,36,.2),rgba(251,191,36,.1))',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'white'}}>{t('travelFeed')}</div>
                        <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>{t('travelFeedDesc')}</div>
                      </div>
                    </div>
                    <span style={{fontSize:14,color:'#64748b'}}>→</span>
                  </div>
                </div>

                {/* 내 여행 기록 */}
                <div style={{padding:'0 16px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'8px 12px',borderRadius:10,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',transition:'all .15s'}}
                    onClick={()=>{setShowMyTravels(true);setShowHamburger(false)}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.12)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:18}}>🌍</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'white'}}>{t('visitedTitle')}</div>
                        <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>
                          {visitedCityCount}{t('visitedCityCount')} · {(()=>{const vc=new Set();(visited.cities||[]).forEach(c=>{const entry=Object.entries(COUNTRY_CITIES).find(([_,cs])=>cs.some(x=>x.name===c));if(entry)vc.add(entry[0])});return vc.size})()}{lang==='ko'?'개국':' countries'}
                        </div>
                      </div>
                    </div>
                    <span style={{fontSize:14,color:'#64748b'}}>→</span>
                  </div>
                </div>

                {/* 환율 계산기 */}
                <div style={{padding:'0 16px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'8px 12px',borderRadius:10,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',transition:'all .15s'}}
                    onClick={()=>{
                      setShowCurrencyCalc(true);setShowHamburger(false)
                      if(selectedCountry){
                        const cn=selectedCountry.properties?.NAME
                        const ci=COUNTRY_INFO[cn]
                        if(ci){const code=extractCurrencyCode(ci.currency);if(code&&code!=='KRW'){setCurrTo(code)}}
                      }
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.12)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:24,height:24,borderRadius:6,background:'rgba(5,150,105,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#10b981'}}>¤</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'white'}}>{t('currCalc')}</div>
                        <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>{currFrom} → {currTo}</div>
                      </div>
                    </div>
                    <span style={{fontSize:14,color:'#64748b'}}>→</span>
                  </div>
                </div>

                {/* 로그인/계정 */}
                <div style={{padding:'0 16px 14px'}}>
                  {currentUser ? (
                    <div style={{padding:'8px 12px',borderRadius:10,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                        <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'white'}}>{(currentUser.displayName || currentUser.email)?.[0]?.toUpperCase() || '?'}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:700,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{currentUser.displayName || currentUser.email}</div>
                          {currentUser.displayName && <div style={{fontSize:10,color:'#64748b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{currentUser.email}</div>}
                        </div>
                      </div>
                      {/* 홈 국가 설정 */}
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                        <span style={{fontSize:10,color:'#94a3b8',whiteSpace:'nowrap'}}>{lang==='ko'?'홈 국가':'Home'}</span>
                        <select value={homeCountry} onChange={e=>{setHomeCountry(e.target.value);localStorage.setItem('atlas_home_country',e.target.value);const code=extractCurrencyCode(COUNTRY_INFO[e.target.value]?.currency);if(code)setCurrFrom(code)}}
                          style={{flex:1,padding:'4px 6px',borderRadius:6,border:'1px solid rgba(255,255,255,.15)',background:'rgba(255,255,255,.08)',color:'white',fontSize:11,cursor:'pointer'}}>
                          <option value="" style={{background:'#1e293b'}}>—</option>
                          {Object.keys(COUNTRY_INFO).sort().map(c=><option key={c} value={c} style={{background:'#1e293b'}}>{COUNTRY_INFO[c].emoji} {lang==='ko'?c:c}</option>)}
                        </select>
                      </div>
                      <button onClick={()=>{handleLogout();setShowHamburger(false)}}
                        style={{width:'100%',padding:'6px',borderRadius:8,border:'1px solid rgba(239,68,68,.3)',background:'rgba(239,68,68,.1)',color:'#f87171',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                        {lang==='ko'?'로그아웃':'Logout'}
                      </button>
                    </div>
                  ) : (
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'8px 12px',borderRadius:10,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',transition:'all .15s'}}
                      onClick={()=>{setShowLoginModal(true);setShowHamburger(false)}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.12)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:24,height:24,borderRadius:6,background:'rgba(59,130,246,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#60a5fa'}}>👤</div>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:'white'}}>{lang==='ko'?'로그인 / 회원가입':'Login / Sign up'}</div>
                          <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>{lang==='ko'?'데이터 클라우드 동기화':'Sync your data'}</div>
                        </div>
                      </div>
                      <span style={{fontSize:14,color:'#64748b'}}>→</span>
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
              position:'absolute',bottom:isMobile?'calc(12px + env(safe-area-inset-bottom))':24,
              left:'50%',transform:'translateX(-50%)',
              zIndex:1001,background:'rgba(255,255,255,.96)',backdropFilter:'blur(14px)',
              border:'1.5px solid #e2e8f0',borderRadius:isMobile?16:40,
              padding:isMobile?'7px 10px':'10px 20px',fontSize:isMobile?11:13,color:'#1e293b',
              boxShadow:'0 4px 24px rgba(0,0,0,.18)',
              display:'flex',alignItems:'center',gap:isMobile?5:12,
              whiteSpace:'nowrap',
              maxWidth:isMobile?'96vw':'none',
              flexWrap:'nowrap',
              justifyContent:'flex-start',
            }}>
              {info && <span style={{fontSize:isMobile?15:20,flexShrink:0}}>{info.emoji}</span>}
              <span style={{fontWeight:700,fontSize:isMobile?12:15,flexShrink:0}}>{countryKo}</span>
              {info && !isMobile && <span style={{fontSize:11,color:'#64748b',fontWeight:500}}>{info.tagline}</span>}
              <span style={{color:'#94a3b8',fontSize:isMobile?10:12,flexShrink:0}}>
                {cities ? `${cities.length}${t('nCities')}` : ''}
              </span>
              {info && (
                <button onClick={()=>setShowCountryInfo(v=>!v)}
                  style={{background: showCountryInfo ? '#3b82f6' : '#f0f9ff',border: showCountryInfo ? '1.5px solid #3b82f6' : '1.5px solid #bae6fd',borderRadius:20,padding:isMobile?'4px 9px':'5px 14px',cursor:'pointer',fontSize:isMobile?10.5:11.5,color: showCountryInfo ? 'white' : '#0369a1',fontWeight:700,transition:'all .2s',display:'flex',alignItems:'center',gap:3,flexShrink:0}}>
                  📋{isMobile?'':' '+t('countryInfo')} {showCountryInfo ? '▾' : '▸'}
                </button>
              )}
              <button onClick={closeCountry}
                style={{background:'#f1f5f9',border:'none',borderRadius:20,padding:isMobile?'4px 8px':'5px 12px',cursor:'pointer',fontSize:isMobile?11:12,color:'#64748b',fontWeight:600,flexShrink:0}}>
                ✕
              </button>
            </div>

            {/* Country Info Panel */}
            {showCountryInfo && info && (
              <div className="countryInfoPanel" style={{
                position:'absolute',bottom:isMobile?'calc(72px + env(safe-area-inset-bottom))':68,left:'50%',transform:'translateX(-50%)',
                zIndex:1000,width:isMobile?'95vw':480,maxWidth:'95vw',
                maxHeight:isMobile?'60vh':'none',overflowY:isMobile?'auto':'hidden',
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
                    { icon:'🌍', label:t('lContinent'), value:info.continent },
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

                {/* Emergency Contacts */}
                {(() => {
                  const em = EMERGENCY_CONTACTS[cName]
                  if (!em) return null
                  const items = [
                    em.police && {icon:'🚔',label:t('emergPolice'),num:em.police},
                    em.ambulance && {icon:'🚑',label:t('emergAmbulance'),num:em.ambulance},
                    em.fire && {icon:'🚒',label:t('emergFire'),num:em.fire},
                    em.tourist && {icon:'ℹ️',label:t('emergTourist'),num:em.tourist},
                    em.general && {icon:'📞',label:t('emergGeneral'),num:em.general},
                  ].filter(Boolean)
                  return (
                    <div style={{padding:'10px 20px 14px',borderTop:'1px solid #f1f5f9'}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#ef4444',letterSpacing:'.5px',marginBottom:8}}>🆘 {t('emergTitle')}</div>
                      <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)',gap:5}}>
                        {items.map((it,i)=>(
                          <a key={i} href={`tel:${it.num}`} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 8px',borderRadius:8,background:'#fef2f2',border:'1px solid #fecaca',textDecoration:'none',fontSize:11,color:'#dc2626',fontWeight:600,minWidth:0,overflow:'hidden'}}>
                            <span style={{flexShrink:0,fontSize:12}}>{it.icon}</span>
                            <div style={{minWidth:0,overflow:'hidden'}}>
                              <div style={{fontSize:9,color:'#94a3b8',fontWeight:500,lineHeight:1}}>{it.label}</div>
                              <div style={{fontSize:12,fontWeight:700,color:'#dc2626',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{it.num}</div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )
                })()}

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
                <button onClick={()=>toggleVisitedCity(selectedCity?._koName||selectedCity?.name)}
                  style={{background:isVisitedCity(selectedCity?._koName||selectedCity?.name)?'#22c55e':'#f5f0ea',border:isVisitedCity(selectedCity?._koName||selectedCity?.name)?'none':'1px solid #e0d9d0',color:isVisitedCity(selectedCity?._koName||selectedCity?.name)?'white':'#b0a89e',width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}
                  title={isVisitedCity(selectedCity?._koName||selectedCity?.name)?t("visitedUnmark"):t("visitedMark")}>{isVisitedCity(selectedCity?._koName||selectedCity?.name)?'✓':'⊘'}</button>
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
                            <span style={{fontSize:13,fontWeight:600,color:'#1e293b'}}>{getCityName(c.name)}</span>
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
                <button onClick={()=>{
                  if (!currentUser) { setShowLoginModal(true); return }
                  if (courseItems.length === 0) return
                  setShareModalCourse({ days: courseDays, transport: courseTransport, type: courseSource })
                }}
                  style={{padding:'5px 10px',borderRadius:6,border:'none',background:'linear-gradient(135deg,#2563eb,#7c3aed)',fontSize:11,fontWeight:600,color:'white',cursor:'pointer',transition:'all .15s',display:'flex',alignItems:'center',gap:3}}
                  onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
                  onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                >🌍 {t('shareBtn')}</button>
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

      {/* ── 내 여행 기록 (전체 패널) ── */}
      {showMyTravels && (
        <>
          <div onClick={()=>setShowMyTravels(false)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.5)',zIndex:1400,backdropFilter:'blur(4px)'}}/>
          <div style={{
            position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
            width:isMobile?'96vw':Math.min(900,typeof window!=='undefined'?window.innerWidth-60:840),
            maxHeight:isMobile?'90vh':'85vh',
            background:'#0f172a',borderRadius:20,border:'1px solid rgba(255,255,255,.15)',
            boxShadow:'0 24px 80px rgba(0,0,0,.5)',zIndex:1401,overflow:'hidden',
            display:'flex',flexDirection:'column',
            animation:'aiModalIn .3s cubic-bezier(.16,1,.3,1)'
          }}>
            {/* 헤더 */}
            <div style={{padding:'20px 24px 16px',borderBottom:'1px solid rgba(255,255,255,.1)',flexShrink:0}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:24}}>🌍</span>
                  <div>
                    <div style={{fontSize:20,fontWeight:700,color:'white'}}>{t('visitedTitle')}</div>
                    <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>
                      {(()=>{const vc=new Set();(visited.cities||[]).forEach(c=>{const entry=Object.entries(COUNTRY_CITIES).find(([_,cs])=>cs.some(x=>x.name===c));if(entry)vc.add(entry[0])});return vc.size})()}{lang==='ko'?'개국':' countries'} · {visitedCityCount}{t('visitedCityCount')}
                    </div>
                  </div>
                </div>
                <button onClick={()=>setShowMyTravels(false)}
                  style={{width:32,height:32,borderRadius:8,border:'1px solid rgba(255,255,255,.2)',background:'none',color:'#94a3b8',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
              </div>
            </div>

            {/* 컨텐츠 */}
            <div style={{flex:1,overflowY:'auto',padding:isMobile?'16px':'24px'}}>

              {/* 퍼센트 + 통계 카드 */}
              {(()=>{
                const _vcSet=new Set();(visited.cities||[]).forEach(c=>{const entry=Object.entries(COUNTRY_CITIES).find(([_,cs])=>cs.some(x=>x.name===c));if(entry)_vcSet.add(entry[0])});
                const _vcc=_vcSet.size, _tcc=Object.keys(COUNTRY_CITIES).length
                const _cpct=_tcc>0?Math.round(_vcc/_tcc*100):0
                const _cipct=totalCities>0?Math.round(visitedCityCount/totalCities*100):0
                const _combo=Math.round((_cpct+_cipct)/2)
                return (<>
              <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                    <span style={{fontSize:13,fontWeight:600,color:'white'}}>{t('visitedProgress')}</span>
                    <span style={{fontSize:22,fontWeight:800,color:'#c8856a'}}>{_combo}%</span>
                  </div>
                  <div style={{height:10,background:'rgba(255,255,255,.08)',borderRadius:5,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${_combo}%`,background:'linear-gradient(90deg,#c8856a,#f59e0b)',borderRadius:5,transition:'width .8s cubic-bezier(.16,1,.3,1)'}}/>
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:20}}>
                {[
                  {label:lang==='ko'?'방문 국가':'Countries',value:_vcc,total:_tcc,pct:_cpct,color:'#3b82f6'},
                  {label:lang==='ko'?'방문 도시':'Cities',value:visitedCityCount,total:totalCities,pct:_cipct,color:'#c8856a'},
                ].map((s,i)=>(
                  <div key={i} style={{background:'rgba(255,255,255,.05)',borderRadius:12,padding:'14px 16px',border:'1px solid rgba(255,255,255,.08)'}}>
                    <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                      <span style={{fontSize:28,fontWeight:800,color:s.color}}>{s.value}</span>
                      <span style={{fontSize:14,fontWeight:700,color:s.color,opacity:.7}}>{s.pct}%</span>
                    </div>
                    <div style={{fontSize:10,color:'#64748b',marginTop:2}}>{s.label} ({t('visitedOf')} {s.total})</div>
                  </div>
                ))}
              </div>
              </>)})()}

              {/* 초기화 버튼 */}
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:8}}>
                <button onClick={()=>{if(window.confirm(lang==='ko'?'모든 방문 기록을 초기화할까요?':'Reset all travel records?')){saveVisited({});setVisitedExpandContinent(null);setVisitedExpandCity(null)}}}
                  style={{padding:'5px 14px',borderRadius:8,border:'1px solid rgba(239,68,68,.4)',background:'rgba(239,68,68,.1)',color:'#f87171',fontSize:11,fontWeight:600,cursor:'pointer',transition:'all .15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,.25)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,.1)'}}
                >{lang==='ko'?'🗑 초기화':'🗑 Reset'}</button>
              </div>

              {/* 세계지도 (실제 국가 모양) */}
              <div style={{background:'rgba(6,12,30,.8)',borderRadius:14,border:'1px solid rgba(255,255,255,.08)',padding:'8px 4px',overflow:'hidden',marginBottom:24}}>
                <svg viewBox="-180 -90 360 180" preserveAspectRatio="xMidYMid meet" style={{width:'100%',height:'auto',display:'block'}} xmlns="http://www.w3.org/2000/svg">
                  {/* 바다 배경 */}
                  <rect x="-180" y="-90" width="360" height="180" fill="#0a1628"/>
                  {/* 그리드 */}
                  {[-60,-30,0,30,60].map(lat=>(
                    <line key={`lat${lat}`} x1="-180" y1={-lat} x2="180" y2={-lat} stroke="rgba(255,255,255,.04)" strokeWidth="0.2"/>
                  ))}
                  {/* 국가 폴리곤 */}
                  {countries.map((feat, fi) => {
                    const name = feat.properties?.NAME
                    if (!name) return null
                    const cities = COUNTRY_CITIES[name] || []
                    const isVisited = cities.some(c => (visited.cities||[]).includes(c.name))
                    const vCount = cities.filter(c => (visited.cities||[]).includes(c.name)).length
                    const geom = feat.geometry
                    const toPath = (ring) => ring.map((c,i) => `${i===0?'M':'L'}${c[0]},${-c[1]}`).join('') + 'Z'
                    let paths = []
                    if (geom.type === 'Polygon') {
                      paths = [toPath(geom.coordinates[0])]
                    } else if (geom.type === 'MultiPolygon') {
                      paths = geom.coordinates.map(poly => toPath(poly[0]))
                    }
                    return paths.map((d, pi) => (
                      <path key={`${fi}-${pi}`} d={d}
                        fill={isVisited ? (vCount === cities.length ? '#22c55e' : '#4ade80') : 'rgba(255,255,255,.08)'}
                        stroke={isVisited ? '#16a34a' : 'rgba(255,255,255,.12)'}
                        strokeWidth={isVisited ? '0.4' : '0.15'}
                        opacity={isVisited ? 0.85 : 0.6}
                      />
                    ))
                  })}

                </svg>
              </div>

              {/* 대륙별 목록 */}
              {(() => {
                const continents = {}
                Object.entries(COUNTRY_CITIES).forEach(([country, cities]) => {
                  const cont = COUNTRY_INFO[country]?.continent || (lang==='ko'?'기타':'Other')
                  if (!continents[cont]) continents[cont] = []
                  const vc = cities.filter(c => (visited.cities||[]).includes(c.name))
                  if (vc.length > 0) continents[cont].push({ country, cities, visitedCities: vc })
                })
                const contNameMap = {'아시아':{en:'Asia',ja:'アジア',zh:'亚洲'},'유럽':{en:'Europe',ja:'ヨーロッパ',zh:'欧洲'},'북아메리카':{en:'North America',ja:'北米',zh:'北美'},'남아메리카':{en:'South America',ja:'南米',zh:'南美'},'아프리카':{en:'Africa',ja:'アフリカ',zh:'非洲'},'오세아니아':{en:'Oceania',ja:'オセアニア',zh:'大洋洲'}}
                const getContName = (k) => lang==='ko' ? k : (contNameMap[k]?.[lang] || k)
                const order = ['아시아','유럽','북아메리카','남아메리카','아프리카','오세아니아','기타']
                const active = order.filter(c => continents[c]?.length > 0)

                if (active.length === 0) return (
                  <div style={{textAlign:'center',padding:'40px 0',color:'#64748b'}}>
                    <div style={{fontSize:32,marginBottom:12}}>✈️</div>
                    <div style={{fontSize:14,fontWeight:600}}>{t('visitedEmpty')}</div>
                    <div style={{fontSize:12,marginTop:6,color:'#475569'}}>{lang==='ko'?'도시 패널에서 방문 체크를 해보세요!':'Mark visited cities in the city panel!'}</div>
                  </div>
                )
                return active.map(cont => {
                  const items = continents[cont]
                  const isExp = visitedExpandContinent === cont
                  const tc = items.reduce((a,x)=>a+x.visitedCities.length,0)
                  return (
                    <div key={cont} style={{marginBottom:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,cursor:'pointer',background:isExp?'rgba(200,133,106,.1)':'rgba(255,255,255,.03)',border:`1px solid ${isExp?'rgba(200,133,106,.2)':'rgba(255,255,255,.06)'}`,transition:'all .15s'}}
                        onClick={()=>setVisitedExpandContinent(isExp?null:cont)}>
                        <span style={{fontSize:12,fontWeight:700,color:'#c8856a',width:20}}>{isExp?'▾':'▸'}</span>
                        <span style={{fontSize:14,fontWeight:700,color:'white',flex:1}}>{getContName(cont)}</span>
                        <span style={{fontSize:11,color:'#64748b'}}>{items.length}{lang==='ko'?'개국':' countries'} · {tc}{lang==='ko'?'개 도시':' cities'}</span>
                      </div>
                      {isExp && (
                        <div style={{padding:'8px 0 4px 32px'}}>
                          {items.map(({country, visitedCities}) => (
                            <div key={country} style={{marginBottom:6}}>
                              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                                {getFlagImg(COUNTRY_INFO[country]?.emoji) ? (
                                  <img src={getFlagImg(COUNTRY_INFO[country]?.emoji)} alt="" style={{width:18,height:13,objectFit:'cover',borderRadius:2,border:'1px solid rgba(255,255,255,.15)'}}/>
                                ) : <span style={{fontSize:14}}>{COUNTRY_INFO[country]?.emoji||'🏳️'}</span>}
                                <span style={{fontSize:13,fontWeight:600,color:'#e2e8f0'}}>{getCountryName(country)}</span>
                                <span style={{fontSize:10,color:'#64748b'}}>({visitedCities.length})</span>
                              </div>
                              {visitedCities.map(city => {
                                const cs = visited.spots?.[city.name] || []
                                const isO = visitedExpandCity === city.name
                                return (
                                  <div key={city.name} style={{paddingLeft:24,marginBottom:2}}>
                                    <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 8px',borderRadius:6,cursor:'pointer',transition:'background .1s'}}
                                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}
                                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                                      onClick={()=>setVisitedExpandCity(isO?null:city.name)}>
                                      <span style={{fontSize:10,color:'#22c55e'}}>✓</span>
                                      <span style={{fontSize:12,fontWeight:500,color:'#cbd5e1'}}>{getCityName(city.name)}</span>
                                      {cs.length > 0 && <span style={{fontSize:9,color:'#64748b'}}>· {cs.length}{lang==='ko'?'곳':''}</span>}
                                      {cs.length > 0 && <span style={{fontSize:8,color:'#475569'}}>{isO?'▾':'▸'}</span>}
                                    </div>
                                    {isO && cs.length > 0 && (
                                      <div style={{paddingLeft:26,paddingBottom:4}}>
                                        {cs.map((sp,j)=>(
                                          <div key={j} style={{fontSize:11,color:'#94a3b8',padding:'2px 0',display:'flex',alignItems:'center',gap:5}}>
                                            <span style={{color:'#22c55e',fontSize:8}}>●</span>
                                            {trSpot(city.name, sp)?.name || sp}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </>
      )}

      {/* Travel Feed Modal (Phase 1.5 - Fullscreen Modern Light) */}
      {showFeed && (() => {
        // 인기 여행기 (좋아요 많은 순 5개)
        const trendingJournals = [...feedJournals].sort((a,b) => (b.likeCount||0) - (a.likeCount||0)).slice(0, 5)
        // 인기 도시 (모든 여행기 cities 빈도 집계)
        const cityFreq = {}
        feedJournals.forEach(j => (j.cities||[]).forEach(c => {
          if (c.name) cityFreq[c.name] = (cityFreq[c.name]||0) + 1
        }))
        const popularCities = Object.entries(cityFreq).sort((a,b) => b[1]-a[1]).slice(0, 12).map(([name, count]) => ({ name, count }))

        return (
        <div style={{
          position:'fixed',inset:0,zIndex:3000,background:'#ffffff',
          display:'flex',flexDirection:'column',
          animation:'feedSlideUp .28s cubic-bezier(.22,.9,.32,1)',
        }}>
          <style>{`
            @keyframes feedSlideUp {
              from { transform: translateY(100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes feedFadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .feed-card { transition: all .2s cubic-bezier(.22,.9,.32,1); }
            .feed-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,.08); }
            .feed-trend-card { transition: transform .2s; }
            .feed-trend-card:hover { transform: scale(1.02); }
            .feed-city-chip { transition: all .15s; }
            .feed-city-chip:hover { transform: scale(1.06); }
            .feed-fab { transition: all .2s; }
            .feed-fab:hover { transform: scale(1.08); box-shadow: 0 12px 32px rgba(236,72,153,.45); }
            .feed-header-shadow { box-shadow: 0 1px 0 rgba(0,0,0,.04); }
            .feed-section-scroll::-webkit-scrollbar { height: 6px; }
            .feed-section-scroll::-webkit-scrollbar-track { background: transparent; }
            .feed-section-scroll::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 3px; }
          `}</style>

          {/* Header */}
          <div className="feed-header-shadow" style={{
            position:'sticky',top:0,zIndex:10,background:'rgba(255,255,255,.92)',backdropFilter:'blur(12px)',
            padding:isMobile?'12px 14px':'14px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,
            paddingTop: isMobile ? 'calc(12px + env(safe-area-inset-top))' : '14px',
          }}>
            <button onClick={()=>setShowFeed(false)} style={{
              background:'transparent',border:'none',width:36,height:36,borderRadius:10,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',color:'#262626',fontSize:22,
            }}>←</button>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:isMobile?17:20,fontWeight:800,color:'#262626',letterSpacing:-0.4,fontFamily:'system-ui,-apple-system,sans-serif'}}>Travel Feed</span>
              <span style={{fontSize:11,color:'#a3a3a3',fontWeight:500,marginLeft:2}}>by ATLAS</span>
            </div>
            <div style={{width:36}}></div>
          </div>

          {/* Main Tabs */}
          <div style={{display:'flex',borderBottom:'1px solid #f0f0f0',flexShrink:0,background:'#ffffff',position:'sticky',top:isMobile?60:62,zIndex:9}}>
            {[{k:'journals',label:t('feedTabJournals'),icon:'📔'},{k:'courses',label:t('feedTabCourses'),icon:'🗺️'}].map(tab => (
              <button key={tab.k} onClick={()=>setFeedMainTab(tab.k)}
                style={{flex:1,padding:isMobile?'13px 0':'15px 0',background:'transparent',border:'none',
                  borderBottom:feedMainTab===tab.k?'2.5px solid #262626':'2.5px solid transparent',
                  cursor:'pointer',fontSize:isMobile?13:14,fontWeight:feedMainTab===tab.k?700:500,
                  color:feedMainTab===tab.k?'#262626':'#a3a3a3',transition:'all .15s'}}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="feed-section-scroll" style={{flex:1,overflowY:'auto',background:'#ffffff'}}>
            {feedMainTab === 'journals' ? (
              feedJournalsLoading ? (
                <div style={{textAlign:'center',padding:'80px 0',color:'#a3a3a3',fontSize:14}}>{lang==='ko'?'불러오는 중...':'Loading...'}</div>
              ) : feedJournals.length === 0 ? (
                <div style={{textAlign:'center',padding:'100px 20px',animation:'feedFadeIn .4s'}}>
                  <div style={{fontSize:64,marginBottom:18}}>📔</div>
                  <div style={{color:'#262626',fontSize:16,fontWeight:700,marginBottom:6}}>{t('feedEmpty')}</div>
                  <div style={{color:'#a3a3a3',fontSize:13}}>{t('feedEmptyHint')}</div>
                </div>
              ) : (
                <>
                  {/* Section 1: 이번 주 인기 여행기 (가로 슬라이더) */}
                  {trendingJournals.length > 0 && (
                    <div style={{padding:isMobile?'18px 0 14px':'24px 0 18px',animation:'feedFadeIn .3s'}}>
                      <div style={{padding:isMobile?'0 16px':'0 22px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div>
                          <div style={{fontSize:isMobile?16:18,fontWeight:800,color:'#262626',letterSpacing:-0.3}}>✨ {lang==='ko'?'이번 주 인기 여행기':lang==='ja'?'今週の人気旅行記':lang==='zh'?'本周热门游记':'Trending This Week'}</div>
                          <div style={{fontSize:11,color:'#a3a3a3',marginTop:3}}>{lang==='ko'?'좋아요가 많은 여행기':'Most loved journals'}</div>
                        </div>
                      </div>
                      <div className="feed-section-scroll" style={{display:'flex',gap:12,overflowX:'auto',padding:isMobile?'0 16px 8px':'0 22px 8px',scrollSnapType:'x mandatory'}}>
                        {trendingJournals.map(j => {
                          const cityNames = (j.cities||[]).map(c=>getCityName(c.name)).join(' · ')
                          return (
                            <div key={j.id} className="feed-trend-card" onClick={()=>setViewingJournal(j)}
                              style={{minWidth:isMobile?260:300,maxWidth:isMobile?260:300,height:isMobile?320:360,borderRadius:18,overflow:'hidden',cursor:'pointer',position:'relative',scrollSnapAlign:'start',background:'#1f1f1f',flexShrink:0}}>
                              {(j.photos||[]).length > 0 ? (
                                <img src={j.photos[0]} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                              ) : (
                                <div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#f59e0b,#ec4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48}}>📔</div>
                              )}
                              <div style={{position:'absolute',inset:0,background:'linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.2) 50%, transparent 100%)'}}></div>
                              <div style={{position:'absolute',top:12,left:12,background:'rgba(255,255,255,.95)',color:'#262626',padding:'4px 10px',borderRadius:14,fontSize:10,fontWeight:700,display:'flex',alignItems:'center',gap:4}}>
                                ❤️ {j.likeCount||0}
                              </div>
                              <div style={{position:'absolute',bottom:0,left:0,right:0,padding:isMobile?'14px 16px':'18px 20px',color:'white'}}>
                                {cityNames && <div style={{fontSize:11,opacity:.85,marginBottom:6,fontWeight:600}}>📍 {cityNames}</div>}
                                <div style={{fontSize:isMobile?17:19,fontWeight:800,marginBottom:6,lineHeight:1.25,letterSpacing:-0.3,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{j.title || t('journalNoTitle')}</div>
                                <div style={{display:'flex',alignItems:'center',gap:8,fontSize:11,opacity:.9}}>
                                  <div style={{width:22,height:22,borderRadius:'50%',background:'linear-gradient(135deg,#f59e0b,#ec4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800}}>{(j.userName||'?')[0]?.toUpperCase()}</div>
                                  <span style={{fontWeight:600}}>{j.userName}</span>
                                  <span>·</span>
                                  <span>{j.days}{t('journalDaysSeparator')}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Section 2: 인기 도시 (원형 칩 슬라이더) */}
                  {popularCities.length > 0 && (
                    <div style={{padding:isMobile?'8px 0 18px':'10px 0 24px',borderTop:'1px solid #f5f5f5',marginTop:6,animation:'feedFadeIn .35s'}}>
                      <div style={{padding:isMobile?'14px 16px 12px':'18px 22px 14px'}}>
                        <div style={{fontSize:isMobile?16:18,fontWeight:800,color:'#262626',letterSpacing:-0.3}}>🔥 {lang==='ko'?'지금 인기 도시':lang==='ja'?'今人気の都市':lang==='zh'?'当前热门城市':'Popular Cities'}</div>
                        <div style={{fontSize:11,color:'#a3a3a3',marginTop:3}}>{lang==='ko'?'여행자들이 가장 많이 다녀온 곳':'Most visited by travelers'}</div>
                      </div>
                      <div className="feed-section-scroll" style={{display:'flex',gap:14,overflowX:'auto',padding:isMobile?'0 16px 6px':'0 22px 6px'}}>
                        {popularCities.map((c, i) => {
                          const grad = ['linear-gradient(135deg,#f59e0b,#ec4899)','linear-gradient(135deg,#3b82f6,#8b5cf6)','linear-gradient(135deg,#10b981,#3b82f6)','linear-gradient(135deg,#ef4444,#f59e0b)','linear-gradient(135deg,#8b5cf6,#ec4899)','linear-gradient(135deg,#06b6d4,#3b82f6)'][i % 6]
                          return (
                            <div key={c.name} className="feed-city-chip" onClick={()=>{
                              setShowFeed(false)
                              const entry = Object.entries(COUNTRY_CITIES).find(([_,cs])=>cs.some(x=>x.name===c.name))
                              if (entry) { setSelectedCountry(entry[0]); setSelectedCity(c.name) }
                            }} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,cursor:'pointer',minWidth:64,flexShrink:0}}>
                              <div style={{width:isMobile?60:64,height:isMobile?60:64,borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:22,fontWeight:800,boxShadow:'0 4px 12px rgba(0,0,0,.08)'}}>
                                {getCityName(c.name)[0]}
                              </div>
                              <div style={{fontSize:11,fontWeight:700,color:'#262626',textAlign:'center',maxWidth:70,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{getCityName(c.name)}</div>
                              <div style={{fontSize:9,color:'#a3a3a3'}}>{c.count} {lang==='ko'?'편':'posts'}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Section 3: 최신 여행기 (그리드) */}
                  <div style={{padding:isMobile?'14px 0 80px':'18px 0 100px',borderTop:'1px solid #f5f5f5',animation:'feedFadeIn .4s'}}>
                    <div style={{padding:isMobile?'0 16px 14px':'0 22px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div style={{fontSize:isMobile?16:18,fontWeight:800,color:'#262626',letterSpacing:-0.3}}>📔 {lang==='ko'?'최신 여행기':lang==='ja'?'最新の旅行記':lang==='zh'?'最新游记':'Latest Journals'}</div>
                      <div style={{display:'flex',gap:6}}>
                        {[{k:'all',label:t('feedTabAll')},{k:'mine',label:t('feedTabMine')}].map(st => (
                          <button key={st.k} onClick={async()=>{
                            setFeedSubTab(st.k);setFeedJournalsLoading(true)
                            try {
                              const opts = st.k==='mine' && currentUser ? { byUid: currentUser.uid, limitN: 30 } : { limitN: 30 }
                              const data = await loadJournals(opts)
                              setFeedJournals(data)
                            } catch(e) { console.error(e) }
                            setFeedJournalsLoading(false)
                          }} style={{padding:'5px 12px',borderRadius:14,border:'none',background:feedSubTab===st.k?'#262626':'#f5f5f5',color:feedSubTab===st.k?'white':'#737373',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:12,padding:isMobile?'0 16px':'0 22px'}}>
                      {feedJournals.map(j => {
                        const liked = currentUser && (j.likes||[]).includes(currentUser.uid)
                        const cityNames = (j.cities||[]).map(c=>getCityName(c.name)).join(' · ')
                        return (
                          <div key={j.id} className="feed-card" onClick={()=>setViewingJournal(j)}
                            style={{borderRadius:14,background:'white',overflow:'hidden',cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,.04)',border:'1px solid #f0f0f0'}}>
                            {(j.photos||[]).length > 0 && (
                              <div style={{width:'100%',aspectRatio:'1',background:'#f5f5f5',overflow:'hidden'}}>
                                <img src={j.photos[0]} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                              </div>
                            )}
                            <div style={{padding:'12px 14px'}}>
                              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                                <div style={{width:22,height:22,borderRadius:'50%',background:'linear-gradient(135deg,#f59e0b,#ec4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'white'}}>{(j.userName||'?')[0]?.toUpperCase()}</div>
                                <span style={{fontSize:11,color:'#525252',fontWeight:600}}>{j.userName}</span>
                                {j.rating > 0 && <span style={{fontSize:10,color:'#f59e0b',fontWeight:700,marginLeft:'auto'}}>★ {j.rating}</span>}
                              </div>
                              <div style={{fontSize:14,fontWeight:700,color:'#262626',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:-0.2}}>{j.title || t('journalNoTitle')}</div>
                              {cityNames && <div style={{fontSize:11,color:'#737373',marginBottom:6,fontWeight:500}}>📍 {cityNames}</div>}
                              <div style={{fontSize:11,color:'#737373',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{j.body}</div>
                              <div style={{display:'flex',alignItems:'center',gap:14,marginTop:10,paddingTop:8,borderTop:'1px solid #f5f5f5'}}>
                                <span style={{fontSize:11,color:liked?'#ec4899':'#a3a3a3',display:'flex',alignItems:'center',gap:3,fontWeight:600}}>{liked?'❤️':'🤍'} {j.likeCount||0}</span>
                                <span style={{fontSize:11,color:'#a3a3a3',display:'flex',alignItems:'center',gap:3}}>💬 {j.commentCount||0}</span>
                                <span style={{fontSize:10,color:'#d4d4d4',marginLeft:'auto'}}>{j.createdAt?new Date(j.createdAt).toLocaleDateString():''}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )
            ) : (
              /* 코스 탭 */
              communityCoursesData.length === 0 ? (
                <div style={{textAlign:'center',padding:'100px 20px',animation:'feedFadeIn .4s'}}>
                  <div style={{fontSize:64,marginBottom:18}}>🗺️</div>
                  <div style={{color:'#262626',fontSize:16,fontWeight:700,marginBottom:6}}>{t('communityEmpty')}</div>
                  <div style={{color:'#a3a3a3',fontSize:13}}>{t('communityEmptyHint')}</div>
                </div>
              ) : (
                <div style={{padding:isMobile?'16px 16px 80px':'20px 22px 100px',display:'flex',flexDirection:'column',gap:14,animation:'feedFadeIn .3s'}}>
                  {communityCoursesData.map((sc,idx) => {
                    const days = sc.course?.days || sc.days || []
                    const cities = [...new Set(days.flatMap(d=>(d.items||[]).map(it=>it.cityI18n?.[lang] || getCityName(it.cityName||it.name))).filter(Boolean))]
                    const totalPlaces = days.reduce((a,d)=>a+(d.items||[]).length,0)
                    const photos = sc.photos || []
                    const dateStr = sc.createdAt ? new Date(sc.createdAt).toLocaleDateString() : ''
                    return (
                      <div key={sc.id||idx} className="feed-card" style={{borderRadius:14,border:'1px solid #f0f0f0',background:'white',overflow:'hidden',padding:'14px 16px'}}>
                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                          <div>
                            <div style={{fontSize:15,fontWeight:800,color:'#262626',letterSpacing:-0.2}}>{cities.join(' · ') || 'Course'}</div>
                            <div style={{fontSize:11,color:'#737373',marginTop:3}}>
                              {totalPlaces}{t('communityPlaces')} · {days.length}{t('communityDays')}
                              {(sc.course?.type||sc.type)==='ai' && <span style={{marginLeft:6,padding:'1px 6px',borderRadius:4,background:'linear-gradient(135deg,#f3e8ff,#fce7f3)',color:'#7c3aed',fontSize:9,fontWeight:700}}>AI</span>}
                            </div>
                          </div>
                          <span style={{fontSize:10,color:'#a3a3a3'}}>{sc.userName||'?'} · {dateStr}</span>
                        </div>
                        {photos.length > 0 && (
                          <div className="feed-section-scroll" style={{display:'flex',gap:6,marginBottom:10,overflowX:'auto',paddingBottom:2}}>
                            {photos.map((url,i)=>(
                              <img key={i} src={url} style={{width:90,height:64,borderRadius:8,objectFit:'cover',flexShrink:0,border:'1px solid #f0f0f0'}} alt="" />
                            ))}
                          </div>
                        )}
                        <div style={{display:'flex',justifyContent:'flex-end'}}>
                          <button onClick={()=>{
                            setCourseDays(days);localStorage.setItem('atlas_course_days',JSON.stringify(days))
                            const flat=days.flatMap(d=>d.items||[]);saveCourse(flat)
                            setCourseTransport(sc.course?.transport||sc.transport||'transit')
                            setActiveDayTab(0);setShowCoursePlanner(true);setShowFeed(false)
                            setCourseSource(sc.course?.type||sc.type||'manual')
                          }} style={{background:'linear-gradient(135deg,#f59e0b,#ec4899)',border:'none',color:'white',padding:'8px 18px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                            {t('communityLoad')}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>

          {/* Floating Action Button (여행기 작성) */}
          {feedMainTab === 'journals' && (
            <button className="feed-fab" onClick={()=>{
              if (!currentUser) { setShowLoginModal(true); return }
              setEditingJournal(null)
              setJournalForm({ title:'', body:'', cities:[], days:1, rating:0, visibility:'public', photos:[] })
              setJournalNewPhotos([])
              setShowJournalEditor(true)
            }} style={{
              position:'fixed',bottom:isMobile?'calc(20px + env(safe-area-inset-bottom))':28,right:isMobile?20:32,zIndex:11,
              width:isMobile?56:60,height:isMobile?56:60,borderRadius:'50%',
              background:'linear-gradient(135deg,#f59e0b,#ec4899)',border:'none',color:'white',
              fontSize:24,cursor:'pointer',boxShadow:'0 8px 24px rgba(236,72,153,.35)',
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>✏️</button>
          )}
        </div>
        )
      })()}

      {/* Journal Editor Modal (작성/수정) */}
      {showJournalEditor && (
        <>
          <div onClick={()=>{setShowJournalEditor(false);setEditingJournal(null)}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:3100}} />
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:3101,width:isMobile?'96vw':560,height:isMobile?'92vh':'88vh',background:'white',borderRadius:isMobile?16:20,boxShadow:'0 24px 64px rgba(0,0,0,.35)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            {/* Header */}
            <div style={{padding:isMobile?'14px 16px':'16px 22px',borderBottom:'1.5px solid #e2e8f0',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:'white'}}>
              <button onClick={()=>{setShowJournalEditor(false);setEditingJournal(null)}} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#64748b'}}>←</button>
              <span style={{fontSize:isMobile?14:16,fontWeight:800,color:'#0f172a'}}>{editingJournal ? t('journalEdit') : t('journalNew')}</span>
              <button disabled={journalSaving} onClick={async()=>{
                if (!journalForm.title.trim()) { alert(t('journalRequiredTitle')); return }
                if (!journalForm.body.trim()) { alert(t('journalRequiredBody')); return }
                if (!currentUser) { alert(lang==='ko'?'로그인이 필요합니다':'Login required'); return }
                setJournalSaving(true)
                try {
                  // 사진 업로드
                  let photoUrls = [...(journalForm.photos||[])]
                  for (const f of journalNewPhotos) {
                    const url = await uploadJournalPhoto(f, currentUser.uid, editingJournal?.id || 'new')
                    photoUrls.push(url)
                  }
                  if (editingJournal) {
                    await updateJournal(editingJournal.id, { ...journalForm, photos: photoUrls })
                  } else {
                    await createJournal(currentUser.uid, { ...journalForm, photos: photoUrls }, currentUser.displayName||currentUser.email, currentUser.photoURL)
                  }
                  alert(t('journalSaved'))
                  setShowJournalEditor(false);setEditingJournal(null);setJournalNewPhotos([])
                  // 피드 새로고침
                  setFeedJournalsLoading(true)
                  const fresh = await loadJournals({ limitN: 30, ...(feedSubTab==='mine'&&currentUser?{byUid:currentUser.uid}:{}) })
                  setFeedJournals(fresh);setFeedJournalsLoading(false)
                } catch(e) { alert(e.message) }
                setJournalSaving(false)
              }} style={{background:'linear-gradient(135deg,#2563eb,#7c3aed)',border:'none',color:'white',padding:'7px 16px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',opacity:journalSaving?.6:1}}>
                {journalSaving ? t('uploading') : t('journalSave')}
              </button>
            </div>

            {/* Form Body */}
            <div style={{flex:1,overflowY:'auto',padding:'16px 18px'}}>
              {/* Title */}
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:6}}>{t('journalTitle')}</label>
                <input value={journalForm.title} onChange={e=>setJournalForm({...journalForm,title:e.target.value})}
                  placeholder={t('journalTitlePh')} maxLength={60}
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:14,outline:'none',boxSizing:'border-box'}} />
              </div>

              {/* Cities */}
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:6}}>{t('journalCities')}</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:6}}>
                  {(journalForm.cities||[]).map((c,i) => (
                    <span key={i} style={{padding:'5px 10px',borderRadius:14,background:'#3b82f6',color:'white',fontSize:11,fontWeight:600,display:'flex',alignItems:'center',gap:5}}>
                      {getCityName(c.name)}
                      <button onClick={()=>setJournalForm({...journalForm,cities:journalForm.cities.filter((_,idx)=>idx!==i)})} style={{background:'rgba(255,255,255,.3)',border:'none',color:'white',width:14,height:14,borderRadius:'50%',fontSize:9,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                    </span>
                  ))}
                  <button onClick={()=>{setJournalCitySelectOpen(true);setJournalCitySearchQ('')}}
                    style={{padding:'5px 12px',borderRadius:14,background:'#f1f5f9',border:'1px dashed #cbd5e1',color:'#3b82f6',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                    {t('journalCityAdd')}
                  </button>
                </div>
                {journalCitySelectOpen && (
                  <div style={{padding:10,background:'#f8fafc',borderRadius:10,border:'1px solid #e2e8f0',marginTop:6}}>
                    <input autoFocus value={journalCitySearchQ} onChange={e=>setJournalCitySearchQ(e.target.value)}
                      placeholder={t('journalSelectCity')}
                      style={{width:'100%',padding:'8px 12px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:13,outline:'none',boxSizing:'border-box',marginBottom:8}} />
                    <div style={{maxHeight:160,overflowY:'auto'}}>
                      {(()=>{
                        const q = journalCitySearchQ.trim().toLowerCase()
                        if (!q) return <div style={{fontSize:11,color:'#94a3b8',textAlign:'center',padding:'8px 0'}}>{lang==='ko'?'도시 이름을 입력하세요':'Type city name'}</div>
                        const matches = []
                        for (const [country, cs] of Object.entries(COUNTRY_CITIES)) {
                          for (const c of (cs||[])) {
                            const ko = c.name; const local = getCityName(ko)
                            if (ko.toLowerCase().includes(q) || local.toLowerCase().includes(q)) {
                              if (!journalForm.cities.find(x=>x.name===ko)) matches.push({name:ko,country,display:local})
                              if (matches.length >= 12) break
                            }
                          }
                          if (matches.length >= 12) break
                        }
                        if (matches.length === 0) return <div style={{fontSize:11,color:'#94a3b8',textAlign:'center',padding:'8px 0'}}>{lang==='ko'?'결과가 없습니다':'No matches'}</div>
                        return matches.map((m,i) => (
                          <div key={i} onClick={()=>{
                            setJournalForm({...journalForm,cities:[...(journalForm.cities||[]),{name:m.name,country:m.country}]})
                            setJournalCitySelectOpen(false);setJournalCitySearchQ('')
                          }} style={{padding:'8px 10px',borderRadius:6,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12}}
                            onMouseEnter={e=>e.currentTarget.style.background='#e0e7ff'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <span style={{color:'#0f172a',fontWeight:600}}>{m.display}</span>
                            <span style={{color:'#94a3b8',fontSize:10}}>{getCountryName(m.country)}</span>
                          </div>
                        ))
                      })()}
                    </div>
                    <button onClick={()=>setJournalCitySelectOpen(false)} style={{width:'100%',marginTop:8,padding:6,borderRadius:6,border:'1px solid #e2e8f0',background:'white',fontSize:11,color:'#64748b',cursor:'pointer'}}>{t('shareCancel')}</button>
                  </div>
                )}
              </div>

              {/* Days + Rating */}
              <div style={{display:'flex',gap:12,marginBottom:16}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:6}}>{t('journalDays')}</label>
                  <select value={journalForm.days} onChange={e=>setJournalForm({...journalForm,days:Number(e.target.value)})}
                    style={{width:'100%',padding:'9px 10px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:13,outline:'none',background:'white'}}>
                    {[1,2,3,4,5,6,7,8,10,14,21,30].map(n => (
                      <option key={n} value={n}>{n>1?(n-1)+t('journalDaysUnit')+n+t('journalDaysSeparator'):n+t('journalDaysSeparator')}</option>
                    ))}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:6}}>{t('journalRating')}</label>
                  <div style={{display:'flex',gap:3,padding:'8px 4px'}}>
                    {[1,2,3,4,5].map(n => (
                      <span key={n} onClick={()=>setJournalForm({...journalForm,rating:n})}
                        style={{fontSize:22,cursor:'pointer',color:journalForm.rating>=n?'#f59e0b':'#cbd5e1',transition:'all .1s',userSelect:'none'}}>★</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:6}}>{t('journalPhotos')}</label>
                <input type="file" accept="image/*" multiple onChange={e=>{
                  const files = [...e.target.files]
                  const total = (journalForm.photos?.length||0) + journalNewPhotos.length + files.length
                  if (total > 10) { alert(lang==='ko'?'최대 10장까지':'Max 10 photos'); return }
                  setJournalNewPhotos([...journalNewPhotos, ...files])
                }} style={{fontSize:11,color:'#64748b'}} />
                {(journalForm.photos?.length > 0 || journalNewPhotos.length > 0) && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                    {(journalForm.photos||[]).map((url,i)=>(
                      <div key={'old-'+i} style={{position:'relative',width:60,height:60,borderRadius:8,overflow:'hidden',border:'1px solid #e2e8f0'}}>
                        <img src={url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" />
                        <button onClick={()=>setJournalForm({...journalForm,photos:journalForm.photos.filter((_,idx)=>idx!==i)})}
                          style={{position:'absolute',top:2,right:2,width:18,height:18,borderRadius:'50%',background:'rgba(0,0,0,.6)',border:'none',color:'white',fontSize:10,cursor:'pointer'}}>✕</button>
                      </div>
                    ))}
                    {journalNewPhotos.map((f,i)=>(
                      <div key={'new-'+i} style={{position:'relative',width:60,height:60,borderRadius:8,overflow:'hidden',border:'1px solid #e2e8f0'}}>
                        <img src={URL.createObjectURL(f)} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" />
                        <button onClick={()=>setJournalNewPhotos(journalNewPhotos.filter((_,idx)=>idx!==i))}
                          style={{position:'absolute',top:2,right:2,width:18,height:18,borderRadius:'50%',background:'rgba(0,0,0,.6)',border:'none',color:'white',fontSize:10,cursor:'pointer'}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:6}}>{t('journalBody')}</label>
                <textarea value={journalForm.body} onChange={e=>setJournalForm({...journalForm,body:e.target.value})}
                  placeholder={t('journalBodyPh')} rows={8}
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:13,outline:'none',boxSizing:'border-box',resize:'vertical',fontFamily:'inherit',lineHeight:1.6}} />
              </div>

              {/* Visibility */}
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:6}}>{t('journalVisibility')}</label>
                <div style={{display:'flex',gap:6}}>
                  {[{k:'public',label:t('visPublic'),icon:'🌐'},{k:'private',label:t('visPrivate'),icon:'🔒'}].map(v => (
                    <button key={v.k} onClick={()=>setJournalForm({...journalForm,visibility:v.k})}
                      style={{flex:1,padding:'9px',borderRadius:9,border:journalForm.visibility===v.k?'1.5px solid #3b82f6':'1.5px solid #e2e8f0',background:journalForm.visibility===v.k?'#eff6ff':'white',color:journalForm.visibility===v.k?'#1e40af':'#64748b',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                      {v.icon} {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Journal Detail Modal (상세 보기) */}
      {viewingJournal && (
        <>
          <div onClick={()=>setViewingJournal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:3050}} />
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:3051,width:isMobile?'96vw':580,height:isMobile?'94vh':'90vh',background:'white',borderRadius:isMobile?16:20,boxShadow:'0 24px 64px rgba(0,0,0,.4)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            {/* Header */}
            <div style={{padding:isMobile?'14px 16px':'16px 22px',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <button onClick={()=>setViewingJournal(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#64748b'}}>←</button>
              <span style={{fontSize:13,color:'#64748b',fontWeight:600}}>{viewingJournal.userName}</span>
              {currentUser && viewingJournal.uid === currentUser.uid ? (
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>{
                    setEditingJournal(viewingJournal)
                    setJournalForm({
                      title: viewingJournal.title||'', body: viewingJournal.body||'',
                      cities: viewingJournal.cities||[], days: viewingJournal.days||1,
                      rating: viewingJournal.rating||0, visibility: viewingJournal.visibility||'public',
                      photos: viewingJournal.photos||[]
                    })
                    setJournalNewPhotos([]);setShowJournalEditor(true);setViewingJournal(null)
                  }} style={{background:'#f1f5f9',border:'none',color:'#475569',padding:'5px 10px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer'}}>✏️</button>
                  <button onClick={async()=>{
                    if (confirm(t('journalDeleteConfirm'))) {
                      await deleteJournal(viewingJournal.id)
                      setFeedJournals(feedJournals.filter(j=>j.id!==viewingJournal.id))
                      setViewingJournal(null)
                    }
                  }} style={{background:'#fef2f2',border:'none',color:'#ef4444',padding:'5px 10px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer'}}>🗑</button>
                </div>
              ) : <div style={{width:30}} />}
            </div>

            {/* Body */}
            <div style={{flex:1,overflowY:'auto',padding:'18px 22px'}}>
              {/* Title */}
              <div style={{fontSize:isMobile?20:24,fontWeight:800,color:'#0f172a',marginBottom:10,lineHeight:1.3}}>{viewingJournal.title || t('journalNoTitle')}</div>

              {/* Meta */}
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,flexWrap:'wrap'}}>
                {(viewingJournal.cities||[]).length > 0 && (
                  <span style={{fontSize:12,color:'#3b82f6',fontWeight:600}}>📍 {(viewingJournal.cities||[]).map(c=>getCityName(c.name)).join(' · ')}</span>
                )}
                <span style={{fontSize:11,color:'#94a3b8'}}>·</span>
                <span style={{fontSize:11,color:'#64748b'}}>{viewingJournal.days}{t('journalDaysSeparator')}</span>
                {viewingJournal.rating > 0 && (
                  <>
                    <span style={{fontSize:11,color:'#94a3b8'}}>·</span>
                    <span style={{fontSize:11,color:'#f59e0b',fontWeight:700}}>{'★'.repeat(Math.floor(viewingJournal.rating))} {viewingJournal.rating}</span>
                  </>
                )}
                <span style={{fontSize:11,color:'#94a3b8',marginLeft:'auto'}}>{viewingJournal.createdAt?new Date(viewingJournal.createdAt).toLocaleDateString():''}</span>
              </div>

              {/* Photos */}
              {(viewingJournal.photos||[]).length > 0 && (
                <div style={{marginBottom:18}}>
                  <img src={viewingJournal.photos[0]} style={{width:'100%',borderRadius:12,marginBottom:8,maxHeight:isMobile?280:380,objectFit:'cover'}} alt="" />
                  {viewingJournal.photos.length > 1 && (
                    <div style={{display:'flex',gap:6,overflowX:'auto'}}>
                      {viewingJournal.photos.slice(1).map((url,i)=>(
                        <img key={i} src={url} onClick={()=>window.open(url,'_blank')}
                          style={{width:90,height:70,objectFit:'cover',borderRadius:8,cursor:'pointer',flexShrink:0,border:'1px solid #e2e8f0'}} alt="" />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Body */}
              <div style={{fontSize:14,color:'#334155',lineHeight:1.75,whiteSpace:'pre-wrap',marginBottom:20}}>{viewingJournal.body}</div>

              {/* Like button */}
              <div style={{display:'flex',alignItems:'center',gap:14,paddingTop:14,borderTop:'1px solid #e2e8f0',marginBottom:18}}>
                <button onClick={async()=>{
                  if (!currentUser) { setShowLoginModal(true); return }
                  const result = await toggleJournalLike(viewingJournal.id, currentUser.uid)
                  setViewingJournal({...viewingJournal, likes:result.likes, likeCount:result.likeCount})
                  setFeedJournals(feedJournals.map(j => j.id===viewingJournal.id ? {...j,likes:result.likes,likeCount:result.likeCount} : j))
                }} style={{background:'transparent',border:'none',display:'flex',alignItems:'center',gap:5,cursor:'pointer',fontSize:14,color:(currentUser&&(viewingJournal.likes||[]).includes(currentUser.uid))?'#ef4444':'#64748b',fontWeight:700}}>
                  {currentUser && (viewingJournal.likes||[]).includes(currentUser.uid) ? '❤️' : '🤍'} {viewingJournal.likeCount||0}
                </button>
                <span style={{fontSize:14,color:'#64748b',fontWeight:700,display:'flex',alignItems:'center',gap:5}}>💬 {(viewingJournal.comments||[]).length}</span>
              </div>

              {/* Comments */}
              <div>
                {(viewingJournal.comments||[]).length === 0 && <div style={{fontSize:12,color:'#94a3b8',textAlign:'center',padding:'10px 0'}}>{lang==='ko'?'아직 댓글이 없습니다':'No comments yet'}</div>}
                {(viewingJournal.comments||[]).map((cm,ci) => (
                  <div key={cm.id||ci} style={{display:'flex',gap:10,marginBottom:12}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'white',flexShrink:0}}>{(cm.userName||'?')[0]?.toUpperCase()}</div>
                    <div style={{flex:1,background:'#f8fafc',padding:'8px 12px',borderRadius:10}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                        <span style={{fontSize:11,fontWeight:700,color:'#1e293b'}}>{cm.userName}</span>
                        <span style={{fontSize:10,color:'#94a3b8'}}>{cm.createdAt?new Date(cm.createdAt).toLocaleDateString():''}</span>
                        {currentUser && cm.uid === currentUser.uid && (
                          <button onClick={async()=>{
                            const updated = await deleteJournalComment(viewingJournal.id, cm.id)
                            setViewingJournal({...viewingJournal,comments:updated,commentCount:updated.length})
                            setFeedJournals(feedJournals.map(j => j.id===viewingJournal.id ? {...j,comments:updated,commentCount:updated.length} : j))
                          }} style={{background:'none',border:'none',color:'#ef4444',fontSize:10,cursor:'pointer',marginLeft:'auto'}}>{t('commentDelete')}</button>
                        )}
                      </div>
                      <div style={{fontSize:13,color:'#334155',lineHeight:1.5}}>{cm.text}</div>
                    </div>
                  </div>
                ))}

                {currentUser ? (
                  <div style={{display:'flex',gap:8,marginTop:12}}>
                    <input value={journalCommentText} onChange={e=>setJournalCommentText(e.target.value)} placeholder={t('commentPlaceholder')}
                      onKeyDown={async e=>{
                        if(e.key==='Enter'&&journalCommentText.trim()){
                          const updated = await addJournalComment(viewingJournal.id,{text:journalCommentText.trim(),uid:currentUser.uid,userName:currentUser.displayName||currentUser.email})
                          setViewingJournal({...viewingJournal,comments:updated,commentCount:updated.length})
                          setFeedJournals(feedJournals.map(j => j.id===viewingJournal.id ? {...j,comments:updated,commentCount:updated.length} : j))
                          setJournalCommentText('')
                        }
                      }}
                      style={{flex:1,padding:'9px 12px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:13,outline:'none',boxSizing:'border-box'}} />
                    <button onClick={async()=>{
                      if(journalCommentText.trim()){
                        const updated = await addJournalComment(viewingJournal.id,{text:journalCommentText.trim(),uid:currentUser.uid,userName:currentUser.displayName||currentUser.email})
                        setViewingJournal({...viewingJournal,comments:updated,commentCount:updated.length})
                        setFeedJournals(feedJournals.map(j => j.id===viewingJournal.id ? {...j,comments:updated,commentCount:updated.length} : j))
                        setJournalCommentText('')
                      }
                    }} style={{background:'#3b82f6',border:'none',color:'white',padding:'9px 16px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer'}}>{t('commentPost')}</button>
                  </div>
                ) : (
                  <div style={{fontSize:12,color:'#94a3b8',textAlign:'center',marginTop:10}}>{t('commentLogin')}</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Community Courses Modal */}
      {showCommunity && (() => {
        const grouped = {}
        communityCoursesData.forEach(sc => {
          const days = sc.course?.days || sc.days || []
          const cities = [...new Set(days.flatMap(d=>(d.items||[]).map(it=>it.cityName||it.name)).filter(Boolean))]
          const firstCity = cities[0]
          let country = '', continent = ''
          if (firstCity) {
            const entry = Object.entries(COUNTRY_CITIES).find(([_,cs])=>Array.isArray(cs) && cs.some(c=>c.name===firstCity))
            if (entry) { country = entry[0]; continent = COUNTRY_INFO[country]?.continent || '' }
          }
          if (!continent) continent = lang==='ko'?'기타':'Other'
          if (!country) country = lang==='ko'?'기타':'Other'
          const contDisplay = lang==='ko' ? continent : (CONTINENT_I18N[continent]?.[lang] || continent)
          if (!grouped[contDisplay]) grouped[contDisplay] = {_rawContinent:continent}
          if (!grouped[contDisplay][country]) grouped[contDisplay][country] = []
          grouped[contDisplay][country].push(sc)
        })
        return (
        <>
          <div onClick={()=>{setShowCommunity(false);setCommunityContinent(null);setCommunityCountry(null)}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:3000}} />
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:3001,width:isMobile?'96vw':560,maxHeight:'88vh',background:'white',borderRadius:22,boxShadow:'0 24px 64px rgba(0,0,0,.3)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{background:'linear-gradient(135deg,#f59e0b,#ef4444)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                {(communityContinent || communityCountry) && (
                  <button onClick={()=>{if(communityCountry)setCommunityCountry(null);else setCommunityContinent(null)}}
                    style={{background:'rgba(255,255,255,.25)',border:'none',color:'white',width:28,height:28,borderRadius:8,fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>
                )}
                <div>
                  <div style={{fontSize:19,fontWeight:800,color:'white'}}>
                    {communityCountry ? getCountryName(communityCountry) : communityContinent ? communityContinent : t('community')}
                  </div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,.7)',marginTop:2}}>
                    {communityCountry ? communityContinent : communityContinent ? (lang==='ko'?'국가를 선택하세요':'Select a country') : t('communityDesc')}
                  </div>
                </div>
              </div>
              <button onClick={()=>{setShowCommunity(false);setCommunityContinent(null);setCommunityCountry(null)}} style={{background:'rgba(255,255,255,.2)',border:'none',color:'white',width:32,height:32,borderRadius:10,fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'18px 22px'}}>
              {communityLoading ? (
                <div style={{textAlign:'center',padding:'50px 0',color:'#94a3b8',fontSize:15}}>{lang==='ko'?'불러오는 중...':'Loading...'}</div>
              ) : communityCoursesData.length === 0 ? (
                <div style={{textAlign:'center',padding:'50px 0'}}>
                  <div style={{fontSize:48,marginBottom:14}}>📭</div>
                  <div style={{color:'#94a3b8',fontSize:14,fontWeight:600}}>{t('communityEmpty')}</div>
                  <div style={{color:'#cbd5e1',fontSize:12,marginTop:6}}>{t('communityEmptyHint')}</div>
                </div>
              ) : !communityContinent ? (
                <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'1fr 1fr 1fr',gap:12}}>
                  {Object.entries(grouped).map(([cont, obj]) => {
                    const countryCount = Object.keys(obj).filter(k=>k!=='_rawContinent').length
                    const courseCount = Object.values(obj).filter(v=>Array.isArray(v)).reduce((a,arr)=>a+arr.length,0)
                    return (
                      <div key={cont} onClick={()=>setCommunityContinent(cont)}
                        style={{padding:'24px 16px',borderRadius:16,background:'linear-gradient(135deg,#f8fafc,#f1f5f9)',border:'2px solid #e2e8f0',cursor:'pointer',textAlign:'center',transition:'all .2s',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor='#3b82f6';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(59,130,246,.15)'}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
                        <div style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>{cont}</div>
                        <div style={{fontSize:11,color:'#64748b',marginTop:4}}>{countryCount} {lang==='ko'?'개국':'countries'} · {courseCount} {lang==='ko'?'개 코스':'courses'}</div>
                      </div>
                    )
                  })}
                </div>
              ) : !communityCountry ? (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {Object.entries(grouped[communityContinent]||{}).filter(([k])=>k!=='_rawContinent').map(([countryName, courses]) => (
                    <div key={countryName} onClick={()=>setCommunityCountry(countryName)}
                      style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',borderRadius:14,border:'1.5px solid #e2e8f0',background:'white',cursor:'pointer',transition:'all .15s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='#3b82f6';e.currentTarget.style.boxShadow='0 4px 12px rgba(59,130,246,.1)'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.boxShadow='none'}}>
                      {getFlagImg(COUNTRY_INFO[countryName]?.emoji,20) ? <img src={getFlagImg(COUNTRY_INFO[countryName]?.emoji,20)} width={24} height={18} style={{borderRadius:3}} /> : <span style={{fontSize:20}}>{COUNTRY_INFO[countryName]?.emoji||''}</span>}
                      <div style={{flex:1}}>
                        <div style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>{getCountryName(countryName)}</div>
                        <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{courses.length} {lang==='ko'?'개 코스':'courses'}</div>
                      </div>
                      <span style={{fontSize:16,color:'#94a3b8'}}>›</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {(grouped[communityContinent]?.[communityCountry]||[]).map((sc,idx) => {
                    const days = sc.course?.days || sc.days || []
                    const cities = [...new Set(days.flatMap(d=>(d.items||[]).map(it=>it.cityI18n?.[lang] || getCityName(it.cityName||it.name))).filter(Boolean))]
                    const totalPlaces = days.reduce((a,d)=>a+(d.items||[]).length,0)
                    const dayCount = days.length
                    const dateStr = sc.createdAt ? new Date(sc.createdAt).toLocaleDateString() : ''
                    const isExpanded = communityExpanded === (sc.id||idx)
                    const comments = sc.comments || []
                    const photos = sc.photos || []
                    return (
                      <div key={sc.id||idx} style={{borderRadius:16,border:'1.5px solid #e2e8f0',background:'white',overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}>
                        <div style={{padding:'18px 20px'}}>
                          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                            <div>
                              <div style={{fontSize:18,fontWeight:800,color:'#0f172a'}}>{cities.join(' · ') || 'Course'}</div>
                              <div style={{fontSize:12,color:'#64748b',marginTop:4}}>
                                {totalPlaces}{t('communityPlaces')} · {dayCount}{t('communityDays')}
                                {(sc.course?.type||sc.type)==='ai' && <span style={{marginLeft:6,padding:'1px 6px',borderRadius:4,background:'#f3e8ff',color:'#7c3aed',fontSize:10,fontWeight:700}}>AI</span>}
                              </div>
                            </div>
                            {currentUser && sc.uid === currentUser.uid && (
                              <button onClick={async()=>{if(confirm(lang==='ko'?'삭제하시겠습니까?':'Delete?')){await deleteSharedCourse(sc.id);setCommunityCoursesData(prev=>prev.filter(c=>c.id!==sc.id))}}}
                                style={{background:'none',border:'none',color:'#ef4444',fontSize:14,cursor:'pointer'}}>✕</button>
                            )}
                          </div>
                          {photos.length > 0 && (
                            <div style={{display:'flex',gap:8,marginBottom:12,overflowX:'auto',paddingBottom:4}}>
                              {photos.map((url,i)=>(
                                <img key={i} src={url} style={{width:110,height:80,borderRadius:10,objectFit:'cover',flexShrink:0,cursor:'pointer',border:'1px solid #e2e8f0'}} onClick={()=>window.open(url,'_blank')} />
                              ))}
                            </div>
                          )}
                          <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:14}}>
                            {days.flatMap(d=>d.items||[]).slice(0,8).map((it,i)=>(
                              <span key={i} style={{padding:'4px 10px',borderRadius:20,background:'#f1f5f9',fontSize:11,color:'#475569',fontWeight:500}}>{it.i18n?.[lang] || getCourseItemName(it)}</span>
                            ))}
                            {days.flatMap(d=>d.items||[]).length > 8 && <span style={{padding:'4px 10px',borderRadius:20,background:'#f1f5f9',fontSize:11,color:'#94a3b8'}}>+{days.flatMap(d=>d.items||[]).length-8}</span>}
                          </div>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <span style={{fontSize:11,color:'#94a3b8'}}>{sc.userName || 'Anonymous'} · {dateStr}</span>
                              <button onClick={()=>setCommunityExpanded(isExpanded?null:(sc.id||idx))}
                                style={{background:'#f1f5f9',border:'none',color:'#3b82f6',fontSize:11,cursor:'pointer',fontWeight:600,padding:'3px 8px',borderRadius:6}}>
                                💬 {comments.length} {isExpanded?'▲':'▼'}
                              </button>
                            </div>
                            <button onClick={()=>{
                              setCourseDays(days);localStorage.setItem('atlas_course_days',JSON.stringify(days))
                              const flat = days.flatMap(d=>d.items||[]);saveCourse(flat)
                              setCourseTransport(sc.course?.transport||sc.transport||'transit')
                              setActiveDayTab(0);setShowCoursePlanner(true);setShowCommunity(false)
                              setCourseSource(sc.course?.type||sc.type||'manual')
                            }} style={{background:'linear-gradient(135deg,#2563eb,#7c3aed)',border:'none',color:'white',padding:'8px 20px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                              {t('communityLoad')}
                            </button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div style={{borderTop:'1px solid #e2e8f0',padding:'14px 20px',background:'#f8fafc'}}>
                            {comments.length === 0 && <div style={{fontSize:12,color:'#94a3b8',textAlign:'center',padding:'10px 0'}}>{lang==='ko'?'아직 댓글이 없습니다':'No comments yet'}</div>}
                            {comments.map((cm,ci)=>(
                              <div key={cm.id||ci} style={{display:'flex',gap:10,marginBottom:10}}>
                                <div style={{width:26,height:26,borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'white',flexShrink:0}}>{(cm.userName||'?')[0]?.toUpperCase()}</div>
                                <div style={{flex:1}}>
                                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                                    <span style={{fontSize:12,fontWeight:600,color:'#1e293b'}}>{cm.userName}</span>
                                    <span style={{fontSize:10,color:'#94a3b8'}}>{cm.createdAt ? new Date(cm.createdAt).toLocaleDateString() : ''}</span>
                                    {currentUser && cm.uid === currentUser.uid && (
                                      <button onClick={async()=>{const updated=await deleteComment(sc.id,cm.id);setCommunityCoursesData(prev=>prev.map(c=>c.id===sc.id?{...c,comments:updated}:c))}}
                                        style={{background:'none',border:'none',color:'#ef4444',fontSize:10,cursor:'pointer',marginLeft:'auto'}}>{t('commentDelete')}</button>
                                    )}
                                  </div>
                                  <div style={{fontSize:13,color:'#475569',marginTop:3,lineHeight:1.5}}>{cm.text}</div>
                                </div>
                              </div>
                            ))}
                            {currentUser ? (
                              <div style={{display:'flex',gap:8,marginTop:10}}>
                                <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder={t('commentPlaceholder')}
                                  onKeyDown={e=>{if(e.key==='Enter'&&commentText.trim()){addComment(sc.id,{text:commentText.trim(),uid:currentUser.uid,userName:currentUser.displayName||currentUser.email}).then(updated=>{setCommunityCoursesData(prev=>prev.map(c=>c.id===sc.id?{...c,comments:updated}:c));setCommentText('')})}}}
                                  style={{flex:1,padding:'8px 12px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:13,outline:'none',boxSizing:'border-box'}} />
                                <button onClick={()=>{if(commentText.trim()){addComment(sc.id,{text:commentText.trim(),uid:currentUser.uid,userName:currentUser.displayName||currentUser.email}).then(updated=>{setCommunityCoursesData(prev=>prev.map(c=>c.id===sc.id?{...c,comments:updated}:c));setCommentText('')})}}}
                                  style={{background:'#3b82f6',border:'none',color:'white',padding:'8px 16px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer'}}>{t('commentPost')}</button>
                              </div>
                            ) : (
                              <div style={{fontSize:12,color:'#94a3b8',textAlign:'center',marginTop:10}}>{t('commentLogin')}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
        )
      })()}

      {/* Share Modal */}
      {shareModalCourse && (
        <>
          <div onClick={()=>setShareModalCourse(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:3100}} />
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:3101,width:isMobile?'92vw':400,background:'white',borderRadius:20,boxShadow:'0 24px 64px rgba(0,0,0,.3)',overflow:'hidden'}}>
            <div style={{background:'linear-gradient(135deg,#2563eb,#7c3aed)',padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:17,fontWeight:800,color:'white'}}>{t('shareBtn')}</span>
              <button onClick={()=>setShareModalCourse(null)} style={{background:'rgba(255,255,255,.2)',border:'none',color:'white',width:30,height:30,borderRadius:8,fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{padding:'18px 22px 22px'}}>
              <div style={{padding:'12px 16px',borderRadius:12,background:'#f8fafc',border:'1px solid #e2e8f0',marginBottom:16}}>
                <div style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>{[...new Set((shareModalCourse.days||[]).flatMap(d=>(d.items||[]).map(it=>it.cityName||it.name)).filter(Boolean))].map(c=>getCityName(c)).join(' · ')}</div>
                <div style={{fontSize:12,color:'#64748b',marginTop:4}}>{(shareModalCourse.days||[]).reduce((a,d)=>a+(d.items||[]).length,0)}{t('communityPlaces')} · {(shareModalCourse.days||[]).length}{t('communityDays')}</div>
              </div>
              <div style={{marginBottom:16}}>
                <label style={{fontSize:12,fontWeight:600,color:'#475569',display:'block',marginBottom:6}}>{t('sharePhotos')}</label>
                <input type="file" accept="image/*" multiple onChange={e=>setSharePhotos([...e.target.files].slice(0,5))}
                  style={{fontSize:12,color:'#64748b'}} />
                {sharePhotos.length > 0 && (
                  <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
                    {[...sharePhotos].map((f,i)=>(
                      <div key={i} style={{width:64,height:48,borderRadius:8,overflow:'hidden',border:'1px solid #e2e8f0'}}>
                        <img src={URL.createObjectURL(f)} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setShareModalCourse(null)} style={{flex:1,padding:'11px',borderRadius:10,border:'1.5px solid #e2e8f0',background:'white',color:'#64748b',fontSize:13,fontWeight:600,cursor:'pointer'}}>{t('shareCancel')}</button>
                <button disabled={shareUploading} onClick={async()=>{
                  if (!currentUser) { alert(lang==='ko'?'로그인이 필요합니다':'Login required'); return }
                  setShareUploading(true)
                  try {
                    let photoUrls = []
                    for (const f of sharePhotos) {
                      const path = 'courses/'+currentUser.uid+'/'+Date.now()+'_'+f.name
                      const url = await uploadPhoto(f, path)
                      photoUrls.push(url)
                    }
                    await shareCourse(currentUser.uid, buildCourseI18n(shareModalCourse), currentUser.displayName||currentUser.email, photoUrls)
                    alert(t('communityShared'))
                    setShareModalCourse(null);setSharePhotos([])
                  } catch(e) { alert(e.message) }
                  setShareUploading(false)
                }} style={{flex:1,padding:'11px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#2563eb,#7c3aed)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer',opacity:shareUploading?.6:1}}>
                  {shareUploading ? t('uploading') : t('shareBtn')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <>
          <div onClick={()=>setShowLoginModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:3000}} />
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:3001,width:isMobile?'92vw':380,background:'white',borderRadius:20,boxShadow:'0 24px 64px rgba(0,0,0,.3)',overflow:'hidden'}}>
            <div style={{background:'linear-gradient(135deg,#2563eb,#7c3aed)',padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:17,fontWeight:800,color:'white'}}>{authMode==='login'?(lang==='ko'?'로그인':'Login'):(lang==='ko'?'회원가입':'Sign Up')}</span>
              <button onClick={()=>setShowLoginModal(false)} style={{background:'rgba(255,255,255,.2)',border:'none',color:'white',width:30,height:30,borderRadius:8,fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{padding:'20px 22px 24px'}}>
              {/* Google 로그인 */}
              <button onClick={handleGoogleLogin} disabled={authLoading}
                style={{width:'100%',padding:'11px',borderRadius:10,border:'1.5px solid #e2e8f0',background:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontSize:14,fontWeight:600,color:'#374151',marginBottom:16,transition:'all .15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='white'}>
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#FBBC05" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Google {lang==='ko'?'로그인':'Login'}
              </button>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <div style={{flex:1,height:1,background:'#e2e8f0'}} />
                <span style={{fontSize:11,color:'#94a3b8'}}>or</span>
                <div style={{flex:1,height:1,background:'#e2e8f0'}} />
              </div>
              {/* 이메일 폼 */}
              {authMode==='signup' && (
                <div style={{marginBottom:10}}>
                  <input placeholder={lang==='ko'?'이름 (선택)':'Name (optional)'} value={authName} onChange={e=>setAuthName(e.target.value)}
                    style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:14,color:'#0f172a',outline:'none',boxSizing:'border-box'}}
                    onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
                </div>
              )}
              <div style={{marginBottom:10}}>
                <input type="email" placeholder={lang==='ko'?'이메일':'Email'} value={authEmail} onChange={e=>setAuthEmail(e.target.value)}
                  style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:14,color:'#0f172a',outline:'none',boxSizing:'border-box'}}
                  onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
              </div>
              <div style={{marginBottom:14}}>
                <input type="password" placeholder={lang==='ko'?'비밀번호':'Password'} value={authPw} onChange={e=>setAuthPw(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter')handleAuth()}}
                  style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:14,color:'#0f172a',outline:'none',boxSizing:'border-box'}}
                  onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
              </div>
              {authError && <div style={{marginBottom:12,padding:'8px 12px',borderRadius:8,background:'#fef2f2',border:'1px solid #fecaca',fontSize:12,color:'#dc2626'}}>{authError}</div>}
              <button onClick={handleAuth} disabled={authLoading}
                style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#2563eb,#7c3aed)',border:'none',borderRadius:12,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',opacity:authLoading?.6:1}}>
                {authLoading ? '...' : authMode==='login'?(lang==='ko'?'로그인':'Login'):(lang==='ko'?'가입하기':'Sign Up')}
              </button>
              <div style={{marginTop:14,textAlign:'center'}}>
                <span style={{fontSize:12,color:'#64748b'}}>{authMode==='login'?(lang==='ko'?'계정이 없으신가요?':'No account?'):(lang==='ko'?'이미 계정이 있으신가요?':'Have an account?')} </span>
                <span onClick={()=>{setAuthMode(authMode==='login'?'signup':'login');setAuthError('')}}
                  style={{fontSize:12,color:'#3b82f6',fontWeight:600,cursor:'pointer'}}>{authMode==='login'?(lang==='ko'?'회원가입':'Sign Up'):(lang==='ko'?'로그인':'Login')}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Currency Calculator Modal */}
      {showCurrencyCalc && (
        <>
          <div onClick={()=>setShowCurrencyCalc(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:3000}} />
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:3001,width:isMobile?'92vw':380,background:'white',borderRadius:20,boxShadow:'0 24px 64px rgba(0,0,0,.3)',overflow:'hidden'}}>
            <div style={{background:'linear-gradient(135deg,#2563eb,#7c3aed)',padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:17,fontWeight:800,color:'white'}}>{t('currCalc')}</span>
              </div>
              <button onClick={()=>setShowCurrencyCalc(false)} style={{background:'rgba(255,255,255,.2)',border:'none',color:'white',width:30,height:30,borderRadius:8,fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{padding:'20px 22px 24px'}}>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:4}}>{t('currAmount')}</label>
                <input type="number" value={currAmount} onChange={e=>setCurrAmount(e.target.value)}
                  style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:18,fontWeight:700,color:'#0f172a',outline:'none',boxSizing:'border-box'}}
                  onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:4}}>{t('currFrom')}</label>
                  <select value={currFrom} onChange={e=>setCurrFrom(e.target.value)}
                    style={{width:'100%',padding:'9px 10px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:14,fontWeight:600,color:'#0f172a',background:'white',cursor:'pointer'}}>
                    {['KRW','USD','EUR','JPY','GBP','CNY','THB','VND','AUD','CAD','CHF','SGD','HKD','TWD','MYR','PHP','IDR','INR','AED','TRY','BRL','MXN','SEK','NOK','DKK','NZD','CZK','PLN','HUF','ZAR','EGP','SAR','RUB','ILS'].map(c=>(
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <button onClick={()=>{const tmp=currFrom;setCurrFrom(currTo);setCurrTo(tmp);setCurrResult(null)}}
                  style={{marginTop:16,background:'#f1f5f9',border:'none',width:36,height:36,borderRadius:10,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#e2e8f0'} onMouseLeave={e=>e.currentTarget.style.background='#f1f5f9'}>⇄</button>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:4}}>{t('currTo')}</label>
                  <select value={currTo} onChange={e=>setCurrTo(e.target.value)}
                    style={{width:'100%',padding:'9px 10px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:14,fontWeight:600,color:'#0f172a',background:'white',cursor:'pointer'}}>
                    {['USD','KRW','EUR','JPY','GBP','CNY','THB','VND','AUD','CAD','CHF','SGD','HKD','TWD','MYR','PHP','IDR','INR','AED','TRY','BRL','MXN','SEK','NOK','DKK','NZD','CZK','PLN','HUF','ZAR','EGP','SAR','RUB','ILS'].map(c=>(
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={()=>fetchCurrencyRate(currFrom,currTo,currAmount||1)}
                style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#2563eb,#7c3aed)',border:'none',borderRadius:12,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',transition:'opacity .15s'}}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.9'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                {currLoading ? t('currLoading') : t('currConvert')}
              </button>
              {currResult !== null && (
                <div style={{marginTop:16,padding:'16px',background:'linear-gradient(135deg,#f0fdf4,#ecfdf5)',border:'1.5px solid #bbf7d0',borderRadius:14,textAlign:'center'}}>
                  {currResult === 'error' ? (
                    <span style={{color:'#ef4444',fontSize:13,fontWeight:600}}>{t('currError')}</span>
                  ) : (
                    <>
                      <div style={{fontSize:13,color:'#64748b',marginBottom:4}}>{Number(currAmount||0).toLocaleString()} {currFrom} =</div>
                      <div style={{fontSize:26,fontWeight:800,color:'#059669'}}>{Number(currResult).toLocaleString(undefined,{maximumFractionDigits:2})} <span style={{fontSize:16,fontWeight:600}}>{currTo}</span></div>
                      <div style={{fontSize:10,color:'#94a3b8',marginTop:6}}>1 {currFrom} ≈ {currRates?.[currTo] ? currRates[currTo].toFixed(4) : '—'} {currTo}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  )
}

export default function AppWithBoundary() {
  return <ErrorBoundary><App /></ErrorBoundary>
}
