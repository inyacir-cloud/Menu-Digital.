-- Compatibilidad para proyectos que ya tenían el menú creado antes de las
-- secciones de temporada y bebidas.
-- Ejecuta schema.sql completo en un proyecto nuevo. En uno existente,
-- ejecuta primero este archivo y después vuelve a ejecutar schema.sql.

alter table public.settings
  add column if not exists seasonal_enabled boolean not null default false,
  add column if not exists seasonal_title text not null default 'De temporada',
  add column if not exists seasonal_note text not null default 'Pregunta si hay',
  add column if not exists bebidas_enabled boolean not null default false,
  add column if not exists bebidas_title text not null default 'Bebidas del día',
  add column if not exists bebidas_note text not null default 'Disponibilidad del día · pregunta si hay del sabor que quieres';

alter table public.menu_items
  add column if not exists section text not null default 'category',
  add column if not exists category_id uuid references public.categories(id) on delete cascade,
  add column if not exists unavailable boolean not null default false,
  add column if not exists sort_order int not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'menu_items_section_category_chk'
      and conrelid = 'public.menu_items'::regclass
  ) then
    alter table public.menu_items
      add constraint menu_items_section_category_chk check (
        (section = 'category' and category_id is not null) or
        (section in ('seasonal', 'bebidas') and category_id is null)
      );
  end if;
end;
$$;

create table if not exists public.item_extras (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0 check (price >= 0),
  sort_order int not null default 0
);

create table if not exists public.item_sizes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0 check (price >= 0),
  unavailable boolean not null default false,
  sort_order int not null default 0
);

alter table public.item_sizes
  add column if not exists unavailable boolean not null default false;

create index if not exists menu_items_section_idx on public.menu_items (section);
create index if not exists menu_items_category_idx on public.menu_items (category_id);
create index if not exists menu_items_sort_idx on public.menu_items (sort_order);
create index if not exists item_extras_item_idx on public.item_extras (item_id);
create index if not exists item_sizes_item_idx on public.item_sizes (item_id);

-- Recupera los tamaños oficiales si una versión anterior guardó las bebidas
-- sin sus presentaciones.
insert into public.item_sizes (item_id, name, price, sort_order)
select mi.id, sizes.name, sizes.price, sizes.sort_order
from public.menu_items mi
cross join lateral (values
  ('Medio litro', case when mi.name in ('Agua de horchata', 'Agua de jamaica', 'Agua de tamarindo') then 20 else 25 end::numeric, 0),
  ('Litro', case when mi.name in ('Agua de horchata', 'Agua de jamaica', 'Agua de tamarindo') then 35 else 40 end::numeric, 1)
) as sizes(name, price, sort_order)
where mi.section = 'bebidas'
  and mi.name in ('Agua de horchata', 'Agua de jamaica', 'Agua de tamarindo', 'Limonada', 'Agua de piña', 'Agua de sandía', 'Agua de melón', 'Agua de naranja')
  and not exists (select 1 from public.item_sizes existing where existing.item_id = mi.id);

alter table public.settings enable row level security;
alter table public.menu_items enable row level security;
alter table public.item_extras enable row level security;
alter table public.item_sizes enable row level security;

 drop policy if exists "lectura publica settings" on public.settings;
create policy "lectura publica settings" on public.settings for select using (true);
drop policy if exists "lectura publica menu_items" on public.menu_items;
create policy "lectura publica menu_items" on public.menu_items for select using (true);
drop policy if exists "lectura publica item_extras" on public.item_extras;
create policy "lectura publica item_extras" on public.item_extras for select using (true);
drop policy if exists "lectura publica item_sizes" on public.item_sizes;
create policy "lectura publica item_sizes" on public.item_sizes for select using (true);

drop policy if exists "admin escribe settings" on public.settings;
create policy "admin escribe settings" on public.settings for all to anon, authenticated using (true) with check (true);
drop policy if exists "admin escribe menu_items" on public.menu_items;
create policy "admin escribe menu_items" on public.menu_items for all to anon, authenticated using (true) with check (true);
drop policy if exists "admin escribe item_extras" on public.item_extras;
create policy "admin escribe item_extras" on public.item_extras for all to anon, authenticated using (true) with check (true);
drop policy if exists "admin escribe item_sizes" on public.item_sizes;
create policy "admin escribe item_sizes" on public.item_sizes for all to anon, authenticated using (true) with check (true);
