'use client';
import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { productAPI } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);

  const effectivePrice = product.discount > 0
    ? (product.price * (1 - product.discount / 100)).toFixed(2)
    : product.price?.toFixed(2);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    setAdding(true);
    await addToCart(product._id, 1);
    setAdding(false);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login first'); return; }
    try {
      const res = await productAPI.toggleWishlist(product._id);
      setWishlisted(res.data.inWishlist);
      toast.success(res.data.message);
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  return (
    <Link href={`/products/${product.slug || product._id}`} className="group">
      <div className="product-card bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={product.images?.[0]?.url || 'https://via.placeholder.com/300x300?text=No+Image'}
            alt={product.name}
            fill
            className="product-image object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {/* Discount badge */}
          {product.discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{product.discount}%
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Out of Stock</span>
            </div>
          )}
          {/* Wishlist btn */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 p-2 rounded-full shadow transition-all ${
              wishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <FiHeart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1">
          <p className="text-xs text-gray-500 mb-1 truncate">{product.brand || product.category?.name}</p>
          <h3 className="font-medium text-gray-900 text-sm leading-snug mb-2 line-clamp-2 flex-1">{product.name}</h3>

          {/* Rating */}
          {product.ratings?.count > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FiStar
                    key={s}
                    size={12}
                    fill={s <= Math.round(product.ratings.average) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">({product.ratings.count})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-primary-600 font-bold">${effectivePrice}</span>
            {product.discount > 0 && (
              <span className="text-gray-400 line-through text-xs">${product.price?.toFixed(2)}</span>
            )}
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || adding}
            className="flex items-center justify-center gap-2 w-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiShoppingCart size={14} />
            {adding ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  );
}
