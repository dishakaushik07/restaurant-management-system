const express = require('express');
const router = express.Router();
const { receiveOrder, getKitchenQueue, updateOrderStatus } = require('../controllers/kdsController');

// POST /api/kds/orders (For BE1 to push orders to kitchen)
router.post('/orders', receiveOrder);

// GET /api/kds/queue (For Chef's Screen to see active orders)
router.get('/queue', getKitchenQueue);

// PATCH /api/kds/orders/:id/status (For Chef to update status)
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;