// Simple seed script - run AFTER creating tables in Supabase SQL Editor
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const SEED_USERS = [
    { name: 'Admin User', email: 'admin@scanmart.com', mobile_number: '9999999999', password_hash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lihO', role: 'admin' },
    { name: 'John Doe', email: 'user@scanmart.com', mobile_number: '8888888888', password_hash: '$2a$10$Ks3yD0.E7GdAFoJ4Pj8aEeeK7J23WQAKNBJfVvNiXi53SBXUVXlji', role: 'user' }
];

const SEED_PRODUCTS = [
    { name: 'Fresh Milk', description: 'Farm fresh whole milk 1L', price: 65, category: 'Dairy', stock: 50, qr_code: 'SM-MILK-001', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300' },
    { name: 'Cheese Slices', description: 'Processed cheese slices pack', price: 120, category: 'Dairy', stock: 30, qr_code: 'SM-CHEESE-002', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300' },
    { name: 'Orange Juice', description: 'Fresh squeezed orange juice 1L', price: 85, category: 'Beverages', stock: 40, qr_code: 'SM-OJ-003', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300' },
    { name: 'Cola Drink', description: 'Refreshing cola 2L bottle', price: 95, category: 'Beverages', stock: 60, qr_code: 'SM-COLA-004', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300' },
    { name: 'Potato Chips', description: 'Crispy salted chips 200g', price: 45, category: 'Snacks', stock: 80, qr_code: 'SM-CHIPS-005', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300' },
    { name: 'Chocolate Bar', description: 'Dark chocolate 100g', price: 75, category: 'Snacks', stock: 100, qr_code: 'SM-CHOCO-006', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300' },
    { name: 'Basmati Rice', description: 'Premium basmati rice 5kg', price: 450, category: 'Groceries', stock: 25, qr_code: 'SM-RICE-007', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300' },
    { name: 'Cooking Oil', description: 'Sunflower cooking oil 1L', price: 180, category: 'Groceries', stock: 35, qr_code: 'SM-OIL-008', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300' },
    { name: 'Fresh Apples', description: 'Red apples 1kg', price: 150, category: 'Fruits', stock: 45, qr_code: 'SM-APPLE-009', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300' },
    { name: 'Bananas', description: 'Fresh bananas 1 dozen', price: 60, category: 'Fruits', stock: 55, qr_code: 'SM-BANANA-010', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300' },
    { name: 'White Bread', description: 'Sliced white bread loaf', price: 40, category: 'Bakery', stock: 20, qr_code: 'SM-BREAD-011', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300' },
    { name: 'Butter Cookies', description: 'Danish butter cookies 400g', price: 220, category: 'Bakery', stock: 15, qr_code: 'SM-COOKIE-012', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300' },
    { name: 'Shampoo', description: 'Anti-dandruff shampoo 400ml', price: 280, category: 'Personal Care', stock: 30, qr_code: 'SM-SHAMPOO-013', image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=300' },
    { name: 'Toothpaste', description: 'Mint toothpaste 150g', price: 95, category: 'Personal Care', stock: 40, qr_code: 'SM-TOOTH-014', image: 'https://images.unsplash.com/photo-1628359355624-855c87991fa8?w=300' },
    { name: 'Dish Soap', description: 'Liquid dish soap 750ml', price: 110, category: 'Household', stock: 35, qr_code: 'SM-DISH-015', image: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=300' }
];

async function seed() {
    console.log('🌱 ScanMart Supabase Seeder\n');

    // Test connection first
    const { data: test, error: testErr } = await supabase.from('users').select('id').limit(1);
    if (testErr) {
        console.error('❌ Cannot connect to Supabase or tables missing.');
        console.error('   Error:', testErr.message);
        console.error('\n👉 Please run supabase_schema.sql in Supabase SQL Editor first!\n');
        process.exit(1);
    }
    console.log('✅ Connected to Supabase\n');

    // Seed users
    console.log('👤 Seeding users...');
    for (const user of SEED_USERS) {
        const { error } = await supabase.from('users').upsert(user, { onConflict: 'email' });
        if (error) console.log(`  ⚠️  ${user.email}: ${error.message}`);
        else console.log(`  ✅ ${user.email}`);
    }

    // Seed products
    console.log('\n📦 Seeding products...');
    for (const product of SEED_PRODUCTS) {
        const { error } = await supabase.from('products').upsert(product, { onConflict: 'qr_code' });
        if (error) console.log(`  ⚠️  ${product.name}: ${error.message}`);
        else console.log(`  ✅ ${product.name}`);
    }

    console.log('\n🎉 Done!');
    console.log('   Admin login: admin@scanmart.com / admin123');
    console.log('   User login:  user@scanmart.com / user123');
    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
