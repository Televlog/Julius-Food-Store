const express = require('express');
const router = express.Router();
const { getProductReviews, createReview, updateReview, deleteReview, markHelpful, sellerReply } = require('../controllers/reviewController');
const { protect, seller } = require('../middleware/auth');

router.get('/product/:productId', getProductReviews);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/helpful', protect, markHelpful);
router.post('/:id/reply', protect, seller, sellerReply);

module.exports = router;
