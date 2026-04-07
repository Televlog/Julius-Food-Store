import * as SecureStore from 'expo-secure-store';

// Change this to your local IP when testing on a physical device
// e.g. 'http://192.168.1.100:5000/api'
const API_URL = 'http://localhost:5000/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await SecureStore.getItemAsync('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw { response: { data, status: res.status } };
  }
  return data as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });
const put = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

// Auth
export const authAPI = {
  register: (data: Record<string, string>) => post('/auth/register', data),
  login: (email: string, password: string) => post<any>('/auth/login', { email, password }),
  getMe: () => get<any>('/auth/me'),
  forgotPassword: (email: string) => post('/auth/forgot-password', { email }),
  updatePassword: (data: Record<string, string>) => put('/auth/update-password', data),
};

// Products
export const productAPI = {
  getAll: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== false))
    ).toString();
    return get<any>(`/products${query ? `?${query}` : ''}`);
  },
  getOne: (id: string) => get<any>(`/products/${id}`),
  getFeatured: () => get<any>('/products/featured'),
  toggleWishlist: (id: string) => post<any>(`/products/${id}/wishlist`, {}),
};

// Categories
export const categoryAPI = {
  getAll: () => get<any>('/categories'),
};

// Cart
export const cartAPI = {
  get: () => get<any>('/cart'),
  add: (productId: string, quantity: number, selectedVariants: any[] = []) =>
    post<any>('/cart', { productId, quantity, selectedVariants }),
  update: (itemId: string, quantity: number) => put<any>(`/cart/${itemId}`, { quantity }),
  remove: (itemId: string) => del<any>(`/cart/${itemId}`),
  clear: () => del<any>('/cart'),
  applyCoupon: (code: string) => post<any>('/cart/coupon', { code }),
};

// Orders
export const orderAPI = {
  create: (data: Record<string, any>) => post<any>('/orders', data),
  getMyOrders: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return get<any>(`/orders/my${query ? `?${query}` : ''}`);
  },
  getOne: (id: string) => get<any>(`/orders/${id}`),
  cancel: (id: string, reason: string) => put<any>(`/orders/${id}/cancel`, { reason }),
};

// Reviews
export const reviewAPI = {
  getByProduct: (productId: string, params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return get<any>(`/reviews/product/${productId}${query ? `?${query}` : ''}`);
  },
  create: (data: Record<string, any>) => post<any>('/reviews', data),
};

// Users
export const userAPI = {
  updateProfile: (data: Record<string, string>) => put<any>('/users/profile', data),
  getAddresses: () => get<any>('/users/addresses'),
  addAddress: (data: Record<string, string>) => post<any>('/users/addresses', data),
  deleteAddress: (id: string) => del<any>(`/users/addresses/${id}`),
  getWishlist: () => get<any>('/users/wishlist'),
};
