-- DUARA MARKETPLACE DATABASE SCHEMA
-- Idempotent schema definition for Supabase
-- Run in your Supabase SQL Editor

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  phone text,
  role text NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  institution text,                 -- College/university or organization (optional)
  region text DEFAULT 'Dar es Salaam',
  avatar_url text,
  bio text,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure columns exist in case table already exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institution text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region text DEFAULT 'Dar es Salaam';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text DEFAULT '📦',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial categories if none exist
INSERT INTO public.categories (name, slug, icon, sort_order)
VALUES
  ('Simu na Vishikwambi', 'simu', '📱', 1),
  ('Kompyuta na Laptops', 'kompyuta', '💻', 2),
  ('Vifaa vya Kielektroniki', 'elektroniki', '🔌', 3),
  ('Mavazi na Viatu', 'mavazi', '👕', 4),
  ('Vitabu na Vifaa vya Masomo', 'vitabu', '📚', 5),
  ('Huduma na Mafunzo', 'huduma', '🛠️', 6),
  ('Samani na Vifaa vya Ndani', 'samani', '🛋️', 7),
  ('Nyumba na Vyumba vya Kupanga', 'makazi', '🏠', 8),
  ('Vipodozi na Urembo', 'urembo', '💄', 9),
  ('Magari na Pikipiki', 'usafiri', '🏍️', 10),
  ('Nyinginezo', 'nyinginezo', '🏷️', 99)
ON CONFLICT (slug) DO NOTHING;

-- 4. LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'bidhaa', -- 'bidhaa' (product) or 'huduma' (service)
  images text[] NOT NULL DEFAULT '{}',
  region text NOT NULL DEFAULT 'Dar es Salaam',
  institution text,
  status text NOT NULL DEFAULT 'active', -- 'active', 'sold', 'hidden'
  is_featured boolean NOT NULL DEFAULT false,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. DIRECT MESSAGES TABLE (Buyer-Seller Chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_listings_seller ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_region ON public.listings(region);
CREATE INDEX IF NOT EXISTS idx_listings_type ON public.listings(type);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON public.messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- 8. STORAGE BUCKET FOR LISTING IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- CATEGORIES POLICIES
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public" ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- LISTINGS POLICIES
DROP POLICY IF EXISTS "listings_select_active" ON public.listings;
CREATE POLICY "listings_select_active" ON public.listings
  FOR SELECT USING (
    status = 'active'
    OR auth.uid() = seller_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "listings_insert_auth" ON public.listings;
CREATE POLICY "listings_insert_auth" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = seller_id
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_blocked = true)
  );

DROP POLICY IF EXISTS "listings_update_owner_or_admin" ON public.listings;
CREATE POLICY "listings_update_owner_or_admin" ON public.listings
  FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id OR public.is_admin())
  WITH CHECK (auth.uid() = seller_id OR public.is_admin());

DROP POLICY IF EXISTS "listings_delete_owner_or_admin" ON public.listings;
CREATE POLICY "listings_delete_owner_or_admin" ON public.listings
  FOR DELETE TO authenticated
  USING (auth.uid() = seller_id OR public.is_admin());

-- REPORTS POLICIES
DROP POLICY IF EXISTS "reports_insert_auth" ON public.reports;
CREATE POLICY "reports_insert_auth" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_admin_all" ON public.reports;
CREATE POLICY "reports_admin_all" ON public.reports
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- MESSAGES POLICIES
DROP POLICY IF EXISTS "messages_select_parties" ON public.messages;
CREATE POLICY "messages_select_parties" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR public.is_admin());

DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
CREATE POLICY "messages_insert_sender" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_update_parties" ON public.messages;
CREATE POLICY "messages_update_parties" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- STORAGE POLICIES
DROP POLICY IF EXISTS "listing_images_public_read" ON storage.objects;
CREATE POLICY "listing_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "listing_images_auth_insert" ON storage.objects;
CREATE POLICY "listing_images_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "listing_images_auth_update" ON storage.objects;
CREATE POLICY "listing_images_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-images');

-- 10. REALTIME PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
