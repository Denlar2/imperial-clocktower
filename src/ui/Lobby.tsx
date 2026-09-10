import { useState } from 'react'
import { COMP, TYPES, charsOfType, getChar, type Script } from '../data/characters'
import { assignFakes, dealRoles, isEvil, moveSeat, pickBountyHunterTarget, resetPlayer, withReveals } from '../game/logic'
import type { Game } from '../game/types'
import { absoluteUrl, navigate } from '../lib/router'
import { Sortable } from './Sortable'
import { Banner, Button, Card, Footer, Input, Page, Select, Toast, alignClass, copyText, cx, useToast } from './kit'

type Update = (fn: (g: Game) => Game) => void

export default function Lobby({ game, S, update, error, saving }: { game: Game; S: Script; update: Update; error: string | null; saving: boolean }) {
  const [toast, say] = useToast()
  const [editing, setEditing] = useState<string | null>(null)
  const P = game.players
  const n = P.length
  const comp = COMP[n]
  const dealt = P.length > 0 && P.every((p) => p.role)
  const canStart = n >= 5 && n <= 15 && dealt
  const joinUrl = absoluteUrl(`/join/${game.code}`)

  const actual = TYPES.map((t) => P.filter((p) => getChar(S, p.role)?.type === t).length)
  const mi = P.findIndex((p) => p.role === 'Marionette')
  const di = P.findIndex((p) => getChar(S, p.role)?.type === 'Demon')
  const marionetteBad = mi >= 0 && di >= 0 && Math.min((mi - di + n) % n, (di - mi + n) % n) !== 1

  function start() {
    update((g) => {
      let players = g.players.map(resetPlayer)
      if (!players.some((p) => p.evil != null)) players = pickBountyHunterTarget(S, players)
      players = assignFakes(S, players)
      players = withReveals(S, players)
      return { ...g, players, status: 'playing', phase: 0, done: {}, votes: [] }
    })
  }

  return (
    <Page
      title="Lobby"
      back="/"
      right={<span className="text-sm text-dim">{saving ? 'saving…' : S.name}</span>}
    >
      <Toast msg={toast} />
      {error && <Banner>{error}</Banner>}
      <Card className="text-center">
        <div className="text-dim">Players join with code</div>
        <div className="display text-7xl tracking-[.15em] text-candle">{game.code}</div>
        <Button variant="ghost" onClick={async () => say((await copyText(joinUrl)) ? 'Join link copied' : joinUrl)}>Copy join link</Button>
      </Card>

      <div className="mt-5 flex items-baseline justify-between">
        <h2 className="text-xl text-candle">Seats</h2>
        <span className="text-sm text-dim">{n} of {game.count} joined · drag ⋮⋮ to match the circle</span>
      </div>
      {n === 0 && <div className="py-6 text-center text-dim">Nobody yet. Players appear here as they join.</div>}
      <Sortable
        items={P}
        onMove={(from, to) => update((g) => ({ ...g, players: moveSeat(g.players, from, to) }))}
        render={(p, i, handle) => (
          <Card className="flex items-center gap-2 p-2">
            {handle}
            <div className="min-w-0 flex-1">
              {editing === p.id ? (
                <Input
                  autoFocus
                  defaultValue={p.name}
                  maxLength={24}
                  onBlur={(e) => { const v = e.target.value.trim(); if (v) update((g) => ({ ...g, players: g.players.map((q) => (q.id === p.id ? { ...q, name: v } : q)) })); setEditing(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                />
              ) : (
                <button type="button" className="block w-full truncate text-left" onClick={() => setEditing(p.id)}>
                  <span className="text-dim">{i + 1}.</span> <span className="text-lg">{p.name}</span>
                </button>
              )}
              <Select
                value={p.role ?? ''}
                aria-label={`Role for ${p.name}`}
                className={cx('mt-1 min-h-10 text-sm', p.role && alignClass(isEvil(S, p)))}
                onChange={(e) => update((g) => ({ ...g, players: g.players.map((q) => (q.id === p.id ? { ...q, role: e.target.value || null, fakeAs: null, evil: null } : q)) }))}
              >
                <option value="">– no role –</option>
                {TYPES.map((t) => (
                  <optgroup key={t} label={t}>
                    {charsOfType(S, t).map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </optgroup>
                ))}
              </Select>
            </div>
            <button
              type="button"
              aria-label={`Remove ${p.name}`}
              className="min-h-11 min-w-11 text-dim"
              onClick={() => { if (confirm(`Remove ${p.name} from the game?`)) update((g) => ({ ...g, players: g.players.filter((q) => q.id !== p.id) })) }}
            >
              ✕
            </button>
          </Card>
        )}
      />

      {comp && (
        <Card className="mt-4 text-sm text-dim">
          <div>
            Table for {n}: <b className="text-wax">{comp[0]}</b> Townsfolk · <b className="text-wax">{comp[1]}</b> Outsider{comp[1] !== 1 ? 's' : ''} · <b className="text-wax">{comp[2]}</b> Minion{comp[2] > 1 ? 's' : ''} · <b className="text-wax">{comp[3]}</b> Demon. {S.setupNote}
          </div>
          {dealt && (
            <div className="mt-1">
              Dealt: <b className="text-wax">{actual[0]}</b> / <b className="text-wax">{actual[1]}</b> / <b className="text-wax">{actual[2]}</b> / <b className="text-wax">{actual[3]}</b>
              {P.some((p) => p.role === 'Bounty Hunter') && ' · one Townsfolk will be secretly evil'}
            </div>
          )}
          {marionetteBad && <div className="mt-1 text-evil">Marionette should sit next to the Demon.</div>}
        </Card>
      )}
      {n > 0 && n < 5 && <Banner kind="info">Need at least 5 players.</Banner>}

      <div className="mt-4 flex gap-2">
        <Button big className="flex-1" disabled={n < 5 || n > 15} onClick={() => update((g) => ({ ...g, players: dealRoles(S, g.players) }))}>
          {dealt ? 'Re-deal' : 'Deal roles'}
        </Button>
        <Button big variant="primary" className="flex-1" disabled={!canStart} onClick={start}>
          Start game
        </Button>
      </div>
      <p className="mt-2 text-center text-sm text-dim">Deal random roles, or pick per player above. Starting locks roles and sends everyone their reveal.</p>
      <Button variant="ghost" className="mt-4 w-full" onClick={() => navigate(`/sheet/${S.id}`)}>Character sheet</Button>
      <Footer />
    </Page>
  )
}
