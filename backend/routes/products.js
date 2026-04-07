const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  uploadImages, deleteImage, getFeaturedProducts, toggleWishlist,
} = require('../controllers/productController');
const { protect, seller } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/featured', getFeaturedProducts);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', protect, seller, createProduct);
router.put('/:id', protect, seller, updateProduct);
router.delete('/:id', protect, seller, deleteProduct);
router.post('/:id/images', protect, seller, upload.array('images', 10), uploadImages);
router.delete('/:id/images/:imageId', protect, seller, deleteImage);
router.post('/:id/wishlist', protect, toggleWishlist);

module.exports = router;
