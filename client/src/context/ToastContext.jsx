import React, { createContext, useState, useCallback, useContext } from 'react';
import { default as Alert } from 'lucide-react/dist/esm/icons/alert-circle';
import { default as Check } from 'lucide-react/dist/esm/icons/check-circle';
import { default as Info } from 'lucide-react/dist/esm/icons/info';

export const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000); // 5 sec duration
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{
             borderLeft: `4px solid ${t.type === 'success' ? 'var(--success-color)' : t.type === 'error' ? 'var(--danger-color)' : 'var(--accent-color)'}`
          }}>
            {t.type === 'success' && <Check size={18} color="var(--success-color)" />}
            {t.type === 'error' && <Alert size={18} color="var(--danger-color)" />}
            {t.type === 'info' && <Info size={18} color="var(--accent-color)" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
