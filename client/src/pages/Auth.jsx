import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const url = isLogin ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/register';
    
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
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            className="input-control" 
            value={formData.password} 
            onChange={handleChange} 
            required 
          />
          
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
