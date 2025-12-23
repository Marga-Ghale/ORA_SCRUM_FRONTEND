// src/components/ProjectSidebar.tsx - COMPLETE STATE MANAGEMENT FIX
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
  BarChart3,
  FileText,
  Zap,
  MessageSquare,
  BellElectric,
  UserPlus,
  PersonStandingIcon,
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { useProject } from '../context/ProjectContext';
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

// ============================================================================
// LOCALSTORAGE KEYS
// ============================================================================
const STORAGE_KEYS = {
  WORKSPACE: 'selectedWorkspaceId',
  SPACE: 'selectedSpaceId',
  PROJECT: 'selectedProjectId',
  FOLDER: 'selectedFolderId',
} as const;

const ProjectSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const {
    currentWorkspace,
    currentSpace,
    currentFolder,
    setCurrentWorkspace,
    setCurrentSpace,
    setCurrentProject,
    setCurrentFolder,
    setIsCreateSpaceModalOpen,
    setIsCreateProjectModalOpen,
    isInitializing,
    setManagementEntity,
  } = useProject();
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
  const [IsCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [memberModal, setMemberModal] = useState<{
    isOpen: boolean;
    entityType: 'workspace' | 'space' | 'folder' | 'project';
    entityId: string;
    entityName: string;
  } | null>(null);

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

  const foldersForCurrentWorkspace = useMemo(() => {
    if (!currentWorkspace || !allFolders || !allSpaces) return [];
    const spaceIds = allSpaces
      .filter((space) => space.workspaceId === currentWorkspace.id)
      .map((space) => space.id);
    return allFolders.filter((folder) => spaceIds.includes(folder.spaceId));
  }, [allFolders, allSpaces, currentWorkspace]);

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
  // STATE PERSISTENCE - RESTORE ON MOUNT
  // ============================================================================

  // 1. WORKSPACE RESTORATION
  useEffect(() => {
    if (!workspaces || workspaces.length === 0) return;

    const savedWorkspaceId = localStorage.getItem(STORAGE_KEYS.WORKSPACE);

    if (savedWorkspaceId) {
      const savedWorkspace = workspaces.find((w) => w.id === savedWorkspaceId);
      if (savedWorkspace && !currentWorkspace) {
        setCurrentWorkspace(savedWorkspace as any);
        return;
      }
    }

    // Only auto-select if no workspace is selected AND none was saved
    if (!currentWorkspace && !savedWorkspaceId) {
      setCurrentWorkspace(workspaces[0] as any);
      localStorage.setItem(STORAGE_KEYS.WORKSPACE, workspaces[0].id);
    }
  }, [workspaces, currentWorkspace, setCurrentWorkspace]);

  // 2. SPACE RESTORATION
  useEffect(() => {
    if (!allSpaces || allSpaces.length === 0 || !currentWorkspace) return;

    const savedSpaceId = localStorage.getItem(STORAGE_KEYS.SPACE);

    if (savedSpaceId && !currentSpace) {
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

    const savedFolderId = localStorage.getItem(STORAGE_KEYS.FOLDER);

    if (savedFolderId && !currentFolder && setCurrentFolder) {
      const savedFolder = allFolders.find(
        (f) => f.id === savedFolderId && f.spaceId === currentSpace.id
      );
      if (savedFolder) {
        setCurrentFolder(savedFolder as any);
      }
    }
  }, [allFolders, currentFolder, currentSpace, setCurrentFolder]);

  // 4. PROJECT RESTORATION
  useEffect(() => {
    if (!allProjects || allProjects.length === 0) return;

    const savedProjectId = localStorage.getItem(STORAGE_KEYS.PROJECT);

    if (savedProjectId) {
      const savedProject = allProjects.find((p) => p.id === savedProjectId);
      if (savedProject) {
        setCurrentProject(savedProject as any);
      }
    }
  }, [allProjects, setCurrentProject]);

  // ============================================================================
  // AUTO-EXPAND CURRENT SPACE
  // ============================================================================
  useEffect(() => {
    if (currentSpace) {
      setExpandedSpaces((prev) => new Set([...prev, currentSpace.id]));
    }
  }, [currentSpace]);

  // ============================================================================
  // HANDLER FUNCTIONS WITH PERSISTENCE
  // ============================================================================

  const handleWorkspaceChange = (workspace: any) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem(STORAGE_KEYS.WORKSPACE, workspace.id);

    // Clear child selections
    localStorage.removeItem(STORAGE_KEYS.SPACE);
    localStorage.removeItem(STORAGE_KEYS.FOLDER);
    localStorage.removeItem(STORAGE_KEYS.PROJECT);
  };

  const handleSpaceChange = (space: any) => {
    setCurrentSpace(space);
    localStorage.setItem(STORAGE_KEYS.SPACE, space.id);

    // Clear child selections
    localStorage.removeItem(STORAGE_KEYS.FOLDER);
  };

  const handleFolderChange = (folder: any) => {
    if (setCurrentFolder) {
      setCurrentFolder(folder);
      localStorage.setItem(STORAGE_KEYS.FOLDER, folder.id);
    }
  };

  const handleProjectChange = (project: any) => {
    setCurrentProject(project);
    localStorage.setItem(STORAGE_KEYS.PROJECT, project.id);
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isProjectActive = (projectId: string) =>
    location.pathname.includes(`/project/${projectId}`);

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
    // Clear all selections on logout
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
        className={`fixed mt-16 lg:mt-0 top-0 left-0 h-screen z-50 bg-[#1a1d21] border-r border-[#2a2e33] transition-all duration-200 ${showFull ? 'w-[260px]' : 'w-[60px]'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="p-3 animate-pulse">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-lg bg-[#2a2e33]" />
            {showFull && <div className="h-4 bg-[#2a2e33] rounded flex-1" />}
          </div>
        </div>
        <div className="px-2 space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-[#2a2e33] rounded-md animate-pulse" />
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
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleMobileSidebar} />
      )}

      <aside
        className={`fixed mt-16 lg:mt-0 top-0 left-0 h-screen z-50 flex flex-col
          bg-[#1a1d21] border-r border-[#2a2e33] transition-all duration-200
          ${showFull ? 'w-[260px]' : 'w-[60px]'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Workspace Selector */}
        <WorkspaceSelector
          currentWorkspace={currentWorkspace}
          onWorkspaceChange={handleWorkspaceChange}
          onCreateNew={() => setIsCreateWorkspaceModalOpen(true)}
          showFull={showFull}
        />

        {/* Workspace Actions */}
        {currentWorkspace && showFull && (
          <div className="px-2 py-1 border-b border-[#2a2e33]">
            <div className="flex items-center gap-1">
              <button
                onClick={(e) =>
                  openMemberModal('workspace', currentWorkspace.id, currentWorkspace.name, e)
                }
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-[#9ca3af] hover:bg-[#25282c] hover:text-white transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
              <button
                onClick={() => navigate(`/members/workspace/${currentWorkspace.id}`)}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-[#9ca3af] hover:bg-[#25282c] hover:text-white transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Manage</span>
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className={`p-2 ${!showFull ? 'px-1.5' : ''}`}>
          {showFull ? (
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md bg-[#25282c] hover:bg-[#2a2e33] text-[#6b7280] text-sm transition-colors">
              <Search className="w-4 h-4" />
              <span>Search</span>
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#1a1d21] text-[#6b7280]">
                ⌘K
              </kbd>
            </button>
          ) : (
            <button className="w-full p-2 rounded-md hover:bg-[#2a2e33] text-[#6b7280] hover:text-white transition-colors flex justify-center">
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="px-2 py-1 border-b border-[#2a2e33]">
          {[
            { icon: Home, label: 'Home', path: '/' },
            {
              icon: BellElectric,
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
              icon: PersonStandingIcon,
              label: 'Member Management',
              onClick: () => {
                if (!currentWorkspace) return;
                setManagementEntity({
                  entityType: 'workspace',
                  entityId: currentWorkspace.id,
                  entityName: currentWorkspace.name,
                });
                navigate(`/member-management/workspace/${currentWorkspace.id}`);
              },
            },
            { icon: FileText, label: 'Docs', path: '/docs' },
            { icon: BarChart3, label: 'Dashboards', path: '/dashboards' },
          ].map((item) => {
            const Icon = item.icon;

            if ('onClick' in item) {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors mb-0.5
                    text-[#9ca3af] hover:bg-[#25282c] hover:text-white
                    ${!showFull ? 'justify-center px-2' : ''}`}
                  title={!showFull ? item.label : undefined}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  {showFull && <span>{item.label}</span>}
                </button>
              );
            }

            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors mb-0.5
                  ${active ? 'bg-[#7c3aed]/20 text-[#a78bfa]' : 'text-[#9ca3af] hover:bg-[#25282c] hover:text-white'}
                  ${!showFull ? 'justify-center px-2' : ''}`}
                title={!showFull ? item.label : undefined}
              >
                <Icon className="w-[18px] h-[18px]" />
                {showFull && <span className="flex-1">{item.label}</span>}
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
                className={`sticky top-0 bg-[#1a1d21] z-10 px-2 py-2 ${!showFull ? 'px-1.5' : ''}`}
              >
                {showFull ? (
                  <div className="flex items-center justify-between px-2.5">
                    <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
                      Spaces
                    </span>
                    <button
                      onClick={() => setIsCreateSpaceModalOpen(true)}
                      className="p-1 rounded hover:bg-[#2a2e33] text-[#6b7280] hover:text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreateSpaceModalOpen(true)}
                    className="w-full p-2 rounded-md hover:bg-[#2a2e33] text-[#6b7280] hover:text-white transition-colors flex justify-center"
                    title="Add Space"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Spaces List */}
              <div className="px-2 pb-2">
                {spacesLoading ? (
                  <div className="space-y-2 px-2 py-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 bg-[#2a2e33] rounded-md animate-pulse" />
                    ))}
                  </div>
                ) : spacesForCurrentWorkspace && spacesForCurrentWorkspace.length > 0 ? (
                  spacesForCurrentWorkspace.map((space) => {
                    const isSpaceExpanded = expandedSpaces.has(space.id);
                    const isHovered = hoveredSpace === space.id;
                    const spaceProjects = projectsBySpaceId[space.id] || [];

                    return (
                      <SpaceItem
                        key={space.id}
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
                        setIsCreateProjectModalOpen={setIsCreateProjectModalOpen}
                        isProjectActive={isProjectActive}
                        onManageMembers={openMemberModal}
                      />
                    );
                  })
                ) : (
                  <div className="px-2 py-6 text-center">
                    <div className="w-10 h-10 rounded-xl bg-[#25282c] flex items-center justify-center mx-auto mb-2">
                      <Zap className="w-5 h-5 text-[#6b7280]" />
                    </div>
                    {showFull && (
                      <>
                        <p className="text-sm text-[#6b7280] mb-2">No spaces yet</p>
                        <button
                          onClick={() => setIsCreateSpaceModalOpen(true)}
                          className="text-sm text-[#7c3aed] hover:text-[#a78bfa] font-medium transition-colors"
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
            <div className="px-4 py-8 text-center">
              {showFull && (
                <>
                  <Zap className="w-12 h-12 text-[#6b7280] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280] mb-3">No workspace selected</p>
                  <button
                    onClick={() => setIsCreateWorkspaceModalOpen(true)}
                    className="text-sm text-[#7c3aed] hover:text-[#a78bfa] font-medium transition-colors"
                  >
                    Create your first workspace
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-[#2a2e33] p-2">
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
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors mb-0.5
                  ${active ? 'bg-[#25282c] text-white' : 'text-[#9ca3af] hover:bg-[#25282c] hover:text-white'}
                  ${!showFull ? 'justify-center px-2' : ''}`}
                title={!showFull ? item.label : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {showFull && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* User Profile */}
        <div className="border-t border-[#2a2e33] p-2 relative">
          <button
            onClick={() => showFull && setShowUserMenu(!showUserMenu)}
            className={`w-full flex items-center gap-2.5 p-2 rounded-md hover:bg-[#25282c] transition-colors
              ${!showFull ? 'justify-center' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(user?.name || 'U')
              )}
            </div>
            {showFull && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-[#6b7280] truncate">{user?.email || ''}</p>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-[#6b7280] transition-transform ${showUserMenu ? 'rotate-90' : ''}`}
                />
              </>
            )}
          </button>

          {/* User Menu */}
          {showUserMenu && showFull && (
            <div className="absolute bottom-full left-2 right-2 mb-2 bg-[#25282c] border border-[#2a2e33] rounded-lg shadow-xl overflow-hidden">
              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

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
