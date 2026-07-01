import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the Context
const AuthContext = createContext();

// Build the Provider Component
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);


  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const login = (newToken) => {
    localStorage.setItem('token', newToken); 
    setToken(newToken);                     
  };

  
  const logout = () => {
    localStorage.removeItem('token');      
    setToken(null);                         
  };

  return (
    <AuthContext.Provider value={{ 
        token, 
        isAuthenticated: !!token, 
        login, 
        logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export a Custom Hook for easy usage
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};