import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-client';

// Types
export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  icon?: string;
  color?: string;
  spaceId: string;
  leadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: 'lead' | 'member' | 'viewer';
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  joinedAt: string;
}

export interface CreateProjectData {
  name: string;
  key: string;
  description?: string;
  icon?: string;
  color?: string;
  leadId?: string;
}

// Get projects for a space
export function useProjects(spaceId: string) {
  return useQuery({
    queryKey: queryKeys.projects.list(spaceId),
    queryFn: () => apiClient.get<Project[]>(`/spaces/${spaceId}/projects`),
    enabled: !!spaceId,
  });
}

// Get single project
export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => apiClient.get<Project>(`/projects/${id}`),
    enabled: !!id,
  });
}

// Get project members
export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.members(projectId),
    queryFn: () => apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`),
    enabled: !!projectId,
  });
}

// Create project
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, data }: { spaceId: string; data: CreateProjectData }) =>
      apiClient.post<Project>(`/spaces/${spaceId}/projects`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.list(variables.spaceId),
      });
    },
  });
}

// Update project
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProjectData> }) =>
      apiClient.put<Project>(`/projects/${id}`, data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.projects.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

// Delete project
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

// Add project member
export function useAddProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      userId,
      role,
    }: {
      projectId: string;
      userId: string;
      role: string;
    }) => apiClient.post(`/projects/${projectId}/members`, { userId, role }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.members(variables.projectId),
      });
    },
  });
}

// Remove project member
export function useRemoveProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
      apiClient.delete(`/projects/${projectId}/members/${userId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.members(variables.projectId),
      });
    },
  });
}
