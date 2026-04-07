import React, { createContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '@/lib/api';
import { useAuth } from './auth-context';

interface CartItem {
  _id: string;
  product: any;
  quantity: number;
  price: number;
  name?: string;
}

interface Cart {
  items: CartItem[];
  discountAmount?: number;
  couponCode?: string;
}

interface CartContextValue {
  cart: Cart;
  cartLoading: boolean;
  cartItemCount: number;
  cartSubtotal: number;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [] });
  const [cartLoading, setCartLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) { setCart({ items: [] }); return; }
    try {
      setCartLoading(true);
      const res = await cartAPI.get() as any;
      setCart(res.cart || { items: [] });
    } catch {
      // silently fail
    } finally {
      setCartLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) return false;
    try {
      const res = await cartAPI.add(productId, quantity) as any;
      setCart(res.cart);
      return true;
    } catch {
      return false;
    }
  };

  const updateItem = async (itemId: string, quantity: number) => {
    try {
      const res = await cartAPI.update(itemId, quantity) as any;
      setCart(res.cart);
    } catch {}
  };

  const removeItem = async (itemId: string) => {
    try {
      await cartAPI.remove(itemId);
      setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i._id !== itemId) }));
    } catch {}
  };

  const clearCart = async () => {
    try {
      await cartAPI.clear();
      setCart({ items: [] });
    } catch {}
  };

  const cartItemCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext value={{ cart, cartLoading, cartItemCount, cartSubtotal, addToCart, updateItem, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext>
  );
}

export function useCart() {
  const ctx = React.use(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
