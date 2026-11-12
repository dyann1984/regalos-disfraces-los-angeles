-- ============================================================================
-- MIGRACIÓN COMPLETA Y REPRODUCIBLE — SUPABASE POSTGRESQL + STORAGE + RLS
-- Proyecto: REGALOS, DISFRACES Y MÁS — LOS ÁNGELES
-- ============================================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLA DE ADMINISTRADORES AUTORIZADOS Y FUNCIÓN DE SEGURIDAD RLS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para verificar si el usuario autenticado es administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
  );
$$;

-- Políticas de admin_users: cada usuario autenticado puede consultar si su propio user_id es admin
DROP POLICY IF EXISTS "Admin consulta lista de administradores" ON public.admin_users;
CREATE POLICY "Admin consulta lista de administradores"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- Función segura para registrar a la propietaria como primera administradora si la tabla está vacía
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_uid UUID;
  v_email TEXT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticación requerida';
  END IF;

  IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = v_uid) THEN
    RETURN true;
  END IF;

  SELECT count(*) INTO v_count FROM public.admin_users;
  IF v_count = 0 THEN
    v_email := COALESCE(auth.jwt() ->> 'email', 'propietaria@losangeles.mx');
    INSERT INTO public.admin_users (user_id, email, role)
    VALUES (v_uid, v_email, 'owner')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. TABLA DE CATEGORÍAS ADMINISTRABLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '/images/categories/cat-regalos.jpg',
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. TABLA DE PRODUCTOS (HASTA 5 FOTOGRAFÍAS POR PRODUCTO, SIN PERSONALIZACIÓN)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) CHECK (price IS NULL OR price >= 0),
  promo_price NUMERIC(10,2) CHECK (promo_price IS NULL OR promo_price >= 0),
  category_slug TEXT NOT NULL REFERENCES public.categories(slug) ON UPDATE CASCADE,
  images TEXT[] NOT NULL DEFAULT '{}',
  badge_text TEXT,
  badge_variant TEXT,
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  stock INTEGER CHECK (stock IS NULL OR stock >= 0),
  is_featured BOOLEAN NOT NULL DEFAULT true,
  is_special_offer BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  occasion_tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT max_five_product_images CHECK (cardinality(images) <= 5)
);

-- ----------------------------------------------------------------------------
-- 4. TABLA DE GALERÍA "CONOCE NUESTRA TIENDA"
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_gallery (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. TABLA DE BANNERS PROMOCIONALES DE PORTADA
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_banners (
  id TEXT PRIMARY KEY,
  badge TEXT NOT NULL,
  title_line1 TEXT NOT NULL,
  title_line2 TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  cta_text TEXT NOT NULL DEFAULT 'Explora nuestro catálogo',
  cta_target TEXT NOT NULL DEFAULT '#catalogo-principal',
  image_url TEXT NOT NULL DEFAULT '/images/hero-gifts.jpg',
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. TABLA DE PEDIDOS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('pickup', 'local_delivery')),
  address TEXT,
  occasion TEXT,
  order_notes TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendiente_whatsapp'
    CHECK (status IN ('pendiente_whatsapp', 'confirmado', 'en_preparacion', 'listo_entrega', 'entregado', 'cancelado')),
  payment_method TEXT NOT NULL DEFAULT 'whatsapp_accord',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) — LECTURA PÚBLICA Y ESCRITURA EXCLUSIVA ADMIN
-- ----------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Categorías: Clientes ven activas; Administradora ve y gestiona todas
DROP POLICY IF EXISTS "Lectura publica de categorias activas" ON public.categories;
CREATE POLICY "Lectura publica de categorias activas"
  ON public.categories FOR SELECT
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin gestiona categorias" ON public.categories;
CREATE POLICY "Admin gestiona categorias"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Productos: Clientes ven activos; Administradora ve (incluyendo ocultos) y gestiona todos
DROP POLICY IF EXISTS "Lectura publica de productos activos" ON public.products;
CREATE POLICY "Lectura publica de productos activos"
  ON public.products FOR SELECT
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin gestiona productos" ON public.products;
CREATE POLICY "Admin gestiona productos"
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Galería de tienda: Lectura pública; escritura exclusiva de administradora
DROP POLICY IF EXISTS "Lectura publica de galeria de tienda" ON public.store_gallery;
CREATE POLICY "Lectura publica de galeria de tienda"
  ON public.store_gallery FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin gestiona galeria" ON public.store_gallery;
CREATE POLICY "Admin gestiona galeria"
  ON public.store_gallery FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Banners: Lectura pública de activos; escritura exclusiva de administradora
DROP POLICY IF EXISTS "Lectura publica de banners activos" ON public.store_banners;
CREATE POLICY "Lectura publica de banners activos"
  ON public.store_banners FOR SELECT
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin gestiona banners" ON public.store_banners;
CREATE POLICY "Admin gestiona banners"
  ON public.store_banners FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Pedidos: Clientes pueden registrar pedidos; solo administradora consulta y actualiza estados
DROP POLICY IF EXISTS "Clientes pueden registrar pedidos" ON public.orders;
CREATE POLICY "Clientes pueden registrar pedidos"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Solo admin consulta pedidos" ON public.orders;
CREATE POLICY "Solo admin consulta pedidos"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Solo admin modifica estado de pedidos" ON public.orders;
CREATE POLICY "Solo admin modifica estado de pedidos"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8. SUPABASE STORAGE — BUCKET 'store-media' CON RLS PARA SUBIDA DE IMÁGENES
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-media',
  'store-media',
  true,
  5242880, -- 5 MB por fotografía
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Lectura publica de imagenes de la tienda" ON storage.objects;
CREATE POLICY "Lectura publica de imagenes de la tienda"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-media');

DROP POLICY IF EXISTS "Solo admin sube imagenes de la tienda" ON storage.objects;
CREATE POLICY "Solo admin sube imagenes de la tienda"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'store-media' AND public.is_admin());

DROP POLICY IF EXISTS "Solo admin actualiza imagenes de la tienda" ON storage.objects;
CREATE POLICY "Solo admin actualiza imagenes de la tienda"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'store-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'store-media' AND public.is_admin());

DROP POLICY IF EXISTS "Solo admin elimina imagenes de la tienda" ON storage.objects;
CREATE POLICY "Solo admin elimina imagenes de la tienda"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'store-media' AND public.is_admin());

-- ----------------------------------------------------------------------------
-- 9. SEMILLA INICIAL NO DESTRUCTIVA (CATEGORÍAS, BANNERS Y GALERÍA)
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (id, slug, name, short_name, description, image_url, active, display_order)
VALUES
  ('cat-peluches', 'peluches', 'Peluches', 'Peluches', 'Osos de peluche, personajes tiernos y peluches de distintos tamaños.', '/images/categories/cat-peluches.jpg', true, 1),
  ('cat-juguetes', 'juguetes', 'Juguetes', 'Juguetes', 'Juguetes, figuras, muñecos y diversión para niñas, niños y toda la familia.', '/images/products/prod-box.jpg', true, 2),
  ('cat-regalos', 'regalos', 'Regalos', 'Regalos', 'Cajas de regalo, sets de obsequio, arreglos y sorpresas listas para entregar.', '/images/categories/cat-regalos.jpg', true, 3),
  ('cat-disfraces', 'disfraces', 'Disfraces', 'Disfraces', 'Disfraces infantiles y familiares, máscaras, antifaces y accesorios para eventos.', '/images/categories/cat-disfraces.jpg', true, 4),
  ('cat-fiestas', 'fiestas-celebraciones', 'Artículos para fiestas', 'Artículos para fiestas', 'Globos, artículos de celebración, gorros festivos, velas y decoración.', '/images/categories/cat-fiesta.jpg', true, 5),
  ('cat-accesorios', 'accesorios-otros', 'Accesorios', 'Accesorios', 'Bolsas de regalo, moños, detalles florales, complementos y novedades.', '/images/categories/cat-mas.jpg', true, 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.store_banners (id, badge, title_line1, title_line2, subtitle, cta_text, cta_target, image_url, active, display_order)
VALUES
  ('banner-1', 'Regalos, Disfraces y Más — Los Ángeles', 'Regalos increíbles', 'para cada ocasión 🎁', 'Descubre peluches, juguetes, disfraces y muchas sorpresas para toda la familia.', 'Explora nuestro catálogo', '#catalogo-principal', '/images/hero-gifts.jpg', true, 1),
  ('banner-2', 'Variedad Lista para Obsequiar', 'Peluches, juguetes', 'y regalos en tienda', 'Encuentra peluches, juguetes, disfraces, regalos, artículos para fiestas y muchas sorpresas más.', 'Conoce nuestra tienda', '#nuestra-tienda', '/images/hero-gifts.jpg', true, 2),
  ('banner-3', 'Alegría para Fiestas y Eventos', 'Disfraces y artículos', 'para tus celebraciones', 'Encuentra disfraces infantiles y familiares, globos y artículos para festejar a lo grande.', 'Explora nuestro catálogo', '#catalogo-principal', '/images/hero-gifts.jpg', true, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.store_gallery (id, title, caption, image_url, display_order)
VALUES
  ('galeria-1', 'Variedad de Peluches y Regalos', 'Amplio surtido de peluches y obsequios listos para sorprender en cualquier fecha.', '/images/products/prod-oso.jpg', 1),
  ('galeria-2', 'Juguetes y Sets de Regalo', 'Opciones encantadoras de juguetes, cajas temáticas y sorpresas para niñas y niños.', '/images/products/prod-box.jpg', 2),
  ('galeria-3', 'Disfraces para Toda Ocasión', 'Disfraces infantiles y familiares para festivales escolares, fiestas y temporadas.', '/images/products/prod-disfraz.jpg', 3),
  ('galeria-4', 'Globos y Artículos para Fiestas', 'Globos metálicos, burbujas festivas, gorros y todo para ambientar tu celebración.', '/images/products/prod-globos.jpg', 4),
  ('galeria-5', 'Detalles y Arreglos Especiales', 'Hermosos bouquets, arreglos y presentaciones elegantes listas en tienda.', '/images/products/prod-bouquet.jpg', 5),
  ('galeria-6', 'Bolsas Boutique y Accesorios', 'Bolsas de regalo, moños, cajas decoradas y complementos para tus obsequios.', '/images/categories/cat-regalos.jpg', 6)
ON CONFLICT (id) DO NOTHING;
