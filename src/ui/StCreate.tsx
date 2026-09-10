import { useState } from 'react'
import { COMP, MAX_PLAYERS, MIN_PLAYERS, SCRIPTS, SCRIPT_IDS, type ScriptId } from '../data/characters'
import { newGame } from '../game/logic'
import { ST_KEY, deviceId, setLocal } from '../lib/device'
import { navigate } from '../lib/router'
import { createGame } from '../lib/store'
import { Banner, Button, Card, Footer, Label, Page, cx } from './kit'

export default function StCreate() {
  const [script, setScript] = useState<ScriptId>('TB')
  const [count, setCount] = useState(8)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [t, o, m, d] = COMP[count]

  async function create() {
    setBusy(true)
    setError(null)
    try {
      const secret = deviceId()
      const code = await createGame(secret, newGame('??', script, count))
      setLocal(ST_KEY, { code, at: Date.now() })
      navigate(`/st/${code}`, true)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Page title="New game" back="/">
      {error && <Banner>{error}</Banner>}
      <Label>Script</Label>
      <div className="flex flex-col gap-2">
        {SCRIPT_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setScript(id)}
            className={cx('display min-h-14 rounded-2xl border px-4 text-left text-xl', script === id ? 'border-candle bg-candle/15 text-candle' : 'border-line bg-dusk text-wax')}
          >
            {SCRIPTS[id].name}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <Label>Players (you can still change who joins)</Label>
        <div className="flex items-center gap-3">
          <Button big aria-label="Fewer players" onClick={() => setCount((c) => Math.max(MIN_PLAYERS, c - 1))} disabled={count <= MIN_PLAYERS} className="w-16 text-2xl">−</Button>
          <div className="display flex-1 text-center text-5xl">{count}</div>
          <Button big aria-label="More players" onClick={() => setCount((c) => Math.min(MAX_PLAYERS, c + 1))} disabled={count >= MAX_PLAYERS} className="w-16 text-2xl">+</Button>
        </div>
        <Card className="mt-3 text-dim">
          <b className="text-wax">{t}</b> Townsfolk · <b className="text-wax">{o}</b> Outsider{o !== 1 ? 's' : ''} · <b className="text-wax">{m}</b> Minion{m > 1 ? 's' : ''} · <b className="text-wax">{d}</b> Demon
          <div className="mt-1 text-sm">{SCRIPTS[script].setupNote}</div>
        </Card>
      </div>
      <Button big variant="primary" className="mt-8 w-full" onClick={create} disabled={busy}>
        {busy ? 'Creating…' : 'Create game'}
      </Button>
      <Footer />
    </Page>
  )
}
