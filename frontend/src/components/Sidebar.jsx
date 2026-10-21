import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, Package, Grid3X3, Truck, ShoppingCart, Users, Settings, LogOut,
  Menu, X, AlertTriangle, BarChart3, FileText, Sliders, User
} from 'lucide-react';
import { colors, radii } from '../styles/theme';

const getMenuItems = (userRole) => {
  const basePath = userRole === 'manager' ? '/manager-dashboard' : '/admin-dashboard';
  
  const allItems = [
    { name: "Dashboard", path: basePath, icon: Home, isParent: true, roles: ['admin', 'manager', 'viewer'] },
    { name: "Products", path: `${basePath}/products`, icon: Package, roles: ['admin', 'viewer'] },
    { name: "Products", path: `${basePath}/products`, icon: Package, roles: ['manager'] },
    { name: "Categories", path: "/admin-dashboard/categories", icon: Grid3X3, roles: ['admin'] },
    { name: "Suppliers", path: "/admin-dashboard/suppliers", icon: Truck, roles: ['admin'] },
    { name: "Orders", path: "/admin-dashboard/orders", icon: ShoppingCart, roles: ['admin'] },
    { name: "Stock In", path: `${basePath}/stock-in`, icon: Package, roles: ['manager'] },
    { name: "Stock Out", path: `${basePath}/stock-out`, icon: ShoppingCart, roles: ['manager'] },
    { name: "Stock Adjustment", path: `${basePath}/stock-adjustments`, icon: Sliders, roles: ['manager'] },
    { name: "Physical Count", path: `${basePath}/physical-count`, icon: Grid3X3, roles: ['manager'] },
    { name: "Movement History", path: `${basePath}/movement-history`, icon: BarChart3, roles: ['manager'] },
    { name: "Low Stock Items", path: `${basePath}/low-stock`, icon: AlertTriangle, alert: true, roles: ['manager'] },
    { name: "Purchase Order", path: `${basePath}/purchase-orders`, icon: FileText, roles: ['manager'] },
    { name: "Reports", path: `${basePath}/reports`, icon: BarChart3, roles: ['admin', 'manager', 'viewer'] },
    { name: "Users", path: "/admin-dashboard/users", icon: Users, roles: ['admin'] },
  ];
  
  return allItems.filter(item => item.roles.includes(userRole));
};

const Sidebar = ({ onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    const onResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      setIsCollapsed(!desktop);
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    onToggle?.(isCollapsed);
  }, [isCollapsed, onToggle]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'fixed',
          top: '16px',
          left: isCollapsed ? '76px' : '256px',
          zIndex: 1000,
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1e293b',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: radii.md,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}
        className="btn-animate hover-lift"
      >
        {isCollapsed ? <Menu size={18} /> : <X size={18} />}
      </button>

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: isCollapsed ? '60px' : '240px',
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          transition: 'all 0.3s ease',
          zIndex: 999,
          boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
          transform: !isDesktop && isCollapsed ? 'translateX(-100%)' : 'translateX(0)'
        }}

      >
        {/* Logo Section */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center'
        }}>
          <NavLink to={user?.role === 'manager' ? '/manager-dashboard' : '/admin-dashboard'} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: user?.role === 'admin' ? colors.primary :
                         user?.role === 'manager' ? '#16a34a' :
                         user?.role === 'viewer' ? '#8b5cf6' : colors.primary,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              transition: 'transform 0.2s ease'
            }}>
              <Package size={20} />
            </div>
            {!isCollapsed && (
              <div style={{ opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.3s ease' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Inventory Pro</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7, textTransform: 'capitalize' }}>
                  {user?.role} Dashboard
                </p>
              </div>
            )}
          </NavLink>
        </div>

        {/* Navigation Section */}
        <nav style={{ padding: '16px 8px', overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '4px' }}>
            {getMenuItems(user?.role || 'viewer').map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={index}>
                  <NavLink
                    to={item.path}
                    end={item.isParent}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      padding: isCollapsed ? '8px' : '12px',
                      width: isCollapsed ? '36px' : 'auto',
                      height: isCollapsed ? '36px' : 'auto',
                      borderRadius: radii.md,
                      textDecoration: 'none',
                      color: 'inherit',
                      background: isActive ? colors.primary + '30' : 'transparent',
                      border: isActive ? `1px solid ${colors.primary}50` : '1px solid transparent',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      margin: isCollapsed ? '0 auto' : '0'
                    })}
                    className="btn-animate hover-lift"
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: isCollapsed ? 0 : '12px',
                      transition: 'transform 0.2s ease'
                    }}>
                      <Icon size={18} />
                    </div>
                    {!isCollapsed && (
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        opacity: isCollapsed ? 0 : 1,
                        transition: 'opacity 0.3s ease'
                      }}>
                        {item.name}
                      </span>
                    )}
                    {item.alert && !isCollapsed && (
                      <div style={{
                        marginLeft: 'auto',
                        width: '6px',
                        height: '6px',
                        background: colors.warning,
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite'
                      }} />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Profile & Logout Section */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'grid',
          gap: '8px'
        }}>
          <NavLink
            to={`${user?.role === 'manager' ? '/manager-dashboard' : '/admin-dashboard'}/profile`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: isCollapsed ? '8px' : '12px',
              width: isCollapsed ? '36px' : 'auto',
              height: isCollapsed ? '36px' : 'auto',
              borderRadius: radii.md,
              textDecoration: 'none',
              color: 'inherit',
              background: 'rgba(255,255,255,0.05)',
              transition: 'all 0.2s ease',
              margin: isCollapsed ? '0 auto' : '0'
            }}
            className="btn-animate hover-lift"
          >
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: isCollapsed ? 0 : '12px'
            }}>
              <User size={18} />
            </div>
            {!isCollapsed && (
              <div style={{ opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.3s ease' }}>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>Profile</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                  {user?.name || user?.email}
                </div>
              </div>
            )}
          </NavLink>
          
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: isCollapsed ? '8px' : '12px',
              width: isCollapsed ? '36px' : '100%',
              height: isCollapsed ? '36px' : 'auto',
              borderRadius: radii.md,
              background: colors.danger + '20',
              border: `1px solid ${colors.danger}30`,
              color: '#ff6b6b',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              margin: isCollapsed ? '0 auto' : '0'
            }}
            className="btn-animate hover-lift"
          >
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: isCollapsed ? 0 : '12px'
            }}>
              <LogOut size={18} />
            </div>
            {!isCollapsed && (
              <span style={{
                fontSize: '14px',
                fontWeight: 500,
                opacity: isCollapsed ? 0 : 1,
                transition: 'opacity 0.3s ease'
              }}>
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {!isDesktop && !isCollapsed && (
        <div
          onClick={() => setIsCollapsed(true)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998
          }}
        />
      )}
    </>
  );
};

export default Sidebar;
