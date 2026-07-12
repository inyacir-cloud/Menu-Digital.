create table if not exists public.categories (
  id text primary key,
  name text not null,
  icon text null
);

create table if not exists public.complements (
  id text primary key,
  name text not null,
  price double precision not null default 0
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  description text not null default '',
  price double precision not null default 0,
  image text not null default '/Logo.png',
  category_id text not null references public.categories(id) on delete cascade,
  complement_ids text[] not null default '{}',
  is_daily_water boolean not null default false,
  is_available boolean not null default true,
  sizes jsonb null
);

create table if not exists public.business_config (
  id text primary key,
  name text not null,
  is_open boolean not null default true,
  phone text not null default '',
  schedule text not null default '',
  address text null,
  description text null,
  logo text null,
  social_media jsonb null,
  service_type text null,
  delivery_radius text null,
  hours jsonb null
);

alter table public.categories enable row level security;
alter table public.complements enable row level security;
alter table public.products enable row level security;
alter table public.business_config enable row level security;

drop policy if exists "public categories full access" on public.categories;
create policy "public categories full access" on public.categories for all using (true) with check (true);

drop policy if exists "public complements full access" on public.complements;
create policy "public complements full access" on public.complements for all using (true) with check (true);

drop policy if exists "public products full access" on public.products;
create policy "public products full access" on public.products for all using (true) with check (true);

drop policy if exists "public business_config full access" on public.business_config;
create policy "public business_config full access" on public.business_config for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public storage read" on storage.objects;
create policy "public storage read" on storage.objects for select using (bucket_id = 'product-images');

drop policy if exists "public storage upload" on storage.objects;
create policy "public storage upload" on storage.objects for insert with check (bucket_id = 'product-images');

drop policy if exists "public storage update" on storage.objects;
create policy "public storage update" on storage.objects for update using (bucket_id = 'product-images') with check (bucket_id = 'product-images');

drop policy if exists "public storage delete" on storage.objects;
create policy "public storage delete" on storage.objects for delete using (bucket_id = 'product-images');