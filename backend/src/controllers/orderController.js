const Order = require('../models/Order');
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
};