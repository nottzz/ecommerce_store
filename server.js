import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';

const app = express();
const PORT = parseInt(process.env.PORT) || 3000;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_demo';

const stripe = new Stripe(STRIPE_KEY);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory data store
const products = [
  { id: uuidv4(), name: 'Wireless Headphones Pro', description: 'Premium noise-cancelling headphones with 30hr battery', price: 199.99, category: 'Audio', image: '🎧' },
  { id: uuidv4(), name: 'Smart Watch Ultra', description: 'Advanced fitness tracking with AMOLED display', price: 299.99, category: 'Wearables', image: '⌚' },
  { id: uuidv4(), name: 'USB-C Fast Charger', description: '65W fast charging cable with data transfer', price: 19.99, category: 'Cables', image: '🔌' },
  { id: uuidv4(), name: 'Premium Phone Case', description: 'Military-grade protective case with MagSafe', price: 29.99, category: 'Protection', image: '📱' },
  { id: uuidv4(), name: 'Tempered Glass Screen', description: '9H hardness screen protector for all phones', price: 9.99, category: 'Protection', image: '🛡️' },
  { id: uuidv4(), name: 'Power Bank 20000mAh', description: 'Fast charging portable battery with dual USB-C', price: 49.99, category: 'Power', image: '🔋' },
  { id: uuidv4(), name: 'Portable Bluetooth Speaker', description: 'Waterproof 360° sound with 12hr battery', price: 79.99, category: 'Audio', image: '🔊' },
  { id: uuidv4(), name: 'Aluminum Laptop Stand', description: 'Adjustable ergonomic stand for all laptops', price: 39.99, category: 'Accessories', image: '💻' },
  { id: uuidv4(), name: 'Mechanical Gaming Keyboard', description: 'RGB backlit with Cherry MX switches', price: 129.99, category: 'Input', image: '⌨️' },
  { id: uuidv4(), name: 'Ergonomic Wireless Mouse', description: 'Precision tracking with 18-month battery', price: 49.99, category: 'Input', image: '🖱️' },
  { id: uuidv4(), name: '4K USB Webcam', description: '1080p HD with auto-focus and noise cancellation', price: 89.99, category: 'Video', image: '📹' },
  { id: uuidv4(), name: 'USB Condenser Microphone', description: 'Studio-quality recording with pop filter', price: 99.99, category: 'Audio', image: '🎤' },
  { id: uuidv4(), name: 'LED Desk Lamp', description: 'Adjustable brightness with USB charging port', price: 34.99, category: 'Lighting', image: '💡' },
  { id: uuidv4(), name: 'Cable Management Kit', description: 'Organize all your cables with clips and ties', price: 14.99, category: 'Organization', image: '🔗' },
  { id: uuidv4(), name: 'Phone Mount Stand', description: 'Adjustable 360° rotation for desk or car', price: 19.99, category: 'Mounts', image: '📍' },
  { id: uuidv4(), name: '4K HDMI 2.1 Cable', description: '8K ready with gold-plated connectors', price: 24.99, category: 'Cables', image: '📺' },
  { id: uuidv4(), name: 'Cat6 Ethernet Cable', description: '10ft gigabit internet cable for gaming', price: 12.99, category: 'Cables', image: '🌐' },
  { id: uuidv4(), name: 'Smart Power Strip', description: '4 outlets + 2 USB with app control', price: 44.99, category: 'Power', image: '⚡' },
  { id: uuidv4(), name: 'Laptop Cooling Pad', description: 'Dual fan system with adjustable height', price: 29.99, category: 'Cooling', image: '❄️' },
  { id: uuidv4(), name: '27" 4K Monitor', description: 'IPS display with USB-C and speakers', price: 399.99, category: 'Displays', image: '🖥️' }
];

const users = new Map();
const carts = new Map();
const sessions = new Map();
const orders = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  res.json(product || { error: 'Not found' });
});

// Sign up
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  const existingUser = Array.from(users.values()).find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  
  const userId = uuidv4();
  const sessionId = uuidv4();
  
  users.set(userId, { id: userId, email, password, name });
  carts.set(userId, []);
  orders.set(userId, []);
  sessions.set(sessionId, userId);
  
  res.json({ 
    success: true, 
    userId, 
    sessionId, 
    user: { id: userId, email, name }
  });
});

// Sign in
app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  const user = Array.from(users.values()).find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const sessionId = uuidv4();
  sessions.set(sessionId, user.id);
  
  res.json({ 
    success: true, 
    userId: user.id, 
    sessionId,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const userId = sessions.get(sessionId);
  
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const user = users.get(userId);
  res.json({ id: user.id, email: user.email, name: user.name });
});

// Sign out
app.post('/api/auth/signout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  sessions.delete(sessionId);
  res.json({ success: true });
});

// Add to cart
app.post('/api/cart/:userId', (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.params.userId;
  
  if (!carts.has(userId)) {
    carts.set(userId, []);
  }
  
  const cart = carts.get(userId);
  const existingItem = cart.find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  
  res.json({ success: true, cart });
});

// Get cart
app.get('/api/cart/:userId', (req, res) => {
  const cart = carts.get(req.params.userId) || [];
  const items = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { ...item, product };
  });
  res.json(items);
});

// Checkout (create order)
app.post('/api/checkout/:userId', (req, res) => {
  const userId = req.params.userId;
  const cart = carts.get(userId) || [];
  
  if (cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }
  
  const orderItems = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      price: product.price,
      subtotal: product.price * item.quantity
    };
  });
  
  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  
  const order = {
    id: uuidv4(),
    userId,
    items: orderItems,
    total,
    status: 'completed',
    date: new Date().toISOString(),
    trackingNumber: 'TRK-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  };
  
  if (!orders.has(userId)) {
    orders.set(userId, []);
  }
  
  orders.get(userId).push(order);
  carts.set(userId, []);
  
  res.json({ success: true, order });
});

// Get user orders
app.get('/api/orders/:userId', (req, res) => {
  const userId = req.params.userId;
  const userOrders = orders.get(userId) || [];
  res.json(userOrders);
});

// Get single order
app.get('/api/orders/:userId/:orderId', (req, res) => {
  const { userId, orderId } = req.params;
  const userOrders = orders.get(userId) || [];
  const order = userOrders.find(o => o.id === orderId);
  res.json(order || { error: 'Order not found' });
});

// Main page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Premium Tech Store - Best Products Online</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #f8f9fa; color: #333; }
    
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 28px; font-weight: bold; cursor: pointer; }
    .header-right { display: flex; gap: 20px; align-items: center; }
    .nav-menu { display: flex; gap: 15px; align-items: center; list-style: none; }
    .nav-item { color: white; cursor: pointer; font-size: 14px; transition: all 0.3s; padding: 8px 12px; border-radius: 6px; }
    .nav-item:hover { background: rgba(255,255,255,0.2); }
    .user-info { color: white; font-size: 14px; font-weight: 600; }
    .cart-badge { background: #ff6b6b; color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer; }
    
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    
    .hero { text-align: center; margin-bottom: 50px; }
    .hero h1 { font-size: 42px; margin-bottom: 10px; color: #2d3748; }
    .hero p { font-size: 18px; color: #718096; }
    
    .filters { display: flex; gap: 10px; margin-bottom: 30px; flex-wrap: wrap; }
    .filter-btn { padding: 8px 16px; border: 2px solid #e2e8f0; background: white; border-radius: 20px; cursor: pointer; transition: all 0.3s; }
    .filter-btn.active { background: #667eea; color: white; border-color: #667eea; }
    .filter-btn:hover { border-color: #667eea; }
    
    .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; }
    
    .product-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s; cursor: pointer; }
    .product-card:hover { transform: translateY(-8px); box-shadow: 0 12px 24px rgba(0,0,0,0.15); }
    
    .product-image { font-size: 80px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); height: 200px; }
    
    .product-info { padding: 20px; }
    .product-name { font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #2d3748; }
    .product-desc { font-size: 13px; color: #718096; margin-bottom: 12px; line-height: 1.4; }
    .product-category { display: inline-block; background: #edf2f7; color: #667eea; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-bottom: 12px; }
    
    .product-footer { display: flex; justify-content: space-between; align-items: center; }
    .price { font-size: 24px; font-weight: bold; color: #667eea; }
    .add-btn { background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s; }
    .add-btn:hover { background: #764ba2; transform: scale(1.05); }
    
    .modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; }
    .modal.active { display: flex; }
    .modal-content { background: white; padding: 40px; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; }
    .modal-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: 600; }
    .form-group input { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
    .form-group input:focus { outline: none; border-color: #667eea; }
    .submit-btn { width: 100%; background: #667eea; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .submit-btn:hover { background: #764ba2; }
    .close-btn { float: right; font-size: 24px; cursor: pointer; color: #999; }
    .toggle-form { text-align: center; margin-top: 15px; font-size: 14px; }
    .toggle-form a { color: #667eea; cursor: pointer; text-decoration: underline; }
    
    .order-item { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
    .order-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .order-id { font-weight: bold; color: #667eea; }
    .order-date { font-size: 12px; color: #718096; }
    .order-total { font-size: 18px; font-weight: bold; color: #2d3748; }
    .order-status { display: inline-block; background: #c3fae8; color: #0f5132; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .order-items { font-size: 13px; color: #718096; margin-top: 10px; }
    
    .cart-icon { position: fixed; bottom: 30px; right: 30px; background: #ff6b6b; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; cursor: pointer; box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4); transition: all 0.3s; }
    .cart-icon:hover { transform: scale(1.1); }
    .cart-count { position: absolute; top: -5px; right: -5px; background: #fff; color: #ff6b6b; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; }
    
    .page { display: none; }
    .page.active { display: block; }
    
    footer { background: #2d3748; color: white; padding: 40px 20px; text-align: center; margin-top: 60px; }
  </style>
</head>
<body>
  <header>
    <div class="header-content">
      <div class="logo" onclick="showPage('home')">🛍️ Premium Tech Store</div>
      <div class="header-right">
        <ul class="nav-menu">
          <li id="userSection" style="display:none;">
            <span class="user-info">👤 <span id="userName"></span></span>
          </li>
          <li id="ordersLink" style="display:none;" class="nav-item" onclick="showPage('orders')">📦 Orders</li>
          <li id="signOutLink" style="display:none;" class="nav-item" onclick="signOut()">Sign Out</li>
          <li id="signInLink" class="nav-item" onclick="showSignIn()">Sign In</li>
          <li id="signUpLink" class="nav-item" onclick="showSignUp()">Sign Up</li>
        </ul>
        <div class="cart-badge" onclick="viewCart()">🛒 <span id="cartCount">0</span></div>
      </div>
    </div>
  </header>

  <!-- Home Page -->
  <div id="home" class="page active">
    <div class="container">
      <div class="hero">
        <h1>Best Tech Products Online</h1>
        <p>Premium accessories and electronics for your digital lifestyle</p>
      </div>

      <div class="filters">
        <button class="filter-btn active" onclick="filterProducts('all')">All Products</button>
        <button class="filter-btn" onclick="filterProducts('Audio')">🎧 Audio</button>
        <button class="filter-btn" onclick="filterProducts('Wearables')">⌚ Wearables</button>
        <button class="filter-btn" onclick="filterProducts('Input')">⌨️ Input</button>
        <button class="filter-btn" onclick="filterProducts('Power')">🔋 Power</button>
        <button class="filter-btn" onclick="filterProducts('Cables')">🔌 Cables</button>
      </div>

      <div class="products-grid" id="products"></div>
    </div>
  </div>

  <!-- Orders Page -->
  <div id="orders" class="page">
    <div class="container">
      <div class="hero">
        <h1>Your Orders</h1>
        <p>Track and manage your purchases</p>
      </div>
      <div id="ordersList"></div>
    </div>
  </div>

  <!-- Sign In Modal -->
  <div id="signInModal" class="modal">
    <div class="modal-content">
      <span class="close-btn" onclick="closeModal('signInModal')">&times;</span>
      <div class="modal-title">Sign In</div>
      <form onsubmit="handleSignIn(event)">
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="signInEmail" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="signInPassword" required>
        </div>
        <button type="submit" class="submit-btn">Sign In</button>
      </form>
      <div class="toggle-form">Don't have an account? <a onclick="switchToSignUp()">Sign Up</a></div>
    </div>
  </div>

  <!-- Sign Up Modal -->
  <div id="signUpModal" class="modal">
    <div class="modal-content">
      <span class="close-btn" onclick="closeModal('signUpModal')">&times;</span>
      <div class="modal-title">Create Account</div>
      <form onsubmit="handleSignUp(event)">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="signUpName" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="signUpEmail" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="signUpPassword" required>
        </div>
        <button type="submit" class="submit-btn">Create Account</button>
      </form>
      <div class="toggle-form">Already have an account? <a onclick="switchToSignIn()">Sign In</a></div>
    </div>
  </div>

  <div class="cart-icon" onclick="viewCart()">
    🛒
    <div class="cart-count" id="cartBadge">0</div>
  </div>

  <footer>
    <div class="footer-content">
      <p>&copy; 2026 Premium Tech Store. All rights reserved.</p>
    </div>
  </footer>

  <script>
    let allProducts = [];
    let currentFilter = 'all';
    let cartCount = 0;
    let currentUser = null;
    let currentSessionId = null;

    function checkAuth() {
      const sessionId = localStorage.getItem('sessionId');
      const user = localStorage.getItem('user');
      
      if (sessionId && user) {
        currentSessionId = sessionId;
        currentUser = JSON.parse(user);
        updateAuthUI();
      }
    }

    function updateAuthUI() {
      if (currentUser) {
        document.getElementById('userSection').style.display = 'block';
        document.getElementById('ordersLink').style.display = 'block';
        document.getElementById('signOutLink').style.display = 'block';
        document.getElementById('signInLink').style.display = 'none';
        document.getElementById('signUpLink').style.display = 'none';
        document.getElementById('userName').textContent = currentUser.name;
      } else {
        document.getElementById('userSection').style.display = 'none';
        document.getElementById('ordersLink').style.display = 'none';
        document.getElementById('signOutLink').style.display = 'none';
        document.getElementById('signInLink').style.display = 'block';
        document.getElementById('signUpLink').style.display = 'block';
      }
    }

    function showPage(pageName) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById(pageName).classList.add('active');
      
      if (pageName === 'orders') {
        if (!currentUser) {
          alert('Please sign in first');
          showSignIn();
          return;
        }
        loadOrders();
      } else if (pageName === 'home') {
        loadProducts();
      }
    }

    async function loadOrders() {
      if (!currentUser) return;
      
      try {
        const response = await fetch(\`/api/orders/\${currentUser.id}\`);
        const userOrders = await response.json();
        
        const ordersList = document.getElementById('ordersList');
        
        if (userOrders.length === 0) {
          ordersList.innerHTML = '<p style="text-align: center; color: #718096;">No orders yet. Start shopping!</p>';
          return;
        }
        
        ordersList.innerHTML = userOrders.map(order => \`
          <div class="order-item">
            <div class="order-header">
              <div>
                <div class="order-id">Order #\${order.id.substr(0, 8)}</div>
                <div class="order-date">\${new Date(order.date).toLocaleDateString()}</div>
              </div>
              <div style="text-align: right;">
                <div class="order-status">\${order.status}</div>
                <div class="order-total">$\${order.total.toFixed(2)}</div>
              </div>
            </div>
            <div class="order-items">
              <strong>Items:</strong> \${order.items.map(i => \`\${i.productName} (x\${i.quantity})\`).join(', ')}
            </div>
            <div class="order-items">
              <strong>Tracking:</strong> \${order.trackingNumber}
            </div>
          </div>
        \`).join('');
      } catch (err) {
        console.error('Error loading orders:', err);
      }
    }

    async function handleSignIn(event) {
      event.preventDefault();
      const email = document.getElementById('signInEmail').value;
      const password = document.getElementById('signInPassword').value;
      
      try {
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
          currentUser = data.user;
          currentSessionId = data.sessionId;
          localStorage.setItem('sessionId', data.sessionId);
          localStorage.setItem('user', JSON.stringify(data.user));
          updateAuthUI();
          closeModal('signInModal');
          alert('✅ Signed in successfully!');
        } else {
          alert('❌ ' + data.error);
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    async function handleSignUp(event) {
      event.preventDefault();
      const name = document.getElementById('signUpName').value;
      const email = document.getElementById('signUpEmail').value;
      const password = document.getElementById('signUpPassword').value;
      
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
          currentUser = data.user;
          currentSessionId = data.sessionId;
          localStorage.setItem('sessionId', data.sessionId);
          localStorage.setItem('user', JSON.stringify(data.user));
          updateAuthUI();
          closeModal('signUpModal');
          alert('✅ Account created successfully!');
        } else {
          alert('❌ ' + data.error);
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    function signOut() {
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      currentUser = null;
      currentSessionId = null;
      updateAuthUI();
      showPage('home');
      alert('✅ Signed out successfully!');
    }

    function showSignIn() {
      document.getElementById('signInModal').classList.add('active');
    }

    function showSignUp() {
      document.getElementById('signUpModal').classList.add('active');
    }

    function closeModal(modalId) {
      document.getElementById(modalId).classList.remove('active');
    }

    function switchToSignIn() {
      closeModal('signUpModal');
      showSignIn();
    }

    function switchToSignUp() {
      closeModal('signInModal');
      showSignUp();
    }

    async function loadProducts() {
      try {
        const response = await fetch('/api/products');
        allProducts = await response.json();
        displayProducts();
      } catch (err) {
        console.error('Error loading products:', err);
      }
    }

    function displayProducts() {
      const filtered = currentFilter === 'all' 
        ? allProducts 
        : allProducts.filter(p => p.category === currentFilter);
      
      const productsDiv = document.getElementById('products');
      productsDiv.innerHTML = filtered.map(product => \`
        <div class="product-card">
          <div class="product-image">\${product.image}</div>
          <div class="product-info">
            <div class="product-name">\${product.name}</div>
            <div class="product-desc">\${product.description}</div>
            <div class="product-category">\${product.category}</div>
            <div class="product-footer">
              <div class="price">$\${product.price.toFixed(2)}</div>
              <button class="add-btn" onclick="addToCart('\${product.id}', '\${product.name}', \${product.price})">Add</button>
            </div>
          </div>
        </div>
      \`).join('');
    }

    function filterProducts(category) {
      currentFilter = category;
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      displayProducts();
    }

    function addToCart(productId, name, price) {
      if (!currentUser) {
        alert('Please sign in first to add items to cart');
        showSignIn();
        return;
      }
      cartCount++;
      document.getElementById('cartCount').textContent = cartCount;
      document.getElementById('cartBadge').textContent = cartCount;
      alert(\`✅ Added "\${name}" ($\${price.toFixed(2)}) to cart!\`);
    }

    function viewCart() {
      if (!currentUser) {
        alert('Please sign in first');
        showSignIn();
        return;
      }
      if (cartCount === 0) {
        alert('Your cart is empty. Add some products first!');
      } else {
        const proceed = confirm(\`You have \${cartCount} items in your cart ($\${(cartCount * 50).toFixed(2)}). Proceed to checkout?\`);
        if (proceed) {
          checkout();
        }
      }
    }

    async function checkout() {
      try {
        const response = await fetch(\`/api/checkout/\${currentUser.id}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
          cartCount = 0;
          document.getElementById('cartCount').textContent = '0';
          document.getElementById('cartBadge').textContent = '0';
          alert(\`✅ Order placed successfully!\\nOrder ID: \${data.order.id.substr(0, 8)}\\nTracking: \${data.order.trackingNumber}\`);
          showPage('orders');
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    checkAuth();
    loadProducts();
  </script>
</body>
</html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Premium Tech Store running on port ${PORT}`);
});
