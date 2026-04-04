// ===================================================
//  LUXE E-Commerce — app.js
//  Backend: Supabase | Payments: Razorpay
// ===================================================

// ─── CONFIGURATION ─────────────────────────────────
// 🔧 Replace these with your actual keys
const SUPABASE_URL  = 'https://rjnzdwaytojzzvkotblm.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqbnpkd2F5dG9qenp2a290YmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDM0ODEsImV4cCI6MjA5MDcxOTQ4MX0.IdfYYqSSC7ZYaTWVnqWcLnn6kvZrsjoDHXwtWc1_Jb0';
const RAZORPAY_KEY  = 'rzp_test_YOUR_RAZORPAY_KEY'; // Get from Razorpay Dashboard

// ─── SUPABASE INIT ──────────────────────────────────
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── STATE ──────────────────────────────────────────
let allProducts   = [];
let cart          = JSON.parse(localStorage.getItem('luxe_cart') || '[]');
let currentUser   = null;
let searchOpen    = false;
let mobileMenuOpen = false;

// ─── DEMO PRODUCTS (used when Supabase isn't configured) ───
const DEMO_PRODUCTS = [
  { id: 1, name: 'Wireless ANC Headphones', category: 'Electronics', price: 12999, original_price: 18999, description: 'Industry-leading noise cancellation with 30-hour battery life. Premium sound meets futuristic design.', emoji: '🎧', rating: 4.8, reviews: 1024, stock: 15, featured: true, tag: 'Best Seller' },
  { id: 2, name: 'Minimalist Chronograph Watch', category: 'Fashion', price: 24999, original_price: 32000, description: 'Swiss-inspired movement in a titanium case. Water-resistant up to 100m. Timeless elegance on your wrist.', emoji: '⌚', rating: 4.9, reviews: 567, stock: 8, featured: true, tag: 'New' },
  { id: 3, name: 'Leather Portfolio Case', category: 'Fashion', price: 3499, original_price: 4999, description: 'Full-grain Italian leather with suede interior. Fits 13" laptops and tablets. Handcrafted with care.', emoji: '💼', rating: 4.7, reviews: 890, stock: 22, featured: true },
  { id: 4, name: 'Pour-Over Coffee Set', category: 'Home', price: 2199, original_price: null, description: 'Borosilicate glass dripper with precision filter. Elevate your morning ritual with café-quality coffee at home.', emoji: '☕', rating: 4.6, reviews: 432, stock: 30, featured: false, tag: 'Sale' },
  { id: 5, name: 'Botanical Skincare Kit', category: 'Beauty', price: 1899, original_price: 2499, description: 'Cold-pressed plant extracts. Free of parabens and sulfates. Your skin will thank you. Cruelty-free certified.', emoji: '🌿', rating: 4.5, reviews: 718, stock: 45, featured: false },
  { id: 6, name: 'Ultralight Trail Runners', category: 'Sports', price: 8999, original_price: 11999, description: 'Carbon fibre plate technology. 4mm drop for natural running. Breathable mesh upper. Ultralight at 196g.', emoji: '👟', rating: 4.8, reviews: 342, stock: 12, featured: true, tag: 'New' },
  { id: 7, name: 'Mechanical Keyboard TKL', category: 'Electronics', price: 9499, original_price: 12999, description: 'Hot-swappable switches. Gasket-mounted for silent, cushioned keystrokes. RGB per-key lighting.', emoji: '⌨️', rating: 4.7, reviews: 654, stock: 7, featured: false },
  { id: 8, name: 'Design Thinking Handbook', category: 'Books', price: 649, original_price: 999, description: 'From IDEO designers. Real-world case studies and actionable frameworks for creative problem solving.', emoji: '📖', rating: 4.9, reviews: 2341, stock: 100, featured: false },
  { id: 9, name: 'Scented Soy Candle Set', category: 'Home', price: 1299, original_price: null, description: 'Hand-poured in small batches. 50-hour burn time. Notes of sandalwood, amber, and bergamot.', emoji: '🕯️', rating: 4.6, reviews: 523, stock: 60, featured: false },
  { id: 10, name: 'Portable Espresso Maker', category: 'Home', price: 4999, original_price: 6999, description: 'Bar pressure extraction anywhere. 18 bar pressure. Compatible with Nespresso pods. Fits in your daypack.', emoji: '☕', rating: 4.4, reviews: 287, stock: 18, featured: false },
  { id: 11, name: 'Yoga Mat Premium', category: 'Sports', price: 2799, original_price: 3500, description: '6mm natural rubber with alignment lines. Non-slip, sweat-resistant surface. Carrying strap included.', emoji: '🧘', rating: 4.7, reviews: 911, stock: 35, featured: false },
  { id: 12, name: 'Silk Pillowcase Pair', category: 'Home', price: 1599, original_price: 2200, description: 'Grade 6A Mulberry silk. 22 momme weight. Helps reduce hair frizz and skin lines. Machine washable.', emoji: '🛏️', rating: 4.8, reviews: 445, stock: 50, featured: false },
];

// ─── INIT ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Animate loader out
  setTimeout(() => {
    document.getElementById('loader').classList.add('fade-out');
  }, 1600);

  // Auth listener
  sb.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    updateAuthUI();
  });

  // Check existing session
  const { data: { session } } = await sb.auth.getSession();
  currentUser = session?.user || null;
  updateAuthUI();

  // Load products
  await loadProducts();

  // Scroll header effect
  window.addEventListener('scroll', () => {
    document.getElementById('header').classList.toggle('scrolled', window.scrollY > 20);
  });

  // Render cart badge
  renderCartBadge();
});

// ─── PRODUCT LOADING ─────────────────────────────────
async function loadProducts() {
  try {
    const { data, error } = await sb.from('products').select('*').order('id');
    if (error || !data || data.length === 0) {
      // Supabase not configured — use demo data
      allProducts = DEMO_PRODUCTS;
      console.info('Using demo products. Configure Supabase to use live data.');
    } else {
      allProducts = data;
    }
  } catch (e) {
    allProducts = DEMO_PRODUCTS;
    console.info('Using demo products.');
  }
  renderFeaturedProducts();
  renderShopProducts();
}

function renderFeaturedProducts() {
  const featured = allProducts.filter(p => p.featured).slice(0, 4);
  document.getElementById('featuredGrid').innerHTML = featured.map(productCard).join('');
}

function renderShopProducts(filtered = null) {
  const products = filtered !== null ? filtered : allProducts;
  const grid = document.getElementById('shopGrid');
  const empty = document.getElementById('shopEmpty');
  const count = document.getElementById('productCount');

  if (products.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    grid.innerHTML = products.map(productCard).join('');
  }
  count.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;
}

function productCard(p) {
  const discountBadge = p.tag ? `<div class="product-tag">${p.tag}</div>` : '';
  const originalPrice = p.original_price ? `<span class="original">₹${p.original_price.toLocaleString('en-IN')}</span>` : '';
  const stockLabel = p.stock === 0
    ? `<p class="stock-out">Out of stock</p>`
    : p.stock <= 5
    ? `<p class="stock-low">Only ${p.stock} left!</p>`
    : '';
  const addBtn = p.stock === 0
    ? `<button class="add-to-cart-btn" style="opacity:0.4;cursor:not-allowed">Sold Out</button>`
    : `<button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${p.id})">
         <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
         Add
       </button>`;

  return `
    <div class="product-card" onclick="openProductModal(${p.id})">
      <div class="product-img">
        ${discountBadge}
        <span style="font-size:3.5rem">${p.emoji || '📦'}</span>
      </div>
      <div class="product-info">
        <div class="product-cat">${p.category || 'General'}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc-short">${p.description || ''}</div>
        <div class="product-footer">
          <div>
            <span class="product-price">₹${Number(p.price).toLocaleString('en-IN')}${originalPrice}</span>
            ${stockLabel}
          </div>
          <div>
            ${p.rating ? `<div class="product-rating">⭐ ${p.rating} (${p.reviews || 0})</div>` : ''}
          </div>
        </div>
        <div style="margin-top:12px">${addBtn}</div>
      </div>
    </div>
  `;
}

// ─── FILTER & SEARCH ─────────────────────────────────
function filterProducts() {
  const search   = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const category = document.getElementById('categoryFilter')?.value || '';
  const sort     = document.getElementById('sortFilter')?.value || 'default';

  let result = [...allProducts];
  if (search) result = result.filter(p => p.name.toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search));
  if (category) result = result.filter(p => p.category === category);

  if (sort === 'price-asc')  result.sort((a,b) => a.price - b.price);
  if (sort === 'price-desc') result.sort((a,b) => b.price - a.price);
  if (sort === 'name')       result.sort((a,b) => a.name.localeCompare(b.name));

  renderShopProducts(result);
}

function filterByCategory(cat) {
  showSection('shop');
  document.getElementById('categoryFilter').value = cat;
  filterProducts();
}

// ─── SECTIONS ────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`${name}Section`).classList.add('active');
  const link = document.querySelector(`[onclick="showSection('${name}')"]`);
  if (link) link.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (name === 'orders') loadOrders();
  closeMobileMenu();
}

function scrollToFeatured() {
  document.getElementById('featuredSection').scrollIntoView({ behavior: 'smooth' });
}

// ─── SEARCH ─────────────────────────────────────────
function toggleSearch() {
  searchOpen = !searchOpen;
  const bar = document.getElementById('searchBar');
  bar.classList.toggle('hidden', !searchOpen);
  if (searchOpen) {
    document.getElementById('searchInput').focus();
    showSection('shop');
  }
}

// ─── MOBILE MENU ─────────────────────────────────────
function toggleMobileMenu() {
  mobileMenuOpen = !mobileMenuOpen;
  document.getElementById('mainNav').classList.toggle('open', mobileMenuOpen);
}
function closeMobileMenu() {
  mobileMenuOpen = false;
  document.getElementById('mainNav').classList.remove('open');
}

// ─── AUTH ────────────────────────────────────────────
function updateAuthUI() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (currentUser) {
    logoutBtn.classList.remove('hidden');
  } else {
    logoutBtn.classList.add('hidden');
  }
}

function handleUserBtn() {
  if (currentUser) {
    showSection('orders');
  } else {
    openAuthModal();
  }
}

function openAuthModal() {
  document.getElementById('authModal').classList.remove('hidden');
}
function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
  clearAuthMessages();
}

function switchTab(tab) {
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach((t,i) => t.classList.toggle('active', (i === 0) === (tab === 'login')));
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('signupForm').classList.toggle('hidden', tab !== 'signup');
  clearAuthMessages();
}

function clearAuthMessages() {
  document.getElementById('loginMsg').textContent  = '';
  document.getElementById('signupMsg').textContent = '';
  document.getElementById('loginMsg').className    = 'auth-msg';
  document.getElementById('signupMsg').className   = 'auth-msg';
}

async function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const msg      = document.getElementById('loginMsg');

  if (!email || !password) { setMsg(msg, 'Please fill in all fields', 'error'); return; }

  setMsg(msg, 'Signing in…');
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { setMsg(msg, error.message, 'error'); return; }
  setMsg(msg, 'Welcome back! 🎉', 'success');
  setTimeout(closeAuthModal, 800);
  showToast('Signed in successfully! ✓', 'success');
}

async function handleSignup() {
  const name     = document.getElementById('signupName').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const msg      = document.getElementById('signupMsg');

  if (!name || !email || !password) { setMsg(msg, 'Please fill in all fields', 'error'); return; }
  if (password.length < 6) { setMsg(msg, 'Password must be at least 6 characters', 'error'); return; }

  setMsg(msg, 'Creating account…');
  const { error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
  if (error) { setMsg(msg, error.message, 'error'); return; }
  setMsg(msg, 'Account created! Check your email to confirm.', 'success');
  setTimeout(closeAuthModal, 1500);
  showToast('Account created! ✓', 'success');
}

async function handleLogout() {
  await sb.auth.signOut();
  currentUser = null;
  updateAuthUI();
  showToast('Signed out successfully');
  showSection('home');
}

function setMsg(el, text, type = '') {
  el.textContent = text;
  el.className = `auth-msg ${type}`;
}

// ─── PRODUCT MODAL ───────────────────────────────────
function openProductModal(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;

  const originalRow = p.original_price
    ? `<div class="pm-original">Was ₹${Number(p.original_price).toLocaleString('en-IN')}</div>`
    : '';
  const addBtn = p.stock === 0
    ? `<button class="btn-primary" style="opacity:0.4;cursor:not-allowed;flex:1">Out of Stock</button>`
    : `<button class="btn-primary" onclick="addToCart(${p.id}); closeProductModal()">Add to Cart</button>`;

  document.getElementById('productModalContent').innerHTML = `
    <div class="pm-header">
      <div class="pm-img"><span>${p.emoji || '📦'}</span></div>
      <div class="pm-info">
        <div class="pm-cat">${p.category}</div>
        <div class="pm-name">${p.name}</div>
        ${p.rating ? `<div class="pm-rating">⭐ ${p.rating} · ${p.reviews} reviews</div>` : ''}
        <div class="pm-price">₹${Number(p.price).toLocaleString('en-IN')}</div>
        ${originalRow}
        <div class="pm-desc">${p.description || ''}</div>
        <div class="pm-actions">
          ${addBtn}
          <button class="btn-ghost" onclick="closeProductModal()">Close</button>
        </div>
        ${p.stock > 0 && p.stock <= 10 ? `<p class="stock-low" style="margin-top:12px">Only ${p.stock} left in stock!</p>` : ''}
      </div>
    </div>
  `;
  document.getElementById('productModal').classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden');
}

// ─── CART ────────────────────────────────────────────
function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product || product.stock === 0) return;

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    if (existing.qty >= product.stock) { showToast('Max stock reached', 'error'); return; }
    existing.qty++;
  } else {
    cart.push({ id: productId, qty: 1 });
  }
  saveCart();
  renderCartBadge();
  showToast(`${product.name} added to cart ✓`, 'success');
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  renderCart();
  renderCartBadge();
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  const product = allProducts.find(p => p.id === productId);
  item.qty = Math.max(1, Math.min(item.qty + delta, product?.stock || 99));
  if (item.qty === 0) removeFromCart(productId);
  saveCart();
  renderCart();
  renderCartBadge();
}

function saveCart() {
  localStorage.setItem('luxe_cart', JSON.stringify(cart));
}

function renderCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cartBadge');
  badge.textContent = total;
  badge.classList.toggle('hidden', total === 0);
}

function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  sidebar.classList.toggle('hidden');
  if (!sidebar.classList.contains('hidden')) renderCart();
}

function renderCart() {
  const container = document.getElementById('cartItems');
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">🛒</div>
        <p>Your cart is empty</p>
      </div>`;
    document.getElementById('cartTotal').textContent = '₹0';
    return;
  }

  let total = 0;
  container.innerHTML = cart.map(item => {
    const p = allProducts.find(x => x.id === item.id);
    if (!p) return '';
    const subtotal = p.price * item.qty;
    total += subtotal;
    return `
      <div class="cart-item">
        <div class="cart-item-img">${p.emoji || '📦'}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">₹${Number(p.price).toLocaleString('en-IN')} × ${item.qty} = ₹${subtotal.toLocaleString('en-IN')}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="changeQty(${p.id}, -1)">−</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${p.id}, 1)">+</button>
          </div>
        </div>
        <button class="cart-remove" onclick="removeFromCart(${p.id})" title="Remove">✕</button>
      </div>
    `;
  }).join('');
  document.getElementById('cartTotal').textContent = `₹${total.toLocaleString('en-IN')}`;
}

// ─── CHECKOUT / RAZORPAY ─────────────────────────────
async function initiateCheckout() {
  if (cart.length === 0) { showToast('Your cart is empty', 'error'); return; }

  if (!currentUser) {
    showToast('Please sign in to checkout', 'error');
    toggleCart();
    openAuthModal();
    return;
  }

  const total = cart.reduce((sum, item) => {
    const p = allProducts.find(x => x.id === item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);

  // In production: create Razorpay order via your backend/Supabase Edge Function
  // For demo, we open Razorpay checkout directly with amount
  const options = {
    key: RAZORPAY_KEY,
    amount: total * 100,         // in paise
    currency: 'INR',
    name: 'LUXE Store',
    description: `${cart.reduce((s,i) => s+i.qty,0)} item(s)`,
    image: '',                   // Your logo URL
    // order_id: 'order_XXXXX',  // From your backend Razorpay order creation
    prefill: {
      name:  currentUser.user_metadata?.full_name || '',
      email: currentUser.email,
      contact: ''
    },
    theme: { color: '#c9a84c' },
    handler: async function(response) {
      // Payment successful
      await saveOrderToSupabase(response, total);
    },
    modal: {
      ondismiss: function() {
        showToast('Payment cancelled');
      }
    }
  };

  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function(response) {
    showToast('Payment failed: ' + response.error.description, 'error');
    saveFailedOrder(response.error);
  });
  rzp.open();
}

async function saveOrderToSupabase(razorpayResponse, total) {
  const orderItems = cart.map(item => {
    const p = allProducts.find(x => x.id === item.id);
    return { product_id: item.id, name: p?.name, price: p?.price, qty: item.qty };
  });

  const orderData = {
    user_id:            currentUser.id,
    user_email:         currentUser.email,
    items:              orderItems,
    total_amount:       total,
    razorpay_payment_id: razorpayResponse.razorpay_payment_id,
    razorpay_order_id:  razorpayResponse.razorpay_order_id || null,
    razorpay_signature: razorpayResponse.razorpay_signature || null,
    status:             'paid',
    created_at:         new Date().toISOString(),
  };

  try {
    const { error } = await sb.from('orders').insert([orderData]);
    if (error) console.warn('Order save warning:', error.message);
  } catch (e) {
    console.warn('Could not save order to Supabase:', e);
  }

  // Clear cart
  cart = [];
  saveCart();
  renderCartBadge();
  toggleCart();

  showToast('Payment successful! Order placed ✓', 'success');
  showSection('orders');
}

async function saveFailedOrder(error) {
  if (!currentUser) return;
  try {
    await sb.from('orders').insert([{
      user_id:    currentUser.id,
      user_email: currentUser.email,
      items:      cart.map(i => ({ product_id: i.id, qty: i.qty })),
      total_amount: 0,
      status:     'failed',
      error_msg:  error.description,
      created_at: new Date().toISOString(),
    }]);
  } catch (e) { /* silent */ }
}

// ─── ORDERS ─────────────────────────────────────────
async function loadOrders() {
  const container = document.getElementById('ordersContent');

  if (!currentUser) {
    container.innerHTML = `
      <div class="login-cta">
        <h3>Sign in to view orders</h3>
        <p>Track your purchases and order history</p>
        <button class="btn-primary" onclick="openAuthModal()">Sign In</button>
      </div>`;
    return;
  }

  container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-2)">Loading orders…</div>`;

  try {
    const { data, error } = await sb
      .from('orders')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Your order history will appear here</p>
        </div>`;
      return;
    }

    container.innerHTML = data.map(order => {
      const items = Array.isArray(order.items) ? order.items : [];
      const statusClass = { paid: 'status-paid', pending: 'status-pending', failed: 'status-failed' }[order.status] || 'status-pending';
      const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      return `
        <div class="order-card">
          <div class="order-header">
            <div>
              <div class="order-id">#${order.razorpay_payment_id || order.id}</div>
              <div class="order-date">${date}</div>
            </div>
            <span class="order-status ${statusClass}">${order.status}</span>
          </div>
          <div class="order-items">
            ${items.map(i => `
              <div class="order-item">
                <span class="order-item-name">${i.name || `Product #${i.product_id}`} × ${i.qty}</span>
                <span class="order-item-price">₹${(i.price * i.qty).toLocaleString('en-IN')}</span>
              </div>
            `).join('')}
          </div>
          <div class="order-total">
            <span>Total</span>
            <span>₹${Number(order.total_amount).toLocaleString('en-IN')}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Could not load orders</h3>
        <p>Configure Supabase to see your order history</p>
      </div>`;
  }
}

// ─── TOAST ───────────────────────────────────────────
let toastTimer;
function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ─── KEYBOARD SHORTCUTS ──────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeAuthModal();
    closeProductModal();
    if (!document.getElementById('cartSidebar').classList.contains('hidden')) toggleCart();
    if (searchOpen) toggleSearch();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); toggleSearch(); }
});
