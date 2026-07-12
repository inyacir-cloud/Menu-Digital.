delete from public.products;
delete from public.complements;
delete from public.categories;
delete from public.business_config where id = 'main';

insert into public.business_config (
  id,
  name,
  is_open,
  phone,
  schedule,
  address,
  description,
  logo,
  social_media,
  service_type,
  delivery_radius,
  hours
) values (
  'main',
  'El Gordo & La Flaca',
  true,
  '525635397099',
  'Mar - Dom: 1:00 PM - 11:00 PM',
  'Av. Principal #123, Centro, Ciudad de México',
  'Antojitos mexicanos con sabor casero, porciones generosas y pedidos directos por WhatsApp.',
  '/Logo.png',
  '{"instagram":"elgordoylaflaca","facebook":"elgordoylaflaca","website":""}'::jsonb,
  'both',
  '5 km',
  '{"monday":"Cerrado","tuesday":"1:00 PM - 11:00 PM","wednesday":"1:00 PM - 11:00 PM","thursday":"1:00 PM - 11:00 PM","friday":"1:00 PM - 12:00 AM","saturday":"12:00 PM - 12:00 AM","sunday":"12:00 PM - 10:00 PM"}'::jsonb
);

insert into public.categories (id, name, icon) values
  ('1', 'Hamburguesas', null),
  ('2', 'Pizzas', null),
  ('3', 'Bebidas', null),
  ('4', 'Postres', null);

insert into public.complements (id, name, price) values
  ('c1', 'Queso Cheddar Extra', 15),
  ('c2', 'Tocino Crujiente', 20),
  ('c3', 'Carne Extra (Patty)', 40),
  ('c4', 'Sin Cebolla', 0),
  ('c5', 'Sin Tomate', 0),
  ('c6', 'Orilla de Queso', 35),
  ('c7', 'Champiñones Extra', 15),
  ('c8', 'Salsa Picante Habanero', 10),
  ('c9', 'Helado Extra', 20);

insert into public.products (
  id,
  name,
  description,
  price,
  image,
  category_id,
  complement_ids,
  is_daily_water,
  is_available,
  sizes
) values
  ('p1', 'Hamburguesa Clásica', 'Carne de res 150g, lechuga, tomate, queso y nuestra salsa especial.', 85, '/Logo.png', '1', '{c1,c2,c3,c4,c5,c8}', false, true, null),
  ('p2', 'Doble Bacon Cheeseburger', 'Doble carne de res, doble queso cheddar, tocino crujiente y cebolla caramelizada.', 130, '/Logo.png', '1', '{c1,c2,c3,c4,c8}', false, true, null),
  ('p3', 'Pizza Margarita Artesanal', 'Salsa de tomate casera, mozzarella fresca, albahaca y aceite de oliva.', 160, '/Logo.png', '2', '{c6,c7,c8}', false, true, null),
  ('p4', 'Pizza Pepperoni Especial', 'Abundante pepperoni importado, doble queso mozzarella y salsa tradicional.', 185, '/Logo.png', '2', '{c6,c7,c8}', false, true, null),
  ('p5', 'Coca Cola Original', 'Lata bien fría de 355ml.', 30, '/Logo.png', '3', '{}', false, true, null),
  ('p6', 'Limonada Casera con Menta', 'Refrescante limonada natural preparada al momento con hojas de menta.', 35, '/Logo.png', '3', '{}', true, true, '[{"name":"Litro","price":35},{"name":"Medio Litro","price":25}]'::jsonb),
  ('p6_2', 'Horchata Artesanal', 'Tradicional horchata de arroz con canela y toque de vainilla.', 35, '/Logo.png', '3', '{}', true, true, '[{"name":"Litro","price":35},{"name":"Medio Litro","price":25}]'::jsonb),
  ('p6_3', 'Agua de Jamaica con Frutos Rojos', 'Infusión natural de flor de jamaica con zarzamora.', 35, '/Logo.png', '3', '{}', true, false, '[{"name":"Litro","price":35},{"name":"Medio Litro","price":25}]'::jsonb),
  ('p7', 'Brownie Caliente con Helado', 'Brownie de chocolate fudge con una bola de helado artesanal de vainilla.', 65, '/Logo.png', '4', '{c9}', false, true, null),
  ('p8', 'Cheesecake de Frutos Rojos', 'Tarta de queso estilo Nueva York con jalea casera de frutos del bosque.', 70, '/Logo.png', '4', '{c9}', false, true, null);