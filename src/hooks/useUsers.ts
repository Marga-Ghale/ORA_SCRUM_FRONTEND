// src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { queryKeys } from '../lib/query-client';

// ============================================
// Types
// ============================================

export type UserStatus = 'online' | 'offline' | 'away' | 'busy';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'online' | 'offline' | 'away';
  createdAt: string;

  // Add these new fields
  phone?: string;
  bio?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

// Update your UpdateUserRequest type
export interface UpdateUserRequest {
  name?: string;
  avatar?: string;
  status?: UserStatus;
  phone?: string;
  bio?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

// ============================================
// API Functions
// ============================================

const userApi = {
  getCurrentUser: () => apiClient.get<User>('/users/me'),

  updateCurrentUser: (data: UpdateUserRequest) => apiClient.put<User>('/users/me', data),

  searchUsers: (query: string) =>
    apiClient.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`),
};

// ============================================
// Query Hooks
// ============================================

export const useCurrentUser = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: userApi.getCurrentUser,
    enabled: options?.enabled ?? true,
    staleTime: 30000, // 30 seconds
  });
};

export const useSearchUsers = (query: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.users.search(query),
    queryFn: () => userApi.searchUsers(query),
    enabled: options?.enabled ?? query.length >= 2,
    staleTime: 60000, // 1 minute
  });
};

// ============================================
// Mutation Hooks
// ============================================

export const useUpdateCurrentUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updateCurrentUser,
    onSuccess: (data) => {
      // Update the current user cache
      queryClient.setQueryData(queryKeys.users.me(), data);

      // Invalidate search queries that might include this user
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

// ============================================
// Status-specific hook (uses user update)
// ============================================

export const useUpdateStatus = () => {
  const updateUser = useUpdateCurrentUser();

  return {
    mutate: (status: UserStatus) => {
      updateUser.mutate({ status });
    },
    mutateAsync: async (status: UserStatus) => {
      return updateUser.mutateAsync({ status });
    },
    isPending: updateUser.isPending,
    isError: updateUser.isError,
    error: updateUser.error,
  };
};
