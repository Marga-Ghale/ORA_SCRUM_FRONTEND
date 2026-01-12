// src/layout/ProjectSidebar.tsx - FIXED VERSION
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Home,
  CheckSquare,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Settings,
  Users,
  LogOut,
  Zap,
  MessageSquare,
  UserPlus,
  Bell,
  Folder,
  FolderOpen,
  Hash,
  MoreHorizontal,
  Edit2,
  Trash2,
  UserCog,
  Rocket,
  Briefcase,
  Target,
  BarChart3,
  Wrench,
  Lightbulb,
  Palette,
  Smartphone,
  Star,
  FolderKanban,
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
import { useProjectContext } from '../context/ProjectContext';
import { EditSpaceModal } from '../components/modals/EditSpaceModal';
import { EditFolderModal } from '../components/modals/EditFolderModal';
import { EditProjectModal } from '../components/modals/EditProjectModal';

// ============================================================================
// CONSTANTS
// ============================================================================
const STORAGE_KEYS = {
  WORKSPACE: 'selectedWorkspaceId',
  SPACE: 'selectedSpaceId',
  PROJECT: 'selectedProjectId',
  FOLDER: 'selectedFolderId',
} as const;

// Icon mapping for spaces
const SPACE_ICONS: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  folder: FolderKanban,
  rocket: Rocket,
  briefcase: Briefcase,
  target: Target,
  chart: BarChart3,
  wrench: Wrench,
  lightbulb: Lightbulb,
  palette: Palette,
  smartphone: Smartphone,
  star: Star,
};

// ============================================================================
// PORTAL DROPDOWN COMPONENT
// ============================================================================
interface SpaceAddMenuProps {
  isOpen: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onCreateFolder: () => void;
  onCreateProject: () => void;
}

const SpaceAddMenu: React.FC<SpaceAddMenuProps> = ({
  isOpen,
  anchorEl,
  onClose,
  onCreateFolder,
  onCreateProject,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  const menuWidth = 160;
  const menuHeight = 88;

  let top = rect.bottom + 4;
  let left = rect.left;

  if (left + menuWidth > window.innerWidth - 8) {
    left = window.innerWidth - menuWidth - 8;
  }

  if (top + menuHeight > window.innerHeight - 8) {
    top = rect.top - menuHeight - 4;
  }

  return createPortal(
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1 animate-in fade-in zoom-in-95 duration-150"
      style={{
        top,
        left,
        width: menuWidth,
        zIndex: 999999,
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCreateFolder();
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Folder className="w-4 h-4 text-amber-500" />
        <span>New Folder</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCreateProject();
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Hash className="w-4 h-4 text-violet-500" />
        <span>New Project</span>
      </button>
    </div>,
    document.body
  );
};

// ============================================================================
// CONTEXT MENU COMPONENT
// ============================================================================
interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onManageMembers?: () => void;
  entityType: 'space' | 'folder' | 'project';
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onEdit,
  onDelete,
  onManageMembers,
  entityType,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 160);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed min-w-[180px] py-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150"
      style={{ top: adjustedY, left: adjustedX, zIndex: 999999 }}
    >
      <button
        onClick={() => {
          onEdit();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Edit2 className="w-4 h-4" />
        <span>Edit {entityType}</span>
      </button>

      {onManageMembers && (
        <button
          onClick={() => {
            onManageMembers();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <UserCog className="w-4 h-4" />
          <span>Manage members</span>
        </button>
      )}

      <div className="my-1 mx-3 border-t border-gray-200 dark:border-gray-700" />

      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete {entityType}</span>
      </button>
    </div>,
    document.body
  );
};

// ============================================================================
// HELPER FUNCTION
// ============================================================================
const getSpaceIcon = (
  iconKey?: string
): React.FC<{ className?: string; style?: React.CSSProperties }> => {
  if (!iconKey) return FolderKanban;
  return SPACE_ICONS[iconKey] || FolderKanban;
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
    currentProject,
    setCurrentWorkspace,
    setCurrentSpace,
    setCurrentProject,
    setCurrentFolder,
    isInitializing,
    setManagementEntity,
    createSpace,
    updateSpace,
    deleteSpace,
    createFolder,
    updateFolder,
    deleteFolder,
    updateProject,
    deleteProject,
    isCreateSpaceModalOpen,
    setIsCreateSpaceModalOpen,
    isCreateFolderModalOpen,
    setIsCreateFolderModalOpen,
    isCreateProjectModalOpen,
    setIsCreateProjectModalOpen,
    // ✅ FIX: Use global creationContext instead of local state
    setCreationContext,
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
  const { data: allProjects } = useAccessibleProjects({
    enabled: !!user,
  });
  const { data: allFolders } = useAccessibleFolders({
    enabled: !!user,
  });

  const { data: notificationData } = useNotificationCount({ enabled: !!user });
  const { data: chatUnreadData } = useUnreadCounts({ enabled: !!user });

  const [spaceAddMenu, setSpaceAddMenu] = useState<{
    spaceId: string;
    anchorEl: HTMLElement | null;
  } | null>(null);

  const addButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // ============================================================================
  // LOCAL STATE
  // ============================================================================
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [hasInitializedFromStorage, setHasInitializedFromStorage] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    entityType: 'space' | 'folder' | 'project';
    entity: any;
  } | null>(null);

  const [editSpaceModal, setEditSpaceModal] = useState<{ isOpen: boolean; space: any }>({
    isOpen: false,
    space: null,
  });
  const [editFolderModal, setEditFolderModal] = useState<{ isOpen: boolean; folder: any }>({
    isOpen: false,
    folder: null,
  });
  const [editProjectModal, setEditProjectModal] = useState<{ isOpen: boolean; project: any }>({
    isOpen: false,
    project: null,
  });

  const [memberModal, setMemberModal] = useState<{
    isOpen: boolean;
    entityType: 'workspace' | 'space' | 'folder' | 'project';
    entityId: string;
    entityName: string;
  } | null>(null);

  // ✅ REMOVED: Local createModalContext state - now using global creationContext

  const showFull = isExpanded || isHovered || isMobileOpen;

  // ============================================================================
  // MEMOIZED DATA
  // ============================================================================
  const spacesForCurrentWorkspace = useMemo(() => {
    if (!currentWorkspace || !allSpaces) return [];
    return allSpaces.filter((space) => space.workspaceId === currentWorkspace.id);
  }, [allSpaces, currentWorkspace]);

  const foldersBySpaceId = useMemo(() => {
    if (!allFolders) return {};
    return allFolders.reduce(
      (map, folder) => {
        const spaceId = folder.spaceId;
        if (!map[spaceId]) map[spaceId] = [];
        map[spaceId].push(folder);
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
          if (!map[project.folderId]) map[project.folderId] = [];
          map[project.folderId].push(project);
        }
        return map;
      },
      {} as Record<string, typeof allProjects>
    );
  }, [allProjects]);

  const projectsBySpaceId = useMemo(() => {
    if (!allProjects) return {};
    return allProjects.reduce(
      (map, project) => {
        if (!project.folderId && project.spaceId) {
          if (!map[project.spaceId]) map[project.spaceId] = [];
          map[project.spaceId].push(project);
        }
        return map;
      },
      {} as Record<string, typeof allProjects>
    );
  }, [allProjects]);

  // ============================================================================
  // STATE PERSISTENCE EFFECTS
  // ============================================================================
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

  useEffect(() => {
    if (!allSpaces || allSpaces.length === 0 || !currentWorkspace) return;
    if (currentSpace) return;

    const savedSpaceId = localStorage.getItem(STORAGE_KEYS.SPACE);
    if (savedSpaceId) {
      const savedSpace = allSpaces.find(
        (s) => s.id === savedSpaceId && s.workspaceId === currentWorkspace.id
      );
      if (savedSpace) setCurrentSpace(savedSpace as any);
    }
  }, [allSpaces, currentSpace, currentWorkspace, setCurrentSpace]);

  useEffect(() => {
    if (!allFolders || allFolders.length === 0 || !currentSpace) return;
    if (currentFolder) return;

    const savedFolderId = localStorage.getItem(STORAGE_KEYS.FOLDER);
    if (savedFolderId && setCurrentFolder) {
      const savedFolder = allFolders.find(
        (f) => f.id === savedFolderId && f.spaceId === currentSpace.id
      );
      if (savedFolder) setCurrentFolder(savedFolder as any);
    }
  }, [allFolders, currentFolder, currentSpace, setCurrentFolder]);

  // Auto-expand current space/folder
  useEffect(() => {
    if (currentSpace) setExpandedSpaces((prev) => new Set([...prev, currentSpace.id]));
  }, [currentSpace]);

  useEffect(() => {
    if (currentFolder) setExpandedFolders((prev) => new Set([...prev, currentFolder.id]));
  }, [currentFolder]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const closeMobileSidebar = () => {
    if (isMobileOpen) toggleMobileSidebar();
  };

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

  const handleSpaceClick = (space: any) => {
    setCurrentSpace(space);
    localStorage.setItem(STORAGE_KEYS.SPACE, space.id);
    toggleSpace(space.id);
  };

  const handleFolderClick = (folder: any) => {
    setCurrentFolder(folder);
    localStorage.setItem(STORAGE_KEYS.FOLDER, folder.id);
    toggleFolder(folder.id);
  };

  const handleProjectClick = (project: any) => {
    setCurrentProject(project);
    localStorage.setItem(STORAGE_KEYS.PROJECT, project.id);
    navigate(`/project/${project.id}/board`);
    closeMobileSidebar();
  };

  const toggleSpace = (spaceId: string) => {
    setExpandedSpaces((prev) => {
      const next = new Set(prev);
      if (next.has(spaceId)) next.delete(spaceId);
      else next.add(spaceId);
      return next;
    });
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isProjectActive = (projectId: string) =>
    location.pathname.includes(`/project/${projectId}`);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.WORKSPACE);
    localStorage.removeItem(STORAGE_KEYS.SPACE);
    localStorage.removeItem(STORAGE_KEYS.FOLDER);
    localStorage.removeItem(STORAGE_KEYS.PROJECT);
    logout();
    navigate('/signin');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const totalChatUnread = chatUnreadData
    ? Object.values(chatUnreadData).reduce((sum, count) => sum + count, 0)
    : 0;
  const unreadNotifications = notificationData?.unread || 0;

  // ============================================================================
  // SPACE ADD MENU HANDLERS - ✅ FIXED: Using global setCreationContext
  // ============================================================================
  const handleOpenSpaceAddMenu = (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    const buttonEl = addButtonRefs.current[spaceId];
    if (spaceAddMenu?.spaceId === spaceId) {
      setSpaceAddMenu(null);
    } else {
      setSpaceAddMenu({ spaceId, anchorEl: buttonEl });
    }
  };

  const handleCreateFolderFromMenu = (spaceId: string, spaceName?: string) => {
    const space = allSpaces?.find((s) => s.id === spaceId);
    if (space) {
      setCurrentSpace(space as any);
    }
    // ✅ FIX: Use global setCreationContext
    setCreationContext({
      spaceId,
      spaceName: spaceName || space?.name || null,
      folderId: null,
      folderName: null,
    });
    setSpaceAddMenu(null);
    setTimeout(() => {
      setIsCreateFolderModalOpen(true);
    }, 0);
  };

  const handleCreateProjectFromMenu = (spaceId: string, spaceName?: string) => {
    const space = allSpaces?.find((s) => s.id === spaceId);
    if (space) {
      setCurrentSpace(space as any);
    }
    setCurrentFolder(null);
    // ✅ FIX: Use global setCreationContext
    setCreationContext({
      spaceId,
      spaceName: spaceName || space?.name || null,
      folderId: null,
      folderName: null,
    });
    setSpaceAddMenu(null);
    setTimeout(() => {
      setIsCreateProjectModalOpen(true);
    }, 0);
  };

  const handleCreateProjectFromFolder = (
    folderId: string,
    spaceId: string,
    folderName?: string
  ) => {
    const folder = allFolders?.find((f) => f.id === folderId);
    if (folder) {
      setCurrentFolder(folder as any);
    }
    // ✅ FIX: Use global setCreationContext
    setCreationContext({
      spaceId,
      spaceName: null,
      folderId,
      folderName: folderName || folder?.name || null,
    });
    setTimeout(() => {
      setIsCreateProjectModalOpen(true);
    }, 0);
  };

  // ============================================================================
  // CONTEXT MENU HANDLERS
  // ============================================================================
  const openContextMenu = (
    e: React.MouseEvent,
    entityType: 'space' | 'folder' | 'project',
    entity: any
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      entityType,
      entity,
    });
  };

  const handleContextMenuEdit = () => {
    if (!contextMenu) return;
    if (contextMenu.entityType === 'space') {
      setEditSpaceModal({ isOpen: true, space: contextMenu.entity });
    } else if (contextMenu.entityType === 'folder') {
      setEditFolderModal({ isOpen: true, folder: contextMenu.entity });
    } else if (contextMenu.entityType === 'project') {
      setEditProjectModal({ isOpen: true, project: contextMenu.entity });
    }
  };

  const handleContextMenuDelete = () => {
    if (!contextMenu) return;
    if (contextMenu.entityType === 'space') {
      setEditSpaceModal({ isOpen: true, space: contextMenu.entity });
    } else if (contextMenu.entityType === 'folder') {
      setEditFolderModal({ isOpen: true, folder: contextMenu.entity });
    } else if (contextMenu.entityType === 'project') {
      setEditProjectModal({ isOpen: true, project: contextMenu.entity });
    }
  };

  const handleContextMenuMembers = () => {
    if (!contextMenu) return;
    setMemberModal({
      isOpen: true,
      entityType: contextMenu.entityType,
      entityId: contextMenu.entity.id,
      entityName: contextMenu.entity.name,
    });
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (isInitializing || workspacesLoading) {
    return (
      <aside
        className={`fixed mt-16 lg:mt-0 top-0 left-0 h-screen z-50 
          bg-white dark:bg-gray-900 
          border-r border-gray-200 dark:border-gray-800 
          transition-all duration-300 ease-in-out
          ${showFull ? 'w-[280px]' : 'w-[72px]'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0
          shadow-lg lg:shadow-none`}
      >
        <div className="p-4 animate-pulse">
          <div className="flex items-center gap-3 p-2.5">
            <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-800" />
            {showFull && <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-lg flex-1" />}
          </div>
        </div>
        <div className="px-3 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
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
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed mt-16 lg:mt-0 top-0 left-0 h-screen z-50 flex flex-col
          bg-white dark:bg-gray-900 
          border-r border-gray-200 dark:border-gray-800 
          transition-all duration-300 ease-in-out
          ${showFull ? 'w-[280px]' : 'w-[72px]'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          shadow-xl lg:shadow-none`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Workspace Selector */}
        <div className="flex-shrink-0">
          <WorkspaceSelector
            currentWorkspace={currentWorkspace}
            onWorkspaceChange={handleWorkspaceChange}
            onCreateNew={() => setIsCreateWorkspaceModalOpen(true)}
            showFull={showFull}
          />
        </div>

        {/* Workspace Actions */}
        {currentWorkspace && showFull && (
          <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMemberModal({
                    isOpen: true,
                    entityType: 'workspace',
                    entityId: currentWorkspace.id,
                    entityName: currentWorkspace.name,
                  });
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
                  text-gray-600 dark:text-gray-400 
                  bg-gray-100 dark:bg-gray-800 
                  hover:bg-gray-200 dark:hover:bg-gray-700 
                  hover:text-gray-900 dark:hover:text-white 
                  transition-all active:scale-[0.98]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
              <button
                onClick={() => {
                  setManagementEntity({
                    entityType: 'workspace',
                    entityId: currentWorkspace.id,
                    entityName: currentWorkspace.name,
                  });
                  navigate(`/member-management/workspace/${currentWorkspace.id}`);
                  closeMobileSidebar();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
                  text-gray-600 dark:text-gray-400 
                  bg-gray-100 dark:bg-gray-800 
                  hover:bg-gray-200 dark:hover:bg-gray-700 
                  hover:text-gray-900 dark:hover:text-white 
                  transition-all active:scale-[0.98]"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Manage</span>
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className={`flex-shrink-0 p-3 ${!showFull ? 'px-2' : ''}`}>
          {showFull ? (
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium transition-all group">
              <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Search</span>
              <kbd className="ml-auto text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 font-mono">
                ⌘K
              </kbd>
            </button>
          ) : (
            <button className="w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all flex justify-center group">
              <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-shrink-0 px-3 py-2 border-b border-gray-200 dark:border-gray-800">
          {[
            { icon: Home, label: 'Home', path: '/' },
            {
              icon: Bell,
              label: 'Notifications',
              path: '/notifications',
              badge: unreadNotifications,
            },
            { icon: MessageSquare, label: 'Chat', path: '/chat', badge: totalChatUnread },
            { icon: CheckSquare, label: 'My Tasks', path: '/my-tasks' },
          ].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const badge = item.badge && item.badge > 0 ? item.badge : null;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 group relative
                  ${
                    active
                      ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                  ${!showFull ? 'justify-center' : ''}`}
                title={!showFull ? item.label : undefined}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-600 dark:bg-violet-400 rounded-r-full" />
                )}
                <Icon
                  className={`w-5 h-5 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}
                />
                {showFull && (
                  <span className="flex-1 flex items-center justify-between">
                    <span>{item.label}</span>
                    {badge && (
                      <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-violet-600 dark:bg-violet-500 text-white text-[10px] font-bold">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </span>
                )}
                {!showFull && badge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-violet-600 dark:bg-violet-500 text-white text-[9px] font-bold border-2 border-white dark:border-gray-900">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Spaces Section */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {currentWorkspace ? (
            <>
              {/* Spaces Header */}
              <div
                className={`sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 px-3 py-3 border-b border-gray-100 dark:border-gray-800/50 ${!showFull ? 'px-2' : ''}`}
              >
                {showFull ? (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Spaces
                    </span>
                    <button
                      onClick={() => setIsCreateSpaceModalOpen(true)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-all hover:scale-110 active:scale-95"
                      title="Create Space"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreateSpaceModalOpen(true)}
                    className="w-full p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-all flex justify-center hover:scale-110 active:scale-95"
                    title="Add Space"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Spaces List */}
              <div className="px-2 py-2">
                {spacesLoading ? (
                  <div className="space-y-2 p-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : spacesForCurrentWorkspace.length > 0 ? (
                  <div className="space-y-0.5">
                    {spacesForCurrentWorkspace.map((space) => {
                      const isSpaceExpanded = expandedSpaces.has(space.id);
                      const isSpaceActive = currentSpace?.id === space.id;
                      const spaceFolders = foldersBySpaceId[space.id] || [];
                      const spaceDirectProjects = projectsBySpaceId[space.id] || [];
                      const SpaceIcon = getSpaceIcon(space.icon);

                      return (
                        <div key={space.id}>
                          {/* Space Item */}
                          <div
                            className={`group flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer transition-all
                              ${
                                isSpaceActive
                                  ? 'bg-violet-50 dark:bg-violet-500/10'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            onClick={() => handleSpaceClick(space)}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSpace(space.id);
                              }}
                              className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                              {isSpaceExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              )}
                            </button>

                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: (space.color || '#6366f1') + '20' }}
                            >
                              <SpaceIcon
                                className="w-3.5 h-3.5"
                                style={{ color: space.color || '#6366f1' }}
                              />
                            </div>

                            {showFull && (
                              <>
                                <span
                                  className={`flex-1 text-sm font-medium truncate ${
                                    isSpaceActive
                                      ? 'text-violet-700 dark:text-violet-300'
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  {space.name}
                                </span>

                                <button
                                  onClick={(e) => openContextMenu(e, 'space', space)}
                                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-white transition-all"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                <button
                                  ref={(el) => {
                                    addButtonRefs.current[space.id] = el;
                                  }}
                                  onClick={(e) => handleOpenSpaceAddMenu(e, space.id)}
                                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-white transition-all"
                                  title="Add to space"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Space Contents */}
                          {isSpaceExpanded && showFull && (
                            <div className="ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-800 mt-1 space-y-0.5">
                              {/* Folders */}
                              {spaceFolders.map((folder) => {
                                const isFolderExpanded = expandedFolders.has(folder.id);
                                const isFolderActive = currentFolder?.id === folder.id;
                                const folderProjects = projectsByFolderId[folder.id] || [];

                                return (
                                  <div key={folder.id}>
                                    <div
                                      className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all
                                        ${
                                          isFolderActive
                                            ? 'bg-violet-50 dark:bg-violet-500/10'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                      onClick={() => handleFolderClick(folder)}
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFolder(folder.id);
                                        }}
                                        className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                      >
                                        {isFolderExpanded ? (
                                          <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                        )}
                                      </button>

                                      {isFolderExpanded ? (
                                        <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                      ) : (
                                        <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                      )}

                                      <span
                                        className={`flex-1 text-sm truncate ${
                                          isFolderActive
                                            ? 'text-violet-700 dark:text-violet-300 font-medium'
                                            : 'text-gray-600 dark:text-gray-400'
                                        }`}
                                      >
                                        {folder.name}
                                      </span>

                                      <button
                                        onClick={(e) => openContextMenu(e, 'folder', folder)}
                                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all"
                                      >
                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCreateProjectFromFolder(
                                            folder.id,
                                            space.id,
                                            folder.name
                                          );
                                        }}
                                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all"
                                        title="Add project"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Folder Projects */}
                                    {isFolderExpanded && folderProjects.length > 0 && (
                                      <div className="ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-800 mt-1 space-y-0.5">
                                        {folderProjects.map((project) => {
                                          const isProjectItemActive = isProjectActive(project.id);

                                          return (
                                            <div
                                              key={project.id}
                                              className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all
                                                ${
                                                  isProjectItemActive
                                                    ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                }`}
                                              onClick={() => handleProjectClick(project)}
                                            >
                                              <Hash className="w-4 h-4 flex-shrink-0" />
                                              <span className="flex-1 text-sm truncate">
                                                {project.name}
                                              </span>
                                              <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100">
                                                {project.key}
                                              </span>
                                              <button
                                                onClick={(e) =>
                                                  openContextMenu(e, 'project', project)
                                                }
                                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all"
                                              >
                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Direct Space Projects (no folder) */}
                              {spaceDirectProjects.map((project) => {
                                const isProjectItemActive = isProjectActive(project.id);

                                return (
                                  <div
                                    key={project.id}
                                    className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all
                                      ${
                                        isProjectItemActive
                                          ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
                                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                      }`}
                                    onClick={() => handleProjectClick(project)}
                                  >
                                    <Hash className="w-4 h-4 flex-shrink-0" />
                                    <span className="flex-1 text-sm truncate">{project.name}</span>
                                    <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100">
                                      {project.key}
                                    </span>
                                    <button
                                      onClick={(e) => openContextMenu(e, 'project', project)}
                                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all"
                                    >
                                      <MoreHorizontal className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}

                              {/* Empty State */}
                              {spaceFolders.length === 0 && spaceDirectProjects.length === 0 && (
                                <div className="px-2 py-4 text-center">
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                                    No content yet
                                  </p>
                                  <button
                                    onClick={() => handleCreateFolderFromMenu(space.id, space.name)}
                                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                                  >
                                    Add a folder
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6 text-violet-600 dark:text-gray-400" />
                    </div>
                    {showFull && (
                      <>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                          No spaces yet
                        </p>
                        <button
                          onClick={() => setIsCreateSpaceModalOpen(true)}
                          className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold hover:underline"
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
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-violet-600 dark:text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                    No workspace selected
                  </p>
                  <button
                    onClick={() => setIsCreateWorkspaceModalOpen(true)}
                    className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold hover:underline"
                  >
                    Create workspace
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 p-3">
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
                onClick={closeMobileSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 group
                  ${
                    active
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                  ${!showFull ? 'justify-center' : ''}`}
                title={!showFull ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                {showFull && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* User Profile */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 p-3 relative">
          <button
            onClick={() => showFull && setShowUserMenu(!showUserMenu)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group active:scale-[0.98] ${!showFull ? 'justify-center' : ''}`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all ring-2 ring-white dark:ring-gray-900">
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || ''}
                  </p>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-90' : ''}`}
                />
              </>
            )}
          </button>

          {/* User Menu */}
          {showUserMenu && showFull && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group active:scale-[0.98]"
                >
                  <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Portal-based Space Add Menu */}
      <SpaceAddMenu
        isOpen={!!spaceAddMenu}
        anchorEl={spaceAddMenu?.anchorEl || null}
        onClose={() => setSpaceAddMenu(null)}
        onCreateFolder={() => {
          if (spaceAddMenu) {
            const space = allSpaces?.find((s) => s.id === spaceAddMenu.spaceId);
            handleCreateFolderFromMenu(spaceAddMenu.spaceId, space?.name);
          }
        }}
        onCreateProject={() => {
          if (spaceAddMenu) {
            const space = allSpaces?.find((s) => s.id === spaceAddMenu.spaceId);
            handleCreateProjectFromMenu(spaceAddMenu.spaceId, space?.name);
          }
        }}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onEdit={handleContextMenuEdit}
          onDelete={handleContextMenuDelete}
          onManageMembers={
            contextMenu.entityType !== 'project' ? handleContextMenuMembers : undefined
          }
          entityType={contextMenu.entityType}
        />
      )}

      {/* Edit Modals */}
      <EditSpaceModal
        isOpen={editSpaceModal.isOpen}
        onClose={() => setEditSpaceModal({ isOpen: false, space: null })}
        space={editSpaceModal.space}
        onUpdate={updateSpace}
        onDelete={deleteSpace}
      />

      <EditFolderModal
        isOpen={editFolderModal.isOpen}
        onClose={() => setEditFolderModal({ isOpen: false, folder: null })}
        folder={editFolderModal.folder}
        onUpdate={updateFolder}
        onDelete={deleteFolder}
      />

      <EditProjectModal
        isOpen={editProjectModal.isOpen}
        onClose={() => setEditProjectModal({ isOpen: false, project: null })}
        project={editProjectModal.project}
        onUpdate={updateProject}
        onDelete={deleteProject}
      />

      {/* ✅ REMOVED: CreateSpaceModal, CreateFolderModal, CreateProjectModal 
          These are now rendered ONLY in GlobalModals.tsx to avoid duplication */}

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
