import { useState } from 'react'
import { PLAYER_KEY, deviceId, fresh, getLocal, setLocal, type Remembered } from '../lib/device'
import { navigate } from '../lib/router'
import { joinGame, poke } from '../lib/store'
import { Banner, Button, Footer, Input, Label, Page } from './kit'

export default function Join({ code: preset }: { code?: string }) {
  const prev = getLocal<Remembered>(PLAYER_KEY)
  const [code, setCode] = useState(preset ?? '')
  const [name, setName] = useState(prev?.name ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const valid = /^\d{2}$/.test(code) && name.trim().length > 0

  async function join() {
    setBusy(true)
    setError(null)
    try {
      const id = deviceId()
      await joinGame(code, id, name.trim())
      void poke(code)
      setLocal(PLAYER_KEY, { code, name: name.trim(), at: Date.now() })
      navigate(`/p/${code}`, true)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  const remembered = fresh(prev)
  return (
    <Page title="Join a game" back="/">
      <form onSubmit={(e) => { e.preventDefault(); if (valid && !busy) void join() }}>
        {error && <Banner>{error}</Banner>}
        <Label>Game code (ask the Storyteller)</Label>
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={2}
          placeholder="00"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 2))}
          className="display text-center text-5xl tracking-[.3em]"
          style={{ minHeight: 80 }}
        />
        <div className="mt-5">
          <Label>Your name</Label>
          <Input autoComplete="nickname" maxLength={24} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button big type="submit" variant="primary" className="mt-6 w-full" disabled={!valid || busy}>
          {busy ? 'Joining…' : 'Join'}
        </Button>
        {remembered && (
          <Button variant="ghost" className="mt-3 w-full" onClick={() => navigate(`/p/${remembered.code}`)}>
            Back to game {remembered.code}
          </Button>
        )}
      </form>
      <Footer />
    </Page>
  )
}
