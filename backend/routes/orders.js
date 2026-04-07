const express = require('express');
const router = express.Router();
const {
  createOrder, getMyOrders, getOrder,
  cancelOrder, updateOrderStatus, markAsPaid,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/pay', protect, markAsPaid);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
