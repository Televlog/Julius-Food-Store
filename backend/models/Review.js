const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 200 },
    body: { type: String, trim: true, maxlength: 2000 },
    images: [{ url: String, publicId: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isApproved: { type: Boolean, default: true },
    sellerReply: {
      text: String,
      repliedAt: Date,
    },
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Update product ratings after save/delete
async function updateProductRatings(productId) {
  const Product = mongoose.model('Product');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      'ratings.average': +stats[0].avgRating.toFixed(1),
      'ratings.count': stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { 'ratings.average': 0, 'ratings.count': 0 });
  }
}

reviewSchema.post('save', function () {
  updateProductRatings(this.product);
});

reviewSchema.post('deleteOne', { document: true }, function () {
  updateProductRatings(this.product);
});

module.exports = mongoose.model('Review', reviewSchema);
