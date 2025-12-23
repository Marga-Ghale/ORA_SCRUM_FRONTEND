// src/hooks/useTasks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { queryKeys } from '../../lib/query-client';

// ============================================
// Types
// ============================================

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type?: string;
  projectId: string;
  sprintId?: string;
  parentTaskId?: string;
  assigneeIds: string[];
  watcherIds: string[];
  labelIds: string[];
  storyPoints?: number;
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  blocked: boolean;
  position: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  sprintId?: string;
  parentTaskId?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  type?: string;
  assigneeIds?: string[];
  labelIds?: string[];
  estimatedHours?: number;
  storyPoints?: number;
  startDate?: string;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  type?: string;
  sprintId?: string;
  assigneeIds?: string[];
  labelIds?: string[];
  estimatedHours?: number;
  actualHours?: number;
  storyPoints?: number;
  startDate?: string;
  dueDate?: string;
}

export interface CommentResponse {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  mentionedUsers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  mentionedUsers?: string[];
}

export interface UpdateCommentRequest {
  content: string;
}

export interface AttachmentResponse {
  id: string;
  taskId: string;
  userId: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface CreateAttachmentRequest {
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface TimeEntryResponse {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  durationSeconds?: number;
  description?: string;
  isManual: boolean;
  createdAt: string;
}

export interface LogTimeRequest {
  durationSeconds: number;
  description?: string;
}

export interface DependencyResponse {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: string;
  createdAt: string;
}

export interface CreateDependencyRequest {
  dependsOnTaskId: string;
  dependencyType: string;
}

export interface ChecklistItemResponse {
  id: string;
  checklistId: string;
  content: string;
  completed: boolean;
  position: number;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistResponse {
  id: string;
  taskId: string;
  title: string;
  items: ChecklistItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateChecklistRequest {
  title: string;
}

export interface CreateChecklistItemRequest {
  content: string;
  assigneeId?: string;
}

export interface ActivityResponse {
  id: string;
  taskId: string;
  userId?: string;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface TaskFiltersRequest {
  projectId: string;
  sprintId?: string;
  assigneeIds?: string[];
  statuses?: string[];
  priorities?: string[];
  labelIds?: string[];
  searchQuery?: string;
  dueBefore?: string;
  dueAfter?: string;
  overdue?: boolean;
  blocked?: boolean;
  limit: number;
  offset: number;
}

export interface TaskFilterResponse {
  tasks: TaskResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface BulkUpdateStatusRequest {
  taskIds: string[];
  status: string;
}

// ✅ FIXED: Changed assigneeIds to assigneeId to match backend
export interface BulkAssignRequest {
  taskIds: string[];
  assigneeId: string; // Backend expects singular assigneeId
}

export interface BulkMoveToSprintRequest {
  taskIds: string[];
  sprintId: string;
}

// ============================================
// API Functions
// ============================================

const taskApi = {
  // Task CRUD
  listByProject: (projectId: string) =>
    apiClient.get<TaskResponse[]>(`/projects/${projectId}/tasks`),

  listMyTasks: () => apiClient.get<TaskResponse[]>('/tasks/my'),

  filterTasks: (filters: TaskFiltersRequest) =>
    apiClient.post<TaskFilterResponse>('/tasks/filter', filters),

  getById: (id: string) => apiClient.get<TaskResponse>(`/tasks/${id}`),

  create: (projectId: string, data: CreateTaskRequest) =>
    apiClient.post<TaskResponse>(`/projects/${projectId}/tasks`, data),

  update: (id: string, data: UpdateTaskRequest) =>
    apiClient.put<TaskResponse>(`/tasks/${id}`, data),

  delete: (id: string) => apiClient.delete(`/tasks/${id}`),

  // Task operations
  updateStatus: (id: string, status: string) =>
    apiClient.patch<{ message: string }>(`/tasks/${id}/status`, { status }),

  updatePriority: (id: string, priority: string) =>
    apiClient.patch<{ message: string }>(`/tasks/${id}/priority`, { priority }),

  assignTask: (id: string, assigneeId: string) =>
    apiClient.post<{ message: string }>(`/tasks/${id}/assign`, { assigneeId }),

  unassignTask: (id: string, assigneeId: string) =>
    apiClient.delete(`/tasks/${id}/assign/${assigneeId}`),

  addWatcher: (id: string, watcherId: string) =>
    apiClient.post<{ message: string }>(`/tasks/${id}/watchers`, { watcherId }),

  removeWatcher: (id: string, watcherId: string) =>
    apiClient.delete(`/tasks/${id}/watchers/${watcherId}`),

  markComplete: (id: string) => apiClient.post<{ message: string }>(`/tasks/${id}/complete`),

  moveToSprint: (id: string, sprintId: string) =>
    apiClient.post<{ message: string }>(`/tasks/${id}/move-sprint`, { sprintId }),

  convertToSubtask: (id: string, parentTaskId: string) =>
    apiClient.post<{ message: string }>(`/tasks/${id}/convert-subtask`, { parentTaskId }),

  // Subtasks
  listSubtasks: (taskId: string) => apiClient.get<TaskResponse[]>(`/tasks/${taskId}/subtasks`),

  // Comments
  listComments: (taskId: string) => apiClient.get<CommentResponse[]>(`/tasks/${taskId}/comments`),

  addComment: (taskId: string, data: CreateCommentRequest) =>
    apiClient.post<CommentResponse>(`/tasks/${taskId}/comments`, data),

  updateComment: (commentId: string, data: UpdateCommentRequest) =>
    apiClient.put<{ message: string }>(`/tasks/comments/${commentId}`, data),

  deleteComment: (commentId: string) => apiClient.delete(`/tasks/comments/${commentId}`),

  // Attachments
  listAttachments: (taskId: string) =>
    apiClient.get<AttachmentResponse[]>(`/tasks/${taskId}/attachments`),

  addAttachment: (taskId: string, data: CreateAttachmentRequest) =>
    apiClient.post<AttachmentResponse>(`/tasks/${taskId}/attachments`, data),

  deleteAttachment: (attachmentId: string) =>
    apiClient.delete(`/tasks/attachments/${attachmentId}`),

  // Time tracking
  startTimer: (taskId: string) => apiClient.post<TimeEntryResponse>(`/tasks/${taskId}/timer/start`),

  stopTimer: () => apiClient.post<TimeEntryResponse>('/tasks/timer/stop'),

  getActiveTimer: () => apiClient.get<TimeEntryResponse>('/tasks/timer/active'),

  logTime: (taskId: string, data: LogTimeRequest) =>
    apiClient.post<TimeEntryResponse>(`/tasks/${taskId}/time`, data),

  getTimeEntries: (taskId: string) => apiClient.get<TimeEntryResponse[]>(`/tasks/${taskId}/time`),

  getTotalTime: (taskId: string) =>
    apiClient.get<{ taskId: string; totalSeconds: number; totalHours: number }>(
      `/tasks/${taskId}/time/total`
    ),

  // Dependencies
  listDependencies: (taskId: string) =>
    apiClient.get<DependencyResponse[]>(`/tasks/${taskId}/dependencies`),

  listBlockedBy: (taskId: string) =>
    apiClient.get<DependencyResponse[]>(`/tasks/${taskId}/blocked-by`),

  addDependency: (taskId: string, data: CreateDependencyRequest) =>
    apiClient.post<{ message: string }>(`/tasks/${taskId}/dependencies`, data),

  removeDependency: (taskId: string, dependsOnTaskId: string) =>
    apiClient.delete(`/tasks/${taskId}/dependencies/${dependsOnTaskId}`),

  // Checklists
  listChecklists: (taskId: string) =>
    apiClient.get<ChecklistResponse[]>(`/tasks/${taskId}/checklists`),

  createChecklist: (taskId: string, data: CreateChecklistRequest) =>
    apiClient.post<ChecklistResponse>(`/tasks/${taskId}/checklists`, data),

  addChecklistItem: (checklistId: string, data: CreateChecklistItemRequest) =>
    apiClient.post<ChecklistItemResponse>(`/tasks/checklists/${checklistId}/items`, data),

  toggleChecklistItem: (itemId: string) =>
    apiClient.patch<{ message: string }>(`/tasks/checklists/items/${itemId}`),

  deleteChecklistItem: (itemId: string) => apiClient.delete(`/tasks/checklists/items/${itemId}`),

  // Activity
  getActivity: (taskId: string, limit: number = 50) =>
    apiClient.get<ActivityResponse[]>(`/tasks/${taskId}/activity?limit=${limit}`),

  // Bulk operations
  bulkUpdateStatus: (data: BulkUpdateStatusRequest) =>
    apiClient.post<{ message: string }>('/tasks/bulk/status', data),

  bulkAssign: (data: BulkAssignRequest) =>
    apiClient.post<{ message: string }>('/tasks/bulk/assign', data),

  bulkMoveToSprint: (data: BulkMoveToSprintRequest) =>
    apiClient.post<{ message: string }>('/tasks/bulk/move-sprint', data),
};

// ============================================
// Query Hooks
// ============================================

export const useTasksByProject = (projectId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.tasks.byProject(projectId),
    queryFn: () => taskApi.listByProject(projectId),
    enabled: options?.enabled ?? !!projectId,
  });
};

export const useMyTasks = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.tasks.myTasks(),
    queryFn: taskApi.listMyTasks,
    enabled: options?.enabled ?? true,
  });
};

export const useFilteredTasks = (filters: TaskFiltersRequest, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.tasks.filtered(filters as any),
    queryFn: () => taskApi.filterTasks(filters),
    enabled: options?.enabled ?? true,
  });
};

export const useTask = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => taskApi.getById(id),
    enabled: options?.enabled ?? !!id,
  });
};

export const useSubtasks = (taskId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.tasks.subtasks(taskId),
    queryFn: () => taskApi.listSubtasks(taskId),
    enabled: options?.enabled ?? !!taskId,
  });
};

export const useTaskComments = (taskId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.tasks.comments(taskId),
    queryFn: () => taskApi.listComments(taskId),
    enabled: options?.enabled ?? !!taskId,
  });
};

export const useTaskAttachments = (taskId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.tasks.attachments(taskId),
    queryFn: () => taskApi.listAttachments(taskId),
    enabled: options?.enabled ?? !!taskId,
  });
};

export const useTaskDependencies = (taskId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.tasks.dependencies(taskId),
    queryFn: () => taskApi.listDependencies(taskId),
    enabled: options?.enabled ?? !!taskId,
  });
};

export const useTaskBlockedBy = (taskId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.tasks.blockedBy(taskId),
    queryFn: () => taskApi.listBlockedBy(taskId),
    enabled: options?.enabled ?? !!taskId,
  });
};

export const useTaskChecklists = (taskId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.tasks.checklists(taskId),
    queryFn: () => taskApi.listChecklists(taskId),
    enabled: options?.enabled ?? !!taskId,
  });
};

export const useTaskActivity = (
  taskId: string,
  limit: number = 50,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.tasks.activity(taskId, limit),
    queryFn: () => taskApi.getActivity(taskId, limit),
    enabled: options?.enabled ?? !!taskId,
  });
};

export const useTaskTimeEntries = (taskId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.tasks.timeEntries(taskId),
    queryFn: () => taskApi.getTimeEntries(taskId),
    enabled: options?.enabled ?? !!taskId,
  });
};

export const useTaskTotalTime = (taskId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.tasks.totalTime(taskId),
    queryFn: () => taskApi.getTotalTime(taskId),
    enabled: options?.enabled ?? !!taskId,
  });
};

export const useActiveTimer = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.tasks.activeTimer(),
    queryFn: taskApi.getActiveTimer,
    enabled: options?.enabled ?? true,
    retry: false,
  });
};

// ============================================
// Mutation Hooks
// ============================================

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateTaskRequest }) =>
      taskApi.create(projectId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(data.projectId) });
      if (data.sprintId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.filtered({
            projectId: data.projectId,
            sprintId: data.sprintId,
            limit: 0,
            offset: 0,
          }),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.myTasks() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) => taskApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(data.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.myTasks() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.myTasks() });
      queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(id) });
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      taskApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.myTasks() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });

      // ✅ ADD: Invalidate notifications so the UI updates
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useUpdateTaskPriority = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: string }) =>
      taskApi.updatePriority(id, priority),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.myTasks() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });

      // ✅ ADD: Invalidate notifications so the UI updates
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// ✅ FIXED: Added notification invalidation
export const useAssignTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string }) =>
      taskApi.assignTask(id, assigneeId),
    onSuccess: (_, variables) => {
      // Invalidate task queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.myTasks() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });

      // ✅ ADD: Invalidate notifications so the UI updates
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useUnassignTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string }) =>
      taskApi.unassignTask(id, assigneeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.myTasks() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

export const useAddWatcher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, watcherId }: { id: string; watcherId: string }) =>
      taskApi.addWatcher(id, watcherId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
    },
  });
};

export const useRemoveWatcher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, watcherId }: { id: string; watcherId: string }) =>
      taskApi.removeWatcher(id, watcherId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
    },
  });
};

export const useMarkTaskComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.markComplete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.myTasks() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

export const useMoveTaskToSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sprintId }: { id: string; sprintId: string }) =>
      taskApi.moveToSprint(id, sprintId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.myTasks() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

export const useConvertToSubtask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, parentTaskId }: { id: string; parentTaskId: string }) =>
      taskApi.convertToSubtask(id, parentTaskId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.subtasks(variables.parentTaskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

// ✅ FIXED: Added notification invalidation for comments
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: CreateCommentRequest }) =>
      taskApi.addComment(taskId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.comments(data.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.activity(data.taskId) });

      // ✅ ADD: Invalidate notifications (for mentions and comment notifications)
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentRequest }) =>
      taskApi.updateComment(commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

export const useAddAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: CreateAttachmentRequest }) =>
      taskApi.addAttachment(taskId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.attachments(data.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.activity(data.taskId) });
    },
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.deleteAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

export const useStartTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.startTimer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.activeTimer() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.activity(data.taskId) });
    },
  });
};

export const useStopTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.stopTimer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.activeTimer() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeEntries(data.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.totalTime(data.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(data.taskId) });
    },
  });
};

export const useLogTime = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: LogTimeRequest }) =>
      taskApi.logTime(taskId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeEntries(data.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.totalTime(data.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(data.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.activity(data.taskId) });
    },
  });
};

export const useAddDependency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: CreateDependencyRequest }) =>
      taskApi.addDependency(taskId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.dependencies(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.activity(variables.taskId) });
    },
  });
};

export const useRemoveDependency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, dependsOnTaskId }: { taskId: string; dependsOnTaskId: string }) =>
      taskApi.removeDependency(taskId, dependsOnTaskId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.dependencies(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.activity(variables.taskId) });
    },
  });
};

export const useCreateChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: CreateChecklistRequest }) =>
      taskApi.createChecklist(taskId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.checklists(data.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.activity(data.taskId) });
    },
  });
};

export const useAddChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      checklistId,
      data,
    }: {
      checklistId: string;
      data: CreateChecklistItemRequest;
    }) => taskApi.addChecklistItem(checklistId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

export const useToggleChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.toggleChecklistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

export const useDeleteChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.deleteChecklistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

export const useBulkUpdateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.bulkUpdateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.myTasks() });
    },
  });
};

// ✅ FIXED: Added notification invalidation for bulk assign
export const useBulkAssign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.bulkAssign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.myTasks() });

      // ✅ ADD: Invalidate notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useBulkMoveToSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.bulkMoveToSprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.myTasks() });
    },
  });
};
