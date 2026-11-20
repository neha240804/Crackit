// The user's own Groq API key, kept ONLY in this browser, encrypted. The server never stores it:
// it arrives with each API request in the X-Groq-Key header (lib/api.ts) and is used for that
// request only (backend api/deps.py).
//
// How it is protected here:
// - Encrypted with AES-GCM using a "device key" created by the browser's Web Crypto API as
//   NON-EXTRACTABLE: the page can use it to encrypt and decrypt, but its bytes can never be read
//   or exported, not even by this code. It is kept in IndexedDB (CryptoKey objects can be stored
//   there, and stay non-extractable).
// - localStorage holds only the ciphertext, the IV and a hint ("gsk_…a1b2"): copying the storage
//   to another machine yields nothing usable without the device key.
// - One entry per user id, so two people sharing a browser never share a key. Logging out
//   drops the decrypted copy from memory.
// Honest limit: code running in this page (e.g. an XSS bug) could still ask the device key to
// decrypt; the protection is against reading storage, other sites and the server, not that.

const DB_NAME = 'crackit-keys'
const STORE = 'keys'
const DEVICE_KEY_ID = 'device-aes-gcm'
const entryKey = (userId: string) => `crackit_groq_key_${userId}`

interface StoredKey {
  iv: string // base64
  data: string // base64 ciphertext
  hint: string
  addedAt: string
}

// ------------------------------------------------------------------ IndexedDB (device key)
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idb<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

async function deviceKey(): Promise<CryptoKey> {
  const existing = await idb<CryptoKey | undefined>('readonly', (s) => s.get(DEVICE_KEY_ID))
  if (existing) return existing
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false /* non-extractable */, ['encrypt', 'decrypt'])
  await idb('readwrite', (s) => s.put(key, DEVICE_KEY_ID))
  return key
}

const b64 = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
const unb64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))

// ------------------------------------------------------------------ the active key
let active: string | null = null // decrypted, in memory only, for the logged-in user
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())

/** The key the API helper sends with each request, or null (then AI features answer 428). */
export const activeGroqKey = () => active

export function subscribeGroqKey(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/** What Settings shows: the hint and when it was added (no decryption needed). */
export function groqKeyInfo(userId: string): { hint: string; addedAt: string } | null {
  try {
    const raw = localStorage.getItem(entryKey(userId))
    if (!raw) return null
    const { hint, addedAt } = JSON.parse(raw) as StoredKey
    return { hint, addedAt }
  } catch {
    return null
  }
}

/** After login: decrypt this user's key (if any) into memory. A key that can't be decrypted
 * (browser data partly cleared) is forgotten, and the user simply adds it again. */
export async function activateGroqKey(userId: string) {
  const raw = localStorage.getItem(entryKey(userId))
  if (!raw) { active = null; notify(); return }
  try {
    const { iv, data } = JSON.parse(raw) as StoredKey
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await deviceKey(), unb64(data))
    active = new TextDecoder().decode(plain)
  } catch {
    localStorage.removeItem(entryKey(userId))
    active = null
  }
  notify()
}

export function deactivateGroqKey() {
  active = null
  notify()
}

export async function storeGroqKey(userId: string, key: string, hint: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deviceKey(), new TextEncoder().encode(key))
  const entry: StoredKey = { iv: b64(iv), data: b64(data), hint, addedAt: new Date().toISOString() }
  localStorage.setItem(entryKey(userId), JSON.stringify(entry))
  active = key
  notify()
}

export function forgetGroqKey(userId: string) {
  localStorage.removeItem(entryKey(userId))
  active = null
  notify()
}
