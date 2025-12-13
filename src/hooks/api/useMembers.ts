// src/hooks/api/useMembers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-client';

// ============================================
// Types
// ============================================

export interface MemberUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
}

export interface Member {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joinedAt: string;
  user: MemberUser;
}

export interface WorkspaceMember extends Member {
  workspaceId: string;
}

export interface ProjectMember extends Member {
  projectId: string;
}

export interface AddMemberData {
  email: string;
  role?: 'admin' | 'member' | 'guest';
}

export interface AddMemberByIdData {
  userId: string;
  role?: 'admin' | 'member' | 'guest';
}

export interface UpdateMemberRoleData {
  role: 'admin' | 'member' | 'guest';
}

export interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'guest';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
  invitedBy: MemberUser;
  workspaceId?: string;
  projectId?: string;
  workspace?: { id: string; name: string };
  project?: { id: string; name: string; key: string };
}

export interface InviteMemberData {
  email: string;
  role?: 'admin' | 'member' | 'guest';
  message?: string;
}

export interface SearchUserResult {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// ============================================
// Workspace Members
// ============================================

export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspaces.members(workspaceId!),
    queryFn: () => apiClient.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`),
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
  });
}

export function useAddWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberData) =>
      apiClient.post<WorkspaceMember>(`/workspaces/${workspaceId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
    },
  });
}

export function useAddWorkspaceMemberById(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberByIdData) =>
      apiClient.post<WorkspaceMember>(`/workspaces/${workspaceId}/members/add`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
    },
  });
}

export function useUpdateWorkspaceMemberRole(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiClient.put(`/workspaces/${workspaceId}/members/${userId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
    },
  });
}

export function useRemoveWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
    },
  });
}

// ============================================
// Project Members
// ============================================

export function useProjectMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.members(projectId!),
    queryFn: () => apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

export function useAddProjectMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberData) =>
      apiClient.post<ProjectMember>(`/projects/${projectId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
  });
}

export function useAddProjectMemberById(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberByIdData) =>
      apiClient.post<ProjectMember>(`/projects/${projectId}/members/add`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
  });
}

export function useUpdateProjectMemberRole(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiClient.put(`/projects/${projectId}/members/${userId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) });
    },
  });
}

export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.delete(`/projects/${projectId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
  });
}

// ============================================
// Invitations
// ============================================

// Invite to workspace
export function useInviteToWorkspace(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteMemberData) =>
      apiClient.post<Invitation>(`/workspaces/${workspaceId}/invitations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.workspace(workspaceId) });
    },
  });
}

// Invite to project
export function useInviteToProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteMemberData) =>
      apiClient.post<Invitation>(`/projects/${projectId}/invitations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.project(projectId) });
    },
  });
}

// Get workspace invitations
export function useWorkspaceInvitations(workspaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.invitations.workspace(workspaceId!),
    queryFn: () => apiClient.get<Invitation[]>(`/workspaces/${workspaceId}/invitations`),
    enabled: !!workspaceId,
    staleTime: 60 * 1000,
  });
}

// Get project invitations
export function useProjectInvitations(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.invitations.project(projectId!),
    queryFn: () => apiClient.get<Invitation[]>(`/projects/${projectId}/invitations`),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
}

// Get pending invitations for current user
export function usePendingInvitations() {
  return useQuery({
    queryKey: queryKeys.invitations.pending(),
    queryFn: () => apiClient.get<Invitation[]>('/invitations/pending'),
    staleTime: 30 * 1000,
  });
}

// Accept invitation
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.post(`/invitations/${invitationId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() });
    },
  });
}

// Decline invitation
export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.post(`/invitations/${invitationId}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.pending() });
    },
  });
}

// Cancel invitation (for workspace/project owners)
export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invitationId, workspaceId, projectId }: { 
      invitationId: string; 
      workspaceId?: string; 
      projectId?: string 
    }) =>
      apiClient.delete(`/invitations/${invitationId}`).then(() => ({ workspaceId, projectId })),
    onSuccess: ({ workspaceId, projectId }) => {
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.invitations.workspace(workspaceId) });
      }
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.invitations.project(projectId) });
      }
    },
  });
}

// Resend invitation
export function useResendInvitation() {
  return useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.post(`/invitations/${invitationId}/resend`),
  });
}

// ============================================
// User Search (for inviting)
// ============================================

export function useSearchUsers(query: string, options?: { workspaceId?: string; projectId?: string }) {
  return useQuery({
    queryKey: queryKeys.users.search(query),
    queryFn: () => {
      const params = new URLSearchParams({ q: query });
      if (options?.workspaceId) params.append('workspaceId', options.workspaceId);
      if (options?.projectId) params.append('projectId', options.projectId);
      return apiClient.get<SearchUserResult[]>(`/users/search?${params.toString()}`);
    },
    enabled: query.length >= 2,
    staleTime: 60 * 1000,
  });
}

// Search workspace members (for task assignment, etc.)
export function useSearchWorkspaceMembers(workspaceId: string | undefined, query: string) {
  return useQuery({
    queryKey: [...queryKeys.workspaces.members(workspaceId!), 'search', query],
    queryFn: () => {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      return apiClient.get<WorkspaceMember[]>(
        `/workspaces/${workspaceId}/members/search?${params.toString()}`
      );
    },
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
  });
}

// Search project members
export function useSearchProjectMembers(projectId: string | undefined, query: string) {
  return useQuery({
    queryKey: [...queryKeys.projects.members(projectId!), 'search', query],
    queryFn: () => {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      return apiClient.get<ProjectMember[]>(
        `/projects/${projectId}/members/search?${params.toString()}`
      );
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}