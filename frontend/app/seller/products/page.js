'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { sellerAPI, productAPI, categoryAPI } from '@/lib/api';
import Pagination from '@/components/ui/Pagination';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SellerProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', shortDescription: '', price: '', stock: '',
    category: '', brand: '', discount: 0, freeShipping: false,
  });

  const fetchProducts = async (pg = 1) => {
    setLoading(true);
    try {
      const res = await sellerAPI.getProducts({ page: pg, limit: 20 });
      setProducts(res.data.products);
      setPages(res.data.pages);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
    categoryAPI.getAll().then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  const openEdit = (p) => {
    setEditProduct(p);
    setFormData({
      name: p.name, description: p.description || '', shortDescription: p.shortDescription || '',
      price: p.price, stock: p.stock, category: p.category?._id || '',
      brand: p.brand || '', discount: p.discount || 0, freeShipping: p.freeShipping || false,
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editProduct) {
        const res = await productAPI.update(editProduct._id, formData);
        setProducts((prev) => prev.map((p) => p._id === editProduct._id ? res.data.product : p));
        toast.success('Product updated');
      } else {
        const res = await productAPI.create(formData);
        setProducts((prev) => [res.data.product, ...prev]);
        toast.success('Product created!');
      }
      setShowForm(false);
      setEditProduct(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
        <button
          onClick={() => { setShowForm(true); setEditProduct(null); setFormData({ name: '', description: '', shortDescription: '', price: '', stock: '', category: '', brand: '', discount: 0, freeShipping: false }); }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <FiPlus size={16} /> Add Product
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">{editProduct ? 'Edit Product' : 'New Product'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { key: 'name', label: 'Product Name', required: true, type: 'text' },
                    { key: 'brand', label: 'Brand', type: 'text' },
                    { key: 'price', label: 'Price ($)', required: true, type: 'number' },
                    { key: 'stock', label: 'Stock Qty', required: true, type: 'number' },
                    { key: 'discount', label: 'Discount (%)', type: 'number' },
                  ].map(({ key, label, required, type }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && ' *'}</label>
                      <input
                        type={type}
                        required={required}
                        value={formData[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        className="input-field"
                        min={type === 'number' ? 0 : undefined}
                        step={key === 'price' ? '0.01' : undefined}
                        max={key === 'discount' ? 100 : undefined}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                    <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field">
                      <option value="">Select Category</option>
                      {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
                  <input type="text" value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} className="input-field" maxLength={200} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                  <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field resize-none" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.freeShipping} onChange={(e) => setFormData({ ...formData, freeShipping: e.target.checked })} className="rounded text-primary-500" />
                  <span className="text-sm text-gray-700">Free Shipping</span>
                </label>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editProduct ? 'Update' : 'Create Product'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Price</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Stock</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sold</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>)}</tr>
              )) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No products yet. Add your first product!</td></tr>
              ) : products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image src={p.images?.[0]?.url || 'https://via.placeholder.com/40'} alt={p.name} fill className="object-contain p-1" />
                      </div>
                      <p className="font-medium text-gray-900 line-clamp-2 max-w-[180px]">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category?.name}</td>
                  <td className="px-4 py-3 font-bold">${p.price?.toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={p.stock === 0 ? 'text-red-500 font-medium' : p.stock < 10 ? 'text-orange-500 font-medium' : ''}>{p.stock}</span></td>
                  <td className="px-4 py-3 text-gray-600">{p.sold || 0}</td>
                  <td className="px-4 py-3"><span className={p.isActive ? 'badge-green' : 'badge-red'}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><FiEdit2 size={14} /></button>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100">
          <Pagination page={page} pages={pages} onPageChange={fetchProducts} />
        </div>
      </div>
    </div>
  );
}
