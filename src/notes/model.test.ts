import { describe, expect, it } from 'vitest'
import { blankNotePlayer, newNotebook, syncPlayers, voteHistory } from './model'

describe('notebook', () => {
  it('syncPlayers keeps notes and follows the live list', () => {
    const nb = newNotebook('t', 'TB')
    nb.players = [{ ...blankNotePlayer('a', 'Anna'), note: 'claims Chef', align: 'evil' }, blankNotePlayer('b', 'Bo')]
    const out = syncPlayers(nb, [{ id: 'b', name: 'Bo', dead: true }, { id: 'a', name: 'Annie', dead: false }, { id: 'c', name: 'Cass', dead: false }], 'a')
    expect(out.players.map((p) => p.id)).toEqual(['b', 'a', 'c'])
    expect(out.players[1]).toMatchObject({ name: 'Annie', note: 'claims Chef', align: 'evil' })
    expect(out.players[0].dead).toBe(true)
    expect(out.me).toBe('a')
    expect(syncPlayers(out, [{ id: 'b', name: 'Bo', dead: true }, { id: 'a', name: 'Annie', dead: false }, { id: 'c', name: 'Cass', dead: false }], 'a')).toBe(out)
  })
  it('voteHistory groups by voter', () => {
    const nb = newNotebook('t', 'TB')
    nb.days = [
      { day: 1, deaths: [], note: '', nominations: [{ id: 'n1', nominator: 'a', nominee: 'b', votes: ['a', 'c'], executed: true }] },
      { day: 2, deaths: [], note: '', nominations: [{ id: 'n2', nominator: 'b', nominee: 'c', votes: ['a'], executed: false }] },
    ]
    expect(voteHistory(nb).a).toEqual([{ day: 1, nominee: 'b', executed: true }, { day: 2, nominee: 'c', executed: false }])
    expect(voteHistory(nb).c).toHaveLength(1)
    expect(voteHistory(nb).b).toBeUndefined()
  })
})
