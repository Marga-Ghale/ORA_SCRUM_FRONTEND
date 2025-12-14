// src/hooks/api/useMembers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-client';
import { useMemo } from 'react';

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
  role: 'owner' | 'admin' | 'member' | 'guest' | 'lead' | 'viewer';
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
  role?: string; // Changed to string to accept any role
}

export interface AddMemberByIdData {
  userId: string;
  role?: string; // Changed to string to accept any role (lead, member, viewer, etc.)
}

export interface UpdateMemberRoleData {
  role: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
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
  role?: string;
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
      toast.success('Member added to workspace');
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add member');
    },
  });
}

export function useAddWorkspaceMemberById(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberByIdData) =>
      apiClient.post<WorkspaceMember>(`/workspaces/${workspaceId}/members/add`, data),
    onSuccess: () => {
      toast.success('Member added to workspace');
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add member');
    },
  });
}

export function useUpdateWorkspaceMemberRole(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiClient.put(`/workspaces/${workspaceId}/members/${userId}`, { role }),
    onSuccess: () => {
      toast.success('Member role updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
}

export function useRemoveWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`),
    onSuccess: () => {
      toast.success('Member removed from workspace');
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(workspaceId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove member');
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
      toast.success('Member added to project');
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add member');
    },
  });
}

export function useAddProjectMemberById(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberByIdData) =>
      apiClient.post<ProjectMember>(`/projects/${projectId}/members/add`, data),
    onSuccess: () => {
      toast.success('Member added to project');
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add member');
    },
  });
}

export function useUpdateProjectMemberRole(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiClient.put(`/projects/${projectId}/members/${userId}`, { role }),
    onSuccess: () => {
      toast.success('Member role updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
}

export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.delete(`/projects/${projectId}/members/${userId}`),
    onSuccess: () => {
      toast.success('Member removed from project');
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.members(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove member');
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
    onSuccess: (_, variables) => {
      toast.success(`Invitation sent to ${variables.email}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.workspace(workspaceId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invitation');
    },
  });
}

// Invite to project
export function useInviteToProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteMemberData) =>
      apiClient.post<Invitation>(`/projects/${projectId}/invitations`, data),
    onSuccess: (_, variables) => {
      toast.success(`Invitation sent to ${variables.email}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.project(projectId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invitation');
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
    mutationFn: (token: string) =>
      apiClient.post(`/invitations/accept/${token}`),
    onSuccess: () => {
      toast.success('Invitation accepted!');
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to accept invitation');
    },
  });
}

// Decline invitation
export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.delete(`/invitations/${invitationId}`),
    onSuccess: () => {
      toast.success('Invitation declined');
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.pending() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to decline invitation');
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
      toast.success('Invitation cancelled');
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.invitations.workspace(workspaceId) });
      }
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.invitations.project(projectId) });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel invitation');
    },
  });
}

// Resend invitation
export function useResendInvitation() {
  return useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.post(`/invitations/resend/${invitationId}`),
    onSuccess: () => {
      toast.success('Invitation resent');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to resend invitation');
    },
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

// ============================================
// Available Members (for adding to projects)
// ============================================

export function useAvailableMembers(workspaceId: string | undefined, projectId: string | undefined) {
  // Get all workspace members
  const { 
    data: workspaceMembers = [], 
    isLoading: isLoadingWorkspace,
    error: workspaceError,
  } = useWorkspaceMembers(workspaceId);

  // Get current project members
  const { 
    data: projectMembers = [], 
    isLoading: isLoadingProject,
    error: projectError,
  } = useProjectMembers(projectId);

  // Filter out users already in project
  const availableMembers = useMemo(() => {
    if (!workspaceMembers.length) return [];
    
    const projectMemberIds = new Set(projectMembers.map(m => m.userId));
    return workspaceMembers.filter(m => !projectMemberIds.has(m.userId));
  }, [workspaceMembers, projectMembers]);

  // Debug logging
  console.log('useAvailableMembers:', {
    workspaceId,
    projectId,
    workspaceMembers: workspaceMembers.length,
    projectMembers: projectMembers.length,
    availableMembers: availableMembers.length,
    isLoadingWorkspace,
    isLoadingProject,
    workspaceError,
    projectError,
  });

  return { 
    availableMembers, 
    projectMembers, 
    workspaceMembers,
    isLoading: isLoadingWorkspace || isLoadingProject,
    error: workspaceError || projectError,
  };
}