# LUXE E-Commerce Store
### Built with HTML/CSS/JS · Supabase · Razorpay

---

## 🚀 Quick Setup (5 steps)

### 1. Supabase
1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **anon public key** (Settings → API)
3. Open the SQL Editor → paste contents of `supabase_setup.sql` → Run
4. Enable **Email Auth**: Authentication → Providers → Email

### 2. Razorpay
1. Go to [razorpay.com](https://razorpay.com) → Sign Up (free)
2. Dashboard → Settings → API Keys → Generate Test Key
3. Copy your **Key ID** (starts with `rzp_test_`)

### 3. Configure app.js
Open `app.js` and replace the top 3 constants:
```js
const SUPABASE_URL  = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY';
const RAZORPAY_KEY  = 'rzp_test_YOUR_KEY';
```

### 4. Run
Open `index.html` in your browser (or use Live Server in VS Code).

---

## 📁 File Structure
```
ecommerce/
├── index.html          # Main HTML (all pages)
├── styles.css          # Dark luxury theme
├── app.js              # All logic (Supabase + Razorpay)
├── supabase_setup.sql  # DB schema + sample data
└── README.md           # This file
```

---

## ✨ Features
| Feature | Details |
|---------|---------|
| 🏠 Home | Hero, stats, featured products, categories, promo banner |
| 🛍️ Shop | Product grid, search, category & sort filters |
| 🔐 Auth | Sign up / Sign in / Sign out via Supabase Auth |
| 🛒 Cart | Sidebar cart, quantity controls, persist to localStorage |
| 💳 Payment | Razorpay Checkout in INR, success/failure handling |
| 📦 Orders | Order history from Supabase (authenticated users only) |
| 📱 Responsive | Mobile-first, hamburger nav, touch-friendly |

---

## 🗄️ Supabase Schema

### `products`
| Column | Type | Notes |
|--------|------|-------|
| id | bigserial | Primary key |
| name | text | Product name |
| price | numeric | In INR |
| original_price | numeric | For showing discounts |
| category | text | Electronics, Fashion, etc. |
| emoji | text | Display emoji |
| stock | integer | Inventory count |
| featured | boolean | Show on home page |

### `orders`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| items | jsonb | Cart items snapshot |
| total_amount | numeric | In INR |
| status | text | paid / pending / failed |
| razorpay_payment_id | text | From Razorpay |

---

## 🔒 Production Checklist
- [ ] Verify Razorpay payment signature server-side (Edge Function)
- [ ] Create Razorpay orders via backend before opening checkout
- [ ] Enable Supabase RLS policies (already in SQL setup)
- [ ] Use `rzp_live_` key for production
- [ ] Add your logo to Razorpay checkout options
- [ ] Set up webhook for payment confirmation

---

## 🎨 Customization
- Colors: Edit CSS variables in `:root` inside `styles.css`
- Font: Change `--font-display` and `--font-body` variables
- Products: Add rows to Supabase `products` table
- Categories: Update the category list in `index.html` and `app.js`
