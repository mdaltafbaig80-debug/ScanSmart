const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    revenue: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    dayOfWeek: {
        type: Number,
        min: 0,
        max: 6
    },
    month: {
        type: Number,
        min: 1,
        max: 12
    },
    year: {
        type: Number
    }
});

// Set date components before saving
salesSchema.pre('save', function (next) {
    const date = this.date || new Date();
    this.dayOfWeek = date.getDay();
    this.month = date.getMonth() + 1;
    this.year = date.getFullYear();
    next();
});

module.exports = mongoose.model('Sales', salesSchema);
