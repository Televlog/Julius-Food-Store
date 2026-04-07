const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalUsers, totalProducts, totalOrders,
    monthOrders, lastMonthOrders,
    revenueResult, lastMonthRevenueResult,
    pendingOrders, sellerCount,
    recentOrders, topProducts,
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.countDocuments({ status: 'pending' }),
    User.countDocuments({ role: 'seller' }),
    Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(10),
    Product.find({ isActive: true }).sort({ sold: -1 }).limit(5).select('name images sold price'),
  ]);

  const totalRevenue = revenueResult[0]?.total || 0;
  const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;

  // Revenue by day for current month
  const revenueByDay = await Order.aggregate([
    { $match: { isPaid: true, createdAt: { $gte: startOfMonth } } },
    {
      $group: {
        _id: { $dayOfMonth: '$createdAt' },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Orders by status
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      monthOrders,
      lastMonthOrders,
      lastMonthRevenue,
      pendingOrders,
      sellerCount,
      revenueByDay,
      ordersByStatus,
      recentOrders,
      topProducts,
    },
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const query = {};

  if (req.query.role) query.role = req.query.role;
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';

  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  res.json({ success: true, users, total, pages: Math.ceil(total / limit), page });
});

// @desc    Update user (admin)
// @route   PUT /api/admin/users/:id
exports.updateUser = asyncHandler(async (req, res) => {
  const allowedFields = ['role', 'isActive', 'isEmailVerified', 'sellerInfo'];
  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({ success: true, user });
});

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
exports.getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const query = {};

  if (req.query.status) query.status = req.query.status;
  if (req.query.isPaid !== undefined) query.isPaid = req.query.isPaid === 'true';
  if (req.query.search) {
    query.$or = [
      { orderNumber: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  res.json({ success: true, orders, total, pages: Math.ceil(total / limit), page });
});

// @desc    Approve seller
// @route   PUT /api/admin/sellers/:id/approve
exports.approveSeller = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'seller') {
    res.status(404);
    throw new Error('Seller not found');
  }

  user.sellerInfo.isApproved = true;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Seller approved', user });
});

// @desc    Get sales report
// @route   GET /api/admin/reports/sales
exports.getSalesReport = asyncHandler(async (req, res) => {
  const { period = 'monthly', year = new Date().getFullYear() } = req.query;

  let groupBy;
  if (period === 'daily') {
    groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
  } else if (period === 'weekly') {
    groupBy = { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } };
  } else {
    groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
  }

  const report = await Order.aggregate([
    {
      $match: {
        isPaid: true,
        createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) },
      },
    },
    {
      $group: {
        _id: groupBy,
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
        items: { $sum: { $size: '$items' } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);

  res.json({ success: true, report });
});
