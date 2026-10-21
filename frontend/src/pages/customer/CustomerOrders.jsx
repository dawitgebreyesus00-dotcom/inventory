import React, { useEffect, useState } from 'react';
import { fetchMyOrders } from '../../api/orders';
import { colors, fonts } from '../../styles/theme';

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchMyOrders();
        setOrders(res?.data || res || []);
      } catch (err) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getStatusInfo = (status) => {
    const statusMap = {
      'pending': { color: colors.warning, text: 'Pending', desc: 'Your order is being reviewed' },
      'processing': { color: colors.secondary, text: 'Processing', desc: 'Your order is being prepared' },
      'shipped': { color: colors.primary, text: 'Shipped', desc: 'Your order has been shipped' },
      'completed': { color: colors.success, text: 'Completed', desc: 'Your order is delivered' },
      'cancelled': { color: colors.danger, text: 'Cancelled', desc: 'Your order was cancelled' }
    };
    return statusMap[status] || { color: colors.muted, text: status, desc: '' };
  };

  return (
    <div style={{ fontFamily: fonts.main, padding: 24, maxWidth: '100vw', overflowX: 'hidden' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.text, marginBottom: 8, fontFamily: fonts.heading, letterSpacing: '-0.5px' }}>My Orders</h1>
        <p style={{ color: colors.muted, fontSize: 16 }}>Track status of your orders.</p>
      </div>
      
      {loading && <div style={{ textAlign: 'center', padding: 40, color: colors.muted, fontSize: 18 }}>Loading orders...</div>}
      {error && <div style={{ color: colors.danger, padding: 16, background: `${colors.danger}10`, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {orders.map((o) => {
          const statusInfo = getStatusInfo(o.status);
          return (
            <div key={o._id} style={{ 
              background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`, 
              padding: 20, 
              borderRadius: 12, 
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, color: colors.text, fontSize: 18, marginBottom: 4 }}>Order #{o.orderNumber || o._id.slice(-6)}</div>
                  <div style={{ color: colors.muted, fontSize: 14, marginBottom: 8 }}>{new Date(o.createdAt).toLocaleString()}</div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: `${statusInfo.color}20`,
                    color: statusInfo.color,
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    border: `1px solid ${statusInfo.color}40`
                  }}>
                    {statusInfo.text.toUpperCase()}
                  </div>
                  <div style={{ color: colors.muted, fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>
                    {statusInfo.desc}
                  </div>
                </div>
                <div style={{ 
                  fontWeight: 800, 
                  color: colors.success, 
                  fontSize: 20,
                  fontFamily: fonts.heading
                }}>${(o.total ?? 0).toFixed(2)}</div>
              </div>
              
              <div style={{ background: colors.background, padding: 12, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: colors.text }}>Order Items:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {o.items?.map((it) => (
                    <div key={it._id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: colors.surface,
                      borderRadius: 6,
                      fontSize: 14
                    }}>
                      <span style={{ color: colors.text, fontWeight: 500 }}>{it.product?.name || 'Item'}</span>
                      <span style={{ color: colors.muted }}>{it.quantity} × ${(it.price ?? 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {o.shippingAddress && (
                <div style={{ marginTop: 12, padding: 12, background: `${colors.primary}10`, borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, color: colors.text, fontSize: 13, marginBottom: 4 }}>Shipping Address:</div>
                  <div style={{ color: colors.muted, fontSize: 13 }}>{o.shippingAddress}</div>
                </div>
              )}
            </div>
          );
        })}
        {!loading && orders.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            color: colors.muted,
            background: colors.surface,
            borderRadius: 12,
            border: `1px solid ${colors.border}`
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No orders yet</div>
            <div>Start shopping to see your orders here!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;




