'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  FiShoppingCart, FiUser, FiSearch, FiMenu, FiX, FiHeart,
  FiPackage, FiLogOut, FiSettings, FiChevronDown,
} from 'react-icons/fi';
import { MdStorefront } from 'react-icons/md';
import { RiAdminLine } from 'react-icons/ri';

export default function Header() {
  const { user, logout } = useAuth();
  const { cartItemCount } = useCart();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
      {/* Top bar */}
      <div className="page-container">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-primary-400 font-bold text-xl shrink-0">
            <MdStorefront size={28} />
            <span className="hidden sm:block">ShopNow</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="flex">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, brands..."
                className="flex-1 px-4 py-2 text-gray-900 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <button
                type="submit"
                className="bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded-r-lg transition-colors"
              >
                <FiSearch size={18} />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Wishlist */}
            {user && (
              <Link href="/profile/wishlist" className="hidden sm:flex items-center gap-1 hover:text-primary-400 transition-colors p-2">
                <FiHeart size={20} />
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" className="relative flex items-center gap-1 hover:text-primary-400 transition-colors p-2">
              <FiShoppingCart size={22} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 hover:text-primary-400 transition-colors p-2"
                >
                  {user.avatar?.url ? (
                    <Image src={user.avatar.url} alt={user.name} width={32} height={32} className="rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-sm font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                  <FiChevronDown size={14} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-semibold text-sm truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm" onClick={() => setUserMenuOpen(false)}>
                      <FiUser size={16} /> My Profile
                    </Link>
                    <Link href="/orders" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm" onClick={() => setUserMenuOpen(false)}>
                      <FiPackage size={16} /> My Orders
                    </Link>
                    <Link href="/profile/wishlist" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm" onClick={() => setUserMenuOpen(false)}>
                      <FiHeart size={16} /> Wishlist
                    </Link>
                    {user.role === 'seller' && (
                      <Link href="/seller" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-primary-600" onClick={() => setUserMenuOpen(false)}>
                        <MdStorefront size={16} /> Seller Dashboard
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-primary-600" onClick={() => setUserMenuOpen(false)}>
                        <RiAdminLine size={16} /> Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1">
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-red-500 w-full text-left"
                      >
                        <FiLogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/auth/login" className="text-sm hover:text-primary-400 transition-colors px-3 py-2">Login</Link>
                <Link href="/auth/register" className="bg-primary-500 hover:bg-primary-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">Sign Up</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden p-2 hover:text-primary-400">
              {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden bg-gray-800 border-t border-gray-700 px-4 py-4 space-y-3">
          {!user ? (
            <>
              <Link href="/auth/login" className="block text-center py-2 hover:text-primary-400" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link href="/auth/register" className="block text-center bg-primary-500 py-2 rounded-lg" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          ) : (
            <>
              <Link href="/profile" className="flex items-center gap-2 py-2" onClick={() => setMenuOpen(false)}><FiUser /> Profile</Link>
              <Link href="/orders" className="flex items-center gap-2 py-2" onClick={() => setMenuOpen(false)}><FiPackage /> Orders</Link>
              <Link href="/profile/wishlist" className="flex items-center gap-2 py-2" onClick={() => setMenuOpen(false)}><FiHeart /> Wishlist</Link>
              <button onClick={() => { logout(); setMenuOpen(false); }} className="flex items-center gap-2 py-2 text-red-400 w-full">
                <FiLogOut /> Logout
              </button>
            </>
          )}
        </div>
      )}

      {/* Nav bar */}
      <nav className="bg-gray-800 border-t border-gray-700 hidden md:block">
        <div className="page-container">
          <div className="flex items-center gap-6 h-10 text-sm text-gray-300">
            <Link href="/products" className="hover:text-primary-400 transition-colors">All Products</Link>
            <Link href="/products?category=electronics" className="hover:text-primary-400 transition-colors">Electronics</Link>
            <Link href="/products?category=fashion" className="hover:text-primary-400 transition-colors">Fashion</Link>
            <Link href="/products?category=home" className="hover:text-primary-400 transition-colors">Home & Garden</Link>
            <Link href="/products?category=beauty" className="hover:text-primary-400 transition-colors">Beauty</Link>
            <Link href="/products?sort=popular" className="hover:text-primary-400 transition-colors">Best Sellers</Link>
            <Link href="/products?isFeatured=true" className="text-primary-400 font-medium hover:text-primary-300 transition-colors">Deals</Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
