// ── Firebase 초기화 + Auth/Firestore/Storage 헬퍼 ──
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, query, orderBy, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore'
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
