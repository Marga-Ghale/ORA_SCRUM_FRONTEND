import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api';

// ============================================
// Types
// ============================================

export interface WorkspaceResponse {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceResponse {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolderResponse {
  id: string;
  spaceId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResponse {
  id: string;
  spaceId: string;
  folderId?: string;
  name: string;
  key: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Helper: Transform snake_case to camelCase
// ============================================

const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  if (obj && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const camelKey =
        key === key.toUpperCase()
          ? key.toLowerCase() // ID -> id
          : key.charAt(0).toLowerCase() + key.slice(1); // WorkspaceID -> workspaceID

      // Fix common backend patterns
      const normalizedKey = camelKey.replace(/ID$/, 'Id').replace(/IDs$/, 'Ids');

      acc[normalizedKey] = toCamelCase(value);
      return acc;
    }, {} as any);
  }

  return obj;
};

// ============================================
// API Functions
// ============================================

const accessibleApi = {
  getWorkspaces: async (): Promise<WorkspaceResponse[]> => {
    try {
      const data = await apiClient.get<WorkspaceResponse[]>('/members/my/accessible/workspaces');
      console.log('✅ Workspaces API data:', data);
      return toCamelCase(data ?? []);
    } catch (err) {
      console.error('❌ Workspaces API error:', err);
      return [];
    }
  },

  getSpaces: async (): Promise<SpaceResponse[]> => {
    try {
      const data = await apiClient.get<SpaceResponse[]>('/members/my/accessible/spaces');
      console.log('✅ Spaces API data:', data);
      return toCamelCase(data ?? []);
    } catch (err) {
      console.error('❌ Spaces API error:', err);
      return [];
    }
  },

  getFolders: async (): Promise<FolderResponse[]> => {
    try {
      const data = await apiClient.get<FolderResponse[]>('/members/my/accessible/folders');
      console.log('✅ Folders API data:', data);
      return toCamelCase(data ?? []);
    } catch (err) {
      console.error('❌ Folders API error:', err);
      return [];
    }
  },

  getProjects: async (): Promise<ProjectResponse[]> => {
    try {
      const data = await apiClient.get<ProjectResponse[]>('/members/my/accessible/projects');
      console.log('✅ Projects API data:', data);
      return toCamelCase(data ?? []);
    } catch (err) {
      console.error('❌ Projects API error:', err);
      return [];
    }
  },
};

// ============================================
// React Query Hooks
// ============================================

export const useAccessibleWorkspaces = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['accessible', 'workspaces'],
    queryFn: accessibleApi.getWorkspaces,
    enabled: options?.enabled ?? true,
  });

export const useAccessibleSpaces = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['accessible', 'spaces'],
    queryFn: accessibleApi.getSpaces,
    enabled: options?.enabled ?? true,
  });

export const useAccessibleFolders = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['accessible', 'folders'],
    queryFn: accessibleApi.getFolders,
    enabled: options?.enabled ?? true,
  });

export const useAccessibleProjects = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['accessible', 'projects'],
    queryFn: accessibleApi.getProjects,
    enabled: options?.enabled ?? true,
  });
