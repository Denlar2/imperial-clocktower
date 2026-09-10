// Private notebook: what one player writes down during a game. Lives only in this phone's localStorage.
import type { ScriptId } from '../data/characters'
import { getLocal, setLocal, delLocal } from '../lib/device'

export type Align = 'unknown' | 'good' | 'evil'
export type CharStatus = 'none' | 'confirmed' | 'out'

export interface NotePlayer {
  id: string
  name: string
  dead: boolean
  align: Align
  /** Character they publicly claim. */
  claim: string | null
  /** Characters you think they might really be. */
  suspects: string[]
  note: string
}

export interface Nomination {
  id: string
  nominator: string | null
  nominee: string | null
  /** Player ids who raised a hand. */
  votes: string[]
  executed: boolean
}

export interface DayLog {
  day: number
  /** Player ids announced dead at dawn. */
  deaths: string[]
  nominations: Nomination[]
  note: string
}

export interface Notebook {
  v: 1
  id: string
  script: ScriptId
  title: string
  createdAt: number
  updatedAt: number
  /** Setup finished. */
  ready: boolean
  /** True when players/dead status are synced from a live game. */
  synced: boolean
  me: string | null
  myRole: string | null
  players: NotePlayer[]
  days: DayLog[]
  /** Night number → what you learned. */
  nights: Record<string, string>
  /** Character name → status you assigned. */
  chars: Record<string, CharStatus>
  general: string
}

export const uid = () => (typeof globalThis.crypto?.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2))

export function blankNotePlayer(id: string, name: string): NotePlayer {
  return { id, name, dead: false, align: 'unknown', claim: null, suspects: [], note: '' }
}

export function newNotebook(id: string, script: ScriptId, opts: Partial<Notebook> = {}): Notebook {
  const now = Date.now()
  return {
    v: 1, id, script, title: '', createdAt: now, updatedAt: now, ready: false, synced: false,
    me: null, myRole: null, players: [], days: [{ day: 1, deaths: [], nominations: [], note: '' }], nights: {}, chars: {}, general: '',
    ...opts,
  }
}

// ---- persistence
const KEY = (id: string) => `ct.nb.${id}`
const INDEX = 'ct.nb.index'

export function loadNotebook(id: string): Notebook | null { return getLocal<Notebook>(KEY(id)) }
export function saveNotebook(nb: Notebook) {
  setLocal(KEY(nb.id), { ...nb, updatedAt: Date.now() })
  const idx = listNotebookIds().filter((x) => x !== nb.id)
  setLocal(INDEX, [nb.id, ...idx])
}
export function deleteNotebook(id: string) {
  delLocal(KEY(id))
  setLocal(INDEX, listNotebookIds().filter((x) => x !== id))
}
export function listNotebookIds(): string[] { return getLocal<string[]>(INDEX) ?? [] }
export function listNotebooks(): Notebook[] {
  return listNotebookIds().map(loadNotebook).filter((n): n is Notebook => !!n)
}

/** Keep names, seat order and dead status in step with a live game, preserving your notes. */
export function syncPlayers(nb: Notebook, players: { id: string; name: string; dead: boolean }[], me: string): Notebook {
  const byId = new Map(nb.players.map((p) => [p.id, p]))
  const next = players.map((p) => ({ ...(byId.get(p.id) ?? blankNotePlayer(p.id, p.name)), name: p.name, dead: p.dead }))
  const same = nb.me === me && next.length === nb.players.length && next.every((p, i) => {
    const q = nb.players[i]
    return q.id === p.id && q.name === p.name && q.dead === p.dead
  })
  return same ? nb : { ...nb, players: next, me, synced: true, ready: true }
}

// ---- derived
export interface VoteRecord { day: number; nominee: string; executed: boolean }

/** Who each player voted for, per day. */
export function voteHistory(nb: Notebook): Record<string, VoteRecord[]> {
  const out: Record<string, VoteRecord[]> = {}
  for (const d of nb.days) for (const n of d.nominations) for (const v of n.votes) {
    ;(out[v] ??= []).push({ day: d.day, nominee: n.nominee ?? '?', executed: n.executed })
  }
  return out
}

export function nameOf(nb: Notebook, id: string | null | undefined): string {
  return nb.players.find((p) => p.id === id)?.name ?? '?'
}

/** Players who claim a given character. */
export function claimants(nb: Notebook, char: string): NotePlayer[] {
  return nb.players.filter((p) => p.claim === char)
}
