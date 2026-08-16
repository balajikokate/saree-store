import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Wholesale from "./pages/Wholesale";
import NotFound from "./pages/NotFound";
import Loader from "./components/common/Loader";

import ProtectedCustomerRoute from "./components/account/ProtectedCustomerRoute";
import AccountLayout from "./pages/account/AccountLayout";
import AccountProfile from "./pages/account/AccountProfile";
import AccountAddresses from "./pages/account/AccountAddresses";
import AccountOrders from "./pages/account/AccountOrders";

import { AdminAuthProvider } from "./context/AdminAuthContext";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";

// The entire admin panel is lazy-loaded as its own bundle chunk — most
// importantly this keeps recharts (used only by the dashboard) and the
// rest of the admin UI out of the bundle every customer downloads just to
// browse sarees. Customers never pay this cost; only whoever actually
// visits /admin does, on demand.
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductForm = lazy(() => import("./pages/admin/AdminProductForm"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminOrderDetail = lazy(() => import("./pages/admin/AdminOrderDetail"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminWholesale = lazy(() => import("./pages/admin/AdminWholesale"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

export default function App() {
  return (
    <Routes>
      {/* Storefront */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success/:orderNumber" element={<OrderSuccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/wholesale" element={<Wholesale />} />

        {/* Customer account — requires login, but signup/checkout don't */}
        <Route element={<ProtectedCustomerRoute />}>
          <Route element={<AccountLayout />}>
            <Route path="/account" element={<AccountProfile />} />
            <Route path="/account/addresses" element={<AccountAddresses />} />
            <Route path="/account/orders" element={<AccountOrders />} />
          </Route>
        </Route>
      </Route>

      {/* Admin panel — separate auth context from the storefront cart, and
          a separate bundle chunk (see lazy imports above) */}
      <Route
        path="/admin/*"
        element={
          <AdminAuthProvider>
            <Suspense fallback={<Loader label="Loading admin panel" />}>
              <Routes>
                <Route path="login" element={<AdminLogin />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminProductForm />} />
                    <Route path="products/:id" element={<AdminProductForm />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="orders/:id" element={<AdminOrderDetail />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="wholesale" element={<AdminWholesale />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </AdminAuthProvider>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
