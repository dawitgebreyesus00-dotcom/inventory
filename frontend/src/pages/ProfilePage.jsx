import React, { useEffect, useState } from 'react';
import { colors, fonts, fontSizes, radii, shadows } from '../styles/theme';
import { getMe, updateMe } from '../api/users';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [profile, setProfile] = useState({ 
    fullName: '', 
    photo: '', 
    phone: '', 
    address: '',
    bio: '',
    website: '',
    company: ''
  });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMe();
      const u = res?.data || res;
      setName(u.name || '');
      setEmail(u.email || '');
      setProfile({
        fullName: u.profile?.fullName || '',
        photo: u.profile?.photo || '',
        phone: u.profile?.phone || '',
        address: u.profile?.address || '',
        bio: u.profile?.bio || '',
        website: u.profile?.website || '',
        company: u.profile?.company || ''
      });
    } catch (err) {
      if (err.message.includes('User account not found')) {
        localStorage.clear();
        window.location.href = '/login';
      } else {
        setError(err.message || 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleSave = async (e) => {
    e && e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    
    // Basic validation
    if (!name.trim()) {
      setError('Display name is required');
      setSaving(false);
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      setSaving(false);
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Please enter a valid email address');
      setSaving(false);
      return;
    }
    
    try {
      const payload = { 
        name: name.trim(), 
        email: email.trim(), 
        profile: {
          ...profile,
          fullName: profile.fullName.trim(),
          phone: profile.phone.trim(),
          address: profile.address.trim(),
          bio: profile.bio.trim(),
          website: profile.website.trim(),
          company: profile.company.trim()
        }
      };
      await updateMe(payload);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      if (err.message.includes('User account not found')) {
        localStorage.clear();
        window.location.href = '/login';
      } else {
        setError(err.message || 'Failed to save profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadProfile();
    setError(null);
    setMessage(null);
  };

  return (
    <div className="profile-page" style={{ 
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
          }}>My Profile</h1>
          <p style={{ 
            color: colors.muted, 
            marginTop: 6, 
            fontSize: 'clamp(0.9rem, 2vw, 1rem)' 
          }}>Manage your account information and preferences</p>
        </div>
        <div style={{ 
          background: user?.role === 'admin' ? colors.danger : colors.primary, 
          color: colors.surface, 
          padding: '8px 16px', 
          borderRadius: radii.md, 
          fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
          fontWeight: 600 
        }}>
          {user?.role?.toUpperCase() || 'USER'}
        </div>
      </div>

      <div className="main-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1fr)', 
        gap: 'clamp(16px, 3vw, 24px)', 
        alignItems: 'start',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <div style={{ minWidth: 0, width: '100%' }}>
          {/* Profile Preview Card */}
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
            }}>👤 Profile Preview</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'auto 1fr', 
              gap: 'clamp(12px, 3vw, 20px)', 
              alignItems: 'center'
            }}>
              <div style={{ 
                width: 'clamp(60px, 12vw, 80px)', 
                height: 'clamp(60px, 12vw, 80px)', 
                borderRadius: '50%', 
                background: profile.photo ? `url(${profile.photo})` : colors.primary + '20', 
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                border: `2px solid ${colors.border}`,
                fontSize: 'clamp(1.5rem, 3vw, 2rem)'
              }}>
                {!profile.photo && (user?.role === 'admin' ? '👑' : '👤')}
              </div>
              <div>
                <div style={{ 
                  fontWeight: 700, 
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                  marginBottom: '4px'
                }}>{name || 'No Name Set'}</div>
                <div style={{ 
                  color: colors.muted, 
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  marginBottom: '4px'
                }}>{email}</div>
                {profile.company && (
                  <div style={{ 
                    color: colors.muted, 
                    fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)' 
                  }}>🏢 {profile.company}</div>
                )}
              </div>
            </div>
          </div>

          <div style={{ background: colors.surface, padding: 'clamp(16px, 3vw, 24px)', borderRadius: radii.md, boxShadow: shadows.card, border: `1px solid ${colors.border}` }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: colors.muted, fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Loading profile...</div>
            ) : (
              <form onSubmit={handleSave}>
                <h3 style={{ 
                  margin: '0 0 20px 0', 
                  fontWeight: 700, 
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' 
                }}>Basic Information</h3>
                
                {/* Basic Info Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: 'clamp(12px, 3vw, 16px)', 
                  marginBottom: 20 
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 6, 
                      fontWeight: 600, 
                      fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' 
                    }}>Display Name *</label>
                    <input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Your display name" 
                      required
                      style={{ 
                        width: '100%', 
                        padding: 'clamp(10px, 2.5vw, 12px)', 
                        borderRadius: radii.md, 
                        border: `1px solid ${colors.border}`, 
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        boxSizing: 'border-box'
                      }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Email Address *</label>
                    <input 
                      type="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="your@email.com" 
                      required
                      style={{ width: '100%', padding: 'clamp(10px, 2.5vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Full Name</label>
                  <input 
                    value={profile.fullName} 
                    onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))} 
                    placeholder="Your full legal name" 
                    style={{ width: '100%', padding: 'clamp(10px, 2.5vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                  />
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: 'clamp(12px, 3vw, 16px)', 
                  marginBottom: 20 
                }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Phone Number</label>
                    <input 
                      value={profile.phone} 
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))} 
                      placeholder="+1 (555) 123-4567" 
                      style={{ width: '100%', padding: 'clamp(10px, 2.5vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Company</label>
                    <input 
                      value={profile.company} 
                      onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))} 
                      placeholder="Your company name" 
                      style={{ width: '100%', padding: 'clamp(10px, 2.5vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Address</label>
                  <textarea 
                    value={profile.address} 
                    onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))} 
                    placeholder="123 Main St, City, State 12345" 
                    rows={3}
                    style={{ width: '100%', padding: 'clamp(10px, 2.5vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box', resize: 'vertical' }} 
                  />
                </div>

                {/* Advanced Section Toggle */}
                <div style={{ marginBottom: 20 }}>
                  <button 
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: colors.primary, 
                      fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {showAdvanced ? '▼' : '▶'} Advanced Settings
                  </button>
                </div>

                {/* Advanced Settings */}
                {showAdvanced && (
                  <div style={{ 
                    background: colors.background, 
                    padding: 'clamp(16px, 3vw, 20px)', 
                    borderRadius: radii.md, 
                    border: `1px solid ${colors.border}`,
                    marginBottom: 20
                  }}>
                    <h4 style={{ 
                      margin: '0 0 16px 0', 
                      fontWeight: 600, 
                      fontSize: 'clamp(0.9rem, 2.2vw, 1rem)' 
                    }}>Additional Information</h4>
                    
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Profile Photo URL</label>
                      <input 
                        value={profile.photo} 
                        onChange={(e) => setProfile(prev => ({ ...prev, photo: e.target.value }))} 
                        placeholder="https://example.com/photo.jpg" 
                        style={{ width: '100%', padding: 'clamp(10px, 2.5vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Website</label>
                      <input 
                        value={profile.website} 
                        onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))} 
                        placeholder="https://yourwebsite.com" 
                        style={{ width: '100%', padding: 'clamp(10px, 2.5vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box' }} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Bio</label>
                      <textarea 
                        value={profile.bio} 
                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))} 
                        placeholder="Tell us about yourself..." 
                        rows={4}
                        style={{ width: '100%', padding: 'clamp(10px, 2.5vw, 12px)', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', boxSizing: 'border-box', resize: 'vertical' }} 
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: 'clamp(8px, 2vw, 12px)', 
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap'
                }}>
                  <button 
                    type="button" 
                    onClick={handleReset} 
                    disabled={saving}
                    style={{ 
                      padding: 'clamp(10px, 2.5vw, 12px) clamp(14px, 3vw, 16px)', 
                      borderRadius: radii.md, 
                      background: colors.border, 
                      border: 'none', 
                      fontWeight: 600, 
                      fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                      opacity: saving ? 0.6 : 1
                    }}
                  >Reset</button>
                  <button 
                    disabled={saving} 
                    type="submit" 
                    style={{ 
                      padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 3.5vw, 20px)', 
                      borderRadius: radii.md, 
                      background: colors.primary, 
                      color: colors.surface, 
                      border: 'none', 
                      fontWeight: 700, 
                      fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
                      boxShadow: shadows.soft, 
                      opacity: saving ? 0.7 : 1 
                    }}
                  >{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            )}

            {/* Success/Error Messages */}
            {error && (
              <div style={{ 
                color: colors.danger, 
                marginTop: 16, 
                padding: 'clamp(10px, 2.5vw, 12px)', 
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
                padding: 'clamp(10px, 2.5vw, 12px)', 
                background: colors.success + '10', 
                borderRadius: radii.md, 
                border: `1px solid ${colors.success}30`,
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
              }}>{message}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;