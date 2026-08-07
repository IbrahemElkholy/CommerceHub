export const QUERY_KEYS = {
  AUTH: {
    ME: ['auth', 'me'] as const,
  },
  PRODUCTS: {
    ALL: ['products'] as const,
    LIST: (params: Record<string, unknown>) => ['products', 'list', params] as const,
    DETAIL: (id: string) => ['products', id] as const,
    REVIEWS: (id: string) => ['products', id, 'reviews'] as const,
    MY_REVIEWS: ['reviews', 'my'] as const,
  },
  CATEGORIES: {
    TREE: ['categories', 'tree'] as const,
  },
  BRANDS: {
    ALL: ['brands'] as const,
  },
  CART: {
    MY: ['cart', 'my'] as const,
  },
  ORDERS: {
    MY: (params?: Record<string, unknown>) => ['orders', 'my', params] as const,
    DETAIL: (id: string) => ['orders', id] as const,
    ADMIN_LIST: (params?: Record<string, unknown>) => ['orders', 'admin', params] as const,
    HISTORY: (id: string) => ['orders', id, 'history'] as const,
  },
  WISHLIST: {
    MY: ['wishlist', 'my'] as const,
  },
  USERS: {
    ME: ['users', 'me'] as const,
    ADDRESSES: ['users', 'me', 'addresses'] as const,
    ADMIN_LIST: (params?: Record<string, unknown>) => ['users', 'admin', params] as const,
    DETAIL: (id: string) => ['users', id] as const,
  },
  INVENTORY: {
    STOCK: (params?: Record<string, unknown>) => ['inventory', 'stock', params] as const,
    LOW_STOCK: ['inventory', 'stock', 'low'] as const,
    WAREHOUSES: ['inventory', 'warehouses'] as const,
  },
  ANALYTICS: {
    REVENUE: (params: Record<string, unknown>) => ['analytics', 'revenue', params] as const,
    TOP_PRODUCTS: ['analytics', 'top-products'] as const,
    ORDERS_SUMMARY: ['analytics', 'orders-summary'] as const,
    NEW_CUSTOMERS: (params: Record<string, unknown>) =>
      ['analytics', 'new-customers', params] as const,
  },
  PROMOTIONS: {
    ALL: (params?: Record<string, unknown>) => ['promotions', params] as const,
  },
} as const;
