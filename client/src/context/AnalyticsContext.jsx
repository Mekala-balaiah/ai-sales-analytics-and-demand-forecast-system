import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { BusinessContext } from './BusinessContext';

export const AnalyticsContext = createContext();

export const AnalyticsProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const { activeBusiness } = useContext(BusinessContext);
  
  const [appState, setAppState] = useState({
    analytics: null,
    aiInsights: [],
    forecastResults: [],
    loading: true,
    error: null
  });

  const fetchAnalytics = async () => {
    if (!activeBusiness || !token) {
      setAppState(prev => ({ ...prev, loading: false }));
      return;
    }
    
    setAppState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const res = await fetch(`http://localhost:5000/api/analytics/${activeBusiness._id}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to fetch analytics state.");
      
      const json = await res.json();
      
      setAppState({
        analytics: json,
        aiInsights: json.insights || [],
        forecastResults: json.predictions || [],
        loading: false,
        error: null
      });
    } catch (err) {
      setAppState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeBusiness, token]);

  return (
    <AnalyticsContext.Provider value={{ appState, refreshAnalytics: fetchAnalytics }}>
      {children}
    </AnalyticsContext.Provider>
  );
};
