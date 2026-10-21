import React, { useState } from 'react';
import { colors, fonts, radii, shadows } from "../styles/theme";
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        { email, password }
      );

      if (response?.data?.success) {
        await login(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken
        );

        if (response.data.user?.role === "admin") navigate("/admin-dashboard");
        else if (response.data.user?.role === "manager") navigate("/manager-dashboard");
        else navigate("/customer");
      } else {
        setError(response?.data?.message || "Login failed. Please check credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.data?.message) setError(err.response.data.message);
      else setError("Network error or server unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.background, fontFamily: fonts.main }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ width: 420, padding: 28 }}>
          <h2 style={{ fontWeight: 800, fontSize: 30, color: colors.text, marginBottom: 24, fontFamily: fonts.heading, textAlign: 'center' }}>Inventory Management System</h2>
          <div style={{ background: colors.surface, boxShadow: shadows.card, padding: 28, borderRadius: radii.lg, border: `1px solid ${colors.border}` }}>
            <h3 style={{ marginTop: 0, marginBottom: 18, fontSize: 20, color: colors.text, fontWeight: 700 }}>Login</h3>
            {error && <div style={{ background: '#fee2e2', color: colors.danger, padding: 10, borderRadius: radii.md, marginBottom: 14, border: `1px solid ${colors.danger}22` }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: colors.text }}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Enter email" style={{ width: '100%', padding: 12, borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 14 }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: colors.text }}>Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="Enter password" style={{ width: '100%', padding: 12, borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: 14 }} />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: radii.md, background: colors.primary, color: colors.surface, border: 'none', fontWeight: 700, boxShadow: shadows.soft, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Logging in...' : 'Login'}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
