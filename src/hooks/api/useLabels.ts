import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-client';

// Types
export interface Label {
  id: string;
  name: string;
  color: string;
  projectId: string;
  createdAt: string;
}

export interface CreateLabelData {
  name: string;
  color: string;
}

// Get labels for a project
export function useLabels(projectId: string) {
  return useQuery({
    queryKey: queryKeys.labels.list(projectId),
    queryFn: () => apiClient.get<Label[]>(`/projects/${projectId}/labels`),
    enabled: !!projectId,
  });
}

// Create label
export function useCreateLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateLabelData }) =>
      apiClient.post<Label>(`/projects/${projectId}/labels`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.labels.list(variables.projectId)
      });
    },
  });
}

// Update label
export function useUpdateLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLabelData> }) =>
      apiClient.put<Label>(`/labels/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labels.all });
    },
  });
}

// Delete label
export function useDeleteLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/labels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labels.all });
      // Also invalidate tasks as they might reference this label
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
