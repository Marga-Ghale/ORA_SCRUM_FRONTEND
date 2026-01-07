// ============================================
// UPDATED: src/utils/navigationHelpers.ts
// Handles projects without folderId
// ============================================

import { NavigateFunction } from 'react-router-dom';
import apiClient from '../lib/api';
import { ProjectResponse } from '../hooks/api/useProjects';
import { FolderResponse } from '../hooks/api/useFolder';
import { SpaceResponse } from '../hooks/api/useSpaces';
import { WorkspaceResponse } from '../hooks/api/useWorkspaces';
import { Workspace, Space, Folder, Project } from '../types/project';

/**
 * Maps backend responses to frontend types
 */
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

/**
 * Fetches the complete hierarchy for a project from the API
 * ✅ NOW HANDLES PROJECTS WITHOUT FOLDERS
 */
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
    console.log('🔍 Project has folderId?', project.folderId);
    console.log('🔍 Project has spaceId?', project.spaceId);

    // ✅ CHECK: Does project have spaceId?
    if (!project.spaceId) {
      console.error('❌ Project missing spaceId');
      return null;
    }

    // ✅ NEW: Handle projects without folders
    let folder: FolderResponse | null = null;

    if (project.folderId) {
      // Project has a folder - fetch it
      folder = await apiClient.get<FolderResponse>(`/folders/${project.folderId}`);
      console.log('✅ Folder:', folder);
    } else {
      console.log('⚠️ Project has no folder (legacy project)');
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

/**
 * Main navigation function: Sets up context and navigates to project
 * ✅ NOW HANDLES PROJECTS WITHOUT FOLDERS
 */
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

    // Set the context state in the correct order
    setContextState.setCurrentWorkspace(hierarchy.workspace);
    setContextState.setCurrentSpace(hierarchy.space);

    // ✅ NEW: Handle null folder (legacy projects)
    if (hierarchy.folder) {
      setContextState.setCurrentFolder(hierarchy.folder);
    } else {
      // For projects without folders, set folder to null
      // This allows the app to work with legacy data
      setContextState.setCurrentFolder(null);
    }

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

/**
 * Navigate to a specific task within a project
 */
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

    // First navigate to the project (sets up context)
    const success = await navigateToProject(projectId, navigate, setContextState);

    if (!success) {
      return false;
    }

    // Add task ID as URL parameter
    navigate(`/project/${projectId}/board?taskId=${taskId}`);
    console.log('✅ Task navigation complete');

    return true;
  } catch (error) {
    console.error('❌ Task navigation error:', error);
    return false;
  }
}

/**
 * Extract projectId from notification data
 */
export function getProjectIdFromNotification(notification: any): string | null {
  return (
    notification.data?.projectId ||
    notification.projectId ||
    notification.metadata?.projectId ||
    null
  );
}

/**
 * Extract taskId from notification data
 */
export function getTaskIdFromNotification(notification: any): string | null {
  return notification.data?.taskId || notification.taskId || notification.metadata?.taskId || null;
}
