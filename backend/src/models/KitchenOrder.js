const mongoose = require('mongoose');

const kitchenOrderSchema = new mongoose.Schema(
    {
        orderId: {
            // Yeh BE1 ke Order collection ka reference hoga
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Main Order ID is required']
        },
        items: [
            {
                menuItem: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'MenuItem', // Day 1 ke model se connected
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },
                notes: {
                    type: String, // Example: "Make it spicy", "No onion"
                    default: ''
                }
            }
        ],
        status: {
            type: String,
            enum: ['pending', 'preparing', 'ready'],
            default: 'pending'
        },
        priority: {
            type: Number,
            default: 3, // 1: High, 2: Medium, 3: Normal
        },
        prepTimeExpected: {
            type: Number, // In minutes
            required: [true, 'Expected preparation time is required']
        },
        prepStartTime: {
            type: Date,
            default: null // Jab chef 'preparing' mark karega tab yeh date set hogi
        }
    },
    {
        timestamps: true
    }
);

// Performance optimization: Kitchen mein normally hum status ke hisaab se orders filter karenge
kitchenOrderSchema.index({ status: 1, priority: 1, createdAt: 1 });

module.exports = mongoose.model('KitchenOrder', kitchenOrderSchema);