// src/hooks/api/useGantt.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { queryKeys } from '../../lib/query-client';

// ============================================
// Types
// ============================================

export interface GanttTaskResponse {
  id: string;
  title: string;
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  status: string;
  priority: string;
  progress: number;
  assigneeIds: string[];
  parentTaskId?: string;
  dependencies: string[];
  sprintId?: string;
  storyPoints?: number;
  type?: string;
  color: string;
}

export interface GanttDataResponse {
  tasks: GanttTaskResponse[];
  startDate: string;
  endDate: string;
  totalTasks: number;
}

// ============================================
// API Functions
// ============================================

const ganttApi = {
  getProjectGantt: (projectId: string, sprintId?: string) => {
    const url = sprintId
      ? `/projects/${projectId}/gantt?sprintId=${sprintId}`
      : `/projects/${projectId}/gantt`;
    return apiClient.get<GanttDataResponse>(url);
  },
};

// ============================================
// Query Hooks
// ============================================

export const useProjectGantt = (
  projectId: string,
  sprintId?: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: queryKeys.gantt.byProject(projectId, sprintId),
    queryFn: () => ganttApi.getProjectGantt(projectId, sprintId),
    enabled: options?.enabled ?? !!projectId,
  });
};
