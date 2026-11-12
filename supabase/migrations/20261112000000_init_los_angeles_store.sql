-- Reproducible Migration: 20261112000000_init_los_angeles_store.sql
-- See supabase/schema.sql for full documentation.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Admin consulta lista de administradores" ON public.admin_users;
CREATE POLICY "Admin consulta lista de administradores"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP FUNCTION IF EXISTS public.bootstrap_first_admin();

CREATE OR REPLACE FUNCTION public.authorize_admin_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email))
  LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Primero crea el usuario % en Supabase Dashboard -> Authentication -> Users', p_email;
  END IF;

  INSERT INTO public.admin_users (user_id, email, role)
  VALUES (v_uid, lower(trim(p_email)), 'owner')
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    role = 'owner';

  RETURN v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.authorize_admin_by_email(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authorize_admin_by_email(TEXT) TO postgres, service_role;

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

CREATE TABLE IF NOT EXISTS public.store_gallery (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

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

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-media',
  'store-media',
  true,
  5242880,
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
