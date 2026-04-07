const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const emailService = require('../utils/emailService');

// @desc    Create order
// @route   POST /api/orders
exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode, notes } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No items in order');
  }

  // Validate stock and compute prices
  let itemsPrice = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) throw new Error(`Product ${item.product} not found`);
    if (!product.isActive) throw new Error(`Product "${product.name}" is no longer available`);
    if (product.stock < item.quantity) throw new Error(`Insufficient stock for "${product.name}"`);

    const price = product.discount > 0
      ? +(product.price * (1 - product.discount / 100)).toFixed(2)
      : product.price;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || '',
      price,
      quantity: item.quantity,
      seller: product.seller,
      selectedVariants: item.selectedVariants || [],
    });

    itemsPrice += price * item.quantity;
    // Decrement stock
    product.stock -= item.quantity;
    product.sold += item.quantity;
    await product.save({ validateBeforeSave: false });
  }

  const TAX_RATE = 0.05; // 5% VAT
  const SHIPPING_THRESHOLD = 100;
  const shippingPrice = itemsPrice >= SHIPPING_THRESHOLD ? 0 : 9.99;
  const taxPrice = +(itemsPrice * TAX_RATE).toFixed(2);

  let discountAmount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (coupon) {
      const validation = coupon.isValid(req.user._id, itemsPrice);
      if (validation.valid) {
        discountAmount = coupon.calculateDiscount(itemsPrice);
        coupon.usageCount += 1;
        coupon.usedBy.push(req.user._id);
        await coupon.save();
        appliedCoupon = coupon.code;
      }
    }
  }

  const totalPrice = +(itemsPrice + shippingPrice + taxPrice - discountAmount).toFixed(2);

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice: +itemsPrice.toFixed(2),
    shippingPrice,
    taxPrice,
    discountAmount,
    totalPrice,
    couponCode: appliedCoupon,
    notes,
  });

  // Clear cart
  await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });

  // Send confirmation email
  try {
    await emailService.sendOrderConfirmation(req.user, order);
  } catch (e) {
    console.error('Email error:', e.message);
  }

  res.status(201).json({ success: true, order });
});

// @desc    Get my orders
// @route   GET /api/orders/my
exports.getMyOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = { user: req.user._id };
  if (req.query.status) query.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  res.json({ success: true, orders, total, pages: Math.ceil(total / limit), page });
});

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name images slug');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Only owner or admin can view
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json({ success: true, order });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  if (!cancellableStatuses.includes(order.status)) {
    res.status(400);
    throw new Error(`Cannot cancel an order with status: ${order.status}`);
  }

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, sold: -item.quantity },
    });
  }

  order.status = 'cancelled';
  order.cancelReason = req.body.reason || 'Cancelled by user';
  await order.save();

  try {
    await emailService.sendOrderStatusUpdate(req.user, order);
  } catch (e) {
    console.error('Email error:', e.message);
  }

  res.json({ success: true, order });
});

// @desc    Update order status (Admin/Seller)
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const { status, trackingNumber, courierName, note } = req.body;
  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (courierName) order.courierName = courierName;
  if (note) order.statusHistory[order.statusHistory.length - 1].note = note;

  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
    if (order.paymentMethod === 'cod') {
      order.isPaid = true;
      order.paidAt = new Date();
    }
  }

  await order.save();

  try {
    await emailService.sendOrderStatusUpdate(order.user, order);
  } catch (e) {
    console.error('Email error:', e.message);
  }

  res.json({ success: true, order });
});

// @desc    Mark order as paid
// @route   PUT /api/orders/:id/pay
exports.markAsPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    updateTime: req.body.update_time,
    email: req.body.payer?.email_address,
  };
  if (order.status === 'pending') order.status = 'confirmed';
  await order.save();

  res.json({ success: true, order });
});
