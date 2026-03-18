import { useState, useEffect, useRef } from 'react'
import Globe from 'globe.gl'

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

// 모든 도시 AI로 생성 (사전 데이터 없음)
const CITY_DATA = {}

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

export default function App() {
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
    if (!globeRef.current) return
    setSelectedCity(city)
    setSelectedSpot(null)
    setCityData(null)
    fetchCityData(city)
    globeRef.current.pointOfView({ lat: city.lat, lng: city.lng, altitude: 0.5 }, 900)
  }

  // Keep ref always pointing to latest version of handleCityClick
  handleCityClickRef.current = handleCityClick

  const fetchCityData = async (city) => {
    setLoading(true)

    // 사전 데이터가 있으면 먼저 보여주고, 날씨만 실시간으로 교체
    if (CITY_DATA[city.name]) {
      const base = { ...CITY_DATA[city.name] }
      setCityData(base)
      setLoading(false)
      // 실시간 날씨 병렬 fetch
      fetchWeather(city.lat, city.lng).then(w => {
        if (w) setCityData(prev => prev ? { ...prev, weather: w } : prev)
      })
      return
    }

    // 사전 데이터 없으면 AI web search + 실시간 날씨 병렬 실행
    const [aiResult, weatherResult] = await Promise.allSettled([
      fetchAIWithSearch(city),
      fetchWeather(city.lat, city.lng)
    ])

    let data = null
    if (aiResult.status === 'fulfilled' && aiResult.value) {
      data = aiResult.value
    } else {
      data = {
        description: `${city.name}은(는) 독특한 문화와 역사를 가진 매력적인 여행지입니다. 다양한 볼거리와 먹거리로 방문객을 맞이합니다.`,
        spots: [
          { name: `${city.name} 구시가지`, type:"역사", desc:`${city.name}의 역사적인 중심가로 전통 건축물과 골목길이 매력적입니다.`, img:"https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&q=80", rating:4.5 },
          { name: `${city.name} 중앙 박물관`, type:"문화", desc:`${city.name}의 역사와 문화를 한눈에 볼 수 있는 박물관입니다.`, img:"https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=400&q=80", rating:4.3 },
          { name: `${city.name} 전통 시장`, type:"음식", desc:`현지 특산물과 길거리 음식이 가득한 활기찬 전통 시장입니다.`, img:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80", rating:4.4 },
          { name: `${city.name} 자연 공원`, type:"자연", desc:`도시 속 푸른 오아시스로 현지인과 여행자 모두 즐겨 찾습니다.`, img:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80", rating:4.2 },
        ]
      }
    }

    // 실시간 날씨 적용
    if (weatherResult.status === 'fulfilled' && weatherResult.value) {
      data.weather = weatherResult.value
    } else {
      data.weather = { temp: 20, condition: "맑음", icon: "☀️", humidity: 60 }
    }

    setCityData(data)
    setLoading(false)
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

  // Claude AI로 도시별 실제 관광 정보 생성 (web_search 제거 - 파싱 안정성)
  const fetchAIWithSearch = async (city) => {
    const countryKoName = COUNTRY_KO[city.countryEn] || city.countryEn || ''
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `${countryKoName} ${city.name}의 실제 유명 관광지 4곳 정보를 JSON으로만 답하세요. 다른 텍스트 없이 JSON만:

{"description":"${city.name}만의 고유한 특징 2문장","spots":[{"name":"관광지명","type":"문화","desc":"이 관광지만의 구체적 특징 2문장","img":"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80","rating":4.5},{"name":"관광지명2","type":"자연","desc":"설명","img":"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80","rating":4.7},{"name":"관광지명3","type":"역사","desc":"설명","img":"https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&q=80","rating":4.3},{"name":"관광지명4","type":"랜드마크","desc":"설명","img":"https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80","rating":4.6}]}

중요: 위 형식 그대로 ${city.name}의 실제 관광지로 채워서 JSON만 반환. type은 문화/자연/랜드마크/도시/역사/음식 중 하나.`
          }]
        })
      })
      const data = await res.json()
      if (!data.content || !data.content[0]) return null
      const txt = data.content[0].text.replace(/```json|```/g, '').trim()
      const jsonMatch = txt.match(/\{[\s\S]*"spots"[\s\S]*\}/)
      if (!jsonMatch) return null
      const parsed = JSON.parse(jsonMatch[0])
      if (!parsed.spots || parsed.spots.length < 2) return null
      return parsed
    } catch (e) {
      console.error('AI failed:', e)
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
                  {selectedCity.emoji} {countryKo}
                </div>
                <div style={{fontSize:26,fontWeight:800,letterSpacing:'-.5px',color:'#0f172a'}}>{selectedCity.name}</div>
              </div>
              <button onClick={closePanel}
                style={{background:'#f1f5f9',border:'1.5px solid #e2e8f0',color:'#64748b',width:34,height:34,borderRadius:9,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}
                onMouseEnter={e=>e.currentTarget.style.background='#e2e8f0'}
                onMouseLeave={e=>e.currentTarget.style.background='#f1f5f9'}>✕</button>
            </div>
            {cityData && !loading && (
              <div style={{display:'flex',alignItems:'center',gap:12,background:'#f8fafc',borderRadius:12,padding:'11px 14px',border:'1.5px solid #e2e8f0'}}>
                <span style={{fontSize:28}}>{cityData.weather.icon}</span>
                <div>
                  <div style={{fontSize:20,fontWeight:700,color:'#0f172a'}}>{cityData.weather.temp}°C</div>
                  <div style={{fontSize:11,color:'#94a3b8'}}>{cityData.weather.condition}</div>
                </div>
                <div style={{marginLeft:'auto',textAlign:'right'}}>
                  <div style={{fontSize:13,color:'#475569'}}>💧 {cityData.weather.humidity}%</div>
                  <div style={{fontSize:11,color:'#94a3b8'}}>습도</div>
                </div>
              </div>
            )}
          </div>
          <div style={{padding:'0 20px 40px'}}>
            {loading ? (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:320,gap:16}}>
                <div style={{width:38,height:38,borderRadius:'50%',border:'3px solid #e2e8f0',borderTopColor:selectedCity.color,animation:'spin .8s linear infinite'}}/>
                <div style={{fontSize:13,color:'#94a3b8'}}>여행 정보 불러오는 중…</div>
              </div>
            ) : cityData ? (
              <>
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
                      style={{borderRadius:14,overflow:'hidden',background:'white',border:`1.5px solid ${selectedSpot?.name===spot.name?selectedCity.color:'#e2e8f0'}`,boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
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
                          <div style={{fontSize:13,color:'#fbbf24',fontWeight:700}}>★ {spot.rating}</div>
                        </div>
                      </div>
                      {selectedSpot?.name===spot.name && (
                        <div style={{padding:'12px 14px',borderTop:`1px solid ${selectedCity.color}22`,background:`${selectedCity.color}07`}}>
                          <p style={{fontSize:12.5,color:'#475569',lineHeight:1.75}}>{spot.desc}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
