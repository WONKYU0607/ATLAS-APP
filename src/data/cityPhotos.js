// 인기 도시 큐레이션 데이터 (다국어 ko/en/ja/zh)
// photos: Wikipedia 랜드마크 페이지 wikiTitle 배열
// tagline/desc/bestSeason: { ko, en, ja, zh } 다국어 객체

const CITY_PHOTOS = {
  '도쿄': {
    en: 'Tokyo',
    tagline: { ko: '전통과 미래가 공존하는 메가시티', en: 'Where tradition meets the future', ja: '伝統と未来が共存するメガシティ', zh: '传统与未来共存的超级都市' },
    desc: { ko: '시부야의 화려한 네온, 아사쿠사의 고요한 사찰, 츠키지의 미식 천국이 한 도시에 모여있는 곳. 24시간 멈추지 않는 도시의 에너지를 느끼고 싶다면.', en: 'Neon-lit Shibuya, serene Asakusa shrines, and the food paradise of Tsukiji all in one city. The 24-hour energy of urban Japan.', ja: '渋谷の華やかなネオン、浅草の静かな寺院、築地の美食天国が一つの街に。24時間眠らない都市のエネルギー。', zh: '繁华的涩谷霓虹、静谧的浅草寺、筑地的美食天堂集于一城。感受24小时不眠的都市能量。' },
    photos: ['Tokyo Skytree', 'Tokyo Tower', 'Sensō-ji', 'Shibuya Crossing', 'Imperial Palace, Tokyo'],
    bestSeason: { ko: '3~4월 (벚꽃), 11월 (단풍)', en: 'Mar–Apr (Cherry blossoms), Nov (Foliage)', ja: '3~4月（桜）、11月（紅葉）', zh: '3~4月（樱花）、11月（红叶）' },
  },
  '파리': {
    en: 'Paris',
    tagline: { ko: '낭만의 정점, 빛의 도시', en: 'The City of Light, the peak of romance', ja: 'ロマンの頂点、光の都', zh: '浪漫的巅峰，光之城' },
    desc: { ko: '에펠탑 아래 피크닉, 루브르에서 마주하는 명작, 몽마르트르 언덕의 화가들. 도시 자체가 살아있는 미술관인 곳.', en: 'Picnic under the Eiffel Tower, masterpieces at the Louvre, artists on Montmartre hill. A city that\'s a living museum.', ja: 'エッフェル塔の下でピクニック、ルーブルで名作と対面、モンマルトルの画家たち。街全体が生きた美術館。', zh: '埃菲尔铁塔下野餐，卢浮宫与名作相遇，蒙马特高地的画家们。整座城市就是一座活的博物馆。' },
    photos: ['Eiffel Tower', 'Louvre', 'Notre-Dame de Paris', 'Arc de Triomphe', 'Sacré-Cœur, Paris'],
    bestSeason: { ko: '4~6월, 9~10월', en: 'Apr–Jun, Sep–Oct', ja: '4~6月、9~10月', zh: '4~6月、9~10月' },
  },
  '오사카': {
    en: 'Osaka',
    tagline: { ko: '먹다 쓰러진다는 식도락의 도시', en: 'Japan\'s kitchen, eat till you drop', ja: '食い倒れの街', zh: '吃到倒下的美食之都' },
    desc: { ko: '도톤보리의 휘황찬란한 간판들, 다코야키와 오코노미야키, 그리고 일본의 부엌이라 불리는 쿠로몬 시장. 오사카성에서는 일본 전국시대의 역사를 만날 수 있어요.', en: 'The dazzling signs of Dotonbori, takoyaki and okonomiyaki, and Kuromon Market—the kitchen of Japan. Osaka Castle tells the story of feudal Japan.', ja: '道頓堀の華やかな看板、たこ焼きとお好み焼き、日本の台所と呼ばれる黒門市場。大阪城では戦国時代の歴史に出会えます。', zh: '道顿堀璀璨的招牌、章鱼烧和大阪烧，被称为日本厨房的黑门市场。大阪城讲述着战国时代的历史。' },
    photos: ['Osaka Castle', 'Dotonbori', 'Universal Studios Japan', 'Tsutenkaku'],
    bestSeason: { ko: '3~5월, 10~11월', en: 'Mar–May, Oct–Nov', ja: '3~5月、10~11月', zh: '3~5月、10~11月' },
  },
  '다낭': {
    en: 'Da Nang',
    tagline: { ko: '용 다리와 환상의 해변', en: 'Dragon bridge and dreamy beaches', ja: 'ドラゴン橋と幻想的なビーチ', zh: '龙桥与梦幻海滩' },
    desc: { ko: '미케 비치의 부드러운 모래사장, 마블 마운틴의 신비로운 동굴, 바나힐의 황금 다리. 베트남 중부 여행의 베이스캠프로 손색없는 도시.', en: 'The soft sands of My Khe Beach, the mystical caves of Marble Mountains, and the Golden Bridge of Ba Na Hills. The perfect base for central Vietnam.', ja: 'ミーケービーチの柔らかな砂浜、五行山の神秘的な洞窟、バナヒルズのゴールデンブリッジ。ベトナム中部旅行の拠点。', zh: '美溪海滩柔软的沙、五行山神秘的洞窟、巴拿山黄金桥。越南中部之旅的完美据点。' },
    photos: ['Dragon Bridge', 'Marble Mountains', 'Bà Nà Hills', 'My Khe Beach'],
    bestSeason: { ko: '2~5월', en: 'Feb–May', ja: '2~5月', zh: '2~5月' },
  },
  '교토': {
    en: 'Kyoto',
    tagline: { ko: '천년 고도의 시간이 멈춘 풍경', en: 'A thousand years of stillness', ja: '千年の都、時が止まった風景', zh: '千年古都，时光静止的风景' },
    desc: { ko: '천 개의 붉은 도리이가 이어진 후시미이나리, 황금빛 킨카쿠지, 아라시야마의 대나무 숲길. 일본 전통문화의 정수를 가장 깊이 만날 수 있는 곳.', en: 'A thousand vermillion torii at Fushimi Inari, the gilded Kinkaku-ji, and the bamboo paths of Arashiyama. The deepest encounter with traditional Japan.', ja: '千本鳥居の伏見稲荷、金色の金閣寺、嵐山の竹林。日本の伝統文化の真髄に出会える場所。', zh: '伏见稻荷千鸟居、金光闪闪的金阁寺、岚山的竹林。最深入感受日本传统文化的地方。' },
    photos: ['Fushimi Inari-taisha', 'Kinkaku-ji', 'Arashiyama Bamboo Forest', 'Kiyomizu-dera', 'Ginkaku-ji'],
    bestSeason: { ko: '3~4월 (벚꽃), 11월 (단풍)', en: 'Mar–Apr (Cherry blossoms), Nov (Foliage)', ja: '3~4月（桜）、11月（紅葉）', zh: '3~4月（樱花）、11月（红叶）' },
  },
  '발리': {
    en: 'Bali',
    tagline: { ko: '신들의 섬, 영혼이 쉬어가는 곳', en: 'Island of gods, where souls rest', ja: '神々の島、魂が憩う場所', zh: '众神之岛，灵魂栖息之地' },
    desc: { ko: '우붓의 푸른 라이스 테라스, 절벽 위의 우루와뚜 사원에서 보는 일몰, 스미냑의 비치 클럽. 요가와 휴양, 영성과 파티가 공존하는 섬.', en: 'The green rice terraces of Ubud, sunsets at the cliff-top Uluwatu Temple, and beach clubs of Seminyak. Yoga, leisure, spirituality, and parties coexist.', ja: 'ウブドの緑のライステラス、崖の上のウルワツ寺院で見る夕日、スミニャックのビーチクラブ。ヨガと癒し、スピリチュアルとパーティーが共存する島。', zh: '乌布翠绿的梯田、悬崖上乌鲁瓦图寺的日落、水明漾的海滩俱乐部。瑜伽、度假、灵性与派对共存的岛。' },
    photos: ['Tanah Lot', 'Uluwatu Temple', 'Tegallalang Rice Terraces', 'Mount Batur', 'Pura Besakih'],
    bestSeason: { ko: '4~10월 (건기)', en: 'Apr–Oct (Dry season)', ja: '4~10月（乾季）', zh: '4~10月（旱季）' },
  },
  '산토리니': {
    en: 'Santorini',
    tagline: { ko: '에게해의 푸른 보석', en: 'The blue jewel of the Aegean', ja: 'エーゲ海の青い宝石', zh: '爱琴海的蓝色宝石' },
    desc: { ko: '하얀 큐브 위에 파란 돔, 절벽 끝 이아 마을의 일몰. 화산이 만든 칼데라 풍경과 와이너리, 그리고 세상에서 가장 로맨틱한 풍경.', en: 'Blue domes atop white cubes, the sunset at Oia\'s cliff edge. The caldera shaped by a volcano, wineries, and one of the most romantic views in the world.', ja: '白いキューブの上の青いドーム、崖の上のイア村の夕日。火山が作ったカルデラの風景とワイナリー、世界で最もロマンチックな景色。', zh: '白色立方上的蓝色圆顶，悬崖边伊亚的日落。火山形成的火山口风景与酒庄，世界最浪漫的景色。' },
    photos: ['Oia, Greece', 'Fira', 'Red Beach, Santorini', 'Akrotiri (prehistoric city)'],
    bestSeason: { ko: '5~10월', en: 'May–Oct', ja: '5~10月', zh: '5~10月' },
  },
  '홍콩': {
    en: 'Hong Kong',
    tagline: { ko: '동양과 서양이 만나는 마천루의 도시', en: 'Where East meets West, towers of light', ja: '東洋と西洋が出会う摩天楼の街', zh: '东西方相遇的摩天大楼之都' },
    desc: { ko: '빅토리아 피크에서 내려다보는 100만 불짜리 야경, 침사추이의 심포니 오브 라이츠, 딤섬과 우유차의 도시. 좁은 골목 안에 숨은 미슐랭 식당들.', en: 'The million-dollar night view from Victoria Peak, the Symphony of Lights at Tsim Sha Tsui, dim sum and milk tea. Michelin restaurants hidden in narrow alleys.', ja: 'ビクトリアピークから見下ろす100万ドルの夜景、尖沙咀のシンフォニー・オブ・ライツ、点心とミルクティーの街。狭い路地に隠れたミシュランレストラン。', zh: '太平山顶俯瞰百万夜景、尖沙咀的幻彩咏香江、点心与丝袜奶茶之都。藏在窄巷里的米其林餐厅。' },
    photos: ['Victoria Harbour', 'Victoria Peak', 'Tian Tan Buddha', 'International Commerce Centre'],
    bestSeason: { ko: '10~12월', en: 'Oct–Dec', ja: '10~12月', zh: '10~12月' },
  },
  '로마': {
    en: 'Rome',
    tagline: { ko: '모든 길은 로마로 통한다', en: 'All roads lead to Rome', ja: 'すべての道はローマに通ず', zh: '条条大路通罗马' },
    desc: { ko: '2천 년을 견뎌온 콜로세움, 동전을 던지는 트레비 분수, 천재 미켈란젤로의 시스티나 성당. 도시 전체가 거대한 야외 박물관.', en: 'The 2,000-year-old Colosseum, the coin-throwing Trevi Fountain, Michelangelo\'s Sistine Chapel. The whole city is a giant open-air museum.', ja: '2千年を耐えてきたコロッセオ、コインを投げるトレビの泉、ミケランジェロのシスティーナ礼拝堂。街全体が巨大な野外博物館。', zh: '历经两千年的斗兽场、投币的特莱维喷泉、米开朗基罗的西斯廷礼拜堂。整座城市就是一座巨大的露天博物馆。' },
    photos: ['Colosseum', 'Trevi Fountain', 'Pantheon, Rome', 'Roman Forum', 'St. Peter\'s Basilica'],
    bestSeason: { ko: '4~6월, 9~10월', en: 'Apr–Jun, Sep–Oct', ja: '4~6月、9~10月', zh: '4~6月、9~10月' },
  },
  '방콕': {
    en: 'Bangkok',
    tagline: { ko: '천사의 도시, 24시간 깨어있는 활기', en: 'City of Angels, awake 24 hours', ja: '天使の都、24時間目覚めた活気', zh: '天使之城，24小时不眠的活力' },
    desc: { ko: '왕궁의 황금 첨탑, 짜오프라야 강의 야간 크루즈, 카오산 로드의 백패커 천국. 길거리 음식이 미슐랭에 오르는 동남아 미식의 수도.', en: 'Golden spires of the Grand Palace, night cruises on the Chao Phraya, backpacker paradise on Khao San Road. Street food earns Michelin stars in Southeast Asia\'s culinary capital.', ja: '王宮の黄金の尖塔、チャオプラヤー川のナイトクルーズ、カオサン通りのバックパッカー天国。屋台料理がミシュランに載る東南アジア美食の首都。', zh: '大皇宫的金色尖塔、湄南河夜游、考山路的背包客天堂。街头美食登上米其林的东南亚美食之都。' },
    photos: ['Wat Arun', 'Grand Palace', 'Wat Pho', 'Wat Phra Kaew', 'Erawan Shrine'],
    bestSeason: { ko: '11~2월', en: 'Nov–Feb', ja: '11~2月', zh: '11~2月' },
  },
  '밴쿠버': {
    en: 'Vancouver',
    tagline: { ko: '도시와 자연이 완벽하게 어우러진 곳', en: 'Where city and nature meet perfectly', ja: '都市と自然が完璧に調和する場所', zh: '都市与自然完美交融之地' },
    desc: { ko: '스탠리 공원의 거대한 삼나무 숲, 그라우스 마운틴의 스키 슬로프, 그랜빌 아일랜드의 마켓. 30분이면 도심에서 자연으로 떠날 수 있는 도시.', en: 'The giant cedar forests of Stanley Park, ski slopes on Grouse Mountain, and Granville Island Market. From downtown to wild nature in just 30 minutes.', ja: 'スタンレーパークの巨大な杉林、グラウス山のスキー場、グランビルアイランドのマーケット。30分でダウンタウンから自然へ。', zh: '史丹利公园巨大的杉树林、松鸡山的滑雪坡、格兰维尔岛市集。30分钟从市中心抵达自然之地。' },
    photos: ['Stanley Park', 'Capilano Suspension Bridge', 'Granville Island', 'Grouse Mountain'],
    bestSeason: { ko: '6~9월', en: 'Jun–Sep', ja: '6~9月', zh: '6~9月' },
  },
  '푸켓': {
    en: 'Phuket',
    tagline: { ko: '안다만해의 진주', en: 'The pearl of the Andaman Sea', ja: 'アンダマン海の真珠', zh: '安达曼海的明珠' },
    desc: { ko: '에메랄드빛 피피섬 투어, 화려한 빠통 비치의 나이트라이프, 오래된 차이나타운 푸켓 타운의 골목들. 태국 휴양 1번지.', en: 'Emerald Phi Phi Islands tours, the vibrant nightlife of Patong Beach, and the old alleys of Phuket Town\'s Chinatown. Thailand\'s top resort destination.', ja: 'エメラルド色のピピ島ツアー、華やかなパトンビーチのナイトライフ、古いチャイナタウン・プーケットタウンの路地。タイのリゾート1番地。', zh: '翡翠色的皮皮岛之旅、芭东海滩绚丽的夜生活、普吉镇老城唐人街的小巷。泰国度假首选地。' },
    photos: ['Phi Phi Islands', 'Big Buddha of Phuket', 'Wat Chalong', 'Maya Bay'],
    bestSeason: { ko: '11~4월', en: 'Nov–Apr', ja: '11~4月', zh: '11~4月' },
  },
  '바르셀로나': {
    en: 'Barcelona',
    tagline: { ko: '가우디의 도시, 지중해의 보헤미안', en: 'Gaudí\'s city, bohemia of the Mediterranean', ja: 'ガウディの街、地中海のボヘミアン', zh: '高迪之城，地中海的波西米亚' },
    desc: { ko: '아직도 완공되지 않은 사그라다 파밀리아, 동화 같은 구엘 공원, 람블라스 거리의 활기. 타파스와 카바를 즐기며 늦은 밤까지 깨어있는 도시.', en: 'The still-unfinished Sagrada Família, fairytale-like Park Güell, and the bustle of La Rambla. A city that stays awake late, savoring tapas and cava.', ja: 'まだ完成していないサグラダ・ファミリア、おとぎ話のようなグエル公園、ランブラス通りの活気。タパスとカヴァを楽しみ夜遅くまで眠らない街。', zh: '尚未完工的圣家堂、童话般的桂尔公园、兰布拉大街的活力。享受塔帕斯和卡瓦酒，深夜不眠的城市。' },
    photos: ['Sagrada Família', 'Park Güell', 'Casa Batlló', 'Casa Milà', 'Camp Nou'],
    bestSeason: { ko: '4~6월, 9~10월', en: 'Apr–Jun, Sep–Oct', ja: '4~6月、9~10月', zh: '4~6月、9~10月' },
  },
  '이스탄불': {
    en: 'Istanbul',
    tagline: { ko: '두 대륙을 품은 도시', en: 'A city embracing two continents', ja: '二つの大陸を抱く街', zh: '横跨两大洲的城市' },
    desc: { ko: '비잔틴과 오스만의 흔적이 겹쳐진 아야 소피아와 블루 모스크, 보스포루스 해협 너머의 일몰, 그랜드 바자르의 미궁. 동양과 서양의 경계선.', en: 'Hagia Sophia and the Blue Mosque layered with Byzantine and Ottoman history, sunsets across the Bosphorus, and the labyrinth of the Grand Bazaar. The boundary between East and West.', ja: 'ビザンチンとオスマンの痕跡が重なるアヤソフィアとブルーモスク、ボスポラス海峡越しの夕日、グランドバザールの迷宮。東洋と西洋の境界線。', zh: '拜占庭与奥斯曼痕迹交错的圣索菲亚和蓝色清真寺、博斯普鲁斯海峡的日落、大巴扎的迷宫。东西方的分界线。' },
    photos: ['Hagia Sophia', 'Sultan Ahmed Mosque', 'Topkapı Palace', 'Grand Bazaar, Istanbul', 'Bosphorus'],
    bestSeason: { ko: '4~5월, 9~10월', en: 'Apr–May, Sep–Oct', ja: '4~5月、9~10月', zh: '4~5月、9~10月' },
  },
  '오키나와': {
    en: 'Okinawa',
    tagline: { ko: '에메랄드 빛 바다의 일본 최남단', en: 'Japan\'s southernmost emerald sea', ja: 'エメラルドの海、日本最南端', zh: '日本最南端的翡翠之海' },
    desc: { ko: '추라우미 수족관의 거대한 고래상어, 만자모의 코끼리 코 절벽, 슈리성의 류큐 왕국 흔적. 본토와 다른 류큐 문화와 산호초 바다.', en: 'The giant whale sharks at Churaumi Aquarium, the elephant-trunk cliff of Manzamo, and the Ryukyu Kingdom traces at Shuri Castle. Coral seas and a culture unlike mainland Japan.', ja: '美ら海水族館の巨大なジンベエザメ、万座毛の象の鼻の崖、首里城の琉球王国の痕跡。本土とは違う琉球文化とサンゴ礁の海。', zh: '美丽海水族馆的巨大鲸鲨、万座毛的象鼻悬崖、首里城的琉球王国遗迹。与本土不同的琉球文化与珊瑚礁海。' },
    photos: ['Shuri Castle', 'Churaumi Aquarium', 'Manzamo', 'Kerama Islands'],
    bestSeason: { ko: '4~6월, 10~11월', en: 'Apr–Jun, Oct–Nov', ja: '4~6月、10~11月', zh: '4~6月、10~11月' },
  },
  '세부': {
    en: 'Cebu',
    tagline: { ko: '고래상어와 폭포의 천국', en: 'Paradise of whale sharks and waterfalls', ja: 'ジンベエザメと滝の楽園', zh: '鲸鲨与瀑布的天堂' },
    desc: { ko: '오슬롭의 고래상어 스노클링, 카와산 폭포 캐녀닝, 보홀의 초콜릿 힐스. 다이빙과 호핑투어로 가득한 필리핀의 보석.', en: 'Whale shark snorkeling in Oslob, canyoneering at Kawasan Falls, and Bohol\'s Chocolate Hills. The Philippine gem of diving and island hopping.', ja: 'オスロブのジンベエザメシュノーケリング、カワサン滝でのキャニオニング、ボホールのチョコレートヒルズ。ダイビングとアイランドホッピングの宝石。', zh: '奥斯洛布的鲸鲨浮潜、卡瓦山瀑布峡谷探险、薄荷岛的巧克力山。充满潜水和跳岛游的菲律宾宝石。' },
    photos: ['Kawasan Falls', 'Magellan\'s Cross', 'Basilica del Santo Niño', 'Sumilon Island'],
    bestSeason: { ko: '12~5월', en: 'Dec–May', ja: '12~5月', zh: '12~5月' },
  },
  '사이판': {
    en: 'Saipan',
    tagline: { ko: '태평양의 푸른 보석', en: 'The blue gem of the Pacific', ja: '太平洋の青い宝石', zh: '太平洋的蓝色宝石' },
    desc: { ko: '마나가하 섬의 투명한 바다, 만세 절벽의 비극적 역사, 그로토 다이빙 포인트. 한국과 가까우면서도 미국령인 독특한 휴양지.', en: 'The crystal-clear seas of Managaha Island, the tragic history of Banzai Cliff, and the Grotto dive site. A unique US territory close to Korea.', ja: 'マニャガハ島の透明な海、バンザイクリフの悲劇的な歴史、グロットダイビングポイント。韓国に近いアメリカ領のユニークなリゾート。', zh: '玛娜佳哈岛清澈的海、万岁崖悲剧的历史、蓝洞潜水点。距韩国近却是美国领土的独特度假胜地。' },
    photos: ['Managaha', 'Banzai Cliff', 'The Grotto (Saipan)'],
    bestSeason: { ko: '12~6월', en: 'Dec–Jun', ja: '12~6月', zh: '12~6月' },
  },
  '괌': {
    en: 'Guam',
    tagline: { ko: '미국 영토의 열대 천국', en: 'America\'s tropical paradise', ja: 'アメリカ領の熱帯楽園', zh: '美国领土的热带天堂' },
    desc: { ko: '투몬 비치의 흰 모래, 사랑의 절벽에서 보는 망망대해, 차모로 빌리지의 야시장. 비행 4시간 거리에서 만나는 미국식 휴양지.', en: 'Tumon Beach\'s white sands, the endless ocean from Two Lovers Point, and the Chamorro Village night market. An American-style resort just 4 hours away.', ja: 'タモンビーチの白い砂、恋人岬から見る大海原、チャモロビレッジの夜市。飛行機4時間で出会えるアメリカ式リゾート。', zh: '杜梦湾的白沙、恋人崖看见的茫茫大海、查莫罗村夜市。飞行4小时即可抵达的美式度假地。' },
    photos: ['Two Lovers Point', 'Tumon', 'Talofofo Falls', 'Ritidian Point'],
    bestSeason: { ko: '12~6월', en: 'Dec–Jun', ja: '12~6月', zh: '12~6月' },
  },
  '두바이': {
    en: 'Dubai',
    tagline: { ko: '사막 위의 황금빛 미래도시', en: 'A golden future city on the desert', ja: '砂漠の上の黄金の未来都市', zh: '沙漠之上的黄金未来之城' },
    desc: { ko: '세계 최고층 부르즈 칼리파, 7성급 부르즈 알 아랍, 인공 섬 팜 주메이라. 사막 사파리와 럭셔리 쇼핑이 공존하는 미래.', en: 'The world\'s tallest Burj Khalifa, 7-star Burj Al Arab, and the artificial Palm Jumeirah. A future where desert safari and luxury shopping coexist.', ja: '世界最高層のブルジュ・ハリファ、7つ星のブルジュ・アル・アラブ、人工島パーム・ジュメイラ。砂漠サファリと高級ショッピングが共存する未来。', zh: '世界最高的哈利法塔、七星级帆船酒店、人工岛朱美拉棕榈岛。沙漠探险与奢华购物共存的未来之都。' },
    photos: ['Burj Khalifa', 'Burj Al Arab', 'Palm Jumeirah', 'Dubai Mall', 'Dubai Marina'],
    bestSeason: { ko: '11~3월', en: 'Nov–Mar', ja: '11~3月', zh: '11~3月' },
  },
  '몰디브': {
    en: 'Maldives',
    tagline: { ko: '1,200개 산호섬의 인도양 낙원', en: 'Indian Ocean paradise of 1,200 coral islands', ja: '1,200の珊瑚礁のインド洋の楽園', zh: '1200座珊瑚岛的印度洋天堂' },
    desc: { ko: '수상 빌라에서 바로 뛰어드는 투명한 바다, 세계 최고의 다이빙 포인트, 별빛 아래 디너. 신혼여행 1순위의 이유.', en: 'Crystal seas at the doorstep of overwater villas, world-class dive sites, dinner under starlight. The reason it tops honeymoon lists.', ja: '水上ヴィラから飛び込める透明な海、世界最高のダイビングポイント、星空の下のディナー。新婚旅行1位の理由。', zh: '从水上别墅直接跳入透明的海，世界顶级的潜水点，星空下的晚餐。蜜月旅行首选的理由。' },
    photos: ['Bioluminescence in the Maldives', 'Banana Reef', 'Whale shark', 'Manta ray'],
    bestSeason: { ko: '11~4월', en: 'Nov–Apr', ja: '11~4月', zh: '11~4月' },
  },
  '뉴욕': {
    en: 'New York City',
    tagline: { ko: '잠들지 않는 도시', en: 'The city that never sleeps', ja: '眠らない街', zh: '不夜城' },
    desc: { ko: '타임스퀘어의 휘황찬란한 네온, 센트럴 파크의 사계절, 브로드웨이 뮤지컬과 메트로폴리탄 미술관. 모든 문화가 모이는 세계의 수도.', en: 'The dazzling neon of Times Square, the four seasons of Central Park, Broadway musicals and the Met. The capital of world culture.', ja: 'タイムズスクエアの華やかなネオン、セントラルパークの四季、ブロードウェイミュージカルとメトロポリタン美術館。あらゆる文化が集まる世界の首都。', zh: '时代广场绚丽的霓虹、中央公园的四季、百老汇音乐剧和大都会博物馆。汇聚所有文化的世界之都。' },
    photos: ['Times Square', 'Central Park', 'Statue of Liberty', 'Empire State Building', 'Brooklyn Bridge'],
    bestSeason: { ko: '4~6월, 9~11월', en: 'Apr–Jun, Sep–Nov', ja: '4~6月、9~11月', zh: '4~6月、9~11月' },
  },
  '상하이': {
    en: 'Shanghai',
    tagline: { ko: '동방의 진주, 미래와 과거가 마주보는 도시', en: 'The Pearl of the Orient, past meets future', ja: '東洋の真珠、未来と過去が向き合う街', zh: '东方明珠，未来与过去对望之城' },
    desc: { ko: '와이탄에서 바라본 푸동의 마천루 야경, 예원의 명청 시대 정원, 신톈디의 모던한 골목. 중국 경제의 심장.', en: 'The Pudong skyline view from the Bund, Yu Garden\'s Ming-era beauty, and the modern alleys of Xintiandi. The heart of China\'s economy.', ja: '外灘から眺める浦東の摩天楼の夜景、豫園の明清時代の庭園、新天地のモダンな路地。中国経済の心臓。', zh: '从外滩眺望浦东摩天大楼夜景、豫园的明清时代园林、新天地的摩登小巷。中国经济的心脏。' },
    photos: ['The Bund', 'Oriental Pearl Tower', 'Yu Garden', 'Shanghai Tower', 'Nanjing Road'],
    bestSeason: { ko: '3~5월, 9~11월', en: 'Mar–May, Sep–Nov', ja: '3~5月、9~11月', zh: '3~5月、9~11月' },
  },
  '베네치아': {
    en: 'Venice',
    tagline: { ko: '물 위에 떠 있는 천 년의 도시', en: 'A thousand-year city floating on water', ja: '水に浮かぶ千年の街', zh: '漂浮在水上的千年之城' },
    desc: { ko: '곤돌라가 미끄러지는 좁은 운하들, 산 마르코 광장의 비둘기 떼, 가면 카니발의 신비로움. 차도 자전거도 없는 동화 같은 도시.', en: 'Narrow canals where gondolas glide, the pigeons of St. Mark\'s Square, and the mystery of the masked Carnival. A fairytale city without cars or bicycles.', ja: 'ゴンドラが滑る狭い運河、サン・マルコ広場の鳩、仮面カーニバルの神秘。車も自転車もないおとぎ話の街。', zh: '贡多拉滑过的窄运河、圣马可广场的鸽群、面具狂欢节的神秘。没有汽车和自行车的童话之城。' },
    photos: ['St. Mark\'s Square', 'Grand Canal (Venice)', 'Rialto Bridge', 'Doge\'s Palace'],
    bestSeason: { ko: '4~6월, 9~10월', en: 'Apr–Jun, Sep–Oct', ja: '4~6月、9~10月', zh: '4~6月、9~10月' },
  },
  '두브로브니크': {
    en: 'Dubrovnik',
    tagline: { ko: '아드리아해의 진주', en: 'The pearl of the Adriatic', ja: 'アドリア海の真珠', zh: '亚得里亚海的明珠' },
    desc: { ko: '두꺼운 성벽으로 둘러싸인 구시가지, 주황색 지붕과 푸른 바다의 대비, 왕좌의 게임 촬영지로 유명한 풍경. 동유럽 휴양의 베이스캠프.', en: 'The old town surrounded by thick walls, the contrast of orange roofs and blue sea, and the famous Game of Thrones filming locations. The base of Eastern European resorts.', ja: '厚い城壁に囲まれた旧市街、オレンジの屋根と青い海のコントラスト、ゲーム・オブ・スローンズの撮影地として有名な風景。東欧リゾートの拠点。', zh: '厚厚城墙环绕的老城区、橙色屋顶与蓝色海洋的对比、《权力的游戏》的著名取景地。东欧度假地的据点。' },
    photos: ['Walls of Dubrovnik', 'Stradun', 'Lokrum', 'Fort Lovrijenac'],
    bestSeason: { ko: '5~10월', en: 'May–Oct', ja: '5~10月', zh: '5~10月' },
  },
  '후쿠오카': {
    en: 'Fukuoka',
    tagline: { ko: '큐슈의 관문, 라멘의 본고장', en: 'Gateway to Kyushu, ramen capital', ja: '九州の玄関口、ラーメンの本場', zh: '九州的门户，拉面之乡' },
    desc: { ko: '하카타 라멘과 모츠나베, 텐진의 쇼핑가, 후쿠오카 타워의 야경. 일본 최남단 큐슈 여행의 시작점.', en: 'Hakata ramen and motsunabe, the shopping streets of Tenjin, and the night view from Fukuoka Tower. The starting point for southern Kyushu travel.', ja: '博多ラーメンとモツ鍋、天神のショッピング街、福岡タワーの夜景。九州旅行の出発点。', zh: '博多拉面与牛肠锅、天神购物街、福冈塔的夜景。九州旅行的起点。' },
    photos: ['Fukuoka Tower', 'Fukuoka Castle', 'Canal City Hakata', 'Ohori Park'],
    bestSeason: { ko: '3~5월, 10~11월', en: 'Mar–May, Oct–Nov', ja: '3~5月、10~11月', zh: '3~5月、10~11月' },
  },
  '싱가포르': {
    en: 'Singapore',
    tagline: { ko: '미래도시의 정원', en: 'Garden city of the future', ja: '未来都市の庭園', zh: '未来花园都市' },
    desc: { ko: '마리나 베이 샌즈의 인피니티 풀, 가든스 바이 더 베이의 슈퍼트리, 머라이언과 호커센터의 미식. 청결과 효율의 도시.', en: 'The infinity pool at Marina Bay Sands, Supertrees at Gardens by the Bay, the Merlion, and hawker center cuisine. The city of cleanliness and efficiency.', ja: 'マリーナベイサンズのインフィニティプール、ガーデンズ・バイ・ザ・ベイのスーパーツリー、マーライオンとホーカーセンターの美食。清潔と効率の都市。', zh: '滨海湾金沙的无边泳池、滨海湾花园的擎天大树、鱼尾狮与小贩中心的美食。整洁高效的都市。' },
    photos: ['Marina Bay Sands', 'Gardens by the Bay', 'Merlion', 'Singapore Flyer', 'ArtScience Museum'],
    bestSeason: { ko: '2~4월', en: 'Feb–Apr', ja: '2~4月', zh: '2~4月' },
  },
  '아테네': {
    en: 'Athens',
    tagline: { ko: '서양 문명의 발상지', en: 'The cradle of Western civilization', ja: '西洋文明発祥の地', zh: '西方文明的发源地' },
    desc: { ko: '2,500년을 견뎌온 파르테논 신전과 아크로폴리스, 플라카 거리의 신선한 그리스 요리. 신화와 철학이 시작된 도시.', en: 'The Parthenon and Acropolis enduring 2,500 years, fresh Greek food on Plaka streets. The city where myth and philosophy began.', ja: '2500年を耐えてきたパルテノン神殿とアクロポリス、プラカ通りの新鮮なギリシャ料理。神話と哲学が始まった街。', zh: '历经2500年的帕特农神庙与卫城、普拉卡街新鲜的希腊料理。神话与哲学的发源地。' },
    photos: ['Acropolis of Athens', 'Parthenon', 'Erechtheion', 'Temple of Olympian Zeus, Athens', 'Mount Lycabettus'],
    bestSeason: { ko: '4~6월, 9~10월', en: 'Apr–Jun, Sep–Oct', ja: '4~6月、9~10月', zh: '4~6月、9~10月' },
  },
  '프라하': {
    en: 'Prague',
    tagline: { ko: '동유럽의 보석, 100탑의 도시', en: 'The jewel of Eastern Europe, city of 100 spires', ja: '東欧の宝石、100の尖塔の街', zh: '东欧的明珠，百塔之城' },
    desc: { ko: '카를교 위의 30개 성인 동상, 천문시계의 정시 인형 공연, 프라하 성의 황금 골목길. 동화처럼 보존된 중세 도시.', en: 'The 30 saint statues on Charles Bridge, the astronomical clock\'s hourly show, and the Golden Lane of Prague Castle. A fairytale-preserved medieval city.', ja: 'カレル橋の30の聖人像、天文時計の毎時の人形劇、プラハ城の黄金の小径。おとぎ話のように保存された中世都市。', zh: '查理大桥上的30尊圣徒雕像、天文钟的整点表演、布拉格城堡的黄金小巷。如童话般保存的中世纪城市。' },
    photos: ['Charles Bridge', 'Prague Castle', 'Prague astronomical clock', 'St. Vitus Cathedral', 'Old Town Square, Prague'],
    bestSeason: { ko: '4~6월, 9~10월', en: 'Apr–Jun, Sep–Oct', ja: '4~6月、9~10月', zh: '4~6月、9~10月' },
  },
  '런던': {
    en: 'London',
    tagline: { ko: '신사의 나라, 시간의 도시', en: 'Land of gentlemen, city of time', ja: '紳士の国、時の都', zh: '绅士之国，时间之都' },
    desc: { ko: '빅벤의 거대한 시계탑, 타워 브리지의 위용, 버킹엄 궁전의 근위병 교대식. 박물관과 펍과 뮤지컬이 풍성한 영국의 수도.', en: 'Big Ben\'s massive clock tower, the majesty of Tower Bridge, the Buckingham Palace guards. The capital of museums, pubs, and musicals.', ja: 'ビッグベンの巨大な時計塔、タワーブリッジの威容、バッキンガム宮殿の衛兵交代式。博物館とパブとミュージカルの英国の首都。', zh: '大本钟巨大的钟楼、塔桥的雄伟、白金汉宫的卫兵交接。博物馆、酒馆与音乐剧丰富的英国首都。' },
    photos: ['Tower Bridge', 'Big Ben', 'London Eye', 'Buckingham Palace', 'Tower of London'],
    bestSeason: { ko: '5~9월', en: 'May–Sep', ja: '5~9月', zh: '5~9月' },
  },
}

// 다국어 객체에서 lang에 맞는 값 추출 (fallback: lang → en → ko)
export const pickI18n = (value, lang) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value[lang] || value.en || value.ko || ''
}

export default CITY_PHOTOS
