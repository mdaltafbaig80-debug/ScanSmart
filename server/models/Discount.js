const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    description: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    value: {
        type: Number,
        required: true
    },
    minPurchase: {
        type: Number,
        default: 0
    },
    maxDiscount: {
        type: Number,
        default: null
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: null
    },
    usedCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Check if discount is valid
discountSchema.methods.isValid = function (cartTotal) {
    const now = new Date();

    if (!this.isActive) return { valid: false, message: 'Discount is not active' };
    if (now < this.validFrom) return { valid: false, message: 'Discount not yet valid' };
    if (now > this.validUntil) return { valid: false, message: 'Discount has expired' };
    if (this.usageLimit && this.usedCount >= this.usageLimit) {
        return { valid: false, message: 'Discount usage limit reached' };
    }
    if (cartTotal < this.minPurchase) {
        return { valid: false, message: `Minimum purchase of ₹${this.minPurchase} required` };
    }

    return { valid: true };
};

// Calculate discount amount
discountSchema.methods.calculateDiscount = function (subtotal) {
    let discountAmount;

    if (this.type === 'percentage') {
        discountAmount = (subtotal * this.value) / 100;
    } else {
        discountAmount = this.value;
    }

    // Apply max discount cap if set
    if (this.maxDiscount && discountAmount > this.maxDiscount) {
        discountAmount = this.maxDiscount;
    }

    return Math.min(discountAmount, subtotal);
};

module.exports = mongoose.model('Discount', discountSchema);
