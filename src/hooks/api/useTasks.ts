/* eslint-disable @typescript-eslint/no-unused-vars */
// src/hooks/api/useTasks.ts
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-client';
import { TaskStatus, Priority as TaskPriority, TaskType } from '../../types/project';

// Re-export for convenience
export type { TaskStatus, TaskPriority, TaskType };

export interface Task {
  id: string;
  key: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  projectId: string;
  sprintId?: string;
  assigneeId?: string;
  reporterId: string;
  parentId?: string;
  storyPoints?: number;
  dueDate?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  reporter?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  type?: TaskType[];
  assigneeId?: string[];
  sprintId?: string;
  labels?: string[];
  search?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  assigneeId?: string;
  sprintId?: string;
  parentId?: string;
  storyPoints?: number;
  dueDate?: string;
  labels?: string[];
}

// ============================================
// Query Hooks
// ============================================

// Get tasks for a project
export function useTasks(projectId: string, filters?: TaskFilters) {
  return useQuery({
    queryKey: queryKeys.tasks.list(projectId, filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status?.length) params.append('status', filters.status.join(','));
      if (filters?.priority?.length) params.append('priority', filters.priority.join(','));
      if (filters?.type?.length) params.append('type', filters.type.join(','));
      if (filters?.assigneeId?.length) params.append('assigneeId', filters.assigneeId.join(','));
      if (filters?.sprintId) params.append('sprintId', filters.sprintId);
      if (filters?.labels?.length) params.append('labels', filters.labels.join(','));
      if (filters?.search) params.append('search', filters.search);

      const queryString = params.toString();
      return apiClient.get<Task[]>(`/projects/${projectId}/tasks${queryString ? `?${queryString}` : ''}`);
    },
    enabled: !!projectId,
  });
}

// Get paginated tasks
export function useTasksInfinite(projectId: string, filters?: TaskFilters) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.tasks.list(projectId, filters), 'infinite'],
    queryFn: ({ pageParam = 0 }) => {
      const params = new URLSearchParams();
      params.append('offset', String(pageParam));
      params.append('limit', '50');
      if (filters?.status?.length) params.append('status', filters.status.join(','));
      if (filters?.search) params.append('search', filters.search);

      return apiClient.get<{ tasks: Task[]; total: number; hasMore: boolean }>(
        `/projects/${projectId}/tasks?${params.toString()}`
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * 50 : undefined,
    enabled: !!projectId,
  });
}

// Get backlog tasks (tasks without sprint)
export function useBacklogTasks(projectId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.backlog(projectId),
    queryFn: () => apiClient.get<Task[]>(`/projects/${projectId}/tasks?sprintId=null`),
    enabled: !!projectId,
  });
}

// Get tasks by sprint
export function useSprintTasks(sprintId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.bySprint(sprintId),
    queryFn: () => apiClient.get<Task[]>(`/sprints/${sprintId}/tasks`),
    enabled: !!sprintId,
  });
}

// Get single task
export function useTask(id: string, options?: { enabled?: boolean; refetchOnMount?: boolean }) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => apiClient.get<Task>(`/tasks/${id}`),
    enabled: options?.enabled !== false && !!id,
    refetchOnMount: options?.refetchOnMount,
  });
}

// Get task comments
export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.comments(taskId),
    queryFn: () => apiClient.get<Comment[]>(`/tasks/${taskId}/comments`),
    enabled: !!taskId,
  });
}

// ============================================
// Mutation Hooks with Toast
// ============================================

// Create task
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateTaskData }) =>
      apiClient.post<Task>(`/projects/${projectId}/tasks`, data),
    onMutate: () => {
      return { toastId: toast.loading('Creating task...') };
    },
    onSuccess: (task, _, context) => {
      toast.dismiss(context?.toastId);
      toast.success(`Task ${task.key} created successfully`);
      
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      if (task.sprintId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySprint(task.sprintId) });
      }
    },
    onError: (error: Error, _, context) => {
      toast.dismiss(context?.toastId);
      toast.error(error.message || 'Failed to create task');
    },
  });
}

// Update task
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTaskData> }) => {
      // Convert status to uppercase if present (for backend compatibility)
      const normalizedData = { ...data };
      if (normalizedData.status) {
        normalizedData.status = normalizedData.status.toUpperCase() as TaskStatus;
      }
      return apiClient.put<Task>(`/tasks/${id}`, normalizedData);
    },
    onSuccess: (task) => {
      toast.success('Task updated');
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update task');
    },
  });
}

// Update task status (optimistic update for drag & drop)
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => {
      // Convert to uppercase for backend
      const backendStatus = status.toUpperCase();
      return apiClient.patch<Task>(`/tasks/${id}`, { status: backendStatus });
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      // Snapshot previous value
      const previousTask = queryClient.getQueryData<Task>(queryKeys.tasks.detail(id));

      // Optimistically update
      if (previousTask) {
        queryClient.setQueryData(queryKeys.tasks.detail(id), {
          ...previousTask,
          status,
        });
      }

      return { previousTask };
    },
    onSuccess: (task) => {
      // Show subtle success for status changes (no toast for drag & drop to avoid spam)
      // Only show if you want: toast.success(`Moved to ${task.status}`);
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(
          queryKeys.tasks.detail(variables.id),
          context.previousTask
        );
      }
      toast.error('Failed to update task status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  });
}

// Delete task
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tasks/${id}`),
    onMutate: () => {
      return { toastId: toast.loading('Deleting task...') };
    },
    onSuccess: (_, __, context) => {
      toast.dismiss(context?.toastId);
      toast.success('Task deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
    onError: (error: Error, _, context) => {
      toast.dismiss(context?.toastId);
      toast.error(error.message || 'Failed to delete task');
    },
  });
}

// Add comment
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
      apiClient.post<Comment>(`/tasks/${taskId}/comments`, { content }),
    onSuccess: (_, variables) => {
      toast.success('Comment added');
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.comments(variables.taskId)
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add comment');
    },
  });
}

// Delete comment
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, commentId }: { taskId: string; commentId: string }) =>
      apiClient.delete(`/comments/${commentId}`),
    onSuccess: (_, variables) => {
      toast.success('Comment deleted');
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.comments(variables.taskId)
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete comment');
    },
  });
}

// Bulk update tasks (for reordering)
export function useBulkUpdateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tasks: Array<{ id: string; order?: number; status?: TaskStatus; sprintId?: string | null }>) =>
      apiClient.put('/tasks/bulk', { tasks }),
    onSuccess: () => {
      // No toast for bulk updates (usually drag & drop reordering)
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tasks');
    },
  });
}

// Move task to sprint
export function useMoveTaskToSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, sprintId }: { taskId: string; sprintId: string | null }) =>
      apiClient.patch<Task>(`/tasks/${taskId}`, { sprintId }),
    onSuccess: (task) => {
      const message = task.sprintId 
        ? `Task moved to sprint` 
        : 'Task moved to backlog';
      toast.success(message);
      
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to move task');
    },
  });
}

// ============================================
// Additional Hooks with Toast
// ============================================

// Assign task to user
export function useAssignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, assigneeId }: { taskId: string; assigneeId: string | null }) =>
      apiClient.patch<Task>(`/tasks/${taskId}`, { assigneeId }),
    onSuccess: (task) => {
      const message = task.assigneeId 
        ? `Task assigned to ${task.assignee?.name || 'user'}` 
        : 'Task unassigned';
      toast.success(message);
      
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign task');
    },
  });
}

// Update task priority
export function useUpdateTaskPriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, priority }: { taskId: string; priority: TaskPriority }) =>
      apiClient.patch<Task>(`/tasks/${taskId}`, { priority: priority.toUpperCase() }),
    onSuccess: (task) => {
      toast.success(`Priority set to ${task.priority.toLowerCase()}`);
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update priority');
    },
  });
}

// Duplicate task
export function useDuplicateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ task, projectId }: { task: Task; projectId: string }) => {
      const duplicateData: CreateTaskData = {
        title: `${task.title} (copy)`,
        description: task.description,
        status: 'backlog' as TaskStatus,
        priority: task.priority,
        type: task.type,
        sprintId: task.sprintId,
        storyPoints: task.storyPoints,
        labels: task.labels,
      };
      return apiClient.post<Task>(`/projects/${projectId}/tasks`, duplicateData);
    },
    onMutate: () => {
      return { toastId: toast.loading('Duplicating task...') };
    },
    onSuccess: (newTask, _, context) => {
      toast.dismiss(context?.toastId);
      toast.success(`Task duplicated as ${newTask.key}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
    onError: (error: Error, _, context) => {
      toast.dismiss(context?.toastId);
      toast.error(error.message || 'Failed to duplicate task');
    },
  });
}