// A random id per phone, kept in localStorage. Doubles as the Storyteller's secret for games they run.
const KEY = 'ct.device'

function randomId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  const a = new Uint8Array(16)
  c.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function deviceId(): string {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) { id = randomId(); localStorage.setItem(KEY, id) }
    return id
  } catch { return 'nostorage-' + Math.random().toString(36).slice(2) }
}

export function getLocal<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null } catch { return null }
}
export function setLocal(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* private mode */ }
}
export function delLocal(key: string) {
  try { localStorage.removeItem(key) } catch { /* ignore */ }
}

export interface Remembered { code: string; at: number; name?: string }
export const ST_KEY = 'ct.st'
export const PLAYER_KEY = 'ct.player'
export const TTL_MS = 12 * 60 * 60 * 1000
export const fresh = (r: Remembered | null) => (r && Date.now() - r.at < TTL_MS ? r : null)
