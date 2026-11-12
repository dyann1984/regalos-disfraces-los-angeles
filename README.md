# 🎁 Regalos, Disfraces y Más — Los Ángeles

Tienda virtual oficial de comercio electrónico para **Regalos, Disfraces y Más — Los Ángeles** (México).
Diseñada con estética boutique en tonos rosa pastel, fucsia y detalles dorados, tipografía **Poppins**, animaciones fluidas con **Framer Motion**, integración directa de pedidos por **WhatsApp (`+52 56 3547 8874`)**, panel administrativo protegido con **Supabase Auth + PostgreSQL + Storage (RLS)** y asistente multimodal en servidor **"Agregar producto con IA"**.

---

## ✨ Características Principales

### 1. Catálogo Comercial y Tienda Pública (`/`)
- **Identidad Comercial Fiel**: Eslogan *"Regalos increíbles para cada ocasión 🎁"* y descripción *"Encuentra peluches, juguetes, disfraces, regalos, artículos para fiestas y muchas sorpresas más"*. **Sin promesas de personalización de regalos**.
- **6 Categorías Prioritarias**:
  1. Peluches (`peluches`)
  2. Juguetes (`juguetes`)
  3. Regalos (`regalos`)
  4. Disfraces (`disfraces`)
  5. Artículos para fiestas (`fiestas-celebraciones`)
  6. Accesorios (`accesorios-otros`)
- **Galería "Conoce nuestra tienda" (`#nuestra-tienda`)**: Galería interactiva con vista ampliada (lightbox) de las 6 fotografías reales del establecimiento, administrable desde `/admin`.
- **Tarjetas con Efecto 3D y Microinteracciones**: Elevación e inclinación 3D ligera en dispositivos con puntero fino, cambio automático entre múltiples fotografías del producto, buscador instantáneo, ordenamiento, lista de favoritos y carrito interactivo con envío directo a **WhatsApp (`525635478874`)**.

### 2. Panel Administrativo Real (`/admin`)
- **Autenticación Real con Supabase Auth**: Inicio de sesión seguro con correo y contraseña (`supabase.auth.signInWithPassword`), sin contraseñas fijas ni simulaciones. Verificación de permisos en `public.admin_users` mediante la función SQL `public.is_admin()`.
- **Diseño Móvil Primero (100% en Español)**:
  - Captura directa desde la **cámara del celular** (`capture="environment"`) o selección múltiple desde la **galería**.
  - Hasta **5 fotografías por producto** comprimidas y alojadas en **Supabase Storage** (bucket `store-media`).
  - Publicar, ocultar, destacar, editar precios y existencias o eliminar productos en tiempo real.
  - Administración de **Categorías**, **Banners promocionales**, **Galería "Conoce nuestra tienda"** y **Estados de pedidos**.

### 3. Función "Agregar producto con IA" (`/api/admin/ai-product`)
- **Ejecución Exclusiva en Servidor**: Protege la clave `GEMINI_API_KEY` (Google Gemini Multimodal `gemini-2.5-flash`) u `OPENAI_API_KEY` (`gpt-4o-mini`) sin exponerla jamás al navegador.
- **Control de Seguridad y Costos**:
  - Requiere token Bearer válido de administradora autenticada en Supabase Auth.
  - Validación de tipos MIME (`image/jpeg`, `image/png`, `image/webp`), compresión en cliente antes del envío y límite de tasa en servidor (`12` análisis por cada `10` minutos).
- **Reglas Estrictas Anti-Alucinación**:
  - No inventa marcas, materiales no visibles, tallas exactas, precios ni disponibilidad.
  - Si detecta **varios productos en una misma fotografía**, solicita a la administradora elegir cuál desea registrar.
  - Requiere **revisión y confirmación humana obligatoria**, además de capturar el precio real en MXN y las existencias antes de presionar **"Publicar"**.

---

## 🗄️ Configuración de Base de Datos y Storage en Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard).
2. Abre el **SQL Editor** y ejecuta el contenido completo de [`supabase/schema.sql`](./supabase/schema.sql) (también disponible como migración reproducible en [`supabase/migrations/20261112000000_init_los_angeles_store.sql`](./supabase/migrations/20261112000000_init_los_angeles_store.sql)).
   - Esto crea las tablas `admin_users`, `categories`, `products`, `store_gallery`, `store_banners` y `orders`, activa **Row Level Security (RLS)**, crea el bucket público `store-media` con políticas de escritura exclusivas para administradora y carga las 6 categorías iniciales.
3. Copia las credenciales del proyecto (`Project URL` y `anon public key`) en `.env.local` y en las variables de entorno de **Vercel**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_publica
GEMINI_API_KEY=tu_clave_gemini_servidor
NEXT_PUBLIC_WHATSAPP_NUMBER=525635478874
```

4. Ingresa a `/admin` y utiliza la pestaña **"Activar Cuenta Propietaria"** para registrar el correo y contraseña de la administradora (la función `public.bootstrap_first_admin()` asigna automáticamente como propietaria a la primera cuenta registrada y bloquea cualquier registro posterior no autorizado).

---

## 🛠️ Desarrollo y Compilación Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en http://localhost:3000
npm run dev

# Verificar tipos TypeScript
npx tsc --noEmit

# Compilar versión optimizada de producción
npm run build
```
