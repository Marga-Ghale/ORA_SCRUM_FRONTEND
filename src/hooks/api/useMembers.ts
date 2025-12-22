// src/hooks/useMembers.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { queryKeys } from '../../lib/query-client';

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
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.direct(variables.entityType, variables.entityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.effective(variables.entityType, variables.entityId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.myMemberships() });
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.direct(variables.entityType, variables.entityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.effective(variables.entityType, variables.entityId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.myMemberships() });
    },
  });
};
