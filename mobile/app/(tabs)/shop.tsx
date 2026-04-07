import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList,
  ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productAPI, categoryAPI } from '@/lib/api';
import ProductCard from '@/components/product-card';
import { Colors } from '@/constants/colors';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
];

export default function ShopScreen() {
  const params = useLocalSearchParams<{ category?: string; search?: string; sort?: string; isFeatured?: string }>();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState(params.search || '');
  const [searchInput, setSearchInput] = useState(params.search || '');
  const [selectedCategory, setSelectedCategory] = useState(params.category || '');
  const [sort, setSort] = useState(params.sort || 'newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [isFeatured, setIsFeatured] = useState(params.isFeatured === 'true');

  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);

  const LIMIT = 12;

  const fetchProducts = useCallback(async (reset = true) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const currentPage = reset ? 1 : page;
      const res = await productAPI.getAll({
        page: currentPage,
        limit: LIMIT,
        search: search || undefined,
        category: selectedCategory || undefined,
        sort,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        inStock: inStock || undefined,
        isFeatured: isFeatured || undefined,
      }) as any;

      const newProducts = res.products || [];
      if (reset) {
        setProducts(newProducts);
        setPage(2);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
        setPage(p => p + 1);
      }
      setTotal(res.total || 0);
      setHasMore(newProducts.length === LIMIT);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, selectedCategory, sort, minPrice, maxPrice, inStock, isFeatured, page]);

  useEffect(() => {
    fetchProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory, sort, minPrice, maxPrice, inStock, isFeatured]);

  useEffect(() => {
    categoryAPI.getAll().then((res: any) => {
      setCategories((res.categories || []).filter((c: any) => !c.parent).slice(0, 20));
    });
  }, []);

  const handleSearch = () => setSearch(searchInput.trim());

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchProducts(false);
    }
  };

  const applyFilters = () => {
    setFilterVisible(false);
    fetchProducts(true);
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);
    setIsFeatured(false);
    setFilterVisible(false);
  };

  const activeFilterCount = [
    selectedCategory, minPrice, maxPrice, inStock, isFeatured,
  ].filter(Boolean).length;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 10 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.primary }}>Shop</Text>

          {/* Search Bar */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{
              flex: 1, flexDirection: 'row', alignItems: 'center',
              backgroundColor: Colors.card, borderRadius: 12, borderCurve: 'continuous',
              paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.border,
            }}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={handleSearch}
                placeholder="Search products..."
                placeholderTextColor={Colors.textMuted}
                returnKeyType="search"
                style={{ flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 10 }}
              />
              {searchInput.length > 0 && (
                <Pressable onPress={() => { setSearchInput(''); setSearch(''); }}>
                  <Text style={{ fontSize: 16, color: Colors.textMuted }}>✕</Text>
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={() => setSortVisible(true)}
              style={{ backgroundColor: Colors.card, borderRadius: 12, borderCurve: 'continuous', padding: 12, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 16 }}>↕️</Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterVisible(true)}
              style={{
                backgroundColor: activeFilterCount > 0 ? Colors.primary : Colors.card,
                borderRadius: 12, borderCurve: 'continuous', padding: 12,
                borderWidth: 1, borderColor: activeFilterCount > 0 ? Colors.primary : Colors.border,
                justifyContent: 'center', alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16 }}>⚙️</Text>
              {activeFilterCount > 0 && (
                <View style={{
                  position: 'absolute', top: 4, right: 4,
                  backgroundColor: '#fff', borderRadius: 8, minWidth: 14, height: 14,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: Colors.primary }}>{activeFilterCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Results count */}
          {!loading && (
            <Text style={{ fontSize: 12, color: Colors.textMuted }}>
              {total} product{total !== 1 ? 's' : ''} found
              {search ? ` for "${search}"` : ''}
            </Text>
          )}
        </View>

        {/* Product Grid */}
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : products.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Text style={{ fontSize: 48 }}>🔍</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text }}>No products found</Text>
            <Text style={{ fontSize: 13, color: Colors.textMuted }}>Try adjusting your search or filters</Text>
            <Pressable onPress={resetFilters} style={{ backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Clear Filters</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={products}
            numColumns={2}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
            columnWrapperStyle={{ gap: 10 }}
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <ProductCard product={item} />
              </View>
            )}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loadingMore ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : null}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Sort Modal */}
        <Modal visible={sortVisible} transparent animationType="slide" onRequestClose={() => setSortVisible(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setSortVisible(false)} />
          <View style={{ backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 16 }}>Sort By</Text>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => { setSort(opt.value); setSortVisible(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border }}
              >
                <Text style={{ fontSize: 15, color: sort === opt.value ? Colors.primary : Colors.text, fontWeight: sort === opt.value ? '700' : '400' }}>
                  {opt.label}
                </Text>
                {sort === opt.value && <Text style={{ color: Colors.primary }}>✓</Text>}
              </Pressable>
            ))}
          </View>
        </Modal>

        {/* Filter Modal */}
        <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setFilterVisible(false)} />
          <View style={{ backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.text }}>Filters</Text>
              <Pressable onPress={resetFilters}>
                <Text style={{ color: Colors.primary, fontWeight: '600' }}>Reset All</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
              {/* Category */}
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10 }}>Category</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Pressable
                    onPress={() => setSelectedCategory('')}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: selectedCategory === '' ? Colors.primary : Colors.background, borderWidth: 1, borderColor: selectedCategory === '' ? Colors.primary : Colors.border }}
                  >
                    <Text style={{ fontSize: 12, color: selectedCategory === '' ? '#fff' : Colors.text, fontWeight: '600' }}>All</Text>
                  </Pressable>
                  {categories.map((cat: any) => (
                    <Pressable
                      key={cat._id}
                      onPress={() => setSelectedCategory(cat._id)}
                      style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: selectedCategory === cat._id ? Colors.primary : Colors.background, borderWidth: 1, borderColor: selectedCategory === cat._id ? Colors.primary : Colors.border }}
                    >
                      <Text style={{ fontSize: 12, color: selectedCategory === cat._id ? '#fff' : Colors.text, fontWeight: '600' }}>{cat.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Price Range */}
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10 }}>Price Range</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput
                    value={minPrice}
                    onChangeText={setMinPrice}
                    placeholder="Min $"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    style={{ flex: 1, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text }}
                  />
                  <TextInput
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    placeholder="Max $"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    style={{ flex: 1, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text }}
                  />
                </View>
              </View>

              {/* Toggles */}
              <View style={{ gap: 12 }}>
                <Pressable
                  onPress={() => setInStock(!inStock)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Text style={{ fontSize: 14, color: Colors.text }}>In Stock Only</Text>
                  <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: inStock ? Colors.primary : Colors.border, justifyContent: 'center', padding: 2 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', marginLeft: inStock ? 18 : 0 }} />
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => setIsFeatured(!isFeatured)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Text style={{ fontSize: 14, color: Colors.text }}>Featured Only</Text>
                  <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: isFeatured ? Colors.primary : Colors.border, justifyContent: 'center', padding: 2 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', marginLeft: isFeatured ? 18 : 0 }} />
                  </View>
                </Pressable>
              </View>
            </ScrollView>

            <View style={{ padding: 20, paddingBottom: 36 }}>
              <Pressable
                onPress={applyFilters}
                style={{ backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 14, borderCurve: 'continuous', alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}
