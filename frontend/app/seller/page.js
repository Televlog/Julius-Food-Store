'use client';
import { useState, useEffect } from 'react';
import { sellerAPI } from '@/lib/api';
import { OrderStatusBadge } from '@/components/ui/OrderStatus';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiDollarSign, FiPackage, FiShoppingBag, FiTrendingUp } from 'react-icons/fi';
import Link from 'next/link';

export default function SellerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerAPI.getStats().then((res) => setStats(res.data.stats)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Seller Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue?.toFixed(2) || '0.00'}`, icon: FiDollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'This Month', value: `$${stats.monthRevenue?.toFixed(2) || '0.00'}`, icon: FiTrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Orders', value: stats.totalOrders || 0, icon: FiPackage, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Active Products', value: stats.activeProducts || 0, icon: FiShoppingBag, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
        <Link href="/seller/products" className="btn-primary text-sm">+ Add Product</Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl shadow-card p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
              </div>
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={color} size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Top Selling Products</h3>
            <Link href="/seller/products" className="text-xs text-primary-600 hover:underline">View All</Link>
          </div>
          {stats.topProducts?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.topProducts?.map((p) => ({ name: p.name.slice(0, 20), sold: p.sold }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="sold" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No sales data yet</div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Recent Orders</h3>
            <Link href="/seller/orders" className="text-xs text-primary-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {stats.recentOrders?.slice(0, 6).map((order) => (
              <div key={order._id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{order.user?.name}</p>
                </div>
                <div className="text-right">
                  <OrderStatusBadge status={order.status} />
                  <p className="text-xs font-bold text-gray-800 mt-1">${order.totalPrice?.toFixed(2)}</p>
                </div>
              </div>
            ))}
            {!stats.recentOrders?.length && <p className="text-gray-400 text-sm text-center py-4">No orders yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
