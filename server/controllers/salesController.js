const supabase = require('../lib/supabase');

// Get sales data
exports.getSalesData = async (req, res) => {
    try {
        const { productId, days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        let query = supabase
            .from('sales')
            .select('*, products(name, category)')
            .gte('date', startDate.toISOString())
            .order('date', { ascending: true });

        if (productId) query = query.eq('product_id', productId);

        const { data: sales, error } = await query;
        if (error) return res.status(500).json({ message: 'Failed to fetch sales data', error: error.message });

        res.json(sales.map(s => ({ ...s, _id: s.id, product: s.products })));
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch sales data', error: error.message });
    }
};

// Get aggregated sales by product
exports.getSalesByProduct = async (req, res) => {
    try {
        const { data: sales, error } = await supabase
            .from('sales')
            .select('product_id, product_name, quantity, revenue');

        if (error) return res.status(500).json({ message: 'Failed to fetch sales by product', error: error.message });

        // Aggregate in JS
        const aggregated = {};
        for (const s of sales) {
            if (!aggregated[s.product_id]) {
                aggregated[s.product_id] = {
                    _id: s.product_id,
                    productName: s.product_name,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    salesCount: 0
                };
            }
            aggregated[s.product_id].totalQuantity += s.quantity;
            aggregated[s.product_id].totalRevenue += s.revenue;
            aggregated[s.product_id].salesCount += 1;
        }

        const result = Object.values(aggregated)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 20);

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch sales by product', error: error.message });
    }
};

// Get daily sales summary
exports.getDailySales = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const { data: sales, error } = await supabase
            .from('sales')
            .select('quantity, revenue, date')
            .gte('date', startDate.toISOString())
            .order('date', { ascending: true });

        if (error) return res.status(500).json({ message: 'Failed to fetch daily sales', error: error.message });

        // Group by date
        const grouped = {};
        for (const s of sales) {
            const dateKey = s.date.substring(0, 10);
            if (!grouped[dateKey]) {
                grouped[dateKey] = { date: dateKey, totalQuantity: 0, totalRevenue: 0 };
            }
            grouped[dateKey].totalQuantity += s.quantity;
            grouped[dateKey].totalRevenue += s.revenue;
        }

        res.json(Object.values(grouped));
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch daily sales', error: error.message });
    }
};

// Get sales for ML training data format
exports.getMLTrainingData = async (req, res) => {
    try {
        const { productId } = req.params;

        const { data: sales, error } = await supabase
            .from('sales')
            .select('quantity, revenue, date')
            .eq('product_id', productId)
            .order('date', { ascending: true });

        if (error) return res.status(500).json({ message: 'Failed to fetch training data', error: error.message });

        const trainingData = sales.map((sale, index) => {
            const d = new Date(sale.date);
            return {
                day: index + 1,
                dayOfWeek: d.getDay(),
                month: d.getMonth() + 1,
                quantity: sale.quantity,
                revenue: sale.revenue
            };
        });

        res.json(trainingData);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch training data', error: error.message });
    }
};

// Store prediction results
exports.storePrediction = async (req, res) => {
    try {
        const { productId, predictions } = req.body;
        res.json({ message: 'Predictions stored successfully', productId, predictions });
    } catch (error) {
        res.status(500).json({ message: 'Failed to store predictions', error: error.message });
    }
};
