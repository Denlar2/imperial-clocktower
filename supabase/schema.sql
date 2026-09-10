-- Clocktower Storyteller — Supabase schema.
-- Paste this whole file into the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- One table holds the whole game as JSON. The anon key can NOT read or write the table
-- directly (RLS on, no policies). All access goes through the functions below, so a player
-- can only ever fetch their own role via player_view(), and only the Storyteller (who holds
-- the secret) can read or write the full grimoire.
--
-- Live updates use Supabase Realtime *Broadcast* (channel "game:<code>", event "poke"):
-- whoever writes sends a poke and everyone else refetches. No table replication needed.

create table if not exists public.games (
  code       text primary key,
  st_secret  text not null,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.games enable row level security;
revoke all on table public.games from anon, authenticated;

-- Games older than this are considered finished; their code can be reused.
create or replace function public.game_ttl() returns interval
language sql immutable as $$ select interval '12 hours' $$;

-- ST: create a game. Picks a free 2-digit code and returns it.
create or replace function public.create_game(p_secret text, p_state jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  select lpad(g::text, 2, '0') into c
    from generate_series(0, 99) g
   where not exists (select 1 from games
                      where code = lpad(g::text, 2, '0') and updated_at > now() - game_ttl())
   order by random() limit 1;
  if c is null then raise exception 'No free game codes right now, try again later'; end if;
  insert into games (code, st_secret, state, updated_at)
  values (c, p_secret, jsonb_set(p_state, '{code}', to_jsonb(c)), now())
  on conflict (code) do update set st_secret = excluded.st_secret, state = excluded.state, updated_at = now();
  return c;
end $$;

-- ST: read the full game.
create or replace function public.st_read(p_code text, p_secret text)
returns jsonb language sql security definer stable set search_path = public as $$
  select state from games
   where code = p_code and st_secret = p_secret and updated_at > now() - game_ttl();
$$;

-- ST: replace the full game.
create or replace function public.st_write(p_code text, p_secret text, p_state jsonb)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare t timestamptz;
begin
  update games set state = jsonb_set(p_state, '{code}', to_jsonb(p_code)), updated_at = now()
   where code = p_code and st_secret = p_secret
  returning updated_at into t;
  if t is null then raise exception 'Not your game (or it has expired)'; end if;
  return t;
end $$;

-- Player: what this player is allowed to see. The role is only sent between "Start game" and the
-- first night (phase 0); after that players must remember it, like handing back a token.
create or replace function public.player_view(p_code text, p_id text)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'code',    g.code,
    'script',  g.state->'script',
    'status',  g.state->'status',
    'phase',   g.state->'phase',
    'count',   g.state->'count',
    'players', coalesce((
        select jsonb_agg(jsonb_build_object('id', e->'id', 'name', e->'name', 'dead', e->'dead', 'ghost', e->'ghost') order by o)
          from jsonb_array_elements(g.state->'players') with ordinality as t(e, o)), '[]'::jsonb),
    'me', (
        select jsonb_build_object('id', e->'id', 'name', e->'name', 'dead', e->'dead', 'executed', e->'executed', 'ghost', e->'ghost',
                                  'reveal', case when g.state->>'status' = 'playing' and (g.state->>'phase')::int = 0 then e->'reveal' else null end)
          from jsonb_array_elements(g.state->'players') e
         where e->>'id' = p_id limit 1)
  )
  from games g where g.code = p_code and g.updated_at > now() - game_ttl();
$$;

-- Player: join (or rejoin / rename while in the lobby). Returns player_view.
create or replace function public.join_game(p_code text, p_id text, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s jsonb; players jsonb; nm text; known boolean;
begin
  nm := left(btrim(coalesce(p_name, '')), 24);
  if nm = '' then raise exception 'Name required'; end if;
  select state into s from games where code = p_code and updated_at > now() - game_ttl() for update;
  if s is null then raise exception 'No game with that code'; end if;
  players := coalesce(s->'players', '[]'::jsonb);
  known := exists (select 1 from jsonb_array_elements(players) e where e->>'id' = p_id);
  if known then
    if s->>'status' = 'lobby' then
      select jsonb_agg(case when e->>'id' = p_id then e || jsonb_build_object('name', nm) else e end order by o)
        into players from jsonb_array_elements(players) with ordinality as t(e, o);
    end if;
  else
    if s->>'status' <> 'lobby' then raise exception 'That game has already started'; end if;
    if jsonb_array_length(players) >= 15 then raise exception 'That game is full'; end if;
    players := players || jsonb_build_array(jsonb_build_object(
      'id', p_id, 'name', nm, 'role', null, 'fakeAs', null, 'evil', null,
      'dead', false, 'executed', false, 'ghost', true,
      'poison', false, 'drunk', false, 'safe', false, 'mad', false, 'note', '', 'reveal', null));
  end if;
  update games set state = jsonb_set(s, '{players}', players), updated_at = now() where code = p_code;
  return player_view(p_code, p_id);
end $$;

grant execute on function public.create_game(text, jsonb) to anon, authenticated;
grant execute on function public.st_read(text, text) to anon, authenticated;
grant execute on function public.st_write(text, text, jsonb) to anon, authenticated;
grant execute on function public.player_view(text, text) to anon, authenticated;
grant execute on function public.join_game(text, text, text) to anon, authenticated;
