// ── Firebase 초기화 + Auth/Firestore 헬퍼 ──
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore'

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

// ── Auth 함수 ──
export const loginEmail = (email, pw) => signInWithEmailAndPassword(auth, email, pw)
export const signupEmail = (email, pw) => createUserWithEmailAndPassword(auth, email, pw)
export const loginGoogle = () => signInWithPopup(auth, new GoogleAuthProvider())
export const logout = () => signOut(auth)
export const onAuth = (cb) => onAuthStateChanged(auth, cb)

// ── Firestore 유저 데이터 ──
const userDocRef = (uid) => doc(db, 'users', uid)

// 유저 데이터 로드
export const loadUserData = async (uid) => {
  const snap = await getDoc(userDocRef(uid))
  return snap.exists() ? snap.data() : null
}

// 유저 데이터 저장 (merge)
export const saveUserData = async (uid, data) => {
  await setDoc(userDocRef(uid), { ...data, updatedAt: Date.now() }, { merge: true })
}

// 유저 프로필 업데이트 (displayName 등)
export const updateUserProfile = (user, data) => updateProfile(user, data)

// ── 공유 코스 (소셜) ──
export const shareCourse = async (uid, course, userName) => {
  const id = `${uid}_${Date.now()}`
  await setDoc(doc(db, 'shared_courses', id), {
    ...course, id, uid, userName: userName || 'Anonymous',
    sharedAt: Date.now(), likes: 0
  })
  return id
}

export const loadSharedCourses = async () => {
  const q = query(collection(db, 'shared_courses'), orderBy('sharedAt', 'desc'), limit(50))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data())
}

export const deleteSharedCourse = async (id) => {
  await deleteDoc(doc(db, 'shared_courses', id))
}
