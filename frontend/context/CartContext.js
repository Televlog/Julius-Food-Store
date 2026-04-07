'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '@/lib/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], totalItems: 0, subtotal: 0 });
  const [cartLoading, setCartLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], totalItems: 0, subtotal: 0 });
      return;
    }
    try {
      setCartLoading(true);
      const res = await cartAPI.get();
      setCart(res.data.cart);
    } catch {
      // silently fail
    } finally {
      setCartLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1, selectedVariants = []) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return false;
    }
    try {
      const res = await cartAPI.add({ productId, quantity, selectedVariants });
      setCart(res.data.cart);
      toast.success('Added to cart!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
      return false;
    }
  };

  const updateItem = async (itemId, quantity) => {
    try {
      const res = await cartAPI.update(itemId, quantity);
      setCart(res.data.cart);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update cart');
    }
  };

  const removeItem = async (itemId) => {
    try {
      await cartAPI.remove(itemId);
      setCart((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item._id !== itemId),
      }));
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clear();
      setCart({ items: [], totalItems: 0, subtotal: 0 });
    } catch {
      toast.error('Failed to clear cart');
    }
  };

  const applyCoupon = async (code) => {
    try {
      const res = await cartAPI.applyCoupon(code);
      setCart((prev) => ({ ...prev, discountAmount: res.data.discountAmount, couponCode: code }));
      toast.success(res.data.message);
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      return null;
    }
  };

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const cartSubtotal = cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{
      cart, cartLoading, cartItemCount, cartSubtotal,
      addToCart, updateItem, removeItem, clearCart, applyCoupon, fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
