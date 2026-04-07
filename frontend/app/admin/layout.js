'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  FiHome, FiPackage, FiShoppingBag, FiUsers, FiTag, FiBarChart2,
  FiSettings, FiLogOut, FiMenu,
} from 'react-icons/fi';
import { MdStorefront } from 'react-icons/md';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: FiHome, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: FiPackage },
  { href: '/admin/products', label: 'Products', icon: FiShoppingBag },
  { href: '/admin/users', label: 'Users', icon: FiUsers },
  { href: '/admin/categories', label: 'Categories', icon: FiTag },
  { href: '/admin/coupons', label: 'Coupons', icon: FiTag },
  { href: '/admin/reports', label: 'Reports', icon: FiBarChart2 },
];

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') return null;

  const isActive = (href, exact) => exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-800">
          <MdStorefront size={24} className="text-primary-400" />
          <span className="font-bold text-lg">Admin Panel</span>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href, exact) ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t border-gray-800 space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800">
            <FiHome size={18} /> View Store
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 w-full text-left"
          >
            <FiLogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900">
            <FiMenu size={22} />
          </button>
          <div className="flex-1">
            <p className="text-sm text-gray-500">Logged in as <strong>{user.name}</strong> (Admin)</p>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
