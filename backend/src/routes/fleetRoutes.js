const express = require('express');
const router = express.Router();
const { registerRobot, getFleetStatus, assignOrder, updateRobotStatus } = require('../controllers/fleetController');

// POST /api/fleet/robots
router.post('/robots', registerRobot);

// GET /api/fleet/robots
router.get('/robots', getFleetStatus);

// POST /api/fleet/robots/assign
router.post('/robots/assign', assignOrder);

// PATCH /api/fleet/robots/:id
router.patch('/robots/:id', updateRobotStatus);

module.exports = router;