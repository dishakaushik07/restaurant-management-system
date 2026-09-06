const Category = require('../models/Category');

// Create a new category
exports.createCategory = async (req, res) => {
    try {
        const { name, description, image } = req.body;

        // Validation
        if (!name) {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }

        // Database insert operation
        const category = await Category.create({
            name,
            description,
            image
        });

        // 201 Created status
        res.status(201).json({
            success: true,
            data: category
        });

    } catch (error) {
        // 11000 is MongoDB duplicate key error code
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Category with this name already exists" });
        }
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};


// Get all categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({ success: true, count: categories.length, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Update a category
exports.updateCategory = async (req, res) => {
    try {
        // req.params.id URL se aayega, req.body update hone wala data hai
        const category = await Category.findByIdAndUpdate(req.params.id, req.body,
         { returnDocument: 'after', runValidators: true });

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

