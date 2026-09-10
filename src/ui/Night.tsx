import { useState, type ReactNode } from 'react'
import type { Script } from '../data/characters'
import { isNight, nightRows, phaseName, setMark } from '../game/logic'
import type { Game } from '../game/types'
import { Card, Select, cx } from './kit'

type Update = (fn: (g: Game) => Game) => void

export default function Night({ game, S, update, phaseButton }: { game: Game; S: Script; update: Update; phaseButton: ReactNode }) {
  const [showAll, setShowAll] = useState(false)
  const night = isNight(game.phase)
  const first = game.phase <= 1
  const rows = nightRows(S, game, first)
  const title = game.phase === 0 ? 'First night order' : night ? phaseName(game.phase) : `Next: ${phaseName(game.phase + 1)}`

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <div className="display text-2xl text-candle">{title}</div>
        <label className="flex items-center gap-2 text-sm text-dim">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="h-5 w-5 accent-candle" /> show all
        </label>
      </div>
      {!night && <p className="mb-3 text-sm text-dim">It is {phaseName(game.phase).toLowerCase()}. Press Dusk on the Grimoire when everyone closes their eyes.</p>}
      <div className="flex flex-col gap-2">
        {rows.filter((r) => r.present || showAll).map((r) => {
          const done = !!game.done[r.index]
          const cur = r.pick ? game.players.find((p) => p[r.pick!])?.id ?? '' : ''
          return (
            <label key={r.index} className={cx('flex items-start gap-3 rounded-2xl border border-line bg-dusk p-3', done && 'opacity-40', !r.present && 'opacity-40')}>
              <input
                type="checkbox"
                checked={done}
                disabled={!night}
                onChange={(e) => update((g) => ({ ...g, done: { ...g.done, [r.index]: e.target.checked } }))}
                className="mt-1 h-6 w-6 shrink-0 accent-candle"
              />
              <div className="min-w-0 flex-1">
                <div><b>{r.name}</b> — <span className="text-candle">{r.who}</span></div>
                <div className="text-sm text-dim">{r.hint}</div>
                {r.pick && night && (
                  <div className="mt-2" onClick={(e) => e.preventDefault()}>
                    <Select value={cur} aria-label={`${r.pickLabel} target`} onChange={(e) => update((g) => ({ ...g, players: setMark(g.players, r.pick!, e.target.value || null) }))}>
                      <option value="">{r.pickLabel}: nobody</option>
                      {game.players.map((p) => <option key={p.id} value={p.id}>{r.pickLabel}: {p.name}</option>)}
                    </Select>
                  </div>
                )}
              </div>
            </label>
          )
        })}
      </div>
      <div className="mt-4">{phaseButton}</div>
      {S.jinx && (
        <Card className="mt-4 text-sm">
          <b>Djinn — special rules in this script</b>
          {S.jinx.map((j) => <div key={j} className="mt-1 text-dim">{j}</div>)}
        </Card>
      )}
    </>
  )
}
