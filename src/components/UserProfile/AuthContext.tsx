import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../../lib/api-client';
import { useCurrentUser, useLogout } from '../../hooks/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'ONLINE' | 'OFFLINE' | 'AWAY';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!apiClient.getAccessToken());
  
  const { data: user, isLoading, isError } = useCurrentUser();
  const { mutate: logoutMutation } = useLogout();

  useEffect(() => {
    if (isError) {
      setIsAuthenticated(false);
    }
    if (user) {
      setIsAuthenticated(true);
    }
  }, [user, isError]);

  const logout = () => {
    logoutMutation(undefined, {
      onSettled: () => {
        setIsAuthenticated(false);
        window.location.href = '/signin';
      },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}