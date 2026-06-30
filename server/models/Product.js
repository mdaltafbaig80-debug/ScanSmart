const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    // Per-item discount
    discountPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    discountValidUntil: {
        type: Date,
        default: null
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Dairy', 'Beverages', 'Snacks', 'Groceries', 'Fruits', 'Vegetables', 'Bakery', 'Frozen', 'Personal Care', 'Household', 'Other']
    },
    stock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    qrCode: {
        type: String,
        unique: true,
        required: true
    },
    image: {
        type: String,
        default: '/images/default-product.png'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
productSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function () {
    if (this.stock === 0) return 'Out of Stock';
    if (this.stock < 10) return 'Low Stock';
    return 'In Stock';
});

// Virtual for effective price (after discount)
productSchema.virtual('effectivePrice').get(function () {
    if (this.discountPercent > 0) {
        // Check if discount is still valid
        if (!this.discountValidUntil || new Date(this.discountValidUntil) >= new Date()) {
            return this.price * (1 - this.discountPercent / 100);
        }
    }
    return this.price;
});

// Virtual to check if discount is active
productSchema.virtual('hasActiveDiscount').get(function () {
    if (this.discountPercent > 0) {
        if (!this.discountValidUntil || new Date(this.discountValidUntil) >= new Date()) {
            return true;
        }
    }
    return false;
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);

