import React, { useEffect, useState } from 'react';
import { colors, fonts, fontSizes, radii, shadows } from '../styles/theme';
import { fetchOrders, getOrder, updateOrderStatus, createOrder, deleteOrder } from '../api/orders';
import { fetchUsers } from '../api/users';
import { fetchProducts } from '../api/products';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
const MAX_USERS_DISPLAY = 200;
const MAX_PRODUCTS_DISPLAY = 500;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [detailOrder, setDetailOrder] = useState(null);

  // Create order form state
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [coUser, setCoUser] = useState('');
  const [coAddress, setCoAddress] = useState('');
  const [coItems, setCoItems] = useState([{ product: '', quantity: 1, key: Date.now() }]);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOrders();
      const items = res?.data || res || [];
      setOrders(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const ures = await fetchUsers();
        const pres = await fetchProducts(1, MAX_PRODUCTS_DISPLAY);
        setUsers((ures?.data || ures || []).slice(0, MAX_USERS_DISPLAY));
        setProducts((pres?.data?.items || pres?.data || pres || []).slice(0, MAX_PRODUCTS_DISPLAY));
      } catch (e) {
        console.error('Failed to load users/products:', e);
        setError('Failed to load users or products: ' + e.message);
      }
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const openDetails = async (id) => {
    setActionLoading(true);
    try {
      const res = await getOrder(id);
      const ord = res?.data || res;
      setDetailOrder(ord);
    } catch (err) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await updateOrderStatus(id, status);
      const updated = res?.data || res;
      setOrders((prev) => prev.map((o) => (o._id === id ? updated : o)));
      if (detailOrder && detailOrder._id === id) setDetailOrder(updated);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.length === 0) return;
    
    if (bulkAction === 'delete') {
      if (!confirm(`Delete ${selectedOrders.length} selected orders?`)) return;
      setActionLoading(true);
      try {
        for (const id of selectedOrders) {
          await deleteOrder(id);
        }
        setOrders(prev => prev.filter(o => !selectedOrders.includes(o._id)));
        setSelectedOrders([]);
      } catch (err) {
        setError(err.message || 'Failed to delete orders');
      } finally {
        setActionLoading(false);
      }
    } else if (bulkAction.startsWith('status-')) {
      const status = bulkAction.replace('status-', '');
      setActionLoading(true);
      try {
        for (const id of selectedOrders) {
          await updateOrderStatus(id, status);
        }
        setOrders(prev => prev.map(o => selectedOrders.includes(o._id) ? {...o, status} : o));
        setSelectedOrders([]);
      } catch (err) {
        setError(err.message || 'Failed to update orders');
      } finally {
        setActionLoading(false);
      }
    }
    setBulkAction('');
  };

  const toggleOrderSelection = (id) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedOrders(prev => 
      prev.length === filtered.length ? [] : filtered.map(o => o._id)
    );
  };

  const filtered = orders.filter((o) => {
    if (statusFilter && o?.status !== statusFilter) return false;
    
    if (dateFilter) {
      const orderDate = new Date(o.createdAt).toDateString();
      const filterDate = new Date(dateFilter).toDateString();
      if (orderDate !== filterDate) return false;
    }
    
    if (!debounced) return true;
    const q = debounced.toLowerCase();
    return (
      (o?.orderNumber && o.orderNumber.toString().includes(q)) ||
      (o?._id && o._id.toString().toLowerCase().includes(q)) || 
      (o?.user?.email && o.user.email.toLowerCase().includes(q)) ||
      (o?.user?.name && o.user.name.toLowerCase().includes(q)) ||
      (o?.shippingAddress && o.shippingAddress.toLowerCase().includes(q)) ||
      (o?.items && o.items.some(it => it?.product?.name && it.product.name.toLowerCase().includes(q)))
    );
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
      case 'highest': return (b.total || 0) - (a.total || 0);
      case 'lowest': return (a.total || 0) - (b.total || 0);
      case 'orderNum': return (b.orderNumber || 0) - (a.orderNumber || 0);
      default: return 0;
    }
  });

  // Analytics calculations
  const analytics = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0),
    avgOrderValue: orders.length ? orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length : 0
  };

  // helpers for create-order form
  const addItemRow = () => setCoItems(prev => [...prev, { product: '', quantity: 1, key: Date.now() + Math.random() }]);
  const removeItemRow = (key) => setCoItems(prev => prev.length > 1 ? prev.filter(i => i.key !== key) : prev);
  const changeItem = (key, field, value) => setCoItems(prev => prev.map(i => i.key === key ? { ...i, [field]: value } : i));

  const submitCreateOrder = async (e) => {
    e.preventDefault();
    setError(null);
    if (!coUser) { setError('Choose a user for the order'); return; }
    const items = coItems.filter(i => i.product && Number(i.quantity) > 0).map(i => ({ product: i.product, quantity: Number(i.quantity) }));
    if (items.length === 0) { setError('Add at least one product with quantity > 0'); return; }
    setCreating(true);
    try {
      await createOrder({ user: coUser, items, shippingAddress: coAddress });
      setCoUser('');
      setCoAddress('');
      setCoItems([{ product: '', quantity: 1, key: Date.now() }]);
      setShowCreateForm(false);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    setActionLoading(true);
    setError(null);
    try {
      await deleteOrder(id);
      setOrders(prev => prev.filter(o => o._id !== id));
      setSelectedOrders(prev => prev.filter(oid => oid !== id));
      if (detailOrder && detailOrder._id === id) setDetailOrder(null);
    } catch (err) {
      setError(err.message || 'Failed to delete order');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="orders-page" style={{ 
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
        }}>Orders Dashboard</h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowAnalytics(!showAnalytics)} 
            style={{ 
              padding: '8px 16px', 
              borderRadius: radii.md, 
              background: colors.secondary, 
              color: colors.surface, 
              border: 'none', 
              fontWeight: 600,
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
            }}
          >
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
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
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
            }}
          >
            + New Order
          </button>
        </div>
      </div>

      <div className="main-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1fr)', 
        gap: 'clamp(16px, 3vw, 24px)', 
        alignItems: 'start'
      }}>
        <div style={{ minWidth: 0, width: '100%' }}>
          {/* Analytics Panel */}
          {showAnalytics && (
            <div style={{ 
              background: colors.surface, 
              padding: 'clamp(16px, 3vw, 24px)', 
              borderRadius: radii.md, 
              boxShadow: shadows.card, 
              border: `1px solid ${colors.border}`, 
              marginBottom: 'clamp(16px, 3vw, 24px)' 
            }}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                fontWeight: 700, 
                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' 
              }}>📊 Order Analytics</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: 'clamp(8px, 2vw, 16px)' 
              }}>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.primary }}>{analytics.total}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Total Orders</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.warning }}>{analytics.pending}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Pending</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.accent }}>{analytics.processing}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Processing</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.success }}>{analytics.completed}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Completed</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.success }}>${analytics.totalRevenue.toFixed(0)}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Revenue</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.text }}>${analytics.avgOrderValue.toFixed(2)}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Avg Order</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: colors.surface, padding: 'clamp(16px, 3vw, 24px)', borderRadius: radii.md, boxShadow: shadows.card, border: `1px solid ${colors.border}` }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', color: colors.text, fontFamily: fonts.heading }}>Orders ({filtered.length})</h2>
                <div style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', color: colors.muted }}>
                  Showing {filtered.length} of {orders.length} orders
                </div>
              </div>

              {/* Advanced Filters */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: 'clamp(8px, 2vw, 12px)', 
                marginBottom: 16
              }}>
                <input 
                  placeholder="Search orders..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  style={{ 
                    width: '100%',
                    padding: 'clamp(8px, 2vw, 12px)', 
                    borderRadius: radii.md, 
                    border: `1px solid ${colors.border}`,
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                    boxSizing: 'border-box'
                  }} 
                />
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)} 
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
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    borderRadius: radii.md, 
                    border: `1px solid ${colors.border}`, 
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                    boxSizing: 'border-box' 
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Amount</option>
                  <option value="lowest">Lowest Amount</option>
                  <option value="orderNum">Order Number</option>
                </select>
                <input 
                  type="date" 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)} 
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

              {/* Bulk Actions */}
              {selectedOrders.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'clamp(6px, 1.5vw, 12px)', 
                  padding: 'clamp(8px, 2vw, 12px)', 
                  background: colors.secondary + '20', 
                  borderRadius: radii.md, 
                  marginBottom: 16,
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', fontWeight: 600 }}>{selectedOrders.length} selected</span>
                  <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} style={{ padding: 6, borderRadius: radii.sm, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}>
                    <option value="">Bulk Actions</option>
                    <option value="status-processing">Mark as Processing</option>
                    <option value="status-shipped">Mark as Shipped</option>
                    <option value="status-completed">Mark as Completed</option>
                    <option value="status-cancelled">Mark as Cancelled</option>
                    <option value="delete">Delete Selected</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} style={{ padding: '6px 10px', borderRadius: radii.sm, background: colors.primary, color: colors.surface, border: 'none', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, opacity: bulkAction ? 1 : 0.5 }}>Apply</button>
                  <button onClick={() => setSelectedOrders([])} style={{ padding: '6px 10px', borderRadius: radii.sm, background: colors.border, border: 'none', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}>Clear</button>
                </div>
              )}

              {/* Filter Tags */}
              {(statusFilter || dateFilter) && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {statusFilter && <span style={{ background: colors.secondary, color: colors.surface, padding: '4px 8px', borderRadius: radii.sm, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}>Status: {statusFilter}</span>}
                  {dateFilter && <span style={{ background: colors.secondary, color: colors.surface, padding: '4px 8px', borderRadius: radii.sm, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}>Date: {new Date(dateFilter).toLocaleDateString()}</span>}
                  <button onClick={() => { setStatusFilter(''); setDateFilter(''); }} style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}>Clear Filters</button>
                </div>
              )}
            </div>

            {loading ? <div style={{ padding: 20, textAlign: 'center', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Loading orders...</div> : (
              <>
                {/* Select All Header */}
                {filtered.length > 0 && (
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
                      checked={selectedOrders.length === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      style={{ marginRight: 12 }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Select All ({filtered.length})</span>
                  </div>
                )}

                <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
                  {filtered.length === 0 ? (
                    <div style={{ 
                      padding: 'clamp(16px, 3vw, 24px)', 
                      color: colors.muted, 
                      textAlign: 'center',
                      fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                    }}>No orders found.</div>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {filtered.map(o => (
                        <li key={o._id} style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr auto', 
                          gap: 'clamp(8px, 2vw, 16px)',
                          padding: 'clamp(12px, 2.5vw, 20px)', 
                          borderBottom: `1px solid ${colors.border}`, 
                          alignItems: 'center', 
                          background: selectedOrders.includes(o._id) ? colors.primary + '10' : 
                                     o.status === 'completed' ? `${colors.success}10` : 
                                     o.status === 'cancelled' ? `${colors.danger}10` : 'transparent'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            gap: 'clamp(8px, 2vw, 16px)', 
                            alignItems: 'center',
                            minWidth: 0,
                            flex: 1
                          }}>
                            <input 
                              type="checkbox" 
                              checked={selectedOrders.includes(o._id)}
                              onChange={() => toggleOrderSelection(o._id)}
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
                              📦
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 'clamp(6px, 1.5vw, 12px)', 
                                marginBottom: 8,
                                flexWrap: 'wrap'
                              }}>
                                <div style={{ 
                                  fontWeight: 700, 
                                  fontSize: 'clamp(0.9rem, 2.2vw, 1.1rem)' 
                                }}>Order #{o.orderNumber || o._id?.slice(-6)}</div>
                                <span style={{ 
                                  background: o.status === 'completed' ? colors.success : 
                                            o.status === 'cancelled' ? colors.danger : 
                                            o.status === 'processing' ? colors.warning : colors.secondary, 
                                  color: colors.surface, 
                                  padding: '2px 8px', 
                                  borderRadius: radii.sm, 
                                  fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', 
                                  fontWeight: 600 
                                }}>{o.status?.toUpperCase()}</span>
                              </div>
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                                gap: 'clamp(4px, 1vw, 8px)', 
                                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                                color: colors.muted 
                              }}>
                                <div><strong>Customer:</strong> {o.user ? (o.user.name || o.user.email) : 'Guest'}</div>
                                <div><strong>Items:</strong> {o.items?.length || 0}</div>
                                <div><strong>Total:</strong> ${o.total?.toFixed ? o.total.toFixed(2) : o.total}</div>
                                <div><strong>Date:</strong> {new Date(o.createdAt).toLocaleDateString()}</div>
                              </div>
                              {o.items && o.items.length > 0 && (
                                <div style={{ 
                                  marginTop: 8, 
                                  fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                                  color: colors.muted,
                                  wordBreak: 'break-word'
                                }}>
                                  <strong>Products:</strong> {o.items.map(item => item.product?.name || 'Unknown').join(', ')}
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
                          }}>
                            <select 
                              value={o.status} 
                              onChange={(e) => handleUpdateStatus(o._id, e.target.value)} 
                              style={{ 
                                padding: 'clamp(6px, 1.5vw, 10px)', 
                                borderRadius: radii.sm, 
                                border: `1px solid ${colors.border}`,
                                fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)'
                              }}
                            >
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button 
                              onClick={() => openDetails(o._id)} 
                              style={{ 
                                padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)', 
                                borderRadius: radii.sm, 
                                background: colors.secondary, 
                                color: colors.surface, 
                                border: 'none', 
                                fontWeight: 700, 
                                boxShadow: shadows.soft, 
                                fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                                whiteSpace: 'nowrap'
                              }}>Details</button>
                            <button 
                              onClick={() => handleDeleteOrder(o._id)} 
                              style={{ 
                                padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)', 
                                borderRadius: radii.sm, 
                                background: colors.danger, 
                                color: colors.surface, 
                                border: 'none', 
                                fontWeight: 700, 
                                boxShadow: shadows.soft, 
                                fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                                whiteSpace: 'nowrap'
                              }}>Delete</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}

            {error && (
              <div style={{ 
                color: colors.danger, 
                marginTop: 16, 
                padding: 'clamp(8px, 2vw, 12px)', 
                background: colors.danger + '10', 
                borderRadius: radii.md, 
                border: `1px solid ${colors.danger}30`,
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
              }}>{error}</div>
            )}
          </div>
        </div>

        {/* Create Order Form */}
        {showCreateForm && (
          <div style={{ 
            position: 'fixed',
            top: 0,
            right: 0,
            width: 'clamp(350px, 35vw, 500px)',
            height: '100vh',
            background: colors.surface,
            boxShadow: shadows.lg,
            zIndex: 1000,
            overflowY: 'auto',
            padding: 'clamp(16px, 3vw, 24px)',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ 
              marginTop: 0, 
              fontWeight: 800, 
              color: colors.text, 
              fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' 
            }}>Create New Order</h3>
            <form onSubmit={submitCreateOrder}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Customer *</label>
                <select 
                  value={coUser} 
                  onChange={(e) => setCoUser(e.target.value)} 
                  required
                  style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }}
                >
                  <option value="">Select customer</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.email || u.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Shipping Address</label>
                <input 
                  value={coAddress} 
                  onChange={(e) => setCoAddress(e.target.value)} 
                  placeholder="Enter shipping address"
                  style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Items *</label>
                {coItems.map((it) => (
                  <div key={it.key} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                    <select 
                      value={it.product} 
                      onChange={(e) => changeItem(it.key, 'product', e.target.value)} 
                      style={{ padding: 8, borderRadius: radii.sm, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}
                    >
                      <option value="">Select product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name} - ${p.price}</option>)}
                    </select>
                    <input 
                      type="number" 
                      min={1} 
                      value={it.quantity} 
                      onChange={(e) => changeItem(it.key, 'quantity', e.target.value)} 
                      style={{ width: 60, padding: 8, borderRadius: radii.sm, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => removeItemRow(it.key)} 
                      style={{ padding: '6px 8px', borderRadius: radii.sm, background: colors.danger, color: colors.surface, border: 'none', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}
                    >×</button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={addItemRow} 
                  style={{ padding: '6px 10px', borderRadius: radii.sm, background: colors.secondary, color: colors.surface, border: 'none', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}
                >+ Add Item</button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button 
                  disabled={creating} 
                  type="submit" 
                  style={{ flex: 1, padding: '12px', borderRadius: radii.md, background: colors.success, color: colors.surface, border: 'none', fontWeight: 700, boxShadow: shadows.soft, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', opacity: creating ? 0.7 : 1 }}
                >{creating ? 'Creating...' : 'Create Order'}</button>
                <button 
                  disabled={creating} 
                  type="button" 
                  onClick={() => { setShowCreateForm(false); setCoUser(''); setCoAddress(''); setCoItems([{ product: '', quantity: 1, key: Date.now() }]); }} 
                  style={{ padding: '12px 16px', borderRadius: radii.md, background: colors.border, border: 'none', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}
                >Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Order Details Modal */}
        {detailOrder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }} onClick={() => setDetailOrder(null)}>
            <div style={{ 
              width: '100%', 
              maxWidth: '800px', 
              maxHeight: '90vh', 
              overflow: 'auto', 
              background: colors.surface, 
              padding: 'clamp(16px, 3vw, 24px)', 
              borderRadius: radii.lg, 
              boxShadow: shadows.card, 
              border: `1px solid ${colors.border}` 
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ margin: 0, fontWeight: 800, color: colors.text, fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' }}>Order #{detailOrder.orderNumber || detailOrder._id?.slice(-6)}</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ color: colors.muted, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>{detailOrder.user ? (detailOrder.user.name || detailOrder.user.email) : 'Guest'}</div>
                  <select 
                    value={detailOrder.status} 
                    onChange={(e) => handleUpdateStatus(detailOrder._id, e.target.value)} 
                    style={{ padding: 10, borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button 
                    onClick={() => setDetailOrder(null)} 
                    style={{ padding: '8px 12px', borderRadius: radii.sm, background: colors.border, border: 'none', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}
                  >Close</button>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <h4 style={{ marginBottom: 8, fontSize: 'clamp(1rem, 2.2vw, 1.1rem)' }}>Items</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>
                        <th style={{ padding: 8 }}>Product</th>
                        <th style={{ padding: 8 }}>Price</th>
                        <th style={{ padding: 8 }}>Qty</th>
                        <th style={{ padding: 8 }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailOrder.items && detailOrder.items.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${colors.border}` }}>
                          <td style={{ padding: 8 }}>{it.product ? (it.product.name || it.product._id) : it.product}</td>
                          <td style={{ padding: 8 }}>${it.price?.toFixed ? it.price.toFixed(2) : it.price}</td>
                          <td style={{ padding: 8 }}>{it.quantity}</td>
                          <td style={{ padding: 8 }}>${((Number(it.price) || 0) * (Number(it.quantity) || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontWeight: 700, fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                  <div>Shipping Address</div>
                  <div>{detailOrder.shippingAddress || '—'}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontWeight: 700, fontSize: 'clamp(1rem, 2.2vw, 1.1rem)' }}>
                  <div>Total</div>
                  <div>${detailOrder.total?.toFixed ? detailOrder.total.toFixed(2) : detailOrder.total}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;