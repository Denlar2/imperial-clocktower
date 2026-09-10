import { COMP, MARKS, TYPES, charsOfType, getChar, outsiderMod, type CharType, type Mark, type Script } from '../data/characters'
import type { Game, Player, Reveal } from './types'
import type { ScriptId } from '../data/characters'

export const shuffle = <T,>(a: T[], rnd: () => number = Math.random): T[] =>
  a.map((x) => [rnd(), x] as const).sort((p, q) => p[0] - q[0]).map((x) => x[1])

export function blankPlayer(id: string, name: string): Player {
  return { id, name, role: null, fakeAs: null, evil: null, dead: false, executed: false, ghost: true, poison: false, drunk: false, safe: false, mad: false, cursed: false, twin: null, note: '', reveal: null }
}

/** Reset everything about a player except identity and role. */
export function resetPlayer(p: Player): Player {
  return { ...blankPlayer(p.id, p.name), role: p.role, fakeAs: p.fakeAs, evil: p.evil }
}

export function newGame(code: string, script: ScriptId, count: number, mode: 'phones' | 'single' = 'phones'): Game {
  return { v: 1, code, mode, script, count, status: 'lobby', phase: 0, done: {}, players: [], votes: [], createdAt: Date.now() }
}

export const roleEvil = (S: Script, role: string | null) => {
  const c = getChar(S, role)
  return !!c && (c.type === 'Minion' || c.type === 'Demon')
}
export const isEvil = (S: Script, p: Player) => (p.evil != null ? p.evil : roleEvil(S, p.role))
export const shownRole = (p: Player) => p.fakeAs || p.role

export function composition(script: Script, n: number): { t: number; o: number; m: number; d: number; note: string } {
  const [t, o, m, d] = COMP[n] ?? COMP[Math.min(15, Math.max(5, n))]
  return { t, o, m, d, note: script.setupNote }
}

/** Deal random roles to the current players, following the set-up table and the script's modifiers. */
export function dealRoles(S: Script, players: Player[], rnd: () => number = Math.random): Player[] {
  const n = players.length
  const [t0, o0, m, d] = COMP[n] ?? COMP[Math.min(15, Math.max(5, n))]
  const names = (type: CharType) => charsOfType(S, type).map((c) => c.name)
  const mins = shuffle(names('Minion'), rnd).slice(0, m)
  const demons = shuffle(names('Demon'), rnd).slice(0, d)
  const tfAll = shuffle(names('Townsfolk'), rnd)
  const tfSel = tfAll.slice(0, t0)
  let mod = outsiderMod(S, [...mins, ...demons, ...tfSel], rnd)
  // Removing an Outsider when there are none: Godfather (+1 or -1) must add one instead; others just get 0.
  if (o0 + mod < 0) mod = S.id === 'BMR' ? -mod : -o0
  const o = Math.min(names('Outsider').length, o0 + mod)
  const t = t0 - (o - o0)
  // Shrink or grow the Townsfolk list without dropping the character that caused the change.
  while (tfSel.length > t) tfSel.splice(tfSel.findIndex((r) => r !== 'Balloonist' && r !== 'Baron'), 1)
  for (const r of tfAll.slice(t0)) { if (tfSel.length >= t) break; tfSel.push(r) }
  const roles = shuffle([...tfSel, ...shuffle(names('Outsider'), rnd).slice(0, o), ...mins, ...demons], rnd)
  let P: Player[] = players.map((p, i) => ({ ...resetPlayer(p), role: roles[i] ?? null, fakeAs: null, evil: null }))
  P = seatMarionette(S, P)
  P = pickBountyHunterTarget(S, P, rnd)
  P = pairTwins(S, P, rnd)
  return assignFakes(S, P, rnd)
}

/** Evil Twin in play: pair it with a random good player. Keeps an existing valid pairing. */
export function pairTwins(S: Script, P: Player[], rnd: () => number = Math.random): Player[] {
  const twin = P.find((p) => p.role === 'Evil Twin')
  if (!twin) return P.some((p) => p.twin) ? P.map((p) => ({ ...p, twin: null })) : P
  const current = P.find((p) => p.id === twin.twin)
  if (current && !isEvil(S, current) && current.twin === twin.id) return P
  const good = shuffle(P.filter((p) => p.id !== twin.id && !isEvil(S, p)), rnd)[0]
  if (!good) return P
  return P.map((p) => ({ ...p, twin: p.id === twin.id ? good.id : p.id === good.id ? twin.id : null }))
}

/** Marionette must sit next to the Demon. Swaps roles if needed. */
export function seatMarionette(S: Script, P: Player[]): Player[] {
  const n = P.length
  const mi = P.findIndex((p) => p.role === 'Marionette')
  const di = P.findIndex((p) => getChar(S, p.role)?.type === 'Demon')
  if (mi < 0 || di < 0) return P
  const dist = Math.min((mi - di + n) % n, (di - mi + n) % n)
  if (dist === 1) return P
  const ni = (di + 1) % n
  const out = P.map((p) => ({ ...p }))
  ;[out[mi].role, out[ni].role] = [out[ni].role, out[mi].role]
  return out
}

/** Bounty Hunter in play: one other Townsfolk is secretly evil. */
export function pickBountyHunterTarget(S: Script, P: Player[], rnd: () => number = Math.random): Player[] {
  if (!P.some((p) => p.role === 'Bounty Hunter')) return P.map((p) => ({ ...p, evil: null }))
  const cand = shuffle(P.filter((p) => getChar(S, p.role)?.type === 'Townsfolk' && p.role !== 'Bounty Hunter'), rnd)
  const target = cand[0]?.id
  return P.map((p) => ({ ...p, evil: p.id === target ? true : null }))
}

/** Give Drunk / Lunatic / Marionette a fake role if they do not already have one. */
export function assignFakes(S: Script, P: Player[], rnd: () => number = Math.random): Player[] {
  const inPlay = P.map((p) => p.role)
  const names = (type: CharType) => charsOfType(S, type).map((c) => c.name)
  return P.map((p) => {
    const f = getChar(S, p.role)?.fake
    if (!f) return p.fakeAs ? { ...p, fakeAs: null } : p
    if (p.fakeAs) return p
    const pool =
      f === 'Demon' ? names('Demon')
      : f === 'Townsfolk' ? names('Townsfolk').filter((r) => !inPlay.includes(r))
      : [...names('Townsfolk'), ...names('Outsider')].filter((r) => !inPlay.includes(r))
    return { ...p, fakeAs: shuffle(pool, rnd)[0] ?? null }
  })
}

/** What each player gets to see. Computed by the ST client at start (and on re-deal). */
export function computeReveal(S: Script, P: Player[], i: number): Reveal | null {
  const p = P[i]
  const shown = shownRole(p)
  const c = getChar(S, shown)
  if (!c || !shown) return null
  const evil = p.fakeAs ? roleEvil(S, shown) : isEvil(S, p)
  let mates = ''
  if (!p.fakeAs && roleEvil(S, p.role) && P.length >= 7) {
    const others = P.filter((q, j) => j !== i && roleEvil(S, q.role) && q.role !== 'Marionette')
    mates = 'Your team: ' + (others.map((q) => `${q.name} (${q.role})`).join(', ') || 'nobody else')
  }
  if (p.evil && !roleEvil(S, p.role)) mates = 'You are evil, but you do not know who the Demon is.'
  if (p.fakeAs && getChar(S, p.role)?.fake === 'Demon') mates = 'Your Minions will be shown to you tonight.'
  const twin = p.twin ? P.find((q) => q.id === p.twin) : undefined
  if (twin && p.role === 'Evil Twin') mates += `${mates ? ' ' : ''}Your good twin is ${twin.name}, the ${twin.role}. Good cannot win while you both live.`
  else if (twin) mates = `You are twinned with ${twin.name}, the Evil Twin. Good cannot win while you both live; if you are executed, evil wins.`
  return { shown, type: c.type, evil, mates }
}

export function withReveals(S: Script, P: Player[]): Player[] {
  return P.map((p, i) => ({ ...p, reveal: computeReveal(S, P, i) }))
}

export const phaseName = (phase: number) => (phase === 0 ? 'Setup' : phase % 2 ? `Night ${(phase + 1) / 2}` : `Day ${phase / 2}`)
export const isNight = (phase: number) => phase % 2 === 1
export const dayNumber = (phase: number) => Math.floor(phase / 2)

/** Dusk / dawn. At dusk the nightly marks expire (poison and drunk persist in BMR). */
export function nextPhase(S: Script, g: Game): Game {
  const phase = g.phase + 1
  let players = g.players
  if (phase % 2) {
    players = players.map((p) => ({ ...p, safe: false, mad: false, cursed: false, ...(S.id !== 'BMR' ? { poison: false, drunk: false } : {}) }))
  }
  return { ...g, phase, done: {}, players, votes: [] }
}

export function counts(S: Script, P: Player[]) {
  const alive = P.filter((p) => !p.dead).length
  const evil = P.filter((p) => !p.dead && isEvil(S, p)).length
  return { alive, evil, dead: P.length - alive }
}

export function leviathan(S: Script, g: Game) {
  if (!g.players.some((p) => p.role === 'Leviathan')) return null
  const goodExecuted = g.players.filter((p) => p.executed && !isEvil(S, p)).length
  const day = dayNumber(g.phase)
  return { goodExecuted, day, evilWins: goodExecuted > 1 || day > 5 }
}

/** Good characters not in play (Demon bluffs). */
export function notInPlay(S: Script, P: Player[]): string[] {
  const inPlay = P.map((p) => p.role)
  return [...charsOfType(S, 'Townsfolk'), ...charsOfType(S, 'Outsider')].map((c) => c.name).filter((r) => !inPlay.includes(r))
}

export interface NightRow {
  index: number
  name: string
  who: string
  hint: string
  present: boolean
  /** Mark kind for the target picker, if this row has one. */
  pick: Mark | null
  pickLabel: string
}

const flags = (p: Player) => (p.dead ? ' (dead)' : '') + (p.poison ? ' (poisoned)' : '') + (p.drunk ? ' (drunk)' : '') + (p.cursed ? ' (cursed)' : '')

export function nightRows(S: Script, g: Game, first: boolean): NightRow[] {
  const P = g.players
  const order = first ? S.firstNight : S.otherNight
  const minions = P.filter((p) => getChar(S, p.role)?.type === 'Minion')
  const realMinions = minions.filter((p) => p.role !== 'Marionette')
  const demon = P.find((p) => getChar(S, p.role)?.type === 'Demon')
  const lunatic = P.find((p) => p.role === 'Lunatic')
  const magician = P.find((p) => p.role === 'Magician')
  const damsel = P.some((p) => p.role === 'Damsel')
  return order.map((r, index) => {
    if (r === 'Minion info') {
      return {
        index, name: r, present: P.length >= 7, pick: null, pickLabel: '',
        who: realMinions.map((p) => p.name).join(', ') || 'none',
        hint: `Minions open eyes; point to the Demon (${demon?.name ?? '?'}${magician ? ` and the Magician ${magician.name} — they can't tell which` : ''}) and to each other. Marionette stays asleep.${damsel ? ' Show that a Damsel is in play.' : ''}`,
      }
    }
    if (r === 'Demon info') {
      return {
        index, name: r, present: P.length >= 7, pick: null, pickLabel: '',
        who: demon ? demon.name + flags(demon) : '?',
        hint: `Demon opens eyes; point to Minions (${realMinions.map((p) => p.name).join(', ') || 'none'}${magician ? ` and the Magician ${magician.name}` : ''}). Show 3 bluffs.${lunatic ? ` Also point out the Lunatic (${lunatic.name}).` : ''}`,
      }
    }
    const c = getChar(S, r)
    const ps = P.filter((p) => p.role === r || p.fakeAs === r)
    const pick = c?.pick && ps.some((p) => !p.dead && p.role === r) ? c.pick : null
    return {
      index, name: r, present: ps.length > 0,
      who: ps.map((p) => p.name + flags(p) + (p.fakeAs === r ? ` (really ${p.role})` : '')).join(', ') || 'not in play',
      hint: (first ? c?.firstNight : c?.otherNight) || '',
      pick, pickLabel: pick ? MARKS[pick] : '',
    }
  })
}

/** Move a mark so that exactly the chosen player (or nobody) has it. */
export function setMark(P: Player[], kind: Mark, id: string | null): Player[] {
  return P.map((p) => ({ ...p, [kind]: p.id === id }))
}

export function moveSeat(P: Player[], from: number, to: number): Player[] {
  if (from === to || from < 0 || to < 0 || from >= P.length || to >= P.length) return P
  const out = [...P]
  const [x] = out.splice(from, 1)
  out.splice(to, 0, x)
  return out
}

export const TYPE_ORDER = TYPES
