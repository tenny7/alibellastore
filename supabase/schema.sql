-- MoMo Commerce Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUMS
-- ==========================================

CREATE TYPE user_role AS ENUM ('shopper', 'admin');
CREATE TYPE product_status AS ENUM ('active', 'draft', 'out_of_stock');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'successful', 'failed', 'timed_out');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed', 'coupon', 'flash_sale');

-- ==========================================
-- TABLES
-- ==========================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'shopper',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  images TEXT[] DEFAULT '{}',
  status product_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id),
  subtotal DECIMAL(12, 2) NOT NULL,
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  momo_transaction_id TEXT,
  momo_reference_id TEXT,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  shipping_address TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  notes TEXT,
  discount_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL
);

CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type discount_type NOT NULL,
  value DECIMAL(12, 2) NOT NULL,
  code TEXT UNIQUE,
  max_usage INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  min_cart_value DECIMAL(12, 2),
  max_discount_cap DECIMAL(12, 2),
  applicable_to TEXT,
  target_ids UUID[] DEFAULT '{}',
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);

-- ==========================================
-- AUTO-UPDATE updated_at TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER discounts_updated_at BEFORE UPDATE ON discounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- SYNC SUPABASE AUTH → USERS TABLE
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, phone, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    -- Only store real emails, not phone.local placeholders
    CASE WHEN NEW.email LIKE '%@phone.local' THEN NULL ELSE NEW.email END,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    'shopper',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Public read access for products and categories
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read discounts" ON discounts FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admin full access products" ON products FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin full access categories" ON categories FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin full access orders" ON orders FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin full access order_items" ON order_items FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin full access discounts" ON discounts FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin read users" ON users FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Users can read their own data
CREATE POLICY "Users read own profile" ON users FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON users FOR UPDATE
  USING (auth.uid() = id);

-- Cart: users manage their own
CREATE POLICY "Users manage own cart" ON cart_items FOR ALL
  USING (auth.uid() = user_id);

-- Orders: users read their own
CREATE POLICY "Users read own orders" ON orders FOR SELECT
  USING (auth.uid() = customer_id);
CREATE POLICY "Users create orders" ON orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users read own order items" ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()
    )
  );

-- ==========================================
-- NOTIFICATIONS
-- ==========================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'order',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Admin full access notifications" ON notifications FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- ==========================================
-- SEED DATA
-- ==========================================

INSERT INTO categories (name, slug) VALUES
  ('Electronics', 'electronics'),
  ('Clothing', 'clothing'),
  ('Home & Living', 'home-living'),
  ('Food & Drinks', 'food-drinks');

INSERT INTO categories (name, slug, parent_id) VALUES
  ('Phones', 'phones', (SELECT id FROM categories WHERE slug = 'electronics')),
  ('Accessories', 'accessories', (SELECT id FROM categories WHERE slug = 'electronics')),
  ('Men', 'men', (SELECT id FROM categories WHERE slug = 'clothing')),
  ('Women', 'women', (SELECT id FROM categories WHERE slug = 'clothing'));
