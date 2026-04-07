const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get product reviews
// @route   GET /api/reviews/product/:productId
exports.getProductReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = { product: req.params.productId, isApproved: true };
  if (req.query.rating) query.rating = Number(req.query.rating);

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(query),
  ]);

  // Rating breakdown
  const ratingBreakdown = await Review.aggregate([
    { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId), isApproved: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  res.json({ success: true, reviews, total, pages: Math.ceil(total / limit), page, ratingBreakdown });
});

// @desc    Create review
// @route   POST /api/reviews
exports.createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, body, orderId } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user already reviewed this product
  const existing = await Review.findOne({ user: req.user._id, product: productId });
  if (existing) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  // Check if verified purchase
  let isVerifiedPurchase = false;
  if (orderId) {
    const order = await Order.findOne({ _id: orderId, user: req.user._id, 'items.product': productId, isDelivered: true });
    if (order) isVerifiedPurchase = true;
  } else {
    const order = await Order.findOne({ user: req.user._id, 'items.product': productId, isDelivered: true });
    if (order) isVerifiedPurchase = true;
  }

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    order: orderId,
    rating,
    title,
    body,
    isVerifiedPurchase,
  });

  await review.populate('user', 'name avatar');
  res.status(201).json({ success: true, review });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
exports.updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this review');
  }

  const { rating, title, body } = req.body;
  if (rating) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (body !== undefined) review.body = body;
  await review.save();

  res.json({ success: true, review });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  await review.deleteOne();
  res.json({ success: true, message: 'Review deleted' });
});

// @desc    Mark review helpful
// @route   POST /api/reviews/:id/helpful
exports.markHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const idx = review.helpful.indexOf(req.user._id);
  if (idx === -1) {
    review.helpful.push(req.user._id);
  } else {
    review.helpful.splice(idx, 1);
  }
  await review.save();

  res.json({ success: true, helpfulCount: review.helpful.length });
});

// @desc    Seller reply to review
// @route   POST /api/reviews/:id/reply
exports.sellerReply = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id).populate('product');
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (review.product.seller.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the product seller can reply');
  }

  review.sellerReply = { text: req.body.text, repliedAt: new Date() };
  await review.save();

  res.json({ success: true, review });
});
