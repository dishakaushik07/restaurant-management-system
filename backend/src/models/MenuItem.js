const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Menu item name is required'],
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative']
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category', // Yeh Category model se connect karta hai
            required: [true, 'Category is required']
        },
        dietaryPreference: {
            type: String,
            enum: ['Veg', 'Non-Veg', 'Vegan'],
            default: 'Veg'
        },
        image: {
            type: String,
            default: ''
        },
        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Performance optimize karne ke liye Index
menuItemSchema.index({ category: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);