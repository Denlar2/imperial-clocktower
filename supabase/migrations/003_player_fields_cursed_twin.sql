-- New per-player fields (Witch curse, Evil Twin pairing) in join_game. Idempotent.
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
      'poison', false, 'drunk', false, 'safe', false, 'mad', false, 'cursed', false, 'twin', null, 'note', '', 'reveal', null));
  end if;
  update games set state = jsonb_set(s, '{players}', players), updated_at = now() where code = p_code;
  return player_view(p_code, p_id);
end $$;

