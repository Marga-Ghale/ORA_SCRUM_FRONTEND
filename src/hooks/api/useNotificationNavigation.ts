// src/hooks/useNotificationNavigation.ts
import { useCallback } from 'react';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { api } from '../../lib/api';
import { useProjectContext } from '../../context/ProjectContext';

const STORAGE_KEYS = {
  WORKSPACE: 'selectedWorkspaceId',
  SPACE: 'selectedSpaceId',
  PROJECT: 'selectedProjectId',
  FOLDER: 'selectedFolderId',
};

// ============================================================================
// STANDALONE NAVIGATION FUNCTION (NO HOOKS)
// ============================================================================
export const navigateToTaskWithHierarchy = async (
  taskId: string,
  projectId: string | undefined,
  navigate: NavigateFunction,
  setters: {
    setCurrentWorkspace: (workspace: any) => void;
    setCurrentSpace: (space: any) => void;
    setCurrentFolder: (folder: any) => void;
    setCurrentProject: (project: any) => void;
  }
) => {
  try {
    // ------------------------------------------------------------------------
    // 1. TASK
    // ------------------------------------------------------------------------
    const taskResponse = await api.get(`/tasks/${taskId}`);
    const task = taskResponse.data;

    const targetProjectId = projectId || task.projectId;
    if (!targetProjectId) {
      console.error('No project ID found for task');
      return;
    }

    // ------------------------------------------------------------------------
    // 2. PROJECT
    // ------------------------------------------------------------------------
    const projectResponse = await api.get(`/projects/${targetProjectId}`);
    const project = projectResponse.data;

    // ------------------------------------------------------------------------
    // 3. SPACE
    // ------------------------------------------------------------------------
    const spaceResponse = await api.get(`/spaces/${project.spaceId}`);
    const space = spaceResponse.data;

    // ------------------------------------------------------------------------
    // 4. WORKSPACE (ACCESSIBLE WORKSPACES)
    // ------------------------------------------------------------------------
    const workspacesResponse = await api.get('/members/my/accessible/workspaces');
    const workspaces = workspacesResponse.data;

    // Debug
    console.log('Space object:', space);
    console.log('Space workspace_id:', space?.workspace_id);

    if (!space?.workspace_id) {
      console.error('Workspace ID is missing in space:', space);
      throw new Error('Workspace ID is undefined');
    }

    // Find the workspace using the correct key
    const workspace = workspaces.find(
      (w: any) => w.ID === space.workspace_id || w.id === space.workspace_id
    );

    if (!workspace) {
      console.error('Workspace not found for space:', space.workspace_id);
      throw new Error(`Workspace not found for space: ${space.workspace_id}`);
    }

    // ------------------------------------------------------------------------
    // 5. FOLDER (OPTIONAL)
    // ------------------------------------------------------------------------
    let folder = null;
    if (project.folderId) {
      const folderResponse = await api.get(`/folders/${project.folderId}`);
      folder = folderResponse.data;
    }

    // ------------------------------------------------------------------------
    // 6. SET CONTEXT + LOCALSTORAGE (NORMALIZED)
    // ------------------------------------------------------------------------
    setters.setCurrentWorkspace({
      id: workspace.ID || workspace.id,
      name: workspace.Name || workspace.name,
      icon: workspace.Icon || '🏢',
      spaces: [],
      members: [],
      createdAt: new Date(workspace.CreatedAt || workspace.created_at),
      updatedAt: new Date(workspace.UpdatedAt || workspace.updated_at),
    });
    localStorage.setItem(STORAGE_KEYS.WORKSPACE, workspace.ID || workspace.id);

    setters.setCurrentSpace({
      id: space.id,
      name: space.name,
      icon: space.icon || '📁',
      color: space.color || '#6366f1',
      projects: [],
    });
    localStorage.setItem(STORAGE_KEYS.SPACE, space.id);

    if (folder) {
      setters.setCurrentFolder({
        id: folder.id,
        name: folder.name,
        icon: folder.icon || '📂',
        color: folder.color || '#6366f1',
        spaceId: folder.spaceId,
        projects: [],
      });
      localStorage.setItem(STORAGE_KEYS.FOLDER, folder.id);
    } else {
      setters.setCurrentFolder(null);
      localStorage.removeItem(STORAGE_KEYS.FOLDER);
    }

    setters.setCurrentProject({
      id: project.id,
      name: project.name,
      key: project.key,
      description: project.description,
      icon: '📋',
      color: '#6366f1',
      sprints: [],
      members: [],
    });
    localStorage.setItem(STORAGE_KEYS.PROJECT, project.id);

    // ------------------------------------------------------------------------
    // 7. NAVIGATE
    // ------------------------------------------------------------------------
    navigate(`/project/${project.id}/board`);
  } catch (error) {
    console.error('Failed to navigate to task:', error);
  }
};

// ============================================================================
// HOOK WRAPPER (FOR COMPONENTS)
// ============================================================================
export const useNotificationNavigation = () => {
  const navigate = useNavigate();
  const { setCurrentWorkspace, setCurrentSpace, setCurrentFolder, setCurrentProject } =
    useProjectContext();

  const navigateToTask = useCallback(
    async (taskId: string, projectId?: string) => {
      await navigateToTaskWithHierarchy(taskId, projectId, navigate, {
        setCurrentWorkspace,
        setCurrentSpace,
        setCurrentFolder,
        setCurrentProject,
      });
    },
    [navigate, setCurrentWorkspace, setCurrentSpace, setCurrentFolder, setCurrentProject]
  );

  return { navigateToTask };
};
