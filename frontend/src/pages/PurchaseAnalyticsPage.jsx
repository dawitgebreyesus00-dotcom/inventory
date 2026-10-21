import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { tokenUtils } from '../utils/tokenUtils';

const PurchaseAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({
    totalPOs: 0,
    totalSpent: 0,
    avgDeliveryTime: 0,
    supplierPerformance: [],
    monthlyTrends: [],
    statusBreakdown: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [posRes, suppRes] = await Promise.all([
        fetch('http://localhost:3000/api/purchase-orders', {
          headers: tokenUtils.getAuthHeaders()
        }),
        fetch('http://localhost:3000/api/suppliers', {
          headers: tokenUtils.getAuthHeaders()
        })
      ]);

      const posData = await posRes.json();
      const suppData = await suppRes.json();
      
      const orders = posData.orders || [];
      const suppliers = Array.isArray(suppData) ? suppData : suppData.data || [];

      // Calculate analytics
      const totalPOs = orders.length;
      const totalSpent = orders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
      
      // Delivery time calculation
      const deliveredOrders = orders.filter(po => po.status === 'received' && po.sentDate && po.receivedDate);
      const avgDeliveryTime = deliveredOrders.length > 0 
        ? deliveredOrders.reduce((sum, po) => {
            const days = Math.ceil((new Date(po.receivedDate) - new Date(po.sentDate)) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / deliveredOrders.length
        : 0;

      // Supplier performance
      const supplierStats = suppliers.map(supplier => {
        const supplierOrders = orders.filter(po => po.supplier?._id === supplier._id);
        const totalOrders = supplierOrders.length;
        const completedOrders = supplierOrders.filter(po => po.status === 'received').length;
        const totalValue = supplierOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
        
        return {
          name: supplier.name,
          totalOrders,
          completedOrders,
          completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
          totalValue
        };
      }).filter(s => s.totalOrders > 0);

      // Status breakdown
      const statusCounts = orders.reduce((acc, po) => {
        acc[po.status] = (acc[po.status] || 0) + 1;
        return acc;
      }, {});

      setAnalytics({
        totalPOs,
        totalSpent,
        avgDeliveryTime: Math.round(avgDeliveryTime),
        supplierPerformance: supplierStats,
        statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading analytics...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Purchase Order Analytics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total POs</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalPOs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">${analytics.totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Delivery</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.avgDeliveryTime} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg PO Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${analytics.totalPOs > 0 ? (analytics.totalSpent / analytics.totalPOs).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Order Status Breakdown</h3>
          <div className="space-y-3">
            {analytics.statusBreakdown.map(({ status, count }) => (
              <div key={status} className="flex justify-between items-center">
                <span className="capitalize font-medium">{status}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(count / analytics.totalPOs) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Supplier Performance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Supplier Performance</h3>
          <div className="space-y-4">
            {analytics.supplierPerformance.slice(0, 5).map(supplier => (
              <div key={supplier.name} className="border-b pb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{supplier.name}</span>
                  <span className="text-sm text-gray-600">{supplier.completionRate}% complete</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{supplier.totalOrders} orders</span>
                  <span>${supplier.totalValue.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${supplier.completionRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseAnalyticsPage;