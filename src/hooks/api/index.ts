// Auth hooks
export {
  useCurrentUser,
  useLogin,
  useRegister,
  useLogout,
  useUpdateProfile,
} from './useAuth';

// Workspace hooks
export {
  useWorkspaces,
  useWorkspace,
  useWorkspaceMembers,
  useCreateWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
  useInviteWorkspaceMember,
  useRemoveWorkspaceMember,
  useUpdateWorkspaceMemberRole,
} from './useWorkspaces';

// Space hooks
export {
  useSpaces,
  useSpace,
  useCreateSpace,
  useUpdateSpace,
  useDeleteSpace,
} from './useSpaces';

// Project hooks
export {
  useProjects,
  useProject,
  useProjectMembers,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useAddProjectMember,
  useRemoveProjectMember,
} from './useProjects';

// Sprint hooks
export {
  useSprints,
  useActiveSprint,
  useSprint,
  useCreateSprint,
  useUpdateSprint,
  useDeleteSprint,
  useStartSprint,
  useCompleteSprint,
} from './useSprints';

// Task hooks
export {
  useTasks,
  useTasksInfinite,
  useBacklogTasks,
  useSprintTasks,
  useTask,
  useTaskComments,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  useAddComment,
  useDeleteComment,
  useBulkUpdateTasks,
  useMoveTaskToSprint,
} from './useTasks';

// Label hooks
export {
  useLabels,
  useCreateLabel,
  useUpdateLabel,
  useDeleteLabel,
} from './useLabels';

// Notification hooks
export {
  useNotifications,
  useUnreadNotifications,
  useNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllNotifications
} from './useNotifications';

// Types
export type { User, LoginCredentials, RegisterData, AuthResponse } from './useAuth';
export type { Workspace, WorkspaceMember, CreateWorkspaceData, InviteMemberData } from './useWorkspaces';
export type { Space, CreateSpaceData } from './useSpaces';
export type { Project, ProjectMember, CreateProjectData } from './useProjects';
export type { Sprint, SprintStatus, CreateSprintData } from './useSprints';
export type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
  Comment,
  TaskFilters,
  CreateTaskData,
} from './useTasks';
export type { Label, CreateLabelData } from './useLabels';
export type { Notification, NotificationType, NotificationCount } from './useNotifications';
