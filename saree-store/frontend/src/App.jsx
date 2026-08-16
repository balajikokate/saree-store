import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";
import Loader from "./components/common/Loader";

// Everything below is intentionally EAGER (Home/Shop/Product/Cart above +
// this file's core imports) — these are the pages nearly every visitor
// hits just browsing. Everything below this comment is lazy-loaded into
// its own chunk: visited less often (after browsing), or only by a subset
// of visitors (account holders, admin) — no reason to make every customer
// download that code just to look at sarees. This is the same pattern the
// admin panel already used; extending it here measurably shrinks the JS a
// first-time visitor needs before the storefront becomes interactive.
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Wholesale = lazy(() => import("./pages/Wholesale"));

const ProtectedCustomerRoute = lazy(() => import("./components/account/ProtectedCustomerRoute"));
const AccountLayout = lazy(() => import("./pages/account/AccountLayout"));
const AccountProfile = lazy(() => import("./pages/account/AccountProfile"));
const AccountAddresses = lazy(() => import("./pages/account/AccountAddresses"));
const AccountOrders = lazy(() => import("./pages/account/AccountOrders"));

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
    <Suspense fallback={<Loader label="Loading" />}>
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
    </Suspense>
  );
}
