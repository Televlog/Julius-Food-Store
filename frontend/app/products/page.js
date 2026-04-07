'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ui/ProductCard';
import Pagination from '@/components/ui/Pagination';
import { productAPI, categoryAPI } from '@/lib/api';
import { FiFilter, FiX, FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Best Selling' },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'newest',
    minPrice: '',
    maxPrice: '',
    rating: '',
    inStock: false,
    freeShipping: false,
    isFeatured: searchParams.get('isFeatured') || '',
  });

  useEffect(() => {
    categoryAPI.getAll().then((res) => setCategories(res.data.categories.filter((c) => !c.parent)));
  }, []);

  const fetchProducts = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 20, ...filters };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const res = await productAPI.getAll(params);
      setProducts(res.data.products);
      setPages(res.data.pages);
      setTotal(res.data.total);
      setPage(pg);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', sort: 'newest', minPrice: '', maxPrice: '', rating: '', inStock: false, freeShipping: false, isFeatured: '' });
    router.push('/products');
  };

  const FilterSection = ({ title, children }) => {
    const [open, setOpen] = useState(true);
    return (
      <div className="border-b border-gray-200 pb-4 mb-4">
        <button className="flex justify-between items-center w-full text-left font-semibold text-gray-800 mb-3" onClick={() => setOpen(!open)}>
          {title} {open ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
        </button>
        {open && children}
      </div>
    );
  };

  const FiltersPanel = () => (
    <div className="w-64 shrink-0">
      <div className="card sticky top-24">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-gray-900">Filters</h2>
          <button onClick={clearFilters} className="text-xs text-primary-600 hover:underline">Clear All</button>
        </div>

        <FilterSection title="Category">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="category" value="" checked={!filters.category} onChange={() => handleFilterChange('category', '')} className="text-primary-500" />
              <span className="text-sm text-gray-700">All Categories</span>
            </label>
            {categories.map((cat) => (
              <label key={cat._id} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="category" value={cat._id} checked={filters.category === cat._id} onChange={() => handleFilterChange('category', cat._id)} className="text-primary-500" />
                <span className="text-sm text-gray-700">{cat.name}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Price Range">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min $"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <input
              type="number"
              placeholder="Max $"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </FilterSection>

        <FilterSection title="Rating">
          {[4, 3, 2, 1].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="radio" name="rating" value={r} checked={filters.rating === String(r)} onChange={() => handleFilterChange('rating', String(r))} />
              <span className="text-sm text-yellow-500">{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>
              <span className="text-xs text-gray-500">& up</span>
            </label>
          ))}
        </FilterSection>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={filters.inStock} onChange={(e) => handleFilterChange('inStock', e.target.checked)} className="rounded text-primary-500" />
            <span className="text-sm text-gray-700">In Stock Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={filters.freeShipping} onChange={(e) => handleFilterChange('freeShipping', e.target.checked)} className="rounded text-primary-500" />
            <span className="text-sm text-gray-700">Free Shipping</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container py-8">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="input-field w-auto"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 btn-secondary"
          >
            <FiFilter size={16} /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop filters */}
        <div className="hidden lg:block">
          <FiltersPanel />
        </div>

        {/* Products */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              {loading ? 'Loading...' : `${total.toLocaleString()} products found`}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden">
                  <div className="skeleton aspect-square" />
                  <div className="p-3 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or search term</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              <Pagination page={page} pages={pages} onPageChange={fetchProducts} />
            </>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Filters</h2>
              <button onClick={() => setShowFilters(false)}><FiX size={22} /></button>
            </div>
            <FiltersPanel />
          </div>
        </div>
      )}
    </div>
  );
}
