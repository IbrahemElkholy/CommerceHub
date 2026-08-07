import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AuthGuard } from './guards/AuthGuard';
import { AdminGuard } from './guards/AdminGuard';
import { GuestGuard } from './guards/GuestGuard';
import { PageLoader } from '@/components/feedback/PageLoader';
import { ROUTES } from '@/constants/routes';

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('@/features/authentication/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/authentication/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/features/authentication/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ProductsPage = lazy(() => import('@/features/products/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('@/features/products/pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('@/features/cart/pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('@/features/orders/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrdersPage = lazy(() => import('@/features/orders/pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('@/features/orders/pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const WishlistPage = lazy(() => import('@/features/wishlist/pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const ProfilePage = lazy(() => import('@/features/authentication/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import('@/features/admin/pages/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })));
const AdminOrdersPage = lazy(() => import('@/features/admin/pages/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })));
const AdminUsersPage = lazy(() => import('@/features/admin/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminInventoryPage = lazy(() => import('@/features/admin/pages/AdminInventoryPage').then((m) => ({ default: m.AdminInventoryPage })));
const AdminDashboardFallback = lazy(() => import('@/features/admin/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));

const wrap = (el: React.ReactElement) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: ROUTES.HOME, element: wrap(<HomePage />) },
      { path: ROUTES.PRODUCTS, element: wrap(<ProductsPage />) },
      { path: ROUTES.PRODUCT_DETAIL, element: wrap(<ProductDetailPage />) },

      {
        element: <AuthGuard />,
        children: [
          { path: ROUTES.CART, element: wrap(<CartPage />) },
          { path: ROUTES.CHECKOUT, element: wrap(<CheckoutPage />) },
          { path: ROUTES.ORDERS, element: wrap(<OrdersPage />) },
          { path: ROUTES.ORDER_DETAIL, element: wrap(<OrderDetailPage />) },
          { path: ROUTES.WISHLIST, element: wrap(<WishlistPage />) },
          { path: ROUTES.PROFILE, element: wrap(<ProfilePage />) },
          { path: ROUTES.PROFILE_ADDRESSES, element: wrap(<ProfilePage />) },
        ],
      },
    ],
  },

  {
    element: <GuestGuard><AuthLayout /></GuestGuard>,
    children: [
      { path: ROUTES.LOGIN, element: wrap(<LoginPage />) },
      { path: ROUTES.REGISTER, element: wrap(<RegisterPage />) },
      { path: ROUTES.FORGOT_PASSWORD, element: wrap(<ForgotPasswordPage />) },
    ],
  },

  {
    element: <AdminGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: ROUTES.ADMIN, element: <Navigate to={ROUTES.ADMIN_DASHBOARD} replace /> },
          { path: ROUTES.ADMIN_DASHBOARD, element: wrap(<AdminDashboardPage />) },
          { path: ROUTES.ADMIN_PRODUCTS, element: wrap(<AdminProductsPage />) },
          { path: ROUTES.ADMIN_ORDERS, element: wrap(<AdminOrdersPage />) },
          { path: ROUTES.ADMIN_ORDER_DETAIL, element: wrap(<OrderDetailPage />) },
          { path: ROUTES.ADMIN_USERS, element: wrap(<AdminUsersPage />) },
          { path: ROUTES.ADMIN_INVENTORY, element: wrap(<AdminInventoryPage />) },
          { path: ROUTES.ADMIN_ANALYTICS, element: wrap(<AdminDashboardFallback />) },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to={ROUTES.HOME} replace /> },
]);
