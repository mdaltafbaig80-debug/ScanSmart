const supabase = require('../lib/supabase');

exports.getSettings = async (req, res) => {
    try {
        const { data, error } = await supabase.from('settings').select('*').limit(1).single();
        
        if (error && error.code !== 'PGRST116') { // Ignore "no rows returned"
            console.error('Fetch Settings Error:', error);
            // Default fallback
            return res.json({
                address: '123 Smart Mall, Tech City, TC 12345',
                phone: '+1 (555) 123-4567',
                email: 'support@scanmart.com'
            });
        }
        
        res.json(data || {
            address: '123 Smart Mall, Tech City, TC 12345',
            phone: '+1 (555) 123-4567',
            email: 'support@scanmart.com'
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { address, phone, email } = req.body;
        
        const { data: existing } = await supabase.from('settings').select('id').limit(1).single();
        
        let result;
        if (existing) {
            result = await supabase.from('settings')
                .update({ address, phone, email })
                .eq('id', existing.id);
        } else {
            result = await supabase.from('settings')
                .insert([{ address, phone, email }]);
        }

        if (result.error) {
            console.error('Update Settings Error:', result.error);
            return res.status(500).json({ message: 'Failed to update settings' });
        }
        
        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
