import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Menu } from 'lucide-react';

const TopNav = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <header className="glass-panel" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '16px 24px', 
      marginBottom: '32px'
    }}>
      <button className="btn-secondary menu-btn" onClick={toggleSidebar} style={{ padding: '8px', border: 'none' }}>
        <Menu size={24} color="var(--text-primary)" />
      </button>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginLeft: 'auto' }}>
        <div style={{ color: 'var(--text-secondary)'}} className="hide-on-mobile">
          Hello, <strong>{user?.name || 'User'}</strong>
        </div>
        <button className="btn-secondary" onClick={toggleTheme} style={{ padding: '6px 12px' }}>
          Theme
        </button>
        <button className="btn-secondary" onClick={logout} style={{ padding: '6px 12px', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default TopNav;
