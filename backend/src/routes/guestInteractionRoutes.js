const express = require('express');
const router = express.Router();
const { handleGuestQuery, getPendingAssistance, resolveAssistance } = require('../controllers/guestInteractionController');

// POST /api/guest/query -> Jab customer app se message bhejega
router.post('/query', handleGuestQuery);

// GET /api/guest/pending -> Staff dashboard alerts dekhne ke liye
router.get('/pending', getPendingAssistance);

// PATCH /api/guest/:id/resolve -> Waiter jab problem solve karke 'Done' mark karega
router.patch('/:id/resolve', resolveAssistance);

module.exports = router;