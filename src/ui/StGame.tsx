import { useEffect, useState } from 'react'
import { getScript } from '../data/characters'
import { isNight, nextPhase } from '../game/logic'
import { ST_KEY, deviceId, setLocal } from '../lib/device'
import { navigate } from '../lib/router'
import { useStGame } from '../lib/useStGame'
import Grimoire from './Grimoire'
import Lobby from './Lobby'
import More from './More'
import Night from './Night'
import Vote from './Vote'
import { Banner, BottomNav, Button, Empty, Page } from './kit'

type Tab = 'grim' | 'night' | 'vote' | 'more'

export default function StGame({ code }: { code: string }) {
  const secret = deviceId()
  const { game, update, error, loading, saving } = useStGame(code, secret)
  const [tab, setTab] = useState<Tab>('grim')
  useEffect(() => { if (game) setLocal(ST_KEY, { code, at: Date.now() }) }, [game, code])

  if (loading) return <Page title={`Game ${code}`}><Empty>Loading…</Empty></Page>
  if (!game) {
    return (
      <Page title={`Game ${code}`} back="/">
        <Banner>{error ?? 'Game not found'}</Banner>
        <Empty>This game has expired, or it was created on another phone.</Empty>
        <Button big className="w-full" onClick={() => navigate('/st')}>Start a new game</Button>
      </Page>
    )
  }
  const S = getScript(game.script)!

  if (game.status === 'lobby') return <Lobby game={game} S={S} update={update} error={error} saving={saving} />

  const phaseButton = (
    <Button
      big
      variant="primary"
      className="w-full"
      onClick={() => { update((g) => nextPhase(S, g)); setTab(isNight(game.phase) ? 'grim' : 'night') }}
    >
      {game.phase === 0 ? 'Begin first night' : isNight(game.phase) ? 'Dawn — start the day' : 'Dusk — start the night'}
    </Button>
  )

  const titles: Record<Tab, string> = { grim: 'Grimoire', night: 'Night order', vote: 'Vote', more: S.name }
  return (
    <Page
      title={titles[tab]}
      right={<span className="text-sm text-dim">{saving ? 'saving…' : `code ${code}`}</span>}
      nav={
        <BottomNav
          current={tab}
          onChange={(t) => setTab(t as Tab)}
          items={[{ id: 'grim', label: 'Grimoire' }, { id: 'night', label: 'Night' }, { id: 'vote', label: 'Vote' }, { id: 'more', label: 'More' }]}
        />
      }
    >
      {error && <Banner>{error}</Banner>}
      {tab === 'grim' && <Grimoire game={game} S={S} update={update} phaseButton={phaseButton} />}
      {tab === 'night' && <Night game={game} S={S} update={update} phaseButton={phaseButton} />}
      {tab === 'vote' && <Vote game={game} S={S} update={update} />}
      {tab === 'more' && <More game={game} S={S} update={update} />}
    </Page>
  )
}
