import { useCallback, useState } from 'react'
import type { Game } from '../game/types'
import { delLocal, getLocal, setLocal } from './device'

export const SOLO_KEY = 'ct.solo'

/** Single-phone game: lives only in this phone's localStorage. Same shape as useStGame's result. */
export function useSoloGame() {
  const [game, setGame] = useState<Game | null>(() => getLocal<Game>(SOLO_KEY))
  const update = useCallback((fn: (g: Game) => Game) => {
    setGame((cur) => {
      if (!cur) return cur
      const next = fn(cur)
      if (next !== cur) setLocal(SOLO_KEY, next)
      return next
    })
  }, [])
  return { game, update, error: null as string | null, loading: false, saving: false }
}

export function startSoloGame(g: Game) { setLocal(SOLO_KEY, g) }
export function endSoloGame() { delLocal(SOLO_KEY) }
