// src/hooks/api/useWorkspaces.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { queryKeys } from '../../lib/query-client';

// ============================================
// Types
// ============================================

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  visibility?: string;
  allowed_users?: string[];
  allowed_teams?: string[];
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  visibility?: string;
  allowed_users?: string[];
  allowed_teams?: string[];
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  owner_id: string;
  visibility?: string;
  allowed_users: string[];
  allowed_teams: string[];
  created_at: string;
  updated_at: string;
}

// ============================================
// API Functions
// ============================================

const workspaceApi = {
  // Get all workspaces (backend should filter by membership)
  list: () => apiClient.get<WorkspaceResponse[]>('/workspaces'),

  // Get workspaces where user is a member (direct membership)
  listMyWorkspaces: () => apiClient.get<WorkspaceResponse[]>('/workspaces/my'),

  getById: (id: string) => apiClient.get<WorkspaceResponse>(`/workspaces/${id}`),

  create: (data: CreateWorkspaceRequest) => apiClient.post<WorkspaceResponse>('/workspaces', data),

  update: (id: string, data: UpdateWorkspaceRequest) =>
    apiClient.put<WorkspaceResponse>(`/workspaces/${id}`, data),

  delete: (id: string) => apiClient.delete(`/workspaces/${id}`),
};

// ============================================
// Query Hooks
// ============================================

/**
 * Get all workspaces (should be filtered by backend based on user's access)
 */
export const useWorkspaces = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.workspaces.list(),
    queryFn: workspaceApi.list,
    enabled: options?.enabled ?? true,
  });
};

/**
 * Get only workspaces where user has direct membership
 * This is the PRIMARY hook to use in ProjectSidebar
 */
export const useMyWorkspaces = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.workspaces.list(),
    queryFn: workspaceApi.list,
    enabled: options?.enabled ?? true,
  });
};

export const useWorkspace = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.workspaces.detail(id),
    queryFn: () => workspaceApi.getById(id),
    enabled: options?.enabled ?? !!id,
  });
};

// ============================================
// Mutation Hooks
// ============================================

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.my() });
    },
  });
};

export const useUpdateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkspaceRequest }) =>
      workspaceApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.my() });
    },
  });
};

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.my() });
      queryClient.removeQueries({ queryKey: queryKeys.workspaces.detail(id) });
    },
  });
};
