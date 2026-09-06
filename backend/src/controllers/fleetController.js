const Robot = require('../models/Robot');
const KitchenOrder = require('../models/KitchenOrder');

// 1. Add a new robot to the restaurant
exports.registerRobot = async (req, res) => {
    try {
        const { name, batteryLevel } = req.body;
        const robot = await Robot.create({ name, batteryLevel });
        res.status(201).json({ success: true, data: robot });
    } catch (error) {
        res.status(400).json({ success: false, message: "Error registering robot", error: error.message });
    }
};

// 2. Get status of all robots (for Fleet Dashboard)
exports.getFleetStatus = async (req, res) => {
    try {
        const fleet = await Robot.find().populate('currentOrder');
        res.status(200).json({ success: true, count: fleet.length, data: fleet });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// 3. Assign an order to the first available robot (Core ML/BE integration point)
exports.assignOrder = async (req, res) => {
    try {
        const { kitchenOrderId } = req.body;

        // Smart Query: Find a robot that is available AND has battery > 20%
        const robot = await Robot.findOne({ 
            status: 'available', 
            batteryLevel: { $gt: 20 } 
        });

        if (!robot) {
            return res.status(404).json({ success: false, message: "No robots available or sufficient battery" });
        }

        // Update robot status
        robot.status = 'busy';
        robot.currentOrder = kitchenOrderId;
        await robot.save(); // Save changes to DB

        res.status(200).json({ success: true, message: "Order assigned successfully", data: robot });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// 4. Update robot status (Mock Hardware Call: robot updates its battery/status)
exports.updateRobotStatus = async (req, res) => {
    try {
        const { status, batteryLevel } = req.body;
        let updateData = {};
        
        if (status) updateData.status = status;
        if (batteryLevel !== undefined) updateData.batteryLevel = batteryLevel;
        
        // Agar robot available ya charging state mein ja raha hai, toh order hata do
        if (status === 'available' || status === 'charging') {
            updateData.currentOrder = null;
        }

        const updatedRobot = await Robot.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { returnDocument: 'after', runValidators: true }
        );

        if (!updatedRobot) return res.status(404).json({ success: false, message: "Robot not found" });

        res.status(200).json({ success: true, data: updatedRobot });
    } catch (error) {
        res.status(400).json({ success: false, message: "Error updating robot", error: error.message });
    }
};