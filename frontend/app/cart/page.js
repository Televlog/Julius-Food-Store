'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { FiMinus, FiPlus, FiTrash2, FiTag, FiArrowRight, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, cartLoading, updateItem, removeItem, clearCart, applyCoupon, cartSubtotal } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [coupon, setCoupon] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const TAX_RATE = 0.05;
  const SHIPPING_THRESHOLD = 100;
  const shippingFee = cartSubtotal >= SHIPPING_THRESHOLD ? 0 : 9.99;
  const tax = cartSubtotal * TAX_RATE;
  const discount = cart?.discountAmount || 0;
  const total = cartSubtotal + shippingFee + tax - discount;

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setApplyingCoupon(true);
    await applyCoupon(coupon.trim());
    setApplyingCoupon(false);
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to checkout');
      router.push('/auth/login');
      return;
    }
    router.push('/checkout');
  };

  if (!user) {
    return (
      <div className="page-container py-20 text-center">
        <FiShoppingCart className="mx-auto text-gray-300 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Sign in to view your cart</p>
        <Link href="/auth/login" className="btn-primary inline-block">Sign In</Link>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="page-container py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="page-container py-20 text-center">
        <FiShoppingCart className="mx-auto text-gray-300 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven&apos;t added anything yet</p>
        <Link href="/products" className="btn-primary inline-block">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="page-container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart <span className="text-gray-400 font-normal text-lg">({items.length} items)</span></h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:underline flex items-center gap-1">
          <FiTrash2 size={14} /> Clear All
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const product = item.product;
            return (
              <div key={item._id} className="card flex gap-4">
                <Link href={`/products/${product?.slug || product?._id}`} className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={product?.images?.[0]?.url || 'https://via.placeholder.com/100x100'}
                    alt={item.name || product?.name}
                    fill
                    className="object-contain p-2"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/products/${product?.slug || product?._id}`} className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2 text-sm md:text-base">
                    {item.name || product?.name}
                  </Link>
                  {item.selectedVariants?.map((v) => (
                    <p key={v.name} className="text-xs text-gray-500">{v.name}: {v.value}</p>
                  ))}
                  <p className="text-primary-600 font-bold mt-1">${item.price?.toFixed(2)}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button onClick={() => item.quantity <= 1 ? removeItem(item._id) : updateItem(item._id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-50 rounded-l-lg">
                        <FiMinus size={14} />
                      </button>
                      <span className="px-3 text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateItem(item._id, item.quantity + 1)}
                        className="p-2 hover:bg-gray-50 rounded-r-lg">
                        <FiPlus size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => removeItem(item._id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div>
          <div className="card sticky top-24">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({items.length} items)</span>
                <span className="font-medium">${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className={shippingFee === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                  {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (5%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({cart.couponCode})</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {shippingFee > 0 && (
              <p className="text-xs text-primary-600 bg-primary-50 p-2 rounded-lg mb-4">
                Add ${(SHIPPING_THRESHOLD - cartSubtotal).toFixed(2)} more for free shipping!
              </p>
            )}

            {/* Coupon */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  className="input-field pl-8 text-sm py-2"
                />
              </div>
              <button
                onClick={handleApplyCoupon}
                disabled={applyingCoupon || !coupon}
                className="btn-secondary text-sm py-2 px-3"
              >
                {applyingCoupon ? '...' : 'Apply'}
              </button>
            </div>

            <div className="border-t border-gray-200 pt-3 mb-5">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={handleCheckout} className="btn-primary w-full flex items-center justify-center gap-2 text-base">
              Proceed to Checkout <FiArrowRight />
            </button>

            <Link href="/products" className="block text-center text-sm text-gray-500 hover:text-primary-600 mt-3">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
