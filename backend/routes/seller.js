const express = require('express');
const router = express.Router();
const { getSellerStats, getSellerProducts, getSellerOrders, updateSellerProfile, getRevenueReport } = require('../controllers/sellerController');
const { protect, seller } = require('../middleware/auth');

router.use(protect, seller);

router.get('/stats', getSellerStats);
router.get('/products', getSellerProducts);
router.get('/orders', getSellerOrders);
router.put('/profile', updateSellerProfile);
router.get('/reports', getRevenueReport);

module.exports = router;
