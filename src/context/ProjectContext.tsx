// src/context/ProjectContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useMemo,
} from 'react';
import { Task, TaskStatus, Project, Space, Workspace } from '../types/project';
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
  useProjectsBySpace,
  useUpdateProject,
} from '../hooks/api/useProjects';
import {
  useDeleteTask,
  useTasksByProject,
  useUpdateTask,
  useUpdateTaskStatus,
} from '../hooks/api/useTasks';
import { User } from '../hooks/useUser';
import { Label } from '../hooks/api/useLabels';

// ============================================
// Context Type
// ============================================

interface ProjectContextType {
  // Current selections
  currentWorkspace: Workspace | null;
  currentSpace: Space | null;
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

  // Actions
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setCurrentSpace: (space: Space | null) => void;
  setCurrentProject: (project: Project | null) => void;
  setSelectedTask: (task: Task | null) => void;

  // Task operations
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  moveTask: (taskId: string, toStatus: TaskStatus, toIndex: number) => void;
  deleteTask: (taskId: string) => void;

  // Space operations
  createSpace: (spaceData: { name: string; color?: string; icon?: string }) => Promise<void>;
  updateSpace: (
    spaceId: string,
    updates: { name?: string; description?: string; icon?: string; color?: string }
  ) => Promise<void>;
  deleteSpace: (spaceId: string) => Promise<void>;

  // Project operations
  createProject: (
    spaceId: string,
    projectData: { name: string; key: string; description?: string }
  ) => Promise<void>;
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

  // Task detail modal
  isTaskModalOpen: boolean;
  openTaskModal: (task: Task) => void;
  closeTaskModal: () => void;

  // Modal states
  isCreateSpaceModalOpen: boolean;
  setIsCreateSpaceModalOpen: (open: boolean) => void;
  isCreateProjectModalOpen: boolean;
  setIsCreateProjectModalOpen: (open: boolean) => void;
  isCreateTaskModalOpen: boolean;
  setIsCreateTaskModalOpen: (open: boolean) => void;
  createTaskInitialStatus: TaskStatus;
  setCreateTaskInitialStatus: (status: TaskStatus) => void;
}

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

import { dateToISO } from '../utils/dateUtils';

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
    startDate: dateToISO(task.startDate), // ✅ convert to string
    dueDate: dateToISO(task.dueDate), // ✅ convert to string
    completedAt: dateToISO(task.completedAt), // ✅ convert to string
    sprintId: task.sprintId,
    parentTaskId: task.parentTaskId,
    watcherIds: task.watcherIds || [],
    createdBy: task.createdBy,
    createdAt: dateToISO(task.createdAt), // ✅ convert to string
    updatedAt: dateToISO(task.updatedAt), // ✅ convert to string
  };
};

const mapSpace = (space: any): Space => ({
  id: space.id,
  name: space.name,
  icon: space.icon || '📁',
  color: space.color || '#6366f1',
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

  // ============================================
  // Selection State
  // ============================================
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [createTaskInitialStatus, setCreateTaskInitialStatus] = useState<TaskStatus>('todo');

  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // ============================================
  // Data Hooks
  // ============================================

  // Fetch workspaces
  const { data: workspacesData, isLoading: workspacesLoading } = useWorkspaces({
    enabled: isAuthenticated,
  });

  // Fetch spaces for current workspace
  const { data: spacesData, refetch: refetchSpaces } = useSpacesByWorkspace(
    currentWorkspace?.id || '',
    { enabled: !!currentWorkspace?.id }
  );

  // Fetch projects for current space
  const { data: projectsData, refetch: refetchProjects } = useProjectsBySpace(
    currentSpace?.id || '',
    {
      enabled: !!currentSpace?.id,
    }
  );

  // Fetch tasks for current project
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
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const updateTaskMutation = useUpdateTask();
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const deleteTaskMutation = useDeleteTask();

  // ============================================
  // Computed Values
  // ============================================
  const allSpaces = useMemo(() => {
    if (!spacesData) return [];
    return spacesData.map(mapSpace);
  }, [spacesData]);

  const tasks: Task[] = useMemo(() => {
    if (!tasksData) return [];
    return tasksData.map(mapTask);
  }, [tasksData]);

  // ============================================
  // Initialize workspace (ONLY ONCE)
  // ============================================
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentWorkspace(null);
      setCurrentSpace(null);
      setCurrentProject(null);
      setIsInitializing(false);
      return;
    }

    if (workspacesLoading) return;
    if (currentWorkspace) {
      setIsInitializing(false);
      return;
    }

    const initialize = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        let workspace = workspacesData?.[0];

        if (!workspace) {
          workspace = await createWorkspaceMutation.mutateAsync({
            name: 'My Workspace',
          });
        }

        const mappedWorkspace = mapWorkspace(workspace);
        setCurrentWorkspace(mappedWorkspace);
      } catch (error) {
        console.error('[ProjectContext] Initialization error:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize');
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [isAuthenticated, workspacesLoading, workspacesData]);

  // ============================================
  // Set current space when spaces load
  // ============================================
  useEffect(() => {
    if (!currentWorkspace || !spacesData || spacesData.length === 0) return;
    if (currentSpace) return;

    const firstSpace = mapSpace(spacesData[0]);
    setCurrentSpace(firstSpace);
  }, [spacesData, currentWorkspace]);

  // ============================================
  // Set current project when projects load
  // ============================================
  useEffect(() => {
    if (!currentSpace || !projectsData || projectsData.length === 0) return;
    if (currentProject) return;

    const firstProject = mapProject(projectsData[0]);
    setCurrentProject(firstProject);
  }, [projectsData, currentSpace]);

  // ============================================
  // Task Operations
  // ============================================
  const updateTaskStatus = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      const backendStatus = mapStatusFromBackend(newStatus);
      updateTaskStatusMutation.mutate({ id: taskId, status: backendStatus });
    },
    [updateTaskStatusMutation]
  );

  const moveTask = useCallback(
    (taskId: string, toStatus: TaskStatus) => {
      const backendStatus = mapStatusFromBackend(toStatus);

      // Update task status and position
      updateTaskMutation.mutate(
        {
          id: taskId,
          data: {
            status: backendStatus,
            // You might want to add position logic here if your backend supports it
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
        },
      });
    },
    [deleteTaskMutation, selectedTask]
  );

  // ============================================
  // Space Operations
  // ============================================
  const createSpace = useCallback(
    async (spaceData: { name: string; color?: string; icon?: string }) => {
      if (!currentWorkspace) {
        throw new Error('No workspace selected');
      }

      await createSpaceMutation.mutateAsync({
        workspaceId: currentWorkspace.id,
        data: spaceData,
      });

      await refetchSpaces();
    },
    [currentWorkspace, createSpaceMutation, refetchSpaces]
  );

  const updateSpace = useCallback(
    async (
      spaceId: string,
      updates: { name?: string; description?: string; icon?: string; color?: string }
    ) => {
      await updateSpaceMutation.mutateAsync({ id: spaceId, data: updates });
      await refetchSpaces();
    },
    [updateSpaceMutation, refetchSpaces]
  );

  const deleteSpace = useCallback(
    async (spaceId: string) => {
      await deleteSpaceMutation.mutateAsync(spaceId);

      if (currentSpace?.id === spaceId) {
        const remainingSpaces = spacesData?.filter((s) => s.id !== spaceId) || [];
        if (remainingSpaces.length > 0) {
          setCurrentSpace(mapSpace(remainingSpaces[0]));
        } else {
          setCurrentSpace(null);
          setCurrentProject(null);
        }
      }
    },
    [deleteSpaceMutation, currentSpace, spacesData]
  );

  // ============================================
  // Project Operations
  // ============================================
  const createProject = useCallback(
    async (spaceId: string, projectData: { name: string; key: string; description?: string }) => {
      const newProject = await createProjectMutation.mutateAsync({
        spaceId,
        data: projectData,
      });

      setCurrentProject(mapProject(newProject));
      await refetchProjects();
    },
    [createProjectMutation, refetchProjects]
  );

  const updateProject = useCallback(
    async (projectId: string, updates: { name?: string; description?: string }) => {
      await updateProjectMutation.mutateAsync({ id: projectId, data: updates });
      await refetchProjects();
    },
    [updateProjectMutation, refetchProjects]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      await deleteProjectMutation.mutateAsync(projectId);

      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
      await refetchProjects();
    },
    [deleteProjectMutation, currentProject, refetchProjects]
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
  // Context Value
  // ============================================
  const value: ProjectContextType = {
    currentWorkspace,
    currentSpace,
    currentProject,
    selectedTask,
    isInitializing,
    initError,
    tasks,
    tasksLoading,
    tasksError: tasksError as Error | null,
    refetchTasks,
    allSpaces,
    setCurrentWorkspace,
    setCurrentSpace,
    setCurrentProject,
    setSelectedTask,
    updateTaskStatus,
    moveTask,
    deleteTask,
    createSpace,
    updateSpace,
    deleteSpace,
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
    isCreateProjectModalOpen,
    setIsCreateProjectModalOpen,
    isCreateTaskModalOpen,
    setIsCreateTaskModalOpen,
    createTaskInitialStatus,
    setCreateTaskInitialStatus,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within a ProjectProvider');
  return context;
};
