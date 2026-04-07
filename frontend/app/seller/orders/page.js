'use client';
import { useState, useEffect } from 'react';
import { sellerAPI } from '@/lib/api';
import { OrderStatusBadge } from '@/components/ui/OrderStatus';
import Pagination from '@/components/ui/Pagination';

const STATUS_FILTERS = ['All', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchOrders = async (pg = 1) => {
    setLoading(true);
    const params = { page: pg, limit: 20 };
    if (statusFilter !== 'All') params.status = statusFilter;
    try {
      const res = await sellerAPI.getOrders(params);
      setOrders(res.data.orders);
      setPages(res.data.pages);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(1); }, [statusFilter]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
            {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Order #</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Items</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>)}</tr>
              )) : orders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No orders found</td></tr>
              ) : orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.user?.name}</p>
                    <p className="text-xs text-gray-500">{order.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.items?.filter((i) => i.seller?.toString() === order.items[0]?.seller?.toString()).length || order.items?.length}</td>
                  <td className="px-4 py-3 font-bold">${order.totalPrice?.toFixed(2)}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100">
          <Pagination page={page} pages={pages} onPageChange={fetchOrders} />
        </div>
      </div>
    </div>
  );
}
