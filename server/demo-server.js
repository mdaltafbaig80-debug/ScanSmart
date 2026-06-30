const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mockData = require('./mockData');

const app = express();
const JWT_SECRET = 'scanmart_demo_secret_key';

// Middleware
app.use(cors());
app.use(express.json());

// Auth Middleware
const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token' });

        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.user = mockData.findUserById(decoded.userId);
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

const adminAuth = (req, res, next) => {
    auth(req, res, () => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Admin only' });
        }
        next();
    });
};

// ============ AUTH ROUTES ============
app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role } = req.body;

    if (mockData.findUserByEmail(email)) {
        return res.status(400).json({ message: 'Email already registered' });
    }

    const user = mockData.addUser({ name, email, password, role: role || 'user' });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
        message: 'Registration successful',
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = mockData.findUserByEmail(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
        message: 'Login successful',
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
});

app.get('/api/auth/me', auth, (req, res) => {
    res.json({
        user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role }
    });
});

// ============ PRODUCT ROUTES ============
app.get('/api/products', (req, res) => {
    let filtered = mockData.products.filter(p => p.isActive);

    const { category, search, inStock } = req.query;
    if (category) filtered = filtered.filter(p => p.category === category);
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (inStock === 'true') filtered = filtered.filter(p => p.stock > 0);

    res.json(filtered);
});

app.get('/api/products/categories', (req, res) => {
    res.json(['Dairy', 'Beverages', 'Snacks', 'Groceries', 'Fruits', 'Vegetables', 'Bakery', 'Frozen', 'Personal Care', 'Household', 'Other']);
});

app.get('/api/products/qr/:qrCode', (req, res) => {
    const product = mockData.findProductByQR(req.params.qrCode);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
});

app.get('/api/products/:id', (req, res) => {
    const product = mockData.findProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
});

app.post('/api/products', adminAuth, (req, res) => {
    const product = mockData.addProduct(req.body);
    res.status(201).json({ message: 'Product added', product });
});

app.put('/api/products/:id', adminAuth, (req, res) => {
    const product = mockData.updateProduct(req.params.id, req.body);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated', product });
});

app.delete('/api/products/:id', adminAuth, (req, res) => {
    const deleted = mockData.deleteProduct(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
});

app.get('/api/products/admin/low-stock', adminAuth, (req, res) => {
    const lowStock = mockData.products.filter(p => p.stock < 10 && p.isActive);
    res.json(lowStock);
});

// ============ CART ROUTES ============
app.get('/api/cart', auth, (req, res) => {
    const cart = mockData.getCart(req.userId);
    // Populate products
    cart.items = cart.items.map(item => ({
        ...item,
        product: mockData.findProductById(item.productId) || { _id: item.productId, name: 'Unknown', price: item.price }
    }));
    res.json(cart);
});

app.post('/api/cart/add', auth, (req, res) => {
    const { productId, quantity = 1 } = req.body;
    const product = mockData.findProductById(productId);

    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });

    const cart = mockData.getCart(req.userId);
    const existing = cart.items.find(i => i.productId === productId);

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.items.push({ productId, quantity, price: product.price });
    }

    const updatedCart = mockData.updateCart(req.userId, cart.items);
    updatedCart.items = updatedCart.items.map(item => ({
        ...item,
        product: mockData.findProductById(item.productId)
    }));

    res.json({ message: 'Added to cart', cart: updatedCart });
});

app.put('/api/cart/update', auth, (req, res) => {
    const { productId, quantity } = req.body;
    const cart = mockData.getCart(req.userId);
    const item = cart.items.find(i => i.productId === productId);

    if (item) {
        item.quantity = quantity;
        const updatedCart = mockData.updateCart(req.userId, cart.items);
        updatedCart.items = updatedCart.items.map(i => ({
            ...i,
            product: mockData.findProductById(i.productId)
        }));
        res.json({ message: 'Updated', cart: updatedCart });
    } else {
        res.status(404).json({ message: 'Item not in cart' });
    }
});

app.delete('/api/cart/remove/:productId', auth, (req, res) => {
    const cart = mockData.getCart(req.userId);
    cart.items = cart.items.filter(i => i.productId !== req.params.productId);
    const updatedCart = mockData.updateCart(req.userId, cart.items);
    updatedCart.items = updatedCart.items.map(i => ({
        ...i,
        product: mockData.findProductById(i.productId)
    }));
    res.json({ message: 'Removed', cart: updatedCart });
});

app.delete('/api/cart/clear', auth, (req, res) => {
    mockData.updateCart(req.userId, []);
    res.json({ message: 'Cart cleared' });
});

// ============ BILL ROUTES ============
app.post('/api/bills/generate', auth, (req, res) => {
    const { paymentMethod = 'upi' } = req.body;
    const cart = mockData.getCart(req.userId);

    if (!cart.items.length) return res.status(400).json({ message: 'Cart is empty' });

    const TAX_RATE = 18;
    let subtotal = 0;
    const billItems = [];

    for (const item of cart.items) {
        const product = mockData.findProductById(item.productId);
        if (product) {
            const itemSubtotal = item.price * item.quantity;
            subtotal += itemSubtotal;
            billItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price: item.price,
                subtotal: itemSubtotal
            });
            product.stock -= item.quantity;

            // Record sale
            mockData.addSale({
                product: product._id,
                productName: product.name,
                quantity: item.quantity,
                revenue: itemSubtotal
            });
        }
    }

    const tax = (subtotal * TAX_RATE) / 100;
    const total = subtotal + tax;

    const bill = mockData.addBill({
        user: req.userId,
        items: billItems,
        subtotal,
        tax,
        taxRate: TAX_RATE,
        total,
        paymentMethod,
        paymentStatus: 'completed'
    });

    mockData.updateCart(req.userId, []);
    res.status(201).json({ message: 'Bill generated', bill });
});

app.get('/api/bills/my-bills', auth, (req, res) => {
    const userBills = mockData.bills.filter(b => b.user === req.userId);
    res.json(userBills);
});

app.get('/api/bills', adminAuth, (req, res) => {
    res.json(mockData.bills);
});

app.get('/api/bills/admin/stats', adminAuth, (req, res) => {
    const totalRevenue = mockData.bills.reduce((sum, b) => sum + b.total, 0);
    const lowStockCount = mockData.products.filter(p => p.stock < 10 && p.isActive).length;

    res.json({
        totalRevenue,
        todayRevenue: totalRevenue,
        monthRevenue: totalRevenue,
        totalOrders: mockData.bills.length,
        todayOrders: mockData.bills.length,
        lowStockCount,
        recentBills: mockData.bills.slice(-5).reverse()
    });
});

app.get('/api/bills/:id', auth, (req, res) => {
    const bill = mockData.bills.find(b => b._id === req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
});

// ============ CHATBOT ROUTES ============
app.post('/api/chatbot/message', (req, res) => {
    const { message } = req.body;
    const lowerMsg = message.toLowerCase();

    let response = { message: '', action: null, data: null };

    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
        response.message = "Hello! 👋 Welcome to ScanMart. How can I help you today?";
    } else if (lowerMsg.includes('cart')) {
        response.message = "Taking you to your cart! 🛒";
        response.action = { type: 'NAVIGATE', route: '/cart' };
    } else if (lowerMsg.includes('product') || lowerMsg.includes('shop')) {
        response.message = "Here are our products! 📦";
        response.action = { type: 'NAVIGATE', route: '/products' };
    } else if (lowerMsg.includes('scan')) {
        response.message = "Opening the scanner! 📷";
        response.action = { type: 'NAVIGATE', route: '/scan' };
    } else if (lowerMsg.includes('help')) {
        response.message = "I can help you with:\n🔍 Finding products\n🛒 Cart operations\n📷 QR scanning\nJust ask!";
    } else {
        // Search products
        const found = mockData.products.filter(p =>
            p.name.toLowerCase().includes(lowerMsg) && p.isActive
        ).slice(0, 3);

        if (found.length > 0) {
            response.message = `I found ${found.length} product(s):`;
            response.data = found;
            response.action = { type: 'SHOW_PRODUCTS', route: '/products' };
        } else {
            response.message = "I'm not sure I understood. Try 'show products' or 'go to cart'!";
        }
    }

    res.json(response);
});

app.get('/api/chatbot/search', (req, res) => {
    const { query } = req.query;
    const products = mockData.products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) && p.isActive
    ).slice(0, 5);
    res.json(products);
});

// ============ SALES ROUTES ============
app.get('/api/sales', adminAuth, (req, res) => {
    res.json(mockData.sales);
});

app.get('/api/sales/by-product', adminAuth, (req, res) => {
    const grouped = {};
    mockData.sales.forEach(s => {
        if (!grouped[s.product]) {
            grouped[s.product] = { _id: s.product, productName: s.productName, totalQuantity: 0, totalRevenue: 0 };
        }
        grouped[s.product].totalQuantity += s.quantity;
        grouped[s.product].totalRevenue += s.revenue;
    });
    res.json(Object.values(grouped));
});

app.get('/api/sales/daily', adminAuth, (req, res) => {
    // Return mock daily data
    const days = [];
    for (let i = 30; i >= 0; i--) {
        days.push({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
            totalRevenue: Math.floor(Math.random() * 5000) + 1000,
            totalQuantity: Math.floor(Math.random() * 50) + 10
        });
    }
    res.json(days);
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mode: 'DEMO (Mock Data)', message: 'ScanMart API running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 ScanMart DEMO Server running on port ${PORT}`);
    console.log(`\n📋 Demo Login Credentials:`);
    console.log(`   Admin: admin@scanmart.com / admin123`);
    console.log(`   User:  user@scanmart.com / user123`);
    console.log(`\n✨ No MongoDB required - using in-memory data\n`);
});
