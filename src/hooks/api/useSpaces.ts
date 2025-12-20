// src/hooks/useSpaces.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { queryKeys } from '../../lib/query-client';

// ============================================
// Types
// ============================================

export interface CreateSpaceRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateSpaceRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  visibility?: string;
  allowed_users?: string[];
  allowed_teams?: string[];
}

export interface SpaceResponse {
  projects: boolean;
  id: string;
  workspace_id: string;
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

const spaceApi = {
  listByWorkspace: (workspaceId: string) =>
    apiClient.get<SpaceResponse[]>(`/workspaces/${workspaceId}/spaces`),

  getById: (id: string) => apiClient.get<SpaceResponse>(`/spaces/${id}`),

  create: (workspaceId: string, data: CreateSpaceRequest) =>
    apiClient.post<SpaceResponse>(`/workspaces/${workspaceId}/spaces`, data),

  update: (id: string, data: UpdateSpaceRequest) =>
    apiClient.put<SpaceResponse>(`/spaces/${id}`, data),

  delete: (id: string) => apiClient.delete(`/spaces/${id}`),
};

// ============================================
// Query Hooks
// ============================================

export const useSpacesByWorkspace = (workspaceId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.spaces.byWorkspace(workspaceId),
    queryFn: () => spaceApi.listByWorkspace(workspaceId),
    enabled: options?.enabled ?? !!workspaceId,
  });
};

export const useSpace = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.spaces.detail(id),
    queryFn: () => spaceApi.getById(id),
    enabled: options?.enabled ?? !!id,
  });
};

// ============================================
// Mutation Hooks
// ============================================

export const useCreateSpace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: CreateSpaceRequest }) =>
      spaceApi.create(workspaceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.spaces.byWorkspace(variables.workspaceId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.all });
    },
  });
};

export const useUpdateSpace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSpaceRequest }) =>
      spaceApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.byWorkspace(data.workspace_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.all });
    },
  });
};

export const useDeleteSpace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: spaceApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.all });
      queryClient.removeQueries({ queryKey: queryKeys.spaces.detail(id) });
    },
  });
};
