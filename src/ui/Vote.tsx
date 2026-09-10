import type { Script } from '../data/characters'
import { counts } from '../game/logic'
import type { Game } from '../game/types'
import { Button, Card, cx } from './kit'

type Update = (fn: (g: Game) => Game) => void

/** Tap the players who raise a hand. Dead players may vote once (ghost vote). */
export default function Vote({ game, S, update }: { game: Game; S: Script; update: Update }) {
  const alive = counts(S, game.players).alive
  const needed = Math.ceil(alive / 2)
  const votes = game.votes ?? []
  const toggle = (id: string) => update((g) => ({ ...g, votes: (g.votes ?? []).includes(id) ? (g.votes ?? []).filter((v) => v !== id) : [...(g.votes ?? []), id] }))
  return (
    <>
      <Card className="mb-3 text-center">
        <div className="display text-5xl">
          <span className={cx(votes.length >= needed ? 'text-candle' : 'text-wax')}>{votes.length}</span>
          <span className="text-dim"> / {needed}</span>
        </div>
        <div className="text-sm text-dim">votes · {needed} needed to execute ({alive} alive)</div>
      </Card>
      <div className="grid grid-cols-2 gap-2">
        {game.players.map((p) => {
          const may = !p.dead || p.ghost
          const on = votes.includes(p.id)
          return (
            <button
              key={p.id}
              type="button"
              disabled={!may}
              onClick={() => toggle(p.id)}
              className={cx('min-h-14 rounded-2xl border px-3 text-left text-lg', on ? 'border-candle bg-candle/20 text-candle' : 'border-line bg-dusk', !may && 'opacity-30')}
            >
              {on ? '✋ ' : ''}{p.name}
              {p.dead && <span className="block text-xs text-dim">{p.ghost ? 'ghost vote' : 'no vote left'}</span>}
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex gap-2">
        <Button className="flex-1" onClick={() => update((g) => ({ ...g, votes: [] }))} disabled={votes.length === 0}>Clear</Button>
        <Button
          className="flex-1"
          disabled={!votes.some((id) => game.players.find((p) => p.id === id)?.dead)}
          onClick={() => update((g) => ({ ...g, votes: [], players: g.players.map((p) => (p.dead && (g.votes ?? []).includes(p.id) ? { ...p, ghost: false } : p)) }))}
        >
          Clear + use ghost votes
        </Button>
      </div>
    </>
  )
}
