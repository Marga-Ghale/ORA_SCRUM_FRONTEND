// src/hooks/useFolders.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { queryKeys } from '../../lib/query-client';

// ============================================
// Types
// ============================================

export interface CreateFolderRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  visibility?: string;
  allowed_users?: string[];
  allowed_teams?: string[];
}

export interface UpdateFolderVisibilityRequest {
  visibility: string;
  allowedUsers?: string[];
  allowedTeams?: string[];
}

export interface FolderResponse {
  id: string;
  space_id: string;
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

const folderApi = {
  listBySpace: (spaceId: string) => apiClient.get<FolderResponse[]>(`/spaces/${spaceId}/folders`),

  listByUser: () => apiClient.get<FolderResponse[]>('/folders/my'),

  getById: (id: string) => apiClient.get<FolderResponse>(`/folders/${id}`),

  create: (spaceId: string, data: CreateFolderRequest) =>
    apiClient.post<FolderResponse>(`/spaces/${spaceId}/folders`, data),

  update: (id: string, data: UpdateFolderRequest) =>
    apiClient.put<FolderResponse>(`/folders/${id}`, data),

  updateVisibility: (id: string, data: UpdateFolderVisibilityRequest) =>
    apiClient.patch<{ message: string }>(`/folders/${id}/visibility`, data),

  delete: (id: string) => apiClient.delete(`/folders/${id}`),
};

// ============================================
// Query Hooks
// ============================================

export const useFoldersBySpace = (spaceId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.folders.bySpace(spaceId),
    queryFn: () => folderApi.listBySpace(spaceId),
    enabled: options?.enabled ?? !!spaceId,
  });
};

export const useMyFolders = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.folders.byUser(),
    queryFn: folderApi.listByUser,
    enabled: options?.enabled ?? true,
  });
};

export const useFolder = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.folders.detail(id),
    queryFn: () => folderApi.getById(id),
    enabled: options?.enabled ?? !!id,
  });
};

// ============================================
// Mutation Hooks
// ============================================

export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, data }: { spaceId: string; data: CreateFolderRequest }) =>
      folderApi.create(spaceId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.bySpace(data.space_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.byUser() });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all });
    },
  });
};

export const useUpdateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFolderRequest }) =>
      folderApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.bySpace(data.space_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.byUser() });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all });
    },
  });
};

export const useUpdateFolderVisibility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFolderVisibilityRequest }) =>
      folderApi.updateVisibility(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all });
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: folderApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all });
      queryClient.removeQueries({ queryKey: queryKeys.folders.detail(id) });
    },
  });
};
