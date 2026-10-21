import React, { useEffect, useState } from 'react';
import { getMe, updateMe } from '../../api/users';
import { colors, fonts } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';

const CustomerProfile = () => {
  const { setUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getMe();
        const u = res?.data || res;
        setName(u?.name || '');
        setEmail(u?.email || '');
        setAddress(u?.address || u?.profile?.address || '');
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        name,
        email,
        address,
        profile: { address },
        ...(password ? { password } : {}),
      };
      const res = await updateMe(payload);
      const updated = res?.data || res;
      setMessage('Profile updated');
      setPassword('');
      if (updated) {
        localStorage.setItem('auth_user', JSON.stringify(updated));
        setUser(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: fonts.main }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, marginBottom: 12 }}>Profile / Account Settings</h1>
      <p style={{ color: colors.muted, marginBottom: 14 }}>Update your personal info and password.</p>
      {error && <div style={{ color: colors.danger, marginBottom: 10 }}>{error}</div>}
      {message && <div style={{ color: colors.secondary, marginBottom: 10 }}>{message}</div>}
      <form onSubmit={handleSave} style={{ background: colors.surface, padding: 16, borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.04)', maxWidth: 520 }}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${colors.border}` }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${colors.border}` }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Address</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${colors.border}` }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Password (leave blank to keep current)</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${colors.border}` }} />
        </div>
        <button disabled={loading} type="submit" style={{ padding: '10px 14px', borderRadius: 8, background: colors.primary, color: colors.surface, border: 'none', fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default CustomerProfile;




