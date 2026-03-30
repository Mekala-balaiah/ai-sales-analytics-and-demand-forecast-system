import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/apiConfig';

// Eye icon (password visible)
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// Eye-off icon (password hidden)
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const url = isLogin ? `${API_BASE_URL}/api/auth/login` : `${API_BASE_URL}/api/auth/register`;
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication failed');
      
      login(data.user, data.token);
      navigate('/select-business');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container" style={{
      background: 'linear-gradient(135deg, var(--bg-color) 0%, #161b22 100%)'
    }}>
      <div className="glass-panel auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--accent-color)' }}>AI Demand Forecast</h2>
          <p>{isLogin ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>

        {error && <div className="badge badge-danger mb-3" style={{ display: 'block', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input 
              type="text" 
              name="name" 
              placeholder="Full Name" 
              className="input-control" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          )}
          <input 
            type="email" 
            name="email" 
            placeholder="Email Address" 
            className="input-control" 
            value={formData.email} 
            onChange={handleChange} 
            required 
          />

          {/* Password field with show/hide toggle */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <input 
              type={showPassword ? 'text' : 'password'}
              name="password" 
              placeholder="Password" 
              className="input-control" 
              value={formData.password} 
              onChange={handleChange} 
              required
              style={{ marginBottom: 0, paddingRight: '44px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              title={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '4px',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-color)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
