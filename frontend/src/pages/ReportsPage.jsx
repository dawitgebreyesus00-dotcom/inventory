import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Package, ShoppingCart, Download, Calendar } from 'lucide-react';
import { colors, fonts, fontSizes, radii, shadows } from '../styles/theme';
import { tokenUtils } from '../utils/tokenUtils';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('stock');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(true);

  const tabs = [
    { id: 'stock', name: 'Stock Report', icon: Package },
    { id: 'sales', name: 'Sales Report', icon: TrendingUp },
    { id: 'movements', name: 'Stock Movements', icon: BarChart3 },
    { id: 'purchase', name: 'Purchase Orders', icon: ShoppingCart }
  ];

  useEffect(() => {
    fetchReport();
  }, [activeTab, dateRange]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(dateRange);
      const response = await fetch(`/api/reports/${activeTab}?${params}`, {
        headers: tokenUtils.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch report');
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      setError(error.message || 'Failed to load report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderStockReport = () => (
    <div style={{ display: 'grid', gap: 'clamp(16px, 3vw, 24px)' }}>
      {reportData?.summary && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 'clamp(12px, 2.5vw, 16px)' 
        }}>
          <div style={{ background: colors.primary + '10', padding: 'clamp(16px, 3vw, 20px)', borderRadius: radii.md, border: `1px solid ${colors.primary}30` }}>
            <h3 style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', fontWeight: 600, color: colors.primary, margin: '0 0 8px 0' }}>Total Products</h3>
            <p style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: colors.primary, margin: 0 }}>{reportData.summary.totalProducts || 0}</p>
          </div>
          <div style={{ background: colors.success + '10', padding: 'clamp(16px, 3vw, 20px)', borderRadius: radii.md, border: `1px solid ${colors.success}30` }}>
            <h3 style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', fontWeight: 600, color: colors.success, margin: '0 0 8px 0' }}>Total Value</h3>
            <p style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: colors.success, margin: 0 }}>${reportData.summary.totalValue?.toFixed(2) || '0.00'}</p>
          </div>
          <div style={{ background: colors.warning + '10', padding: 'clamp(16px, 3vw, 20px)', borderRadius: radii.md, border: `1px solid ${colors.warning}30` }}>
            <h3 style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', fontWeight: 600, color: colors.warning, margin: '0 0 8px 0' }}>Low Stock Items</h3>
            <p style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: colors.warning, margin: 0 }}>{reportData.summary.lowStockItems || 0}</p>
          </div>
          <div style={{ background: colors.danger + '10', padding: 'clamp(16px, 3vw, 20px)', borderRadius: radii.md, border: `1px solid ${colors.danger}30` }}>
            <h3 style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', fontWeight: 600, color: colors.danger, margin: '0 0 8px 0' }}>Out of Stock</h3>
            <p style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: colors.danger, margin: 0 }}>{reportData.summary.outOfStockItems || 0}</p>
          </div>
        </div>
      )}

      <div style={{ background: colors.surface, borderRadius: radii.md, boxShadow: shadows.card, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
            <thead style={{ background: colors.background }}>
              <tr>
                <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'left', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, color: colors.muted }}>Product</th>
                <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'left', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, color: colors.muted }}>SKU</th>
                <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'left', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, color: colors.muted }}>Stock</th>
                <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'left', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, color: colors.muted }}>Value</th>
                <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'left', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, color: colors.muted }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData?.products?.map(product => (
                <tr key={product._id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)' }}>{product.name}</td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)' }}>{product.sku}</td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)' }}>{product.stock}</td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)' }}>${(product.stock * product.price).toFixed(2)}</td>
                  <td style={{ padding: 'clamp(8px, 2vw, 12px)' }}>
                    <span style={{
                      padding: '2px 8px',
                      fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)',
                      borderRadius: radii.sm,
                      fontWeight: 600,
                      background: product.stock === 0 ? colors.danger + '20' :
                                 product.stock <= 5 ? colors.warning + '20' : colors.success + '20',
                      color: product.stock === 0 ? colors.danger :
                             product.stock <= 5 ? colors.warning : colors.success
                    }}>
                      {product.stock === 0 ? 'Out of Stock' :
                       product.stock <= 5 ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSalesReport = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(16px, 3vw, 24px)' }}>
      <div style={{ background: colors.surface, padding: 'clamp(16px, 3vw, 24px)', borderRadius: radii.md, boxShadow: shadows.card }}>
        <h3 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontWeight: 700, marginBottom: 16 }}>Sales Trend</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {reportData?.salesData?.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: colors.background, borderRadius: radii.sm }}>
              <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>{item._id?.year}-{String(item._id?.month).padStart(2, '0')}-{String(item._id?.day).padStart(2, '0')}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>${item.totalRevenue?.toFixed(2)}</div>
                <div style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: colors.muted }}>{item.totalOrders} orders</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: colors.surface, padding: 'clamp(16px, 3vw, 24px)', borderRadius: radii.md, boxShadow: shadows.card }}>
        <h3 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontWeight: 700, marginBottom: 16 }}>Top Products</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {reportData?.topProducts?.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: colors.background, borderRadius: radii.sm }}>
              <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>{item.product?.name}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{item.totalQuantity} sold</div>
                <div style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', color: colors.muted }}>${item.totalRevenue?.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="reports-page" style={{ 
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
        }}>Reports & Analytics</h1>
        <button
          onClick={exportReport}
          disabled={!reportData}
          style={{ 
            background: colors.success, 
            color: colors.surface, 
            padding: '8px 16px', 
            borderRadius: radii.md, 
            border: 'none', 
            fontWeight: 600,
            fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: reportData ? 1 : 0.5
          }}
        >
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* Date Range Selector */}
      <div style={{ 
        background: colors.surface, 
        padding: 'clamp(16px, 3vw, 20px)', 
        borderRadius: radii.md, 
        boxShadow: shadows.card, 
        marginBottom: 'clamp(16px, 3vw, 24px)' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'clamp(12px, 3vw, 16px)',
          flexWrap: 'wrap'
        }}>
          <Calendar size={20} style={{ color: colors.muted }} />
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: 'clamp(12px, 3vw, 16px)',
            flex: 1
          }}>
            <div>
              <label style={{ display: 'block', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', fontWeight: 600, marginBottom: 6 }}>Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                style={{ 
                  width: '100%',
                  border: `1px solid ${colors.border}`, 
                  borderRadius: radii.md, 
                  padding: 'clamp(8px, 2vw, 10px)',
                  fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', fontWeight: 600, marginBottom: 6 }}>End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                style={{ 
                  width: '100%',
                  border: `1px solid ${colors.border}`, 
                  borderRadius: radii.md, 
                  padding: 'clamp(8px, 2vw, 10px)',
                  fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: colors.surface, borderRadius: radii.md, boxShadow: shadows.card }}>
        <div style={{ borderBottom: `1px solid ${colors.border}` }}>
          <nav style={{ 
            display: 'flex', 
            padding: '0 clamp(16px, 3vw, 24px)',
            overflowX: 'auto',
            gap: 'clamp(16px, 4vw, 32px)'
          }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: 'clamp(12px, 3vw, 16px) 0',
                    borderBottom: activeTab === tab.id ? `2px solid ${colors.primary}` : '2px solid transparent',
                    background: 'none',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: activeTab === tab.id ? colors.primary : colors.muted,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  <Icon size={18} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px',
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              color: colors.muted
            }}>
              Loading report...
            </div>
          ) : error ? (
            <div style={{ 
              color: colors.danger, 
              padding: 'clamp(16px, 3vw, 20px)', 
              background: colors.danger + '10', 
              borderRadius: radii.md, 
              border: `1px solid ${colors.danger}30`,
              textAlign: 'center',
              fontSize: 'clamp(0.9rem, 2vw, 1rem)'
            }}>
              {error}
            </div>
          ) : (
            <>
              {activeTab === 'stock' && renderStockReport()}
              {activeTab === 'sales' && renderSalesReport()}
              {activeTab === 'movements' && (
                <div style={{ background: colors.surface, borderRadius: radii.md, boxShadow: shadows.card, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                      <thead style={{ background: colors.background }}>
                        <tr>
                          <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'left', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, color: colors.muted }}>Date</th>
                          <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'left', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, color: colors.muted }}>Product</th>
                          <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'left', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, color: colors.muted }}>Type</th>
                          <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'left', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, color: colors.muted }}>Quantity</th>
                          <th style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'left', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, color: colors.muted }}>Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData?.movements?.map(movement => (
                          <tr key={movement._id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                            <td style={{ padding: 'clamp(8px, 2vw, 12px)' }}>
                              {new Date(movement.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: 'clamp(8px, 2vw, 12px)' }}>{movement.product?.name}</td>
                            <td style={{ padding: 'clamp(8px, 2vw, 12px)' }}>
                              <span style={{
                                padding: '2px 8px',
                                fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)',
                                borderRadius: radii.sm,
                                fontWeight: 600,
                                background: movement.type === 'sale' ? colors.danger + '20' :
                                           movement.type === 'purchase' ? colors.success + '20' : colors.primary + '20',
                                color: movement.type === 'sale' ? colors.danger :
                                       movement.type === 'purchase' ? colors.success : colors.primary
                              }}>
                                {movement.type}
                              </span>
                            </td>
                            <td style={{ padding: 'clamp(8px, 2vw, 12px)' }}>
                              <span style={{ color: movement.quantity > 0 ? colors.success : colors.danger }}>
                                {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                              </span>
                            </td>
                            <td style={{ padding: 'clamp(8px, 2vw, 12px)' }}>{movement.reference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;