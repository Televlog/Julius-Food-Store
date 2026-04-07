const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

// Build filter query helper
const buildQuery = (reqQuery) => {
  const query = { isActive: true };
  if (reqQuery.category) query.category = reqQuery.category;
  if (reqQuery.brand) query.brand = { $regex: reqQuery.brand, $options: 'i' };
  if (reqQuery.seller) query.seller = reqQuery.seller;
  if (reqQuery.minPrice || reqQuery.maxPrice) {
    query.price = {};
    if (reqQuery.minPrice) query.price.$gte = Number(reqQuery.minPrice);
    if (reqQuery.maxPrice) query.price.$lte = Number(reqQuery.maxPrice);
  }
  if (reqQuery.rating) query['ratings.average'] = { $gte: Number(reqQuery.rating) };
  if (reqQuery.inStock === 'true') query.stock = { $gt: 0 };
  if (reqQuery.freeShipping === 'true') query.freeShipping = true;
  if (reqQuery.isFeatured === 'true') query.isFeatured = true;
  return query;
};

// @desc    Get all products
// @route   GET /api/products
exports.getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  let query = buildQuery(req.query);

  // Text search
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Sort
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { 'ratings.average': -1 },
    popular: { sold: -1 },
  };
  const sort = sortMap[req.query.sort] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(query)
      .select('-specifications -description')
      .populate('category', 'name slug')
      .populate('seller', 'name sellerInfo.storeName')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: products.length,
    total,
    pages: Math.ceil(total / limit),
    page,
    products,
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ $or: [{ _id: req.params.id }, { slug: req.params.id }], isActive: true })
    .populate('category', 'name slug')
    .populate('seller', 'name sellerInfo avatar');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Increment views
  product.views += 1;
  await product.save({ validateBeforeSave: false });

  res.json({ success: true, product });
});

// @desc    Create product
// @route   POST /api/products
exports.createProduct = asyncHandler(async (req, res) => {
  req.body.seller = req.user._id;

  const product = await Product.create(req.body);
  await product.populate('category', 'name slug');

  res.status(201).json({ success: true, product });
});

// @desc    Update product
// @route   PUT /api/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Only seller who owns it or admin can update
  if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this product');
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('category', 'name slug');

  res.json({ success: true, product });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this product');
  }

  // Delete images from cloudinary
  for (const img of product.images) {
    if (img.publicId) await cloudinary.uploader.destroy(img.publicId);
  }

  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

// @desc    Upload product images
// @route   POST /api/products/:id/images
exports.uploadImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  const newImages = req.files.map((file) => ({
    url: file.path,
    publicId: file.filename,
    alt: product.name,
  }));

  product.images.push(...newImages);
  await product.save();

  res.json({ success: true, images: product.images });
});

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
exports.deleteImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const image = product.images.id(req.params.imageId);
  if (!image) {
    res.status(404);
    throw new Error('Image not found');
  }

  if (image.publicId) await cloudinary.uploader.destroy(image.publicId);
  product.images.pull(req.params.imageId);
  await product.save();

  res.json({ success: true, message: 'Image deleted' });
});

// @desc    Get featured products
// @route   GET /api/products/featured
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true, isFeatured: true })
    .select('name images price compareAtPrice discount ratings slug effectivePrice')
    .populate('category', 'name')
    .limit(12)
    .sort({ createdAt: -1 });
  res.json({ success: true, products });
});

// @desc    Toggle wishlist
// @route   POST /api/products/:id/wishlist
exports.toggleWishlist = asyncHandler(async (req, res) => {
  const user = req.user;
  const productId = req.params.id;

  const idx = user.wishlist.indexOf(productId);
  if (idx === -1) {
    user.wishlist.push(productId);
  } else {
    user.wishlist.splice(idx, 1);
  }
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    inWishlist: idx === -1,
    message: idx === -1 ? 'Added to wishlist' : 'Removed from wishlist',
  });
});
