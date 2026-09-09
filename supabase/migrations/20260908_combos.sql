-- Combos con precio fijo y grupos de elección que referencian productos existentes.
create table if not exists public.combos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null default 0 check (price >= 0),
  description text,
  badge text,
  image text,
  enabled boolean not null default true,
  sort_order int not null default 0,
  groups jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_combos_updated on public.combos;
create trigger trg_combos_updated before update on public.combos for each row execute function public.set_updated_at();
alter table public.combos enable row level security;
grant select on public.combos to anon, authenticated;
grant insert, update, delete on public.combos to authenticated;
drop policy if exists "lectura publica combos" on public.combos;
create policy "lectura publica combos" on public.combos for select using (true);
drop policy if exists "admin escribe combos" on public.combos;
create policy "admin escribe combos" on public.combos for all to authenticated using (true) with check (true);

-- Después de esta migración, vuelve a ejecutar en schema.sql la función
-- get_menu() para que el menú público también devuelva los combos.
