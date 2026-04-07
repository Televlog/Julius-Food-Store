import { useState, useEffect, useRef } from 'react';
import {
  ScrollView, View, Text, Pressable, FlatList, ActivityIndicator,
  RefreshControl, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';
import { productAPI, categoryAPI } from '@/lib/api';
import ProductCard from '@/components/product-card';
import { Colors } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const HERO_SLIDES = [
  { title: 'Mega Sale', subtitle: 'Up to 70% Off', color1: Colors.primary, color2: Colors.primaryDark, emoji: '🔥' },
  { title: 'Electronics', subtitle: 'Latest Gadgets', color1: '#3b82f6', color2: '#1d4ed8', emoji: '💻' },
  { title: 'Fashion Week', subtitle: 'New Arrivals Daily', color1: '#8b5cf6', color2: '#6d28d9', emoji: '👗' },
];

export default function HomeScreen() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const heroRef = useRef<ScrollView>(null);

  const loadData = async () => {
    try {
      const [featRes, catRes, newRes] = await Promise.all([
        productAPI.getFeatured() as Promise<any>,
        categoryAPI.getAll() as Promise<any>,
        productAPI.getAll({ sort: 'newest', limit: 8 }) as Promise<any>,
      ]);
      setFeatured(featRes.products || []);
      setCategories((catRes.categories || []).filter((c: any) => !c.parent).slice(0, 8));
      setNewArrivals(newRes.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Auto scroll hero
  useEffect(() => {
    const timer = setInterval(() => {
      const next = (heroIdx + 1) % HERO_SLIDES.length;
      setHeroIdx(next);
      heroRef.current?.scrollTo({ x: next * (width - 32), animated: true });
    }, 4000);
    return () => clearInterval(timer);
  }, [heroIdx]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 12, color: Colors.textSecondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData(); }}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Welcome to</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.primary }}>ShopNow 🛍️</Text>
            </View>
            <Link href="/shop" asChild>
              <Pressable style={{ backgroundColor: Colors.primaryLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
                <Text style={{ color: Colors.primaryDark, fontWeight: '700', fontSize: 13 }}>Browse All</Text>
              </Pressable>
            </Link>
          </View>

          {/* Hero Carousel */}
          <ScrollView
            ref={heroRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal: 0 }}
            contentContainerStyle={{ gap: 0 }}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
              setHeroIdx(idx);
            }}
          >
            {HERO_SLIDES.map((slide, i) => (
              <View
                key={i}
                style={{
                  width: width - 32,
                  marginHorizontal: 16,
                  height: 160,
                  borderRadius: 20,
                  borderCurve: 'continuous',
                  backgroundColor: slide.color1,
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  padding: 24,
                  marginBottom: 4,
                }}
              >
                <Text style={{ fontSize: 40 }}>{slide.emoji}</Text>
                <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 4 }}>{slide.title}</Text>
                <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{slide.subtitle}</Text>
                <Link href="/shop" asChild>
                  <Pressable style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, marginTop: 12 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Shop Now →</Text>
                  </Pressable>
                </Link>
              </View>
            ))}
          </ScrollView>

          {/* Dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10, marginBottom: 4 }}>
            {HERO_SLIDES.map((_, i) => (
              <View key={i} style={{ width: i === heroIdx ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === heroIdx ? Colors.primary : Colors.border }} />
            ))}
          </View>

          {/* Categories */}
          {categories.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text }}>Categories</Text>
                <Link href="/shop" asChild>
                  <Pressable><Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>See all →</Text></Pressable>
                </Link>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
                {categories.map((cat: any) => (
                  <Link key={cat._id} href={`/shop?category=${cat._id}`} asChild>
                    <Pressable style={({ pressed }) => ({
                      alignItems: 'center', gap: 6,
                      backgroundColor: pressed ? Colors.primaryLight : Colors.card,
                      padding: 12, borderRadius: 14, borderCurve: 'continuous',
                      minWidth: 72,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    })}>
                      <View style={{ width: 44, height: 44, backgroundColor: Colors.primaryLight, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
                        {cat.image?.url ? (
                          <Image source={cat.image.url} style={{ width: 44, height: 44, borderRadius: 22 }} contentFit="cover" />
                        ) : (
                          <Text style={{ fontSize: 20 }}>🏷️</Text>
                        )}
                      </View>
                      <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '600', color: Colors.text, maxWidth: 68, textAlign: 'center' }}>{cat.name}</Text>
                    </Pressable>
                  </Link>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Featured */}
          {featured.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text }}>🔥 Featured Deals</Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>Handpicked just for you</Text>
                </View>
                <Link href="/shop?isFeatured=true" asChild>
                  <Pressable><Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>See all →</Text></Pressable>
                </Link>
              </View>
              <FlatList
                data={featured.slice(0, 10)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View style={{ width: 160 }}>
                    <ProductCard product={item} />
                  </View>
                )}
              />
            </View>
          )}

          {/* Promo Banners */}
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 24 }}>
            <Link href="/shop?search=electronics" asChild>
              <Pressable style={({ pressed }) => ({
                flex: 1, backgroundColor: '#dbeafe', borderRadius: 14, borderCurve: 'continuous',
                padding: 16, opacity: pressed ? 0.85 : 1,
              })}>
                <Text style={{ fontSize: 20 }}>📱</Text>
                <Text style={{ fontWeight: '700', color: '#1e40af', fontSize: 14, marginTop: 4 }}>Electronics</Text>
                <Text style={{ fontSize: 11, color: '#3b82f6', marginTop: 2 }}>Up to 50% off</Text>
              </Pressable>
            </Link>
            <Link href="/shop?search=fashion" asChild>
              <Pressable style={({ pressed }) => ({
                flex: 1, backgroundColor: '#fce7f3', borderRadius: 14, borderCurve: 'continuous',
                padding: 16, opacity: pressed ? 0.85 : 1,
              })}>
                <Text style={{ fontSize: 20 }}>👗</Text>
                <Text style={{ fontWeight: '700', color: '#9d174d', fontSize: 14, marginTop: 4 }}>Fashion</Text>
                <Text style={{ fontSize: 11, color: '#db2777', marginTop: 2 }}>New every day</Text>
              </Pressable>
            </Link>
          </View>

          {/* New Arrivals */}
          {newArrivals.length > 0 && (
            <View style={{ marginTop: 24, marginBottom: 32 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text }}>✨ New Arrivals</Text>
                <Link href="/shop?sort=newest" asChild>
                  <Pressable><Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>See all →</Text></Pressable>
                </Link>
              </View>
              <View style={{ paddingHorizontal: 16 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {newArrivals.map((product: any) => (
                    <View key={product._id} style={{ width: (width - 42) / 2 }}>
                      <ProductCard product={product} />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
