import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Truck, CheckCircle, XCircle } from 'lucide-react';
import { tokenUtils } from '../../utils/tokenUtils';
import { colors, fonts, fontSizes, radii, shadows } from '../../styles/theme';

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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Loading...</div>;

  return (
    <div style={{ 
      padding: 'clamp(12px, 2vw, 24px)', 
      fontFamily: fonts.main, 
      minHeight: '100vh', 
      background: colors.background, 
      color: colors.text, 
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 'clamp(16px, 3vw, 24px)', 
        flexWrap: 'wrap', 
        gap: '12px'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontWeight: 800, 
          fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
          color: colors.text, 
          letterSpacing: '-0.5px', 
          fontFamily: fonts.heading 
        }}>Purchase Orders</h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {success && (
            <div style={{ 
              background: colors.success + '20', 
              border: `1px solid ${colors.success}`, 
              color: colors.success, 
              padding: '8px 16px', 
              borderRadius: radii.md,
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
            }}>
              {success}
            </div>
          )}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            style={{ 
              padding: '8px 16px', 
              borderRadius: radii.md, 
              background: showAnalytics ? colors.secondary : colors.background, 
              color: showAnalytics ? colors.surface : colors.text, 
              border: `1px solid ${colors.border}`, 
              fontWeight: 600,
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
              cursor: 'pointer'
            }}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{ 
              padding: '8px 16px', 
              borderRadius: radii.md, 
              background: colors.primary, 
              color: colors.surface, 
              border: 'none', 
              fontWeight: 600,
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={16} />
            New Purchase Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        background: colors.surface, 
        padding: 'clamp(16px, 3vw, 24px)', 
        borderRadius: radii.md, 
        boxShadow: shadows.card, 
        border: `1px solid ${colors.border}`, 
        marginBottom: 'clamp(16px, 3vw, 24px)' 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: 'clamp(8px, 2vw, 12px)'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
              fontWeight: 600, 
              marginBottom: '4px' 
            }}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: 'clamp(8px, 2vw, 12px)', 
                borderRadius: radii.md, 
                border: `1px solid ${colors.border}`, 
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                boxSizing: 'border-box' 
              }}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
              fontWeight: 600, 
              marginBottom: '4px' 
            }}>Supplier</label>
            <select
              value={filters.supplier}
              onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: 'clamp(8px, 2vw, 12px)', 
                borderRadius: radii.md, 
                border: `1px solid ${colors.border}`, 
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                boxSizing: 'border-box' 
              }}
            >
              <option value="">All Suppliers</option>
              {(suppliers || []).map(supplier => (
                <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
              fontWeight: 600, 
              marginBottom: '4px' 
            }}>Search</label>
            <input
              type="text"
              placeholder="Search PO number..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: 'clamp(8px, 2vw, 12px)', 
                borderRadius: radii.md, 
                border: `1px solid ${colors.border}`, 
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                boxSizing: 'border-box' 
              }}
            />
          </div>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && analytics && (
        <div style={{ 
          background: colors.surface, 
          padding: 'clamp(16px, 3vw, 24px)', 
          borderRadius: radii.md, 
          boxShadow: shadows.card, 
          border: `1px solid ${colors.border}`, 
          marginBottom: 'clamp(16px, 3vw, 24px)' 
        }}>
          <h2 style={{ 
            margin: '0 0 16px 0', 
            fontWeight: 700, 
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' 
          }}>📊 Purchase Order Analytics</h2>
          
          {/* Key Metrics */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: 'clamp(8px, 2vw, 16px)', 
            marginBottom: '16px' 
          }}>
            <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.primary + '10', borderRadius: radii.sm }}>
              <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.primary }}>{analytics.totalPOs}</div>
              <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Total POs</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.success + '10', borderRadius: radii.sm }}>
              <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.success }}>${analytics.totalSpent.toFixed(2)}</div>
              <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Total Spent</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.warning + '10', borderRadius: radii.sm }}>
              <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.warning }}>{analytics.avgDeliveryTime} days</div>
              <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Avg Delivery</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.secondary + '10', borderRadius: radii.sm }}>
              <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.secondary }}>${analytics.avgOrderValue.toFixed(2)}</div>
              <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Avg Order Value</div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div style={{ background: colors.background, padding: '16px', borderRadius: radii.sm }}>
            <h3 style={{ fontWeight: 600, marginBottom: '12px', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Order Status Distribution</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {analytics.statusBreakdown.map(({ status, count }) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: status === 'draft' ? colors.muted :
                               status === 'sent' ? colors.primary :
                               status === 'confirmed' ? colors.warning :
                               status === 'shipped' ? colors.secondary :
                               status === 'received' ? colors.success :
                               colors.danger
                  }}></div>
                  <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', textTransform: 'capitalize' }}>{status}: {count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Purchase Orders List */}
      <div style={{ 
        background: colors.surface, 
        borderRadius: radii.md, 
        boxShadow: shadows.card, 
        border: `1px solid ${colors.border}`, 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          padding: 'clamp(16px, 3vw, 24px)', 
          borderBottom: `1px solid ${colors.border}` 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '12px', 
            flexWrap: 'wrap', 
            gap: '12px' 
          }}>
            <h2 style={{ 
              margin: 0, 
              fontWeight: 700, 
              fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', 
              color: colors.text, 
              fontFamily: fonts.heading 
            }}>Purchase Orders ({purchaseOrders.length})</h2>
          </div>

          {/* Bulk Actions */}
          {selectedPOs.length > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'clamp(6px, 1.5vw, 12px)', 
              padding: 'clamp(8px, 2vw, 12px)', 
              background: colors.secondary + '20', 
              borderRadius: radii.md, 
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', fontWeight: 600 }}>{selectedPOs.length} selected</span>
              <select 
                value={bulkAction} 
                onChange={(e) => setBulkAction(e.target.value)} 
                style={{ 
                  padding: '6px', 
                  borderRadius: radii.sm, 
                  border: `1px solid ${colors.border}`, 
                  fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' 
                }}
              >
                <option value="">Bulk Actions</option>
                <option value="status-sent">Mark as Sent</option>
                <option value="status-received">Mark as Received</option>
                <option value="status-cancelled">Mark as Cancelled</option>
              </select>
              <button 
                onClick={handleBulkAction} 
                disabled={!bulkAction} 
                style={{ 
                  padding: '6px 10px', 
                  borderRadius: radii.sm, 
                  background: colors.primary, 
                  color: colors.surface, 
                  border: 'none', 
                  fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', 
                  fontWeight: 600, 
                  opacity: bulkAction ? 1 : 0.5,
                  cursor: bulkAction ? 'pointer' : 'not-allowed'
                }}
              >Apply</button>
              <button 
                onClick={() => setSelectedPOs([])} 
                style={{ 
                  padding: '6px 10px', 
                  borderRadius: radii.sm, 
                  background: colors.border, 
                  border: 'none', 
                  fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                  cursor: 'pointer'
                }}
              >Clear</button>
            </div>
          )}
        </div>

        {/* Select All Header */}
        {purchaseOrders.length > 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: 'clamp(8px, 2vw, 16px)', 
            borderBottom: `2px solid ${colors.border}`, 
            background: colors.background,
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <input 
              type="checkbox" 
              checked={selectedPOs.length === purchaseOrders.length && purchaseOrders.length > 0}
              onChange={toggleSelectAll}
              style={{ marginRight: '12px' }}
            />
            <span style={{ fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Select All ({purchaseOrders.length})</span>
          </div>
        )}

        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          {purchaseOrders.length === 0 ? (
            <div style={{ 
              padding: 'clamp(16px, 3vw, 24px)', 
              color: colors.muted, 
              textAlign: 'center',
              fontSize: 'clamp(0.9rem, 2vw, 1rem)'
            }}>No purchase orders found.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {purchaseOrders.map(po => (
                <li key={po._id} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr auto', 
                  gap: 'clamp(8px, 2vw, 16px)',
                  padding: 'clamp(12px, 2.5vw, 20px)', 
                  borderBottom: `1px solid ${colors.border}`, 
                  alignItems: 'center', 
                  background: selectedPOs.includes(po._id) ? colors.primary + '10' : 
                             po.status === 'received' ? `${colors.success}10` : 
                             po.status === 'cancelled' ? `${colors.danger}10` : 'transparent',
                  cursor: 'pointer'
                }} onClick={() => togglePOSelection(po._id)}>
                  <div style={{ 
                    display: 'flex', 
                    gap: 'clamp(8px, 2vw, 16px)', 
                    alignItems: 'center',
                    minWidth: 0,
                    flex: 1
                  }}>
                    <input 
                      type="checkbox" 
                      checked={selectedPOs.includes(po._id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        togglePOSelection(po._id);
                      }}
                    />
                    <div style={{ 
                      width: 'clamp(40px, 8vw, 56px)', 
                      height: 'clamp(40px, 8vw, 56px)', 
                      background: colors.primary + '20', 
                      borderRadius: radii.sm, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      border: `1px solid ${colors.border}`,
                      flexShrink: 0,
                      fontSize: 'clamp(1rem, 2vw, 1.2rem)'
                    }}>
                      {getStatusIcon(po.status)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'clamp(6px, 1.5vw, 12px)', 
                        marginBottom: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ 
                          fontWeight: 700, 
                          fontSize: 'clamp(0.9rem, 2.2vw, 1.1rem)' 
                        }}>PO #{po.poNumber}</div>
                        <span style={{ 
                          background: po.status === 'received' ? colors.success : 
                                    po.status === 'cancelled' ? colors.danger : 
                                    po.status === 'shipped' ? colors.warning : colors.secondary, 
                          color: colors.surface, 
                          padding: '2px 8px', 
                          borderRadius: radii.sm, 
                          fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', 
                          fontWeight: 600 
                        }}>{po.status?.toUpperCase()}</span>
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                        gap: 'clamp(4px, 1vw, 8px)', 
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                        color: colors.muted 
                      }}>
                        <div><strong>Supplier:</strong> {po.supplier?.name}</div>
                        <div><strong>Items:</strong> {po.items?.length || 0}</div>
                        <div><strong>Total:</strong> ${po.totalAmount?.toFixed(2)}</div>
                        <div><strong>Date:</strong> {new Date(po.orderDate).toLocaleDateString()}</div>
                      </div>
                      {po.status === 'sent' && (
                        <div style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>
                          Waiting for supplier confirmation
                        </div>
                      )}
                      {po.status === 'confirmed' && po.supplierConfirmation?.estimatedDelivery && (
                        <div style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>
                          Est. delivery: {new Date(po.supplierConfirmation.estimatedDelivery).toLocaleDateString()}
                        </div>
                      )}
                      {po.status === 'shipped' && po.shippingInfo?.trackingNumber && (
                        <div style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>
                          Tracking: {po.shippingInfo.trackingNumber}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: 'clamp(6px, 1.5vw, 12px)', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end'
                  }} onClick={(e) => e.stopPropagation()}>
                    {po.status === 'shipped' && (
                      <>
                        <button
                          onClick={() => openReceiveModal(po)}
                          style={{ 
                            padding: 'clamp(6px, 1.5vw, 8px)', 
                            borderRadius: radii.sm, 
                            background: colors.success, 
                            color: colors.surface, 
                            border: 'none', 
                            fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                            cursor: 'pointer'
                          }}
                          title="Receive Items"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => updateStatus(po._id, 'received')}
                          style={{ 
                            padding: 'clamp(6px, 1.5vw, 8px)', 
                            borderRadius: radii.sm, 
                            background: colors.primary, 
                            color: colors.surface, 
                            border: 'none', 
                            fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                            cursor: 'pointer'
                          }}
                          title="Mark All Received"
                        >
                          ✅
                        </button>
                      </>
                    )}
                    {po.status === 'draft' && (
                      <button
                        onClick={() => updateStatus(po._id, 'sent')}
                        style={{ 
                          padding: 'clamp(6px, 1.5vw, 8px)', 
                          borderRadius: radii.sm, 
                          background: colors.primary, 
                          color: colors.surface, 
                          border: 'none', 
                          fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                          cursor: 'pointer'
                        }}
                        title="Send to Supplier"
                      >
                        📤
                      </button>
                    )}
                    <button
                      onClick={() => reorderPO(po)}
                      style={{ 
                        padding: 'clamp(6px, 1.5vw, 8px)', 
                        borderRadius: radii.sm, 
                        background: colors.secondary, 
                        color: colors.surface, 
                        border: 'none', 
                        fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                        cursor: 'pointer'
                      }}
                      title="Reorder"
                    >
                      🔄
                    </button>
                    {po.status !== 'received' && po.status !== 'cancelled' && (
                      <button
                        onClick={() => updateStatus(po._id, 'cancelled')}
                        style={{ 
                          padding: 'clamp(6px, 1.5vw, 8px)', 
                          borderRadius: radii.sm, 
                          background: colors.danger, 
                          color: colors.surface, 
                          border: 'none', 
                          fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                          cursor: 'pointer'
                        }}
                        title="Cancel"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <div style={{ 
            color: colors.danger, 
            margin: '16px', 
            padding: 'clamp(8px, 2vw, 12px)', 
            background: colors.danger + '10', 
            borderRadius: radii.md, 
            border: `1px solid ${colors.danger}30`,
            fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
          }}>{error}</div>
        )}
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