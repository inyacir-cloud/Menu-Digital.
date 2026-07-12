Despliegue rápido (Frontend + Backend)
=====================================

Este repo contiene una app React (Vite) en la raíz y un backend Node/Express en `server/`.

Opciones recomendadas:
- Frontend: Vercel o Netlify (sitio estático con `dist`)
- Backend: Render, Railway o cualquier servicio que ejecute Node (usa `server/index.js`)

Preparar repo
------------
1. Asegúrate de tener todo comiteado y en GitHub.

Backend (Render/Railway)
-----------------------
1. Crear un servicio Web en Render o Railway.
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `node index.js`
5. Desplegar y obtener la URL (p.ej. `https://mi-backend.onrender.com`).
6. Inicializar datos de ejemplo (seed):

```bash
curl -X POST https://<TU_BACKEND_URL>/api/reset
```

Frontend (Vercel / Netlify)
--------------------------
1. Crear proyecto y conectar el repo.
2. Definir variable de entorno `VITE_API_BASE_URL` con la URL del backend desplegado (sin barra final).
   - Ej: `VITE_API_BASE_URL=https://mi-backend.onrender.com`
3. Build command: `npm run build`
4. Publish directory: `dist`

Si decides desplegar frontend y backend en el mismo dominio (Render tiene Static + Web Service), no necesitas `VITE_API_BASE_URL` y las rutas relativas funcionarán.

Notas importantes
-----------------
- El backend actual persiste en `server/db.json` (almacenamiento por archivo). No es recomendado para producción en entornos serverless. Para producción, considera migrar a Postgres o MongoDB.
- Asegura las variables sensibles y añade un mecanismo de autenticación si expones el panel admin públicamente.
