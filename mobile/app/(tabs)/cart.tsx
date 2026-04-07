import { useState } from 'react';
import {
  View, Text, Pressable, FlatList, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Link, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { Colors } from '@/constants/colors';

export default function CartScreen() {
  const { cart, cartItemCount, cartSubtotal, updateItem, removeItem, clearCart, applyCoupon } = useCart();
  const { user } = useAuth();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 64 }}>🛒</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center' }}>Your cart is waiting</Text>
          <Text style={{ fontSize: 14, color: Colors.textMuted, textAlign: 'center' }}>Sign in to view and manage your cart</Text>
          <Link href="/auth/login" asChild>
            <Pressable style={{ backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, borderCurve: 'continuous' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Sign In</Text>
            </Pressable>
          </Link>
        </SafeAreaView>
      </>
    );
  }

  const items = cart?.items || [];
  const discount = cart?.coupon ? cartSubtotal * (cart.coupon.discount / 100) : 0;
  const shipping = cartSubtotal >= 100 ? 0 : 9.99;
  const total = cartSubtotal - discount + shipping;

  const handleQtyChange = async (itemId: string, delta: number, current: number) => {
    const newQty = current + delta;
    if (newQty < 1) return;
    setUpdating(itemId);
    await updateItem(itemId, newQty);
    setUpdating(null);
  };

  const handleRemove = (itemId: string, name: string) => {
    Alert.alert('Remove Item', `Remove "${name}" from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeItem(itemId) },
    ]);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      await applyCoupon(couponInput.trim());
      setCouponInput('');
    } catch {
      Alert.alert('Invalid Coupon', 'This coupon code is not valid or has expired.');
    } finally {
      setCouponLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 64 }}>🛒</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.text }}>Your cart is empty</Text>
          <Text style={{ fontSize: 14, color: Colors.textMuted, textAlign: 'center' }}>Add some products to get started</Text>
          <Link href="/shop" asChild>
            <Pressable style={{ backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, borderCurve: 'continuous' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Browse Products</Text>
            </Pressable>
          </Link>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.text }}>Cart ({cartItemCount})</Text>
          <Pressable onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: clearCart },
          ])}>
            <Text style={{ color: Colors.error, fontSize: 13, fontWeight: '600' }}>Clear All</Text>
          </Pressable>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={() => (
            <View style={{ gap: 16, marginTop: 8 }}>
              {/* Coupon */}
              <View style={{ backgroundColor: Colors.card, borderRadius: 14, borderCurve: 'continuous', padding: 14, gap: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text }}>🏷️ Coupon Code</Text>
                {cart?.coupon ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.successLight, borderRadius: 10, padding: 10 }}>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.success }}>{cart.coupon.code}</Text>
                      <Text style={{ fontSize: 12, color: Colors.success }}>{cart.coupon.discount}% off applied</Text>
                    </View>
                    <Pressable onPress={() => applyCoupon('')}>
                      <Text style={{ color: Colors.error, fontWeight: '600', fontSize: 13 }}>Remove</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      value={couponInput}
                      onChangeText={setCouponInput}
                      placeholder="Enter coupon code"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="characters"
                      style={{ flex: 1, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text }}
                    />
                    <Pressable
                      onPress={handleApplyCoupon}
                      disabled={couponLoading}
                      style={{ backgroundColor: Colors.primary, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' }}
                    >
                      {couponLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Apply</Text>}
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Order Summary */}
              <View style={{ backgroundColor: Colors.card, borderRadius: 14, borderCurve: 'continuous', padding: 16, gap: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 }}>Order Summary</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: Colors.textSecondary }}>Subtotal ({cartItemCount} items)</Text>
                  <Text style={{ fontSize: 14, color: Colors.text }}>${cartSubtotal.toFixed(2)}</Text>
                </View>
                {discount > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: Colors.success }}>Coupon Discount</Text>
                    <Text style={{ fontSize: 14, color: Colors.success }}>-${discount.toFixed(2)}</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: Colors.textSecondary }}>Shipping</Text>
                  <Text style={{ fontSize: 14, color: shipping === 0 ? Colors.success : Colors.text }}>
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </Text>
                </View>
                {shipping > 0 && (
                  <Text style={{ fontSize: 11, color: Colors.textMuted }}>
                    Add ${(100 - cartSubtotal).toFixed(2)} more for free shipping
                  </Text>
                )}
                <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 4 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text }}>Total</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.primary }}>${total.toFixed(2)}</Text>
                </View>
              </View>

              {/* Checkout Button */}
              <Pressable
                onPress={() => router.push('/checkout')}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? Colors.primaryDark : Colors.primary,
                  paddingVertical: 16, borderRadius: 14, borderCurve: 'continuous',
                  alignItems: 'center',
                })}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>Proceed to Checkout →</Text>
              </Pressable>

              <View style={{ height: 20 }} />
            </View>
          )}
          renderItem={({ item }: { item: any }) => {
            const product = item.product || {};
            const price = item.price || product.effectivePrice || product.price || 0;
            return (
              <View style={{ backgroundColor: Colors.card, borderRadius: 14, borderCurve: 'continuous', flexDirection: 'row', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Image
                  source={product.images?.[0]?.url || 'https://via.placeholder.com/100'}
                  style={{ width: 90, height: 90 }}
                  contentFit="cover"
                />
                <View style={{ flex: 1, padding: 12, gap: 6 }}>
                  <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 18 }}>
                    {product.name || item.name}
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.primary }}>${price.toFixed(2)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
                      <Pressable
                        onPress={() => handleQtyChange(item._id, -1, item.quantity)}
                        style={{ width: 30, height: 30, backgroundColor: Colors.background, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }}
                      >
                        <Text style={{ fontSize: 16, color: Colors.text }}>−</Text>
                      </Pressable>
                      <View style={{ width: 36, alignItems: 'center' }}>
                        {updating === item._id ? (
                          <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text }}>{item.quantity}</Text>
                        )}
                      </View>
                      <Pressable
                        onPress={() => handleQtyChange(item._id, 1, item.quantity)}
                        style={{ width: 30, height: 30, backgroundColor: Colors.background, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border }}
                      >
                        <Text style={{ fontSize: 16, color: Colors.primary }}>+</Text>
                      </Pressable>
                    </View>
                    <Pressable onPress={() => handleRemove(item._id, product.name || item.name)}>
                      <Text style={{ fontSize: 13, color: Colors.error, fontWeight: '600' }}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </>
  );
}
