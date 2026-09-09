-- Elimina extras y tamaños repetidos por producto.
-- Conserva la fila con menor sort_order y, en empate, el ID menor.

with duplicate_extras as (
  select id,
    row_number() over (
      partition by item_id, lower(trim(name)), price
      order by sort_order, id
    ) as row_number
  from public.item_extras
)
delete from public.item_extras
where id in (
  select id from duplicate_extras where row_number > 1
);

with duplicate_sizes as (
  select id,
    row_number() over (
      partition by item_id, lower(trim(name)), price
      order by sort_order, id
    ) as row_number
  from public.item_sizes
)
delete from public.item_sizes
where id in (
  select id from duplicate_sizes where row_number > 1
);
