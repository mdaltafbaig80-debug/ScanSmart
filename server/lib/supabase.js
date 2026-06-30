const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_SUPABASE')) {
    console.warn('⚠️  Supabase credentials missing or placeholder. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in server/.env');
    // Return a dummy object so the app can boot - all calls will fail gracefully
    supabase = {
        from: () => ({
            select: () => ({ data: null, error: { message: 'Supabase not configured' } }),
            insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
            update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
            delete: () => ({ data: null, error: { message: 'Supabase not configured' } }),
            upsert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        }),
        rpc: () => ({ data: null, error: { message: 'Supabase not configured' } })
    };
} else {
    supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = supabase;
