'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { productAPI, categoryAPI } from '@/lib/api';
import Pagination from '@/components/ui/Pagination';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '', category: '', brand: '', discount: 0 });
  const [saving, setSaving] = useState(false);

  const fetchProducts = async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 20 };
      if (search) params.search = search;
      if (catFilter) params.category = catFilter;
      const res = await productAPI.getAll(params);
      setProducts(res.data.products);
      setPages(res.data.pages);
      setTotal(res.data.total);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(1); }, [search, catFilter]);
  useEffect(() => {
    categoryAPI.getAll().then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

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

  const handleToggleActive = async (product) => {
    try {
      await productAPI.update(product._id, { isActive: !product.isActive });
      setProducts((prev) => prev.map((p) => p._id === product._id ? { ...p, isActive: !p.isActive } : p));
      toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update product');
    }
  };

  const handleSaveProduct = async (e) => {
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
        toast.success('Product created');
      }
      setShowForm(false);
      setEditProduct(null);
      setFormData({ name: '', description: '', price: '', stock: '', category: '', brand: '', discount: 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (product) => {
    setEditProduct(product);
    setFormData({
      name: product.name, description: product.description || '',
      price: product.price, stock: product.stock,
      category: product.category?._id || '', brand: product.brand || '',
      discount: product.discount || 0,
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products <span className="text-gray-400 font-normal text-lg">({total})</span></h1>
        <button onClick={() => { setShowForm(true); setEditProduct(null); setFormData({ name: '', description: '', price: '', stock: '', category: '', brand: '', discount: 0 }); }}
          className="btn-primary flex items-center gap-2 text-sm">
          <FiPlus size={16} /> Add Product
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6">{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                    <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
                    <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                    <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field">
                      <option value="">Select Category</option>
                      {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Price ($) *</label>
                    <input required type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock *</label>
                    <input required type="number" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount (%)</label>
                    <input type="number" min="0" max="100" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                  <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field resize-none" />
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => { setShowForm(false); setEditProduct(null); }} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editProduct ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9 text-sm py-2" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="input-field w-auto text-sm py-2">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
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
              {loading ? Array(6).fill(0).map((_, i) => (
                <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>)}</tr>
              )) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No products found</td></tr>
              ) : products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image src={p.images?.[0]?.url || 'https://via.placeholder.com/40'} alt={p.name} fill className="object-contain p-1" />
                      </div>
                      <p className="font-medium text-gray-900 line-clamp-2 max-w-[200px]">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category?.name}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">${p.price?.toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={p.stock === 0 ? 'text-red-500 font-medium' : p.stock < 10 ? 'text-orange-500 font-medium' : 'text-gray-700'}>{p.stock}</span></td>
                  <td className="px-4 py-3 text-gray-600">{p.sold || 0}</td>
                  <td className="px-4 py-3"><span className={p.isActive ? 'badge-green' : 'badge-red'}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><FiEdit2 size={14} /></button>
                      <button onClick={() => handleToggleActive(p)} className={`p-1.5 rounded-lg ${p.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}>
                        {p.isActive ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                      </button>
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
