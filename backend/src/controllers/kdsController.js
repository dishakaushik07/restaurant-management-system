const KitchenOrder = require('../models/KitchenOrder');

// Receive new order from BE1 (Order Engine)
exports.receiveOrder = async (req, res) => {
    try {
        const { orderId, items, priority, prepTimeExpected } = req.body;

        const newOrder = await KitchenOrder.create({
            orderId,
            items,
            priority,
            prepTimeExpected
        });

        res.status(201).json({ success: true, data: newOrder });
    } catch (error) {
        res.status(400).json({ success: false, message: "Error adding to queue", error: error.message });
    }
};

// Get Kitchen Queue for the Chef's Screen
exports.getKitchenQueue = async (req, res) => {
    try {
        // Sirf pending aur preparing orders dikhayenge. 
        // Pehle priority 1 (High) wale aayenge, phir jo pehle order hua (createdAt) wo aayega.
        const queue = await KitchenOrder.find({ status: { $in: ['pending', 'preparing'] } })
            .populate('items.menuItem', 'name')
            .sort({ priority: 1, createdAt: 1 });
            
        res.status(200).json({ success: true, count: queue.length, data: queue });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Update Order Status (Chef clicks "Preparing" or "Ready")
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        let updateData = { status };

        // Agar chef ne banana shuru kiya hai, toh current time record kar lo
        if (status === 'preparing') {
            updateData.prepStartTime = Date.now();
        }

        const updatedOrder = await KitchenOrder.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: 'after', runValidators: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found in kitchen" });
        }

        res.status(200).json({ success: true, data: updatedOrder });
    } catch (error) {
        res.status(400).json({ success: false, message: "Error updating status", error: error.message });
    }
};