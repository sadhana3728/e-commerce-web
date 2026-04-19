
CREATE TABLE IF NOT EXISTS products (
  id              BIGSERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2) NOT NULL,
  original_price  NUMERIC(10,2),
  category        TEXT,
  emoji           TEXT DEFAULT '📦',
  rating          NUMERIC(2,1),
  reviews         INTEGER DEFAULT 0,
  stock           INTEGER DEFAULT 100,
  featured        BOOLEAN DEFAULT FALSE,
  tag             TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID REFERENCES auth.users(id),
  user_email           TEXT,
  items                JSONB NOT NULL DEFAULT '[]',
  total_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  status               TEXT NOT NULL DEFAULT 'pending',
  razorpay_payment_id  TEXT,
  razorpay_order_id    TEXT,
  razorpay_signature   TEXT,
  error_msg            TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Products: public read
CREATE POLICY "Products are public" ON products
  FOR SELECT TO anon, authenticated USING (true);

-- Orders: users see only their own
CREATE POLICY "Users see own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. SAMPLE PRODUCTS DATA
INSERT INTO products (name, description, price, original_price, category, emoji, rating, reviews, stock, featured, tag) VALUES
  ('Wireless ANC Headphones',    'Industry-leading noise cancellation with 30-hour battery life.', 12999, 18999, 'Electronics', '🎧', 4.8, 1024, 15, true,  'Best Seller'),
  ('Minimalist Chronograph Watch','Swiss-inspired movement in a titanium case. Water-resistant up to 100m.', 24999, 32000, 'Fashion',     '⌚', 4.9,  567,  8, true,  'New'),
  ('Leather Portfolio Case',      'Full-grain Italian leather with suede interior.', 3499, 4999, 'Fashion',     '💼', 4.7,  890, 22, true,  NULL),
  ('Pour-Over Coffee Set',        'Borosilicate glass dripper with precision filter.', 2199, NULL, 'Home',        '☕', 4.6,  432, 30, false, 'Sale'),
  ('Botanical Skincare Kit',      'Cold-pressed plant extracts. Cruelty-free certified.', 1899, 2499, 'Beauty',      '🌿', 4.5,  718, 45, false, NULL),
  ('Ultralight Trail Runners',    'Carbon fibre plate technology. 196g ultralight.', 8999, 11999, 'Sports',      '👟', 4.8,  342, 12, true,  'New'),
  ('Mechanical Keyboard TKL',     'Hot-swappable switches. Gasket-mounted. RGB per-key.', 9499, 12999, 'Electronics', '⌨️', 4.7,  654,  7, false, NULL),
  ('Design Thinking Handbook',    'From IDEO designers. Real-world case studies.',  649,   999, 'Books',       '📖', 4.9, 2341, 100, false, NULL);

