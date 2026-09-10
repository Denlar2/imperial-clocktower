import { describe, expect, it } from 'vitest'
import { SCRIPTS, COMP, getChar } from '../data/characters'
import { assignFakes, blankPlayer, computeReveal, dealRoles, leviathan, newGame, nextPhase, nightRows, pairTwins, seatMarionette, withReveals } from './logic'

const mk = (n: number) => Array.from({ length: n }, (_, i) => blankPlayer(`id${i}`, `P${i + 1}`))
const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }

describe('dealRoles', () => {
  for (const id of ['TB', 'BMR', 'SV', 'UTT'] as const) {
    const S = SCRIPTS[id]
    for (let n = 5; n <= 15; n++) {
      it(`${id} ${n} players follows the set-up table`, () => {
        for (let k = 0; k < 20; k++) {
          const P = dealRoles(S, mk(n), seeded(n * 100 + k))
          const types = P.map((p) => getChar(S, p.role)!.type)
          const [t, o, m, d] = COMP[n]
          expect(P.every((p) => p.role)).toBe(true)
          expect(new Set(P.map((p) => p.role)).size).toBe(n)
          expect(types.filter((x) => x === 'Demon')).toHaveLength(d)
          expect(types.filter((x) => x === 'Minion')).toHaveLength(m)
          const outs = types.filter((x) => x === 'Outsider').length
          const mod = outs - o
          if (id === 'TB') expect(mod).toBe(P.some((p) => p.role === 'Baron') ? 2 : 0)
          if (id === 'BMR') expect(P.some((p) => p.role === 'Godfather') ? (o === 0 ? [1] : [1, -1]) : [0]).toContain(mod)
          if (id === 'UTT') expect(P.some((p) => p.role === 'Balloonist') ? [0, 1] : [0]).toContain(mod)
          if (id === 'SV') expect(mod).toBe(P.some((p) => p.role === 'Fang Gu') ? 1 : P.some((p) => p.role === 'Vigormortis') && o > 0 ? -1 : 0)
          // Evil Twin is paired with exactly one good player, both ways
          const et = P.find((p) => p.role === 'Evil Twin')
          if (et) { const g = P.find((p) => p.id === et.twin)!; expect(getChar(S, g.role)!.type).toMatch(/Townsfolk|Outsider/); expect(g.twin).toBe(et.id); expect(P.filter((p) => p.twin)).toHaveLength(2) }
          else expect(P.every((p) => !p.twin)).toBe(true)
          expect(types.filter((x) => x === 'Townsfolk')).toHaveLength(t - mod)
          // fakes
          for (const p of P) {
            const f = getChar(S, p.role)!.fake
            if (f) expect(p.fakeAs).toBeTruthy(); else expect(p.fakeAs).toBeNull()
            if (f === 'Townsfolk') { expect(getChar(S, p.fakeAs)!.type).toBe('Townsfolk'); expect(P.some((q) => q.role === p.fakeAs)).toBe(false) }
            if (f === 'Demon') expect(getChar(S, p.fakeAs)!.type).toBe('Demon')
          }
          // Marionette next to Demon
          const mi = P.findIndex((p) => p.role === 'Marionette'), di = P.findIndex((p) => getChar(S, p.role)!.type === 'Demon')
          if (mi >= 0) expect(Math.min((mi - di + n) % n, (di - mi + n) % n)).toBe(1)
          // Bounty Hunter → exactly one evil Townsfolk
          const bh = P.some((p) => p.role === 'Bounty Hunter')
          expect(P.filter((p) => p.evil === true)).toHaveLength(bh ? 1 : 0)
        }
      })
    }
  }
})

describe('seatMarionette', () => {
  it('swaps so the Marionette is adjacent to the Demon', () => {
    const S = SCRIPTS.UTT
    const P = mk(7)
    const roles = ['Marionette', 'Chef', 'Noble', 'Leviathan', 'Dreamer', 'Savant', 'Mutant']
    P.forEach((p, i) => (p.role = roles[i]))
    const out = seatMarionette(S, P)
    expect(out.findIndex((p) => p.role === 'Marionette')).toBe(4)
    expect(out[0].role).toBe('Dreamer')
  })
})

describe('pairTwins', () => {
  it('pairs the Evil Twin with a good player and keeps a valid pairing', () => {
    const S = SCRIPTS.SV
    const P = mk(6)
    ;['Evil Twin', 'Vortox', 'Clockmaker', 'Sage', 'Klutz', 'Oracle'].forEach((r, i) => (P[i].role = r))
    const out = pairTwins(S, P, seeded(3))
    const twin = out.find((p) => p.id === out[0].twin)!
    expect(['Clockmaker', 'Sage', 'Klutz', 'Oracle']).toContain(twin.role)
    expect(pairTwins(S, out, seeded(9))).toBe(out)
    const rev = withReveals(S, out)
    expect(rev[0].reveal!.mates).toContain(`Your good twin is ${twin.name}`)
    expect(rev.find((p) => p.id === twin.id)!.reveal!.mates).toContain('Evil Twin')
  })
})

describe('reveal', () => {
  it('Drunk sees only the fake townsfolk and reads good', () => {
    const S = SCRIPTS.TB
    const P = mk(8)
    const roles = ['Drunk', 'Imp', 'Poisoner', 'Chef', 'Empath', 'Monk', 'Mayor', 'Butler']
    P.forEach((p, i) => (p.role = roles[i]))
    const out = withReveals(S, assignFakes(S, P, seeded(1)))
    expect(out[0].reveal!.shown).toBe(out[0].fakeAs)
    expect(out[0].reveal!.evil).toBe(false)
    expect(out[0].reveal!.type).toBe('Townsfolk')
    expect(out[1].reveal!.mates).toContain('P3 (Poisoner)')
    expect(out[2].reveal!.mates).toContain('P2 (Imp)')
    expect(out[3].reveal!.mates).toBe('')
  })
  it('evil team is hidden with fewer than 7 players', () => {
    const S = SCRIPTS.TB
    const P = mk(5)
    ;['Imp', 'Poisoner', 'Chef', 'Empath', 'Monk'].forEach((r, i) => (P[i].role = r))
    expect(computeReveal(S, P, 0)!.mates).toBe('')
  })
})

describe('phases', () => {
  it('dusk clears nightly marks; poison persists in BMR', () => {
    const g = newGame('42', 'TB', 5)
    g.players = mk(5).map((p) => ({ ...p, role: 'Chef', poison: true, safe: true, mad: true, drunk: true }))
    const n = nextPhase(SCRIPTS.TB, g)
    expect(n.phase).toBe(1)
    expect(n.players.every((p) => !p.poison && !p.safe && !p.mad && !p.drunk)).toBe(true)
    const b = nextPhase(SCRIPTS.BMR, { ...g, script: 'BMR' })
    expect(b.players.every((p) => p.poison && p.drunk && !p.safe)).toBe(true)
  })
  it('leviathan tracker', () => {
    const g = newGame('42', 'UTT', 5)
    g.players = mk(5).map((p, i) => ({ ...p, role: i === 0 ? 'Leviathan' : 'Chef' }))
    g.phase = 4
    g.players[1].executed = true
    g.players[2].executed = true
    expect(leviathan(SCRIPTS.UTT, g)).toEqual({ goodExecuted: 2, day: 2, evilWins: true })
  })
})

describe('nightRows', () => {
  it('includes fake roles and hides info rows under 7 players', () => {
    const S = SCRIPTS.TB
    const g = newGame('42', 'TB', 6)
    g.players = mk(6)
    ;['Drunk', 'Imp', 'Poisoner', 'Chef', 'Empath', 'Monk'].forEach((r, i) => (g.players[i].role = r))
    g.players[0].fakeAs = 'Washerwoman'
    g.phase = 1
    const rows = nightRows(S, g, true)
    expect(rows.find((r) => r.name === 'Minion info')!.present).toBe(false)
    const ww = rows.find((r) => r.name === 'Washerwoman')!
    expect(ww.present).toBe(true)
    expect(ww.who).toContain('really Drunk')
    expect(rows.find((r) => r.name === 'Poisoner')!.pick).toBe('poison')
  })
})
