import { createContext, useContext, useState, useEffect } from 'react';
import { checkAdmin, adminLogin as apiLogin, adminLogout as apiLogout } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      const adminData = await checkAdmin();
      setAdmin(adminData);
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    const data = await apiLogin(username, password);
    const adminData = await checkAdmin();
    setAdmin(adminData);
    return data;
  };

  const logout = () => {
    apiLogout();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
