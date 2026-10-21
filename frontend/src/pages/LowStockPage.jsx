import React, { useEffect, useState } from 'react';
import { colors, fonts, fontSizes, radii, shadows } from '../styles/theme';
import { fetchProducts } from '../api/products';

const LowStockPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('quantity');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const LOW_STOCK_THRESHOLD = 5;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts(1, 1000);
      const items = res?.data?.items || res?.data || res || [];
      const lowStockItems = items.filter(p => (Number(p.quantity) || 0) <= LOW_STOCK_THRESHOLD);
      setProducts(lowStockItems);
    } catch (err) {
      setError(err.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { text: 'OUT OF STOCK', color: colors.danger, priority: 3 };
    if (quantity <= 2) return { text: 'CRITICAL', color: colors.danger, priority: 2 };
    if (quantity <= LOW_STOCK_THRESHOLD) return { text: 'LOW STOCK', color: colors.warning, priority: 1 };
    return { text: 'IN STOCK', color: colors.success, priority: 0 };
  };

  const filteredProducts = products.filter(p => {
    if (!debouncedSearch) return true;
    const s = debouncedSearch.toLowerCase();
    return (p.name && p.name.toLowerCase().includes(s)) || 
           (p.sku && p.sku.toLowerCase().includes(s)) ||
           (p.category?.name && p.category.name.toLowerCase().includes(s));
  }).sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
      case 'quantity': aVal = a.quantity || 0; bVal = b.quantity || 0; break;
      case 'price': aVal = a.price || 0; bVal = b.price || 0; break;
      case 'priority': 
        aVal = getStockStatus(a.quantity).priority; 
        bVal = getStockStatus(b.quantity).priority; 
        break;
      default: aVal = a.quantity || 0; bVal = b.quantity || 0;
    }
    
    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Analytics calculations
  const analytics = {
    total: products.length,
    outOfStock: products.filter(p => p.quantity === 0).length,
    critical: products.filter(p => p.quantity > 0 && p.quantity <= 2).length,
    lowStock: products.filter(p => p.quantity > 2 && p.quantity <= LOW_STOCK_THRESHOLD).length,
    totalValue: products.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0)
  };

  return (
    <div className="low-stock-page" style={{ 
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
        <div>
          <h1 style={{ 
            margin: 0, 
            fontWeight: 800, 
            fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
            color: colors.text, 
            letterSpacing: '-0.5px', 
            fontFamily: fonts.heading 
          }}>Low Stock Alert</h1>
          <p style={{ 
            color: colors.muted, 
            marginTop: 6, 
            fontSize: 'clamp(0.9rem, 2vw, 1rem)' 
          }}>Products with quantity ≤ {LOW_STOCK_THRESHOLD} units</p>
        </div>
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
            onClick={load} 
            style={{ 
              padding: '8px 16px', 
              borderRadius: radii.md, 
              background: colors.primary, 
              color: colors.surface, 
              border: 'none', 
              fontWeight: 600,
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
            }}
          >Refresh</button>
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
              }}>⚠️ Stock Alert Analytics</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                gap: 'clamp(8px, 2vw, 16px)' 
              }}>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.primary }}>{analytics.total}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Total Items</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.danger }}>{analytics.outOfStock}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Out of Stock</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.danger }}>{analytics.critical}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Critical (≤2)</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.warning }}>{analytics.lowStock}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Low Stock</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.success }}>${analytics.totalValue.toFixed(0)}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Total Value</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: colors.surface, padding: 'clamp(16px, 3vw, 24px)', borderRadius: radii.md, boxShadow: shadows.card, border: `1px solid ${colors.border}` }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Loading products...</div>
            ) : error ? (
              <div style={{ 
                color: colors.danger, 
                padding: 20, 
                textAlign: 'center',
                background: colors.danger + '10',
                borderRadius: radii.md,
                border: `1px solid ${colors.danger}30`,
                fontSize: 'clamp(0.9rem, 2vw, 1rem)'
              }}>{error}</div>
            ) : products.length === 0 ? (
              <div style={{ 
                padding: 'clamp(20px, 4vw, 40px)', 
                textAlign: 'center', 
                background: colors.success + '10',
                borderRadius: radii.md,
                border: `1px solid ${colors.success}30`
              }}>
                <div style={{ 
                  fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', 
                  fontWeight: 700, 
                  marginBottom: 8, 
                  color: colors.success 
                }}>✅ All Good!</div>
                <div style={{ 
                  color: colors.muted, 
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)' 
                }}>No products are running low on stock.</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', color: colors.text, fontFamily: fonts.heading }}>
                      {filteredProducts.length} products need attention
                    </h2>
                    <div style={{ 
                      display: 'flex', 
                      gap: 'clamp(8px, 2vw, 12px)', 
                      fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ color: colors.danger, display: 'flex', alignItems: 'center', gap: '4px' }}>● Critical (0-2)</span>
                      <span style={{ color: colors.warning, display: 'flex', alignItems: 'center', gap: '4px' }}>● Low (3-{LOW_STOCK_THRESHOLD})</span>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
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
                    <select 
                      value={`${sortBy}-${sortOrder}`} 
                      onChange={(e) => { 
                        const [sort, order] = e.target.value.split('-'); 
                        setSortBy(sort); 
                        setSortOrder(order); 
                      }} 
                      style={{ 
                        width: '100%', 
                        padding: 'clamp(8px, 2vw, 12px)', 
                        borderRadius: radii.md, 
                        border: `1px solid ${colors.border}`, 
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                        boxSizing: 'border-box' 
                      }}
                    >
                      <option value="priority-desc">Priority (Critical First)</option>
                      <option value="quantity-asc">Stock Low-High</option>
                      <option value="quantity-desc">Stock High-Low</option>
                      <option value="name-asc">Name A-Z</option>
                      <option value="name-desc">Name Z-A</option>
                      <option value="price-desc">Price High-Low</option>
                      <option value="price-asc">Price Low-High</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${colors.border}`, textAlign: 'left', background: colors.background }}>
                          <th style={{ padding: 'clamp(8px, 2vw, 12px)', fontWeight: 700, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: colors.muted }}>Product</th>
                          <th style={{ padding: 'clamp(8px, 2vw, 12px)', fontWeight: 700, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: colors.muted }}>SKU</th>
                          <th style={{ padding: 'clamp(8px, 2vw, 12px)', fontWeight: 700, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: colors.muted }}>Category</th>
                          <th style={{ padding: 'clamp(8px, 2vw, 12px)', fontWeight: 700, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: colors.muted }}>Stock</th>
                          <th style={{ padding: 'clamp(8px, 2vw, 12px)', fontWeight: 700, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: colors.muted }}>Status</th>
                          <th style={{ padding: 'clamp(8px, 2vw, 12px)', fontWeight: 700, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: colors.muted }}>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(product => {
                          const status = getStockStatus(product.quantity);
                          return (
                            <tr key={product._id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                              <td style={{ padding: 'clamp(8px, 2vw, 12px)' }}>
                                <div style={{ fontWeight: 600, fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{product.name}</div>
                                {product.description && (
                                  <div style={{ 
                                    fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', 
                                    color: colors.muted, 
                                    marginTop: 2,
                                    wordBreak: 'break-word'
                                  }}>{product.description}</div>
                                )}
                              </td>
                              <td style={{ padding: 'clamp(8px, 2vw, 12px)', color: colors.muted }}>{product.sku || '—'}</td>
                              <td style={{ padding: 'clamp(8px, 2vw, 12px)', color: colors.muted }}>{product.category?.name || '—'}</td>
                              <td style={{ padding: 'clamp(8px, 2vw, 12px)' }}>
                                <span style={{ 
                                  fontWeight: 700, 
                                  fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                  color: status.color
                                }}>{product.quantity || 0}</span>
                              </td>
                              <td style={{ padding: 'clamp(8px, 2vw, 12px)' }}>
                                <span style={{ 
                                  background: status.color + '20', 
                                  color: status.color, 
                                  padding: '4px 8px', 
                                  borderRadius: radii.sm, 
                                  fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', 
                                  fontWeight: 600,
                                  border: `1px solid ${status.color}30`
                                }}>
                                  {status.text}
                                </span>
                              </td>
                              <td style={{ padding: 'clamp(8px, 2vw, 12px)', fontWeight: 600 }}>${product.price?.toFixed(2) || '0.00'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LowStockPage;