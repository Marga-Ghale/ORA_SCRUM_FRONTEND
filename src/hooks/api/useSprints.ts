import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-client';

// Types
export type SprintStatus = 'planning' | 'active' | 'completed' | 'cancelled';

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  projectId: string;
  status: SprintStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSprintData {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

// Get sprints for a project
export function useSprints(projectId: string) {
  return useQuery({
    queryKey: queryKeys.sprints.list(projectId),
    queryFn: () => apiClient.get<Sprint[]>(`/projects/${projectId}/sprints`),
    enabled: !!projectId,
  });
}

// Get active sprint for a project
export function useActiveSprint(projectId: string) {
  return useQuery({
    queryKey: queryKeys.sprints.active(projectId),
    queryFn: async () => {
      const sprints = await apiClient.get<Sprint[]>(`/projects/${projectId}/sprints`);
      return sprints.find((s) => s.status === 'active') || null;
    },
    enabled: !!projectId,
  });
}

// Get single sprint
export function useSprint(id: string) {
  return useQuery({
    queryKey: queryKeys.sprints.detail(id),
    queryFn: () => apiClient.get<Sprint>(`/sprints/${id}`),
    enabled: !!id,
  });
}

// Create sprint
export function useCreateSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateSprintData }) =>
      apiClient.post<Sprint>(`/projects/${projectId}/sprints`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.list(variables.projectId),
      });
    },
  });
}

// Update sprint
export function useUpdateSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSprintData> }) =>
      apiClient.put<Sprint>(`/sprints/${id}`, data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.sprints.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.lists() });
    },
  });
}

// Delete sprint
export function useDeleteSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/sprints/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

// Start sprint
export function useStartSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.post<Sprint>(`/sprints/${id}/start`),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.sprints.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.lists() });
    },
  });
}

// Complete sprint
export function useCompleteSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, moveIncomplete }: { id: string; moveIncomplete?: 'backlog' | string }) =>
      apiClient.post<Sprint>(`/sprints/${id}/complete`, { moveIncomplete }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.sprints.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
