import React, { useEffect, useState } from 'react';
import { colors, fonts, fontSizes, radii, shadows } from '../styles/theme';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../api/products';
import { fetchCategories } from '../api/categories';
import { fetchSuppliers } from '../api/suppliers';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Form state
  const [formVisible, setFormVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [category, setCategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts(1, 200);
      const items = res?.data?.items || res?.items || [];
      setProducts(items);

      const catRes = await fetchCategories(1, 500);
      setCategories(catRes?.data?.items || []);

      const supRes = await fetchSuppliers();
      setSuppliers(supRes?.data || supRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
    
    // Listen for stock updates from other pages
    const handleStockUpdate = () => {
      console.log('Stock updated - refreshing products...');
      load();
    };
    
    window.addEventListener('stockUpdated', handleStockUpdate);
    
    return () => {
      window.removeEventListener('stockUpdated', handleStockUpdate);
    };
  }, []);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const resetForm = () => {
    setEditId(null);
    setName('');
    setSku('');
    setDescription('');
    setPrice(0);
    setQuantity(0);
    setCategory('');
    setSupplier('');
    setImageUrl('');
  };

  const openForEdit = (p) => {
    setEditId(p._id);
    setName(p.name || '');
    setSku(p.sku || '');
    setDescription(p.description || '');
    setPrice(p.price || 0);
    setQuantity(p.stock || p.quantity || 0);
    setCategory(p.category?._id || p.category || '');
    setSupplier(p.supplier?._id || p.supplier || '');
    setImageUrl((p.images && p.images[0]) || '');
    setFormVisible(true);
  };

  const handleSave = async (e) => {
    e && e.preventDefault();
    setError(null);
    
    // Validation constraints
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (name.length < 2) {
      setError('Product name must be at least 2 characters');
      return;
    }
    if (Number(price) < 0) {
      setError('Price cannot be negative');
      return;
    }
    if (Number(quantity) < 0) {
      setError('Quantity cannot be negative');
      return;
    }
    if (sku && sku.length < 3) {
      setError('SKU must be at least 3 characters if provided');
      return;
    }
    
    setActionLoading(true);
    try {
      const payload = { 
        name: name.trim(), 
        sku: sku.trim() || undefined, 
        description: description.trim(), 
        price: Number(price), 
        stock: Number(quantity), 
        category: category || undefined, 
        supplier: supplier || undefined, 
        images: imageUrl ? [imageUrl] : [] 
      };
      
      if (editId) {
        const res = await updateProduct(editId, payload);
        const updated = res?.data || res;
        setProducts((prev) => prev.map((it) => (it._id === editId ? updated : it)));
      } else {
        const res = await createProduct(payload);
        const created = res?.data || res;
        setProducts((prev) => [created, ...prev]);
      }
      resetForm();
      setFormVisible(false);
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    setActionLoading(true);
    setError(null);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setSelectedProducts(prev => prev.filter(pid => pid !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.length === 0) return;
    
    if (bulkAction === 'delete') {
      if (!confirm(`Delete ${selectedProducts.length} selected products?`)) return;
      setActionLoading(true);
      try {
        for (const id of selectedProducts) {
          await deleteProduct(id);
        }
        setProducts(prev => prev.filter(p => !selectedProducts.includes(p._id)));
        setSelectedProducts([]);
      } catch (err) {
        setError(err.message || 'Failed to delete products');
      } finally {
        setActionLoading(false);
      }
    }
    setBulkAction('');
  };
  
  const toggleProductSelection = (id) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };
  
  const toggleSelectAll = () => {
    setSelectedProducts(prev => 
      prev.length === filtered.length ? [] : filtered.map(p => p._id)
    );
  };

  const filtered = products.filter((p) => {
    // Search filter
    if (debounced) {
      const s = debounced.toLowerCase();
      const matchesSearch = (p.name && p.name.toLowerCase().includes(s)) || 
                           (p.sku && p.sku.toLowerCase().includes(s)) || 
                           (p.description && p.description.toLowerCase().includes(s));
      if (!matchesSearch) return false;
    }
    
    // Category filter
    if (categoryFilter && p.category?._id !== categoryFilter) return false;
    
    // Supplier filter
    if (supplierFilter && p.supplier?._id !== supplierFilter) return false;
    
    // Stock filter
    const stock = p.stock || p.quantity || 0;
    if (stockFilter === 'out' && stock > 0) return false;
    if (stockFilter === 'low' && (stock === 0 || stock > 5)) return false;
    if (stockFilter === 'in' && stock <= 5) return false;
    
    return true;
  }).sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
      case 'price': aVal = a.price || 0; bVal = b.price || 0; break;
      case 'quantity': aVal = a.stock || a.quantity || 0; bVal = b.stock || b.quantity || 0; break;
      case 'created': aVal = new Date(a.createdAt); bVal = new Date(b.createdAt); break;
      default: aVal = a.name || ''; bVal = b.name || '';
    }
    
    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });
  
  // Analytics calculations
  const analytics = {
    total: products.length,
    outOfStock: products.filter(p => (p.stock || p.quantity || 0) === 0).length,
    lowStock: products.filter(p => {
      const stock = p.stock || p.quantity || 0;
      return stock > 0 && stock <= 5;
    }).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * (p.stock || p.quantity || 0)), 0),
    avgPrice: products.length ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0
  };

  return (
    <div className="products-page" style={{ 
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
        }}>Products Dashboard</h1>
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
              }}>📊 Product Analytics</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
                gap: 'clamp(8px, 2vw, 16px)' 
              }}>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '12px 8px', 
                  background: colors.background, 
                  borderRadius: radii.sm 
                }}>
                  <div style={{ 
                    fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', 
                    fontWeight: 800, 
                    color: colors.primary 
                  }}>{analytics.total}</div>
                  <div style={{ 
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', 
                    color: colors.muted,
                    marginTop: '4px'
                  }}>Total Products</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.danger }}>{analytics.outOfStock}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Out of Stock</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.warning }}>{analytics.lowStock}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Low Stock</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.success }}>${analytics.totalValue.toFixed(0)}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Total Value</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.text }}>${analytics.avgPrice.toFixed(2)}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Avg Price</div>
                </div>
              </div>
            </div>
          )}
          
          <div style={{ background: colors.surface, padding: 'clamp(16px, 3vw, 24px)', borderRadius: radii.md, boxShadow: shadows.card, border: `1px solid ${colors.border}` }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', color: colors.text, fontFamily: fonts.heading }}>Products ({filtered.length})</h2>
                <button onClick={() => { setFormVisible(true); resetForm(); }} style={{ padding: '10px 14px', borderRadius: radii.md, background: colors.primary, color: colors.surface, border: 'none', fontWeight: 700, boxShadow: shadows.soft, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>+ Add Product</button>
              </div>
              
              {/* Advanced Filters */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: 'clamp(8px, 2vw, 12px)', 
                marginBottom: 16
              }}>
                <input 
                  placeholder="Search products..." 
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
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }}>
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }}>
                  <option value="">All Suppliers</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }}>
                  <option value="">All Stock Levels</option>
                  <option value="out">Out of Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="in">In Stock</option>
                </select>
                <select value={`${sortBy}-${sortOrder}`} onChange={(e) => { const [sort, order] = e.target.value.split('-'); setSortBy(sort); setSortOrder(order); }} style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }}>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="price-asc">Price Low-High</option>
                  <option value="price-desc">Price High-Low</option>
                  <option value="quantity-asc">Stock Low-High</option>
                  <option value="quantity-desc">Stock High-Low</option>
                  <option value="created-desc">Newest First</option>
                </select>
              </div>
              
              {/* Bulk Actions */}
              {selectedProducts.length > 0 && (
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
                  <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', fontWeight: 600 }}>{selectedProducts.length} selected</span>
                  <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} style={{ padding: 6, borderRadius: radii.sm, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}>
                    <option value="">Bulk Actions</option>
                    <option value="delete">Delete Selected</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} style={{ padding: '6px 10px', borderRadius: radii.sm, background: colors.danger, color: colors.surface, border: 'none', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, opacity: bulkAction ? 1 : 0.5 }}>Apply</button>
                  <button onClick={() => setSelectedProducts([])} style={{ padding: '6px 10px', borderRadius: radii.sm, background: colors.border, border: 'none', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}>Clear</button>
                </div>
              )}
            </div>

            {loading ? <div style={{ padding: 20, textAlign: 'center', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Loading...</div> : (
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
                      checked={selectedProducts.length === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      style={{ marginRight: 12 }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Select All ({filtered.length})</span>
                  </div>
                )}
                
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {filtered.map((p) => (
                    <li key={p._id} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr auto', 
                      gap: 'clamp(8px, 2vw, 16px)',
                      padding: 'clamp(12px, 2.5vw, 20px)', 
                      borderBottom: `1px solid ${colors.border}`, 
                      alignItems: 'center', 
                      background: selectedProducts.includes(p._id) ? colors.primary + '10' : 'transparent'
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
                        checked={selectedProducts.includes(p._id)}
                        onChange={() => toggleProductSelection(p._id)}
                      />
                      <div style={{ 
                        width: 'clamp(40px, 8vw, 56px)', 
                        height: 'clamp(40px, 8vw, 56px)', 
                        background: colors.surfaceAlt || colors.surface, 
                        borderRadius: radii.sm, 
                        overflow: 'hidden', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        border: `1px solid ${colors.border}`,
                        flexShrink: 0
                      }}>
                        {p.images && p.images.length > 0 && p.images[0] ? 
                          <img 
                            src={p.images[0]} 
                            alt={p.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            onError={(e) => {
                              if (e.target) {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'block';
                                }
                              }
                            }}
                          /> : 
                          <div style={{ color: colors.muted, fontSize: 10 }}>📦</div>
                        }
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ 
                          fontWeight: 700, 
                          fontSize: 'clamp(0.9rem, 2.2vw, 1.1rem)',
                          wordBreak: 'break-word'
                        }}>{p.name} <span style={{ 
                          color: colors.muted, 
                          fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' 
                        }}>({p.sku})</span></div>
                        <div style={{ 
                          color: colors.muted, 
                          fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                          marginTop: '4px',
                          wordBreak: 'break-word'
                        }}>{p.description}</div>
                        <div style={{ 
                          marginTop: 8, 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 'clamp(6px, 1.5vw, 12px)',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{ 
                            fontWeight: 600, 
                            fontSize: 'clamp(0.9rem, 2vw, 1rem)' 
                          }}>${p.price}</span>
                          <span style={{ 
                            background: (p.stock || p.quantity || 0) === 0 ? colors.danger : (p.stock || p.quantity || 0) <= 5 ? colors.warning : colors.success, 
                            color: colors.surface, 
                            padding: '2px 8px', 
                            borderRadius: radii.sm, 
                            fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', 
                            fontWeight: 600 
                          }}>
                            {(p.stock || p.quantity || 0) === 0 ? 'OUT OF STOCK' : (p.stock || p.quantity || 0) <= 5 ? `LOW: ${p.stock || p.quantity || 0}` : `${p.stock || p.quantity || 0} in stock`}
                          </span>
                          {p.category && <span style={{ color: colors.muted, fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)' }}>{p.category.name}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      gap: 'clamp(6px, 1.5vw, 12px)', 
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end'
                    }}>
                      <div style={{ color: colors.muted, fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)' }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                      <button 
                        onClick={() => openForEdit(p)} 
                        style={{ 
                          padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)', 
                          borderRadius: radii.sm, 
                          background: colors.secondary, 
                          color: colors.surface, 
                          border: 'none', 
                          fontWeight: 700, 
                          boxShadow: shadows.soft, 
                          fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                          whiteSpace: 'nowrap'
                        }}>Edit</button>
                      <button 
                        disabled={actionLoading} 
                        onClick={() => handleDelete(p._id)} 
                        style={{ 
                          padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)', 
                          borderRadius: radii.sm, 
                          background: colors.danger, 
                          color: colors.surface, 
                          border: 'none', 
                          fontWeight: 700, 
                          opacity: actionLoading ? 0.6 : 1, 
                          fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                          whiteSpace: 'nowrap'
                        }}>Delete</button>
                    </div>
                  </li>
                  ))}
                </ul>
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

        {/* Form Panel */}
        {formVisible && (
          <div style={{ 
            position: 'fixed',
            top: 0,
            right: 0,
            width: 'clamp(300px, 30vw, 400px)',
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
            }}>{editId ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 6, 
                  fontWeight: 600, 
                  fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' 
                }}>Name *</label>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  minLength={2}
                  maxLength={100}
                  placeholder="Enter product name"
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
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>SKU</label>
                <input 
                  value={sku} 
                  onChange={(e) => setSku(e.target.value.toUpperCase())} 
                  minLength={3}
                  maxLength={20}
                  placeholder="e.g., PROD001"
                  style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Description</label>
                <input value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Price ($) *</label>
                  <input 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(Math.max(0, e.target.value))} 
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Stock *</label>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))} 
                    min="0"
                    required
                    placeholder="0"
                    style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                  />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Supplier</label>
                <select value={supplier} onChange={(e) => setSupplier(e.target.value)} style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }}>
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Image URL</label>
                <input 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="https://example.com/image.jpg"
                  style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                />
                {imageUrl && (
                  <div style={{ marginTop: 8, textAlign: 'center' }}>
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: 120, 
                        borderRadius: radii.sm, 
                        border: `1px solid ${colors.border}`,
                        objectFit: 'cover'
                      }} 
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button disabled={actionLoading} type="submit" style={{ flex: 1, padding: '12px', borderRadius: radii.md, background: colors.primary, color: colors.surface, border: 'none', fontWeight: 700, boxShadow: shadows.soft, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>{actionLoading ? 'Saving...' : (editId ? 'Save' : 'Create')}</button>
                <button disabled={actionLoading} type="button" onClick={() => { setFormVisible(false); resetForm(); }} style={{ padding: '12px 16px', borderRadius: radii.md, background: colors.border, border: 'none', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;