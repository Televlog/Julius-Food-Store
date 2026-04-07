const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get seller dashboard stats
// @route   GET /api/seller/stats
exports.getSellerStats = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalProducts, activeProducts, totalOrders,
    monthRevenue, totalRevenue, pendingOrders,
    recentOrders, topProducts,
  ] = await Promise.all([
    Product.countDocuments({ seller: sellerId }),
    Product.countDocuments({ seller: sellerId, isActive: true }),
    Order.countDocuments({ 'items.seller': sellerId }),
    Order.aggregate([
      { $match: { 'items.seller': sellerId, isPaid: true, createdAt: { $gte: startOfMonth } } },
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
    ]),
    Order.aggregate([
      { $match: { 'items.seller': sellerId, isPaid: true } },
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
    ]),
    Order.countDocuments({ 'items.seller': sellerId, status: 'pending' }),
    Order.find({ 'items.seller': sellerId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10),
    Product.find({ seller: sellerId }).sort({ sold: -1 }).limit(5).select('name images sold price'),
  ]);

  res.json({
    success: true,
    stats: {
      totalProducts,
      activeProducts,
      totalOrders,
      monthRevenue: monthRevenue[0]?.total || 0,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingOrders,
      recentOrders,
      topProducts,
    },
  });
});

// @desc    Get seller's products
// @route   GET /api/seller/products
exports.getSellerProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const query = { seller: req.user._id };

  if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
  if (req.query.search) query.$text = { $search: req.query.search };

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  res.json({ success: true, products, total, pages: Math.ceil(total / limit), page });
});

// @desc    Get seller's orders
// @route   GET /api/seller/orders
exports.getSellerOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const query = { 'items.seller': req.user._id };

  if (req.query.status) query.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  res.json({ success: true, orders, total, pages: Math.ceil(total / limit), page });
});

// @desc    Update seller profile/store
// @route   PUT /api/seller/profile
exports.updateSellerProfile = asyncHandler(async (req, res) => {
  const { storeName, storeDescription } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { 'sellerInfo.storeName': storeName, 'sellerInfo.storeDescription': storeDescription },
    { new: true }
  ).select('-password');

  res.json({ success: true, user });
});

// @desc    Get seller revenue report
// @route   GET /api/seller/reports
exports.getRevenueReport = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const year = req.query.year || new Date().getFullYear();

  const report = await Order.aggregate([
    {
      $match: {
        'items.seller': sellerId,
        isPaid: true,
        createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) },
      },
    },
    { $unwind: '$items' },
    { $match: { 'items.seller': sellerId } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        orders: { $sum: 1 },
        unitsSold: { $sum: '$items.quantity' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({ success: true, report });
});
