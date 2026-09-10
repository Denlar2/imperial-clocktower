// Sync adapter. Everything that talks to the backend lives here so it can be swapped out.
// Backend: Supabase — see supabase/schema.sql for the RPC functions this calls.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Game, PlayerView } from '../game/types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const configured = !!(url && key)

let client: SupabaseClient | null = null
function sb(): SupabaseClient {
  if (!configured) throw new Error('Backend not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  return (client ??= createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } }))
}

function fail(e: { message?: string } | null): never {
  throw new Error(e?.message ?? 'Request failed')
}

export async function createGame(secret: string, state: Game): Promise<string> {
  const { data, error } = await sb().rpc('create_game', { p_secret: secret, p_state: state })
  if (error) fail(error)
  return data as string
}

export async function stRead(code: string, secret: string): Promise<Game | null> {
  const { data, error } = await sb().rpc('st_read', { p_code: code, p_secret: secret })
  if (error) fail(error)
  return (data as Game | null) ?? null
}

export async function stWrite(code: string, secret: string, state: Game): Promise<void> {
  const { error } = await sb().rpc('st_write', { p_code: code, p_secret: secret, p_state: state })
  if (error) fail(error)
}

export async function joinGame(code: string, id: string, name: string): Promise<PlayerView> {
  const { data, error } = await sb().rpc('join_game', { p_code: code, p_id: id, p_name: name })
  if (error) fail(error)
  return data as PlayerView
}

export async function playerView(code: string, id: string): Promise<PlayerView | null> {
  const { data, error } = await sb().rpc('player_view', { p_code: code, p_id: id })
  if (error) fail(error)
  return (data as PlayerView | null) ?? null
}

/** Tell everyone else in the game to refetch. */
export async function poke(code: string): Promise<void> {
  try {
    await sb().channel(`game:${code}`).send({ type: 'broadcast', event: 'poke', payload: { t: Date.now() } })
  } catch { /* best effort — polling covers it */ }
}

/**
 * Listen for pokes on a game. `onPoke` also fires whenever the socket (re)connects,
 * so callers refetch after a dropped connection. Returns an unsubscribe function.
 */
export function subscribe(code: string, onPoke: () => void): () => void {
  if (!configured) return () => {}
  const ch = sb().channel(`game:${code}`)
  ch.on('broadcast', { event: 'poke' }, () => onPoke())
    .subscribe((status) => { if (status === 'SUBSCRIBED') onPoke() })
  return () => { void sb().removeChannel(ch) }
}
