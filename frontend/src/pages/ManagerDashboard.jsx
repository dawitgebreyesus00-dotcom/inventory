import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, TrendingUp, AlertTriangle, CheckCircle, 
  Truck, BarChart3, Clock, Target 
} from 'lucide-react';
import { tokenUtils } from '../utils/tokenUtils';
import PageHeader from '../components/layout/PageHeader';
import StatsGrid from '../components/layout/StatsGrid';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ManagerQuickActions from '../components/ManagerQuickActions';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    stockStats: { totalProducts: 0, lowStock: 0, adjustments: 0, receivedToday: 0 },
    recentAdjustments: [],
    pendingPOs: [],
    stockAlerts: [],
    todayTasks: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      const [productsRes, adjustmentsRes, poRes] = await Promise.all([
        fetch('http://localhost:3000/api/products', {
          headers: tokenUtils.getAuthHeaders()
        }),
        fetch('http://localhost:3000/api/stock-adjustments?limit=5', {
          headers: tokenUtils.getAuthHeaders()
        }),
        fetch('http://localhost:3000/api/purchase-orders?status=pending&limit=5', {
          headers: tokenUtils.getAuthHeaders()
        })
      ]);

      const [productsData, adjustments, purchaseOrders] = await Promise.all([
        productsRes.json(), adjustmentsRes.json(), poRes.json()
      ]);

      const products = productsData.data?.items || productsData.items || [];
      const lowStockItems = products.filter(p => p.stock <= (p.lowStockThreshold || 10));
      
      setDashboardData({
        stockStats: {
          totalProducts: products.length,
          lowStock: lowStockItems.length,
          adjustments: adjustments.adjustments?.length || 0,
          receivedToday: 3 // Mock data
        },
        recentAdjustments: adjustments.adjustments || [],
        pendingPOs: purchaseOrders.orders || [],
        stockAlerts: lowStockItems.slice(0, 5),
        todayTasks: [
          { id: 1, task: 'Weekly stock count - Electronics', priority: 'high', due: '2:00 PM' },
          { id: 2, task: 'Receive delivery from TechCorp', priority: 'medium', due: '4:00 PM' },
          { id: 3, task: 'Process damage reports', priority: 'low', due: 'End of day' }
        ]
      });
    } catch (error) {
      console.error('Error fetching manager data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading manager dashboard..." />;
  }

  const stats = [
    {
      title: 'Total Products',
      value: dashboardData.stockStats.totalProducts,
      icon: <Package />,
      color: 'blue',
      trend: 'up',
      trendValue: '+5 this week'
    },
    {
      title: 'Low Stock Items',
      value: dashboardData.stockStats.lowStock,
      icon: <AlertTriangle />,
      color: dashboardData.stockStats.lowStock > 0 ? 'red' : 'green',
      trend: dashboardData.stockStats.lowStock > 0 ? 'down' : 'neutral',
      trendValue: 'Needs attention'
    },
    {
      title: 'Stock Adjustments',
      value: dashboardData.stockStats.adjustments,
      icon: <TrendingUp />,
      color: 'purple',
      trend: 'up',
      trendValue: 'This week'
    },
    {
      title: 'Received Today',
      value: dashboardData.stockStats.receivedToday,
      icon: <Truck />,
      color: 'green',
      trend: 'up',
      trendValue: 'Deliveries'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Inventory Manager Dashboard"
        subtitle="Stock operations, adjustments, and warehouse management"
        breadcrumbs={['Dashboard', 'Manager']}
        actions={[
          <Button
            key="reports"
            variant="outline"
            onClick={() => navigate('/admin-dashboard/reports')}
            icon={<BarChart3 />}
          >
            View Reports
          </Button>
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Manager Quick Actions */}
        <ManagerQuickActions />

        {/* Manager Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Today's Priority Tasks */}
          <Card className="stagger-item" hover>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Clock className="text-orange-600" size={20} />
                Today's Priority Tasks
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {dashboardData.todayTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.task}</p>
                      <p className="text-xs text-gray-500">Due: {task.due}</p>
                    </div>
                    <Badge 
                      variant={
                        task.priority === 'high' ? 'danger' : 
                        task.priority === 'medium' ? 'warning' : 'default'
                      }
                      size="sm"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card.Content>
            <Card.Footer>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/admin-dashboard/stock-adjustments')}
                className="w-full"
              >
                Manage Tasks
              </Button>
            </Card.Footer>
          </Card>

          {/* Stock Alerts */}
          <Card className="stagger-item" hover>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={20} />
                Critical Stock Alerts
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {dashboardData.stockAlerts.length > 0 ? (
                  dashboardData.stockAlerts.map(product => (
                    <div key={product._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-red-600">Stock: {product.stock} units</p>
                      </div>
                      <Badge variant="danger" size="sm">
                        Low
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="mx-auto text-green-500 mb-2" size={24} />
                    <p className="text-sm text-gray-600">All stock levels good</p>
                  </div>
                )}
              </div>
            </Card.Content>
            <Card.Footer>
              <Button
                variant="warning"
                size="sm"
                onClick={() => navigate('/admin-dashboard/low-stock')}
                className="w-full"
              >
                View All Alerts
              </Button>
            </Card.Footer>
          </Card>

          {/* Quick Stock Operations */}
          <Card className="stagger-item" hover>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Target className="text-blue-600" size={20} />
                Quick Operations
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin-dashboard/stock-adjustments')}
                  icon={<TrendingUp />}
                  className="w-full justify-start"
                >
                  Stock Adjustment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin-dashboard/purchase-orders')}
                  icon={<Truck />}
                  className="w-full justify-start"
                >
                  Receive Delivery
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin-dashboard/products')}
                  icon={<Package />}
                  className="w-full justify-start"
                >
                  Physical Count
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin-dashboard/reports')}
                  icon={<BarChart3 />}
                  className="w-full justify-start"
                >
                  Stock Reports
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Stock Adjustments */}
          <Card className="stagger-item">
            <Card.Header>
              <Card.Title>Recent Stock Adjustments</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {dashboardData.recentAdjustments.length > 0 ? (
                  dashboardData.recentAdjustments.map(adjustment => (
                    <div key={adjustment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{adjustment.product?.name}</p>
                        <p className="text-xs text-gray-500">
                          {adjustment.type} • {new Date(adjustment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${
                          adjustment.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {adjustment.quantity > 0 ? '+' : ''}{adjustment.quantity}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent adjustments</p>
                )}
              </div>
            </Card.Content>
            <Card.Footer>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin-dashboard/stock-adjustments')}
                className="w-full"
              >
                View All Adjustments
              </Button>
            </Card.Footer>
          </Card>

          {/* Pending Purchase Orders */}
          <Card className="stagger-item">
            <Card.Header>
              <Card.Title>Pending Purchase Orders</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {dashboardData.pendingPOs.length > 0 ? (
                  dashboardData.pendingPOs.map(po => (
                    <div key={po._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{po.poNumber}</p>
                        <p className="text-xs text-gray-500">
                          {po.supplier?.name} • ${po.totalAmount?.toFixed(2)}
                        </p>
                      </div>
                      <Badge variant="primary" size="sm">
                        {po.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No pending orders</p>
                )}
              </div>
            </Card.Content>
            <Card.Footer>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin-dashboard/purchase-orders')}
                className="w-full"
              >
                View All Orders
              </Button>
            </Card.Footer>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;