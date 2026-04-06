import React, { createContext, useState, useEffect, useRef, useCallback } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const timeoutRef = useRef(null);

  // 1 hour in milliseconds
  const TIMEOUT_DURATION = 3600000;

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (token) {
      timeoutRef.current = setTimeout(() => {
        console.log("Inactivity timeout reached. Logging out...");
        logout();
      }, TIMEOUT_DURATION);
    }
  }, [token, logout]);

  useEffect(() => {
    // Basic Hydration
    if (token) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));

      // Setup inactivity tracking
      const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
      events.forEach(event => window.addEventListener(event, resetTimer));

      // Start initial timer
      resetTimer();

      return () => {
        events.forEach(event => window.removeEventListener(event, resetTimer));
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [token, resetTimer]);

  const login = (userData, jwtToken) => {
    localStorage.setItem("token", jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
