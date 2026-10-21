import React, { useState, useEffect } from 'react';
import { Plus, History, Settings, Filter, Package, Trash2, Edit } from 'lucide-react';
import { colors, radii } from '../../styles/theme';
import { tokenUtils } from '../../utils/tokenUtils';

const StockAdjustmentsPage = () => {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'manual', 'automatic'
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({ type: '', dateRange: '30' });
  const [editingAdjustment, setEditingAdjustment] = useState(null);
  const [selectedAdjustments, setSelectedAdjustments] = useState([]);

  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: '',
    actualQuantity: 0,
    reason: '',
    notes: '',
    type: 'adjustment'
  });

  const reasonOptions = [
    'Damaged items',
    'Lost items', 
    'Expired products',
    'Extra items found',
    'Returned items',
    'Theft/Shrinkage',
    'Counting error',
    'System error',
    'Transfer adjustment',
    'Other'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [adjRes, prodRes] = await Promise.all([
        fetch('http://localhost:3000/api/stock-adjustments', {
          headers: tokenUtils.getAuthHeaders()
        }),
        fetch('http://localhost:3000/api/products?limit=1000', {
          headers: tokenUtils.getAuthHeaders()
        })
      ]);

      const [adjData, prodData] = await Promise.all([
        adjRes.json(), prodRes.json()
      ]);

      setAdjustments(adjData.data?.adjustments || []);
      setProducts(prodData.data?.items || prodData.items || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p._id === productId);
    setSelectedProduct(product);
    setAdjustmentForm(prev => ({
      ...prev,
      productId,
      actualQuantity: product?.stock || 0
    }));
  };

  const calculateAdjustment = () => {
    if (!selectedProduct) return 0;
    return adjustmentForm.actualQuantity - selectedProduct.stock;
  };

  const getFilteredAdjustments = () => {
    try {
      if (!Array.isArray(adjustments)) return [];
      
      let filtered = adjustments;
      
      // Filter by tab
      if (activeTab === 'manual') {
        filtered = filtered.filter(adj => !adj.isAutomatic);
      } else if (activeTab === 'automatic') {
        filtered = filtered.filter(adj => adj.isAutomatic);
      }
      
      // Filter by type
      if (filters.type) {
        filtered = filtered.filter(adj => adj.type === filters.type);
      }
      
      // Filter by date range
      if (filters.dateRange !== 'all') {
        const days = parseInt(filters.dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filtered = filtered.filter(adj => adj.createdAt && new Date(adj.createdAt) >= cutoffDate);
      }
      
      return filtered;
    } catch (err) {
      console.error('Error filtering adjustments:', err);
      return [];
    }
  };

  const handleSubmitAdjustment = async (e) => {
    e.preventDefault();
    setError(null);

    if (!adjustmentForm.productId || !adjustmentForm.reason) {
      setError('Please select a product and provide a reason');
      return;
    }

    try {
      const url = editingAdjustment 
        ? `http://localhost:3000/api/stock-adjustments/${editingAdjustment._id}`
        : 'http://localhost:3000/api/stock-adjustments';
      
      const method = editingAdjustment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: tokenUtils.getAuthHeaders(true),
        body: JSON.stringify({
          productId: adjustmentForm.productId,
          quantity: adjustmentForm.actualQuantity,
          type: adjustmentForm.type,
          reason: adjustmentForm.reason,
          notes: adjustmentForm.notes
        })
      });

      if (response.ok) {
        setSuccess(`Stock adjustment ${editingAdjustment ? 'updated' : 'completed'} successfully!`);
        setShowAdjustForm(false);
        setAdjustmentForm({ productId: '', actualQuantity: 0, reason: '', notes: '', type: 'adjustment' });
        setSelectedProduct(null);
        setEditingAdjustment(null);
        
        // Force refresh products data to show updated stock
        await fetchData();
        
        // Also trigger a page refresh for Products page if it's open in another tab
        window.dispatchEvent(new CustomEvent('stockUpdated'));
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || `Failed to ${editingAdjustment ? 'update' : 'create'} adjustment`);
      }
    } catch (error) {
      console.error(`Error ${editingAdjustment ? 'updating' : 'creating'} adjustment:`, error);
      setError('Network error. Please try again.');
    }
  };

  const handleEditAdjustment = (adjustment) => {
    setEditingAdjustment(adjustment);
    setSelectedProduct(adjustment.product);
    setAdjustmentForm({
      productId: adjustment.product._id,
      actualQuantity: adjustment.type === 'adjustment' ? adjustment.newStock : Math.abs(adjustment.adjustmentQuantity),
      reason: adjustment.reason,
      notes: adjustment.notes || '',
      type: adjustment.type
    });
    setShowAdjustForm(true);
  };

  const toggleAdjustmentSelection = (adjustmentId) => {
    setSelectedAdjustments(prev => 
      prev.includes(adjustmentId) 
        ? prev.filter(id => id !== adjustmentId)
        : [...prev, adjustmentId]
    );
  };

  const toggleSelectAll = () => {
    const filteredAdjustments = getFilteredAdjustments();
    setSelectedAdjustments(prev => 
      prev.length === filteredAdjustments.length 
        ? [] 
        : filteredAdjustments.map(adj => adj._id)
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedAdjustments.length} adjustment(s)? Stock values will remain unchanged.`)) {
      return;
    }

    try {
      for (const adjustmentId of selectedAdjustments) {
        await fetch(`http://localhost:3000/api/stock-adjustments/${adjustmentId}`, {
          method: 'DELETE',
          headers: tokenUtils.getAuthHeaders()
        });
      }
      
      setSuccess(`${selectedAdjustments.length} adjustment(s) deleted successfully!`);
      setSelectedAdjustments([]);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting adjustments:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleDeleteAdjustment = async (adjustmentId) => {
    if (!window.confirm('Are you sure you want to delete this adjustment history? Stock values will remain unchanged.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/stock-adjustments/${adjustmentId}`, {
        method: 'DELETE',
        headers: tokenUtils.getAuthHeaders()
      });

      if (response.ok) {
        setSuccess('Adjustment history deleted successfully (stock unchanged)!');
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete adjustment');
      }
    } catch (error) {
      console.error('Error deleting adjustment:', error);
      setError('Network error. Please try again.');
    }
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  // Add error boundary
  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>Error loading Stock Adjustments</div>
        <div style={{ fontSize: '14px', color: '#666' }}>{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ marginTop: '10px', padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: colors.text }}>
            Stock Adjustments
          </h1>
          <p style={{ margin: '4px 0 0 0', color: colors.muted, fontSize: '14px' }}>
            Track all stock changes - manual and automatic
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {success && (
            <div style={{
              background: colors.success + '20',
              color: colors.success,
              padding: '8px 16px',
              borderRadius: radii.md,
              fontSize: '14px',
              border: `1px solid ${colors.success}30`
            }}>
              {success}
            </div>
          )}
          <button
            onClick={() => setShowAdjustForm(true)}
            style={{
              background: colors.primary,
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: radii.md,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            <Plus size={18} />
            Manual Adjustment
          </button>
        </div>
      </div>



      {/* Tabs and Filters */}
      <div style={{
        background: 'white',
        borderRadius: radii.md,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb',
          padding: '0 16px'
        }}>
          {[
            { key: 'all', label: 'All Adjustments', icon: History },
            { key: 'manual', label: 'Manual Only', icon: Settings },
            { key: 'automatic', label: 'Automatic Only', icon: Package }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: activeTab === tab.key ? colors.primary : colors.muted,
                  borderBottom: activeTab === tab.key ? `2px solid ${colors.primary}` : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        {/* Filters */}
        <div style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Filter size={16} style={{ color: colors.muted }} />
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            style={{
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: radii.sm,
              fontSize: '14px'
            }}
          >
            <option value="">All Types</option>
            <option value="adjustment">General Adjustment</option>
            <option value="damage">Damaged Items</option>
            <option value="loss">Lost Items</option>
            <option value="found">Found Items</option>
            <option value="returned">Returns</option>
            <option value="expired">Expired</option>
          </select>
          
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            style={{
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: radii.sm,
              fontSize: '14px'
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Adjustments List */}
      <div style={{
        background: 'white',
        borderRadius: radii.md,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 400 }}>
            {activeTab === 'manual' ? 'Manual Adjustments' :
             activeTab === 'automatic' ? 'Automatic Adjustments' :
             'All Stock Adjustments'}
          </h3>
        </div>
        
        {/* Select All Header */}
        {getFilteredAdjustments().length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px',
            borderBottom: `1px solid ${colors.border}`,
            background: colors.background,
            gap: '12px'
          }}>
            <input
              type="checkbox"
              checked={selectedAdjustments.length === getFilteredAdjustments().length && getFilteredAdjustments().length > 0}
              onChange={toggleSelectAll}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>
              Select All ({getFilteredAdjustments().length})
            </span>
            {selectedAdjustments.length > 0 && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: colors.muted }}>
                  {selectedAdjustments.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  style={{
                    padding: '6px 12px',
                    background: colors.danger,
                    color: 'white',
                    border: 'none',
                    borderRadius: radii.sm,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Grid Layout */}
        <div style={{
          display: 'grid',
          gap: '1px',
          background: colors.border
        }}>
          {getFilteredAdjustments().map(adj => (
            <div
              key={adj._id}
              style={{
                background: selectedAdjustments.includes(adj._id) ? colors.primary + '08' : 'white',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: '40px 1fr auto',
                gap: '16px',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                ':hover': {
                  background: colors.background
                }
              }}
              onClick={() => toggleAdjustmentSelection(adj._id)}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedAdjustments.includes(adj._id)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleAdjustmentSelection(adj._id);
                }}
                style={{ cursor: 'pointer' }}
              />
              
              {/* Main Content */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 150px', gap: '16px', alignItems: 'center' }}>
                {/* Product Info */}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                    {adj.product?.name}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.muted }}>
                    SKU: {adj.product?.sku}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.muted, marginTop: '2px' }}>
                    {adj.reason}
                  </div>
                </div>
                
                {/* Type Badge */}
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    borderRadius: radii.sm,
                    fontSize: '12px',
                    fontWeight: 600,
                    background: adj.isAutomatic ? colors.success + '20' : colors.primary + '20',
                    color: adj.isAutomatic ? colors.success : colors.primary
                  }}>
                    {adj.type.toUpperCase()}
                    {adj.isAutomatic && (
                      <span style={{
                        fontSize: '10px',
                        background: colors.success,
                        color: 'white',
                        padding: '1px 4px',
                        borderRadius: '2px'
                      }}>
                        AUTO
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Stock Change */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: adj.adjustmentQuantity >= 0 ? colors.success : colors.danger
                  }}>
                    {adj.adjustmentQuantity >= 0 ? '+' : ''}{adj.adjustmentQuantity}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.muted }}>
                    {adj.previousStock} → {adj.newStock}
                  </div>
                </div>
                
                {/* Date */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: colors.muted }}>
                    {new Date(adj.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.muted }}>
                    {new Date(adj.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {!adj.isAutomatic && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAdjustment(adj);
                      }}
                      style={{
                        background: colors.primary,
                        color: 'white',
                        border: 'none',
                        padding: '6px 8px',
                        borderRadius: radii.sm,
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Edit adjustment"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAdjustment(adj._id);
                      }}
                      style={{
                        background: colors.danger,
                        color: 'white',
                        border: 'none',
                        padding: '6px 8px',
                        borderRadius: radii.sm,
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Delete adjustment"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adjustment Form Modal */}
      {showAdjustForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: radii.lg,
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 700 }}>
              {editingAdjustment ? 'Edit Stock Adjustment' : 'Manual Stock Adjustment'}
            </h2>
            
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: radii.md,
              padding: '12px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <strong>How it works:</strong><br/>
              • <strong>Physical Count:</strong> Enter the actual quantity you counted<br/>
              • <strong>Damage/Loss/Expired:</strong> Enter how many items to subtract<br/>
              • <strong>Found/Returned:</strong> Enter how many items to add
            </div>

            {error && (
              <div style={{
                background: colors.danger + '20',
                color: colors.danger,
                padding: '12px',
                borderRadius: radii.md,
                marginBottom: '16px',
                border: `1px solid ${colors.danger}30`
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitAdjustment}>
              {/* Product Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>
                  Product *
                </label>
                <select
                  value={adjustmentForm.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: radii.md,
                    fontSize: '14px'
                  }}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} (Current: {product.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current vs Actual Quantity */}
              {selectedProduct && (
                <div style={{
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: radii.md,
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: colors.muted, marginBottom: '4px' }}>SYSTEM QUANTITY</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: colors.text }}>{selectedProduct.stock}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: colors.muted, marginBottom: '4px' }}>
                        {adjustmentForm.type === 'adjustment' ? 'ACTUAL QUANTITY' : 
                         adjustmentForm.type === 'damage' || adjustmentForm.type === 'loss' || adjustmentForm.type === 'expired' ? 'QUANTITY TO SUBTRACT' :
                         'QUANTITY TO ADD'}
                      </div>
                      <input
                        type="number"
                        value={adjustmentForm.actualQuantity}
                        onChange={(e) => setAdjustmentForm(prev => ({ ...prev, actualQuantity: parseInt(e.target.value) || 0 }))}
                        style={{
                          width: '80px',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: radii.sm,
                          textAlign: 'center',
                          fontSize: '16px',
                          fontWeight: 700
                        }}
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: colors.muted, marginBottom: '4px' }}>NEW STOCK</div>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 700,
                        color: colors.text
                      }}>
                        {adjustmentForm.type === 'adjustment' ? adjustmentForm.actualQuantity :
                         adjustmentForm.type === 'damage' || adjustmentForm.type === 'loss' || adjustmentForm.type === 'expired' ? 
                         Math.max(0, selectedProduct.stock - adjustmentForm.actualQuantity) :
                         selectedProduct.stock + adjustmentForm.actualQuantity}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Adjustment Type */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>
                  Adjustment Type *
                </label>
                <select
                  value={adjustmentForm.type}
                  onChange={(e) => {
                    setAdjustmentForm(prev => ({ ...prev, type: e.target.value }));
                    // Reset quantity when type changes
                    if (e.target.value !== 'adjustment' && selectedProduct) {
                      setAdjustmentForm(prev => ({ ...prev, actualQuantity: 0 }));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: radii.md,
                    fontSize: '14px'
                  }}
                  required
                >
                  <option value="adjustment">Physical Count (Enter final correct quantity)</option>
                  <option value="damage">Damaged Items (Enter quantity to subtract)</option>
                  <option value="loss">Lost Items (Enter quantity to subtract)</option>
                  <option value="expired">Expired Items (Enter quantity to subtract)</option>
                  <option value="found">Found Items (Enter quantity to add)</option>
                  <option value="returned">Returned Items (Enter quantity to add)</option>
                </select>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>
                  Reason *
                </label>
                <input
                  type="text"
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: radii.md,
                    fontSize: '14px'
                  }}
                  placeholder="Brief reason for this adjustment"
                  required
                />
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>
                  Additional Notes
                </label>
                <textarea
                  value={adjustmentForm.notes}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, notes: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: radii.md,
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                  placeholder="Optional details about the adjustment..."
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustForm(false);
                    setSelectedProduct(null);
                    setEditingAdjustment(null);
                    setAdjustmentForm({ productId: '', actualQuantity: 0, reason: '', notes: '', type: 'adjustment' });
                    setError(null);
                  }}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    borderRadius: radii.md,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 16px',
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: radii.md,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  {editingAdjustment ? 'Update Adjustment' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAdjustmentsPage;