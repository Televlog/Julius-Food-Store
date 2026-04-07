'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { userAPI } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';
import { FiHeart } from 'react-icons/fi';

export default function WishlistPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    userAPI.getWishlist().then((res) => setWishlist(res.data.wishlist)).finally(() => setLoading(false));
  }, [user, router]);

  if (loading) return <div className="page-container py-8"><div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="skeleton aspect-square rounded-xl" />)}</div></div>;

  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FiHeart className="text-red-500" /> My Wishlist ({wishlist.length})
      </h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-20">
          <FiHeart className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-4">Save items you love for later</p>
          <Link href="/products" className="btn-primary inline-block">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {wishlist.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
