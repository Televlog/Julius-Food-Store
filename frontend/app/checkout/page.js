'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { orderAPI, userAPI } from '@/lib/api';
import { FiCreditCard, FiTruck, FiShield, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { MdPayment } from 'react-icons/md';
import Image from 'next/image';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'stripe', label: 'Credit/Debit Card (Stripe)', icon: FiCreditCard },
  { id: 'cod', label: 'Cash on Delivery', icon: FiTruck },
  { id: 'paypal', label: 'PayPal', icon: MdPayment },
];

export default function CheckoutPage() {
  const { cart, cartSubtotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=address, 2=payment, 3=review

  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', postalCode: '', country: 'UAE',
  });
  const [addingNew, setAddingNew] = useState(false);

  const TAX_RATE = 0.05;
  const shippingFee = cartSubtotal >= 100 ? 0 : 9.99;
  const tax = cartSubtotal * TAX_RATE;
  const discount = cart?.discountAmount || 0;
  const total = cartSubtotal + shippingFee + tax - discount;

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    userAPI.getAddresses().then((res) => {
      setAddresses(res.data.addresses);
      const def = res.data.addresses.find((a) => a.isDefault);
      if (def) setSelectedAddress(def);
      else if (res.data.addresses.length > 0) setSelectedAddress(res.data.addresses[0]);
    }).catch(() => {});
  }, [user, router]);

  useEffect(() => {
    if (!cart?.items?.length) router.push('/cart');
  }, [cart, router]);

  const handleSaveAddress = async () => {
    const required = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
    for (const f of required) {
      if (!newAddress[f]) { toast.error(`Please fill in ${f}`); return; }
    }
    try {
      const res = await userAPI.addAddress(newAddress);
      setAddresses(res.data.addresses);
      setSelectedAddress(res.data.addresses[res.data.addresses.length - 1]);
      setAddingNew(false);
      toast.success('Address saved');
    } catch {
      toast.error('Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }
    setLoading(true);
    try {
      const orderData = {
        items: cart.items.map((item) => ({
          product: item.product?._id || item.product,
          quantity: item.quantity,
          selectedVariants: item.selectedVariants || [],
        })),
        shippingAddress: {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
        },
        paymentMethod,
        couponCode: cart.couponCode,
      };

      const res = await orderAPI.create(orderData);
      const order = res.data.order;

      if (paymentMethod === 'cod') {
        toast.success('Order placed! Pay on delivery.');
        router.push(`/orders/${order._id}?success=true`);
      } else if (paymentMethod === 'stripe') {
        router.push(`/checkout/payment?orderId=${order._id}`);
      } else {
        toast.success('Order placed!');
        router.push(`/orders/${order._id}?success=true`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {['Delivery Address', 'Payment', 'Review Order'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > i ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${step === i + 1 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{s}</span>
            {i < 2 && <div className="w-8 sm:w-16 h-0.5 bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1: Address */}
          <div className="card">
            <button className="flex justify-between w-full items-center" onClick={() => setStep(step === 1 ? 0 : 1)}>
              <h2 className="font-bold text-lg flex items-center gap-2"><FiTruck className="text-primary-500" /> Delivery Address</h2>
              {step === 1 ? <FiChevronUp /> : <FiChevronDown />}
            </button>

            {step === 1 && (
              <div className="mt-4 space-y-3">
                {addresses.map((addr) => (
                  <label key={addr._id} className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedAddress?._id === addr._id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" checked={selectedAddress?._id === addr._id} onChange={() => setSelectedAddress(addr)} className="mt-0.5 text-primary-500" />
                    <div>
                      <p className="font-semibold text-gray-900">{addr.fullName} — {addr.label}</p>
                      <p className="text-sm text-gray-600">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                      <p className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.postalCode}, {addr.country}</p>
                      <p className="text-sm text-gray-500">{addr.phone}</p>
                    </div>
                  </label>
                ))}

                {!addingNew ? (
                  <button onClick={() => setAddingNew(true)} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors text-sm font-medium">
                    + Add New Address
                  </button>
                ) : (
                  <div className="border-2 border-primary-200 rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-gray-800">New Address</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { key: 'fullName', placeholder: 'Full Name', required: true },
                        { key: 'phone', placeholder: 'Phone Number', required: true },
                        { key: 'addressLine1', placeholder: 'Address Line 1', required: true },
                        { key: 'addressLine2', placeholder: 'Address Line 2 (optional)' },
                        { key: 'city', placeholder: 'City', required: true },
                        { key: 'state', placeholder: 'State / Emirate', required: true },
                        { key: 'postalCode', placeholder: 'Postal Code', required: true },
                        { key: 'country', placeholder: 'Country', required: true },
                      ].map(({ key, placeholder }) => (
                        <input
                          key={key}
                          type="text"
                          placeholder={placeholder}
                          value={newAddress[key]}
                          onChange={(e) => setNewAddress({ ...newAddress, [key]: e.target.value })}
                          className="input-field text-sm"
                        />
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleSaveAddress} className="btn-primary text-sm">Save Address</button>
                      <button onClick={() => setAddingNew(false)} className="btn-secondary text-sm">Cancel</button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedAddress}
                  className="btn-primary w-full mt-2"
                >
                  Continue to Payment
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Payment */}
          {step >= 2 && (
            <div className="card">
              <button className="flex justify-between w-full items-center" onClick={() => setStep(step === 2 ? 0 : 2)}>
                <h2 className="font-bold text-lg flex items-center gap-2"><FiCreditCard className="text-primary-500" /> Payment Method</h2>
                {step === 2 ? <FiChevronUp /> : <FiChevronDown />}
              </button>

              {step === 2 && (
                <div className="mt-4 space-y-3">
                  {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                    <label key={id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" value={id} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="text-primary-500" />
                      <Icon className="text-gray-600" size={20} />
                      <span className="font-medium text-gray-800">{label}</span>
                    </label>
                  ))}

                  <button onClick={() => setStep(3)} className="btn-primary w-full mt-2">
                    Review Order
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step >= 3 && (
            <div className="card">
              <h2 className="font-bold text-lg mb-4">Review Your Order</h2>
              <div className="space-y-3 mb-4">
                {cart?.items?.map((item) => (
                  <div key={item._id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <Image src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/50'} alt="" fill className="object-contain p-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name || item.product?.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1 mb-4">
                <p><span className="text-gray-500">Deliver to:</span> <span className="font-medium">{selectedAddress?.fullName}, {selectedAddress?.city}</span></p>
                <p><span className="text-gray-500">Payment:</span> <span className="font-medium capitalize">{paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod}</span></p>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="btn-primary w-full text-base flex items-center justify-center gap-2"
              >
                <FiShield size={18} />
                {loading ? 'Placing Order...' : `Place Order — $${total.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div>
          <div className="card sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>${cartSubtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className={shippingFee === 0 ? 'text-green-600' : ''}>{shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Tax (5%)</span><span>${tax.toFixed(2)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>}
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary-600">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
