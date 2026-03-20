import React, { createContext, useState, useEffect } from "react";

export const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const [activeBusiness, setActiveBusiness] = useState(() => {
    const stored = localStorage.getItem("activeBusiness");
    return stored ? JSON.parse(stored) : null;
  });

  // Keep an effect just in case, but rely on synchronous state initialization
  useEffect(() => {
    const stored = localStorage.getItem("activeBusiness");
    if (stored && !activeBusiness) {
      setActiveBusiness(JSON.parse(stored));
    }
  }, []);

  const selectBusiness = (business) => {
    localStorage.setItem("activeBusiness", JSON.stringify(business));
    setActiveBusiness(business);
  };

  const clearBusiness = () => {
    localStorage.removeItem("activeBusiness");
    setActiveBusiness(null);
  };

  return (
    <BusinessContext.Provider value={{ activeBusiness, selectBusiness, clearBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
};
