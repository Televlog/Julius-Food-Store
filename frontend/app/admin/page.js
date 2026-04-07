'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { OrderStatusBadge } from '@/components/ui/OrderStatus';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { FiUsers, FiShoppingBag, FiPackage, FiDollarSign, FiTrendingUp, FiClock } from 'react-icons/fi';
import Link from 'next/link';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats().then((res) => setStats(res.data.stats)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue?.toFixed(2) || '0.00'}`, icon: FiDollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Orders', value: stats.totalOrders, icon: FiPackage, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Products', value: stats.totalProducts, icon: FiShoppingBag, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Customers', value: stats.totalUsers, icon: FiUsers, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const monthlyData = stats.revenueByDay?.map((d) => ({
    day: `Day ${d._id}`,
    revenue: d.revenue,
    orders: d.orders,
  })) || [];

  const statusData = stats.ordersByStatus?.map((s) => ({
    name: s._id?.charAt(0).toUpperCase() + s._id?.slice(1),
    value: s.count,
  })) || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
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

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Revenue This Month</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">No data yet</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Orders by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">No orders yet</div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Recent Orders</h3>
            <Link href="/admin/orders" className="text-xs text-primary-600 hover:underline">View All</Link>
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

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Top Selling Products</h3>
            <Link href="/admin/products" className="text-xs text-primary-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {stats.topProducts?.map((product, i) => (
              <div key={product._id} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sold} sold</p>
                </div>
                <span className="font-bold text-primary-600">${product.price?.toFixed(2)}</span>
              </div>
            ))}
            {!stats.topProducts?.length && <p className="text-gray-400 text-sm text-center py-4">No products yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
