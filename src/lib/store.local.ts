// Local, no-server backend for development and demos: state lives in this browser's
// localStorage and updates fan out to other tabs via BroadcastChannel.
// Enable with VITE_BACKEND=local. Mirrors the Supabase functions in supabase/schema.sql,
// including what player_view() hides from players.
import type { Game, Player, PlayerView } from '../game/types'
import { blankPlayer } from '../game/logic'

const KEY = 'ct.local.games'
const TTL = 12 * 60 * 60 * 1000
type Row = { code: string; secret: string; state: Game; updatedAt: number }

const load = (): Record<string, Row> => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }
const save = (rows: Record<string, Row>) => localStorage.setItem(KEY, JSON.stringify(rows))
const live = (r: Row | undefined) => (r && Date.now() - r.updatedAt < TTL ? r : undefined)
const delay = <T,>(v: T) => new Promise<T>((res) => setTimeout(() => res(v), 30))
const channel = (code: string) => new BroadcastChannel(`ct.local.game:${code}`)

export async function createGame(secret: string, state: Game): Promise<string> {
  const rows = load()
  const free = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0')).filter((c) => !live(rows[c]))
  if (!free.length) throw new Error('No free game codes right now, try again later')
  const code = free[Math.floor(Math.random() * free.length)]
  rows[code] = { code, secret, state: { ...state, code }, updatedAt: Date.now() }
  save(rows)
  return delay(code)
}

export async function stRead(code: string, secret: string): Promise<Game | null> {
  const r = live(load()[code])
  return delay(r && r.secret === secret ? r.state : null)
}

export async function stWrite(code: string, secret: string, state: Game): Promise<void> {
  const rows = load()
  const r = live(rows[code])
  if (!r || r.secret !== secret) throw new Error('Not your game (or it has expired)')
  rows[code] = { ...r, state: { ...state, code }, updatedAt: Date.now() }
  save(rows)
  await delay(undefined)
}

export async function playerView(code: string, id: string): Promise<PlayerView | null> {
  const r = live(load()[code])
  if (!r) return delay(null)
  return delay(view(r.state, id))
}

function view(g: Game, id: string): PlayerView {
  const me = g.players.find((p) => p.id === id)
  return {
    code: g.code, script: g.script, status: g.status, phase: g.phase, count: g.count,
    players: g.players.map((p) => ({ id: p.id, name: p.name, dead: p.dead, ghost: p.ghost })),
    me: me ? { id: me.id, name: me.name, dead: me.dead, executed: me.executed, ghost: me.ghost, reveal: g.status === 'playing' ? me.reveal : null } : null,
  }
}

export async function joinGame(code: string, id: string, name: string): Promise<PlayerView> {
  const nm = name.trim().slice(0, 24)
  if (!nm) throw new Error('Name required')
  const rows = load()
  const r = live(rows[code])
  if (!r) throw new Error('No game with that code')
  let players: Player[] = r.state.players
  if (players.some((p) => p.id === id)) {
    if (r.state.status === 'lobby') players = players.map((p) => (p.id === id ? { ...p, name: nm } : p))
  } else {
    if (r.state.status !== 'lobby') throw new Error('That game has already started')
    if (players.length >= 15) throw new Error('That game is full')
    players = [...players, blankPlayer(id, nm)]
  }
  rows[code] = { ...r, state: { ...r.state, players }, updatedAt: Date.now() }
  save(rows)
  return delay(view(rows[code].state, id))
}

export async function poke(code: string): Promise<void> {
  const ch = channel(code)
  ch.postMessage('poke')
  ch.close()
}

export function subscribe(code: string, onPoke: () => void): () => void {
  const ch = channel(code)
  ch.onmessage = () => onPoke()
  return () => ch.close()
}
