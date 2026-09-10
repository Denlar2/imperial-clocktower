import type { ReactNode } from 'react'
import { MARKS, getChar, type Mark, type Script } from '../data/characters'
import { counts, isEvil, leviathan, notInPlay, phaseName } from '../game/logic'
import type { Game, Player } from '../game/types'
import { Card, Chip, alignClass, cx } from './kit'

type Update = (fn: (g: Game) => Game) => void

export default function Grimoire({ game, S, update, phaseButton }: { game: Game; S: Script; update: Update; phaseButton: ReactNode }) {
  const P = game.players
  const c = counts(S, P)
  const lev = leviathan(S, game)
  const setP = (id: string, fn: (p: Player) => Player) => update((g) => ({ ...g, players: g.players.map((p) => (p.id === id ? fn(p) : p)) }))

  return (
    <>
      <div className="display mb-2 text-center text-2xl text-candle">{phaseName(game.phase)}</div>
      {phaseButton}
      <div className="mt-3 mb-3 text-center text-dim">
        <b className="text-wax">{c.alive}</b> alive · <b className="text-evil">{c.evil}</b> evil alive · <b className="text-wax">{c.dead}</b> dead
      </div>
      {lev && (
        <Card warn={lev.evilWins} className="mb-3">
          <b>Leviathan</b> — good players executed: <b>{lev.goodExecuted}</b> of 1 allowed · day <b>{lev.day}</b> of 5
          {lev.evilWins && <div className="mt-1 font-semibold text-evil">Evil wins.</div>}
        </Card>
      )}
      <div className="flex flex-col gap-2">
        {P.map((p, i) => {
          const ch = getChar(S, p.role)
          return (
            <Card key={p.id} className={cx(p.dead && 'opacity-70')}>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-dim">{i + 1}</span>
                <span className={cx('display text-xl', p.dead && 'line-through')}>{p.name}</span>
              </div>
              <div className={cx('text-sm', alignClass(isEvil(S, p)))}>
                {p.role}
                {p.fakeAs && <span className="text-dim"> (thinks: {p.fakeAs})</span>}
                {p.evil != null && <span className="text-dim"> (turned evil)</span>}
                <span className="text-dim"> · {ch?.type}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Chip on={p.dead} bad onClick={() => setP(p.id, (q) => ({ ...q, dead: !q.dead, executed: q.dead ? false : q.executed }))}>{p.dead ? 'Dead' : 'Alive'}</Chip>
                <Chip on={p.executed} bad onClick={() => setP(p.id, (q) => ({ ...q, executed: !q.executed, dead: !q.executed ? true : q.dead }))}>Executed</Chip>
                {p.dead && <Chip on={p.ghost} onClick={() => setP(p.id, (q) => ({ ...q, ghost: !q.ghost }))}>{p.ghost ? 'Ghost vote left' : 'Ghost vote used'}</Chip>}
                {(Object.keys(MARKS) as Mark[]).map((k) => (
                  <Chip key={k} on={p[k]} bad onClick={() => setP(p.id, (q) => ({ ...q, [k]: !q[k] }))}>{MARKS[k]}</Chip>
                ))}
              </div>
              <input
                className="mt-2 w-full border-0 border-b border-line bg-transparent px-0 py-1 text-sm text-wax placeholder:text-dim/60 focus:border-candle focus:outline-none"
                placeholder="Reminder (red herring, mad as…, known player…)"
                value={p.note}
                onChange={(e) => setP(p.id, (q) => ({ ...q, note: e.target.value }))}
              />
            </Card>
          )
        })}
      </div>
      <Card className="mt-4">
        <b>Not in play</b> <span className="text-dim">(pick 3 Demon bluffs)</span>
        <div className="mt-1 text-sm text-dim">{notInPlay(S, P).join(', ') || '—'}</div>
      </Card>
    </>
  )
}
