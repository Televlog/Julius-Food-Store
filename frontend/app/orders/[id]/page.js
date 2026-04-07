'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/lib/api';
import { OrderStatusBadge, OrderTimeline } from '@/components/ui/OrderStatus';
import { FiPackage, FiMapPin, FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const isSuccess = searchParams.get('success');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    orderAPI.getOne(id).then((res) => setOrder(res.data.order)).catch(() => router.push('/orders')).finally(() => setLoading(false));
  }, [id, user, router]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const res = await orderAPI.cancel(id, 'Cancelled by customer');
      setOrder(res.data.order);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="page-container py-8"><div className="skeleton h-96 rounded-xl" /></div>;
  if (!order) return null;

  return (
    <div className="page-container py-8">
      {isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-center">
          <FiCheckCircle className="text-green-500 mx-auto mb-2" size={40} />
          <h2 className="text-xl font-bold text-green-800 mb-1">Order Placed Successfully!</h2>
          <p className="text-green-600">Thank you for your order. A confirmation email has been sent.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="text-gray-500 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {['pending', 'confirmed', 'processing'].includes(order.status) && (
            <button onClick={handleCancel} disabled={cancelling} className="btn-danger text-sm py-2">
              {cancelling ? '...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {order.status !== 'cancelled' && (
        <div className="card mb-6 overflow-x-auto">
          <h3 className="font-semibold text-gray-800 mb-4">Order Tracking</h3>
          <OrderTimeline statusHistory={order.statusHistory} />
          {order.trackingNumber && (
            <p className="text-sm text-gray-600 mt-3">Tracking: <span className="font-mono font-semibold text-primary-600">{order.trackingNumber}</span> via {order.courierName}</p>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiPackage className="text-primary-500" /> Order Items ({order.items.length})
            </h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item._id} className="flex gap-4">
                  <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <Image src={item.image || 'https://via.placeholder.com/64'} alt={item.name} fill className="object-contain p-1" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                    {item.selectedVariants?.map((v) => (
                      <p key={v.name} className="text-xs text-gray-500">{v.name}: {v.value}</p>
                    ))}
                    <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                  <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FiMapPin className="text-primary-500" /> Delivery Address
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p>{order.shippingAddress.phone}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Items</span><span>${order.itemsPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span>{order.shippingPrice === 0 ? 'FREE' : `$${order.shippingPrice.toFixed(2)}`}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Tax</span><span>${order.taxPrice.toFixed(2)}</span></div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span><span>-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Total</span><span className="text-primary-600">${order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FiCreditCard className="text-primary-500" /> Payment
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="capitalize font-medium">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={order.isPaid ? 'text-green-600 font-medium' : 'text-orange-500 font-medium'}>
                  {order.isPaid ? `Paid on ${new Date(order.paidAt).toLocaleDateString()}` : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <Link href="/orders" className="btn-secondary">← Back to Orders</Link>
        {order.status === 'delivered' && (
          <Link href={`/products?review=${id}`} className="btn-primary">Write a Review</Link>
        )}
      </div>
    </div>
  );
}
