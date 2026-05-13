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

// Create user
app.post('/api/users', (req, res) => {
  const { email, name } = req.body;
  const userId = uuidv4();
  users.set(userId, { id: userId, email, name });
  carts.set(userId, []);
  res.json({ id: userId, email, name });
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
    .logo { font-size: 28px; font-weight: bold; }
    .cart-badge { background: #ff6b6b; color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    
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
    
    .cart-icon { position: fixed; bottom: 30px; right: 30px; background: #ff6b6b; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; cursor: pointer; box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4); transition: all 0.3s; }
    .cart-icon:hover { transform: scale(1.1); }
    .cart-count { position: absolute; top: -5px; right: -5px; background: #fff; color: #ff6b6b; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; }
    
    footer { background: #2d3748; color: white; padding: 40px 20px; text-align: center; margin-top: 60px; }
    .footer-content { max-width: 1200px; margin: 0 auto; }
    .footer-links { display: flex; justify-content: center; gap: 30px; margin-bottom: 20px; flex-wrap: wrap; }
    .footer-links a { color: #cbd5e0; text-decoration: none; transition: color 0.3s; }
    .footer-links a:hover { color: white; }
  </style>
</head>
<body>
  <header>
    <div class="header-content">
      <div class="logo">🛍️ Premium Tech Store</div>
      <div class="cart-badge">🛒 <span id="cartCount">0</span> items</div>
    </div>
  </header>

  <div class="container">
    <div class="hero">
      <h1>Best Tech Products Online</h1>
      <p>Premium accessories and electronics for your digital lifestyle</p>
    </div>

    <div class="filters">
      <button class="filter-btn active" onclick="filterProducts('all')">All Products</button>
      <button class="filter-btn" onclick="filterProducts('Audio')">🎧 Audio</button>
      <button class="filter-btn" onclick="filterProducts('Wearables')">⌚ Wearables</button>
      <button class="filter-btn" onclick="filterProducts('Input')">⌨️ Input Devices</button>
      <button class="filter-btn" onclick="filterProducts('Power')">🔋 Power</button>
      <button class="filter-btn" onclick="filterProducts('Cables')">🔌 Cables</button>
    </div>

    <div class="products-grid" id="products"></div>
  </div>

  <div class="cart-icon" onclick="viewCart()">
    🛒
    <div class="cart-count" id="cartBadge">0</div>
  </div>

  <footer>
    <div class="footer-content">
      <div class="footer-links">
        <a href="#">About Us</a>
        <a href="#">Contact</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
      </div>
      <p>&copy; 2026 Premium Tech Store. All rights reserved.</p>
    </div>
  </footer>

  <script>
    let allProducts = [];
    let currentFilter = 'all';
    let cartCount = 0;

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
      cartCount++;
      document.getElementById('cartCount').textContent = cartCount;
      document.getElementById('cartBadge').textContent = cartCount;
      alert(\`✅ Added "\${name}" ($\${price.toFixed(2)}) to cart!\`);
    }

    function viewCart() {
      if (cartCount === 0) {
        alert('Your cart is empty. Add some products first!');
      } else {
        alert(\`You have \${cartCount} items in your cart. Checkout coming soon!\`);
      }
    }

    loadProducts();
  </script>
</body>
</html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Premium Tech Store running on port ${PORT}`);
});
