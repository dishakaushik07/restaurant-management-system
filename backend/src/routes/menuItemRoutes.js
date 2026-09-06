const express = require('express');
const router = express.Router();
const { createMenuItem, getMenuItems, toggleAvailability } = require('../controllers/menuItemController');

// POST /api/menu/items
router.post('/', createMenuItem);

// GET /api/menu/items
router.get('/', getMenuItems);

// PATCH /api/menu/items/:id/availability
router.patch('/:id/availability', toggleAvailability);

module.exports = router;