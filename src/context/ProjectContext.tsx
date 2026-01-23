/* eslint-disable react-hooks/rules-of-hooks */
// src/context/ProjectContext.tsx - FIXED VERSION

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Task, TaskStatus, Project, Space, Workspace, Folder } from '../types/project';
import { useAuth } from '../components/UserProfile/AuthContext';
import { useCreateWorkspace, useWorkspaces } from '../hooks/api/useWorkspaces';
import {
  useCreateSpace,
  useDeleteSpace,
  useSpacesByWorkspace,
  useUpdateSpace,
} from '../hooks/api/useSpaces';

import {
  useCreateProject,
  useDeleteProject,
  useProjectsByFolder,
  useProjectsBySpace,
  useUpdateProject,
} from '../hooks/api/useProjects';
import {
  useDeleteTask,
  useTasksByProject,
  useUpdateTask,
  useUpdateTaskStatus,
} from '../hooks/api/useTasks';
import { User } from '../hooks/useUsers';
import { Label } from '../hooks/api/useLabels';
import { dateToISO } from '../utils/dateUtils';
import { useWebSocket } from '../hooks/api/useWebsocket';
import {
  useCreateFolder,
  useDeleteFolder,
  useFoldersBySpace,
  useUpdateFolder,
} from '../hooks/api/useFolder';
import { useQueryClient } from '@tanstack/react-query';

// ============================================
// LocalStorage Keys
// ============================================
const STORAGE_KEYS = {
  WORKSPACE: 'selectedWorkspaceId',
  SPACE: 'selectedSpaceId',
  PROJECT: 'selectedProjectId',
  FOLDER: 'selectedFolderId',
} as const;

// ============================================
// Context Type
// ============================================

interface CreationContext {
  spaceId: string | null;
  spaceName: string | null;
  folderId: string | null;
  folderName: string | null;
}

interface ProjectContextType {
  // Current selections
  currentWorkspace: Workspace | null;
  currentSpace: Space | null;
  currentFolder: Folder | null;
  currentProject: Project | null;
  selectedTask: Task | null;

  // Loading states
  isInitializing: boolean;
  initError: string | null;

  // Tasks
  tasks: Task[];
  tasksLoading: boolean;
  tasksError: Error | null;
  refetchTasks: () => void;

  // Computed data
  allSpaces: Space[];
  allFolders: Folder[];
  allProjects: Project[];

  // Actions
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setCurrentSpace: (space: Space | null) => void;
  setCurrentFolder: (folder: Folder | null) => void;
  setCurrentProject: (project: Project | null) => void;
  setSelectedTask: (task: Task | null) => void;

  // Task operations
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  moveTask: (taskId: string, toStatus: TaskStatus, toIndex: number) => void;
  deleteTask: (taskId: string) => void;

  // Space operations
  createSpace: (spaceData: {
    name: string;
    color?: string;
    icon?: string;
    workspaceId?: string;
  }) => Promise<void>;
  updateSpace: (
    spaceId: string,
    updates: { name?: string; description?: string; icon?: string; color?: string }
  ) => Promise<void>;
  deleteSpace: (spaceId: string) => Promise<void>;

  // Folder operations
  createFolder: (folderData: {
    name: string;
    color?: string;
    icon?: string;
    spaceId?: string;
  }) => Promise<void>;
  updateFolder: (
    folderId: string,
    updates: { name?: string; description?: string; icon?: string; color?: string }
  ) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;

  // Project operations - FIXED: now accepts folderId
  createProject: (projectData: {
    name: string;
    key: string;
    description?: string;
    spaceId?: string;
    folderId?: string;
  }) => Promise<void>;
  updateProject: (
    projectId: string,
    updates: { name?: string; description?: string }
  ) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  // View state
  viewMode: 'board' | 'list' | 'table' | 'timeline';
  setViewMode: (mode: 'board' | 'list' | 'table' | 'timeline') => void;

  // Filters
  filters: {
    search: string;
    assigneeIds: User[];
    priorities: string[];
    labelIds: Label[];
    types: string[];
  };
  setFilters: React.Dispatch<React.SetStateAction<ProjectContextType['filters']>>;

  managementEntity: ManagementEntity;
  setManagementEntity: (managementEntity: ManagementEntity | null) => void;

  // Task detail modal
  isTaskModalOpen: boolean;
  openTaskModal: (task: Task) => void;
  closeTaskModal: () => void;

  // Modal states
  isCreateSpaceModalOpen: boolean;
  setIsCreateSpaceModalOpen: (open: boolean) => void;
  isCreateFolderModalOpen: boolean;
  setIsCreateFolderModalOpen: (open: boolean) => void;
  isCreateProjectModalOpen: boolean;
  setIsCreateProjectModalOpen: (open: boolean) => void;
  isCreateTaskModalOpen: boolean;
  setIsCreateTaskModalOpen: (open: boolean) => void;
  createTaskInitialStatus: TaskStatus;
  setCreateTaskInitialStatus: (status: TaskStatus) => void;

  creationContext: CreationContext;
  setCreationContext: (context: CreationContext) => void;
}

type ManagementEntity = {
  entityType: 'workspace' | 'space' | 'folder' | 'project';
  entityId: string;
  entityName: string;
} | null;

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// ============================================
// Mapper Functions
// ============================================

const mapStatusFromBackend = (status: string): TaskStatus => {
  const statusMap: Record<string, TaskStatus> = {
    backlog: 'backlog',
    todo: 'todo',
    in_progress: 'in_progress',
    in_review: 'in_review',
    done: 'done',
  };
  return statusMap[status] || 'backlog';
};

const mapTask = (task: any): Task => {
  const priorityMap: Record<string, Task['priority']> = {
    urgent: 'urgent',
    high: 'high',
    medium: 'medium',
    low: 'low',
    none: 'none',
  };

  const typeMap: Record<string, Task['type']> = {
    epic: 'epic',
    story: 'story',
    task: 'task',
    bug: 'bug',
    subtask: 'subtask',
  };

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: mapStatusFromBackend(task.status),
    priority: priorityMap[task.priority?.toLowerCase()] || 'medium',
    type: typeMap[task.type?.toLowerCase()] || 'task',
    assigneeIds: task.assigneeIds || [],
    labelIds: task.labelIds || [],
    storyPoints: task.storyPoints,
    estimatedHours: task.estimatedHours,
    actualHours: task.actualHours,
    blocked: task.blocked,
    position: task.position || 0,
    startDate: dateToISO(task.startDate),
    dueDate: dateToISO(task.dueDate),
    completedAt: dateToISO(task.completedAt),
    sprintId: task.sprintId,
    parentTaskId: task.parentTaskId,
    watcherIds: task.watcherIds || [],
    createdBy: task.createdBy,
    createdAt: dateToISO(task.createdAt),
    updatedAt: dateToISO(task.updatedAt),
    projectId: task.projectId,
    assignee: task.assignee || null,
    label: task.label || null,
  };
};

const mapSpace = (space: any): Space => ({
  id: space.id,
  name: space.name,
  icon: space.icon || '📁',
  color: space.color || '#6366f1',
  projects: [],
});

const mapFolder = (folder: any): Folder => ({
  id: folder.id,
  name: folder.name,
  icon: folder.icon || '📂',
  color: folder.color || '#6366f1',
  spaceId: folder.space_id || folder.spaceId,
  projects: [],
});

const mapProject = (project: any): Project => ({
  id: project.id,
  name: project.name,
  key: project.key,
  description: project.description,
  icon: '📋',
  color: '#6366f1',
  sprints: [],
  members: [],
});

const mapWorkspace = (workspace: any, spaces: Space[] = []): Workspace => ({
  id: workspace.id,
  name: workspace.name,
  icon: '🏢',
  spaces: spaces,
  members: [],
  createdAt: new Date(workspace.created_at || workspace.createdAt || Date.now()),
  updatedAt: new Date(workspace.updated_at || workspace.updatedAt || Date.now()),
});

// ============================================
// Provider Component
// ============================================

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // ============================================
  // Selection State
  // ============================================
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [currentSpace, setCurrentSpaceState] = useState<Space | null>(null);
  const [currentFolder, setCurrentFolderState] = useState<Folder | null>(null);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [managementEntity, setManagementEntity] = useState<ManagementEntity>(null);

  const [creationContext, setCreationContext] = useState<CreationContext>({
    spaceId: null,
    spaceName: null,
    folderId: null,
    folderName: null,
  });

  // ============================================
  // Navigation Guard - Prevents auto-selection from overriding navigation
  // ============================================
  const isNavigatingRef = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Wrapped setters that track navigation state
  const setCurrentWorkspace = useCallback((workspace: Workspace | null) => {
    setCurrentWorkspaceState(workspace);
    if (workspace) {
      localStorage.setItem(STORAGE_KEYS.WORKSPACE, workspace.id);
    }
  }, []);

  const setCurrentSpace = useCallback((space: Space | null) => {
    setCurrentSpaceState(space);
    if (space) {
      localStorage.setItem(STORAGE_KEYS.SPACE, space.id);
    }
  }, []);

  const setCurrentFolder = useCallback((folder: Folder | null) => {
    setCurrentFolderState(folder);
    if (folder) {
      localStorage.setItem(STORAGE_KEYS.FOLDER, folder.id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.FOLDER);
    }
  }, []);

  const setCurrentProject = useCallback((project: Project | null) => {
    isNavigatingRef.current = true;

    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    setCurrentProjectState(project);

    if (project) {
      localStorage.setItem(STORAGE_KEYS.PROJECT, project.id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.PROJECT);
    }

    navigationTimeoutRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);
  }, []);

  // ============================================
  // UI State
  // ============================================
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'table' | 'timeline'>('board');
  const [filters, setFilters] = useState({
    search: '',
    assigneeIds: [] as User[],
    priorities: [] as string[],
    labelIds: [] as Label[],
    types: [] as string[],
  });

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateSpaceModalOpen, setIsCreateSpaceModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [createTaskInitialStatus, setCreateTaskInitialStatus] = useState<TaskStatus>('todo');

  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const hasRestoredRef = useRef(false);

  // ============================================
  // Data Hooks
  // ============================================

  const { data: workspacesData, isLoading: workspacesLoading } = useWorkspaces({
    enabled: isAuthenticated,
  });

  const { data: spacesData, refetch: refetchSpaces } = useSpacesByWorkspace(
    currentWorkspace?.id || '',
    { enabled: !!currentWorkspace?.id }
  );

  const { data: foldersData, refetch: refetchFolders } = useFoldersBySpace(currentSpace?.id || '', {
    enabled: !!currentSpace?.id,
  });

  const { data: projectsDataByFolder, refetch: refetchProjectsByFolder } = useProjectsByFolder(
    currentFolder?.id || '',
    { enabled: !!currentFolder?.id }
  );

  const { data: projectsDataBySpace, refetch: refetchProjectsBySpace } = useProjectsBySpace
    ? useProjectsBySpace(currentSpace?.id || '', {
        enabled: !!currentSpace?.id && !currentFolder?.id,
      })
    : { data: undefined, refetch: () => {} };

  const projectsData = currentFolder?.id ? projectsDataByFolder : projectsDataBySpace;

  const refetchProjects = useCallback(() => {
    if (currentFolder?.id) {
      refetchProjectsByFolder();
    } else if (currentSpace?.id) {
      refetchProjectsBySpace();
    }
  }, [currentFolder?.id, currentSpace?.id, refetchProjectsByFolder, refetchProjectsBySpace]);

  const {
    data: tasksData,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useTasksByProject(currentProject?.id || '', { enabled: !!currentProject?.id });

  // ============================================
  // Mutations
  // ============================================
  const createWorkspaceMutation = useCreateWorkspace();
  const createSpaceMutation = useCreateSpace();
  const updateSpaceMutation = useUpdateSpace();
  const deleteSpaceMutation = useDeleteSpace();
  const createFolderMutation = useCreateFolder();
  const updateFolderMutation = useUpdateFolder();
  const deleteFolderMutation = useDeleteFolder();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const updateTaskMutation = useUpdateTask();
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const deleteTaskMutation = useDeleteTask();

  // ============================================
  // Helper to invalidate all accessible queries
  // ============================================
  const invalidateAccessibleQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['accessibleWorkspaces'] });
    queryClient.invalidateQueries({ queryKey: ['accessibleSpaces'] });
    queryClient.invalidateQueries({ queryKey: ['accessibleFolders'] });
    queryClient.invalidateQueries({ queryKey: ['accessibleProjects'] });
  }, [queryClient]);

  // ============================================
  // WebSocket Integration
  // ============================================
  const wsHookResult = useWebSocket({
    onMessage: (message) => {
      const data = message.payload || message.data || {};

      if (message.type !== 'ping' && message.type !== 'pong') {
        console.log('📨 WebSocket:', message.type, data);
      }

      if (message.type === 'task_updated' && currentProject?.id) {
        if (data.projectId === currentProject.id) {
          refetchTasks();
        }
      }

      if (message.type === 'task_created' && currentProject?.id) {
        if (data.projectId === currentProject.id) {
          refetchTasks();
        }
      }

      if (message.type === 'task_deleted' && currentProject?.id) {
        if (data.projectId === currentProject.id) {
          refetchTasks();
        }
      }

      if (message.type === 'task_status_changed' && currentProject?.id) {
        if (data.projectId === currentProject.id) {
          refetchTasks();
        }
      }

      if (message.type === 'task_assigned' && currentProject?.id) {
        if (data.projectId === currentProject.id) {
          refetchTasks();
        }
      }

      if (message.type === 'comment_added' && currentProject?.id) {
        refetchTasks();
      }
    },
  });

  useEffect(() => {
    if (currentProject?.id && wsHookResult.joinRoom) {
      const room = `project:${currentProject.id}`;
      wsHookResult.joinRoom(room);

      return () => {
        if (wsHookResult.leaveRoom) {
          wsHookResult.leaveRoom(room);
        }
      };
    }
  }, [currentProject?.id, wsHookResult.joinRoom, wsHookResult.leaveRoom]);

  // ============================================
  // Computed Values
  // ============================================
  const allSpaces = useMemo(() => {
    if (!spacesData) return [];
    return spacesData.map(mapSpace);
  }, [spacesData]);

  const allFolders = useMemo(() => {
    if (!foldersData) return [];
    return foldersData.map(mapFolder);
  }, [foldersData]);

  const allProjects = useMemo(() => {
    if (!projectsData) return [];
    return projectsData.map(mapProject);
  }, [projectsData]);

  const tasks: Task[] = useMemo(() => {
    if (!tasksData) return [];
    return tasksData.map(mapTask);
  }, [tasksData]);

  // ============================================
  // Initialize & Restore from localStorage (ONCE)
  // ============================================
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentWorkspaceState(null);
      setCurrentSpaceState(null);
      setCurrentFolderState(null);
      setCurrentProjectState(null);
      setIsInitializing(false);
      hasRestoredRef.current = false;
      return;
    }

    if (workspacesLoading) return;
    if (hasRestoredRef.current) {
      setIsInitializing(false);
      return;
    }

    const initialize = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        // ✅ FIX 1: Check if we already have workspaces
        if (!workspacesData || workspacesData.length === 0) {
          // Only create if truly no workspaces exist
          const newWorkspace = await createWorkspaceMutation.mutateAsync({
            name: 'General Workspace',
          });
          const mappedWorkspace = mapWorkspace(newWorkspace);
          setCurrentWorkspaceState(mappedWorkspace);
          localStorage.setItem(STORAGE_KEYS.WORKSPACE, mappedWorkspace.id);
          hasRestoredRef.current = true;
          return;
        }

        // We have workspaces - select one
        let workspace = workspacesData[0];
        const savedWorkspaceId = localStorage.getItem(STORAGE_KEYS.WORKSPACE);

        if (savedWorkspaceId) {
          const savedWorkspace = workspacesData.find((w) => w.id === savedWorkspaceId);
          if (savedWorkspace) {
            workspace = savedWorkspace;
          }
        }

        const mappedWorkspace = mapWorkspace(workspace);
        setCurrentWorkspaceState(mappedWorkspace);
        localStorage.setItem(STORAGE_KEYS.WORKSPACE, mappedWorkspace.id);
        hasRestoredRef.current = true;
      } catch (error) {
        console.error('[ProjectContext] Initialization error:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize');
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();

    // ✅ FIX 2: Only depend on primitive values, not objects/arrays
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, workspacesLoading]);
  // Remove workspacesData and createWorkspaceMutation from dependencies!

  useEffect(() => {
    if (!currentWorkspace || !spacesData || spacesData.length === 0) return;
    if (currentSpace) return;
    if (isNavigatingRef.current) return;

    const savedSpaceId = localStorage.getItem(STORAGE_KEYS.SPACE);

    if (savedSpaceId) {
      const savedSpace = spacesData.find(
        (s) => s.id === savedSpaceId && s.workspace_id === currentWorkspace.id
      );
      if (savedSpace) {
        setCurrentSpaceState(mapSpace(savedSpace));
        return;
      }
    }

    const firstSpace = mapSpace(spacesData[0]);
    setCurrentSpaceState(firstSpace);
    localStorage.setItem(STORAGE_KEYS.SPACE, firstSpace.id);
  }, [spacesData, currentWorkspace, currentSpace]);

  useEffect(() => {
    if (!currentSpace || !foldersData || foldersData.length === 0) return;
    if (currentFolder) return;
    if (isNavigatingRef.current) return;

    const savedFolderId = localStorage.getItem(STORAGE_KEYS.FOLDER);

    if (savedFolderId) {
      const savedFolder = foldersData.find(
        (f) =>
          f.id === savedFolderId &&
          (f.space_id === currentSpace.id || f.space_id === currentSpace.id)
      );
      if (savedFolder) {
        setCurrentFolderState(mapFolder(savedFolder));
        return;
      }
    }

    const firstFolder = mapFolder(foldersData[0]);
    setCurrentFolderState(firstFolder);
    localStorage.setItem(STORAGE_KEYS.FOLDER, firstFolder.id);
  }, [foldersData, currentSpace, currentFolder]);

  useEffect(() => {
    if (isNavigatingRef.current) {
      return;
    }

    if (!projectsData || projectsData.length === 0) return;
    if (currentProject) return;

    const savedProjectId = localStorage.getItem(STORAGE_KEYS.PROJECT);

    if (savedProjectId) {
      const savedProject = projectsData.find((p) => p.id === savedProjectId);
      if (savedProject) {
        setCurrentProjectState(mapProject(savedProject));
        return;
      }
    }

    const firstProject = mapProject(projectsData[0]);
    setCurrentProjectState(firstProject);
    localStorage.setItem(STORAGE_KEYS.PROJECT, firstProject.id);
  }, [projectsData, currentProject]);

  useEffect(() => {
    if (currentWorkspace && currentSpace) {
      const spaceInWorkspace = spacesData?.some(
        (s) => s.id === currentSpace.id && s.workspace_id === currentWorkspace.id
      );
      if (spacesData && !spaceInWorkspace) {
        setCurrentSpaceState(null);
        setCurrentFolderState(null);
        setCurrentProjectState(null);
        localStorage.removeItem(STORAGE_KEYS.SPACE);
        localStorage.removeItem(STORAGE_KEYS.FOLDER);
        localStorage.removeItem(STORAGE_KEYS.PROJECT);
      }
    }
  }, [currentWorkspace?.id, spacesData]);

  // ============================================
  // Task Operations
  // ============================================
  const updateTaskStatus = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      updateTaskStatusMutation.mutate(
        { id: taskId, status: newStatus },
        {
          onSuccess: () => {
            refetchTasks();
          },
        }
      );
    },
    [updateTaskStatusMutation, refetchTasks]
  );

  const moveTask = useCallback(
    (taskId: string, toStatus: TaskStatus, _toIndex: number) => {
      updateTaskMutation.mutate(
        {
          id: taskId,
          data: {
            status: toStatus,
          },
        },
        {
          onSuccess: () => {
            refetchTasks();
          },
        }
      );
    },
    [updateTaskMutation, refetchTasks]
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      deleteTaskMutation.mutate(taskId, {
        onSuccess: () => {
          if (selectedTask?.id === taskId) {
            setSelectedTask(null);
            setIsTaskModalOpen(false);
          }
          refetchTasks();
        },
      });
    },
    [deleteTaskMutation, selectedTask, refetchTasks]
  );

  // ============================================
  // Space Operations
  // ============================================
  const createSpace = useCallback(
    async (spaceData: { name: string; color?: string; icon?: string; workspaceId?: string }) => {
      const workspaceId = spaceData.workspaceId || currentWorkspace?.id;
      if (!workspaceId) {
        throw new Error('No workspace selected');
      }

      await createSpaceMutation.mutateAsync({
        workspaceId,
        data: {
          name: spaceData.name,
          color: spaceData.color,
          icon: spaceData.icon,
        },
      });

      await refetchSpaces();
      invalidateAccessibleQueries();
    },
    [currentWorkspace, createSpaceMutation, refetchSpaces, invalidateAccessibleQueries]
  );

  const updateSpace = useCallback(
    async (
      spaceId: string,
      updates: { name?: string; description?: string; icon?: string; color?: string }
    ) => {
      await updateSpaceMutation.mutateAsync({ id: spaceId, data: updates });
      await refetchSpaces();
      invalidateAccessibleQueries();
    },
    [updateSpaceMutation, refetchSpaces, invalidateAccessibleQueries]
  );

  const deleteSpace = useCallback(
    async (spaceId: string) => {
      await deleteSpaceMutation.mutateAsync(spaceId);

      if (currentSpace?.id === spaceId) {
        const remainingSpaces = spacesData?.filter((s) => s.id !== spaceId) || [];
        if (remainingSpaces.length > 0) {
          setCurrentSpaceState(mapSpace(remainingSpaces[0]));
        } else {
          setCurrentSpaceState(null);
          setCurrentFolderState(null);
          setCurrentProjectState(null);
        }
      }
      invalidateAccessibleQueries();
    },
    [deleteSpaceMutation, currentSpace, spacesData, invalidateAccessibleQueries]
  );

  // ============================================
  // Folder Operations
  // ============================================
  const createFolder = useCallback(
    async (folderData: { name: string; color?: string; icon?: string; spaceId?: string }) => {
      const spaceId = folderData.spaceId || currentSpace?.id;
      if (!spaceId) {
        throw new Error('No space selected');
      }

      await createFolderMutation.mutateAsync({
        spaceId,
        data: {
          name: folderData.name,
          color: folderData.color,
          icon: folderData.icon,
        },
      });

      await refetchFolders();
      invalidateAccessibleQueries();
    },
    [currentSpace, createFolderMutation, refetchFolders, invalidateAccessibleQueries]
  );

  const updateFolder = useCallback(
    async (
      folderId: string,
      updates: { name?: string; description?: string; icon?: string; color?: string }
    ) => {
      await updateFolderMutation.mutateAsync({ id: folderId, data: updates });
      await refetchFolders();
      invalidateAccessibleQueries();
    },
    [updateFolderMutation, refetchFolders, invalidateAccessibleQueries]
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      await deleteFolderMutation.mutateAsync(folderId);

      if (currentFolder?.id === folderId) {
        const remainingFolders = foldersData?.filter((f) => f.id !== folderId) || [];
        if (remainingFolders.length > 0) {
          setCurrentFolderState(mapFolder(remainingFolders[0]));
        } else {
          setCurrentFolderState(null);
          setCurrentProjectState(null);
        }
      }
      invalidateAccessibleQueries();
    },
    [deleteFolderMutation, currentFolder, foldersData, invalidateAccessibleQueries]
  );

  // ============================================
  // Project Operations - FIXED: accepts folderId in data
  // ============================================
  // Corrected createProject function for ProjectContext.tsx

  const createProject = useCallback(
    async (projectData: {
      name: string;
      key: string;
      description?: string;
      spaceId?: string;
      folderId?: string;
    }) => {
      // ✅ Priority: explicit params → creationContext → current selections
      const spaceId = projectData.spaceId || creationContext.spaceId || currentSpace?.id;
      const folderId = projectData.folderId || creationContext.folderId || undefined;

      console.log('🔍 createProject - Resolution:', {
        'projectData.spaceId': projectData.spaceId,
        'projectData.folderId': projectData.folderId,
        'creationContext.spaceId': creationContext.spaceId,
        'creationContext.folderId': creationContext.folderId,
        'currentSpace?.id': currentSpace?.id,
        'currentFolder?.id': currentFolder?.id,
        'RESOLVED spaceId': spaceId,
        'RESOLVED folderId': folderId,
      });

      if (!spaceId) {
        throw new Error('No space selected');
      }

      const newProject = await createProjectMutation.mutateAsync({
        spaceId,
        data: {
          name: projectData.name,
          key: projectData.key,
          description: projectData.description,
          folderId, // ✅ Pass resolved folderId
        },
      });

      setCurrentProjectState(mapProject(newProject));
      localStorage.setItem(STORAGE_KEYS.PROJECT, newProject.id);

      // ✅ Clear creation context after success
      setCreationContext({
        spaceId: null,
        spaceName: null,
        folderId: null,
        folderName: null,
      });

      await refetchProjects();
      invalidateAccessibleQueries();
    },
    [
      currentSpace,
      currentFolder,
      creationContext, // ✅ MUST be in dependencies
      createProjectMutation,
      refetchProjects,
      invalidateAccessibleQueries,
    ]
  );

  const updateProject = useCallback(
    async (projectId: string, updates: { name?: string; description?: string }) => {
      await updateProjectMutation.mutateAsync({ id: projectId, data: updates });
      await refetchProjects();
      invalidateAccessibleQueries();
    },
    [updateProjectMutation, refetchProjects, invalidateAccessibleQueries]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      await deleteProjectMutation.mutateAsync(projectId);

      if (currentProject?.id === projectId) {
        setCurrentProjectState(null);
        localStorage.removeItem(STORAGE_KEYS.PROJECT);
      }
      await refetchProjects();
      invalidateAccessibleQueries();
    },
    [deleteProjectMutation, currentProject, refetchProjects, invalidateAccessibleQueries]
  );

  // ============================================
  // Modal Operations
  // ============================================
  const openTaskModal = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setTimeout(() => setSelectedTask(null), 300);
  }, []);

  // ============================================
  // Cleanup
  // ============================================
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // ============================================
  // Context Value
  // ============================================
  const value: ProjectContextType = {
    currentWorkspace,
    currentSpace,
    currentFolder,
    currentProject,
    selectedTask,
    isInitializing,
    initError,
    tasks,
    tasksLoading,
    tasksError: tasksError as Error | null,
    refetchTasks,
    allSpaces,
    allFolders,
    allProjects,
    setCurrentWorkspace,
    setCurrentSpace,
    setCurrentFolder,
    setCurrentProject,
    setSelectedTask,
    updateTaskStatus,
    moveTask,
    deleteTask,
    createSpace,
    updateSpace,
    deleteSpace,
    createFolder,
    updateFolder,
    deleteFolder,
    createProject,
    updateProject,
    deleteProject,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    isTaskModalOpen,
    openTaskModal,
    closeTaskModal,
    isCreateSpaceModalOpen,
    setIsCreateSpaceModalOpen,
    isCreateFolderModalOpen,
    setIsCreateFolderModalOpen,
    isCreateProjectModalOpen,
    setIsCreateProjectModalOpen,
    isCreateTaskModalOpen,
    setIsCreateTaskModalOpen,
    createTaskInitialStatus,
    setCreateTaskInitialStatus,
    managementEntity,
    setManagementEntity,
    creationContext,
    setCreationContext,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjectContext must be used within a ProjectProvider');
  return context;
};
