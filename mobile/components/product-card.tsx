import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { process } from '@expo/env';

interface Product {
  _id: string;
  name: string;
  slug?: string;
  images?: { url: string }[];
  price: number;
  discount?: number;
  effectivePrice?: number;
  ratings?: { average: number; count: number };
  brand?: string;
  category?: { name: string };
  stock: number;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={{ fontSize: 10, color: s <= Math.round(rating) ? Colors.star : Colors.border }}>
          ★
        </Text>
      ))}
    </View>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const effectivePrice = product.discount && product.discount > 0
    ? (product.price * (1 - product.discount / 100)).toFixed(2)
    : product.price?.toFixed(2);

  const handleAddToCart = async () => {
    if (process.env.EXPO_OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await addToCart(product._id, 1);
  };

  return (
    <Link href={`/product/${product.slug || product._id}`} asChild>
      <Pressable
        style={({ pressed }) => ({
          flex: 1,
          backgroundColor: Colors.card,
          borderRadius: 14,
          overflow: 'hidden',
          borderCurve: 'continuous',
          opacity: pressed ? 0.92 : 1,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        })}
      >
        <View>
          {/* Image */}
          <View style={{ position: 'relative', aspectRatio: 1, backgroundColor: '#f8fafc' }}>
            <Image
              source={product.images?.[0]?.url || 'https://via.placeholder.com/200'}
              style={{ flex: 1 }}
              contentFit="contain"
            />
            {product.discount && product.discount > 0 ? (
              <View style={{
                position: 'absolute', top: 8, left: 8,
                backgroundColor: Colors.error, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>-{product.discount}%</Text>
              </View>
            ) : null}
            {product.stock === 0 && (
              <View style={{
                position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Out of Stock</Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={{ padding: 10, gap: 4 }}>
            <Text style={{ fontSize: 10, color: Colors.textMuted }}>
              {product.brand || product.category?.name || ''}
            </Text>
            <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: '500', color: Colors.text, lineHeight: 18 }}>
              {product.name}
            </Text>

            {product.ratings && product.ratings.count > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <StarRow rating={product.ratings.average} />
                <Text style={{ fontSize: 10, color: Colors.textMuted }}>({product.ratings.count})</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.primary }}>${effectivePrice}</Text>
              {product.discount && product.discount > 0 ? (
                <Text style={{ fontSize: 11, color: Colors.textMuted, textDecorationLine: 'line-through' }}>
                  ${product.price?.toFixed(2)}
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={handleAddToCart}
              disabled={product.stock === 0}
              style={({ pressed }) => ({
                backgroundColor: product.stock === 0 ? Colors.border : pressed ? Colors.primaryDark : Colors.primary,
                borderRadius: 8,
                paddingVertical: 7,
                alignItems: 'center',
                marginTop: 2,
              })}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
