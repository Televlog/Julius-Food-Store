'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { userAPI, authAPI } from '@/lib/api';
import { FiUser, FiPackage, FiHeart, FiMapPin, FiKey, FiEdit2, FiCheck } from 'react-icons/fi';
import { MdStorefront } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: '', phone: '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [addresses, setAddresses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    setForm({ name: user.name, phone: user.phone || '' });
    userAPI.getAddresses().then((res) => setAddresses(res.data.addresses)).catch(() => {});
  }, [user, router]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await userAPI.updateProfile(form);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await authAPI.updatePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addrId) => {
    try {
      await userAPI.deleteAddress(addrId);
      setAddresses((prev) => prev.filter((a) => a._id !== addrId));
      toast.success('Address deleted');
    } catch {
      toast.error('Failed to delete address');
    }
  };

  if (!user) return null;

  const TABS = [
    { id: 'profile', label: 'My Profile', icon: FiUser },
    { id: 'addresses', label: 'Addresses', icon: FiMapPin },
    { id: 'security', label: 'Security', icon: FiKey },
  ];

  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Account</h1>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="card text-center mb-4">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-bold text-primary-700">
              {user.avatar?.url ? (
                <Image src={user.avatar.url} alt={user.name} width={80} height={80} className="rounded-full object-cover" />
              ) : (
                user.name?.charAt(0).toUpperCase()
              )}
            </div>
            <p className="font-bold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className={`badge mt-2 ${user.role === 'admin' ? 'badge-red' : user.role === 'seller' ? 'badge-blue' : 'badge-green'}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>

          <nav className="card space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Icon size={16} /> {label}
              </button>
            ))}
            <Link href="/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <FiPackage size={16} /> My Orders
            </Link>
            <Link href="/profile/wishlist" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <FiHeart size={16} /> Wishlist
            </Link>
            {user.role !== 'seller' && (
              <Link href="/auth/become-seller" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-700 hover:bg-primary-50">
                <MdStorefront size={16} /> Become a Seller
              </Link>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {tab === 'profile' && (
            <div className="card">
              <h2 className="font-bold text-lg text-gray-900 mb-6">Personal Information</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input type="email" value={user.email} disabled className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" />
                  {user.isEmailVerified ? (
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><FiCheck size={12} /> Verified</p>
                  ) : (
                    <p className="text-xs text-orange-500 mt-1">Email not verified</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input-field"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  <FiEdit2 size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {tab === 'addresses' && (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg text-gray-900">Saved Addresses</h2>
                <Link href="/profile/addresses/new" className="btn-primary text-sm py-2">+ Add Address</Link>
              </div>
              {addresses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FiMapPin className="mx-auto mb-3 text-gray-300" size={48} />
                  <p>No addresses saved</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div key={addr._id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{addr.fullName}</p>
                            <span className="badge badge-gray">{addr.label}</span>
                            {addr.isDefault && <span className="badge badge-green">Default</span>}
                          </div>
                          <p className="text-sm text-gray-600">{addr.addressLine1}, {addr.city}, {addr.country}</p>
                          <p className="text-sm text-gray-500">{addr.phone}</p>
                        </div>
                        <button onClick={() => handleDeleteAddress(addr._id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'security' && (
            <div className="card">
              <h2 className="font-bold text-lg text-gray-900 mb-6">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                {[
                  { key: 'currentPassword', label: 'Current Password' },
                  { key: 'newPassword', label: 'New Password' },
                  { key: 'confirmPassword', label: 'Confirm New Password' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                    <input
                      type="password"
                      value={passForm[key]}
                      onChange={(e) => setPassForm({ ...passForm, [key]: e.target.value })}
                      required
                      className="input-field"
                    />
                  </div>
                ))}
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
