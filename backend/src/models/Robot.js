const mongoose = require('mongoose');

const robotSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Robot name is required'],
            unique: true,
            trim: true
        },
        status: {
            type: String,
            enum: ['available', 'busy', 'charging', 'maintenance'],
            default: 'available'
        },
        batteryLevel: {
            type: Number,
            required: true,
            min: [0, 'Battery cannot be less than 0'],
            max: [100, 'Battery cannot be more than 100'],
            default: 100
        },
        currentOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'KitchenOrder', 
            default: null // Jab free hoga toh yeh null rahega
        }
    },
    {
        timestamps: true
    }
);

// Index to quickly find available robots with good battery
robotSchema.index({ status: 1, batteryLevel: 1 });

module.exports = mongoose.model('Robot', robotSchema);