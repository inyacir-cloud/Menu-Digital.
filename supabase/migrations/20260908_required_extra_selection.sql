-- Selección obligatoria de una opción por cada unidad del producto.
-- Ejecutar después de schema.sql en el SQL Editor de Supabase.

alter table public.menu_items
  add column if not exists required_extra_selection boolean not null default false;

create or replace view public.menu_items_json as
select
  mi.id,
  mi.section,
  mi.category_id,
  mi.sort_order,
  jsonb_strip_nulls(jsonb_build_object(
    'id', mi.id,
    'name', mi.name,
    'price', mi.price,
    'description', mi.description,
    'badge', mi.badge,
    'cartName', mi.cart_name,
    'image', mi.image,
    'unavailable', case when mi.unavailable then true else null end,
    'requiredExtraSelection', case when mi.required_extra_selection then true else null end,
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

create or replace function public.get_menu()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'categories', (
      select coalesce(jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'id', c.id,
          'title', c.title,
          'description', c.description,
          'image', c.image,
          'imageAlt', c.image_alt,
          'imageSide', c.image_side,
          'blend', case when c.blend = false then false else null end,
          'layout', case when c.layout = 'grid' then 'grid' else null end,
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
      'title', s.seasonal_title,
      'note', s.seasonal_note,
      'items', (
        select coalesce(jsonb_agg(v.data order by v.sort_order), '[]'::jsonb)
        from public.menu_items_json v where v.section = 'seasonal'
      )
    ),
    'bebidas', jsonb_build_object(
      'enabled', s.bebidas_enabled,
      'title', s.bebidas_title,
      'note', s.bebidas_note,
      'items', (
        select coalesce(jsonb_agg(v.data order by v.sort_order), '[]'::jsonb)
        from public.menu_items_json v where v.section = 'bebidas'
      )
    ),
    'coupons', (
      select coalesce(jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'id', cp.id,
          'code', cp.code,
          'type', cp.type,
          'value', cp.value,
          'enabled', cp.enabled,
          'maxUses', cp.max_uses,
          'used', cp.used,
          'expiresAt', cp.expires_at,
          'minOrder', cp.min_order
        )) order by cp.created_at
      ), '[]'::jsonb)
      from public.coupons cp
    ),
    'settings', jsonb_strip_nulls(jsonb_build_object(
      'name', s.name,
      'tagline', s.tagline,
      'welcome', s.welcome,
      'logo', s.logo,
      'whatsappNumber', s.whatsapp_number,
      'whatsappDisplay', s.whatsapp_display,
      'deliveryNote', s.delivery_note,
      'contactMessage', s.contact_message,
      'hours', s.hours,
      'address', s.address,
      'facebook', s.facebook,
      'open', s.is_open,
      'closedNote', s.closed_note,
      'messageTemplate', s.message_template,
      'templateV2', true,
      'payments', s.payments,
      'theme', s.theme
    ))
  )
  from public.settings s
  where s.id = 1;
$$;

grant execute on function public.get_menu() to anon, authenticated;