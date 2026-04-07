'use client';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import Pagination from '@/components/ui/Pagination';
import { FiSearch, FiUserCheck, FiUserX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = async (pg = 1) => {
    setLoading(true);
    const params = { page: pg, limit: 20 };
    if (roleFilter) params.role = roleFilter;
    if (search) params.search = search;
    try {
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.users);
      setPages(res.data.pages);
      setTotal(res.data.total);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(1); }, [roleFilter, search]);

  const toggleActive = async (userId, isActive) => {
    try {
      await adminAPI.updateUser(userId, { isActive: !isActive });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isActive: !isActive } : u));
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update user');
    }
  };

  const approveSeller = async (userId) => {
    try {
      await adminAPI.approveSeller(userId);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, sellerInfo: { ...u.sellerInfo, isApproved: true } } : u));
      toast.success('Seller approved!');
    } catch {
      toast.error('Failed to approve seller');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users <span className="text-gray-400 font-normal text-lg">({total})</span></h1>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-sm py-2"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field w-auto text-sm py-2">
          <option value="">All Roles</option>
          <option value="customer">Customers</option>
          <option value="seller">Sellers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">User</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Joined</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i}>{Array(5).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>)}</tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'seller' ? 'badge-blue' : 'badge-gray'}`}>
                        {u.role}
                      </span>
                      {u.role === 'seller' && (
                        <span className={`badge ml-1 ${u.sellerInfo?.isApproved ? 'badge-green' : 'badge-yellow'}`}>
                          {u.sellerInfo?.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={u.isActive ? 'badge-green' : 'badge-red'}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(u._id, u.isActive)}
                          className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {u.isActive ? <FiUserX size={16} /> : <FiUserCheck size={16} />}
                        </button>
                        {u.role === 'seller' && !u.sellerInfo?.isApproved && (
                          <button
                            onClick={() => approveSeller(u._id)}
                            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-lg"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100">
          <Pagination page={page} pages={pages} onPageChange={fetchUsers} />
        </div>
      </div>
    </div>
  );
}
