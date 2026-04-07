const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const CATEGORIES = [
  { name: 'Electronics', description: 'Gadgets, phones, laptops, and more' },
  { name: 'Fashion', description: 'Clothing, shoes, and accessories' },
  { name: 'Home & Garden', description: 'Furniture, decor, and outdoor' },
  { name: 'Beauty & Health', description: 'Skincare, makeup, and wellness' },
  { name: 'Sports & Outdoors', description: 'Fitness, camping, and sports gear' },
  { name: 'Books', description: 'Books, eBooks, and audiobooks' },
  { name: 'Toys & Games', description: 'Kids toys and board games' },
  { name: 'Food & Grocery', description: 'Fresh and packaged food' },
];

// Exportable function — runs in the same process/DB connection as the caller
const seedDB = async () => {
  await Promise.all([User.deleteMany(), Category.deleteMany(), Product.deleteMany()]);

  const categories = await Category.insertMany(CATEGORIES);

  const admin = await User.create({ name: 'Admin User', email: 'admin@shopnow.com', password: 'admin123', role: 'admin', isEmailVerified: true });
  const seller = await User.create({ name: 'Demo Seller', email: 'seller@shopnow.com', password: 'seller123', role: 'seller', isEmailVerified: true, sellerInfo: { storeName: 'Demo Store', isApproved: true } });
  await User.create({ name: 'Demo Customer', email: 'customer@shopnow.com', password: 'customer123', role: 'customer', isEmailVerified: true });

  const eId = categories.find((c) => c.name === 'Electronics')._id;
  const fId = categories.find((c) => c.name === 'Fashion')._id;
  const hId = categories.find((c) => c.name === 'Home & Garden')._id;
  const bId = categories.find((c) => c.name === 'Beauty & Health')._id;

  const productData = [
    { name: 'Premium Wireless Headphones', description: 'High-quality noise-cancelling wireless headphones with 30-hour battery life and premium sound.', shortDescription: 'Noise-cancelling, 30hr battery, premium sound', price: 199.99, compareAtPrice: 299.99, discount: 33, stock: 50, category: eId, seller: seller._id, brand: 'SoundPro', isFeatured: true, images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' }] },
    { name: 'Smart Watch Series 5', description: 'Feature-packed smartwatch with health monitoring, GPS tracking, and 5-day battery life.', shortDescription: 'Health tracking, GPS, 5-day battery', price: 149.99, discount: 25, stock: 30, category: eId, seller: seller._id, brand: 'TechWear', isFeatured: true, images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' }] },
    { name: "Men's Casual Cotton T-Shirt", description: 'Comfortable everyday t-shirt made from 100% organic cotton. Available in multiple colors.', price: 29.99, stock: 100, category: fId, seller: seller._id, brand: 'ComfyWear', images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400' }] },
    { name: 'Bluetooth Speaker Portable', description: 'Waterproof portable Bluetooth speaker with 360 sound and 12-hour playback.', price: 79.99, discount: 20, stock: 45, category: eId, seller: seller._id, brand: 'SoundPro', isFeatured: true, images: [{ url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400' }] },
    { name: 'Running Shoes Pro', description: 'Lightweight, breathable running shoes with cushioned soles for maximum comfort.', price: 89.99, stock: 60, category: fId, seller: seller._id, brand: 'SportFlex', images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' }] },
    { name: 'Minimalist Desk Lamp', description: 'Modern LED desk lamp with adjustable brightness, USB charging port, and touch control.', price: 49.99, discount: 15, stock: 35, category: hId, seller: seller._id, brand: 'LumiHome', images: [{ url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400' }] },
    { name: 'Vitamin C Face Serum', description: 'Brightening vitamin C serum with hyaluronic acid for glowing, youthful skin.', price: 34.99, stock: 80, category: bId, seller: seller._id, brand: 'GlowLab', isFeatured: true, images: [{ url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400' }] },
    { name: '4K Ultra HD Monitor 27in', description: 'Professional 27-inch 4K display with IPS panel, 144Hz refresh rate, and HDR support.', price: 449.99, compareAtPrice: 599.99, discount: 25, stock: 20, category: eId, seller: seller._id, brand: 'PixelVision', isFeatured: true, images: [{ url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400' }] },
    { name: 'Yoga Mat Premium Non-Slip', description: 'Extra thick yoga mat with alignment lines and carry strap for home or studio.', price: 45.99, stock: 55, category: categories.find((c) => c.name === 'Sports & Outdoors')._id, seller: seller._id, brand: 'FlexFit', images: [{ url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400' }] },
    { name: 'Stainless Steel Water Bottle', description: 'Insulated 32oz water bottle that keeps drinks cold for 24 hours or hot for 12 hours.', price: 24.99, stock: 120, category: hId, seller: seller._id, brand: 'HydroFlow', freeShipping: true, images: [{ url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400' }] },
  ];

  for (const data of productData) {
    await Product.create(data);
  }

  console.log(`✓ Seeded: ${CATEGORIES.length} categories, 3 users, ${productData.length} products`);
  console.log('  Admin:    admin@shopnow.com / admin123');
  console.log('  Seller:   seller@shopnow.com / seller123');
  console.log('  Customer: customer@shopnow.com / customer123');
};

module.exports = seedDB;

// Run directly: node utils/seeder.js
if (require.main === module) {
  require('dotenv').config();
  const connectDB = require('../config/db');
  connectDB().then(seedDB).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
