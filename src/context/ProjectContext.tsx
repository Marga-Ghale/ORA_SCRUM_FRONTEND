import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Task, TaskStatus, Project, Space, Sprint, User, Workspace } from '../types/project';
import { mockWorkspace, getAllTasks, mockUsers, mockLabels, createMockSprints } from '../data/mockData';

interface ProjectContextType {
  // Current selections
  currentWorkspace: Workspace;
  currentSpace: Space | null;
  currentProject: Project | null;
  currentSprint: Sprint | null;
  selectedTask: Task | null;

  // Tasks
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;

  // Users & Labels
  users: User[];
  labels: typeof mockLabels;

  // Actions
  setCurrentSpace: (space: Space | null) => void;
  setCurrentProject: (project: Project | null) => void;
  setCurrentSprint: (sprint: Sprint | null) => void;
  setSelectedTask: (task: Task | null) => void;

  // Task operations
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  createTask: (task: Omit<Task, 'id' | 'key' | 'createdAt' | 'updatedAt'>) => void;
  deleteTask: (taskId: string) => void;
  reorderTasks: (tasks: Task[]) => void;

  // Space operations
  createSpace: (space: Omit<Space, 'id'>) => void;
  updateSpace: (spaceId: string, updates: Partial<Space>) => void;
  deleteSpace: (spaceId: string) => void;

  // Project operations
  createProject: (spaceId: string, project: Omit<Project, 'id'>) => void;
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
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize workspace state (mutable copy)
  const [workspace, setWorkspace] = useState<Workspace>(() => ({
    ...mockWorkspace,
    spaces: mockWorkspace.spaces.map(s => ({ ...s, projects: [...s.projects] })),
    members: [...mockUsers],
  }));

  // Initialize state
  const [tasks, setTasks] = useState<Task[]>(getAllTasks());
  const [currentSpace, setCurrentSpace] = useState<Space | null>(workspace.spaces[0]);
  const [currentProject, setCurrentProject] = useState<Project | null>(workspace.spaces[0]?.projects[0] || null);
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(() => {
    const sprints = createMockSprints('ORA');
    return sprints.find(s => s.status === 'active') || null;
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'table' | 'timeline'>('board');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [filters, setFilters] = useState<ProjectContextType['filters']>({
    search: '',
    assignees: [],
    priorities: [],
    labels: [],
    types: [],
  });

  // Modal states
  const [isCreateSpaceModalOpen, setIsCreateSpaceModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateSprintModalOpen, setIsCreateSprintModalOpen] = useState(false);
  const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [createTaskInitialStatus, setCreateTaskInitialStatus] = useState<TaskStatus>('todo');

  // Users state
  const [users, setUsers] = useState<User[]>(mockUsers);

  // Task operations
  const updateTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, status: newStatus, updatedAt: new Date() }
        : task
    ));
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, ...updates, updatedAt: new Date() }
        : task
    ));

    // Update selected task if it's the one being edited
    setSelectedTask(prev =>
      prev?.id === taskId ? { ...prev, ...updates, updatedAt: new Date() } : prev
    );
  }, []);

  const createTask = useCallback((taskData: Omit<Task, 'id' | 'key' | 'createdAt' | 'updatedAt'>) => {
    const projectKey = currentProject?.key || 'ORA';
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      key: `${projectKey}-${tasks.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks(prev => [...prev, newTask]);
  }, [tasks.length, currentProject?.key]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
      setIsTaskModalOpen(false);
    }
  }, [selectedTask]);

  const reorderTasks = useCallback((reorderedTasks: Task[]) => {
    setTasks(reorderedTasks.map((task, index) => ({ ...task, order: index })));
  }, []);

  // Space operations
  const createSpace = useCallback((spaceData: Omit<Space, 'id'>) => {
    const newSpace: Space = {
      ...spaceData,
      id: `space-${Date.now()}`,
    };
    setWorkspace(prev => ({
      ...prev,
      spaces: [...prev.spaces, newSpace],
    }));
  }, []);

  const updateSpace = useCallback((spaceId: string, updates: Partial<Space>) => {
    setWorkspace(prev => ({
      ...prev,
      spaces: prev.spaces.map(space =>
        space.id === spaceId ? { ...space, ...updates } : space
      ),
    }));
  }, []);

  const deleteSpace = useCallback((spaceId: string) => {
    setWorkspace(prev => ({
      ...prev,
      spaces: prev.spaces.filter(space => space.id !== spaceId),
    }));
    if (currentSpace?.id === spaceId) {
      setCurrentSpace(null);
      setCurrentProject(null);
    }
  }, [currentSpace?.id]);

  // Project operations
  const createProject = useCallback((spaceId: string, projectData: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...projectData,
      id: `project-${Date.now()}`,
    };
    setWorkspace(prev => ({
      ...prev,
      spaces: prev.spaces.map(space =>
        space.id === spaceId
          ? { ...space, projects: [...space.projects, newProject] }
          : space
      ),
    }));
  }, []);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    setWorkspace(prev => ({
      ...prev,
      spaces: prev.spaces.map(space => ({
        ...space,
        projects: space.projects.map(project =>
          project.id === projectId ? { ...project, ...updates } : project
        ),
      })),
    }));
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setWorkspace(prev => ({
      ...prev,
      spaces: prev.spaces.map(space => ({
        ...space,
        projects: space.projects.filter(project => project.id !== projectId),
      })),
    }));
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
    }
  }, [currentProject?.id]);

  // Sprint operations
  const createSprint = useCallback((sprintData: Omit<Sprint, 'id'>) => {
    const newSprint: Sprint = {
      ...sprintData,
      id: `sprint-${Date.now()}`,
    };
    // Add to current project's sprints
    if (currentProject) {
      updateProject(currentProject.id, {
        sprints: [...(currentProject.sprints || []), newSprint],
      });
    }
  }, [currentProject, updateProject]);

  const updateSprint = useCallback((sprintId: string, updates: Partial<Sprint>) => {
    if (currentProject) {
      const updatedSprints = currentProject.sprints.map(sprint =>
        sprint.id === sprintId ? { ...sprint, ...updates } : sprint
      );
      updateProject(currentProject.id, { sprints: updatedSprints });
    }
    if (currentSprint?.id === sprintId) {
      setCurrentSprint(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [currentProject, currentSprint?.id, updateProject]);

  const deleteSprint = useCallback((sprintId: string) => {
    if (currentProject) {
      const updatedSprints = currentProject.sprints.filter(sprint => sprint.id !== sprintId);
      updateProject(currentProject.id, { sprints: updatedSprints });
    }
    if (currentSprint?.id === sprintId) {
      setCurrentSprint(null);
    }
  }, [currentProject, currentSprint?.id, updateProject]);

  const startSprint = useCallback((sprintId: string) => {
    updateSprint(sprintId, { status: 'active', startDate: new Date() });
  }, [updateSprint]);

  const completeSprint = useCallback((sprintId: string) => {
    updateSprint(sprintId, { status: 'completed', endDate: new Date() });
  }, [updateSprint]);

  // Member operations
  const inviteMember = useCallback((memberData: { email: string; name: string; role: User['role'] }) => {
    const newMember: User = {
      id: `user-${Date.now()}`,
      name: memberData.name,
      email: memberData.email,
      role: memberData.role,
      status: 'offline',
    };
    setUsers(prev => [...prev, newMember]);
    setWorkspace(prev => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
  }, []);

  const removeMember = useCallback((userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    setWorkspace(prev => ({
      ...prev,
      members: prev.members.filter(member => member.id !== userId),
    }));
  }, []);

  const updateMemberRole = useCallback((userId: string, role: User['role']) => {
    setUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, role } : user
    ));
    setWorkspace(prev => ({
      ...prev,
      members: prev.members.map(member =>
        member.id === userId ? { ...member, role } : member
      ),
    }));
  }, []);

  // Modal operations
  const openTaskModal = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    // Keep selectedTask for a moment to allow animation
    setTimeout(() => setSelectedTask(null), 300);
  }, []);

  const value: ProjectContextType = {
    currentWorkspace: workspace,
    currentSpace,
    currentProject,
    currentSprint,
    selectedTask,
    tasks,
    setTasks,
    users,
    labels: mockLabels,
    setCurrentSpace,
    setCurrentProject,
    setCurrentSprint,
    setSelectedTask,
    updateTaskStatus,
    updateTask,
    createTask,
    deleteTask,
    reorderTasks,
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
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
