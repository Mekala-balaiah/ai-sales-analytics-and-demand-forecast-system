import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Upload, Lightbulb, TrendingUp, Settings, Activity, User as UserIcon } from 'lucide-react';
import { BusinessContext } from '../context/BusinessContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { activeBusiness } = useContext(BusinessContext);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <BarChart3 size={20} /> },
    { name: 'Upload Dataset', path: '/upload', icon: <Upload size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <Activity size={20} /> },
    { name: 'Forecast', path: '/forecast', icon: <TrendingUp size={20} /> },
    { name: 'AI Chat Assistant', path: '/insights', icon: <Lightbulb size={20} /> }
  ];

  const bottomItems = [
    { name: 'Profile', path: '/profile', icon: <UserIcon size={18} /> },
    { name: 'Switch Business', path: '/select-business', icon: <Settings size={18} /> }
  ];

  return (
    <>
    <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)}></div>
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div style={{ padding: '0 24px 32px 24px' }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Activity size={24} /> AI Forecast
        </h2>
        {activeBusiness && (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px'}}>
            {activeBusiness.businessName}
          </p>
        )}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px' }}>
        {navItems.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setIsOpen(false)}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: isActive ? 'var(--bg-color)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-color)' : 'transparent',
              boxShadow: isActive ? 'var(--neon-glow)' : 'none',
              transition: 'all 0.2s',
              fontWeight: isActive ? '600' : '400'
            })}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      <div style={{ marginTop: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {bottomItems.map(item => (
           <NavLink
           key={item.name}
           to={item.path}
           onClick={() => setIsOpen(false)}
           style={({ isActive }) => ({
             display: 'flex',
             alignItems: 'center',
             gap: '12px',
             padding: '10px 16px',
             borderRadius: '8px',
             textDecoration: 'none',
             color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
             transition: 'all 0.2s'
           })}
         >
           {item.icon}
           {item.name}
         </NavLink>
        ))}
      </div>
    </div>
    </>
  );
};

export default Sidebar;
