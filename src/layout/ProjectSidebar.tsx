// src/layout/ProjectSidebar.tsx - UPDATED VERSION
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronUp,
  DotIcon,
  Lock,
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../components/UserProfile/AuthContext';
import { useNotificationCount } from '../hooks/api/useNotifications';
import { useChannels, useUnreadCounts } from '../hooks/api/useChat';
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
  useVisibleSpaces, // ✅ ADDED
} from '../hooks/api/useAccessibleEntities';
import { useProjectContext } from '../context/ProjectContext';
import { EditSpaceModal } from '../components/modals/EditSpaceModal';
import { EditFolderModal } from '../components/modals/EditFolderModal';
import { EditProjectModal } from '../components/modals/EditProjectModal';
import { useWebSocket } from '../hooks/api/useWebsocket';
import { ChatIcon } from '../icons';
import toast from 'react-hot-toast';

const STORAGE_KEYS = {
  WORKSPACE: 'selectedWorkspaceId',
  SPACE: 'selectedSpaceId',
  PROJECT: 'selectedProjectId',
  FOLDER: 'selectedFolderId',
} as const;

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

  useWebSocket({
    onMessage: (message) => {
      if (message.type === 'chat_message') {
        console.log('[Sidebar] Chat message received, unread counts will update');
      }
    },
  });

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
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Folder className="w-3.5 h-3.5 text-amber-500" />
        <span>New Folder</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCreateProject();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Hash className="w-3.5 h-3.5 text-violet-500" />
        <span>New Project</span>
      </button>
    </div>,
    document.body
  );
};

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
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Edit2 className="w-3.5 h-3.5" />
        <span>Edit {entityType}</span>
      </button>

      {onManageMembers && (
        <button
          onClick={() => {
            onManageMembers();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <UserCog className="w-3.5 h-3.5" />
          <span>Manage members</span>
        </button>
      )}

      <div className="my-1 mx-3 border-t border-gray-200 dark:border-gray-700" />

      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete {entityType}</span>
      </button>
    </div>,
    document.body
  );
};

const getSpaceIcon = (
  iconKey?: string
): React.FC<{ className?: string; style?: React.CSSProperties }> => {
  if (!iconKey) return FolderKanban;
  return SPACE_ICONS[iconKey] || FolderKanban;
};

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
    setCreationContext,
  } = useProjectContext();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { isConnected, joinRoom, leaveRoom } = useWebSocket();

  useEffect(() => {
    if (!currentWorkspace?.id || !isConnected) return;

    const workspaceRoom = `workspace:${currentWorkspace.id}`;
    console.log('[Sidebar] 🔌 Joining workspace room:', workspaceRoom);
    joinRoom(workspaceRoom);

    return () => {
      console.log('[Sidebar] 👋 Leaving workspace room:', workspaceRoom);
      leaveRoom(workspaceRoom);
    };
  }, [currentWorkspace?.id, isConnected, joinRoom, leaveRoom]);

  const { data: workspaces, isLoading: workspacesLoading } = useAccessibleWorkspaces({
    enabled: !!user,
  });

  // ✅ UPDATED: Fetch both accessible and visible spaces
  const { data: accessibleSpaces, isLoading: spacesLoading } = useAccessibleSpaces({
    enabled: !!user,
  });
  const { data: visibleSpaces } = useVisibleSpaces({
    enabled: !!user,
  });

  const allSpaces = useMemo(() => {
    if (!visibleSpaces) return accessibleSpaces || [];
    if (!accessibleSpaces) return visibleSpaces || [];

    // Create a Set of accessible space IDs for fast lookup
    const accessibleSpaceIds = new Set(accessibleSpaces.map((s) => s.id));

    // Return all visible spaces with access flag
    return visibleSpaces.map((space) => ({
      ...space,
      hasAccess: accessibleSpaceIds.has(space.id),
    }));
  }, [accessibleSpaces, visibleSpaces]);

  const { data: allProjects } = useAccessibleProjects({
    enabled: !!user,
  });
  const { data: allFolders } = useAccessibleFolders({
    enabled: !!user,
  });

  const { data: notificationData } = useNotificationCount({ enabled: !!user });
  const { data: channels = [] } = useChannels({ enabled: !!user });

  const { data: chatUnreadData = {} } = useUnreadCounts({ enabled: !!user });

  const [spaceAddMenu, setSpaceAddMenu] = useState<{
    spaceId: string;
    anchorEl: HTMLElement | null;
  } | null>(null);

  const addButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [hasInitializedFromStorage, setHasInitializedFromStorage] = useState(false);

  const [isNavMinimized, setIsNavMinimized] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

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

  const showFull = isExpanded || isHovered || isMobileOpen;

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

  useEffect(() => {
    if (currentSpace) setExpandedSpaces((prev) => new Set([...prev, currentSpace.id]));
  }, [currentSpace]);

  useEffect(() => {
    if (currentFolder) setExpandedFolders((prev) => new Set([...prev, currentFolder.id]));
  }, [currentFolder]);

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

  // ✅ UPDATED: Check access before allowing space click
  const handleSpaceClick = (space: any) => {
    // ✅ FIXED: Check if user has content access
    const canAccessContent = accessibleSpaces?.some((s) => s.id === space.id) ?? false;

    if (!canAccessContent) {
      toast.error(
        '🔒 You can see this space but need to be added as a member to access its content. Contact an admin to request access.'
      );
      return;
    }

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

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleMobileSidebar}
        />
      )}

      <aside
        className={`fixed mt-16 lg:mt-0 top-0 left-0 h-screen z-50 flex flex-col
    bg-gradient-to-b from-white via-white to-gray-50/80 
    dark:from-gray-900 dark:via-gray-900 dark:to-gray-950/90
    border-r border-gray-200/80 dark:border-gray-800/60
    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
    ${showFull ? 'w-[280px]' : 'w-[72px]'}
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0
    shadow-2xl shadow-gray-200/50 dark:shadow-black/30 lg:shadow-xl lg:shadow-gray-200/30 dark:lg:shadow-black/20`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex-shrink-0">
          <WorkspaceSelector
            currentWorkspace={currentWorkspace}
            onWorkspaceChange={handleWorkspaceChange}
            onCreateNew={() => setIsCreateWorkspaceModalOpen(true)}
            showFull={showFull}
          />
        </div>

        {currentWorkspace && showFull && (
          <div className="flex-shrink-0 px-3 py-2.5 border-b border-gray-100 dark:border-gray-800/60">
            <div className="flex items-center gap-1.5">
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
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-semibold
            text-gray-600 dark:text-gray-300 
            bg-gray-100/80 dark:bg-gray-800/60 
            hover:bg-violet-100 dark:hover:bg-violet-900/30 
            hover:text-violet-700 dark:hover:text-violet-300 
            border border-transparent hover:border-violet-200 dark:hover:border-violet-800/50
            transition-all duration-200 ease-out
            active:scale-[0.97] hover:shadow-sm"
              >
                <UserPlus className="w-3 h-3" />
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
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-semibold
            text-gray-600 dark:text-gray-300 
            bg-gray-100/80 dark:bg-gray-800/60 
            hover:bg-violet-100 dark:hover:bg-violet-900/30 
            hover:text-violet-700 dark:hover:text-violet-300 
            border border-transparent hover:border-violet-200 dark:hover:border-violet-800/50
            transition-all duration-200 ease-out
            active:scale-[0.97] hover:shadow-sm"
              >
                <Users className="w-3 h-3" />
                <span>Manage</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex-shrink-0 px-2.5 py-2 border-b border-gray-100 dark:border-gray-800/60">
          <button
            onClick={() => setIsNavMinimized(!isNavMinimized)}
            className="w-full flex items-center justify-between px-2.5 py-2 mb-1.5 rounded-lg
      bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30
      hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-800/60
      border border-gray-200/60 dark:border-gray-700/40
      transition-all duration-300 group
      hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-black/20"
          >
            {showFull ? (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-md bg-violet-100 dark:bg-violet-900/30 
            flex items-center justify-center
            group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50
            transition-all duration-300"
                  >
                    <Home className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                    Quick Navigation
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isNavMinimized && totalChatUnread + unreadNotifications > 0 && (
                    <span
                      className="min-w-[18px] h-4 px-1 flex items-center justify-center rounded-full 
              bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 
              text-white text-[9px] font-bold
              animate-in zoom-in duration-200"
                    >
                      {totalChatUnread + unreadNotifications > 99
                        ? '99+'
                        : totalChatUnread + unreadNotifications}
                    </span>
                  )}
                  <div className="p-0.5 rounded-md bg-white/50 dark:bg-gray-900/50">
                    {isNavMinimized ? (
                      <ChevronDown
                        className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 
                transition-transform duration-300 group-hover:text-violet-600 dark:group-hover:text-violet-400"
                      />
                    ) : (
                      <ChevronUp
                        className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400
                transition-transform duration-300 group-hover:text-violet-600 dark:group-hover:text-violet-400"
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full flex justify-center">
                <div
                  className="w-5 h-5 rounded-md bg-violet-100 dark:bg-violet-900/30 
          flex items-center justify-center"
                >
                  <Home className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
            )}
          </button>

          <div
            className="overflow-hidden transition-all duration-500 ease-in-out"
            style={{
              maxHeight: isNavMinimized ? '0px' : '400px',
              opacity: isNavMinimized ? 0 : 1,
              transform: isNavMinimized ? 'translateY(-8px)' : 'translateY(0)',
            }}
          >
            <nav className="space-y-0.5">
              {[
                { icon: Home, label: 'Home', path: '/' },
                { icon: ChatIcon, label: 'Chat', path: '/chat' },
                {
                  icon: Bell,
                  label: 'Notifications',
                  path: '/notifications',
                  badge: unreadNotifications,
                },
                { icon: CheckSquare, label: 'My Tasks', path: '/my-tasks' },
              ].map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const badge = item.badge && item.badge > 0 ? item.badge : null;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileSidebar}
                    style={{
                      animationDelay: `${index * 40}ms`,
                      transitionDelay: `${index * 30}ms`,
                    }}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium 
              transition-all duration-200 ease-out group relative
              ${
                active
                  ? 'bg-gradient-to-r from-violet-100 to-purple-50 dark:from-violet-500/20 dark:to-purple-500/10 text-violet-700 dark:text-violet-300 shadow-sm shadow-violet-200/50 dark:shadow-violet-900/30'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50/50 dark:hover:from-violet-500/10 dark:hover:to-purple-500/5 hover:text-violet-700 dark:hover:text-violet-300'
              }
              hover:shadow-sm hover:shadow-violet-100 dark:hover:shadow-violet-900/20
              hover:translate-x-0.5
              ${!showFull ? 'justify-center' : ''}`}
                    title={!showFull ? item.label : undefined}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 
                  bg-gradient-to-b from-violet-500 to-purple-600 
                  dark:from-violet-400 dark:to-purple-500 
                  rounded-r-full shadow-lg shadow-violet-500/30"
                      />
                    )}
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center
              ${
                active
                  ? 'bg-violet-100 dark:bg-violet-900/30'
                  : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30'
              }
              transition-all duration-200
              group-hover:scale-110 group-hover:shadow-md group-hover:shadow-violet-200/30`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 transition-all duration-200 
                  ${
                    active
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400'
                  }`}
                      />
                    </div>
                    {showFull && (
                      <span className="flex-1 flex items-center justify-between">
                        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                          {item.label}
                        </span>
                        {badge && (
                          <span
                            className="min-w-[20px] h-4.5 px-1.5 flex items-center justify-center rounded-full 
                      bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 
                      text-white text-[9px] font-bold shadow-md shadow-violet-500/30
                      group-hover:shadow-lg group-hover:shadow-violet-500/40
                      group-hover:scale-110
                      transition-all duration-200"
                          >
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                      </span>
                    )}
                    {!showFull && badge && (
                      <span
                        className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 flex items-center justify-center rounded-full 
                  bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 
                  text-white text-[8px] font-bold 
                  border-2 border-white dark:border-gray-900
                  shadow-lg shadow-violet-500/40"
                      >
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* CHAT SECTION */}
        <div className="flex-shrink-0 px-2.5 py-2 border-b border-gray-100 dark:border-gray-800/60">
          <button
            onClick={() => setIsChatMinimized(!isChatMinimized)}
            className="w-full flex items-center justify-between px-2.5 py-2 mb-1.5 rounded-lg
      bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30
      hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-800/60
      border border-gray-200/60 dark:border-gray-700/40
      transition-all duration-300 group
      hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-black/20"
          >
            {showFull ? (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/30 
            flex items-center justify-center
            group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50
            transition-all duration-300"
                  >
                    <MessageSquare className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                    Messages
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isChatMinimized && totalChatUnread > 0 && (
                    <span
                      className="min-w-[18px] h-4 px-1 flex items-center justify-center rounded-full 
              bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 
              text-white text-[9px] font-bold
              animate-in zoom-in duration-200"
                    >
                      {totalChatUnread > 99 ? '99+' : totalChatUnread}
                    </span>
                  )}
                  <div className="p-0.5 rounded-md bg-white/50 dark:bg-gray-900/50">
                    {isChatMinimized ? (
                      <ChevronDown
                        className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 
                transition-transform duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                      />
                    ) : (
                      <ChevronUp
                        className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400
                transition-transform duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full flex justify-center relative">
                <div
                  className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/30 
          flex items-center justify-center"
                >
                  <MessageSquare className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                </div>
                {totalChatUnread > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center rounded-full 
            bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 
            text-white text-[8px] font-bold 
            border-2 border-white dark:border-gray-900
            shadow-lg shadow-blue-500/40"
                  >
                    {totalChatUnread > 9 ? '9+' : totalChatUnread}
                  </span>
                )}
              </div>
            )}
          </button>

          <div
            className="overflow-hidden transition-all duration-500 ease-in-out"
            style={{
              maxHeight: isChatMinimized ? '0px' : '400px',
              opacity: isChatMinimized ? 0 : 1,
              transform: isChatMinimized ? 'translateY(-8px)' : 'translateY(0)',
            }}
          >
            <div className="space-y-0.5">
              {channels.length > 0 ? (
                channels.slice(0, 8).map((channel, index) => {
                  const isChatActive = location.pathname === `/chat/${channel.id}`;
                  const unreadCount = chatUnreadData[channel.id] || 0;

                  return (
                    <Link
                      key={channel.id}
                      to={`/chat/${channel.id}`}
                      onClick={closeMobileSidebar}
                      style={{
                        animationDelay: `${index * 30}ms`,
                      }}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium 
                transition-all duration-200 ease-out group relative
                ${
                  isChatActive
                    ? 'bg-gradient-to-r from-blue-100 to-cyan-50 dark:from-blue-500/20 dark:to-cyan-500/10 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50/50 dark:hover:from-blue-500/10 dark:hover:to-cyan-500/5 hover:text-blue-700 dark:hover:text-blue-300'
                }
                hover:shadow-sm hover:shadow-blue-100 dark:hover:shadow-blue-900/20
                hover:translate-x-0.5
                ${!showFull ? 'justify-center' : ''}`}
                      title={!showFull ? channel.name : undefined}
                    >
                      {isChatActive && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 
                    bg-gradient-to-b from-blue-500 to-cyan-600 
                    dark:from-blue-400 dark:to-cyan-500 
                    rounded-r-full shadow-lg shadow-blue-500/30"
                        />
                      )}
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0
                  ${
                    isChatActive
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                  }
                  transition-all duration-200`}
                      >
                        {channel.type === 'direct' ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-[8px] font-bold">
                            {channel.name?.charAt(0).toUpperCase() || 'D'}
                          </div>
                        ) : channel.isPrivate ? (
                          <Lock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <Hash className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                      {showFull && (
                        <span className="flex-1 flex items-center justify-between">
                          <span className="truncate text-[11px]">{channel.name}</span>
                          {unreadCount > 0 && (
                            <span
                              className="min-w-[18px] h-4 px-1 flex items-center justify-center rounded-full 
                        bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 
                        text-white text-[9px] font-bold shadow-md
                        group-hover:scale-110
                        transition-all duration-200"
                            >
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </span>
                      )}
                      {!showFull && unreadCount > 0 && (
                        <span
                          className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center rounded-full 
                    bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 
                    text-white text-[8px] font-bold 
                    border-2 border-white dark:border-gray-900
                    shadow-lg"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })
              ) : (
                <div className="px-2 py-4 text-center">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">No channels yet</p>
                </div>
              )}
              {channels.length > 8 && (
                <Link
                  to="/chat"
                  onClick={closeMobileSidebar}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 mt-1 rounded-lg text-[10px] font-medium
            text-blue-600 dark:text-blue-400 
            hover:bg-blue-50 dark:hover:bg-blue-900/20
            transition-all duration-200"
                >
                  <span>View all ({channels.length})</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {currentWorkspace ? (
            <>
              <div
                className={`sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl z-10 px-2.5 py-2.5 
    border-b border-gray-100/80 dark:border-gray-800/40 transition-all duration-300
    ${isNavMinimized ? 'shadow-sm shadow-violet-100/50 dark:shadow-violet-900/10' : ''}
    ${!showFull ? 'px-2' : ''}`}
              >
                {showFull ? (
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-1 h-4 rounded-full bg-gradient-to-b from-violet-500 to-purple-600 
          shadow-md shadow-violet-500/30"
                      />
                      <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                        Spaces
                      </span>
                    </div>
                    <button
                      onClick={() => setIsCreateSpaceModalOpen(true)}
                      className="p-1 rounded-md 
          hover:bg-violet-100 dark:hover:bg-violet-900/30 
          text-gray-400 dark:text-gray-500 
          hover:text-violet-600 dark:hover:text-violet-400 
          transition-all duration-200 hover:scale-110 hover:rotate-90 active:scale-95
          hover:shadow-md hover:shadow-violet-200/30"
                      title="Create Space"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreateSpaceModalOpen(true)}
                    className="w-full p-2 rounded-lg 
        hover:bg-violet-100 dark:hover:bg-violet-900/30 
        text-gray-400 dark:text-gray-500 
        hover:text-violet-600 dark:hover:text-violet-400 
        transition-all duration-200 flex justify-center hover:scale-110 hover:rotate-90 active:scale-95"
                    title="Add Space"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="px-2 py-2">
                {spacesLoading ? (
                  <div className="space-y-1.5 p-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{ animationDelay: `${i * 100}ms` }}
                        className="h-9 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 
                    rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : spacesForCurrentWorkspace.length > 0 ? (
                  <div className="space-y-0.5">
                    {spacesForCurrentWorkspace.map((space, spaceIndex) => {
                      const isSpaceExpanded = expandedSpaces.has(space.id);
                      const isSpaceActive = currentSpace?.id === space.id;
                      const spaceFolders = foldersBySpaceId[space.id] || [];
                      const spaceDirectProjects = projectsBySpaceId[space.id] || [];
                      const SpaceIcon = getSpaceIcon(space.icon);
                      // ✅ ADDED: Check if user can access content
                      const canAccessSpace = space.hasAccess === true; // ✅ EXPLICIT CHECK

                      return (
                        <div
                          key={space.id}
                          style={{ animationDelay: `${spaceIndex * 40}ms` }}
                          className="animate-in slide-in-from-left-1 fade-in"
                        >
                          <div
                            className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer 
                        transition-all duration-200 ease-out
                        ${
                          isSpaceActive
                            ? 'bg-gradient-to-r from-violet-50 to-purple-50/50 dark:from-violet-500/15 dark:to-purple-500/10 shadow-sm'
                            : 'hover:bg-gray-100/80 dark:hover:bg-gray-800/50'
                        }
                        ${!canAccessSpace ? 'opacity-70' : ''}`}
                            onClick={() => handleSpaceClick(space)}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // ✅ UPDATED: Only allow expansion if user has access
                                if (canAccessSpace) {
                                  toggleSpace(space.id);
                                }
                              }}
                              className="p-0.5 rounded-md hover:bg-gray-200/80 dark:hover:bg-gray-700/80 
                          transition-all duration-200"
                              disabled={!canAccessSpace}
                            >
                              <ChevronRight
                                className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 
                            transition-transform duration-200 ease-out
                            ${isSpaceExpanded && canAccessSpace ? 'rotate-90' : 'rotate-0'}`}
                              />
                            </button>

                            {/* ✅ UPDATED: Add lock overlay for visible-only spaces */}
                            <div
                              className="relative w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-md"
                              style={{
                                backgroundColor: (space.color || '#6366f1') + '15',
                                boxShadow: isSpaceActive
                                  ? `0 2px 8px ${space.color || '#6366f1'}30`
                                  : 'none',
                              }}
                            >
                              {!canAccessSpace && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 dark:bg-gray-900/80 rounded-md z-10">
                                  <Lock className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <SpaceIcon
                                className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110"
                                style={{ color: space.color || '#6366f1' }}
                              />
                            </div>

                            {showFull && (
                              <>
                                <span
                                  className={`flex-1 text-[11px] font-medium truncate transition-all duration-200
                              ${
                                isSpaceActive
                                  ? 'text-violet-700 dark:text-violet-300'
                                  : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                              }`}
                                >
                                  {space.name}
                                  {/* ✅ ADDED: View Only badge */}
                                  {!canAccessSpace && (
                                    <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                      View Only
                                    </span>
                                  )}
                                </span>

                                {/* ✅ UPDATED: Only show actions if user has access */}
                                {canAccessSpace && (
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button
                                      onClick={(e) => openContextMenu(e, 'space', space)}
                                      className="p-1 rounded-md hover:bg-gray-200/80 dark:hover:bg-gray-700/80 
                                  text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 
                                  transition-all duration-150 hover:scale-105"
                                    >
                                      <MoreHorizontal className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      ref={(el) => {
                                        addButtonRefs.current[space.id] = el;
                                      }}
                                      onClick={(e) => handleOpenSpaceAddMenu(e, space.id)}
                                      className="p-1 rounded-md hover:bg-violet-100 dark:hover:bg-violet-900/30 
                                  text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 
                                  transition-all duration-150 hover:scale-105"
                                      title="Add to space"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* ✅ UPDATED: Only show content if user has access */}
                          {canAccessSpace && (
                            <div
                              className={`overflow-hidden transition-all duration-300 ease-out
                          ${isSpaceExpanded && showFull ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                              <div className="ml-4 pl-2.5 border-l-2 border-gray-200/70 dark:border-gray-700/50 mt-0.5 space-y-0.5">
                                {spaceFolders.map((folder, folderIndex) => {
                                  const isFolderExpanded = expandedFolders.has(folder.id);
                                  const isFolderActive = currentFolder?.id === folder.id;
                                  const folderProjects = projectsByFolderId[folder.id] || [];

                                  return (
                                    <div
                                      key={folder.id}
                                      style={{ animationDelay: `${folderIndex * 30}ms` }}
                                      className="animate-in slide-in-from-left-1 fade-in"
                                    >
                                      <div
                                        className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer 
                                    transition-all duration-200 ease-out
                                    ${
                                      isFolderActive
                                        ? 'bg-violet-50/80 dark:bg-violet-500/10'
                                        : 'hover:bg-gray-100/70 dark:hover:bg-gray-800/40'
                                    }`}
                                        onClick={() => handleFolderClick(folder)}
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFolder(folder.id);
                                          }}
                                          className="p-0.5 rounded hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors duration-150"
                                        >
                                          <ChevronRight
                                            className={`w-3 h-3 text-gray-400 dark:text-gray-500 
                                        transition-transform duration-200 ease-out
                                        ${isFolderExpanded ? 'rotate-90' : 'rotate-0'}`}
                                          />
                                        </button>

                                        <div className="relative">
                                          <Folder
                                            className={`w-3.5 h-3.5 text-amber-500 flex-shrink-0 
                                        transition-all duration-200
                                        ${isFolderExpanded ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
                                          />
                                          <FolderOpen
                                            className={`w-3.5 h-3.5 text-amber-500 flex-shrink-0 absolute inset-0
                                        transition-all duration-200
                                        ${isFolderExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                                          />
                                        </div>

                                        <span
                                          className={`flex-1 text-[11px] truncate transition-colors duration-200
                                      ${
                                        isFolderActive
                                          ? 'text-violet-700 dark:text-violet-300 font-medium'
                                          : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200'
                                      }`}
                                        >
                                          {folder.name}
                                        </span>

                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                          <button
                                            onClick={(e) => openContextMenu(e, 'folder', folder)}
                                            className="p-0.5 rounded hover:bg-gray-200/80 dark:hover:bg-gray-700/80 
                                        text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                                        transition-all duration-150"
                                          >
                                            <MoreHorizontal className="w-3 h-3" />
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
                                            className="p-0.5 rounded hover:bg-violet-100 dark:hover:bg-violet-900/30 
                                        text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 
                                        transition-all duration-150"
                                            title="Add project"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>

                                      <div
                                        className={`overflow-hidden transition-all duration-200 ease-out
      ${isFolderExpanded && folderProjects.length > 0 ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                      >
                                        <div className="ml-3.5 pl-2.5 border-l-2 border-gray-200/50 dark:border-gray-700/40 mt-0.5 space-y-0.5">
                                          {folderProjects.map((project, projectIndex) => {
                                            const isProjectItemActive = isProjectActive(project.id);

                                            return (
                                              <div
                                                key={project.id}
                                                style={{ animationDelay: `${projectIndex * 20}ms` }}
                                                className="animate-in slide-in-from-left-1 fade-in"
                                              >
                                                <button
                                                  onClick={() => handleProjectClick(project)}
                                                  className={`group w-full flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer 
                transition-all duration-200 ease-out
                ${
                  isProjectItemActive
                    ? 'bg-violet-100/80 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300'
                    : 'hover:bg-gray-100/60 dark:hover:bg-gray-800/30 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                                                >
                                                  <DotIcon
                                                    className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200
                  ${isProjectItemActive ? 'text-violet-500' : ''}`}
                                                  />
                                                  <span className="flex-1 text-[11px] truncate">
                                                    {project.name}
                                                  </span>
                                                  <span
                                                    className={`text-[9px] font-mono px-1 py-0.5 rounded transition-opacity duration-150
                  ${
                    isProjectItemActive
                      ? 'bg-violet-200/50 dark:bg-violet-800/30 text-violet-700 dark:text-violet-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100'
                  }`}
                                                  >
                                                    {project.key}
                                                  </span>
                                                  <button
                                                    onClick={(e) =>
                                                      openContextMenu(e, 'project', project)
                                                    }
                                                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 
                  hover:bg-gray-200/80 dark:hover:bg-gray-700/80 
                  text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                  transition-all duration-150"
                                                  >
                                                    <MoreHorizontal className="w-3 h-3" />
                                                  </button>
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}

                                {spaceDirectProjects.map((project, projectIndex) => {
                                  const isProjectItemActive = isProjectActive(project.id);

                                  return (
                                    <div
                                      key={project.id}
                                      style={{
                                        animationDelay: `${(spaceFolders.length + projectIndex) * 20}ms`,
                                      }}
                                      className="animate-in slide-in-from-left-1 fade-in"
                                    >
                                      <button
                                        onClick={() => handleProjectClick(project)}
                                        className={`group w-full flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer 
            transition-all duration-200 ease-out
            ${
              isProjectItemActive
                ? 'bg-violet-100/80 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300'
                : 'hover:bg-gray-100/60 dark:hover:bg-gray-800/30 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
                                      >
                                        <DotIcon
                                          className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200
              ${isProjectItemActive ? 'text-violet-500' : ''}`}
                                        />
                                        <span className="flex-1 text-[11px] truncate">
                                          {project.name}
                                        </span>
                                        <span
                                          className={`text-[9px] font-mono px-1 py-0.5 rounded transition-opacity duration-150
              ${
                isProjectItemActive
                  ? 'bg-violet-200/50 dark:bg-violet-800/30 text-violet-700 dark:text-violet-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100'
              }`}
                                        >
                                          {project.key}
                                        </span>
                                        <button
                                          onClick={(e) => openContextMenu(e, 'project', project)}
                                          className="p-0.5 rounded opacity-0 group-hover:opacity-100 
              hover:bg-gray-200/80 dark:hover:bg-gray-700/80 
              text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
              transition-all duration-150"
                                        >
                                          <MoreHorizontal className="w-3 h-3" />
                                        </button>
                                      </button>
                                    </div>
                                  );
                                })}

                                {spaceFolders.length === 0 && spaceDirectProjects.length === 0 && (
                                  <div className="px-2 py-5 text-center animate-in fade-in duration-300">
                                    <div
                                      className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 
                                flex items-center justify-center mx-auto mb-2"
                                    >
                                      <Folder className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5">
                                      No content yet
                                    </p>
                                    <button
                                      onClick={() =>
                                        handleCreateFolderFromMenu(space.id, space.name)
                                      }
                                      className="text-[10px] font-medium text-violet-600 dark:text-violet-400 
                                  hover:text-violet-700 dark:hover:text-violet-300
                                  hover:underline underline-offset-2 transition-colors"
                                    >
                                      Add a folder
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center animate-in fade-in zoom-in-95 duration-300">
                    <div
                      className="w-12 h-12 rounded-xl 
                bg-gradient-to-br from-violet-100 via-purple-100 to-indigo-100 
                dark:from-violet-900/30 dark:via-purple-900/20 dark:to-indigo-900/30 
                flex items-center justify-center mx-auto mb-3 shadow-lg shadow-violet-200/30 dark:shadow-violet-900/20"
                    >
                      <Zap className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    {showFull && (
                      <>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2.5">
                          No spaces yet
                        </p>
                        <button
                          onClick={() => setIsCreateSpaceModalOpen(true)}
                          className="text-xs text-violet-600 dark:text-violet-400 
                      hover:text-violet-700 dark:hover:text-violet-300 
                      font-semibold hover:underline underline-offset-2 
                      transition-colors duration-200"
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
            <div className="px-4 py-12 text-center animate-in fade-in zoom-in-95 duration-300">
              {showFull && (
                <>
                  <div
                    className="w-14 h-14 rounded-xl 
              bg-gradient-to-br from-violet-100 via-purple-100 to-indigo-100 
              dark:from-violet-900/30 dark:via-purple-900/20 dark:to-indigo-900/30 
              flex items-center justify-center mx-auto mb-3 
              shadow-xl shadow-violet-200/40 dark:shadow-violet-900/20"
                  >
                    <Zap className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                  </div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">
                    No workspace selected
                  </p>
                  <button
                    onClick={() => setIsCreateWorkspaceModalOpen(true)}
                    className="text-xs text-violet-600 dark:text-violet-400 
                hover:text-violet-700 dark:hover:text-violet-300 
                font-semibold hover:underline underline-offset-2 
                transition-colors duration-200"
                  >
                    Create workspace
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div
          className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800/60 p-2.5 
    bg-gradient-to-t from-gray-50/50 to-transparent dark:from-gray-950/30 dark:to-transparent"
        >
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
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium 
            transition-all duration-200 ease-out mb-0.5 group
            ${
              active
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
            }
            ${!showFull ? 'justify-center' : ''}`}
                title={!showFull ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-all duration-200 
            ${active ? '' : 'group-hover:scale-110 group-hover:text-violet-600 dark:group-hover:text-violet-400'}`}
                />
                {showFull && (
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800/60 p-2.5 relative">
          <button
            onClick={() => showFull && setShowUserMenu(!showUserMenu)}
            className={`w-full flex items-center gap-2.5 p-2 rounded-lg 
        hover:bg-gray-100/80 dark:hover:bg-gray-800/60 
        transition-all duration-200 ease-out group active:scale-[0.98] 
        ${!showFull ? 'justify-center' : ''}`}
          >
            <div
              className="w-8 h-8 rounded-lg 
        bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 
        flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 
        shadow-lg shadow-violet-500/30 
        group-hover:shadow-xl group-hover:shadow-violet-500/40 
        group-hover:scale-105 
        transition-all duration-200 
        ring-2 ring-white dark:ring-gray-900"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                getInitials(user?.name || 'U')
              )}
            </div>
            {showFull && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || ''}
                  </p>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-gray-400 transition-all duration-300 ease-out
              ${showUserMenu ? 'rotate-90 text-violet-500' : 'group-hover:translate-x-0.5'}`}
                />
              </>
            )}
          </button>

          <div
            className={`absolute bottom-full left-2.5 right-2.5 mb-2 
        bg-white dark:bg-gray-800 
        border border-gray-200/80 dark:border-gray-700/80 
        rounded-lg shadow-2xl shadow-gray-200/50 dark:shadow-black/30 
        overflow-hidden
        transition-all duration-200 ease-out origin-bottom
        ${
          showUserMenu && showFull
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        }`}
          >
            <div className="p-1.5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium 
            text-red-600 dark:text-red-400 
            hover:bg-red-50 dark:hover:bg-red-900/20 
            transition-all duration-200 group active:scale-[0.98]"
              >
                <LogOut className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-x-0.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

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
