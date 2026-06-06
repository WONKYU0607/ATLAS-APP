// ───────────────────────────────────────────────────────────────
// calcRadius.mjs — 도시별 검색반경 자동 산출 (Google Geocoding viewport 기반)
//
// 사용법:
//   1) 이 파일을 countryCities.js 와 같은 폴더에 둔다
//   2) 아래 KEY 에 본인 Google API 키 입력 (Geocoding API 활성화 필요)
//   3) 검증:  node calcRadius.mjs --sample     (대표 도시 몇 개만)
//   4) 전체:  node calcRadius.mjs              (전 도시 → cityRadius.js 생성)
//
// 결과: cityRadius.js  (export const CITY_RADIUS = { "도시명": 반경km, ... })
// ───────────────────────────────────────────────────────────────
import fs from 'fs'

const KEY = process.env.GOOGLE_API_KEY || 'PUT_YOUR_KEY_HERE'

// 튜닝 파라미터 ─ 필요하면 여기만 조절
const RATIO   = 0.5   // viewport 대각선 × RATIO = 반경
const MIN_KM  = 5     // 하한
const MAX_KM  = 30    // 상한
const DELAY   = 60    // 호출 간격(ms) — 레이트리밋 여유

const haversine = (la1, ln1, la2, ln2) => {
  const R = 6371, t = Math.PI / 180
  const dLa = (la2 - la1) * t, dLn = (ln2 - ln1) * t
  const a = Math.sin(dLa/2)**2 + Math.cos(la1*t)*Math.cos(la2*t)*Math.sin(dLn/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// countryCities.js 에서 COUNTRY_CITIES 객체만 안전 추출 (순수 객체 리터럴)
function loadCities() {
  const txt = fs.readFileSync('countryCities.js', 'utf8')
  const s = txt.indexOf('{', txt.indexOf('COUNTRY_CITIES'))
  let depth = 0, e = -1
  for (let i = s; i < txt.length; i++) {
    if (txt[i] === '{') depth++
    else if (txt[i] === '}') { depth--; if (depth === 0) { e = i; break } }
  }
  return (new Function('return ' + txt.slice(s, e + 1)))()
}

// 좌표 → 역지오코딩 → 그 도시(locality) 경계 → 반경(km)
async function radiusFor(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=en&key=${KEY}`
  const r = await fetch(url)
  const d = await r.json()
  if (d.status !== 'OK' || !d.results?.length) return { radius: null, status: d.status, msg: d.error_message }
  // locality(시) 우선, 없으면 광역 단위
  const order = ['locality', 'postal_town', 'administrative_area_level_2', 'administrative_area_level_1']
  let pick = null
  for (const t of order) { pick = d.results.find(x => x.types?.includes(t)); if (pick) break }
  if (!pick) pick = d.results[0]
  const g = pick.geometry
  const box = g.bounds || g.viewport
  if (!box) return { radius: null, status: 'NO_BOUNDS' }
  const diag = haversine(box.northeast.lat, box.northeast.lng, box.southwest.lat, box.southwest.lng)
  return { radius: +clamp(diag * RATIO, MIN_KM, MAX_KM).toFixed(1), diag: +diag.toFixed(1), label: pick.formatted_address }
}

async function main() {
  if (KEY === 'PUT_YOUR_KEY_HERE') { console.error('❌ KEY 를 먼저 입력하세요 (또는 GOOGLE_API_KEY 환경변수)'); process.exit(1) }
  const sample = process.argv.includes('--sample')

  if (sample) {
    // 비율 검증용 대표 도시 (좌표 직접)
    const test = [
      ['Los Angeles', 34.05, -118.24], ['Seoul', 37.57, 126.98],
      ['Venice', 45.44, 12.32], ['Tokyo', 35.68, 139.69],
      ['New York', 40.71, -74.01], ['Paris', 48.86, 2.35],
    ]
    console.log(`검증 (RATIO=${RATIO}, ${MIN_KM}~${MAX_KM}km)\n`)
    for (const [nm, la, ln] of test) {
      const r = await radiusFor(la, ln)
      console.log(r.radius != null
        ? `${nm.padEnd(13)} 대각선 ${String(r.diag).padStart(6)}km → 반경 ${r.radius}km  (${r.label})`
        : `${nm.padEnd(13)} 실패: ${r.status} ${r.msg || ''}`)
      await sleep(DELAY)
    }
    return
  }

  const CITIES = loadCities()
  const out = {}
  let done = 0, fail = 0
  const total = Object.values(CITIES).reduce((s, arr) => s + arr.length, 0)
  console.log(`전체 ${total}개 도시 처리 시작...\n`)
  for (const [country, arr] of Object.entries(CITIES)) {
    for (const c of arr) {
      const r = await radiusFor(c.lat, c.lng)
      if (r.radius != null) { out[c.name] = r.radius; done++ }
      else { out[c.name] = clamp(15, MIN_KM, MAX_KM); fail++; console.warn(`⚠️ ${country}/${c.name}: ${r.status} → 기본15km`) }
      if ((done + fail) % 50 === 0) console.log(`  ${done + fail}/${total} ...`)
      await sleep(DELAY)
    }
  }
  const body = Object.entries(out).map(([k, v]) => `  ${JSON.stringify(k)}: ${v},`).join('\n')
  const file = `// 도시별 검색반경(km) — calcRadius.mjs 자동생성 (viewport×${RATIO}, ${MIN_KM}~${MAX_KM})\nexport const CITY_RADIUS = {\n${body}\n}\n`
  fs.writeFileSync('cityRadius.js', file)
  console.log(`\n✅ 완료: ${done}개 산출, ${fail}개 기본값 → cityRadius.js 생성`)
}
main()
