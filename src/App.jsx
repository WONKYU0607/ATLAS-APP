import { useState, useEffect, useRef, Component } from 'react'
import Globe from 'globe.gl'

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
  ],
  "Japan": [
    { name:"도쿄", lat:35.68, lng:139.69, emoji:"🗼", color:"#e74c3c" },
    { name:"교토", lat:35.01, lng:135.77, emoji:"⛩️", color:"#9b59b6" },
    { name:"오사카", lat:34.69, lng:135.50, emoji:"🏯", color:"#f39c12" },
    { name:"삿포로", lat:43.06, lng:141.35, emoji:"❄️", color:"#3498db" },
    { name:"나라", lat:34.68, lng:135.83, emoji:"🦌", color:"#2ecc71" },
  ],
  "France": [
    { name:"파리", lat:48.86, lng:2.35, emoji:"🗼", color:"#2ecc71" },
    { name:"니스", lat:43.71, lng:7.26, emoji:"🌊", color:"#3498db" },
    { name:"리옹", lat:45.75, lng:4.83, emoji:"🍷", color:"#9b59b6" },
    { name:"보르도", lat:44.84, lng:-0.58, emoji:"🍇", color:"#e74c3c" },
  ],
  "United States of America": [
    { name:"뉴욕", lat:40.71, lng:-74.01, emoji:"🗽", color:"#3498db" },
    { name:"로스앤젤레스", lat:34.05, lng:-118.24, emoji:"🎬", color:"#e74c3c" },
    { name:"샌프란시스코", lat:37.77, lng:-122.42, emoji:"🌉", color:"#f39c12" },
    { name:"라스베이거스", lat:36.17, lng:-115.14, emoji:"🎰", color:"#e74c3c" },
    { name:"마이애미", lat:25.77, lng:-80.19, emoji:"🌴", color:"#2ecc71" },
    { name:"시카고", lat:41.88, lng:-87.63, emoji:"🌆", color:"#9b59b6" },
  ],
  "Australia": [
    { name:"시드니", lat:-33.87, lng:151.21, emoji:"🎭", color:"#1abc9c" },
    { name:"멜버른", lat:-37.81, lng:144.96, emoji:"🏙️", color:"#3498db" },
    { name:"케언즈", lat:-16.92, lng:145.77, emoji:"🐠", color:"#2ecc71" },
    { name:"울루루", lat:-25.34, lng:131.04, emoji:"🪨", color:"#e67e22" },
  ],
  "United Arab Emirates": [
    { name:"두바이", lat:25.20, lng:55.27, emoji:"🏗️", color:"#f39c12" },
    { name:"아부다비", lat:24.47, lng:54.37, emoji:"🕌", color:"#3498db" },
  ],
  "Italy": [
    { name:"로마", lat:41.90, lng:12.50, emoji:"🏛️", color:"#9b59b6" },
    { name:"베네치아", lat:45.44, lng:12.32, emoji:"🚤", color:"#3498db" },
    { name:"피렌체", lat:43.77, lng:11.25, emoji:"🎨", color:"#e74c3c" },
    { name:"밀라노", lat:45.46, lng:9.19, emoji:"👗", color:"#2ecc71" },
    { name:"나폴리", lat:40.85, lng:14.27, emoji:"🍕", color:"#f39c12" },
  ],
  "Thailand": [
    { name:"방콕", lat:13.76, lng:100.50, emoji:"🛕", color:"#00bcd4" },
    { name:"치앙마이", lat:18.79, lng:98.98, emoji:"🐘", color:"#2ecc71" },
    { name:"푸켓", lat:7.89, lng:98.40, emoji:"🏖️", color:"#3498db" },
    { name:"파타야", lat:12.93, lng:100.88, emoji:"🌊", color:"#e74c3c" },
  ],
  "Egypt": [
    { name:"카이로", lat:30.04, lng:31.24, emoji:"🔺", color:"#e67e22" },
    { name:"룩소르", lat:25.69, lng:32.64, emoji:"🏺", color:"#f39c12" },
    { name:"아스완", lat:24.09, lng:32.90, emoji:"⛵", color:"#e74c3c" },
  ],
  "Brazil": [
    { name:"리우데자네이루", lat:-22.91, lng:-43.17, emoji:"🏖️", color:"#27ae60" },
    { name:"상파울루", lat:-23.55, lng:-46.63, emoji:"🏙️", color:"#3498db" },
    { name:"마나우스", lat:-3.10, lng:-60.02, emoji:"🌿", color:"#2ecc71" },
    { name:"포스두이과수", lat:-25.52, lng:-54.59, emoji:"💧", color:"#00bcd4" },
  ],
  "Morocco": [
    { name:"마라케시", lat:31.63, lng:-7.98, emoji:"🕌", color:"#e74c3c" },
    { name:"페스", lat:34.03, lng:-5.00, emoji:"🏺", color:"#f39c12" },
    { name:"카사블랑카", lat:33.59, lng:-7.62, emoji:"🌊", color:"#3498db" },
  ],
  "Spain": [
    { name:"바르셀로나", lat:41.39, lng:2.17, emoji:"🏟️", color:"#3498db" },
    { name:"마드리드", lat:40.42, lng:-3.70, emoji:"🎨", color:"#e74c3c" },
    { name:"세비야", lat:37.39, lng:-5.99, emoji:"💃", color:"#f39c12" },
    { name:"그라나다", lat:37.18, lng:-3.60, emoji:"🏰", color:"#9b59b6" },
  ],
  "South Africa": [
    { name:"케이프타운", lat:-33.92, lng:18.42, emoji:"🏔️", color:"#2ecc71" },
    { name:"요하네스버그", lat:-26.20, lng:28.04, emoji:"🏙️", color:"#3498db" },
    { name:"더반", lat:-29.86, lng:31.02, emoji:"🌊", color:"#e74c3c" },
  ],
  "Indonesia": [
    { name:"발리", lat:-8.41, lng:115.19, emoji:"🌺", color:"#0e7490" },
    { name:"자카르타", lat:-6.21, lng:106.85, emoji:"🏙️", color:"#3498db" },
    { name:"족자카르타", lat:-7.80, lng:110.36, emoji:"🏛️", color:"#f39c12" },
    { name:"코모도", lat:-8.55, lng:119.49, emoji:"🦎", color:"#2ecc71" },
  ],
  "United Kingdom": [
    { name:"런던", lat:51.51, lng:-0.13, emoji:"👑", color:"#7c3aed" },
    { name:"에든버러", lat:55.95, lng:-3.19, emoji:"🏰", color:"#3498db" },
    { name:"맨체스터", lat:53.48, lng:-2.24, emoji:"⚽", color:"#e74c3c" },
    { name:"바스", lat:51.38, lng:-2.36, emoji:"🛁", color:"#2ecc71" },
  ],
  "Turkey": [
    { name:"이스탄불", lat:41.01, lng:28.98, emoji:"🕌", color:"#b45309" },
    { name:"카파도키아", lat:38.64, lng:34.83, emoji:"🎈", color:"#e74c3c" },
    { name:"파묵칼레", lat:37.92, lng:29.12, emoji:"💎", color:"#3498db" },
    { name:"안탈리아", lat:36.90, lng:30.70, emoji:"🌊", color:"#2ecc71" },
  ],
  "Greece": [
    { name:"산토리니", lat:36.39, lng:25.46, emoji:"🏛️", color:"#1e40af" },
    { name:"아테네", lat:37.98, lng:23.73, emoji:"🏛️", color:"#e74c3c" },
    { name:"미코노스", lat:37.44, lng:25.33, emoji:"💃", color:"#3498db" },
    { name:"크레타", lat:35.24, lng:25.02, emoji:"🌿", color:"#2ecc71" },
  ],
  "Peru": [
    { name:"마추픽추", lat:-13.16, lng:-72.55, emoji:"🏔️", color:"#15803d" },
    { name:"쿠스코", lat:-13.53, lng:-71.97, emoji:"🏛️", color:"#78350f" },
    { name:"리마", lat:-12.05, lng:-77.04, emoji:"🏙️", color:"#3498db" },
  ],
  "Jordan": [
    { name:"페트라", lat:30.33, lng:35.44, emoji:"🏺", color:"#b45309" },
    { name:"암만", lat:31.95, lng:35.93, emoji:"🕌", color:"#3498db" },
    { name:"와디럼", lat:29.58, lng:35.42, emoji:"🏜️", color:"#e67e22" },
  ],
  "Netherlands": [
    { name:"암스테르담", lat:52.37, lng:4.90, emoji:"🚲", color:"#c2410c" },
    { name:"로테르담", lat:51.92, lng:4.48, emoji:"🌉", color:"#3498db" },
    { name:"헤이그", lat:52.08, lng:4.31, emoji:"⚖️", color:"#2ecc71" },
  ],
  "Czechia": [
    { name:"프라하", lat:50.08, lng:14.44, emoji:"🏰", color:"#065f46" },
    { name:"체스키크룸로프", lat:48.81, lng:14.32, emoji:"🏯", color:"#e74c3c" },
  ],
  "Portugal": [
    { name:"리스본", lat:38.72, lng:-9.14, emoji:"🏙️", color:"#92400e" },
    { name:"포르투", lat:41.15, lng:-8.61, emoji:"🍷", color:"#e74c3c" },
    { name:"신트라", lat:38.80, lng:-9.39, emoji:"🏰", color:"#2ecc71" },
  ],
  "Singapore": [
    { name:"싱가포르", lat:1.35, lng:103.82, emoji:"🦁", color:"#991b1b" },
  ],
  "Argentina": [
    { name:"부에노스아이레스", lat:-34.60, lng:-58.38, emoji:"💃", color:"#0369a1" },
    { name:"파타고니아", lat:-41.83, lng:-68.91, emoji:"🏔️", color:"#2ecc71" },
    { name:"이과수", lat:-25.69, lng:-54.44, emoji:"💧", color:"#3498db" },
  ],
  "India": [
    { name:"뭄바이", lat:19.08, lng:72.88, emoji:"🌆", color:"#b45309" },
    { name:"뉴델리", lat:28.61, lng:77.21, emoji:"🕌", color:"#e74c3c" },
    { name:"아그라", lat:27.18, lng:78.02, emoji:"🕌", color:"#f39c12" },
    { name:"바라나시", lat:25.32, lng:83.01, emoji:"🙏", color:"#9b59b6" },
    { name:"고아", lat:15.30, lng:74.09, emoji:"🏖️", color:"#2ecc71" },
  ],
  "Mexico": [
    { name:"멕시코시티", lat:19.43, lng:-99.13, emoji:"🏛️", color:"#166534" },
    { name:"칸쿤", lat:21.16, lng:-86.85, emoji:"🏖️", color:"#3498db" },
    { name:"과달라하라", lat:20.66, lng:-103.35, emoji:"🌮", color:"#e74c3c" },
  ],
  "Canada": [
    { name:"밴쿠버", lat:49.28, lng:-123.12, emoji:"🏔️", color:"#9f1239" },
    { name:"토론토", lat:43.65, lng:-79.38, emoji:"🏙️", color:"#3498db" },
    { name:"퀘벡시티", lat:46.81, lng:-71.21, emoji:"🏰", color:"#2ecc71" },
    { name:"밴프", lat:51.18, lng:-115.57, emoji:"🏞️", color:"#e67e22" },
  ],
  "Iceland": [
    { name:"레이캬비크", lat:64.13, lng:-21.82, emoji:"🌋", color:"#1e3a8a" },
    { name:"아퀴레이리", lat:65.68, lng:-18.10, emoji:"❄️", color:"#3498db" },
  ],
  "Kenya": [
    { name:"나이로비", lat:-1.29, lng:36.82, emoji:"🦁", color:"#14532d" },
    { name:"마사이마라", lat:-1.49, lng:35.15, emoji:"🐘", color:"#2ecc71" },
    { name:"몸바사", lat:-4.05, lng:39.67, emoji:"🌊", color:"#3498db" },
  ],
  "Cuba": [
    { name:"하바나", lat:23.11, lng:-82.37, emoji:"🚗", color:"#7c2d12" },
    { name:"트리니다드", lat:21.80, lng:-79.98, emoji:"🎵", color:"#e74c3c" },
  ],
  "Vietnam": [
    { name:"하노이", lat:21.03, lng:105.85, emoji:"🏮", color:"#be123c" },
    { name:"호찌민시", lat:10.78, lng:106.70, emoji:"🛵", color:"#e74c3c" },
    { name:"하롱베이", lat:20.91, lng:107.18, emoji:"⛵", color:"#3498db" },
    { name:"호이안", lat:15.88, lng:108.34, emoji:"🏮", color:"#f39c12" },
  ],
  "Austria": [
    { name:"빈", lat:48.21, lng:16.37, emoji:"🎵", color:"#5b21b6" },
    { name:"잘츠부르크", lat:47.80, lng:13.04, emoji:"🎶", color:"#3498db" },
    { name:"인스브루크", lat:47.27, lng:11.39, emoji:"⛷️", color:"#2ecc71" },
  ],
  "New Zealand": [
    { name:"퀸스타운", lat:-45.03, lng:168.66, emoji:"🏔️", color:"#065f46" },
    { name:"오클랜드", lat:-36.85, lng:174.76, emoji:"🌉", color:"#3498db" },
    { name:"로토루아", lat:-38.14, lng:176.25, emoji:"♨️", color:"#e74c3c" },
  ],
  "China": [
    { name:"베이징", lat:39.90, lng:116.41, emoji:"🏯", color:"#e74c3c" },
    { name:"상하이", lat:31.23, lng:121.47, emoji:"🌆", color:"#3498db" },
    { name:"시안", lat:34.34, lng:108.94, emoji:"🏺", color:"#f39c12" },
    { name:"구이린", lat:25.27, lng:110.29, emoji:"⛰️", color:"#2ecc71" },
    { name:"청두", lat:30.57, lng:104.07, emoji:"🐼", color:"#9b59b6" },
  ],
  "Germany": [
    { name:"베를린", lat:52.52, lng:13.40, emoji:"🏛️", color:"#3498db" },
    { name:"뮌헨", lat:48.14, lng:11.58, emoji:"🍺", color:"#e74c3c" },
    { name:"함부르크", lat:53.55, lng:9.99, emoji:"⚓", color:"#2ecc71" },
    { name:"로텐부르크", lat:49.38, lng:10.18, emoji:"🏰", color:"#f39c12" },
  ],
  "Russia": [
    { name:"모스크바", lat:55.75, lng:37.62, emoji:"🕌", color:"#e74c3c" },
    { name:"상트페테르부르크", lat:59.95, lng:30.32, emoji:"🏛️", color:"#3498db" },
    { name:"바이칼호", lat:53.50, lng:108.17, emoji:"🌊", color:"#2ecc71" },
  ],
  "Switzerland": [
    { name:"취리히", lat:47.38, lng:8.54, emoji:"🏦", color:"#e74c3c" },
    { name:"제네바", lat:46.20, lng:6.15, emoji:"⌚", color:"#3498db" },
    { name:"인터라켄", lat:46.69, lng:7.86, emoji:"🏔️", color:"#2ecc71" },
    { name:"루체른", lat:47.05, lng:8.31, emoji:"🌉", color:"#9b59b6" },
  ],
  "Nepal": [
    { name:"카트만두", lat:27.70, lng:85.32, emoji:"🕌", color:"#e74c3c" },
    { name:"포카라", lat:28.21, lng:83.99, emoji:"🏔️", color:"#3498db" },
  ],
  "Cambodia": [
    { name:"씨엠립", lat:13.36, lng:103.86, emoji:"🏛️", color:"#e74c3c" },
    { name:"프놈펜", lat:11.56, lng:104.93, emoji:"🏙️", color:"#3498db" },
  ],
  "Sri Lanka": [
    { name:"콜롬보", lat:6.93, lng:79.85, emoji:"🌿", color:"#2ecc71" },
    { name:"캔디", lat:7.29, lng:80.63, emoji:"🐘", color:"#e74c3c" },
  ],
  "Tanzania": [
    { name:"잔지바르", lat:-6.16, lng:39.20, emoji:"🏖️", color:"#3498db" },
    { name:"세렝게티", lat:-2.33, lng:34.83, emoji:"🦁", color:"#2ecc71" },
  ],
  "Norway": [
    { name:"오슬로", lat:59.91, lng:10.75, emoji:"🏙️", color:"#3498db" },
    { name:"베르겐", lat:60.39, lng:5.32, emoji:"⛵", color:"#2ecc71" },
    { name:"플롬", lat:60.86, lng:7.11, emoji:"🌊", color:"#e74c3c" },
  ],
  "Hungary": [
    { name:"부다페스트", lat:47.50, lng:19.04, emoji:"🏰", color:"#e74c3c" },
  ],
  "Croatia": [
    { name:"두브로브니크", lat:42.65, lng:18.09, emoji:"🌊", color:"#3498db" },
    { name:"자그레브", lat:45.81, lng:15.98, emoji:"🏙️", color:"#e74c3c" },
    { name:"플리트비체", lat:44.88, lng:15.62, emoji:"💧", color:"#2ecc71" },
  ],
  "Malaysia": [
    { name:"쿠알라룸푸르", lat:3.14, lng:101.69, emoji:"🏙️", color:"#3498db" },
    { name:"페낭", lat:5.41, lng:100.33, emoji:"🍜", color:"#e74c3c" },
    { name:"코타키나발루", lat:5.98, lng:116.07, emoji:"🏔️", color:"#2ecc71" },
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
  // 대한민국
  "서울": { description:"서울은 600년 조선왕조의 역사와 K-팝 문화, 첨단 기술이 공존하는 아시아 최고의 도시입니다. 고궁과 현대 빌딩이 어우러진 독특한 매력으로 매년 수천만 명의 여행자를 끌어들입니다.", spots:[{name:"경복궁",type:"역사",desc:"조선 5대 궁궐 중 가장 웅장하며 매시간 수문장 교대식이 열립니다. 근정전과 경회루는 조선 건축의 정수를 보여줍니다.",img:"https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=400&q=80",rating:4.8},{name:"북촌 한옥마을",type:"문화",desc:"600년 된 전통 한옥이 즐비한 골목으로 조선시대 양반 생활을 엿볼 수 있습니다. 인왕산을 배경으로 한 풍경이 일품입니다.",img:"https://images.unsplash.com/photo-1538485399081-7191377e8241?w=400&q=80",rating:4.7},{name:"N서울타워",type:"랜드마크",desc:"남산 정상에 솟아오른 타워로 서울 전역을 360도로 내려다볼 수 있습니다. 야경이 특히 아름다워 연인들의 필수 코스입니다.",img:"https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?w=400&q=80",rating:4.6},{name:"광장시장",type:"음식",desc:"1905년에 문을 연 서울 최초의 전통시장으로 빈대떡, 육회, 마약김밥이 유명합니다. 한국 전통 먹거리 문화의 살아있는 역사입니다.",img:"https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&q=80",rating:4.7}]},
  "부산": { description:"부산은 한국 제2의 도시로 드라마틱한 해안 절경과 활기찬 항구 문화가 공존합니다. 해운대 해수욕장과 자갈치시장으로 대표되는 역동적인 항구 도시입니다.", spots:[{name:"해운대 해수욕장",type:"자연",desc:"한국에서 가장 유명한 해수욕장으로 연간 1,500만 명이 방문합니다. 백사장 길이가 1.8km에 달하며 마린시티 야경이 환상적입니다.",img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",rating:4.7},{name:"감천문화마을",type:"문화",desc:"산비탈을 따라 형형색색의 집들이 계단식으로 늘어선 한국의 산토리니로 불립니다. 벽화와 조형물이 골목마다 숨어있어 탐험하는 재미가 있습니다.",img:"https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80",rating:4.6},{name:"자갈치시장",type:"음식",desc:"한국 최대의 수산물 시장으로 싱싱한 회와 해산물을 저렴하게 맛볼 수 있습니다. 부산 사투리로 흥정하는 아주머니들의 활기찬 모습이 인상적입니다.",img:"https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&q=80",rating:4.5},{name:"광안리 해수욕장",type:"랜드마크",desc:"광안대교를 배경으로 한 야경이 압도적인 해변입니다. 매년 부산 불꽃축제가 열려 화려한 불꽃놀이를 감상할 수 있습니다.",img:"https://images.unsplash.com/photo-1571893544028-06819f999769?w=400&q=80",rating:4.8}]},
  "제주": { description:"제주도는 유네스코 세계자연유산으로 지정된 화산섬으로 한라산, 주상절리, 올레길 등 독보적인 자연 경관을 자랑합니다. 독특한 제주 문화와 해녀 문화도 큰 볼거리입니다.", spots:[{name:"한라산",type:"자연",desc:"해발 1,950m의 한반도 최고봉으로 연간 100만 명이 등반합니다. 정상 백록담 분화구는 제주의 상징이며 계절마다 다른 풍경을 선사합니다.",img:"https://images.unsplash.com/photo-1571619414582-59e5d9d8cb6e?w=400&q=80",rating:4.9},{name:"성산일출봉",type:"랜드마크",desc:"해저 화산 폭발로 형성된 거대한 분화구로 유네스코 세계자연유산입니다. 일출 명소로 유명하며 주변 유채꽃밭과의 조화가 아름답습니다.",img:"https://images.unsplash.com/photo-1596429162461-6bd3d944eff8?w=400&q=80",rating:4.8},{name:"협재 해수욕장",type:"자연",desc:"에메랄드빛 바다와 하얀 모래사장, 비양도가 어우러진 제주 최고의 해변입니다. 얕고 투명한 바다가 스노클링하기에 안성맞춤입니다.",img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",rating:4.7},{name:"만장굴",type:"자연",desc:"세계에서 가장 큰 용암동굴 중 하나로 길이가 7.4km에 달합니다. 동굴 내부의 용암 기둥과 석순이 신비로운 지하 세계를 연출합니다.",img:"https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=400&q=80",rating:4.6}]},
  "경주": { description:"경주는 신라 천년의 역사를 간직한 야외 박물관으로 유네스코 세계문화유산 지구입니다. 도시 전체가 고분, 사찰, 왕릉으로 가득한 살아있는 역사의 현장입니다.", spots:[{name:"불국사",type:"역사",desc:"751년에 창건된 신라 불교 건축의 걸작으로 유네스코 세계문화유산입니다. 다보탑과 석가탑이 대웅전 앞에 나란히 서있는 모습이 장관입니다.",img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",rating:4.9},{name:"첨성대",type:"역사",desc:"7세기에 건립된 동양 최고(最古)의 천문대로 신라의 과학 수준을 보여줍니다. 362개의 돌로 쌓인 원통형 구조가 독특한 아름다움을 자아냅니다.",img:"https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&q=80",rating:4.7},{name:"석굴암",type:"역사",desc:"화강암으로 만든 인공 석굴 사원으로 본존불상이 완벽한 비례미를 자랑합니다. 토함산 정상 근처에 위치해 동해 일출도 감상할 수 있습니다.",img:"https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=400&q=80",rating:4.8},{name:"대릉원",type:"역사",desc:"신라 왕족의 대형 고분들이 모여있는 능원으로 천마총이 가장 유명합니다. 잔디로 덮인 거대한 고분들 사이를 거닐면 천년 전 신라로 여행하는 기분입니다.",img:"https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&q=80",rating:4.6}]},

  // 일본
  "도쿄": { description:"도쿄는 초현대적 고층 빌딩과 고즈넉한 사찰이 공존하는 세계 최대 도시입니다. 미슐랭 별점 레스토랑이 세계 최다이며 애니메이션, 패션, 기술 문화의 중심지입니다.", spots:[{name:"센소지 사원",type:"역사",desc:"645년에 건립된 도쿄 최고(最古)의 불교 사원으로 연간 3,000만 명이 방문합니다. 나카미세 상점가의 전통 기념품과 먹거리도 놓칠 수 없습니다.",img:"https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80",rating:4.8},{name:"시부야 교차로",type:"도시",desc:"한 번 신호가 바뀔 때마다 3,000명이 동시에 건너는 세계에서 가장 바쁜 횡단보도입니다. 스크램블 교차로 위 스타벅스에서 내려다보는 풍경이 압권입니다.",img:"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80",rating:4.7},{name:"팀랩 플래닛",type:"문화",desc:"물 위를 걷고 꽃 속에 잠기는 몰입형 디지털 아트 공간으로 전 세계 최고 수준의 미디어아트를 경험할 수 있습니다. 예약 필수입니다.",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",rating:4.9},{name:"신주쿠 교엔",type:"자연",desc:"프랑스식, 영국식, 일본식 정원이 조화를 이루는 국립 정원으로 봄 벚꽃 시즌에 특히 아름답습니다. 도심 속 고요한 휴식 공간입니다.",img:"https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&q=80",rating:4.6}]},
  "교토": { description:"교토는 1,200년간 일본의 수도였으며 2,000개가 넘는 사찰과 신사가 있는 전통 문화의 중심지입니다. 게이샤 문화와 다도, 기모노가 살아숨쉬는 도시입니다.", spots:[{name:"후시미이나리 신사",type:"문화",desc:"1만 개가 넘는 주황색 도리이 게이트가 산을 뒤덮는 장관을 연출합니다. 새벽이나 저녁에 방문하면 신비로운 분위기를 만끽할 수 있습니다.",img:"https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80",rating:4.9},{name:"아라시야마 대나무숲",type:"자연",desc:"하늘을 향해 뻗은 거대한 대나무들이 만들어내는 초록 터널로 세계에서 가장 아름다운 산책로 중 하나입니다. 바람에 흔들리는 소리가 일품입니다.",img:"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80",rating:4.8},{name:"기요미즈데라",type:"역사",desc:"798년에 창건된 사찰로 나무 기둥만으로 지지되는 절벽 무대가 유명합니다. 교토 시내를 한눈에 내려다볼 수 있는 전망도 훌륭합니다.",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",rating:4.8},{name:"기온 거리",type:"문화",desc:"전통 찻집과 료칸이 즐비한 교토 최고의 전통 거리로 운이 좋으면 게이샤를 만날 수 있습니다. 저녁 조명 아래 산책이 낭만적입니다.",img:"https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80",rating:4.7}]},
  "오사카": { description:"오사카는 일본의 부엌이라 불리는 미식의 도시로 타코야키, 오코노미야키 등 서민 음식 문화가 발달했습니다. 유니버설 스튜디오와 도톤보리의 화려한 네온사인으로도 유명합니다.", spots:[{name:"도톤보리",type:"도시",desc:"글리코 달리기 남자 간판으로 유명한 오사카의 심장부로 먹거리 골목이 끝없이 이어집니다. 운하를 따라 형형색색의 간판들이 밤에 더욱 빛납니다.",img:"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80",rating:4.7},{name:"오사카성",type:"역사",desc:"도요토미 히데요시가 1583년에 축성한 일본 최대 규모의 성으로 벚꽃 명소로도 유명합니다. 내부 박물관에서 일본 전국시대 역사를 배울 수 있습니다.",img:"https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80",rating:4.6},{name:"유니버설 스튜디오 재팬",type:"도시",desc:"해리포터, 마리오 등 인기 콘텐츠를 테마로 한 세계적 수준의 테마파크입니다. 슈퍼 닌텐도 월드는 전 세계 게임 팬들의 성지입니다.",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",rating:4.8},{name:"구로몬 시장",type:"음식",desc:"오사카 사람들의 부엌으로 불리는 170년 역사의 전통 시장입니다. 신선한 해산물과 과일, 오사카 특유의 반찬들을 저렴하게 구매할 수 있습니다.",img:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",rating:4.5}]},
  "삿포로": { description:"삿포로는 홋카이도의 중심 도시로 매년 200만 명이 참여하는 눈 축제와 세계 최고 수준의 스키 리조트로 유명합니다. 신선한 해산물과 라멘, 스프카레도 빠질 수 없는 명물입니다.", spots:[{name:"삿포로 눈 축제",type:"문화",desc:"매년 2월 개최되는 세계 최대 규모의 눈 조각 축제로 200만 명 이상이 방문합니다. 오도리 공원에 펼쳐지는 거대한 눈 조각들이 경이롭습니다.",img:"https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=400&q=80",rating:4.9},{name:"오도리 공원",type:"자연",desc:"삿포로 도심을 가로지르는 1.5km의 녹지 공원으로 계절마다 다른 이벤트가 열립니다. 여름 맥주 축제와 겨울 눈 축제의 주요 무대입니다.",img:"https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&q=80",rating:4.5},{name:"니세코 스키장",type:"자연",desc:"세계적으로 유명한 파우더 스노우 스키 리조트로 외국인 스키어들이 특히 많이 찾습니다. 연간 15m가 넘는 적설량으로 최상의 설질을 자랑합니다.",img:"https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=400&q=80",rating:4.8},{name:"삿포로 라멘",type:"음식",desc:"버터 옥수수 미소 라멘이 유명한 삿포로 라멘 공화국에서 홋카이도 최고의 라멘을 맛볼 수 있습니다. 추운 날씨에 뜨끈한 라멘 한 그릇이 최고입니다.",img:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",rating:4.6}]},
  "나라": { description:"나라는 일본 최초의 수도로 1,200년 된 도다이지 대불과 자유롭게 돌아다니는 야생 사슴으로 유명합니다. 하루 코스로 교토, 오사카에서 방문하기 좋은 역사 도시입니다.", spots:[{name:"나라 공원",type:"자연",desc:"1,200마리의 야생 사슴이 자유롭게 돌아다니는 세계 유일의 공원입니다. 사슴 전용 과자 시카센베이를 구입해 직접 먹이를 줄 수 있습니다.",img:"https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80",rating:4.8},{name:"도다이지",type:"역사",desc:"세계 최대의 목조 건물 안에 높이 15m의 거대한 청동 대불이 모셔져 있습니다. 752년에 완공되어 1,200년의 역사를 자랑하는 나라의 상징입니다.",img:"https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80",rating:4.9},{name:"호류지",type:"역사",desc:"607년에 창건된 세계에서 가장 오래된 목조 건물로 유네스코 세계문화유산입니다. 일본 불교 건축의 원형을 간직한 소중한 문화유산입니다.",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",rating:4.7},{name:"가스가타이샤",type:"문화",desc:"768년에 창건된 신사로 경내에 3,000개의 석등롱과 청동 등롱이 늘어서 있습니다. 2월과 8월 만등회 때는 모든 등불이 켜져 환상적인 풍경을 연출합니다.",img:"https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&q=80",rating:4.6}]},

  // 프랑스
  "파리": { description:"빛의 도시 파리는 낭만적인 카페 문화, 세계 최고 수준의 미술관, 미슐랭 레스토랑이 집약된 세계 여행의 수도입니다. 에펠탑 야경과 센강 유람선은 일생에 한 번은 경험해야 할 감동입니다.", spots:[{name:"에펠탑",type:"랜드마크",desc:"1889년 세계박람회를 위해 건설된 높이 330m의 철제 걸작으로 연간 700만 명이 방문합니다. 밤마다 반짝이는 조명 쇼는 파리의 밤을 더욱 빛나게 합니다.",img:"https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80",rating:4.9},{name:"루브르 박물관",type:"문화",desc:"세계 최대 규모의 미술관으로 모나리자, 밀로의 비너스 등 38만 점의 작품을 소장합니다. 전시물을 모두 보려면 100일이 걸린다고 합니다.",img:"https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80",rating:4.8},{name:"베르사유 궁전",type:"역사",desc:"태양왕 루이 14세가 건설한 바로크 양식의 극치로 거울의 방과 800헥타르의 정원이 압도적입니다. 프랑스 절대왕정의 화려함을 직접 체험할 수 있습니다.",img:"https://images.unsplash.com/photo-1584255014406-2a68ea38e48c?w=400&q=80",rating:4.8},{name:"몽마르트르",type:"문화",desc:"피카소, 르누아르 등 인상파 화가들이 활동하던 예술의 언덕으로 사크레쾨르 대성당에서 파리 전경이 한눈에 들어옵니다. 거리 화가들의 초상화도 인기 있습니다.",img:"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80",rating:4.7}]},
  "니스": { description:"니스는 코트다쥐르(에메랄드 해안)의 보석으로 지중해 특유의 온화한 기후와 아름다운 해변으로 유럽 최고의 휴양지로 손꼽힙니다. 앙리 마티스가 사랑한 색채의 도시입니다.", spots:[{name:"프로므나드 데 장글레",type:"자연",desc:"7km에 걸친 해안 산책로로 유럽에서 가장 아름다운 산책길 중 하나입니다. 조약돌 해변과 에메랄드빛 지중해가 완벽한 조화를 이룹니다.",img:"https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=400&q=80",rating:4.7},{name:"니스 구시가지",type:"문화",desc:"이탈리아 풍의 바로크 건축물과 형형색색의 시장이 매력적인 역사 지구입니다. 살레야 꽃 시장에서 프로방스 특산품을 구경하는 재미가 있습니다.",img:"https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80",rating:4.6},{name:"마티스 미술관",type:"문화",desc:"17세기 빌라에 자리한 미술관으로 니스를 사랑한 앙리 마티스의 작품 68점을 소장합니다. 마티스 특유의 강렬한 색채와 단순한 형태를 감상할 수 있습니다.",img:"https://images.unsplash.com/photo-1484399172022-72a90b12e3c1?w=400&q=80",rating:4.5},{name:"에즈 마을",type:"자연",desc:"해발 429m 절벽 위에 세워진 중세 요새 마을로 지중해를 한눈에 내려다볼 수 있습니다. 선인장 정원과 향수 공장 방문도 즐길 수 있습니다.",img:"https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=400&q=80",rating:4.8}]},
  "리옹": { description:"리옹은 프랑스 미식의 수도로 전통 리옹 식당 부숑에서 즐기는 요리는 프랑스 최고라 평가받습니다. 구시가지 전체가 유네스코 세계문화유산이며 비단 직조 문화로도 유명합니다.", spots:[{name:"비외 리옹",type:"역사",desc:"유럽 최대 규모의 르네상스 구시가지로 유네스코 세계문화유산입니다. 트라불이라 불리는 비밀 통로들이 건물들을 미로처럼 연결합니다.",img:"https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80",rating:4.8},{name:"푸르비에르 대성당",type:"랜드마크",desc:"리옹을 내려다보는 언덕 위의 하얀 대성당으로 비잔틴 양식과 로마네스크 양식이 혼합된 독특한 건축물입니다. 전망대에서 알프스까지 보입니다.",img:"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80",rating:4.7},{name:"리옹 미식 투어",type:"음식",desc:"폴 보퀴즈가 탄생시킨 현대 프랑스 요리의 메카로 전통 부숑 레스토랑에서 퀴넬, 리옹식 소시지 등 향토 요리를 맛볼 수 있습니다.",img:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",rating:4.9},{name:"리옹 빛의 축제",type:"문화",desc:"매년 12월 8일 개최되는 세계 최대 규모의 빛 예술 축제로 도시 전체가 화려한 조명 예술 작품으로 변신합니다. 400만 명이 방문합니다.",img:"https://images.unsplash.com/photo-1484399172022-72a90b12e3c1?w=400&q=80",rating:4.9}]},
  "보르도": { description:"보르도는 세계 최고의 와인 산지로 유네스코 세계문화유산에 등재된 와인 수도입니다. 18세기 우아한 고전 건축물과 세계 최대 와인 박물관 라 시테 뒤 뱅이 있습니다.", spots:[{name:"생테밀리옹",type:"역사",desc:"유네스코 세계문화유산으로 지정된 중세 와인 마을로 암반을 파서 만든 지하 교회가 유명합니다. 주변 포도밭에서 세계 최고급 와인이 생산됩니다.",img:"https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=400&q=80",rating:4.8},{name:"라 시테 뒤 뱅",type:"문화",desc:"와인 한 병을 형상화한 독특한 외관의 세계 최대 와인 박물관으로 테이스팅 룸에서 전 세계 와인을 시음할 수 있습니다.",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",rating:4.7},{name:"보르도 구시가지",type:"역사",desc:"강변을 따라 펼쳐진 18세기 신고전주의 건축물들이 아름다운 황금빛 도시를 만들어냅니다. 물의 거울 광장에서 대성당이 반사되는 풍경이 장관입니다.",img:"https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80",rating:4.6},{name:"메독 와이너리 투어",type:"음식",desc:"샤토 마고, 샤토 라피트 등 세계 최고 와이너리들이 밀집한 메독 지역을 투어하며 그랑 크뤼 와인을 시음할 수 있습니다.",img:"https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=400&q=80",rating:4.9}]},

  // 미국
  "뉴욕": { description:"잠들지 않는 도시 뉴욕은 금융, 패션, 예술, 문화의 세계 수도입니다. 타임스스퀘어의 네온사인, 자유의 여신상, 브로드웨이 뮤지컬까지 미국의 꿈이 살아숨쉬는 곳입니다.", spots:[{name:"센트럴파크",type:"자연",desc:"맨해튼 한복판 843에이커의 도심 속 오아시스로 연간 4,200만 명이 방문합니다. 봄 벚꽃, 여름 콘서트, 겨울 스케이팅 등 사계절 내내 활기찬 공간입니다.",img:"https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80",rating:4.8},{name:"자유의 여신상",type:"랜드마크",desc:"1886년 프랑스가 미국에 선물한 높이 93m의 자유와 민주주의의 상징입니다. 페리를 타고 섬에 상륙해 왕관까지 올라가면 뉴욕 항구가 한눈에 들어옵니다.",img:"https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&q=80",rating:4.8},{name:"메트로폴리탄 박물관",type:"문화",desc:"세계 3대 박물관 중 하나로 500만 점의 유물을 소장하며 이집트 사원까지 통째로 전시되어 있습니다. 관람하는 데 며칠이 걸릴 정도로 방대합니다.",img:"https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&q=80",rating:4.9},{name:"브루클린 브릿지",type:"랜드마크",desc:"1883년에 완공된 세계 최초의 강철 현수교로 맨해튼 스카이라인 배경 사진의 필수 장소입니다. 다리 위 산책로를 걸으며 뉴욕 전경을 감상하세요.",img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",rating:4.7}]},
  "로스앤젤레스": { description:"LA는 할리우드 영화 산업의 중심지이자 서핑과 선샤인의 도시입니다. 연중 온화한 기후와 다양한 인종 문화가 어우러진 미국 서부 문화의 아이콘입니다.", spots:[{name:"할리우드 명예의 거리",type:"문화",desc:"영화, 음악, 방송 스타들의 이름이 새겨진 별 2,600개가 5km의 거리를 수놓습니다. 차이니즈 씨어터 앞 유명 배우들의 손발 도장도 꼭 찾아보세요.",img:"https://images.unsplash.com/photo-1580655653885-65763b2597d1?w=400&q=80",rating:4.5},{name:"그리피스 천문대",type:"랜드마크",desc:"헐리우드 사인과 LA 도심을 한눈에 조망할 수 있는 언덕 위의 천문대입니다. 영화 라라랜드의 촬영지로도 유명하며 밤에는 천체 관측도 즐길 수 있습니다.",img:"https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80",rating:4.7},{name:"산타모니카 해변",type:"자연",desc:"전 세계 서퍼들이 동경하는 황금빛 해변으로 산타모니카 피어의 페리스휠이 상징입니다. 자전거를 빌려 베니스 비치까지 라이딩하는 것이 인기 코스입니다.",img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",rating:4.6},{name:"게티 센터",type:"문화",desc:"리처드 마이어가 설계한 현대 건축의 걸작으로 무료 입장이 가능합니다. 인상파, 현대미술 등 세계적 수준의 소장품과 아름다운 조각 정원이 있습니다.",img:"https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&q=80",rating:4.8}]},
  "샌프란시스코": { description:"샌프란시스코는 금문교와 케이블카, 히피 문화의 발상지입니다. 실리콘밸리 혁신 정신과 다양한 이민 문화가 융합된 독특하고 개방적인 도시입니다.", spots:[{name:"금문교",type:"랜드마크",desc:"1937년 완공된 주황빛 현수교로 세계에서 가장 아름다운 다리로 꼽힙니다. 안개가 자욱할 때 안개 위로 솟아오르는 모습이 특히 환상적입니다.",img:"https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&q=80",rating:4.9},{name:"알카트라즈",type:"역사",desc:"샌프란시스코만 섬에 위치한 악명 높은 연방 교도소로 알 카포네가 수감되었던 곳입니다. 페리로 방문해 오디오 가이드를 들으며 생생한 역사를 체험하세요.",img:"https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80",rating:4.7},{name:"피셔맨스 워프",type:"도시",desc:"항구를 따라 해산물 레스토랑, 기념품점, 거리 공연이 가득한 활기찬 관광 명소입니다. 클램 차우더를 빵 그릇에 담아 먹는 것이 이곳의 전통입니다.",img:"https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&q=80",rating:4.5},{name:"차이나타운",type:"문화",desc:"1848년 조성된 북미 최초이자 최대의 차이나타운으로 다채로운 광동식 요리와 전통 중국 상품을 만날 수 있습니다. 농신 퍼레이드와 중국 새해 축제가 유명합니다.",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",rating:4.4}]},
  "라스베이거스": { description:"라스베이거스는 세계 엔터테인먼트의 수도로 화려한 카지노 리조트와 세계 최고 수준의 쇼가 24시간 펼쳐집니다. 사막 한가운데 홀연히 나타나는 불야성의 도시입니다.", spots:[{name:"더 스트립",type:"도시",desc:"7km에 걸쳐 화려한 카지노 리조트들이 늘어선 세계 최고의 유흥가입니다. 벨라지오 분수 쇼, 파리 에펠탑, 뉴욕뉴욕 롤러코스터 등 볼거리가 무궁무진합니다.",img:"https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=400&q=80",rating:4.8},{name:"그랜드 캐니언",type:"자연",desc:"라스베이거스에서 4시간 거리의 세계 최대 협곡으로 자연이 만든 경이입니다. 스카이워크에서 발밑 협곡을 내려다보는 체험은 평생 잊지 못할 경험입니다.",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",rating:4.9},{name:"벨라지오 호텔",type:"랜드마크",desc:"8에이커 인공 호수에서 매 30분마다 음악에 맞춰 물줄기가 200m까지 솟구치는 분수 쇼가 펼쳐집니다. 내부 식물원과 갤러리도 무료로 관람 가능합니다.",img:"https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=400&q=80",rating:4.7},{name:"프리몬트 거리",type:"도시",desc:"4개 블록을 덮는 LED 캐노피에서 밤마다 화려한 빛의 쇼가 펼쳐지는 라스베이거스의 원조 도박 거리입니다. 집라인을 타며 불야성을 감상할 수 있습니다.",img:"https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80",rating:4.6}]},
  "마이애미": { description:"마이애미는 카리브해 문화와 라틴 음악이 살아숨쉬는 플로리다의 보석입니다. 아르데코 건축의 사우스 비치, 에버글레이즈 국립공원, 세계적인 아트 바젤로 유명합니다.", spots:[{name:"사우스 비치",type:"자연",desc:"1930년대 아르데코 건축물들이 즐비한 마이애미의 상징으로 밀리한 파스텔 톤 건물과 백사장이 완벽한 조화를 이룹니다. 오션 드라이브의 야외 카페 문화도 매력적입니다.",img:"https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=400&q=80",rating:4.7},{name:"에버글레이즈 국립공원",type:"자연",desc:"세계 유일의 아열대 습지 생태계로 악어, 플라밍고, 매너티가 서식합니다. 에어보트를 타고 드넓은 습지를 가로지르는 투어가 스릴 넘칩니다.",img:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80",rating:4.8},{name:"리틀 하바나",type:"문화",desc:"쿠바 망명자들이 형성한 독특한 문화 지구로 살사 음악과 쿠바 시가, 모히토가 넘쳐납니다. 카예 오초의 활기찬 거리 문화와 도미노 공원이 인상적입니다.",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",rating:4.5},{name:"윈우드 아트 디스트릭트",type:"문화",desc:"창고 외벽을 캔버스로 활용한 세계 최대의 야외 스트리트 아트 갤러리입니다. 세계 유명 그라피티 작가들의 작품이 매년 업데이트됩니다.",img:"https://images.unsplash.com/photo-1484399172022-72a90b12e3c1?w=400&q=80",rating:4.6}]},
  "시카고": { description:"시카고는 미국 3대 도시로 세계 최고의 건축물과 블루스, 재즈 음악의 발상지입니다. 딥디시 피자와 시카고 핫도그로 대표되는 독특한 음식 문화도 빠질 수 없습니다.", spots:[{name:"밀레니엄 파크",type:"도시",desc:"클라우드 게이트(빈 조각상)가 있는 시카고 대표 공원으로 도심 속 문화 예술 공간입니다. 프랭크 게리가 설계한 야외 공연장에서 무료 콘서트가 열립니다.",img:"https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80",rating:4.8},{name:"시카고 아트 인스티튜트",type:"문화",desc:"미국 최고의 미술관 중 하나로 쇠라의 그랑자트 섬의 일요일 오후, 호퍼의 나이트호크스 등 명작들이 있습니다. 인상파 컬렉션이 특히 유명합니다.",img:"https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&q=80",rating:4.9},{name:"네이비 피어",type:"도시",desc:"미시간 호수로 뻗어나간 1km의 부두로 대관람차, 극장, 레스토랑이 가득합니다. 여름 불꽃놀이와 겨울 아이스링크가 인기입니다.",img:"https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80",rating:4.5},{name:"시카고 건축 투어",type:"문화",desc:"시카고강을 따라 유람선을 타며 마천루 건축의 역사를 배우는 투어입니다. 세계 최초의 마천루가 세워진 도시에서 근현대 건축의 진수를 감상하세요.",img:"https://images.unsplash.com/photo-1484399172022-72a90b12e3c1?w=400&q=80",rating:4.9}]},

  // 태국
  "방콕": { description:"방콕은 화려한 왕궁과 불교 사원, 활기찬 야시장과 세계적인 나이트라이프가 공존하는 동남아시아의 관문 도시입니다. 맛있고 저렴한 길거리 음식 천국이기도 합니다.", spots:[{name:"왓프라깨우",type:"역사",desc:"태국 왕실의 사원으로 에메랄드 불상이 모셔진 방콕 최고의 성지입니다. 황금빛 첨탑과 화려한 모자이크로 장식된 건물들이 경이로운 아름다움을 자랑합니다.",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",rating:4.9},{name:"왓아룬",type:"랜드마크",desc:"새벽 사원으로 불리는 차오프라야 강변의 높이 82m 탑으로 도자기 조각으로 장식되어 있습니다. 일몰 때 황금빛으로 물드는 풍경이 특히 아름답습니다.",img:"https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80",rating:4.8},{name:"카오산 로드",type:"도시",desc:"전 세계 배낭여행자들의 성지로 저렴한 숙소, 태국 음식, 마사지 가게, 나이트클럽이 밀집해 있습니다. 방콕 여행의 시작점이자 만남의 장소입니다.",img:"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80",rating:4.4},{name:"짜뚜짝 주말 시장",type:"음식",desc:"세계 최대 규모의 주말 시장으로 15,000개 이상의 노점에서 의류, 공예품, 음식 등 없는 것이 없습니다. 태국 젊은이들의 쇼핑 명소이자 먹거리 천국입니다.",img:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",rating:4.6}]},
  "치앙마이": { description:"치앙마이는 태국 북부의 문화 수도로 300개가 넘는 불교 사원과 전통 란나 왕국 문화가 살아있습니다. 코끼리 보호구역 방문과 트레킹, 도이수텝 사원이 유명합니다.", spots:[{name:"도이수텝 사원",type:"역사",desc:"해발 1,080m 산 정상에 위치한 황금빛 사원으로 치앙마이 전경이 한눈에 들어옵니다. 306개의 계단을 오르거나 케이블카를 타고 올라갈 수 있습니다.",img:"https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80",rating:4.9},{name:"코끼리 보호구역",type:"자연",desc:"착취 없는 윤리적 방식으로 코끼리를 만날 수 있는 보호구역입니다. 코끼리와 함께 목욕하고 먹이를 주는 체험은 평생 기억에 남을 경험입니다.",img:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80",rating:4.9},{name:"님만해민 거리",type:"도시",desc:"치앙마이의 트렌디한 카페, 레스토랑, 아트 갤러리가 밀집한 힙한 거리입니다. 독립 서점과 디자이너 숍, 분위기 있는 루프탑 바가 인기입니다.",img:"https://images.unsplash.com/photo-1484399172022-72a90b12e3c1?w=400&q=80",rating:4.5},{name:"선데이 나이트 마켓",type:"음식",desc:"매주 일요일 구시가지 주요 도로가 보행자 전용 야시장으로 변신합니다. 전통 공예품과 저렴한 태국 음식, 길거리 공연이 어우러져 활기찹니다.",img:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",rating:4.7}]},
  "푸켓": { description:"푸켓은 태국 최대의 섬으로 에메랄드빛 바다와 하얀 모래사장으로 전 세계 여행자들이 찾는 동남아 최고의 해변 휴양지입니다. 다이빙과 스노클링 명소로도 유명합니다.", spots:[{name:"파통 해변",type:"자연",desc:"푸켓에서 가장 활기찬 해변으로 수상 스포츠, 마사지, 레스토랑이 즐비합니다. 방라 로드의 나이트라이프는 동남아 최고 수준으로 밤새 흥겨운 분위기입니다.",img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",rating:4.5},{name:"빅부다",type:"랜드마크",desc:"해발 45m 언덕 위에 세워진 높이 45m의 순백색 대불로 푸켓 전역에서 보입니다. 아름다운 일몰 전망과 함께 수백 마리의 나비가 노는 정원이 매력적입니다.",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",rating:4.6},{name:"피피 섬",type:"자연",desc:"아오나이 만의 에메랄드빛 바다와 수직 절벽이 어우러진 태국 최고의 섬입니다. 영화 더 비치의 촬영지인 마야 베이는 스노클링 명소로 유명합니다.",img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",rating:4.9},{name:"팡아만",type:"자연",desc:"수직으로 솟아오른 석회암 기둥들이 에메랄드빛 바다에서 솟아오르는 절경입니다. 카약이나 롱테일 보트를 타고 동굴과 숨겨진 해변을 탐험할 수 있습니다.",img:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80",rating:4.8}]},
  "파타야": { description:"파타야는 방콕에서 2시간 거리의 해변 도시로 활기찬 비치 로드와 다양한 수상 스포츠, 화려한 나이트라이프로 유명합니다. 산호섬과 투명한 바다도 매력적입니다.", spots:[{name:"코란 섬",type:"자연",desc:"파타야 앞바다의 산호섬으로 에메랄드빛 투명한 바다에서 스노클링과 다이빙을 즐길 수 있습니다. 페리로 30분이면 접근 가능한 당일치기 코스입니다.",img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",rating:4.6},{name:"눙누이 트로피컬 가든",type:"자연",desc:"열대 식물원과 코끼리 쇼, 악어 쇼, 민속 공연이 펼쳐지는 복합 엔터테인먼트 공원입니다. 태국 전통 문화를 한 곳에서 체험할 수 있어 가족 여행에 인기입니다.",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",rating:4.3},{name:"워킹 스트리트",type:"도시",desc:"파타야의 대표적인 유흥가로 수백 개의 바, 클럽, 레스토랑이 밤새 불야성을 이룹니다. 화려한 트랜스젠더 쇼 알카자르와 티파니스도 유명합니다.",img:"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80",rating:4.2},{name:"산타나파크",type:"자연",desc:"번지점프, 집라인, ATV 등 다양한 익스트림 스포츠를 즐길 수 있는 복합 레저 공원입니다. 아드레날린을 원하는 여행자들에게 최고의 코스입니다.",img:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80",rating:4.4}]},

  // 이탈리아
  "로마": { description:"영원의 도시 로마는 2,700년의 역사를 가진 서양 문명의 발상지입니다. 콜로세움, 바티칸, 트레비 분수 등 고대 유적이 현대 도시와 공존하는 야외 박물관입니다.", spots:[{name:"콜로세움",type:"역사",desc:"72년에 건설된 수용 인원 7만 명의 원형 경기장으로 검투사 경기가 열렸던 로마 제국의 상징입니다. 2,000년이 지난 지금도 완벽한 구조를 유지하고 있습니다.",img:"https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80",rating:4.9},{name:"바티칸 시국",type:"역사",desc:"세계 최소 독립 국가로 성베드로 대성당과 시스티나 예배당의 미켈란젤로 천지창조를 볼 수 있습니다. 바티칸 박물관의 수장품은 인류 최고의 예술 유산입니다.",img:"https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400&q=80",rating:4.9},{name:"트레비 분수",type:"랜드마크",desc:"1762년 완성된 높이 26m의 바로크 양식 분수로 동전을 던지면 로마에 다시 온다는 전설이 있습니다. 연간 100만 유로의 동전이 수거되어 자선단체에 기부됩니다.",img:"https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80",rating:4.7},{name:"판테온",type:"역사",desc:"기원전 27년에 건설된 완벽한 구형 돔의 신전으로 2,000년이 지난 지금도 보수 없이 원형을 유지합니다. 돔 꼭대기의 구멍 오쿨루스로 빛이 들어오는 모습이 신비롭습니다.",img:"https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400&q=80",rating:4.8}]},
  "베네치아": { description:"베네치아는 118개의 섬과 177개의 운하로 이루어진 세계 유일의 수상 도시입니다. 곤돌라와 수상 버스가 자동차를 대신하며, 도시 전체가 유네스코 세계문화유산입니다.", spots:[{name:"산마르코 광장",type:"랜드마크",desc:"나폴레옹이 유럽의 거실이라 부른 세계 최고의 광장으로 산마르코 대성당의 황금 모자이크가 압도적입니다. 종탑에 올라가면 아드리아해가 한눈에 보입니다.",img:"https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=400&q=80",rating:4.9},{name:"곤돌라 투어",type:"도시",desc:"수백 년 전통의 베네치아 목선으로 좁은 운하를 누비며 숨겨진 베네치아를 발견할 수 있습니다. 뱃사공의 세레나데와 함께하는 낭만적인 경험은 베네치아에서만 가능합니다.",img:"https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=400&q=80",rating:4.7},{name:"부라노 섬",type:"자연",desc:"알록달록한 색으로 칠해진 어부들의 집이 운하를 따라 늘어선 동화 같은 섬입니다. 레이스 공예와 리조토 디 고세 등 전통 요리도 유명합니다.",img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",rating:4.8},{name:"리알토 다리",type:"역사",desc:"1591년 완공된 대운하의 상징으로 베네치아에서 가장 오래된 다리입니다. 다리 위 양쪽에 늘어선 보석 상점과 기념품 가게들이 분위기를 더합니다.",img:"https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400&q=80",rating:4.6}]},
  "피렌체": { description:"피렌체는 르네상스의 발상지로 미켈란젤로, 레오나르도 다빈치, 단테의 도시입니다. 세계 최고의 미술관 우피치와 두오모 대성당이 있으며 토스카나 와인과 비스테카도 유명합니다.", spots:[{name:"우피치 미술관",type:"문화",desc:"세계 최대의 르네상스 미술 컬렉션으로 보티첼리의 비너스의 탄생, 레오나르도의 수태고지 등 인류 최고의 명작들이 있습니다. 사전 예약이 필수입니다.",img:"https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&q=80",rating:4.9},{name:"두오모 대성당",type:"랜드마크",desc:"브루넬레스키가 설계한 높이 114m의 돔은 르네상스 건축의 기적으로 꼽힙니다. 463개의 계단을 올라 꼭대기에서 내려다보는 피렌체 전경이 압도적입니다.",img:"https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&q=80",rating:4.8},{name:"미켈란젤로 광장",type:"랜드마크",desc:"언덕 위에서 아르노강과 피렌체 구시가지를 완벽하게 내려다볼 수 있는 전망 명소입니다. 일몰 무렵 황금빛으로 물드는 피렌체 스카이라인이 일품입니다.",img:"https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80",rating:4.8},{name:"베키오 다리",type:"역사",desc:"1345년 아르노강에 건설된 다리로 위에 금은방과 보석 상점들이 늘어서 있는 세계 유일의 상업 다리입니다. 메디치 가문의 비밀 통로 바사리 복도가 다리 위를 지납니다.",img:"https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400&q=80",rating:4.7}]},
  "밀라노": { description:"밀라노는 세계 패션과 디자인의 수도로 베르사체, 아르마니, 프라다의 본고장입니다. 레오나르도 다빈치의 최후의 만찬과 두오모 대성당이 있으며 세리에A 두 팀의 연고지이기도 합니다.", spots:[{name:"밀라노 두오모",type:"랜드마크",desc:"600년에 걸쳐 완성된 고딕 양식의 대성당으로 3,400개의 조각상이 장식되어 있습니다. 옥상 테라스에서 알프스까지 조망할 수 있으며 밀라노 최고의 전망대입니다.",img:"https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&q=80",rating:4.9},{name:"최후의 만찬",type:"문화",desc:"1498년 레오나르도 다빈치가 완성한 인류 최고의 벽화로 산타마리아 델레 그라치에 수도원에 있습니다. 시간당 25명만 입장 가능하여 수개월 전 예약이 필수입니다.",img:"https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&q=80",rating:4.9},{name:"갈레리아 비토리오 에마누엘레 2세",type:"도시",desc:"1877년 완성된 유럽 최초의 쇼핑 아케이드로 화려한 철골 유리 천장이 인상적입니다. 구찌, 프라다 등 최고급 명품 매장들이 입점해 있는 밀라노의 심장입니다.",img:"https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80",rating:4.7},{name:"브레라 미술관",type:"문화",desc:"북이탈리아 최고의 회화 컬렉션으로 라파엘로, 카라바조 등 거장들의 작품이 있습니다. 미술관 주변 브레라 지구는 갤러리, 카페, 서점이 밀집한 보헤미안 동네입니다.",img:"https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&q=80",rating:4.7}]},
  "나폴리": { description:"나폴리는 피자의 발상지이자 베수비오 화산과 폼페이 유적의 관문 도시입니다. 유네스코 창의 도시로 지정된 피자 나폴레타나와 진정한 이탈리아 남부 문화를 경험할 수 있습니다.", spots:[{name:"폼페이 유적",type:"역사",desc:"79년 베수비오 화산 폭발로 순식간에 매몰된 로마 시대 도시가 그대로 발굴되었습니다. 당시 생활상이 그대로 보존되어 2,000년 전 로마인의 삶을 생생하게 볼 수 있습니다.",img:"https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80",rating:4.9},{name:"베수비오 화산",type:"자연",desc:"79년 폼페이를 멸망시킨 활화산으로 정상 분화구까지 트레킹이 가능합니다. 정상에서 나폴리만과 카프리 섬이 한눈에 보이는 전망이 장관입니다.",img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",rating:4.7},{name:"나폴리 피자",type:"음식",desc:"유네스코 무형문화유산으로 지정된 진정한 피자 나폴레타나의 발상지입니다. L'Antica Pizzeria da Michele에서 마르게리타 피자 한 조각은 죽기 전에 꼭 먹어야 할 음식입니다.",img:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",rating:4.9},{name:"카프리 섬",type:"자연",desc:"나폴리에서 페리로 1시간의 귀족 휴양지로 푸른 그로타 아즈라(블루 그로토)가 유명합니다. 비아 카마렠레 상점가와 절벽 위 전망대에서 바라보는 경치가 압도적입니다.",img:"https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=400&q=80",rating:4.8}]},

  // 영국
  "런던": { description:"런던은 영국의 수도이자 세계 금융, 문화, 패션의 중심지입니다. 버킹엄 궁전, 빅벤, 대영 박물관 등 역사적 명소와 쇼디치, 노팅힐 같은 트렌디한 동네가 공존합니다.", spots:[{name:"대영 박물관",type:"문화",desc:"1753년 개관한 세계 최초의 공립 박물관으로 이집트 미라, 로제타스톤, 파르테논 조각 등 800만 점을 소장합니다. 영국 제국주의의 흔적이 담긴 인류 문명의 보고입니다.",img:"https://images.unsplash.com/photo-1560086951-58f95f58d2e0?w=400&q=80",rating:4.9},{name:"타워 오브 런던",type:"역사",desc:"1078년 윌리엄 정복왕이 세운 요새로 영국 왕실 보물과 역대 왕비들의 처형 장소로 유명합니다. 9개의 코히누르 다이아몬드를 포함한 왕관 보석들을 직접 볼 수 있습니다.",img:"https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80",rating:4.7},{name:"버킹엄 궁전",type:"랜드마크",desc:"영국 왕실의 공식 관저로 근위병 교대식이 매일 열립니다. 여름철 왕실 개방 시 국빈 접견실과 왕실 정원을 직접 방문할 수 있습니다.",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",rating:4.6},{name:"코번트 가든",type:"도시",desc:"17세기부터 시작된 광장 시장이 현재는 세계 최고의 거리 공연과 부티크 숍, 미슐랭 레스토랑이 모인 문화 복합 공간으로 변신했습니다. 오페라 하우스와도 인접합니다.",img:"https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&q=80",rating:4.5}]},
  "에든버러": { description:"에든버러는 스코틀랜드의 수도로 중세 성과 빅토리아 시대 건축물이 완벽하게 보존된 유네스코 세계문화유산 도시입니다. 세계 최대 아트 페스티벌과 위스키 문화의 중심지입니다.", spots:[{name:"에든버러 성",type:"역사",desc:"해발 130m 화산암 위에 세워진 철옹성으로 스코틀랜드의 왕관 보석과 오래된 대포가 있습니다. 매일 정오에 울리는 대포 소리가 에든버러의 시간을 알려줍니다.",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",rating:4.8},{name:"로열 마일",type:"도시",desc:"에든버러 성과 홀리루드 궁전을 잇는 1.6km의 구시가지 메인 스트리트로 위스키 바, 기념품점, 전통 레스토랑이 즐비합니다. 8월 에든버러 페스티벌의 중심 무대입니다.",img:"https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80",rating:4.6},{name:"스카치 위스키 익스피리언스",type:"문화",desc:"스코틀랜드 위스키의 역사와 제조 과정을 배우고 다양한 몰트 위스키를 시음할 수 있는 체험 센터입니다. 스카치위스키를 처음 접하는 초보자에게도 친절합니다.",img:"https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=400&q=80",rating:4.5},{name:"아서스 시트",type:"자연",desc:"도심 한가운데 솟아오른 해발 251m의 사화산으로 에든버러 전경을 360도로 감상할 수 있습니다. 45분이면 정상에 오를 수 있는 도심 속 자연 하이킹 코스입니다.",img:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80",rating:4.7}]},

  // 이집트
  "카이로": { description:"카이로는 5,000년 문명의 중심지로 피라미드와 스핑크스가 있는 인류 문명의 보고입니다. 이슬람 카이로의 골목과 향신료 시장, 나일강 크루즈가 이국적인 매력을 더합니다.", spots:[{name:"기자의 피라미드",type:"역사",desc:"4,500년 전 건설된 세계 7대 불가사의 중 유일하게 현존하는 대피라미드로 쿠푸왕 피라미드는 높이가 138m에 달합니다. 인류가 만든 가장 경이로운 건축물입니다.",img:"https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&q=80",rating:5.0},{name:"이집트 박물관",type:"문화",desc:"12만 점의 이집트 유물을 소장한 세계 최고의 이집트학 박물관입니다. 투탕카멘의 황금 마스크와 미라실은 반드시 봐야 할 인류의 유산입니다.",img:"https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&q=80",rating:4.8},{name:"이슬람 카이로",type:"문화",desc:"유네스코 세계문화유산인 이슬람 역사 지구로 천 개의 첨탑을 가진 도시라 불립니다. 칸 엘 칼릴리 바자르에서 향신료, 직물, 전통 공예품을 구경하는 재미가 있습니다.",img:"https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&q=80",rating:4.6},{name:"나일강 크루즈",type:"자연",desc:"인류 문명의 젖줄인 나일강을 따라 유람선을 타며 카이로의 아름다운 야경을 감상합니다. 전통 파루카 돛배를 타고 석양을 바라보는 경험은 카이로 여행의 하이라이트입니다.",img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",rating:4.7}]},
  "룩소르": { description:"룩소르는 고대 이집트 수도 테베로 왕들의 계곡, 카르낙 신전 등 파라오 시대 최대 유적들이 집중된 세계 최대의 야외 박물관입니다. 룩소르 신전 야경은 압도적입니다.", spots:[{name:"왕들의 계곡",type:"역사",desc:"투탕카멘을 포함한 63기의 파라오 왕묘가 발굴된 나일 서안의 바위 계곡입니다. 3,000년 전 벽화가 생생하게 남아있어 고대 이집트인의 내세관을 엿볼 수 있습니다.",img:"https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&q=80",rating:4.9},{name:"카르낙 신전",type:"역사",desc:"2,000년에 걸쳐 축조된 세계 최대의 신전 단지로 134개의 거대 기둥이 늘어선 열주 홀이 압도적입니다. 매일 저녁 사운드 앤 라이트 쇼가 신비로운 분위기를 연출합니다.",img:"https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&q=80",rating:4.8},{name:"룩소르 신전",type:"역사",desc:"기원전 1400년에 건설된 나일강변의 신전으로 밤에 조명을 받아 황금빛으로 빛나는 야경이 특히 아름답습니다. 신전 앞 스핑크스 길이 인상적입니다.",img:"https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&q=80",rating:4.7},{name:"열기구 투어",type:"자연",desc:"이른 새벽 나일강 상공을 날며 룩소르 신전과 파라오 무덤들을 하늘에서 내려다보는 세계 최고의 열기구 투어입니다. 황금빛 사막 위의 일출이 환상적입니다.",img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",rating:4.9}]},

  // 스페인
  "바르셀로나": { description:"바르셀로나는 천재 건축가 가우디의 도시로 사그라다 파밀리아, 구엘 공원 등 독창적 건축물이 도시를 수놓습니다. 카탈루냐 독립 문화와 지중해 라이프스타일이 매력적입니다.", spots:[{name:"사그라다 파밀리아",type:"랜드마크",desc:"1882년 시작되어 아직도 건설 중인 가우디의 걸작 성당으로 완공되면 세계 최고 높이 교회가 됩니다. 내부 스테인드글라스로 들어오는 빛의 향연이 경이롭습니다.",img:"https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=400&q=80",rating:4.9},{name:"구엘 공원",type:"문화",desc:"가우디가 설계한 동화 속 세계를 구현한 공원으로 모자이크 도마뱀 분수와 파도 모양 벤치가 유명합니다. 공원 언덕에서 바라보는 바르셀로나 전경이 아름답습니다.",img:"https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=400&q=80",rating:4.7},{name:"람블라스 거리",type:"도시",desc:"바르셀로나 구시가지를 관통하는 1.2km의 유명 산책로로 꽃 상점, 거리 공연가, 카페가 늘어서 있습니다. 보케리아 시장에서 신선한 과일과 타파스를 맛볼 수 있습니다.",img:"https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80",rating:4.5},{name:"바르셀로네타 해변",type:"자연",desc:"도심에서 걸어서 10분 거리의 지중해 해변으로 여름이면 수백만 명이 찾는 바르셀로나 최고의 휴식 공간입니다. 해변 바에서 상그리아와 파에야를 즐기세요.",img:"https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=400&q=80",rating:4.6}]},
  "마드리드": { description:"마드리드는 스페인의 수도로 세계 3대 미술관 중 하나인 프라도 미술관과 활기찬 타파스 바 문화가 유명합니다. 유럽에서 가장 활발한 나이트라이프를 자랑합니다.", spots:[{name:"프라도 미술관",type:"문화",desc:"벨라스케스, 고야, 엘 그레코 등 스페인 거장들의 작품 8,000점을 소장한 세계 3대 미술관입니다. 고야의 나체의 마하와 벨라스케스의 시녀들은 반드시 봐야 합니다.",img:"https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80",rating:4.9},{name:"레티로 공원",type:"자연",desc:"마드리드 도심의 125헥타르 공원으로 수정궁과 인공 호수가 있습니다. 주말이면 가족, 연인, 거리 공연가들로 넘쳐나는 마드리드 시민들의 사랑받는 휴식처입니다.",img:"https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&q=80",rating:4.6},{name:"솔 광장",type:"도시",desc:"스페인의 심장으로 불리는 마드리드 중심 광장으로 자정 포도 12알로 새해를 맞이하는 전통으로 유명합니다. 주변 타파스 바 투어의 시작점입니다.",img:"https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80",rating:4.5},{name:"산 미겔 시장",type:"음식",desc:"19세기 철제 건물 안에 위치한 마드리드 최고의 미식 시장으로 타파스, 이베리코 햄, 스페인 와인 등 최고급 식재료를 맛볼 수 있습니다.",img:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",rating:4.7}]},

  // 호주
  "시드니": { description:"호주 최대 도시 시드니는 세계에서 가장 아름다운 항구 도시입니다. 오페라 하우스와 하버 브릿지가 어우러진 항구 경관과 본다이 비치의 서핑 문화가 시드니를 특별하게 만듭니다.", spots:[{name:"시드니 오페라 하우스",type:"랜드마크",desc:"덴마크 건축가 요른 우촌이 설계한 20세기 최고의 건축물로 유네스코 세계문화유산입니다. 하버브릿지와 함께하는 야경은 세계에서 가장 아름다운 도시 풍경 중 하나입니다.",img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",rating:5.0},{name:"본다이 비치",type:"자연",desc:"세계적으로 유명한 서핑 명소로 연간 200만 명이 찾는 시드니의 상징적인 해변입니다. 해변 절벽을 따르는 본다이-쿠기 코스탈 워크도 인기 있습니다.",img:"https://images.unsplash.com/photo-1523428461295-92770e70d7ae?w=400&q=80",rating:4.8},{name:"하버 브릿지",type:"랜드마크",desc:"1932년 완공된 세계 최대의 강철 아치교로 다리 꼭대기까지 올라가는 브릿지 클라임 투어가 인기입니다. 정상에서 바라보는 시드니 항구의 360도 전망이 압도적입니다.",img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",rating:4.9},{name:"더 록스",type:"역사",desc:"1788년 영국 죄수들이 최초로 상륙한 시드니 발상지로 돌길과 콜로니얼 건축물이 남아있습니다. 주말 마켓과 해산물 레스토랑, 펍이 활기찬 문화 지구입니다.",img:"https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?w=400&q=80",rating:4.5}]},
  "멜버른": { description:"멜버른은 호주의 문화 수도로 세계 살기 좋은 도시 1위에 여러 번 선정된 세련된 도시입니다. 커피 문화, 스트리트 아트, 스포츠 열기로 유명하며 그레이트 오션 로드의 관문 도시입니다.", spots:[{name:"그레이트 오션 로드",type:"자연",desc:"멜버른에서 서쪽으로 이어지는 250km의 해안 드라이브 코스로 12사도 기암괴석이 하이라이트입니다. 험준한 절벽과 에메랄드빛 바다가 어우러진 세계 최고의 드라이브 코스입니다.",img:"https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80",rating:4.9},{name:"왕립 전시관",type:"역사",desc:"1880년 건설된 유네스코 세계문화유산으로 호주 최초 의회가 열린 역사적 건물입니다. 카를톤 가든 안에 위치하며 현재도 전시장으로 활발히 사용됩니다.",img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",rating:4.6},{name:"야라 밸리 와이너리",type:"음식",desc:"멜버른 근교의 야라밸리는 피노누아와 샤르도네로 유명한 호주 최고의 와인 산지입니다. 풍경 좋은 와이너리에서 테이스팅과 런치를 즐기는 투어가 인기입니다.",img:"https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=400&q=80",rating:4.7},{name:"페더레이션 스퀘어",type:"도시",desc:"멜버른의 문화적 심장으로 독특한 기하학적 디자인의 광장 주변에 주립 미술관, 영화관, 레스토랑이 모여있습니다. 매년 주요 이벤트와 축제의 중심 무대입니다.",img:"https://images.unsplash.com/photo-1484399172022-72a90b12e3c1?w=400&q=80",rating:4.5}]},

  // 두바이
  "두바이": { description:"두바이는 50년 만에 사막에서 세계 최고 수준의 도시로 성장한 기적의 도시입니다. 세계 최고층 빌딩, 세계 최대 쇼핑몰, 인공 섬 등 불가능을 가능하게 만드는 도시입니다.", spots:[{name:"부르즈 칼리파",type:"랜드마크",desc:"높이 828m, 163층의 세계 최고층 빌딩으로 124층 전망대에서 바라보는 두바이 전경이 압도적입니다. 인근 두바이 분수 쇼는 세계 최대 규모로 매일 저녁 펼쳐집니다.",img:"https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80",rating:4.9},{name:"팜 주메이라",type:"도시",desc:"세계 최대 인공 섬으로 위성에서도 보이는 야자수 모양의 섬입니다. 아틀란티스 호텔과 수상 빌라들이 가득하며 모노레일을 타고 섬 전체를 둘러볼 수 있습니다.",img:"https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80",rating:4.7},{name:"두바이 사막 사파리",type:"자연",desc:"황금빛 사막에서 모래 언덕 질주, 낙타 타기, 매 사냥, 전통 베두인 캠프 만찬을 즐기는 패키지 투어입니다. 사막에서 바라보는 별빛이 특히 아름답습니다.",img:"https://images.unsplash.com/photo-1509116-2f2b21c14dc5?w=400&q=80",rating:4.8},{name:"두바이 구시가지",type:"문화",desc:"전통 목선 다우가 오가는 두바이 크릭을 중심으로 향신료 수크와 황금 수크가 펼쳐집니다. 수 십 킬로그램의 금 장신구를 진열한 황금 시장 규모가 세계 최대입니다.",img:"https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=400&q=80",rating:4.6}]},

  // 인도
  "뭄바이": { description:"뭄바이는 인도 경제의 수도이자 볼리우드 영화 산업의 중심지입니다. 식민지 시대 빅토리아 건축물과 현대 마천루가 공존하며 다양한 종교와 문화가 어우러진 역동적인 도시입니다.", spots:[{name:"인도의 문",type:"랜드마크",desc:"1924년 영국 왕 조지 5세 방문을 기념해 건설된 26m 높이의 현무암 개선문으로 뭄바이의 상징입니다. 아라비아해를 바라보며 엘리펀타 섬으로 가는 페리도 탈 수 있습니다.",img:"https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&q=80",rating:4.7},{name:"다라비 슬럼",type:"문화",desc:"영화 슬럼독 밀리어네어 배경지로 100만 명이 거주하는 아시아 최대 슬럼입니다. 가이드 투어를 통해 가죽, 도자기, 재활용 산업이 활발한 주민들의 삶을 엿볼 수 있습니다.",img:"https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&q=80",rating:4.3},{name:"엘리펀타 섬",type:"역사",desc:"아라비아해 섬에 위치한 5~8세기의 힌두교와 불교 석굴 사원으로 시바신의 거대한 삼면상이 유명합니다. 유네스코 세계문화유산으로 지정된 인도 최고의 석굴 유적입니다.",img:"https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=400&q=80",rating:4.6},{name:"마린 드라이브",type:"자연",desc:"아라비아해 연안을 따르는 3km의 반원형 해안 산책로로 저녁이면 네온 조명이 목걸이처럼 빛나 여왕의 목걸이라 불립니다. 뭄바이 최고의 선셋 명소입니다.",img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",rating:4.5}]},
  "뉴델리": { description:"뉴델리는 인도의 수도로 무굴 제국의 유산과 영국 식민지 건축이 공존합니다. 레드포트, 꾸뜹 미나르 등 유네스코 세계문화유산과 맛있는 북인도 요리로 유명합니다.", spots:[{name:"레드포트",type:"역사",desc:"1639년 무굴 황제 샤자한이 건설한 붉은 사암 요새로 독립기념일 연설이 행해지는 인도의 상징적 장소입니다. 황제의 궁전과 진주 모스크 등 무굴 건축의 정수를 볼 수 있습니다.",img:"https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=400&q=80",rating:4.7},{name:"꾸뜹 미나르",type:"역사",desc:"1193년 인도 최초의 술탄이 세운 높이 73m의 이슬람식 첨탑으로 인도 최고(最古)의 모스크가 인접해 있습니다. 유네스코 세계문화유산으로 지정된 인도-이슬람 건축의 걸작입니다.",img:"https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&q=80",rating:4.7},{name:"인디아 게이트",type:"랜드마크",desc:"1차 세계대전에서 전사한 8만 4천 인도 병사를 기리는 42m 높이의 전쟁 기념문입니다. 저녁 조명이 켜지면 특히 아름다우며 주변 공원이 델리 시민의 휴식처입니다.",img:"https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&q=80",rating:4.6},{name:"찬드니 촉",type:"음식",desc:"17세기 무굴 황제가 설계한 델리 최대의 전통 시장으로 향신료, 직물, 금은방이 미로처럼 얽혀있습니다. 파란타 왈리 갈리의 전통 파라타와 카림스의 무굴식 요리가 유명합니다.",img:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",rating:4.5}]},
  "아그라": { description:"아그라는 세계 7대 불가사의 중 하나인 타지마할이 있는 도시입니다. 무굴 제국의 황제들이 남긴 건축 유산들이 집중된 세계 최고의 역사 관광지입니다.", spots:[{name:"타지마할",type:"역사",desc:"샤자한 황제가 왕비를 위해 지은 순백의 대리석 영묘로 세계에서 가장 아름다운 건물입니다. 일출에 황금빛으로, 보름달 밤에 은빛으로 변하는 모습이 환상적입니다.",img:"https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=400&q=80",rating:5.0},{name:"아그라 포트",type:"역사",desc:"아크바르 황제가 건설한 붉은 사암 요새로 유네스코 세계문화유산입니다. 무굴 황제들의 거처로 사용된 화려한 궁전과 모스크들이 보존되어 있습니다.",img:"https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&q=80",rating:4.7},{name:"파테푸르 시크리",type:"역사",desc:"아크바르 황제가 건설한 무굴 제국의 버려진 수도로 유네스코 세계문화유산입니다. 붉은 사암으로 지어진 완벽히 보존된 궁전 단지가 역사의 신비를 간직하고 있습니다.",img:"https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=400&q=80",rating:4.6},{name:"메타브 바그",type:"자연",desc:"야무나강 건너편에서 타지마할의 전경을 가장 완벽하게 감상할 수 있는 무굴 정원입니다. 해 질 녘 노을과 함께 붉게 물드는 타지마할의 실루엣이 가장 아름다운 뷰포인트입니다.",img:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80",rating:4.8}]},
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
      const coords = cities.map(city => {
        const sc = globeRef.current.getScreenCoords(city.lat, city.lng, 0.02)
        return { ...city, sx: sc?.x, sy: sc?.y, visible: sc != null }
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
      if (span < 3)  return 0.25   // 싱가포르, 소국
      if (span < 8)  return 0.35   // 한국, 그리스
      if (span < 15) return 0.5    // 일본, 영국, 독일
      if (span < 25) return 0.65   // 프랑스, 스페인, 이탈리아
      if (span < 40) return 0.85   // 인도, 멕시코
      if (span < 60) return 1.1    // 호주, 브라질
      if (span < 100) return 1.5   // 미국
      return 2.0                   // 러시아, 캐나다
    } catch { return 0.8 }
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

  // 즉시 보여줄 기본 데이터 생성 (절대 크래시 없음)
  const makeInstantData = (city) => ({
    weather: { temp: '—', condition: '불러오는 중...', icon: '🌤️', humidity: '—' },
    description: `${city.name}의 관광 정보를 불러오고 있습니다...`,
    spots: [
      { name: '정보 로딩 중', type:'랜드마크', desc:'잠시만 기다려주세요. AI가 최신 관광 정보를 검색하고 있습니다.', img:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80', rating:0 },
      { name: '정보 로딩 중', type:'문화', desc:'잠시만 기다려주세요.', img:'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&q=80', rating:0 },
      { name: '정보 로딩 중', type:'자연', desc:'잠시만 기다려주세요.', img:'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80', rating:0 },
      { name: '정보 로딩 중', type:'음식', desc:'잠시만 기다려주세요.', img:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80', rating:0 },
    ]
  })

  const fetchCityData = async (city) => {
    try {
      // 1단계: 사전 데이터 있으면 즉시 표시
      if (CITY_DATA[city.name]) {
        const base = { ...CITY_DATA[city.name] }
        // weather 없으면 기본값 추가
        if (!base.weather) base.weather = { temp: '—', condition: '날씨 로딩 중', icon: '🌤️', humidity: '—' }
        setCityData(base)
        setLoading(false)
        // 날씨만 백그라운드로 업데이트
        fetchWeather(city.lat, city.lng).then(w => {
          if (w) setCityData(prev => prev ? { ...prev, weather: w } : prev)
        }).catch(() => {})
        return
      }

      // 2단계: 사전 데이터 없으면 즉시 로딩 화면 표시
      setLoading(true)
      setCityData(makeInstantData(city))

      // 3단계: AI + 날씨 병렬로 백그라운드 로딩
      const [aiResult, weatherResult] = await Promise.allSettled([
        fetchAIWithSearch(city),
        fetchWeather(city.lat, city.lng)
      ])

      const weather = (weatherResult.status === 'fulfilled' && weatherResult.value)
        ? weatherResult.value
        : { temp: 22, condition: '맑음', icon: '☀️', humidity: 55 }

      if (aiResult.status === 'fulfilled' && aiResult.value?.spots?.length >= 2) {
        setCityData({ ...aiResult.value, weather })
      } else {
        // AI 실패해도 도시별 기본 데이터로 대체 (절대 흰 화면 없음)
        setCityData({
          weather,
          description: `${city.name}은(는) 풍부한 역사와 문화, 아름다운 자연을 간직한 매력적인 여행지입니다.`,
          spots: [
            { name:`${city.name} 역사 지구`, type:'역사', desc:`${city.name}의 오랜 역사가 살아 숨쉬는 구시가지로 전통 건축물과 문화재가 가득합니다. 골목골목마다 이 도시만의 이야기가 담겨 있습니다.`, img:'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&q=80', rating:4.5 },
            { name:`${city.name} 국립 박물관`, type:'문화', desc:`${city.name}과 이 지역의 역사, 예술, 문화를 집대성한 박물관입니다. 지역 문명의 정수를 한자리에서 만날 수 있습니다.`, img:'https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=400&q=80', rating:4.4 },
            { name:`${city.name} 자연 공원`, type:'자연', desc:`도시 근교의 아름다운 자연 공원으로 현지인들이 즐겨 찾는 휴식 공간입니다. 계절마다 다른 풍경을 선사합니다.`, img:'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80', rating:4.3 },
            { name:`${city.name} 전통 시장`, type:'음식', desc:`현지 특산물과 전통 음식이 가득한 활기찬 재래시장입니다. 이 도시만의 독특한 식문화를 경험할 수 있습니다.`, img:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80', rating:4.4 },
          ]
        })
      }
    } catch(e) {
      console.error('fetchCityData error:', e)
      // 최후의 보루 - 절대 크래시 없이 기본 데이터 표시
      setCityData({
        weather: { temp: 22, condition: '맑음', icon: '☀️', humidity: 55 },
        description: `${city.name}은(는) 매력적인 여행지입니다.`,
        spots: [
          { name:`${city.name} 대표 명소`, type:'랜드마크', desc:'이 도시의 대표적인 관광 명소입니다.', img:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80', rating:4.5 },
          { name:`${city.name} 문화 센터`, type:'문화', desc:'지역 문화와 예술을 즐길 수 있는 공간입니다.', img:'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&q=80', rating:4.3 },
          { name:`${city.name} 자연 명소`, type:'자연', desc:'아름다운 자연 풍경을 감상할 수 있는 곳입니다.', img:'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80', rating:4.4 },
          { name:`${city.name} 맛집 거리`, type:'음식', desc:'현지 음식과 문화를 동시에 즐길 수 있는 거리입니다.', img:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80', rating:4.2 },
        ]
      })
    } finally {
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

  // Gemini AI로 도시별 실제 관광 정보 생성
  const fetchAIWithSearch = async (city) => {
    const countryKoName = COUNTRY_KO[city.countryEn] || city.countryEn || ''
    const cityName = city.name || ''
    if (!cityName) return null
    try {
      const prompt = `${countryKoName} ${cityName}의 실제 유명 관광지 4곳을 JSON으로만 반환. 설명 없이 JSON만:
{"description":"${cityName}의 특징 2문장","spots":[{"name":"실제관광지명","type":"문화","desc":"설명 2문장","img":"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80","rating":4.5,"openTime":"09:00~18:00","price":"무료"},{"name":"실제관광지명2","type":"자연","desc":"설명 2문장","img":"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80","rating":4.7,"openTime":"24시간","price":"무료"},{"name":"실제관광지명3","type":"역사","desc":"설명 2문장","img":"https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&q=80","rating":4.3,"openTime":"09:00~17:00","price":"성인 10,000원"},{"name":"실제관광지명4","type":"랜드마크","desc":"설명 2문장","img":"https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80","rating":4.6,"openTime":"10:00~21:00","price":"무료"}]}
${cityName}에 실제 존재하는 관광지명으로 채울것. type은 문화/자연/랜드마크/도시/역사/음식 중 하나.`

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      if (!res.ok) return null
      const data = await res.json()
      if (!data.text) return null

      // JSON 파싱 - 여러 방법 시도
      let txt = data.text.replace(/```json|```/g, '').trim()
      // 첫 { 부터 마지막 } 까지 추출
      const start = txt.indexOf('{')
      const end = txt.lastIndexOf('}')
      if (start === -1 || end === -1) return null
      const jsonStr = txt.slice(start, end + 1)
      const parsed = JSON.parse(jsonStr)
      if (!parsed.spots || parsed.spots.length < 2) return null
      return parsed
    } catch (e) {
      console.error('AI failed for', cityName, ':', e.message)
      return null
    }
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
      {cityScreenCoords.filter(c => c.visible && c.sx > 0 && c.sy > 0).map((city, i) => (
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
          onMouseEnter={e => e.currentTarget.style.transform='translate(-50%,-100%) scale(1.15)'}
          onMouseLeave={e => e.currentTarget.style.transform='translate(-50%,-100%) scale(1)'}
        >
          <div style={{
            background:'rgba(255,255,255,0.97)',
            backdropFilter:'blur(8px)',
            borderRadius:20,
            padding:'5px 13px',
            boxShadow:'0 4px 18px rgba(0,0,0,0.5)',
            border:`2px solid ${city.color}`,
            whiteSpace:'nowrap',
            fontFamily:'Pretendard,Inter,sans-serif',
            fontSize:13,
            fontWeight:700,
            color:'#0f172a',
            letterSpacing:'-0.3px',
          }}>{city.name}</div>
          <div style={{width:2,height:8,background:city.color}}/>
          <div style={{
            width:11,height:11,borderRadius:'50%',
            background:city.color,
            border:'2.5px solid white',
            boxShadow:`0 0 10px ${city.color}`,
          }}/>
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
                {/* AI 로딩 중 배너 */}
                {loading && (
                  <div style={{display:'flex',alignItems:'center',gap:8,background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:10,padding:'10px 14px',marginBottom:14}}>
                    <div style={{width:16,height:16,borderRadius:'50%',border:'2px solid #bae6fd',borderTopColor:'#0ea5e9',animation:'spin .7s linear infinite',flexShrink:0}}/>
                    <span style={{fontSize:12,color:'#0369a1',fontWeight:600}}>AI가 최신 관광 정보를 검색 중입니다...</span>
                  </div>
                )}
                <p style={{fontSize:13.5,color:'#475569',lineHeight:1.8,margin:'0 0 20px',borderLeft:`3px solid ${selectedCity.color}`,paddingLeft:14}}>
                  {cityData.description}
                </p>
                <div style={{fontSize:10,color:'#94a3b8',letterSpacing:'2.5px',textTransform:'uppercase',marginBottom:12}}>
                  추천 관광지 · {cityData.spots?.length}곳
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:11}}>
                  {cityData.spots?.map((spot,i)=>(
                    <div key={i} className="card"
                      onClick={()=>setSelectedSpot(selectedSpot?.name===spot.name?null:spot)}
                      style={{borderRadius:14,overflow:'hidden',background:'white',border:`1.5px solid ${selectedSpot?.name===spot.name?selectedCity.color:'#e2e8f0'}`,boxShadow:'0 2px 8px rgba(0,0,0,.06)',opacity:loading?0.6:1,transition:'opacity 0.3s'}}>
                      <div style={{height:142,overflow:'hidden',position:'relative'}}>
                        <img className="cimg" src={spot.img} alt={spot.name}
                          style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
                          onError={e=>e.target.src='https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80'}/>
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
                        <div style={{padding:'12px 14px',borderTop:`1px solid ${selectedCity.color}22`,background:`${selectedCity.color}07`}}>
                          <p style={{fontSize:12.5,color:'#475569',lineHeight:1.75,marginBottom: (spot.openTime||spot.price)?10:0}}>{spot.desc}</p>
                          {(spot.openTime || spot.price) && (
                            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
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
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:320,gap:16}}>
                <div style={{width:38,height:38,borderRadius:'50%',border:'3px solid #e2e8f0',borderTopColor:(selectedCity?.color||'#3b82f6'),animation:'spin .8s linear infinite'}}/>
                <div style={{fontSize:13,color:'#94a3b8'}}>잠시만 기다려주세요...</div>
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
