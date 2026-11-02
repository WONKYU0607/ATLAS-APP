// ── 내 여행 기록 (전체 패널) ──
// 탭 1 '국가': 다녀온 나라를 대륙 색으로 칠한 세계지도 + 대륙별 진행 카드 + 국기 모음 + 도시 기록(펼침)
// 탭 2 '비행': 출발·도착 도시와 날짜로 비행 기록 → 지도에 대권 경로, 총 거리·예상 비행시간 합계
// 비행 기록은 visited.flights 에 저장 → 기존 visited 동기화(로컬·로그인 Firestore)를 그대로 탄다
import { useState, useMemo } from 'react'
import { COUNTRY_CITIES } from './data/countryCities'
import { COUNTRY_INFO, getFlagImg } from './data/countryInfo'

const CONT = [
  { key: '아시아', ko: '아시아', en: 'Asia', color: '#ec4899' },
  { key: '유럽', ko: '유럽', en: 'Europe', color: '#f59e0b' },
  { key: '아프리카', ko: '아프리카', en: 'Africa', color: '#a16207' },
  { key: '북아메리카', ko: '북아메리카', en: 'N. America', color: '#0ea5e9' },
  { key: '남아메리카', ko: '남아메리카', en: 'S. America', color: '#22c55e' },
  { key: '오세아니아', ko: '오세아니아', en: 'Oceania', color: '#a855f7' },
]
const CONT_BY_KEY = Object.fromEntries(CONT.map(c => [c.key, c]))
// '아시아(중동)' → 아시아, '아시아/유럽' → 아시아, '유럽/아시아' → 유럽 (기존 목록과 같은 규칙)
const contOf = (country) => {
  const raw = COUNTRY_INFO[country]?.continent || ''
  const k = raw.replace(/\(.*?\)/g, '').split('/')[0].trim()
  return CONT_BY_KEY[k] ? k : null
}
// 같은 나라가 Natural Earth 짧은 이름으로 한 번 더 들어간 경우(Dominican Rep. 등) — 국기로 한 나라로 묶음
const isoOf = (country) => {
  const cps = [...(COUNTRY_INFO[country]?.emoji || '')].map(c => c.codePointAt(0))
  return cps.length === 2 ? String.fromCharCode(...cps.map(c => c - 0x1F1E6 + 65)) : country
}
// 도시명 → { country, lat, lng }
const CITY_INDEX = (() => {
  const m = {}
  for (const [country, cs] of Object.entries(COUNTRY_CITIES)) for (const c of cs) if (!m[c.name]) m[c.name] = { country, lat: c.lat, lng: c.lng }
  return m
})()
const R = 6371
const toR = Math.PI / 180
const distKm = (a, b) => {
  const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}
// 예상 비행시간(분): 순항 850km/h + 이착륙 30분
const flightMin = (km) => Math.round(km / 850 * 60 + 30)
const fmtMin = (m, ko) => ko ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${Math.floor(m / 60)}h ${m % 60}m`
// 대권(최단) 경로를 점으로 — 날짜변경선을 넘으면 선을 끊어 지도를 가로지르지 않게
const arcPaths = (a, b, n = 48) => {
  const v = (p) => [Math.cos(p.lat * toR) * Math.cos(p.lng * toR), Math.cos(p.lat * toR) * Math.sin(p.lng * toR), Math.sin(p.lat * toR)]
  const A = v(a), B = v(b)
  const d = Math.acos(Math.min(1, Math.max(-1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])))
  const pts = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const s1 = d ? Math.sin((1 - t) * d) / Math.sin(d) : 1 - t, s2 = d ? Math.sin(t * d) / Math.sin(d) : t
    const x = s1 * A[0] + s2 * B[0], y = s1 * A[1] + s2 * B[1], z = s1 * A[2] + s2 * B[2]
    pts.push([Math.atan2(y, x) / toR, Math.atan2(z, Math.hypot(x, y)) / toR])
  }
  const segs = [[]]
  pts.forEach((p, i) => { if (i && Math.abs(p[0] - pts[i - 1][0]) > 180) segs.push([]); segs[segs.length - 1].push(p) })
  return segs.filter(s => s.length > 1).map(s => s.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${(-p[1]).toFixed(2)}`).join(''))
}

const C = { bg: '#f6f1e7', card: '#fffdf8', line: '#e8e0d2', ink: '#1f2933', sub: '#8a7f70', land: '#e3dccf', accent: '#0f766e' }

export default function MyTravels({ visited, saveVisited, countries, lang, isMobile, onClose, getCountryName, getCityName, t }) {
  const ko = lang === 'ko'
  const [tab, setTab] = useState('countries')
  const [openCont, setOpenCont] = useState(null)
  const [openCity, setOpenCity] = useState(null)
  const [showCities, setShowCities] = useState(false)
  const [fFrom, setFFrom] = useState('')
  const [fTo, setFTo] = useState('')
  const [fDate, setFDate] = useState('')
  const flights = visited.flights || []

  // 대륙별 전체 나라 수(중복 이름 제외)
  const contTotals = useMemo(() => {
    const m = {}; const seen = new Set()
    for (const country of Object.keys(COUNTRY_CITIES)) {
      const k = contOf(country); const iso = isoOf(country)
      if (!k || seen.has(iso)) continue
      seen.add(iso); m[k] = (m[k] || 0) + 1
    }
    return m
  }, [])
  // 다녀온 나라: 방문 도시가 하나라도 있는 나라
  const visitedCountries = useMemo(() => {
    const out = []; const seen = new Set()
    for (const c of visited.cities || []) {
      const country = CITY_INDEX[c]?.country; if (!country) continue
      const iso = isoOf(country); if (seen.has(iso)) continue
      seen.add(iso); out.push(country)
    }
    const order = Object.fromEntries(CONT.map((c, i) => [c.key, i]))
    return out.sort((a, b) => (order[contOf(a)] ?? 9) - (order[contOf(b)] ?? 9) || getCountryName(a).localeCompare(getCountryName(b)))
  }, [visited.cities, lang])
  const visitedIso = useMemo(() => new Set(visitedCountries.map(isoOf)), [visitedCountries])
  const contVisited = useMemo(() => {
    const m = {}; for (const c of visitedCountries) { const k = contOf(c); if (k) m[k] = (m[k] || 0) + 1 }; return m
  }, [visitedCountries])

  // 세계지도 경로 (남극 제외, 날짜변경선을 넘는 고리 제외)
  const mapPaths = useMemo(() => {
    const out = []
    for (const feat of countries || []) {
      const name = feat.properties?.NAME
      if (!name || name === 'Antarctica' || !feat.geometry) continue
      const g = feat.geometry
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
      const d = polys.map(p => p[0]).filter(r => { const l = r.map(c => c[0]); return Math.max(...l) - Math.min(...l) <= 180 })
        .map(r => r.map((c, i) => `${i ? 'L' : 'M'}${c[0].toFixed(2)},${(-c[1]).toFixed(2)}`).join('') + 'Z').join('')
      if (d) out.push({ name, d })
    }
    return out
  }, [countries])
  const WorldMap = ({ children }) => (
    <svg viewBox="-180 -84 360 144" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {mapPaths.map(({ name, d }) => {
        const k = COUNTRY_INFO[name] ? contOf(name) : null
        const on = tab === 'countries' && k && visitedIso.has(isoOf(name))
        return <path key={name} d={d} fill={on ? CONT_BY_KEY[k].color : C.land} stroke="#fbf8f2" strokeWidth="0.25" />
      })}
      {children}
    </svg>
  )

  // ── 비행 ──
  const cityOptions = useMemo(() => Object.entries(CITY_INDEX).map(([name, v]) => ({ name, label: `${getCityName(name)} · ${getCountryName(v.country)}` })), [lang])
  const resolveCity = (txt) => {
    const s = (txt || '').trim().toLowerCase(); if (!s) return null
    if (CITY_INDEX[txt.trim()]) return txt.trim()
    const hit = cityOptions.find(o => o.label.toLowerCase() === s || getCityName(o.name).toLowerCase() === s || o.name.toLowerCase() === s)
    return hit ? hit.name : null
  }
  const fromKey = resolveCity(fFrom), toKey = resolveCity(fTo)
  const preview = fromKey && toKey && fromKey !== toKey ? distKm(CITY_INDEX[fromKey], CITY_INDEX[toKey]) : null
  const addFlight = () => {
    if (!preview) return
    const f = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), from: fromKey, to: toKey, date: fDate || '' }
    saveVisited({ ...visited, flights: [...flights, f] })
    setFFrom(''); setFTo('')
  }
  const delFlight = (id) => saveVisited({ ...visited, flights: flights.filter(f => f.id !== id) })
  const fl = flights.map(f => {
    const a = CITY_INDEX[f.from], b = CITY_INDEX[f.to]
    const km = a && b ? distKm(a, b) : 0
    return { ...f, a, b, km, min: km ? flightMin(km) : 0 }
  }).filter(f => f.a && f.b)
  const totalKm = fl.reduce((s, f) => s + f.km, 0)
  const totalMin = fl.reduce((s, f) => s + f.min, 0)
  const flCities = new Set(fl.flatMap(f => [f.from, f.to]))
  const longest = fl.reduce((m, f) => Math.max(m, f.km), 0)
  const fmtKm = (km) => `${Math.round(km).toLocaleString()} km`

  const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16 }
  const totalCountries = Object.values(contTotals).reduce((a, b) => a + b, 0)

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1400, backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: isMobile ? '96vw' : Math.min(860, typeof window !== 'undefined' ? window.innerWidth - 60 : 820),
        maxHeight: isMobile ? '92vh' : '88vh', background: C.bg, borderRadius: 22, zIndex: 1401, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,.35)', animation: 'aiModalIn .3s cubic-bezier(.16,1,.3,1)', color: C.ink,
      }}>
        {/* 머리 */}
        <div style={{ padding: isMobile ? '16px 16px 10px' : '20px 24px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: isMobile ? 26 : 30, fontWeight: 900, color: C.accent, letterSpacing: -0.5, flex: 1 }}>{t('visitedTitle')}</div>
            <div style={{ ...card, padding: '6px 14px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: C.accent }}>{tab === 'countries' ? visitedCountries.length : fl.length}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>{tab === 'countries' ? (ko ? '개국' : 'Countries') : (ko ? '번 비행' : 'Flights')}</span>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, color: C.sub, cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {[['countries', ko ? '다녀온 나라' : 'Countries'], ['flights', ko ? '비행 기록' : 'Flights']].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800,
                border: `1px solid ${tab === k ? C.accent : C.line}`, background: tab === k ? C.accent : C.card, color: tab === k ? 'white' : C.sub }}>{label}</button>
            ))}
          </div>
        </div>

        <div key={tab} style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '4px 14px 18px' : '6px 24px 24px' }}>
          {tab === 'countries' && (<>
            <div style={{ ...card, padding: isMobile ? 6 : 10, marginBottom: 14 }}><WorldMap /></div>

            {/* 대륙 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: isMobile ? 8 : 12, marginBottom: 16 }}>
              {CONT.map(c => {
                const v = contVisited[c.key] || 0, tot = contTotals[c.key] || 0
                return (
                  <div key={c.key} style={{ ...card, border: `1.5px solid ${c.color}55`, padding: isMobile ? '10px 10px 12px' : '14px 16px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                      <span style={{ fontSize: isMobile ? 12 : 14, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ko ? c.ko : c.en}</span>
                    </div>
                    <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: c.color, margin: '6px 0 8px' }}>{v}<span style={{ opacity: .6 }}>/{tot}</span></div>
                    <div style={{ height: 6, background: '#efe8db', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${tot ? Math.max(v ? 4 : 0, v / tot * 100) : 0}%`, background: c.color, borderRadius: 3, transition: 'width .8s cubic-bezier(.16,1,.3,1)' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 국기 모음 */}
            {visitedCountries.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '32px 12px', color: C.sub }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{t('visitedEmpty')}</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>{ko ? '도시 패널에서 방문 체크를 해보세요' : 'Mark visited cities in the city panel'}</div>
              </div>
            ) : (
              <div style={{ ...card, padding: isMobile ? '14px 8px' : '18px 14px', display: 'grid', gridTemplateColumns: `repeat(auto-fill,minmax(${isMobile ? 64 : 84}px,1fr))`, rowGap: 14, columnGap: 4, marginBottom: 14 }}>
                {visitedCountries.map(country => {
                  const img = getFlagImg(COUNTRY_INFO[country]?.emoji, 40)
                  return (
                    <div key={country} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: isMobile ? 38 : 46, height: isMobile ? 38 : 46, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,.18)', background: '#eee' }}>
                        {img && <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: '#4b5563', textAlign: 'center', lineHeight: 1.2 }}>{getCountryName(country)}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 도시 기록 (기존 목록: 대륙 → 나라 → 도시 → 관광지) */}
            {visitedCountries.length > 0 && (
              <div style={{ ...card, marginBottom: 12 }}>
                <div onClick={() => setShowCities(v => !v)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, flex: 1 }}>{ko ? '도시 기록' : 'Cities'} <span style={{ color: C.sub, fontWeight: 600, fontSize: 12 }}>· {(visited.cities || []).length}{ko ? '개 도시' : ' cities'}</span></span>
                  <span style={{ color: C.sub, fontSize: 12 }}>{showCities ? '▲' : '▼'}</span>
                </div>
                {showCities && CONT.map(c => {
                  const items = visitedCountries.filter(x => contOf(x) === c.key)
                  if (!items.length) return null
                  const isOpen = openCont === c.key
                  return (
                    <div key={c.key} style={{ borderTop: `1px solid ${C.line}` }}>
                      <div onClick={() => setOpenCont(isOpen ? null : c.key)} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                        <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{ko ? c.ko : c.en}</span>
                        <span style={{ fontSize: 11, color: C.sub }}>{items.length}{ko ? '개국' : ' countries'} {isOpen ? '▲' : '▼'}</span>
                      </div>
                      {isOpen && items.map(country => (
                        <div key={country} style={{ padding: '2px 16px 8px 32px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 2 }}>{getCountryName(country)}</div>
                          {(COUNTRY_CITIES[country] || []).filter(x => (visited.cities || []).includes(x.name)).map(city => {
                            const spots = visited.spots?.[city.name] || []
                            const o = openCity === city.name
                            return (
                              <div key={city.name} style={{ paddingLeft: 10 }}>
                                <div onClick={() => setOpenCity(o ? null : city.name)} style={{ fontSize: 12, color: '#4b5563', padding: '3px 0', cursor: spots.length ? 'pointer' : 'default' }}>
                                  <span style={{ color: c.color, fontWeight: 800 }}>✓</span> {getCityName(city.name)}{spots.length > 0 && <span style={{ color: C.sub }}> · {spots.length}{ko ? '곳' : ''} {o ? '▲' : '▼'}</span>}
                                </div>
                                {o && spots.map((sp, j) => <div key={j} style={{ fontSize: 11, color: C.sub, padding: '1px 0 1px 16px' }}>· {sp}</div>)}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { if (window.confirm(ko ? '도시 방문 기록을 초기화할까요? (비행 기록은 남습니다)' : 'Reset visited cities? (Flights are kept)')) { saveVisited({ flights }); setOpenCont(null); setOpenCity(null) } }}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #f3c1c1', background: '#fff5f5', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{ko ? '방문 기록 초기화' : 'Reset'}</button>
            </div>
          </>)}

          {tab === 'flights' && (<>
            <div style={{ ...card, padding: isMobile ? 6 : 10, marginBottom: 14 }}>
              <WorldMap>
                {fl.map(f => arcPaths(f.a, f.b).map((d, i) => <path key={f.id + i} d={d} fill="none" stroke="#a855f7" strokeWidth="0.9" strokeLinecap="round" opacity="0.9" />))}
                {[...flCities].map(n => { const p = CITY_INDEX[n]; return <circle key={n} cx={p.lng} cy={-p.lat} r="1.6" fill="#1e3a8a" stroke="white" strokeWidth="0.3" /> })}
              </WorldMap>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: isMobile ? 8 : 12, marginBottom: 16 }}>
              {[
                [fmtKm(totalKm), ko ? '총 거리' : 'Total Distance', '#0ea5e9'],
                [fmtMin(totalMin, ko), ko ? '총 비행시간 (예상)' : 'Total Duration (est.)', '#a855f7'],
                [`${flCities.size}`, ko ? '들른 도시' : 'Cities', '#f59e0b'],
                [longest ? fmtKm(longest) : '-', ko ? '가장 긴 비행' : 'Longest Flight', '#22c55e'],
              ].map(([v, label, color]) => (
                <div key={label} style={{ ...card, padding: isMobile ? '12px' : '16px 18px', borderLeft: `4px solid ${color}` }}>
                  <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 900 }}>{v}</div>
                  <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* 비행 추가 */}
            <div style={{ ...card, padding: isMobile ? 12 : 16, marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>{ko ? '비행 추가' : 'Add Flight'}</div>
              <datalist id="mt-cities">{cityOptions.map(o => <option key={o.name} value={o.label} />)}</datalist>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 150px', gap: 8 }}>
                {[[fFrom, setFFrom, ko ? '출발 도시' : 'From', fromKey], [fTo, setFTo, ko ? '도착 도시' : 'To', toKey]].map(([val, set, ph, ok], i) => (
                  <input key={i} list="mt-cities" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${val && !ok ? '#f87171' : C.line}`, background: 'white', fontSize: 13, color: C.ink, outline: 'none' }} />
                ))}
                <input type="date" value={fDate} onChange={e => setFDate(e.target.value)}
                  style={{ padding: '9px 10px', borderRadius: 10, border: `1px solid ${C.line}`, background: 'white', fontSize: 13, color: C.ink }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <div style={{ flex: 1, fontSize: 12, color: C.sub }}>
                  {preview ? `${Math.round(preview).toLocaleString()} km · ${ko ? '약 ' : '~'}${fmtMin(flightMin(preview), ko)}` : (ko ? '목록에서 도시를 고르세요' : 'Pick cities from the list')}
                </div>
                <button onClick={addFlight} disabled={!preview}
                  style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: preview ? C.accent : '#cbd5e1', color: 'white', fontWeight: 800, fontSize: 13, cursor: preview ? 'pointer' : 'default' }}>{ko ? '추가' : 'Add'}</button>
              </div>
            </div>

            {/* 비행 목록 */}
            {fl.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '28px 12px', color: C.sub, fontSize: 13 }}>{ko ? '아직 비행 기록이 없어요' : 'No flights yet'}</div>
            ) : (
              <div style={{ ...card }}>
                {[...fl].sort((x, y) => (y.date || '').localeCompare(x.date || '')).map((f, i) => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderTop: i ? `1px solid ${C.line}` : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getCityName(f.from)} → {getCityName(f.to)}</div>
                      <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{f.date ? f.date.replace(/-/g, '.') + ' · ' : ''}{Math.round(f.km).toLocaleString()} km · {fmtMin(f.min, ko)}</div>
                    </div>
                    <button onClick={() => { if (window.confirm(ko ? '이 비행 기록을 지울까요?' : 'Delete this flight?')) delFlight(f.id) }}
                      style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.line}`, background: 'white', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 10, color: C.sub, marginTop: 8, textAlign: 'right' }}>{ko ? '거리는 도시 간 최단 직선거리, 비행시간은 시속 850km + 이착륙 30분으로 계산한 예상값이에요' : 'Great-circle distance; duration estimated at 850 km/h + 30 min'}</div>
          </>)}
        </div>
      </div>
    </>
  )
}
