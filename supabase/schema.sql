-- ============================================================================
--  MENÚ DIGITAL · Esquema de base de datos para Supabase (PostgreSQL)
--  Negocio: El Gordo & La Flaca — Antojitos Mexicanos
-- ----------------------------------------------------------------------------
--  Cómo usarlo:
--    1. Entra a tu proyecto en https://supabase.com
--    2. Menú lateral → SQL Editor → New query
--    3. Pega TODO este archivo y presiona "Run"
--    4. Listo. Se crean tablas, seguridad, almacenamiento y datos iniciales.
--
--  Es idempotente: puedes ejecutarlo varias veces sin romper nada.
-- ============================================================================

-- Extensión para generar identificadores únicos (gen_random_uuid)
create extension if not exists pgcrypto;

-- ============================================================================
--  1. FUNCIÓN AUXILIAR: mantener actualizado el campo updated_at
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
--  2. CONFIGURACIÓN DEL NEGOCIO (una sola fila: singleton)
--     Equivale al objeto "settings" + secciones especiales de la app.
-- ============================================================================
create table if not exists public.settings (
  id                  int primary key default 1,

  -- Identidad
  name                text    not null default 'El Gordo & La Flaca',
  tagline             text    not null default 'Antojitos Mexicanos',
  welcome             text    not null default '¡Bienvenidos y Buen Provecho!',
  logo                text,                       -- URL pública o data URL del logo

  -- Contacto y envíos
  whatsapp_number     text    not null default '525635397099',  -- solo dígitos + lada
  whatsapp_display    text    not null default '56 3539 7099',
  delivery_note       text    not null default 'Envíos solo Propina. Únicamente Whatsapp:',
  contact_message     text    not null default 'Hola, quiero hacer un pedido 🌮',

  -- Información del local
  hours               text    not null default 'Viernes a martes · 11:30 am a 5:00 pm · Miércoles y jueves cerrado',
  address             text    not null default '',
  facebook            text    not null default '',

  -- Estado de la tienda
  is_open             boolean not null default true,
  closed_note         text    not null default 'Volvemos en un ratito. Mientras tanto, escríbenos por WhatsApp y con gusto te apartamos tu antojo. 🌮',

  -- Mensaje de WhatsApp (plantilla con marcadores)
  message_template    text    not null default '',

  -- Formas de pago  (array JSON: [{id,label,enabled,details}])
  payments            jsonb   not null default '[
    {"id":"efectivo","label":"Efectivo","enabled":true,"details":""},
    {"id":"transferencia","label":"Transferencia","enabled":true,"details":""},
    {"id":"mercadopago","label":"Mercado Pago","enabled":true,"details":""}
  ]'::jsonb,

  -- Colores del tema  (objeto JSON: {background,text,primary,secondary})
  theme               jsonb   not null default '{
    "background":"#e7e6e2","text":"#161616","primary":"#c9a52e","secondary":"#c8691e"
  }'::jsonb,

  -- Sección "Productos de temporada"
  seasonal_enabled    boolean not null default false,
  seasonal_title      text    not null default 'De temporada',
  seasonal_note       text    not null default 'Pregunta si hay',

  -- Sección "Bebidas del día"
  bebidas_enabled     boolean not null default false,
  bebidas_title       text    not null default 'Bebidas del día',
  bebidas_note        text    not null default 'Disponibilidad del día · pregunta si hay del sabor que quieres',

  updated_at          timestamptz not null default now(),

  -- Garantiza que solo exista UNA fila de configuración
  constraint settings_single_row check (id = 1)
);

drop trigger if exists trg_settings_updated on public.settings;
create trigger trg_settings_updated
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ============================================================================
--  3. CATEGORÍAS DEL MENÚ (Tacos, Burritos, Sincronizadas, …)
-- ============================================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  title       text    not null,
  description text,
  image       text,                                   -- URL, data URL o "builtin:clave"
  image_alt   text,
  image_side  text    not null default 'right' check (image_side in ('left','right')),
  blend       boolean not null default true,          -- fundir la foto con el papel
  layout      text    not null default 'list' check (layout in ('list','grid')),
  sort_order  int     not null default 0,             -- orden en el menú
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated
  before update on public.categories
  for each row execute function public.set_updated_at();

create index if not exists categories_sort_idx on public.categories (sort_order);

-- ============================================================================
--  4. PRODUCTOS DEL MENÚ
--     section = 'category'  → pertenece a una categoría (category_id obligatorio)
--     section = 'seasonal'  → sección de temporada (category_id nulo)
--     section = 'bebidas'   → bebidas del día      (category_id nulo)
-- ============================================================================
create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  section      text    not null default 'category'
               check (section in ('category','seasonal','bebidas')),
  category_id  uuid references public.categories(id) on delete cascade,

  name         text    not null,
  price        numeric(10,2) not null default 0 check (price >= 0),
  description  text,
  badge        text,                                  -- "Recomendado", "Nuevo"…
  cart_name    text,                                  -- nombre alterno en el pedido
  image        text,
  unavailable  boolean not null default false,        -- apagado / no disponible
  sort_order   int     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Coherencia: los productos de categoría necesitan categoría; los de
  -- secciones especiales no la tienen.
  constraint menu_items_section_category_chk check (
    (section = 'category' and category_id is not null) or
    (section in ('seasonal','bebidas') and category_id is null)
  )
);

drop trigger if exists trg_menu_items_updated on public.menu_items;
create trigger trg_menu_items_updated
  before update on public.menu_items
  for each row execute function public.set_updated_at();

create index if not exists menu_items_category_idx on public.menu_items (category_id);
create index if not exists menu_items_section_idx  on public.menu_items (section);
create index if not exists menu_items_sort_idx     on public.menu_items (sort_order);

-- ============================================================================
--  5. EXTRAS POR PRODUCTO   (ej. "Con Queso + $7", "Doble carne + $25")
-- ============================================================================
create table if not exists public.item_extras (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.menu_items(id) on delete cascade,
  name        text not null,
  price       numeric(10,2) not null default 0 check (price >= 0),
  sort_order  int  not null default 0
);

create index if not exists item_extras_item_idx on public.item_extras (item_id);

-- ============================================================================
--  6. TAMAÑOS / PRESENTACIONES POR PRODUCTO
--     (ej. aguas: Medio litro $20 / Litro $35)
--     unavailable = true → ese tamaño está apagado hoy
-- ============================================================================
create table if not exists public.item_sizes (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.menu_items(id) on delete cascade,
  name        text not null,
  price       numeric(10,2) not null default 0 check (price >= 0),
  unavailable boolean not null default false,
  sort_order  int  not null default 0
);

create index if not exists item_sizes_item_idx on public.item_sizes (item_id);

-- ============================================================================
--  7. CUPONES DE DESCUENTO
-- ============================================================================
create table if not exists public.coupons (
  id          uuid primary key default gen_random_uuid(),
  code        text    not null unique,                -- se guarda en MAYÚSCULAS
  type        text    not null default 'percent' check (type in ('percent','monto')),
  value       numeric(10,2) not null default 0 check (value >= 0),
  enabled     boolean not null default true,
  max_uses    int     not null default 0 check (max_uses >= 0),  -- 0 = sin límite
  used        int     not null default 0 check (used >= 0),
  expires_at  date,                                    -- opcional
  min_order   numeric(10,2) check (min_order is null or min_order >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_coupons_updated on public.coupons;
create trigger trg_coupons_updated
  before update on public.coupons
  for each row execute function public.set_updated_at();

-- Normaliza el código a mayúsculas siempre
create or replace function public.coupons_upper_code()
returns trigger language plpgsql as $$
begin
  new.code = upper(trim(new.code));
  return new;
end;
$$;

drop trigger if exists trg_coupons_upper on public.coupons;
create trigger trg_coupons_upper
  before insert or update on public.coupons
  for each row execute function public.coupons_upper_code();

-- Suma un uso al cupón de forma segura (respeta el máximo)
create or replace function public.redeem_coupon(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean := false;
begin
  update public.coupons
     set used = used + 1
   where code = upper(trim(p_code))
     and enabled = true
     and (max_uses = 0 or used < max_uses)
     and (expires_at is null or expires_at >= current_date)
  returning true into ok;
  return coalesce(ok, false);
end;
$$;

-- ============================================================================
--  8. PEDIDOS (registro histórico opcional pero recomendado)
-- ============================================================================
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  customer_name  text    not null,
  mode           text    not null default 'envio' check (mode in ('envio','recoger')),
  address        text,
  location_lat   double precision,
  location_lng   double precision,
  payment        text    check (payment in ('efectivo','transferencia','mercadopago')),
  cash_amount    numeric(10,2),
  notes          text,
  coupon_code    text,
  discount       numeric(10,2) not null default 0,
  subtotal       numeric(10,2) not null default 0,
  total          numeric(10,2) not null default 0,
  items          jsonb   not null default '[]'::jsonb,   -- snapshot de las líneas
  status         text    not null default 'nuevo'
                 check (status in ('nuevo','confirmado','preparando','entregado','cancelado')),
  created_at     timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx  on public.orders (status);

-- ============================================================================
--  9. SEGURIDAD (Row Level Security)
--     Lectura pública para mostrar el menú a cualquiera.
--     Escritura solo para usuarios autenticados (el administrador).
--     Los pedidos: cualquiera puede crear uno; solo el admin los lee.
-- ============================================================================
alter table public.settings    enable row level security;
alter table public.categories  enable row level security;
alter table public.menu_items  enable row level security;
alter table public.item_extras enable row level security;
alter table public.item_sizes  enable row level security;
alter table public.coupons     enable row level security;
alter table public.orders      enable row level security;

-- ---- Lectura pública (menú visible para todos) ----
drop policy if exists "lectura publica settings"    on public.settings;
create policy "lectura publica settings"    on public.settings    for select using (true);

drop policy if exists "lectura publica categories"  on public.categories;
create policy "lectura publica categories"  on public.categories  for select using (true);

drop policy if exists "lectura publica menu_items"  on public.menu_items;
create policy "lectura publica menu_items"  on public.menu_items  for select using (true);

drop policy if exists "lectura publica item_extras" on public.item_extras;
create policy "lectura publica item_extras" on public.item_extras for select using (true);

drop policy if exists "lectura publica item_sizes"  on public.item_sizes;
create policy "lectura publica item_sizes"  on public.item_sizes  for select using (true);

drop policy if exists "lectura publica coupons"     on public.coupons;
create policy "lectura publica coupons"     on public.coupons     for select using (true);

-- ---- Escritura solo para el administrador (usuario autenticado) ----
drop policy if exists "admin escribe settings"    on public.settings;
create policy "admin escribe settings"    on public.settings
  for all to authenticated using (true) with check (true);

drop policy if exists "admin escribe categories"  on public.categories;
create policy "admin escribe categories"  on public.categories
  for all to authenticated using (true) with check (true);

drop policy if exists "admin escribe menu_items"  on public.menu_items;
create policy "admin escribe menu_items"  on public.menu_items
  for all to authenticated using (true) with check (true);

drop policy if exists "admin escribe item_extras" on public.item_extras;
create policy "admin escribe item_extras" on public.item_extras
  for all to authenticated using (true) with check (true);

drop policy if exists "admin escribe item_sizes"  on public.item_sizes;
create policy "admin escribe item_sizes"  on public.item_sizes
  for all to authenticated using (true) with check (true);

drop policy if exists "admin escribe coupons"     on public.coupons;
create policy "admin escribe coupons"     on public.coupons
  for all to authenticated using (true) with check (true);

-- ---- Pedidos: cualquiera crea, solo admin lee / actualiza ----
drop policy if exists "cualquiera crea pedido" on public.orders;
create policy "cualquiera crea pedido" on public.orders
  for insert to anon, authenticated with check (true);

drop policy if exists "admin lee pedidos" on public.orders;
create policy "admin lee pedidos" on public.orders
  for select to authenticated using (true);

drop policy if exists "admin actualiza pedidos" on public.orders;
create policy "admin actualiza pedidos" on public.orders
  for update to authenticated using (true) with check (true);

-- ============================================================================
--  10. ALMACENAMIENTO DE IMÁGENES (logo, fotos de productos y secciones)
--      Bucket público "menu-images".
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

drop policy if exists "imagenes lectura publica" on storage.objects;
create policy "imagenes lectura publica" on storage.objects
  for select using (bucket_id = 'menu-images');

drop policy if exists "imagenes admin sube" on storage.objects;
create policy "imagenes admin sube" on storage.objects
  for insert to authenticated with check (bucket_id = 'menu-images');

drop policy if exists "imagenes admin actualiza" on storage.objects;
create policy "imagenes admin actualiza" on storage.objects
  for update to authenticated using (bucket_id = 'menu-images');

drop policy if exists "imagenes admin borra" on storage.objects;
create policy "imagenes admin borra" on storage.objects
  for delete to authenticated using (bucket_id = 'menu-images');

-- ============================================================================
--  11. VISTA: cada producto como JSON (misma forma que usa la app)
-- ============================================================================
create or replace view public.menu_items_json as
select
  mi.id,
  mi.section,
  mi.category_id,
  mi.sort_order,
  jsonb_strip_nulls(jsonb_build_object(
    'id',          mi.id,
    'name',        mi.name,
    'price',       mi.price,
    'description', mi.description,
    'badge',       mi.badge,
    'cartName',    mi.cart_name,
    'image',       mi.image,
    'unavailable', case when mi.unavailable then true else null end,
    'extras', (
      select coalesce(jsonb_agg(
               jsonb_build_object('id', e.id, 'name', e.name, 'price', e.price)
               order by e.sort_order), '[]'::jsonb)
      from public.item_extras e where e.item_id = mi.id
    ),
    'sizes', (
      select coalesce(jsonb_agg(
               jsonb_build_object('id', s.id, 'name', s.name, 'price', s.price)
               order by s.sort_order), '[]'::jsonb)
      from public.item_sizes s where s.item_id = mi.id
    ),
    'unavailableSizes', (
      select coalesce(jsonb_agg(s.id order by s.sort_order) filter (where s.unavailable), '[]'::jsonb)
      from public.item_sizes s where s.item_id = mi.id
    )
  )) as data
from public.menu_items mi;

-- ============================================================================
--  12. FUNCIÓN: devuelve TODO el menú en un solo JSON
--      Con la misma estructura de "MenuData" que consume la app.
--      Úsala desde el cliente:  supabase.rpc('get_menu')
-- ============================================================================
create or replace function public.get_menu()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'categories', (
      select coalesce(jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'id',          c.id,
          'title',       c.title,
          'description', c.description,
          'image',       c.image,
          'imageAlt',    c.image_alt,
          'imageSide',   c.image_side,
          'blend',       case when c.blend = false then false else null end,
          'layout',      case when c.layout = 'grid' then 'grid' else null end,
          'items', (
            select coalesce(jsonb_agg(v.data order by v.sort_order), '[]'::jsonb)
            from public.menu_items_json v
            where v.category_id = c.id and v.section = 'category'
          )
        )) order by c.sort_order
      ), '[]'::jsonb)
      from public.categories c
    ),
    'seasonal', jsonb_build_object(
      'enabled', s.seasonal_enabled,
      'title',   s.seasonal_title,
      'note',    s.seasonal_note,
      'items', (
        select coalesce(jsonb_agg(v.data order by v.sort_order), '[]'::jsonb)
        from public.menu_items_json v where v.section = 'seasonal'
      )
    ),
    'bebidas', jsonb_build_object(
      'enabled', s.bebidas_enabled,
      'title',   s.bebidas_title,
      'note',    s.bebidas_note,
      'items', (
        select coalesce(jsonb_agg(v.data order by v.sort_order), '[]'::jsonb)
        from public.menu_items_json v where v.section = 'bebidas'
      )
    ),
    'coupons', (
      select coalesce(jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'id',        cp.id,
          'code',      cp.code,
          'type',      cp.type,
          'value',     cp.value,
          'enabled',   cp.enabled,
          'maxUses',   cp.max_uses,
          'used',      cp.used,
          'expiresAt', cp.expires_at,
          'minOrder',  cp.min_order
        )) order by cp.created_at
      ), '[]'::jsonb)
      from public.coupons cp
    ),
    'settings', jsonb_strip_nulls(jsonb_build_object(
      'name',            s.name,
      'tagline',         s.tagline,
      'welcome',         s.welcome,
      'logo',            s.logo,
      'whatsappNumber',  s.whatsapp_number,
      'whatsappDisplay', s.whatsapp_display,
      'deliveryNote',    s.delivery_note,
      'contactMessage',  s.contact_message,
      'hours',           s.hours,
      'address',         s.address,
      'facebook',        s.facebook,
      'open',            s.is_open,
      'closedNote',      s.closed_note,
      'messageTemplate', s.message_template,
      'templateV2',      true,
      'payments',        s.payments,
      'theme',           s.theme
    ))
  )
  from public.settings s
  where s.id = 1;
$$;

-- Permitir llamar get_menu() sin sesión (menú público)
grant execute on function public.get_menu() to anon, authenticated;
grant execute on function public.redeem_coupon(text) to anon, authenticated;

-- ============================================================================
--  13. DATOS INICIALES (seed)  — el menú completo de El Gordo & La Flaca
-- ============================================================================

-- 13.1 Configuración base
insert into public.settings (id, message_template)
values (1,
$tpl$🌮 *Nuevo pedido · {negocio}*

{pedido}

🎟️ *Cupón:* {cupon}
💰 *Total: {total}*

👤 *Nombre:* {nombre}
🛵 *Entrega:* {entrega}
📍 *Dirección:* {direccion}
🗺️ *Ubicación:* {mapa}
💳 *Pago:* {pago}
📝 *Notas:* {notas}

{propina}
{confirmacion}

¡Gracias por tu pedido! 🙌$tpl$
)
on conflict (id) do nothing;

-- 13.2 Categorías, productos y extras
--      Solo se ejecuta si aún no hay categorías (evita duplicar al re-correr).
do $seed$
declare
  c_id uuid;
  it_id uuid;
begin
  if exists (select 1 from public.categories) then
    return;
  end if;

  -- ---------- TACOS ----------
  insert into public.categories (title, description, image, image_side, layout, sort_order)
  values ('Tacos', 'Con papas a la francesa y salsa de la casa.', 'builtin:taco', 'right', 'list', 1)
  returning id into c_id;

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Arrachera', 40, 1) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Chorizo Argentino', 40, 2) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Pechuga', 40, 3) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Bistec', 35, 4) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Longaniza', 35, 5) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, description, sort_order)
    values ('category', c_id, 'Campechanos', 40, 'Bistec con longaniza', 6) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  -- ---------- BURRITOS ----------
  insert into public.categories (title, description, image, image_side, layout, sort_order)
  values ('Burritos', 'Bien servidos, con papas a la francesa.', 'builtin:burrito', 'left', 'list', 2)
  returning id into c_id;

  insert into public.menu_items (section, category_id, name, price, sort_order) values
    ('category', c_id, 'Arrachera', 85, 1),
    ('category', c_id, 'Chorizo Argentino', 85, 2),
    ('category', c_id, 'Pechuga', 85, 3),
    ('category', c_id, 'Bistec', 75, 4),
    ('category', c_id, 'Longaniza', 75, 5);
  insert into public.menu_items (section, category_id, name, price, description, sort_order)
    values ('category', c_id, 'Campechanos', 80, 'Bistec con longaniza', 6);
  insert into public.menu_items (section, category_id, name, price, badge, sort_order)
    values ('category', c_id, 'Especial', 90, 'Recomendado', 7);

  -- ---------- SINCRONIZADAS ----------
  insert into public.categories (title, description, image, image_side, layout, sort_order)
  values ('Sincronizadas', 'Doraditas, con queso derretido y papas a la francesa.', 'builtin:sincronizada', 'right', 'list', 3)
  returning id into c_id;

  insert into public.menu_items (section, category_id, name, price, sort_order) values
    ('category', c_id, 'Sencilla', 45, 1),
    ('category', c_id, 'Con Bistec', 75, 2),
    ('category', c_id, 'Con Longaniza', 75, 3);
  insert into public.menu_items (section, category_id, name, price, description, sort_order)
    values ('category', c_id, 'Campechana', 80, 'Bistec con longaniza', 4);
  insert into public.menu_items (section, category_id, name, price, sort_order) values
    ('category', c_id, 'Con arrachera', 85, 5),
    ('category', c_id, 'Con chorizo Argentino', 85, 6),
    ('category', c_id, 'Con Pechuga', 85, 7);

  -- ---------- GORDITAS ----------
  insert into public.categories (title, description, image, image_side, layout, sort_order)
  values ('Gorditas', 'De maíz, rellenas y bien doraditas.', 'builtin:gordas', 'left', 'list', 4)
  returning id into c_id;

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Sencilla', 30, 1) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Con Bistec', 65, 2) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Con Longaniza', 65, 3) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, description, sort_order)
    values ('category', c_id, 'Campechana', 70, 'Bistec con longaniza', 4) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Con Arrachera', 80, 5) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Con Pechuga', 80, 6) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  -- ---------- SOPES ----------
  insert into public.categories (title, description, image, image_side, layout, sort_order)
  values ('Sopes', 'Con frijol, lechuga, queso y salsa.', 'builtin:sopes', 'right', 'list', 5)
  returning id into c_id;

  insert into public.menu_items (section, category_id, name, price, sort_order) values
    ('category', c_id, 'Sencillo', 30, 1),
    ('category', c_id, 'Con Queso Oaxaca', 60, 2),
    ('category', c_id, 'Guisado (Quesadillas)', 65, 3),
    ('category', c_id, 'Bistec o Longaniza', 65, 4),
    ('category', c_id, 'Bistec o Longaniza con queso', 70, 5),
    ('category', c_id, 'Campechano', 75, 6),
    ('category', c_id, 'Campechano con queso', 80, 7);

  -- ---------- QUESADILLAS ----------
  insert into public.categories (title, description, image, image_side, layout, sort_order)
  values ('Quesadillas', 'De harina, doraditas en el comal.', 'builtin:quesadillas', 'left', 'list', 6)
  returning id into c_id;

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Pollo', 30, 1) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Carne', 30, 2) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Chicharron', 30, 3) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Picadillo', 30, 4) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Champiñones', 30, 5) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  insert into public.menu_items (section, category_id, name, price, sort_order)
    values ('category', c_id, 'Queso', 30, 6) returning id into it_id;
  insert into public.item_extras (item_id, name, price) values (it_id, 'Con Queso +', 7);

  -- ---------- BEBIDAS DEL DÍA (aguas con dos tamaños) ----------
  insert into public.menu_items (section, name, price, description, badge, sort_order)
    values ('bebidas', 'Agua de horchata', 20, 'Recién hecha', 'Clásica', 1) returning id into it_id;
  insert into public.item_sizes (item_id, name, price, sort_order) values
    (it_id, 'Medio litro', 20, 1), (it_id, 'Litro', 35, 2);

  insert into public.menu_items (section, name, price, description, sort_order)
    values ('bebidas', 'Agua de jamaica', 20, 'Recién hecha', 2) returning id into it_id;
  insert into public.item_sizes (item_id, name, price, sort_order) values
    (it_id, 'Medio litro', 20, 1), (it_id, 'Litro', 35, 2);

  insert into public.menu_items (section, name, price, description, sort_order)
    values ('bebidas', 'Agua de tamarindo', 20, 'Recién hecha', 3) returning id into it_id;
  insert into public.item_sizes (item_id, name, price, sort_order) values
    (it_id, 'Medio litro', 20, 1), (it_id, 'Litro', 35, 2);

  insert into public.menu_items (section, name, price, description, sort_order)
    values ('bebidas', 'Limonada', 25, 'Con azúcar al gusto', 4) returning id into it_id;
  insert into public.item_sizes (item_id, name, price, sort_order) values
    (it_id, 'Medio litro', 25, 1), (it_id, 'Litro', 40, 2);

  insert into public.menu_items (section, name, price, sort_order)
    values ('bebidas', 'Coca-Cola 600 ml', 28, 5);
  insert into public.menu_items (section, name, price, sort_order)
    values ('bebidas', 'Agua natural', 15, 6);
end
$seed$;

-- ============================================================================
--  ¡Listo! Tu base de datos quedó creada con el menú cargado.
--  Prueba en el SQL Editor:   select public.get_menu();
-- ============================================================================
