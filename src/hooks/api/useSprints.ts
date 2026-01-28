// src/hooks/api/useSprints.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { queryKeys } from '../../lib/query-client';

// ============================================
// Types
// ============================================

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
}

export interface UpdateSprintRequest {
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface SprintReportResponse {
  sprintId: string;
  committedTasks: number;
  committedPoints: number;
  completedTasks: number;
  completedPoints: number;
  incompleteTasks: number;
  incompletePoints: number;
  carryoverTasks: number;
  carryoverPoints: number;
  totalEstimatedHours: number;
  totalLoggedHours: number;
  avgCycleTimeHours?: number;
  avgLeadTimeHours?: number;
  velocity: number;
  goalsCompleted: number;
  goalsTotal: number;
}

export interface VelocityHistoryResponse {
  sprintId: string;
  sprintName: string;
  sprintNumber: number;
  committedPoints: number;
  completedPoints: number;
  startDate: string;
  endDate: string;
}

export interface VelocityTrendResponse {
  sprints: VelocityHistoryResponse[];
  averageVelocity: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface CycleTimeResponse {
  taskId: string;
  taskTitle: string;
  cycleTimeHours?: number;
  leadTimeHours?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface SprintAnalyticsDashboardResponse {
  sprintId: string;
  report: SprintReportResponse;
  completionPercentage: number;
  daysRemaining: number;
  daysElapsed: number;
  currentVelocity: number;
  projectedVelocity: number;
  avgCycleTimeHours?: number;
  burndownAvailable: boolean;
  goalsCompleted: number;
  goalsTotal: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
}

export interface ProjectAnalyticsDashboardResponse {
  projectId: string;
  velocityTrend: VelocityTrendResponse;
  avgCycleTimeHours: number;
  avgLeadTimeHours: number;
  activeSprintId?: string;
  activeSprintName?: string;
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  overdueTasks: number;
  tasksCompletedLast30Days: number;
  pointsCompletedLast30Days: number;
}

export interface TaskStatusHistoryResponse {
  id: string;
  taskId: string;
  fromStatus?: string;
  toStatus: string;
  changedBy?: string;
  changedAt: string;
}

// ============================================
// API Functions
// ============================================

const sprintApi = {
  // Sprint CRUD
  listByProject: (projectId: string) => apiClient.get<Sprint[]>(`/projects/${projectId}/sprints`),

  getById: (sprintId: string) => apiClient.get<Sprint>(`/sprints/${sprintId}`),

  getActive: (projectId: string) => apiClient.get<Sprint>(`/projects/${projectId}/sprints/active`),

  create: (projectId: string, data: CreateSprintRequest) =>
    apiClient.post<Sprint>(`/projects/${projectId}/sprints`, data),

  update: (sprintId: string, data: UpdateSprintRequest) =>
    apiClient.put<Sprint>(`/sprints/${sprintId}`, data),

  start: (sprintId: string) => apiClient.post<Sprint>(`/sprints/${sprintId}/start`),

  complete: (sprintId: string) => apiClient.post<Sprint>(`/sprints/${sprintId}/complete`),

  delete: (sprintId: string) => apiClient.delete(`/sprints/${sprintId}`),

  // Sprint Reports
  getSprintReport: (sprintId: string) =>
    apiClient.get<SprintReportResponse>(`/sprints/${sprintId}/report`),

  generateSprintReport: (sprintId: string) =>
    apiClient.post<SprintReportResponse>(`/sprints/${sprintId}/report/generate`),

  // Velocity
  getVelocityHistory: (projectId: string) =>
    apiClient.get<VelocityHistoryResponse[]>(`/projects/${projectId}/velocity`),

  getVelocityTrend: (projectId: string) =>
    apiClient.get<VelocityTrendResponse>(`/projects/${projectId}/velocity/trend`),

  // Cycle Time
  getSprintCycleTime: (sprintId: string) =>
    apiClient.get<CycleTimeResponse[]>(`/sprints/${sprintId}/cycle-time`),

  getProjectCycleTime: (projectId: string) =>
    apiClient.get<CycleTimeResponse[]>(`/projects/${projectId}/cycle-time`),

  getTaskStatusHistory: (taskId: string) =>
    apiClient.get<TaskStatusHistoryResponse[]>(`/tasks/${taskId}/status-history`),

  // Analytics Dashboards
  getSprintAnalytics: (sprintId: string) =>
    apiClient.get<SprintAnalyticsDashboardResponse>(`/sprints/${sprintId}/analytics`),

  getProjectAnalytics: (projectId: string) =>
    apiClient.get<ProjectAnalyticsDashboardResponse>(`/projects/${projectId}/analytics`),
};

// ============================================
// Sprint CRUD Query Hooks
// ============================================

export const useSprintsByProject = (projectId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.sprints.all, 'project', projectId],
    queryFn: () => sprintApi.listByProject(projectId),
    enabled: options?.enabled ?? !!projectId,
  });
};

export const useSprint = (sprintId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.sprints.all, 'detail', sprintId],
    queryFn: () => sprintApi.getById(sprintId),
    enabled: options?.enabled ?? !!sprintId,
  });
};

export const useActiveSprint = (projectId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.sprints.all, 'active', projectId],
    queryFn: () => sprintApi.getActive(projectId),
    enabled: options?.enabled ?? !!projectId,
    retry: false,
  });
};

// ============================================
// Analytics Query Hooks
// ============================================

export const useSprintReport = (sprintId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.sprints.report(sprintId),
    queryFn: () => sprintApi.getSprintReport(sprintId),
    enabled: options?.enabled ?? !!sprintId,
  });
};

export const useVelocityHistory = (projectId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.sprints.velocity(projectId),
    queryFn: () => sprintApi.getVelocityHistory(projectId),
    enabled: options?.enabled ?? !!projectId,
  });
};

export const useVelocityTrend = (projectId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.sprints.velocity(projectId), 'trend'],
    queryFn: () => sprintApi.getVelocityTrend(projectId),
    enabled: options?.enabled ?? !!projectId,
  });
};

export const useSprintCycleTime = (sprintId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.sprints.cycleTime(sprintId),
    queryFn: () => sprintApi.getSprintCycleTime(sprintId),
    enabled: options?.enabled ?? !!sprintId,
  });
};

export const useProjectCycleTime = (projectId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.sprints.cycleTime(projectId), 'project'],
    queryFn: () => sprintApi.getProjectCycleTime(projectId),
    enabled: options?.enabled ?? !!projectId,
  });
};

export const useTaskStatusHistory = (taskId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'status-history', taskId],
    queryFn: () => sprintApi.getTaskStatusHistory(taskId),
    enabled: options?.enabled ?? !!taskId,
  });
};

export const useSprintAnalytics = (sprintId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.sprints.analytics(sprintId),
    queryFn: () => sprintApi.getSprintAnalytics(sprintId),
    enabled: options?.enabled ?? !!sprintId,
  });
};

export const useProjectAnalytics = (projectId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.projects.all, 'analytics', projectId],
    queryFn: () => sprintApi.getProjectAnalytics(projectId),
    enabled: options?.enabled ?? !!projectId,
  });
};

// ============================================
// Sprint CRUD Mutation Hooks
// ============================================

export const useCreateSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateSprintRequest }) =>
      sprintApi.create(projectId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sprints.all, 'project', data.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sprints.all, 'active', data.projectId],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(data.projectId) });
    },
  });
};

export const useUpdateSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId, data }: { sprintId: string; data: UpdateSprintRequest }) =>
      sprintApi.update(sprintId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.sprints.all, 'detail', data.id] });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sprints.all, 'project', data.projectId],
      });
    },
  });
};

export const useStartSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sprintId: string) => sprintApi.start(sprintId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(data.projectId) });
    },
  });
};

export const useCompleteSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sprintId: string) => sprintApi.complete(sprintId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(data.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.velocity(data.projectId) });
    },
  });
};

export const useDeleteSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sprintId: string) => sprintApi.delete(sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all });
    },
  });
};

export const useGenerateSprintReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sprintId: string) => sprintApi.generateSprintReport(sprintId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.report(data.sprintId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.analytics(data.sprintId) });
    },
  });
};
