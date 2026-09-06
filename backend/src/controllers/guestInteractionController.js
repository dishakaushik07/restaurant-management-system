const GuestInteraction = require('../models/GuestInteraction');

// 1. Customer ki query handle karne ka function
exports.handleGuestQuery = async (req, res) => {
    try {
        const { tableNumber, queryText } = req.body;
        
        let intent = 'unknown';
        let aiResponse = '';
        let status = 'resolved';

        // MOCK AI/ML LOGIC: Yahan hum keywords check kar rahe hain
        const text = queryText.toLowerCase();
        
        if (text.includes('time') || text.includes('order')) {
            intent = 'order_status';
            aiResponse = 'Let me check your order status with the kitchen...';
        } else if (text.includes('water') || text.includes('waiter') || text.includes('clean')) {
            intent = 'human_assistance';
            aiResponse = 'I have notified the staff. Someone will be at your table shortly.';
            status = 'pending_staff_action'; // Staff ke dashboard par alert jayega
        } else if (text.includes('good') || text.includes('bad') || text.includes('feedback')) {
            intent = 'feedback';
            aiResponse = 'Thank you for your feedback! We appreciate it.';
        } else {
            intent = 'faq';
            aiResponse = 'Our restaurant opens at 10 AM and closes at 11 PM.';
        }

        // Database mein save karna
        const interaction = await GuestInteraction.create({
            tableNumber,
            queryText,
            intent,
            aiResponse,
            status
        });

        res.status(201).json({ success: true, data: interaction });
    } catch (error) {
        res.status(400).json({ success: false, message: "Error processing query", error: error.message });
    }
};

// 2. Staff dashboard ke liye pending alerts fetch karna
exports.getPendingAssistance = async (req, res) => {
    try {
        const alerts = await GuestInteraction.find({ status: 'pending_staff_action' })
                                             .sort({ createdAt: 1 });
        res.status(200).json({ success: true, count: alerts.length, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// 3. Waiter alert ko solve (resolve) mark karega
exports.resolveAssistance = async (req, res) => {
    try {
        const interaction = await GuestInteraction.findByIdAndUpdate(
            req.params.id,
            { status: 'resolved' },
            { returnDocument: 'after', runValidators: true }
        );

        if (!interaction) {
            return res.status(404).json({ success: false, message: "Interaction not found" });
        }

        res.status(200).json({ success: true, data: interaction });
    } catch (error) {
        res.status(400).json({ success: false, message: "Error updating status", error: error.message });
    }
};