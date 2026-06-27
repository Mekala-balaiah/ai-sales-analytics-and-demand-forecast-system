import React, { useState, useEffect, useContext } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import { AnalyticsContext } from '../context/AnalyticsContext';
import { API_BASE_URL } from '../utils/apiConfig';

const UploadCenter = () => {
  const { token } = useContext(AuthContext);
  const { activeBusiness } = useContext(BusinessContext);
  const { refreshAnalytics } = useContext(AnalyticsContext);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    if (!activeBusiness || !token) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/upload/${activeBusiness._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch upload history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    setMessage(null);
  }, [activeBusiness, token]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage('Parsing data and generating AI insights...');
    setIsError(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload/${activeBusiness._id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ? `${data.message}: ${data.error}` : data.message);
      }
      
      setMessage('Data processed successfully! Dashboard is now updated.');
      setIsError(false);
      setFile(null);
      await refreshAnalytics();
      await fetchHistory();
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this upload? This will recalculate all dashboard metrics.")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/upload/${activeBusiness._id}/file/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setMessage('File deleted and dashboard recalculated successfully!');
      setIsError(false);
      await refreshAnalytics();
      await fetchHistory();
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("WARNING: Are you sure you want to reset all data for this business? This will delete all uploaded files and clear the dashboard completely.")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/upload/${activeBusiness._id}/reset`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setMessage('All business data has been reset successfully!');
      setIsError(false);
      await refreshAnalytics();
      await fetchHistory();
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    }
  };

  return (
    <div>
      <h1 className="mb-2">Upload Center</h1>
      <p className="mb-4">Upload your sales dataset (.csv, .xlsx, .json, or WhatsApp Chat .txt). Our AI will parse and process it automatically.</p>
      
      <div 
        className="glass-panel" 
        style={{ 
          border: '2px dashed var(--border-color)', 
          textAlign: 'center', 
          padding: '64px 32px',
          transition: 'all 0.3s'
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <UploadCloud size={64} style={{ color: 'var(--accent-color)', marginBottom: '16px' }} />
        <h3 className="mb-2">Drag & drop your file here</h3>
        <p className="mb-4 text-secondary">Excel, CSV, JSON, TXT files supported.</p>
        
        <input 
          type="file" 
          id="file-upload" 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
          accept=".csv, .xlsx, .json, .txt"
        />
        <label htmlFor="file-upload" className="btn-secondary">
          Browse Files
        </label>
        
        {file && (
          <div style={{ marginTop: '24px', background: 'var(--bg-color)', padding: '12px', borderRadius: '8px', display: 'inline-block' }}>
            <p><strong>Selected File:</strong> {file.name}</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button 
          className="btn-primary" 
          style={{ fontSize: '1.1rem', padding: '12px 32px' }}
          disabled={!file || uploading}
          onClick={handleUpload}
        >
          {uploading ? 'Processing Data...' : 'Start AI Analysis'}
        </button>
      </div>

      {message && (
        <div 
          className="glass-panel mt-4" 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', 
            background: isError ? 'rgba(248, 81, 73, 0.1)' : 'rgba(46, 160, 67, 0.1)',
            borderColor: isError ? 'var(--danger-color)' : 'var(--success-color)',
            color: isError ? 'var(--danger-color)' : 'var(--success-color)'
          }}
        >
          {isError ? <AlertCircle /> : <CheckCircle />}
          {message}
        </div>
      )}

      {/* Upload History Section */}
      <div className="glass-panel mt-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Upload History</h3>
          {history.length > 0 && (
            <button 
              className="btn-danger" 
              style={{ padding: '6px 12px', fontSize: '0.9rem' }}
              onClick={handleReset}
            >
              Reset All Data
            </button>
          )}
        </div>
        
        {loadingHistory ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading history...</p>
        ) : history.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No files uploaded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 8px' }}>File Name</th>
                  <th style={{ padding: '12px 8px' }}>Type</th>
                  <th style={{ padding: '12px 8px' }}>Records</th>
                  <th style={{ padding: '12px 8px' }}>Uploaded At</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map(item => (
                  <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>{item.fileName}</td>
                    <td style={{ padding: '12px 8px' }}><span className="badge" style={{ padding: '4px 8px', background: 'var(--border-color)', borderRadius: '4px', fontSize: '0.8rem' }}>{item.fileType.toUpperCase()}</span></td>
                    <td style={{ padding: '12px 8px' }}>{item.recordCount.toLocaleString()}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {new Date(item.uploadedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <button 
                        style={{ 
                          background: 'none', border: 'none', cursor: 'pointer', 
                          color: 'var(--danger-color)', display: 'inline-flex', alignItems: 'center',
                          padding: '4px', borderRadius: '4px'
                        }}
                        onClick={() => handleDelete(item._id)}
                        title="Delete Upload"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadCenter;
