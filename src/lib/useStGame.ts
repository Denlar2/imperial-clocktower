import { useCallback, useEffect, useRef, useState } from 'react'
import type { Game, Player } from '../game/types'
import { poke, stRead, stWrite, subscribe } from './store'

const POLL_MS = 20000
const SAVE_DEBOUNCE_MS = 150

/**
 * The Storyteller's copy of the game. Local state is authoritative; every change is written
 * (debounced) to the backend and then a poke is broadcast. Players only ever change the
 * `players` list (join / rename), so on a poke we merge that list instead of replacing state.
 */
export function useStGame(code: string, secret: string) {
  const [game, setGame] = useState<Game | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const latest = useRef<Game | null>(null)
  const dirty = useRef(false)
  const inFlight = useRef(false)
  const timer = useRef<number | undefined>(undefined)

  const flush = useCallback(async () => {
    if (inFlight.current || !dirty.current || !latest.current) return
    inFlight.current = true
    dirty.current = false
    setSaving(true)
    try {
      await stWrite(code, secret, latest.current)
      void poke(code)
      setError(null)
    } catch (e) {
      dirty.current = true
      setError((e as Error).message)
    } finally {
      inFlight.current = false
      setSaving(false)
      if (dirty.current) window.setTimeout(flush, 1000)
    }
  }, [code, secret])

  const update = useCallback((fn: (g: Game) => Game) => {
    const cur = latest.current
    if (!cur) return
    const next = fn(cur)
    if (next === cur) return
    latest.current = next
    setGame(next)
    dirty.current = true
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, SAVE_DEBOUNCE_MS)
  }, [flush])

  /** Pull the server copy and merge player joins / renames into local state. */
  const refresh = useCallback(async () => {
    try {
      const server = await stRead(code, secret)
      if (!server) { setError('Game not found (expired or not yours)'); setLoading(false); return }
      setError(null)
      const cur = latest.current
      if (!cur) {
        latest.current = server
        setGame(server)
      } else {
        const merged = mergePlayers(cur, server)
        if (merged !== cur) {
          latest.current = merged
          setGame(merged)
        }
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [code, secret])

  useEffect(() => {
    latest.current = null
    void refresh()
    const unsub = subscribe(code, () => void refresh())
    const poll = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, POLL_MS)
    const onVis = () => { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', onVis)
    return () => { unsub(); window.clearInterval(poll); document.removeEventListener('visibilitychange', onVis); window.clearTimeout(timer.current) }
  }, [code, refresh])

  return { game, update, error, loading, saving, refresh }
}

/** Keep local state but adopt new players / renamed players from the server (lobby only). */
function mergePlayers(local: Game, server: Game): Game {
  const byId = new Map(local.players.map((p) => [p.id, p]))
  let changed = false
  const players: Player[] = local.players.map((p) => {
    const s = server.players.find((q) => q.id === p.id)
    if (s && local.status === 'lobby' && s.name !== p.name) { changed = true; return { ...p, name: s.name } }
    return p
  })
  if (local.status === 'lobby') {
    for (const s of server.players) {
      if (!byId.has(s.id)) { players.push(s); changed = true }
    }
  }
  return changed ? { ...local, players } : local
}
