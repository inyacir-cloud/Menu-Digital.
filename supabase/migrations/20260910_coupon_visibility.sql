-- Permite distinguir cupones anunciados de cupones compartidos de forma privada.
alter table public.coupons
  add column if not exists visibility text not null default 'public';

alter table public.coupons
  drop constraint if exists coupons_visibility_check;

alter table public.coupons
  add constraint coupons_visibility_check check (visibility in ('public', 'private'));

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
    'combos', (
      select coalesce(jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'id', cb.id,
          'name', cb.name,
          'price', cb.price,
          'description', cb.description,
          'badge', cb.badge,
          'image', cb.image,
          'enabled', cb.enabled,
          'groups', cb.groups
        )) order by cb.sort_order
      ), '[]'::jsonb)
      from public.combos cb
    ),
    'coupons', (
      select coalesce(jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'id', cp.id,
          'code', cp.code,
          'type', cp.type,
          'value', cp.value,
          'enabled', cp.enabled,
          'visibility', cp.visibility,
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
