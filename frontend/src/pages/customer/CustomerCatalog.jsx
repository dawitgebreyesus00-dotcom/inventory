import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../../api/products';
import { colors, fonts } from '../../styles/theme';
import { useCart } from '../../context/CartContext';

const CustomerCatalog = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addItem } = useCart();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchProducts(1, 200);
        setProducts(res?.data?.items || res?.items || []);
      } catch (err) {
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(s) ||
      (p.description || '').toLowerCase().includes(s) ||
      (p.sku || '').toLowerCase().includes(s)
    );
  });

  return (
    <div style={{ fontFamily: fonts.main, padding: 24, maxWidth: '100vw', overflowX: 'hidden' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.text, marginBottom: 8, fontFamily: fonts.heading, letterSpacing: '-0.5px' }}>Product Catalog</h1>
        <p style={{ color: colors.muted, fontSize: 16 }}>Browse products and add them to your cart.</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search products..."
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '12px 16px',
            borderRadius: 12,
            border: `2px solid ${colors.border}`,
            fontSize: 16,
            fontFamily: fonts.main,
            transition: 'border-color 0.2s ease',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)'
          }}
        />
      </div>

      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          color: colors.muted,
          fontSize: 18
        }}>Loading products...</div>
      )}
      {error && <div style={{ color: colors.danger }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {filtered.map((p) => (
          <div key={p._id} style={{ 
            background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`, 
            borderRadius: 16, 
            padding: 20, 
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
            border: `1px solid ${colors.border}`,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer'
          }}>
            <div style={{ 
              width: '100%', 
              height: 160, 
              background: colors.background, 
              borderRadius: 12, 
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {p.images && p.images.length > 0 && p.images[0] ? 
                <img 
                  src={p.images[0]} 
                  alt={p.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onLoad={(e) => console.log('Image loaded:', p.name)}
                  onError={(e) => {
                    console.log('Image failed:', p.name, p.images[0]);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                /> : 
                <div style={{ color: colors.muted, fontSize: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
              }
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: colors.text, fontSize: 18, marginBottom: 6, fontFamily: fonts.heading }}>{p.name}</div>
              <div style={{ color: colors.muted, fontSize: 14, lineHeight: 1.4, minHeight: 40 }}>{p.description || 'No description available'}</div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ 
                fontWeight: 800, 
                color: colors.primary, 
                fontSize: 24,
                fontFamily: fonts.heading
              }}>${p.price ?? 0}</div>
              <div style={{
                background: p.quantity === 0 ? `${colors.danger}20` : p.quantity <= 5 ? `${colors.warning}20` : `${colors.success}20`,
                color: p.quantity === 0 ? colors.danger : p.quantity <= 5 ? colors.warning : colors.success,
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                border: `1px solid ${p.quantity === 0 ? colors.danger + '40' : p.quantity <= 5 ? colors.warning + '40' : colors.success + '40'}`
              }}>
                {p.quantity === 0 ? '🔴 Out of Stock' : p.quantity <= 5 ? `🟡 LOW: ${p.quantity}` : `🟢 ${p.quantity} in stock`}
              </div>
            </div>
            
            <button
              onClick={() => addItem(p, 1)}
              disabled={p.quantity === 0}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                background: p.quantity > 0 ? colors.primary : colors.border,
                color: colors.surface,
                border: 'none',
                fontWeight: 700,
                fontSize: 16,
                cursor: p.quantity > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                boxShadow: p.quantity > 0 ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none'
              }}
            >
              {p.quantity > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerCatalog;




