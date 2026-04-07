'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/lib/api';
import { OrderStatusBadge } from '@/components/ui/OrderStatus';
import Pagination from '@/components/ui/Pagination';
import { FiPackage, FiChevronRight } from 'react-icons/fi';

const STATUS_FILTERS = ['All', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    const params = { page, limit: 10 };
    if (statusFilter !== 'All') params.status = statusFilter;
    orderAPI.getMyOrders(params).then((res) => {
      setOrders(res.data.orders);
      setPages(res.data.pages);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, router, page, statusFilter]);

  if (loading) {
    return (
      <div className="page-container py-8 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <FiPackage className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet</p>
          <Link href="/products" className="btn-primary inline-block">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order._id} href={`/orders/${order._id}`} className="block">
              <div className="card hover:shadow-card-hover transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-bold text-primary-600">${order.totalPrice.toFixed(2)}</span>
                    <FiChevronRight className="text-gray-400" size={18} />
                  </div>
                </div>

                <div className="flex items-center gap-3 overflow-hidden">
                  {order.items.slice(0, 4).map((item, i) => (
                    <div key={i} className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={item.image || item.product?.images?.[0]?.url || 'https://via.placeholder.com/60'}
                        alt={item.name}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="w-14 h-14 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-500 font-medium">
                      +{order.items.length - 4}
                    </div>
                  )}
                  <div className="ml-2">
                    <p className="text-sm text-gray-700 line-clamp-1">{order.items[0]?.name}</p>
                    {order.items.length > 1 && (
                      <p className="text-xs text-gray-500">+{order.items.length - 1} more items</p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          <Pagination page={page} pages={pages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
