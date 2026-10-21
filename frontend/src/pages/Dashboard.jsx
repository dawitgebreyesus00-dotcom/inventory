import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { colors } from '../styles/theme';

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  useEffect(() => {
    const onResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      setSidebarCollapsed(!desktop);
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar onToggle={setSidebarCollapsed} />
      <main
        style={{
          flex: 1,
          minHeight: '100vh',
          padding: 28,
          background: colors.background,
          marginLeft: sidebarCollapsed ? '60px' : '240px',
          transition: 'margin-left 0.3s ease',
          width: sidebarCollapsed ? 'calc(100vw - 60px)' : 'calc(100vw - 240px)'
        }}
      >
        <div style={{
          maxWidth: sidebarCollapsed ? '1200px' : 'none',
          margin: sidebarCollapsed ? '0 auto' : '0',
          transition: 'all 0.3s ease'
        }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
