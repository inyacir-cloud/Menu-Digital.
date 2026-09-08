# Base de datos en Supabase — Menú Digital

Todo lo necesario para tener tu menú en la nube (base de datos + imágenes),
para que los cambios que hagas en el panel se vean en **todos** los dispositivos.

---

## 1. Crea el proyecto

1. Entra a **https://supabase.com** y crea una cuenta (gratis).
2. Botón **New project** → ponle nombre (ej. `menu-gordo-flaca`) y una contraseña.
3. Elige la región más cercana (ej. *East US* o *Mexico*) y crea el proyecto.
4. Espera ~1 minuto a que termine de aprovisionar.

## 2. Crea las tablas y datos

1. En el menú lateral, abre **SQL Editor** → **New query**.
2. Copia **todo** el contenido de [`schema.sql`](./schema.sql) y pégalo.
3. Presiona **Run** (o `Ctrl/Cmd + Enter`).
4. Debe decir *Success*. Se crean tablas, seguridad, almacenamiento y el menú.

Prueba que quedó bien ejecutando:

```sql
select public.get_menu();
```

Deberías ver todo el menú en formato JSON.

### Si ya tenías una base anterior

Ejecuta [`migrations/20260907_seasonal_bebidas.sql`](./migrations/20260907_seasonal_bebidas.sql)
en el SQL Editor y después vuelve a ejecutar `schema.sql`. Esto agrega las
columnas de configuración y las tablas `item_sizes` / `item_extras` sin borrar
tu menú; la segunda ejecución actualiza también `get_menu()` para devolver
temporada y bebidas.

## 3. Consigue tus llaves

En **Project Settings → API** copia:

- **Project URL** — algo como `https://xxxxxxxx.supabase.co`
- **anon public key** — llave pública (segura para el navegador)

La app usa Supabase Auth para el acceso del administrador. Crea el usuario en
**Authentication → Users → Add user** y usa ese mismo correo en
`VITE_ADMIN_EMAIL` para que aparezca precargado en el login.

> ⚠️ La **service_role key** NUNCA se pone en la app del cliente. Es solo para
> servidores. La app usa únicamente la **anon key**.

## 4. Crea el usuario administrador

El menú se lee público, pero **editar** requiere iniciar sesión.

1. Menú lateral → **Authentication → Users → Add user**.
2. Crea uno con tu correo y contraseña (ej. `admin@gordoflaca.com`).
3. Con ese usuario, la app podrá guardar cambios (las políticas de seguridad
   permiten escribir solo a usuarios autenticados).

---

## Qué se creó

| Tabla / objeto        | Para qué sirve                                                        |
| --------------------- | -------------------------------------------------------------------- |
| `settings`            | Datos del negocio, tema, logo, horario, pagos, estado abierto/cerrado |
| `categories`          | Categorías del menú (Tacos, Burritos, …)                             |
| `menu_items`          | Productos (de categoría, de temporada o de bebidas del día)          |
| `item_extras`         | Extras por producto (ej. “Con Queso + $7”)                          |
| `item_sizes`          | Tamaños con precio (ej. Medio litro / Litro) y su encendido/apagado |
| `coupons`             | Cupones de descuento con máximo de usos y vigencia                   |
| `orders`              | Historial de pedidos (opcional)                                     |
| bucket `menu-images`  | Almacenamiento público para logo y fotos                            |
| función `get_menu()`  | Devuelve TODO el menú en un JSON igual al que usa la app            |
| función `redeem_coupon()` | Suma un uso al cupón respetando el máximo                        |

### Seguridad (RLS)
- **Cualquiera** puede *leer* el menú y *crear* pedidos.
- **Solo usuarios autenticados** (tú) pueden *editar* el menú y *ver* pedidos.

---

## 5. Conectar la app (opcional, cuando quieras migrar de localStorage)

> Hoy la app guarda todo en el navegador (localStorage). Estos pasos son para
> cuando decidas leer/escribir desde Supabase. No es obligatorio para que la
> app funcione.

Instala el cliente:

```bash
npm install @supabase/supabase-js
```

Crea `src/lib/supabase.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey);
```

Crea un archivo `.env` en la raíz del proyecto (no lo subas a git):

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### Leer el menú completo (público)

```ts
const { data, error } = await supabase.rpc("get_menu");
// data tiene la forma de MenuData: { categories, seasonal, bebidas, coupons, settings }
```

### Iniciar sesión de administrador

```ts
await supabase.auth.signInWithPassword({
  email: "admin@gordoflaca.com",
  password: "tu-contraseña",
});
```

### Registrar un pedido al enviarlo por WhatsApp

```ts
await supabase.from("orders").insert({
  customer_name: customer.name,
  mode: customer.mode,
  address: customer.address,
  location_lat: customer.location?.lat ?? null,
  location_lng: customer.location?.lng ?? null,
  payment: customer.payment || null,
  cash_amount: customer.cashAmount ? Number(customer.cashAmount) : null,
  notes: customer.notes,
  coupon_code: appliedCoupon?.code ?? null,
  discount,
  subtotal: cart.total,
  total: grandTotal,
  items: cart.lines, // snapshot del pedido
});
```

### Canjear un cupón (suma 1 uso de forma segura)

```ts
const { data: ok } = await supabase.rpc("redeem_coupon", { p_code: "BIENVENIDA10" });
// ok === true si aplicó; false si estaba agotado, vencido o deshabilitado
```

### Subir una imagen (logo o foto de producto)

```ts
const file = /* File del <input type="file"> */;
const path = `productos/${crypto.randomUUID()}.jpg`;
await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
// data.publicUrl → guárdalo en menu_items.image o settings.logo
```

---

## 6. Notas útiles

- **Fotos incluidas en la app**: los valores como `builtin:taco` siguen usando
  las imágenes que ya trae la app. Cuando subas una foto propia, guarda la URL
  pública que te da Supabase.
- **Re-ejecutar `schema.sql`**: es seguro. No borra datos ni duplica el menú
  (el seed solo corre si no hay categorías).
- **Reiniciar el menú de ejemplo**: si quieres volver a sembrar, primero vacía
  las tablas:

  ```sql
  truncate public.item_extras, public.item_sizes, public.menu_items,
           public.categories restart identity cascade;
  ```

  y vuelve a ejecutar la sección de seed de `schema.sql`.
- **Respaldo**: Supabase → *Database → Backups*. También puedes exportar el
  menú como JSON desde el panel de administración de la app.
