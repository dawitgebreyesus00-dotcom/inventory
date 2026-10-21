import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { colors, fonts, radii, shadows } from '../../styles/theme';

const links = [
  { label: 'Dashboard', to: '/customer' },
  { label: 'Products / Catalog', to: '/customer/catalog' },
  { label: 'My Orders', to: '/customer/orders' },
  { label: 'Cart / Checkout', to: '/customer/cart' },
  { label: 'Profile', to: '/customer/profile' },
];

const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.background, fontFamily: fonts.main }}>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 100, color: '#1f2937', display: isDesktop ? 'none' : 'block' }}
      >
        {isOpen ? '✖' : '☰'}
      </button>

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          width: '16rem',
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          color: '#f8fafc',
          transform: (isDesktop || isOpen) ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div style={{ padding: 20, background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', fontFamily: fonts.heading, letterSpacing: '0.025em' }}>{user?.name || user?.email}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Customer Portal</div>
          </div>
        </div>
        <nav style={{ flex: 1, marginTop: 16, padding: '0 12px 80px 12px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {links.map((l) => (
              <li key={l.to} style={{ marginBottom: 8 }}>
                <NavLink
                  to={l.to}
                  end={l.to === '/customer'}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: radii.md,
                    background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: isActive ? '#60a5fa' : '#e2e8f0',
                    fontWeight: isActive ? 700 : 500,
                    textDecoration: 'none',
                    border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                    fontFamily: fonts.main,
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none',
                    fontSize: 14,
                    letterSpacing: '0.025em'
                  })}
                  onClick={() => !isDesktop && setIsOpen(false)}
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: 11, borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', fontFamily: fonts.main }} className="hidden md:block">
          <div style={{ opacity: 0.7 }}>Version 1.0.0</div>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && !isDesktop && (
        <div
          onClick={() => setIsOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
        />
      )}

      {/* Content wrapper shifted by sidebar on desktop */}
      <div style={{ marginLeft: isDesktop ? '16rem' : 0 }}>
        <header style={{ background: colors.nav, color: colors.navText, padding: '12px 18px', boxShadow: shadows.card }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 700, letterSpacing: '-0.3px', color: colors.navText }}>Customer Portal</div>
              <div style={{ fontSize: 13, opacity: 0.9, color: colors.navText }}>{user?.email}</div>
            </div>
            <div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 10px',
                  borderRadius: radii.md,
                  background: colors.danger,
                  color: colors.surface,
                  border: 'none',
                  fontWeight: 700,
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;


