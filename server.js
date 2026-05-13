import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory data store
let products = [
  { id: uuidv4(), name: 'Wireless Headphones Pro', description: 'Premium noise-cancelling headphones with 30hr battery', price: 199.99, category: 'Audio', image: '🎧', stock: 45 },
  { id: uuidv4(), name: 'Smart Watch Ultra', description: 'Advanced fitness tracking with AMOLED display', price: 299.99, category: 'Wearables', image: '⌚', stock: 32 },
  { id: uuidv4(), name: 'USB-C Fast Charger', description: '65W fast charging cable with data transfer', price: 19.99, category: 'Cables', image: '🔌', stock: 120 },
  { id: uuidv4(), name: 'Premium Phone Case', description: 'Military-grade protective case with MagSafe', price: 29.99, category: 'Protection', image: '📱', stock: 88 },
  { id: uuidv4(), name: 'Tempered Glass Screen', description: '9H hardness screen protector for all phones', price: 9.99, category: 'Protection', image: '🛡️', stock: 200 },
  { id: uuidv4(), name: 'Power Bank 20000mAh', description: 'Fast charging portable battery with dual USB-C', price: 49.99, category: 'Power', image: '🔋', stock: 67 },
  { id: uuidv4(), name: 'Portable Bluetooth Speaker', description: 'Waterproof 360° sound with 12hr battery', price: 79.99, category: 'Audio', image: '🔊', stock: 43 },
  { id: uuidv4(), name: 'Aluminum Laptop Stand', description: 'Adjustable ergonomic stand for all laptops', price: 39.99, category: 'Accessories', image: '💻', stock: 55 },
  { id: uuidv4(), name: 'Mechanical Gaming Keyboard', description: 'RGB backlit with Cherry MX switches', price: 129.99, category: 'Input', image: '⌨️', stock: 28 },
  { id: uuidv4(), name: 'Ergonomic Wireless Mouse', description: 'Precision tracking with 18-month battery', price: 49.99, category: 'Input', image: '🖱️', stock: 92 },
  { id: uuidv4(), name: '4K USB Webcam', description: '1080p HD with auto-focus and noise cancellation', price: 89.99, category: 'Video', image: '📹', stock: 35 },
  { id: uuidv4(), name: 'USB Condenser Microphone', description: 'Studio-quality recording with pop filter', price: 99.99, category: 'Audio', image: '🎤', stock: 24 },
  { id: uuidv4(), name: 'LED Desk Lamp', description: 'Adjustable brightness with USB charging port', price: 34.99, category: 'Lighting', image: '💡', stock: 71 },
  { id: uuidv4(), name: 'Cable Management Kit', description: 'Organize all your cables with clips and ties', price: 14.99, category: 'Organization', image: '🔗', stock: 156 },
  { id: uuidv4(), name: 'Phone Mount Stand', description: 'Adjustable 360° rotation for desk or car', price: 19.99, category: 'Mounts', image: '📍', stock: 103 },
  { id: uuidv4(), name: '4K HDMI 2.1 Cable', description: '8K ready with gold-plated connectors', price: 24.99, category: 'Cables', image: '📺', stock: 89 },
  { id: uuidv4(), name: 'Cat6 Ethernet Cable', description: '10ft gigabit internet cable for gaming', price: 12.99, category: 'Cables', image: '🌐', stock: 145 },
  { id: uuidv4(), name: 'Smart Power Strip', description: '4 outlets + 2 USB with app control', price: 44.99, category: 'Power', image: '⚡', stock: 52 },
  { id: uuidv4(), name: 'Laptop Cooling Pad', description: 'Dual fan system with adjustable height', price: 29.99, category: 'Cooling', image: '❄️', stock: 38 },
  { id: uuidv4(), name: '27" 4K Monitor', description: 'IPS display with USB-C and speakers', price: 399.99, category: 'Displays', image: '🖥️', stock: 15 }
];

const users = new Map();
const carts = new Map();
const sessions = new Map();
const adminSessions = new Map();
const orders = new Map();

const ADMIN_EMAIL = 'admin@store.com';
const ADMIN_PASSWORD = 'admin123';

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

// Admin endpoints
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const adminSessionId = uuidv4();
    adminSessions.set(adminSessionId, { email, loginTime: new Date() });
    res.json({ success: true, adminSessionId });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

app.get('/api/admin/stats', (req, res) => {
  const sessionId = req.headers['x-admin-session'];
  if (!adminSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const totalOrders = Array.from(orders.values()).reduce((sum, userOrders) => sum + userOrders.length, 0);
  const totalRevenue = Array.from(orders.values()).reduce((sum, userOrders) => 
    sum + userOrders.reduce((orderSum, order) => orderSum + order.total, 0), 0
  );
  
  res.json({
    totalProducts: products.length,
    totalUsers: users.size,
    totalOrders,
    totalRevenue: totalRevenue.toFixed(2)
  });
});

app.get('/api/admin/products', (req, res) => {
  const sessionId = req.headers['x-admin-session'];
  if (!adminSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(products);
});

app.post('/api/admin/products', (req, res) => {
  const sessionId = req.headers['x-admin-session'];
  if (!adminSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { name, description, price, category, image, stock } = req.body;
  const newProduct = {
    id: uuidv4(),
    name,
    description,
    price: parseFloat(price),
    category,
    image,
    stock: parseInt(stock)
  };
  
  products.push(newProduct);
  res.json({ success: true, product: newProduct });
});

app.put('/api/admin/products/:id', (req, res) => {
  const sessionId = req.headers['x-admin-session'];
  if (!adminSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const { name, description, price, category, stock } = req.body;
  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price ? parseFloat(price) : product.price;
  product.category = category || product.category;
  product.stock = stock ? parseInt(stock) : product.stock;
  
  res.json({ success: true, product });
});

app.delete('/api/admin/products/:id', (req, res) => {
  const sessionId = req.headers['x-admin-session'];
  if (!adminSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  products.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/admin/orders', (req, res) => {
  const sessionId = req.headers['x-admin-session'];
  if (!adminSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const allOrders = [];
  orders.forEach((userOrders, userId) => {
    const user = users.get(userId);
    userOrders.forEach(order => {
      allOrders.push({
        ...order,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || 'Unknown'
      });
    });
  });
  
  res.json(allOrders.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

app.put('/api/admin/orders/:id', (req, res) => {
  const sessionId = req.headers['x-admin-session'];
  if (!adminSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { status } = req.body;
  let found = false;
  
  orders.forEach(userOrders => {
    const order = userOrders.find(o => o.id === req.params.id);
    if (order) {
      order.status = status;
      found = true;
    }
  });
  
  if (!found) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json({ success: true });
});

app.get('/api/admin/users', (req, res) => {
  const sessionId = req.headers['x-admin-session'];
  if (!adminSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userList = Array.from(users.values()).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    joinDate: u.joinDate,
    active: u.active !== false
  }));
  
  res.json(userList);
});

app.put('/api/admin/users/:id', (req, res) => {
  const sessionId = req.headers['x-admin-session'];
  if (!adminSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { active } = req.body;
  user.active = active;
  
  res.json({ success: true });
});

// Auth endpoints
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
  
  users.set(userId, { id: userId, email, password, name, joinDate: new Date().toISOString(), active: true });
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

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  const user = Array.from(users.values()).find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  if (!user.active) {
    return res.status(403).json({ error: 'Your account has been disabled. Please contact support.' });
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

// Cart endpoints
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
    status: 'pending',
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

app.get('/api/orders/:userId', (req, res) => {
  const userId = req.params.userId;
  const userOrders = orders.get(userId) || [];
  res.json(userOrders);
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Best Products - Premium Tech Store</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #fafafa; color: #1a1a1a; }
    
    header { background: white; padding: 24px 0; border-bottom: 1px solid #e5e5e5; }
    .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; cursor: pointer; letter-spacing: -0.5px; }
    .header-right { display: flex; gap: 16px; align-items: center; }
    .nav-item { color: #1a1a1a; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s; padding: 8px 0; border-bottom: 2px solid transparent; }
    .nav-item:hover { border-bottom-color: #1a1a1a; }
    .btn-secondary { background: white; color: #1a1a1a; border: 1px solid #1a1a1a; padding: 10px 24px; border-radius: 24px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.3s; }
    .btn-secondary:hover { background: #f0f0f0; }
    .btn-primary { background: #1a1a1a; color: white; border: none; padding: 10px 24px; border-radius: 24px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.3s; }
    .btn-primary:hover { background: #333; }
    .btn-small { background: #1a1a1a; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; transition: all 0.3s; }
    .btn-small:hover { background: #333; }
    .btn-danger { background: #ff6b6b; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; transition: all 0.3s; }
    .btn-danger:hover { background: #ff5252; }
    .cart-badge { background: #ff6b6b; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    
    .container { max-width: 1200px; margin: 0 auto; padding: 60px 20px; }
    
    .hero { text-align: center; margin-bottom: 60px; }
    .hero h1 { font-family: 'Playfair Display', serif; font-size: 56px; font-weight: 700; margin-bottom: 16px; letter-spacing: -1px; }
    .hero p { font-size: 18px; color: #666; margin-bottom: 32px; }
    
    .filters { display: flex; gap: 12px; margin-bottom: 40px; flex-wrap: wrap; justify-content: center; }
    .filter-btn { padding: 10px 20px; border: 1px solid #e5e5e5; background: white; border-radius: 24px; cursor: pointer; transition: all 0.3s; font-size: 14px; font-weight: 500; }
    .filter-btn.active { background: #1a1a1a; color: white; border-color: #1a1a1a; }
    .filter-btn:hover { border-color: #1a1a1a; }
    
    .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 32px; }
    
    .product-card { background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5e5; transition: all 0.3s; }
    .product-card:hover { border-color: #1a1a1a; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    
    .product-image { font-size: 80px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; height: 200px; }
    
    .product-info { padding: 24px; }
    .product-name { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .product-desc { font-size: 14px; color: #666; margin-bottom: 16px; line-height: 1.5; }
    .product-category { display: inline-block; background: #f0f0f0; color: #1a1a1a; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-bottom: 16px; font-weight: 500; }
    
    .product-footer { display: flex; justify-content: space-between; align-items: center; }
    .price { font-size: 24px; font-weight: 700; }
    .add-btn { background: #1a1a1a; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s; font-size: 14px; }
    .add-btn:hover { background: #333; }
    
    .modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; }
    .modal.active { display: flex; }
    .modal-content { background: white; padding: 48px; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; }
    .modal-title { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; margin-bottom: 32px; }
    .modal-subtitle { font-size: 14px; color: #666; margin-bottom: 24px; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; }
    .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 12px 16px; border: 1px solid #e5e5e5; border-radius: 8px; font-size: 14px; font-family: 'Inter', sans-serif; }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus { outline: none; border-color: #1a1a1a; }
    .form-group input::placeholder { color: #999; }
    .submit-btn { width: 100%; background: #1a1a1a; color: white; border: none; padding: 14px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; margin-top: 8px; }
    .submit-btn:hover { background: #333; }
    .close-btn { float: right; font-size: 28px; cursor: pointer; color: #999; line-height: 1; }
    .toggle-form { text-align: center; margin-top: 20px; font-size: 14px; }
    .toggle-form a { color: #1a1a1a; cursor: pointer; font-weight: 600; text-decoration: underline; }
    
    .page { display: none; }
    .page.active { display: block; animation: fadeIn 0.3s ease-in; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    footer { background: white; border-top: 1px solid #e5e5e5; padding: 40px 20px; text-align: center; color: #666; font-size: 14px; margin-top: 80px; }
    
    .orders-list { background: white; border-radius: 12px; border: 1px solid #e5e5e5; }
    .order-item { padding: 24px; border-bottom: 1px solid #e5e5e5; }
    .order-item:last-child { border-bottom: none; }
    .order-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; }
    .order-id { font-weight: 600; }
    .order-status { background: #c3fae8; color: #0f5132; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .order-status.pending { background: #fff3cd; color: #856404; }
    .order-total { font-size: 20px; font-weight: 700; }
    .order-items { font-size: 14px; color: #666; margin-bottom: 12px; }
    .order-tracking { font-size: 13px; color: #999; }
    
    .admin-dashboard { background: white; border-radius: 12px; padding: 40px; border: 1px solid #e5e5e5; }
    .admin-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-bottom: 40px; }
    .stat-card { background: #f5f5f5; padding: 24px; border-radius: 12px; text-align: center; border: 1px solid #e5e5e5; }
    .stat-value { font-size: 36px; font-weight: 700; margin-bottom: 8px; }
    .stat-label { font-size: 14px; color: #666; font-weight: 500; }
    
    .admin-nav { display: flex; gap: 12px; margin-bottom: 32px; border-bottom: 1px solid #e5e5e5; padding-bottom: 16px; }
    .admin-nav-item { padding: 8px 16px; cursor: pointer; font-weight: 600; font-size: 14px; border-bottom: 2px solid transparent; transition: all 0.3s; }
    .admin-nav-item.active { border-bottom-color: #1a1a1a; }
    
    .admin-section { display: none; }
    .admin-section.active { display: block; }
    
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f5f5f5; padding: 16px; text-align: left; font-weight: 600; font-size: 14px; border-bottom: 1px solid #e5e5e5; }
    td { padding: 16px; border-bottom: 1px solid #e5e5e5; font-size: 14px; }
    tr:hover { background: #fafafa; }
    
    .action-buttons { display: flex; gap: 8px; }
  </style>
</head>
<body>
  <header>
    <div class="header-content">
      <div class="logo" onclick="showPage('home')">Best Products</div>
      <div class="header-right">
        <div id="userSection" style="display:none; display: flex; gap: 16px; align-items: center;">
          <span style="font-size: 14px; font-weight: 500;">👤 <span id="userName"></span></span>
          <a class="nav-item" onclick="showPage('orders')">📦 Orders</a>
          <a class="nav-item" onclick="signOut()">Sign Out</a>
        </div>
        <div id="adminSection" style="display:none; display: flex; gap: 16px; align-items: center;">
          <a class="nav-item" onclick="showPage('admin')">⚙️ Admin</a>
          <a class="nav-item" onclick="signOutAdmin()">Sign Out</a>
        </div>
        <div id="authSection">
          <button class="btn-secondary" onclick="showSignIn()">Sign In</button>
          <button class="btn-primary" onclick="showSignUp()">Register</button>
        </div>
        <div class="cart-badge" onclick="viewCart()" style="cursor: pointer;">🛒 <span id="cartCount">0</span></div>
      </div>
    </div>
  </header>

  <div id="home" class="page active">
    <div class="container">
      <div class="hero">
        <h1>Best Products</h1>
        <p>Curated products with exceptional quality and value</p>
      </div>

      <div class="filters">
        <button class="filter-btn active" onclick="filterProducts('all')">All</button>
        <button class="filter-btn" onclick="filterProducts('Audio')">Audio</button>
        <button class="filter-btn" onclick="filterProducts('Wearables')">Wearables</button>
        <button class="filter-btn" onclick="filterProducts('Input')">Input</button>
        <button class="filter-btn" onclick="filterProducts('Power')">Power</button>
        <button class="filter-btn" onclick="filterProducts('Cables')">Cables</button>
      </div>

      <div class="products-grid" id="products"></div>
    </div>
  </div>

  <div id="orders" class="page">
    <div class="container">
      <div class="hero">
        <h1>Your Orders</h1>
        <p>Track and manage your purchases</p>
      </div>
      <div class="orders-list" id="ordersList"></div>
    </div>
  </div>

  <div id="admin" class="page">
    <div class="container">
      <div class="hero">
        <h1>Admin Dashboard</h1>
        <p>Manage your store</p>
      </div>
      
      <div class="admin-dashboard">
        <div class="admin-stats">
          <div class="stat-card">
            <div class="stat-value" id="statProducts">0</div>
            <div class="stat-label">Products</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="statUsers">0</div>
            <div class="stat-label">Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="statOrders">0</div>
            <div class="stat-label">Orders</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">$<span id="statRevenue">0</span></div>
            <div class="stat-label">Revenue</div>
          </div>
        </div>

        <div class="admin-nav">
          <div class="admin-nav-item active" onclick="switchAdminTab('products')">📦 Products</div>
          <div class="admin-nav-item" onclick="switchAdminTab('orders')">📋 Orders</div>
          <div class="admin-nav-item" onclick="switchAdminTab('users')">👥 Users</div>
        </div>

        <div id="productsTab" class="admin-section active">
          <button class="btn-primary" onclick="showAddProductModal()" style="margin-bottom: 24px;">+ Add Product</button>
          <div class="table-wrapper">
            <table id="productsTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="productsTableBody"></tbody>
            </table>
          </div>
        </div>

        <div id="ordersTab" class="admin-section">
          <div class="table-wrapper">
            <table id="ordersTable">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="ordersTableBody"></tbody>
            </table>
          </div>
        </div>

        <div id="usersTab" class="admin-section">
          <div class="table-wrapper">
            <table id="usersTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="usersTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="signInModal" class="modal">
    <div class="modal-content">
      <span class="close-btn" onclick="closeModal('signInModal')">&times;</span>
      <div class="modal-title">Welcome Back</div>
      <div class="modal-subtitle">Sign in to your account to continue</div>
      <form onsubmit="handleSignIn(event)">
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="signInEmail" placeholder="you@example.com" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="signInPassword" placeholder="Enter your password" required>
        </div>
        <button type="submit" class="submit-btn">→ Sign In</button>
      </form>
      <div class="toggle-form">Don't have an account? <a onclick="switchToSignUp()">Create one</a></div>
    </div>
  </div>

  <div id="signUpModal" class="modal">
    <div class="modal-content">
      <span class="close-btn" onclick="closeModal('signUpModal')">&times;</span>
      <div class="modal-title">Create Account</div>
      <div class="modal-subtitle">Join us to start shopping</div>
      <form onsubmit="handleSignUp(event)">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="signUpName" placeholder="Your name" required>
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="signUpEmail" placeholder="you@example.com" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="signUpPassword" placeholder="Create a password" required>
        </div>
        <button type="submit" class="submit-btn">Create Account</button>
      </form>
      <div class="toggle-form">Already have an account? <a onclick="switchToSignIn()">Sign in</a></div>
    </div>
  </div>

  <div id="adminLoginModal" class="modal">
    <div class="modal-content">
      <span class="close-btn" onclick="closeModal('adminLoginModal')">&times;</span>
      <div class="modal-title">🔐 Admin Login</div>
      <form onsubmit="handleAdminLogin(event)">
        <div class="form-group">
          <label>Admin Email</label>
          <input type="email" id="adminEmail" required>
        </div>
        <div class="form-group">
          <label>Admin Password</label>
          <input type="password" id="adminPassword" required>
        </div>
        <button type="submit" class="submit-btn">Admin Login</button>
      </form>
    </div>
  </div>

  <div id="addProductModal" class="modal">
    <div class="modal-content">
      <span class="close-btn" onclick="closeModal('addProductModal')">&times;</span>
      <div class="modal-title">Add Product</div>
      <form onsubmit="handleAddProduct(event)">
        <div class="form-group">
          <label>Product Name</label>
          <input type="text" id="productName" required>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="productDesc" rows="3" required></textarea>
        </div>
        <div class="form-group">
          <label>Category</label>
          <select id="productCategory" required>
            <option>Audio</option>
            <option>Wearables</option>
            <option>Cables</option>
            <option>Protection</option>
            <option>Power</option>
            <option>Accessories</option>
            <option>Input</option>
            <option>Video</option>
            <option>Lighting</option>
            <option>Organization</option>
            <option>Mounts</option>
            <option>Cooling</option>
            <option>Displays</option>
          </select>
        </div>
        <div class="form-group">
          <label>Price ($)</label>
          <input type="number" id="productPrice" step="0.01" required>
        </div>
        <div class="form-group">
          <label>Stock</label>
          <input type="number" id="productStock" required>
        </div>
        <div class="form-group">
          <label>Emoji Icon</label>
          <input type="text" id="productImage" placeholder="e.g., 🎧" maxlength="2" required>
        </div>
        <button type="submit" class="submit-btn">Add Product</button>
      </form>
    </div>
  </div>

  <footer>
    <p>&copy; 2026 Best Products. All rights reserved.</p>
  </footer>

  <script>
    let allProducts = [];
    let currentFilter = 'all';
    let cartCount = 0;
    let currentUser = null;
    let currentSessionId = null;
    let adminSessionId = null;

    function checkAuth() {
      const sessionId = localStorage.getItem('sessionId');
      const user = localStorage.getItem('user');
      const adminSession = localStorage.getItem('adminSessionId');
      
      if (sessionId && user) {
        currentSessionId = sessionId;
        currentUser = JSON.parse(user);
      }
      
      if (adminSession) {
        adminSessionId = adminSession;
      }
      
      updateAuthUI();
    }

    function updateAuthUI() {
      if (adminSessionId) {
        document.getElementById('adminSection').style.display = 'flex';
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('userSection').style.display = 'none';
      } else if (currentUser) {
        document.getElementById('userSection').style.display = 'flex';
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('adminSection').style.display = 'none';
        document.getElementById('userName').textContent = currentUser.name;
      } else {
        document.getElementById('authSection').style.display = 'flex';
        document.getElementById('userSection').style.display = 'none';
        document.getElementById('adminSection').style.display = 'none';
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
      } else if (pageName === 'admin') {
        if (!adminSessionId) {
          showAdminLogin();
          return;
        }
        loadAdminDashboard();
      } else if (pageName === 'home') {
        loadProducts();
      }
    }

    async function loadAdminDashboard() {
      try {
        const response = await fetch('/api/admin/stats', {
          headers: { 'x-admin-session': adminSessionId }
        });
        
        const stats = await response.json();
        document.getElementById('statProducts').textContent = stats.totalProducts;
        document.getElementById('statUsers').textContent = stats.totalUsers;
        document.getElementById('statOrders').textContent = stats.totalOrders;
        document.getElementById('statRevenue').textContent = stats.totalRevenue;
        
        loadAdminProducts();
        loadAdminOrders();
        loadAdminUsers();
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
      }
    }

    async function loadAdminProducts() {
      try {
        const response = await fetch('/api/admin/products', {
          headers: { 'x-admin-session': adminSessionId }
        });
        
        const products = await response.json();
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = products.map(p => \`
          <tr>
            <td>\${p.name}</td>
            <td>\${p.category}</td>
            <td>$\${p.price.toFixed(2)}</td>
            <td>\${p.stock}</td>
            <td>
              <div class="action-buttons">
                <button class="btn-small" onclick="editProduct('\${p.id}')">Edit</button>
                <button class="btn-danger" onclick="deleteProduct('\${p.id}')">Delete</button>
              </div>
            </td>
          </tr>
        \`).join('');
      } catch (err) {
        console.error('Error loading products:', err);
      }
    }

    async function loadAdminOrders() {
      try {
        const response = await fetch('/api/admin/orders', {
          headers: { 'x-admin-session': adminSessionId }
        });
        
        const orders = await response.json();
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = orders.map(o => \`
          <tr>
            <td>\${o.id.substr(0, 8)}</td>
            <td>\${o.userName}</td>
            <td>$\${o.total.toFixed(2)}</td>
            <td>
              <select onchange="updateOrderStatus('\${o.id}', this.value)" style="padding: 6px; border-radius: 4px; border: 1px solid #e5e5e5;">
                <option value="pending" \${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="processing" \${o.status === 'processing' ? 'selected' : ''}>Processing</option>
                <option value="shipped" \${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                <option value="completed" \${o.status === 'completed' ? 'selected' : ''}>Completed</option>
              </select>
            </td>
            <td>\${new Date(o.date).toLocaleDateString()}</td>
            <td>\${o.trackingNumber}</td>
          </tr>
        \`).join('');
      } catch (err) {
        console.error('Error loading orders:', err);
      }
    }

    async function loadAdminUsers() {
      try {
        const response = await fetch('/api/admin/users', {
          headers: { 'x-admin-session': adminSessionId }
        });
        
        const users = await response.json();
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = users.map(u => \`
          <tr>
            <td>\${u.name}</td>
            <td>\${u.email}</td>
            <td>\${new Date(u.joinDate).toLocaleDateString()}</td>
            <td>
              <span style="background: \${u.active ? '#c3fae8' : '#f8d7da'}; color: \${u.active ? '#0f5132' : '#721c24'}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                \${u.active ? 'Active' : 'Disabled'}
              </span>
            </td>
            <td>
              <button class="btn-small" onclick="toggleUserStatus('\${u.id}', \${!u.active})">
                \${u.active ? 'Disable' : 'Enable'}
              </button>
            </td>
          </tr>
        \`).join('');
      } catch (err) {
        console.error('Error loading users:', err);
      }
    }

    function switchAdminTab(tab) {
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
      
      document.getElementById(tab + 'Tab').classList.add('active');
      event.target.classList.add('active');
    }

    async function deleteProduct(productId) {
      if (!confirm('Are you sure you want to delete this product?')) return;
      
      try {
        await fetch(\`/api/admin/products/\${productId}\`, {
          method: 'DELETE',
          headers: { 'x-admin-session': adminSessionId }
        });
        loadAdminProducts();
      } catch (err) {
        alert('Error deleting product');
      }
    }

    async function updateOrderStatus(orderId, status) {
      try {
        await fetch(\`/api/admin/orders/\${orderId}\`, {
          method: 'PUT',
          headers: { 
            'x-admin-session': adminSessionId,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        });
      } catch (err) {
        alert('Error updating order');
      }
    }

    async function toggleUserStatus(userId, active) {
      try {
        await fetch(\`/api/admin/users/\${userId}\`, {
          method: 'PUT',
          headers: { 
            'x-admin-session': adminSessionId,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ active })
        });
        loadAdminUsers();
      } catch (err) {
        alert('Error updating user');
      }
    }

    function showAddProductModal() {
      document.getElementById('addProductModal').classList.add('active');
    }

    async function handleAddProduct(event) {
      event.preventDefault();
      
      const product = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDesc').value,
        category: document.getElementById('productCategory').value,
        price: document.getElementById('productPrice').value,
        stock: document.getElementById('productStock').value,
        image: document.getElementById('productImage').value
      };
      
      try {
        const response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 
            'x-admin-session': adminSessionId,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(product)
        });
        
        if (response.ok) {
          closeModal('addProductModal');
          loadAdminProducts();
          alert('✅ Product added successfully!');
        }
      } catch (err) {
        alert('Error adding product');
      }
    }

    async function loadOrders() {
      if (!currentUser) return;
      
      try {
        const response = await fetch(\`/api/orders/\${currentUser.id}\`);
        const userOrders = await response.json();
        
        const ordersList = document.getElementById('ordersList');
        
        if (userOrders.length === 0) {
          ordersList.innerHTML = '<div style="padding: 40px; text-align: center; color: #666;">No orders yet. Start shopping!</div>';
          return;
        }
        
        ordersList.innerHTML = userOrders.map(order => \`
          <div class="order-item">
            <div class="order-header">
              <div>
                <div class="order-id">Order #\${order.id.substr(0, 8)}</div>
                <div style="font-size: 12px; color: #999; margin-top: 4px;">\${new Date(order.date).toLocaleDateString()}</div>
              </div>
              <div style="text-align: right;">
                <div class="order-status \${order.status}">\${order.status}</div>
                <div class="order-total" style="margin-top: 8px;">$\${order.total.toFixed(2)}</div>
              </div>
            </div>
            <div class="order-items">
              <strong>Items:</strong> \${order.items.map(i => \`\${i.productName} (x\${i.quantity})\`).join(', ')}
            </div>
            <div class="order-tracking">
              <strong>Tracking:</strong> \${order.trackingNumber}
            </div>
          </div>
        \`).join('');
      } catch (err) {
        console.error('Error loading orders:', err);
      }
    }

    async function handleAdminLogin(event) {
      event.preventDefault();
      const email = document.getElementById('adminEmail').value;
      const password = document.getElementById('adminPassword').value;
      
      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
          adminSessionId = data.adminSessionId;
          localStorage.setItem('adminSessionId', adminSessionId);
          updateAuthUI();
          closeModal('adminLoginModal');
          alert('✅ Admin login successful!');
          showPage('admin');
        } else {
          alert('❌ ' + data.error);
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    function showAdminLogin() {
      document.getElementById('adminLoginModal').classList.add('active');
    }

    function signOutAdmin() {
      if (confirm('Are you sure you want to sign out as admin?')) {
        adminSessionId = null;
        localStorage.removeItem('adminSessionId');
        updateAuthUI();
        showPage('home');
        alert('✅ Admin signed out');
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
      alert(\`✅ Added "\${name}" to cart!\`);
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
        const proceed = confirm(\`You have \${cartCount} items in your cart. Proceed to checkout?\`);
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
          alert(\`✅ Order placed successfully!\\nOrder ID: \${data.order.id.substr(0, 8)}\\nTracking: \${data.order.trackingNumber}\`);
          loadOrders();
          showPage('orders');
        } else {
          alert('❌ Checkout failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('Checkout error:', err);
        alert('Error during checkout: ' + err.message);
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
  console.log(`✅ Best Products Store running on port ${PORT}`);
});
