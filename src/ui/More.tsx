import { useState } from 'react'
import type { Script } from '../data/characters'
import type { Game } from '../game/types'
import { ST_KEY, delLocal } from '../lib/device'
import { absoluteUrl, navigate } from '../lib/router'
import { Button, Card, Footer, Input, Toast, copyText, useToast } from './kit'

type Update = (fn: (g: Game) => Game) => void

export default function More({ game, S, update }: { game: Game; S: Script; update: Update }) {
  const [toast, say] = useToast()
  const [editing, setEditing] = useState<string | null>(null)
  const copy = async (path: string, what: string) => say((await copyText(absoluteUrl(path))) ? `${what} link copied` : 'Could not copy')
  return (
    <>
      <Toast msg={toast} />
      <Card className="text-center">
        <div className="text-dim">Game code</div>
        <div className="display text-5xl text-candle">{game.code}</div>
        <div className="text-sm text-dim">{S.name} · {game.players.length} players</div>
      </Card>
      <div className="mt-3 flex flex-col gap-2">
        <Button onClick={() => navigate(`/sheet/${S.id}`)}>Character sheet</Button>
        <Button onClick={() => copy(`/sheet/${S.id}`, 'Sheet')}>Copy character sheet link</Button>
      </div>

      <h2 className="mt-8 mb-2 text-xl text-candle">Players</h2>
      <div className="flex flex-col gap-2">
        {game.players.map((p) => (
          <Card key={p.id} className="flex items-center gap-2 p-2">
            {editing === p.id ? (
              <Input
                autoFocus
                defaultValue={p.name}
                maxLength={24}
                onBlur={(e) => { const v = e.target.value.trim(); if (v) update((g) => ({ ...g, players: g.players.map((q) => (q.id === p.id ? { ...q, name: v } : q)) })); setEditing(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              />
            ) : (
              <button type="button" className="flex-1 truncate text-left" onClick={() => setEditing(p.id)}>{p.name} <span className="text-xs text-dim">rename</span></button>
            )}
            <Button variant="danger" onClick={() => { if (confirm(`Remove ${p.name} from the game?`)) update((g) => ({ ...g, players: g.players.filter((q) => q.id !== p.id), votes: (g.votes ?? []).filter((v) => v !== p.id) })) }}>
              Kick
            </Button>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 mb-2 text-xl text-candle">Game</h2>
      <Button
        variant="danger"
        className="w-full"
        onClick={() => { if (confirm('Back to the lobby? Roles are kept, but everyone returns to waiting.')) update((g) => ({ ...g, status: 'lobby', phase: 0, done: {}, votes: [], players: g.players.map((p) => ({ ...p, reveal: null })) })) }}
      >
        Back to lobby (re-deal)
      </Button>
      <Button variant="ghost" className="mt-2 w-full" onClick={() => { delLocal(ST_KEY); navigate('/') }}>
        Leave this game
      </Button>
      <Footer />
    </>
  )
}
