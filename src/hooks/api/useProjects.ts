// src/hooks/useProjects.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { queryKeys } from '../../lib/query-client';

// ============================================
// Types
// ============================================

export interface CreateProjectRequest {
  name: string;
  key: string;
  folderId?: string;
  description?: string;
  icon?: string;
  color?: string;
  leadId?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  key?: string;
  folderId?: string | null;
  description?: string;
  icon?: string;
  color?: string;
  leadId?: string;
}

export interface ProjectResponse {
  id: string;
  spaceId: string;
  folderId?: string;
  name: string;
  key: string;
  description?: string;
  icon?: string;
  color?: string;
  leadId?: string;
  visibility?: string;
  allowedUsers: string[];
  allowedTeams: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API Functions
// ============================================

const projectApi = {
  listBySpace: (spaceId: string) => apiClient.get<ProjectResponse[]>(`/spaces/${spaceId}/projects`),

  listByFolder: (folderId: string) =>
    apiClient.get<ProjectResponse[]>(`/folders/${folderId}/projects`),

  getById: (id: string) => apiClient.get<ProjectResponse>(`/projects/${id}`),

  create: (spaceId: string, data: CreateProjectRequest) =>
    apiClient.post<ProjectResponse>(`/spaces/${spaceId}/projects`, data),

  update: (id: string, data: UpdateProjectRequest) =>
    apiClient.put<ProjectResponse>(`/projects/${id}`, data),

  delete: (id: string) => apiClient.delete(`/projects/${id}`),
};

// ============================================
// Query Hooks
// ============================================

export const useProjectsBySpace = (spaceId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.projects.bySpace(spaceId),
    queryFn: () => projectApi.listBySpace(spaceId),
    enabled: options?.enabled ?? !!spaceId,
  });
};

export const useProjectsByFolder = (folderId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.projects.byFolder(folderId),
    queryFn: () => projectApi.listByFolder(folderId),
    enabled: options?.enabled ?? !!folderId,
  });
};

export const useProject = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => projectApi.getById(id),
    enabled: options?.enabled ?? !!id,
  });
};

// ============================================
// Mutation Hooks
// ============================================

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, data }: { spaceId: string; data: CreateProjectRequest }) =>
      projectApi.create(spaceId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.bySpace(data.spaceId) });
      if (data.folderId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.byFolder(data.folderId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      projectApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.bySpace(data.spaceId) });
      if (data.folderId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.byFolder(data.folderId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(id) });
    },
  });
};
