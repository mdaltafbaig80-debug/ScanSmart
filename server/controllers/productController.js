const QRCode = require('qrcode');
const supabase = require('../lib/supabase');

const CATEGORIES = ['Dairy', 'Beverages', 'Snacks', 'Groceries', 'Fruits', 'Vegetables', 'Bakery', 'Frozen', 'Personal Care', 'Household', 'Other'];

// Helper: compute effective price from product row
const computeEffectivePrice = (product) => {
    if (product.discount_percent > 0) {
        const validUntil = product.discount_valid_until ? new Date(product.discount_valid_until) : null;
        if (!validUntil || validUntil >= new Date()) {
            return product.price * (1 - product.discount_percent / 100);
        }
    }
    return product.price;
};

// Helper: add virtual fields
const withVirtuals = (product) => ({
    ...product,
    _id: product.id,
    effectivePrice: computeEffectivePrice(product),
    hasActiveDiscount: product.discount_percent > 0 && (!product.discount_valid_until || new Date(product.discount_valid_until) >= new Date()),
    stockStatus: product.stock === 0 ? 'Out of Stock' : product.stock < 10 ? 'Low Stock' : 'In Stock',
    discountPercent: product.discount_percent,
    discountValidUntil: product.discount_valid_until,
    isActive: product.is_active,
    qrCode: product.qr_code
});

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice, inStock } = req.query;

        let query = supabase.from('products').select('*').eq('is_active', true);

        if (category) query = query.eq('category', category);
        if (search) query = query.ilike('name', `%${search}%`);
        if (minPrice) query = query.gte('price', parseFloat(minPrice));
        if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
        if (inStock === 'true') query = query.gt('stock', 0);

        const { data: products, error } = await query.order('created_at', { ascending: false });

        if (error) return res.status(500).json({ message: 'Failed to fetch products', error: error.message });

        res.json(products.map(withVirtuals));
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch products', error: error.message });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !product) return res.status(404).json({ message: 'Product not found' });

        res.json(withVirtuals(product));
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch product', error: error.message });
    }
};

// Get product by QR code
exports.getProductByQR = async (req, res) => {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('qr_code', req.params.qrCode)
            .single();

        if (error || !product) return res.status(404).json({ message: 'Product not found' });

        res.json(withVirtuals(product));
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch product', error: error.message });
    }
};

// Add new product (Admin)
exports.addProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock, image, discountPercent, discountValidUntil, qrCode: customQrCode } = req.body;

        const qrCode = customQrCode || `SM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        // Parallelize QR code generation and DB insert for speed
        const [qrCodeImage, dbResult] = await Promise.all([
            QRCode.toDataURL(qrCode),
            supabase
                .from('products')
                .insert({
                    name,
                    description: description || '',
                    price,
                    category,
                    stock: stock || 0,
                    qr_code: qrCode,
                    image: image || '/images/default-product.png',
                    discount_percent: discountPercent || 0,
                    discount_valid_until: discountValidUntil || null,
                    is_active: true
                })
                .select('*')
                .single()
        ]);

        const { data: product, error } = dbResult;
        if (error) return res.status(500).json({ message: 'Failed to add product', error: error.message });

        res.status(201).json({
            message: 'Product added successfully',
            product: withVirtuals(product),
            qrCodeImage
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add product', error: error.message });
    }
};

// Update product (Admin)
exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock, image, isActive, discountPercent, discountValidUntil, qrCode } = req.body;

        const updateData = {
            name,
            description,
            price,
            category,
            stock,
            image,
            is_active: isActive,
            discount_percent: discountPercent,
            discount_valid_until: discountValidUntil,
            updated_at: new Date().toISOString()
        };

        if (qrCode) {
            updateData.qr_code = qrCode;
        }

        const { data: product, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', req.params.id)
            .select('*')
            .single();

        if (error || !product) return res.status(404).json({ message: 'Product not found' });

        res.json({ message: 'Product updated successfully', product: withVirtuals(product) });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update product', error: error.message });
    }
};

// Delete product (Admin)
exports.deleteProduct = async (req, res) => {
    try {
        // Run cascade deletes in parallel for speed
        await Promise.all([
            supabase.from('bill_items').delete().eq('product_id', req.params.id),
            supabase.from('sales').delete().eq('product_id', req.params.id),
            supabase.from('cart_items').delete().eq('product_id', req.params.id)
        ]);

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', req.params.id);

        if (error) {
            console.error("Delete Error:", error);
            return res.status(400).json({ message: 'Delete failed', error: error.message });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete product', error: error.message });
    }
};

// Update stock (Admin)
exports.updateStock = async (req, res) => {
    try {
        const { stock } = req.body;

        const { data: product, error } = await supabase
            .from('products')
            .update({ stock, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select('*')
            .single();

        if (error || !product) return res.status(404).json({ message: 'Product not found' });

        res.json({ message: 'Stock updated successfully', product: withVirtuals(product) });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update stock', error: error.message });
    }
};

// Get low stock products (Admin)
exports.getLowStock = async (req, res) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .lt('stock', 10)
            .eq('is_active', true)
            .order('stock', { ascending: true });

        if (error) return res.status(500).json({ message: 'Failed to fetch low stock products', error: error.message });

        res.json(products.map(withVirtuals));
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch low stock products', error: error.message });
    }
};

// Get categories — static list, cache for 5 minutes
exports.getCategories = async (req, res) => {
    res.set('Cache-Control', 'public, max-age=300');
    res.json(CATEGORIES);
};
