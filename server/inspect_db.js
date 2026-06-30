const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const User = require('./models/User');
const Bill = require('./models/Bill');
const Cart = require('./models/Cart');

dotenv.config();

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/scanmart');
        console.log('✅ Connected to Database');

        const usersCount = await User.countDocuments();
        const productsCount = await Product.countDocuments();
        const billsCount = await Bill.countDocuments();

        console.log('\n--- Database Stats ---');
        console.log(`Users: ${usersCount}`);
        console.log(`Products: ${productsCount}`);
        console.log(`Bills: ${billsCount}`);

        console.log('\n--- Recent Products ---');
        const products = await Product.find().limit(5);
        products.forEach(p => console.log(`- ${p.name} (Price: ₹${p.price}, Code: ${p.qrCode})`));

        console.log('\n--- Recent Users ---');
        const users = await User.find().limit(5);
        users.forEach(u => console.log(`- ${u.username} (${u.email}, Role: ${u.role})`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error inspecting database:', error);
        process.exit(1);
    }
}

inspect();
