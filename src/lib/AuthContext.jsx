import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { neonAuth } from '@/api/neonAuth';
import { base44 } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null); // 'PENDING_APPROVAL' or message

  const checkSession = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const session = await neonAuth.getSession();
      if (!session?.user) { setUser(null); setIsAuthenticated(false); return; }
      const profile = await base44.auth.getProfile();
      setUser(profile);
      setIsAuthenticated(true);
    } catch (e) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(e.message);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const logout = async () => {
    await neonAuth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings: false, authError,
      appPublicSettings: null, logout, navigateToLogin: () => {}, checkSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
