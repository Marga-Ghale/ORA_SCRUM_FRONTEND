// ✅ COMPLETE REPLACEMENT: src/hooks/api/useAccessibleEntities.ts

import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { queryKeys } from '../../lib/query-client';

export interface WorkspaceResponse {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt?: string;
}

export interface SpaceResponse {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  color?: string;
  icon?: string;
  createdAt?: string;
}

export interface FolderResponse {
  id: string;
  name: string;
  description?: string;
  spaceId: string;
  createdAt?: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  spaceId: string;
  folderId?: string;
  key?: string;
  color?: string;
  createdAt?: string;
}

export const useAccessibleWorkspaces = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.members.accessibleWorkspaces(),
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/members/my/accessible/workspaces');
      return response.map((w: any) => ({
        id: w.ID,
        name: w.Name,
        description: w.Description,
        color: w.Color,
        icon: w.Icon,
        createdAt: w.CreatedAt,
      }));
    },
    enabled: options?.enabled ?? true,
  });
};

export const useAccessibleSpaces = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.members.accessibleSpaces(),
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/members/my/accessible/spaces');
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

export const useAccessibleFolders = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.members.accessibleFolders(),
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/members/my/accessible/folders');
      return response.map((f: any) => ({
        id: f.ID,
        name: f.Name,
        description: f.Description,
        spaceId: f.SpaceID,
        createdAt: f.CreatedAt,
      }));
    },
    enabled: options?.enabled ?? true,
  });
};

export const useAccessibleProjects = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.members.accessibleProjects(),
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/members/my/accessible/projects');
      return response.map((p: any) => ({
        id: p.ID,
        name: p.Name,
        description: p.Description,
        spaceId: p.SpaceID,
        folderId: p.FolderID,
        key: p.Key,
        color: p.Color,
        createdAt: p.CreatedAt,
      }));
    },
    enabled: options?.enabled ?? true,
  });
};

export const useAllAccessibleEntities = () => {
  const { data: workspaces = [], isLoading: wLoading } = useAccessibleWorkspaces();
  const { data: spaces = [], isLoading: sLoading } = useAccessibleSpaces();
  const { data: folders = [], isLoading: fLoading } = useAccessibleFolders();
  const { data: projects = [], isLoading: pLoading } = useAccessibleProjects();

  return {
    workspaces,
    spaces,
    folders,
    projects,
    isLoading: wLoading || sLoading || fLoading || pLoading,
  };
};
