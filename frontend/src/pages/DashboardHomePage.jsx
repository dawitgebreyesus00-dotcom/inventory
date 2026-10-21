import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Users, ShoppingCart, Truck, FolderOpen, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { fetchProducts } from '../api/products';
import { fetchCategories } from '../api/categories';
import { fetchSuppliers } from '../api/suppliers';
import { fetchOrders } from '../api/orders';
import { fetchUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/layout/PageHeader';
import StatsGrid from '../components/layout/StatsGrid';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import RoleBasedActions from '../components/RoleBasedActions';




const DashboardHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [counts, setCounts] = useState({ products: 0, categories: 0, suppliers: 0, users: 0, orders: 0 });
  const [todaySales, setTodaySales] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [loading, setLoading] = useState(true);
  const LOW_STOCK_THRESHOLD = 5;



  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, cRes, sRes, oRes, uRes] = await Promise.all([
          fetchProducts(1, 1000).catch(() => ({})),
          fetchCategories(1, 1000).catch(() => ({})),
          fetchSuppliers().catch(() => ({})),
          fetchOrders().catch(() => ({})),
          fetchUsers().catch(() => ({})),
        ]);

        const products = pRes?.data?.items || pRes?.items || [];
        const categories = cRes?.data?.items || cRes?.items || [];
        const suppliers = sRes?.data || sRes || [];
        const orders = Array.isArray(oRes?.data) ? oRes.data : Array.isArray(oRes) ? oRes : [];
        const users = uRes?.data || uRes || [];

        setCounts({ products: products.length, categories: categories.length, suppliers: suppliers.length, users: users.length, orders: orders.length });

        // today's sales: sum of totals of orders placed today
        const today = new Date();
        const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
        const sales = (orders || []).reduce((sum, o) => {
          const dt = new Date(o.placedAt || o.createdAt || Date.now());
          if (isSameDay(dt, today)) return sum + (Number(o.total) || 0);
          return sum;
        }, 0);
        setTodaySales(sales);

        // low-stock
        const low = (products || []).filter(p => (Number(p.quantity) || 0) <= LOW_STOCK_THRESHOLD).length;
        setLowStock(low);
      } catch (err) {
        console.error('Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  const stats = [
    {
      title: 'Total Products',
      value: counts.products,
      icon: <Package />,
      color: 'blue',
      trend: 'up',
      trendValue: '+12%'
    },
    {
      title: 'Active Users',
      value: counts.users,
      icon: <Users />,
      color: 'green',
      trend: 'up',
      trendValue: '+8%'
    },
    {
      title: 'Total Orders',
      value: counts.orders,
      icon: <ShoppingCart />,
      color: 'purple',
      trend: 'up',
      trendValue: '+15%'
    },
    {
      title: "Today's Sales",
      value: `$${todaySales.toFixed(2)}`,
      icon: <DollarSign />,
      color: 'green',
      trend: 'up',
      trendValue: '+23%'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your inventory."
        actions={[
          <Button
            key="reports"
            variant="outline"
            onClick={() => navigate('/admin-dashboard/reports')}
            icon={<TrendingUp />}
          >
            View Reports
          </Button>
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Admin Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {user?.role === 'admin' && (
            <Card className="stagger-item" hover>
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <Users className="text-blue-600" size={20} />
                  Admin Control Center
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending Approvals</span>
                    <span className="text-lg font-semibold text-orange-600">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">System Health</span>
                    <span className="text-lg font-semibold text-green-600">Good</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Sessions</span>
                    <span className="text-lg font-semibold text-gray-900">8</span>
                  </div>
                </div>
              </Card.Content>
              <Card.Footer>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/admin-dashboard/users')}
                  className="w-full"
                >
                  Manage System
                </Button>
              </Card.Footer>
            </Card>
          )}

          {user?.role === 'manager' && (
            <Card className="stagger-item" hover>
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <Package className="text-green-600" size={20} />
                  Stock Management
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Today's Adjustments</span>
                    <span className="text-lg font-semibold text-blue-600">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Reorder Alerts</span>
                    <span className="text-lg font-semibold text-red-600">{lowStock}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Count</span>
                    <span className="text-sm text-gray-500">2 days ago</span>
                  </div>
                </div>
              </Card.Content>
              <Card.Footer>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => navigate('/admin-dashboard/stock-adjustments')}
                  className="w-full"
                >
                  Stock Operations
                </Button>
              </Card.Footer>
            </Card>
          )}
          {/* Universal Inventory Health */}
          <Card className="stagger-item" hover>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Package className="text-blue-600" size={20} />
                Inventory Health
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Low Stock Items</span>
                  <span className={`text-2xl font-bold ${
                    lowStock > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {lowStock}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Categories</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {counts.categories}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Suppliers</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {counts.suppliers}
                  </span>
                </div>
              </div>
            </Card.Content>
            <Card.Footer>
              <Button
                variant={lowStock > 0 ? 'warning' : 'success'}
                size="sm"
                onClick={() => navigate('/admin-dashboard/low-stock')}
                icon={lowStock > 0 ? <AlertTriangle /> : <Package />}
                className="w-full"
              >
                {lowStock > 0 ? 'View Low Stock' : 'View Inventory'}
              </Button>
            </Card.Footer>
          </Card>

          {/* Quick Actions */}
          <Card className="stagger-item" hover>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <TrendingUp className="text-green-600" size={20} />
                Quick Actions
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin-dashboard/products')}
                  icon={<Package />}
                  className="w-full justify-start"
                >
                  Add New Product
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin-dashboard/orders')}
                  icon={<ShoppingCart />}
                  className="w-full justify-start"
                >
                  Create Order
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin-dashboard/purchase-orders')}
                  icon={<Truck />}
                  className="w-full justify-start"
                >
                  New Purchase Order
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin-dashboard/users')}
                  icon={<Users />}
                  className="w-full justify-start"
                >
                  Add User
                </Button>
              </div>
            </Card.Content>
          </Card>

          {/* System Status */}
          <Card className="stagger-item" hover>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                System Status
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    ONLINE
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Server</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    RUNNING
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Backup</span>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage Used</span>
                  <span className="text-xs text-gray-500">2.3 GB / 10 GB</span>
                </div>
              </div>
            </Card.Content>
            <Card.Footer>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin-dashboard/reports')}
                className="w-full"
              >
                View System Reports
              </Button>
            </Card.Footer>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardHomePage;
