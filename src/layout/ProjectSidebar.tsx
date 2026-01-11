// src/layout/ProjectSidebar.tsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Home,
  CheckSquare,
  Search,
  Plus,
  ChevronRight,
  Settings,
  Users,
  LogOut,
  Zap,
  MessageSquare,
  UserPlus,
  Bell,
  Settings2,
  Trash2,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../components/UserProfile/AuthContext';
import { useNotificationCount } from '../hooks/api/useNotifications';
import { useUnreadCounts } from '../hooks/api/useChat';
import {
  useEffectiveMembers,
  useAddMember,
  useUpdateMemberRole,
  useRemoveMember,
} from '../hooks/api/useMembers';
import WorkspaceSelector from '../components/workspace/WorkspaceSelector';
import { useSearchUsers } from '../hooks/useUsers';
import MemberManagementModal from '../components/modals/MemberManagementModal';
import {
  useAccessibleFolders,
  useAccessibleProjects,
  useAccessibleSpaces,
  useAccessibleWorkspaces,
} from '../hooks/api/useAccessibleEntities';
import { SpaceItem } from '../components/projectSidebarCompponent/SpaceComponent';
import { useProjectContext } from '../context/ProjectContext';
import toast from 'react-hot-toast';

// ============================================================================
// LOCALSTORAGE KEYS
// ============================================================================
const STORAGE_KEYS = {
  WORKSPACE: 'selectedWorkspaceId',
  SPACE: 'selectedSpaceId',
  PROJECT: 'selectedProjectId',
  FOLDER: 'selectedFolderId',
} as const;

// ============================================================================
// SPACE MANAGEMENT MODAL COMPONENT
// ============================================================================
interface SpaceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  space?: { id: string; name: string; color?: string; icon?: string } | null;
  onSubmit: (data: { name: string; color?: string; icon?: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const SpaceManagementModal: React.FC<SpaceManagementModalProps> = ({
  isOpen,
  onClose,
  mode,
  space,
  onSubmit,
  onDelete,
}) => {
  const [name, setName] = useState(space?.name || '');
  const [color, setColor] = useState(space?.color || '#6366f1');
  const [icon, setIcon] = useState(space?.icon || '📁');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(space?.name || '');
      setColor(space?.color || '#6366f1');
      setIcon(space?.icon || '📁');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, space]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Space name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), color, icon });
      onClose();
      toast.success(
        mode === 'create' ? 'Space created successfully' : 'Space updated successfully'
      );
    } catch (error) {
      toast.error(mode === 'create' ? 'Failed to create space' : 'Failed to update space');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsSubmitting(true);
    try {
      await onDelete();
      onClose();
      toast.success('Space deleted successfully');
    } catch (error) {
      toast.error('Failed to delete space');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const colorOptions = [
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#14b8a6',
    '#06b6d4',
    '#3b82f6',
  ];

  const iconOptions = ['📁', '🚀', '💼', '🎯', '📊', '🔧', '💡', '🎨', '📱', '🌟'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Create New Space' : 'Edit Space'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        {showDeleteConfirm ? (
          <div className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Space?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will permanently delete "{space?.name}" and all its contents. This action
                cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete Space'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Space Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter space name..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
                autoFocus
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((iconOption) => (
                  <button
                    key={iconOption}
                    type="button"
                    onClick={() => setIcon(iconOption)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                      icon === iconOption
                        ? 'bg-violet-100 dark:bg-violet-900/30 ring-2 ring-violet-500'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {iconOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      color === colorOption
                        ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-gray-900 dark:ring-white scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: colorOption }}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {mode === 'edit' && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Space' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN SIDEBAR COMPONENT
// ============================================================================
const ProjectSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const {
    currentWorkspace,
    currentSpace,
    currentFolder,
    currentProject, // ✅ FIX: Added currentProject
    setCurrentWorkspace,
    setCurrentSpace,
    setCurrentProject,
    setCurrentFolder,
    isInitializing,
    setManagementEntity,
    createSpace,
    updateSpace,
    deleteSpace,
  } = useProjectContext();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const { data: workspaces, isLoading: workspacesLoading } = useAccessibleWorkspaces({
    enabled: !!user,
  });
  const { data: allSpaces, isLoading: spacesLoading } = useAccessibleSpaces({
    enabled: !!user,
  });
  const { data: allProjects, isLoading: projectsLoading } = useAccessibleProjects({
    enabled: !!user,
  });
  const { data: allFolders, isLoading: foldersLoading } = useAccessibleFolders({
    enabled: !!user,
  });

  const { data: notificationData } = useNotificationCount({ enabled: !!user });
  const { data: chatUnreadData } = useUnreadCounts({ enabled: !!user });

  // ============================================================================
  // LOCAL STATE
  // ============================================================================
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hoveredSpace, setHoveredSpace] = useState<string | null>(null);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [memberModal, setMemberModal] = useState<{
    isOpen: boolean;
    entityType: 'workspace' | 'space' | 'folder' | 'project';
    entityId: string;
    entityName: string;
  } | null>(null);

  // Space management modal state
  const [spaceModal, setSpaceModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    space: { id: string; name: string; color?: string; icon?: string } | null;
  }>({ isOpen: false, mode: 'create', space: null });

  // Track if we're restoring from storage vs navigation
  const [hasInitializedFromStorage, setHasInitializedFromStorage] = useState(false);

  const showFull = isExpanded || isHovered || isMobileOpen;

  // ============================================================================
  // MEMOIZED DATA FILTERS
  // ============================================================================
  const spacesForCurrentWorkspace = useMemo(() => {
    if (!currentWorkspace || !allSpaces) return [];
    return allSpaces.filter((space) => space.workspaceId === currentWorkspace.id);
  }, [allSpaces, currentWorkspace]);

  const projectsBySpaceId = useMemo(() => {
    if (!allProjects) return {};
    return allProjects.reduce(
      (map, project) => {
        if (!map[project.spaceId]) {
          map[project.spaceId] = [];
        }
        map[project.spaceId].push(project);
        return map;
      },
      {} as Record<string, typeof allProjects>
    );
  }, [allProjects]);

  const foldersBySpaceId = useMemo(() => {
    if (!allFolders) return {};
    return allFolders.reduce(
      (map, folder) => {
        if (!map[folder.spaceId]) {
          map[folder.spaceId] = [];
        }
        map[folder.spaceId].push(folder);
        return map;
      },
      {} as Record<string, typeof allFolders>
    );
  }, [allFolders]);

  const projectsByFolderId = useMemo(() => {
    if (!allProjects) return {};
    return allProjects.reduce(
      (map, project) => {
        if (project.folderId) {
          if (!map[project.folderId]) {
            map[project.folderId] = [];
          }
          map[project.folderId].push(project);
        }
        return map;
      },
      {} as Record<string, typeof allProjects>
    );
  }, [allProjects]);

  // ============================================================================
  // STATE PERSISTENCE - RESTORE ON MOUNT (WITH GUARDS)
  // ============================================================================

  // 1. WORKSPACE RESTORATION
  useEffect(() => {
    if (hasInitializedFromStorage) return;
    if (!workspaces || workspaces.length === 0) return;

    const savedWorkspaceId = localStorage.getItem(STORAGE_KEYS.WORKSPACE);

    if (savedWorkspaceId) {
      const savedWorkspace = workspaces.find((w) => w.id === savedWorkspaceId);
      if (savedWorkspace && !currentWorkspace) {
        setCurrentWorkspace(savedWorkspace as any);
        setHasInitializedFromStorage(true);
        return;
      }
    }

    if (!currentWorkspace && !savedWorkspaceId) {
      setCurrentWorkspace(workspaces[0] as any);
      localStorage.setItem(STORAGE_KEYS.WORKSPACE, workspaces[0].id);
    }

    setHasInitializedFromStorage(true);
  }, [workspaces, currentWorkspace, setCurrentWorkspace, hasInitializedFromStorage]);

  // 2. SPACE RESTORATION
  useEffect(() => {
    if (!allSpaces || allSpaces.length === 0 || !currentWorkspace) return;
    if (currentSpace) return;

    const savedSpaceId = localStorage.getItem(STORAGE_KEYS.SPACE);

    if (savedSpaceId) {
      const savedSpace = allSpaces.find(
        (s) => s.id === savedSpaceId && s.workspaceId === currentWorkspace.id
      );
      if (savedSpace) {
        setCurrentSpace(savedSpace as any);
      }
    }
  }, [allSpaces, currentSpace, currentWorkspace, setCurrentSpace]);

  // 3. FOLDER RESTORATION
  useEffect(() => {
    if (!allFolders || allFolders.length === 0 || !currentSpace) return;
    if (currentFolder) return;

    const savedFolderId = localStorage.getItem(STORAGE_KEYS.FOLDER);

    if (savedFolderId && setCurrentFolder) {
      const savedFolder = allFolders.find(
        (f) => f.id === savedFolderId && f.spaceId === currentSpace.id
      );
      if (savedFolder) {
        setCurrentFolder(savedFolder as any);
      }
    }
  }, [allFolders, currentFolder, currentSpace, setCurrentFolder]);

  // ✅ REMOVED: Project restoration - let ProjectContext handle it to prevent navigation override

  // ============================================================================
  // AUTO-EXPAND CURRENT SPACE
  // ============================================================================
  useEffect(() => {
    if (currentSpace) {
      setExpandedSpaces((prev) => new Set([...prev, currentSpace.id]));
    }
  }, [currentSpace]);

  // ============================================================================
  // HANDLER FUNCTIONS
  // ============================================================================

  const handleWorkspaceChange = (workspace: any) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem(STORAGE_KEYS.WORKSPACE, workspace.id);

    localStorage.removeItem(STORAGE_KEYS.SPACE);
    localStorage.removeItem(STORAGE_KEYS.FOLDER);
    localStorage.removeItem(STORAGE_KEYS.PROJECT);

    setCurrentSpace(null);
    setCurrentFolder(null);
    setCurrentProject(null);
  };

  const handleSpaceChange = (space: any) => {
    setCurrentSpace(space);
    localStorage.setItem(STORAGE_KEYS.SPACE, space.id);
    localStorage.removeItem(STORAGE_KEYS.FOLDER);
    setCurrentFolder(null);

    // ✅ Close mobile sidebar after selection
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  const handleFolderChange = (folder: any) => {
    if (setCurrentFolder) {
      setCurrentFolder(folder);
      localStorage.setItem(STORAGE_KEYS.FOLDER, folder.id);
    }

    // ✅ Close mobile sidebar after selection
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  const handleProjectChange = (project: any) => {
    setCurrentProject(project);
    localStorage.setItem(STORAGE_KEYS.PROJECT, project.id);

    // ✅ Close mobile sidebar after selection
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  // ============================================================================
  // SPACE MANAGEMENT HANDLERS
  // ============================================================================

  const handleCreateSpace = () => {
    setSpaceModal({ isOpen: true, mode: 'create', space: null });
  };

  const handleEditSpace = (space: { id: string; name: string; color?: string; icon?: string }) => {
    setSpaceModal({ isOpen: true, mode: 'edit', space });
  };

  const handleSpaceSubmit = async (data: { name: string; color?: string; icon?: string }) => {
    if (spaceModal.mode === 'create') {
      await createSpace(data);
    } else if (spaceModal.space) {
      await updateSpace(spaceModal.space.id, data);
    }
  };

  const handleSpaceDelete = async () => {
    if (spaceModal.space) {
      await deleteSpace(spaceModal.space.id);
    }
  };

  // ============================================================================
  // NAVIGATION HELPERS
  // ============================================================================

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isProjectActive = (projectId: string) =>
    location.pathname.includes(`/project/${projectId}`);

  const handleNavigation = (path: string) => {
    navigate(path);
    // ✅ Close mobile sidebar after navigation
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  const totalChatUnread = chatUnreadData
    ? Object.values(chatUnreadData).reduce((sum, count) => sum + count, 0)
    : 0;

  const unreadNotifications = notificationData?.unread || 0;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleSpace = (spaceId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedSpaces((prev) => {
      const next = new Set(prev);
      if (next.has(spaceId)) {
        next.delete(spaceId);
      } else {
        next.add(spaceId);
      }
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.WORKSPACE);
    localStorage.removeItem(STORAGE_KEYS.SPACE);
    localStorage.removeItem(STORAGE_KEYS.FOLDER);
    localStorage.removeItem(STORAGE_KEYS.PROJECT);

    logout();
    navigate('/signin');
  };

  const openMemberModal = (
    entityType: 'workspace' | 'space' | 'folder' | 'project',
    entityId: string,
    entityName: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    setMemberModal({ isOpen: true, entityType, entityId, entityName });
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (isInitializing || workspacesLoading) {
    return (
      <aside
        className={`fixed mt-16 lg:mt-0 top-0 left-0 h-screen z-50 
          bg-white dark:bg-[#1a1d21] 
          border-r border-gray-200 dark:border-[#2a2e33] 
          transition-all duration-300 ease-in-out
          ${showFull ? 'w-[280px]' : 'w-[72px]'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0
          shadow-lg lg:shadow-none`}
      >
        <div className="p-4 animate-pulse">
          <div className="flex items-center gap-3 p-2.5">
            <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-[#2a2e33]" />
            {showFull && <div className="h-5 bg-gray-200 dark:bg-[#2a2e33] rounded-lg flex-1" />}
          </div>
        </div>
        <div className="px-3 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-[#2a2e33] rounded-xl animate-pulse" />
          ))}
        </div>
      </aside>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleMobileSidebar}
        />
      )}

      <aside
        className={`fixed mt-16 lg:mt-0 top-0 left-0 h-screen z-50 flex flex-col
          bg-white dark:bg-[#1a1d21] 
          border-r border-gray-200 dark:border-[#2a2e33] 
          transition-all duration-300 ease-in-out
          ${showFull ? 'w-[280px]' : 'w-[72px]'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          shadow-2xl lg:shadow-none`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Workspace Selector */}
        <div className="transition-all duration-200">
          <WorkspaceSelector
            currentWorkspace={currentWorkspace}
            onWorkspaceChange={handleWorkspaceChange}
            onCreateNew={() => setIsCreateWorkspaceModalOpen(true)}
            showFull={showFull}
          />
        </div>

        {/* Workspace Actions */}
        {currentWorkspace && showFull && (
          <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2a2e33]">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) =>
                  openMemberModal('workspace', currentWorkspace.id, currentWorkspace.name, e)
                }
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
                  text-gray-600 dark:text-[#9ca3af] 
                  bg-gray-100 dark:bg-[#25282c] 
                  hover:bg-gray-200 dark:hover:bg-[#2a2e33] 
                  hover:text-gray-900 dark:hover:text-white 
                  transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
              <button
                onClick={() => {
                  handleNavigation(`/member-management/workspace/${currentWorkspace.id}`);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
                  text-gray-600 dark:text-[#9ca3af] 
                  bg-gray-100 dark:bg-[#25282c] 
                  hover:bg-gray-200 dark:hover:bg-[#2a2e33] 
                  hover:text-gray-900 dark:hover:text-white 
                  transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Manage</span>
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className={`p-3 ${!showFull ? 'px-2' : ''}`}>
          {showFull ? (
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl 
              bg-gray-100 dark:bg-[#25282c] 
              hover:bg-gray-200 dark:hover:bg-[#2a2e33] 
              text-gray-600 dark:text-[#6b7280] 
              hover:text-gray-900 dark:hover:text-white
              text-sm font-medium transition-all duration-200 group"
            >
              <Search className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span>Search</span>
              <kbd
                className="ml-auto text-[10px] px-2 py-1 rounded-md 
                bg-white dark:bg-[#1a1d21] 
                text-gray-500 dark:text-[#6b7280]
                border border-gray-300 dark:border-[#2a2e33]
                font-mono"
              >
                ⌘K
              </kbd>
            </button>
          ) : (
            <button
              className="w-full p-3 rounded-xl 
              hover:bg-gray-100 dark:hover:bg-[#2a2e33] 
              text-gray-600 dark:text-[#6b7280] 
              hover:text-gray-900 dark:hover:text-white 
              transition-all duration-200 flex justify-center group"
            >
              <Search className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="px-3 py-2 border-b border-gray-200 dark:border-[#2a2e33]">
          {[
            { icon: Home, label: 'Home', path: '/' },
            {
              icon: Bell,
              label: 'Notifications',
              path: '/notifications',
              badge: unreadNotifications > 0 ? unreadNotifications : undefined,
            },
            {
              icon: MessageSquare,
              label: 'Chat',
              path: '/chat',
              badge: totalChatUnread > 0 ? totalChatUnread : undefined,
            },
            { icon: CheckSquare, label: 'My Tasks', path: '/my-tasks' },
            {
              icon: Settings2,
              label: 'Member Management',
              onClick: () => {
                if (!currentWorkspace) return;
                setManagementEntity({
                  entityType: 'workspace',
                  entityId: currentWorkspace.id,
                  entityName: currentWorkspace.name,
                });
                handleNavigation(`/member-management/workspace/${currentWorkspace.id}`);
              },
            },
          ].map((item) => {
            const Icon = item.icon;

            if ('onClick' in item && item.onClick) {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-1 group
                    text-gray-700 dark:text-[#9ca3af] 
                    hover:bg-gray-100 dark:hover:bg-[#25282c] 
                    hover:text-gray-900 dark:hover:text-white
                    active:scale-[0.98]
                    ${!showFull ? 'justify-center px-3' : ''}`}
                  title={!showFull ? item.label : undefined}
                >
                  <Icon className="w-[19px] h-[19px] group-hover:scale-110 transition-transform duration-200" />
                  {showFull && <span>{item.label}</span>}
                </button>
              );
            }

            const active = isActive(item.path!);
            return (
              <Link
                key={item.path}
                to={item.path!}
                onClick={() => {
                  if (isMobileOpen) toggleMobileSidebar();
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-1 group relative overflow-hidden
                  ${
                    active
                      ? 'bg-violet-100 dark:bg-[#7c3aed]/20 text-violet-700 dark:text-[#a78bfa] shadow-sm'
                      : 'text-gray-700 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-[#25282c] hover:text-gray-900 dark:hover:text-white'
                  }
                  ${!showFull ? 'justify-center px-3' : ''}
                  active:scale-[0.98]`}
                title={!showFull ? item.label : undefined}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-violet-600 dark:bg-[#7c3aed] rounded-r-full" />
                )}
                <Icon
                  className={`w-[19px] h-[19px] transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}
                />
                {showFull && (
                  <span className="flex-1 flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full 
                        bg-violet-600 dark:bg-[#7c3aed] text-white text-[10px] font-bold
                        animate-pulse"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </span>
                )}
                {!showFull && item.badge && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full 
                    bg-violet-600 dark:bg-[#7c3aed] text-white text-[9px] font-bold border-2 border-white dark:border-[#1a1d21]
                    animate-pulse"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Spaces Section */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {currentWorkspace ? (
            <>
              {/* Section Header */}
              <div
                className={`sticky top-0 bg-white/95 dark:bg-[#1a1d21]/95 backdrop-blur-sm z-10 px-3 py-3 border-b border-gray-200/50 dark:border-[#2a2e33]/50 ${!showFull ? 'px-2' : ''}`}
              >
                {showFull ? (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-gray-500 dark:text-[#6b7280] uppercase tracking-wider">
                      Spaces
                    </span>
                    <button
                      onClick={handleCreateSpace}
                      className="p-1.5 rounded-lg 
                        hover:bg-gray-100 dark:hover:bg-[#2a2e33] 
                        text-gray-600 dark:text-[#6b7280] 
                        hover:text-gray-900 dark:hover:text-white 
                        transition-all duration-200 hover:scale-110 active:scale-95"
                      title="Create Space"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleCreateSpace}
                    className="w-full p-2.5 rounded-xl 
                      hover:bg-gray-100 dark:hover:bg-[#2a2e33] 
                      text-gray-600 dark:text-[#6b7280] 
                      hover:text-gray-900 dark:hover:text-white 
                      transition-all duration-200 flex justify-center hover:scale-110 active:scale-95"
                    title="Add Space"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Spaces List */}
              <div className="px-3 pb-3">
                {spacesLoading ? (
                  <div className="space-y-2 py-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-10 bg-gray-200 dark:bg-[#2a2e33] rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : spacesForCurrentWorkspace && spacesForCurrentWorkspace.length > 0 ? (
                  <div className="space-y-1">
                    {spacesForCurrentWorkspace.map((space) => {
                      const isSpaceExpanded = expandedSpaces.has(space.id);
                      const isHovered = hoveredSpace === space.id;
                      const spaceProjects = projectsBySpaceId[space.id] || [];

                      return (
                        <div key={space.id} className="group relative">
                          <SpaceItem
                            space={space}
                            projects={spaceProjects}
                            folders={foldersBySpaceId[space.id] || []}
                            projectsByFolderId={projectsByFolderId}
                            isSpaceExpanded={isSpaceExpanded}
                            isHovered={isHovered}
                            showFull={showFull}
                            currentSpace={currentSpace}
                            projectsLoading={projectsLoading}
                            foldersLoading={foldersLoading}
                            onToggle={toggleSpace}
                            onMouseEnter={() => setHoveredSpace(space.id)}
                            onMouseLeave={() => setHoveredSpace(null)}
                            setCurrentSpace={handleSpaceChange}
                            setCurrentProject={handleProjectChange}
                            setCurrentFolder={handleFolderChange}
                            setIsCreateProjectModalOpen={() => {}}
                            isProjectActive={isProjectActive}
                            onManageMembers={openMemberModal}
                          />

                          {/* Space Edit Button - Shows on hover */}
                          {showFull && isHovered && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSpace({
                                  id: space.id,
                                  name: space.name,
                                  color: space.color,
                                  icon: space.icon,
                                });
                              }}
                              className="absolute right-8 top-2.5 p-1 rounded-md 
                                bg-white dark:bg-[#25282c] 
                                border border-gray-200 dark:border-[#2a2e33]
                                text-gray-500 hover:text-gray-700 dark:hover:text-white
                                opacity-0 group-hover:opacity-100
                                transition-all duration-200 hover:scale-110
                                shadow-sm"
                              title="Edit Space"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-2 py-8 text-center">
                    <div
                      className="w-12 h-12 rounded-2xl 
                      bg-gradient-to-br from-violet-100 to-purple-100 dark:from-[#25282c] dark:to-[#2a2e33]
                      flex items-center justify-center mx-auto mb-3
                      group-hover:scale-110 transition-transform duration-300"
                    >
                      <Zap className="w-6 h-6 text-violet-600 dark:text-[#6b7280]" />
                    </div>
                    {showFull && (
                      <>
                        <p className="text-sm font-medium text-gray-600 dark:text-[#6b7280] mb-3">
                          No spaces yet
                        </p>
                        <button
                          onClick={handleCreateSpace}
                          className="text-sm text-violet-600 dark:text-[#7c3aed] 
                            hover:text-violet-700 dark:hover:text-[#a78bfa] 
                            font-semibold transition-colors duration-200
                            hover:underline underline-offset-2"
                        >
                          Create a space
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="px-4 py-12 text-center">
              {showFull && (
                <>
                  <div
                    className="w-16 h-16 rounded-2xl 
                    bg-gradient-to-br from-violet-100 to-purple-100 dark:from-[#25282c] dark:to-[#2a2e33]
                    flex items-center justify-center mx-auto mb-4"
                  >
                    <Zap className="w-8 h-8 text-violet-600 dark:text-[#6b7280]" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-[#6b7280] mb-4">
                    No workspace selected
                  </p>
                  <button
                    onClick={() => setIsCreateWorkspaceModalOpen(true)}
                    className="text-sm text-violet-600 dark:text-[#7c3aed] 
                      hover:text-violet-700 dark:hover:text-[#a78bfa] 
                      font-semibold transition-colors duration-200
                      hover:underline underline-offset-2"
                  >
                    Create your first workspace
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-200 dark:border-[#2a2e33] p-3">
          {[
            { icon: Users, label: 'Team', path: '/team' },
            { icon: Settings, label: 'Settings', path: '/settings' },
          ].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (isMobileOpen) toggleMobileSidebar();
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-1 group
                  ${
                    active
                      ? 'bg-gray-100 dark:bg-[#25282c] text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-[#25282c] hover:text-gray-900 dark:hover:text-white'
                  }
                  ${!showFull ? 'justify-center px-3' : ''}
                  active:scale-[0.98]`}
                title={!showFull ? item.label : undefined}
              >
                <Icon className="w-[19px] h-[19px] flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                {showFull && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* User Profile */}
        <div className="border-t border-gray-200 dark:border-[#2a2e33] p-3 relative">
          <button
            onClick={() => showFull && setShowUserMenu(!showUserMenu)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl 
              hover:bg-gray-100 dark:hover:bg-[#25282c] 
              transition-all duration-200 group
              active:scale-[0.98]
              ${!showFull ? 'justify-center' : ''}`}
          >
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 dark:from-[#7c3aed] dark:to-[#ec4899] 
              flex items-center justify-center text-white text-xs font-bold flex-shrink-0
              shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200
              ring-2 ring-white dark:ring-[#1a1d21] ring-offset-1 ring-offset-gray-100 dark:ring-offset-[#1a1d21]"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                getInitials(user?.name || 'U')
              )}
            </div>
            {showFull && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-[#6b7280] truncate">
                    {user?.email || ''}
                  </p>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-gray-400 dark:text-[#6b7280] transition-transform duration-200 
                    ${showUserMenu ? 'rotate-90' : ''}`}
                />
              </>
            )}
          </button>

          {/* User Menu */}
          {showUserMenu && showFull && (
            <div
              className="absolute bottom-full left-3 right-3 mb-2 
              bg-white dark:bg-[#25282c] 
              border border-gray-200 dark:border-[#2a2e33] 
              rounded-xl shadow-2xl overflow-hidden
              animate-in slide-in-from-bottom-2 duration-200"
            >
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
                    text-red-600 dark:text-red-400 
                    hover:bg-red-50 dark:hover:bg-red-500/10 
                    transition-all duration-200 group
                    active:scale-[0.98]"
                >
                  <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Space Management Modal */}
      <SpaceManagementModal
        isOpen={spaceModal.isOpen}
        onClose={() => setSpaceModal({ isOpen: false, mode: 'create', space: null })}
        mode={spaceModal.mode}
        space={spaceModal.space}
        onSubmit={handleSpaceSubmit}
        onDelete={spaceModal.mode === 'edit' ? handleSpaceDelete : undefined}
      />

      {/* Member Management Modal */}
      {memberModal && (
        <MemberManagementModal
          isOpen={memberModal.isOpen}
          onClose={() => setMemberModal(null)}
          entityType={memberModal.entityType}
          entityId={memberModal.entityId}
          entityName={memberModal.entityName}
          useEffectiveMembers={useEffectiveMembers}
          useSearchUsers={useSearchUsers}
          useAddMember={useAddMember}
          useUpdateMemberRole={useUpdateMemberRole}
          useRemoveMember={useRemoveMember}
        />
      )}
    </>
  );
};

export default ProjectSidebar;
