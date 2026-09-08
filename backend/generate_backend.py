import os

base_dir = "."

models = {
    "Table.js": """const mongoose = require('mongoose');
const tableSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ['available', 'occupied', 'reserved', 'cleaning'], default: 'available' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
});
module.exports = mongoose.model('Table', tableSchema);""",

    "Order.js": """const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['placed', 'accepted', 'preparing', 'ready', 'assigned', 'delivered'], default: 'placed' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Order', orderSchema);""",

    "Robot.js": """const mongoose = require('mongoose');
const robotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  macAddress: { type: String, required: true, unique: true },
  apiKey: { type: String, required: true },
  status: { type: String, enum: ['idle', 'delivering', 'returning', 'charging', 'offline'], default: 'offline' },
  batteryLevel: { type: Number, default: 100 },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
});
module.exports = mongoose.model('Robot', robotSchema);""",
}

controllers = {
    "authController.js": """const User = require('../models/User');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, orgName } = req.body;
    let organization = await Organization.findOne({ name: orgName });
    if (!organization) {
      organization = await Organization.create({ name: orgName, email: `contact@${orgName}.com` });
    }
    const user = await User.create({ name, email, password, role: 'admin', organization: organization._id });
    res.status(201).json({ _id: user._id, name: user.name, token: generateToken(user._id) });
  } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({ _id: user._id, name: user.name, role: user.role, token: generateToken(user._id) });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) { res.status(400).json({ error: error.message }); }
};""",

    "orderController.js": """const Order = require('../models/Order');
exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, organization: req.user.organization });
    res.status(201).json(order);
  } catch (error) { res.status(400).json({ error: error.message }); }
};
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ organization: req.user.organization });
    res.json(orders);
  } catch (error) { res.status(400).json({ error: error.message }); }
};""",
}

routes = {
    "authRoutes.js": """const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
router.post('/register', register);
router.post('/login', login);
module.exports = router;""",

    "orderRoutes.js": """const express = require('express');
const router = express.Router();
const { createOrder, getOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
router.route('/').post(protect, createOrder).get(protect, getOrders);
module.exports = router;""",
}

for folder, files in [("models", models), ("controllers", controllers), ("routes", routes)]:
    for filename, content in files.items():
        with open(os.path.join(base_dir, folder, filename), "w") as f:
            f.write(content)

print("Files generated successfully.")
