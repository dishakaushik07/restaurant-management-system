const MenuItem = require('../models/MenuItem');

// Create a new Menu Item
exports.createMenuItem = async (req, res) => {
    try {
        const { name, description, price, category, dietaryPreference, image } = req.body;

        const menuItem = await MenuItem.create({
            name,
            description,
            price,
            category, // Yeh ek valid Category ka ObjectId hona chahiye
            dietaryPreference,
            image
        });

        res.status(201).json({ success: true, data: menuItem });
    } catch (error) {
        res.status(400).json({ success: false, message: "Error creating item", error: error.message });
    }
};

// Get all Menu Items (with Category details)
exports.getMenuItems = async (req, res) => {
    try {
        // .populate() automatically category ID ko uske actual document data se replace kar dega
        const menuItems = await MenuItem.find().populate('category', 'name isActive');
        
        res.status(200).json({ success: true, count: menuItems.length, data: menuItems });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Toggle Availability (Specific for Kitchen/BE1 integration)
exports.toggleAvailability = async (req, res) => {
    try {
        const { isAvailable } = req.body;

        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            { isAvailable: isAvailable },
            { new: true, runValidators: true }
        );

        if (!menuItem) {
            return res.status(404).json({ success: false, message: "Menu item not found" });
        }

        res.status(200).json({ success: true, data: menuItem });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};