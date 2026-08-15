import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

import ProtectedCustomerRoute from "./components/account/ProtectedCustomerRoute";
import AccountLayout from "./pages/account/AccountLayout";
import AccountProfile from "./pages/account/AccountProfile";
import AccountAddresses from "./pages/account/AccountAddresses";
import AccountOrders from "./pages/account/AccountOrders";

import { AdminAuthProvider } from "./context/AdminAuthContext";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";

export default function App() {
  return (
    <Routes>
      {/* Storefront */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success/:orderNumber" element={<OrderSuccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Customer account — requires login, but signup/checkout don't */}
        <Route element={<ProtectedCustomerRoute />}>
          <Route element={<AccountLayout />}>
            <Route path="/account" element={<AccountProfile />} />
            <Route path="/account/addresses" element={<AccountAddresses />} />
            <Route path="/account/orders" element={<AccountOrders />} />
          </Route>
        </Route>
      </Route>

      {/* Admin panel — separate auth context from the storefront cart */}
      <Route
        path="/admin/*"
        element={
          <AdminAuthProvider>
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
                </Route>
              </Route>
            </Routes>
          </AdminAuthProvider>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
