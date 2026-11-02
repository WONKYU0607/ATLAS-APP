// ── 내 여행 기록 (전체 패널) ──
// 다녀온 나라를 대륙 색으로 칠한 세계지도 + 대륙별 진행 카드 + 국기 모음 + 도시 기록(펼침)
// 밤바다 느낌의 남색 배경 + 보석 톤 대륙색 (참고한 Travelog 템플릿의 크림 배경·대륙색과 겹치지 않게)
import { useState, useMemo } from 'react'
import { COUNTRY_CITIES } from './data/countryCities'
import { COUNTRY_INFO, getFlagImg } from './data/countryInfo'

const CONT = [
  { key: '아시아', ko: '아시아', en: 'Asia', color: '#ff6b6b' },        // 코럴 레드
  { key: '유럽', ko: '유럽', en: 'Europe', color: '#4dabf7' },           // 스카이 블루
  { key: '아프리카', ko: '아프리카', en: 'Africa', color: '#fcc419' },    // 옐로
  { key: '북아메리카', ko: '북아메리카', en: 'N. America', color: '#51cf66' }, // 민트 그린
  { key: '남아메리카', ko: '남아메리카', en: 'S. America', color: '#cc5de8' }, // 오키드
  { key: '오세아니아', ko: '오세아니아', en: 'Oceania', color: '#ff922b' },   // 탠저린
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
// 도시명 → 나라
const CITY_COUNTRY = (() => {
  const m = {}
  for (const [country, cs] of Object.entries(COUNTRY_CITIES)) for (const c of cs) if (!m[c.name]) m[c.name] = country
  return m
})()

// 카드 배경은 불투명색으로 — 반투명을 겹치면 기기에 따라 뒤 화면이 비쳐 얼룩져 보임
const mix = (hex, base, a) => {
  const h = (x) => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16))
  const [r1, g1, b1] = h(hex), [r2, g2, b2] = h(base)
  return '#' + [r1 * a + r2 * (1 - a), g1 * a + g2 * (1 - a), b1 * a + b2 * (1 - a)].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}
const C = {
  bg: 'linear-gradient(160deg,#0b1d33 0%,#10284a 55%,#0d2240 100%)',
  card: '#15304f', line: '#24405f',
  ink: '#eef3fb', sub: '#8fa3bf', land: '#1d3a5f', landStroke: '#0f2645', accent: '#7dd3fc',
}

export default function MyTravels({ visited, saveVisited, countries, lang, isMobile, onClose, getCountryName, getCityName, t }) {
  const ko = lang === 'ko'
  const [openCont, setOpenCont] = useState(null)
  const [openCity, setOpenCity] = useState(null)
  const [showCities, setShowCities] = useState(false)

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
      const country = CITY_COUNTRY[c]; if (!country) continue
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

  const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16 }

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1400, backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: isMobile ? '96vw' : Math.min(860, typeof window !== 'undefined' ? window.innerWidth - 60 : 820),
        maxHeight: isMobile ? '92vh' : '88vh', background: C.bg, borderRadius: 22, zIndex: 1401, overflow: 'hidden',
        border: '1px solid rgba(125,211,252,.18)', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,.5)', animation: 'aiModalIn .3s cubic-bezier(.16,1,.3,1)', color: C.ink,
      }}>
        {/* 머리 */}
        <div style={{ padding: isMobile ? '16px 16px 12px' : '20px 24px 14px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900, letterSpacing: -0.5 }}>{t('visitedTitle')}</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{(visited.cities || []).length}{ko ? '개 도시를 다녀왔어요' : ' cities visited'}</div>
          </div>
          <div style={{ padding: '6px 14px', borderRadius: 999, background: '#16354f', border: '1px solid #2f6585', display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: C.accent }}>{visitedCountries.length}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>{ko ? '개국' : 'Countries'}</span>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, color: C.sub, cursor: 'pointer', fontSize: 15 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0 14px 18px' : '0 24px 24px' }}>
          {/* 지도 */}
          <div style={{ ...card, padding: isMobile ? 6 : 10, marginBottom: 14, background: '#091a30' }}>
            <svg viewBox="-180 -84 360 144" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block' }}>
              {mapPaths.map(({ name, d }) => {
                const k = COUNTRY_INFO[name] ? contOf(name) : null
                const on = k && visitedIso.has(isoOf(name))
                return <path key={name} d={d} fill={on ? CONT_BY_KEY[k].color : C.land} stroke={C.landStroke} strokeWidth="0.3" />
              })}
            </svg>
          </div>

          {/* 대륙 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: isMobile ? 8 : 12, marginBottom: 16 }}>
            {CONT.map(c => {
              const v = contVisited[c.key] || 0, tot = contTotals[c.key] || 0
              return (
                <div key={c.key} style={{ ...card, padding: isMobile ? '10px 10px 12px' : '14px 16px 16px', background: `linear-gradient(180deg, ${mix(c.color, '#15304f', 0.16)}, #15304f)`, border: `1px solid ${mix(c.color, '#15304f', 0.35)}` }}>
                  <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: C.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ko ? c.ko : c.en}</div>
                  <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: c.color, margin: '4px 0 8px' }}>{v}<span style={{ fontSize: '0.6em', color: C.sub, fontWeight: 700 }}> / {tot}</span></div>
                  <div style={{ height: 5, background: '#24405f', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${tot ? Math.max(v ? 4 : 0, v / tot * 100) : 0}%`, background: c.color, borderRadius: 3, boxShadow: `0 0 8px ${c.color}`, transition: 'width .8s cubic-bezier(.16,1,.3,1)' }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* 국기 모음 */}
          {visitedCountries.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '32px 12px', color: C.sub }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{t('visitedEmpty')}</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>{ko ? '도시 패널에서 방문 체크를 해보세요' : 'Mark visited cities in the city panel'}</div>
            </div>
          ) : (
            <div style={{ ...card, padding: isMobile ? '14px 8px' : '18px 14px', display: 'grid', gridTemplateColumns: `repeat(auto-fill,minmax(${isMobile ? 64 : 84}px,1fr))`, rowGap: 14, columnGap: 4, marginBottom: 14 }}>
              {visitedCountries.map(country => {
                const img = getFlagImg(COUNTRY_INFO[country]?.emoji, 40)
                const col = CONT_BY_KEY[contOf(country)]?.color || C.sub
                return (
                  <div key={country} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: isMobile ? 38 : 46, height: isMobile ? 38 : 46, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${col}`, boxShadow: `0 0 10px ${col}55`, background: '#1d3a5f' }}>
                      {img && <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: '#c9d6e8', textAlign: 'center', lineHeight: 1.2 }}>{getCountryName(country)}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* 도시 기록 (대륙 → 나라 → 도시 → 관광지) */}
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
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                      <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{ko ? c.ko : c.en}</span>
                      <span style={{ fontSize: 11, color: C.sub }}>{items.length}{ko ? '개국' : ' countries'} {isOpen ? '▲' : '▼'}</span>
                    </div>
                    {isOpen && items.map(country => (
                      <div key={country} style={{ padding: '2px 16px 8px 32px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 2 }}>{getCountryName(country)}</div>
                        {(COUNTRY_CITIES[country] || []).filter(x => (visited.cities || []).includes(x.name)).map(city => {
                          const spots = visited.spots?.[city.name] || []
                          const o = openCity === city.name
                          return (
                            <div key={city.name} style={{ paddingLeft: 10 }}>
                              <div onClick={() => setOpenCity(o ? null : city.name)} style={{ fontSize: 12, color: '#c9d6e8', padding: '3px 0', cursor: spots.length ? 'pointer' : 'default' }}>
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
            <button onClick={() => { if (window.confirm(ko ? '모든 방문 기록을 초기화할까요?' : 'Reset all travel records?')) { saveVisited({}); setOpenCont(null); setOpenCity(null) } }}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(248,113,113,.4)', background: '#2a2236', color: '#fca5a5', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{ko ? '방문 기록 초기화' : 'Reset'}</button>
          </div>
        </div>
      </div>
    </>
  )
}
