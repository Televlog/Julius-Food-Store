const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');

// GET all categories
router.get('/', asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .populate('subcategories', 'name slug image')
    .sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, categories });
}));

// GET single category
router.get('/:id', asyncHandler(async (req, res) => {
  const category = await Category.findOne({ $or: [{ _id: req.params.id }, { slug: req.params.id }] })
    .populate('subcategories', 'name slug image');
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true, category });
}));

// CREATE category (admin)
router.post('/', protect, admin, asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, category });
}));

// UPDATE category (admin)
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true, category });
}));

// DELETE category (admin)
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Category deleted' });
}));

module.exports = router;
