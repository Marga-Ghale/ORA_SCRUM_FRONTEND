// src/context/ProjectContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Task, TaskStatus, Project, Space, Sprint, User, Workspace, Label } from '../types/project';
import { mockUsers, mockLabels } from '../data/mockData';
import { useTasks, useUpdateTaskStatus, useDeleteTask as useDeleteTaskMutation, Task as ApiTask } from '../hooks/api/useTasks';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../components/UserProfile/AuthContext';

// API Response Types
interface ApiWorkspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiSpace {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiProject {
  id: string;
  name: string;
  key: string;
  description?: string;
  spaceId: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectContextType {
  // Current selections
  currentWorkspace: Workspace | null;
  currentSpace: Space | null;
  currentProject: Project | null;
  currentSprint: Sprint | null;
  selectedTask: Task | null;

  // All spaces (for sidebar)
  allSpaces: Space[];

  // Loading states
  isInitializing: boolean;
  initError: string | null;

  // Tasks
  tasks: Task[];
  tasksLoading: boolean;
  tasksError: Error | null;
  refetchTasks: () => void;

  // Users & Labels
  users: User[];
  labels: Label[];

  // Actions
  setCurrentSpace: (space: Space | null) => void;
  setCurrentProject: (project: Project | null) => void;
  setCurrentSprint: (sprint: Sprint | null) => void;
  setSelectedTask: (task: Task | null) => void;

  // Task operations
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus, newIndex: number) => void;

  // Space operations
  createSpace: (spaceData: { name: string; color?: string; icon?: string }) => Promise<void>;
  updateSpace: (spaceId: string, updates: Partial<Space>) => void;
  deleteSpace: (spaceId: string) => void;

  // Project operations
  createProject: (spaceId: string, projectData: { name: string; key: string; description?: string }) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;

  // Sprint operations
  createSprint: (sprint: Omit<Sprint, 'id'>) => void;
  updateSprint: (sprintId: string, updates: Partial<Sprint>) => void;
  deleteSprint: (sprintId: string) => void;
  startSprint: (sprintId: string) => void;
  completeSprint: (sprintId: string) => void;

  // Member operations
  inviteMember: (memberData: { email: string; name: string; role: User['role'] }) => void;
  removeMember: (userId: string) => void;
  updateMemberRole: (userId: string, role: User['role']) => void;

  // View state
  viewMode: 'board' | 'list' | 'table' | 'timeline';
  setViewMode: (mode: 'board' | 'list' | 'table' | 'timeline') => void;

  // Filters
  filters: {
    search: string;
    assignees: string[];
    priorities: string[];
    labels: string[];
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
  isCreateSprintModalOpen: boolean;
  setIsCreateSprintModalOpen: (open: boolean) => void;
  isInviteMemberModalOpen: boolean;
  setIsInviteMemberModalOpen: (open: boolean) => void;
  isCreateTaskModalOpen: boolean;
  setIsCreateTaskModalOpen: (open: boolean) => void;
  createTaskInitialStatus: TaskStatus;
  setCreateTaskInitialStatus: (status: TaskStatus) => void;

  // Refresh data
  refreshSpaces: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Helper to map backend status to frontend status
const mapStatusFromBackend = (status: string): TaskStatus => {
  const statusMap: Record<string, TaskStatus> = {
    'BACKLOG': 'backlog',
    'TODO': 'todo',
    'IN_PROGRESS': 'in_progress',
    'IN_REVIEW': 'in_review',
    'DONE': 'done',
    'backlog': 'backlog',
    'todo': 'todo',
    'in_progress': 'in_progress',
    'in_review': 'in_review',
    'done': 'done',
  };
  return statusMap[status] || 'todo';
};

// Helper to map backend task to frontend task format
const mapBackendTask = (task: ApiTask): Task => {
  const priorityMap: Record<string, Task['priority']> = {
    'LOWEST': 'lowest',
    'LOW': 'low',
    'MEDIUM': 'medium',
    'HIGH': 'high',
    'HIGHEST': 'highest',
    'lowest': 'lowest',
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'highest': 'highest',
  };

  const typeMap: Record<string, Task['type']> = {
    'EPIC': 'epic',
    'STORY': 'story',
    'TASK': 'task',
    'BUG': 'bug',
    'SUBTASK': 'subtask',
    'epic': 'epic',
    'story': 'story',
    'task': 'task',
    'bug': 'bug',
    'subtask': 'subtask',
  };

  return {
    id: task.id,
    key: task.key || 'TASK-?',
    title: task.title,
    description: task.description,
    status: mapStatusFromBackend(task.status),
    priority: priorityMap[task.priority] || 'medium',
    type: typeMap[task.type] || 'task',
    assignee: task.assignee ? {
      id: task.assignee.id,
      name: task.assignee.name,
      email: '',
      avatar: task.assignee.avatar,
      role: 'member' as const,
      status: 'online' as const,
    } : undefined,
    reporter: task.reporter ? {
      id: task.reporter.id,
      name: task.reporter.name,
      email: '',
      avatar: task.reporter.avatar,
      role: 'member' as const,
      status: 'online' as const,
    } : {
      id: 'unknown',
      name: 'Unknown',
      email: '',
      role: 'member' as const,
      status: 'offline' as const,
    },
    labels: task.labels?.map((l: string) => ({ id: l, name: l, color: '#6366f1' })) || [],
    storyPoints: task.storyPoints,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    comments: [],
    attachments: [],
    subtasks: [],
    order: 0,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
  };
};

// Helper to convert API project to frontend format
const mapApiProject = (project: ApiProject): Project => ({
  id: project.id,
  name: project.name,
  key: project.key,
  description: project.description,
  icon: '📋',
  color: '#6366f1',
  sprints: [],
  members: [],
});

// Helper to convert API space to frontend format (with projects)
const mapApiSpace = (space: ApiSpace, projects: Project[] = []): Space => ({
  id: space.id,
  name: space.name,
  icon: '📁',
  color: '#6366f1',
  projects: projects,
});

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  // API data state
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // All spaces for the current workspace
  const [allSpaces, setAllSpaces] = useState<Space[]>([]);
  
  // Loading states
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // UI state
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'table' | 'timeline'>('board');
  const [filters, setFilters] = useState<ProjectContextType['filters']>({
    search: '',
    assignees: [],
    priorities: [],
    labels: [],
    types: [],
  });

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateSpaceModalOpen, setIsCreateSpaceModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateSprintModalOpen, setIsCreateSprintModalOpen] = useState(false);
  const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [createTaskInitialStatus, setCreateTaskInitialStatus] = useState<TaskStatus>('todo');
  
  const [users, setUsers] = useState<User[]>(mockUsers);

  // Fetch all spaces with their projects for a workspace
  const fetchSpacesWithProjects = useCallback(async (workspaceId: string): Promise<Space[]> => {
    try {
      const spaces = await apiClient.get<ApiSpace[]>(`/workspaces/${workspaceId}/spaces`);
      console.log('[ProjectContext] Fetched spaces:', spaces.length);

      // Fetch projects for each space
      const spacesWithProjects = await Promise.all(
        spaces.map(async (space) => {
          try {
            const projects = await apiClient.get<ApiProject[]>(`/spaces/${space.id}/projects`);
            return mapApiSpace(space, projects.map(mapApiProject));
          } catch {
            console.log(`[ProjectContext] No projects found for space ${space.id}`);
            return mapApiSpace(space, []);
          }
        })
      );

      return spacesWithProjects;
    } catch {
      console.log('[ProjectContext] No spaces found');
      return [];
    }
  }, []);

  // Refresh spaces (call this after creating a space)
  const refreshSpaces = useCallback(async () => {
    if (!currentWorkspace) return;
    
    const spaces = await fetchSpacesWithProjects(currentWorkspace.id);
    setAllSpaces(spaces);
    
    // Update currentWorkspace with spaces
    setCurrentWorkspace(prev => prev ? { ...prev, spaces } : null);
  }, [currentWorkspace, fetchSpacesWithProjects]);

  // Initialize workspace/space/project from API when authenticated
  useEffect(() => {
    const initializeData = async () => {
      if (!isAuthenticated || !user) {
        setCurrentWorkspace(null);
        setCurrentSpace(null);
        setCurrentProject(null);
        setAllSpaces([]);
        setIsInitializing(false);
        return;
      }

      setIsInitializing(true);
      setInitError(null);

      try {
        console.log('[ProjectContext] Initializing data for user:', user.id);

        // 1. Get workspaces
        let workspaces: ApiWorkspace[] = [];
        try {
          workspaces = await apiClient.get<ApiWorkspace[]>('/workspaces');
          console.log('[ProjectContext] Found workspaces:', workspaces.length);
        } catch {
          console.log('[ProjectContext] No workspaces found, will create one...');
        }

        let workspace: ApiWorkspace;
        if (workspaces.length > 0) {
          workspace = workspaces[0];
        } else {
          workspace = await apiClient.post<ApiWorkspace>('/workspaces', {
            name: 'My Workspace',
          });
          console.log('[ProjectContext] Created workspace:', workspace.id);
        }

        // 2. Fetch ALL spaces with their projects
        const spacesWithProjects = await fetchSpacesWithProjects(workspace.id);
        setAllSpaces(spacesWithProjects);

        // Set workspace with spaces
        const mappedWorkspace: Workspace = {
          id: workspace.id,
          name: workspace.name,
          icon: '🏢',
          spaces: spacesWithProjects,
          members: [],
          createdAt: new Date(workspace.createdAt),
          updatedAt: new Date(workspace.updatedAt),
        };
        setCurrentWorkspace(mappedWorkspace);

        // 3. Set current space (first one or create if none)
        let activeSpace: Space;
        if (spacesWithProjects.length > 0) {
          activeSpace = spacesWithProjects[0];
        } else {
          // Create a default space
          const newSpace = await apiClient.post<ApiSpace>(`/workspaces/${workspace.id}/spaces`, {
            name: 'Engineering',
          });
          activeSpace = mapApiSpace(newSpace, []);
          setAllSpaces([activeSpace]);
          setCurrentWorkspace(prev => prev ? { ...prev, spaces: [activeSpace] } : null);
        }
        setCurrentSpace(activeSpace);

        // 4. Set current project (first one from active space or create if none)
        let activeProject: Project;
        if (activeSpace.projects.length > 0) {
          activeProject = activeSpace.projects[0];
        } else {
          // Create a default project
          const newProject = await apiClient.post<ApiProject>(`/spaces/${activeSpace.id}/projects`, {
            name: 'My Project',
            key: 'PRJ',
          });
          activeProject = mapApiProject(newProject);
          
          // Update the space with the new project
          const updatedSpace = { ...activeSpace, projects: [activeProject] };
          setCurrentSpace(updatedSpace);
          setAllSpaces(prev => prev.map(s => s.id === activeSpace.id ? updatedSpace : s));
          setCurrentWorkspace(prev => prev ? {
            ...prev,
            spaces: prev.spaces.map(s => s.id === activeSpace.id ? updatedSpace : s),
          } : null);
        }
        setCurrentProject(activeProject);

        console.log('[ProjectContext] ✅ Initialization complete!');
        console.log('[ProjectContext] Spaces loaded:', spacesWithProjects.length);
        console.log('[ProjectContext] Current project:', activeProject.id, 'Key:', activeProject.key);

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize workspace data';
        console.error('[ProjectContext] Initialization error:', error);
        setInitError(errorMessage);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeData();
  }, [isAuthenticated, user, fetchSpacesWithProjects]);

  // Check if project ID is valid (UUID format)
  const isValidProjectId = currentProject?.id && 
    !currentProject.id.startsWith('project-') && 
    currentProject.id.includes('-');
  
  // Fetch tasks from API
  const { 
    data: apiTasks, 
    isLoading: tasksLoading, 
    error: tasksError,
    refetch: refetchTasks 
  } = useTasks(isValidProjectId ? currentProject!.id : '');

  // Map API tasks to frontend format
  const tasks: Task[] = (apiTasks || []).map(mapBackendTask);

  // API mutations
  const updateStatusMutation = useUpdateTaskStatus();
  const deleteTaskMutation = useDeleteTaskMutation();

  // Task operations
  const updateTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  }, [updateStatusMutation]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    if (updates.status) {
      updateTaskStatus(taskId, updates.status);
    }
  }, [updateTaskStatus]);

  const deleteTask = useCallback((taskId: string) => {
    deleteTaskMutation.mutate(taskId);
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
      setIsTaskModalOpen(false);
    }
  }, [deleteTaskMutation, selectedTask]);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus, _newIndex: number) => {
    updateTaskStatus(taskId, newStatus);
  }, [updateTaskStatus]);

  // Space operations - NOW WITH API CALLS
  const createSpace = useCallback(async (spaceData: { name: string; color?: string; icon?: string }) => {
    if (!currentWorkspace) {
      console.error('[ProjectContext] No workspace to create space in');
      return;
    }

    try {
      console.log('[ProjectContext] Creating space:', spaceData.name);
      
      // Create space via API
      const newApiSpace = await apiClient.post<ApiSpace>(`/workspaces/${currentWorkspace.id}/spaces`, {
        name: spaceData.name,
      });
      
      const newSpace: Space = {
        id: newApiSpace.id,
        name: newApiSpace.name,
        icon: spaceData.icon || '📁',
        color: spaceData.color || '#6366f1',
        projects: [],
      };

      console.log('[ProjectContext] Created space:', newSpace.id);

      // Update local state
      setAllSpaces(prev => [...prev, newSpace]);
      setCurrentWorkspace(prev => prev ? { 
        ...prev, 
        spaces: [...prev.spaces, newSpace] 
      } : null);
      
      // Set as current space
      setCurrentSpace(newSpace);
      
    } catch (error) {
      console.error('[ProjectContext] Failed to create space:', error);
      throw error;
    }
  }, [currentWorkspace]);

  const updateSpace = useCallback((spaceId: string, updates: Partial<Space>) => {
    setAllSpaces(prev => prev.map(space => 
      space.id === spaceId ? { ...space, ...updates } : space
    ));
    setCurrentWorkspace(prev => prev ? { 
      ...prev, 
      spaces: prev.spaces.map(space => space.id === spaceId ? { ...space, ...updates } : space) 
    } : null);
    if (currentSpace?.id === spaceId) {
      setCurrentSpace(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [currentSpace?.id]);

  const deleteSpace = useCallback(async (spaceId: string) => {
    try {
      // Delete via API
      await apiClient.delete(`/spaces/${spaceId}`);
      
      // Update local state
      setAllSpaces(prev => prev.filter(space => space.id !== spaceId));
      setCurrentWorkspace(prev => prev ? { 
        ...prev, 
        spaces: prev.spaces.filter(space => space.id !== spaceId) 
      } : null);
      
      if (currentSpace?.id === spaceId) {
        // Switch to another space if available
        const remainingSpaces = allSpaces.filter(s => s.id !== spaceId);
        if (remainingSpaces.length > 0) {
          setCurrentSpace(remainingSpaces[0]);
          setCurrentProject(remainingSpaces[0].projects[0] || null);
        } else {
          setCurrentSpace(null);
          setCurrentProject(null);
        }
      }
    } catch (error) {
      console.error('[ProjectContext] Failed to delete space:', error);
      throw error;
    }
  }, [currentSpace?.id, allSpaces]);

  // Project operations - NOW WITH API CALLS
  const createProject = useCallback(async (
    spaceId: string, 
    projectData: { name: string; key: string; description?: string }
  ) => {
    try {
      console.log('[ProjectContext] Creating project:', projectData.name, 'in space:', spaceId);
      
      // Create project via API
      const newApiProject = await apiClient.post<ApiProject>(`/spaces/${spaceId}/projects`, {
        name: projectData.name,
        key: projectData.key,
        description: projectData.description,
      });
      
      const newProject: Project = mapApiProject(newApiProject);
      console.log('[ProjectContext] Created project:', newProject.id);

      // Update local state
      setAllSpaces(prev => prev.map(space => 
        space.id === spaceId 
          ? { ...space, projects: [...space.projects, newProject] }
          : space
      ));
      setCurrentWorkspace(prev => prev ? {
        ...prev,
        spaces: prev.spaces.map(space => 
          space.id === spaceId 
            ? { ...space, projects: [...space.projects, newProject] }
            : space
        ),
      } : null);
      
      // Update current space if it matches
      if (currentSpace?.id === spaceId) {
        setCurrentSpace(prev => prev ? { 
          ...prev, 
          projects: [...prev.projects, newProject] 
        } : null);
      }
      
      // Set as current project
      setCurrentProject(newProject);
      
    } catch (error) {
      console.error('[ProjectContext] Failed to create project:', error);
      throw error;
    }
  }, [currentSpace?.id]);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    setAllSpaces(prev => prev.map(space => ({
      ...space,
      projects: space.projects.map(project => 
        project.id === projectId ? { ...project, ...updates } : project
      ),
    })));
    setCurrentWorkspace(prev => prev ? {
      ...prev,
      spaces: prev.spaces.map(space => ({ 
        ...space, 
        projects: space.projects.map(project => 
          project.id === projectId ? { ...project, ...updates } : project
        ) 
      })),
    } : null);
    if (currentProject?.id === projectId) {
      setCurrentProject(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [currentProject?.id]);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await apiClient.delete(`/projects/${projectId}`);
      
      setAllSpaces(prev => prev.map(space => ({
        ...space,
        projects: space.projects.filter(project => project.id !== projectId),
      })));
      setCurrentWorkspace(prev => prev ? {
        ...prev,
        spaces: prev.spaces.map(space => ({ 
          ...space, 
          projects: space.projects.filter(project => project.id !== projectId) 
        })),
      } : null);
      
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
    } catch (error) {
      console.error('[ProjectContext] Failed to delete project:', error);
      throw error;
    }
  }, [currentProject?.id]);

  // Sprint operations (unchanged - these are local for now)
  const createSprint = useCallback((sprintData: Omit<Sprint, 'id'>) => {
    const newSprint: Sprint = { ...sprintData, id: `sprint-${Date.now()}` };
    if (currentProject) {
      updateProject(currentProject.id, { sprints: [...(currentProject.sprints || []), newSprint] });
    }
  }, [currentProject, updateProject]);

  const updateSprint = useCallback((sprintId: string, updates: Partial<Sprint>) => {
    if (currentProject) {
      const updatedSprints = currentProject.sprints.map(s => s.id === sprintId ? { ...s, ...updates } : s);
      updateProject(currentProject.id, { sprints: updatedSprints });
    }
    if (currentSprint?.id === sprintId) {
      setCurrentSprint(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [currentProject, currentSprint?.id, updateProject]);

  const deleteSprint = useCallback((sprintId: string) => {
    if (currentProject) {
      const updatedSprints = currentProject.sprints.filter(s => s.id !== sprintId);
      updateProject(currentProject.id, { sprints: updatedSprints });
    }
    if (currentSprint?.id === sprintId) setCurrentSprint(null);
  }, [currentProject, currentSprint?.id, updateProject]);

  const startSprint = useCallback((sprintId: string) => { 
    updateSprint(sprintId, { status: 'active', startDate: new Date() }); 
  }, [updateSprint]);

  const completeSprint = useCallback((sprintId: string) => { 
    updateSprint(sprintId, { status: 'completed', endDate: new Date() }); 
  }, [updateSprint]);

  // Member operations (unchanged)
  const inviteMember = useCallback((memberData: { email: string; name: string; role: User['role'] }) => {
    const newMember: User = { 
      id: `user-${Date.now()}`, 
      name: memberData.name, 
      email: memberData.email, 
      role: memberData.role, 
      status: 'offline' 
    };
    setUsers(prev => [...prev, newMember]);
    if (currentWorkspace) {
      setCurrentWorkspace(prev => prev ? { ...prev, members: [...prev.members, newMember] } : null);
    }
  }, [currentWorkspace]);

  const removeMember = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentWorkspace) {
      setCurrentWorkspace(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== userId) } : null);
    }
  }, [currentWorkspace]);

  const updateMemberRole = useCallback((userId: string, role: User['role']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    if (currentWorkspace) {
      setCurrentWorkspace(prev => prev ? { 
        ...prev, 
        members: prev.members.map(m => m.id === userId ? { ...m, role } : m) 
      } : null);
    }
  }, [currentWorkspace]);

  // Modal operations
  const openTaskModal = useCallback((task: Task) => { 
    setSelectedTask(task); 
    setIsTaskModalOpen(true); 
  }, []);

  const closeTaskModal = useCallback(() => { 
    setIsTaskModalOpen(false); 
    setTimeout(() => setSelectedTask(null), 300); 
  }, []);

  const value: ProjectContextType = {
    currentWorkspace,
    currentSpace,
    currentProject,
    currentSprint,
    selectedTask,
    allSpaces,
    isInitializing,
    initError,
    tasks,
    tasksLoading: tasksLoading || isInitializing,
    tasksError: tasksError as Error | null,
    refetchTasks,
    users,
    labels: mockLabels,
    setCurrentSpace,
    setCurrentProject,
    setCurrentSprint,
    setSelectedTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    moveTask,
    createSpace,
    updateSpace,
    deleteSpace,
    createProject,
    updateProject,
    deleteProject,
    createSprint,
    updateSprint,
    deleteSprint,
    startSprint,
    completeSprint,
    inviteMember,
    removeMember,
    updateMemberRole,
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
    isCreateSprintModalOpen,
    setIsCreateSprintModalOpen,
    isInviteMemberModalOpen,
    setIsInviteMemberModalOpen,
    isCreateTaskModalOpen,
    setIsCreateTaskModalOpen,
    createTaskInitialStatus,
    setCreateTaskInitialStatus,
    refreshSpaces,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within a ProjectProvider');
  return context;
};