import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../../api/products';
import { fetchMyOrders } from '../../api/orders';
import { colors, fonts } from '../../styles/theme';

const StatCard = ({ label, value, icon, color = colors.primary }) => (
  <div style={{ 
    flex: 1, 
    background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`, 
    padding: 20, 
    borderRadius: 12, 
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
    border: `1px solid ${colors.border}`,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ fontSize: 13, color: colors.muted, fontWeight: 600, letterSpacing: '0.025em' }}>{label}</div>
      {icon && <div style={{ fontSize: 20, opacity: 0.8 }}>{icon}</div>}
    </div>
    <div style={{ fontWeight: 800, fontSize: 28, color: color, fontFamily: fonts.heading, letterSpacing: '-0.5px' }}>{value}</div>
  </div>
);

const CustomerHome = () => {
  const [loading, setLoading] = useState(false);
  const [productsCount, setProductsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [lastOrder, setLastOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const prodRes = await fetchProducts(1, 50);
        setProductsCount(prodRes?.data?.total || prodRes?.total || (prodRes?.data?.items || []).length || 0);

        const orderRes = await fetchMyOrders();
        const orders = orderRes?.data || orderRes || [];
        setOrdersCount(Array.isArray(orders) ? orders.length : 0);
        setLastOrder(Array.isArray(orders) ? orders[0] : null);
      } catch (err) {
        setError(err.message || 'Failed to load overview');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ fontFamily: fonts.main, padding: 24, maxWidth: '100vw', overflowX: 'hidden' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.text, marginBottom: 8, fontFamily: fonts.heading, letterSpacing: '-0.5px' }}>Customer Dashboard</h1>
        <p style={{ color: colors.muted, fontSize: 16 }}>Overview of products and your orders.</p>
      </div>

      {error && <div style={{ color: colors.danger, marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
        <StatCard label="Products Available" value={loading ? '...' : productsCount} icon="📦" color={colors.primary} />
        <StatCard label="My Orders" value={loading ? '...' : ordersCount} icon="🛒" color={colors.secondary} />
        <StatCard label="Last Order Total" value={loading ? '...' : (lastOrder ? `$${lastOrder.total ?? 0}` : 'N/A')} icon="💰" color={colors.success} />
      </div>

      {lastOrder && (
        <div style={{ 
          background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`, 
          padding: 24, 
          borderRadius: 12, 
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
          border: `1px solid ${colors.border}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, color: colors.text, fontSize: 18, marginBottom: 4 }}>🛍️ Recent Order</div>
              <div style={{ color: colors.muted, fontSize: 14 }}>{new Date(lastOrder.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ 
              fontWeight: 800, 
              color: colors.success, 
              fontSize: 24, 
              fontFamily: fonts.heading,
              background: `${colors.success}15`,
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${colors.success}30`
            }}>${lastOrder.total ?? 0}</div>
          </div>
          <div style={{ background: colors.background, padding: 16, borderRadius: 8, marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: colors.text }}>Order Items:</div>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {lastOrder.items?.map((it) => (
                <li key={it._id} style={{ 
                  marginBottom: 8, 
                  color: colors.text,
                  padding: '8px 12px',
                  background: colors.surface,
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{it.product?.name || 'Item'}</span>
                  <span style={{ color: colors.muted, fontSize: 14 }}>{it.quantity} × ${it.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerHome;




