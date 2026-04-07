import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="product/[id]" options={{ headerShown: true, headerTitle: '', headerBackButtonDisplayMode: 'minimal', headerTransparent: true }} />
          <Stack.Screen name="orders/[id]" options={{ headerShown: true, headerTitle: 'Order Detail', headerBackButtonDisplayMode: 'minimal' }} />
          <Stack.Screen name="checkout/index" options={{ headerShown: true, headerTitle: 'Checkout', headerBackButtonDisplayMode: 'minimal' }} />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
