const supabase = require('../lib/supabase');

const generateBillId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SM-${timestamp}-${random}`;
};

// Generate bill from cart
exports.generateBill = async (req, res) => {
    try {
        const { paymentMethod = 'upi', discountCode, discountAmount = 0 } = req.body;

        // Get cart items
        const { data: cartItems, error: cartErr } = await supabase
            .from('cart_items')
            .select('quantity, price, products(id, name, stock)')
            .eq('user_id', req.userId);

        if (cartErr || !cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const TAX_RATE = 18;
        let subtotal = 0;
        const billItems = [];

        for (const item of cartItems) {
            const product = item.products;
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                });
            }
            const itemSubtotal = item.price * item.quantity;
            subtotal += itemSubtotal;
            billItems.push({
                product_id: product.id,
                name: product.name,
                quantity: item.quantity,
                price: item.price,
                subtotal: itemSubtotal,
                is_returned: false,
                returned_quantity: 0
            });
        }

        // Validate discount
        let appliedDiscount = 0;
        if (discountCode && discountAmount > 0) {
            const { data: discount } = await supabase
                .from('discounts')
                .select('id, used_count')
                .eq('code', discountCode.toUpperCase())
                .single();

            if (discount) {
                appliedDiscount = Math.min(discountAmount, subtotal);
                await supabase
                    .from('discounts')
                    .update({ used_count: discount.used_count + 1 })
                    .eq('id', discount.id);
            }
        }

        const taxableAmount = subtotal - appliedDiscount;
        const tax = (taxableAmount * TAX_RATE) / 100;
        const total = taxableAmount + tax;

        // Create bill
        const { data: bill, error: billErr } = await supabase
            .from('bills')
            .insert({
                bill_id: generateBillId(),
                user_id: req.userId,
                subtotal,
                discount: appliedDiscount,
                discount_code: discountCode || null,
                tax,
                tax_rate: TAX_RATE,
                total,
                payment_method: paymentMethod,
                payment_status: 'completed'
            })
            .select('*')
            .single();

        if (billErr) return res.status(500).json({ message: 'Failed to create bill', error: billErr.message });

        // Insert bill items
        const billItemsWithBillId = billItems.map(item => ({ ...item, bill_id: bill.id }));
        await supabase.from('bill_items').insert(billItemsWithBillId);

        // Update stock and record sales in parallel
        await Promise.all(cartItems.map(item => {
            const product = item.products;
            return Promise.all([
                supabase
                    .from('products')
                    .update({ stock: product.stock - item.quantity })
                    .eq('id', product.id),
                supabase.from('sales').insert({
                    product_id: product.id,
                    product_name: product.name,
                    quantity: item.quantity,
                    revenue: item.price * item.quantity
                })
            ]);
        }));

        // Clear cart
        await supabase.from('cart_items').delete().eq('user_id', req.userId);

        res.status(201).json({ message: 'Bill generated successfully', bill: { ...bill, items: billItems } });
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate bill', error: error.message });
    }
};

// Get user bills
exports.getUserBills = async (req, res) => {
    try {
        const { data: bills, error } = await supabase
            .from('bills')
            .select('*, bill_items(*)')
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ message: 'Failed to fetch bills', error: error.message });

        const formatted = bills.map(b => ({ ...b, _id: b.id, billId: b.bill_id, items: b.bill_items }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch bills', error: error.message });
    }
};

// Get bill by ID — SECURITY: user can only see their own bills
exports.getBillById = async (req, res) => {
    try {
        const { data: bill, error } = await supabase
            .from('bills')
            .select('*, bill_items(*), users(name, email)')
            .eq('id', req.params.id)
            .single();

        if (error || !bill) return res.status(404).json({ message: 'Bill not found' });

        // SECURITY: Broken Access Control fix — ensure requester owns the bill or is admin
        if (bill.user_id !== req.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({ ...bill, _id: bill.id, billId: bill.bill_id, items: bill.bill_items });
    } catch (error) {
        console.error('[billController.getBillById]', error.message);
        res.status(500).json({ message: 'Failed to fetch bill' });
    }
};

// Get all bills (Admin)
exports.getAllBills = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;

        let query = supabase
            .from('bills')
            .select('*, bill_items(*), users(name, email)')
            .order('created_at', { ascending: false });

        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);
        if (status) query = query.eq('payment_status', status);

        const { data: bills, error } = await query;
        if (error) return res.status(500).json({ message: 'Failed to fetch bills', error: error.message });

        const formatted = bills.map(b => ({ ...b, _id: b.id, billId: b.bill_id, items: b.bill_items }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch bills', error: error.message });
    }
};

// Get dashboard stats (Admin)
exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const { data: allBills } = await supabase
            .from('bills')
            .select('total, created_at')
            .eq('payment_status', 'completed');

        const totalRevenue = allBills?.reduce((s, b) => s + b.total, 0) || 0;
        const todayRevenue = allBills?.filter(b => new Date(b.created_at) >= today).reduce((s, b) => s + b.total, 0) || 0;
        const monthRevenue = allBills?.filter(b => new Date(b.created_at) >= thisMonth).reduce((s, b) => s + b.total, 0) || 0;
        const totalOrders = allBills?.length || 0;
        const todayOrders = allBills?.filter(b => new Date(b.created_at) >= today).length || 0;

        const { data: lowStockProducts } = await supabase
            .from('products')
            .select('id')
            .lt('stock', 10)
            .eq('is_active', true);
        const lowStockCount = lowStockProducts?.length || 0;

        const { data: recentBills } = await supabase
            .from('bills')
            .select('*, users(name)')
            .eq('payment_status', 'completed')
            .order('created_at', { ascending: false })
            .limit(5);

        res.json({
            totalRevenue, todayRevenue, monthRevenue,
            totalOrders, todayOrders, lowStockCount,
            recentBills: recentBills || []
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
    }
};

// Process item return (Admin)
exports.processReturn = async (req, res) => {
    try {
        const { billId, itemIndex, returnQuantity, reason } = req.body;

        const { data: bill, error } = await supabase
            .from('bills')
            .select('*, bill_items(*)')
            .eq('id', billId)
            .single();

        if (error || !bill) return res.status(404).json({ message: 'Bill not found' });

        const items = bill.bill_items;
        if (itemIndex < 0 || itemIndex >= items.length) {
            return res.status(400).json({ message: 'Invalid item index' });
        }

        const item = items[itemIndex];
        const qtyToReturn = returnQuantity || item.quantity;
        const alreadyReturned = item.returned_quantity || 0;
        const maxReturnable = item.quantity - alreadyReturned;

        if (qtyToReturn > maxReturnable) {
            return res.status(400).json({ message: `Cannot return ${qtyToReturn}. Max: ${maxReturnable}` });
        }

        const refundAmount = item.price * qtyToReturn;
        const taxRate = bill.tax_rate || 18;
        const refundTax = (refundAmount * taxRate) / 100;
        const totalRefund = refundAmount + refundTax;
        const newReturnedQty = alreadyReturned + qtyToReturn;

        // Update bill_item
        await supabase
            .from('bill_items')
            .update({
                returned_quantity: newReturnedQty,
                is_returned: newReturnedQty === item.quantity,
                return_date: new Date().toISOString(),
                return_reason: reason || 'Customer return'
            })
            .eq('id', item.id);

        // Update bill totals
        await supabase
            .from('bills')
            .update({
                subtotal: Math.max(0, bill.subtotal - refundAmount),
                tax: Math.max(0, bill.tax - refundTax),
                total: Math.max(0, bill.total - totalRefund)
            })
            .eq('id', billId);

        // Restore stock
        await supabase.rpc('increment_stock', { pid: item.product_id, qty: qtyToReturn });

        res.json({
            message: `Successfully returned ${qtyToReturn} x ${item.name}. Refund: ₹${totalRefund.toFixed(2)}`,
            refund: { items: qtyToReturn, amount: refundAmount, tax: refundTax, total: totalRefund }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to process return', error: error.message });
    }
};
