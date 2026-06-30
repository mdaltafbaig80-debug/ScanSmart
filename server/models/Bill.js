const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    name: String,
    quantity: Number,
    price: Number,
    subtotal: Number,
    // Return tracking
    isReturned: {
        type: Boolean,
        default: false
    },
    returnedQuantity: {
        type: Number,
        default: 0
    },
    returnDate: Date,
    returnReason: String
});

const billSchema = new mongoose.Schema({
    billId: {
        type: String,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [billItemSchema],
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        required: true
    },
    taxRate: {
        type: Number,
        default: 18 // GST 18%
    },
    discount: {
        type: Number,
        default: 0
    },
    discountCode: {
        type: String,
        default: null
    },
    total: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'wallet'],
        default: 'upi'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate unique bill ID
billSchema.pre('save', function (next) {
    if (!this.billId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.billId = `SM-${timestamp}-${random}`;
    }
    next();
});

module.exports = mongoose.model('Bill', billSchema);
