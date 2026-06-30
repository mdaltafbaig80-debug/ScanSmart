const supabase = require('../lib/supabase');

// Helper: format cart with items and product data
const formatCart = async (userId) => {
    const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
            id,
            quantity,
            price,
            products (
                id, name, price, stock, image, category, qr_code,
                discount_percent, discount_valid_until, is_active
            )
        `)
        .eq('user_id', userId);

    if (error) throw error;

    const items = (cartItems || []).map(item => ({
        product: {
            ...item.products,
            _id: item.products.id,
            discountPercent: item.products.discount_percent,
            effectivePrice: computeEffectivePrice(item.products)
        },
        quantity: item.quantity,
        price: item.price,
        _id: item.id
    }));

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { items, total };
};

const computeEffectivePrice = (product) => {
    if (product.discount_percent > 0) {
        const validUntil = product.discount_valid_until ? new Date(product.discount_valid_until) : null;
        if (!validUntil || validUntil >= new Date()) {
            return product.price * (1 - product.discount_percent / 100);
        }
    }
    return product.price;
};

// Get user cart
exports.getCart = async (req, res) => {
    try {
        const cart = await formatCart(req.userId);
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
    }
};

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        // Get product
        const { data: product, error: pErr } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (pErr || !product) return res.status(404).json({ message: 'Product not found' });
        if (product.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });

        const priceToUse = computeEffectivePrice(product);

        // Check if already in cart
        const { data: existing } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', req.userId)
            .eq('product_id', productId)
            .single();

        if (existing) {
            await supabase
                .from('cart_items')
                .update({ quantity: existing.quantity + quantity, price: priceToUse })
                .eq('id', existing.id);
        } else {
            await supabase
                .from('cart_items')
                .insert({ user_id: req.userId, product_id: productId, quantity, price: priceToUse });
        }

        const cart = await formatCart(req.userId);
        res.json({ message: 'Item added to cart', cart });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add to cart', error: error.message });
    }
};

// Update cart item quantity
exports.updateQuantity = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (quantity < 1) return res.status(400).json({ message: 'Quantity must be at least 1' });

        // Check stock
        const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', productId)
            .single();

        if (!product || product.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        const { error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('user_id', req.userId)
            .eq('product_id', productId);

        if (error) return res.status(404).json({ message: 'Item not found in cart' });

        const cart = await formatCart(req.userId);
        res.json({ message: 'Quantity updated', cart });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update quantity', error: error.message });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', req.userId)
            .eq('product_id', productId);

        const cart = await formatCart(req.userId);
        res.json({ message: 'Item removed from cart', cart });
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove item', error: error.message });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        await supabase.from('cart_items').delete().eq('user_id', req.userId);
        res.json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to clear cart', error: error.message });
    }
};
