import { CITY_DATA, DEFAULT_CITY_DATA, TYPE_EMOJI, getImg, TYPE_COLORS } from './data/cityData'
import { COUNTRY_ISO, COUNTRY_NAME_OVERRIDE, getCountryDisplayName, LANG_OPTIONS, getFlagImg, COUNTRY_INFO } from './data/countryInfo'
import { COUNTRY_CITIES } from './data/countryCities'
import { useState, useEffect, useRef, Component } from 'react'
import Globe from 'globe.gl'
import * as THREE from 'three'
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
"Andorra":{en:["Andorra la Vella","Tiny Pyrenean principality"],ja:["アンドラ・ラ・ベリャ","ピレネーの小さな公国"],zh:["安道尔城","比利牛斯山小公国"]},
"Antigua and Barbuda":{en:["St. John's","365 beaches in the Caribbean"],ja:["セントジョンズ","365のビーチのカリブの楽園"],zh:["圣约翰","加勒比365处海滩的天堂"]},
"Bahamas":{en:["Nassau","700 islands of Caribbean jewels"],ja:["ナッソー","700島のカリブの宝石"],zh:["拿骚","加勒比700岛屿的宝石"]},
"Barbados":{en:["Bridgetown","British gem in the Caribbean"],ja:["ブリッジタウン","カリブの英国風宝石"],zh:["布里奇敦","加勒比的英式宝石"]},
"Dominica":{en:["Roseau","Nature island of the Caribbean"],ja:["ロゾー","カリブの自然島"],zh:["罗索","加勒比的自然之岛"]},
"Grenada":{en:["St. George's","Island of spice"],ja:["セントジョージズ","スパイスの島"],zh:["圣乔治","香料之岛"]},
"Kiribati":{en:["Tarawa","Coral nation in the Pacific"],ja:["タラワ","太平洋のサンゴの国"],zh:["塔拉瓦","太平洋珊瑚之国"]},
"Liechtenstein":{en:["Vaduz","Tiny Alpine wealth"],ja:["ファドゥーツ","アルプスの小さな富国"],zh:["瓦杜兹","阿尔卑斯的小富国"]},
"Malta":{en:["Valletta","Mediterranean historic gem"],ja:["バレッタ","地中海の歴史的宝石"],zh:["瓦莱塔","地中海的历史宝石"]},
"Marshall Islands":{en:["Majuro","Coral republic in the Pacific"],ja:["マジュロ","太平洋の環礁共和国"],zh:["马朱罗","太平洋的环礁共和国"]},
"Micronesia":{en:["Palikir","Pacific island federation"],ja:["パリキール","太平洋島嶼連邦"],zh:["帕利基尔","太平洋岛屿联邦"]},
"Monaco":{en:["Monaco","Mediterranean luxury city-state"],ja:["モナコ","地中海の豪華な都市国家"],zh:["摩纳哥","地中海的奢华城邦"]},
"Nauru":{en:["Yaren","World's smallest island nation"],ja:["ヤレン","世界最小の島国"],zh:["亚伦","世界最小的岛国"]},
"Palau":{en:["Ngerulmud","Diver's paradise"],ja:["マルキョク","ダイバーの楽園"],zh:["恩吉鲁穆德","潜水者的天堂"]},
"Palestine":{en:["Ramallah","Land of ancient holy sites"],ja:["ラマッラー","古代聖地の地"],zh:["拉姆安拉","古老圣地之地"]},
"Saint Kitts and Nevis":{en:["Basseterre","Smallest Caribbean nation"],ja:["バセテール","カリブ最小の国"],zh:["巴斯特尔","加勒比最小国家"]},
"Saint Lucia":{en:["Castries","Island of twin Pitons"],ja:["カストリーズ","双子のピトンの島"],zh:["卡斯特里","双峰皮通山之岛"]},
"Saint Vincent and the Grenadines":{en:["Kingstown","Hidden Caribbean gem"],ja:["キングスタウン","カリブの隠れた宝石"],zh:["金斯敦","加勒比的隐秘宝石"]},
"Samoa":{en:["Apia","Heart of Polynesian culture"],ja:["アピア","ポリネシア文化の心臓"],zh:["阿皮亚","波利尼西亚文化之心"]},
"San Marino":{en:["San Marino","World's oldest republic"],ja:["サンマリノ","世界最古の共和国"],zh:["圣马力诺","世界最古老的共和国"]},
"Sao Tome and Principe":{en:["São Tomé","Chocolate islands in the Gulf"],ja:["サントメ","ギニア湾のチョコレート島"],zh:["圣多美","几内亚湾的巧克力岛"]},
"Seychelles":{en:["Victoria","Garden of Eden in the Indian Ocean"],ja:["ヴィクトリア","インド洋のエデンの園"],zh:["维多利亚","印度洋的伊甸园"]},
"Solomon Islands":{en:["Honiara","Pacific war history islands"],ja:["ホニアラ","太平洋戦争の記憶の島"],zh:["霍尼亚拉","太平洋战争记忆之岛"]},
"Tonga":{en:["Nuku'alofa","Pacific kingdom"],ja:["ヌクアロファ","太平洋の王国"],zh:["努库阿洛法","太平洋王国"]},
"Tuvalu":{en:["Funafuti","Climate frontline tiny nation"],ja:["フナフティ","気候変動最前線の小国"],zh:["富纳富提","气候变化前线的小国"]},
"Vanuatu":{en:["Port Vila","Volcanic South Pacific adventure"],ja:["ポートビラ","南太平洋火山島の冒険"],zh:["维拉港","南太平洋火山岛冒险"]},
"Vatican":{en:["Vatican City","Center of world Catholicism"],ja:["バチカン市国","世界カトリックの中心"],zh:["梵蒂冈城","世界天主教中心"]},
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

  // 모바일 뒤로가기 = 닫기 (refs for latest state in event handler)
  const backStateRef = useRef({})
  backStateRef.current = { showMyTravels, showHamburger, selectedSpot, sidePanel, selectedCity, selectedCountry, showCountryInfo }
  useEffect(() => {
    window.history.replaceState({ atlas: true }, '')
    window.history.pushState({ atlas: true }, '', window.location.href)
    const handlePop = () => {
      const s = backStateRef.current
      window.history.pushState({ atlas: true }, '', window.location.href)
      if (s.showMyTravels) { setShowMyTravels(false); return }
      if (s.showHamburger) { setShowHamburger(false); return }
      if (s.selectedSpot) { setSelectedSpot(null); return }
      if (s.sidePanel) { setSidePanel(null); return }
      if (s.selectedCity) {
        setSelectedCity(null); setCityData(null); setSelectedSpot(null); setSidePanel(null);
        // 도시에서 뒤로가면 국가 줌레벨로 복귀
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
      // 국가 3단계: ① 국가정보 닫기 → ② 국가선택 해제(줌 유지) → ③ 현위치에서 줌아웃
      if (s.selectedCountry && s.showCountryInfo) {
        setShowCountryInfo(false);
        return
      }
      if (s.selectedCountry) {
        setSelectedCountry(null); setSelectedCity(null); setCityData(null); setSelectedSpot(null); setShowCountryInfo(false);
        // 줌 유지 — 이동 없음, 그 자리에서 다른 국가 선택 가능
        return
      }
      // 아무것도 열려있지 않으면 현 위치에서 줌아웃
      if (globeRef.current) {
        const pov = globeRef.current.pointOfView()
        if (pov.altitude < 2.0) {
          globeRef.current.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: Math.min(pov.altitude * 2.5, 2.5) }, 800)
        }
      }
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

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
    // hotspot/restaurant → 현재 언어로 로드된 데이터에서 place_id로 매칭
    if (item.place_id) {
      const current = [...hotspots, ...restaurants].find(p => p.place_id === item.place_id)
      if (current?.name) return current.name
    }
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
    load110m().then(processGeo).catch(() => {})
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
      globeContainerRef.current.addEventListener('touchend', (e) => {
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

                {/* 내 여행 기록 */}
                <div style={{padding:'12px 16px 14px',borderTop:'1px solid rgba(255,255,255,.08)'}}>
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
                                      <span style={{fontSize:12,fontWeight:500,color:'#cbd5e1'}}>{getCityName(c.name)}</span>
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

    </div>
  )
}

export default function AppWithBoundary() {
  return <ErrorBoundary><App /></ErrorBoundary>
}
