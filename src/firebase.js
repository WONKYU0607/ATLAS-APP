// ── Firebase 초기화 + Auth/Firestore/Storage 헬퍼 ──
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, query, orderBy, where, limit, startAfter, arrayUnion, arrayRemove, serverTimestamp, increment } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyACm8gKlsLdho0YIU-M0CKOwG1RWaXS4EU",
  authDomain: "atlas-travel-7a977.firebaseapp.com",
  projectId: "atlas-travel-7a977",
  storageBucket: "atlas-travel-7a977.firebasestorage.app",
  messagingSenderId: "787265820340",
  appId: "1:787265820340:web:6354e20f78eae9548629e1",
  measurementId: "G-823NYBJGGV"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// ── Auth 함수 ──
export const loginEmail = (email, pw) => signInWithEmailAndPassword(auth, email, pw)
export const signupEmail = (email, pw) => createUserWithEmailAndPassword(auth, email, pw)
export const loginGoogle = () => signInWithPopup(auth, new GoogleAuthProvider())
export const logout = () => signOut(auth)
export const onAuth = (cb) => onAuthStateChanged(auth, cb)

// ── Firestore 유저 데이터 ──
const userDocRef = (uid) => doc(db, 'users', uid)

export const loadUserData = async (uid) => {
  const snap = await getDoc(userDocRef(uid))
  return snap.exists() ? snap.data() : null
}

export const saveUserData = async (uid, data) => {
  await setDoc(userDocRef(uid), { ...data, updatedAt: Date.now() }, { merge: true })
}

export const updateUserProfile = (user, data) => updateProfile(user, data)

// ── 커뮤니티: 공유 코스 ──
const sharedCoursesRef = collection(db, 'sharedCourses')

// 코스 공유 (업로드)
export const shareCourse = async (uid, courseI18n, userName, photos = []) => {
  const data = {
    uid,
    userName: userName || 'Anonymous',
    course: courseI18n,
    photos,
    comments: [],
    likes: [],
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  }
  const ref = await addDoc(sharedCoursesRef, data)
  return { id: ref.id, ...data }
}

// 전체 공유 코스 로드 (최신순)
export const loadSharedCourses = async () => {
  const q = query(sharedCoursesRef, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// 공유 코스 삭제 (본인만)
export const deleteSharedCourse = async (courseId) => {
  await deleteDoc(doc(db, 'sharedCourses', courseId))
}

// 사진 업로드 → Firebase Storage → URL 반환
export const uploadPhoto = async (file, path) => {
  const ref = storageRef(storage, path)
  await uploadBytes(ref, file)
  return await getDownloadURL(ref)
}

// ── 관광지 사진: Storage 업로드 + Firestore photos 필드 자동 연동 ──
// 사진 압축: 긴 변 1200px로 리사이즈 + JPEG 품질 0.8 (용량 대폭 절감)
const compressImage = (file, maxSize = 1200, quality = 0.8) => new Promise((resolve) => {
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    URL.revokeObjectURL(url)
    let { width, height } = img
    if (width > maxSize || height > maxSize) {
      if (width >= height) { height = Math.round(height * maxSize / width); width = maxSize }
      else { width = Math.round(width * maxSize / height); height = maxSize }
    }
    const canvas = document.createElement('canvas')
    canvas.width = width; canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    canvas.toBlob(
      (blob) => resolve(blob || file),   // 실패 시 원본 반환
      'image/jpeg', quality
    )
  }
  img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }  // 이미지 로드 실패 시 원본
  img.src = url
})

// files를 attractions/{place_id}/ 에 올리고 URL을 관광지 문서 photos 배열에 추가 (폴더 자동 생성)
export const uploadAttractionPhotos = async (country, city, placeId, files, onEach) => {
  const attrDoc = doc(db, 'countries', country, 'cities', city, 'attractions', placeId)
  const snap = await getDoc(attrDoc)
  const existing = (snap.exists() && Array.isArray(snap.data().photos)) ? snap.data().photos : []
  const newItems = []
  let i = 0
  for (const file of files) {
    const compressed = await compressImage(file)   // 압축(긴변 1200px, JPEG 0.8)
    const ts = Date.now() + '_' + Math.random().toString(36).slice(2, 6)
    const path = `attractions/${country}/${city}/${placeId}/${ts}.jpg`   // 국가/도시/관광지 계층, 압축결과 jpg
    const sref = storageRef(storage, path)
    await uploadBytes(sref, compressed, { contentType: 'image/jpeg' })
    const url = await getDownloadURL(sref)
    newItems.push({ url, path })
    i++
    if (onEach) onEach(i, files.length)
  }
  const merged = [...existing, ...newItems]
  await setDoc(attrDoc, { photos: merged, updatedAt: Date.now() }, { merge: true })
  return merged
}

// ── 위키피디아 문서 이미지 검색 (키 불필요, CORS 허용) ──
// 관광지명 → 위키피디아 문서를 찾고, 그 문서에 실린 이미지만 반환. Commons 검색은 쓰지 않음
// (Commons 텍스트/카테고리 검색은 이름만 비슷하면 엉뚱한 사진이 섞여 신뢰도가 낮았음).
// 라이센스는 CC/PD라 Storage 영구 저장 가능. 문서가 없으면 빈 배열 → 수동으로 채운다.
export const searchCommonsPhotos = async (query, limit = 5, cityHint = '') => {
  const WIKI = 'https://en.wikipedia.org/w/api.php'
  const COMMONS = 'https://commons.wikimedia.org/w/api.php'
  const cleanAuthor = (html) => {
    if (!html) return ''
    return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim().slice(0, 80)
  }
  const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
  // 쓰레기 파일 필터: 로고(svg), 지도/다이어그램, 아이콘, 깃발/문장, 오래된 흑백(연도 파일명)
  const isBadFile = (title) => {
    const t = (title || '').toLowerCase()
    if (/\.(svg|ogg|ogv|webm|oga|mid|pdf)$/.test(t)) return true
    if (/(logo|icon|map|diagram|plan|coat.of.arms|flag|seal|signature|annotated|blank|placeholder|question.book|ambox|commons-logo|wiki(pedia|media)|edit-|increase|decrease|red.pog|location.dot)/.test(t)) return true
    if (/\b(18|19)\d\d\b/.test(t)) return true
    return false
  }
  const mapPage = (p) => {
    const ii = p.imageinfo?.[0] || {}
    const m = ii.extmetadata || {}
    return {
      title: (p.title || '').replace(/^File:/, ''),
      thumbUrl: ii.thumburl || '',
      fullUrl: ii.url || '',
      width: ii.width || 0,
      height: ii.height || 0,
      license: m.LicenseShortName?.value || 'Unknown',
      author: cleanAuthor(m.Artist?.value),
      sourceUrl: (p.title ? `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}` : ''),
    }
  }
  const nq = norm(query)
  // (1) 문서 제목 해결 — 정확 제목만 조회하면 구글 장소명과 표기가 다를 때 전부 실패하므로 검색으로 찾는다
  const resolveTitle = async () => {
    const q = cityHint ? `${query} ${cityHint}` : query
    const u = `${WIKI}?origin=*&action=query&format=json&list=search&srsearch=${encodeURIComponent(q)}&srlimit=5&srnamespace=0`
    const d = await fetch(u).then(r => r.json())
    const hits = (d?.query?.search || []).map(s => s.title)
    if (!hits.length) return null
    const scored = hits.map(t => {
      const nt = norm(t.replace(/\s*\([^)]*\)$/, ''))
      let score = 0
      if (nt === nq) score = 100                                      // 정확 일치
      else if (nt.startsWith(nq)) score = 90 - (nt.length - nq.length) // 관광지명으로 시작
      else if (nt.includes(nq)) score = 70 - (nt.length - nq.length)
      else if (nq.includes(nt) && nt.length >= 4) score = 40
      return { title: t, score }
    }).sort((a, b) => b.score - a.score)
    return scored[0].score > 0 ? scored[0].title : null   // 억지 매칭 방지: 점수 0이면 포기
  }
  // (2) 그 문서에 실린 이미지 전부 — 사람이 문서에 넣은 사진이라 오매칭이 원천적으로 없음
  const fetchArticleImages = async (title) => {
    const u = `${WIKI}?origin=*&action=query&format=json&titles=${encodeURIComponent(title)}&redirects=1`
      + `&generator=images&gimlimit=40&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=400`
    const d = await fetch(u).then(r => r.json())
    let pages = d?.query?.pages ? Object.values(d.query.pages) : []
    pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))   // 본문 등장 순서 = 중요도 순
    let items = pages.map(mapPage).filter(x => x.thumbUrl && x.fullUrl && !isBadFile(x.title))
    // 아이콘류 제거: 짧은 변이 200px 미만이면 사진이 아님
    items = items.filter(x => Math.min(x.width || 0, x.height || 0) >= 200)
    // 위키 API가 라이센스 메타를 안 실어줄 때가 있어 en.wikipedia 쪽 결과는 Commons에서 보강
    const need = items.filter(x => x.license === 'Unknown').slice(0, limit)
    if (need.length) {
      try {
        const t = need.map(x => 'File:' + x.title).join('|')
        const md = await fetch(`${COMMONS}?origin=*&action=query&format=json&titles=${encodeURIComponent(t)}&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=400`).then(r => r.json())
        const mp = md?.query?.pages ? Object.values(md.query.pages) : []
        const byTitle = {}
        mp.forEach(p => { const it = mapPage(p); if (it.title) byTitle[it.title] = it })
        items = items.map(x => (x.license === 'Unknown' && byTitle[x.title]) ? { ...x, license: byTitle[x.title].license, author: byTitle[x.title].author } : x)
      } catch {}
    }
    return items.slice(0, limit)
  }
  try {
    const title = await resolveTitle()
    if (!title) return []
    return await fetchArticleImages(title)
  } catch (e) { console.error('[searchCommonsPhotos] 실패:', query, e?.message || e); return [] }
}

// ── Commons(등 외부 URL) 사진을 Storage에 저장 + Firestore photos에 라이센스 포함 기록 ──
// items: [{ fullUrl, thumbUrl, license, author, sourceUrl, title }]
export const uploadPhotosFromUrls = async (country, city, placeId, items, onEach) => {
  const attrDoc = doc(db, 'countries', country, 'cities', city, 'attractions', placeId)
  const snap = await getDoc(attrDoc)
  const existing = (snap.exists() && Array.isArray(snap.data().photos)) ? snap.data().photos : []
  const newItems = []
  let i = 0
  for (const it of items) {
    try {
      // 원본이 너무 크면 실패할 수 있어 썸네일(400px 이상) 우선순위: 저장은 fullUrl 시도 → 실패 시 thumbUrl
      let blob
      try { blob = await fetch(it.fullUrl).then(r => { if (!r.ok) throw new Error(r.status); return r.blob() }) }
      catch { blob = await fetch(it.thumbUrl).then(r => r.blob()) }
      const compressed = await compressImage(blob)
      const ts = Date.now() + '_' + Math.random().toString(36).slice(2, 6)
      const path = `attractions/${country}/${city}/${placeId}/${ts}.jpg`
      const sref = storageRef(storage, path)
      await uploadBytes(sref, compressed, { contentType: 'image/jpeg' })
      const url = await getDownloadURL(sref)
      newItems.push({ url, path, license: it.license || '', author: it.author || '', sourceUrl: it.sourceUrl || '', source: 'wikimedia' })
    } catch (e) {
      console.error('[Commons 저장 실패]', it.title, e?.message || e)
    }
    i++
    if (onEach) onEach(i, items.length)
  }
  if (!newItems.length) throw new Error('저장된 사진이 없습니다 (전부 실패)')
  const merged = [...existing, ...newItems]
  await setDoc(attrDoc, { photos: merged, updatedAt: Date.now() }, { merge: true })
  return merged
}

// 관광지 사진 목록 조회
export const getAttractionPhotos = async (country, city, placeId) => {
  try {
    const snap = await getDoc(doc(db, 'countries', country, 'cities', city, 'attractions', placeId))
    if (snap.exists() && Array.isArray(snap.data().photos)) return snap.data().photos
  } catch {}
  return []
}

// 도시의 모든 관광지 사진을 1회 컬렉션 쿼리로 일괄 조회 → { place_id: [{url,path}] } (관광지 25개 개별조회 25회 → 1회)
// 추출 데이터 계층(countries/{국가}/cities/{도시})의 도시 문서 조회 → { desc, food, ... }
// Firebase 콘솔에서 직접 수정한 소개글/음식문화를 앱에 반영하기 위함 (cityCache보다 우선)
export const getCityDoc = async (country, city) => {
  try {
    const snap = await getDoc(doc(db, 'countries', country, 'cities', city))
    return snap.exists() ? snap.data() : null
  } catch { return null }
}

export const getCityAttractionPhotos = async (country, city) => {
  const out = {}
  try {
    const snap = await getDocs(collection(db, 'countries', country, 'cities', city, 'attractions'))
    snap.forEach(d => {
      const ph = d.data().photos
      if (Array.isArray(ph) && ph.length) out[d.id] = ph   // 문서ID = place_id
    })
  } catch (e) { console.error('[getCityAttractionPhotos] 실패:', e?.message || e) }
  return out
}

// 관광지 사진 1장 삭제 (Storage 파일 + Firestore 배열에서 제거)
export const deleteAttractionPhoto = async (country, city, placeId, photoItem) => {
  const attrDoc = doc(db, 'countries', country, 'cities', city, 'attractions', placeId)
  try {
    if (photoItem.path) { const { deleteObject } = await import('firebase/storage'); await deleteObject(storageRef(storage, photoItem.path)) }
  } catch (e) { console.warn('[deletePhoto] Storage 삭제 실패(무시):', e?.message) }
  const snap = await getDoc(attrDoc)
  const cur = (snap.exists() && Array.isArray(snap.data().photos)) ? snap.data().photos : []
  const filtered = cur.filter(p => (p.url || p) !== (photoItem.url || photoItem))
  await setDoc(attrDoc, { photos: filtered, updatedAt: Date.now() }, { merge: true })
  return filtered
}

// 대표 사진 지정: 선택한 사진을 photos 배열 맨 앞으로 이동 (첫 사진이 썸네일이 됨)
export const setAttractionCoverPhoto = async (country, city, placeId, photoItem) => {
  const attrDoc = doc(db, 'countries', country, 'cities', city, 'attractions', placeId)
  const snap = await getDoc(attrDoc)
  const cur = (snap.exists() && Array.isArray(snap.data().photos)) ? snap.data().photos : []
  const key = photoItem.url || photoItem
  const target = cur.find(p => (p.url || p) === key)
  if (!target) return cur
  const reordered = [target, ...cur.filter(p => (p.url || p) !== key)]
  await setDoc(attrDoc, { photos: reordered, updatedAt: Date.now() }, { merge: true })
  return reordered
}

// ── 관광지 제외목록: 추천에서 영구 제외할 place_id (단일 문서에 배열 저장) ──
// ── 작업 완료 도시: 소개글·음식문화·관광지 사진을 다 채운 도시 (라벨 빨간색 표시용) ──
const completedRef = () => doc(db, 'config', 'completedCities')

export const getCompletedCities = async () => {
  try {
    const snap = await getDoc(completedRef())
    return (snap.exists() && Array.isArray(snap.data().cities)) ? snap.data().cities : []
  } catch { return [] }
}

export const addCompletedCity = async (cityName) => {
  try {
    await setDoc(completedRef(), { cities: arrayUnion(cityName), updatedAt: Date.now() }, { merge: true })
    return true
  } catch (e) { console.error('[addCompletedCity] 실패:', e?.message || e); return false }
}

// 일괄 추가 (1회성 작업용) — arrayUnion은 가변인자라 한 번의 쓰기로 처리됨
export const addCompletedCities = async (cityNames) => {
  try {
    await setDoc(completedRef(), { cities: arrayUnion(...cityNames), updatedAt: Date.now() }, { merge: true })
    return true
  } catch (e) { console.error('[addCompletedCities] 실패:', e?.message || e); return false }
}

export const removeCompletedCity = async (cityName) => {
  try {
    await setDoc(completedRef(), { cities: arrayRemove(cityName), updatedAt: Date.now() }, { merge: true })
    return true
  } catch (e) { console.error('[removeCompletedCity] 실패:', e?.message || e); return false }
}

const excludedRef = () => doc(db, 'config', 'excludedAttractions')

export const getExcludedAttractions = async () => {
  try {
    const snap = await getDoc(excludedRef())
    return (snap.exists() && Array.isArray(snap.data().ids)) ? snap.data().ids : []
  } catch { return [] }
}

export const addExcludedAttraction = async (placeId) => {
  try {
    await setDoc(excludedRef(), { ids: arrayUnion(placeId), updatedAt: Date.now() }, { merge: true })
    return true
  } catch (e) { console.error('[addExcluded] 실패:', e?.message || e); return false }
}

export const removeExcludedAttraction = async (placeId) => {
  try {
    await setDoc(excludedRef(), { ids: arrayRemove(placeId), updatedAt: Date.now() }, { merge: true })
    return true
  } catch (e) { console.error('[removeExcluded] 실패:', e?.message || e); return false }
}

// 댓글 추가
export const addComment = async (courseId, comment) => {
  const courseRef = doc(db, 'sharedCourses', courseId)
  const snap = await getDoc(courseRef)
  if (!snap.exists()) return []
  const current = snap.data().comments || []
  const newComment = { ...comment, id: Date.now() + '_' + Math.random().toString(36).slice(2, 8), createdAt: Date.now() }
  const updated = [...current, newComment]
  await updateDoc(courseRef, { comments: updated })
  return updated
}

// 댓글 삭제
export const deleteComment = async (courseId, commentId) => {
  const courseRef = doc(db, 'sharedCourses', courseId)
  const snap = await getDoc(courseRef)
  if (!snap.exists()) return []
  const filtered = (snap.data().comments || []).filter(c => c.id !== commentId)
  await updateDoc(courseRef, { comments: filtered })
  return filtered
}

// 좋아요 토글
export const toggleLike = async (courseId, uid) => {
  const courseRef = doc(db, 'sharedCourses', courseId)
  const snap = await getDoc(courseRef)
  if (!snap.exists()) return []
  const current = snap.data().likes || []
  const has = current.includes(uid)
  await updateDoc(courseRef, { likes: has ? arrayRemove(uid) : arrayUnion(uid) })
  return has ? current.filter(x => x !== uid) : [...current, uid]
}

// ── 트래블 피드: 여행기 (journals) ──
const journalsRef = collection(db, 'journals')

// 여행기 작성
export const createJournal = async (uid, journalData, userName, userPhoto) => {
  const data = {
    uid,
    userName: userName || 'Anonymous',
    userPhoto: userPhoto || null,
    title: journalData.title || '',
    body: journalData.body || '',
    blocks: journalData.blocks || [],          // 블로그식: [{photo, caption}]
    photos: journalData.photos || [],          // 썸네일/구버전 호환 (blocks 첫 사진 자동 채움)
    cities: journalData.cities || [],
    startDate: journalData.startDate || '',     // 'YYYY-MM-DD'
    endDate: journalData.endDate || '',
    days: journalData.days || 1,
    rating: journalData.rating || 0,
    visibility: journalData.visibility || 'public',
    likes: [],
    likeCount: 0,
    comments: [],
    commentCount: 0,
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
    updatedAt: Date.now(),
  }
  const ref = await addDoc(journalsRef, data)
  return { id: ref.id, ...data }
}

// 여행기 리스트 로드
// opts: { limitN, byUid, after }
export const loadJournals = async (opts = {}) => {
  const constraints = []
  if (opts.byUid) constraints.push(where('uid', '==', opts.byUid))
  constraints.push(orderBy('createdAt', 'desc'))
  if (opts.after) constraints.push(startAfter(opts.after))
  if (opts.limitN) constraints.push(limit(opts.limitN))
  const q = query(journalsRef, ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// 단일 여행기 로드
export const loadJournal = async (journalId) => {
  const snap = await getDoc(doc(db, 'journals', journalId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// 여행기 수정 (작성자만)
export const updateJournal = async (journalId, data) => {
  const ref = doc(db, 'journals', journalId)
  await updateDoc(ref, { ...data, updatedAt: Date.now() })
}

// 여행기 삭제 (작성자만)
export const deleteJournal = async (journalId) => {
  await deleteDoc(doc(db, 'journals', journalId))
}

// 여행기 좋아요 토글
export const toggleJournalLike = async (journalId, uid) => {
  const ref = doc(db, 'journals', journalId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return { likes: [], likeCount: 0 }
  const current = snap.data().likes || []
  const has = current.includes(uid)
  if (has) {
    await updateDoc(ref, { likes: arrayRemove(uid), likeCount: increment(-1) })
    return { likes: current.filter(x => x !== uid), likeCount: (snap.data().likeCount || 0) - 1 }
  } else {
    await updateDoc(ref, { likes: arrayUnion(uid), likeCount: increment(1) })
    return { likes: [...current, uid], likeCount: (snap.data().likeCount || 0) + 1 }
  }
}

// 여행기 댓글 추가
export const addJournalComment = async (journalId, comment) => {
  const ref = doc(db, 'journals', journalId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return []
  const current = snap.data().comments || []
  const newComment = { ...comment, id: Date.now() + '_' + Math.random().toString(36).slice(2, 8), createdAt: Date.now() }
  const updated = [...current, newComment]
  await updateDoc(ref, { comments: updated, commentCount: updated.length })
  return updated
}

// 여행기 댓글 삭제
export const deleteJournalComment = async (journalId, commentId) => {
  const ref = doc(db, 'journals', journalId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return []
  const filtered = (snap.data().comments || []).filter(c => c.id !== commentId)
  await updateDoc(ref, { comments: filtered, commentCount: filtered.length })
  return filtered
}

// 여행기 사진 업로드
export const uploadJournalPhoto = async (file, uid, journalIdHint) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = 'journals/' + uid + '/' + (journalIdHint || 'tmp') + '/' + Date.now() + '_' + safeName
  const ref = storageRef(storage, path)
  await uploadBytes(ref, file)
  return await getDownloadURL(ref)
}

// ── 공용 캐시: 도시 소개글/음식문화 (cityCache) ──
// key 형식: `${도시키}_${언어}` (예: '도쿄_ko'), 한 문서에 { desc, food } 병합 저장
const cityCacheRef = (key) => doc(db, 'cityCache', key)

export const getCityCache = async (key) => {
  try {
    const snap = await getDoc(cityCacheRef(key))
    return snap.exists() ? snap.data() : null
  } catch { return null }
}

// Firestore는 undefined 값을 저장하면 400 에러 → 저장 전 undefined 필드/배열요소를 재귀 제거
const stripUndefined = (v) => {
  if (Array.isArray(v)) return v.map(stripUndefined).filter(x => x !== undefined)
  if (v && typeof v === 'object') {
    const out = {}
    for (const k in v) {
      const cleaned = stripUndefined(v[k])
      if (cleaned !== undefined) out[k] = cleaned
    }
    return out
  }
  return v === undefined ? undefined : v
}

export const setCityCache = async (key, data) => {
  try {
    await setDoc(cityCacheRef(key), { ...stripUndefined(data), updatedAt: Date.now() }, { merge: true })
  } catch (e) { console.error('[setCityCache] 저장 실패:', key, e?.message || e) }
}

// ── 관광지 데이터 아카이브: countries/{국가}/cities/{도시}/attractions/{place_id} ──
// 추출 JSON을 계층 구조로 Firestore에 업로드. 도시 문서엔 소개글·음식문화, 관광지 문서엔 이름·좌표·place_id·photos
// extractData 형식: { "도시명": { country, desc, food, attractions:[{name,lat,lng,place_id,types}] } }
// onProgress(현재, 전체, 도시명) 콜백으로 진행상황 보고
export const uploadAttractionsArchive = async (extractData, onProgress) => {
  const cities = Object.keys(extractData)
  let done = 0, attractionCount = 0, skipped = 0
  for (const cityName of cities) {
    const d = extractData[cityName]
    const country = d.country || 'Unknown'
    // 도시 문서: 소개글·음식문화
    const cityDoc = doc(db, 'countries', country, 'cities', cityName)
    await setDoc(cityDoc, stripUndefined({
      name: cityName,
      desc: d.desc || '',
      food: d.food || null,
      attractionCount: (d.attractions || []).length,
      updatedAt: Date.now()
    }), { merge: true })
    // 관광지 문서들
    for (const a of (d.attractions || [])) {
      if (!a.place_id) { skipped++; continue }   // place_id 없으면 문서ID 못 만듦 → 스킵
      const attrDoc = doc(db, 'countries', country, 'cities', cityName, 'attractions', a.place_id)
      // merge:true라 재업로드해도 photos는 보존됨(photos는 여기서 안 건드림)
      await setDoc(attrDoc, stripUndefined({
        name: a.name || '',
        lat: a.lat ?? null,
        lng: a.lng ?? null,
        place_id: a.place_id,
        types: a.types || [],
        updatedAt: Date.now()
      }), { merge: true })
      attractionCount++
    }
    done++
    if (onProgress) onProgress(done, cities.length, cityName)
  }
  return { cities: done, attractions: attractionCount, skipped }
}
