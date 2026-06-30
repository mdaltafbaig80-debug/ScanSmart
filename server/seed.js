const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Models
const User = require('./models/User');
const Product = require('./models/Product');

// Sample Data
const users = [
    {
        name: 'Admin User',
        email: 'admin@scanmart.com',
        mobileNumber: '9999999999',
        password: 'admin123',
        role: 'admin'
    },
    {
        name: 'John Doe',
        email: 'user@scanmart.com',
        mobileNumber: '8888888888',
        password: 'user123',
        role: 'user'
    }
];

const products = [
    {
        name: 'Fresh Milk',
        description: 'Farm fresh whole milk 1L',
        price: 65,
        category: 'Dairy',
        stock: 50,
        qrCode: 'SM-MILK-001',
        image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300'
    },
    {
        name: 'Cheese Slices',
        description: 'Processed cheese slices pack',
        price: 120,
        category: 'Dairy',
        stock: 30,
        qrCode: 'SM-CHEESE-002',
        image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300'
    },
    {
        name: 'Orange Juice',
        description: 'Fresh squeezed orange juice 1L',
        price: 85,
        category: 'Beverages',
        stock: 40,
        qrCode: 'SM-OJ-003',
        image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300'
    },
    {
        name: 'Cola Drink',
        description: 'Refreshing cola 2L bottle',
        price: 95,
        category: 'Beverages',
        stock: 60,
        qrCode: 'SM-COLA-004',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300'
    },
    {
        name: 'Potato Chips',
        description: 'Crispy salted chips 200g',
        price: 45,
        category: 'Snacks',
        stock: 80,
        qrCode: 'SM-CHIPS-005',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300'
    },
    {
        name: 'Chocolate Bar',
        description: 'Dark chocolate 100g',
        price: 75,
        category: 'Snacks',
        stock: 100,
        qrCode: 'SM-CHOCO-006',
        image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300'
    },
    {
        name: 'Basmati Rice',
        description: 'Premium basmati rice 5kg',
        price: 450,
        category: 'Groceries',
        stock: 25,
        qrCode: 'SM-RICE-007',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300'
    },
    {
        name: 'Cooking Oil',
        description: 'Sunflower cooking oil 1L',
        price: 180,
        category: 'Groceries',
        stock: 35,
        qrCode: 'SM-OIL-008',
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300'
    },
    {
        name: 'Fresh Apples',
        description: 'Red apples 1kg',
        price: 150,
        category: 'Fruits',
        stock: 45,
        qrCode: 'SM-APPLE-009',
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300'
    },
    {
        name: 'Bananas',
        description: 'Fresh bananas 1 dozen',
        price: 60,
        category: 'Fruits',
        stock: 55,
        qrCode: 'SM-BANANA-010',
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300'
    },
    {
        name: 'White Bread',
        description: 'Sliced white bread loaf',
        price: 40,
        category: 'Bakery',
        stock: 20,
        qrCode: 'SM-BREAD-011',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300'
    },
    {
        name: 'Butter Cookies',
        description: 'Danish butter cookies 400g',
        price: 220,
        category: 'Bakery',
        stock: 15,
        qrCode: 'SM-COOKIE-012',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300'
    },
    {
        name: 'Shampoo',
        description: 'Anti-dandruff shampoo 400ml',
        price: 280,
        category: 'Personal Care',
        stock: 30,
        qrCode: 'SM-SHAMPOO-013',
        image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=300'
    },
    {
        name: 'Toothpaste',
        description: 'Mint toothpaste 150g',
        price: 95,
        category: 'Personal Care',
        stock: 40,
        qrCode: 'SM-TOOTH-014',
        image: 'https://images.unsplash.com/photo-1628359355624-855c87991fa8?w=300'
    },
    {
        name: 'Dish Soap',
        description: 'Liquid dish soap 750ml',
        price: 110,
        category: 'Household',
        stock: 35,
        qrCode: 'SM-DISH-015',
        image: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=300'
    }
];

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/scanmart');
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});
        console.log('🗑️ Cleared existing data');

        // Create users
        for (const userData of users) {
            const user = new User(userData);
            await user.save();
            console.log(`👤 Created user: ${userData.email}`);
        }

        // Create products
        for (const productData of products) {
            const product = new Product(productData);
            await product.save();
            console.log(`📦 Created product: ${productData.name}`);
        }

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('   Admin: admin@scanmart.com / admin123');
        console.log('   User:  user@scanmart.com / user123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

seedDatabase();
