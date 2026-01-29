// src/hooks/useMembers.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { queryKeys } from '../../lib/query-client';
import toast from 'react-hot-toast';

// ============================================
// Types
// ============================================

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status?: string;
}

export interface UnifiedMemberResponse {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  role: string;
  joinedAt: string;
  isInherited: boolean;
  inheritedFrom?: string;
  user?: UserResponse;
}

export interface AddMemberRequest {
  userId: string;
  role: string;
}

export interface InviteMemberRequest {
  email: string;
  role: string;
}

export interface UpdateMemberRoleRequest {
  role: string;
}

export interface AccessCheckResponse {
  hasAccess: boolean;
  isDirect: boolean;
  inheritedFrom?: string;
}

export interface AccessLevelResponse {
  role: string;
  isDirect: boolean;
  inheritedFrom?: string;
}

export interface UserMembership {
  entityType: string;
  entityId: string;
  role: string;
}

// ✅ ADD THIS NEW TYPE after EntityType
export interface AccessInfoResponse {
  has_access: boolean;
  access_type: 'none' | 'visible' | 'member' | 'inherited';
  role: string;
  inherited_from: string;
  can_read_content: boolean;
  can_write: boolean;
}

export type EntityType = 'workspace' | 'space' | 'folder' | 'project';

// ============================================
// API Functions
// ============================================

const memberApi = {
  // List members
  listDirectMembers: (entityType: EntityType, entityId: string) =>
    apiClient.get<UnifiedMemberResponse[]>(`/members/${entityType}/${entityId}/direct`),

  listEffectiveMembers: (entityType: EntityType, entityId: string) =>
    apiClient.get<UnifiedMemberResponse[]>(`/members/${entityType}/${entityId}/effective`),

  // Add/Invite members
  addMember: (entityType: EntityType, entityId: string, data: AddMemberRequest) =>
    apiClient.post<{ message: string }>(`/members/${entityType}/${entityId}`, data),

  inviteMemberByIntityType: (entityType: EntityType, entityId: string, data: InviteMemberRequest) =>
    apiClient.post<{ message: string }>(`/members/${entityType}/${entityId}/invite`, data),

  inviteMemberByEmail: (entityType: EntityType, entityId: string, data: InviteMemberRequest) =>
    apiClient.post<{ message: string }>(`/members/${entityType}/${entityId}/invite`, data),

  // Update/Remove members
  updateMemberRole: (
    entityType: EntityType,
    entityId: string,
    userId: string,
    data: UpdateMemberRoleRequest
  ) =>
    apiClient.patch<{ message: string }>(`/members/${entityType}/${entityId}/${userId}/role`, data),

  removeMember: (entityType: EntityType, entityId: string, userId: string) =>
    apiClient.delete(`/members/${entityType}/${entityId}/${userId}`),

  // Access checks
  checkAccess: (entityType: EntityType, entityId: string, userId?: string) =>
    apiClient.get<AccessCheckResponse>(
      `/members/${entityType}/${entityId}/access${userId ? `?userId=${userId}` : ''}`
    ),

  getAccessLevel: (entityType: EntityType, entityId: string, userId?: string) =>
    apiClient.get<AccessLevelResponse>(
      `/members/${entityType}/${entityId}/access-level${userId ? `?userId=${userId}` : ''}`
    ),

  // User memberships
  getUserMemberships: () => apiClient.get<UserMembership[]>('/members/my/memberships'),

  getUserAllAccess: () => apiClient.get<Record<string, unknown>>('/members/my/access'),

  getAccessInfo: (entityType: EntityType, entityId: string, userId?: string) =>
    apiClient.get<AccessInfoResponse>(
      `/members/${entityType}/${entityId}/access-info${userId ? `?userId=${userId}` : ''}`
    ),

  getEligibleUsers: (entityType: EntityType, entityId: string) =>
    apiClient.get<UnifiedMemberResponse[]>(`/members/${entityType}/${entityId}/eligible`),

  getVisibleSpaces: () => apiClient.get<any[]>('/members/my/visible/spaces'),
};

// ============================================
// Query Hooks
// ============================================

export const useDirectMembers = (
  entityType: EntityType,
  entityId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.members.direct(entityType, entityId),
    queryFn: () => memberApi.listDirectMembers(entityType, entityId),
    enabled: options?.enabled ?? !!(entityType && entityId),
  });
};

export const useEffectiveMembers = (
  entityType: EntityType,
  entityId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.members.effective(entityType, entityId),
    queryFn: () => memberApi.listEffectiveMembers(entityType, entityId),
    enabled: options?.enabled ?? !!(entityType && entityId),
  });
};

export const useCheckAccess = (
  entityType: EntityType,
  entityId: string,
  userId?: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.members.access(entityType, entityId),
    queryFn: () => memberApi.checkAccess(entityType, entityId, userId),
    enabled: options?.enabled ?? !!(entityType && entityId),
  });
};

export const useAccessLevel = (
  entityType: EntityType,
  entityId: string,
  userId?: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.members.accessLevel(entityType, entityId),
    queryFn: () => memberApi.getAccessLevel(entityType, entityId, userId),
    enabled: options?.enabled ?? !!(entityType && entityId),
  });
};

export const useMyMemberships = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.members.myMemberships(),
    queryFn: memberApi.getUserMemberships,
    enabled: options?.enabled ?? true,
  });
};

export const useMyAccess = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.members.myAccess(),
    queryFn: memberApi.getUserAllAccess,
    enabled: options?.enabled ?? true,
  });
};

export const useAccessInfo = (
  entityType: EntityType,
  entityId: string,
  userId?: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.members.accessInfo(entityType, entityId),
    queryFn: () => memberApi.getAccessInfo(entityType, entityId, userId),
    enabled: options?.enabled ?? !!(entityType && entityId),
  });
};

export const useVisibleSpaces = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.members.visibleSpaces(),
    queryFn: async () => {
      const response = await memberApi.getVisibleSpaces();
      return response.map((s: any) => ({
        id: s.ID,
        name: s.Name,
        description: s.Description,
        workspaceId: s.WorkspaceID,
        color: s.Color,
        icon: s.Icon,
        createdAt: s.CreatedAt,
      }));
    },
    enabled: options?.enabled ?? true,
  });
};

// ============================================
// Mutation Hooks
// ============================================

export const useAddMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      data,
    }: {
      entityType: EntityType;
      entityId: string;
      data: AddMemberRequest;
    }) => memberApi.addMember(entityType, entityId, data),
    onSuccess: (_, variables) => {
      toast.success('Member added successfully');
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.direct(variables.entityType, variables.entityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.effective(variables.entityType, variables.entityId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.myMemberships() });

      // ✅ ADD: Invalidate eligible users
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.eligible(variables.entityType, variables.entityId),
      });

      // Force refetch accessible entities based on entity type
      switch (variables.entityType) {
        case 'workspace':
          queryClient.refetchQueries({ queryKey: queryKeys.members.accessibleWorkspaces() });
          queryClient.refetchQueries({ queryKey: queryKeys.members.visibleSpaces() });
          // ✅ ADD: Invalidate space eligible users (workspace members changed)
          queryClient.invalidateQueries({ queryKey: ['members', 'eligible', 'space'] });
          break;

        case 'space':
          console.log('🔄 Refetching space-related queries...');
          queryClient.refetchQueries({ queryKey: queryKeys.members.accessibleSpaces() });
          queryClient.refetchQueries({ queryKey: queryKeys.members.visibleSpaces() });
          queryClient.refetchQueries({ queryKey: queryKeys.members.accessibleFolders() });
          queryClient.refetchQueries({ queryKey: queryKeys.members.accessibleProjects() });
          // Invalidate eligible users
          queryClient.invalidateQueries({ queryKey: ['members', 'eligible', 'folder'] });
          queryClient.invalidateQueries({ queryKey: ['members', 'eligible', 'project'] });
          // ✅ ADD: Invalidate child entity effective members (space members inherit to folders/projects)
          queryClient.invalidateQueries({ queryKey: ['members', 'effective', 'folder'] });
          queryClient.invalidateQueries({ queryKey: ['members', 'effective', 'project'] });
          break;

        case 'folder':
          queryClient.refetchQueries({ queryKey: queryKeys.members.accessibleFolders() });
          queryClient.refetchQueries({ queryKey: queryKeys.members.accessibleProjects() });
          // ✅ ADD: Invalidate project eligible users (folder members changed)
          queryClient.invalidateQueries({ queryKey: ['members', 'eligible', 'project'] });
          break;

        case 'project':
          queryClient.refetchQueries({ queryKey: queryKeys.members.accessibleProjects() });
          break;
      }
    },
    onError: (error) => {
      toast.error('❌ ADD MEMBER ERROR: ' + (error as Error).message);
    },
  });
};
export const useInviteMemberByEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      data,
    }: {
      entityType: EntityType;
      entityId: string;
      data: InviteMemberRequest;
    }) => memberApi.inviteMemberByEmail(entityType, entityId, data),
    onSuccess: (_, variables) => {
      toast.success('Invitation sent successfully!');
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.direct(variables.entityType, variables.entityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.effective(variables.entityType, variables.entityId),
      });
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      userId,
      data,
    }: {
      entityType: EntityType;
      entityId: string;
      userId: string;
      data: UpdateMemberRoleRequest;
    }) => memberApi.updateMemberRole(entityType, entityId, userId, data),
    onSuccess: (_, variables) => {
      toast.success('Member role updated successfully');
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.direct(variables.entityType, variables.entityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.effective(variables.entityType, variables.entityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.access(variables.entityType, variables.entityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.accessLevel(variables.entityType, variables.entityId),
      });
    },
    onError: (error) => {
      toast.error('❌ UPDATE ERROR: ' + (error as Error).message);
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      userId,
    }: {
      entityType: EntityType;
      entityId: string;
      userId: string;
    }) => memberApi.removeMember(entityType, entityId, userId),
    onSuccess: (_, variables) => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.direct(variables.entityType, variables.entityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.effective(variables.entityType, variables.entityId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.myMemberships() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.eligible(variables.entityType, variables.entityId),
      });

      // ✅ ADD: Invalidate child entity queries based on entity type
      switch (variables.entityType) {
        case 'workspace':
          queryClient.invalidateQueries({ queryKey: ['members', 'eligible', 'space'] });
          queryClient.invalidateQueries({ queryKey: ['members', 'effective', 'space'] });
          break;
        case 'space':
          queryClient.invalidateQueries({ queryKey: ['members', 'eligible', 'folder'] });
          queryClient.invalidateQueries({ queryKey: ['members', 'eligible', 'project'] });
          queryClient.invalidateQueries({ queryKey: ['members', 'effective', 'folder'] });
          queryClient.invalidateQueries({ queryKey: ['members', 'effective', 'project'] });
          break;
        case 'folder':
          queryClient.invalidateQueries({ queryKey: ['members', 'eligible', 'project'] });
          queryClient.invalidateQueries({ queryKey: ['members', 'effective', 'project'] });
          break;
      }
    },
    onError: (error) => {
      toast.error('❌ REMOVE MEMBER ERROR: ' + (error as Error).message);
    },
  });
};

export const useEligibleUsers = (
  entityType: EntityType,
  entityId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.members.eligible(entityType, entityId),
    queryFn: () => memberApi.getEligibleUsers(entityType, entityId),
    enabled: options?.enabled ?? !!(entityType && entityId),
  });
};
