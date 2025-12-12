// ORA SCRUM - Mock Data for Development

import { User, Label, Task, Sprint, Project, Space, Workspace } from '../types/project';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@orascrum.com',
    avatar: '/images/user/user-01.jpg',
    role: 'admin',
    status: 'online',
  },
  {
    id: 'user-2',
    name: 'Sarah Wilson',
    email: 'sarah@orascrum.com',
    avatar: '/images/user/user-02.jpg',
    role: 'member',
    status: 'online',
  },
  {
    id: 'user-3',
    name: 'Mike Chen',
    email: 'mike@orascrum.com',
    avatar: '/images/user/user-03.jpg',
    role: 'member',
    status: 'busy',
  },
  {
    id: 'user-4',
    name: 'Emily Brown',
    email: 'emily@orascrum.com',
    avatar: '/images/user/user-04.jpg',
    role: 'member',
    status: 'away',
  },
  {
    id: 'user-5',
    name: 'Alex Johnson',
    email: 'alex@orascrum.com',
    avatar: '/images/user/user-05.jpg',
    role: 'viewer',
    status: 'offline',
  },
];

// Mock Labels
export const mockLabels: Label[] = [
  { id: 'label-1', name: 'Frontend', color: '#3B82F6' },
  { id: 'label-2', name: 'Backend', color: '#10B981' },
  { id: 'label-3', name: 'Design', color: '#F59E0B' },
  { id: 'label-4', name: 'Documentation', color: '#8B5CF6' },
  { id: 'label-5', name: 'Testing', color: '#EF4444' },
  { id: 'label-6', name: 'DevOps', color: '#06B6D4' },
  { id: 'label-7', name: 'Security', color: '#EC4899' },
  { id: 'label-8', name: 'Performance', color: '#84CC16' },
];

// Generate unique ID
let taskCounter = 1;
const generateTaskId = () => `task-${taskCounter++}`;
const generateTaskKey = (projectKey: string, num: number) => `${projectKey}-${num}`;

// Mock Tasks
export const createMockTasks = (projectKey: string): Task[] => {
  const baseTasks: Partial<Task>[] = [
    {
      title: 'Set up authentication system',
      description: 'Implement JWT-based authentication with refresh tokens. Include login, logout, and password reset functionality.',
      status: 'done',
      priority: 'high',
      type: 'story',
      assignee: mockUsers[0],
      labels: [mockLabels[1], mockLabels[6]],
      storyPoints: 8,
    },
    {
      title: 'Design dashboard wireframes',
      description: 'Create wireframes for the main dashboard showing project overview, recent activity, and quick actions.',
      status: 'done',
      priority: 'high',
      type: 'task',
      assignee: mockUsers[1],
      labels: [mockLabels[2]],
      storyPoints: 5,
    },
    {
      title: 'Build Kanban board component',
      description: 'Create a drag-and-drop Kanban board with customizable columns and task cards.',
      status: 'in_progress',
      priority: 'urgent',
      type: 'story',
      assignee: mockUsers[2],
      labels: [mockLabels[0], mockLabels[2]],
      storyPoints: 13,
    },
    {
      title: 'Implement real-time notifications',
      description: 'Add WebSocket support for real-time notifications when tasks are updated, assigned, or commented on.',
      status: 'in_progress',
      priority: 'medium',
      type: 'task',
      assignee: mockUsers[0],
      labels: [mockLabels[0], mockLabels[1]],
      storyPoints: 8,
    },
    {
      title: 'Fix task sorting bug',
      description: 'Tasks are not maintaining their order after page refresh. Need to persist order in database.',
      status: 'in_review',
      priority: 'high',
      type: 'bug',
      assignee: mockUsers[3],
      labels: [mockLabels[0], mockLabels[4]],
      storyPoints: 3,
    },
    {
      title: 'Add dark mode support',
      description: 'Implement system-wide dark mode toggle with preference persistence.',
      status: 'todo',
      priority: 'medium',
      type: 'task',
      assignee: mockUsers[1],
      labels: [mockLabels[0], mockLabels[2]],
      storyPoints: 5,
    },
    {
      title: 'Create user onboarding flow',
      description: 'Design and implement a step-by-step onboarding process for new users.',
      status: 'todo',
      priority: 'low',
      type: 'story',
      assignee: mockUsers[2],
      labels: [mockLabels[0], mockLabels[2]],
      storyPoints: 8,
    },
    {
      title: 'API rate limiting implementation',
      description: 'Add rate limiting to protect API endpoints from abuse.',
      status: 'backlog',
      priority: 'medium',
      type: 'task',
      assignee: undefined,
      labels: [mockLabels[1], mockLabels[6]],
      storyPoints: 5,
    },
    {
      title: 'Performance optimization audit',
      description: 'Analyze and optimize application performance, focusing on bundle size and load times.',
      status: 'backlog',
      priority: 'low',
      type: 'task',
      assignee: undefined,
      labels: [mockLabels[7]],
      storyPoints: 8,
    },
    {
      title: 'Mobile responsive improvements',
      description: 'Enhance mobile experience for task management views.',
      status: 'todo',
      priority: 'medium',
      type: 'task',
      assignee: mockUsers[4],
      labels: [mockLabels[0], mockLabels[2]],
      storyPoints: 5,
    },
    {
      title: 'Setup CI/CD pipeline',
      description: 'Configure automated testing and deployment using GitHub Actions.',
      status: 'done',
      priority: 'high',
      type: 'task',
      assignee: mockUsers[0],
      labels: [mockLabels[5]],
      storyPoints: 5,
    },
    {
      title: 'Database migration scripts',
      description: 'Create migration scripts for schema updates.',
      status: 'in_review',
      priority: 'medium',
      type: 'task',
      assignee: mockUsers[3],
      labels: [mockLabels[1], mockLabels[5]],
      storyPoints: 3,
    },
    {
      title: 'User permissions system',
      description: 'Implement role-based access control for workspace, space, and project levels.',
      status: 'backlog',
      priority: 'high',
      type: 'epic',
      assignee: undefined,
      labels: [mockLabels[1], mockLabels[6]],
      storyPoints: 21,
    },
    {
      title: 'Sprint reporting dashboard',
      description: 'Create burndown charts and sprint velocity reports.',
      status: 'backlog',
      priority: 'medium',
      type: 'story',
      assignee: undefined,
      labels: [mockLabels[0], mockLabels[2]],
      storyPoints: 13,
    },
    {
      title: 'Search functionality enhancement',
      description: 'Add advanced search with filters for tasks, users, and labels.',
      status: 'todo',
      priority: 'medium',
      type: 'task',
      assignee: mockUsers[2],
      labels: [mockLabels[0], mockLabels[1]],
      storyPoints: 8,
    },
  ];

  return baseTasks.map((task, index) => ({
    id: generateTaskId(),
    key: generateTaskKey(projectKey, index + 1),
    title: task.title!,
    description: task.description,
    status: task.status!,
    priority: task.priority!,
    type: task.type!,
    assignee: task.assignee,
    reporter: mockUsers[0],
    labels: task.labels || [],
    storyPoints: task.storyPoints,
    dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    comments: [],
    attachments: [],
    subtasks: [],
    order: index,
  } as Task));
};

// Mock Sprint
export const createMockSprints = (projectKey: string): Sprint[] => {
  const tasks = createMockTasks(projectKey);
  const sprintTasks = tasks.filter(t => t.status !== 'backlog');

  return [
    {
      id: 'sprint-1',
      name: 'Sprint 1 - Foundation',
      goal: 'Set up core infrastructure and authentication',
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'completed',
      tasks: sprintTasks.filter(t => t.status === 'done').slice(0, 3),
    },
    {
      id: 'sprint-2',
      name: 'Sprint 2 - Core Features',
      goal: 'Implement Kanban board and task management',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'active',
      tasks: sprintTasks.filter(t => ['in_progress', 'in_review', 'todo'].includes(t.status)),
    },
    {
      id: 'sprint-3',
      name: 'Sprint 3 - Polish',
      goal: 'UI improvements and performance optimization',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      status: 'planning',
      tasks: [],
    },
  ];
};

// Mock Project
export const createMockProject = (): Project => ({
  id: 'project-1',
  name: 'ORA SCRUM Platform',
  key: 'ORA',
  description: 'Building the next-generation project management platform',
  color: '#465FFF',
  lead: mockUsers[0],
  members: mockUsers,
  sprints: createMockSprints('ORA'),
  backlog: createMockTasks('ORA').filter(t => t.status === 'backlog'),
  createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
});

// Mock Space
export const createMockSpaces = (): Space[] => [
  {
    id: 'space-1',
    name: 'Engineering',
    icon: '💻',
    color: '#3B82F6',
    projects: [createMockProject()],
  },
  {
    id: 'space-2',
    name: 'Marketing',
    icon: '📣',
    color: '#10B981',
    projects: [
      {
        id: 'project-2',
        name: 'Website Redesign',
        key: 'WEB',
        description: 'Revamping the company website',
        color: '#10B981',
        lead: mockUsers[1],
        members: [mockUsers[1], mockUsers[3]],
        sprints: [],
        backlog: [],
        createdAt: new Date(),
      },
    ],
  },
  {
    id: 'space-3',
    name: 'Product',
    icon: '🎯',
    color: '#F59E0B',
    projects: [
      {
        id: 'project-3',
        name: 'Feature Roadmap',
        key: 'ROAD',
        description: 'Product roadmap and feature planning',
        color: '#F59E0B',
        lead: mockUsers[2],
        members: [mockUsers[0], mockUsers[2], mockUsers[4]],
        sprints: [],
        backlog: [],
        createdAt: new Date(),
      },
    ],
  },
];

// Mock Workspace
export const mockWorkspace: Workspace = {
  id: 'workspace-1',
  name: 'ORA SCRUM',
  logo: '/images/logo/logo-icon.svg',
  spaces: createMockSpaces(),
  members: mockUsers,
};

// All tasks for the main project
export const getAllTasks = (): Task[] => createMockTasks('ORA');

// Get tasks by status
export const getTasksByStatus = (status: string): Task[] => {
  return getAllTasks().filter(task => task.status === status);
};

// Get current sprint
export const getCurrentSprint = (): Sprint | undefined => {
  return createMockSprints('ORA').find(s => s.status === 'active');
};
