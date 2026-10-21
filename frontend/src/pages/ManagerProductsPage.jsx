import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Minus, Edit3, AlertTriangle } from 'lucide-react';
import { colors, fonts, radii, shadows } from '../styles/theme';
import { tokenUtils } from '../utils/tokenUtils';

const ManagerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockUpdate, setStockUpdate] = useState({ quantity: 0, source: '', sourceType: 'purchase_order', reason: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/products?limit=1000', {
        headers: tokenUtils.getAuthHeaders()
      });
      const data = await response.json();
      const products = data.data?.items || data.items || [];
      setProducts(products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = stockFilter === 'all' ||
                         (stockFilter === 'low' && product.stock <= product.lowStockThreshold) ||
                         (stockFilter === 'out' && product.stock === 0) ||
                         (stockFilter === 'normal' && product.stock > product.lowStockThreshold);
    
    return matchesSearch && matchesFilter;
  });

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockUpdate({ quantity: 0, source: '', sourceType: 'purchase_order', reason: '' });
    setShowStockModal(true);
  };

  const handleStockUpdate = async () => {
    if (!selectedProduct || !stockUpdate.reason || !stockUpdate.source || stockUpdate.quantity <= 0) return;

    try {
      await fetch('http://localhost:3000/api/stock-adjustments', {
        method: 'POST',
        headers: tokenUtils.getAuthHeaders(true),
        body: JSON.stringify({
          productId: selectedProduct._id,
          quantity: selectedProduct.stock + stockUpdate.quantity,
          type: 'stock_in',
          reason: stockUpdate.reason,
          notes: `Stock In: +${stockUpdate.quantity} from ${stockUpdate.source} (${stockUpdate.sourceType})`
        })
      });
      
      setShowStockModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Error processing stock in:', error);
    }
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) return { label: 'Out of Stock', color: 'danger' };
    if (product.stock <= product.lowStockThreshold) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  if (loading) return <div className="loading-spinner">Loading products...</div>;

  return (
    <div style={{ padding: '24px', fontFamily: fonts.main }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Package size={24} color={colors.primary} />
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, fontFamily: fonts.heading }}>Stock In</h1>
        </div>
        <p style={{ margin: 0, color: colors.muted, fontSize: '14px' }}>Receive inventory from suppliers, returns, and transfers</p>
      </div>

      {/* Filters */}
      <div style={{ 
        background: colors.surface, 
        padding: '20px', 
        borderRadius: radii.md, 
        boxShadow: shadows.card, 
        border: `1px solid ${colors.border}`,
        marginBottom: '24px' 
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.muted }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                borderRadius: radii.md,
                border: `1px solid ${colors.border}`,
                fontSize: '14px'
              }}
            />
          </div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: radii.md,
              border: `1px solid ${colors.border}`,
              fontSize: '14px'
            }}
          >
            <option value="all">All Products</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="normal">Normal Stock</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredProducts.map(product => {
          const status = getStockStatus(product);
          return (
            <div key={product._id} style={{
              background: colors.surface,
              padding: '20px',
              borderRadius: radii.md,
              boxShadow: shadows.card,
              border: `1px solid ${colors.border}`,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '16px', alignItems: 'center' }}>
                {/* Product Image */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: radii.md,
                  background: colors.background,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${colors.border}`
                }}>
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: radii.md }}
                    />
                  ) : (
                    <Package size={32} color={colors.muted} />
                  )}
                </div>

                {/* Product Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{product.name}</h3>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: radii.sm,
                      fontSize: '12px',
                      fontWeight: 600,
                      background: status.color === 'success' ? colors.success + '20' :
                                 status.color === 'warning' ? colors.warning + '20' :
                                 colors.danger + '20',
                      color: status.color === 'success' ? colors.success :
                             status.color === 'warning' ? colors.warning :
                             colors.danger
                    }}>{status.label}</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', fontSize: '14px', color: colors.muted }}>
                    <div><strong>SKU:</strong> {product.sku}</div>
                    <div><strong>Current Stock:</strong> {product.stock}</div>
                    <div><strong>Low Stock Alert:</strong> {product.lowStockThreshold}</div>
                    <div><strong>Category:</strong> {product.category?.name || 'N/A'}</div>
                  </div>

                  {product.stock <= product.lowStockThreshold && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: colors.warning + '20',
                      borderRadius: radii.sm,
                      fontSize: '12px',
                      color: colors.warning
                    }}>
                      <AlertTriangle size={16} />
                      Stock level is below threshold
                    </div>
                  )}
                </div>

                {/* Stock Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: product.stock === 0 ? colors.danger : 
                           product.stock <= product.lowStockThreshold ? colors.warning : colors.success
                  }}>
                    {product.stock}
                  </div>
                  
                  <button
                    onClick={() => openStockModal(product)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: colors.primary,
                      color: colors.surface,
                      border: 'none',
                      borderRadius: radii.sm,
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Edit3 size={14} />
                    Stock In
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{
          background: colors.surface,
          padding: '48px',
          borderRadius: radii.md,
          boxShadow: shadows.card,
          border: `1px solid ${colors.border}`,
          textAlign: 'center'
        }}>
          <Package size={48} color={colors.muted} style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: colors.muted, margin: '0 0 8px 0' }}>No products found</h3>
          <p style={{ color: colors.muted, margin: 0 }}>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Stock Update Modal */}
      {showStockModal && selectedProduct && (
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
          zIndex: 1000
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            margin: '20px',
            background: colors.surface,
            padding: '24px',
            borderRadius: radii.md,
            boxShadow: shadows.card,
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>
              Stock In: {selectedProduct.name}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
                textAlign: 'center',
                padding: '16px',
                background: colors.background,
                borderRadius: radii.md
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: colors.muted, marginBottom: '4px' }}>CURRENT</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{selectedProduct.stock}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: colors.muted, marginBottom: '4px' }}>RECEIVING</div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 700,
                    color: colors.success
                  }}>
                    +{stockUpdate.quantity}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: colors.muted, marginBottom: '4px' }}>NEW TOTAL</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>
                    {selectedProduct.stock + stockUpdate.quantity}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Quantity Received *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setStockUpdate(prev => ({ ...prev, quantity: Math.max(0, prev.quantity - 1) }))}
                  style={{
                    padding: '8px',
                    border: `1px solid ${colors.border}`,
                    background: colors.surface,
                    borderRadius: radii.sm,
                    cursor: 'pointer'
                  }}
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  value={stockUpdate.quantity}
                  onChange={(e) => setStockUpdate(prev => ({ ...prev, quantity: Math.max(0, parseInt(e.target.value) || 0) }))}
                  min="0"
                  style={{
                    textAlign: 'center',
                    flex: 1,
                    padding: '8px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: radii.sm
                  }}
                />
                <button
                  onClick={() => setStockUpdate(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                  style={{
                    padding: '8px',
                    border: `1px solid ${colors.border}`,
                    background: colors.surface,
                    borderRadius: radii.sm,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Source Type *
              </label>
              <select
                value={stockUpdate.sourceType}
                onChange={(e) => setStockUpdate(prev => ({ ...prev, sourceType: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: radii.md,
                  fontSize: '14px'
                }}
              >
                <option value="purchase_order">Purchase Order</option>
                <option value="return">Customer Return</option>
                <option value="transfer">Transfer In</option>
                <option value="found">Found Items</option>
                <option value="correction">Stock Correction</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Source Reference *
              </label>
              <input
                type="text"
                placeholder="e.g., PO-2024-001, RET-123, etc."
                value={stockUpdate.source}
                onChange={(e) => setStockUpdate(prev => ({ ...prev, source: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: radii.md,
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Reason *
              </label>
              <input
                type="text"
                placeholder="e.g., New delivery, Customer return processed, etc."
                value={stockUpdate.reason}
                onChange={(e) => setStockUpdate(prev => ({ ...prev, reason: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: radii.md,
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowStockModal(false)}
                style={{
                  padding: '10px 16px',
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  borderRadius: radii.md,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleStockUpdate}
                disabled={!stockUpdate.reason || !stockUpdate.source || stockUpdate.quantity <= 0}
                style={{
                  padding: '10px 16px',
                  background: colors.primary,
                  color: colors.surface,
                  border: 'none',
                  borderRadius: radii.md,
                  cursor: 'pointer',
                  opacity: (!stockUpdate.reason || !stockUpdate.source || stockUpdate.quantity <= 0) ? 0.5 : 1
                }}
              >
                Receive Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerProductsPage;