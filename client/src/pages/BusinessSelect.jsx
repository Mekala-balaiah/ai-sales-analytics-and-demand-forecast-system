import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import { Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiConfig';

const BusinessSelect = () => {
  const [businesses, setBusinesses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newBiz, setNewBiz] = useState({ businessName: '', industryType: '' });
  const [loading, setLoading] = useState(true);

  const { token } = useContext(AuthContext);
  const { selectBusiness } = useContext(BusinessContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/business`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setBusinesses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/business`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBiz)
      });
      const data = await res.json();
      setBusinesses([data, ...businesses]);
      setShowCreate(false);
      setNewBiz({ businessName: '', industryType: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = (biz) => {
    selectBusiness(biz);
    navigate('/');
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this business? All associated data will be lost forever.")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/business/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setBusinesses(businesses.filter(b => b._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px' }}>
        <h2 className="mb-4 text-center" style={{ textAlign: 'center' }}>Select a Business</h2>
        
        {loading ? (
          <p style={{ textAlign: 'center' }}>Loading...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            {businesses.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No businesses found. Please create one.</p>}
            {businesses.map(biz => (
              <div 
                key={biz._id} 
                className="glass-panel" 
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)'
                }}
                onClick={() => handleSelect(biz)}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem'}}>{biz.businessName}</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem'}}>{biz.industryType}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <button className="btn-primary">Enter</button>
                  <button 
                    style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '8px' }}
                    onClick={(e) => handleDelete(e, biz._id)}
                    title="Delete Business"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
          {!showCreate ? (
            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setShowCreate(true)}>
              + Create New Business
            </button>
          ) : (
            <form onSubmit={handleCreate}>
              <h3 className="mb-3">Create New Business</h3>
              <input 
                className="input-control" 
                placeholder="Business Name" 
                value={newBiz.businessName} 
                onChange={(e) => setNewBiz({ ...newBiz, businessName: e.target.value })} 
                required 
              />
              <input 
                className="input-control" 
                placeholder="Industry (e.g., Retail, SaaS)" 
                value={newBiz.industryType} 
                onChange={(e) => setNewBiz({ ...newBiz, industryType: e.target.value })} 
                required 
              />
              <div style={{ display: 'flex', gap: '16px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Create</button>
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessSelect;
