import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-client';

// Types
export interface Space {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpaceData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

// Get spaces for a workspace
export function useSpaces(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.spaces.list(workspaceId),
    queryFn: () => apiClient.get<Space[]>(`/workspaces/${workspaceId}/spaces`),
    enabled: !!workspaceId,
  });
}

// Get single space
export function useSpace(id: string) {
  return useQuery({
    queryKey: queryKeys.spaces.detail(id),
    queryFn: () => apiClient.get<Space>(`/spaces/${id}`),
    enabled: !!id,
  });
}

// Create space
export function useCreateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: CreateSpaceData }) =>
      apiClient.post<Space>(`/workspaces/${workspaceId}/spaces`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.spaces.list(variables.workspaceId)
      });
    },
  });
}

// Update space
export function useUpdateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSpaceData> }) =>
      apiClient.put<Space>(`/spaces/${id}`, data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.spaces.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.lists() });
    },
  });
}

// Delete space
export function useDeleteSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/spaces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.all });
    },
  });
}
