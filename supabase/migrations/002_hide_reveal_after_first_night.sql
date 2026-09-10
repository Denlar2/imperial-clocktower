-- Run this if you created the table before 2026-09-10 (otherwise schema.sql already has it).
-- Players only receive their role between "Start game" and the first night.
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
