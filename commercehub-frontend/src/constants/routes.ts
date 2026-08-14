export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  CART: '/cart',
  CHECKOUT: '/checkout',
  CHECKOUT_SUCCESS: '/checkout/success',

  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',

  PROFILE: '/profile',
  PROFILE_ADDRESSES: '/profile/addresses',
  PROFILE_PASSWORD: '/profile/password',

  WISHLIST: '/wishlist',

  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCTS_NEW: '/admin/products/new',
  ADMIN_PRODUCTS_EDIT: '/admin/products/:id/edit',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_DETAIL: '/admin/orders/:id',
  ADMIN_USERS: '/admin/users',
  ADMIN_INVENTORY: '/admin/inventory',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_PROMOTIONS: '/admin/promotions',
} as const;

export const buildRoute = (route: string, params: Record<string, string>): string =>
  Object.entries(params).reduce((path, [key, value]) => path.replace(`:${key}`, value), route);
