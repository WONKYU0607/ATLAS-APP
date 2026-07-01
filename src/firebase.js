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
// files를 attractions/{place_id}/ 에 올리고 URL을 관광지 문서 photos 배열에 추가 (폴더 자동 생성)
export const uploadAttractionPhotos = async (country, city, placeId, files, onEach) => {
  const attrDoc = doc(db, 'countries', country, 'cities', city, 'attractions', placeId)
  const snap = await getDoc(attrDoc)
  const existing = (snap.exists() && Array.isArray(snap.data().photos)) ? snap.data().photos : []
  const newItems = []
  let i = 0
  for (const file of files) {
    const ts = Date.now() + '_' + Math.random().toString(36).slice(2, 6)
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `attractions/${placeId}/${ts}.${ext}`
    const sref = storageRef(storage, path)
    await uploadBytes(sref, file)
    const url = await getDownloadURL(sref)
    newItems.push({ url, path })
    i++
    if (onEach) onEach(i, files.length)
  }
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
