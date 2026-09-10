import { useEffect, useState } from 'react'
import { getScript } from '../data/characters'
import { phaseName } from '../game/logic'
import { PLAYER_KEY, deviceId, getLocal, setLocal, type Remembered } from '../lib/device'
import { navigate } from '../lib/router'
import { usePlayerView } from '../lib/usePlayerView'
import Notes from './Notes'
import RoleReveal from './RoleReveal'
import { Banner, Button, Card, Empty, Footer, Page, cx } from './kit'

export default function PlayerScreen({ code }: { code: string }) {
  const id = deviceId()
  const remembered = getLocal<Remembered>(PLAYER_KEY)
  const { view, error, loading, gone, refresh } = usePlayerView(code, id, remembered?.code === code ? remembered.name : undefined)
  const [showRole, setShowRole] = useState(false)
  const [seenReveal, setSeenReveal] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const status = view?.status
  // The role is only shown between "Start game" and the first night, whatever the server sends.
  const before = status === 'playing' && view?.phase === 0
  const reveal = before ? view?.me?.reveal ?? null : null
  const hasReveal = !!reveal
  // First time the reveal arrives: go full screen (hidden) so the player flips it themselves.
  useEffect(() => {
    if (hasReveal && !seenReveal) { setSeenReveal(true); setFullscreen(true); setShowRole(false) }
  }, [hasReveal, seenReveal])
  // Night falls: drop the token screen if the player is still on it.
  useEffect(() => { if (!hasReveal) { setFullscreen(false); setShowRole(false) } }, [hasReveal])
  useEffect(() => { if (view?.me) setLocal(PLAYER_KEY, { code, name: view.me.name, at: Date.now() }) }, [view?.me, code])

  if (loading) return <Page title={`Game ${code}`}><Empty>Connecting…</Empty></Page>
  if (gone || !view) {
    return (
      <Page title={`Game ${code}`} back="/">
        <Empty>No game with code {code} — it may have expired.</Empty>
        <Button big className="w-full" onClick={() => navigate('/join')}>Join another game</Button>
      </Page>
    )
  }
  const S = getScript(view.script)
  const me = view.me

  if (!me) {
    return (
      <Page title={`Game ${code}`} back="/">
        {error && <Banner>{error}</Banner>}
        <Empty>{view.status === 'lobby' ? 'You are not in this game yet.' : 'You are not in this game (the Storyteller may have removed you).'}</Empty>
        <Button big variant="primary" className="w-full" onClick={() => navigate(`/join/${code}`)}>Join game {code}</Button>
      </Page>
    )
  }

  if (fullscreen && reveal) {
    return (
      <>
        <RoleReveal reveal={reveal} scriptId={view.script} name={me.name} shown={showRole} onToggle={() => setShowRole((s) => !s)} />
        {!showRole && (
          <button type="button" onClick={() => setFullscreen(false)} className="safe-b fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full px-4 py-2 text-dim underline">
            Done, back to the game
          </button>
        )}
      </>
    )
  }

  const alive = !me.dead
  return (
    <Page title={S?.name ?? 'Clocktower'} right={<span className="text-sm text-dim">code {code}</span>}>
      {error && <Banner>{error}</Banner>}
      {view.status === 'lobby' ? (
        <>
          <Card className="text-center">
            <div className="display text-2xl">Waiting for the Storyteller…</div>
            <div className="mt-1 text-dim">You're in as <b className="text-wax">{me.name}</b>.</div>
          </Card>
          <Button variant="ghost" className="mt-2 w-full" onClick={() => navigate(`/join/${code}`)}>Change name</Button>
          <h2 className="mt-8 mb-2 text-xl text-candle">Players</h2>
          <ol className="flex flex-col gap-1">
            {view.players.map((p, i) => (
              <li key={p.id} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                <span className="w-6 text-right text-dim">{i + 1}</span>
                <span className={cx('flex-1', p.id === id && 'text-candle')}>{p.name}</span>
              </li>
            ))}
          </ol>
        </>
      ) : before ? (
        <>
          <Card className="text-center">
            <div className="display text-2xl">Learn your role</div>
            <div className="mt-1 text-sm text-dim">You can only see it until the Storyteller begins the first night. Remember it!</div>
          </Card>
          <Button big variant="primary" className="mt-3 w-full" onClick={() => { setShowRole(false); setFullscreen(true) }}>
            Show my role
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="display text-3xl text-candle">{phaseName(view.phase)}</div>
            <div className={cx('display text-2xl', alive ? 'text-wax' : 'text-evil')}>
              <span>{alive ? 'Alive' : 'Dead'}</span>
              {!alive && <span className="ml-2 text-sm text-dim">{me.ghost ? '👻 vote left' : 'no vote left'}</span>}
            </div>
          </div>
          <Notes view={view} myId={id} />
        </>
      )}
      <Button className="mt-6 w-full" onClick={() => navigate(`/sheet/${view.script}`)}>Character sheet</Button>
      <Button variant="ghost" className="mt-2 w-full" onClick={() => void refresh()}>Refresh</Button>
      <Footer />
    </Page>
  )
}
