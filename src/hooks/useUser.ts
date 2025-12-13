import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-client';
import apiClient from '../lib/api-client';


export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';  // ← Required
  status: 'online' | 'offline' | 'busy' | 'away';  // ← Required
}

interface ProjectMemberResponse {
  id?: string;
  userId?: string;          // ← API returns this
  role?: string;
  user?: {                  // ← API returns nested user
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
    status?: string;
  };
  // Fallback properties for backwards compatibility
  name?: string;
  email?: string;
  avatar?: string;
  status?: string;
}


// Get users for a project
export function useProjectUsers(projectId: string) {
  return useQuery({
    queryKey: queryKeys.users.byProject(projectId),
    queryFn: () => apiClient.get<ProjectMemberResponse[]>(`/projects/${projectId}/members`),  // ← Changed type
    enabled: !!projectId,
    select: (data): User[] => data.map(member => ({  // ← Explicit return type
      id: member.userId || member.user?.id || member.id || '',
      name: member.user?.name || member.name || 'Unknown',
      email: member.user?.email || member.email || '',
      avatar: member.user?.avatar || member.avatar,
      role: (member.role || 'member') as 'admin' | 'member' | 'viewer',
      status: (member.user?.status || member.status || 'offline') as 'online' | 'offline' | 'busy' | 'away',
    })),
  });
}

// Get all users in workspace (for inviting)
export function useWorkspaceUsers(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.users.byWorkspace(workspaceId),
    queryFn: () => apiClient.get<User[]>(`/workspaces/${workspaceId}/members`),
    enabled: !!workspaceId,
  });
}

// Get current user
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.current,
    queryFn: () => apiClient.get<User>('/users/me'),
  });
}