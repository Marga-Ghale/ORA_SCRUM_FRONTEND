// ORA SCRUM - Project Management Types

export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
export type TaskType = 'task' | 'bug' | 'story' | 'epic' | 'subtask';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'online' | 'offline' | 'busy' | 'away';
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
  updatedAt?: Date;
  reactions?: { emoji: string; users: User[] }[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: User;
  uploadedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus; // e.g., "todo", "in_progress", "done"
  priority: Priority; // e.g., "low", "medium", "high"
  type?: TaskType; // ✅ match Go response
  projectId: string;
  sprintId?: string;
  parentTaskId?: string;
  assignee: User | null;
  label: Label | null;
  assigneeIds?: string[];
  watcherIds?: string[] | null;
  labelIds: string[];
  storyPoints?: number;
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string; // ISO string
  dueDate?: string; // ISO string
  completedAt?: string; // ISO string
  blocked?: boolean;
  position: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed';
  tasks: Task[];
}

export interface Project {
  id: string;
  name: string;
  key: string; // e.g., "ORA"
  description?: string;
  icon?: string;
  color: string;
  lead?: User;
  members: User[];
  sprints: Sprint[];
  backlog?: Task[];
  createdAt?: Date;
}

export interface Space {
  id: string;
  name: string;
  icon?: string;
  color: string;
  projects: Project[];
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  color: string;
  projects: Project[];
}

export interface Workspace {
  id: string;
  name: string;
  logo?: string;
  icon?: string;
  spaces: Space[];
  members: User[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Status configuration for Kanban columns
export interface StatusColumn {
  id: TaskStatus;
  name: string;
  color: string;
  icon?: string;
}

export const STATUS_COLUMNS: StatusColumn[] = [
  { id: 'backlog', name: 'Backlog', color: '#6B7280' },
  { id: 'todo', name: 'To Do', color: '#3B82F6' },
  { id: 'in_progress', name: 'In Progress', color: '#F59E0B' },
  { id: 'in_review', name: 'In Review', color: '#8B5CF6' },
  { id: 'done', name: 'Done', color: '#10B981' },
  { id: 'cancelled', name: 'Cancelled', color: '#EF4444' },
];

export const PRIORITY_CONFIG: Record<Priority, { name: string; color: string; icon: string }> = {
  urgent: { name: 'Urgent', color: '#DC2626', icon: '🔴' },
  high: { name: 'High', color: '#F97316', icon: '🟠' },
  medium: { name: 'Medium', color: '#EAB308', icon: '🟡' },
  low: { name: 'Low', color: '#22C55E', icon: '🟢' },
  none: { name: 'None', color: '#6B7280', icon: '⚪' },
};

export const TASK_TYPE_CONFIG: Record<TaskType, { name: string; color: string; icon: string }> = {
  epic: { name: 'Epic', color: '#8B5CF6', icon: '⚡' },
  story: { name: 'Story', color: '#22C55E', icon: '📖' },
  task: { name: 'Task', color: '#3B82F6', icon: '✓' },
  bug: { name: 'Bug', color: '#EF4444', icon: '🐛' },
  subtask: { name: 'Subtask', color: '#6B7280', icon: '◦' },
};
