// src/hooks/api/useGoals.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { queryKeys } from '../../lib/query-client';

// ============================================
// Types
// ============================================

export interface KeyResultResponse {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  unit?: string;
  status: string;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalResponse {
  id: string;
  workspaceId: string;
  projectId?: string;
  sprintId?: string;
  title: string;
  description?: string;
  goalType: string;
  status: string;
  targetValue?: number;
  currentValue: number;
  progress: number;
  unit?: string;
  startDate?: string;
  targetDate?: string;
  completedAt?: string;
  ownerId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  keyResults?: KeyResultResponse[];
  linkedTasks?: string[];
}

export interface CreateGoalRequest {
  workspaceId: string;
  projectId?: string;
  sprintId?: string;
  title: string;
  description?: string;
  goalType: string;
  targetValue?: number;
  unit?: string;
  startDate?: string;
  targetDate?: string;
  ownerId?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  status?: string;
  targetValue?: number;
  startDate?: string;
  targetDate?: string;
  ownerId?: string;
}

export interface CreateKeyResultRequest {
  title: string;
  description?: string;
  targetValue: number;
  unit?: string;
  weight?: number;
}

export interface UpdateKeyResultRequest {
  title?: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  weight?: number;
}

export interface GoalProgressResponse {
  goalId: string;
  overallProgress: number;
  keyResultsProgress: Array<{
    keyResultId: string;
    title: string;
    progress: number;
    weight: number;
  }>;
  linkedTasksCompleted: number;
  linkedTasksTotal: number;
}

export interface SprintGoalsSummaryResponse {
  sprintId: string;
  totalGoals: number;
  completedGoals: number;
  atRiskGoals: number;
  overallProgress: number;
  goals: GoalResponse[];
}

// ============================================
// API Functions
// ============================================

const goalApi = {
  // CRUD
  create: (data: CreateGoalRequest) => apiClient.post<GoalResponse>('/goals', data),

  get: (id: string) => apiClient.get<GoalResponse>(`/goals/${id}`),

  update: (id: string, data: UpdateGoalRequest) =>
    apiClient.put<GoalResponse>(`/goals/${id}`, data),

  delete: (id: string) => apiClient.delete(`/goals/${id}`),

  // Progress & Status
  updateProgress: (id: string, currentValue: number) =>
    apiClient.patch<GoalResponse>(`/goals/${id}/progress`, { currentValue }),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<GoalResponse>(`/goals/${id}/status`, { status }),

  getProgress: (id: string) => apiClient.get<GoalProgressResponse>(`/goals/${id}/progress`),

  // Key Results
  addKeyResult: (goalId: string, data: CreateKeyResultRequest) =>
    apiClient.post<KeyResultResponse>(`/goals/${goalId}/key-results`, data),

  updateKeyResult: (krId: string, data: UpdateKeyResultRequest) =>
    apiClient.put<KeyResultResponse>(`/goals/key-results/${krId}`, data),

  updateKeyResultProgress: (krId: string, currentValue: number) =>
    apiClient.patch<KeyResultResponse>(`/goals/key-results/${krId}/progress`, { currentValue }),

  deleteKeyResult: (krId: string) => apiClient.delete(`/goals/key-results/${krId}`),

  // Task Linking
  linkTask: (goalId: string, taskId: string) =>
    apiClient.post(`/goals/${goalId}/tasks`, { taskId }),

  unlinkTask: (goalId: string, taskId: string) =>
    apiClient.delete(`/goals/${goalId}/tasks/${taskId}`),

  // List by entity
  listByWorkspace: (workspaceId: string) =>
    apiClient.get<GoalResponse[]>(`/workspaces/${workspaceId}/goals`),

  listByProject: (projectId: string) =>
    apiClient.get<GoalResponse[]>(`/projects/${projectId}/goals`),

  listBySprint: (sprintId: string) => apiClient.get<GoalResponse[]>(`/sprints/${sprintId}/goals`),

  listByTask: (taskId: string) => apiClient.get<GoalResponse[]>(`/tasks/${taskId}/goals`),

  getSprintSummary: (sprintId: string) =>
    apiClient.get<SprintGoalsSummaryResponse>(`/sprints/${sprintId}/goals/summary`),
};

// ============================================
// Query Hooks
// ============================================

export const useGoal = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.goals.detail(id),
    queryFn: () => goalApi.get(id),
    enabled: options?.enabled ?? !!id,
  });
};

export const useGoalsByWorkspace = (workspaceId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.goals.byEntity('workspace', workspaceId),
    queryFn: () => goalApi.listByWorkspace(workspaceId),
    enabled: options?.enabled ?? !!workspaceId,
  });
};

export const useGoalsByProject = (projectId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.goals.byEntity('project', projectId),
    queryFn: () => goalApi.listByProject(projectId),
    enabled: options?.enabled ?? !!projectId,
  });
};

export const useGoalsBySprint = (sprintId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.goals.byEntity('sprint', sprintId),
    queryFn: () => goalApi.listBySprint(sprintId),
    enabled: options?.enabled ?? !!sprintId,
  });
};

export const useGoalsByTask = (taskId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.goals.byTask(taskId),
    queryFn: () => goalApi.listByTask(taskId),
    enabled: options?.enabled ?? !!taskId,
  });
};

export const useGoalProgress = (goalId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.goals.progress(goalId),
    queryFn: () => goalApi.getProgress(goalId),
    enabled: options?.enabled ?? !!goalId,
  });
};

export const useSprintGoalsSummary = (sprintId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.goals.summary('sprint', sprintId),
    queryFn: () => goalApi.getSprintSummary(sprintId),
    enabled: options?.enabled ?? !!sprintId,
  });
};

// ============================================
// Mutation Hooks
// ============================================

export const useCreateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGoalRequest) => goalApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.goals.byEntity('workspace', data.workspaceId),
      });
      if (data.projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.goals.byEntity('project', data.projectId),
        });
      }
      if (data.sprintId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.goals.byEntity('sprint', data.sprintId),
        });
      }
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalRequest }) => goalApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
};

export const useUpdateGoalProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, currentValue }: { id: string; currentValue: number }) =>
      goalApi.updateProgress(id, currentValue),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.progress(data.id) });
    },
  });
};

export const useUpdateGoalStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      goalApi.updateStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(data.id) });
    },
  });
};

export const useAddKeyResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: CreateKeyResultRequest }) =>
      goalApi.addKeyResult(goalId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(data.goalId) });
    },
  });
};

export const useUpdateKeyResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ krId, data }: { krId: string; data: UpdateKeyResultRequest }) =>
      goalApi.updateKeyResult(krId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(data.goalId) });
    },
  });
};

export const useUpdateKeyResultProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ krId, currentValue }: { krId: string; currentValue: number }) =>
      goalApi.updateKeyResultProgress(krId, currentValue),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(data.goalId) });
    },
  });
};

export const useDeleteKeyResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (krId: string) => goalApi.deleteKeyResult(krId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
};

export const useLinkTaskToGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, taskId }: { goalId: string; taskId: string }) =>
      goalApi.linkTask(goalId, taskId),
    onSuccess: (_, { goalId, taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(goalId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.byTask(taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
    },
  });
};

export const useUnlinkTaskFromGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, taskId }: { goalId: string; taskId: string }) =>
      goalApi.unlinkTask(goalId, taskId),
    onSuccess: (_, { goalId, taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(goalId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.byTask(taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
    },
  });
};
