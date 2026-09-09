const express = require('express');
const router = express.Router();
const { getAnalytics, addAnomaly } = require('../controllers/analyticsController');

router.get('/', getAnalytics);
router.post('/anomaly', addAnomaly);

module.exports = router;
