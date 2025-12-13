import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
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

// Create task
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateTaskData }) =>
      apiClient.post<Task>(`/projects/${projectId}/tasks`, data),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      if (task.sprintId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySprint(task.sprintId) });
      }
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
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
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
    onError: (_, variables, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(
          queryKeys.tasks.detail(variables.id),
          context.previousTask
        );
      }
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.comments(variables.taskId)
      });
    },
  });
}

// Delete comment
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, commentId }: { taskId: string; commentId: string }) =>
      apiClient.delete(`/tasks/${taskId}/comments/${commentId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.comments(variables.taskId)
      });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
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
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all });
    },
  });
}