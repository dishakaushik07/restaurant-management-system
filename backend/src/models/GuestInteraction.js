const mongoose = require('mongoose');

const guestInteractionSchema = new mongoose.Schema(
    {
        tableNumber: {
            type: Number,
            required: [true, 'Table number is required']
        },
        queryText: {
            type: String,
            required: [true, 'Guest query cannot be empty'],
            trim: true
        },
        // ML Engine yahan batayega ki user actually kya chahta hai
        intent: {
            type: String,
            enum: ['faq', 'order_status', 'human_assistance', 'feedback', 'unknown'],
            default: 'unknown'
        },
        aiResponse: {
            type: String, // Agar FAQ hai, toh bot kya reply dega
            default: ''
        },
        status: {
            type: String,
            enum: ['resolved', 'pending_staff_action'],
            default: 'resolved'
        }
    },
    {
        timestamps: true
    }
);

// Index: Staff dashboard ke liye pending actions jaldi dhoondhne ke liye
guestInteractionSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('GuestInteraction', guestInteractionSchema);