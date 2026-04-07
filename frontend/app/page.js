'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ui/ProductCard';
import { productAPI, categoryAPI } from '@/lib/api';
import { FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiHeadphones } from 'react-icons/fi';

const HERO_SLIDES = [
  {
    title: 'Mega Sale — Up to 70% Off',
    subtitle: 'Thousands of products at incredible prices.',
    cta: 'Shop Now',
    href: '/products?sort=popular',
    bg: 'from-primary-700 to-primary-900',
  },
  {
    title: 'New Electronics Arrivals',
    subtitle: 'Latest gadgets & tech accessories.',
    cta: 'Explore Electronics',
    href: '/products?search=electronics',
    bg: 'from-blue-700 to-blue-900',
  },
  {
    title: 'Fashion & Style',
    subtitle: 'Trending collections for every occasion.',
    cta: 'Browse Fashion',
    href: '/products?search=fashion',
    bg: 'from-purple-700 to-purple-900',
  },
];

const FEATURES = [
  { icon: FiTruck, title: 'Free Shipping', desc: 'On orders over $100' },
  { icon: FiShield, title: 'Secure Payment', desc: '100% protected transactions' },
  { icon: FiRefreshCw, title: 'Easy Returns', desc: '30-day hassle-free returns' },
  { icon: FiHeadphones, title: '24/7 Support', desc: 'Round-the-clock customer help' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [featRes, catRes, newRes] = await Promise.all([
          productAPI.getFeatured(),
          categoryAPI.getAll(),
          productAPI.getAll({ sort: 'newest', limit: 8 }),
        ]);
        setFeatured(featRes.data.products);
        setCategories(catRes.data.categories.filter((c) => !c.parent).slice(0, 8));
        setNewArrivals(newRes.data.products);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Auto-rotate hero
  useEffect(() => {
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const slide = HERO_SLIDES[heroIdx];

  return (
    <div>
      {/* Hero Banner */}
      <section className={`bg-gradient-to-r ${slide.bg} text-white py-20 transition-all duration-700`}>
        <div className="page-container text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">{slide.title}</h1>
          <p className="text-lg md:text-xl text-white/80 mb-8">{slide.subtitle}</p>
          <Link href={slide.href} className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-8 py-3 rounded-full text-lg hover:bg-gray-100 transition-colors shadow-lg">
            {slide.cta} <FiArrowRight />
          </Link>
          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {HERO_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setHeroIdx(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === heroIdx ? 'bg-white w-6' : 'bg-white/50'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-b border-gray-100">
        <div className="page-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="text-primary-600" size={22} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="page-container py-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="section-title mb-0">Shop by Category</h2>
            <Link href="/products" className="text-sm text-primary-600 hover:underline flex items-center gap-1">View All <FiArrowRight size={14} /></Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {categories.map((cat) => (
              <Link key={cat._id} href={`/products?category=${cat._id}`}
                className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-card hover:shadow-card-hover hover:border-primary-300 border border-transparent transition-all group">
                <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center group-hover:bg-primary-100 transition-colors overflow-hidden">
                  {cat.image?.url ? (
                    <Image src={cat.image.url} alt={cat.name} width={48} height={48} className="object-cover rounded-full" />
                  ) : (
                    <span className="text-xl">{cat.name.charAt(0)}</span>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="page-container py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="section-title mb-0">Featured Deals</h2>
              <p className="text-gray-500 text-sm mt-1">Handpicked offers just for you</p>
            </div>
            <Link href="/products?isFeatured=true" className="text-sm text-primary-600 hover:underline flex items-center gap-1">View All <FiArrowRight size={14} /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {featured.slice(0, 12).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Promo Banner */}
      <section className="page-container py-8">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white flex flex-col justify-between min-h-[180px]">
            <div>
              <h3 className="text-2xl font-bold mb-2">Electronics Sale</h3>
              <p className="text-blue-100">Up to 50% off on top brands</p>
            </div>
            <Link href="/products?search=electronics" className="inline-flex items-center gap-1 text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors w-fit mt-4">
              Shop Now <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-white flex flex-col justify-between min-h-[180px]">
            <div>
              <h3 className="text-2xl font-bold mb-2">Fashion Week</h3>
              <p className="text-pink-100">New arrivals every day</p>
            </div>
            <Link href="/products?search=fashion" className="inline-flex items-center gap-1 text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors w-fit mt-4">
              Explore <FiArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="page-container py-8 pb-16">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="section-title mb-0">New Arrivals</h2>
              <p className="text-gray-500 text-sm mt-1">Fresh products added this week</p>
            </div>
            <Link href="/products?sort=newest" className="text-sm text-primary-600 hover:underline flex items-center gap-1">View All <FiArrowRight size={14} /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {newArrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
