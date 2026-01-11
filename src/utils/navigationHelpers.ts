// ============================================
// UPDATED: src/utils/navigationHelpers.ts
// Fixed: Updates localStorage BEFORE setting context state
// ============================================

import { NavigateFunction } from 'react-router-dom';
import apiClient from '../lib/api';
import { ProjectResponse } from '../hooks/api/useProjects';
import { FolderResponse } from '../hooks/api/useFolder';
import { SpaceResponse } from '../hooks/api/useSpaces';
import { WorkspaceResponse } from '../hooks/api/useWorkspaces';
import { Workspace, Space, Folder, Project } from '../types/project';

// ============================================
// LocalStorage Keys - Must match ProjectContext
// ============================================
const STORAGE_KEYS = {
  WORKSPACE: 'selectedWorkspaceId',
  SPACE: 'selectedSpaceId',
  PROJECT: 'selectedProjectId',
  FOLDER: 'selectedFolderId',
} as const;

// ============================================
// Mapper Functions
// ============================================
const mapWorkspace = (data: WorkspaceResponse): Workspace => ({
  id: data.id,
  name: data.name,
  icon: data.icon || '🏢',
  spaces: [],
  members: [],
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
});

const mapSpace = (data: SpaceResponse): Space => ({
  id: data.id,
  name: data.name,
  icon: data.icon || '📁',
  color: data.color || '#6366f1',
  projects: [],
});

const mapFolder = (data: FolderResponse): Folder => ({
  id: data.id,
  name: data.name,
  icon: data.icon || '📂',
  color: data.color || '#6366f1',
  spaceId: data.space_id,
  projects: [],
});

const mapProject = (data: ProjectResponse): Project => ({
  id: data.id,
  name: data.name,
  key: data.key,
  description: data.description,
  icon: '📋',
  color: '#6366f1',
  sprints: [],
  members: [],
});

// ============================================
// Fetch Project Hierarchy
// ============================================
async function fetchProjectHierarchy(projectId: string): Promise<{
  workspace: Workspace;
  space: Space;
  folder: Folder | null;
  project: Project;
} | null> {
  try {
    console.log('🔍 Fetching hierarchy for project:', projectId);

    // 1. Fetch the project
    const project = await apiClient.get<ProjectResponse>(`/projects/${projectId}`);
    console.log('✅ Project:', project);

    if (!project.spaceId) {
      console.error('❌ Project missing spaceId');
      return null;
    }

    // 2. Fetch folder if exists
    let folder: FolderResponse | null = null;
    if (project.folderId) {
      folder = await apiClient.get<FolderResponse>(`/folders/${project.folderId}`);
      console.log('✅ Folder:', folder);
    } else {
      console.log('⚠️ Project has no folder (direct space project)');
    }

    // 3. Fetch the space
    const space = await apiClient.get<SpaceResponse>(`/spaces/${project.spaceId}`);
    console.log('✅ Space:', space);

    // 4. Fetch the workspace
    const workspace = await apiClient.get<WorkspaceResponse>(`/workspaces/${space.workspace_id}`);
    console.log('✅ Workspace:', workspace);

    return {
      workspace: mapWorkspace(workspace),
      space: mapSpace(space),
      folder: folder ? mapFolder(folder) : null,
      project: mapProject(project),
    };
  } catch (error) {
    console.error('❌ Error fetching project hierarchy:', error);
    return null;
  }
}

// ============================================
// Main Navigation Function
// ============================================
export async function navigateToProject(
  projectId: string,
  navigate: NavigateFunction,
  setContextState: {
    setCurrentWorkspace: (workspace: Workspace | null) => void;
    setCurrentSpace: (space: Space | null) => void;
    setCurrentFolder: (folder: Folder | null) => void;
    setCurrentProject: (project: Project | null) => void;
  }
): Promise<boolean> {
  try {
    console.log('🎯 Starting navigation to project:', projectId);

    // Fetch the full hierarchy
    const hierarchy = await fetchProjectHierarchy(projectId);

    if (!hierarchy) {
      console.error('❌ Failed to load project hierarchy');
      return false;
    }

    console.log('✅ Hierarchy loaded successfully');

    // ✅ CRITICAL FIX: Update localStorage FIRST
    // This prevents restoration effects from overriding the navigation
    localStorage.setItem(STORAGE_KEYS.WORKSPACE, hierarchy.workspace.id);
    localStorage.setItem(STORAGE_KEYS.SPACE, hierarchy.space.id);
    localStorage.setItem(STORAGE_KEYS.PROJECT, hierarchy.project.id);

    if (hierarchy.folder) {
      localStorage.setItem(STORAGE_KEYS.FOLDER, hierarchy.folder.id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.FOLDER);
    }

    console.log('✅ localStorage updated');

    // ✅ Set context state in correct order (parent -> child)
    // The setCurrentProject will set isNavigatingRef to prevent auto-selection
    setContextState.setCurrentWorkspace(hierarchy.workspace);
    setContextState.setCurrentSpace(hierarchy.space);
    setContextState.setCurrentFolder(hierarchy.folder);
    setContextState.setCurrentProject(hierarchy.project);

    console.log('✅ Context state set');

    // Navigate to the project board
    navigate(`/project/${projectId}/board`);
    console.log('✅ Navigation complete');

    return true;
  } catch (error) {
    console.error('❌ Navigation error:', error);
    return false;
  }
}

// ============================================
// Navigate to Task
// ============================================
export async function navigateToTask(
  projectId: string,
  taskId: string,
  navigate: NavigateFunction,
  setContextState: {
    setCurrentWorkspace: (workspace: Workspace | null) => void;
    setCurrentSpace: (space: Space | null) => void;
    setCurrentFolder: (folder: Folder | null) => void;
    setCurrentProject: (project: Project | null) => void;
  }
): Promise<boolean> {
  try {
    console.log('🎯 Starting navigation to task:', taskId, 'in project:', projectId);

    // First set up the project context
    const success = await navigateToProject(projectId, navigate, setContextState);

    if (!success) {
      return false;
    }

    // Navigate with task ID parameter
    navigate(`/project/${projectId}/board?taskId=${taskId}`);
    console.log('✅ Task navigation complete');

    return true;
  } catch (error) {
    console.error('❌ Task navigation error:', error);
    return false;
  }
}

// ============================================
// Helper Functions
// ============================================
export function getProjectIdFromNotification(notification: any): string | null {
  return (
    notification.data?.projectId ||
    notification.projectId ||
    notification.metadata?.projectId ||
    null
  );
}

export function getTaskIdFromNotification(notification: any): string | null {
  return notification.data?.taskId || notification.taskId || notification.metadata?.taskId || null;
}
