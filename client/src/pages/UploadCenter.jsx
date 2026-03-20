import React, { useState, useContext } from 'react';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
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
      if (!res.ok) throw new Error(data.message);
      
      setMessage('Data processed successfully! Dashboard is now updated.');
      setIsError(false);
      setFile(null);
      await refreshAnalytics();
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    } finally {
      setUploading(false);
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
    </div>
  );
};

export default UploadCenter;
