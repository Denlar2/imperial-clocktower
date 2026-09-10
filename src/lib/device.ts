// A random id per phone, kept in localStorage. Doubles as the Storyteller's secret for games they run.
const KEY = 'ct.device'

function randomId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  const a = new Uint8Array(16)
  c.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

// In local (no-server) mode each browser tab is its own device, so one browser can host the
// Storyteller and several players for development.
const store = () => (import.meta.env.VITE_BACKEND === 'local' ? sessionStorage : localStorage)

export function deviceId(): string {
  try {
    let id = store().getItem(KEY)
    if (!id) { id = randomId(); store().setItem(KEY, id) }
    return id
  } catch { return 'nostorage-' + Math.random().toString(36).slice(2) }
}

export function getLocal<T>(key: string): T | null {
  try { const v = store().getItem(key); return v ? (JSON.parse(v) as T) : null } catch { return null }
}
export function setLocal(key: string, value: unknown) {
  try { store().setItem(key, JSON.stringify(value)) } catch { /* private mode */ }
}
export function delLocal(key: string) {
  try { store().removeItem(key) } catch { /* ignore */ }
}

export interface Remembered { code: string; at: number; name?: string }
export const ST_KEY = 'ct.st'
export const PLAYER_KEY = 'ct.player'
export const TTL_MS = 12 * 60 * 60 * 1000
export const fresh = (r: Remembered | null) => (r && Date.now() - r.at < TTL_MS ? r : null)
