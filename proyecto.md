# Proyecto: Portal Docente Tucumán — Leyes + Formularios + Panel Admin

## Contexto
Necesito una web para docentes de Tucumán con:
1. **Leyes docentes**: listado de leyes, decretos y resoluciones que afectan a los docentes (Estatuto Docente de Tucumán y normativa nacional), con buscador, filtros y descarga en PDF.
2. **Formularios**: el docente elige un formulario (ej: pedido de licencia), lo completa en un formulario web y descarga directamente un PDF ya armado con sus datos. La idea es que NO tenga que abrir Word para modificar los datos a mano.
3. **Panel de administrador**: 3 admins con login pueden agregar leyes nuevas (con su PDF), editarlas y dar de baja las que quedaron obsoletas.

**Antes de escribir código, armá la spec completa (estructura de carpetas, modelos de datos, endpoints de la API, componentes, roadmap por fases) y mostrámela para aprobarla.**

---

## Stack
Dos repos separados:
- **Frontend** (`portal-docente-frontend`): React + Vite, Tailwind CSS, React Router, `fuse.js` para búsqueda difusa (tolera errores de tipeo y tildes). Deploy en Netlify.
- **Backend** (`portal-docente-backend`): Node + Express + MySQL. Deploy en Render.
- **Almacenamiento de PDFs**: NO guardarlos en el disco de Render (en el plan free el disco se borra en cada redeploy). Proponé entre Cloudinary o Supabase Storage y justificá cuál conviene.
- **Generación de PDF de formularios**: en el navegador. Proponé entre `pdfmake`, `@react-pdf/renderer` o `pdf-lib` y justificá cuál conviene para formularios con formato tipo nota oficial.
- **Auth**: JWT + contraseñas hasheadas con bcrypt.
- **Dominio**: sin dominio propio. Se usa el subdominio de Netlify (`*.netlify.app`) para el front y el de Render para el back.

---

## Diseño
- Basado en la estética de https://congreso.atep.ar/ pero usando SOLO **dorado y blanco** (nada de fondo negro).
- Paleta aproximada (confirmar o reemplazar con el hex exacto que te paso):
  - Dorado principal: `#C9A227`
  - Dorado oscuro (hover/bordes): `#A8841A`
  - Dorado claro (fondos suaves, badges): `#F5ECCF`
  - Blanco: `#FFFFFF`
  - Texto: gris muy oscuro `#2B2B2B` (no negro puro)
- Definí los colores como variables en `tailwind.config` (`primary`, `primary-dark`, `primary-light`).
- Moderno, limpio, mucho espacio en blanco, cards con bordes dorados sutiles.
- 100% responsive (la mayoría de los docentes van a entrar desde el celular).
- Tipografía legible, botones grandes, pensado para usuarios no técnicos (incluidos los admins).

### Logo
- El logo de ATEP **ya está cargado en la carpeta del front**. Buscalo y usalo en:
  - Header de todas las páginas públicas
  - Login y header del panel admin
  - Favicon (generalo a partir del logo)
- Los PDFs generados de los formularios **NO** llevan logo.

---

## Páginas públicas
1. **Inicio (/)**: hero con título, buscador rápido de leyes y dos cards grandes: "Leyes docentes" y "Formularios".
2. **Leyes (/leyes)**:
   - Buscador por nombre, número o palabra clave
   - Filtros: jurisdicción (Tucumán / Nacional), tipo (Ley / Decreto / Resolución / Estatuto), categoría (licencias, salario, jubilación, concursos, estatuto, etc.), nivel (inicial, primario, secundario, superior, todos), año
   - Orden: más recientes / número / alfabético
   - Cada ley en una card con: número, título, resumen corto, badge de jurisdicción ("Tucumán" / "Nacional"), tipo, año, categoría y botones "Ver" (abre el PDF) y "Descargar PDF"
   - Contador de resultados y mensaje cuando no hay resultados
   - Solo se muestran las leyes con estado `vigente`
3. **Detalle de ley (/leyes/:slug)**: datos completos, resumen, visor de PDF embebido y botón de descarga.
4. **Formularios (/formularios)**: listado de formularios en cards, con buscador.
5. **Completar formulario (/formularios/:slug)**:
   - Formulario web generado dinámicamente según la definición del formulario
   - Validaciones (campos obligatorios, DNI numérico, CUIL con formato, fechas válidas)
   - Vista previa del PDF antes de descargar
   - Botón "Descargar PDF" → genera el PDF con formato de nota oficial y los datos cargados
   - Nombre del archivo: `{formulario}_{apellido}_{fecha}.pdf`
6. **Mis datos (/mis-datos)**: ver sección "Datos del docente guardados".

---

## Panel de administrador (/admin)
- **Login** (/admin/login): email + contraseña. Sin registro público.
- **3 admins**, todos con los mismos permisos (no hace falta sistema de roles). Se crean con un script de seed que lee nombre, email y contraseña desde variables de entorno (nada de contraseñas en el código).
- **Rutas protegidas**: si no hay sesión válida, redirige al login.
- **Listado de leyes**: tabla con buscador y filtros por estado (vigente / derogada / todas) y jurisdicción, con acciones Editar y Dar de baja / Reactivar. Mostrar quién la creó y quién la modificó por última vez.
- **Agregar ley**: formulario con todos los campos del modelo (`jurisdiccion` obligatorio) + subida del PDF (solo .pdf, límite de 10 MB). El slug se genera automático a partir del título.
- **Editar ley**: modificar datos y reemplazar el PDF si hace falta.
- **Dar de baja una ley obsoleta**: NO borrarla de la base. Se marca como `derogada` (soft delete) y deja de aparecer en la web pública. Se puede reactivar. Campo opcional "derogada por" para indicar qué ley la reemplazó.
- **Eliminar definitivamente**: solo para leyes cargadas por error, con modal de confirmación ("Esta acción no se puede deshacer"). Borra también el PDF del storage.
- **Cambiar contraseña**: pantalla simple para que cada admin cambie la suya.
- Confirmaciones y mensajes de éxito/error en todas las acciones.

---

## Base de datos (MySQL)
- **admins**: id, nombre, email (único), password_hash, creado_en
- **leyes**: id, slug (único), jurisdiccion (`provincial` / `nacional`), tipo, numero, titulo, resumen, anio, pdf_url, pdf_public_id (para poder borrarlo del storage), estado (`vigente` / `derogada`), derogada_por (nullable), creado_en, actualizado_en, creado_por (FK admins), actualizado_por (FK admins)
- **categorias**: id, nombre
- **leyes_categorias**: ley_id, categoria_id
- **niveles**: id, nombre
- **leyes_niveles**: ley_id, nivel_id
- **palabras clave**: guardarlas como texto en la tabla leyes o en tabla aparte (proponé la mejor opción)

---

## API (Express)
**Públicos:**
- `GET /api/leyes` → solo vigentes, con filtros por query params (jurisdiccion, tipo, categoria, nivel, anio, q)
- `GET /api/leyes/:slug`
- `GET /api/categorias`
- `GET /api/niveles`

**Admin (requieren JWT):**
- `POST /api/auth/login`
- `PUT /api/auth/password` → cambiar contraseña propia
- `GET /api/admin/leyes` → todas, incluidas derogadas
- `POST /api/admin/leyes` → crear (multipart con PDF)
- `PUT /api/admin/leyes/:id` → editar (PDF opcional)
- `PATCH /api/admin/leyes/:id/estado` → dar de baja / reactivar
- `DELETE /api/admin/leyes/:id` → eliminar definitivo (borra también el PDF)

**Seguridad:**
- CORS limitado a la URL del front, leída de la variable de entorno `FRONTEND_URL`
- Rate limit en el login
- Validación de datos en el back
- Todas las credenciales en variables de entorno (incluir `.env.example` en ambos repos)

---

## Formularios
- Por ahora definidos en JSON dentro del front (`src/data/formularios/`), uno por formulario:
  - `slug`, `titulo`, `descripcion`
  - `campos`: lista con `nombre`, `label`, `tipo` (text, number, date, select, textarea, checkbox), `obligatorio`, `opciones` (si es select), `placeholder`
  - `plantilla`: texto de la nota con placeholders tipo `{{apellido}}`, `{{dni}}`, `{{escuela}}`, que se reemplazan con los datos cargados
- Agregar un formulario nuevo = agregar un JSON, sin tocar componentes.
- Los formularios reales en Word los paso más adelante para copiar el formato exacto. Por ahora usar los de ejemplo.

---

## Datos del docente guardados
- Sección "Mis datos" (nombre, apellido, DNI, CUIL, legajo, escuela, cargo, nivel, teléfono, mail) guardada en `localStorage`.
- Al abrir cualquier formulario, esos campos se autocompletan solos.
- Aclarar en la página que los datos quedan solo en su dispositivo y no se envían a ningún servidor.
- Botón para borrar los datos guardados.

---

## Datos de ejemplo (seed)
- 3 admins (desde variables de entorno)
- 8 leyes de ejemplo con PDFs placeholder: 5 provinciales (Tucumán) y 3 nacionales, 2 de ellas derogadas para probar el filtro
- 3 formularios de ejemplo: pedido de licencia, nota de justificación de inasistencia, declaración jurada de cargos
- Después reemplazo todo por los datos reales.

---

## Roadmap
- **Fase 1**: backend (modelos, API pública, seed) + front con diseño, logo, sección de leyes, buscador, filtros y descarga de PDF
- **Fase 2**: auth + panel admin (alta, edición, baja/reactivación, eliminación, subida de PDFs al storage, cambio de contraseña, registro de quién creó/modificó)
- **Fase 3**: motor de formularios dinámicos + generación de PDF + vista previa + "Mis datos"
- **Fase 4**: pulido (SEO, accesibilidad, loading states, 404, favicon) + deploy (Netlify + Render)
- **Fase 5 (futuro, no hacer ahora)**: que los admins puedan crear y editar formularios desde el panel

---

## Pendientes (los consigo yo)
- PDFs reales de las leyes (Estatuto Docente de Tucumán y normativa nacional)
- Formularios reales en Word que usan hoy los docentes
- Hex exacto del dorado de la página de ATEP (si difiere del aproximado)