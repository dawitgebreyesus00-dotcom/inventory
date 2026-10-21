import React, { useState } from 'react';
import { createOrder } from '../../api/orders';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { colors, fonts } from '../../styles/theme';

const CustomerCart = () => {
  const { items, updateQuantity, removeItem, clear, total } = useCart();
  const { user } = useAuth();
  const [shippingAddress, setShippingAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    if (!user?._id) {
      setError('Please log in again.');
      return;
    }
    if (items.length === 0) {
      setError('Cart is empty');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await createOrder({
        user: user._id,
        items: items.map((it) => ({ product: it.product._id, quantity: it.quantity })),
        shippingAddress,
      });
      clear();
      setMessage('Order placed successfully!');
    } catch (err) {
      setError(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: fonts.main, padding: 24, maxWidth: '100vw', overflowX: 'hidden' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.text, marginBottom: 8, fontFamily: fonts.heading, letterSpacing: '-0.5px' }}>Cart & Checkout</h1>
        <p style={{ color: colors.muted, fontSize: 16 }}>Review your cart and complete checkout.</p>
      </div>
      
      {error && <div style={{ color: colors.danger, padding: 16, background: `${colors.danger}10`, borderRadius: 8, marginBottom: 16, border: `1px solid ${colors.danger}40` }}>{error}</div>}
      {message && <div style={{ color: colors.success, padding: 16, background: `${colors.success}10`, borderRadius: 8, marginBottom: 16, border: `1px solid ${colors.success}40` }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}>
        <div style={{ background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`, padding: 20, borderRadius: 12, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)', border: `1px solid ${colors.border}` }}>
          <h3 style={{ marginTop: 0, color: colors.text, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>🛒 Cart Items</h3>
          
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: colors.muted }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Your cart is empty</div>
              <div>Add some products to get started!</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map((it) => (
                  <div key={it.product._id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: 16,
                    background: colors.background,
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: colors.text, fontSize: 16, marginBottom: 4 }}>{it.product.name}</div>
                      <div style={{ color: colors.muted, fontSize: 14 }}>${(it.product.price ?? 0).toFixed(2)} each</div>
                      <div style={{ color: colors.success, fontSize: 12, marginTop: 4 }}>✓ In Stock</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: 14, color: colors.text }}>Qty:</label>
                        <input
                          type="number"
                          min={1}
                          max={it.product.quantity || 999}
                          value={it.quantity}
                          onChange={(e) => updateQuantity(it.product._id, Number(e.target.value))}
                          style={{ 
                            width: 80, 
                            padding: 8, 
                            borderRadius: 6, 
                            border: `1px solid ${colors.border}`,
                            textAlign: 'center',
                            fontSize: 14
                          }}
                        />
                      </div>
                      <div style={{ fontWeight: 700, color: colors.primary, minWidth: 80, textAlign: 'right' }}>
                        ${((it.product.price ?? 0) * it.quantity).toFixed(2)}
                      </div>
                      <button 
                        onClick={() => removeItem(it.product._id)} 
                        style={{ 
                          background: `${colors.danger}20`, 
                          border: `1px solid ${colors.danger}40`, 
                          color: colors.danger, 
                          fontWeight: 600,
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ 
                marginTop: 20, 
                padding: 16, 
                background: `${colors.success}10`, 
                borderRadius: 8,
                border: `1px solid ${colors.success}40`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>Total:</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: colors.success, fontFamily: fonts.heading }}>${total.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        <div style={{ width: 400, background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`, padding: 20, borderRadius: 12, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)', border: `1px solid ${colors.border}` }}>
          <h3 style={{ marginTop: 0, color: colors.text, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📦 Checkout</h3>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: colors.text, fontWeight: 600 }}>Shipping Address *</label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={4}
              required
              style={{ 
                width: '100%', 
                padding: 12, 
                borderRadius: 8, 
                border: `2px solid ${colors.border}`, 
                fontSize: 14,
                fontFamily: fonts.main,
                resize: 'vertical'
              }}
              placeholder="Enter your full shipping address\nInclude city, postal code, and contact number"
            />
          </div>
          
          <div style={{ marginBottom: 20, padding: 12, background: colors.background, borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>Order Summary:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Items ({items.length}):</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Shipping:</span>
              <span style={{ color: colors.success }}>Free</span>
            </div>
            <hr style={{ border: `1px solid ${colors.border}`, margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          
          <button
            disabled={submitting || items.length === 0 || !shippingAddress.trim()}
            onClick={handleCheckout}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 12,
              background: (submitting || items.length === 0 || !shippingAddress.trim()) ? colors.border : colors.primary,
              color: colors.surface,
              border: 'none',
              fontWeight: 700,
              fontSize: 16,
              cursor: (submitting || items.length === 0 || !shippingAddress.trim()) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: (submitting || items.length === 0 || !shippingAddress.trim()) ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            {submitting ? '⏳ Placing Order...' : items.length === 0 ? 'Cart is Empty' : !shippingAddress.trim() ? 'Add Shipping Address' : '🚀 Place Order'}
          </button>
          
          <div style={{ marginTop: 12, fontSize: 12, color: colors.muted, textAlign: 'center' }}>
            Your order will be pending until admin approval
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCart;




