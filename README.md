# Portal Docente Tucumán — Backend

API para el portal de docentes de Tucumán (ATEP): leyes, decretos y resoluciones con filtros, y PDFs en storage.

**Stack:** Node + Express 5 + MySQL (mysql2), zod, helmet, PDFs en Cloudinary (o carpeta local en desarrollo).

## Correr en local

Requisitos: Node 20.12+ y MySQL 8+.

```bash
npm install
cp .env.example .env   # completar DB_*, JWT_SECRET y ADMIN{1,2,3}_*
npm run migrate        # crea la base y las tablas
npm run seed           # admins + categorías + niveles + 8 leyes de ejemplo con PDF placeholder
npm run dev            # http://localhost:4000/api
```

`npm run db` levanta una instancia de MySQL propia del proyecto (puerto 3307, datos en `.mysql/`, sin contraseña). La ruta al `mysqld.exe` está pensada para MySQL 9.7 en Windows; ajustala si tenés otra versión. Para usarla: `DB_HOST=127.0.0.1` y `DB_PORT=3307` en `.env`.

### Almacenamiento de PDFs
- `STORAGE_DRIVER=local`: guarda en `uploads/` (solo desarrollo; Render borra el disco en cada deploy).
- `STORAGE_DRIVER=cloudinary`: producción. Completar `CLOUDINARY_*` y en Cloudinary activar *Settings → Security → "Allow delivery of PDF and ZIP files"*.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | ping |
| GET | `/api/leyes` | solo vigentes. Query: `jurisdiccion, tipo, categoria, nivel, anio, q, orden` |
| GET | `/api/leyes/:slug` | detalle (404 si no existe o está derogada) |
| GET | `/api/categorias` | |
| GET | `/api/niveles` | |

Próximamente (Fase 2): login de admins con JWT y panel para alta, edición, baja y eliminación de leyes.

## Seguridad
- CORS limitado a `FRONTEND_URL` (admite varias URLs separadas por coma).
- Consultas SQL parametrizadas y validación con zod.
- Credenciales solo en variables de entorno (ver `.env.example`).
