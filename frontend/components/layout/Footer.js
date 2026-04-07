import Link from 'next/link';
import { MdStorefront } from 'react-icons/md';
import { FiFacebook, FiTwitter, FiInstagram, FiYoutube } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 text-primary-400 font-bold text-xl mb-4">
              <MdStorefront size={24} />
              <span>ShopNow</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Your one-stop destination for millions of products at unbeatable prices. Shop with confidence.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="hover:text-primary-400 transition-colors"><FiFacebook size={18} /></a>
              <a href="#" className="hover:text-primary-400 transition-colors"><FiTwitter size={18} /></a>
              <a href="#" className="hover:text-primary-400 transition-colors"><FiInstagram size={18} /></a>
              <a href="#" className="hover:text-primary-400 transition-colors"><FiYoutube size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              {['All Products', 'Electronics', 'Fashion', 'Home & Garden', 'Beauty', 'Sports'].map((item) => (
                <li key={item}>
                  <Link href={`/products?search=${item}`} className="hover:text-primary-400 transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'My Profile', href: '/profile' },
                { label: 'My Orders', href: '/orders' },
                { label: 'Wishlist', href: '/profile/wishlist' },
                { label: 'Seller Dashboard', href: '/seller' },
                { label: 'Become a Seller', href: '/auth/register?seller=true' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="hover:text-primary-400 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-white font-semibold mb-4">Help & Support</h4>
            <ul className="space-y-2 text-sm">
              {[
                'FAQ', 'Shipping Policy', 'Return Policy', 'Privacy Policy', 'Terms of Service', 'Contact Us',
              ].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-primary-400 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>© {new Date().getFullYear()} ShopNow. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Payments: </span>
            <span className="bg-white text-gray-800 px-2 py-0.5 rounded text-xs font-bold">VISA</span>
            <span className="bg-white text-gray-800 px-2 py-0.5 rounded text-xs font-bold">MC</span>
            <span className="bg-white text-gray-800 px-2 py-0.5 rounded text-xs font-bold">STRIPE</span>
            <span className="bg-white text-gray-800 px-2 py-0.5 rounded text-xs font-bold">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
