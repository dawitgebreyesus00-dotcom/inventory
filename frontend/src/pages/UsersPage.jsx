import React, { useEffect, useState } from 'react';
import { colors, fonts, fontSizes, radii, shadows } from '../styles/theme';
import { fetchUsers, updateUser, deleteUser, createUser } from '../api/users';

const ROLES = ['admin', 'customer'];

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('customer');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers();
      const items = res?.data || res || [];
      setUsers(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const handleRoleChange = async (id, newRole) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await updateUser(id, { role: newRole });
      const updated = res?.data || res;
      setUsers((prev) => prev.map(u => (u._id === id ? updated : u)));
      setMessage(`User role updated to ${newRole}`);
    } catch (err) {
      setError(err.message || 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    setActionLoading(true);
    setError(null);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter(u => u._id !== id));
      setSelectedUsers(prev => prev.filter(uid => uid !== id));
      setMessage('User deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;
    
    if (bulkAction === 'delete') {
      if (!confirm(`Delete ${selectedUsers.length} selected users?`)) return;
      setActionLoading(true);
      try {
        for (const id of selectedUsers) {
          await deleteUser(id);
        }
        setUsers(prev => prev.filter(u => !selectedUsers.includes(u._id)));
        setSelectedUsers([]);
        setMessage(`${selectedUsers.length} users deleted successfully`);
      } catch (err) {
        setError(err.message || 'Failed to delete users');
      } finally {
        setActionLoading(false);
      }
    } else if (bulkAction.startsWith('role-')) {
      const newRole = bulkAction.replace('role-', '');
      setActionLoading(true);
      try {
        for (const id of selectedUsers) {
          await updateUser(id, { role: newRole });
        }
        setUsers(prev => prev.map(u => selectedUsers.includes(u._id) ? {...u, role: newRole} : u));
        setSelectedUsers([]);
        setMessage(`${selectedUsers.length} users updated to ${newRole} role`);
      } catch (err) {
        setError(err.message || 'Failed to update users');
      } finally {
        setActionLoading(false);
      }
    }
    setBulkAction('');
  };

  const toggleUserSelection = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedUsers(prev => 
      prev.length === filtered.length ? [] : filtered.map(u => u._id)
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setCreating(true);
    try {
      const userData = { 
        email: email.trim(), 
        password, 
        name: name.trim() || undefined,
        address: address.trim() || undefined,
        role 
      };
      await createUser(userData);
      setEmail('');
      setPassword('');
      setName('');
      setAddress('');
      setRole('customer');
      setShowCreateForm(false);
      setMessage('User created successfully');
      await load();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (!debounced) return true;
    const q = debounced.toLowerCase();
    return (u.name && u.name.toLowerCase().includes(q)) || 
           (u.email && u.email.toLowerCase().includes(q)) || 
           (u.role && u.role.toLowerCase().includes(q));
  }).sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
      case 'email': aVal = a.email || ''; bVal = b.email || ''; break;
      case 'role': aVal = a.role || ''; bVal = b.role || ''; break;
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
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    customers: users.filter(u => u.role === 'customer').length,
    recentlyAdded: users.filter(u => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(u.createdAt) > weekAgo;
    }).length
  };

  return (
    <div className="users-page" style={{ 
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
        }}>User Management</h1>
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
            + Add User
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
              }}>👥 User Analytics</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: 'clamp(8px, 2vw, 16px)' 
              }}>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.primary }}>{analytics.total}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Total Users</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.danger }}>{analytics.admins}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Admins</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.success }}>{analytics.customers}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Customers</div>
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
                <h2 style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', color: colors.text, fontFamily: fonts.heading }}>Users ({filtered.length})</h2>
                <button onClick={load} disabled={loading} style={{ padding: '8px 12px', borderRadius: radii.sm, background: colors.primary, color: colors.surface, border: 'none', fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', opacity: loading ? 0.7 : 1 }}>{loading ? 'Refreshing...' : 'Refresh'}</button>
              </div>

              {/* Search and Filters */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: 'clamp(8px, 2vw, 12px)', 
                marginBottom: 16
              }}>
                <input 
                  placeholder="Search users..." 
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
                  value={roleFilter} 
                  onChange={(e) => setRoleFilter(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    borderRadius: radii.md, 
                    border: `1px solid ${colors.border}`, 
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                    boxSizing: 'border-box' 
                  }}
                >
                  <option value="">All Roles</option>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
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
                  <option value="email-asc">Email A-Z</option>
                  <option value="email-desc">Email Z-A</option>
                  <option value="role-asc">Role A-Z</option>
                  <option value="role-desc">Role Z-A</option>
                  <option value="created-desc">Newest First</option>
                  <option value="created-asc">Oldest First</option>
                </select>
              </div>

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
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
                  <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', fontWeight: 600 }}>{selectedUsers.length} selected</span>
                  <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} style={{ padding: 6, borderRadius: radii.sm, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}>
                    <option value="">Bulk Actions</option>
                    <option value="role-admin">Make Admin</option>
                    <option value="role-customer">Make Customer</option>
                    <option value="delete">Delete Selected</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} style={{ padding: '6px 10px', borderRadius: radii.sm, background: colors.primary, color: colors.surface, border: 'none', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, opacity: bulkAction ? 1 : 0.5 }}>Apply</button>
                  <button onClick={() => setSelectedUsers([])} style={{ padding: '6px 10px', borderRadius: radii.sm, background: colors.border, border: 'none', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}>Clear</button>
                </div>
              )}
            </div>

            {loading ? <div style={{ padding: 20, textAlign: 'center', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Loading users...</div> : (
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
                      checked={selectedUsers.length === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      style={{ marginRight: 12 }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Select All ({filtered.length})</span>
                  </div>
                )}

                <div style={{ overflowX: 'auto' }}>
                  {filtered.length === 0 ? (
                    <div style={{ 
                      padding: 'clamp(16px, 3vw, 24px)', 
                      color: colors.muted, 
                      textAlign: 'center',
                      fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                    }}>No users found.</div>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {filtered.map(u => (
                        <li key={u._id} style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr auto', 
                          gap: 'clamp(8px, 2vw, 16px)',
                          padding: 'clamp(12px, 2.5vw, 20px)', 
                          borderBottom: `1px solid ${colors.border}`, 
                          alignItems: 'center', 
                          background: selectedUsers.includes(u._id) ? colors.primary + '10' : 'transparent'
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
                              checked={selectedUsers.includes(u._id)}
                              onChange={() => toggleUserSelection(u._id)}
                            />
                            <div style={{ 
                              width: 'clamp(40px, 8vw, 56px)', 
                              height: 'clamp(40px, 8vw, 56px)', 
                              background: u.role === 'admin' ? colors.danger + '20' : colors.primary + '20', 
                              borderRadius: radii.sm, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              border: `1px solid ${colors.border}`,
                              flexShrink: 0,
                              fontSize: 'clamp(1rem, 2vw, 1.2rem)'
                            }}>
                              {u.role === 'admin' ? '👑' : '👤'}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ 
                                fontWeight: 700, 
                                fontSize: 'clamp(0.9rem, 2.2vw, 1.1rem)',
                                wordBreak: 'break-word'
                              }}>{u.name || 'No Name'}</div>
                              <div style={{ 
                                color: colors.muted, 
                                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                                marginTop: '4px',
                                wordBreak: 'break-word'
                              }}>{u.email}</div>
                              <div style={{ 
                                marginTop: 4, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 'clamp(6px, 1.5vw, 12px)',
                                flexWrap: 'wrap'
                              }}>
                                <span style={{ 
                                  background: u.role === 'admin' ? colors.danger : colors.success, 
                                  color: colors.surface, 
                                  padding: '2px 8px', 
                                  borderRadius: radii.sm, 
                                  fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', 
                                  fontWeight: 600 
                                }}>{u.role?.toUpperCase()}</span>
                                {u.address && <span style={{ color: colors.muted, fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)' }}>📍 {u.address}</span>}
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
                            <div style={{ color: colors.muted, fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)' }}>{new Date(u.createdAt).toLocaleDateString()}</div>
                            <select 
                              value={u.role || 'customer'} 
                              onChange={(e) => handleRoleChange(u._id, e.target.value)} 
                              disabled={actionLoading} 
                              style={{ 
                                padding: 'clamp(6px, 1.5vw, 8px)', 
                                borderRadius: radii.sm, 
                                border: `1px solid ${colors.border}`, 
                                background: colors.background, 
                                color: colors.text,
                                fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)'
                              }}
                            >
                              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <button 
                              disabled={actionLoading} 
                              onClick={() => handleDelete(u._id)} 
                              style={{ 
                                padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)', 
                                borderRadius: radii.sm, 
                                background: colors.danger, 
                                color: colors.surface, 
                                border: 'none', 
                                fontWeight: 700, 
                                opacity: actionLoading ? 0.6 : 1, 
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

            {/* Success/Error Messages */}
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
            {message && (
              <div style={{ 
                color: colors.success, 
                marginTop: 16, 
                padding: 'clamp(8px, 2vw, 12px)', 
                background: colors.success + '10', 
                borderRadius: radii.md, 
                border: `1px solid ${colors.success}30`,
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
              }}>{message}</div>
            )}
          </div>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div style={{ 
            position: 'fixed',
            top: 0,
            right: 0,
            width: 'clamp(350px, 35vw, 450px)',
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
            }}>Create New User</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Email *</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                  placeholder="user@example.com"
                  style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Password *</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                  placeholder="Enter password"
                  style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Name</label>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Full name"
                  style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Role</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                  style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Address</label>
                <textarea 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  rows={3}
                  placeholder="User address"
                  style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box', resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button disabled={creating} type="submit" style={{ flex: 1, padding: '12px', borderRadius: radii.md, background: colors.success, color: colors.surface, border: 'none', fontWeight: 700, boxShadow: shadows.soft, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', opacity: creating ? 0.7 : 1 }}>{creating ? 'Creating...' : 'Create User'}</button>
                <button disabled={creating} type="button" onClick={() => { setShowCreateForm(false); setEmail(''); setPassword(''); setName(''); setAddress(''); setRole('customer'); }} style={{ padding: '12px 16px', borderRadius: radii.md, background: colors.border, border: 'none', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;