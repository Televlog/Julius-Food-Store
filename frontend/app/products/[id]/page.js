'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { productAPI, reviewAPI } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { StarDisplay, StarInput } from '@/components/ui/StarRating';
import { FiShoppingCart, FiHeart, FiShare2, FiChevronRight, FiMinus, FiPlus, FiCheck } from 'react-icons/fi';
import { FaTruck, FaUndo, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratingBreakdown, setRatingBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState('description');

  // Review form
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', body: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, revRes] = await Promise.all([
          productAPI.getOne(id),
          reviewAPI.getByProduct(id, { limit: 10 }),
        ]);
        setProduct(prodRes.data.product);
        setReviews(revRes.data.reviews);
        setRatingBreakdown(revRes.data.ratingBreakdown);
      } catch {
        toast.error('Product not found');
        router.push('/products');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  const handleAddToCart = async () => {
    setAdding(true);
    await addToCart(product._id, quantity);
    setAdding(false);
  };

  const handleBuyNow = async () => {
    const added = await addToCart(product._id, quantity);
    if (added) router.push('/cart');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to review'); return; }
    if (!reviewForm.rating) { toast.error('Please select a rating'); return; }
    setSubmittingReview(true);
    try {
      const res = await reviewAPI.create({ productId: product._id, ...reviewForm });
      setReviews((prev) => [res.data.review, ...prev]);
      setReviewForm({ rating: 0, title: '', body: '' });
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="skeleton aspect-square rounded-xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-6 w-1/4" />
            <div className="skeleton h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const effectivePrice = product.discount > 0
    ? (product.price * (1 - product.discount / 100)).toFixed(2)
    : product.price?.toFixed(2);

  return (
    <div className="page-container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">Home</Link>
        <FiChevronRight size={14} />
        <Link href="/products" className="hover:text-primary-600">Products</Link>
        <FiChevronRight size={14} />
        <Link href={`/products?category=${product.category?._id}`} className="hover:text-primary-600">{product.category?.name}</Link>
        <FiChevronRight size={14} />
        <span className="text-gray-800 line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 mb-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-4">
            <Image
              src={product.images?.[selectedImage]?.url || 'https://via.placeholder.com/600x600'}
              alt={product.name}
              fill
              className="object-contain p-4"
              priority
            />
            {product.discount > 0 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{product.discount}%
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? 'border-primary-500' : 'border-gray-200'}`}>
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.brand && <p className="text-primary-600 font-medium text-sm mb-1">{product.brand}</p>}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

          <StarDisplay rating={product.ratings?.average} count={product.ratings?.count} />

          <div className="flex items-baseline gap-3 my-4">
            <span className="text-3xl font-bold text-primary-600">${effectivePrice}</span>
            {product.discount > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">${product.price?.toFixed(2)}</span>
                <span className="text-green-600 font-semibold">Save {product.discount}%</span>
              </>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{product.shortDescription || product.description?.slice(0, 200)}</p>

          {/* Stock */}
          <div className="mb-4">
            {product.stock > 10 ? (
              <span className="text-green-600 font-medium text-sm flex items-center gap-1"><FiCheck /> In Stock</span>
            ) : product.stock > 0 ? (
              <span className="text-orange-500 font-medium text-sm">Only {product.stock} left!</span>
            ) : (
              <span className="text-red-500 font-medium text-sm">Out of Stock</span>
            )}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-50 rounded-l-lg">
                <FiMinus size={16} />
              </button>
              <span className="px-4 py-2 font-medium min-w-[40px] text-center">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-2 hover:bg-gray-50 rounded-r-lg">
                <FiPlus size={16} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || adding}
              className="flex-1 btn-secondary flex items-center justify-center gap-2"
            >
              <FiShoppingCart size={18} />
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              Buy Now
            </button>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-3 border-t pt-6">
            {[
              { icon: FaTruck, title: 'Free Delivery', desc: 'On orders over $100' },
              { icon: FaUndo, title: '30-Day Returns', desc: 'Hassle-free returns' },
              { icon: FaShieldAlt, title: 'Secure', desc: '100% authentic' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-1">
                <Icon className="text-primary-500" size={20} />
                <p className="text-xs font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex gap-6">
          {['description', 'specifications', 'reviews'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t} {t === 'reviews' && `(${product.ratings?.count || 0})`}
            </button>
          ))}
        </div>
      </div>

      {tab === 'description' && (
        <div className="prose max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description?.replace(/\n/g, '<br>') }} />
      )}

      {tab === 'specifications' && (
        <div className="max-w-2xl">
          {product.specifications?.length > 0 ? (
            <table className="w-full text-sm">
              <tbody>
                {product.specifications.map((spec, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium text-gray-700 w-1/3">{spec.key}</td>
                    <td className="px-4 py-3 text-gray-600">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No specifications available.</p>
          )}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="max-w-3xl">
          {/* Rating summary */}
          <div className="flex items-center gap-8 mb-8 p-6 bg-gray-50 rounded-xl">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900">{product.ratings?.average?.toFixed(1) || '0.0'}</div>
              <StarDisplay rating={product.ratings?.average || 0} size={20} />
              <p className="text-sm text-gray-500 mt-1">{product.ratings?.count || 0} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((r) => {
                const count = ratingBreakdown.find((b) => b._id === r)?.count || 0;
                const pct = product.ratings?.count ? (count / product.ratings.count) * 100 : 0;
                return (
                  <div key={r} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-gray-600">{r}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-gray-500 text-xs">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Write review */}
          {user && (
            <form onSubmit={handleSubmitReview} className="card mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Write a Review</h3>
              <div className="mb-4">
                <label className="text-sm text-gray-700 mb-2 block">Your Rating *</label>
                <StarInput value={reviewForm.rating} onChange={(r) => setReviewForm({ ...reviewForm, rating: r })} />
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Review title"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="mb-4">
                <textarea
                  placeholder="Share your experience..."
                  rows={4}
                  value={reviewForm.body}
                  onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                  className="input-field resize-none"
                />
              </div>
              <button type="submit" disabled={submittingReview} className="btn-primary">
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

          {/* Reviews list */}
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="border-b border-gray-100 pb-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-700 text-sm">
                      {review.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{review.user?.name}</p>
                      <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <StarDisplay rating={review.rating} size={14} />
                </div>
                {review.isVerifiedPurchase && (
                  <span className="badge-green text-xs mb-2 inline-flex">Verified Purchase</span>
                )}
                {review.title && <p className="font-semibold text-gray-800 text-sm mb-1">{review.title}</p>}
                <p className="text-gray-600 text-sm leading-relaxed">{review.body}</p>
                {review.sellerReply?.text && (
                  <div className="mt-3 ml-4 pl-4 border-l-2 border-primary-200 bg-primary-50 p-3 rounded-r-lg">
                    <p className="text-xs font-semibold text-primary-700 mb-1">Seller Response:</p>
                    <p className="text-sm text-gray-600">{review.sellerReply.text}</p>
                  </div>
                )}
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
