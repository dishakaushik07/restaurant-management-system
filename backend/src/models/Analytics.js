const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    predictedOrders: {
        type: Number,
        default: 0
    },
    actualOrders: {
        type: Number,
        default: 0
    },
    foodWasteKg: {
        type: Number,
        default: 0
    },
    anomalies: [
        {
            type: String,
            description: String,
            severity: { type: String, enum: ['Low', 'Medium', 'High'] },
            timestamp: Date
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
