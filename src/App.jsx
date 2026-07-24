import { translateCountryInfo } from './data/countryI18n'
import { T, CITY_I18N, CONTINENT_I18N } from './data/translations'
import { getCountryDisplayName, LANG_OPTIONS, getFlagImg, COUNTRY_INFO, EMERGENCY_CONTACTS, extractCurrencyCode } from './data/countryInfo'
import { COUNTRY_CITIES } from './data/countryCities'
import ISLAND_POLYGONS from './data/islandPolygons.json'

// 작은 섬나라 라벨 데이터 (폴리곤 없이 라벨 좌표만 사용 — 클릭 시 진입)
const ISLAND_NAME_ALIAS = { 'Cape Verde': 'Cabo Verde', 'Federated States of Micronesia': 'Micronesia', 'Equatorial Guinea': 'Eq. Guinea' }
const ISLAND_LABEL_DATA = ((ISLAND_POLYGONS && ISLAND_POLYGONS.features) || [])
  .map(f => ({
    nameEn: (f && f.properties && (ISLAND_NAME_ALIAS[f.properties.NAME] || f.properties.NAME)),
    lat: f && f.properties && f.properties.LABEL_Y,
    lng: f && f.properties && f.properties.LABEL_X,
  }))
  .filter(d => d.nameEn && typeof d.lat === 'number' && typeof d.lng === 'number')
const ISLAND_NAMES = new Set(ISLAND_LABEL_DATA.map(d => d.nameEn))
// 데이터 없고 클릭 불가한 폴리곤(속령·분쟁지·남극 등) — 라벨 숨김
const HIDDEN_COUNTRY_LABELS = new Set(['W. Sahara', 'Falkland Is.', 'Greenland', 'Fr. S. Antarctic Lands', 'Puerto Rico', 'New Caledonia', 'Antarctica', 'N. Cyprus', 'Somaliland'])
// 면적 작은 나라(섬나라 제외 하위 30%, 단 이스라엘·벨기에·대만·네덜란드·덴마크·스위스·크로아티아·아일랜드 제외)
// → 섬나라처럼 줌인(alt<0.7) 했을 때만 라벨 표시. 유럽 등 작은 나라 밀집 정리용
const SMALL_COUNTRY = new Set(["Luxembourg","N. Cyprus","Palestine","Cyprus","Vanuatu","Trinidad and Tobago","Puerto Rico","Lebanon","Brunei","Kosovo","Fr. S. Antarctic Lands","Jamaica","Montenegro","Gambia","Timor-Leste","Bahamas","Falkland Is.","Kuwait","eSwatini","Slovenia","Fiji","El Salvador","Djibouti","Belize","New Caledonia","Rwanda","Solomon Is.","North Macedonia","Burundi","Eq. Guinea","Lesotho","Armenia","Haiti","Albania","Moldova","Guinea-Bissau","Bhutan","Estonia","Slovakia","Dominican Rep.","Bosnia and Herz.","Costa Rica","Togo","Lithuania","Latvia","Croatia","Azerbaijan","Turkmenistan","Jordan","Liberia","Sierra Leone","Congo","Honduras"])
// 이름 정규화: "Solomon Is." ↔ "Solomon Islands" 같은 약자 변형 매칭용
const normCountryName = (s) => String(s || '').toLowerCase().replace(/\bis\.?\b/g, 'islands').replace(/&/g, 'and').replace(/[^a-z]/g, '')
const ISLAND_NAMES_NORM = new Set(ISLAND_LABEL_DATA.map(d => normCountryName(d.nameEn)))
import { useState, useEffect, useRef, Component } from 'react'
import Globe from 'globe.gl'
import * as THREE from 'three'
import { onAuth, loginEmail, signupEmail, loginGoogle, logout, loadUserData, saveUserData, updateUserProfile, shareCourse, loadSharedCourses, deleteSharedCourse, uploadPhoto, addComment, deleteComment, createJournal, loadJournals, updateJournal, deleteJournal, toggleJournalLike, addJournalComment, deleteJournalComment, uploadJournalPhoto, getCityCache, setCityCache, uploadAttractionsArchive, uploadAttractionPhotos, getAttractionPhotos, getCityAttractionPhotos, deleteAttractionPhoto, setAttractionCoverPhoto, getExcludedAttractions, addExcludedAttraction, getCompletedCities, addCompletedCity, removeCompletedCity, getCityDoc } from './firebase'


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
  const [communitySearch, setCommunitySearch] = useState('')
  const [communityDayFilter, setCommunityDayFilter] = useState(0)
  const [extractTick, setExtractTick] = useState(0) // 임시 추출 도구 리렌더용 (추출 끝나면 삭제)
  const [hotspotDiag, setHotspotDiag] = useState(null) // 관광지 지역명 매칭 진단(배지 표시용)
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
  const [feedSubTab, setFeedSubTab] = useState('all') // 'all' | 'mine'
  const [feedJournals, setFeedJournals] = useState([])
  const [feedJournalsLoading, setFeedJournalsLoading] = useState(false)
  const [showJournalEditor, setShowJournalEditor] = useState(false)
  const [editingJournal, setEditingJournal] = useState(null) // null=new, object=edit
  const [viewingJournal, setViewingJournal] = useState(null) // 상세 보기
  // ── 트래블 피드 풀스크린 뷰 (Phase 2) ──
  const [journalForm, setJournalForm] = useState({ title:'', body:'', cities:[], days:1, rating:0, visibility:'public', photos:[], blocks:[], startDate:'', endDate:'' })
  const [journalSaving, setJournalSaving] = useState(false)
  const [journalCommentText, setJournalCommentText] = useState('')
  const [journalCitySelectOpen, setJournalCitySelectOpen] = useState(false)
  const [journalCitySearchQ, setJournalCitySearchQ] = useState('')

  const globeContainerRef = useRef(null)
  const globeRef = useRef(null)
  const handleCityClickRef = useRef(null)  // ref to always-fresh click handler
  const handleCountryClickRef = useRef(null)  // ref for label click on small island countries
  const justClickedCityRef = useRef(false) // 도시 클릭 직후 polygon 클릭 무시용
  const pendingPanelRef = useRef(false) // 직전이 줌-only였으면 true → 다음 탭은 무조건 패널 (의도 단계 추적)
  const lastPovKeyRef = useRef('') // hideBackLabels idle 스킵용 (라벨 재생성 시 리셋)
  const cityEnterAltRef = useRef(0.5) // 국가 진입 alt 기록 → 도시 소도시 라벨 줌 게이팅 기준
  const countryFlyingRef = useRef({ active: false, targetAlt: 0.5 }) // 국가 전환 카메라 이동 중 → 게이팅을 목표 줌 기준으로 고정(경유 줌에서 라벨 깜빡임 방지)
  const labelCacheRef = useRef({ t: 0, items: [] }) // 라벨 DOM+좌표 캐시 (querySelectorAll 매틱 방지)
  const hasTouchedRef = useRef(false) // 페이지에 첫 터치 발생하면 true → 호버 영구 비활성 (모바일 확정)
  const [countries, setCountries] = useState([])
  const [borderPaths, setBorderPaths] = useState([])  // 50m 국경선(선) — pathsData용
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [selectedCity, setSelectedCity] = useState(null)
    const [activeTab, setActiveTab] = useState('hotspots')
  const [hotspots, setHotspots] = useState([])
  const [attrPhotos, setAttrPhotos] = useState({})  // { place_id: [{url,path}] } 관광지별 사진 목록
  const [attrPhotoUploading, setAttrPhotoUploading] = useState('')  // 업로드중인 place_id
  const [galleryView, setGalleryView] = useState(null)  // { photos:[{url,path}], idx, placeId, country, city } 큰 갤러리 팝업
  const [excludedIds, setExcludedIds] = useState(new Set())  // 추천 제외 place_id
  const [completedCities, setCompletedCities] = useState(new Set())  // 작업 완료 도시(라벨 빨간색)
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [foodCulture, setFoodCulture] = useState(null) // AI 생성 음식문화 데이터
  const [loadingFoodCulture, setLoadingFoodCulture] = useState(false)

  // API 사용량 추적 및 제한


  const [cityData, setCityData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [descFailed, setDescFailed] = useState(false) // 소개글 AI 생성 최종 실패 시 재시도 버튼 표시용
  const [searchQuery, setSearchQuery] = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [spotSearchQuery, setSpotSearchQuery] = useState('')      // 추천탭: 장소 검색해 코스 추가
  const [spotSearchResults, setSpotSearchResults] = useState([])
  const [spotSearchLoading, setSpotSearchLoading] = useState(false)
  // 숙소(호텔/에어비앤비 등) — Day별 설정, 최근 기록으로 빠른 재선택
  const [hotelSearchQuery, setHotelSearchQuery] = useState('')
  const [hotelSearchResults, setHotelSearchResults] = useState([])
  const [hotelSearchLoading, setHotelSearchLoading] = useState(false)
  const [hotelSearchDayIdx, setHotelSearchDayIdx] = useState(null)  // 숙소 설정 패널 열린 Day (null=닫힘)
  const [recentHotels, setRecentHotels] = useState(() => { try { return JSON.parse(localStorage.getItem('atlas_recent_hotels') || '[]') } catch { return [] } })
  const hoveredCountryRef = useRef(null)  // hover 하이라이트: state 대신 ref (effect 재실행 없이 색만 갱신 → 드래그 렉 방지)
  const [showCountryInfo, setShowCountryInfo] = useState(false)
  const [infoExpanded, setInfoExpanded] = useState(false) // A안: 컴팩트(헤더만) ↔ 전체 펼침
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('atlas_lang') || 'ko' } catch { return 'ko' } })
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [sidePanel, setSidePanel] = useState(null) // 'hotspots' | 'restaurants' | null
  const [showHamburger, setShowHamburger] = useState(false)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768)
  // 모바일 코스↔도시 패널 책넘기기 스와이프 상태
  const [cityPeek, setCityPeek] = useState(false)
  const [showSwipeHint, setShowSwipeHint] = useState(false)
  const cityPanelRef = useRef(null)
  const peekDragRef = useRef({ active:false, mode:null, sx:0, sy:0, multi:false })
  const [savedCourses, setSavedCourses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('atlas_saved_courses') || '[]') } catch { return [] }
  })
  const [loadedCourseId, setLoadedCourseId] = useState(null) // 저장 코스를 불러왔을 때 그 id 기억 → 삭제 시 저장 목록에서도 제거
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
      id: loadedCourseId || Date.now(), name: `${name} ${days.length}${lang==='ko'?'일':'D'}`,
      type: courseType,
      days: days, transport: courseTransport, tripStart: courseTripStart,
      createdAt: Date.now()
    }
    // 불러온 코스를 수정·재저장하면 같은 id를 덮어씀(중복 방지), 새 코스면 맨 앞에 추가
    const editing = loadedCourseId && savedCourses.some(c => c.id === loadedCourseId)
    const newList = editing
      ? savedCourses.map(c => c.id === loadedCourseId ? saved : c)
      : [saved, ...savedCourses]
    setSavedCourses(newList); localStorage.setItem('atlas_saved_courses', JSON.stringify(newList))
    return saved
  }
  const loadSavedCourse = (saved) => {
    const days = saved.days || []
    setCourseDays(days); localStorage.setItem('atlas_course_days', JSON.stringify(days))
    const flat = days.flatMap(d => d.items || []); saveCourse(flat)
    setCourseTransport(saved.transport || 'transit')
    if (saved.tripStart) saveTripStart(saved.tripStart)
    // 책넘기기 핸들/스와이프가 selectedCity에 의존 → 코스의 도시를 복원
    const cityItem = flat.find(it => it && it.source === 'city') || flat.find(it => it && it.cityName)
    if (cityItem && cityItem.cityName) {
      const cityObj = { name:cityItem.cityName, _koName:cityItem.cityName, lat:cityItem.lat, lng:cityItem.lng, emoji:cityItem.emoji||'📍', countryEn:cityItem.countryEn||'' }
      setSelectedCity(cityObj)
      setCityData(null); fetchCityData(cityObj)
    }
    setActiveDayTab(0); setShowCoursePlanner(true); setShowHamburger(false)
    setCourseSource(saved.type || 'manual')
    setLoadedCourseId(saved.id)
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
  const [courseCompact, setCourseCompact] = useState(false)  // 코스 관광지 컴팩트(한눈에 보기) 토글
  const scrollAreaRef = useRef(null)        // 코스 관광지 스크롤 영역 (드래그 자동 스크롤용)
  const autoScrollRef = useRef(null)
  const dragScrollDirRef = useRef(0)
  const [activeDayTab, setActiveDayTab] = useState(0)
  const [courseTripStart, setCourseTripStart] = useState(() => {
    const today = new Date().toISOString().slice(0, 10)
    try {
      const saved = localStorage.getItem('atlas_trip_start')
      return (saved && saved >= today) ? saved : today  // 미래 저장값만 유지, 과거/없으면 오늘
    } catch { return today }
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
  // 다중 도시: [{city, days}, ...]
  const [aiCities, setAiCities] = useState([])
  const addAiCity = (c) => {
    if (aiCities.some(x => x.city.name === c.name)) return  // 중복 방지
    setAiCities(prev => [...prev, { city: c, days: 1 }])
    setAiCitySearch('')
  }
  const removeAiCity = (name) => setAiCities(prev => prev.filter(x => x.city.name !== name))
  const setAiCityDays = (name, days) => setAiCities(prev => prev.map(x => x.city.name === name ? { ...x, days: Math.max(1, days) } : x))
  const aiTotalDays = aiCities.reduce((s, x) => s + x.days, 0)
  const [aiTransport, setAiTransport] = useState('transit')
  const [aiHours, setAiHours] = useState(1)
  const [aiCount, setAiCount] = useState(1)
  const [nlOpen, setNlOpen] = useState(false)     // 자연어 코스 입력 패널 열림
  const [nlText, setNlText] = useState('')         // 자연어 입력값
  const [nlLoading, setNlLoading] = useState(false) // 파싱/생성 중
  const [aiTheme, setAiTheme] = useState(null)     // 파싱된 테마 (['역사','자연'] 등, 없으면 null)
  const [guideOpen, setGuideOpen] = useState(false)   // 전체화면 가이드 페이지 열림
  const [guideData, setGuideData] = useState(null)    // 가이드 데이터 (도시/소개/코스/음식/추가정보)
  const [guideLoading, setGuideLoading] = useState(false)
  const [guideList, setGuideList] = useState(() => { try { return JSON.parse(localStorage.getItem('atlas_guides') || '[]') } catch { return [] } })
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

  // 자연어 → 코스 파라미터 파싱 (Gemini)
  const parseNlCourse = async (text) => {
    const prompt = `다음 여행 요청을 분석해 JSON으로만 답하세요. 설명·마크다운 없이 JSON 객체만 출력.
요청: "${text}"
출력 형식: {"city":"도시 한국어명","count":장소수 숫자,"days":일수 숫자,"themes":["역사"|"자연"|"박물관"|"예술"|"종교"|"놀이"|"대표" 중 해당하는 것들],"transport":"transit"|"walking"|"driving"}
규칙:
- city는 반드시 한국어 도시명 (예: 파리, 도쿄, 서울)
- count: 구체적 개수가 있으면 그 수, "알차게"·"유명한"·"제대로"·"많이"·"전부" 같은 표현이 있으면 7, 둘 다 없으면 5. days 명시 없으면 1
- themes는 요청에 맞는 것만, 특별한 테마 없으면 ["대표"]
- transport 명시 없으면 "transit"`
    const res = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt }) })
    const data = await res.json()
    const txt = (data.text||'').trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim()
    return JSON.parse(txt)
  }

  // 테마 → 카테고리(catOf 결과) 매핑. 매핑 없으면 null(전체 허용)
  const themeToCats = (themes) => {
    const map = { '역사':['museum','worship','attraction'], '자연':['nature'], '박물관':['museum'], '예술':['museum'], '종교':['worship'], '놀이':['theme'] }
    const set = new Set()
    ;(themes||[]).forEach(t => (map[t]||[]).forEach(c => set.add(c)))
    return set.size ? [...set] : null
  }

  // 가이드 추가정보(날씨·교통·에티켓) Gemini 1회 + 캐시
  const fetchGuideExtra = async (city) => {
    const cityKey = city._koName || city.name
    const fsKey = `${cityKey}_${lang}`
    try { const c = await getCityCache(fsKey); if (c?.extra) return c.extra } catch {}
    const cityName = getCityName(cityKey) || city.name
    const langName = lang === 'ko' ? '한국어' : lang === 'ja' ? '日本語' : lang === 'zh' ? '中文' : 'English'
    const prompt = `여행 가이드 작성자입니다. "${cityName}"에 대해 JSON으로만 답하세요 (마크다운·코드펜스 없이).
형식: {"weather":"시즌별 날씨 특징 2-3문장","transport":"이동·교통 팁 2-3문장","etiquette":"여행자가 알아야 할 주의사항·문화 에티켓 2-3문장"}
모든 내용은 ${langName}로 작성.`
    try {
      const res = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt }) })
      const data = await res.json()
      const txt = (data.text||'').trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim()
      const parsed = JSON.parse(txt)
      setCityCache(fsKey, { extra: parsed })
      return parsed
    } catch (e) { console.warn('[guide extra] error:', e); return null }
  }

  // 가이드 데이터 수집 (소개·음식·추가정보 병렬) — 코스는 조각B-2에서
  // 가이드 목록 저장 (localStorage) — 같은 도시는 최신으로 갱신, 최대 20개
  const saveGuideToList = (g) => {
    if (!g || !g.cityName) return
    const entry = { id: Date.now(), cityName: g.cityName, days: g.days || 1, savedAt: new Date().toISOString(), payload: g }
    setGuideList(prev => {
      const next = [entry, ...prev.filter(e => e.cityName !== g.cityName)].slice(0, 20)
      try { localStorage.setItem('atlas_guides', JSON.stringify(next)) } catch {}
      return next
    })
  }
  const openSavedGuide = (entry) => { if (entry?.payload) { setGuideData(entry.payload); setGuideOpen(true) } }
  const deleteSavedGuide = (id) => {
    setGuideList(prev => {
      const next = prev.filter(e => e.id !== id)
      try { localStorage.setItem('atlas_guides', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const buildGuide = async (gd) => {
    setGuideLoading(true)
    try {
      const cityKey = gd.city._koName || gd.city.name
      const countryEn = gd.city.countryEn || ''
      const [desc, food, extra, course] = await Promise.all([
        fetchCityDescription(cityKey, countryEn, lang),
        fetchFoodCulture(gd.city, true),
        fetchGuideExtra(gd.city),
        generateAiCourse({ cities: [{ city: gd.city, days: gd.days }], count: gd.count, theme: gd.themes, transport: gd.transport, returnDays: true })
      ])
      setGuideData(prev => prev ? { ...prev, desc, food, extra, course } : prev)
      saveGuideToList({ ...gd, desc, food, extra, course })
    } catch (e) {
      console.warn('[buildGuide] error:', e)
    } finally {
      setGuideLoading(false)
    }
  }

  // 자연어 입력 → 가이드 데이터 기본 설정 후 페이지 열기 (실제 수집은 조각B)
  const handleNlGenerate = async () => {
    if (!nlText.trim() || nlLoading) return
    setNlLoading(true)
    try {
      const parsed = await parseNlCourse(nlText)
      const q = (parsed.city||'').trim()
      const cityObj = allCitiesFlat.find(c =>
        c.name === q || (CITY_I18N[c.name]?.[0]||'').toLowerCase() === q.toLowerCase() || c.name.includes(q)
      )
      if (!cityObj) { alert(`'${parsed.city}' 도시를 찾지 못했어요. 다른 도시로 시도해보세요.`); setNlLoading(false); return }
      const themes = (parsed.themes||[]).filter(t => t !== '대표')
      setNlOpen(false)
      const gd = {
        city: cityObj,
        cityName: getCityName(cityObj.name),
        days: Math.max(1, parsed.days||1),
        count: Math.max(1, Math.min(15, parsed.count||5)),
        themes: themes.length ? themes : null,
        transport: ['transit','walking','driving'].includes(parsed.transport) ? parsed.transport : 'transit',
        desc: null, course: null, food: null, extra: null
      }
      setGuideData(gd)
      setGuideOpen(true)
      buildGuide(gd)   // 소개·음식·추가정보 수집 (코스는 조각B-2)
    } catch (e) {
      console.warn('[NL] error:', e)
      alert('요청을 이해하지 못했어요. 다시 입력해주세요.')
    } finally {
      setNlLoading(false)
    }
  }

  const generateAiCourse = async (opts = null) => {
    const _cities = opts?.cities || aiCities
    const _count = opts?.count ?? aiCount
    const _theme = (opts && 'theme' in opts) ? opts.theme : aiTheme
    const _transport = opts?.transport || aiTransport
    if (_cities.length === 0) return
    if (!opts?.returnDays) setAiGenerating(true)
    // 날짜 미설정 시 오늘로 동기화
    if (!courseTripStart) {
      saveTripStart(new Date().toISOString().slice(0, 10))
    }

    // ── 시간예산 + 신뢰도 모델 헬퍼 ──
    const dayBudgetMin = Math.max(60, aiHours * 60)            // 하루 가용시간(분)
    const speedKmh = _transport === 'walking' ? 4.5 : _transport === 'transit' ? 18 : 25
    const DETOUR = 1.35                                         // 직선→도로 보정계수
    const travelMin = (a, b) => (haversine(a._lat, a._lng, b._lat, b._lng) * DETOUR / speedKmh) * 60
    // Google types → 체류시간(분) + 카테고리 버킷
    const catOf = (types) => {
      const t = types || []
      if (t.includes('museum') || t.includes('art_gallery')) return 'museum'
      if (t.includes('park') || t.includes('natural_feature') || t.includes('aquarium') || t.includes('zoo')) return 'nature'
      if (t.includes('amusement_park') || t.includes('stadium')) return 'theme'
      if (t.includes('place_of_worship') || t.includes('church') || t.includes('hindu_temple')) return 'worship'
      return 'attraction'
    }
    const dwellByCat = { museum: 60, nature: 60, theme: 180, worship: 30, attraction: 30 }
    // 품질 점수 (베이지안 평균) — 리뷰 적은데 별점만 높은 함정 보정
    // 품질 점수 = 리뷰 수 (관광지는 리뷰 많으면 평점도 대체로 좋음 → 별점 제외)
    const qScore = (rating, reviews) => reviews || 0
    // 노이즈 타입 (관광지 아님 — 후보에서 제외)
    const JUNK = ['transit_station','bus_station','subway_station','train_station','light_rail_station','parking','lodging','airport','car_rental',
      'shopping_mall','store','clothing_store','department_store','supermarket','convenience_store','shoe_store','jewelry_store','furniture_store','home_goods_store','electronics_store','book_store',
      'restaurant','food','cafe','bar','meal_takeaway','meal_delivery','bakery','night_club',
      'travel_agency','real_estate_agency','finance','bank','atm','insurance_agency','hospital','doctor','pharmacy','dentist','gym','beauty_salon','hair_care','spa','gas_station','premise']
    // 관광 신호 타입 (이 중 하나는 있어야 후보로 인정)
    const TOURISM_POS = ['tourist_attraction','museum','art_gallery','park','natural_feature','zoo','aquarium','amusement_park','stadium',
      'place_of_worship','church','hindu_temple','mosque','synagogue','monument','historical_landmark','landmark']
    // 2-opt: NN 경로의 교차(지그재그) 제거
    const twoOpt = (route) => {
      if (route.length < 4) return route
      const dist = (a, b) => haversine(a._lat, a._lng, b._lat, b._lng)
      const len = (r) => { let s = 0; for (let i = 0; i < r.length - 1; i++) s += dist(r[i], r[i + 1]); return s }
      let best = route, improved = true, guard = 0
      while (improved && guard++ < 50) {
        improved = false
        for (let i = 1; i < best.length - 1; i++) {
          for (let k = i + 1; k < best.length; k++) {
            const nr = [...best.slice(0, i), ...best.slice(i, k + 1).reverse(), ...best.slice(k + 1)]
            if (len(nr) < len(best) - 1e-9) { best = nr; improved = true }
          }
        }
      }
      return best
    }
    const orderRoute = (items, sLat, sLng) => twoOpt(sortByProximity(items, sLat, sLng))
    const routeTotalMin = (items, sLat, sLng) => {
      const seq = orderRoute(items, sLat, sLng)
      let total = 0
      for (let i = 0; i < seq.length; i++) { total += (seq[i].dwell || 60); if (i > 0) total += travelMin(seq[i - 1], seq[i]) }
      return total
    }
    // 간단 k-means (k=일수) — 다일정 도시를 지역 구역으로 분할
    const kmeans = (pts, k) => {
      if (pts.length <= k) return pts.map(p => [p])
      let cent = pts.slice(0, k).map(p => [p._lat, p._lng])
      const asn = new Array(pts.length).fill(0)
      for (let it = 0; it < 20; it++) {
        let changed = false
        pts.forEach((p, i) => {
          let md = Infinity, mi = 0
          cent.forEach((c, ci) => { const d = haversine(p._lat, p._lng, c[0], c[1]); if (d < md) { md = d; mi = ci } })
          if (asn[i] !== mi) { asn[i] = mi; changed = true }
        })
        cent = cent.map((c, ci) => { const g = pts.filter((_, i) => asn[i] === ci); return g.length ? [g.reduce((s, p) => s + p._lat, 0) / g.length, g.reduce((s, p) => s + p._lng, 0) / g.length] : c })
        if (!changed) break
      }
      const cl = Array.from({ length: k }, () => [])
      pts.forEach((p, i) => cl[asn[i]].push(p))
      return cl.filter(c => c.length)
    }

    // 하루치 구성: 품질순 그리디 + 카테고리 다양성(≤2) + 예산 컷 + 2-opt 동선 + 시간표
    const buildDay = (pool, cityLat, cityLng) => {
      const sorted = [...pool].sort((a, b) => b._q - a._q)
      const picked = [], catCount = {}
      while (sorted.length > 0) {
        if (picked.length >= _count) break                                // 장소 수 우선(A) — 목표 개수 도달 시 종료
        const cand = sorted.shift()
        if ((catCount[cand.cat] || 0) >= 2 && sorted.length > 0) continue // 같은 카테고리 하루 2개까지
        picked.push(cand); catCount[cand.cat] = (catCount[cand.cat] || 0) + 1
      }
      // 동선 확정 + 시간표(09:00 기준 도착 오프셋) 계산
      let ordered = orderRoute(picked, cityLat, cityLng)
      let clock = 0
      ordered = ordered.map((it, i) => {
        if (i > 0) clock += Math.round(travelMin(ordered[i - 1], it))
        const eta = clock
        clock += (it.dwell || 60)
        const { _lat, _lng, _q, ...rest } = it
        return { ...rest, etaMin: eta, addedAt: Date.now() }
      })
      return { items: ordered, endMin: clock }
    }

    // 도시 한 곳의 관광지 수집 (핫플만, 품질점수·중복·노이즈 정리)
    const collectAttractions = async (cityObj) => {
      const cityKey = cityObj.name || cityObj._koName
      const cityLat = cityObj.lat, cityLng = cityObj.lng
      const hs = await fetchHotspotsFor(cityObj)
      const seen = new Set()
      const attractions = []
      hs.forEach(p => {
        const types = p.types || []
        if (types.some(t => JUNK.includes(t))) return                      // 노이즈(상가·식당·역 등) 제거
        if (!types.some(t => TOURISM_POS.includes(t))) return              // 관광 신호 없는 잡 POI 제거
        const key = p.place_id || (p.name || '').toLowerCase().replace(/\s+/g, '')
        if (seen.has(key)) return; seen.add(key)                           // 중복 제거
        const cat = catOf(types)
        const landmarkBonus = types.some(t => ['tourist_attraction','historical_landmark','monument'].includes(t)) ? 1.3 : 1
        attractions.push({
          source: 'hotspot', name: p.name, displayName: p.name,
          cityName: cityKey, cityDisplayName: getCityName(cityKey),
          rating: p.rating || 4.0, reviews: p.user_ratings_total || 0, place_id: p.place_id, vicinity: p.vicinity,
          lat: cityLat, lng: cityLng, _lat: p.geometry?.location?.lat || cityLat, _lng: p.geometry?.location?.lng || cityLng,
          cat, dwell: dwellByCat[cat] || 30, _q: qScore(p.rating, p.user_ratings_total) * landmarkBonus,
          emoji: '📍', photo_ref: p.photos?.[0]?.photo_reference || null
        })
      })
      attractions.sort((a, b) => b._q - a._q)
      return { cityKey, cityLat, cityLng, attractions }
    }

    // 1) 도시 동선 정렬 (가까운 순, 첫 도시 기준 nearest neighbor)
    let orderedCities = [..._cities]
    if (orderedCities.length > 1) {
      const sorted = []
      const remaining = orderedCities.map(x => ({ ...x, _lat: x.city.lat, _lng: x.city.lng }))
      let cur = remaining.shift()
      sorted.push(cur)
      while (remaining.length > 0) {
        let minD = Infinity, minI = 0
        remaining.forEach((r, i) => {
          const d = haversine(cur._lat, cur._lng, r._lat, r._lng)
          if (d < minD) { minD = d; minI = i }
        })
        cur = remaining.splice(minI, 1)[0]
        sorted.push(cur)
      }
      orderedCities = sorted
    }

    // 2) 도시별 날짜 채우기 — 다일정은 지역 클러스터링(하루=한 구역)
    const days = []
    for (const { city, days: cityDays } of orderedCities) {
      let { cityLat, cityLng, attractions } = await collectAttractions(city)
      // 테마 필터: 후보가 충분하면(>=장소수) 테마 카테고리만, 부족하면 전체 유지
      if (_theme) { const cats = themeToCats(_theme); if (cats) { const f = attractions.filter(a => cats.includes(a.cat)); if (f.length >= _count) attractions = f } }
      if (attractions.length === 0) { days.push({ items: [], endMin: 0 }); continue }
      if (cityDays <= 1) {
        days.push(buildDay(attractions, cityLat, cityLng))
      } else {
        const clusters = kmeans(attractions, cityDays)
        if (clusters.length >= cityDays) {
          // 클러스터 중심을 도시 순서대로 NN 정렬해 날짜에 매핑
          const cl = clusters.map(c => ({ c, _lat: c.reduce((s, p) => s + p._lat, 0) / c.length, _lng: c.reduce((s, p) => s + p._lng, 0) / c.length }))
          orderRoute(cl, cityLat, cityLng).forEach(o => days.push(buildDay(o.c, cityLat, cityLng)))
        } else {
          // 클러스터 부족 시: 품질순 균등분배 (빈 날 방지)
          const per = Math.ceil(attractions.length / cityDays)
          for (let d = 0; d < cityDays; d++) {
            const slice = attractions.slice(d * per, (d + 1) * per)
            if (slice.length) days.push(buildDay(slice, cityLat, cityLng))
          }
        }
      }
    }

    // 가이드 모드: 코스 days만 반환 (플래너에 로드하지 않음)
    if (opts?.returnDays) return days
    // 3) 플래너에 로드 + 자동 저장
    saveCourseDays(days)
    setCourseTransport(_transport)
    setActiveDayTab(0)
    setShowAiModal(false)
    setShowCoursePlanner(true)
    setCourseSource('ai')
    setAiGenerating(false)
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
      const ti = (activeDayTab >= 0 && activeDayTab < days.length) ? activeDayTab : days.length - 1
      days[ti].items.push(newItem)
      setCourseDays(days); localStorage.setItem('atlas_course_days', JSON.stringify(days))
    } else {
      const days = [{ items: [newItem] }]
      setCourseDays(days); localStorage.setItem('atlas_course_days', JSON.stringify(days))
    }
    // 플래너 자동 표시 (모바일은 도시 패널 유지하며 연속 담기 → '코스 보기' 버튼으로 진입)
    if (!isMobile) setShowCoursePlanner(true)
    setCourseSource('manual')
  }
  const isInCourse = (name, source) => courseItems.some(c => c.name === name && c.source === source)

  // 코스 → 구글지도 길찾기 URL로 열기 (경유지 번호순, 이동수단=courseTransport). 구글에서 노선·교통편 표시
  const openCourseInGmaps = (items) => {
    const pts = (items || []).filter(it => it && (it.name || it.place_id))
    if (pts.length === 0) return
    // 좌표 대신 장소명(+도시) 텍스트로 — 구글이 자기 DB에서 찾음. place_id 있으면 정확히 지정
    const label = it => encodeURIComponent(`${it.displayName || it.name || ''} ${it.cityDisplayName || ''}`.trim())
    const origin = pts[0], destination = pts[pts.length - 1]
    const mids = pts.slice(1, -1).slice(0, 9)   // 구글 경유지 최대 9개
    const mode = courseTransport || 'transit'
    let url = `https://www.google.com/maps/dir/?api=1&origin=${label(origin)}&destination=${label(destination)}&travelmode=${mode}`
    if (mids.length) url += `&waypoints=${mids.map(label).join('|')}`
    // place_id로 정확히 지정 (있는 것만; 경유지는 전부 있을 때만 — 1:1 정렬 필요)
    if (origin.place_id) url += `&origin_place_id=${origin.place_id}`
    if (destination.place_id) url += `&destination_place_id=${destination.place_id}`
    if (mids.length && mids.every(it => it.place_id)) url += `&waypoint_place_ids=${mids.map(it => it.place_id).join('|')}`
    window.open(url, '_blank')
  }

  // 코스 플래너 helpers
  const saveCourseDays = (days) => {
    setCourseDays(days); localStorage.setItem('atlas_course_days', JSON.stringify(days))
    const flat = days.flatMap(d => d.items); saveCourse(flat)
  }
  // 현재 Day 동선 최적화 (A방식): 도시별 그룹 → 도시 내부 nearest-neighbor + 2-opt → 시간표 재계산
  // 여러 도시가 섞여도 도시 내부에서만 정렬(도시 넘나드는 동선 방지). AI 코스 알고리즘 재활용
  const optimizeDay = (dayIndex) => {
    const day = courseDays[dayIndex]
    if (!day || (day.items || []).length < 2) return
    const speedKmh = courseTransport === 'walking' ? 4.5 : courseTransport === 'driving' ? 25 : 18
    const xy = (it) => [it._lat ?? it.lat, it._lng ?? it.lng]
    const dist = (a, b) => { const [a1, a2] = xy(a), [b1, b2] = xy(b); return haversine(a1, a2, b1, b2) }
    const routeLen = (r) => { let s = 0; for (let i = 0; i < r.length - 1; i++) s += dist(r[i], r[i + 1]); return s }
    const twoOpt = (route) => {
      if (route.length < 4) return route
      let best = route, improved = true, guard = 0
      while (improved && guard++ < 60) {
        improved = false
        for (let i = 1; i < best.length - 1; i++) for (let k = i + 1; k < best.length; k++) {
          const nr = [...best.slice(0, i), ...best.slice(i, k + 1).reverse(), ...best.slice(k + 1)]
          if (routeLen(nr) < routeLen(best) - 1e-9) { best = nr; improved = true }
        }
      }
      return best
    }
    const nn = (g, startIdx) => {
      const rem = [...g]
      const sorted = [rem.splice(startIdx, 1)[0]]
      let cur = sorted[0]
      while (rem.length) { let md = Infinity, mi = 0; rem.forEach((it, i) => { const d = dist(cur, it); if (d < md) { md = d; mi = i } }); cur = rem.splice(mi, 1)[0]; sorted.push(cur) }
      return sorted
    }
    // 모든 시작점에서 NN+2-opt 돌려 가장 짧은 동선 선택 (1번 고정 안 함 — 전체 최단)
    const bestRoute = (g) => {
      if (g.length <= 2) return g
      let best = null, bestLen = Infinity
      for (let s = 0; s < g.length; s++) {
        const r = twoOpt(nn(g, s))
        const l = routeLen(r)
        if (l < bestLen) { bestLen = l; best = r }
      }
      return best
    }
    const order = []; const groups = {}
    let optimized = []
    if (day.hotel && day.hotel.lat != null) {
      // 숙소를 시작점으로 고정 → 숙소에서 가까운 순으로 관광지 정렬 (숙소 노드는 결과에서 제외)
      const h = { _lat: day.hotel.lat, _lng: day.hotel.lng, lat: day.hotel.lat, lng: day.hotel.lng, __hotel: true }
      const seq = twoOpt(nn([h, ...day.items], 0))
      optimized = seq.filter(x => !x.__hotel)
    } else {
      for (const it of day.items) { const k = it.cityName || '__'; if (!groups[k]) { groups[k] = []; order.push(k) } groups[k].push(it) }
      for (const k of order) optimized = optimized.concat(bestRoute(groups[k]))
    }
    // 시간표(etaMin) 재계산 — 누적 이동시간(도로보정 1.35) + 체류시간
    let clock = 0
    const finalItems = optimized.map((it, i) => {
      if (i > 0) clock += Math.round((dist(optimized[i - 1], it) * 1.35 / speedKmh) * 60)
      const eta = clock; clock += (it.dwell || 60)
      return { ...it, etaMin: eta }
    })
    saveCourseDays(courseDays.map((d, i) => i === dayIndex ? { ...d, items: finalItems } : d))
    setActiveDayTab(dayIndex)
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
    days.splice(dayIdx, 1)               // 그 날을 장소까지 통째로 삭제
    saveCourseDays(days)                 // 빈 코스면 courseItems도 비워짐 → 체크(✓) 해제
    if (activeDayTab >= days.length) setActiveDayTab(Math.max(0, days.length - 1))
  }
  // 드래그 중 스크롤 영역 상/하단 가장자리에서 자동 스크롤
  const handleDragAutoScroll = (e) => {
    e.preventDefault()
    const el = scrollAreaRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const edge = 72
    const y = e.clientY
    dragScrollDirRef.current = y < rect.top + edge ? -1 : y > rect.bottom - edge ? 1 : 0
    if (dragScrollDirRef.current !== 0 && !autoScrollRef.current) {
      autoScrollRef.current = setInterval(() => {
        if (scrollAreaRef.current && dragScrollDirRef.current !== 0) scrollAreaRef.current.scrollTop += dragScrollDirRef.current * 9
      }, 16)
    } else if (dragScrollDirRef.current === 0 && autoScrollRef.current) {
      clearInterval(autoScrollRef.current); autoScrollRef.current = null
    }
  }
  const stopDragAutoScroll = () => {
    if (autoScrollRef.current) { clearInterval(autoScrollRef.current); autoScrollRef.current = null }
    dragScrollDirRef.current = 0
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
  // 숙소 설정 시 Day 동선 = 숙소 → 관광지들 → 숙소 (앞뒤 숙소 구간 추가). 미설정이면 관광지만
  const courseSeq = (day) => {
    const its = (day?.items || []).filter(it => it && (it.name || it.place_id))
    if (day?.hotel && (day.hotel.place_id || day.hotel.name) && day.hotel.lat != null) return [day.hotel, ...its, day.hotel]
    return its
  }

  const fetchAllRoutes = async (days, mode) => {
    setLoadingRoutes(true)
    const results = {}; const fetches = []
    days.forEach(day => {
      const seq = courseSeq(day)
      for (let i = 0; i < seq.length - 1; i++) {
        const key = getRouteKey(seq[i], seq[i + 1], mode)
        if (!routeCache[key] && !fetches.some(f => f.key === key)) {
          fetches.push({ key, o: getDirQuery(seq[i]), d: getDirQuery(seq[i + 1]) })
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
  // 추천 제외 관광지 목록 로드 (1회)
  useEffect(() => {
    getExcludedAttractions().then(ids => setExcludedIds(new Set(ids))).catch(() => {})
    getCompletedCities().then(cs => setCompletedCities(new Set(cs))).catch(() => {})
  }, [])

  useEffect(() => {
    if (showCoursePlanner && courseDays.length > 0) {
      const hasUncached = courseDays.some(day => {
        const seq = courseSeq(day)
        for (let i = 0; i < seq.length - 1; i++) {
          if (!routeCache[getRouteKey(seq[i], seq[i + 1], courseTransport)]) return true
        }
        return false
      })
      if (hasUncached) fetchAllRoutes(courseDays, courseTransport)
    }
  }, [showCoursePlanner, courseDays, courseTransport])

  // 코스 플래너가 닫히거나 선택 도시가 없어지면 책넘기기 상태 해제
  useEffect(() => { if (!showCoursePlanner || !selectedCity) setCityPeek(false) }, [showCoursePlanner, selectedCity])

  // 스와이프 안내: x 누르기 전까지 매번 표시, x 누르면 영구 숨김
  useEffect(() => {
    if (isMobile && showCoursePlanner && selectedCity) {
      try { setShowSwipeHint(!localStorage.getItem('atlas_swipe_hint_v3')) } catch { setShowSwipeHint(true) }
    } else {
      setShowSwipeHint(false)
    }
  }, [isMobile, showCoursePlanner, selectedCity])

  // 언어 변경 시 경로 캐시 초기화 (Directions API 응답 언어가 다름)
  useEffect(() => { setRouteCache({}) }, [lang])

  // 페이지 첫 터치 감지 → 호버 영구 비활성화 (브라우저 (hover:hover) 오보고 우회)
  useEffect(() => {
    const onFirstTouch = () => { hasTouchedRef.current = true }
    document.addEventListener('touchstart', onFirstTouch, { once: true, passive: true })
    return () => { document.removeEventListener('touchstart', onFirstTouch) }
  }, [])

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
  const totalCities = Object.values(COUNTRY_CITIES).flat().length
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
        // 도시 닫을 때 줌아웃 제거 — 줌 유지하면서 옆 도시 바로 탭 가능하게
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
  // 추천 여행시기 "Mar–May" / "Mar–May, Sep–Nov" → "3월~5월" 등 (en일 땐 원본 유지)
  const translateBestSeason = (s) => {
    if (!s || lang === 'en') return s
    const M = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 }
    const suf = lang === 'ko' ? '월' : '月'
    return s.replace(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/g, m => M[m] + suf).replace(/[–—-]/g, '~')
  }
  // 국가정보 패널 라인 아이콘 (골드)
  const InfoIcon = ({ type, color = '#c9a86a', size = 15 }) => {
    const P = {
      capital: <><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/></>,
      pop: <><circle cx="9" cy="7" r="3"/><path d="M2.5 21v-1.5A4 4 0 0 1 6.5 15.5h2M15 7a3 3 0 0 1 0 6M21.5 21v-1.5a4 4 0 0 0-3-3.87"/></>,
      area: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></>,
      lang: <><path d="M21 14a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/></>,
      currency: <><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/></>,
      timezone: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
      season: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></>,
      continent: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
      voltage: <><path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12z"/></>,
      callCode: <><path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.8 2 2 0 0 1 3.1 1.6h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L7.1 9.3a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2z"/></>,
      drive: <><path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13M5 13h14v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><circle cx="7.5" cy="16" r=".6"/><circle cx="16.5" cy="16" r=".6"/></>,
      cityCount: <><rect x="3" y="8" width="7" height="13" rx="1"/><rect x="12" y="3" width="9" height="18" rx="1"/><path d="M6 12h1M6 16h1M15.5 7h2M15.5 11h2M15.5 15h2"/></>,
      police: <><path d="M12 22s7-3.5 7-9V5.5l-7-2.5-7 2.5V13c0 5.5 7 9 7 9z"/><path d="M12 8.3l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"/></>,
      ambulance: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/></>,
      fire: <><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></>,
      tourist: <><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></>,
    }
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>{P[type]}</svg>
  }
  // 라벨 게이팅 1회 강제 적용 (첫 상호작용 전에도 줌/시야각 기준 라벨 정리)
  // 라벨 가시성: 도시는 유명도 단계(cityTier)별로 줌인하면 등장. 진입줌(cityEnterAltRef) 기준 상대값이라 나라별 진입 줌차 보정
  const computeLabelVis = (g, els, pov) => {
    const cLat = pov.lat * Math.PI / 180, cLng = pov.lng * Math.PI / 180
    // 국가 전환 이동 중이면 경유 줌이 아니라 '목표 줌'으로 판정 → 중간에 도시 라벨이 떴다 사라지는 깜빡임 방지
    const fly = countryFlyingRef.current
    const alt = fly.active ? fly.targetAlt : pov.altitude
    const maxA = Math.min(0.75, 0.35 + alt * 0.18)
    const enterAlt = cityEnterAltRef.current || 0.5
    const out = []
    els.forEach(el => {
      const la = parseFloat(el.dataset.lat) * Math.PI / 180, ln = parseFloat(el.dataset.lng) * Math.PI / 180
      const ang = Math.acos(Math.max(-1, Math.min(1, Math.sin(cLat) * Math.sin(la) + Math.cos(cLat) * Math.cos(la) * Math.cos(ln - cLng))))
      let altOk
      if (el.dataset.seaGate === '1') altOk = alt < 0.45
      else if (el.dataset.cityGated === '1') {
        const tier = el.dataset.cityTier === '2' ? 2 : 1
        altOk = alt < enterAlt * (tier === 2 ? 0.5 : 0.7)
      }
      else altOk = el.dataset.gated !== '1' || alt < 0.7   // 유명12개·국가명은 항상, 섬/작은나라는 alt<0.7
      out.push([el, ang < maxA && altOk])
    })
    return out
  }
  const forceGatingNow = () => {
    const g = globeRef.current, c = globeContainerRef.current
    if (!g || !c || typeof g.pointOfView !== 'function') return
    const vis = computeLabelVis(g, c.querySelectorAll('[data-lat]'), g.pointOfView())
    for (const [el, sh] of vis) {
      el.style.opacity = sh ? '1' : '0'
      if (el.dataset.micro === '1') el.style.pointerEvents = sh ? 'auto' : 'none'
    }
  }
  const getCityName = (koName) => {
    if (lang === 'ko') return koName
    const tr = CITY_I18N[koName]
    if (!tr) return koName
    if (lang === 'en') return tr[0] || koName
    if (lang === 'ja') return tr[1] || koName
    if (lang === 'zh') return tr[2] || koName
    return koName
  }
  // 코스 아이템 동적 번역 (저장 시점 언어와 현재 언어가 다를 때)
  const getCourseItemName = (item) => {
    if (item.source === 'city') return getCityName(item.name || item.cityName)
    if (item.source === 'spot') {
      if (item.wikiTitle && lang !== 'ko') return item.wikiTitle
    }
    // hotspot/restaurant → 저장된 언어별 캐시 우선, 없으면 현재 로드된 데이터에서 place_id로 매칭
    if (item.nameI18n && item.nameI18n[lang]) return item.nameI18n[lang]
    if (item.place_id) {
      const current = hotspots.find(p => p.place_id === item.place_id)
      if (current?.name) return current.name
    }
    return item.displayName || item.name
  }
  const getCourseItemCity = (item) => getCityName(item.cityName || item.name)

  // 코스 핫플/맛집 이름 다국어 lazy 캐시(B방식): 현재 언어 이름이 없으면 place_id로 그 언어 결과를 받아 nameI18n에 저장.
  // 한 번 받으면 캐시되어 언어 바꿔도 재호출 없음.
  useEffect(() => {
    const targets = courseItems.filter(it => it.place_id && (it.source === 'hotspot' || it.source === 'restaurant') && !(it.nameI18n && it.nameI18n[lang]))
    if (targets.length === 0) return
    let cancelled = false
    const langParam = lang === 'zh' ? 'zh-CN' : lang
    let nameCache = {}
    try { nameCache = JSON.parse(localStorage.getItem('atlas_name_i18n') || '{}') } catch {}
    ;(async () => {
      const resolved = {}
      let cacheUpdated = false
      for (const it of targets) {
        if (nameCache[it.place_id] && nameCache[it.place_id][lang]) { resolved[it.place_id] = nameCache[it.place_id][lang]; continue }  // 번역 캐시 우선 → 재검색 0회
        try {
          const q = it.displayName || it.name
          const r = await fetch(`/api/places?query=${encodeURIComponent(q)}&lat=${it.lat}&lng=${it.lng}&language=${langParam}`)
          const d = await r.json()
          const hit = (d.results || []).find(p => p.place_id === it.place_id)  // place_id 정확 매칭만 (오번역 방지)
          if (hit?.name) { resolved[it.place_id] = hit.name; nameCache[it.place_id] = { ...(nameCache[it.place_id] || {}), [lang]: hit.name }; cacheUpdated = true }
        } catch {}
      }
      if (cacheUpdated) { try { localStorage.setItem('atlas_name_i18n', JSON.stringify(nameCache)) } catch {} }
      if (cancelled || Object.keys(resolved).length === 0) return
      const apply = (arr) => arr.map(it => (it.place_id && resolved[it.place_id]) ? { ...it, nameI18n: { ...(it.nameI18n || {}), [lang]: resolved[it.place_id] } } : it)
      setCourseItems(prev => { const n = apply(prev); localStorage.setItem('atlas_course', JSON.stringify(n)); return n })
      setCourseDays(prev => { const n = prev.map(day => ({ ...day, items: apply(day.items || []) })); localStorage.setItem('atlas_course_days', JSON.stringify(n)); return n })
    })()
    return () => { cancelled = true }
  }, [courseItems, lang])

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
        if (item.wikiTitle) names[lg] = names[lg] || item.wikiTitle
        else names[lg] = names[lg] || item.name
      }
    } else {
      for (const lg of ['en','ja','zh']) names[lg] = names[lg] || item.displayName || item.name
    }
    return { names, cityNames: cityI18n }
  }

  const buildCourseI18n = (course) => {
    const tr = course.transport || courseTransport
    const newDays = (course.days || []).map(d => {
      const items = d.items || []
      return {
        ...d,
        items: items.map((it, i) => {
          const i18n = buildItemI18n(it)
          let legToNext = null
          if (items[i + 1]) { const r = routeCache[getRouteKey(it, items[i + 1], tr)]; if (r && !r.noRoute) legToNext = { distance: r.distance, duration: r.duration } }
          return { ...it, i18n: i18n.names, cityI18n: i18n.cityNames, legToNext }
        })
      }
    })
    return { ...course, days: newDays }
  }

  // 사용자 추천 코스 필터 (검색어 + 박일)
  const matchCommunityFilter = (sc) => {
    const days = sc.course?.days || sc.days || []
    if (communityDayFilter > 0) { if (communityDayFilter === 99 ? days.length < 4 : days.length !== communityDayFilter) return false }
    if (communitySearch.trim()) {
      const firstCityRaw = days.flatMap(d=>(d.items||[]).map(it=>it.cityName||it.name)).find(Boolean)
      let country = ''
      if (firstCityRaw) { const entry = Object.entries(COUNTRY_CITIES).find(([_,cs])=>Array.isArray(cs)&&cs.some(c=>c.name===firstCityRaw)); if (entry) country = entry[0] }
      const cities = days.flatMap(d=>(d.items||[]).map(it=>it.cityI18n?.[lang] || getCityName(it.cityName||it.name))).filter(Boolean)
      const hay = (cities.join(' ') + ' ' + (country?getCountryName(country):'')).toLowerCase()
      if (!hay.includes(communitySearch.trim().toLowerCase())) return false
    }
    return true
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

    // ── 색상 팔레트 ──
    const ACCENT = 'c8856a', NAVY = '0f172a', NAVY2 = '1e293b', MUTED = '94a3b8'

    // ── 표지 (밝은 페리윙클 테마) ──
    const COVER_BG = 'B4C7E7', COVER_DARK = '111827', COVER_SLATE = '334155', CARD_FILL = 'D6D6D6', CARD_BORDER = 'AEB6C4', OV_TEXT = '1F2937'
    const cover = pptx.addSlide()
    cover.background = { color: COVER_BG }
    cover.addText('ATLAS', { x: 0.7, y: 1.05, w: 10, fontSize: 13, color: ACCENT, fontFace: 'Arial', bold: true, charSpacing: 14 })
    cover.addText(cityNames.join('  ·  '), { x: 0.7, y: 1.55, w: 11.8, h: 1.3, fontSize: 38, color: COVER_DARK, fontFace: 'Arial', bold: true, lineSpacingMultiple: 1.1, valign: 'top' })
    cover.addText(lang==='ko'?'여행 일정표':'Travel Itinerary', { x: 0.72, y: 2.95, w: 10, fontSize: 17, color: COVER_SLATE, fontFace: 'Arial' })

    // 통계 카드 3개
    const stats = [
      { label: lang==='ko'?'기간':'DURATION', value: dateRange || `${courseDays.length} ${lang==='ko'?'일':'days'}` },
      { label: lang==='ko'?'장소':'PLACES', value: `${courseItems.length} ${lang==='ko'?'곳':'spots'}` },
      { label: lang==='ko'?'이동수단':'TRANSPORT', value: transportLabel },
    ]
    const cardW = 3.7, cardGap = 0.3, cardY = 3.75, cardH = 1.05
    stats.forEach((s, i) => {
      const cx = 0.7 + i * (cardW + cardGap)
      cover.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: cx, y: cardY, w: cardW, h: cardH, fill: { color: CARD_FILL }, line: { color: CARD_BORDER, width: 0.5 }, rectRadius: 0.08 })
      cover.addText([
        { text: s.label, options: { fontSize: 9, color: ACCENT, bold: true, charSpacing: 2, breakLine: true } },
        { text: s.value, options: { fontSize: 14, color: COVER_DARK, bold: true } },
      ], { x: cx, y: cardY, w: cardW, h: cardH, align: 'center', valign: 'middle', fontFace: 'Arial', lineSpacingMultiple: 1.3 })
    })

    // 전체 일정 한눈에 보기 (최대 6일) — 헤딩+줄을 한 박스로 (겹침 방지)
    const ovY = cardY + cardH + 0.4
    const ovLines = courseDays.slice(0, 6).map((day, di) => {
      const cs = [...new Set(day.items.map(i => getCourseItemCity(i)))].join(', ')
      const dt = courseTripStart ? formatDate(getDayDate(di)) : ''
      return `Day ${di + 1}    ${dt ? dt + '    ' : ''}${cs}`
    })
    if (courseDays.length > 6) ovLines.push(`+ ${courseDays.length - 6} ${lang==='ko'?'일 더':'more days'}`)
    const ovRuns = [
      { text: lang==='ko'?'전체 일정':'ITINERARY', options: { fontSize: 10, color: COVER_SLATE, bold: true, charSpacing: 2, breakLine: true } },
      { text: '', options: { fontSize: 6, breakLine: true } },
      ...ovLines.map(l => ({ text: l, options: { fontSize: 11, color: OV_TEXT, breakLine: true } })),
    ]
    cover.addText(ovRuns, { x: 0.72, y: ovY, w: 12, h: 2.3, fontFace: 'Arial', valign: 'top', lineSpacingMultiple: 1.4 })

    cover.addText('ATLAS World Travel Explorer', { x: 0.7, y: 7.12, w: 10, fontSize: 9, color: '475569', fontFace: 'Arial' })

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

      // 그 날 도시 (단일이면 헤더에 표시 + 표에서 도시 컬럼 생략)
      const dayCities = [...new Set(day.items.map(i => getCourseItemCity(i)))]
      const singleCity = dayCities.length === 1
      slide.addText([
        { text: `Day ${di + 1}`, options: { fontSize: 24, color: 'c8856a', bold: true } },
        ...(singleCity ? [{ text: `    ${dayCities[0]}`, options: { fontSize: 15, color: '1a1714', bold: true } }] : []),
      ], { x: 0.6, y: 0.12, w: 8, h: 0.65, fontFace: 'Arial', valign: 'middle' })

      const headerRight = []
      if (courseTripStart) headerRight.push(formatDate(getDayDate(di)))
      headerRight.push(`${day.items.length} ${lang==='ko'?'곳':'places'}`)
      if (totalStr) headerRight.push(totalStr)
      slide.addText(headerRight.join('   ·   '), { x: 6.5, y: 0.12, w: 6.2, h: 0.65, fontSize: 11, color: '1F2937', fontFace: 'Arial', align: 'right', valign: 'middle' })

      // 테이블 — 행 높이를 장소 수에 맞게 자동 조절
      const itemCount = day.items.length
      const maxH = 6.2 // 테이블 최대 높이
      const headerH = 0.32
      const rowH = Math.min(0.6, Math.max(0.35, (maxH - headerH) / itemCount))

      const hOpt = { fill: { color: ACCENT }, color: 'FFFFFF', bold: true, fontSize: 9, valign: 'middle' }
      const rows = []
      rows.push([
        { text: '#', options: { ...hOpt, align: 'center' } },
        { text: lang==='ko'?'장소':'Place', options: { ...hOpt } },
        ...(singleCity ? [] : [{ text: lang==='ko'?'도시':'City', options: { ...hOpt } }]),
        { text: lang==='ko'?'별점':'Rating', options: { ...hOpt, align: 'center' } },
        { text: lang==='ko'?'다음 이동':'To Next', options: { ...hOpt, align: 'center' } },
      ])

      day.items.forEach((item, idx) => {
        const bgColor = idx % 2 === 0 ? 'FFFFFF' : 'faf8f5'
        const fs = itemCount > 8 ? 9 : 11

        let routeText = '—'
        if (idx < day.items.length - 1) {
          const rk = getRouteKey(day.items[idx], day.items[idx + 1], courseTransport)
          const route = routeCache[rk]
          if (route && !route.noRoute) routeText = `${route.duration}  ·  ${route.distance}`
        }

        rows.push([
          { text: `${idx + 1}`, options: { fill: { color: bgColor }, color: ACCENT, bold: true, fontSize: fs, align: 'center', valign: 'middle' } },
          { text: getCourseItemName(item), options: { fill: { color: bgColor }, color: '1a1714', bold: true, fontSize: fs, valign: 'middle' } },
          ...(singleCity ? [] : [{ text: getCourseItemCity(item), options: { fill: { color: bgColor }, color: '1F2937', fontSize: fs - 1, valign: 'middle' } }]),
          { text: item.rating ? `★ ${item.rating}` : '-', options: { fill: { color: bgColor }, color: item.rating ? 'b45309' : '94a3b8', fontSize: fs - 1, align: 'center', bold: !!item.rating, valign: 'middle' } },
          { text: routeText, options: { fill: { color: bgColor }, color: '1F2937', fontSize: itemCount > 8 ? 7 : 8, align: 'center', valign: 'middle' } },
        ])
      })

      slide.addTable(rows, {
        x: 0.4, y: 1.05, w: 12.5,
        border: { type: 'solid', pt: 0.5, color: 'e8e2d8' },
        colW: singleCity ? [0.5, 7.4, 1.4, 3.2] : [0.5, 5.6, 2.8, 1.2, 2.4],
        rowH: [headerH, ...day.items.map(() => rowH)],
        fontFace: 'Arial',
        valign: 'middle',
        autoPage: false,
      })

      // 하단 워터마크 + 페이지
      slide.addText('ATLAS World Travel Explorer', { x: 0.5, y: 7.05, w: 8, fontSize: 8, color: 'b0a89e', fontFace: 'Arial' })
      slide.addText(`Day ${di + 1} / ${courseDays.length}`, { x: 9, y: 7.05, w: 3.8, fontSize: 8, color: 'b0a89e', fontFace: 'Arial', align: 'right' })
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

  // 50m 국경선 로드 → pathsData용 선 좌표로 변환 (정밀 국경선, 면 아님 / 클릭 판정은 110m 폴리곤이 담당)
  useEffect(() => {
    const validRing = (ring) => {
      if (!ring || ring.length < 4) return false
      const lngs = ring.map(c => c[0])
      return (Math.max(...lngs) - Math.min(...lngs)) <= 180
    }
    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson')
      .then(r => r.json())
      .then(data => {
        const paths = []
        data.features.forEach(feat => {
          const name = feat.properties?.NAME
          const geom = feat.geometry
          if (!geom) return
          const polys = geom.type === 'Polygon' ? [geom.coordinates]
            : geom.type === 'MultiPolygon' ? geom.coordinates : []
          polys.forEach(poly => poly.forEach(ring => {
            if (!validRing(ring)) return
            paths.push({ name, coords: ring.map(c => [c[1], c[0]]) })  // [lat,lng]
          }))
        })
        console.log('[ATLAS] Loaded', paths.length, 'border paths (50m)')
        setBorderPaths(paths)
      })
      .catch(err => console.error('[ATLAS] Border load failed:', err))
  }, [])

  // Init Globe with ESRI satellite tile engine (Google Earth급 해상도)
  useEffect(() => {
    if (globeRef.current || !globeContainerRef.current) return

    // three-globe 호버 툴팁(마우스 따라다니는 검은 박스) 영구 숨김 — 클래스 기반 글로벌 CSS
    if (!document.getElementById('atlas-hide-globe-tooltip')) {
      const stl = document.createElement('style')
      stl.id = 'atlas-hide-globe-tooltip'
      stl.textContent = '.float-tooltip-kap{display:none !important;}'
      document.head.appendChild(stl)
    }
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
      const g = globeRef.current
      const pov = g.pointOfView()
      // POV가 직전 틱과 동일하면(정지 상태) 통째로 스킵 — idle 비용 0
      const povKey = `${pov.lat.toFixed(3)},${pov.lng.toFixed(3)},${pov.altitude.toFixed(3)}`
      if (povKey === lastPovKeyRef.current && labelCacheRef.current.settled) return
      lastPovKeyRef.current = povKey

      const container = globeContainerRef.current
      if (!container) return
      // 라벨 DOM 목록만 ~1초 캐시(노드는 안 변함). 좌표·충돌은 매 틱 재계산해야 줌/회전 반영됨
      const cache = labelCacheRef.current
      const now = performance.now()
      if (now - cache.t > 1000 || !cache.els || cache.els.length === 0) {
        cache.els = container.querySelectorAll('[data-lat]')
        cache.t = now
      }
      if (!cache.els || !cache.els.length) return
      const vis = computeLabelVis(g, cache.els, pov)
      for (const [el, show] of vis) {
        if (!el.dataset.tInit) { el.style.transition = 'opacity 0.3s'; el.dataset.tInit = '1' }
        const next = show ? '1' : '0'
        if (el.style.opacity !== next) el.style.opacity = next
        if (el.dataset.micro === '1') {
          const pe = show ? 'auto' : 'none'
          if (el.style.pointerEvents !== pe) el.style.pointerEvents = pe
        }
      }
      cache.settled = true
    }
    const labelInterval = setInterval(hideBackLabels, 150)

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
  // 바다/만 — 줌인 시에만 표시 (gated)
  const SEA_LABELS = [
    { lat:35, lng:18, _type:'sea', name: lang==='ko'?'지중해':lang==='ja'?'地中海':lang==='zh'?'地中海':'Mediterranean Sea' },
    { lat:43, lng:34, _type:'sea', name: lang==='ko'?'흑해':lang==='ja'?'黒海':lang==='zh'?'黑海':'Black Sea' },
    { lat:35, lng:123, _type:'sea', name: lang==='ko'?'황해':lang==='ja'?'黄海':lang==='zh'?'黄海':'Yellow Sea' },
    { lat:20, lng:38, _type:'sea', name: lang==='ko'?'홍해':lang==='ja'?'紅海':lang==='zh'?'红海':'Red Sea' },
    { lat:15, lng:-75, _type:'sea', name: lang==='ko'?'카리브해':lang==='ja'?'カリブ海':lang==='zh'?'加勒比海':'Caribbean Sea' },
    { lat:13, lng:114, _type:'sea', name: lang==='ko'?'남중국해':lang==='ja'?'南シナ海':lang==='zh'?'南海':'South China Sea' },
    { lat:58, lng:20, _type:'sea', name: lang==='ko'?'발트해':lang==='ja'?'バルト海':lang==='zh'?'波罗的海':'Baltic Sea' },
    { lat:15, lng:64, _type:'sea', name: lang==='ko'?'아라비아해':lang==='ja'?'アラビア海':lang==='zh'?'阿拉伯海':'Arabian Sea' },
    { lat:42, lng:51, _type:'sea', name: lang==='ko'?'카스피해':lang==='ja'?'カスピ海':lang==='zh'?'里海':'Caspian Sea' },
    { lat:56, lng:3, _type:'sea', name: lang==='ko'?'북해':lang==='ja'?'北海':lang==='zh'?'北海':'North Sea' },
    { lat:40, lng:134, _type:'sea', name: lang==='ko'?'동해':lang==='ja'?'東海':lang==='zh'?'东海':'East Sea' },
    { lat:14, lng:89, _type:'sea', name: lang==='ko'?'벵골만':lang==='ja'?'ベンガル湾':lang==='zh'?'孟加拉湾':'Bay of Bengal' },
    { lat:25, lng:-90, _type:'sea', name: lang==='ko'?'멕시코만':lang==='ja'?'メキシコ湾':lang==='zh'?'墨西哥湾':'Gulf of Mexico' },
    { lat:38, lng:25, _type:'sea', name: lang==='ko'?'에게해':lang==='ja'?'エーゲ海':lang==='zh'?'爱琴海':'Aegean Sea' },
    { lat:29, lng:125, _type:'sea', name: lang==='ko'?'동중국해':lang==='ja'?'東シナ海':lang==='zh'?'东中国海':'East China Sea' },
    { lat:53, lng:148, _type:'sea', name: lang==='ko'?'오호츠크해':lang==='ja'?'オホーツク海':lang==='zh'?'鄂霍次克海':'Sea of Okhotsk' },
    { lat:27, lng:51, _type:'sea', name: lang==='ko'?'페르시아만':lang==='ja'?'ペルシャ湾':lang==='zh'?'波斯湾':'Persian Gulf' },
    { lat:42, lng:16.8, _type:'sea', name: lang==='ko'?'아드리아해':lang==='ja'?'アドリア海':lang==='zh'?'亚得里亚海':'Adriatic Sea' },
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
        _hasCities: !!COUNTRY_CITIES[feat.properties.NAME],
      })).filter(d => (d.lat !== 0 || d.lng !== 0) && !HIDDEN_COUNTRY_LABELS.has(d.nameEn) && !ISLAND_NAMES.has(d.nameEn) && !ISLAND_NAMES_NORM.has(normCountryName(d.nameEn)))
      const islandLabels = ISLAND_LABEL_DATA.map(d => ({
        lat: d.lat,
        lng: d.lng,
        name: getCountryName(d.nameEn),
        nameEn: d.nameEn,
        _type: 'island',
        _hasCities: !!COUNTRY_CITIES[d.nameEn],
      }))
      // 하와이: 미국 영토지만 멀리 떨어진 섬 → 별도 라벨, 탭하면 미국 컨텍스트 세팅 후 하와이 도시 패널 진입
      const hawaiiLabel = {
        lat: 21.31, lng: -157.85,
        name: lang === 'ko' ? '하와이' : 'Hawaii',
        nameEn: 'Hawaii', _type: 'hawaii', _hasCities: true,
        _city: { name: '하와이', lat: 21.31, lng: -157.85, emoji: '', _koName: '하와이', countryEn: 'United States of America' },
      }
      // 괌: 폴리곤 없는 미국령 섬 → 섬 라벨로 추가(탭하면 Guam 도시뷰=괌·사이판 진입). _type='island'이라 기존 섬 탭 핸들러로 진입
      const guamLabel = {
        lat: 13.47, lng: 144.75,
        name: lang === 'ko' ? '괌' : 'Guam',
        nameEn: 'Guam', _type: 'island', _hasCities: true,
      }
      globe.htmlElementsData([...labelItems, ...islandLabels, hawaiiLabel, guamLabel, ...OCEAN_LABELS, ...SEA_LABELS])
      labelCacheRef.current.items = []; labelCacheRef.current.settled = false  // 새 라벨 즉시 줌-숨김 처리되게 캐시 리셋
      lastPovKeyRef.current = ''; labelCacheRef.current = { t: 0, items: [] } // 라벨 새로 생성됨 → idle스킵 해제 + 캐시 무효화
      setTimeout(forceGatingNow, 180); setTimeout(forceGatingNow, 550)  // 첫 상호작용 전에도 게이팅 적용
      return
    }

    const countryEn = selectedCountry.properties.NAME
    const cities = (COUNTRY_CITIES[countryEn] || []).map((c, idx) => ({ ...c, name: getCityName(c.name), _koName: c.name, countryEn, _type: 'city', cityGated: idx >= 12, cityTier: 1 }))
    const countryLabels = countries.map(feat => ({
      lat: feat.properties.LABEL_Y || 0,
      lng: feat.properties.LABEL_X || 0,
      name: getCountryName(feat.properties.NAME),
      nameEn: feat.properties.NAME,
      _type: 'country',
      _hasCities: !!COUNTRY_CITIES[feat.properties.NAME],
    })).filter(d => (d.lat !== 0 || d.lng !== 0) && d.nameEn !== countryEn && !HIDDEN_COUNTRY_LABELS.has(d.nameEn) && !ISLAND_NAMES.has(d.nameEn) && !ISLAND_NAMES_NORM.has(normCountryName(d.nameEn)))
    // 이웃 섬나라 라벨은 국가뷰에도 표시 (말레이시아 뷰에서 싱가포르 등) — 자기 나라 것만 제외
    const islandLabelsCV = ISLAND_LABEL_DATA.filter(d => d.nameEn !== countryEn).map(d => ({
      lat: d.lat, lng: d.lng, name: getCountryName(d.nameEn), nameEn: d.nameEn, _type: 'island', _hasCities: !!COUNTRY_CITIES[d.nameEn],
    }))
    globe.htmlElementsData([...countryLabels, ...cities, ...islandLabelsCV, ...OCEAN_LABELS, ...SEA_LABELS])
    lastPovKeyRef.current = ''; labelCacheRef.current = { t: 0, items: [] } // 라벨 새로 생성됨 → idle스킵 해제 + 캐시 무효화
    requestAnimationFrame(() => { forceGatingNow(); requestAnimationFrame(forceGatingNow) })  // DOM 생성 직후(~16ms) 즉시 게이팅 → 라벨 깜빡임 방지
    setTimeout(forceGatingNow, 180); setTimeout(forceGatingNow, 550)  // 첫 상호작용 전에도 게이팅 적용
    // selectedCity는 deps에서 제외: cities 배열이 selectedCity에 의존 안 하고,
    // 포함하면 도시 나갈 때 라벨 데이터가 재생성되어 줌아웃 중 라벨이 튐
  }, [selectedCountry, countries, lang])

  // selectedCity 변경 시 핫플레이스/맛집 데이터 로드
  useEffect(() => {
    if (selectedCity) {
      fetchPlacesData(selectedCity)
      setSidePanel(null)
      setFoodCulture(null)
      setActiveTab('hotspots')   // 새 도시 진입 시 항상 추천 관광지부터
      setSpotSearchQuery(''); setSpotSearchResults([])   // 장소 검색 초기화
      prefetchFoodCulture(selectedCity)   // 음식문화 미리 생성(백그라운드) → 탭 누를 때 즉시
    } else {
      setHotspots([])
      setActiveTab('hotspots')
    }
  }, [selectedCity, lang])




  // HTML 요소 렌더링
  useEffect(() => {
    if (!globeRef.current) return
    const globe = globeRef.current

    // 라벨 위에서 휠 줌이 막히는 문제 해결: 휠 이벤트를 globe 캔버스로 전달
    globe
      .htmlLat(d => d.lat)
      .htmlLng(d => d.lng)
      .htmlAltitude(d => d._type === 'ocean' ? 0.001 : d._type === 'geoline' ? 0.001 : d._type === 'sea' ? 0.001 : 0.0015)
      .htmlElement(d => {
        const el = document.createElement('div')
        el.dataset.lat = d.lat
        el.dataset.lng = d.lng
        // gated: 줌인 시에만 표시 (섬나라 + 작은 나라) / micro: 터치 핸들러 달린 섬나라(아래 pointer-events 토글 대상)
        if (d._type === 'island') { el.dataset.micro = '1'; if (d.nameEn !== 'Guam' && d.nameEn !== 'Singapore') el.dataset.gated = '1'
          // 자기 나라 국가뷰에선 국가 라벨 숨김 — 같은 좌표의 도시 라벨과 겹쳐 탭을 가로채고, 재클릭 판정(closeCountry)으로 줌아웃되는 버그 방지
          if (selectedCountry?.properties?.NAME === d.nameEn) { el.style.display = 'none'; el.style.pointerEvents = 'none' } }
        else if (d._type === 'country' && SMALL_COUNTRY.has(d.nameEn)) { el.dataset.gated = '1' }
        else if (d._type === 'sea') { el.dataset.seaGate = '1' }
        else if (d._type === 'city' && d.cityGated) { el.dataset.cityGated = '1'; el.dataset.cityTier = String(d.cityTier || 1) }

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
        } else if (d._type === 'sea') {
          el.style.cssText = 'pointer-events:none;'
          el.innerHTML = `<div style="
            transform:translate(-50%,-50%);
            font-family:Pretendard,Inter,sans-serif;
            font-size:11px;
            font-weight:600;
            font-style:italic;
            letter-spacing:3px;
            color:rgba(120,180,250,0.78);
            text-shadow:0 0 7px rgba(0,40,100,0.55);
            white-space:nowrap;
            user-select:none;
          ">${d.name}</div>`
        } else if (d._type === 'city') {
          el.dataset.cityname = d._koName || d.name   // 선택 강조 색 갱신용 식별자
          el.style.cssText = d.cityGated ? 'pointer-events:none;opacity:0;' : 'pointer-events:none;'  // 게이팅 대상은 숨김으로 시작(깜빡임 방지), 터치 투명 → 회전/줌 안 막힘
          const inner = document.createElement('div')
          inner.className = 'city-label-inner'
          inner.style.cssText = `
            transform:translate(-50%,-50%);
            font-family:Pretendard,Inter,system-ui,sans-serif;
            font-size:12px;
            font-weight:700;
            color:rgba(255,255,255,0.95);
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
        } else {
          const hasCities = d._hasCities ?? COUNTRY_CITIES[d.nameEn]
          const isIsland = ISLAND_NAMES.has(d.nameEn) || d._type === 'hawaii' || d._type === 'island'
          if (isIsland) {
            // 섬나라 라벨: 터치 투명(pointer-events:none) → 회전/줌 안 막힘. 선택은 폴리곤/추후 onGlobeClick
            if (d.nameEn) el.dataset.countryen = d.nameEn   // 완료 색칠용 식별자 (paint()가 도시 전부 완료 시 빨강 적용)
            el.style.cssText = 'pointer-events:none;'
            const inner = document.createElement('div')
            inner.className = 'country-label-inner'
            inner.style.cssText = `
              transform:translate(-50%,-50%);
              font-family:Pretendard,Inter,sans-serif;
              font-size:${hasCities ? '13px' : '11px'};
              font-weight:${hasCities ? '700' : '600'};
              color:${hasCities ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.78)'};
              text-shadow:0 1px 4px rgba(0,0,0,1),0 0 10px rgba(0,0,0,0.85);
              white-space:nowrap;
              user-select:none;
              padding:6px 12px;
              border-radius:6px;
            `
            inner.textContent = d.name
            el.appendChild(inner)
          } else {
            if (d.nameEn) el.dataset.countryen = d.nameEn   // 완료 색칠용 식별자
            el.style.cssText = 'pointer-events:none;'
            el.innerHTML = `<div class="country-label-inner" style="
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
          // 라벨 탭 진입은 마이크로국가(섬/점만 한 나라)에만 — 큰 나라는 폴리곤 클릭으로 진입 가능하므로
          // 라벨 pointer-events:auto가 회전 드래그를 가로채는 문제 방지 (큰 나라 라벨 위 드래그=회전 정상)
          if (d._type === 'island' || d._type === 'hawaii') {
          el.style.pointerEvents = 'auto'
          el.style.cursor = 'pointer'
          let _downXY = null
          el.addEventListener('pointerdown', (ev) => { _downXY = [ev.clientX, ev.clientY] })
          el.addEventListener('pointerup', (ev) => {
            if (!_downXY) return
            const moved = Math.hypot(ev.clientX - _downXY[0], ev.clientY - _downXY[1])
            _downXY = null
            if (moved > 8) return  // 드래그(회전)면 무시
            // 겹침 체크: 화면상 가까운 다른 라벨이 있으면 먼저 분리 줌, 단독이면 진입
            const cont = globeContainerRef.current
            const myR = el.getBoundingClientRect()
            const mx = myR.left + myR.width / 2, my = myR.top + myR.height / 2
            let minD = Infinity
            cont?.querySelectorAll('[data-lat]').forEach(o => {
              if (o === el || o.style.opacity === '0') return
              const r = o.getBoundingClientRect()
              const dd = Math.hypot((r.left + r.width / 2) - mx, (r.top + r.height / 2) - my)
              if (dd < minD) minD = dd
            })
            const OVERLAP_PX = 55, SEP_TARGET = 170
            if (isFinite(minD) && minD < OVERLAP_PX && globeRef.current) {
              // 겹침 → 분리 줌인 (이 라벨 중심으로, 이웃이 충분히 떨어지게)
              const pov = globeRef.current.pointOfView()
              const newAlt = Math.max(0.05, pov.altitude * (minD / SEP_TARGET))
              globeRef.current.pointOfView({ lat: d.lat, lng: d.lng, altitude: newAlt }, 700)
              return
            }
            // 단독 → 진입
            if (d._type === 'hawaii') {
              // 미국 컨텍스트 세팅 후 하와이 도시 패널 진입 (햄버거 도시진입과 동일 패턴)
              const usaFeat = countries.find(f => f.properties && f.properties.NAME === 'United States of America')
              if (usaFeat) setSelectedCountry(usaFeat)
              const hc = d._city
              setTimeout(() => handleCityClickRef.current?.(hc), 300)
              return
            }
            let feat = countries.find(f => f.properties && f.properties.NAME === d.nameEn)
            if (!feat) feat = { type: 'Feature', properties: { NAME: d.nameEn, LABEL_X: d.lng, LABEL_Y: d.lat }, geometry: null }
            handleCountryClickRef.current?.(feat)
          })
          }
        }
        return el
      })
  }, [countries, selectedCountry])

  // 라벨 색 갱신: 선택=파랑, 작업완료=빨강. 라벨 재생성 없이 스타일만 바꿈(재생성하면 opacity:0 리셋되어 라벨이 사라지므로)
  // globe.gl이 라벨 DOM을 비동기로 만들어서, 즉시 1회 + 지연 재실행해야 새로 생긴 라벨까지 칠해짐(국가 진입 직후 도시 라벨 포함)
  useEffect(() => {
    const paint = () => {
      const sel = selectedCity?._koName || selectedCity?.name
      // 도시 라벨
      document.querySelectorAll('[data-cityname]').forEach(el => {
        const inner = el.querySelector('.city-label-inner')
        if (!inner) return
        const nm = el.dataset.cityname
        const isSel = nm === sel
        const isDone = completedCities.has(nm)
        inner.style.color = isSel ? '#2563eb' : isDone ? '#ef4444' : 'rgba(255,255,255,0.95)'
        inner.style.fontSize = isSel ? '14px' : '12px'
      })
      // 국가 라벨: 그 국가의 등록 도시가 모두 완료면 빨강
      document.querySelectorAll('[data-countryen]').forEach(el => {
        const inner = el.querySelector('.country-label-inner')
        if (!inner) return
        const cities = COUNTRY_CITIES[el.dataset.countryen] || []
        const allDone = cities.length > 0 && cities.every(c => completedCities.has(c.name))
        if (allDone) inner.style.color = '#ef4444'
        else inner.style.color = cities.length > 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)'
      })
    }
    paint()
    const ts = [120, 500, 1200, 2000].map(ms => setTimeout(paint, ms))   // 라벨 DOM 생성 후 재적용
    return () => ts.forEach(clearTimeout)
  }, [selectedCity, completedCities, selectedCountry, countries, lang])

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

  // A-2: 국경선 pathsData(50m 선 고정) — 무거운 데이터라 1회만 세팅 (색/굵기는 effect B)
  useEffect(() => {
    if (!globeRef.current || borderPaths.length === 0) return
    globeRef.current
      .pathsData(borderPaths)
      .pathPoints(d => d.coords)
      .pathPointLat(p => p[0])
      .pathPointLng(p => p[1])
      .pathPointAlt(0.002)
      .pathTransitionDuration(0)
  }, [borderPaths])

  // B: hover/select 변경 시 accessor만 재설정 (가벼움)
  useEffect(() => {
    if (!globeRef.current || countries.length === 0) return
    const globe = globeRef.current
    const hasSelection = !!selectedCountry
    // 호버 지원 여부: 일부 안드로이드 브라우저가 (hover:hover) true로 잘못 보고하는 케이스 대비
    // 첫 터치가 발생하면 무조건 터치 기기로 확정 (touchedRef는 모듈 외부)
    const supportsHover = !hasTouchedRef.current && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover)').matches

    // 카메라 뒤쪽(지구 뒷면) 점인지 — 뒷면 라벨은 선택 대상에서 제외
    const isFrontFace = (lat, lng) => {
      const pov = globe.pointOfView()
      const cLat = pov.lat * Math.PI / 180, cLng = pov.lng * Math.PI / 180
      const la = lat * Math.PI / 180, ln = lng * Math.PI / 180
      const ang = Math.acos(Math.max(-1, Math.min(1,
        Math.sin(cLat) * Math.sin(la) + Math.cos(cLat) * Math.cos(la) * Math.cos(ln - cLng))))
      // 줌 깊이에 따른 시야각 — 줌인 시 좁게 (화면에 보이는 도시만 후보로)
      const threshold = Math.min(1.4, Math.atan(pov.altitude * 1.5) + 0.2)
      return ang < threshold
    }
    // 탭한 화면 위치 기준, 화면상 가장 가까운 항목 선택 (라벨 기준이라 정확)
    // 반환: { best, bestD, secondD } — 1등 항목 + 1등·2등 화면거리(px). 모호함 판정용.
    const pickNearestByScreen = (list, getLat, getLng, event, maxPx) => {
      const rect = globeContainerRef.current?.getBoundingClientRect()
      if (!rect) return null
      const tapX = event.clientX - rect.left, tapY = event.clientY - rect.top
      let best = null, bestD = Infinity, secondD = Infinity
      for (const it of list) {
        const la = getLat(it), ln = getLng(it)
        if (!isFrontFace(la, ln)) continue
        const sc = globe.getScreenCoords(la, ln)
        if (!sc) continue
        // 화면 영역 밖 또는 가장자리 살짝 걸친 라벨 후보 제외 (50px 안쪽만)
        const m = 50
        if (sc.x < m || sc.x > rect.width - m || sc.y < m || sc.y > rect.height - m) continue
        const dx = sc.x - tapX, dy = sc.y - tapY
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < bestD) { secondD = bestD; bestD = d; best = it }
        else if (d < secondD) { secondD = d }
      }
      if (!best || bestD > maxPx) return null
      return { best, bestD, secondD }
    }

    // 국가뷰: 화면상 가장 가까운 도시 선택
    const CITY_TAP_PX = 70    // 체감 튜닝: 줄이면 정확히 눌러야, 키우면 넉넉하게
    // 의도 판정: 비율(1등이 2등보다 2배+ 가까움) 또는 절대차(>=28px). 어느 하나만 만족해도 패널.
    // 비율은 클러스터 처리용(라벨 정확히 탭 = 1등 압도적), 절대차는 일반 거리용.
    const AMBIGUITY_MARGIN_PX = 28
    const SEP_TARGET_PX = 160 // 모호 탭 줌인 후 클러스터 라벨들 분리될 목표 거리 (한 번에 분리되도록 공격적)
    const selectNearestCity = (countryName, event) => {
      if (countryFlyingRef.current?.active) return   // 국가 줌인 비행 중 탭 무시 — 줌인을 건너뛰고 바로 도시 패널이 열리는 것 방지
      const list = COUNTRY_CITIES[countryName] || []
      const r = pickNearestByScreen(list, c => c.lat, c => c.lng, event, CITY_TAP_PX)
      if (!r) return
      const { best, bestD, secondD } = r
      // 명확 판정: 비율(bestD * 2 <= secondD) 또는 절대차(>=28) 또는 직전이 줌-only(다음 탭은 무조건 패널)
      // pendingPanelRef는 사용자 의도 단계 추적 — "줌으로 클러스터 펼쳤으니 이번 탭은 선택" 흐름 자연스럽게
      // 줌인된 상태(작은 altitude)면 모호 판정 거치지 않고 무조건 패널 — 사용자 의도 명확
      const isZoomedIn = globe.pointOfView().altitude < 0.15
      const isAmbiguousCluster = !isZoomedIn && isFinite(secondD) && secondD < 50
      const isClear = !isAmbiguousCluster && (isZoomedIn || !isFinite(secondD) || (bestD * 2 <= secondD) || (secondD - bestD >= AMBIGUITY_MARGIN_PX) || pendingPanelRef.current)
      if (isClear) {
        pendingPanelRef.current = false  // 패널 열림 → ref 소비/리셋
        justClickedCityRef.current = true
        setTimeout(() => { justClickedCityRef.current = false }, 150)
        handleCityClick({ ...best, name: getCityName(best.name), _koName: best.name, countryEn: countryName })
      } else {
        // 모호한 탭 → 한 번에 클러스터 분리될 만큼 줌인
        // best의 가장 가까운 이웃까지 화면거리(min) 계산 → 그게 SEP_TARGET_PX 되도록 줌
        // 가장 가까운 쌍이 분리되면 나머지(그 너머)는 자동으로 더 멀리 떨어짐
        const bestSc = globe.getScreenCoords(best.lat, best.lng)
        let minNeighborD = Infinity
        if (bestSc) {
          for (const c of list) {
            if (c === best || !isFrontFace(c.lat, c.lng)) continue
            const sc = globe.getScreenCoords(c.lat, c.lng)
            if (!sc) continue
            const d = Math.sqrt((sc.x - bestSc.x) ** 2 + (sc.y - bestSc.y) ** 2)
            if (d < minNeighborD) minNeighborD = d
          }
        }
        // 이웃까지 거리가 SEP_TARGET_PX 되도록 줌인 (alt 비례)
        const pov = globe.pointOfView()
        const ratio = isFinite(minNeighborD) ? (minNeighborD / SEP_TARGET_PX) : 0.5
        const newAlt = Math.max(0.05, pov.altitude * ratio)
        pendingPanelRef.current = true  // 줌만 했으므로 다음 탭은 무조건 패널 열림
        justClickedCityRef.current = true
        setTimeout(() => { justClickedCityRef.current = false }, 150)
        globe.pointOfView({ lat: best.lat, lng: best.lng, altitude: newAlt }, 700)
      }
    }
    // 세계뷰 바다 탭: 화면상 가장 가까운 섬나라 선택 (폴리곤 없는 작은 섬용)
    const ISLAND_TAP_PX = 60
    const selectNearestIsland = (event) => {
      const r = pickNearestByScreen(ISLAND_LABEL_DATA, d => d.lat, d => d.lng, event, ISLAND_TAP_PX)
      if (!r) return
      const best = r.best
      justClickedCityRef.current = true
      setTimeout(() => { justClickedCityRef.current = false }, 150)
      let feat = countries.find(f => f.properties && f.properties.NAME === best.nameEn)
      if (!feat) feat = { type: 'Feature', properties: { NAME: best.nameEn, LABEL_X: best.lng, LABEL_Y: best.lat }, geometry: null }
      handleCountryClick(feat)
    }

    globe
      // 면·테두리 모두 투명 — 각진 110m 폴리곤은 안 보이게(클릭 판정용으로만 유지)
      .polygonCapColor(() => 'rgba(0,0,0,0)')
      .polygonSideColor(() => 'rgba(0,0,0,0)')
      .polygonStrokeColor(() => 'rgba(0,0,0,0)')
      .polygonAltitude(() => 0.0008)
      // 보이는 국경선 = 50m pathsData(선). 선택/호버 시 색·굵기만 변경
      .pathColor(d => {
        if (hasSelection) {
          if (selectedCountry?.properties.NAME === d.name) return 'rgba(59,130,246,0.95)'
          return 'rgba(255,255,255,0.45)'
        }
        return 'rgba(255,255,255,0.5)'
      })
      .pathStroke(d => {
        if (hasSelection && selectedCountry?.properties.NAME === d.name) return 1.6
        return 0.5
      })
      .polygonLabel(() => '')
      .onPolygonHover(feat => {
        // 마우스 따라다니는 three-globe 호버 툴팁(빈 검은 박스) 영구 숨김
        // three-globe는 display만 토글하므로 visibility:hidden은 유지됨 → 한 번 숨기면 계속 안 보임
        const tt = globeContainerRef.current?.querySelector(':scope > div:last-of-type')
        if (tt && tt.style?.position === 'absolute' && tt.style.visibility !== 'hidden') {
          tt.style.visibility = 'hidden'
          tt.style.pointerEvents = 'none'
        }
        // 호버 노란색 하이라이트 제거: 50m 국경선 재계산이 무거워 렉 유발 → 비활성화. 선택(파란색)만 유지
      })
      .onPolygonClick((feat, ev, coords) => {
        if (justClickedCityRef.current) return
        if (hasSelection) {
          // 현재 국가의 도시가 클릭 지점 근처면 우선 선택 — 폴리곤 클릭이 다른 나라로 빠져나가지 않게
          // 마이크로스테이트(폴리곤 없음)는 넉넉히 70px, 일반 국가는 국경 도시(제네바·바젤 등) 보정용 45px
          const cl = COUNTRY_CITIES[selectedCountry.properties.NAME] || []
          const nearThreshold = !selectedCountry.geometry ? 70 : 45
          const cityR = pickNearestByScreen(cl, c => c.lat, c => c.lng, ev, nearThreshold)
          if (cityR) { selectNearestCity(selectedCountry.properties.NAME, ev); return }
          // 근처에 자기 나라 도시 없음 → 같은 나라 땅이면 가까운 도시 / 다른 나라면 전환
          if (feat.properties.NAME === selectedCountry.properties.NAME) {
            selectNearestCity(selectedCountry.properties.NAME, ev)
          } else {
            handleCountryClick(feat)
          }
        } else {
          // 세계뷰: 먼저 마이크로스테이트(폴리곤 없는 작은 국가, 큰 나라 영토 안에 위치) 체크
          // 반경 줌 반비례: 줌인하면 섬이 화면상 커져 라벨 앵커에서 멀어지므로 판정 반경도 키움 (싱가포르 탭이 말레이시아 폴리곤에 뺏기는 오터치 방지)
          const alt = globe.pointOfView().altitude
          const microRadius = alt < 0.15 ? 110 : alt < 0.3 ? 70 : 30
          const microR = pickNearestByScreen(ISLAND_LABEL_DATA, d => d.lat, d => d.lng, ev, microRadius)
          if (microR) {
            let mFeat = countries.find(f => f.properties && f.properties.NAME === microR.best.nameEn)
            if (!mFeat) mFeat = { type: 'Feature', properties: { NAME: microR.best.nameEn, LABEL_X: microR.best.lng, LABEL_Y: microR.best.lat }, geometry: null }
            handleCountryClick(mFeat)
            return
          }
          // 세계뷰: 즉시 국가 진입 (지연 피드백 제거 → 짧은 탭도 안정적)
          handleCountryClick(feat)
        }
      })
      .onGlobeClick((coords, ev) => {
        if (justClickedCityRef.current) return
        if (hasSelection) {
          // 국가뷰 바다 탭 → 화면상 가장 가까운 도시 (해안 도시용)
          selectNearestCity(selectedCountry.properties.NAME, ev)
        } else {
          // 세계뷰 바다 탭 → 화면상 가장 가까운 작은 섬 (폴리곤 없는 섬)
          selectNearestIsland(ev)
        }
      })
  }, [selectedCountry, lang, countries])


  // 국가별 최적 줌 레벨 (수동 튜닝)
  const COUNTRY_ZOOM = {
    // 아시아
    "South Korea": { alt: 0.20, lat: 36.0, lng: 127.8 },
    "Japan": { alt: 0.34, lat: 36.5, lng: 136.0 },
    "China": { alt: 1.0, lat: 35.0, lng: 105.0 },
    "India": { alt: 0.6, lat: 22.0, lng: 79.0 },
    "Thailand": { alt: 0.35, lat: 14.0, lng: 100.5 },
    "Vietnam": { alt: 0.35, lat: 16.0, lng: 105 },
    "Indonesia": { alt: 1.1, lat: -2.5, lng: 118.0 },
    "Malaysia": { alt: 0.5, lat: 4.0, lng: 109.0 },
    "Singapore": { alt: 0.08, lat: 1.35, lng: 103.82 },
    "Cambodia": { alt: 0.2, lat: 12.5, lng: 105.0 },
    "Myanmar": { alt: 0.42, lat: 19.5, lng: 96.5 },
    "Nepal": { alt: 0.2, lat: 28.2, lng: 84.5 },
    "Sri Lanka": { alt: 0.18, lat: 7.8, lng: 80.7 },
    "Philippines": { alt: 0.4, lat: 12.0, lng: 122.0 },
    "United Arab Emirates": { alt: 0.15, lat: 24.5, lng: 54.5 },
    "Saudi Arabia": { alt: 0.6, lat: 24.0, lng: 44.0 },
    "Iran": { alt: 0.52, lat: 33.0, lng: 53.5 },
    "Uzbekistan": { alt: 0.35, lat: 41.3, lng: 64.5 },
    // 유럽
    "France": { alt: 0.27, lat: 46.6, lng: 2.5 },
    "Italy": { alt: 0.25, lat: 42.5, lng: 12.5 },
    "Spain": { alt: 0.31, lat: 40.0, lng: -3.5 },
    "Germany": { alt: 0.21, lat: 51.0, lng: 10.5 },
    "United Kingdom": { alt: 0.25, lat: 54.0, lng: -2.8 },
    "Portugal": { alt: 0.20, lat: 39.6, lng: -8.0 },
    "Netherlands": { alt: 0.10, lat: 52.2, lng: 5.3 },
    "Czechia": { alt: 0.14, lat: 49.8, lng: 15.5 },
    "Austria": { alt: 0.15, lat: 47.5, lng: 13.7 },
    "Switzerland": { alt: 0.10, lat: 46.8, lng: 8.2 },
    "Hungary": { alt: 0.15, lat: 47.2, lng: 19.5 },
    "Croatia": { alt: 0.16, lat: 44.5, lng: 16.0 },
    "Greece": { alt: 0.25, lat: 38.5, lng: 23.5 },
    "Turkey": { alt: 0.43, lat: 39.0, lng: 35.0 },
    "Norway": { alt: 0.45, lat: 64.0, lng: 12.0 },
    "Sweden": { alt: 0.45, lat: 62.0, lng: 16.0 },
    "Denmark": { alt: 0.14, lat: 56.0, lng: 10.0 },
    "Finland": { alt: 0.32, lat: 64.0, lng: 26.0 },
    "Iceland": { alt: 0.15, lat: 64.9, lng: -18.5 },
    "Poland": { alt: 0.20, lat: 52.0, lng: 19.5 },
    "Russia": { alt: 1.7, lat: 62.0, lng: 95.0 },
    // 아프리카
    "Egypt": { alt: 0.4, lat: 27.0, lng: 30.5 },
    "Morocco": { alt: 0.5, lat: 30.0, lng: -8.0 },
    "South Africa": { alt: 0.45, lat: -29.0, lng: 25.0 },
    "Kenya": { alt: 0.3, lat: 0.5, lng: 37.5 },
    "Tanzania": { alt: 0.35, lat: -6.5, lng: 35.0 },
    "Ethiopia": { alt: 0.4, lat: 9.0, lng: 39.5 },
    "Ghana": { alt: 0.22, lat: 7.5, lng: -1.5 },
    // 아메리카
    "United States of America": { alt: 1.1, lat: 37.0, lng: -102.0 },
    "Canada": { alt: 1.3, lat: 58.0, lng: -98.0 },
    "Mexico": { alt: 0.7, lat: 21.0, lng: -102.5 },
    "Brazil": { alt: 0.9, lat: -9.8, lng: -54.0 },
    "Argentina": { alt: 0.7, lat: -35.0, lng: -65.0 },
    "Peru": { alt: 0.5, lat: -10.0, lng: -76.0 },
    "Chile": { alt: 0.7, lat: -35.0, lng: -71.0 },
    "Colombia": { alt: 0.4, lat: 4.5, lng: -73.0 },
    "Cuba": { alt: 0.25, lat: 22.0, lng: -79.5 },
    // 오세아니아
    "Australia": { alt: 1.0, lat: -26.0, lng: 134.0 },
    "New Zealand": { alt: 0.45, lat: -41.5, lng: 173.0 },
    // 중동
    "Jordan": { alt: 0.15, lat: 31.3, lng: 36.3 },
    "Israel": { alt: 0.12, lat: 31.5, lng: 35.0 },
    // 추가 국가
    "Ireland": { alt: 0.17, lat: 53.4, lng: -8.0 },
    "Belgium": { alt: 0.08, lat: 50.5, lng: 4.5 },
    "Taiwan": { alt: 0.15, lat: 23.7, lng: 121.0 },
    "Maldives": { alt: 0.35, lat: 3.2, lng: 73.2 },
    "Costa Rica": { alt: 0.12, lat: 10.0, lng: -84.0 },
    "Panama": { alt: 0.17, lat: 9.0, lng: -80.5 },
    "Ecuador": { alt: 0.25, lat: -1.5, lng: -78.5 },
    "Romania": { alt: 0.2, lat: 46.0, lng: 25.0 },
    "Georgia": { alt: 0.12, lat: 42.3, lng: 43.5 },
    "Montenegro": { alt: 0.08, lat: 42.7, lng: 19.4 },
    "Slovenia": { alt: 0.08, lat: 46.1, lng: 14.8 },
    "Mongolia": { alt: 0.58, lat: 47.5, lng: 105.0 },
    "Laos": { alt: 0.28, lat: 18.5, lng: 103.5 },
    "Tunisia": { alt: 0.2, lat: 34.5, lng: 9.5 },
    "Oman": { alt: 0.25, lat: 21.5, lng: 55.5 },
    "Qatar": { alt: 0.08, lat: 25.3, lng: 51.2 },
    "Bolivia": { alt: 0.45, lat: -17.0, lng: -65.0 },
    "Dominican Republic": { alt: 0.15, lat: 19.0, lng: -70.0 },
    "Guatemala": { alt: 0.18, lat: 15.5, lng: -90.3 },
    "Jamaica": { alt: 0.1, lat: 18.1, lng: -77.3 },
    "Latvia": { alt: 0.12, lat: 57.0, lng: 24.5 },
    "Lithuania": { alt: 0.12, lat: 55.2, lng: 24.0 },
    "Estonia": { alt: 0.12, lat: 59.0, lng: 25.2 },
    "Cyprus": { alt: 0.09, lat: 35.1, lng: 33.1 },
    "Albania": { alt: 0.10, lat: 41.3, lng: 20.0 },
    "Serbia": { alt: 0.14, lat: 44.5, lng: 20.9 },
    "Namibia": { alt: 0.46, lat: -22.0, lng: 17.5 },
    "Zimbabwe": { alt: 0.3, lat: -19.0, lng: 29.5 },
    "Fiji": { alt: 0.15, lat: -18.0, lng: 178.0 },
    "Madagascar": { alt: 0.45, lat: -19.0, lng: 47.0 },
    "Mauritius": { alt: 0.08, lat: -20.2, lng: 57.5 },
    "Lebanon": { alt: 0.08, lat: 33.9, lng: 35.9 },
    "Ukraine": { alt: 0.37, lat: 49.0, lng: 31.5 },
    "Pakistan": { alt: 0.45, lat: 30.5, lng: 69.5 },
    "Luxembourg": { alt: 0.06, lat: 49.6, lng: 6.1 },
    "Slovakia": { alt: 0.13, lat: 48.7, lng: 19.7 },
    "Bulgaria": { alt: 0.18, lat: 42.7, lng: 25.5 },
    "Rwanda": { alt: 0.08, lat: -2.0, lng: 29.9 },
    "Senegal": { alt: 0.2, lat: 14.5, lng: -14.5 },
    "Kazakhstan": { alt: 0.7, lat: 48.0, lng: 67.0 },
  }

  const getCountryAltitude = (feat) => {
    const name = feat.properties.NAME
    // 사전 정의된 줌이 있으면 사용
    if (COUNTRY_ZOOM[name]) return COUNTRY_ZOOM[name].alt
    // geometry 없으면 마이크로스테이트(폴리곤 없는 작은 국가) → 깊게 줌인
    if (!feat.geometry) return 0.05
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
    hoveredCountryRef.current = null
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
    hoveredCountryRef.current = null
    setShowCountryInfo(false)  // 다른 국가 선택 시 정보 패널 닫힘
    setInfoExpanded(false)  // 항상 접힌(헤더만) 상태로 시작 — 사용자가 헤더 탭하면 펼쳐짐

    const center = getCountryCenter(feat)
    const altitude = getCountryAltitude(feat)
    const mobileAlt = window.innerWidth <= 768 ? altitude * 1.5 : altitude
    cityEnterAltRef.current = mobileAlt   // 도시 소도시 라벨 게이팅 기준 (이 나라의 진입 줌)

    globe.controls().autoRotate = false
    countryFlyingRef.current = { active: true, targetAlt: mobileAlt }   // 이동 중엔 목표 줌 기준으로 게이팅(경유 줌에서 라벨 안 뜨게)
    globe.pointOfView({ lat: center.lat, lng: center.lng, altitude: mobileAlt }, 1300)
    setTimeout(() => { countryFlyingRef.current.active = false }, 1350)
  }

  const handleCityClick = (city) => {
    try {
      if (!globeRef.current) return
      if (countryFlyingRef.current?.active) return   // 국가 줌인 비행 중엔 도시 라벨 클릭도 무시 — 비행 중 pointOfView 중복 명령으로 인한 렉 방지
      setSelectedCity(city)
      setSelectedSpot(null)
      setCityData(null)
      setShowCountryInfo(false)
      fetchCityData(city)
      // 멀리(지구뷰)서 진입하면 도시로 줌인, 이미 가까우면 줌 유지하고 슬라이드만
      const pov = globeRef.current.pointOfView()
      const cityAlt = window.innerWidth <= 768 ? 0.32 : 0.22
      const targetAlt = pov.altitude > 0.5 ? cityAlt : pov.altitude
      globeRef.current.pointOfView({ lat: city.lat, lng: city.lng, altitude: targetAlt }, 900)
      lastPovKeyRef.current = ''; labelCacheRef.current.settled = false  // idle 스킵 해제 → 이동이 미미해도 라벨 게이팅 재계산(사라짐 방지)
    } catch(e) { console.error('city click error:', e) }
  }

  handleCityClickRef.current = handleCityClick
  handleCountryClickRef.current = handleCountryClick

  // ── 도시 관광 데이터 로드 (사전 데이터 기반, AI 불필요) ──────────────────





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



  // 임의 도시의 핫플(관광 명소) 배열을 반환 (state 안 건드림, AI 코스용)
  const fetchHotspotsFor = async (city) => {
    if (!city?.lat || !city?.lng) return []
    const langParam = 'en'   // 관광지 검색은 영어로 고정: 결과가 영어 이름으로 나와 사진 찾기 수월(화면 UI 언어와 무관, 데이터 수집용)
    const cityKey = city._koName || city.name
    const fsKey = `${cityKey}_${lang}`
    const lsKey = `hotspots_${fsKey}`
    // 수동 추가분(manualHotspots)을 목록에 병합 — 캐시 소스 무관하게 항상 적용, place_id 중복제거 + 리뷰순
    const mergeManual = (list, manual) => {
      const man = manual || (() => { try { return JSON.parse(localStorage.getItem(`manualHotspots_${fsKey}`) || '[]') } catch { return [] } })()
      if (!man.length) return list
      const ids = new Set(list.map(p => p.place_id))
      const add = man.filter(m => m.place_id && !ids.has(m.place_id))
      if (!add.length) return list
      return [...list, ...add].sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0))
    }
    // 1) localStorage 캐시 우선 (Firestore 실패해도 재클릭 시 API 재호출 방지)
    try { const raw = localStorage.getItem(lsKey); if (raw) { const arr = JSON.parse(raw); if (arr && arr.length) { console.log('[Hotspots] localStorage 캐시 히트:', fsKey); setHotspotDiag({ city: cityKey, state: 'cached' }); return mergeManual(arr) } } } catch {}
    // 2) Firestore 공용 캐시
    try {
      const cc = await getCityCache(fsKey)
      console.log('[Hotspots] Firestore 조회:', fsKey, '→', cc?.hotspots?.length ? `캐시 ${cc.hotspots.length}개 히트` : '캐시 없음/빈값', cc)
      if (cc?.hotspots && cc.hotspots.length) { const m = mergeManual(cc.hotspots, cc.manualHotspots); try { localStorage.setItem(lsKey, JSON.stringify(m)) } catch {}; return m }
    } catch (e) { console.error('[Hotspots] Firestore 조회 실패(→API 호출됨):', fsKey, e) }
    console.warn('[Hotspots] 캐시 미스 → API 18키워드 호출:', fsKey)
    const cityName = getCityName(cityKey)   // 현재 언어 도시명 (UI/필터용)
    const cityNameEn = (CITY_I18N[cityKey] && CITY_I18N[cityKey][0]) || cityName   // 검색 쿼리는 영어로 (Google 범용)
    // ── 관광 유형별 분산 Text Search (전 세계 보편 8종) — 반경 의존 제거로 외곽 명소 누락 방지 ──
    const CATS = {
      ko: ['관광명소','명소','랜드마크','궁궐','성','유적','사찰','성당','사원','공원','정원','박물관','미술관','전망대','시장'],
      en: ['tourist attractions','landmarks','monuments','palace','castle','historic site','temple','shrine','church','mosque','park','garden','museum','gallery','viewpoint','observation deck','market'],
      ja: ['観光スポット','名所','ランドマーク','城','史跡','遺跡','寺','神社','教会','公園','庭園','博物館','美術館','展望台','市場'],
      zh: ['旅游景点','名胜','地标','宫殿','城堡','古迹','寺庙','教堂','公园','花园','博物馆','美术馆','观景台','市场','广场'],
    }
    const cats = CATS.en   // 검색은 영어 카테고리로 통일 (Google 영어가 전세계 가장 잘 잡힘)
    // 행정구역이 달라 분산쿼리에 안 잡히는 핵심 명소 — 이름으로 직접 검색해 추가(queries) + 오염필터 통과(allow)
    const EXTRA_SPOTS = {
      '카이로': { queries: ['기자 피라미드', '스핑크스 기자'], allow: ['기자','Giza','피라미드','Pyramid','스핑크스','Sphinx'] },
      '베이징': { queries: ['만리장성 바다링', '만리장성 무톈위'], allow: ['만리장성','Great Wall','长城','Badaling','Mutianyu','바다링','무톈위'] },
      '아테네': { queries: ['수니온 포세이돈 신전', 'Temple of Poseidon Sounion'], allow: ['수니온','Sounion','Sounio','Poseidon','포세이돈'] },
      '마추픽추': { queries: ['마추픽추'], allow: ['마추픽추','마추 픽추','Machu Picchu','Machupicchu'] },
      '가마쿠라': { queries: ['에노시마', '江ノ島 신사'], allow: ['에노시마','江の島','江ノ島','Enoshima'] },
    }
    const extra = EXTRA_SPOTS[cityKey]
    try {
      const catFetches = cats.map(async (cat) => {
        try {
          const r = await fetch(`/api/places?query=${encodeURIComponent(cityNameEn + ' ' + cat)}&lat=${city.lat}&lng=${city.lng}&language=${langParam}`)
          const d = await r.json()
          return d.results || []
        } catch { return [] }
      })
      const extraFetches = (extra?.queries || []).map(async (q) => {
        try {
          const r = await fetch(`/api/places?query=${encodeURIComponent(q)}&lat=${city.lat}&lng=${city.lng}&language=${langParam}`)
          const d = await r.json()
          return d.results || []
        } catch { return [] }
      })
      const arrays = await Promise.all([...catFetches, ...extraFetches])
      const seen = new Set(); const merged = []
      for (const arr of arrays) for (const p of arr) {
        if (p.place_id && !seen.has(p.place_id)) { seen.add(p.place_id); merged.push(p) }
      }
      // 오염 제거: 결과 주소에 도시명(한/영/일/중)이 든 것만 — 타지 명소(예: 인천 경복궁) 차단
      // 예외: 행정구역 다른 핵심 명소(피라미드·만리장성·수니온 등)는 allow 키워드로 통과
      const cityNames = [cityKey, ...(CITY_I18N[cityKey] || [])].filter(Boolean)
      const allow = extra?.allow || []
      // 시/도(광역) 단위로 관광지 그룹화 — 구 단위로 안 나뉘게(도쿄 신주쿠·시부야는 다 '도쿄도' 한 그룹)
      const regionGroups = {}
      for (const p of merged) {
        const segs = (p.formatted_address || '').split(',').map(s => s.trim()).filter(Boolean)
        if (segs.length >= 2) {
          const loc = segs[segs.length - 2].replace(/[0-9]+/g, '').trim()  // 국가 앞 세그먼트(시/도), 우편번호 제거
          if (loc.length >= 2) (regionGroups[loc] = regionGroups[loc] || []).push(p)
        }
      }
      const learnThreshold = Math.max(3, merged.length * 0.25)
      const learnedLocalities = Object.entries(regionGroups).filter(([, arr]) => arr.length >= learnThreshold).map(([k]) => k)
      const acceptNames = [...cityNames, ...learnedLocalities]
      // 등록 안 된 동명 도시 차단: 시/도 그룹이 2개 이상일 때, 그룹 평균좌표가 도시에서 확연히 먼(150km 초과) 그룹만 제거
      // 그룹 평균 기준이라 넓은 도시(한 그룹, 평균=도심)·구 단위는 안전. 다른 지역 동명도시(별개 그룹, 수백km)만 걸림
      const farGroups = new Set()
      if (city?.lat != null && Object.keys(regionGroups).length >= 2) {
        const R = 6371, toR = Math.PI / 180
        for (const loc in regionGroups) {
          const pts = regionGroups[loc].map(p => p.geometry?.location).filter(l => l && l.lat != null)
          if (!pts.length) continue
          const mlat = pts.reduce((s, l) => s + l.lat, 0) / pts.length
          const mlng = pts.reduce((s, l) => s + l.lng, 0) / pts.length
          const dLat = (mlat - city.lat) * toR, dLng = (mlng - city.lng) * toR
          const a = Math.sin(dLat/2)**2 + Math.cos(city.lat*toR) * Math.cos(mlat*toR) * Math.sin(dLng/2)**2
          if (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) > 150) farGroups.add(loc)
        }
        if (farGroups.size) console.log(`[동명차단] ${cityKey}: 먼 지역 제거 [${[...farGroups].join(', ')}]`)
      }
      const inCity = (p) => {
        const segs = (p.formatted_address || '').split(',').map(s => s.trim()).filter(Boolean)
        if (segs.length >= 2) {
          const loc = segs[segs.length - 2].replace(/[0-9]+/g, '').trim()
          if (farGroups.has(loc)) return false   // 등록 안 된 동명 도시(먼 시/도 그룹) 차단
        }
        const addr = (p.vicinity || '') + ' ' + (p.formatted_address || '')
        if (acceptNames.some(n => addr.includes(n))) return true
        const hay = (p.name || '') + ' ' + addr
        return allow.some(k => hay.includes(k))
      }
      // ── 지역명 자동학습(전 세계 공통): 등록 도시명이 Google 영문주소에 안 나오는 도시 구제 ──
      // 이름매칭 통과율 50% 미만일 때만 발동 → 정상 도시(서울/도쿄/파리 등은 90~100% 통과)는 블록 자체가 실행 안 됨
      const basePass = merged.filter(inCity).length
      if (merged.length >= 8 && basePass < merged.length * 0.5) {
        const countryEn = (city?.countryEn || '').trim()
        const normStr = (s) => s.toLowerCase().replace(/\s+/g, '')
        // 행정 일반명사는 학습 금지 — City/District 등이 학습되면 인접 도시까지 통과해 오염됨
        const STOP = new Set(['city','district','province','county','state','region','town','village','municipality','prefecture','area','division','ward','borough','township','metropolitan','capital','central','north','south','east','west','new','old','saint','st','de','la','el','du'])
        const learned = []
        // (1) 마지막 세그먼트가 국가명이 아니면 그 자체가 지역명 — 마카오형 "R. de São Paulo, Macao"
        const lastCnt = {}
        for (const p of merged) {
          const segs = (p.formatted_address || '').split(',').map(s => s.trim()).filter(Boolean)
          if (!segs.length) continue
          const last = segs[segs.length - 1].replace(/[0-9]+/g, '').trim()
          if (last.length >= 2) lastCnt[last] = (lastCnt[last] || 0) + 1
        }
        for (const [k, n] of Object.entries(lastCnt)) {
          if (n >= merged.length * 0.5 && normStr(k) !== normStr(countryEn)) learned.push(k)
        }
        // (2) 마지막이 국가명이면 국가앞 세그먼트를 토큰 분해해 공통 토큰 학습
        //     캔버라형 "Parkes ACT"/"Acton ACT"/"Canberra ACT" → 공통 "ACT" (호주 NT, 미국 TX/CA, 캐나다 ON 등 주 약어 전반)
        if (!learned.length) {
          const tokCnt = {}
          for (const p of merged) {
            const segs = (p.formatted_address || '').split(',').map(s => s.trim()).filter(Boolean)
            if (segs.length < 2) continue
            const g = segs[segs.length - 2].replace(/[0-9]+/g, '').trim()
            const seen = new Set()
            for (const t of g.split(/\s+/)) {
              if (t.length < 2 || seen.has(t) || STOP.has(t.toLowerCase())) continue
              seen.add(t); tokCnt[t] = (tokCnt[t] || 0) + 1
            }
          }
          for (const [t, n] of Object.entries(tokCnt)) {
            if (n >= merged.length * 0.5 && normStr(t) !== normStr(countryEn)) learned.push(t)
          }
        }
        if (learned.length) {
          acceptNames.push(...learned)   // inCity가 클로저로 참조 → 아래 ranked 필터에 즉시 반영
          console.warn(`[지역명 자동학습] ${cityKey}: 이름매칭 ${basePass}/${merged.length} → [${learned.join(', ')}] 학습 (등록명: ${cityNames.join('/')}, 국가: ${countryEn})`)
          setHotspotDiag({ city: cityKey, state: 'learned', learned, basePass, total: merged.length })
        } else {
          console.warn(`[매칭실패·학습불가] ${cityKey}: ${basePass}/${merged.length} | 등록명: ${cityNames.join('/')} | 주소샘플: ${merged[0]?.formatted_address || '-'}`)
          setHotspotDiag({ city: cityKey, state: 'failed', learned: [], basePass, total: merged.length, sample: merged[0]?.formatted_address || '' })
        }
      } else {
        setHotspotDiag({ city: cityKey, state: 'ok', learned: [], basePass, total: merged.length })
      }
      const JUNK_TYPES = ['supermarket','grocery_or_supermarket','department_store','shopping_mall','convenience_store','store','clothing_store','electronics_store','home_goods_store','furniture_store','hardware_store','gas_station','lodging','car_dealer','restaurant','cafe','food','meal_takeaway','meal_delivery','bakery','bar','parking','travel_agency','school','university','primary_school','secondary_school','hair_care','beauty_salon','pharmacy','hospital','doctor','bank','atm','real_estate_agency','lawyer','insurance_agency','car_rental','car_repair','gym','spa']
      const ranked = merged
        .filter(p => p.user_ratings_total)                       // 리뷰 있는 곳만
        .filter(p => p.rating === undefined || p.rating >= 3.5)  // 저평점 컷
        .filter(p => (p.types || []).includes('tourist_attraction') || !(p.types || []).some(t => JUNK_TYPES.includes(t)))  // 관광지면 살림, 아니면 마트/상점 등 제외
        .filter(inCity)                                          // 오염(타지 명소) 제거
        .sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0))  // 리뷰순(유명세)
      // 관광 규모 자동 판별: 리뷰 1만+ 관광지가 10개 이상이면 대도시(25개), 아니면 소도시(15개)
      const famousCount = ranked.filter(p => (p.user_ratings_total || 0) >= 10000).length
      const isBigCity = famousCount >= 10
      const limit = isBigCity ? 25 : 15
      console.log(`[대도시판별] ${cityKey}: 리뷰1만+ ${famousCount}개 → ${isBigCity?'대도시':'소도시'}(${limit}개), 총후보 ${ranked.length}개`)
      const list = ranked.slice(0, limit)
      // 캐시 전체 삭제 후 API 재수집 시나리오: Firestore에 남은 수동분(manualHotspots)을 다시 병합해 유실 방지
      let manual = []
      try { const cc2 = await getCityCache(fsKey); manual = (cc2 && cc2.manualHotspots) || [] } catch {}
      const finalList = mergeManual(list, manual)
      try { localStorage.setItem(lsKey, JSON.stringify(finalList)) } catch {}   // 로컬 캐시 저장 (Firestore 실패 대비)
      if (manual.length) { try { localStorage.setItem(`manualHotspots_${fsKey}`, JSON.stringify(manual)) } catch {} }   // 수동분 로컬 복원
      try { setCityCache(fsKey, { hotspots: list, manualHotspots: manual }) } catch {}   // hotspots는 자동수집분만 저장(manual은 병합 시 중복방지), manualHotspots 유지
      return finalList
    } catch { return [] }
  }

  const fetchPlacesData = async (city) => {
    if (!city?.lat || !city?.lng) return
    
    setLoadingPlaces(true)

    // 핫플은 추천 관광지와 중복 허용 (언어 무관 개수 안정성 우선)
    try {
      // 핫플레이스 = AI 코스와 동일 소스 (Nearby Search, 도시별 반경, 리뷰순)
      const topHotspots = await fetchHotspotsFor(city)
      setHotspots(topHotspots)
      // 도시의 관광지 사진을 1회 컬렉션 쿼리로 일괄 로드 (개별 25회 → 1회, 렉 감소)
      const country = city.countryEn || 'Unknown'
      const cityNm = city._koName || city.name
      getCityAttractionPhotos(country, cityNm).then(m => setAttrPhotos(m || {})).catch(() => setAttrPhotos({}))

    } catch (error) {
      console.error('Failed to fetch places:', error)
    } finally {
      setLoadingPlaces(false)
    }
  }

  // 음식 문화 AI 생성 (localStorage 캐싱)
  const fetchFoodCulture = async (city, returnOnly = false) => {
    const cityKey = city._koName || city.name
    const cacheKey = `foodCulture3_${cityKey}_${lang}`
    // 1) localStorage (같은 기기)
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) { const p = JSON.parse(cached); if (returnOnly) return p; setFoodCulture(p); return }
    } catch {}
    // 2) 추출 데이터 계층(countries/{국가}/cities/{도시})의 food — Firebase 콘솔에서 직접 수정한 내용 반영 (cityCache보다 우선)
    try {
      const cdoc = await getCityDoc(city.countryEn || 'Unknown', cityKey)
      if (cdoc?.food) { if (returnOnly) return cdoc.food; setFoodCulture(cdoc.food); try { localStorage.setItem(cacheKey, JSON.stringify(cdoc.food)) } catch {}; return }
    } catch {}
    // 3) Firestore 공용 캐시 (다른 사용자가 이미 생성한 것)
    const fsKey = `${cityKey}_${lang}`
    try {
      const fc = await getCityCache(fsKey)
      if (fc?.food) { if (returnOnly) return fc.food; setFoodCulture(fc.food); try { localStorage.setItem(cacheKey, JSON.stringify(fc.food)) } catch {}; return }
    } catch {}

    if (!returnOnly) { setLoadingFoodCulture(true); setFoodCulture(null) }
    const cityName = getCityName(cityKey) || city.name
    const countryName = city.countryEn || 'its country'
    const langName = lang === 'ko' ? '한국어' : lang === 'ja' ? '日本語' : lang === 'zh' ? '中文' : 'English'
    const prompt = `You are a travel food culture curator. Introduce the authentic food culture of "${cityName}" in ${countryName}.
CRITICAL: The dishes MUST be genuinely from ${countryName} / the "${cityName}" region. Do NOT invent or fabricate dishes, and do NOT substitute food from other countries — especially do NOT use ${langName}-speaking countries' cuisine unless "${cityName}" is actually located there. If you are unsure about "${cityName}" specifically, describe the broader authentic cuisine of ${countryName} rather than making something up.
Pick 3-4 representative dishes. For each, provide: name, a 2-3 sentence description covering its origin/history, why it developed in this region, and its taste/characteristics. Do NOT include any prices.
Exclude specific restaurant names or locations — focus on the food itself.
Respond ONLY with valid JSON (no markdown, no code fences) in this exact format:
{"intro":"1-2 sentence overview of the city's food culture","dishes":[{"name":"dish name","desc":"origin, history, why developed, taste"}]}
Write all descriptive text in ${langName}, but keep the food authentic to ${countryName}.`

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      const data = await res.json()
      const txt = (data.text || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      let parsed
      try {
        parsed = JSON.parse(txt)
      } catch (pe) {
        // 잘린 JSON 복구 시도: 마지막 완성된 dish까지만 살려서 파싱
        console.warn('[FoodCulture] 원본 응답 길이:', (data.text||'').length, '| 원문:', data.text)
        const repaired = txt.replace(/,\s*\{[^}]*$/, '').replace(/\]?\s*\}?\s*$/, '') + ']}'
        parsed = JSON.parse(repaired)
        console.warn('[FoodCulture] 잘린 JSON 복구 성공')
      }
      try { localStorage.setItem(cacheKey, JSON.stringify(parsed)) } catch {}
      setCityCache(fsKey, { food: parsed })
      if (returnOnly) return parsed
      setFoodCulture(parsed)
    } catch (e) {
      console.error('Food culture fetch error:', e)
      setFoodCulture({ error: true })
    } finally {
      setLoadingFoodCulture(false)
    }
  }

  // prefetch: 도시 진입 시 음식문화를 백그라운드로 미리 생성 (캐시에 저장만, UI 상태 안 건드림)
  const prefetchFoodCulture = async (city) => {
    if (!city) return
    const cityKey = city._koName || city.name
    const cacheKey = `foodCulture3_${cityKey}_${lang}`
    try { if (localStorage.getItem(cacheKey)) return } catch {}  // 이미 캐시 있으면 스킵
    const cityName = getCityName(cityKey) || city.name
    const countryName = city.countryEn || 'its country'
    const langName = lang === 'ko' ? '한국어' : lang === 'ja' ? '日本語' : lang === 'zh' ? '中文' : 'English'
    const prompt = `You are a travel food culture curator. Introduce the authentic food culture of "${cityName}" in ${countryName}.
CRITICAL: The dishes MUST be genuinely from ${countryName} / the "${cityName}" region. Do NOT invent or fabricate dishes, and do NOT substitute food from other countries — especially do NOT use ${langName}-speaking countries' cuisine unless "${cityName}" is actually located there. If you are unsure about "${cityName}" specifically, describe the broader authentic cuisine of ${countryName} rather than making something up.
Pick 3-4 representative dishes. For each, provide: name, a 2-3 sentence description covering its origin/history, why it developed in this region, and its taste/characteristics. Do NOT include any prices.
Exclude specific restaurant names or locations — focus on the food itself.
Respond ONLY with valid JSON (no markdown, no code fences) in this exact format:
{"intro":"1-2 sentence overview of the city's food culture","dishes":[{"name":"dish name","desc":"origin, history, why developed, taste"}]}
Write all descriptive text in ${langName}, but keep the food authentic to ${countryName}.`
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      const data = await res.json()
      const txt = (data.text || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      const parsed = JSON.parse(txt)
      try { localStorage.setItem(cacheKey, JSON.stringify(parsed)) } catch {}
    } catch {}  // prefetch 실패는 조용히 무시 (탭 누를 때 정식 fetch가 재시도)
  }

  // 추천탭: 장소 직접 검색 → 코스 추가용. 도시명을 쿼리에 붙여 옆 도시 혼입 방지 + 리뷰순 정렬
  const searchSpotsForCourse = async () => {
    const q = spotSearchQuery.trim()
    if (!q || !selectedCity) return
    setSpotSearchLoading(true)
    try {
      const langParam = lang === 'zh' ? 'zh-CN' : lang
      const cityKey = selectedCity._koName || selectedCity.name
      const cityNameEn = (CITY_I18N[cityKey] && CITY_I18N[cityKey][0]) || getCityName(cityKey)   // 도시명 영어로 (검색 정확도)
      const r = await fetch(`/api/places?query=${encodeURIComponent(cityNameEn + ' ' + q)}&lat=${selectedCity.lat}&lng=${selectedCity.lng}&language=${langParam}`)
      const d = await r.json()
      const sorted = (d.results || [])
        .filter(p => p.user_ratings_total)
        .sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0))  // 리뷰순
        .slice(0, 8)
      setSpotSearchResults(sorted)
    } catch { setSpotSearchResults([]) }
    finally { setSpotSearchLoading(false) }
  }

  // 검색한 장소를 추천 관광지 목록에 영구 추가 (필터가 놓친 명소 수동 구제, 캐시 삭제에도 생존)
  const addSpotToHotspots = async (r) => {
    if (!r?.place_id || !selectedCity) return
    if (hotspots.some(h => h.place_id === r.place_id)) return   // 중복 무시
    const cityKey = selectedCity._koName || selectedCity.name
    const fsKey = `${cityKey}_${lang}`
    const spot = { ...r, _manual: true }
    const merged = [...hotspots, spot].sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0))   // 리뷰순 재정렬
    setHotspots(merged)
    // 수동분은 별도 필드(manualHotspots)에 누적 저장 → hotspots 캐시를 지워도 생존, 재수집 시 자동 병합
    const prevManual = (() => { try { return JSON.parse(localStorage.getItem(`manualHotspots_${fsKey}`) || '[]') } catch { return [] } })()
    const nextManual = [...prevManual.filter(m => m.place_id !== spot.place_id), spot]
    try { localStorage.setItem(`manualHotspots_${fsKey}`, JSON.stringify(nextManual)) } catch {}
    try { localStorage.setItem(`hotspots_${fsKey}`, JSON.stringify(merged)) } catch {}
    try { await setCityCache(fsKey, { hotspots: merged, manualHotspots: nextManual }) } catch (e) { console.error('[수동추가] 저장 실패:', e?.message || e) }
  }
  const searchHotelsForCourse = async () => {
    const q = hotelSearchQuery.trim()
    if (!q || !selectedCity) return
    setHotelSearchLoading(true)
    try {
      const langParam = lang === 'zh' ? 'zh-CN' : lang
      const cityKey = selectedCity._koName || selectedCity.name
      const cityNameEn = (CITY_I18N[cityKey] && CITY_I18N[cityKey][0]) || getCityName(cityKey)
      const r = await fetch(`/api/places?query=${encodeURIComponent(cityNameEn + ' ' + q)}&lat=${selectedCity.lat}&lng=${selectedCity.lng}&language=${langParam}`)
      const d = await r.json()
      const sorted = (d.results || []).filter(p => p.user_ratings_total).sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0)).slice(0, 8)
      setHotelSearchResults(sorted)
    } catch { setHotelSearchResults([]) }
    finally { setHotelSearchLoading(false) }
  }
  // 최근 숙소 기록에 추가 (place_id 중복 제거, 최근 앞, 최대 8개)
  const pushRecentHotel = (hotel) => {
    const next = [hotel, ...recentHotels.filter(h => h.place_id !== hotel.place_id)].slice(0, 8)
    setRecentHotels(next); localStorage.setItem('atlas_recent_hotels', JSON.stringify(next))
  }
  const removeRecentHotel = (hotel) => {
    const next = recentHotels.filter(h => h.place_id !== hotel.place_id)
    setRecentHotels(next); localStorage.setItem('atlas_recent_hotels', JSON.stringify(next))
  }
  // 검색 결과(place)를 Day 숙소로 설정 (place=null이면 삭제)
  const setDayHotel = (dayIdx, place) => {
    const cityKey = selectedCity?._koName || selectedCity?.name || ''
    const hotel = place ? {
      name: place.name, displayName: place.name,
      cityName: cityKey, cityDisplayName: getCityName(cityKey),
      place_id: place.place_id,
      lat: place.geometry?.location?.lat, lng: place.geometry?.location?.lng,
      vicinity: place.vicinity || place.formatted_address || '',
      rating: place.rating ?? null
    } : null
    saveCourseDays(courseDays.map((d, i) => i === dayIdx ? { ...d, hotel } : d))
    if (hotel) pushRecentHotel(hotel)
    setHotelSearchDayIdx(null); setHotelSearchQuery(''); setHotelSearchResults([])
  }
  // 최근 기록의 숙소를 Day에 바로 적용 (검색 없이)
  const applyRecentHotel = (dayIdx, hotel) => {
    saveCourseDays(courseDays.map((d, i) => i === dayIdx ? { ...d, hotel } : d))
    pushRecentHotel(hotel)
    setHotelSearchDayIdx(null); setHotelSearchQuery(''); setHotelSearchResults([])
  }

  const fetchCityDescription = async (cityKey, countryEn, lng) => {
    const cacheKey = `atlas_citydesc_${cityKey}_${lng}`
    // 1) localStorage (같은 기기 재방문)
    try { const c = localStorage.getItem(cacheKey); if (c) return c } catch {}
    // 2) 추출 데이터 계층(countries/{국가}/cities/{도시})의 desc — Firebase 콘솔에서 직접 수정한 내용 반영
    try {
      const cdoc = await getCityDoc(countryEn || 'Unknown', cityKey)
      if (cdoc?.desc) { try { localStorage.setItem(cacheKey, cdoc.desc) } catch {}; return cdoc.desc }
    } catch {}
    // 3) Firestore 공용 캐시 (다른 사용자가 이미 생성한 것)
    const fsKey = `${cityKey}_${lng}`
    try {
      const cached = await getCityCache(fsKey)
      if (cached?.desc) { try { localStorage.setItem(cacheKey, cached.desc) } catch {}; return cached.desc }
    } catch {}
    // 3) Gemini 생성
    const langName = lng === 'ja' ? '日本語' : lng === 'zh' ? '中文(简体)' : lng === 'en' ? 'English' : '한국어'
    const prompt = `Write a 2-3 sentence travel introduction for the city "${cityKey}"${countryEn ? ` (${countryEn})` : ''} in ${langName}. Use a natural tone without exaggeration, and highlight what makes the city appealing to travelers. Output ONLY the introduction text — no quotation marks, no title, no extra explanation.`
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const data = await res.json()
      if (data.error) console.warn('[city desc] Gemini error (code', data.code, '):', data.error)
      const txt = (data.text || '').trim().replace(/^["'「『]+|["'」』]+$/g, '').trim()
      if (txt) { try { localStorage.setItem(cacheKey, txt) } catch {}; setCityCache(fsKey, { desc: txt }); return txt }
    } catch (e) { console.error('city description fetch error:', e) }
    return null
  }
  const fetchCityData = async (city) => {
    try {
      // 1. 사전 데이터 (정적) 즉시 표시
      const cityKey = city._koName || city.name
      const base = {}
      if (!base.weather) base.weather = { temp: '—', condition: '...', icon: '🌤️', humidity: '—' }
      // 소개글은 AI로 생성 (정적/제네릭 대신) — 캐시 있으면 즉시, 없으면 비워두고 아래서 생성
      let cachedDesc = null
      try { cachedDesc = localStorage.getItem(`atlas_citydesc_${cityKey}_${lang}`) } catch {}
      base.description = cachedDesc || ''
      setCityData(base)
      setLoading(false)
      if (!cachedDesc) {
        setDescFailed(false)
        fetchCityDescription(cityKey, city.countryEn || '', lang).then(d => {
          if (d) setCityData(prev => prev ? { ...prev, description: d } : prev)
          else setDescFailed(true)
        })
      }
      fetchWeather(city.lat, city.lng).then(w => {
        if (w) setCityData(prev => prev ? { ...prev, weather: w } : prev)
      }).catch(() => {})

    } catch(e) {
      console.error('fetchCityData error:', e)
      const cityKey2 = city._koName || city.name
      setCityData({
        weather: { temp: '—', condition: '—', icon: '🌤️', humidity: '—' },
        description: `${cityKey2}`,
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


  // ── 모바일 코스↔도시 패널 책넘기기 스와이프 (오른쪽 엣지 → 실시간 추적) ──
  const peekW = () => cityPanelRef.current?.offsetWidth || (typeof window !== 'undefined' ? window.innerWidth : 360)
  const PEEK_TRANS = 'transform .32s cubic-bezier(.16,1,.3,1)'
  // 코스 오른쪽 엣지에서 좌향으로 끌어 도시 패널 당겨오기
  const onPeekPullStart = (e) => {
    if (!selectedCity) return
    if (e.touches.length > 1) { peekDragRef.current.multi = true; return }
    const t = e.touches[0]
    peekDragRef.current = { active:true, mode:'pull', sx:t.clientX, sy:t.clientY, multi:false, st:Date.now() }
    if (cityPanelRef.current) cityPanelRef.current.style.transition = 'none'
  }
  const onPeekPullMove = (e) => {
    const d = peekDragRef.current
    if (!d.active || d.multi || d.mode !== 'pull') return
    const t = e.touches[0]
    const w = peekW()
    const pulled = Math.min(Math.max(0, d.sx - t.clientX), w)
    if (cityPanelRef.current) cityPanelRef.current.style.transform = `translateX(${w - pulled}px)`
  }
  const onPeekPullEnd = (e) => {
    const d = peekDragRef.current
    if (d.active && !d.multi && d.mode === 'pull') {
      const t = e.changedTouches[0]
      const dist = Math.max(0, d.sx - t.clientX), vel = dist / Math.max(1, Date.now() - d.st)
      const open = dist > peekW() * 0.2 || (vel > 0.4 && dist > 24)
      if (cityPanelRef.current) {
        cityPanelRef.current.style.transition = PEEK_TRANS
        cityPanelRef.current.style.transform = open ? 'translateX(0)' : 'translateX(100%)'
      }
      setCityPeek(open)
    }
    peekDragRef.current.active = false; peekDragRef.current.multi = false
  }
  // 도시 패널에서 우향으로 밀어 코스로 복귀 (세로 스크롤과 구분)
  const onPeekDismissStart = (e) => {
    if (!cityPeek) return
    if (e.touches.length > 1) { peekDragRef.current.multi = true; return }
    const t = e.touches[0]
    peekDragRef.current = { active:true, mode:null, sx:t.clientX, sy:t.clientY, multi:false, st:Date.now() }
  }
  const onPeekDismissMove = (e) => {
    const d = peekDragRef.current
    if (!cityPeek || !d.active || d.multi) return
    const t = e.touches[0]
    const dx = t.clientX - d.sx, dy = t.clientY - d.sy
    if (d.mode === null) {
      if (Math.abs(dx) > Math.abs(dy) + 6 && dx > 0) { d.mode = 'dismiss'; if (cityPanelRef.current) cityPanelRef.current.style.transition = 'none' }
      else if (Math.abs(dy) > Math.abs(dx)) { d.mode = 'scroll' }
    }
    if (d.mode === 'dismiss' && cityPanelRef.current) cityPanelRef.current.style.transform = `translateX(${Math.max(0, dx)}px)`
  }
  const onPeekDismissEnd = (e) => {
    const d = peekDragRef.current
    if (cityPeek && d.active && d.mode === 'dismiss') {
      const t = e.changedTouches[0]
      const dist = Math.max(0, t.clientX - d.sx), vel = dist / Math.max(1, Date.now() - d.st)
      const close = dist > peekW() * 0.2 || (vel > 0.4 && dist > 24)
      if (cityPanelRef.current) {
        cityPanelRef.current.style.transition = PEEK_TRANS
        cityPanelRef.current.style.transform = close ? 'translateX(100%)' : 'translateX(0)'
      }
      if (close) setCityPeek(false)
    }
    peekDragRef.current.active = false; peekDragRef.current.multi = false
  }

  const closePanel = () => {
    // 줌 그대로 유지 — 도시 패널은 줌 상태에 영향 주지 않음
    setSelectedCity(null); setCityData(null); setSelectedSpot(null); setSidePanel(null)
  }

  const closeCountry = () => {
    // 줌아웃 없이 상태만 초기화 — 현재 뷰 그대로 유지
    setSelectedCountry(null); setSelectedCity(null); setCityData(null); setSelectedSpot(null); setShowCountryInfo(false)
  }

  // Search: all cities + all spots across all countries
  const allCities = Object.entries(COUNTRY_CITIES).flatMap(([country, cities]) =>
    cities.map(c => ({ ...c, _koName: c.name, countryEn: country, countryKo: getCountryName(country) }))
  )
  // Build spot search index
  const searchItems = [...allCities]  // 도시 검색 소스
  // 국가명 매칭 → 결과 맨 위에 국가 항목 추가
  const matchedCountries = searchQuery.length >= 1
    ? countries.filter(feat => {
        const en = feat.properties.NAME, ko = getCountryName(en) || ''
        const q = searchQuery.toLowerCase()
        return ko.includes(searchQuery) || en.toLowerCase().includes(q)
      }).slice(0, 3).map(feat => ({ _isCountry: true, _feat: feat, countryEn: feat.properties.NAME, name: getCountryName(feat.properties.NAME) }))
    : []
  const filteredCities = searchQuery.length >= 1
    ? searchItems.filter(c => {
        const q = searchQuery.toLowerCase()
        const koName = c._koName || c.name
        const trName = getCityName(koName)?.toLowerCase() || ''
        return koName?.includes(searchQuery) || trName.includes(q) || c.countryKo?.toLowerCase().includes(q) || c.countryEn?.toLowerCase().includes(q)
      }).slice(0, 10)
    : []
  const filtered = [...matchedCountries, ...filteredCities].slice(0, 10)

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

        @keyframes sidePanelIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes courseBasketIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes coursePop{0%{transform:scale(1)}50%{transform:scale(1.25)}100%{transform:scale(1)}}
        @keyframes courseSlideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes coursePlannerIn{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes swipeFingerMove{0%{transform:translateX(10px)}50%{transform:translateX(-14px)}100%{transform:translateX(10px)}}
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
      <div ref={globeContainerRef} style={{position:'absolute',inset:0,zIndex:0,touchAction:'none'}}/>

      {/* Header */}
      <div style={{
        position:'absolute',top:0,left:0,right:isMobile?0:(selectedCity?(sidePanel?840:420):0),zIndex:1000,
        background:'transparent',
        padding:isMobile?'12px 12px 14px':'16px 20px 18px',pointerEvents:'none',
        transition:'right .42s cubic-bezier(.16,1,.3,1)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:isMobile?4:12,pointerEvents:'all'}}>
          <div style={{display:'flex',alignItems:'center',gap:isMobile?4:10,position:'relative'}}>
            <div onClick={()=>{setShowHamburger(v=>!v);setShowLangMenu(false)}} style={{width:isMobile?28:40,height:isMobile?28:40,borderRadius:isMobile?8:11,background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'transform .15s'}}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
              <svg width={isMobile?"16":"20"} height={isMobile?"16":"20"} viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div style={{fontSize:isMobile?12:20,fontWeight:800,letterSpacing:'-.5px',color:'white',lineHeight:1}}>ATLAS</div>
              {!isMobile && <div style={{fontSize:9,color:'rgba(255,255,255,.6)',letterSpacing:'2.5px',textTransform:'uppercase'}}>{t('appSub')}</div>}
            </div>
            {/* Hamburger Dropdown */}
            {showHamburger && (
              <div style={{position:'absolute',top:'calc(100% + 10px)',left:0,background:'rgba(252,250,247,.98)',backdropFilter:'blur(20px)',border:'1px solid #e0d9d0',borderRadius:16,overflow:'hidden',zIndex:2001,boxShadow:'0 16px 48px rgba(0,0,0,.5)',width:isMobile?Math.min(340,window.innerWidth-24):340,maxHeight:'75vh',overflowY:'auto'}}>
                {/* 저장된 코스 */}
                <div style={{padding:'16px 16px 10px',borderBottom:'1px solid #ede8e0'}}>
                  {/* 저장된 코스 (AI·수동 통합) */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <span style={{fontSize:13,fontWeight:700,color:'#1a1714'}}>{t('menuSavedCourses')}</span>
                    <span style={{fontSize:11,color:'#9a8070'}}>{savedCourses.length}</span>
                  </div>
                  {savedCourses.length === 0 ? (
                    <div style={{padding:'10px 0',textAlign:'center',color:'#9a8070',fontSize:11}}>{t('menuNoSaved')}</div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:5}}>
                      {savedCourses.map((sc) => (
                        <div key={sc.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,background:'rgba(200,133,106,.08)',border:'1px solid rgba(200,133,106,.2)'}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:'#1a1714',lineHeight:1.4}}>{(() => {
                              const cities = [...new Set((sc.days||[]).flatMap(d=>(d.items||[]).map(it=>getCityName(it.cityName||it.name))).filter(Boolean))]
                              return cities.length > 0 ? `${cities.join(' · ')} ${(sc.days||[]).length}${lang==='ko'?'일':'D'}` : sc.name
                            })()}</div>
                            <div style={{fontSize:10,color:'#9a8070',marginTop:2}}>{(sc.days||[]).reduce((a,d)=>a+(d.items||[]).length,0)}{t('coursePlace')} · {(sc.days||[]).length}{t('courseDay')}</div>
                          </div>
                          <button onClick={()=>loadSavedCourse(sc)} style={{background:'#f5efe8',border:'1px solid #e8dcd0',color:'#1a1714',padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer'}}>{t('courseLoad')}</button>
                          <button onClick={()=>{
                            if (!currentUser) { setShowLoginModal(true); setShowHamburger(false); return }
                            setShareModalCourse({ days: sc.days||[], transport: sc.transport||'transit', type: sc.type||'manual' })
                            setShowHamburger(false)
                          }} title={t('shareBtn')} style={{background:'#f5efe8',border:'1px solid #e8dcd0',color:'#1a1714',padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer'}}>{t('shareBtn')}</button>
                          <button onClick={()=>{if(confirm(t('courseDeleteConfirm')))deleteSavedCourse(sc.id)}} style={{background:'none',border:'none',color:'#ef4444',fontSize:11,fontWeight:600,cursor:'pointer',padding:'2px 6px'}}>{t('courseDelete')}</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* 즐겨찾기 */}
                <div style={{padding:'12px 16px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                    <span style={{fontSize:14,fontWeight:700,color:'#1a1714'}}>{t('favTitle')}</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:11,color:'#9a8070'}}>{favorites.length}</span>
                      {favorites.length > 0 && (
                        <button onClick={()=>{if(confirm(t('favDeleteConfirm')))saveFavorites([])}}
                          style={{background:'none',border:'none',color:'#ef4444',fontSize:10,cursor:'pointer',fontWeight:600}}>{t('favDeleteAll')}</button>
                      )}
                    </div>
                  </div>
                  {favorites.length === 0 ? (
                    <div style={{padding:'16px 0',textAlign:'center',color:'#9a8070',fontSize:12}}>{t('favEmpty')}</div>
                  ) : (
                    <div>
                      {favorites.filter(f=>f.type==='city').length > 0 && (
                        <div style={{marginBottom:6}}>
                          <div style={{fontSize:10,color:'#9a8070',letterSpacing:2,padding:'4px 0',textTransform:'uppercase'}}>{t('favCity')}</div>
                          {favorites.filter(f=>f.type==='city').map((f,i)=>(
                            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 8px',borderRadius:8,cursor:'pointer',transition:'background .15s'}}
                              onMouseEnter={e=>e.currentTarget.style.background='#ede8e0'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                              onClick={()=>{const allC=Object.entries(COUNTRY_CITIES).flatMap(([co,cs])=>cs.map(c=>({...c,countryEn:co})));const city=allC.find(c=>c.name===f._koName);if(city){const feat=countries.find(ft=>ft.properties?.NAME===city.countryEn);if(feat)setSelectedCountry(feat);setTimeout(()=>handleCityClickRef.current?.(city),300)};setShowHamburger(false)}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:12,fontWeight:600,color:'#1a1714',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{getCityName(f._koName||f.name)||f.displayName||f.name}</div>
                                <div style={{fontSize:10,color:'#9a8070'}}>{f.countryEn?getCountryName(f.countryEn):(f.countryName||'')}</div>
                              </div>
                              <button onClick={e=>{e.stopPropagation();toggleFav(f)}} style={{background:'none',border:'none',color:'#9a8070',fontSize:13,cursor:'pointer',padding:2}}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {favorites.filter(f=>f.type==='spot').length > 0 && (
                        <div style={{marginBottom:6}}>
                          <div style={{fontSize:10,color:'#9a8070',letterSpacing:2,padding:'4px 0',textTransform:'uppercase'}}>{t('favSpot')}</div>
                          {favorites.filter(f=>f.type==='spot').map((f,i)=>(
                            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 8px',borderRadius:8,cursor:'pointer',transition:'background .15s'}}
                              onMouseEnter={e=>e.currentTarget.style.background='#ede8e0'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                              onClick={()=>{if(f.cityName){const allC=Object.entries(COUNTRY_CITIES).flatMap(([co,cs])=>cs.map(c=>({...c,countryEn:co})));const city=allC.find(c=>c.name===f.cityName);if(city){const feat=countries.find(ft=>ft.properties?.NAME===city.countryEn);if(feat)setSelectedCountry(feat);setTimeout(()=>handleCityClickRef.current?.(city),300)}};setShowHamburger(false)}}>
                              
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:12,fontWeight:600,color:'#1a1714',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                                <div style={{fontSize:10,color:'#9a8070'}}>{getCityName(f.cityName)||f.cityDisplayName||f.cityName||''}</div>
                              </div>
                              <button onClick={e=>{e.stopPropagation();toggleFav(f)}} style={{background:'none',border:'none',color:'#9a8070',fontSize:13,cursor:'pointer',padding:2}}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {favorites.filter(f=>f.type==='hotspot'||f.type==='restaurant').length > 0 && (
                        <div>
                          <div style={{fontSize:10,color:'#9a8070',letterSpacing:2,padding:'4px 0',textTransform:'uppercase'}}>{t('favHotspot')} · {t('favFood')}</div>
                          {favorites.filter(f=>f.type==='hotspot'||f.type==='restaurant').map((f,i)=>(
                            <a key={i} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.name)}&query_place_id=${f.place_id||''}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{display:'flex',alignItems:'center',gap:8,padding:'7px 8px',borderRadius:8,textDecoration:'none',transition:'background .15s'}}
                              onMouseEnter={e=>e.currentTarget.style.background='#ede8e0'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                              <span style={{fontSize:10,width:24,height:24,borderRadius:6,background:f.type==='hotspot'?'#f5f0ea':'#eef5ea',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:f.type==='hotspot'?'#c8856a':'#6fa870'}}>{f.type==='hotspot'?'H':'F'}</span>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:12,fontWeight:600,color:'#1a1714',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(f.place_id && hotspots.find(p=>p.place_id===f.place_id))?.name || f.name}</div>
                                <div style={{fontSize:10,color:'#9a8070'}}>{f.rating?` ${f.rating}`:''} {getCityName(f.cityName)||f.cityDisplayName||''}</div>
                              </div>
                              <button onClick={e=>{e.preventDefault();e.stopPropagation();toggleFav(f)}} style={{background:'none',border:'none',color:'#9a8070',fontSize:13,cursor:'pointer',padding:2}}>✕</button>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 트래블 피드 */}
                <div style={{padding:'12px 16px 14px',borderTop:'1px solid #ede8e0'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'8px 12px',borderRadius:10,background:'#f5f0ea',border:'1px solid #ede8e0',transition:'all .15s'}}
                    onClick={async()=>{
                      setShowFeed(true);setShowHamburger(false);setFeedSubTab('all');setFeedJournalsLoading(true)
                      try{
                        const data=await loadJournals({ limitN: 30 })
                        setFeedJournals(data)
                      }catch(e){console.error('[ATLAS] loadJournals failed:',e)}
                      setFeedJournalsLoading(false)
                      // 코스 데이터도 미리 로드 (탭 전환 시 즉시 표시)
                      try{const cd=await loadSharedCourses();setCommunityCoursesData(cd)}catch(e){}
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background='#ede8e0'}
                    onMouseLeave={e=>e.currentTarget.style.background='#f5f0ea'}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'#1a1714'}}>{t('travelFeed')}</div>
                        <div style={{fontSize:10,color:'#9a8070',marginTop:2}}>{t('travelFeedDesc')}</div>
                      </div>
                    </div>
                    
                  </div>
                </div>

                {/* 사용자 추천 코스 */}
                <div style={{padding:'0 16px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'8px 12px',borderRadius:10,background:'#f5f0ea',border:'1px solid #ede8e0',transition:'all .15s'}}
                    onClick={async()=>{
                      setShowCommunity(true);setShowHamburger(false);setCommunityLoading(true)
                      try{const cd=await loadSharedCourses();setCommunityCoursesData(cd)}catch(e){console.error('[ATLAS] loadSharedCourses failed:',e)}
                      setCommunityLoading(false)
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background='#ede8e0'}
                    onMouseLeave={e=>e.currentTarget.style.background='#f5f0ea'}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'#1a1714'}}>{({ko:'사용자 추천 코스',en:'Community Courses',ja:'おすすめコース',zh:'推荐路线'})[lang]||'사용자 추천 코스'}</div>
                        <div style={{fontSize:10,color:'#9a8070',marginTop:2}}>{({ko:'다른 여행자들이 공유한 코스',en:'Courses shared by travelers',ja:'旅行者が共有したコース',zh:'旅行者分享的路线'})[lang]||'다른 여행자들이 공유한 코스'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 내 여행 기록 */}
                <div style={{padding:'0 16px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'8px 12px',borderRadius:10,background:'#f5f0ea',border:'1px solid #ede8e0',transition:'all .15s'}}
                    onClick={()=>{setShowMyTravels(true);setShowHamburger(false)}}
                    onMouseEnter={e=>e.currentTarget.style.background='#ede8e0'}
                    onMouseLeave={e=>e.currentTarget.style.background='#f5f0ea'}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'#1a1714'}}>{t('visitedTitle')}</div>
                        <div style={{fontSize:10,color:'#9a8070',marginTop:2}}>
                          {visitedCityCount}{t('visitedCityCount')} · {(()=>{const vc=new Set();(visited.cities||[]).forEach(c=>{const entry=Object.entries(COUNTRY_CITIES).find(([_,cs])=>cs.some(x=>x.name===c));if(entry)vc.add(entry[0])});return vc.size})()}{lang==='ko'?'개국':' countries'}
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>

                {/* 환율 계산기 */}
                <div style={{padding:'0 16px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'8px 12px',borderRadius:10,background:'#f5f0ea',border:'1px solid #ede8e0',transition:'all .15s'}}
                    onClick={()=>{
                      setShowCurrencyCalc(true);setShowHamburger(false)
                      if(selectedCountry){
                        const cn=selectedCountry.properties?.NAME
                        const ci=COUNTRY_INFO[cn]
                        if(ci){const code=extractCurrencyCode(ci.currency);if(code&&code!=='KRW'){setCurrTo(code)}}
                      }
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background='#ede8e0'}
                    onMouseLeave={e=>e.currentTarget.style.background='#f5f0ea'}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'#1a1714'}}>{t('currCalc')}</div>
                        <div style={{fontSize:10,color:'#9a8070',marginTop:2}}>{currFrom}  {currTo}</div>
                      </div>
                    </div>
                    
                  </div>
                </div>

                {/* 로그인/계정 */}
                <div style={{padding:'0 16px 14px'}}>
                  {currentUser ? (
                    <div style={{padding:'8px 12px',borderRadius:10,background:'#f5f0ea',border:'1px solid #ede8e0'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                        <div style={{width:28,height:28,borderRadius:'50%',background:'#c8856a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'white'}}>{(currentUser.displayName || currentUser.email)?.[0]?.toUpperCase() || '?'}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:700,color:'#1a1714',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{currentUser.displayName || currentUser.email}</div>
                          {currentUser.displayName && <div style={{fontSize:10,color:'#9a8070',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{currentUser.email}</div>}
                        </div>
                      </div>
                      {/* 홈 국가 설정 */}
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                        <span style={{fontSize:10,color:'#9a8070',whiteSpace:'nowrap'}}>{lang==='ko'?'홈 국가':'Home'}</span>
                        <select value={homeCountry} onChange={e=>{setHomeCountry(e.target.value);localStorage.setItem('atlas_home_country',e.target.value);const code=extractCurrencyCode(COUNTRY_INFO[e.target.value]?.currency);if(code)setCurrFrom(code)}}
                          style={{flex:1,padding:'4px 6px',borderRadius:6,border:'1px solid #e0d9d0',background:'#ede8e0',color:'#1a1714',fontSize:11,cursor:'pointer'}}>
                          <option value="" style={{background:'#f5f0ea'}}>—</option>
                          {Object.keys(COUNTRY_INFO).sort().map(c=><option key={c} value={c} style={{background:'#f5f0ea'}}>{COUNTRY_INFO[c].emoji} {lang==='ko'?c:c}</option>)}
                        </select>
                      </div>
                      <button onClick={()=>{handleLogout();setShowHamburger(false)}}
                        style={{width:'100%',padding:'6px',borderRadius:8,border:'1px solid rgba(239,68,68,.3)',background:'rgba(239,68,68,.1)',color:'#f87171',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                        {lang==='ko'?'로그아웃':'Logout'}
                      </button>
                    </div>
                  ) : (
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'8px 12px',borderRadius:10,background:'#f5f0ea',border:'1px solid #ede8e0',transition:'all .15s'}}
                      onClick={()=>{setShowLoginModal(true);setShowHamburger(false)}}
                      onMouseEnter={e=>e.currentTarget.style.background='#ede8e0'}
                      onMouseLeave={e=>e.currentTarget.style.background='#f5f0ea'}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:'#1a1714'}}>{lang==='ko'?'로그인 / 회원가입':'Login / Sign up'}</div>
                          <div style={{fontSize:10,color:'#9a8070',marginTop:2}}>{lang==='ko'?'데이터 클라우드 동기화':'Sync your data'}</div>
                        </div>
                      </div>
                      
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Language Selector */}
          <div style={{position:'relative',marginLeft:isMobile?0:8}}>
            <button onClick={()=>{setShowLangMenu(v=>!v);setShowHamburger(false)}}
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
            <button onClick={()=>{setShowAiModal(true);setShowLangMenu(false);setShowHamburger(false)}}
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
                    if (c._isCountry) { handleCountryClick(c._feat); setSearchQuery(''); setShowDrop(false); return }
                    const feat = countries.find(f => f.properties.NAME === c.countryEn)
                    if (feat) { setSelectedCountry(feat); }
                    setTimeout(() => handleCityClick(c), 300)
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
                        {c._isCountry ? c.name : getCityName(c._koName || c.name)}
                      </div>
                      <div style={{fontSize:11,color:'#94a3b8'}}>
                        {c._isCountry ? (({ko:'국가',en:'Country',ja:'国',zh:'国家'})[lang]||'국가') : c.countryKo}
                      </div>
                    </div>
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
            {/* Country Info Panel (단일 통합 UI — 하단 바 역할 겸함) */}
            {info && (
              <div className="countryInfoPanel" style={{
                position:'absolute',bottom:isMobile?'calc(80px + env(safe-area-inset-bottom))':44,left:'50%',transform:'translateX(-50%)',
                zIndex:1000,width:isMobile?'82vw':480,maxWidth:'95vw',
                maxHeight:isMobile?'44vh':'none',
                display:'flex',flexDirection:'column',
                background:'linear-gradient(160deg, #2e323c 0%, #23262e 55%, #1b1e25 100%)',
                border:'1px solid rgba(201,168,106,.35)',borderRadius:18,
                boxShadow:'0 16px 56px rgba(0,0,0,.5)',
                overflow:'hidden',
              }}>
                {/* Header */}
                <div onClick={() => setInfoExpanded(v => !v)} style={{
                  background:'linear-gradient(135deg, rgba(201,168,106,.14), rgba(201,168,106,.03))',
                  borderBottom: infoExpanded ? '1px solid rgba(201,168,106,.18)' : 'none', padding:'10px 13px',
                  cursor:'pointer', userSelect:'none', flexShrink:0,
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:800,color:'#e8d9b8',letterSpacing:'-.3px'}}>{countryKo}</div>
                      <div style={{fontSize:9.5,color:'#9a8f7a',fontWeight:500}}>{cName} · {info.continent}</div>
                    </div>
                    <span style={{fontSize:11,color:'#8a7f6a',flexShrink:0}}>{infoExpanded ? '▼' : '▲'}</span>
                    <button onClick={(e) => { e.stopPropagation(); closeCountry() }} style={{background:'rgba(255,255,255,.08)',border:'none',borderRadius:10,width:22,height:22,padding:0,cursor:'pointer',fontSize:11,color:'#b5a98e',fontWeight:700,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}} aria-label="close">✕</button>
                  </div>
                  <div style={{fontSize:10,color:'#9a8f7a',lineHeight:1.4}}>"{info.tagline}"</div>
                </div>

                {infoExpanded && (
                <div style={{flex:1,overflowY:'auto',minHeight:0}}>
                  <div style={{padding:'8px 14px 12px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0'}}>
                    {[
                      { icon:'capital', label:t('lCapital'), value:info.capital },
                      { icon:'pop', label:t('lPop'), value:info.population },
                      { icon:'area', label:t('lArea'), value:info.area },
                      { icon:'lang', label:t('lLang'), value:info.lang },
                      { icon:'currency', label:t('lCurrency'), value:info.currency },
                      { icon:'timezone', label:t('lTimezone'), value:info.timezone },
                      { icon:'season', label:t('lBestSeason'), value: translateBestSeason(info.bestSeason) },
                      { icon:'continent', label:t('lContinent'), value:info.continent },
                      { icon:'voltage', label:t('lVoltage'), value:info.voltage },
                      { icon:'callCode', label:t('lCallCode'), value:info.callCode },
                      { icon:'drive', label:t('lDrive'), value:info.drive },
                      { icon:'cityCount', label:t('lCityCount'), value: cities ? `${cities.length}${t('registered')}` : '—' },
                    ].map((item, i) => (
                      <div key={i} style={{
                        display:'flex',alignItems:'center',gap:9,
                        padding:'7px 4px',
                        borderBottom: i < 10 ? '1px solid rgba(255,255,255,.05)' : 'none',
                      }}>
                        <InfoIcon type={item.icon} />
                        <div style={{minWidth:0}}>
                          <div style={{fontSize:9,color:'#c9a86a',fontWeight:600,letterSpacing:'.5px',lineHeight:1}}>{item.label}</div>
                          <div style={{fontSize:11.5,color:'#ecedf0',fontWeight:600,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const em = EMERGENCY_CONTACTS[cName]
                    if (!em) return null
                    const items = [
                      em.police && {icon:'police',label:t('emergPolice'),num:em.police},
                      em.ambulance && {icon:'ambulance',label:t('emergAmbulance'),num:em.ambulance},
                      em.fire && {icon:'fire',label:t('emergFire'),num:em.fire},
                      em.tourist && {icon:'tourist',label:t('emergTourist'),num:em.tourist},
                      em.general && {icon:'callCode',label:t('emergGeneral'),num:em.general},
                    ].filter(Boolean)
                    return (
                      <div style={{padding:'8px 14px 10px',borderTop:'1px solid rgba(201,168,106,.18)'}}>
                        <div style={{fontSize:10,fontWeight:700,color:'#c9a86a',letterSpacing:'1px',marginBottom:7}}>{t('emergTitle')}</div>
                        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(3,1fr)',gap:5}}>
                          {items.map((it,i)=>(
                            <a key={i} href={`tel:${it.num}`} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 9px',borderRadius:9,background:'rgba(255,255,255,.04)',border:'1px solid rgba(201,168,106,.2)',textDecoration:'none',minWidth:0,overflow:'hidden'}}>
                              <InfoIcon type={it.icon} size={16} color="#d4b878" />
                              <div style={{minWidth:0,overflow:'hidden'}}>
                                <div style={{fontSize:8.5,color:'#9a8f7a',fontWeight:500,lineHeight:1}}>{it.label}</div>
                                <div style={{fontSize:12,fontWeight:700,color:'#e8d9b8',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{it.num}</div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  <div style={{borderTop:'1px solid rgba(255,255,255,.05)',padding:'8px 14px',textAlign:'center'}}>
                    <span style={{fontSize:10,color:'#7a7268'}}>{t('cityInfoHint')}</span>
                  </div>
                </div>
                )}
              </div>
            )}
          </>
        )
      })()}

      {/* Hint */}
      {guideOpen && guideData && (
        <div style={{position:'fixed',inset:0,zIndex:2100,background:'#faf7f2',overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
          <div style={{position:'sticky',top:0,zIndex:10,background:'rgba(250,247,242,.95)',backdropFilter:'blur(12px)',borderBottom:'1px solid #e8e0d5',padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontSize:isMobile?17:20,fontWeight:800,color:'#1a1714'}}>{guideData.cityName} {({ko:'여행 AI 가이드',en:'Travel AI Guide',ja:'旅行AIガイド',zh:'AI旅行指南'})[lang]||'여행 AI 가이드'}</div>
            <button onClick={()=>setGuideOpen(false)} style={{width:36,height:36,borderRadius:'50%',border:'none',background:'#f0e9e0',color:'#8a7a68',fontSize:20,cursor:'pointer',lineHeight:1,flexShrink:0}}>×</button>
          </div>
          <div style={{maxWidth:720,margin:'0 auto',padding:isMobile?'16px':'24px 20px'}}>
            {[
              {key:'desc', label:({ko:'도시 소개',en:'About',ja:'都市紹介',zh:'城市介绍'})[lang]||'도시 소개'},
              {key:'course', label:({ko:'추천 코스',en:'Course',ja:'おすすめコース',zh:'推荐路线'})[lang]||'추천 코스'},
              {key:'food', label:({ko:'음식문화',en:'Food Culture',ja:'食文化',zh:'美食文化'})[lang]||'음식문화'},
              {key:'weather', label:({ko:'시즌별 날씨',en:'Weather by Season',ja:'季節の天気',zh:'季节天气'})[lang]||'시즌별 날씨'},
              {key:'transport', label:({ko:'이동·교통 팁',en:'Transport Tips',ja:'交通のヒント',zh:'交通提示'})[lang]||'이동·교통 팁'},
              {key:'etiquette', label:({ko:'주의사항·에티켓',en:'Tips & Etiquette',ja:'マナー',zh:'注意事项'})[lang]||'주의사항·에티켓'},
            ].map(sec => {
              const loadingTxt = ({ko:'불러오는 중...',en:'Loading...',ja:'読込中...',zh:'加载中...'})[lang]||'불러오는 중...'
              return (
                <div key={sec.key} style={{marginBottom:isMobile?16:24,background:'#fff',borderRadius:16,padding:isMobile?16:20,boxShadow:'0 2px 12px rgba(0,0,0,.05)'}}>
                  <div style={{fontSize:isMobile?15:16,fontWeight:800,color:'#c8856a',marginBottom:12}}>{sec.label}</div>
                  {sec.key === 'desc' && (
                    <div style={{fontSize:14,color:'#475569',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{guideData.desc || loadingTxt}</div>
                  )}
                  {sec.key === 'course' && (
                    guideData.course && guideData.course.length > 0 ? (
                      <div>
                        {guideData.course.map((day, di) => (
                          <div key={di} style={{marginBottom:di < guideData.course.length-1 ? 22 : 0}}>
                            {guideData.course.length > 1 && <div style={{fontSize:14,fontWeight:800,color:'#1a1714',marginBottom:10}}>Day {di+1}</div>}
                            {(day.items||[]).map((it, ii) => (
                              <div key={ii} style={{display:'flex',gap:12,marginBottom:12,alignItems:'flex-start'}}>
                                <div style={{flexShrink:0,width:26,height:26,borderRadius:'50%',background:'#c8856a',color:'#fff',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{ii+1}</div>
                                {it.photo_ref && (
                                  <div style={{width:64,height:64,borderRadius:10,background:'#f0e9e1',flexShrink:0}}/>
                                )}
                                <div style={{flex:1,minWidth:0,paddingTop:2}}>
                                  <div style={{fontSize:14,fontWeight:700,color:'#1a1714'}}>{it.displayName || it.name}</div>
                                  {it.vicinity && <div style={{fontSize:12,color:'#94a3b8',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.vicinity}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : <div style={{fontSize:14,color:'#475569'}}>{loadingTxt}</div>
                  )}
                  {sec.key === 'food' && (
                    guideData.food && !guideData.food.error ? (
                      <div>
                        {guideData.food.intro && <div style={{fontSize:14,color:'#475569',lineHeight:1.7,marginBottom:12}}>{guideData.food.intro}</div>}
                        {(guideData.food.dishes||[]).map((d,i) => (
                          <div key={i} style={{marginTop:i>0?12:0,paddingTop:i>0?12:0,borderTop:i>0?'1px solid #f0e9e0':'none'}}>
                            <div style={{fontSize:14,fontWeight:700,color:'#1a1714',marginBottom:3}}>{d.name}</div>
                            <div style={{fontSize:13,color:'#64748b',lineHeight:1.6}}>{d.desc}</div>
                          </div>
                        ))}
                      </div>
                    ) : <div style={{fontSize:14,color:'#475569'}}>{guideData.food?.error ? loadingTxt : loadingTxt}</div>
                  )}
                  {sec.key === 'weather' && (
                    <div style={{fontSize:14,color:'#475569',lineHeight:1.7}}>{guideData.extra?.weather || loadingTxt}</div>
                  )}
                  {sec.key === 'transport' && (
                    <div style={{fontSize:14,color:'#475569',lineHeight:1.7}}>{guideData.extra?.transport || loadingTxt}</div>
                  )}
                  {sec.key === 'etiquette' && (
                    <div style={{fontSize:14,color:'#475569',lineHeight:1.7}}>{guideData.extra?.etiquette || loadingTxt}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {galleryView && (() => {
        const gv = galleryView
        const list = gv.photos || []
        const cur = list[gv.idx] || {}
        const go = (d) => setGalleryView(g => { const n = (g.idx + d + list.length) % list.length; return { ...g, idx: n } })
        return (
          <div onClick={()=>setGalleryView(null)} style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(0,0,0,.9)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}
            onTouchStart={e=>{ e.currentTarget.dataset.sx = e.touches[0].clientX }}
            onTouchEnd={e=>{ const sx=parseFloat(e.currentTarget.dataset.sx||'0'); const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>50 && list.length>1) go(dx<0?1:-1) }}>
            <div onClick={e=>e.stopPropagation()} style={{position:'relative',maxWidth:'92vw',maxHeight:'80vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <img src={cur.url||cur} alt="" style={{maxWidth:'92vw',maxHeight:'80vh',objectFit:'contain',borderRadius:8}}/>
              {list.length>1 && (<>
                <button onClick={()=>go(-1)} style={{position:'absolute',left:-6,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.9)',border:'none',width:44,height:44,borderRadius:'50%',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 10px rgba(0,0,0,.3)'}}>‹</button>
                <button onClick={()=>go(1)} style={{position:'absolute',right:-6,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.9)',border:'none',width:44,height:44,borderRadius:'50%',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 10px rgba(0,0,0,.3)'}}>›</button>
              </>)}
            </div>
            <div style={{marginTop:16,display:'flex',gap:12,alignItems:'center'}}>
              <span style={{color:'#fff',fontSize:14,fontWeight:600}}>{gv.idx+1} / {list.length}</span>
              {list.length>1 && (gv.idx===0 ? (
                <span style={{background:'rgba(13,148,136,.9)',color:'#fff',padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:700}}>★ 대표</span>
              ) : (
                <button onClick={async(e)=>{ e.stopPropagation()
                  try { const reordered=await setAttractionCoverPhoto(gv.country,gv.city,gv.placeId,cur)
                    setAttrPhotos(pc=>({...pc,[gv.placeId]:reordered}))
                    setGalleryView(g=>({...g,photos:reordered,idx:0}))
                  } catch(err){ alert('대표 설정 실패: '+(err?.message||err)) }
                }} style={{background:'#0d9488',color:'#fff',border:'none',padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>대표로 설정</button>
              ))}
              <button onClick={async(e)=>{ e.stopPropagation(); if(!confirm('이 사진을 삭제할까요?')) return
                try { const rest=await deleteAttractionPhoto(gv.country,gv.city,gv.placeId,cur)
                  setAttrPhotos(pc=>({...pc,[gv.placeId]:rest}))
                  if(!rest.length) setGalleryView(null)
                  else setGalleryView(g=>({...g,photos:rest,idx:Math.min(g.idx,rest.length-1)}))
                } catch(err){ alert('삭제 실패: '+(err?.message||err)) }
              }} style={{background:'#dc2626',color:'#fff',border:'none',padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>삭제</button>
              <button onClick={()=>setGalleryView(null)} style={{background:'rgba(255,255,255,.9)',color:'#333',border:'none',padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>닫기</button>
            </div>
          </div>
        )
      })()}
      {nlOpen && (
        <div onClick={()=>!nlLoading&&setNlOpen(false)} style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:560,background:'#fff',borderRadius:'20px 20px 0 0',padding:'22px 20px calc(22px + env(safe-area-inset-bottom))',boxShadow:'0 -8px 30px rgba(0,0,0,.2)'}}>
            <div style={{fontSize:16,fontWeight:800,color:'#1a1714',marginBottom:6}}>{({ko:'AI 코스 만들기',en:'AI Course',ja:'AIコース',zh:'AI行程'})[lang]||'AI 코스 만들기'}</div>
            <div style={{fontSize:12,color:'#94a3b8',marginBottom:14,lineHeight:1.5}}>{({ko:'예: 파리에서 꼭 가봐야 할 곳 3곳 코스 / 서울 역사와 자연 하루 코스',en:'e.g. A course of 3 must-see spots in Paris',ja:'例: パリの名所3つコース',zh:'例: 巴黎必去3处行程'})[lang]||''}</div>
            <textarea value={nlText} onChange={e=>setNlText(e.target.value)} autoFocus rows={3}
              placeholder={({ko:'어떤 여행을 원하세요?',en:'What trip do you want?',ja:'どんな旅？',zh:'想要什么旅行？'})[lang]||''}
              style={{width:'100%',boxSizing:'border-box',padding:'12px 14px',fontSize:14,border:'1.5px solid #e0d9d0',borderRadius:12,resize:'none',outline:'none',fontFamily:'inherit',marginBottom:14}}/>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>!nlLoading&&setNlOpen(false)} style={{flex:'0 0 auto',padding:'12px 18px',fontSize:14,fontWeight:700,background:'#f5f0ea',color:'#a89080',border:'none',borderRadius:12,cursor:'pointer'}}>{({ko:'닫기',en:'Close',ja:'閉じる',zh:'关闭'})[lang]||'닫기'}</button>
              <button onClick={handleNlGenerate} disabled={!nlText.trim()||nlLoading} style={{flex:1,padding:'12px 18px',fontSize:14,fontWeight:700,background:(!nlText.trim()||nlLoading)?'#e0d9d0':'#c8856a',color:'#fff',border:'none',borderRadius:12,cursor:(!nlText.trim()||nlLoading)?'default':'pointer'}}>{nlLoading?(({ko:'생성 중...',en:'Generating...',ja:'生成中...',zh:'生成中...'})[lang]||'생성 중...'):(({ko:'코스 만들기',en:'Create',ja:'作成',zh:'创建'})[lang]||'코스 만들기')}</button>
            </div>
          </div>
        </div>
      )}
      {/* ===== 임시 데이터 추출 도구 (추출 끝나면 이 블록 + extractTick state 삭제) ===== */}
      {selectedCity && (() => {
        const ex = JSON.parse(localStorage.getItem('atlas_extract')||'{}')
        const cityName = selectedCity._koName || selectedCity.name
        const done = !!ex[cityName]
        const count = Object.keys(ex).length
        const save = (obj) => {
          const str = JSON.stringify(obj)
          try { localStorage.setItem('atlas_extract', str) }
          catch {
            // 용량 초과 → 재취득 가능한 hotspots_* 캐시만 정리 후 재시도.
            // (Firestore cityCache에 원본이 있어 다음 진입 시 다시 읽어옴 = Google 재호출 없음. atlas_extract는 백업본이 없으므로 절대 건드리지 않음)
            const del = []
            for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('hotspots_')) del.push(k) }
            del.forEach(k => localStorage.removeItem(k))
            console.warn(`[추출] localStorage 용량 초과 → hotspots_ 캐시 ${del.length}개 자동 정리 후 재시도`)
            try { localStorage.setItem('atlas_extract', str) }
            catch {
              alert('저장 공간이 부족합니다.\nJSON 저장으로 백업 → 전체 업로드 → 브라우저 사이트 데이터 삭제 순으로 정리하세요.')
              return
            }
          }
          setExtractTick(t=>t+1)
        }
        return (
          <div style={{position:'fixed',top:10,left:10,zIndex:99999,display:'flex',flexDirection:'column',gap:6,alignItems:'stretch',background:'rgba(15,18,24,.82)',padding:'10px 12px',borderRadius:12,boxShadow:'0 4px 16px rgba(0,0,0,.4)',minWidth:200}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}>
              <span style={{fontSize:12,fontWeight:700,color:done?'#4ade80':'#fbbf24'}}>{cityName} · {done?'추출됨':'미추출'}</span>
              <span style={{fontSize:11,color:'#cbd5e1'}}>누적 {count}</span>
            </div>
            {hotspotDiag && hotspotDiag.city === cityName && hotspotDiag.state !== 'cached' && (
              <div style={{fontSize:10,lineHeight:1.35,padding:'4px 6px',borderRadius:6,
                background: hotspotDiag.state==='failed' ? 'rgba(239,68,68,.18)' : hotspotDiag.state==='learned' ? 'rgba(251,191,36,.16)' : 'rgba(74,222,128,.13)',
                color: hotspotDiag.state==='failed' ? '#fca5a5' : hotspotDiag.state==='learned' ? '#fcd34d' : '#86efac'}}>
                {hotspotDiag.state==='failed'
                  ? `⚠ 매칭실패 ${hotspotDiag.basePass}/${hotspotDiag.total} · 주소에 도시명 없음\n${(hotspotDiag.sample||'').slice(0,60)}`
                  : hotspotDiag.state==='learned'
                  ? `자동학습 [${hotspotDiag.learned.join(', ')}] · ${hotspotDiag.basePass}/${hotspotDiag.total}`
                  : `매칭 정상 ${hotspotDiag.basePass}/${hotspotDiag.total}`}
              </div>
            )}
            <div style={{display:'flex',gap:6}}>
              <button onClick={()=>{
                ex[cityName] = {
                  country: selectedCity.countryEn || '',
                  desc: cityData?.description || '',
                  food: (foodCulture && !foodCulture.error) ? foodCulture : null,
                  attractions: (hotspots||[]).map(h=>({ name:h.name, lat:h.geometry?.location?.lat??null, lng:h.geometry?.location?.lng??null, place_id:h.place_id||null, types:h.types||[] }))
                }
                save(ex)
              }} style={{flex:1,padding:'7px 0',background:done?'#0891b2':'#16a34a',color:'white',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer'}}>{done?'재추출':'추출'}</button>
              <button onClick={()=>{
                const names = Object.keys(ex)
                alert(names.length ? `추출된 ${names.length}개 도시:\n\n${names.join(', ')}` : '아직 추출된 도시 없음')
              }} style={{flex:1,padding:'7px 0',background:'#475569',color:'white',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>목록</button>
            </div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={()=>{
                const raw = localStorage.getItem('atlas_extract')||'{}'
                const data = JSON.stringify(JSON.parse(raw), null, 2)   // 읽기 쉽게 들여쓰기
                const blob = new Blob([data],{type:'application/json'})
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href=url; a.download=`atlas_extract_${count}cities.json`; a.click()
                URL.revokeObjectURL(url)
              }} style={{flex:1,padding:'7px 0',background:'#2563eb',color:'white',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer'}}>JSON 저장</button>
              <label style={{flex:1,padding:'7px 0',background:'#7c3aed',color:'white',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',textAlign:'center'}}>
                불러오기
                <input type="file" accept="application/json" style={{display:'none'}} onChange={(e)=>{
                  const file = e.target.files?.[0]; if(!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    try {
                      const loaded = JSON.parse(reader.result)
                      const merged = { ...loaded, ...ex }
                      save(merged)
                      alert(`불러오기 완료\n파일 ${Object.keys(loaded).length}개 → 총 ${Object.keys(merged).length}개 도시`)
                    } catch(err) { alert('JSON 파싱 실패: '+err.message) }
                  }
                  reader.readAsText(file)
                  e.target.value = ''
                }} />
              </label>
            </div>
            <button onClick={async()=>{
              if (!done || !ex[cityName]) { alert('현재 도시가 추출되지 않았습니다'); return }
              try {
                const r = await uploadAttractionsArchive({ [cityName]: ex[cityName] }, ()=>{})
                alert(`"${cityName}" 업로드 완료\n관광지 ${r.attractions}개${r.skipped?` (스킵 ${r.skipped})`:''}`)
              } catch(err) {
                console.error('[Archive] 업로드 실패:', err)
                alert('업로드 실패: '+(err?.message||err))
              }
            }} style={{width:'100%',marginTop:6,padding:'8px 0',background:'#0d9488',color:'white',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer'}}>이 도시만 업로드 ({cityName})</button>
            <button onClick={async()=>{
              const done = completedCities.has(cityName)
              setCompletedCities(prev=>{ const s=new Set(prev); done ? s.delete(cityName) : s.add(cityName); return s })
              const ok = done ? await removeCompletedCity(cityName) : await addCompletedCity(cityName)
              if(!ok){ alert('완료 상태 저장 실패'); setCompletedCities(prev=>{ const s=new Set(prev); done ? s.add(cityName) : s.delete(cityName); return s }) }
            }} style={{width:'100%',marginTop:6,padding:'8px 0',background:completedCities.has(cityName)?'#ef4444':'#334155',color:'white',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              {completedCities.has(cityName) ? `완료 취소 (${cityName}) (${completedCities.size})` : `작업 완료 (${cityName}) (${completedCities.size})`}
            </button>
            <button onClick={async()=>{
              const cnt = Object.keys(ex).length
              if (!cnt) { alert('업로드할 데이터가 없습니다'); return }
              if (!confirm(`Firestore에 업로드\n\n도시 ${cnt}개를 countries/{국가}/cities/{도시}/attractions 구조로 올립니다.\n(재업로드 시 사진(photos)은 보존됩니다)\n\n진행할까요?`)) return
              try {
                const r = await uploadAttractionsArchive(ex, (done, total, city)=>{
                  console.log(`[Archive] ${done}/${total} - ${city}`)
                })
                alert(`업로드 완료\n\n도시 ${r.cities}개\n관광지 ${r.attractions}개\n${r.skipped?`(place_id 없어 스킵 ${r.skipped}개)`:''}`)
              } catch(err) {
                console.error('[Archive] 업로드 실패:', err)
                alert('업로드 실패: '+(err?.message||err))
              }
            }} style={{width:'100%',marginTop:6,padding:'8px 0',background:'#475569',color:'white',border:'none',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer'}}>전체 업로드 ({Object.keys(ex).length})</button>
          </div>
        )
      })()}
        {!selectedCountry && !showCoursePlanner && (
        <div style={{position:'absolute',bottom:isMobile?'calc(56px + 5vh)':84,left:'50%',transform:'translateX(-50%)',zIndex:1001,display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
          {guideList.length > 0 && (
            <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',maxWidth:isMobile?'92vw':460}}>
              {guideList.slice(0,8).map(entry => (
                <span key={entry.id} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 8px 6px 12px',fontSize:12,fontWeight:600,background:'rgba(255,255,255,.92)',color:'#5a5048',border:'1px solid #e0d9d0',borderRadius:20,boxShadow:'0 2px 8px rgba(0,0,0,.12)',backdropFilter:'blur(8px)'}}>
                  <span onClick={()=>openSavedGuide(entry)} style={{cursor:'pointer'}}>{getCityName(entry.cityName)} · {entry.days}{({ko:'일',en:'d',ja:'日',zh:'天'})[lang]||'일'}</span>
                  <span onClick={()=>deleteSavedGuide(entry.id)} style={{cursor:'pointer',color:'#c0b8ae',fontSize:15,lineHeight:1,padding:'0 2px'}}>×</span>
                </span>
              ))}
            </div>
          )}
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button onClick={()=>{ setNlText(''); setNlOpen(true) }} title={({ko:'음성으로',en:'Voice',ja:'音声で',zh:'语音'})[lang]||'음성으로'} style={{width:isMobile?40:44,height:isMobile?40:44,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,.95)',color:'#c8856a',border:'1.5px solid #e0d9d0',borderRadius:'50%',cursor:'pointer',boxShadow:'0 4px 16px rgba(0,0,0,.18)',backdropFilter:'blur(8px)'}}>
              <svg width={isMobile?18:20} height={isMobile?18:20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
            <button onClick={()=>{ setNlText(''); setNlOpen(true) }} style={{padding:isMobile?'8px 14px':'9px 18px',fontSize:isMobile?12:13,fontWeight:700,background:'#c8856a',color:'#fff',border:'none',borderRadius:24,cursor:'pointer',boxShadow:'0 4px 16px rgba(200,133,106,.4)'}}>{({ko:'직접 입력',en:'Type',ja:'入力',zh:'输入'})[lang]||'직접 입력'}</button>
          </div>
        </div>
      )}
      {!selectedCountry && (
        <div style={{position:'absolute',bottom:isMobile?12:24,left:'50%',transform:'translateX(-50%)',zIndex:1000,background:'rgba(255,255,255,.9)',backdropFilter:'blur(12px)',border:'1.5px solid rgba(255,255,255,.5)',borderRadius:40,padding:isMobile?'7px 14px':'9px 20px',fontSize:isMobile?10:12,color:'#475569',whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(0,0,0,.2)',pointerEvents:'none'}}>
          {t('hintMain')}
        </div>
      )}



      {/* Side Panel */}
      {selectedCity && (
        <>


        <div ref={cityPanelRef} className="panel"
          onTouchStart={onPeekDismissStart} onTouchMove={onPeekDismissMove} onTouchEnd={onPeekDismissEnd}
          style={{position:'absolute',top:0,right:0,bottom:0,width:isMobile?'100%':420,zIndex:(isMobile&&showCoursePlanner)?1200:1000,pointerEvents:(isMobile&&showCoursePlanner&&!cityPeek)?'none':'auto',transform:(isMobile&&showCoursePlanner)?(cityPeek?'translateX(0)':'translateX(100%)'):'translateX(0)',transition:'transform .32s cubic-bezier(.16,1,.3,1)',background:'white',borderLeft:isMobile?'none':'1.5px solid #e2e8f0',overflowY:'auto',WebkitOverflowScrolling:'touch',touchAction:'pan-y',boxShadow:isMobile?'none':'-12px 0 40px rgba(0,0,0,.15)'}}>
          <div style={{position:'sticky',top:0,zIndex:10,padding:'20px 20px 14px',background:'linear-gradient(white 87%,transparent)'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
              <div>
                <div style={{fontSize:11,color:'#94a3b8',letterSpacing:'2px',textTransform:'uppercase',marginBottom:4}}>
                  {countryKo}
                </div>
                <div style={{fontSize:26,fontWeight:800,letterSpacing:'-.5px',color:'#0f172a'}}>{getCityName(selectedCity?._koName || selectedCity?.name) || ''}</div>
              </div>
              <div style={{display:'flex',gap:5,flexShrink:0}}>
                <button onClick={()=>{const c=allCitiesFlat.find(x=>x.name===(selectedCity?._koName||selectedCity?.name));if(c){setAiCities([{city:c,days:1}]);setShowAiModal(true)}}}
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
                  title={isVisitedCity(selectedCity?._koName||selectedCity?.name)?t("visitedUnmark"):t("visitedMark")}>{isVisitedCity(selectedCity?._koName||selectedCity?.name)?'✓':'🚩'}</button>
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
                    {/* 도시 설명 - AI 생성 (언어별), 생성 중이면 로딩 / 실패 시 다시 시도 */}
                    {(() => {
                      const desc = cityData.description
                      if (desc) return (
                        <p style={{fontSize:13.5,color:'#475569',lineHeight:1.8,margin:'0 0 20px',borderLeft:`3px solid ${selectedCity?.color||'#3b82f6'}`,paddingLeft:14}}>
                          {desc}
                        </p>
                      )
                      if (descFailed) return (
                        <p style={{fontSize:13.5,color:'#94a3b8',lineHeight:1.8,margin:'0 0 20px',borderLeft:`3px solid ${selectedCity?.color||'#3b82f6'}`,paddingLeft:14}}>
                          {lang==='ko'?'소개글을 불러오지 못했어요. ':lang==='ja'?'紹介文を読み込めませんでした。':lang==='zh'?'无法加载介绍。':'Couldn\'t load the description. '}
                          <button onClick={()=>{
                            const ck = selectedCity?._koName || selectedCity?.name
                            setDescFailed(false)
                            fetchCityDescription(ck, selectedCity?.countryEn || '', lang).then(d => {
                              if (d) setCityData(prev => prev ? { ...prev, description: d } : prev)
                              else setDescFailed(true)
                            })
                          }} style={{background:'none',border:'none',color:selectedCity?.color||'#3b82f6',fontWeight:700,cursor:'pointer',padding:0,fontSize:13.5,textDecoration:'underline'}}>
                            {lang==='ko'?'다시 시도':lang==='ja'?'再試行':lang==='zh'?'重试':'Retry'}
                          </button>
                        </p>
                      )
                      return (
                        <p style={{fontSize:13.5,color:'#94a3b8',lineHeight:1.8,margin:'0 0 20px',borderLeft:`3px solid ${selectedCity?.color||'#3b82f6'}`,paddingLeft:14,fontStyle:'italic'}}>
                          {lang==='ko'?'소개글 불러오는 중…':lang==='ja'?'紹介文を読み込み中…':lang==='zh'?'正在加载介绍…':'Loading description…'}
                        </p>
                      )
                    })()}

                    {/* 공유 버튼 */}
                    <div style={{display:'flex',gap:8,marginTop:16,marginBottom:16,position:'relative'}}>
                      <button
                        onClick={() => copyLink(selectedCity)}
                        style={{
                          flex:1,padding:'10px 14px',background:'#faf8f5',
                          border:'1.5px solid #e0d9d0',borderRadius:10,fontSize:13,fontWeight:600,
                          color:'#c8856a',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all .2s'
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.background='#c8856a';e.currentTarget.style.color='white';e.currentTarget.style.borderColor='#c8856a'}}
                        onMouseLeave={e=>{e.currentTarget.style.background='#faf8f5';e.currentTarget.style.color='#c8856a';e.currentTarget.style.borderColor='#e0d9d0'}}
                      >{t('linkCopy')}</button>
                      <button
                        onClick={() => shareNative(selectedCity)}
                        style={{
                          flex:1,padding:'10px 14px',background:'#c8856a',border:'none',borderRadius:10,
                          fontSize:13,fontWeight:600,color:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all .2s'
                        }}
                        onMouseEnter={e=>e.currentTarget.style.background='#b9744f'}
                        onMouseLeave={e=>e.currentTarget.style.background='#c8856a'}
                      >{t('shareBtn')}</button>
                    </div>


                    {/* 추천 관광지 / 음식 문화 탭 */}
                    <div>
                      {/* 탭 버튼 */}
                      <div style={{display:'flex',gap:6,marginBottom:12}}>
                        {[{key:'hotspots',label:lang==='ko'?'추천 관광지':lang==='ja'?'おすすめ':lang==='zh'?'推荐景点':'Top Spots'},{key:'food',label:lang==='ko'?'음식 문화':lang==='ja'?'食文化':lang==='zh'?'饮食文化':'Food Culture'}].map(tab=>(
                          <button key={tab.key} onClick={()=>{setActiveTab(tab.key); if(tab.key==='food' && !foodCulture && !loadingFoodCulture) fetchFoodCulture(selectedCity)}}
                            style={{flex:1,padding:'9px 0',fontSize:13,fontWeight:activeTab===tab.key?700:500,background:activeTab===tab.key?'#c8856a':'#f5f0ea',color:activeTab===tab.key?'white':'#9a8070',border:'none',borderRadius:10,cursor:'pointer',transition:'all .2s'}}>
                            {tab.label}</button>
                        ))}
                      </div>

                      {/* 추천 관광지 목록 */}
                      {activeTab==='hotspots' && (
                        <div style={{display:'flex',flexDirection:'column',gap:10}}>
                          {/* 장소 검색 → 코스 추가 */}
                          <div style={{display:'flex',flexDirection:'column',gap:8}}>
                            <div style={{display:'flex',gap:6}}>
                              <input value={spotSearchQuery} onChange={e=>setSpotSearchQuery(e.target.value)}
                                onKeyDown={e=>{if(e.key==='Enter')searchSpotsForCourse()}}
                                placeholder={lang==='ko'?'장소 검색해서 코스에 추가':lang==='ja'?'場所を検索してコースに追加':lang==='zh'?'搜索地点添加到行程':'Search a place to add'}
                                style={{flex:1,minWidth:0,padding:'9px 12px',borderRadius:9,border:'1px solid #e0d9d0',fontSize:12.5,outline:'none',background:'#faf7f3',color:'#1a1714'}}/>
                              <button onClick={searchSpotsForCourse}
                                style={{padding:'0 14px',borderRadius:9,border:'none',background:'#c8856a',color:'white',fontSize:12.5,fontWeight:600,cursor:'pointer',flexShrink:0}}>
                                {lang==='ko'?'검색':lang==='ja'?'検索':lang==='zh'?'搜索':'Search'}</button>
                              {(spotSearchResults.length>0 || spotSearchQuery) && (
                                <button onClick={()=>{setSpotSearchQuery('');setSpotSearchResults([])}}
                                  style={{padding:'0 12px',borderRadius:9,border:'1px solid #e0d9d0',background:'#f5f0ea',color:'#9a8070',fontSize:13,cursor:'pointer',flexShrink:0}}
                                  title={lang==='ko'?'닫기':'Close'}>✕</button>
                              )}
                            </div>
                            {spotSearchLoading && (
                              <div style={{display:'flex',justifyContent:'center',padding:14}}>
                                <div style={{width:22,height:22,borderRadius:'50%',border:'2px solid #e0d9d0',borderTopColor:'#c8856a',animation:'spin .7s linear infinite'}}/>
                              </div>
                            )}
                            {!spotSearchLoading && spotSearchResults.length>0 && (
                              <div style={{display:'flex',flexDirection:'column',gap:8,paddingBottom:10,borderBottom:'1px solid #ede8e0'}}>
                                {spotSearchResults.map((r,i)=>(
                                  <a key={i} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name)}&query_place_id=${r.place_id||''}`}
                                    target="_blank" rel="noopener noreferrer"
                                    style={{textDecoration:'none',display:'flex',gap:10,padding:8,alignItems:'center',background:'#faf7f3',border:'1px solid #ede8e0',borderRadius:10,cursor:'pointer'}}>
                                    {false ? (
                                      <img src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=160&photo_reference=${r.photos[0].photo_reference}&key=${import.meta.env.VITE_GOOGLE_API_KEY}`}
                                        alt={r.name} style={{width:54,height:54,borderRadius:8,objectFit:'cover',flexShrink:0}}/>
                                    ) : (
                                      <div style={{width:54,height:54,borderRadius:8,background:'#f0e9e1',flexShrink:0}}/>
                                    )}
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{fontSize:12.5,fontWeight:700,color:'#1a1714',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</div>
                                      {r.rating && <div style={{fontSize:11,color:'#c8a870',fontWeight:600,marginTop:2}}>★ {r.rating}{r.user_ratings_total?` (${r.user_ratings_total.toLocaleString()})`:''}</div>}
                                      {(r.vicinity||r.formatted_address) && <div style={{fontSize:9.5,color:'#b0a89e',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:2}}>{r.vicinity||r.formatted_address}</div>}
                                    </div>
                                    <button onClick={e=>{e.preventDefault();e.stopPropagation();addSpotToHotspots(r)}}
                                      style={{background:hotspots.some(h=>h.place_id===r.place_id)?'#7a9a6a':'#f5f0ea',border:hotspots.some(h=>h.place_id===r.place_id)?'none':'1px solid #e0d9d0',color:hotspots.some(h=>h.place_id===r.place_id)?'white':'#9a8070',height:30,padding:'0 9px',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:600,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',whiteSpace:'nowrap'}}
                                      title={lang==='ko'?'추천 목록에 추가':'Add to recommended list'}>{hotspots.some(h=>h.place_id===r.place_id)?'✓ 목록':'＋ 목록'}</button>
                                    <button onClick={e=>{e.preventDefault();e.stopPropagation();addToCourse({source:'hotspot',name:r.name,displayName:r.name,cityName:selectedCity?._koName||selectedCity?.name,cityDisplayName:getCityName(selectedCity?._koName||selectedCity?.name),rating:r.rating,place_id:r.place_id,vicinity:r.vicinity||r.formatted_address,lat:r.geometry?.location?.lat??selectedCity?.lat,lng:r.geometry?.location?.lng??selectedCity?.lng,emoji:'📍',photo_ref:r.photos?.[0]?.photo_reference||null})}}
                                      style={{background:isInCourse(r.name,'hotspot')?'#c8856a':'#f5f0ea',border:isInCourse(r.name,'hotspot')?'none':'1px solid #e0d9d0',color:isInCourse(r.name,'hotspot')?'white':'#c8b8a8',width:30,height:30,borderRadius:7,cursor:'pointer',fontSize:14,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}
                                      title={t("courseAddToTrip")}>{isInCourse(r.name,'hotspot')?'✓':'＋'}</button>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* 추천 관광지 목록 */}
                          {loadingPlaces ? (
                          <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:50}}>
                            <div style={{width:28,height:28,borderRadius:'50%',border:'2px solid #e0d9d0',borderTopColor:'#c8856a',animation:'spin .7s linear infinite'}}/>
                          </div>
                        ) : hotspots.length>0 ? (
                          <div style={{display:'flex',flexDirection:'column',gap:10}}>
                            {hotspots.filter(place=>{const ck=`${selectedCity._koName||selectedCity.name}_${lang}`; return !excludedIds.has(place.place_id) && !excludedIds.has(`${place.place_id}||${ck}`)}).map((place,idx)=>(
                              <a key={idx} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id||''}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{textDecoration:'none',background:'white',border:'1px solid #ede8e0',borderRadius:12,overflow:'hidden',cursor:'pointer',transition:'all .2s'}}>
                                <div style={{display:'flex',gap:10,padding:10,alignItems:'center'}}>
                                  {(attrPhotos[place.place_id] && attrPhotos[place.place_id].length) ? (
                                    <div onClick={e=>{e.preventDefault();e.stopPropagation();setGalleryView({photos:attrPhotos[place.place_id],idx:0,placeId:place.place_id,country:selectedCity.countryEn||'Unknown',city:selectedCity._koName||selectedCity.name})}}
                                      style={{position:'relative',width:72,height:72,borderRadius:10,overflow:'hidden',flexShrink:0,cursor:'pointer'}}>
                                      <img src={(attrPhotos[place.place_id][0].url||attrPhotos[place.place_id][0])} alt={place.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                                      {attrPhotos[place.place_id].length>1 && (
                                        <div style={{position:'absolute',bottom:3,right:3,background:'rgba(0,0,0,.65)',color:'#fff',fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:8}}>{attrPhotos[place.place_id].length}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <div style={{width:72,height:72,borderRadius:10,background:'#f5f0ea',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:'#c8b8a8',flexShrink:0}}>Place</div>
                                  )}
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:13.5,fontWeight:700,color:'#1a1714',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{place.name}</div>
                                    {place.rating && (
                                      <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                                        <span style={{fontSize:11.5,color:'#c8a870',fontWeight:600}}>★ {place.rating}</span>
                                        {place.user_ratings_total && <span style={{fontSize:9,color:'#c8b8a8'}}>({place.user_ratings_total.toLocaleString()})</span>}
                                      </div>
                                    )}
                                    {(place.vicinity||place.formatted_address) && <div style={{fontSize:10,color:'#b0a89e',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{place.vicinity||place.formatted_address}</div>}
                                    {place.opening_hours && (
                                      <div style={{fontSize:9,color:place.opening_hours.open_now?'#6fa870':'#c07060',fontWeight:600,marginTop:3}}>
                                        {place.opening_hours.open_now?t('openNow'):t('closedNow')}</div>
                                    )}
                                  </div>
                                  <div style={{display:'flex',flexDirection:'column',gap:4,flexShrink:0}}>
                                    <button onClick={e=>{e.preventDefault();e.stopPropagation();addToCourse({source:'hotspot',name:place.name,displayName:place.name,cityName:selectedCity?._koName||selectedCity?.name,cityDisplayName:getCityName(selectedCity?._koName||selectedCity?.name),rating:place.rating,place_id:place.place_id,vicinity:place.vicinity||place.formatted_address,lat:place.geometry?.location?.lat??selectedCity?.lat,lng:place.geometry?.location?.lng??selectedCity?.lng,emoji:'📍',photo_ref:place.photos?.[0]?.photo_reference||null})}}
                                      style={{background:isInCourse(place.name,'hotspot')?'#c8856a':'#f5f0ea',border:isInCourse(place.name,'hotspot')?'none':'1px solid #e0d9d0',color:isInCourse(place.name,'hotspot')?'white':'#c8b8a8',width:30,height:30,borderRadius:7,cursor:'pointer',fontSize:14,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}
                                      title={t("courseAddToTrip")}>{isInCourse(place.name,'hotspot')?'✓':'＋'}</button>
                                    <button onClick={e=>{e.preventDefault();e.stopPropagation();toggleFav({type:'hotspot',name:place.name,place_id:place.place_id,rating:place.rating,user_ratings_total:place.user_ratings_total,vicinity:place.vicinity||place.formatted_address,cityDisplayName:getCityName(selectedCity?._koName||selectedCity?.name)})}}
                                      style={{background:isFav('hotspot',place.name)?'#fef3c7':'#f5f0ea',border:isFav('hotspot',place.name)?'1px solid #f0c040':'1px solid #e0d9d0',color:isFav('hotspot',place.name)?'#c8a020':'#c8b8a8',width:30,height:30,borderRadius:7,cursor:'pointer',fontSize:12,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}
                                      title={t("favToggle")}>{isFav('hotspot',place.name)?'★':'☆'}</button>
                                    {place.place_id && selectedCity && (
                                      <label onClick={e=>e.stopPropagation()} title="사진 추가(Firestore)"
                                        style={{background:(attrPhotos[place.place_id]?.length)?'#e0f2ef':'#f5f0ea',border:'1px solid '+((attrPhotos[place.place_id]?.length)?'#0d9488':'#e0d9d0'),color:(attrPhotos[place.place_id]?.length)?'#0d9488':'#c8b8a8',minWidth:30,height:30,padding:'0 4px',borderRadius:7,cursor:attrPhotoUploading===place.place_id?'wait':'pointer',fontSize:11,fontWeight:700,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                        {attrPhotoUploading===place.place_id ? '…' : (attrPhotos[place.place_id]?.length ? `📷${attrPhotos[place.place_id].length}` : '📷')}
                                        <input type="file" accept="image/*" multiple style={{display:'none'}} disabled={attrPhotoUploading===place.place_id}
                                          onClick={e=>e.stopPropagation()}
                                          onChange={async(e)=>{
                                            const files=Array.from(e.target.files||[]); e.target.value=''
                                            if(!files.length) return
                                            const country=selectedCity.countryEn||'Unknown'
                                            const city=selectedCity._koName||selectedCity.name
                                            setAttrPhotoUploading(place.place_id)
                                            try {
                                              const merged=await uploadAttractionPhotos(country,city,place.place_id,files)
                                              setAttrPhotos(pc=>({...pc,[place.place_id]:merged}))
                                            } catch(err){ console.error('[사진업로드]',err); alert('사진 업로드 실패: '+(err?.message||err)) }
                                            finally { setAttrPhotoUploading('') }
                                          }}/>
                                      </label>
                                    )}
                                    {place.place_id && (
                                      <button onClick={async(e)=>{e.preventDefault();e.stopPropagation()
                                        if(!confirm(`"${place.name}"을(를) 추천에서 영구 제외할까요?`)) return
                                        const exKey=`${place.place_id}||${selectedCity._koName||selectedCity.name}_${lang}`   // 도시별 격리: 인접 도시에 영향 없음
                                        setExcludedIds(prev=>new Set(prev).add(exKey))
                                        const ok=await addExcludedAttraction(exKey)
                                        if(!ok){ alert('제외 저장 실패'); setExcludedIds(prev=>{const s=new Set(prev); s.delete(exKey); return s}) }
                                      }} title="추천에서 영구 제외"
                                        style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',width:30,height:30,borderRadius:7,cursor:'pointer',fontSize:13,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                                    )}
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div style={{textAlign:'center',padding:40,color:'#94a3b8',fontSize:13}}>{t('noData')}</div>
                        )}
                        </div>
                      )}

                      {/* 음식 문화 (AI 생성) */}
                      {activeTab==='food' && (
                        loadingFoodCulture ? (
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:50,gap:14}}>
                            <div style={{width:28,height:28,borderRadius:'50%',border:'2px solid #e0d9d0',borderTopColor:'#c8856a',animation:'spin .7s linear infinite'}}/>
                            <div style={{fontSize:12,color:'#b0a89e'}}>{lang==='ko'?'음식 문화를 불러오는 중...':lang==='ja'?'読み込み中...':lang==='zh'?'加载中...':'Loading...'}</div>
                          </div>
                        ) : foodCulture?.error ? (
                          <div style={{textAlign:'center',padding:40,color:'#94a3b8',fontSize:13}}>
                            {lang==='ko'?'정보를 불러오지 못했습니다':lang==='ja'?'読み込めませんでした':lang==='zh'?'加载失败':'Failed to load'}
                            <button onClick={()=>fetchFoodCulture(selectedCity)} style={{display:'block',margin:'12px auto 0',padding:'7px 16px',background:'#c8856a',color:'white',border:'none',borderRadius:8,fontSize:12,cursor:'pointer'}}>{lang==='ko'?'다시 시도':'Retry'}</button>
                          </div>
                        ) : foodCulture ? (
                          <div style={{display:'flex',flexDirection:'column',gap:10}}>
                            {foodCulture.intro && (
                              <div style={{fontSize:12.5,color:'#6b5d52',lineHeight:1.6,padding:'2px 2px 6px'}}>{foodCulture.intro}</div>
                            )}
                            {(foodCulture.dishes||[]).map((dish,idx)=>(
                              <div key={idx} style={{background:'white',border:'1px solid #ede8e0',borderRadius:12,padding:'13px 14px'}}>
                                <div style={{fontSize:14.5,fontWeight:700,color:'#1a1714',marginBottom:6}}>{idx+1}. {dish.name}</div>
                                <div style={{fontSize:12.5,color:'#6b5d52',lineHeight:1.65}}>{dish.desc}</div>
                              </div>
                            ))}
                            <div style={{fontSize:9.5,color:'#c8b8a8',textAlign:'center',marginTop:4,fontStyle:'italic'}}>{lang==='ko'?'AI가 생성한 정보로 가격은 대략적입니다':lang==='ja'?'AI生成・価格は目安':lang==='zh'?'AI生成·价格仅供参考':'AI-generated · prices are approximate'}</div>
                          </div>
                        ) : null
                      )}
                    </div>
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
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#1a1714'}}>{t('aiSelectCity')}</div>
                  {aiCities.length>0 && <span style={{fontSize:10,color:'#b0a89e'}}>{aiTotalDays}{t('aiDayUnit')}</span>}
                </div>

                {/* 선택된 도시 리스트 (도시별 일수) */}
                {aiCities.length > 0 && (
                  <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:8}}>
                    {aiCities.map((entry,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'#f5f0ea',border:'1px solid #e0d9d0',borderRadius:10}}>
                        {getFlagImg(COUNTRY_INFO[entry.city.countryEn]?.emoji) ? (
                          <img src={getFlagImg(COUNTRY_INFO[entry.city.countryEn]?.emoji)} alt="" style={{width:20,height:14,objectFit:'cover',borderRadius:2,border:'1px solid #e2e8f0',flexShrink:0}}/>
                        ) : (
                          <span style={{fontSize:16}}>{entry.city.emoji||'📍'}</span>
                        )}
                        <span style={{flex:1,fontSize:13,fontWeight:600,color:'#1a1714',minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{getCityName(entry.city.name)}</span>
                        {/* 일수 조절 */}
                        <div style={{display:'flex',alignItems:'center',gap:0,background:'white',borderRadius:8,border:'1px solid #e0d9d0',overflow:'hidden',flexShrink:0}}>
                          <button onClick={()=>setAiCityDays(entry.city.name, entry.days-1)} style={{width:26,height:26,border:'none',background:'none',color:'#c8856a',fontSize:15,fontWeight:700,cursor:'pointer'}}>−</button>
                          <span style={{minWidth:30,textAlign:'center',fontSize:12,fontWeight:700,color:'#1a1714'}}>{entry.days}{t('aiDayUnit')}</span>
                          <button onClick={()=>setAiCityDays(entry.city.name, entry.days+1)} style={{width:26,height:26,border:'none',background:'none',color:'#c8856a',fontSize:15,fontWeight:700,cursor:'pointer'}}>＋</button>
                        </div>
                        <button onClick={()=>removeAiCity(entry.city.name)} style={{background:'none',border:'none',color:'#c8b8a8',cursor:'pointer',fontSize:14,flexShrink:0}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 도시 추가 검색 (항상 표시) */}
                <div style={{position:'relative'}}>
                  <input value={aiCitySearch} onChange={e=>setAiCitySearch(e.target.value)}
                    placeholder={aiCities.length>0 ? t("aiAddCity") : t("aiSearchCity")}
                    style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:13,outline:'none',boxSizing:'border-box',transition:'border .2s'}}
                    onFocus={e=>e.currentTarget.style.borderColor='#c8856a'}
                    onBlur={e=>e.currentTarget.style.borderColor='#e2e8f0'}/>
                  {aiCityResults.length > 0 && (
                    <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'white',border:'1.5px solid #e2e8f0',borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,.12)',maxHeight:200,overflowY:'auto',zIndex:10}}>
                      {aiCityResults.filter(c=>!aiCities.some(x=>x.city.name===c.name)).map((c,i,arr)=>(
                        <div key={i} onClick={()=>addAiCity(c)}
                          style={{display:'flex',alignItems:'center',gap:8,padding:'9px 14px',cursor:'pointer',transition:'background .1s',borderBottom:i<arr.length-1?'1px solid #f8fafc':'none'}}
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
              </div>

              {/* 관광시간 + 장소 수 */}
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#1a1714',marginBottom:6}}>{t('aiHoursLabel')}</div>
                  <div style={{display:'flex',alignItems:'center',gap:6,background:'#f5f0ea',border:'1px solid #e0d9d0',borderRadius:8,padding:'4px 6px'}}>
                    <button onClick={()=>setAiHours(h=>Math.max(1,h-1))} style={{width:30,height:30,fontSize:18,fontWeight:700,background:'#fff',color:'#c8856a',border:'1px solid #e0d9d0',borderRadius:6,cursor:'pointer',lineHeight:1,flexShrink:0}}>−</button>
                    <span style={{flex:1,textAlign:'center',fontSize:13,fontWeight:700,color:'#1a1714'}}>{aiHours}{t('aiHourUnit')}</span>
                    <button onClick={()=>setAiHours(h=>Math.min(24,h+1))} style={{width:30,height:30,fontSize:18,fontWeight:700,background:'#fff',color:'#c8856a',border:'1px solid #e0d9d0',borderRadius:6,cursor:'pointer',lineHeight:1,flexShrink:0}}>+</button>
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#1a1714',marginBottom:6}}>{({ko:'장소 수',en:'Places',ja:'場所数',zh:'地点数'})[lang]||'장소 수'}</div>
                  <div style={{display:'flex',alignItems:'center',gap:6,background:'#f5f0ea',border:'1px solid #e0d9d0',borderRadius:8,padding:'4px 6px'}}>
                    <button onClick={()=>setAiCount(c=>Math.max(1,c-1))} style={{width:30,height:30,fontSize:18,fontWeight:700,background:'#fff',color:'#c8856a',border:'1px solid #e0d9d0',borderRadius:6,cursor:'pointer',lineHeight:1,flexShrink:0}}>−</button>
                    <span style={{flex:1,textAlign:'center',fontSize:13,fontWeight:700,color:'#1a1714'}}>{aiCount}{({ko:'개',en:'',ja:'',zh:'个'})[lang]||''}</span>
                    <button onClick={()=>setAiCount(c=>Math.min(15,c+1))} style={{width:30,height:30,fontSize:18,fontWeight:700,background:'#fff',color:'#c8856a',border:'1px solid #e0d9d0',borderRadius:6,cursor:'pointer',lineHeight:1,flexShrink:0}}>+</button>
                  </div>
                </div>
              </div>

              {/* 출발일 */}
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'#1a1714',marginBottom:6}}>{t('courseDepartureOpt')}</div>
                <input type="date" value={courseTripStart} min={new Date().toISOString().slice(0,10)} onChange={e=>saveTripStart(e.target.value)}
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
              {aiCities.length > 0 && (
                <div style={{padding:'10px 14px',background:'#f5f0ea',border:'1px solid #e0d9d0',borderRadius:10,fontSize:12,color:'#9a8070',lineHeight:1.7}}>
                  <strong>{aiCities.map(x=>getCityName(x.city.name)).join(' → ')}</strong>{t('aiSummaryIn')} <strong>{aiTotalDays}{t('aiDayUnit')}</strong>{t('aiSummaryTrip')||' 여행'}
                  <br/>{({ko:`하루 ${aiCount}곳 · 관광 ${aiHours}시간`,en:`${aiCount} places/day · ${aiHours}h`,ja:`1日${aiCount}箇所・${aiHours}時間`,zh:`每天${aiCount}个 · ${aiHours}小时`})[lang]||`하루 ${aiCount}곳 · 관광 ${aiHours}시간`}
                  {courseTripStart && <><br/>📅 {formatDate(getDayDate(0))} ~ {formatDate(getDayDate(aiTotalDays-1))}</>}
                </div>
              )}

              {/* 생성 버튼 */}
              <button onClick={generateAiCourse} disabled={aiCities.length===0||aiGenerating}
                style={{
                  width:'100%',padding:'14px',fontSize:14,fontWeight:700,
                  background:aiCities.length>0?'#c8856a':'#f0ebe4',
                  color:aiCities.length>0?'white':'#c8b8a8',border:'none',borderRadius:10,
                  cursor:aiCities.length>0&&!aiGenerating?'pointer':'not-allowed',
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

      {/* 모바일: 도시 패널에서 담는 중 코스 진입 (자동전환 대신 플로팅 버튼) */}
      {isMobile && selectedCity && !showCoursePlanner && courseItems.length > 0 && (
        <button onClick={openCoursePlanner}
          style={{position:'fixed',bottom:22,right:18,zIndex:1500,background:'#c8856a',color:'#fff',border:'none',borderRadius:24,padding:'12px 18px',fontSize:13,fontWeight:700,boxShadow:'0 6px 20px rgba(200,133,106,.42)',cursor:'pointer',display:'flex',alignItems:'center',gap:7}}>
          {lang==='ko'?'코스 보기':lang==='ja'?'コース':lang==='zh'?'查看行程':'View course'}
          <span style={{background:'#fff',color:'#c8856a',borderRadius:11,minWidth:20,height:20,fontSize:11,fontWeight:800,display:'inline-flex',alignItems:'center',justifyContent:'center',padding:'0 5px'}}>{courseItems.length}</span>
        </button>
      )}

      {/* ── 코스 플래너 패널 (Warm Cream) ── */}
      {showCoursePlanner && courseDays.length > 0 && (
        <div style={{position:'absolute',top:isMobile?0:72,left:0,bottom:isMobile?undefined:0,height:isMobile?'100dvh':undefined,width:isMobile?'100%':Math.min(500,typeof window!=='undefined'?window.innerWidth-30:480),zIndex:1100,background:'#faf8f5',borderRight:isMobile?'none':'1px solid #e8e2da',boxShadow:isMobile?'none':'16px 0 48px rgba(0,0,0,.1)',display:'flex',flexDirection:'column',animation:'coursePlannerIn .35s cubic-bezier(.16,1,.3,1)'}}>

          {/* 모바일: 오른쪽 엣지에서 끌면 도시 패널(추천 관광지) 책넘기듯 등장 (시각 핸들바 없이 터치 영역만) */}
          {isMobile && selectedCity && !cityPeek && (
            <div onTouchStart={onPeekPullStart} onTouchMove={onPeekPullMove} onTouchEnd={onPeekPullEnd}
              style={{position:'absolute',top:0,right:0,bottom:0,width:24,zIndex:1150,touchAction:'pan-y'}}/>
          )}
          {/* 스와이프 안내 — 손가락 제스처 + x 닫기 */}
          {isMobile && selectedCity && !cityPeek && showSwipeHint && (
            <div style={{position:'absolute',right:5,top:'45%',transform:'translateY(-50%)',zIndex:1160,display:'flex',flexDirection:'column',alignItems:'center',gap:6,pointerEvents:'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:2,animation:'swipeFingerMove 1.3s ease-in-out 2'}}>
                <span style={{fontSize:20,color:'#c8856a',opacity:.5,fontWeight:800,letterSpacing:-3}}>‹‹‹</span>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="#c8856a" style={{filter:'drop-shadow(0 2px 5px rgba(0,0,0,.25))'}}><path d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"/></svg>
              </div>
              <div style={{fontSize:10.5,fontWeight:700,color:'#5a4a3a',background:'rgba(252,250,247,.94)',padding:'4px 10px',borderRadius:9,whiteSpace:'nowrap',boxShadow:'0 2px 10px rgba(0,0,0,.13)',border:'1px solid #e8dcd0'}}>{lang==='ko'?'스와이프':lang==='ja'?'スワイプ':lang==='zh'?'滑动':'Swipe'}</div>
              <div onClick={(e)=>{e.stopPropagation();setShowSwipeHint(false);try{localStorage.setItem('atlas_swipe_hint_v3','1')}catch{}}} style={{position:'absolute',top:-13,right:-3,pointerEvents:'auto',width:20,height:20,borderRadius:'50%',background:'rgba(255,255,255,.97)',border:'1px solid #c8a890',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#9a8070',cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,.18)'}}>✕</div>
            </div>
          )}

          {/* 헤더 */}
          <div style={{padding:'20px 20px 0',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
              <div>
                <div style={{fontSize:19,fontWeight:700,color:'#1a1714',letterSpacing:'-.4px'}}>{t('coursePlanner')}</div>
                <div style={{fontSize:11,color:'#1a1714',fontWeight:600,marginTop:3}}>
                  {courseItems.length}{t('coursePlace')} · {courseDays.length}{t('courseDay')}
                  {courseTripStart ? ` · ${formatDate(getDayDate(0))} – ${formatDate(getDayDate(courseDays.length-1))}` : ''}
                </div>
              </div>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <button onClick={downloadCoursePPT}
                  style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e0d9d0',background:'#faf8f5',fontSize:11,fontWeight:600,color:'#1a1714',cursor:'pointer',transition:'all .15s',display:'flex',alignItems:'center',gap:3}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#f0ebe4'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#faf8f5'}}
                >{t('courseDownloadPPT')}</button>
                <button onClick={()=>{
                  if (!currentUser) { setShowLoginModal(true); return }
                  if (courseItems.length === 0) return
                  setShareModalCourse({ days: courseDays, transport: courseTransport, type: courseSource })
                }}
                  style={{padding:'5px 10px',borderRadius:6,border:'none',background:'#7eb8e0',fontSize:11,fontWeight:600,color:'white',cursor:'pointer',transition:'all .15s',display:'flex',alignItems:'center',gap:3}}
                  onMouseEnter={e=>e.currentTarget.style.background='#6aa8d4'}
                  onMouseLeave={e=>e.currentTarget.style.background='#7eb8e0'}
                >{t('shareBtn')}</button>
                <button
                  onClick={()=>{if(confirm(lang==='ko'?'현재 코스를 삭제할까요?':lang==='ja'?'現在のコースを削除しますか？':lang==='zh'?'删除当前行程？':'Delete current course?')){
                    if(loadedCourseId)deleteSavedCourse(loadedCourseId);
                    saveCourse([]);saveCourseDays([]);setRouteCache({});setLoadedCourseId(null);
                    setShowCoursePlanner(false);closePanel()
                  }}}
                  style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e0d9d0',background:'none',fontSize:11,fontWeight:500,color:'#1a1714',cursor:'pointer',transition:'all .15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.color='#c0604a';e.currentTarget.style.borderColor='#e8c0b0'}}
                  onMouseLeave={e=>{e.currentTarget.style.color='#1a1714';e.currentTarget.style.borderColor='#e0d9d0'}}
                >{lang==='ko'?'삭제':lang==='ja'?'削除':lang==='zh'?'删除':'Clear'}</button>
                <button onClick={()=>setShowCoursePlanner(false)}
                  style={{width:30,height:30,borderRadius:6,border:'1px solid #e0d9d0',background:'none',color:'#1a1714',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#f0ebe4'}
                  onMouseLeave={e=>e.currentTarget.style.background='none'}>✕</button>
              </div>
            </div>

            {/* 한눈에 보기일 땐 날짜·이동수단·길찾기 숨겨서 관광지 리스트에 공간 양보 */}
            {!courseCompact && (<>
            {/* 날짜 */}
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,padding:'8px 12px',background:'#f0ebe4',borderRadius:8,border:'1px solid #e0d9d0'}}>
              <span style={{fontSize:11,color:'#1a1714',fontWeight:600,flexShrink:0}}>{t('courseDeparture')}</span>
              <input type="date" value={courseTripStart} min={new Date().toISOString().slice(0,10)} onChange={e=>saveTripStart(e.target.value)}
                style={{flex:1,fontSize:11,border:'none',background:'none',color:'#1a1714',fontWeight:600,outline:'none',cursor:'pointer'}}/>
              {courseTripStart && <button onClick={()=>saveTripStart('')} style={{background:'none',border:'none',color:'#1a1714',fontSize:11,cursor:'pointer',lineHeight:1}}>✕</button>}
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

            {/* 구글지도 길찾기 — 모든 이동수단 구간별 (구글 대중교통 경유지 미지원 + 구간별이 보기 편함) */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:'#1a1714',fontWeight:600,marginBottom:6}}>{lang==='ko'?'길 찾기(구글 연동)':lang==='ja'?'Googleマップ経路':lang==='zh'?'谷歌地图路线':'Google Maps'}</div>
              {(() => {
                const seq = courseSeq(courseDays[activeDayTab])
                if (seq.length < 2) return <div style={{fontSize:10.5,color:'#b0a89e'}}>{lang==='ko'?'이 Day에 장소를 2곳 이상 담으면 구간 경로가 생겨요':lang==='ja'?'2か所以上で区間表示':lang==='zh'?'2个以上地点显示路段':'Add 2+ places for segments'}</div>
                return (
                  <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:108,overflowY:'auto',paddingRight:seq.length>4?4:0}}>
                    {seq.slice(0,-1).map((it,i)=>(
                      <button key={i} onClick={()=>openCourseInGmaps([seq[i],seq[i+1]])}
                        style={{textAlign:'left',padding:'7px 10px',fontSize:11,fontWeight:600,background:'#f0ebe4',color:'#1a1714',border:'1px solid #e0d9d0',borderRadius:7,cursor:'pointer',display:'flex',alignItems:'center',gap:7}}>
                        <span style={{width:18,height:18,borderRadius:'50%',background:'#c8856a',color:'#fff',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</span>
                        <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{getCourseItemName(it)} → {getCourseItemName(seq[i+1])}</span>
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
            </>)}

            {/* Day 탭 */}
            <div style={{display:'flex',gap:4,overflowX:'auto',paddingBottom:16,borderBottom:'1px solid #e8e2da'}}>
              {courseDays.map((_,i)=>(
                <button key={i} onClick={()=>setActiveDayTab(i)} style={{
                  padding:'5px 14px',fontSize:11,fontWeight:activeDayTab===i?700:400,
                  background:activeDayTab===i?'#c8856a':'none',
                  color:activeDayTab===i?'#fff':'#1a1714',
                  border:activeDayTab===i?'none':'1px solid #e0d9d0',
                  borderRadius:20,cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s',flexShrink:0
                }}>
                  Day {i+1}
                  {courseTripStart && <span style={{fontSize:9,fontWeight:600,opacity:activeDayTab===i?1:.85,marginLeft:4}}>{formatDate(getDayDate(i))}</span>}
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
          <div ref={scrollAreaRef} onDragOver={handleDragAutoScroll} onDrop={stopDragAutoScroll} style={{flex:1,overflowY:'auto',minHeight:0,padding:'16px 20px'}}>
            {/* 숙소 설정 (Day별, 선택적) — 설정 시 출발·도착이 숙소로 고정 */}
            {(() => {
              const day = courseDays[activeDayTab]
              const hotel = day?.hotel
              const searching = hotelSearchDayIdx === activeDayTab
              if (courseCompact) return null
              return (
                <div style={{marginBottom:14,padding:'11px 13px',background:'#f5efe8',borderRadius:11,border:'1px solid #ece4d8'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                    <span style={{fontSize:11,fontWeight:700,color:'#8a7a68',letterSpacing:'.3px'}}>{lang==='ko'?'숙소':lang==='ja'?'宿泊':lang==='zh'?'住宿':'Stay'}</span>
                    {hotel ? (
                      <div style={{display:'flex',gap:6}}>
                        <button onClick={()=>{setHotelSearchDayIdx(searching?null:activeDayTab);setHotelSearchQuery('');setHotelSearchResults([])}} style={{fontSize:10,fontWeight:600,padding:'4px 9px',background:'#fff',border:'1px solid #e0d9d0',borderRadius:6,color:'#8a7a68',cursor:'pointer'}}>{lang==='ko'?'변경':lang==='ja'?'変更':lang==='zh'?'更改':'Change'}</button>
                        <button onClick={()=>setDayHotel(activeDayTab,null)} style={{fontSize:10,fontWeight:600,padding:'4px 9px',background:'#fff',border:'1px solid #e8d0d0',borderRadius:6,color:'#bd6b6b',cursor:'pointer'}}>{lang==='ko'?'삭제':lang==='ja'?'削除':lang==='zh'?'删除':'Remove'}</button>
                      </div>
                    ) : (
                      <button onClick={()=>{setHotelSearchDayIdx(searching?null:activeDayTab);setHotelSearchQuery('');setHotelSearchResults([])}} style={{fontSize:11,fontWeight:700,padding:'5px 11px',background:searching?'#fff':'#c8856a',border:searching?'1px solid #e0d9d0':'none',borderRadius:7,color:searching?'#8a7a68':'#fff',cursor:'pointer'}}>{searching?(lang==='ko'?'닫기':'Close'):(lang==='ko'?'숙소 설정':lang==='ja'?'設定':lang==='zh'?'设置':'Set')}</button>
                    )}
                  </div>
                  {hotel && !searching && (
                    <div style={{marginTop:7}}>
                      <div style={{fontSize:13.5,fontWeight:700,color:'#1a1714',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{hotel.displayName||hotel.name}</div>
                      {(() => {
                        const its = (day.items||[]).filter(it=>it&&(it.name||it.place_id))
                        if (its.length===0) return null
                        const toFirst = routeCache[getRouteKey(hotel, its[0], courseTransport)]
                        const fromLast = routeCache[getRouteKey(its[its.length-1], hotel, courseTransport)]
                        if (!toFirst?.duration && !fromLast?.duration) return null
                        return (
                          <div style={{marginTop:6,display:'flex',flexDirection:'column',gap:3}}>
                            {toFirst?.duration && <div style={{fontSize:10.5,color:'#9a8c7c',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lang==='ko'?'숙소':lang==='ja'?'宿泊':lang==='zh'?'住宿':'Stay'} → {getCourseItemName(its[0])} · {toFirst.duration}</div>}
                            {fromLast?.duration && <div style={{fontSize:10.5,color:'#9a8c7c',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{getCourseItemName(its[its.length-1])} → {lang==='ko'?'숙소':lang==='ja'?'宿泊':lang==='zh'?'住宿':'Stay'} · {fromLast.duration}</div>}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                  {searching && (
                    <div style={{marginTop:9}}>
                      {recentHotels.length>0 && (
                        <div style={{marginBottom:9}}>
                          <div style={{fontSize:10,color:'#a89a88',fontWeight:600,marginBottom:5}}>{lang==='ko'?'최근 숙소':lang==='ja'?'最近の宿泊':lang==='zh'?'最近住宿':'Recent'}</div>
                          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                            {recentHotels.map((h,i)=>(
                              <div key={i} style={{display:'inline-flex',alignItems:'center',background:'#fff',border:'1px solid #e0d9d0',borderRadius:15,overflow:'hidden'}}>
                                <span onClick={()=>applyRecentHotel(activeDayTab,h)} style={{fontSize:11,fontWeight:600,padding:'5px 4px 5px 11px',color:'#1a1714',cursor:'pointer',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.displayName||h.name}</span>
                                <span onClick={()=>removeRecentHotel(h)} style={{fontSize:13,color:'#b0a89e',cursor:'pointer',padding:'4px 9px 4px 3px',lineHeight:1}}>×</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{display:'flex',gap:6}}>
                        <input value={hotelSearchQuery} onChange={e=>setHotelSearchQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')searchHotelsForCourse()}}
                          placeholder={selectedCity?(lang==='ko'?'숙소 이름 검색':'Search stay name'):(lang==='ko'?'도시를 먼저 선택하세요':'Select a city first')}
                          disabled={!selectedCity}
                          style={{flex:1,minWidth:0,padding:'9px 11px',fontSize:12,border:'1px solid #e0d9d0',borderRadius:8,outline:'none',background:selectedCity?'#fff':'#f0ece6',color:'#1a1714'}}/>
                        <button onClick={searchHotelsForCourse} disabled={!selectedCity} style={{padding:'9px 13px',fontSize:12,fontWeight:700,background:selectedCity?'#c8856a':'#d8cfc4',color:'#fff',border:'none',borderRadius:8,cursor:selectedCity?'pointer':'default',flexShrink:0}}>{lang==='ko'?'검색':'Go'}</button>
                      </div>
                      {hotelSearchLoading && <div style={{fontSize:11,color:'#b0a89e',marginTop:7}}>{lang==='ko'?'검색 중…':'Searching…'}</div>}
                      {!hotelSearchLoading && hotelSearchResults.length>0 && (
                        <div style={{display:'flex',flexDirection:'column',gap:4,marginTop:7,maxHeight:170,overflowY:'auto'}}>
                          {hotelSearchResults.map((p,i)=>(
                            <button key={i} onClick={()=>setDayHotel(activeDayTab,p)} style={{textAlign:'left',padding:'8px 11px',fontSize:12,background:'#fff',border:'1px solid #e8dcd0',borderRadius:8,cursor:'pointer'}}>
                              <div style={{fontWeight:700,color:'#1a1714'}}>{p.name}</div>
                              {(p.vicinity||p.formatted_address) && <div style={{fontSize:10,color:'#9a8c7c',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.vicinity||p.formatted_address}</div>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
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
              const seqT = courseSeq(day)
              let totalSec = 0
              for (let i = 0; i < seqT.length - 1; i++) {
                const rk = getRouteKey(seqT[i], seqT[i+1], courseTransport)
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
                      {courseTripStart && <span style={{fontSize:11,fontWeight:700,color:'#1a1714'}}>{formatDate(getDayDate(activeDayTab))}</span>}
                      <span style={{fontSize:11,color:'#1a1714',fontWeight:600}}>{items.length}{t('coursePlace')}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      {totalMin > 0 && <span style={{fontSize:11,color:'#374151',fontWeight:500}}>{totalHr > 0 ? `${totalHr}${t('courseHour')} ${totalMinRem}${t('courseMin')}` : `${totalMin}${t('courseMin')}`}</span>}
                      {loadingRoutes && <div style={{width:12,height:12,borderRadius:'50%',border:'1.5px solid #e0d9d0',borderTopColor:'#c8856a',animation:'spin .7s linear infinite'}}/>}
                      {items.length >= 2 && (
                        <button onClick={()=>optimizeDay(activeDayTab)}
                          title={lang==='ko'?'동선 최적화':'Optimize route'}
                          style={{fontSize:12,background:'#c8856a',border:'1px solid #c8856a',color:'#fff',padding:'7px 14px',borderRadius:7,cursor:'pointer',fontWeight:700,transition:'all .15s'}}
                          onMouseEnter={e=>{e.currentTarget.style.background='#b5734f';e.currentTarget.style.borderColor='#b5734f'}}
                          onMouseLeave={e=>{e.currentTarget.style.background='#c8856a';e.currentTarget.style.borderColor='#c8856a'}}
                        >{lang==='ko'?'동선 최적화':lang==='ja'?'ルート最適化':lang==='zh'?'路线优化':'Optimize'}</button>
                      )}
                      {courseDays.length > 1 && (
                        <button onClick={()=>removeCourseDay(activeDayTab)}
                          style={{fontSize:10,background:'none',border:'1px solid #e0d9d0',color:'#1a1714',padding:'3px 8px',borderRadius:5,cursor:'pointer',transition:'all .15s'}}
                          onMouseEnter={e=>{e.currentTarget.style.color='#c0604a';e.currentTarget.style.borderColor='#e8c0b0'}}
                          onMouseLeave={e=>{e.currentTarget.style.color='#1a1714';e.currentTarget.style.borderColor='#e0d9d0'}}
                        >{t('courseDelete')}</button>
                      )}
                    </div>
                  </div>

                  {/* 한눈에 보기(컴팩트) 토글 — 관광지 많을 때 */}
                  {items.length >= 4 && (
                    <div style={{display:'flex',justifyContent:'flex-end',marginBottom:8}}>
                      <button onClick={()=>setCourseCompact(c=>!c)} style={{fontSize:11,fontWeight:600,padding:'5px 11px',background:courseCompact?'#c8856a':'#fff',border:courseCompact?'none':'1px solid #e0d9d0',borderRadius:7,color:courseCompact?'#fff':'#8a7a68',cursor:'pointer'}}>
                        {courseCompact?(lang==='ko'?'닫기':lang==='ja'?'閉じる':lang==='zh'?'收起':'Close'):(lang==='ko'?'펼치기':lang==='ja'?'展開':lang==='zh'?'展开':'Expand')}
                      </button>
                    </div>
                  )}
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
                          onDragEnd={()=>{setDragItem(null);stopDragAutoScroll()}}
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
                              <span style={{fontSize:10,color:'#1a1714',fontWeight:500}}>{getCourseItemCity(item)}</span>
                              {item.rating && <span style={{fontSize:9,color:'#d97706'}}>★{item.rating}</span>}
                            </div>
                          </div>
                          {/* 이동 버튼 → 데스크탑: 구글맵 / 모바일: 도시 패널 */}
                          <button onClick={()=>{
                            if (isMobile) {
                              const city = allCitiesFlat.find(c => c.name === item.cityName)
                              if (!city) return
                              const feat = countries.find(f => f.properties.NAME === city.countryEn)
                              if (feat) setSelectedCountry(feat)
                              setTimeout(() => { handleCityClick(city) }, 200)
                              setShowCoursePlanner(false)
                            } else {
                              // 데스크탑: 코스 유지하고 구글맵 새 탭
                              const q = encodeURIComponent(item.name)
                              window.open(`https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${item.place_id||''}`, '_blank')
                            }
                          }}
                            style={{background:'none',border:'1px solid #e0d9d0',color:'#6b7280',width:24,height:24,borderRadius:5,cursor:'pointer',fontSize:11,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}
                            onMouseEnter={e=>{e.currentTarget.style.color='#3b82f6';e.currentTarget.style.borderColor='#93c5fd';e.currentTarget.style.background='#eff6ff'}}
                            onMouseLeave={e=>{e.currentTarget.style.color='#6b7280';e.currentTarget.style.borderColor='#e0d9d0';e.currentTarget.style.background='none'}}
                            title={isMobile?t('courseGoCity'):t('courseGoMap')}>→</button>
                          {/* Day 이동 */}
                          {courseDays.length > 1 && (
                            <select value="" onChange={e=>{if(e.target.value!=='')moveToDayFn(activeDayTab,idx,parseInt(e.target.value));e.target.value=''}}
                              style={{width:70,fontSize:9,padding:'3px 2px',border:'1px solid #e0d9d0',borderRadius:5,color:'#1a1714',fontWeight:600,background:'#faf8f5',cursor:'pointer',flexShrink:0}}>
                              <option value="">{t('courseChangeDay')}</option>
                              {courseDays.map((_,di)=>di!==activeDayTab&&<option key={di} value={di}>Day {di+1}</option>)}
                            </select>
                          )}
                          {/* 삭제 */}
                          <button onClick={()=>removeFromDay(activeDayTab,idx)}
                            style={{background:'none',border:'none',color:'#1a1714',width:24,height:24,borderRadius:5,cursor:'pointer',fontSize:13,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}
                            onMouseEnter={e=>{e.currentTarget.style.color='#c0604a'}}
                            onMouseLeave={e=>{e.currentTarget.style.color='#1a1714'}}>×</button>
                        </div>

                        {/* 경로 */}
                        {idx < items.length - 1 && (
                          <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 0 5px 34px'}}>
                            {route ? (
                              <span style={{fontSize:10,color:'#1a1714',fontWeight:600}}>
                                — {route.noRoute ? (({ko:'상단의 상세 길찾기를 이용하세요.',en:'Use the detailed directions above.',ja:'上部の詳細ルート検索をご利用ください。',zh:'请使用上方的详细路线查询。'})[lang]||'상단의 상세 길찾기를 이용하세요.') : `${route.duration} · ${route.distance}`}
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

          {/* 푸터 — AI/수동 모두 저장 버튼으로 저장 (AI는 courseSource='ai'로 저장됨) */}
          <div style={{padding:'14px 20px',borderTop:'1px solid #e8e2da',flexShrink:0,display:'flex',gap:6}}>
              <button onClick={()=>{const s=saveCourseToList(courseSource);if(s){alert(t('courseSaved'));saveCourse([]);saveCourseDays([]);setRouteCache({});setCourseSource('manual');setLoadedCourseId(null)}setShowCoursePlanner(false)}}
                style={{flex:1,padding:'11px',background:'#c8856a',border:'none',borderRadius:8,fontSize:12,fontWeight:700,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all .15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#b8745a'}
                onMouseLeave={e=>e.currentTarget.style.background='#c8856a'}>
                {t('courseSave')}
              </button>
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
                  const _rawCont = COUNTRY_INFO[country]?.continent || ''
                  const cont = _rawCont ? _rawCont.replace(/\(.*?\)/g,'').split('/')[0].trim() : (lang==='ko'?'기타':'Other')
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
                                            {sp}
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
        return (
        <div style={{
          position:'fixed',inset:0,zIndex:3000,background:'#ffffff',
          display:'flex',flexDirection:'column',
          animation:'feedSlideUp .28s cubic-bezier(.22,.9,.32,1)',
        }}>
          <style>{`
            @keyframes feedSlideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes feedFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .feed-card { transition: all .2s cubic-bezier(.22,.9,.32,1); }
            .feed-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,.08); }
            .feed-fab { transition: all .2s; }
            .feed-fab:hover { transform: scale(1.08); box-shadow: 0 12px 32px rgba(236,72,153,.45); }
            .feed-header-shadow { box-shadow: 0 1px 0 rgba(0,0,0,.04); }
            .feed-section-scroll::-webkit-scrollbar { width: 6px; }
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
              <span style={{fontSize:isMobile?17:20,fontWeight:800,color:'#262626',letterSpacing:-0.4,fontFamily:'system-ui,-apple-system,sans-serif'}}>Travlog</span>
              <span style={{fontSize:11,color:'#a3a3a3',fontWeight:500,marginLeft:2}}>by ATLAS</span>
            </div>
            <div style={{width:36}}></div>
          </div>

          {/* Content: 블로그식 커뮤니티 피드 */}
          <div className="feed-section-scroll" style={{flex:1,overflowY:'auto',background:'#ffffff',padding:isMobile?'14px 12px':'18px 22px'}}>
            {(() => {
              // 공개글 + 내 글만 노출
              let visible = (feedJournals||[]).filter(j => j.visibility!=='private' || (currentUser && j.uid===currentUser.uid))
              if (feedSubTab==='mine') visible = visible.filter(j => currentUser && j.uid===currentUser.uid)
              const fmtDate = (s) => s ? s.slice(5).replace('-','.') : ''
              return (
                <>
                  {/* 필터 토글 */}
                  <div style={{display:'flex',gap:6,marginBottom:14}}>
                    {[{k:'all',label:t('feedTabAll')},{k:'mine',label:t('feedTabMine')}].map(st => (
                      <button key={st.k} onClick={()=>setFeedSubTab(st.k)}
                        style={{padding:'6px 16px',borderRadius:18,border:'none',cursor:'pointer',fontSize:12.5,fontWeight:700,
                          background:feedSubTab===st.k?'#262626':'#f1f5f9',color:feedSubTab===st.k?'#fff':'#737373',transition:'all .15s'}}>
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {feedJournalsLoading ? (
                    <div style={{textAlign:'center',color:'#a3a3a3',fontSize:14,padding:'60px 0'}}>{lang==='ko'?'불러오는 중...':lang==='ja'?'読み込み中...':lang==='zh'?'加载中...':'Loading...'}</div>
                  ) : visible.length === 0 ? (
                    <div style={{textAlign:'center',color:'#a3a3a3',padding:'70px 20px'}}>
                      <div style={{fontSize:44,marginBottom:12}}>✏️</div>
                      <div style={{fontSize:15,fontWeight:600,color:'#737373'}}>{feedSubTab==='mine'?(lang==='ko'?'작성한 여행기가 없어요':lang==='ja'?'書いた旅行記がありません':lang==='zh'?'还没有写过游记':'No posts of yours yet'):(lang==='ko'?'아직 여행기가 없어요':lang==='ja'?'まだ旅行記がありません':lang==='zh'?'还没有游记':'No posts yet')}</div>
                      <div style={{fontSize:13,marginTop:6}}>{lang==='ko'?'첫 번째 여행기를 작성해보세요':lang==='ja'?'最初の旅行記を書いてみましょう':lang==='zh'?'写下第一篇游记吧':'Write the first one'}</div>
                    </div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:16}}>
                      {visible.map(j => {
                        const thumb = (j.blocks&&j.blocks[0]&&j.blocks[0].photo) || (j.photos&&j.photos[0]) || ''
                        const cityStr = (j.cities||[]).map(c=>getCityName(c.name)).join(' · ')
                        const liked = currentUser && (j.likes||[]).includes(currentUser.uid)
                        return (
                          <div key={j.id} className="feed-card" onClick={()=>setViewingJournal(j)}
                            style={{borderRadius:16,overflow:'hidden',background:'#fff',border:'1px solid #f0f0f0',boxShadow:'0 1px 3px rgba(0,0,0,.04)',cursor:'pointer'}}>
                            {thumb && (
                              <div style={{position:'relative'}}>
                                <img src={thumb} loading="lazy" style={{width:'100%',height:isMobile?180:220,objectFit:'cover',display:'block'}} alt="" />
                                {j.rating>0 && (
                                  <div style={{position:'absolute',top:10,right:10,background:'rgba(15,23,42,.62)',color:'#fde68a',fontSize:11.5,fontWeight:800,padding:'3px 9px',borderRadius:20,backdropFilter:'blur(4px)'}}>★ {j.rating}</div>
                                )}
                              </div>
                            )}
                            <div style={{padding:isMobile?'12px 13px 13px':'14px 16px 15px'}}>
                              <div style={{fontSize:isMobile?15.5:17,fontWeight:800,color:'#1a1a1a',lineHeight:1.35,marginBottom:6,letterSpacing:-0.3}}>{j.title || t('journalNoTitle')}</div>
                              <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginBottom:8,fontSize:12}}>
                                {cityStr && <span style={{color:'#3b82f6',fontWeight:600}}>📍 {cityStr}</span>}
                                <span style={{color:'#94a3b8'}}>{j.days>1?(j.days-1)+t('journalDaysUnit')+j.days+t('journalDaysSeparator'):j.days+t('journalDaysSeparator')}</span>
                                {j.startDate && <span style={{color:'#cbd5e1'}}>·</span>}
                                {j.startDate && <span style={{color:'#94a3b8'}}>{fmtDate(j.startDate)}{j.endDate?' ~ '+fmtDate(j.endDate):''}</span>}
                              </div>
                              {j.body && <div style={{fontSize:13,color:'#64748b',lineHeight:1.6,marginBottom:10,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{j.body}</div>}
                              <div style={{display:'flex',alignItems:'center',gap:10,fontSize:12,color:'#94a3b8'}}>
                                <span style={{fontWeight:600,color:'#737373'}}>{j.userName}</span>
                                <span>{j.createdAt?new Date(j.createdAt).toLocaleDateString():''}</span>
                                <span style={{marginLeft:'auto',color:liked?'#ef4444':'#94a3b8',fontWeight:700}}>{liked?'❤️':'🤍'} {j.likeCount||0}</span>
                                <span style={{fontWeight:700}}>💬 {(j.comments||[]).length}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )
            })()}
          </div>

          {/* Floating Action Button (여행기 작성) */}
          <button className="feed-fab" onClick={()=>{
            if (!currentUser) { setShowLoginModal(true); return }
            setEditingJournal(null)
            setJournalForm({ title:'', body:'', cities:[], days:1, rating:0, visibility:'public', photos:[], blocks:[], startDate:'', endDate:'' })
            setShowJournalEditor(true)
          }} style={{
            position:'absolute',right:isMobile?18:26,bottom:isMobile?'calc(22px + env(safe-area-inset-bottom))':28,
            width:isMobile?54:58,height:isMobile?54:58,borderRadius:'50%',border:'none',cursor:'pointer',
            background:'linear-gradient(135deg,#ec4899,#f97316)',color:'#fff',fontSize:26,fontWeight:300,
            display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 6px 20px rgba(236,72,153,.4)',zIndex:20,
          }}>+</button>
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
                const blocksIn = journalForm.blocks||[]
                const hasPhoto = blocksIn.some(b => b.photo || b.file)
                if (!hasPhoto) { alert(t('journalRequiredBlock')); return }
                if (!currentUser) { alert(lang==='ko'?'로그인이 필요합니다':'Login required'); return }
                setJournalSaving(true)
                try {
                  // 블록별 사진 업로드 → {photo, caption} 배열 구성
                  const finalBlocks = []
                  for (const b of blocksIn) {
                    let url = b.photo || ''
                    if (b.file) url = await uploadJournalPhoto(b.file, currentUser.uid, editingJournal?.id || 'new')
                    if (url) finalBlocks.push({ photo: url, caption: (b.caption||'').trim() })
                  }
                  const photoUrls = finalBlocks.map(b => b.photo)  // 썸네일/호환용
                  // 날짜 → 박·일 자동 계산
                  let days = journalForm.days || 1
                  if (journalForm.startDate && journalForm.endDate) {
                    const nights = Math.round((new Date(journalForm.endDate) - new Date(journalForm.startDate)) / 86400000)
                    if (nights >= 0) days = nights + 1
                  }
                  const payload = {
                    title: journalForm.title, body: journalForm.body||'',
                    blocks: finalBlocks, photos: photoUrls, cities: journalForm.cities||[],
                    startDate: journalForm.startDate||'', endDate: journalForm.endDate||'',
                    days, rating: journalForm.rating||0, visibility: journalForm.visibility||'public',
                  }
                  if (editingJournal) {
                    await updateJournal(editingJournal.id, payload)
                  } else {
                    await createJournal(currentUser.uid, payload, currentUser.displayName||currentUser.email, currentUser.photoURL)
                  }
                  alert(t('journalSaved'))
                  setShowJournalEditor(false);setEditingJournal(null)
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

              {/* Date range (박·일 자동) + Rating */}
              <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
                <div style={{flex:'1 1 200px',minWidth:0}}>
                  <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:6}}>
                    {t('journalDateRange')}
                    {journalForm.startDate && journalForm.endDate && (()=>{
                      const n = Math.round((new Date(journalForm.endDate)-new Date(journalForm.startDate))/86400000)
                      if (n<0) return null
                      return <span style={{marginLeft:8,color:'#3b82f6',fontWeight:800}}>{n>0?n+t('journalDaysUnit')+(n+1)+t('journalDaysSeparator'):(lang==='ko'?'당일':lang==='ja'?'日帰り':lang==='zh'?'当天':'Day trip')}</span>
                    })()}
                  </label>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <input type="date" value={journalForm.startDate||''}
                      onChange={e=>{const sd=e.target.value;setJournalForm(f=>({...f,startDate:sd,endDate:(f.endDate&&f.endDate<sd)?sd:f.endDate}))}}
                      style={{flex:1,minWidth:0,padding:'8px 8px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:12,outline:'none',background:'white',color:'#0f172a'}} />
                    <span style={{color:'#94a3b8',fontSize:12}}>~</span>
                    <input type="date" value={journalForm.endDate||''} min={journalForm.startDate||undefined}
                      onChange={e=>setJournalForm(f=>({...f,endDate:e.target.value}))}
                      style={{flex:1,minWidth:0,padding:'8px 8px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:12,outline:'none',background:'white',color:'#0f172a'}} />
                  </div>
                </div>
                <div style={{flex:'0 0 auto'}}>
                  <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:6}}>{t('journalRating')}</label>
                  <div style={{display:'flex',gap:3,padding:'7px 0'}}>
                    {[1,2,3,4,5].map(n => (
                      <span key={n} onClick={()=>setJournalForm({...journalForm,rating:journalForm.rating===n?0:n})}
                        style={{fontSize:22,cursor:'pointer',color:journalForm.rating>=n?'#f59e0b':'#cbd5e1',transition:'all .1s',userSelect:'none'}}>★</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Intro (전체 소개글) */}
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:6}}>{t('journalIntro')}</label>
                <textarea value={journalForm.body} onChange={e=>setJournalForm({...journalForm,body:e.target.value})}
                  placeholder={t('journalIntroPh')} rows={3}
                  style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:13,outline:'none',boxSizing:'border-box',resize:'vertical',fontFamily:'inherit',lineHeight:1.6}} />
              </div>

              {/* Blocks (사진 + 설명) — 블로그식 */}
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:700,color:'#475569',display:'block',marginBottom:8}}>{t('journalBlocks')}</label>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {(journalForm.blocks||[]).map((b,i) => {
                    const preview = b.file ? URL.createObjectURL(b.file) : (b.photo||'')
                    return (
                      <div key={i} style={{border:'1.5px solid #e2e8f0',borderRadius:12,padding:10,background:'#f8fafc',position:'relative'}}>
                        <button onClick={()=>setJournalForm(f=>({...f,blocks:f.blocks.filter((_,idx)=>idx!==i)}))}
                          style={{position:'absolute',top:8,right:8,width:22,height:22,borderRadius:'50%',background:'rgba(15,23,42,.55)',border:'none',color:'white',fontSize:12,cursor:'pointer',zIndex:2}}>✕</button>
                        {preview ? (
                          <div style={{position:'relative',marginBottom:8}}>
                            <img src={preview} style={{width:'100%',maxHeight:isMobile?220:260,objectFit:'cover',borderRadius:9,display:'block'}} alt="" />
                            <label style={{position:'absolute',bottom:8,left:8,background:'rgba(15,23,42,.6)',color:'white',fontSize:11,padding:'4px 10px',borderRadius:8,cursor:'pointer'}}>
                              {lang==='ko'?'변경':lang==='ja'?'変更':lang==='zh'?'更换':'Change'}
                              <input type="file" accept="image/*" style={{display:'none'}}
                                onChange={e=>{const file=e.target.files[0];if(file)setJournalForm(f=>({...f,blocks:f.blocks.map((x,idx)=>idx===i?{...x,file,photo:''}:x)}))}} />
                            </label>
                          </div>
                        ) : (
                          <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,height:120,border:'1.5px dashed #cbd5e1',borderRadius:9,cursor:'pointer',marginBottom:8,color:'#94a3b8'}}>
                            <span style={{fontSize:28}}>📷</span>
                            <span style={{fontSize:12,fontWeight:600}}>{t('journalBlockPhoto')}</span>
                            <input type="file" accept="image/*" style={{display:'none'}}
                              onChange={e=>{const file=e.target.files[0];if(file)setJournalForm(f=>({...f,blocks:f.blocks.map((x,idx)=>idx===i?{...x,file,photo:''}:x)}))}} />
                          </label>
                        )}
                        <textarea value={b.caption||''} onChange={e=>setJournalForm(f=>({...f,blocks:f.blocks.map((x,idx)=>idx===i?{...x,caption:e.target.value}:x)}))}
                          placeholder={t('journalCaptionPh')} rows={2}
                          style={{width:'100%',padding:'8px 10px',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:12.5,outline:'none',boxSizing:'border-box',resize:'vertical',fontFamily:'inherit',lineHeight:1.55,background:'white'}} />
                      </div>
                    )
                  })}
                </div>
                <button onClick={()=>{
                  const total = (journalForm.blocks||[]).length
                  if (total >= 20) { alert(lang==='ko'?'최대 20개까지':'Max 20 blocks'); return }
                  setJournalForm(f=>({...f,blocks:[...(f.blocks||[]),{photo:'',caption:'',file:null}]}))
                }} style={{width:'100%',marginTop:10,padding:'11px',borderRadius:10,border:'1.5px dashed #94a3b8',background:'white',color:'#475569',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  {t('journalBlockAdd')}
                </button>
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
                      startDate: viewingJournal.startDate||'', endDate: viewingJournal.endDate||'',
                      rating: viewingJournal.rating||0, visibility: viewingJournal.visibility||'public',
                      photos: viewingJournal.photos||[],
                      blocks: (viewingJournal.blocks&&viewingJournal.blocks.length)
                        ? viewingJournal.blocks.map(b=>({photo:b.photo||'',caption:b.caption||'',file:null}))
                        : (viewingJournal.photos||[]).map(u=>({photo:u,caption:'',file:null})) // 구버전 호환
                    })
                    setShowJournalEditor(true);setViewingJournal(null)
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
                <span style={{fontSize:11,color:'#cbd5e1'}}>·</span>
                <span style={{fontSize:11,color:'#64748b'}}>{viewingJournal.days>1?(viewingJournal.days-1)+t('journalDaysUnit')+viewingJournal.days+t('journalDaysSeparator'):viewingJournal.days+t('journalDaysSeparator')}</span>
                {viewingJournal.startDate && (
                  <>
                    <span style={{fontSize:11,color:'#cbd5e1'}}>·</span>
                    <span style={{fontSize:11,color:'#64748b'}}>{viewingJournal.startDate.slice(5).replace('-','.')}{viewingJournal.endDate?' ~ '+viewingJournal.endDate.slice(5).replace('-','.'):''}</span>
                  </>
                )}
                {viewingJournal.rating > 0 && (
                  <>
                    <span style={{fontSize:11,color:'#cbd5e1'}}>·</span>
                    <span style={{fontSize:11,color:'#f59e0b',fontWeight:700}}>{'★'.repeat(Math.floor(viewingJournal.rating))} {viewingJournal.rating}</span>
                  </>
                )}
                <span style={{fontSize:11,color:'#94a3b8',marginLeft:'auto'}}>{viewingJournal.createdAt?new Date(viewingJournal.createdAt).toLocaleDateString():''}</span>
              </div>

              {/* Intro (소개글) */}
              {viewingJournal.body && (
                <div style={{fontSize:14.5,color:'#334155',lineHeight:1.8,whiteSpace:'pre-wrap',marginBottom:22,paddingBottom:20,borderBottom:'1px solid #f1f5f9'}}>{viewingJournal.body}</div>
              )}

              {/* Blocks (사진 + 설명) — 블로그식 본문 */}
              {(() => {
                const blocks = (viewingJournal.blocks&&viewingJournal.blocks.length)
                  ? viewingJournal.blocks
                  : (viewingJournal.photos||[]).map(u=>({photo:u,caption:''})) // 구버전 호환
                return (
                  <div style={{display:'flex',flexDirection:'column',gap:24,marginBottom:20}}>
                    {blocks.map((b,i) => (
                      <div key={i}>
                        {b.photo && (
                          <img src={b.photo} onClick={()=>window.open(b.photo,'_blank')}
                            style={{width:'100%',borderRadius:12,objectFit:'cover',maxHeight:isMobile?420:520,cursor:'zoom-in',display:'block'}} alt="" />
                        )}
                        {b.caption && (
                          <div style={{fontSize:14,color:'#475569',lineHeight:1.75,whiteSpace:'pre-wrap',marginTop:10,padding:'0 2px'}}>{b.caption}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })()}

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

      {/* Community Courses Modal — 전체화면 평면 목록 */}
      {showCommunity && (
        <div style={{position:'fixed',inset:0,zIndex:3000,background:'#faf8f5',display:'flex',flexDirection:'column',animation:'feedSlideUp .28s cubic-bezier(.22,.9,.32,1)'}}>
          <div style={{background:'#c8856a',padding:'16px 20px calc(16px) 20px',paddingTop:'calc(16px + env(safe-area-inset-top))',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <div>
              <div style={{fontSize:18,fontWeight:800,color:'white'}}>{({ko:'사용자 추천 코스',en:'Community Courses',ja:'おすすめコース',zh:'推荐路线'})[lang]||'사용자 추천 코스'}</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.8)',marginTop:2}}>{({ko:'다른 여행자들이 공유한 코스',en:'Courses shared by travelers',ja:'旅行者が共有したコース',zh:'旅行者分享的路线'})[lang]||''}</div>
            </div>
            <button onClick={()=>{setShowCommunity(false);setCommunityExpanded(null)}} style={{background:'rgba(255,255,255,.2)',border:'none',color:'white',width:34,height:34,borderRadius:10,fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>✕</button>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'16px',WebkitOverflowScrolling:'touch'}}>
            {communityLoading ? (
              <div style={{textAlign:'center',padding:'60px 0',color:'#94a3b8',fontSize:15}}>{lang==='ko'?'불러오는 중...':'Loading...'}</div>
            ) : communityCoursesData.length === 0 ? (
              <div style={{textAlign:'center',padding:'60px 0',color:'#94a3b8',fontSize:14,fontWeight:600}}>{t('communityEmpty')}</div>
            ) : (
              <div style={{maxWidth:640,margin:'0 auto'}}>
                <input value={communitySearch} onChange={e=>setCommunitySearch(e.target.value)} placeholder={lang==='ko'?'국가·도시 검색':'Search country/city'} style={{width:'100%',padding:'10px 14px',fontSize:13,border:'1px solid #e0d9d0',borderRadius:10,background:'white',outline:'none',marginBottom:10,boxSizing:'border-box'}} />
                <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
                  {[[0,lang==='ko'?'전체':'All'],[1,lang==='ko'?'당일':'1d'],[2,lang==='ko'?'1박2일':'2d'],[3,lang==='ko'?'2박3일':'3d'],[99,lang==='ko'?'3박+':'4d+']].map(([v,label])=>(
                    <button key={v} onClick={()=>setCommunityDayFilter(v)} style={{padding:'6px 13px',fontSize:12,fontWeight:600,borderRadius:16,cursor:'pointer',border:'1px solid '+(communityDayFilter===v?'#c8856a':'#e0d9d0'),background:communityDayFilter===v?'#c8856a':'white',color:communityDayFilter===v?'white':'#7a6f63'}}>{label}</button>
                  ))}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {communityCoursesData.filter(matchCommunityFilter).map((sc,idx) => {
                  const days = sc.course?.days || sc.days || []
                  const cities = [...new Set(days.flatMap(d=>(d.items||[]).map(it=>it.cityI18n?.[lang] || getCityName(it.cityName||it.name))).filter(Boolean))]
                  const firstCityRaw = days.flatMap(d=>(d.items||[]).map(it=>it.cityName||it.name)).find(Boolean)
                  let country = ''
                  if (firstCityRaw) { const entry = Object.entries(COUNTRY_CITIES).find(([_,cs])=>Array.isArray(cs)&&cs.some(c=>c.name===firstCityRaw)); if (entry) country = entry[0] }
                  const dayCount = days.length
                  const cityName = cities[0] || 'Course'
                  const title = lang==='ko'
                    ? (dayCount>1 ? `${dayCount-1}박${dayCount}일 ${cityName} 코스` : `당일 ${cityName} 코스`)
                    : `${dayCount}-Day ${cityName}`
                  const totalPlaces = days.reduce((a,d)=>a+(d.items||[]).length,0)
                  const isExpanded = communityExpanded === (sc.id||idx)
                  return (
                    <div key={sc.id||idx} style={{borderRadius:16,border:'1px solid #ede8e0',background:'white',overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}>
                      <div onClick={()=>setCommunityExpanded(isExpanded?null:(sc.id||idx))} style={{padding:'16px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:12}}>
                        {getFlagImg(COUNTRY_INFO[country]?.emoji,24) ? <img src={getFlagImg(COUNTRY_INFO[country]?.emoji,24)} width={30} height={22} style={{borderRadius:4,flexShrink:0}} /> : <span style={{fontSize:24,flexShrink:0}}>{COUNTRY_INFO[country]?.emoji||''}</span>}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:16,fontWeight:800,color:'#1a1714'}}>{title}</div>
                          <div style={{fontSize:12,color:'#9a8070',marginTop:2}}>{country?getCountryName(country):''}{cities.length>1?` · ${cities.slice(0,3).join(', ')}`:''} · {totalPlaces}{t('communityPlaces')}{(sc.course?.type||sc.type)==='ai' && <span style={{marginLeft:6,padding:'1px 6px',borderRadius:4,background:'#f3e8ff',color:'#7c3aed',fontSize:10,fontWeight:700}}>AI</span>}</div>
                        </div>
                        <span style={{fontSize:14,color:'#c0b8ae',flexShrink:0}}>{isExpanded?'▲':'▼'}</span>
                      </div>
                      {isExpanded && (
                        <div style={{borderTop:'1px solid #ede8e0',padding:'14px 18px',background:'#faf8f5'}}>
                          {days.map((day,di)=>(
                            <div key={di} style={{marginBottom:di<days.length-1?16:10}}>
                              <div style={{fontSize:13,fontWeight:800,color:'#c8856a',marginBottom:8}}>Day {di+1}</div>
                              {(day.items||[]).map((it,ii)=>(
                                <div key={ii}>
                                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:(it.legToNext&&ii<(day.items||[]).length-1)?4:8}}>
                                    <div style={{flexShrink:0,width:22,height:22,borderRadius:'50%',background:'#c8856a',color:'white',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{ii+1}</div>
                                    <div style={{fontSize:14,fontWeight:600,color:'#1a1714'}}>{it.i18n?.[lang] || getCourseItemName(it)}</div>
                                  </div>
                                  {it.legToNext && ii<(day.items||[]).length-1 && (
                                    <div style={{fontSize:11,color:'#b0a89e',paddingLeft:32,marginBottom:8,display:'flex',alignItems:'center',gap:5}}><span style={{color:'#d0c8be'}}>↓</span>{it.legToNext.duration} · {it.legToNext.distance}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                          <button onClick={()=>{
                            setCourseDays(days);localStorage.setItem('atlas_course_days',JSON.stringify(days))
                            const flat = days.flatMap(d=>d.items||[]);saveCourse(flat)
                            setCourseTransport(sc.course?.transport||sc.transport||'transit')
                            setActiveDayTab(0);setShowCoursePlanner(true);setShowCommunity(false);setCommunityExpanded(null)
                            setCourseSource(sc.course?.type||sc.type||'manual')
                          }} style={{width:'100%',marginTop:8,padding:'12px',background:'#c8856a',border:'none',color:'white',fontSize:14,fontWeight:700,borderRadius:10,cursor:'pointer'}}>
                            {t('communityLoad')}
                          </button>
                          <div style={{fontSize:11,color:'#b0a89e',marginTop:10,textAlign:'center'}}>{sc.userName||'Anonymous'}{currentUser && sc.uid === currentUser.uid && <span onClick={async()=>{if(confirm(lang==='ko'?'삭제하시겠습니까?':'Delete?')){await deleteSharedCourse(sc.id);setCommunityCoursesData(prev=>prev.filter(c=>c.id!==sc.id))}}} style={{marginLeft:10,color:'#ef4444',cursor:'pointer'}}>{lang==='ko'?'삭제':'Delete'}</span>}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalCourse && (() => {
        const days = shareModalCourse.days || []
        const cityNames = [...new Set(days.flatMap(d=>(d.items||[]).map(it=>it.cityName||it.name)).filter(Boolean))]
        const firstCityRaw = days.flatMap(d=>(d.items||[]).map(it=>it.cityName||it.name)).find(Boolean)
        let country = ''
        if (firstCityRaw) { const entry = Object.entries(COUNTRY_CITIES).find(([_,cs])=>Array.isArray(cs)&&cs.some(c=>c.name===firstCityRaw)); if (entry) country = entry[0] }
        const cityDisp = cityNames.map(c=>getCityName(c)).join(' · ')
        const totalPlaces = days.reduce((a,d)=>a+(d.items||[]).length,0)
        return (
        <>
          <div onClick={()=>setShareModalCourse(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:3100}} />
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:3101,width:isMobile?'92vw':400,background:'white',borderRadius:20,boxShadow:'0 24px 64px rgba(0,0,0,.3)',overflow:'hidden'}}>
            <div style={{background:'#c8856a',padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:16,fontWeight:800,color:'white'}}>{({ko:'사용자 추천 코스 공유하기',en:'Share to Community',ja:'おすすめコースを共有',zh:'分享推荐路线'})[lang]||'사용자 추천 코스 공유하기'}</span>
              <button onClick={()=>setShareModalCourse(null)} style={{background:'rgba(255,255,255,.2)',border:'none',color:'white',width:30,height:30,borderRadius:8,fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{padding:'18px 22px 22px'}}>
              <div style={{padding:'18px 16px',borderRadius:12,background:'#faf8f5',border:'1px solid #e0d9d0',marginBottom:18,textAlign:'center'}}>
                {getFlagImg(COUNTRY_INFO[country]?.emoji,24) && <img src={getFlagImg(COUNTRY_INFO[country]?.emoji,24)} width={34} height={24} style={{borderRadius:4,marginBottom:8}} />}
                <div style={{fontSize:15,fontWeight:800,color:'#1a1714'}}>{country?getCountryName(country):''}{cityDisp?` · ${cityDisp}`:''}</div>
                <div style={{fontSize:12,color:'#9a8070',marginTop:5}}>{totalPlaces}{t('communityPlaces')} · {days.length}{t('communityDays')}</div>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setShareModalCourse(null)} style={{flex:1,padding:'12px',borderRadius:10,border:'1.5px solid #e0d9d0',background:'white',color:'#7a6f63',fontSize:13,fontWeight:600,cursor:'pointer'}}>{t('shareCancel')}</button>
                <button disabled={shareUploading} onClick={async()=>{
                  if (!currentUser) { alert(lang==='ko'?'로그인이 필요합니다':'Login required'); return }
                  setShareUploading(true)
                  try {
                    await shareCourse(currentUser.uid, buildCourseI18n(shareModalCourse), currentUser.displayName||currentUser.email, [])
                    alert(t('communityShared'))
                    setShareModalCourse(null)
                  } catch(e) { alert(e.message) }
                  setShareUploading(false)
                }} style={{flex:1,padding:'12px',borderRadius:10,border:'none',background:'#c8856a',color:'white',fontSize:13,fontWeight:700,cursor:'pointer',opacity:shareUploading?.6:1}}>
                  {shareUploading ? t('uploading') : (({ko:'공유하기',en:'Share',ja:'共有',zh:'分享'})[lang]||'공유하기')}
                </button>
              </div>
            </div>
          </div>
        </>
        )
      })()}

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
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:3001,width:isMobile?'92vw':380,background:'#fcfaf7',borderRadius:20,boxShadow:'0 24px 64px rgba(0,0,0,.3)',overflow:'hidden',border:'1px solid #e0d9d0'}}>
            <div style={{background:'linear-gradient(135deg,#d49e86,#c08a6e)',padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:17,fontWeight:800,color:'white'}}>{t('currCalc')}</span>
              </div>
              <button onClick={()=>setShowCurrencyCalc(false)} style={{background:'rgba(255,255,255,.2)',border:'none',color:'white',width:30,height:30,borderRadius:8,fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{padding:'20px 22px 24px'}}>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:11,fontWeight:600,color:'#9a8070',display:'block',marginBottom:4}}>{t('currAmount')}</label>
                <input type="number" value={currAmount} onChange={e=>setCurrAmount(e.target.value)}
                  style={{width:'100%',padding:'10px 14px',border:'1.5px solid #e0d9d0',borderRadius:10,fontSize:18,fontWeight:700,color:'#1a1714',outline:'none',boxSizing:'border-box'}}
                  onFocus={e=>e.target.style.borderColor='#d49e86'} onBlur={e=>e.target.style.borderColor='#e0d9d0'} />
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,fontWeight:600,color:'#9a8070',display:'block',marginBottom:4}}>{t('currFrom')}</label>
                  <select value={currFrom} onChange={e=>setCurrFrom(e.target.value)}
                    style={{width:'100%',padding:'9px 10px',border:'1.5px solid #e0d9d0',borderRadius:10,fontSize:14,fontWeight:600,color:'#1a1714',background:'white',cursor:'pointer'}}>
                    {['KRW','USD','EUR','JPY','GBP','CNY','THB','VND','AUD','CAD','CHF','SGD','HKD','TWD','MYR','PHP','IDR','INR','AED','TRY','BRL','MXN','SEK','NOK','DKK','NZD','CZK','PLN','HUF','ZAR','EGP','SAR','RUB','ILS'].map(c=>(
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <button onClick={()=>{const tmp=currFrom;setCurrFrom(currTo);setCurrTo(tmp);setCurrResult(null)}}
                  style={{marginTop:16,background:'#f5f0ea',border:'none',width:36,height:36,borderRadius:10,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#e0d9d0'} onMouseLeave={e=>e.currentTarget.style.background='#f5f0ea'}>⇄</button>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,fontWeight:600,color:'#9a8070',display:'block',marginBottom:4}}>{t('currTo')}</label>
                  <select value={currTo} onChange={e=>setCurrTo(e.target.value)}
                    style={{width:'100%',padding:'9px 10px',border:'1.5px solid #e0d9d0',borderRadius:10,fontSize:14,fontWeight:600,color:'#1a1714',background:'white',cursor:'pointer'}}>
                    {['USD','KRW','EUR','JPY','GBP','CNY','THB','VND','AUD','CAD','CHF','SGD','HKD','TWD','MYR','PHP','IDR','INR','AED','TRY','BRL','MXN','SEK','NOK','DKK','NZD','CZK','PLN','HUF','ZAR','EGP','SAR','RUB','ILS'].map(c=>(
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={()=>fetchCurrencyRate(currFrom,currTo,currAmount||1)}
                style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#d49e86,#c08a6e)',border:'none',borderRadius:12,color:'white',fontSize:15,fontWeight:700,cursor:'pointer',transition:'opacity .15s'}}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.9'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                {currLoading ? t('currLoading') : t('currConvert')}
              </button>
              {currResult !== null && (
                <div style={{marginTop:16,padding:'16px',background:'linear-gradient(135deg,#f5f0ea,#ede8e0)',border:'1.5px solid #e0d9d0',borderRadius:14,textAlign:'center'}}>
                  {currResult === 'error' ? (
                    <span style={{color:'#ef4444',fontSize:13,fontWeight:600}}>{t('currError')}</span>
                  ) : (
                    <>
                      <div style={{fontSize:13,color:'#9a8070',marginBottom:4}}>{Number(currAmount||0).toLocaleString()} {currFrom} =</div>
                      <div style={{fontSize:26,fontWeight:800,color:'#b8826a'}}>{Number(currResult).toLocaleString(undefined,{maximumFractionDigits:2})} <span style={{fontSize:16,fontWeight:600}}>{currTo}</span></div>
                      <div style={{fontSize:10,color:'#b0a89e',marginTop:6}}>1 {currFrom} ≈ {currRates?.[currTo] ? currRates[currTo].toFixed(4) : '—'} {currTo}</div>
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
