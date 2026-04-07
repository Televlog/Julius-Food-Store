const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/auth');

// Validate coupon (public)
router.post('/validate', protect, asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  const validation = coupon.isValid(req.user._id, orderAmount);
  if (!validation.valid) {
    res.status(400);
    throw new Error(validation.message);
  }
  const discount = coupon.calculateDiscount(orderAmount);
  res.json({ success: true, coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, discount });
}));

// Admin: CRUD coupons
router.get('/', protect, admin, asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
}));

router.post('/', protect, admin, asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
}));

router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, coupon });
}));

router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Coupon deleted' });
}));

module.exports = router;
