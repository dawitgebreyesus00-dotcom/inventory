import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Truck, CheckCircle, XCircle } from 'lucide-react';
import { tokenUtils } from '../utils/tokenUtils';
import { colors, fonts, fontSizes, radii, shadows } from '../styles/theme';

const PurchaseOrdersPage = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({ status: '', supplier: '', search: '' });

  const [newPO, setNewPO] = useState({
    supplier: '',
    items: [{ product: '', quantity: 1, unitCost: 0 }],
    expectedDate: '',
    notes: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivingPO, setReceivingPO] = useState(null);
  const [receivingItems, setReceivingItems] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [selectedPOs, setSelectedPOs] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    fetchData();
    if (showAnalytics) fetchAnalytics();
  }, [filters, showAnalytics]);

  const fetchData = async () => {
    try {
      const [poRes, suppRes, prodRes] = await Promise.all([
        fetch(`http://localhost:3000/api/purchase-orders?${new URLSearchParams(filters)}`, {
          headers: tokenUtils.getAuthHeaders()
        }),
        fetch('http://localhost:3000/api/suppliers', {
          headers: tokenUtils.getAuthHeaders()
        }),
        fetch('http://localhost:3000/api/products?limit=1000', {
          headers: tokenUtils.getAuthHeaders()
        })
      ]);

      const [poData, suppData, prodData] = await Promise.all([
        poRes.json(), suppRes.json(), prodRes.json()
      ]);

      setPurchaseOrders(poData.orders || poData.data || []);
      
      // Handle suppliers array
      let supplierArray = [];
      if (Array.isArray(suppData)) {
        supplierArray = suppData;
      } else if (suppData && Array.isArray(suppData.data)) {
        supplierArray = suppData.data;
      } else if (suppData && Array.isArray(suppData.suppliers)) {
        supplierArray = suppData.suppliers;
      }
      setSuppliers(supplierArray);
      
      // Handle products array
      let productArray = [];
      if (Array.isArray(prodData)) {
        productArray = prodData;
      } else if (prodData && prodData.data && Array.isArray(prodData.data.items)) {
        productArray = prodData.data.items;
      } else if (prodData && Array.isArray(prodData.data)) {
        productArray = prodData.data;
      } else if (prodData && Array.isArray(prodData.items)) {
        productArray = prodData.items;
      }
      setProducts(productArray);
      console.log('Products loaded:', productArray.length);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error
      setPurchaseOrders([]);
      setSuppliers([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!newPO.supplier) {
      setError('Please select a supplier');
      return;
    }
    
    const validItems = newPO.items.filter(item => item.product && item.quantity > 0 && item.unitCost >= 0);
    if (validItems.length === 0) {
      setError('Please add at least one valid item');
      return;
    }
    
    try {
      console.log('Creating PO with data:', { ...newPO, items: validItems });
      
      const response = await fetch('http://localhost:3000/api/purchase-orders', {
        method: 'POST',
        headers: tokenUtils.getAuthHeaders(true),
        body: JSON.stringify({ ...newPO, items: validItems })
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        setSuccess('Purchase order created successfully!');
        setShowCreateForm(false);
        setNewPO({ supplier: '', items: [{ product: '', quantity: 1, unitCost: 0 }], expectedDate: '', notes: '' });
        setError(null);
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Server error:', errorData);
        setError(errorData.message || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Network error creating purchase order:', error);
      setError('Network error. Please check your connection and try again.');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch(`http://localhost:3000/api/purchase-orders/${id}/status`, {
        method: 'PATCH',
        headers: tokenUtils.getAuthHeaders(true),
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const addItem = () => {
    setNewPO(prev => ({
      ...prev,
      items: [...prev.items, { product: '', quantity: 1, unitCost: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (newPO.items.length > 1) {
      setNewPO(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateItem = (index, field, value) => {
    setNewPO(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const reorderPO = (po) => {
    setNewPO({
      supplier: po.supplier._id,
      items: po.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        unitCost: item.unitCost
      })),
      expectedDate: '',
      notes: `Reorder from ${po.poNumber}`
    });
    setShowCreateForm(true);
  };

  const fetchAnalytics = async () => {
    try {
      const orders = purchaseOrders;
      const totalPOs = orders.length;
      const totalSpent = orders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
      
      const deliveredOrders = orders.filter(po => po.status === 'received' && po.sentDate && po.receivedDate);
      const avgDeliveryTime = deliveredOrders.length > 0 
        ? deliveredOrders.reduce((sum, po) => {
            const days = Math.ceil((new Date(po.receivedDate) - new Date(po.sentDate)) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / deliveredOrders.length
        : 0;

      const statusCounts = orders.reduce((acc, po) => {
        acc[po.status] = (acc[po.status] || 0) + 1;
        return acc;
      }, {});

      setAnalytics({
        totalPOs,
        totalSpent,
        avgDeliveryTime: Math.round(avgDeliveryTime),
        avgOrderValue: totalPOs > 0 ? totalSpent / totalPOs : 0,
        statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  };

  const openReceiveModal = (po) => {
    setReceivingPO(po);
    setReceivingItems(po.items.map(item => ({
      ...item,
      receivedQuantity: item.quantity,
      actualCost: item.unitCost
    })));
    setShowReceiveModal(true);
  };

  const handlePartialReceive = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/purchase-orders/${receivingPO._id}/receive`, {
        method: 'POST',
        headers: tokenUtils.getAuthHeaders(true),
        body: JSON.stringify({ receivedItems: receivingItems })
      });

      if (response.ok) {
        setSuccess('Items received successfully!');
        setShowReceiveModal(false);
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to receive items');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const updateReceivingItem = (index, field, value) => {
    setReceivingItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800', 
      confirmed: 'bg-yellow-100 text-yellow-800',
      shipped: 'bg-purple-100 text-purple-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'draft': return '📝';
      case 'sent': return '📤';
      case 'confirmed': return '✅';
      case 'shipped': return '🚚';
      case 'received': return '📦';
      case 'cancelled': return '❌';
      default: return '📄';
    }
  };

  const togglePOSelection = (id) => {
    setSelectedPOs(prev => 
      prev.includes(id) ? prev.filter(poId => poId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedPOs(prev => 
      prev.length === purchaseOrders.length ? [] : purchaseOrders.map(po => po._id)
    );
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedPOs.length === 0) return;
    
    if (bulkAction.startsWith('status-')) {
      const status = bulkAction.replace('status-', '');
      try {
        for (const id of selectedPOs) {
          await updateStatus(id, status);
        }
        setSelectedPOs([]);
        fetchData();
      } catch (error) {
        setError('Failed to update purchase orders');
      }
    }
    setBulkAction('');
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <div className="flex gap-2">
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
              {success}
            </div>
          )}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${showAnalytics ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            New Purchase Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Supplier</label>
            <select
              value={filters.supplier}
              onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Suppliers</option>
              {(suppliers || []).map(supplier => (
                <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              placeholder="Search PO number..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && analytics && (
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">📊 Purchase Order Analytics</h2>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalPOs}</div>
              <div className="text-sm text-gray-600">Total POs</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">${analytics.totalSpent.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{analytics.avgDeliveryTime} days</div>
              <div className="text-sm text-gray-600">Avg Delivery</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">${analytics.avgOrderValue.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Avg Order Value</div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Order Status Distribution</h3>
            <div className="flex flex-wrap gap-4">
              {analytics.statusBreakdown.map(({ status, count }) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'draft' ? 'bg-gray-400' :
                    status === 'sent' ? 'bg-blue-400' :
                    status === 'confirmed' ? 'bg-yellow-400' :
                    status === 'shipped' ? 'bg-purple-400' :
                    status === 'received' ? 'bg-green-400' :
                    'bg-red-400'
                  }`}></div>
                  <span className="text-sm capitalize">{status}: {count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Purchase Orders List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {purchaseOrders.map(po => (
              <tr key={po._id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{po.poNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">{po.supplier?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span>{getStatusIcon(po.status)}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(po.status)}`}>
                      {po.status.toUpperCase()}
                    </span>
                  </div>
                  {po.status === 'sent' && (
                    <div className="text-xs text-gray-500 mt-1">Waiting for supplier confirmation</div>
                  )}
                  {po.status === 'confirmed' && po.supplierConfirmation?.estimatedDelivery && (
                    <div className="text-xs text-gray-500 mt-1">
                      Est. delivery: {new Date(po.supplierConfirmation.estimatedDelivery).toLocaleDateString()}
                    </div>
                  )}
                  {po.status === 'shipped' && po.shippingInfo?.trackingNumber && (
                    <div className="text-xs text-gray-500 mt-1">
                      Tracking: {po.shippingInfo.trackingNumber}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">${po.totalAmount?.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(po.orderDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    {po.status === 'shipped' && (
                      <>
                        <button
                          onClick={() => openReceiveModal(po)}
                          className="text-green-600 hover:text-green-800"
                          title="Receive Items"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => updateStatus(po._id, 'received')}
                          className="text-blue-600 hover:text-blue-800 ml-1"
                          title="Mark All Received"
                        >
                          ✅
                        </button>
                      </>
                    )}
                    {po.status === 'draft' && (
                      <button
                        onClick={() => updateStatus(po._id, 'sent')}
                        className="text-blue-600 hover:text-blue-800"
                        title="Send to Supplier"
                      >
                        📤
                      </button>
                    )}
                    <button
                      onClick={() => reorderPO(po)}
                      className="text-green-600 hover:text-green-800"
                      title="Reorder"
                    >
                      🔄
                    </button>
                    {po.status !== 'received' && po.status !== 'cancelled' && (
                      <button
                        onClick={() => updateStatus(po._id, 'cancelled')}
                        className="text-red-600 hover:text-red-800"
                        title="Cancel"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create PO Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Purchase Order</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleCreatePO}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier</label>
                  <select
                    value={newPO.supplier}
                    onChange={(e) => setNewPO(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {(suppliers || []).map(supplier => (
                      <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected Date</label>
                  <input
                    type="date"
                    value={newPO.expectedDate}
                    onChange={(e) => setNewPO(prev => ({ ...prev, expectedDate: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Items</label>
                  <div className="text-sm font-medium">
                    Total: ${newPO.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0).toFixed(2)}
                  </div>
                </div>
                {newPO.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 mb-2 items-center">
                    <select
                      value={item.product}
                      onChange={(e) => updateItem(index, 'product', e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                      required
                    >
                      <option value="">Select Product</option>
                      {(products || []).map(product => (
                        <option key={product._id} value={product._id}>{product.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="border rounded px-2 py-1"
                      min="1"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Unit Cost"
                      value={item.unitCost}
                      onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                      className="border rounded px-2 py-1"
                      step="0.01"
                      min="0"
                      required
                    />
                    <span className="flex items-center px-2 font-medium">
                      ${(item.quantity * item.unitCost).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 px-2"
                      disabled={newPO.items.length === 1}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Item
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={newPO.notes}
                  onChange={(e) => setNewPO(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  rows="3"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Items Modal */}
      {showReceiveModal && receivingPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Receive Items - {receivingPO.poNumber}</h2>
            
            <div className="mb-4">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Ordered</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Received</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Unit Cost</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receivingItems.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">
                        {item.product?.name || 'Product'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <input
                          type="number"
                          value={item.receivedQuantity}
                          onChange={(e) => updateReceivingItem(index, 'receivedQuantity', parseInt(e.target.value) || 0)}
                          className="w-20 border rounded px-2 py-1 text-center"
                          min="0"
                          max={item.quantity}
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <input
                          type="number"
                          value={item.actualCost}
                          onChange={(e) => updateReceivingItem(index, 'actualCost', parseFloat(e.target.value) || 0)}
                          className="w-20 border rounded px-2 py-1 text-center"
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        ${(item.receivedQuantity * item.actualCost).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-semibold">
                Total Received: ${receivingItems.reduce((sum, item) => sum + (item.receivedQuantity * item.actualCost), 0).toFixed(2)}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReceiveModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePartialReceive}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Receive Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrdersPage;