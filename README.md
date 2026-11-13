# 🎁 Regalos, Disfraces y Más — Los Ángeles

Tienda virtual oficial de comercio electrónico para **Regalos, Disfraces y Más — Los Ángeles** (**Tienda de Regalos, Disfraces Los Angeles**, México).
Diseñada con estética boutique en tonos rosa pastel, fucsia y detalles dorados, tipografía **Poppins**, animaciones fluidas con **Framer Motion**, integración directa de pedidos por **WhatsApp (`+52 56 3547 8874`)**, ubicación oficial verificada en **Google Maps (`https://maps.app.goo.gl/emr5dX3coahaxH6D7`)**, panel administrativo protegido con **Firebase Authentication + Cloud Firestore + Cloud Storage** (con reglas de seguridad exclusivas para administradora y respaldo compatible con Supabase) y asistente multimodal en servidor **"Agregar producto con IA"** con **Google Gemini (`gemini-2.5-flash`)**.

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

### 2. Panel Administrativo Real (`/admin`) con Firebase de Google
- **Autenticación Exclusiva para la Propietaria (`Firebase Authentication`)**:
  - Soporta inicio de sesión con **Correo y Contraseña** y con **Cuenta de Google** de la propietaria.
  - **Protección contra apropiación de cuenta**: No existe registro público en `/admin` y las reglas [`firestore.rules`](./firestore.rules) bloquean cualquier escritura desde la web en la colección `admin_users` (`allow write: if false`). Únicamente la cuenta dada de alta en `admin_users` desde Firebase Console (y opcionalmente en `NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS`) puede acceder.
- **Base de Datos en Tiempo Real (`Cloud Firestore`)**:
  - Colecciones: `categories`, `products`, `store_gallery`, `store_banners`, `orders` y `admin_users`.
- **Fotografías desde Celular (`Cloud Storage` + Alternativa Gratuita `Plan Spark`)**:
  - Captura directa desde la **cámara del celular** (`capture="environment"`) o selección desde la galería (hasta **5 fotografías por producto**).
  - Soporta **Firebase Cloud Storage** (`store-media/{folder}/...` protegido por [`storage.rules`](./storage.rules)), **Cloudinary gratuito** (25 GB sin tarjeta) o **modo WebP compacto en Firestore** (`~45–65 KB` por imagen) para operar **100% gratis en el Plan Spark sin tarjeta bancaria**.

### 3. Función "Agregar producto con IA" (`/api/admin/ai-product`)
- **Ejecución Exclusiva en Servidor con Google Gemini (`gemini-2.5-flash`)**:
  - Verifica primero el **ID Token de Firebase Auth** y el rol de administradora en `admin_users`.
  - Protege la clave `GEMINI_API_KEY` en el servidor sin exponerla al navegador.
- **Reglas Estrictas Anti-Alucinación**:
  - No inventa marcas, materiales no visibles, tallas exactas, precios ni disponibilidad.
  - Si detecta **varios productos en una misma fotografía**, solicita a la administradora elegir cuál desea registrar.
  - Requiere **revisión y confirmación humana obligatoria**, además de capturar el precio real en MXN y las existencias antes de presionar **"Publicar"**.
