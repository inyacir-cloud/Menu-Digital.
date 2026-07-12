Despliegue recomendado (Vercel + Supabase)
==========================================

La app ya puede funcionar solo con frontend estatico y Supabase. Para produccion, la opcion recomendada es:

- Frontend: Vercel
- Base de datos y storage: Supabase
- Backend `server/`: opcional, solo como legado/local fallback

Archivos ya preparados en este repo
-----------------------------------
- `vercel.json`: agrega rewrite para que rutas como `/menu` sigan funcionando en produccion.
- `.env.example`: plantilla de variables necesarias.

Variables necesarias en Vercel
------------------------------
Configura estas variables de entorno en el panel del proyecto:

- `VITE_SUPABASE_URL`
   - Usa la URL base del proyecto, por ejemplo:
   - `https://xatjxreceizlzelqvurb.supabase.co`
- `VITE_SUPABASE_ANON_KEY`
   - Usa la anon key publica de Supabase.
- `VITE_SUPABASE_BUCKET`
   - Valor recomendado: `product-images`

Importante:
- No uses la URL terminada en `/rest/v1` en Vercel. El codigo actual ya la tolera, pero la forma correcta es la URL base del proyecto.
- No subas `.env.local` al repositorio.

Pasos para desplegar en Vercel
------------------------------
1. Entra a Vercel y crea un proyecto nuevo desde tu repositorio de GitHub.
2. Selecciona este repositorio.
3. Deja la configuracion por defecto de Vite:
    - Build Command: `npm run build`
    - Output Directory: `dist`
4. Agrega las variables de entorno indicadas arriba.
5. Haz clic en Deploy.

Configuracion de Supabase antes del deploy
------------------------------------------
1. Ejecuta `supabase/schema.sql` en el SQL Editor de Supabase.
2. Ejecuta `supabase/seed.sql` si quieres cargar el menu inicial.
3. Verifica que exista el bucket `product-images`.
4. Verifica que las politicas RLS y de Storage hayan quedado creadas.

Como validar despues del deploy
-------------------------------
1. Abre la URL publica de Vercel.
2. Entra a `/menu` y confirma que carga productos.
3. Entra al panel admin y crea un producto de prueba con imagen.
4. Recarga la pagina y confirma que el producto siga existiendo.

Notas importantes
-----------------
- Si Vercel abre bien `/` pero falla `/menu`, revisa que `vercel.json` este publicado.
- Si las imagenes no suben, normalmente falta la `anon key`, el bucket o las policies de Storage.
- El panel admin sigue publico. Para produccion real, conviene protegerlo con autenticacion.

Backend legacy opcional
-----------------------
Si en algun momento quieres volver a desplegar `server/`, todavia puedes hacerlo en Render o Railway, pero ya no es la opcion principal para esta app.
