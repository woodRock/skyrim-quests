import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider, connectAuthEmulator, createUserWithEmailAndPassword, getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, signInWithPopup, signOut, type Auth,
} from 'firebase/auth'
import {
  collection, connectFirestoreEmulator, deleteDoc, doc, initializeFirestore, onSnapshot, persistentLocalCache,
  persistentMultipleTabManager, setDoc,
} from 'firebase/firestore'
import type { GameFile } from '../game/types'

export interface User { uid: string; email: string | null }
export type Slots = (GameFile | null)[]

export interface Backend {
  mode: 'cloud' | 'local'
  onAuth(cb: (u: User | null) => void): () => void
  signIn(email: string, password: string): Promise<void>
  register(email: string, password: string): Promise<void>
  signInWithGoogle?(): Promise<void>
  signOut(): Promise<void>
  watchFiles(uid: string, cb: (slots: Slots) => void): () => void
  saveFile(uid: string, file: GameFile): Promise<void>
  eraseFile(uid: string, slot: number): Promise<void>
  /** A Firebase ID token for the lore worker, when signed in to the cloud. */
  idToken(): Promise<string | null>
}

const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN, projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET, messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: env.VITE_FIREBASE_APP_ID,
}

const toSlots = (files: GameFile[]): Slots => [1, 2, 3].map((s) => files.find((f) => f.slot === s) ?? null)

function cloudBackend(app: FirebaseApp): Backend {
  const auth: Auth = getAuth(app)
  // Persistent cache: the quest log works offline and syncs when back online.
  // Optional quest fields (due, lore, doneAt...) may be undefined; Firestore must drop them rather than reject the save.
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    ignoreUndefinedProperties: true,
  })
  if (env.VITE_USE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, '127.0.0.1', 8085)
  }
  const saves = (uid: string) => collection(db, 'users', uid, 'saves')
  return {
    mode: 'cloud',
    onAuth: (cb) => onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email } : null)),
    signIn: async (email, pw) => void (await signInWithEmailAndPassword(auth, email, pw)),
    register: async (email, pw) => void (await createUserWithEmailAndPassword(auth, email, pw)),
    signInWithGoogle: async () => void (await signInWithPopup(auth, new GoogleAuthProvider())),
    signOut: () => signOut(auth),
    watchFiles: (uid, cb) => onSnapshot(saves(uid), (snap) => cb(toSlots(snap.docs.map((d) => d.data() as GameFile)))),
    saveFile: (uid, file) => setDoc(doc(saves(uid), String(file.slot)), file),
    eraseFile: (uid, slot) => deleteDoc(doc(saves(uid), String(slot))),
    idToken: () => auth.currentUser?.getIdToken() ?? Promise.resolve(null),
  }
}

/** Used until Firebase is configured: everything lives in this browser; an "account" is just a name for a set of saves. */
function localBackend(): Backend {
  const USER_KEY = 'skyrim.local.user'
  const filesKey = (uid: string) => `skyrim.local.saves.${uid}`
  const authListeners = new Set<(u: User | null) => void>()
  const fileListeners = new Map<string, Set<(s: Slots) => void>>()
  const read = <T,>(key: string, fallback: T): T => { try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback } catch { return fallback } }
  const write = (key: string, value: unknown) => { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)) } catch { /* play on in memory */ } }
  const setUser = (u: User | null) => { write(USER_KEY, u); authListeners.forEach((cb) => cb(u)) }
  const emit = (uid: string) => { const slots = toSlots(read<GameFile[]>(filesKey(uid), [])); fileListeners.get(uid)?.forEach((cb) => cb(slots)) }
  const signIn = async (email: string) => {
    const clean = email.trim().toLowerCase()
    if (!clean.includes('@')) throw new Error('auth/invalid-email')
    setUser({ uid: 'local-' + clean, email: clean })
  }
  return {
    mode: 'local',
    onAuth: (cb) => { authListeners.add(cb); queueMicrotask(() => cb(read<User | null>(USER_KEY, null))); return () => authListeners.delete(cb) },
    signIn, register: signIn,
    signOut: async () => setUser(null),
    watchFiles: (uid, cb) => {
      if (!fileListeners.has(uid)) fileListeners.set(uid, new Set())
      fileListeners.get(uid)!.add(cb)
      queueMicrotask(() => cb(toSlots(read<GameFile[]>(filesKey(uid), []))))
      return () => fileListeners.get(uid)?.delete(cb)
    },
    saveFile: async (uid, file) => { write(filesKey(uid), [...read<GameFile[]>(filesKey(uid), []).filter((f) => f.slot !== file.slot), file]); emit(uid) },
    eraseFile: async (uid, slot) => { write(filesKey(uid), read<GameFile[]>(filesKey(uid), []).filter((f) => f.slot !== slot)); emit(uid) },
    idToken: async () => null,
  }
}

export const backend: Backend = config.apiKey && config.projectId ? cloudBackend(initializeApp(config)) : localBackend()
