import React, { useEffect, useState } from "react";
import { colors, fonts, fontSizes, radii, shadows } from "../styles/theme";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "../api/categories";

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCategories(1, 100);
      setCategories(res.data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Debounce search input for better UX
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    if (name.length < 2) {
      setError('Category name must be at least 2 characters');
      return;
    }
    
    setActionLoading(true);
    try {
      const res = await createCategory({ name: name.trim(), description: description.trim() });
      const created = res?.data || res;
      setCategories((prev) => [created, ...prev]);
      setName("");
      setDescription("");
      setMessage('Category added successfully');
      setShowCreateForm(false);
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    if (!editName.trim()) {
      setError('Category name is required');
      return;
    }
    
    setActionLoading(true);
    try {
      const res = await updateCategory(editId, { name: editName.trim(), description: editDescription.trim() });
      setCategories((prev) => prev.map((cat) => (cat._id === editId ? res.data : cat)));
      setEditId(null);
      setMessage('Category updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to update category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setMessage(null);
    setActionLoading(true);
    try {
      await deleteCategory(deleteId);
      setCategories((prev) => prev.filter((cat) => cat._id !== deleteId));
      setConfirmDelete(false);
      setDeleteId(null);
      setSelectedCategories(prev => prev.filter(cid => cid !== deleteId));
      setMessage('Category deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedCategories.length === 0) return;
    
    if (bulkAction === 'delete') {
      if (!confirm(`Delete ${selectedCategories.length} selected categories?`)) return;
      setActionLoading(true);
      try {
        for (const id of selectedCategories) {
          await deleteCategory(id);
        }
        setCategories(prev => prev.filter(c => !selectedCategories.includes(c._id)));
        setSelectedCategories([]);
        setMessage(`${selectedCategories.length} categories deleted successfully`);
      } catch (err) {
        setError(err.message || 'Failed to delete categories');
      } finally {
        setActionLoading(false);
      }
    }
    setBulkAction('');
  };

  const toggleCategorySelection = (id) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedCategories(prev => 
      prev.length === filteredCategories.length ? [] : filteredCategories.map(c => c._id)
    );
  };

  // Filter categories by search
  const filteredCategories = categories.filter((c) => {
    if (!debouncedSearch) return true;
    const s = debouncedSearch.toLowerCase();
    return (c.name && c.name.toLowerCase().includes(s)) || (c.description && c.description.toLowerCase().includes(s));
  }).sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
      case 'description': aVal = a.description || ''; bVal = b.description || ''; break;
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
    total: categories.length,
    withDescription: categories.filter(c => c.description && c.description.trim()).length,
    recentlyAdded: categories.filter(c => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(c.createdAt) > weekAgo;
    }).length,
    avgNameLength: categories.length ? categories.reduce((sum, c) => sum + (c.name?.length || 0), 0) / categories.length : 0
  };

  return (
    <div className="categories-page" style={{ 
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
        }}>Categories Dashboard</h1>
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
            + Add Category
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
              }}>📂 Category Analytics</h3>
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
                  }}>Total Categories</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.success }}>{analytics.withDescription}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>With Description</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.accent }}>{analytics.recentlyAdded}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Added This Week</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: colors.background, borderRadius: radii.sm }}>
                  <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: colors.warning }}>{analytics.avgNameLength.toFixed(1)}</div>
                  <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: colors.muted, marginTop: '4px' }}>Avg Name Length</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: colors.surface, padding: 'clamp(16px, 3vw, 24px)', borderRadius: radii.md, boxShadow: shadows.card, border: `1px solid ${colors.border}` }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', color: colors.text, fontFamily: fonts.heading }}>Categories ({filteredCategories.length})</h2>
              </div>

              {/* Search and Filters */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 'clamp(8px, 2vw, 12px)', 
                marginBottom: 16
              }}>
                <input 
                  placeholder="Search categories..." 
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
                  <option value="description-asc">Description A-Z</option>
                  <option value="description-desc">Description Z-A</option>
                  <option value="created-desc">Newest First</option>
                  <option value="created-asc">Oldest First</option>
                </select>
              </div>

              {/* Bulk Actions */}
              {selectedCategories.length > 0 && (
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
                  <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', fontWeight: 600 }}>{selectedCategories.length} selected</span>
                  <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} style={{ padding: 6, borderRadius: radii.sm, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}>
                    <option value="">Bulk Actions</option>
                    <option value="delete">Delete Selected</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} style={{ padding: '6px 10px', borderRadius: radii.sm, background: colors.danger, color: colors.surface, border: 'none', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontWeight: 600, opacity: bulkAction ? 1 : 0.5 }}>Apply</button>
                  <button onClick={() => setSelectedCategories([])} style={{ padding: '6px 10px', borderRadius: radii.sm, background: colors.border, border: 'none', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}>Clear</button>
                </div>
              )}
            </div>

            {loading ? <div style={{ padding: 20, textAlign: 'center', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Loading...</div> : (
              <>
                {/* Select All Header */}
                {filteredCategories.length > 0 && (
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
                      checked={selectedCategories.length === filteredCategories.length && filteredCategories.length > 0}
                      onChange={toggleSelectAll}
                      style={{ marginRight: 12 }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Select All ({filteredCategories.length})</span>
                  </div>
                )}

                {filteredCategories.length === 0 ? (
                  <div style={{ 
                    padding: 'clamp(16px, 3vw, 24px)', 
                    color: colors.muted, 
                    textAlign: 'center',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                  }}>No categories found.</div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {filteredCategories.map((c) => (
                      <li key={c._id} style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr auto', 
                        gap: 'clamp(8px, 2vw, 16px)',
                        padding: 'clamp(12px, 2.5vw, 20px)', 
                        borderBottom: `1px solid ${colors.border}`, 
                        alignItems: 'center', 
                        background: selectedCategories.includes(c._id) ? colors.primary + '10' : 'transparent'
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
                            checked={selectedCategories.includes(c._id)}
                            onChange={() => toggleCategorySelection(c._id)}
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
                            📂
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            {editId === c._id ? (
                              <form
                                onSubmit={handleEdit}
                                style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: 'wrap' }}
                              >
                                <input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  required
                                  style={{ 
                                    padding: 8, 
                                    borderRadius: radii.sm, 
                                    border: `1px solid ${colors.border}`, 
                                    minWidth: 120, 
                                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                                    flex: 1
                                  }}
                                />
                                <input
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  placeholder="Description"
                                  style={{ 
                                    padding: 8, 
                                    borderRadius: radii.sm, 
                                    border: `1px solid ${colors.border}`, 
                                    minWidth: 120, 
                                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                                    flex: 1
                                  }}
                                />
                                <button 
                                  type="submit" 
                                  disabled={actionLoading} 
                                  style={{ 
                                    padding: "8px 12px", 
                                    borderRadius: radii.sm, 
                                    background: colors.success, 
                                    color: colors.surface, 
                                    border: "none", 
                                    fontWeight: 600, 
                                    opacity: actionLoading ? 0.6 : 1,
                                    fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)'
                                  }}
                                >Save</button>
                                <button 
                                  type="button" 
                                  disabled={actionLoading} 
                                  style={{ 
                                    padding: "8px 12px", 
                                    borderRadius: radii.sm, 
                                    background: colors.border, 
                                    color: colors.text, 
                                    border: "none", 
                                    fontWeight: 600, 
                                    opacity: actionLoading ? 0.6 : 1,
                                    fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)'
                                  }} 
                                  onClick={() => setEditId(null)}
                                >Cancel</button>
                              </form>
                            ) : (
                              <>
                                <div style={{ 
                                  fontWeight: 700, 
                                  fontSize: 'clamp(0.9rem, 2.2vw, 1.1rem)',
                                  wordBreak: 'break-word'
                                }}>{c.name}</div>
                                {c.description && (
                                  <div style={{ 
                                    color: colors.muted, 
                                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                                    marginTop: '4px',
                                    wordBreak: 'break-word'
                                  }}>{c.description}</div>
                                )}
                              </>
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
                          {editId !== c._id && (
                            <>
                              <div style={{ color: colors.muted, fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)' }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                              <button
                                onClick={() => {
                                  setEditId(c._id);
                                  setEditName(c.name);
                                  setEditDescription(c.description || "");
                                }}
                                style={{ 
                                  padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)', 
                                  borderRadius: radii.sm, 
                                  background: colors.secondary, 
                                  color: colors.surface, 
                                  border: 'none', 
                                  fontWeight: 700, 
                                  fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                                  whiteSpace: 'nowrap'
                                }}
                              >Edit</button>
                              <button
                                onClick={() => {
                                  setDeleteId(c._id);
                                  setConfirmDelete(true);
                                }}
                                style={{ 
                                  padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)', 
                                  borderRadius: radii.sm, 
                                  background: colors.danger, 
                                  color: colors.surface, 
                                  border: 'none', 
                                  fontWeight: 700, 
                                  fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                                  whiteSpace: 'nowrap'
                                }}
                              >Delete</button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
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

        {/* Create Category Form */}
        {showCreateForm && (
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
            }}>Add Category</h3>
            <form onSubmit={handleSubmit}>
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
                  placeholder="Enter category name"
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
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={4}
                  placeholder="Enter category description"
                  style={{ width: '100%', padding: 'clamp(8px, 2vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box', resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button disabled={actionLoading} type="submit" style={{ flex: 1, padding: '12px', borderRadius: radii.md, background: colors.primary, color: colors.surface, border: 'none', fontWeight: 700, boxShadow: shadows.soft, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>{actionLoading ? 'Adding...' : 'Add Category'}</button>
                <button disabled={actionLoading} type="button" onClick={() => { setShowCreateForm(false); setName(''); setDescription(''); }} style={{ padding: '12px 16px', borderRadius: radii.md, background: colors.border, border: 'none', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: '20px' }}>
            <div style={{ 
              background: colors.surface, 
              padding: 'clamp(20px, 4vw, 36px)', 
              borderRadius: radii.lg, 
              boxShadow: shadows.card, 
              minWidth: 'clamp(280px, 50vw, 400px)',
              maxWidth: '90vw'
            }}>
              <h3 style={{ marginTop: 0, fontWeight: 700, color: colors.danger, fontFamily: fonts.heading, fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}>Delete Category</h3>
              <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)', marginBottom: 20 }}>Are you sure you want to delete this category?</p>
              <div style={{ display: "flex", gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
                <button
                  disabled={actionLoading}
                  style={{ 
                    flex: 1,
                    padding: "10px 18px", 
                    borderRadius: radii.md, 
                    background: colors.danger, 
                    color: colors.surface, 
                    border: "none", 
                    fontWeight: 600, 
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                    opacity: actionLoading ? 0.6 : 1 
                  }}
                  onClick={handleDelete}
                >Delete</button>
                <button
                  disabled={actionLoading}
                  style={{ 
                    flex: 1,
                    padding: "10px 18px", 
                    borderRadius: radii.md, 
                    background: colors.border, 
                    color: colors.text, 
                    border: "none", 
                    fontWeight: 600, 
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                    opacity: actionLoading ? 0.6 : 1 
                  }}
                  onClick={() => {
                    setConfirmDelete(false);
                    setDeleteId(null);
                  }}
                >Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;