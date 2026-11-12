# 🎁 Regalos, Disfraces y Más — Los Ángeles

Tienda virtual oficial de comercio electrónico para **Regalos, Disfraces y Más — Los Ángeles** (**Tienda de Regalos, Disfraces Los Angeles**, México).
Diseñada con estética boutique en tonos rosa pastel, fucsia y detalles dorados, tipografía **Poppins**, animaciones fluidas con **Framer Motion**, integración directa de pedidos por **WhatsApp (`+52 56 3547 8874`)**, ubicación oficial verificada en **Google Maps (`https://maps.app.goo.gl/emr5dX3coahaxH6D7`)**, panel administrativo protegido con **Supabase Auth + PostgreSQL + Storage (RLS)** y asistente multimodal en servidor **"Agregar producto con IA"**.

---

## ✨ Características Principales

### 1. Catálogo Comercial (`/catalogo`) y Tienda Pública (`/`)
- **Identidad Comercial Fiel**: Eslogan *"Regalos increíbles para cada ocasión 🎁"* y descripción *"Encuentra peluches, juguetes, disfraces, regalos, artículos para fiestas y muchas sorpresas más"*. **Sin promesas de personalización de regalos**.
- **Página Real de Catálogo (`/catalogo`)**: Cuadrícula responsive con todos los artículos publicados, filtros interactivos por las 6 categorías, búsqueda instantánea (`?q=...`), enlaces directos por categoría (`?categoria=...`), ordenamiento y ventana de detalle.
- **6 Categorías Prioritarias**:
  1. Peluches (`peluches`)
  2. Juguetes (`juguetes`)
  3. Regalos (`regalos`)
  4. Disfraces (`disfraces`)
  5. Artículos para fiestas (`fiestas-celebraciones`)
  6. Accesorios (`accesorios-otros`)
- **Productos de Referencia vs. Productos con Precio Confirmado**:
  - Los artículos de demostración o sin precio confirmado muestran **"Producto de referencia — Consulta disponibilidad"** y el botón **"Consultar por WhatsApp"** (no permiten agregarse al carrito).
  - Cuando la propietaria publica productos reales con precio y existencia confirmados desde `/admin`, se habilita automáticamente la compra en el carrito.
- **Ubicación Real Verificada**: Sección **"Visítanos"** (`#visitanos`), contacto y pie de página con botón **"Cómo llegar"** y enlace directo a **Google Maps (`https://maps.app.goo.gl/emr5dX3coahaxH6D7` — Tienda de Regalos, Disfraces Los Angeles)**, sin domicilios ni horarios inventados.

### 2. Panel Administrativo Real (`/admin`)
- **Autenticación Real y Blindada con Supabase Auth**:
  - Inicio de sesión seguro con correo y contraseña (`supabase.auth.signInWithPassword`), sin contraseñas fijas ni simulaciones.
  - **Protección contra apropiación de cuenta**: El auto-registro público desde `/admin` está deshabilitado y la tabla `public.admin_users` bloquea inserciones desde clientes web (`anon`/`authenticated`). Únicamente la propietaria desde el SQL Editor de su cuenta de Supabase puede autorizar su correo mediante `SELECT public.authorize_admin_by_email('su-correo@dominio.com');`.
- **Diseño Móvil Primero (100% en Español)**:
  - Captura directa desde la **cámara del celular** (`capture="environment"`) o selección múltiple desde la **galería**.
  - Hasta **5 fotografías por producto** comprimidas y alojadas en **Supabase Storage** (bucket `store-media`).

### 3. Función "Agregar producto con IA" (`/api/admin/ai-product`)
- **Ejecución Exclusiva en Servidor**: Protege la clave `GEMINI_API_KEY` (Google Gemini Multimodal `gemini-2.5-flash`) u `OPENAI_API_KEY` (`gpt-4o-mini`) sin exponerla jamás al navegador.
- **Reglas Estrictas Anti-Alucinación**:
  - No inventa marcas, materiales no visibles, tallas exactas, precios ni disponibilidad.
  - Si detecta **varios productos en una misma fotografía**, solicita a la administradora elegir cuál desea registrar.
  - Requiere **revisión y confirmación humana obligatoria**, además de capturar el precio real en MXN y las existencias antes de presionar **"Publicar"**.

---

## 🗄️ Guía Breve y Segura de Configuración de Supabase (Sin Exponer Claves)

1. **Crear o conectar el proyecto Supabase**:
   - Entra a [supabase.com/dashboard](https://supabase.com/dashboard) y crea un proyecto nuevo (o selecciona uno existente).
2. **Ejecutar Migraciones (Base de Datos, RLS y Storage)**:
   - En el menú izquierdo de Supabase abre **SQL Editor → New query**, pega el contenido íntegro de [`supabase/schema.sql`](./supabase/schema.sql) y presiona **Run**.
   - Esto crea las tablas (`admin_users`, `categories`, `products`, `store_gallery`, `store_banners`, `orders`), activa **Row Level Security (RLS)** y crea el bucket público `store-media` con permisos de escritura exclusivos para administradora.
3. **Registrar y Autorizar a la Propietaria (Blindado contra terceros)**:
   - Ve a **Authentication → Users → Add user → Create new user**.
   - Escribe el correo y contraseña de la propietaria, marca **Auto Confirm User** y haz clic en **Create user**.
   - Regresa al **SQL Editor** y ejecuta esta única línea con ese mismo correo:
     ```sql
     SELECT public.authorize_admin_by_email('correo-de-la-propietaria@ejemplo.com');
     ```
4. **Configurar Variables de Entorno (en `.env.local` y en Vercel)**:
   - En Supabase ve a **Project Settings → API** y copia `Project URL` y `anon public` key.
   - En tu proyecto de **Vercel** (*Settings → Environment Variables*) y en tu archivo local `.env.local` define:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_publica
     GEMINI_API_KEY=tu_clave_gemini_servidor
     NEXT_PUBLIC_WHATSAPP_NUMBER=525635478874
     ```
   - Realiza un *Redeploy* en Vercel para que tome las variables.
