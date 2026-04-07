import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Colors } from '@/constants/colors';
import { useCart } from '@/context/cart-context';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: focused ? '🏠' : '🏡',
    shop: focused ? '🛍️' : '🛒',
    cart: focused ? '🛒' : '🛒',
    orders: focused ? '📦' : '📫',
    profile: focused ? '👤' : '👥',
  };
  return <Text style={{ fontSize: 22 }}>{icons[name] || '●'}</Text>;
}

function CartTabIcon({ focused }: { focused: boolean }) {
  const { cartItemCount } = useCart();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22 }}>{focused ? '🛒' : '🛒'}</Text>
      {cartItemCount > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -8,
          backgroundColor: Colors.primary, borderRadius: 10,
          minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 4,
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
            {cartItemCount > 99 ? '99+' : cartItemCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          borderTopColor: Colors.border,
          backgroundColor: Colors.card,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ focused }) => <TabIcon name="shop" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => <CartTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => <TabIcon name="orders" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
