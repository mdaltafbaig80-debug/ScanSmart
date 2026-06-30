const supabase = require('../lib/supabase');

// Get all discounts (Admin)
exports.getAllDiscounts = async (req, res) => {
    try {
        const { data: discounts, error } = await supabase
            .from('discounts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ message: 'Failed to fetch discounts', error: error.message });

        res.json(discounts.map(d => ({ ...d, _id: d.id })));
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch discounts', error: error.message });
    }
};

// Create discount (Admin)
exports.createDiscount = async (req, res) => {
    try {
        const { code, description, type, value, minPurchase, maxDiscount, validFrom, validUntil, usageLimit } = req.body;

        const { data: existing } = await supabase
            .from('discounts')
            .select('id')
            .eq('code', code.toUpperCase())
            .single();

        if (existing) return res.status(400).json({ message: 'Discount code already exists' });

        const { data: discount, error } = await supabase
            .from('discounts')
            .insert({
                code: code.toUpperCase(),
                description: description || '',
                type: type || 'percentage',
                value,
                min_purchase: minPurchase || 0,
                max_discount: maxDiscount || null,
                valid_from: validFrom || new Date().toISOString(),
                valid_until: validUntil,
                usage_limit: usageLimit || null,
                used_count: 0,
                is_active: true
            })
            .select('*')
            .single();

        if (error) return res.status(500).json({ message: 'Failed to create discount', error: error.message });

        res.status(201).json({ message: 'Discount created', discount: { ...discount, _id: discount.id } });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create discount', error: error.message });
    }
};

// Update discount (Admin) — SECURITY: explicit field whitelist prevents mass-assignment
exports.updateDiscount = async (req, res) => {
    try {
        const {
            code, description, type, value,
            minPurchase, maxDiscount, validFrom, validUntil,
            usageLimit, isActive
        } = req.body;

        // Only allow safe, known fields to be updated
        const updates = {};
        if (code       !== undefined) updates.code          = String(code).toUpperCase();
        if (description!== undefined) updates.description   = String(description);
        if (type       !== undefined) updates.type          = type;
        if (value      !== undefined) updates.value         = Number(value);
        if (minPurchase!== undefined) updates.min_purchase  = Number(minPurchase);
        if (maxDiscount!== undefined) updates.max_discount  = Number(maxDiscount);
        if (validFrom  !== undefined) updates.valid_from    = validFrom;
        if (validUntil !== undefined) updates.valid_until   = validUntil;
        if (usageLimit !== undefined) updates.usage_limit   = Number(usageLimit);
        if (isActive   !== undefined) updates.is_active     = Boolean(isActive);
        // Never let a client reset used_count
        updates.updated_at = new Date().toISOString();

        const { data: discount, error } = await supabase
            .from('discounts')
            .update(updates)
            .eq('id', req.params.id)
            .select('*')
            .single();

        if (error || !discount) return res.status(404).json({ message: 'Discount not found' });

        res.json({ message: 'Discount updated', discount: { ...discount, _id: discount.id } });
    } catch (error) {
        console.error('[discountController.updateDiscount]', error.message);
        res.status(500).json({ message: 'Failed to update discount' });
    }
};


// Delete discount (Admin)
exports.deleteDiscount = async (req, res) => {
    try {
        const { error } = await supabase
            .from('discounts')
            .delete()
            .eq('id', req.params.id);

        if (error) return res.status(404).json({ message: 'Discount not found' });

        res.json({ message: 'Discount deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete discount', error: error.message });
    }
};

// Toggle discount active status (Admin)
exports.toggleDiscount = async (req, res) => {
    try {
        const { data: current } = await supabase
            .from('discounts')
            .select('is_active')
            .eq('id', req.params.id)
            .single();

        if (!current) return res.status(404).json({ message: 'Discount not found' });

        const { data: discount, error } = await supabase
            .from('discounts')
            .update({ is_active: !current.is_active })
            .eq('id', req.params.id)
            .select('*')
            .single();

        if (error) return res.status(500).json({ message: 'Failed to toggle discount', error: error.message });

        res.json({ message: `Discount ${discount.is_active ? 'activated' : 'deactivated'}`, discount: { ...discount, _id: discount.id } });
    } catch (error) {
        res.status(500).json({ message: 'Failed to toggle discount', error: error.message });
    }
};

// Validate discount code (Customer)
exports.validateDiscount = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;

        const { data: discount, error } = await supabase
            .from('discounts')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error || !discount) return res.status(404).json({ message: 'Invalid discount code' });

        const now = new Date();
        if (!discount.is_active) return res.status(400).json({ message: 'Discount is not active' });
        if (discount.valid_from && now < new Date(discount.valid_from)) return res.status(400).json({ message: 'Discount not yet valid' });
        if (now > new Date(discount.valid_until)) return res.status(400).json({ message: 'Discount has expired' });
        if (discount.usage_limit && discount.used_count >= discount.usage_limit) return res.status(400).json({ message: 'Discount usage limit reached' });
        if (cartTotal < discount.min_purchase) return res.status(400).json({ message: `Minimum purchase of ₹${discount.min_purchase} required` });

        let discountAmount = discount.type === 'percentage'
            ? (cartTotal * discount.value) / 100
            : discount.value;

        if (discount.max_discount && discountAmount > discount.max_discount) {
            discountAmount = discount.max_discount;
        }
        discountAmount = Math.min(discountAmount, cartTotal);

        res.json({
            valid: true,
            discount: { code: discount.code, type: discount.type, value: discount.value, discountAmount }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to validate discount', error: error.message });
    }
};
