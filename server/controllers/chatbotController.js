const Product = require('../models/Product');
const Cart = require('../models/Cart');

// Intent patterns for chatbot
const INTENTS = {
    SEARCH_PRODUCT: ['show me', 'where is', 'find', 'search', 'looking for', 'do you have'],
    ADD_TO_CART: ['add to cart', 'buy', 'add', 'get me', 'i want', 'purchase'],
    VIEW_CART: ['cart', 'my cart', 'basket', 'shopping cart', 'view cart'],
    CHECK_PRICE: ['price of', 'how much', 'cost of', 'what is the price'],
    NAVIGATE: ['go to', 'take me to', 'navigate to', 'open', 'show page'],
    GET_TOTAL: ['total', 'bill amount', 'cart total', 'how much total'],
    OFFERS: ['offers', 'discount', 'deals', 'sale', 'promotion'],
    HELP: ['help', 'assist', 'what can you do', 'commands'],
    GREETING: ['hello', 'hi', 'hey', 'good morning', 'good evening']
};

// Page mappings
const PAGE_ROUTES = {
    'home': '/',
    'products': '/products',
    'cart': '/cart',
    'scan': '/scan',
    'bill': '/bill',
    'profile': '/profile',
    'login': '/login',
    'signup': '/signup'
};

// Category mappings
const CATEGORY_KEYWORDS = {
    'milk': 'Dairy',
    'cheese': 'Dairy',
    'yogurt': 'Dairy',
    'butter': 'Dairy',
    'juice': 'Beverages',
    'soda': 'Beverages',
    'water': 'Beverages',
    'coffee': 'Beverages',
    'tea': 'Beverages',
    'chips': 'Snacks',
    'cookies': 'Snacks',
    'biscuits': 'Snacks',
    'chocolate': 'Snacks',
    'rice': 'Groceries',
    'flour': 'Groceries',
    'sugar': 'Groceries',
    'oil': 'Groceries',
    'bread': 'Bakery',
    'cake': 'Bakery'
};

// Detect intent from message
const detectIntent = (message) => {
    const lowerMessage = message.toLowerCase();

    for (const [intent, patterns] of Object.entries(INTENTS)) {
        for (const pattern of patterns) {
            if (lowerMessage.includes(pattern)) {
                return { intent, pattern };
            }
        }
    }

    return { intent: 'UNKNOWN', pattern: null };
};

// Extract product name from message
const extractProductName = (message, pattern) => {
    const lowerMessage = message.toLowerCase();
    let productQuery = lowerMessage;

    if (pattern) {
        const index = lowerMessage.indexOf(pattern);
        productQuery = lowerMessage.substring(index + pattern.length).trim();
    }

    // Remove common words
    productQuery = productQuery.replace(/please|the|a|an|some|any/gi, '').trim();

    return productQuery;
};

// Main chatbot handler
exports.handleMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.userId;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const { intent, pattern } = detectIntent(message);
        let response = {
            message: '',
            action: null,
            data: null
        };

        switch (intent) {
            case 'GREETING':
                response.message = "Hello! 👋 Welcome to ScanMart. I'm your shopping assistant. How can I help you today? You can ask me to find products, check prices, or navigate to any page!";
                break;

            case 'HELP':
                response.message = `Here's what I can help you with:
        
🔍 Find products: "Show me milk" or "Find chocolates"
💰 Check prices: "What is the price of rice?"
🛒 Cart operations: "Go to cart" or "What's my total?"
📱 Navigate: "Go to products" or "Take me to scan page"
🏷️ Offers: "Show me offers"

Just type naturally and I'll assist you!`;
                break;

            case 'SEARCH_PRODUCT':
                const searchQuery = extractProductName(message, pattern);
                const products = await Product.find({
                    $or: [
                        { name: { $regex: searchQuery, $options: 'i' } },
                        { category: { $regex: searchQuery, $options: 'i' } }
                    ],
                    isActive: true
                }).limit(5);

                if (products.length > 0) {
                    response.message = `I found ${products.length} product(s) matching "${searchQuery}":`;
                    response.data = products.map(p => ({
                        id: p._id,
                        name: p.name,
                        price: p.price,
                        stock: p.stock,
                        category: p.category
                    }));
                    response.action = { type: 'SHOW_PRODUCTS', route: `/products?search=${searchQuery}` };
                } else {
                    response.message = `Sorry, I couldn't find any products matching "${searchQuery}". Try searching for something else or browse our products page.`;
                    response.action = { type: 'NAVIGATE', route: '/products' };
                }
                break;

            case 'CHECK_PRICE':
                const priceQuery = extractProductName(message, pattern);
                const product = await Product.findOne({
                    name: { $regex: priceQuery, $options: 'i' },
                    isActive: true
                });

                if (product) {
                    response.message = `💰 ${product.name} is ₹${product.price.toFixed(2)}. ${product.stock > 0 ? `We have ${product.stock} in stock!` : 'Currently out of stock.'}`;
                    response.data = { product };
                } else {
                    response.message = `I couldn't find the price for "${priceQuery}". Let me show you our products.`;
                    response.action = { type: 'NAVIGATE', route: '/products' };
                }
                break;

            case 'VIEW_CART':
                response.message = "Taking you to your shopping cart! 🛒";
                response.action = { type: 'NAVIGATE', route: '/cart' };
                break;

            case 'GET_TOTAL':
                if (userId) {
                    const cart = await Cart.findOne({ user: userId });
                    if (cart && cart.items.length > 0) {
                        response.message = `Your cart total is ₹${cart.total.toFixed(2)} (${cart.items.length} items). Ready to checkout?`;
                        response.action = { type: 'NAVIGATE', route: '/cart' };
                    } else {
                        response.message = "Your cart is empty. Let's find some products to add! 🛍️";
                        response.action = { type: 'NAVIGATE', route: '/products' };
                    }
                } else {
                    response.message = "Please login to view your cart total.";
                    response.action = { type: 'NAVIGATE', route: '/login' };
                }
                break;

            case 'NAVIGATE':
                const lowerMessage = message.toLowerCase();
                let targetRoute = '/';
                let pageName = 'home';

                for (const [page, route] of Object.entries(PAGE_ROUTES)) {
                    if (lowerMessage.includes(page)) {
                        targetRoute = route;
                        pageName = page;
                        break;
                    }
                }

                response.message = `Taking you to ${pageName} page! 🚀`;
                response.action = { type: 'NAVIGATE', route: targetRoute };
                break;

            case 'ADD_TO_CART':
                const addQuery = extractProductName(message, pattern);
                const productToAdd = await Product.findOne({
                    name: { $regex: addQuery, $options: 'i' },
                    isActive: true,
                    stock: { $gt: 0 }
                });

                if (productToAdd) {
                    response.message = `Found ${productToAdd.name} (₹${productToAdd.price}). Click to add it to your cart!`;
                    response.data = { product: productToAdd };
                    response.action = {
                        type: 'ADD_TO_CART',
                        productId: productToAdd._id,
                        route: '/products'
                    };
                } else {
                    response.message = `I couldn't find "${addQuery}" in stock. Let me show you available products.`;
                    response.action = { type: 'NAVIGATE', route: '/products' };
                }
                break;

            case 'OFFERS':
                response.message = "🎉 Check out our latest deals! We have special discounts on selected items.";
                response.action = { type: 'NAVIGATE', route: '/products' };
                break;

            default:
                // Try to understand as product search
                const fallbackProducts = await Product.find({
                    name: { $regex: message.split(' ').join('|'), $options: 'i' },
                    isActive: true
                }).limit(3);

                if (fallbackProducts.length > 0) {
                    response.message = `I found some products that might match what you're looking for:`;
                    response.data = fallbackProducts;
                    response.action = { type: 'SHOW_PRODUCTS', route: '/products' };
                } else {
                    response.message = "I'm not sure I understood that. Try asking me to find products, check prices, or navigate to a page. Type 'help' for more options!";
                }
        }

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Chatbot error', error: error.message });
    }
};

// Quick product search
exports.quickSearch = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const products = await Product.find({
            name: { $regex: query, $options: 'i' },
            isActive: true
        }).limit(5).select('name price stock category');

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Search failed', error: error.message });
    }
};
