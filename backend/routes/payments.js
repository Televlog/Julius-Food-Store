const express = require('express');
const router = express.Router();
const { createPaymentIntent, stripeWebhook, getStripeConfig } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Stripe webhook needs raw body — mount before json middleware in server.js if needed
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
router.get('/config', getStripeConfig);
router.post('/create-payment-intent', protect, createPaymentIntent);

module.exports = router;
