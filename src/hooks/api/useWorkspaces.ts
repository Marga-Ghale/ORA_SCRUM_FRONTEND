import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-client';

// Types
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  joinedAt: string;
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface InviteMemberData {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

// Get all workspaces
export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces.lists(),
    queryFn: () => apiClient.get<Workspace[]>('/workspaces'),
  });
}

// Get single workspace
export function useWorkspace(id: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.detail(id),
    queryFn: () => apiClient.get<Workspace>(`/workspaces/${id}`),
    enabled: !!id,
  });
}

// Get workspace members
export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.members(workspaceId),
    queryFn: () => apiClient.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`),
    enabled: !!workspaceId,
  });
}

// Create workspace
export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkspaceData) => apiClient.post<Workspace>('/workspaces', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
  });
}

// Update workspace
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWorkspaceData> }) =>
      apiClient.put<Workspace>(`/workspaces/${id}`, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.workspaces.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.lists() });
    },
  });
}

// Delete workspace
export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/workspaces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
  });
}

// Invite member to workspace
export function useInviteWorkspaceMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: InviteMemberData }) =>
      apiClient.post(`/workspaces/${workspaceId}/members`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.members(variables.workspaceId),
      });
    },
  });
}

// Remove member from workspace
export function useRemoveWorkspaceMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.members(variables.workspaceId),
      });
    },
  });
}

// Update member role
export function useUpdateWorkspaceMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      userId,
      role,
    }: {
      workspaceId: string;
      userId: string;
      role: string;
    }) => apiClient.put(`/workspaces/${workspaceId}/members/${userId}`, { role }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.members(variables.workspaceId),
      });
    },
  });
}
