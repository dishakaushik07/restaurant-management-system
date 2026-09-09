const express = require('express');
const router = express.Router();
const { getNotifications, createNotification, clearNotifications } = require('../controllers/notificationController');

router.get('/', getNotifications);
router.post('/', createNotification);
router.delete('/', clearNotifications);

module.exports = router;
