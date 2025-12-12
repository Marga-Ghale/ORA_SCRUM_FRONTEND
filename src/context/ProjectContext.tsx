import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Task, TaskStatus, Project, Space, Sprint, User } from '../types/project';
import { mockWorkspace, getAllTasks, mockUsers, mockLabels, createMockSprints } from '../data/mockData';

interface ProjectContextType {
  // Current selections
  currentWorkspace: typeof mockWorkspace;
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
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state
  const [tasks, setTasks] = useState<Task[]>(getAllTasks());
  const [currentSpace, setCurrentSpace] = useState<Space | null>(mockWorkspace.spaces[0]);
  const [currentProject, setCurrentProject] = useState<Project | null>(mockWorkspace.spaces[0]?.projects[0] || null);
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
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      key: `ORA-${tasks.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks(prev => [...prev, newTask]);
  }, [tasks.length]);

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
    currentWorkspace: mockWorkspace,
    currentSpace,
    currentProject,
    currentSprint,
    selectedTask,
    tasks,
    setTasks,
    users: mockUsers,
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
    viewMode,
    setViewMode,
    filters,
    setFilters,
    isTaskModalOpen,
    openTaskModal,
    closeTaskModal,
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
