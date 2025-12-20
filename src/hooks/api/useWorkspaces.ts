// src/hooks/useWorkspaces.ts
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
  list: () => apiClient.get<WorkspaceResponse[]>('/workspaces'),

  getById: (id: string) => apiClient.get<WorkspaceResponse>(`/workspaces/${id}`),

  create: (data: CreateWorkspaceRequest) => apiClient.post<WorkspaceResponse>('/workspaces', data),

  update: (id: string, data: UpdateWorkspaceRequest) =>
    apiClient.put<WorkspaceResponse>(`/workspaces/${id}`, data),

  delete: (id: string) => apiClient.delete(`/workspaces/${id}`),
};

// ============================================
// Query Hooks
// ============================================

export const useWorkspaces = (p0?: { enabled: boolean; }) => {
  return useQuery({
    queryKey: queryKeys.workspaces.list(),
    queryFn: workspaceApi.list,
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
    },
  });
};

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      queryClient.removeQueries({ queryKey: queryKeys.workspaces.detail(id) });
    },
  });
};
