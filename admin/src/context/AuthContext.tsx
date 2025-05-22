import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem('authToken');
    const expiry = localStorage.getItem('tokenExpiry');
    if (token && expiry) {
      return new Date().getTime() < parseInt(expiry);
    }
    return false;
  });

  const login = async (username: string, password: string) => {
    try {
      const response = await api.login(username, password);
      const { token } = response;
      const expiry = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours
      localStorage.setItem('authToken', token);
      localStorage.setItem('tokenExpiry', expiry.toString());
      setIsAuthenticated(true);
    } catch (error) {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiry');
    setIsAuthenticated(false);
  };

  // Check token expiry periodically
  useEffect(() => {
    const checkAuth = () => {
      const expiry = localStorage.getItem('tokenExpiry');
      if (expiry && new Date().getTime() >= parseInt(expiry)) {
        logout();
      }
    };

    const interval = setInterval(checkAuth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
