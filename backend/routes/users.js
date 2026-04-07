const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');

// @desc    Update profile
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone },
    { new: true, runValidators: true }
  ).select('-password');
  res.json({ success: true, user });
}));

// @desc    Upload avatar
router.put('/avatar', protect, uploadAvatar.single('avatar'), asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: { url: req.file.path, publicId: req.file.filename } },
    { new: true }
  ).select('-password');
  res.json({ success: true, user });
}));

// @desc    Manage addresses
router.get('/addresses', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('addresses');
  res.json({ success: true, addresses: user.addresses });
}));

router.post('/addresses', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) {
    user.addresses.forEach((addr) => { addr.isDefault = false; });
  }
  user.addresses.push(req.body);
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, addresses: user.addresses });
}));

router.put('/addresses/:addrId', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addrId);
  if (!addr) {
    res.status(404);
    throw new Error('Address not found');
  }
  if (req.body.isDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
  }
  Object.assign(addr, req.body);
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, addresses: user.addresses });
}));

router.delete('/addresses/:addrId', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses.pull(req.params.addrId);
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Address deleted' });
}));

// @desc    Register as seller
router.post('/become-seller', protect, asyncHandler(async (req, res) => {
  if (req.user.role === 'seller') {
    res.status(400);
    throw new Error('You are already a seller');
  }
  const { storeName, storeDescription } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      role: 'seller',
      sellerInfo: { storeName, storeDescription, isApproved: false },
    },
    { new: true }
  ).select('-password');
  res.json({ success: true, user, message: 'Seller application submitted. Awaiting approval.' });
}));

// @desc    Get wishlist
router.get('/wishlist', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    'wishlist',
    'name images price compareAtPrice discount ratings slug effectivePrice'
  );
  res.json({ success: true, wishlist: user.wishlist });
}));

module.exports = router;
