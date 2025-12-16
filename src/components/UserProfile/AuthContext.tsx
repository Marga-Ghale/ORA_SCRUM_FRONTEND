// src/components/UserProfile/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '../../lib/api-client';
import { useCurrentUser, useLogout } from '../../hooks/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'online' | 'offline' | 'away';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => apiClient.getAccessToken());
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!token);

  const { data: user, isLoading, isError } = useCurrentUser();
  const { mutate: logoutMutation } = useLogout();

  // Sync token state with apiClient
  useEffect(() => {
    const interval = setInterval(() => {
      const currentToken = apiClient.getAccessToken();
      if (currentToken !== token) {
        setToken(currentToken);
        setIsAuthenticated(!!currentToken);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (isError) {
      setIsAuthenticated(false);
      setToken(null);
    }
    if (user) {
      setIsAuthenticated(true);
      setToken(apiClient.getAccessToken());
    }
  }, [user, isError]);

  const logout = useCallback(() => {
    logoutMutation(undefined, {
      onSettled: () => {
        apiClient.clearTokens();
        setIsAuthenticated(false);
        setToken(null);
        window.location.href = '/signin';
      },
    });
  }, [logoutMutation]);

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        token,
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
