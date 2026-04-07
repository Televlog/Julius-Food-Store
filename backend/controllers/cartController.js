const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get cart
// @route   GET /api/cart
exports.getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.product',
    'name images price compareAtPrice discount stock isActive seller'
  );

  if (!cart) {
    return res.json({ success: true, cart: { items: [], totalItems: 0, subtotal: 0 } });
  }

  res.json({ success: true, cart });
});

// @desc    Add item to cart
// @route   POST /api/cart
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, selectedVariants = [] } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (product.stock < quantity) {
    res.status(400);
    throw new Error('Insufficient stock');
  }

  const price = product.discount > 0
    ? +(product.price * (1 - product.discount / 100)).toFixed(2)
    : product.price;

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [{ product: productId, quantity, selectedVariants, price }],
    });
  } else {
    const existingIdx = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingIdx > -1) {
      cart.items[existingIdx].quantity += quantity;
      cart.items[existingIdx].price = price;
    } else {
      cart.items.push({ product: productId, quantity, selectedVariants, price });
    }
    await cart.save();
  }

  await cart.populate('items.product', 'name images price compareAtPrice discount stock isActive');
  res.json({ success: true, cart, message: 'Added to cart' });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error('Cart item not found');
  }

  if (quantity <= 0) {
    cart.items.pull(req.params.itemId);
  } else {
    const product = await Product.findById(item.product);
    if (product && product.stock < quantity) {
      res.status(400);
      throw new Error(`Only ${product.stock} units available`);
    }
    item.quantity = quantity;
  }

  await cart.save();
  await cart.populate('items.product', 'name images price compareAtPrice discount stock isActive');
  res.json({ success: true, cart });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
exports.removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  cart.items.pull(req.params.itemId);
  await cart.save();

  res.json({ success: true, message: 'Item removed from cart' });
});

// @desc    Clear cart
// @route   DELETE /api/cart
exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [], couponCode: undefined, discountAmount: 0 } });
  res.json({ success: true, message: 'Cart cleared' });
});

// @desc    Apply coupon to cart
// @route   POST /api/cart/coupon
exports.applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const Coupon = require('../models/Coupon');

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'price discount');
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) {
    res.status(404);
    throw new Error('Invalid coupon code');
  }

  const validation = coupon.isValid(req.user._id, subtotal);
  if (!validation.valid) {
    res.status(400);
    throw new Error(validation.message);
  }

  const discount = coupon.calculateDiscount(subtotal);
  cart.couponCode = coupon.code;
  cart.discountAmount = discount;
  await cart.save();

  res.json({
    success: true,
    message: `Coupon applied! You save $${discount.toFixed(2)}`,
    discountAmount: discount,
  });
});
