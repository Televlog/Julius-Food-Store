const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Color", "Size"
  options: [
    {
      value: String,       // e.g. "Red", "XL"
      priceAdjustment: { type: Number, default: 0 },
      stock: { type: Number, default: 0 },
      sku: String,
    },
  ],
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [300, 'Product name cannot exceed 300 characters'],
    },
    slug: { type: String, unique: true, lowercase: true },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    shortDescription: String,
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    brand: { type: String, trim: true },
    images: [
      {
        url: { type: String, required: true },
        publicId: String,
        alt: String,
      },
    ],
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    compareAtPrice: { type: Number, default: 0 }, // original price (for discount display)
    discount: { type: Number, default: 0 },        // percentage
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sku: { type: String, unique: true, sparse: true },
    variants: [variantSchema],
    specifications: [
      {
        key: String,
        value: String,
      },
    ],
    tags: [String],
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isDigital: { type: Boolean, default: false },
    freeShipping: { type: Boolean, default: false },
    weight: Number,   // kg
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    views: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Auto-generate slug
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug =
      this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') +
      '-' +
      Date.now();
  }
  next();
});

// Virtual: effective price after discount
productSchema.virtual('effectivePrice').get(function () {
  if (this.discount > 0) {
    return +(this.price * (1 - this.discount / 100)).toFixed(2);
  }
  return this.price;
});

// Text index for search
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);
