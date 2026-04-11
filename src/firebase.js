// ── Firebase 초기화 + Auth/Firestore/Storage 헬퍼 ──
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

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

// ── 사진 업로드 (Storage) ──
export const uploadPhoto = async (file, path) => {
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return await getDownloadURL(storageRef)
}

// ── 공유 코스 (소셜) ──
export const shareCourse = async (uid, course, userName, photos) => {
  const id = `${uid}_${Date.now()}`
  await setDoc(doc(db, 'shared_courses', id), {
    ...course, id, uid, userName: userName || 'Anonymous',
    sharedAt: Date.now(), likes: 0, photos: photos || [], comments: []
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

// ── 댓글 ──
export const addComment = async (courseId, comment) => {
  const courseRef = doc(db, 'shared_courses', courseId)
  const snap = await getDoc(courseRef)
  if (snap.exists()) {
    const data = snap.data()
    const comments = [...(data.comments || []), { ...comment, id: Date.now().toString(), createdAt: Date.now() }]
    await updateDoc(courseRef, { comments })
    return comments
  }
  return []
}

export const deleteComment = async (courseId, commentId) => {
  const courseRef = doc(db, 'shared_courses', courseId)
  const snap = await getDoc(courseRef)
  if (snap.exists()) {
    const data = snap.data()
    const comments = (data.comments || []).filter(c => c.id !== commentId)
    await updateDoc(courseRef, { comments })
    return comments
  }
  return []
}
