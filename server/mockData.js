// In-memory mock data store for demo mode
const bcrypt = require('bcryptjs');

// Generate hashed passwords
const hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

// Mock Users
const users = [
    {
        _id: 'user_admin_001',
        name: 'Admin User',
        email: 'admin@scanmart.com',
        mobileNumber: '9999999999',
        password: hashPassword('admin123'),
        role: 'admin',
        createdAt: new Date()
    },
    {
        _id: 'user_demo_002',
        name: 'John Doe',
        email: 'user@scanmart.com',
        mobileNumber: '8888888888',
        password: hashPassword('user123'),
        role: 'user',
        createdAt: new Date()
    }
];

// Mock Products
const products = [
    {
        _id: 'prod_001',
        name: 'Fresh Milk',
        description: 'Farm fresh whole milk 1L',
        price: 65,
        category: 'Dairy',
        stock: 50,
        qrCode: 'SM-MILK-001',
        image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300',
        isActive: true
    },
    {
        _id: 'prod_002',
        name: 'Cheese Slices',
        description: 'Processed cheese slices pack',
        price: 120,
        category: 'Dairy',
        stock: 30,
        qrCode: 'SM-CHEESE-002',
        image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300',
        isActive: true
    },
    {
        _id: 'prod_003',
        name: 'Orange Juice',
        description: 'Fresh squeezed orange juice 1L',
        price: 85,
        category: 'Beverages',
        stock: 40,
        qrCode: 'SM-OJ-003',
        image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300',
        isActive: true
    },
    {
        _id: 'prod_004',
        name: 'Cola Drink',
        description: 'Refreshing cola 2L bottle',
        price: 95,
        category: 'Beverages',
        stock: 60,
        qrCode: 'SM-COLA-004',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300',
        isActive: true
    },
    {
        _id: 'prod_005',
        name: 'Potato Chips',
        description: 'Crispy salted chips 200g',
        price: 45,
        category: 'Snacks',
        stock: 80,
        qrCode: 'SM-CHIPS-005',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300',
        isActive: true
    },
    {
        _id: 'prod_006',
        name: 'Chocolate Bar',
        description: 'Dark chocolate 100g',
        price: 75,
        category: 'Snacks',
        stock: 100,
        qrCode: 'SM-CHOCO-006',
        image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300',
        isActive: true
    },
    {
        _id: 'prod_007',
        name: 'Basmati Rice',
        description: 'Premium basmati rice 5kg',
        price: 450,
        category: 'Groceries',
        stock: 25,
        qrCode: 'SM-RICE-007',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300',
        isActive: true
    },
    {
        _id: 'prod_008',
        name: 'Cooking Oil',
        description: 'Sunflower cooking oil 1L',
        price: 180,
        category: 'Groceries',
        stock: 35,
        qrCode: 'SM-OIL-008',
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300',
        isActive: true
    },
    {
        _id: 'prod_009',
        name: 'Fresh Apples',
        description: 'Red apples 1kg',
        price: 150,
        category: 'Fruits',
        stock: 45,
        qrCode: 'SM-APPLE-009',
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300',
        isActive: true
    },
    {
        _id: 'prod_010',
        name: 'Bananas',
        description: 'Fresh bananas 1 dozen',
        price: 60,
        category: 'Fruits',
        stock: 55,
        qrCode: 'SM-BANANA-010',
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300',
        isActive: true
    },
    {
        _id: 'prod_011',
        name: 'White Bread',
        description: 'Sliced white bread loaf',
        price: 40,
        category: 'Bakery',
        stock: 8,
        qrCode: 'SM-BREAD-011',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300',
        isActive: true
    },
    {
        _id: 'prod_012',
        name: 'Butter Cookies',
        description: 'Danish butter cookies 400g',
        price: 220,
        category: 'Bakery',
        stock: 5,
        qrCode: 'SM-COOKIE-012',
        image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300',
        isActive: true
    }
];

// Mock carts (userId -> cart)
const carts = {};

// Mock bills
const bills = [];

// Mock sales
const sales = [];

module.exports = {
    users,
    products,
    carts,
    bills,
    sales,

    // Helper methods
    findUserByEmail: (email) => users.find(u => u.email === email),
    findUserById: (id) => users.find(u => u._id === id),
    findProductById: (id) => products.find(p => p._id === id),
    findProductByQR: (qr) => products.find(p => p.qrCode === qr),
    getCart: (userId) => carts[userId] || { items: [], total: 0 },

    addUser: (user) => {
        user._id = 'user_' + Date.now();
        user.password = hashPassword(user.password);
        user.createdAt = new Date();
        users.push(user);
        return user;
    },

    addProduct: (product) => {
        product._id = 'prod_' + Date.now();
        product.qrCode = 'SM-' + Date.now();
        product.isActive = true;
        products.push(product);
        return product;
    },

    updateProduct: (id, updates) => {
        const product = products.find(p => p._id === id);
        if (product) {
            Object.assign(product, updates);
        }
        return product;
    },

    deleteProduct: (id) => {
        const index = products.findIndex(p => p._id === id);
        if (index > -1) {
            products.splice(index, 1);
            return true;
        }
        return false;
    },

    updateCart: (userId, items) => {
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        carts[userId] = { user: userId, items, total };
        return carts[userId];
    },

    addBill: (bill) => {
        bill._id = 'bill_' + Date.now();
        bill.billId = 'SM-' + Date.now().toString(36).toUpperCase();
        bill.createdAt = new Date();
        bills.push(bill);
        return bill;
    },

    addSale: (sale) => {
        sale._id = 'sale_' + Date.now();
        sale.date = new Date();
        sales.push(sale);
        return sale;
    }
};
