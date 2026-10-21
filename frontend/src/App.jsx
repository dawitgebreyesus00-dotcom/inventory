// frontend/src/App.jsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Core Imports
import { AuthProvider } from "./context/AuthContext"; // Corrected named import from previous steps
import Root from "./utils/Root";                     // Placeholder/Layout for root path
import Login from "./pages/login";                   // Login Page
import Dashboard from "./pages/Dashboard";      // Admin Dashboard Layout (contains Sidebar and Outlet)
import ProtectedRoutes from "./utils/ProtectedRoutes"; // For role-based access control
import { CartProvider } from "./context/CartContext";

import "./App.css"; // Your global CSS

// Imports for your specific Admin Dashboard Pages
// MAKE SURE THESE FILES EXIST IN 'frontend/src/pages/'
// And each file exports a default React component (e.g., export default CategoriesPage;)
import CategoriesPage from './pages/CategoriesPage';
import ProductsPage from './pages/ProductsPage';
import SuppliersPage from './pages/SuppliersPage';
import OrdersPage from './pages/OrdersPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import DashboardHomePage from './pages/DashboardHomePage';
import LowStockPage from './pages/LowStockPage';
import { PurchaseOrdersPage, StockAdjustmentsPage } from './pages/inventory';
import ReportsPage from './pages/ReportsPage';
import SalesOrdersPage from './pages/SalesOrdersPage';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerProductsPage from './pages/ManagerProductsPage';
import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerHome from './pages/customer/CustomerHome';
import CustomerCatalog from './pages/customer/CustomerCatalog';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerCart from './pages/customer/CustomerCart';
import CustomerProfile from './pages/customer/CustomerProfile';


// Placeholder components for general pages (from your previous code)
const UnauthorizedPage = () => <p className="font-bold text-3xl mt-20 text-center">Unauthorized</p>;
const NotFoundPage = () => <h1 className="text-xl">404 Not Found</h1>;


import { colors, fonts } from "./styles/theme";

function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        color: colors.text,
        fontFamily: fonts.main,
      }}
    >
      <Router>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Public/Root Layout Route */}
              <Route path="/" element={<Root />} />
              {/* Login Route */}
              <Route path="/login" element={<Login />} />
              {/* Admin Dashboard - Protected Parent Route */}
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoutes requireRole={["admin"]}>
                    <Dashboard />
                  </ProtectedRoutes>
                }
              >
                {/* Admin-only routes */}
                <Route index element={<DashboardHomePage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="suppliers" element={<SuppliersPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="reports" element={<ReportsPage />} />
              </Route>

              {/* Manager Dashboard */}
              <Route
                path="/manager-dashboard"
                element={
                  <ProtectedRoutes requireRole={["manager"]}>
                    <Dashboard />
                  </ProtectedRoutes>
                }
              >
                {/* Manager-only routes */}
                <Route index element={<ManagerDashboard />} />
                <Route path="stock-in" element={<ManagerProductsPage />} />
                <Route path="stock-out" element={<SalesOrdersPage />} />
                <Route path="stock-adjustments" element={<StockAdjustmentsPage />} />
                <Route path="physical-count" element={<div>Physical Count - Coming Soon</div>} />
                <Route path="movement-history" element={<div>Movement History - Coming Soon</div>} />
                <Route path="low-stock" element={<LowStockPage />} />
                <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* Customer dashboard */}
              <Route
                path="/customer"
                element={
                  <ProtectedRoutes requireRole={["customer"]}>
                    <CustomerLayout />
                  </ProtectedRoutes>
                }
              >
                <Route index element={<CustomerHome />} />
                <Route path="catalog" element={<CustomerCatalog />} />
                <Route path="orders" element={<CustomerOrders />} />
                <Route path="cart" element={<CustomerCart />} />
                <Route path="profile" element={<CustomerProfile />} />
              </Route>

              {/* Authorization & Error Routes */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} /> {/* Catches any other unmatched routes */}
            </Routes>
          </CartProvider>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
