// 전 세계 도시 사전 관광 데이터
export const CITY_DATA = {
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
"대전": { description:"대전은 대한민국의 과학기술 중심 도시로 KAIST와 엑스포과학공원, 유성온천이 있는 충청권 최대 도시입니다.", spots:[
  {name:"국립중앙과학관", wikiTitle:"National Science Museum of Korea", type:"문화", desc:"자연사·과학기술·미래기술을 망라한 대한민국 대표 과학관으로 천체관측소도 운영합니다.", rating:4.5, openTime:"09:30~17:50", price:"무료", website:"https://www.science.go.kr"},
  {name:"한밭수목원", wikiTitle:"Hanbat Arboretum", type:"자연", desc:"도심 속 국내 최대 인공 수목원으로 동·서원이 엑스포공원을 가로지르며 계절마다 다른 풍경을 선사합니다.", rating:4.6, openTime:"06:00~20:00", price:"무료", website:"https://www.daejeon.go.kr/gar"},
  {name:"유성온천", wikiTitle:"Yuseong Hot Springs", type:"자연", desc:"27도 알칼리성 온천수로 유명한 천년 역사의 온천 관광특구로 족욕체험장이 무료로 운영됩니다.", rating:4.3, openTime:"연중", price:"족욕 무료", website:"https://en.wikipedia.org/wiki/Yuseong-gu"},
  {name:"성심당", wikiTitle:"Sungsimdang", type:"음식", desc:"1956년 창업한 대전의 전설적인 베이커리로 튀김소보로와 부추빵이 전국적으로 유명합니다.", rating:4.8, openTime:"08:00~22:00", price:"빵 2,000원~", website:"https://www.sungsimdang.co.kr"},
  {name:"대전 엑스포과학공원", wikiTitle:"Daejeon Expo Park", type:"랜드마크", desc:"1993년 대전엑스포가 열렸던 곳으로 한빛탑은 대전의 상징적 랜드마크입니다.", rating:4.2, openTime:"09:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Expo_93"},
]},
"울산": { description:"울산은 대한민국 최대 산업도시이자 고래문화와 태화강, 영남알프스를 품은 경상도 동남부의 관문입니다.", spots:[
  {name:"태화강 국가정원", wikiTitle:"Taehwagang National Garden", type:"자연", desc:"대한민국 제2호 국가정원으로 십리대숲과 계절별 꽃밭이 어우러진 도심 생태공원입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://www.ulsan.go.kr/s/garden"},
  {name:"장생포 고래문화마을", wikiTitle:"Jangsaengpo", type:"문화", desc:"대한민국 유일의 고래박물관과 고래생태체험관이 있는 옛 포경 마을을 재현한 테마 공간입니다.", rating:4.4, openTime:"09:30~18:00", price:"성인 2,000원", website:"https://www.whalecity.kr"},
  {name:"간절곶", wikiTitle:"Ganjeolgot", type:"자연", desc:"대한민국 본토에서 가장 먼저 해가 뜨는 일출 명소로 등대와 소망우체통이 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Ganjeolgot"},
  {name:"영남알프스", wikiTitle:"Yeongnam Alps", type:"자연", desc:"가지산·신불산 등 해발 1,000m급 9개 봉우리로 이루어진 한반도 남부 최대 고산 군입니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Yeongnam_Alps"},
  {name:"대왕암공원", wikiTitle:"Daewangam Park", type:"자연", desc:"신라 문무왕비의 전설이 서린 기암절벽 공원으로 동해의 푸른 파도와 해송림이 장관입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://www.ulsan.go.kr/s/daewangam"},
]},
"포항": { description:"포항은 포스코 제철소의 도시이자 호미곶 일출과 영일대해수욕장, 죽도시장 회로 유명한 경북 동해안 도시입니다.", spots:[
  {name:"호미곶", wikiTitle:"Homigot", type:"자연", desc:"한반도 동쪽 최끝단으로 '상생의 손' 조각과 일출 명소로 유명하며 새해맞이 축제가 열립니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Homigot"},
  {name:"영일대해수욕장", wikiTitle:"Yeongildae Beach", type:"자연", desc:"바다 위에 세워진 국내 최초의 해상누각 영일대가 있는 포항 대표 해변으로 야경이 특히 아름답습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Pohang"},
  {name:"죽도시장", wikiTitle:"Jukdo Market", type:"음식", desc:"동해안 최대 전통시장으로 싱싱한 회와 대게, 과메기를 현장에서 맛볼 수 있습니다.", rating:4.5, openTime:"06:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Pohang"},
  {name:"내연산 12폭포", wikiTitle:"Naeyeonsan", type:"자연", desc:"보경사 뒤편 계곡을 따라 12개의 폭포가 이어지는 트레킹 명소로 상생폭포와 관음폭포가 백미입니다.", rating:4.6, openTime:"일출~일몰", price:"성인 3,500원", website:"https://en.wikipedia.org/wiki/Naeyeonsan"},
  {name:"구룡포 일본인 가옥거리", wikiTitle:"Guryongpo", type:"문화", desc:"1883년 일제강점기 일본인 어업 이주자들이 거주했던 거리로 드라마 '동백꽃 필 무렵' 촬영지입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Guryongpo-eup"},
]},
"창원": { description:"창원은 경상남도의 도청 소재지이자 마산·진해를 아우르는 계획도시로 진해 벚꽃과 마산 아구찜으로 유명합니다.", spots:[
  {name:"진해 여좌천", wikiTitle:"Yeojwacheon", type:"자연", desc:"진해군항제 기간 약 1.5km 길이의 벚꽃터널이 형성되는 대한민국 최고의 벚꽃 명소입니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Jinhae-gu"},
  {name:"경화역 공원", wikiTitle:"Gyeonghwa Station", type:"문화", desc:"폐역된 철로 양편에 심은 벚나무가 800m 이어지는 유명 포토존으로 벚꽃 시즌 철로 배경 촬영이 일품입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Gyeonghwa_station"},
  {name:"용지호수공원", wikiTitle:"Yongji Lake Park", type:"자연", desc:"창원 시민의 대표 휴식처로 음악분수쇼가 열리며 야경 산책로로 사랑받습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Changwon"},
  {name:"마산 아구찜거리", wikiTitle:"Masan", type:"음식", desc:"전국에서 유일하게 아구찜 원조 골목이 형성된 거리로 얼큰하고 쫄깃한 마산식 아구찜을 즐길 수 있습니다.", rating:4.5, openTime:"11:00~22:00", price:"2인 30,000원~", website:"https://en.wikipedia.org/wiki/Masan"},
  {name:"돝섬 해상유원지", wikiTitle:"Dotseom", type:"랜드마크", desc:"마산만의 작은 섬을 유원지로 조성한 곳으로 요트타기와 일몰 감상이 가능합니다.", rating:4.2, openTime:"09:00~18:00", price:"왕복 페리 10,000원", website:"https://en.wikipedia.org/wiki/Masan"},
]},
"안동": { description:"안동은 유네스코 세계유산 하회마을과 도산서원, 안동찜닭과 간고등어로 대표되는 한국 정신문화의 수도입니다.", spots:[
  {name:"하회마을", wikiTitle:"Hahoe Folk Village", type:"역사", desc:"풍산 류씨 집성촌으로 낙동강이 마을을 휘감아 도는 유네스코 세계문화유산입니다.", rating:4.7, openTime:"09:00~18:00", price:"성인 5,000원", website:"https://www.hahoe.or.kr"},
  {name:"도산서원", wikiTitle:"Dosan Seowon", type:"역사", desc:"조선 성리학의 대가 퇴계 이황이 제자를 가르친 서원으로 유네스코 세계유산에 등재되어 있습니다.", rating:4.6, openTime:"09:00~18:00", price:"성인 1,500원", website:"https://www.andong.go.kr/dosanseowon"},
  {name:"월영교", wikiTitle:"Woryeonggyo Bridge", type:"랜드마크", desc:"안동호 위에 놓인 국내 최장 목책교로 야간 조명이 특히 아름답습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Andong"},
  {name:"안동 구시장 찜닭골목", wikiTitle:"Andong Jjimdak", type:"음식", desc:"안동찜닭의 원조 골목으로 30여 개 찜닭 전문점이 밀집해 있습니다.", rating:4.6, openTime:"10:00~22:00", price:"소 25,000원~", website:"https://en.wikipedia.org/wiki/Andong_jjimdak"},
  {name:"부용대", wikiTitle:"Buyongdae", type:"자연", desc:"하회마을 전경을 한눈에 내려다볼 수 있는 절벽 전망대로 낙동강 풍광이 장관입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Hahoe_Folk_Village"},
]},
"목포": { description:"목포는 전라남도 서남단의 항구도시로 유달산과 갓바위, 근대역사문화공간으로 유명한 '다도해의 관문'입니다.", spots:[
  {name:"유달산", wikiTitle:"Yudalsan", type:"자연", desc:"목포 시내와 다도해를 한눈에 내려다볼 수 있는 해발 228m의 명산으로 노적봉이 특히 유명합니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Yudalsan"},
  {name:"목포 근대역사관", wikiTitle:"Mokpo", type:"역사", desc:"옛 일본영사관을 리모델링한 박물관으로 목포의 근대 100년사를 전시합니다.", rating:4.4, openTime:"09:00~18:00", price:"성인 2,000원", website:"https://www.mokpo.go.kr/culture"},
  {name:"갓바위", wikiTitle:"Gatbawi", type:"자연", desc:"갓을 쓴 듯한 기암괴석으로 천연기념물 500호로 지정된 목포의 대표 자연경관입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mokpo"},
  {name:"목포해상케이블카", wikiTitle:"Mokpo Maritime Cable Car", type:"랜드마크", desc:"국내 최장 3.23km 해상 케이블카로 유달산과 고하도를 잇는 스카이워크입니다.", rating:4.7, openTime:"09:20~21:00", price:"왕복 성인 24,000원", website:"https://mmcablecar.com"},
  {name:"목포 홍어거리", wikiTitle:"Hongeo", type:"음식", desc:"삭힌 홍어 요리의 본고장으로 홍어삼합과 홍어애탕을 현지에서 맛볼 수 있습니다.", rating:4.3, openTime:"11:00~22:00", price:"1인 30,000원~", website:"https://en.wikipedia.org/wiki/Hongeo-hoe"},
]},
"공주": { description:"공주는 백제 문주왕이 웅진으로 천도한 475~538년 백제 두 번째 수도로 공산성과 무령왕릉 등 유네스코 세계유산을 품은 충청남도 역사도시입니다.", spots:[
  {name:"공산성", wikiTitle:"Gongsanseong", type:"역사", desc:"백제 웅진시대 왕궁을 지키던 산성으로 금강을 굽어보며 둘레 2.66km의 성벽이 남아있는 유네스코 세계유산입니다.", rating:4.6, openTime:"09:00~18:00", price:"성인 3,000원", website:"https://www.gongju.go.kr/tour"},
  {name:"무령왕릉과 왕릉원", wikiTitle:"Tomb of King Muryeong", type:"역사", desc:"1971년 발견된 백제 무령왕 부부의 벽돌무덤으로 4,600여 점의 유물이 출토된 한국 고고학 최대의 발견입니다.", rating:4.5, openTime:"09:00~18:00", price:"성인 3,000원", website:"https://royaltomb.gongju.go.kr"},
  {name:"국립공주박물관", wikiTitle:"Gongju National Museum", type:"문화", desc:"무령왕릉 출토 유물 1,000여 점을 포함한 웅진 백제 문화의 정수를 전시하는 박물관입니다.", rating:4.4, openTime:"09:00~18:00", price:"무료", website:"https://gongju.museum.go.kr"},
  {name:"마곡사", wikiTitle:"Magoksa", type:"역사", desc:"640년 창건된 천년고찰로 유네스코 세계유산 '한국의 산지승원' 중 하나입니다.", rating:4.6, openTime:"06:00~19:00", price:"성인 3,000원", website:"https://www.magoksa.or.kr"},
  {name:"공주 산성시장", wikiTitle:"Gongju", type:"음식", desc:"공산성 아래 재래시장으로 공주 밤막걸리와 국밥, 알밤빵이 유명합니다.", rating:4.3, openTime:"09:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Gongju"},
]},
"요코하마": { description:"요코하마는 일본 제2의 도시로 1859년 개항한 국제 항구이자 차이나타운, 미나토미라이 야경, 빨간 구두를 신은 소녀로 유명합니다.", spots:[
  {name:"미나토미라이 21", wikiTitle:"Minato Mirai 21", type:"랜드마크", desc:"요코하마 랜드마크 타워와 코스모 월드 대관람차가 있는 미래형 워터프론트 지구입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://www.minatomirai21.com"},
  {name:"차이나타운", wikiTitle:"Yokohama Chinatown", type:"음식", desc:"일본 최대 차이나타운으로 600여 개 중화요리점과 딤섬, 니쿠망이 유명합니다.", rating:4.5, openTime:"10:00~22:00", price:"무료", website:"https://www.chinatown.or.jp"},
  {name:"산케이엔 정원", wikiTitle:"Sankeien", type:"자연", desc:"17개의 역사적 건축물이 있는 전통 일본 정원으로 벚꽃과 단풍이 아름답습니다.", rating:4.5, openTime:"09:00~17:00", price:"700엔", website:"https://www.sankeien.or.jp"},
  {name:"컵누들 박물관", wikiTitle:"Cup Noodles Museum", type:"문화", desc:"닛신 창업자가 만든 체험형 박물관으로 나만의 컵누들을 만들 수 있습니다.", rating:4.6, openTime:"10:00~18:00", price:"500엔", website:"https://www.cupnoodles-museum.jp/ja/yokohama"},
]},
"닛코": { description:"닛코는 도쿄에서 2시간 거리의 유네스코 세계유산 도시로 도쿠가와 이에야스를 모신 닛코 도쇼구와 화려한 폭포로 유명합니다.", spots:[
  {name:"닛코 도쇼구", wikiTitle:"Nikko Toshogu", type:"역사", desc:"도쿠가와 이에야스를 모신 유네스코 세계유산 신사로 '보지 않고, 말하지 않고, 듣지 않는' 세 원숭이 조각이 유명합니다.", rating:4.7, openTime:"08:00~17:00", price:"1,300엔", website:"https://www.toshogu.jp"},
  {name:"케곤 폭포", wikiTitle:"Kegon Falls", type:"자연", desc:"97m 낙차의 일본 3대 폭포 중 하나로 엘리베이터로 폭포 아래 전망대까지 내려갈 수 있습니다.", rating:4.6, openTime:"08:00~17:00", price:"엘리베이터 570엔", website:"https://en.wikipedia.org/wiki/Kegon_Falls"},
  {name:"주젠지 호수", wikiTitle:"Lake Chuzenji", type:"자연", desc:"해발 1,269m의 고산 호수로 사계절 다른 풍경을 선사하며 가을 단풍이 절경입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Lake_Chuzenji"},
  {name:"신쿄 다리", wikiTitle:"Shinkyo Bridge", type:"랜드마크", desc:"붉은 옻칠의 아치형 나무다리로 일본 3대 기교 중 하나이자 닛코의 상징입니다.", rating:4.3, openTime:"08:00~16:00", price:"무료(건너지 않을 시)", website:"https://en.wikipedia.org/wiki/Shinkyo_(Nikko)"},
]},
"가마쿠라": { description:"가마쿠라는 도쿄에서 1시간 거리의 옛 무사 수도로 대불과 고찰, 쇼난 해변이 어우러진 관동 지역의 대표 당일치기 여행지입니다.", spots:[
  {name:"가마쿠라 대불", wikiTitle:"Kōtoku-in", type:"역사", desc:"고토쿠인의 높이 13.35m 청동 아미타불 좌상으로 1252년에 주조된 일본 국보입니다.", rating:4.7, openTime:"08:00~17:30", price:"300엔", website:"https://www.kotoku-in.jp"},
  {name:"쓰루가오카 하치만구", wikiTitle:"Tsurugaoka Hachimangu", type:"역사", desc:"가마쿠라 막부의 수호신사로 벚꽃과 연꽃이 계절마다 장관을 이루는 가마쿠라의 중심입니다.", rating:4.5, openTime:"05:00~21:00", price:"무료", website:"https://www.hachimangu.or.jp"},
  {name:"하세데라", wikiTitle:"Hasedera (Kamakura)", type:"역사", desc:"9.18m 십일면관음상과 수국으로 유명한 사찰로 전망대에서 쇼난 해안이 내려다보입니다.", rating:4.7, openTime:"08:00~16:30", price:"400엔", website:"https://www.hasedera.jp"},
  {name:"에노시마", wikiTitle:"Enoshima", type:"자연", desc:"가마쿠라 옆의 작은 섬으로 신사와 전망대, 바다 동굴이 있고 후지산 전망이 가능합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://enoshima-seacandle.com"},
]},
"다카야마": { description:"다카야마는 '작은 교토'로 불리는 에도시대 거리가 그대로 보존된 기후현 산악 도시로 고산 축제와 히다규로 유명합니다.", spots:[
  {name:"산마치스지", wikiTitle:"Takayama, Gifu", type:"역사", desc:"에도시대 상인 거리가 그대로 보존된 구시가로 전통 사케 양조장과 수공예품점이 늘어서 있습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://www.hida.jp"},
  {name:"다카야마 진야", wikiTitle:"Takayama Jinya", type:"역사", desc:"에도 막부가 직접 통치하던 당시의 관청 건물로 일본에 유일하게 원형대로 남아있습니다.", rating:4.5, openTime:"08:45~17:00", price:"440엔", website:"https://jinya.gifu.jp"},
  {name:"시라카와고", wikiTitle:"Shirakawa-gō", type:"역사", desc:"유네스코 세계유산 합장식 전통 가옥 마을로 겨울 설경이 세계적으로 유명합니다.", rating:4.8, openTime:"24시간", price:"무료", website:"https://shirakawa-go.gr.jp"},
  {name:"히다규 스테이크", wikiTitle:"Hida beef", type:"음식", desc:"일본 3대 와규 중 하나인 히다규를 현지에서 맛볼 수 있는 다카야마의 대표 음식입니다.", rating:4.8, openTime:"식당 11:00~22:00", price:"5,000엔~", website:"https://www.hida.jp"},
]},
"나가사키": { description:"나가사키는 일본 유일의 기독교 문화와 데지마 네덜란드 상관, 원폭 희생지로서의 평화 메시지가 공존하는 규슈 서부의 항구도시입니다.", spots:[
  {name:"원폭자료관", wikiTitle:"Nagasaki Atomic Bomb Museum", type:"역사", desc:"1945년 원폭 투하의 참상을 기록한 박물관으로 평화공원과 함께 세계적 평화 교육 명소입니다.", rating:4.7, openTime:"08:30~17:30", price:"200엔", website:"https://nagasakipeace.jp"},
  {name:"데지마", wikiTitle:"Dejima", type:"역사", desc:"쇄국시대 네덜란드와의 유일한 교역지였던 인공섬으로 당시 건축물이 복원되어 있습니다.", rating:4.4, openTime:"08:00~21:00", price:"520엔", website:"https://nagasakidejima.jp"},
  {name:"군함도(하시마)", wikiTitle:"Hashima Island", type:"역사", desc:"유네스코 세계유산 해저 탄광섬으로 영화 '007'에 등장한 폐허 도시 투어가 가능합니다.", rating:4.5, openTime:"투어 예약제", price:"4,000엔", website:"https://www.gunkanjima-concierge.com"},
  {name:"이나사야마 전망대", wikiTitle:"Mount Inasa", type:"자연", desc:"세계 신3대 야경으로 꼽히는 나가사키 야경을 감상할 수 있는 해발 333m 전망대입니다.", rating:4.7, openTime:"24시간(케이블카 9:00~22:00)", price:"케이블카 왕복 1,250엔", website:"https://www.nagasaki-ropeway.jp"},
]},
"구마모토": { description:"구마모토는 규슈 중앙의 성시로 일본 3대 명성 구마모토성과 구마몬 캐릭터, 아소산 화산 지형으로 유명합니다.", spots:[
  {name:"구마모토성", wikiTitle:"Kumamoto Castle", type:"역사", desc:"가토 기요마사가 축성한 일본 3대 명성 중 하나로 2016년 지진 피해 후 복원 중에도 웅장함을 자랑합니다.", rating:4.6, openTime:"09:00~17:00", price:"800엔", website:"https://castle.kumamoto-guide.jp"},
  {name:"아소산", wikiTitle:"Mount Aso", type:"자연", desc:"세계 최대급 칼데라 화산으로 분화구를 직접 볼 수 있는 활화산이자 국립공원입니다.", rating:4.7, openTime:"분화구 08:30~18:00", price:"무료", website:"https://www.aso.ne.jp"},
  {name:"스이젠지 조주엔", wikiTitle:"Suizenji Jōjuen", type:"자연", desc:"도카이도 53차를 축소해 조성한 에도시대 회유식 정원으로 후지산을 모방한 언덕이 특징입니다.", rating:4.4, openTime:"07:30~18:00", price:"400엔", website:"https://www.suizenji.or.jp"},
  {name:"구로카와 온천", wikiTitle:"Kurokawa Onsen", type:"자연", desc:"아소 인근의 전통 료칸 온천 마을로 3곳의 노천탕을 순회할 수 있는 '입유수형(入湯手形)' 이용권이 유명합니다.", rating:4.8, openTime:"료칸별 상이", price:"수형 1,500엔", website:"https://www.kurokawaonsen.or.jp"},
]},
"벳푸": { description:"벳푸는 일본 최대 온천 용출량을 자랑하는 오이타현의 온천 도시로 '지옥순례'와 모래찜질, 석유가 필요 없는 증기 도시로 유명합니다.", spots:[
  {name:"벳푸 지옥순례", wikiTitle:"Beppu", type:"자연", desc:"바다지옥, 피의지옥 등 7개의 독특한 색과 형태의 천연 온천을 순례하는 벳푸의 대표 관광 코스입니다.", rating:4.6, openTime:"08:00~17:00", price:"공통관람권 2,200엔", website:"https://www.beppu-jigoku.com"},
  {name:"다케가와라 온천", wikiTitle:"Takegawara Onsen", type:"랜드마크", desc:"1879년 건립된 메이지시대 목조 공중욕탕으로 모래찜질 체험이 유명한 벳푸의 상징입니다.", rating:4.4, openTime:"06:30~22:30", price:"입욕 100엔/모래찜질 1,500엔", website:"https://en.wikipedia.org/wiki/Takegawara_Onsen"},
  {name:"묘반 온천", wikiTitle:"Myōban Onsen", type:"자연", desc:"초가지붕 증기 오두막이 늘어선 산중 온천 지구로 유노하나(탕의 꽃)라는 온천 소금을 만듭니다.", rating:4.5, openTime:"10:00~21:00", price:"입욕 600엔~", website:"https://en.wikipedia.org/wiki/Myoban_Onsen"},
  {name:"유후인", wikiTitle:"Yufuin", type:"자연", desc:"벳푸 옆 아담한 온천 마을로 유후다케 산을 배경으로 한 긴린코 호수와 공예품 거리가 낭만적입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://www.yufuin.gr.jp"},
]},
"센다이": { description:"센다이는 도호쿠 최대 도시이자 다테 마사무네의 성시로 '숲의 도시(杜の都)'로 불리는 미야기현의 문화·상업 중심지입니다.", spots:[
  {name:"센다이성(아오바성)", wikiTitle:"Sendai Castle", type:"역사", desc:"다테 마사무네가 1600년 축성한 산성 터로 마사무네 기마상이 있는 아오바야마 공원에서 센다이 시내가 한눈에 내려다보입니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://www.sendaijyo.com"},
  {name:"마쓰시마", wikiTitle:"Matsushima", type:"자연", desc:"일본 3경 중 하나로 260여 개의 소나무 섬이 바다 위에 흩어져 있는 동북 최고의 풍경지입니다.", rating:4.6, openTime:"유람선 09:00~16:00", price:"유람선 1,500엔", website:"https://www.matsushima-kanko.com"},
  {name:"즈이호덴", wikiTitle:"Zuihōden", type:"역사", desc:"다테 마사무네의 영묘로 극채색의 모모야마 양식이 화려한 도호쿠를 대표하는 사적입니다.", rating:4.5, openTime:"09:00~16:30", price:"570엔", website:"https://www.zuihoden.com"},
  {name:"규탕(우설 요리)", wikiTitle:"Gyūtan", type:"음식", desc:"센다이의 명물로 통통한 소 혀를 숯불에 구워내는 정통 규탕 전문점이 시내 곳곳에 있습니다.", rating:4.7, openTime:"11:00~22:00", price:"정식 2,500엔~", website:"https://www.sentabi.jp"},
]},
"광저우": { description:"광저우는 중국 남부의 중심 도시이자 광둥요리의 본고장, 2,200년 역사의 해상실크로드 시발지로 딤섬과 차 문화가 발달했습니다.", spots:[
  {name:"광저우타워", wikiTitle:"Canton Tower", type:"랜드마크", desc:"높이 600m의 트위스트 형태 전파탑으로 야경이 화려하며 전망대와 스릴 놀이기구가 있습니다.", rating:4.7, openTime:"09:30~22:30", price:"228위안", website:"https://www.cantontower.com"},
  {name:"천허청", wikiTitle:"Chen Clan Ancestral Hall", type:"역사", desc:"청나라 1894년 건립된 광둥 최대 종친 사당으로 정교한 목조·석조 조각 예술이 집약되어 있습니다.", rating:4.5, openTime:"08:30~17:30", price:"10위안", website:"https://en.wikipedia.org/wiki/Chen_Clan_Ancestral_Hall"},
  {name:"샤멘섬", wikiTitle:"Shamian Island", type:"문화", desc:"19세기 영국·프랑스 조계지였던 작은 섬으로 유럽풍 건축물과 고풍스러운 카페가 있는 산책 명소입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Shamian_Island"},
  {name:"딤섬(음차)", wikiTitle:"Dim sum", type:"음식", desc:"광저우의 명물 음차 문화로 광둥 레스토랑에서 다양한 딤섬을 차와 함께 즐기는 것이 전통입니다.", rating:4.8, openTime:"07:00~15:00", price:"1인 100위안~", website:"https://en.wikipedia.org/wiki/Dim_sum"},
]},
"선전": { description:"선전은 1980년 경제특구 지정 이후 어촌에서 인구 1,700만 메가시티로 성장한 중국의 실리콘밸리이자 첨단 기술·디자인의 중심지입니다.", spots:[
  {name:"화창베이", wikiTitle:"Huaqiangbei", type:"랜드마크", desc:"세계 최대 전자상가로 반도체 부품부터 완제품까지 없는 것이 없는 중국 전자의 성지입니다.", rating:4.5, openTime:"10:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Huaqiangbei"},
  {name:"OCT하베이", wikiTitle:"OCT Harbour", type:"문화", desc:"화차오청그룹의 복합 예술·쇼핑·테마파크 지구로 디자인 호텔과 현대미술관이 모여 있습니다.", rating:4.4, openTime:"10:00~22:00", price:"무료", website:"https://www.octharbour.com"},
  {name:"선전 만 공원", wikiTitle:"Shenzhen Bay Park", type:"자연", desc:"홍콩과 마주한 해안 공원으로 13km 자전거 도로와 철새 관찰지로 인기입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Shenzhen_Bay_Sports_Center"},
  {name:"세계의 창", wikiTitle:"Window of the World", type:"랜드마크", desc:"전 세계 130여 개 랜드마크를 축소 재현한 테마파크로 에펠탑, 피라미드 등을 하루에 돌아볼 수 있습니다.", rating:4.3, openTime:"09:00~22:30", price:"200위안", website:"https://www.szwwco.com"},
]},
"충칭": { description:"충칭은 장강과 가릉강이 만나는 산악 도시로 인구 3,200만의 중국 4대 직할시이자 훠궈와 홍애 야경으로 유명합니다.", spots:[
  {name:"홍애동", wikiTitle:"Hongya Cave", type:"랜드마크", desc:"절벽 위에 11층 구조로 세워진 전통 목조 건축 테마거리로 야경이 미야자키 애니메이션을 연상시킵니다.", rating:4.6, openTime:"11:00~23:00", price:"무료", website:"https://en.wikipedia.org/wiki/Hongyadong"},
  {name:"다주 석각", wikiTitle:"Dazu Rock Carvings", type:"역사", desc:"유네스코 세계유산 불교·도교·유교 석각군으로 5만여 점의 정교한 조각이 당송대 예술의 정수를 보여줍니다.", rating:4.7, openTime:"08:30~18:00", price:"135위안", website:"https://en.wikipedia.org/wiki/Dazu_Rock_Carvings"},
  {name:"양쯔강 삭도", wikiTitle:"Yangtze River Cableway", type:"랜드마크", desc:"양쯔강을 가로지르는 공중 케이블카로 충칭의 산악 도시 풍경과 강변 야경을 한눈에 볼 수 있습니다.", rating:4.5, openTime:"07:30~22:30", price:"편도 20위안", website:"https://en.wikipedia.org/wiki/Yangtze_River_Cableway"},
  {name:"쓰촨 훠궈", wikiTitle:"Chongqing hot pot", type:"음식", desc:"충칭의 매운 홍탕 훠궈는 산초와 고추의 마라 맛이 중국 최고로 유명하며 현지 훠궈 체인이 수백 개 있습니다.", rating:4.8, openTime:"11:00~02:00", price:"1인 80위안~", website:"https://en.wikipedia.org/wiki/Chongqing_hot_pot"},
]},
"우한": { description:"우한은 장강 중류의 교통 요충지이자 '삼국지' 적벽대전의 무대 주변 도시로 황학루와 벚꽃 대학 캠퍼스로 유명합니다.", spots:[
  {name:"황학루", wikiTitle:"Yellow Crane Tower", type:"역사", desc:"중국 4대 명루 중 하나로 장강을 굽어보는 51m 5층 목조탑이며 이백·최호 등이 시를 남긴 명소입니다.", rating:4.6, openTime:"08:00~18:30", price:"70위안", website:"https://www.cnhhl.com"},
  {name:"동호", wikiTitle:"East Lake (Wuhan)", type:"자연", desc:"시후의 6배 크기인 중국 최대 도시 호수로 벚꽃·매화·연꽃 계절별 풍경이 장관입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/East_Lake_(Wuhan)"},
  {name:"우한대학 벚꽃", wikiTitle:"Wuhan University", type:"자연", desc:"중국 3대 벚꽃 명소 중 하나로 3월 하순 1,000여 그루의 벚꽃이 캠퍼스를 물들입니다.", rating:4.7, openTime:"벚꽃철 예약제", price:"무료(예약 필수)", website:"https://www.whu.edu.cn"},
  {name:"츠바이지에 먹거리골목", wikiTitle:"Wuhan", type:"음식", desc:"우한 최고의 아침식사 거리로 러간몐(열건면)과 더우피(두부 부침)가 우한의 대표 맛입니다.", rating:4.5, openTime:"05:00~12:00", price:"10위안~", website:"https://en.wikipedia.org/wiki/Wuhan"},
]},
"칭다오": { description:"칭다오는 독일 조차지의 유럽풍 건축과 맥주 문화가 남아있는 산둥반도의 해변 도시로 중국 3대 여름 휴양지입니다.", spots:[
  {name:"칭다오 맥주박물관", wikiTitle:"Tsingtao Brewery", type:"문화", desc:"1903년 독일인이 설립한 칭다오맥주의 100년 역사를 전시한 박물관으로 신선한 생맥주 시음도 가능합니다.", rating:4.7, openTime:"08:30~17:30", price:"60위안", website:"https://en.wikipedia.org/wiki/Tsingtao_Brewery"},
  {name:"잔교", wikiTitle:"Zhanqiao Pier", type:"랜드마크", desc:"1891년 건설된 440m 해상 잔교로 칭다오의 상징이자 회란각 전망대에서 해변이 한눈에 보입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Qingdao"},
  {name:"바다샹 공원", wikiTitle:"Badaguan", type:"문화", desc:"독일·러시아·이탈리아 등 10여 개국 양식의 별장 200여 동이 보존된 이국적인 산책로입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Badaguan"},
  {name:"라오산", wikiTitle:"Mount Lao", type:"자연", desc:"중국 도교의 성지로 해발 1,133m 해안 산악으로 바다와 산이 만나는 절경을 자랑합니다.", rating:4.6, openTime:"06:30~16:00", price:"130위안", website:"https://en.wikipedia.org/wiki/Mount_Lao"},
]},
"다롄": { description:"다롄은 러시아·일본 조차 흔적이 남은 랴오둥반도 남단의 해변 도시로 해산물과 광장 건축이 유명합니다.", spots:[
  {name:"싱하이 광장", wikiTitle:"Xinghai Square", type:"랜드마크", desc:"세계에서 가장 큰 광장(110만㎡)으로 다롄 100주년 기념탑과 화강암 발자국 조형물이 있습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Xinghai_Square"},
  {name:"진스탄 해변", wikiTitle:"Dalian", type:"자연", desc:"'황금 모래사장'이라는 뜻의 해변으로 해양공원과 테마파크가 함께 있어 가족 여행에 인기입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Dalian"},
  {name:"러시아풍 거리", wikiTitle:"Dalian", type:"문화", desc:"러시아 조차기 건축물이 보존된 거리로 유럽풍 카페와 기념품점이 낭만적입니다.", rating:4.2, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Dalian"},
  {name:"노호탄 해양공원", wikiTitle:"Laohutan Ocean Park", type:"자연", desc:"호랑이 형상의 거석 해안을 활용한 해양 테마파크로 돌고래쇼와 아쿠아리움이 있습니다.", rating:4.4, openTime:"08:30~17:30", price:"220위안", website:"https://en.wikipedia.org/wiki/Laohutan"},
]},
"하얼빈": { description:"하얼빈은 헤이룽장성의 도시로 러시아풍 건축과 매년 1월 세계 최대의 국제 빙설제가 열리는 중국 최북단 관광지입니다.", spots:[
  {name:"하얼빈 빙설대세계", wikiTitle:"Harbin Ice and Snow World", type:"랜드마크", desc:"매년 겨울 송화강 얼음으로 만든 초대형 얼음 궁전 테마파크로 세계 3대 겨울 축제입니다.", rating:4.9, openTime:"11:00~21:30(12~2월)", price:"330위안", website:"https://en.wikipedia.org/wiki/Harbin_Ice_and_Snow_World"},
  {name:"중앙대가", wikiTitle:"Central Street, Harbin", type:"문화", desc:"1898년 건설된 1.4km 석조 보행자 거리로 러시아·유럽풍 건물 71동이 보존되어 있습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Central_Street"},
  {name:"성소피아 성당", wikiTitle:"Saint Sophia Cathedral, Harbin", type:"역사", desc:"1907년 러시아인이 세운 비잔틴양식 정교회로 극동 최대 규모를 자랑하며 현재는 건축예술박물관입니다.", rating:4.6, openTime:"08:30~17:00", price:"20위안", website:"https://en.wikipedia.org/wiki/Saint_Sophia_Cathedral,_Harbin"},
  {name:"태양도 공원", wikiTitle:"Sun Island", type:"자연", desc:"송화강의 섬 공원으로 겨울엔 눈 조각 예술제, 여름엔 수상 레저를 즐길 수 있습니다.", rating:4.5, openTime:"08:00~17:30", price:"30위안", website:"https://en.wikipedia.org/wiki/Sun_Island"},
]},
"톈진": { description:"톈진은 베이징에서 120km 거리의 항구도시로 19세기 9개국 조계지의 이국적 건축과 중국 만담 '상성'의 본고장입니다.", spots:[
  {name:"톈진의 눈", wikiTitle:"Tianjin Eye", type:"랜드마크", desc:"하이허강 다리 위에 세워진 세계 유일의 다리 위 대관람차로 높이 120m에서 야경이 장관입니다.", rating:4.5, openTime:"09:30~21:30", price:"70위안", website:"https://en.wikipedia.org/wiki/Tianjin_Eye"},
  {name:"우다다오", wikiTitle:"Five Great Avenues", type:"문화", desc:"'만국건축박람회'로 불리는 2km 거리로 230여 동의 영·프·독·이탈리아식 저택이 보존되어 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Five_Great_Avenues"},
  {name:"고문화가", wikiTitle:"Tianjin Ancient Culture Street", type:"문화", desc:"명·청대 양식의 전통 거리로 톈진 전통 공예품인 니런장 인형과 양류칭 목판화가 유명합니다.", rating:4.4, openTime:"09:00~19:00", price:"무료", website:"https://en.wikipedia.org/wiki/Tianjin"},
  {name:"거우부리 만두", wikiTitle:"Goubuli", type:"음식", desc:"1858년 창업한 톈진 3대 음식 중 하나로 18개의 정교한 주름을 가진 '개도 거들떠보지 않는' 만두가 명물입니다.", rating:4.6, openTime:"10:00~21:00", price:"60위안~", website:"https://en.wikipedia.org/wiki/Goubuli"},
]},
"수코타이": { description:"수코타이는 1238~1438년 태국 최초의 왕국 수코타이 왕조의 수도로 유네스코 세계유산 유적공원이 있는 고도입니다.", spots:[
  {name:"수코타이 역사공원", wikiTitle:"Sukhothai Historical Park", type:"역사", desc:"유네스코 세계유산으로 13~14세기 수코타이 왕조의 궁전·사원 193곳이 분포한 70㎢의 대규모 유적지입니다.", rating:4.8, openTime:"06:30~19:30", price:"100바트", website:"https://en.wikipedia.org/wiki/Sukhothai_Historical_Park"},
  {name:"왓 마하탓", wikiTitle:"Wat Mahathat, Sukhothai", type:"역사", desc:"수코타이 역사공원 중심의 왕실 사원으로 연꽃 봉오리 모양 쳇디와 거대한 불상이 상징적입니다.", rating:4.7, openTime:"06:30~19:30", price:"공원 입장권 포함", website:"https://en.wikipedia.org/wiki/Wat_Mahathat,_Sukhothai"},
  {name:"왓 시촘", wikiTitle:"Wat Si Chum", type:"역사", desc:"높이 15m의 좌불상 '프라 아차나'가 좁은 만다파 내부에 모셔져 있어 문 틈 사이로 거대한 불상을 볼 수 있습니다.", rating:4.7, openTime:"06:30~19:30", price:"공원 입장권 포함", website:"https://en.wikipedia.org/wiki/Wat_Si_Chum"},
  {name:"로이끄라통 축제", wikiTitle:"Loi Krathong", type:"문화", desc:"수코타이에서 기원한 물의 축제로 매년 11월 보름 연꽃 등불을 강에 띄우는 장관이 펼쳐집니다.", rating:4.9, openTime:"11월 보름", price:"무료", website:"https://en.wikipedia.org/wiki/Loi_Krathong"},
]},
"깐차나부리": { description:"깐차나부리는 방콕에서 130km 거리의 역사 도시로 영화 '콰이강의 다리' 배경이자 에라완 폭포로 유명합니다.", spots:[
  {name:"콰이강의 다리", wikiTitle:"Bridge on the River Kwai", type:"역사", desc:"제2차 세계대전 당시 일본군이 전쟁포로를 동원해 건설한 '죽음의 철도' 다리로 동명 영화로 유명합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Bridge_over_the_River_Kwai"},
  {name:"에라완 폭포", wikiTitle:"Erawan Falls", type:"자연", desc:"7단계의 에메랄드빛 폭포와 천연 수영장으로 태국 최고의 트레킹 폭포입니다.", rating:4.7, openTime:"08:00~16:30", price:"300바트", website:"https://en.wikipedia.org/wiki/Erawan_National_Park"},
  {name:"헬파이어 패스", wikiTitle:"Hellfire Pass", type:"역사", desc:"'죽음의 철도' 중 가장 혹독했던 구간으로 호주 정부가 관리하는 전쟁박물관과 기념 트레일이 있습니다.", rating:4.6, openTime:"09:00~16:00", price:"무료(기부)", website:"https://en.wikipedia.org/wiki/Hellfire_Pass"},
  {name:"새프 사완 국립공원", wikiTitle:"Sai Yok National Park", type:"자연", desc:"콰이강을 따라 이어지는 열대우림 국립공원으로 뗏목 숙박과 동굴 탐험이 가능합니다.", rating:4.5, openTime:"08:00~18:00", price:"300바트", website:"https://en.wikipedia.org/wiki/Sai_Yok_National_Park"},
]},
"후아힌": { description:"후아힌은 태국 왕실 휴양지로 유명한 샴만의 해변 도시로 방콕에서 3시간 거리이며 가족 여행지로 인기입니다.", spots:[
  {name:"후아힌 해변", wikiTitle:"Hua Hin", type:"자연", desc:"5km의 넓고 고운 백사장으로 왕실 별궁 '끌라이깡완'이 있는 태국 왕실 지정 휴양지입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Hua_Hin_District"},
  {name:"후아힌 기차역", wikiTitle:"Hua Hin Railway Station", type:"역사", desc:"1926년 라마 6세 때 건설된 태국에서 가장 오래된 기차역으로 왕실 전용 대합실이 남아있습니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Hua_Hin_Railway_Station"},
  {name:"차도 선데이 나이트 마켓", wikiTitle:"Hua Hin", type:"음식", desc:"매주 일요일 열리는 야시장으로 해산물 요리와 태국식 간식이 저렴하게 판매됩니다.", rating:4.5, openTime:"일 17:00~23:00", price:"무료", website:"https://en.wikipedia.org/wiki/Hua_Hin_District"},
  {name:"몬순 밸리 빈야드", wikiTitle:"Hua Hin", type:"자연", desc:"태국의 몇 안 되는 포도농장 와이너리로 시음 투어와 전망 레스토랑이 운영됩니다.", rating:4.6, openTime:"09:00~18:00", price:"투어 450바트", website:"https://monsoonvalley.com"},
]},
"코타오": { description:"코타오는 '거북섬'이라는 뜻의 작은 섬으로 세계적 스쿠버다이빙 성지이자 PADI 자격증 취득 세계 1위입니다.", spots:[
  {name:"샤크 베이", wikiTitle:"Ko Tao", type:"자연", desc:"산호와 열대어가 풍부한 스노클링·다이빙 포인트로 블랙팁 상어를 만날 수 있습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Ko_Tao"},
  {name:"난영 섬", wikiTitle:"Ko Nang Yuan", type:"자연", desc:"세 개의 섬이 모래톱으로 연결된 태국 엽서 사진의 대표 풍경으로 섬 전망대에서 뷰가 환상적입니다.", rating:4.8, openTime:"10:00~16:00", price:"입섬료 150바트", website:"https://en.wikipedia.org/wiki/Ko_Nang_Yuan"},
  {name:"프리덤 비치", wikiTitle:"Ko Tao", type:"자연", desc:"정글을 지나야 만나는 숨겨진 해변으로 인적이 드문 프라이빗 비치 분위기입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Ko_Tao"},
  {name:"존 수완 뷰포인트", wikiTitle:"Ko Tao", type:"자연", desc:"코타오에서 가장 높은 뷰포인트로 샤크 베이와 차론 베이가 내려다보입니다.", rating:4.6, openTime:"일출~일몰", price:"무료", website:"https://en.wikipedia.org/wiki/Ko_Tao"},
]},
"코팡안": { description:"코팡안은 매달 보름밤 풀문파티로 세계 배낭여행자들이 모이는 섬이자 요가·명상 리트릿의 중심지입니다.", spots:[
  {name:"할린 비치 풀문파티", wikiTitle:"Full Moon Party", type:"문화", desc:"매달 보름밤 할린 비치에서 열리는 세계적 파티로 수만 명이 모여 밤새 해변을 달굽니다.", rating:4.5, openTime:"보름 21:00~06:00", price:"100바트", website:"https://en.wikipedia.org/wiki/Full_Moon_Party"},
  {name:"보통 폭포", wikiTitle:"Ko Pha-ngan", type:"자연", desc:"3단 폭포로 정글 트레킹 후 닿을 수 있는 천연 수영장으로 시원한 휴식처입니다.", rating:4.4, openTime:"09:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Ko_Pha-ngan"},
  {name:"시크릿 비치(해닷)", wikiTitle:"Ko Pha-ngan", type:"자연", desc:"섬 북쪽의 조용한 해변으로 스노클링과 일몰이 아름답고 요가 리트릿이 많이 있습니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Ko_Pha-ngan"},
  {name:"왓 프라투 차이", wikiTitle:"Ko Pha-ngan", type:"역사", desc:"섬에서 가장 큰 불교 사원으로 거대한 황금 좌불상과 전망대가 있습니다.", rating:4.3, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Ko_Pha-ngan"},
]},
"코창": { description:"코창은 태국에서 세 번째로 큰 섬으로 '코끼리 섬'이라는 뜻이며 방콕 근처이면서도 덜 개발된 청정 해변이 매력적입니다.", spots:[
  {name:"화이트 샌드 비치", wikiTitle:"Ko Chang", type:"자연", desc:"코창에서 가장 긴 해변으로 고운 백사장과 맑은 바다가 있어 가족 여행지로 인기입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Ko_Chang_(Trat)"},
  {name:"클롱 플루 폭포", wikiTitle:"Ko Chang", type:"자연", desc:"25m 높이의 3단 폭포로 정글 트레킹과 천연 수영장 체험이 가능합니다.", rating:4.6, openTime:"08:00~17:00", price:"200바트", website:"https://en.wikipedia.org/wiki/Ko_Chang_(Trat)"},
  {name:"로나 베이", wikiTitle:"Ko Chang", type:"자연", desc:"스노클링과 보트 투어의 출발점으로 주변 섬 4~5곳을 돌아보는 투어가 인기입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Ko_Chang_(Trat)"},
  {name:"반 살락콕 어촌마을", wikiTitle:"Ko Chang", type:"문화", desc:"수상 가옥에서 전통 어업을 이어가는 어촌 마을로 해산물 레스토랑이 유명합니다.", rating:4.4, openTime:"10:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Ko_Chang_(Trat)"},
]},
"코란타": { description:"코란타는 푸켓 남쪽 안다만해의 두 섬(코란타 야이·코란타 노이)으로 조용한 비치와 라스타파리안 분위기가 특징입니다.", spots:[
  {name:"롱 비치", wikiTitle:"Ko Lanta", type:"자연", desc:"코란타 서부의 4km 해변으로 일몰이 아름답고 해변 바와 레스토랑이 늘어서 있습니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Ko_Lanta_Yai"},
  {name:"코란타 국립공원", wikiTitle:"Mu Ko Lanta National Park", type:"자연", desc:"코란타 남단의 해양 국립공원으로 등대와 원숭이 출몰 정글 트레일이 있습니다.", rating:4.5, openTime:"08:00~17:00", price:"200바트", website:"https://en.wikipedia.org/wiki/Mu_Ko_Lanta_National_Park"},
  {name:"올드타운 란타", wikiTitle:"Ko Lanta", type:"문화", desc:"바다 집시·중국 상인들이 100년 전 형성한 목조 수상 가옥 마을로 시푸드 레스토랑이 유명합니다.", rating:4.4, openTime:"10:00~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Ko_Lanta_Yai"},
  {name:"클라라 동굴", wikiTitle:"Ko Lanta", type:"자연", desc:"석회암 동굴 투어로 종유석과 지하 방을 탐험하는 어드벤처 액티비티입니다.", rating:4.4, openTime:"09:00~16:00", price:"투어 500바트~", website:"https://en.wikipedia.org/wiki/Ko_Lanta_Yai"},
]},
"람빵": { description:"람빵은 치앙마이 남동쪽의 오래된 도시로 태국 유일 마차 교통과 흰코끼리 보호소, 도자기 공예로 유명합니다.", spots:[
  {name:"왓 프라 탓 람팡 루앙", wikiTitle:"Wat Phra That Lampang Luang", type:"역사", desc:"14세기에 건립된 란나 양식 사원으로 태국 최고의 목조 건축물 중 하나로 꼽힙니다.", rating:4.7, openTime:"07:30~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Wat_Phra_That_Lampang_Luang"},
  {name:"람빵 마차 투어", wikiTitle:"Lampang", type:"문화", desc:"태국 유일의 마차 교통 도시로 구시가지와 왓 프라깨오 둔다오를 도는 마차 투어가 명물입니다.", rating:4.5, openTime:"08:00~18:00", price:"30분 300바트", website:"https://en.wikipedia.org/wiki/Lampang"},
  {name:"태국 코끼리 보전 센터", wikiTitle:"Thai Elephant Conservation Center", type:"자연", desc:"태국 왕실 후원 아래 운영되는 국립 흰코끼리 보호소로 쇼가 아닌 진정한 코끼리 생태 관찰이 가능합니다.", rating:4.6, openTime:"09:00~16:30", price:"300바트", website:"https://www.thailandelephant.org"},
  {name:"반 사오 낙", wikiTitle:"Lampang", type:"역사", desc:"100개 이상의 티크 기둥으로 지은 19세기 전통 목조 가옥으로 람빵 버마계 상인 문화 박물관입니다.", rating:4.4, openTime:"10:00~17:00", price:"50바트", website:"https://en.wikipedia.org/wiki/Lampang"},
]},
"핏사눌로크": { description:"핏사눌로크는 수코타이와 치앙마이 사이의 중간 거점 도시로 태국에서 가장 아름다운 불상이 모셔진 왓 프라 씨 마하탓이 유명합니다.", spots:[
  {name:"왓 프라 씨 라타나 마하탓", wikiTitle:"Wat Phra Si Rattana Mahathat", type:"역사", desc:"태국에서 가장 아름다운 불상 '프라 풋타 친나랏'이 모셔진 사원으로 방콕 에메랄드 사원보다 먼저 있던 곳입니다.", rating:4.8, openTime:"06:30~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Wat_Phra_Si_Rattana_Mahathat"},
  {name:"나레수언 왕 박물관", wikiTitle:"Naresuan", type:"역사", desc:"태국을 구한 전설의 나레수언 대왕의 생애와 버마 전쟁을 전시하는 역사박물관입니다.", rating:4.3, openTime:"09:00~16:00", price:"무료", website:"https://en.wikipedia.org/wiki/Naresuan"},
  {name:"사게즈 라이프 민속박물관", wikiTitle:"Phitsanulok", type:"문화", desc:"태국 중부 전통 민속품 10만여 점을 수집한 민속박물관으로 한 개인의 평생 수집품입니다.", rating:4.5, openTime:"08:30~16:30", price:"50바트", website:"https://en.wikipedia.org/wiki/Phitsanulok"},
  {name:"난 강변 야시장", wikiTitle:"Phitsanulok", type:"음식", desc:"매일 저녁 열리는 강변 나이트 마켓으로 핏사눌로크의 대표 음식 '데치는 공중 채소볶음'이 유명합니다.", rating:4.5, openTime:"17:00~23:00", price:"무료", website:"https://en.wikipedia.org/wiki/Phitsanulok"},
]},
"부리람": { description:"부리람은 '행복의 도시'라는 뜻의 이산 지방 도시로 크메르 유적 파놈룽과 동남아 최대 축구 경기장이 유명합니다.", spots:[
  {name:"파놈룽 역사공원", wikiTitle:"Phanom Rung", type:"역사", desc:"사화산 정상에 세워진 11세기 크메르 힌두 사원으로 앙코르 이전 석조 건축의 걸작입니다.", rating:4.8, openTime:"06:00~18:00", price:"100바트", website:"https://en.wikipedia.org/wiki/Phanom_Rung_Historical_Park"},
  {name:"창 아레나", wikiTitle:"Chang Arena", type:"랜드마크", desc:"3만 관중을 수용하는 동남아시아 최대 프로축구 전용구장으로 부리람 유나이티드의 홈입니다.", rating:4.6, openTime:"경기일", price:"경기 티켓", website:"https://en.wikipedia.org/wiki/Chang_Arena"},
  {name:"부리람 국제 서킷", wikiTitle:"Chang International Circuit", type:"랜드마크", desc:"모토GP와 투어링카 월드챔피언십이 열리는 FIA급 4.5km 레이싱 서킷입니다.", rating:4.7, openTime:"행사일", price:"행사 티켓", website:"https://en.wikipedia.org/wiki/Chang_International_Circuit"},
  {name:"이산 전통요리", wikiTitle:"Isan", type:"음식", desc:"부리람 일대 이산 요리의 본고장으로 솜땀(파파야샐러드)과 까이양(닭구이), 라압이 유명합니다.", rating:4.7, openTime:"10:00~22:00", price:"1인 100바트~", website:"https://en.wikipedia.org/wiki/Isan_food"},
]},
"벵갈루루": { description:"벵갈루루는 인도 IT 수도로 인구 1,300만의 남인도 중심지이자 정원의 도시로 불리는 카르나타카주 주도입니다.", spots:[
  {name:"랄바그 식물원", wikiTitle:"Lalbagh", type:"자연", desc:"티푸 술탄이 1760년 조성한 240에이커 영국식 식물원으로 3,000여 종의 식물을 보유하고 있습니다.", rating:4.5, openTime:"06:00~19:00", price:"외국인 150루피", website:"https://en.wikipedia.org/wiki/Lal_Bagh"},
  {name:"방갈로르 궁전", wikiTitle:"Bangalore Palace", type:"역사", desc:"1887년 영국 윈저성을 모방해 지은 튜더 양식 궁전으로 마이소르 왕가의 거주지였습니다.", rating:4.3, openTime:"10:00~17:30", price:"외국인 460루피", website:"https://en.wikipedia.org/wiki/Bangalore_Palace"},
  {name:"크베이펫", wikiTitle:"Bangalore", type:"문화", desc:"전통 시장과 800년 된 사원이 있는 올드 벵갈루루의 심장부로 현지 상점 순례가 가능합니다.", rating:4.3, openTime:"09:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Bangalore"},
  {name:"UB 시티", wikiTitle:"UB City", type:"문화", desc:"인도 IT 기업 유나이티드 브루어리스가 개발한 럭셔리 복합단지로 명품 쇼핑과 파인다이닝의 중심입니다.", rating:4.5, openTime:"11:00~23:00", price:"무료", website:"https://en.wikipedia.org/wiki/UB_City"},
]},
"첸나이": { description:"첸나이는 타밀나두주 주도이자 남인도 관문으로 영국 식민지 시대 유산과 드라비다 힌두 문화, 해변으로 유명합니다.", spots:[
  {name:"마리나 비치", wikiTitle:"Marina Beach", type:"자연", desc:"13km의 세계에서 두 번째로 긴 도시 해변으로 첸나이 시민의 대표 휴식처입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Marina_Beach"},
  {name:"카팔리슈와라 사원", wikiTitle:"Kapaleeshwarar Temple", type:"역사", desc:"7세기 팔라바 왕조가 세운 시바 사원으로 37m 고푸라탑과 남인도 드라비다 건축의 정수를 보여줍니다.", rating:4.7, openTime:"05:30~22:00", price:"무료", website:"https://en.wikipedia.org/wiki/Kapaleeshwarar_Temple"},
  {name:"포트 세인트 조지", wikiTitle:"Fort St. George, India", type:"역사", desc:"1644년 영국 동인도회사가 건설한 인도 최초의 영국 요새로 현재는 타밀나두주 의사당입니다.", rating:4.4, openTime:"09:00~17:00", price:"외국인 200루피", website:"https://en.wikipedia.org/wiki/Fort_St._George,_India"},
  {name:"마하발리푸람", wikiTitle:"Mahabalipuram", type:"역사", desc:"첸나이 남쪽 60km의 유네스코 세계유산 석조 유적군으로 7세기 해안 사원이 압권입니다.", rating:4.8, openTime:"06:00~18:00", price:"외국인 600루피", website:"https://en.wikipedia.org/wiki/Group_of_Monuments_at_Mahabalipuram"},
]},
"하이데라바드": { description:"하이데라바드는 텔랑가나주 주도로 400년 니잠 왕조의 이슬람 문화와 인도 IT 허브 'HITEC City'가 공존하는 도시입니다.", spots:[
  {name:"차르미나르", wikiTitle:"Charminar", type:"역사", desc:"1591년 세워진 56m 4개 첨탑 개선문으로 하이데라바드의 상징이자 옛 성벽도시의 중심입니다.", rating:4.5, openTime:"09:30~17:30", price:"외국인 250루피", website:"https://en.wikipedia.org/wiki/Charminar"},
  {name:"골콘다 요새", wikiTitle:"Golconda Fort", type:"역사", desc:"13세기부터 발전한 다이아몬드의 요새 도시로 '코이누르 다이아몬드'가 여기서 채굴됐습니다.", rating:4.6, openTime:"09:00~17:30", price:"외국인 300루피", website:"https://en.wikipedia.org/wiki/Golconda_Fort"},
  {name:"라모지 필름 시티", wikiTitle:"Ramoji Film City", type:"문화", desc:"세계 최대 통합 영화 제작 복합단지로 기네스북 등재되었으며 일반인 투어가 가능합니다.", rating:4.4, openTime:"09:00~17:30", price:"1,350루피", website:"https://www.ramojifilmcity.com"},
  {name:"하이데라바디 비리야니", wikiTitle:"Hyderabadi biryani", type:"음식", desc:"니잠 왕실 요리에서 기원한 '덤' 방식 조리법의 세계적 비리야니로 파라다이스 등 전설적 노포가 있습니다.", rating:4.8, openTime:"11:00~23:00", price:"1인 300루피~", website:"https://en.wikipedia.org/wiki/Hyderabadi_biryani"},
]},
"다르질링": { description:"다르질링은 해발 2,042m의 히말라야 차 산지로 유네스코 세계유산 토이 트레인과 칸첸중가 일출로 유명합니다.", spots:[
  {name:"다르질링 히말라야 철도(토이 트레인)", wikiTitle:"Darjeeling Himalayan Railway", type:"역사", desc:"1881년 개통된 유네스코 세계유산 증기 기관차로 해발 2,258m까지 오르는 '토이 트레인'입니다.", rating:4.7, openTime:"운행 시간표", price:"조이 라이드 1,500루피", website:"https://en.wikipedia.org/wiki/Darjeeling_Himalayan_Railway"},
  {name:"타이거 힐 일출", wikiTitle:"Tiger Hill, Darjeeling", type:"자연", desc:"해발 2,590m에서 칸첸중가 연봉과 에베레스트까지 보이는 히말라야 일출 명소입니다.", rating:4.8, openTime:"새벽 3:30~", price:"외국인 75루피", website:"https://en.wikipedia.org/wiki/Tiger_Hill_(Darjeeling)"},
  {name:"다르질링 차 농장 투어", wikiTitle:"Darjeeling tea", type:"문화", desc:"세계 최고급 홍차 다르질링의 농장을 방문해 채엽·제다 과정을 보고 시음하는 투어입니다.", rating:4.7, openTime:"09:00~16:00", price:"투어 500루피", website:"https://en.wikipedia.org/wiki/Darjeeling_tea"},
  {name:"히말라야 동물원", wikiTitle:"Padmaja Naidu Himalayan Zoological Park", type:"자연", desc:"해발 2,134m 세계 최고 고도 동물원으로 눈표범·붉은판다 등 히말라야 고유종을 볼 수 있습니다.", rating:4.6, openTime:"08:30~16:30", price:"외국인 100루피", website:"https://en.wikipedia.org/wiki/Padmaja_Naidu_Himalayan_Zoological_Park"},
]},
"시믈라": { description:"시믈라는 해발 2,276m 히마찰프라데시주 주도이자 영국 식민지 시대 인도의 여름 수도였던 고산 휴양지입니다.", spots:[
  {name:"몰 로드", wikiTitle:"Mall Road, Shimla", type:"문화", desc:"시믈라의 중심 보행자 거리로 영국식 건축물과 스카데일 크라이스트 처치, 전망대가 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mall_Road,_Shimla"},
  {name:"크라이스트 처치", wikiTitle:"Christ Church, Shimla", type:"역사", desc:"1857년 네오고딕 양식으로 세워진 북인도 두 번째 오래된 교회로 시믈라의 상징입니다.", rating:4.5, openTime:"09:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Christ_Church,_Shimla"},
  {name:"칼카-시믈라 철도", wikiTitle:"Kalka–Shimla railway", type:"역사", desc:"1903년 개통된 유네스코 세계유산 96km 협궤 철도로 102개의 터널을 지나는 '장난감 기차'입니다.", rating:4.7, openTime:"운행 시간표", price:"일반석 300루피", website:"https://en.wikipedia.org/wiki/Kalka%E2%80%93Shimla_railway"},
  {name:"자쿠 사원", wikiTitle:"Jakhoo Temple", type:"역사", desc:"해발 2,455m 시믈라 최고봉의 하누만 사원으로 33m 거대 하누만 상이 시내 어디서나 보입니다.", rating:4.6, openTime:"05:00~20:00", price:"무료(로프웨이 400루피)", website:"https://en.wikipedia.org/wiki/Jakhoo"},
]},
"리시케시": { description:"리시케시는 갠지스강 상류의 '세계 요가 수도'로 비틀스가 명상하러 온 도시이자 히말라야 트레킹의 관문입니다.", spots:[
  {name:"락슈만 줄라", wikiTitle:"Lakshman Jhula", type:"역사", desc:"갠지스강을 가로지르는 1929년 건설된 현수교로 리시케시의 상징이자 요가원과 아쉬람으로 이어집니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Lakshman_Jhula"},
  {name:"파르마르트 니케탄 강가 아르티", wikiTitle:"Parmarth Niketan", type:"문화", desc:"매일 저녁 갠지스강변에서 열리는 촛불 기도의식으로 수백 명의 수행자들이 참여하는 종교적 장관입니다.", rating:4.8, openTime:"일몰 18:00~19:00", price:"무료", website:"https://www.parmarth.org"},
  {name:"비틀스 아쉬람", wikiTitle:"Chaurasi Kutia", type:"역사", desc:"1968년 비틀스가 마하리시의 가르침을 받으며 '화이트 앨범'을 작곡한 버려진 아쉬람입니다.", rating:4.5, openTime:"09:00~17:00", price:"외국인 600루피", website:"https://en.wikipedia.org/wiki/Chaurasi_Kutia"},
  {name:"갠지스 래프팅", wikiTitle:"Rishikesh", type:"자연", desc:"리시케시는 인도 최고의 래프팅 스팟으로 Grade II-IV의 급류를 체험할 수 있습니다.", rating:4.7, openTime:"09:00~17:00", price:"1,000루피~", website:"https://en.wikipedia.org/wiki/Rishikesh"},
]},
"함피": { description:"함피는 14~16세기 비자야나가라 제국의 수도였던 유네스코 세계유산 유적도시로 거대한 화강암 지형과 사원군이 장관입니다.", spots:[
  {name:"비루팍샤 사원", wikiTitle:"Virupaksha Temple", type:"역사", desc:"7세기부터 이어진 시바 사원으로 50m 고푸라탑이 솟아있는 함피 유적군의 중심입니다.", rating:4.8, openTime:"06:00~19:00", price:"외국인 2루피", website:"https://en.wikipedia.org/wiki/Virupaksha_Temple,_Hampi"},
  {name:"비탈라 사원 석조 전차", wikiTitle:"Vittala Temple", type:"역사", desc:"15세기 비자야나가라 건축의 정수인 석조 전차 조각이 있는 사원으로 인도 50루피 지폐에 등장합니다.", rating:4.9, openTime:"08:30~17:30", price:"외국인 600루피", website:"https://en.wikipedia.org/wiki/Vittala_Temple"},
  {name:"마탕가 힐", wikiTitle:"Hampi", type:"자연", desc:"함피 전체 유적지를 내려다볼 수 있는 일출·일몰 명소 언덕으로 짧은 트레킹이 가능합니다.", rating:4.8, openTime:"일출~일몰", price:"무료", website:"https://en.wikipedia.org/wiki/Hampi"},
  {name:"왕실 중심부", wikiTitle:"Hampi", type:"역사", desc:"여왕의 목욕탕·로터스 마할·코끼리 마구간 등 비자야나가라 왕실 건축군이 밀집한 지구입니다.", rating:4.7, openTime:"08:30~17:30", price:"외국인 600루피 공통", website:"https://en.wikipedia.org/wiki/Hampi"},
]},
"조드푸르": { description:"조드푸르는 라자스탄주의 '블루 시티'로 타르 사막 가장자리의 메헤랑가르 성채와 파란색으로 칠한 구시가지가 상징입니다.", spots:[
  {name:"메헤랑가르 성채", wikiTitle:"Mehrangarh", type:"역사", desc:"1459년 건설된 125m 고지의 라자스탄 최대 요새로 성벽 높이만 36m에 달하며 세계에서 가장 아름다운 성 중 하나입니다.", rating:4.8, openTime:"09:00~17:00", price:"외국인 600루피", website:"https://www.mehrangarh.org"},
  {name:"우마이드 바완 궁전", wikiTitle:"Umaid Bhawan Palace", type:"역사", desc:"1943년 완성된 아르데코 양식 궁전으로 현재 일부가 호텔로 운영되며 2008년 세계 최고 호텔로 선정되었습니다.", rating:4.6, openTime:"09:00~17:00", price:"외국인 100루피", website:"https://en.wikipedia.org/wiki/Umaid_Bhawan_Palace"},
  {name:"자스완트 타다", wikiTitle:"Jaswant Thada", type:"역사", desc:"1899년 건립된 조드푸르 왕가의 세노타프(기념묘)로 백색 대리석 건축이 '라자스탄의 타지마할'로 불립니다.", rating:4.5, openTime:"09:00~17:00", price:"외국인 50루피", website:"https://en.wikipedia.org/wiki/Jaswant_Thada"},
  {name:"블루시티 골목", wikiTitle:"Jodhpur", type:"문화", desc:"브라만 계급이 거주하던 구시가지 수백 채의 집이 인디고 블루로 칠해진 골목으로 세계적 포토스팟입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Jodhpur"},
]},
"푸시카르": { description:"푸시카르는 라자스탄주의 힌두 성지로 인도 유일의 브라흐마 사원과 푸시카르 호수, 매년 11월 세계 최대 낙타 축제가 열립니다.", spots:[
  {name:"푸시카르 호수", wikiTitle:"Pushkar Lake", type:"역사", desc:"브라흐마가 연꽃을 떨어뜨려 생겼다는 전설의 성스러운 호수로 52개의 가트가 둘러싸고 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Pushkar_Lake"},
  {name:"브라흐마 사원", wikiTitle:"Brahma Temple, Pushkar", type:"역사", desc:"14세기에 건립된 인도 유일의 창조신 브라흐마 사원으로 힌두교도들의 일생에 한 번 가야 할 성지입니다.", rating:4.6, openTime:"05:00~21:00", price:"무료", website:"https://en.wikipedia.org/wiki/Brahma_Temple,_Pushkar"},
  {name:"푸시카르 낙타 축제", wikiTitle:"Pushkar Camel Fair", type:"문화", desc:"매년 11월 보름 5만 마리의 낙타가 모이는 세계 최대 가축 시장 겸 민속 축제입니다.", rating:4.8, openTime:"11월 보름", price:"무료", website:"https://en.wikipedia.org/wiki/Pushkar_Fair"},
  {name:"사비트리 사원", wikiTitle:"Pushkar", type:"자연", desc:"푸시카르 언덕 정상의 사원으로 로프웨이로 오르며 푸시카르 호수와 낙타 축제장이 한눈에 보입니다.", rating:4.5, openTime:"05:00~19:00", price:"로프웨이 왕복 100루피", website:"https://en.wikipedia.org/wiki/Pushkar"},
]},
"다람살라": { description:"다람살라는 히마찰프라데시주 해발 1,457m 산악 도시로 달라이 라마와 티벳 망명 정부가 있는 '작은 라싸'입니다.", spots:[
  {name:"맥레오드 간즈", wikiTitle:"McLeod Ganj", type:"문화", desc:"달라이 라마 관저가 있는 다람살라 상부 마을로 티벳 문화·불교·명상 수행의 중심지입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/McLeod_Ganj"},
  {name:"츠글라캉 사원", wikiTitle:"Tsuglagkhang", type:"역사", desc:"달라이 라마가 설법하는 티벳 망명 사원으로 종교 의식과 법문을 직접 접할 수 있습니다.", rating:4.8, openTime:"05:00~20:00", price:"무료", website:"https://en.wikipedia.org/wiki/Tsuglagkhang_Complex"},
  {name:"바그수나그 폭포", wikiTitle:"Bhagsunath Temple", type:"자연", desc:"맥레오드 간즈에서 30분 거리의 폭포로 고대 시바 사원과 함께 있는 트레킹 명소입니다.", rating:4.4, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Bhagsunath_Temple"},
  {name:"트리운드 트레킹", wikiTitle:"Triund", type:"자연", desc:"해발 2,850m까지 9km 오르는 초보자 트레킹 코스로 다울라다르 산맥 일출이 장관입니다.", rating:4.8, openTime:"일출~일몰", price:"무료", website:"https://en.wikipedia.org/wiki/Triund"},
]},
"달랏": { description:"달랏은 해발 1,500m의 고원 도시로 프랑스 식민지풍 건축과 시원한 기후, 꽃과 커피·와인으로 '베트남의 파리'로 불립니다.", spots:[
  {name:"쑤언흐엉 호수", wikiTitle:"Xuan Huong Lake", type:"자연", desc:"달랏 중심의 인공 호수로 둘레 5km 산책로와 수상 레스토랑이 낭만적인 프랑스풍 분위기를 선사합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Xuan_Huong_Lake"},
  {name:"크레이지 하우스", wikiTitle:"Crazy House", type:"랜드마크", desc:"건축가 당비엣응아가 설계한 가우디 풍 비정형 건물로 내부가 호텔·전시 공간으로 운영됩니다.", rating:4.4, openTime:"08:30~19:00", price:"60,000동", website:"https://en.wikipedia.org/wiki/Hang_Nga_Guesthouse"},
  {name:"랑비앙산", wikiTitle:"Langbiang", type:"자연", desc:"해발 2,167m 달랏 최고봉으로 지프투어와 케이블카로 오를 수 있으며 고원 풍경이 장관입니다.", rating:4.5, openTime:"07:30~16:30", price:"60,000동", website:"https://en.wikipedia.org/wiki/Langbiang"},
  {name:"달랏 커피 농장", wikiTitle:"Vietnamese coffee", type:"음식", desc:"베트남 최대 아라비카 커피 산지로 농장 투어와 위즐 커피(족제비 커피) 시음이 유명합니다.", rating:4.6, openTime:"08:00~17:00", price:"투어 200,000동", website:"https://en.wikipedia.org/wiki/Coffee_production_in_Vietnam"},
]},
"판티엣": { description:"판티엣은 호찌민시에서 차로 4시간 거리의 해변 리조트 도시로 사막 같은 적색·백색 모래언덕으로 유명합니다.", spots:[
  {name:"백색 모래언덕", wikiTitle:"Mui Ne", type:"자연", desc:"무이네 인근의 거대한 백색 모래언덕으로 사막 같은 풍경에서 ATV와 샌드보딩이 가능합니다.", rating:4.6, openTime:"05:00~19:00", price:"지프투어 300,000동", website:"https://en.wikipedia.org/wiki/Mui_Ne"},
  {name:"적색 모래언덕", wikiTitle:"Mui Ne", type:"자연", desc:"일출·일몰이 아름다운 붉은 모래언덕으로 무이네의 상징적 풍경입니다.", rating:4.4, openTime:"05:00~19:00", price:"무료", website:"https://en.wikipedia.org/wiki/Mui_Ne"},
  {name:"요정 개울", wikiTitle:"Fairy Stream", type:"자연", desc:"붉은 바위 협곡을 맨발로 걸어 올라가는 얕은 개울로 지형이 화성처럼 독특합니다.", rating:4.5, openTime:"06:00~18:00", price:"15,000동", website:"https://en.wikipedia.org/wiki/Phan_Thiết"},
  {name:"판티엣 어항", wikiTitle:"Phan Thiết", type:"문화", desc:"새벽마다 수백 척의 둥근 바구니 배가 고기를 가져오는 베트남 전통 어항으로 일출 명소입니다.", rating:4.5, openTime:"04:00~08:00", price:"무료", website:"https://en.wikipedia.org/wiki/Phan_Thiết"},
]},
"무이네": { description:"무이네는 판티엣 동쪽 해변 마을로 카이트서핑·윈드서핑의 세계적 스팟이자 배낭여행자들의 낙원입니다.", spots:[
  {name:"무이네 해변", wikiTitle:"Mui Ne", type:"자연", desc:"10km 해변을 따라 리조트와 카이트서핑 스쿨이 늘어선 베트남 최고의 윈드스포츠 스팟입니다.", rating:4.6, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mui_Ne"},
  {name:"참 타워", wikiTitle:"Po Shanu", type:"역사", desc:"9세기 참파 왕국의 힌두 탑 3기가 언덕 위에 남아있는 무이네의 유일한 역사 유적입니다.", rating:4.3, openTime:"07:30~17:00", price:"15,000동", website:"https://en.wikipedia.org/wiki/Po_Shanu"},
  {name:"카이트서핑 스쿨", wikiTitle:"Mui Ne", type:"자연", desc:"무이네는 연중 강한 바람으로 세계 카이트서핑 월드컵이 열리는 초보자부터 프로까지 최고의 장소입니다.", rating:4.7, openTime:"09:00~17:00", price:"레슨 50$~", website:"https://en.wikipedia.org/wiki/Mui_Ne"},
  {name:"시푸드 노점 거리", wikiTitle:"Mui Ne", type:"음식", desc:"어항 인근의 시푸드 레스토랑 거리로 킹크랩·전복·랍스터를 현지 가격에 맛볼 수 있습니다.", rating:4.6, openTime:"17:00~23:00", price:"1인 300,000동~", website:"https://en.wikipedia.org/wiki/Mui_Ne"},
]},
"꼰다오": { description:"꼰다오는 베트남 남부 해안에서 180km 떨어진 16개 섬으로 된 외진 군도로 천혜의 해양 생태와 슬픈 역사가 공존합니다.", spots:[
  {name:"꼰다오 국립공원", wikiTitle:"Côn Đảo National Park", type:"자연", desc:"바다거북 산란지와 다이빙 스팟이 풍부한 해양 보호구역으로 7~10월 거북 부화를 관찰할 수 있습니다.", rating:4.8, openTime:"24시간", price:"200,000동", website:"https://en.wikipedia.org/wiki/Côn_Đảo_National_Park"},
  {name:"꼰다오 감옥", wikiTitle:"Côn Đảo Prison", type:"역사", desc:"프랑스·미국 식민 시대 정치범 수용소였던 '지옥섬'으로 호랑이 우리·바이너리 우리 등이 보존되어 있습니다.", rating:4.6, openTime:"07:30~17:00", price:"40,000동", website:"https://en.wikipedia.org/wiki/Côn_Đảo_Prison"},
  {name:"담찌엔 해변", wikiTitle:"Côn Đảo", type:"자연", desc:"꼰다오에서 가장 유명한 흰 모래 해변으로 야자수와 맑은 바다가 인도양 리조트를 연상시킵니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Côn_Đảo"},
  {name:"보티사우 묘역", wikiTitle:"Côn Đảo", type:"역사", desc:"베트남 여성 혁명가 보 티 사우의 묘소로 현지인들이 새벽에 참배하는 성지입니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Võ_Thị_Sáu"},
]},
"하이퐁": { description:"하이퐁은 베트남 북부 3대 도시이자 하노이의 관문 항구로 캣바섬 투어 출발지이자 지명도 높은 식도락 도시입니다.", spots:[
  {name:"캣바 섬", wikiTitle:"Cát Bà Island", type:"자연", desc:"하롱베이와 이어지는 베트남 최대 섬 국립공원으로 석회암 지형과 랑까우 원숭이 서식지가 유명합니다.", rating:4.7, openTime:"24시간", price:"50,000동", website:"https://en.wikipedia.org/wiki/Cát_Bà"},
  {name:"두손 해변", wikiTitle:"Đồ Sơn", type:"자연", desc:"하이퐁 최고의 해변 휴양지로 프랑스 식민시대 별장과 카지노 리조트가 있습니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Đồ_Sơn"},
  {name:"랑선 대성당", wikiTitle:"Hai Phong", type:"역사", desc:"1886년 건립된 프랑스 식민시대 고딕 성당으로 하이퐁의 상징적 건축물입니다.", rating:4.4, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Haiphong"},
  {name:"반 카오 국숫 거리", wikiTitle:"Haiphong", type:"음식", desc:"하이퐁 명물 '반다꾸어'(게국수) 노포가 모인 거리로 현지 스타일 쌀국수를 맛볼 수 있습니다.", rating:4.6, openTime:"06:00~22:00", price:"50,000동~", website:"https://en.wikipedia.org/wiki/Haiphong"},
]},
"깐터": { description:"깐터는 메콩델타 최대 도시이자 '9마리 용의 강' 메콩강의 수상 시장과 운하 크루즈로 유명한 남부 농업 중심지입니다.", spots:[
  {name:"까이랑 수상시장", wikiTitle:"Cái Răng Floating Market", type:"문화", desc:"메콩델타 최대 도매 수상시장으로 새벽 4~6시 수백 척의 보트가 과일과 채소를 거래하는 장관이 펼쳐집니다.", rating:4.6, openTime:"04:00~09:00", price:"투어 300,000동", website:"https://en.wikipedia.org/wiki/Cái_Răng_Floating_Market"},
  {name:"므이 사오 누이 사원", wikiTitle:"Can Tho", type:"역사", desc:"깐터 최대 화교 사원으로 중국식 건축과 정교한 조각이 인상적인 도교 사원입니다.", rating:4.3, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Cần_Thơ"},
  {name:"닌끼에우 선착장", wikiTitle:"Can Tho", type:"랜드마크", desc:"메콩강변 산책로로 밤이 되면 네온사인 조명이 화려해지며 크루즈 보트가 출발합니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Cần_Thơ"},
  {name:"메콩 과일 농장 투어", wikiTitle:"Mekong Delta", type:"자연", desc:"운하를 따라 사공배로 돌아보는 망고·람부탄·용과 과일 농장 투어가 메콩델타의 명물입니다.", rating:4.7, openTime:"08:00~17:00", price:"500,000동~", website:"https://en.wikipedia.org/wiki/Mekong_Delta"},
]},
"동호이": { description:"동호이는 베트남 중부 꽝빈성의 작은 도시로 세계 최대 동굴 선둥이 있는 퐁냐케방 국립공원의 관문입니다.", spots:[
  {name:"퐁냐 동굴", wikiTitle:"Phong Nha Cave", type:"자연", desc:"메콩강 지류 따라 보트로 들어가는 4.5km 강을 품은 석회암 동굴로 유네스코 세계유산입니다.", rating:4.8, openTime:"07:30~16:00", price:"150,000동", website:"https://en.wikipedia.org/wiki/Phong_Nha_Cave"},
  {name:"선둥 동굴", wikiTitle:"Sơn Đoòng Cave", type:"자연", desc:"2009년 발견된 세계 최대 동굴로 내부에 원시림·강·구름이 생성되며 2주 전 예약 트레킹만 가능합니다.", rating:4.9, openTime:"4일 투어(한정)", price:"3,000$", website:"https://en.wikipedia.org/wiki/Sơn_Đoòng_Cave"},
  {name:"동호이 해변", wikiTitle:"Đồng Hới", type:"자연", desc:"동호이 시내에서 가까운 녁래 해변과 바우쭈아 해변이 조용하고 깨끗해 현지인들이 사랑합니다.", rating:4.3, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Đồng_Hới"},
  {name:"꽝빈 전쟁기념관", wikiTitle:"Quảng Bình Province", type:"역사", desc:"베트남 전쟁 당시 호찌민 루트의 주요 통로였던 꽝빈성의 전쟁 유적과 기념물을 전시합니다.", rating:4.2, openTime:"08:00~17:00", price:"30,000동", website:"https://en.wikipedia.org/wiki/Quảng_Bình_Province"},
]},
"붕따우": { description:"붕따우는 호찌민시에서 가장 가까운 해변 도시로 프랑스 식민지 별장과 예수상, 해산물이 유명한 주말 여행지입니다.", spots:[
  {name:"붕따우 예수상", wikiTitle:"Christ of Vũng Tàu", type:"랜드마크", desc:"1974년 건립된 높이 32m의 예수상으로 브라질 리우데자네이루 예수상보다 큰 베트남 최대 조각입니다.", rating:4.6, openTime:"07:00~17:00", price:"무료", website:"https://en.wikipedia.org/wiki/Christ_of_Vũng_Tàu"},
  {name:"박진 비치", wikiTitle:"Vũng Tàu", type:"자연", desc:"붕따우 뒷바다의 황금빛 모래 해변으로 서퍼들이 좋아하는 현지인 해변입니다.", rating:4.4, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Vũng_Tàu"},
  {name:"화이트 빌라", wikiTitle:"Vũng Tàu", type:"역사", desc:"프랑스 총독의 여름 별장이었던 19세기 백색 저택으로 붕따우 시내 전망이 훌륭합니다.", rating:4.3, openTime:"07:00~17:00", price:"5,000동", website:"https://en.wikipedia.org/wiki/Vũng_Tàu"},
  {name:"붕따우 해산물", wikiTitle:"Vũng Tàu", type:"음식", desc:"주말 호찌민 시민들이 해산물 식사를 위해 찾는 해안 레스토랑 거리로 랍스터와 전복이 저렴합니다.", rating:4.7, openTime:"11:00~22:00", price:"1인 200,000동~", website:"https://en.wikipedia.org/wiki/Vũng_Tàu"},
]},
"반메투옷": { description:"반메투옷은 베트남 중앙 고원 닥락성의 주도로 베트남 커피(로부스타) 생산 1위 도시이자 코끼리·폭포로 유명합니다.", spots:[
  {name:"드레이 사프 폭포", wikiTitle:"Dray Sap Waterfall", type:"자연", desc:"높이 20m, 폭 100m의 '연기 폭포'로 '베트남 나이아가라'라고 불리며 원시림에 둘러싸여 있습니다.", rating:4.6, openTime:"07:00~17:00", price:"60,000동", website:"https://en.wikipedia.org/wiki/Dray_Sap_Falls"},
  {name:"반동 마을 코끼리 투어", wikiTitle:"Buôn Ma Thuột", type:"문화", desc:"원주민 에데족 마을을 방문해 윤리적 코끼리 생태 투어를 체험하는 여행 프로그램입니다.", rating:4.5, openTime:"08:00~17:00", price:"500,000동~", website:"https://en.wikipedia.org/wiki/Buôn_Ma_Thuột"},
  {name:"세계 커피 박물관", wikiTitle:"Trung Nguyên", type:"문화", desc:"쯩응우엔 커피가 운영하는 세계 커피 문화 박물관으로 독특한 건축과 시음 체험이 가능합니다.", rating:4.7, openTime:"07:00~21:00", price:"75,000동", website:"https://en.wikipedia.org/wiki/Trung_Nguyên"},
  {name:"락 호수", wikiTitle:"Lak Lake", type:"자연", desc:"중앙고원 최대 천연 담수호로 보트와 코끼리 타기, 수상가옥 홈스테이가 유명합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Lak_Lake"},
]},
"매홍손": { description:"매홍손은 미얀마 국경과 접한 산악 도시로 태국 북부 원주민 문화와 안개 낀 산세, '긴목족' 마을로 유명한 '삼안개의 도시'입니다.", spots:[
  {name:"왓 프라탓 도이 꽁무", wikiTitle:"Wat Phrathat Doi Kong Mu", type:"역사", desc:"매홍손 시내를 내려다보는 언덕 위 사원으로 샨족 양식의 흰 쳇디와 일몰 전망이 장관입니다.", rating:4.7, openTime:"06:00~18:00", price:"무료", website:"https://en.wikipedia.org/wiki/Mae_Hong_Son_Province"},
  {name:"판 우움 호수", wikiTitle:"Mae Hong Son", type:"자연", desc:"매홍손 시내 한복판 호수로 안개 낀 아침과 호반 사원이 환상적인 풍경을 연출합니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Mae_Hong_Son"},
  {name:"긴목족 마을", wikiTitle:"Kayan people (Myanmar)", type:"문화", desc:"미얀마 피난민 카얀족 여성들이 전통대로 목에 놋쇠 고리를 걸고 생활하는 관광 마을입니다.", rating:4.2, openTime:"08:00~17:00", price:"250바트", website:"https://en.wikipedia.org/wiki/Kayan_people_(Myanmar)"},
  {name:"파이", wikiTitle:"Pai", type:"자연", desc:"매홍손주에 속한 히피 배낭여행자 성지로 산과 폭포, 온천에 둘러싸인 자유로운 분위기가 매력입니다.", rating:4.7, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Pai,_Thailand"},
]},
"꾸이년": { description:"꾸이년은 베트남 중부 빈딘성의 해변 도시로 조용한 해안과 참파 왕국 유적, 저렴한 해산물로 최근 떠오르는 휴양지입니다.", spots:[
  {name:"꾸이년 해변", wikiTitle:"Quy Nhơn", type:"자연", desc:"5km의 초승달 모양 해변으로 나트랑이나 다낭보다 조용하며 현지인과 어부의 일상을 볼 수 있습니다.", rating:4.5, openTime:"24시간", price:"무료", website:"https://en.wikipedia.org/wiki/Quy_Nhơn"},
  {name:"반이 참 유적", wikiTitle:"Bánh Ít Towers", type:"역사", desc:"11세기 참파 왕국이 세운 4개의 탑으로 이루어진 힌두 유적으로 언덕 위에서 빈딘 평원이 내려다보입니다.", rating:4.5, openTime:"07:00~17:00", price:"20,000동", website:"https://en.wikipedia.org/wiki/Bánh_Ít_Towers"},
  {name:"끼꼬 섬", wikiTitle:"Quy Nhơn", type:"자연", desc:"꾸이년 앞바다의 무인 섬들로 보트 투어로 스노클링과 자연 그대로의 해변을 즐길 수 있습니다.", rating:4.6, openTime:"08:00~16:00", price:"투어 600,000동", website:"https://en.wikipedia.org/wiki/Quy_Nhơn"},
  {name:"냐짱 시푸드 시장", wikiTitle:"Quy Nhơn", type:"음식", desc:"꾸이년은 베트남에서 가장 저렴하게 신선한 해산물을 먹을 수 있는 곳으로 현지 시장 레스토랑이 유명합니다.", rating:4.7, openTime:"16:00~22:00", price:"1인 150,000동~", website:"https://en.wikipedia.org/wiki/Quy_Nhơn"},
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

export const DEFAULT_CITY_DATA = (cityName, lang = 'ko') => {
  const L = {
    ko: {
      condition: '구름 조금',
      desc: `${cityName}은(는) 독특한 문화적 경험과 아름다운 자연 풍경, 잊을 수 없는 추억을 선사하는 매력적인 여행지입니다.`,
      spots: [
        { name:`${cityName} 구시가지`,        desc:'도시의 풍부한 문화 유산을 보여주는 아름답게 보존된 역사 지구입니다.' },
        { name:`${cityName} 국립 박물관`,     desc:'이 지역의 훌륭한 예술 작품과 유물, 역사를 전시하는 세계적 수준의 기관입니다.' },
        { name:`${cityName} 시립 공원`,       desc:'도시 중심부에 자리한 사랑받는 녹지 오아시스로 계절마다 다른 정원을 즐길 수 있습니다.' },
        { name:`${cityName} 전통 시장`,       desc:'신선한 농산물과 길거리 음식, 수공예품이 가득한 활기찬 로컬 시장입니다.' },
      ]
    },
    en: {
      condition: 'partly cloudy',
      desc: `${cityName} is a charming destination offering unique cultural experiences, beautiful natural scenery, and unforgettable memories.`,
      spots: [
        { name:`${cityName} Old Town`,           desc:'A beautifully preserved historic district showcasing the rich cultural heritage of the city.' },
        { name:`${cityName} National Museum`,    desc:'A world-class institution exhibiting fine art, artifacts, and history of the region.' },
        { name:`${cityName} City Park`,          desc:'A beloved green oasis in the heart of the city with seasonal gardens to enjoy year-round.' },
        { name:`${cityName} Traditional Market`, desc:'A vibrant local market bursting with fresh produce, street food, and handcrafted goods.' },
      ]
    },
    ja: {
      condition: '晴れ時々曇り',
      desc: `${cityName}は、ユニークな文化体験と美しい自然景観、忘れられない思い出を提供する魅力的な観光地です。`,
      spots: [
        { name:`${cityName} 旧市街`,       desc:'街の豊かな文化遺産を伝える、美しく保存された歴史地区です。' },
        { name:`${cityName} 国立博物館`,   desc:'この地域の優れた美術品・遺物・歴史を展示する、世界水準の施設です。' },
        { name:`${cityName} 市立公園`,     desc:'街の中心に位置する愛される緑のオアシスで、四季折々の庭園を楽しめます。' },
        { name:`${cityName} 伝統市場`,     desc:'新鮮な農産物、屋台グルメ、手工芸品であふれる活気ある地元市場です。' },
      ]
    },
    zh: {
      condition: '多云',
      desc: `${cityName}是一个充满魅力的旅游目的地，提供独特的文化体验、美丽的自然风光和难忘的回忆。`,
      spots: [
        { name:`${cityName} 老城区`,       desc:'一个美丽保存的历史街区，展示了城市丰富的文化遗产。' },
        { name:`${cityName} 国立博物馆`,   desc:'一流的文化机构，展示该地区优秀的艺术品、文物与历史。' },
        { name:`${cityName} 市立公园`,     desc:'坐落于市中心的绿色绿洲，四季花园各具风情。' },
        { name:`${cityName} 传统市场`,     desc:'充满活力的本地市场，云集新鲜农产品、街头美食与手工艺品。' },
      ]
    },
  }
  const data = L[lang] || L.ko
  const types = ['역사','문화','자연','음식']
  const ratings = [4.5, 4.4, 4.6, 4.3]
  return {
    weather:{ temp:Math.floor(Math.random()*20)+10, condition:data.condition, icon:'⛅', humidity:Math.floor(Math.random()*40)+45 },
    description: data.desc,
    spots: data.spots.map((s, i) => ({
      name: s.name,
      wikiTitle: `${cityName} ${types[i]==='역사'?'old town':types[i]==='문화'?'museum':types[i]==='자연'?'park':'market'}`,
      type: types[i],
      desc: s.desc,
      rating: ratings[i],
    }))
  }
}

// 카테고리별 폴백 플레이스홀더 (실사진 못 찾을 때만 사용)
export const TYPE_EMOJI = { "문화":"🎭","자연":"🌿","랜드마크":"⭐","도시":"🏙️","역사":"🏛️","음식":"🍽️" }
export const getImg = (type) => {
  const colors = { "문화":"8b5cf6","자연":"10b981","랜드마크":"f59e0b","도시":"3b82f6","역사":"f97316","음식":"ec4899" }
  const c = colors[type] || '64748b'
  const emoji = TYPE_EMOJI[type] || '📍'
  // SVG 플레이스홀더 (그라디언트 + 이모지)
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#${c}" stop-opacity="0.8"/><stop offset="100%" stop-color="#0f172a" stop-opacity="0.9"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><text x="200" y="140" text-anchor="middle" font-size="48">${emoji}</text><text x="200" y="185" text-anchor="middle" font-family="sans-serif" font-size="13" fill="rgba(255,255,255,0.5)">사진을 불러오는 중...</text></svg>`)}`
}

export const TYPE_COLORS = {
  "문화":"#8b5cf6","자연":"#10b981","랜드마크":"#f59e0b",
  "도시":"#3b82f6","역사":"#f97316","음식":"#ec4899",
  Culture:"#8b5cf6",Nature:"#10b981",Landmark:"#f59e0b",
  Urban:"#3b82f6",History:"#f97316",Food:"#ec4899"
}
