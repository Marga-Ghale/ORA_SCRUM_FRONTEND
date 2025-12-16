import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-client';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'online' | 'offline' | 'away';
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Get current user
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: () => apiClient.get<User>('/users/me'),
    enabled: !!apiClient.getAccessToken(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      apiClient.post<AuthResponse>('/auth/login', credentials),
    onSuccess: (data) => {
      apiClient.setTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
    },
  });
}

// Register mutation
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => apiClient.post<AuthResponse>('/auth/register', data),
    onSuccess: (data) => {
      apiClient.setTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
    },
  });
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSuccess: () => {
      apiClient.clearTokens();
      queryClient.clear();
    },
    onError: () => {
      // Clear tokens even if logout fails
      apiClient.clearTokens();
      queryClient.clear();
    },
  });
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<User>) => apiClient.put<User>('/users/me', data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.user(), data);
    },
  });
}
