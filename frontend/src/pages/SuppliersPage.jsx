import React, { useEffect, useState } from 'react';
import { colors, fonts, fontSizes, radii, shadows } from '../styles/theme';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../api/suppliers';

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSuppliers();
      const items = res?.data || res || [];
      setSuppliers(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.message || 'Failed to load suppliers');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const resetForm = () => {
    setEditId(null);
    setName('');
    setContactName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
  };

  const openForEdit = (s) => {
    setEditId(s._id);
    setName(s.name || '');
    setContactName(s.contactName || '');
    setPhone(s.phone || '');
    setEmail(s.email || '');
    setAddress(s.address || '');
    setNotes(s.notes || '');
    setFormVisible(true);
  };

  const handleSave = async (e) => {
    e && e.preventDefault();
    setActionLoading(true);
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Supplier name is required');
      setActionLoading(false);
      return;
    }
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      setActionLoading(false);
      return;
    }

    try {
      const payload = { 
        name: name.trim(), 
        contactName: contactName.trim(), 
        phone: phone.trim(), 
        email: email.trim(), 
        address: address.trim(), 
        notes: notes.trim() 
      };
      
      if (editId) {
        const res = await updateSupplier(editId, payload);
        const updated = res?.data || res;
        setSuppliers((prev) => prev.map((it) => (it._id === editId ? updated : it)));
      } else {
        const res = await createSupplier(payload);
        const created = res?.data || res;
        setSuppliers((prev) => [created, ...prev]);
      }
      resetForm();
      setFormVisible(false);
    } catch (err) {
      setError(err.message || 'Failed to save supplier');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier? This will not remove related products automatically.')) return;
    setActionLoading(true);
    setError(null);
    try {
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s._id !== id));
      setSelectedSuppliers(prev => prev.filter(sid => sid !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete supplier');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedSuppliers.length === 0) return;
    
    if (bulkAction === 'delete') {
      if (!confirm(`Delete ${selectedSuppliers.length} selected suppliers?`)) return;
      setActionLoading(true);
      try {
        for (const id of selectedSuppliers) {
          await deleteSupplier(id);
        }
        setSuppliers(prev => prev.filter(s => !selectedSuppliers.includes(s._id)));
        setSelectedSuppliers([]);
      } catch (err) {
        setError(err.message || 'Failed to delete suppliers');
      } finally {
        setActionLoading(false);
      }
    }
    setBulkAction('');
  };

  const toggleSupplierSelection = (id) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedSuppliers(prev => 
      prev.length === filtered.length ? [] : filtered.map(s => s._id)
    );
  };

  const filtered = suppliers.filter((s) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (s.name && s.name.toLowerCase().includes(q)) || 
           (s.contactName && s.contactName.toLowerCase().includes(q)) || 
           (s.email && s.email.toLowerCase().includes(q)) || 
           (s.phone && s.phone.toLowerCase().includes(q));
  }).sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
      case 'contact': aVal = a.contactName || ''; bVal = b.contactName || ''; break;
      case 'email': aVal = a.email || ''; bVal = b.email || ''; break;
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
    total: suppliers.length,
    withEmail: suppliers.filter(s => s.email).length,
    withPhone: suppliers.filter(s => s.phone).length,
    recentlyAdded: suppliers.filter(s => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(s.createdAt) > weekAgo;
    }).length
  };

  return (
    <div className="suppliers-page" style={{ 
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
        }}>Suppliers Dashboard</h1>
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
              }}>🏢 Supplier Analytics</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
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
                  }}>Total Suppliers</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.success }}>{analytics.withEmail}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>With Email</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.warning }}>{analytics.withPhone}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>With Phone</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.accent }}>{analytics.recentlyAdded}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Added This Week</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: colors.surface, padding: 'clamp(16px, 3vw, 24px)', borderRadius: radii.md, boxShadow: shadows.card, border: `1px solid ${colors.border}` }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', color: colors.text, fontFamily: fonts.heading }}>Suppliers ({filtered.length})</h2>
                <button onClick={() => { setFormVisible(true); resetForm(); }} style={{ padding: '10px 14px', borderRadius: radii.md, background: colors.primary, color: colors.surface, border: 'none', fontWeight: 700, boxShadow: shadows.soft, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>+ Add Supplier</button>
              </div>

              {/* Search and Filters */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 'clamp(8px, 2vw, 12px)', 
                marginBottom: 16
              }}>
                <input 
                  placeholder="Search suppliers..." 
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
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="contact-asc">Contact A-Z</option>
                  <option value="contact-desc">Contact Z-A</option>
                  <option value="email-asc">Email A-Z</option>
                  <option value="email-desc">Email Z-A</option>
                  <option value="created-desc">Newest First</option>
                  <option value="created-asc">Oldest First</option>
                </select>
              </div>

              {/* Bulk Actions */}
              {selectedSuppliers.length > 0 && (
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
                  <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', fontWeight: 600 }}>{selectedSuppliers.length} selected</span>
                  <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} style={{ padding: 6, borderRadius: radii.sm, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}>
                    <option value="">Bulk Actions</option>
                    <option value="delete">Delete Selected</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} style={{ padding: '6px 10px', borderRadius: radii.sm, background: colors.danger, color: colors.surface, border: 'none', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, opacity: bulkAction ? 1 : 0.5 }}>Apply</button>
                  <button onClick={() => setSelectedSuppliers([])} style={{ padding: '6px 10px', borderRadius: radii.sm, background: colors.border, border: 'none', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}>Clear</button>
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
                      checked={selectedSuppliers.length === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      style={{ marginRight: 12 }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Select All ({filtered.length})</span>
                  </div>
                )}

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {filtered.length === 0 ? (
                    <li style={{ 
                      padding: 'clamp(16px, 3vw, 24px)', 
                      color: colors.muted, 
                      textAlign: 'center',
                      fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                    }}>No suppliers found.</li>
                  ) : (
                    filtered.map((s) => (
                      <li key={s._id} style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr auto', 
                        gap: 'clamp(8px, 2vw, 16px)',
                        padding: 'clamp(12px, 2.5vw, 20px)', 
                        borderBottom: `1px solid ${colors.border}`, 
                        alignItems: 'center', 
                        background: selectedSuppliers.includes(s._id) ? colors.primary + '10' : 'transparent'
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
                            checked={selectedSuppliers.includes(s._id)}
                            onChange={() => toggleSupplierSelection(s._id)}
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
                            🏢
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ 
                              fontWeight: 700, 
                              fontSize: 'clamp(0.9rem, 2.2vw, 1.1rem)',
                              wordBreak: 'break-word'
                            }}>{s.name}</div>
                            <div style={{ 
                              color: colors.muted, 
                              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                              marginTop: '4px',
                              wordBreak: 'break-word'
                            }}>
                              {s.contactName && <span>{s.contactName}</span>}
                              {s.contactName && s.email && <span> • </span>}
                              {s.email && <span>{s.email}</span>}
                            </div>
                            {s.phone && (
                              <div style={{ 
                                color: colors.muted, 
                                fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                                marginTop: '2px'
                              }}>📞 {s.phone}</div>
                            )}
                            {s.address && (
                              <div style={{ 
                                color: colors.muted, 
                                fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                                marginTop: '2px',
                                wordBreak: 'break-word'
                              }}>📍 {s.address}</div>
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
                          <div style={{ color: colors.muted, fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)' }}>{new Date(s.createdAt).toLocaleDateString()}</div>
                          <button 
                            onClick={() => openForEdit(s)} 
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
                            onClick={() => handleDelete(s._id)} 
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
                    ))
                  )}
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
            }}>{editId ? 'Edit Supplier' : 'Add Supplier'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 6, 
                  fontWeight: 600, 
                  fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' 
                }}>Name *</label>
                <input 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter supplier name"
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
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Contact Name</label>
                <input 
                  value={contactName} 
                  onChange={(e) => setContactName(e.target.value)} 
                  placeholder="Contact person name"
                  style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Phone</label>
                  <input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="Phone number"
                    style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Email</label>
                  <input 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Email address"
                    style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                  />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Address</label>
                <input 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  placeholder="Business address"
                  style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Notes</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  rows={4} 
                  placeholder="Additional notes..."
                  style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box', resize: 'vertical' }} 
                />
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

export default SuppliersPage;