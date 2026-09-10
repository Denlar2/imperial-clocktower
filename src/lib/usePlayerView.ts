import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlayerView } from '../game/types'
import { joinGame, playerView, poke, subscribe } from './store'

const POLL_MS = 15000

/** A player's live view of the game. Rejoins automatically if the Storyteller's write raced our join. */
export function usePlayerView(code: string, id: string, name: string | undefined) {
  const [view, setView] = useState<PlayerView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [gone, setGone] = useState(false)
  const rejoinAt = useRef(0)

  const refresh = useCallback(async () => {
    try {
      const v = await playerView(code, id)
      if (!v) { setGone(true); setLoading(false); return }
      setGone(false)
      setError(null)
      if (!v.me && v.status === 'lobby' && name && Date.now() - rejoinAt.current > 3000) {
        // Lost a race with the Storyteller's write — join again.
        rejoinAt.current = Date.now()
        const again = await joinGame(code, id, name)
        void poke(code)
        setView(again)
      } else {
        setView(v)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [code, id, name])

  useEffect(() => {
    void refresh()
    const unsub = subscribe(code, () => void refresh())
    const poll = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, POLL_MS)
    const onVis = () => { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('online', onVis)
    return () => { unsub(); window.clearInterval(poll); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('online', onVis) }
  }, [code, refresh])

  return { view, error, loading, gone, refresh }
}
