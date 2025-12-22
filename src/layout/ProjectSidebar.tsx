// src/components/ProjectSidebar.tsx - FIXED VERSION
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
  Folder,
  Hash,
  MoreHorizontal,
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
  useAccessibleProjects,
  useAccessibleSpaces,
  useAccessibleWorkspaces,
} from '../hooks/api/useAccessibleEntities';

// ✅ FIXED: Import accessible entities hooks

const ProjectSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const {
    currentWorkspace,
    currentSpace,
    setCurrentWorkspace,
    setCurrentSpace,
    setCurrentProject,
    setIsCreateSpaceModalOpen,
    setIsCreateProjectModalOpen,
    isInitializing,
    managementEntity,
    setManagementEntity,
  } = useProject();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ FIXED: Use accessible entities instead of direct membership
  const { data: workspaces, isLoading: workspacesLoading } = useAccessibleWorkspaces({
    enabled: !!user,
  });
  const { data: allSpaces, isLoading: spacesLoading } = useAccessibleSpaces({
    enabled: !!user,
  });
  const { data: allProjects, isLoading: projectsLoading } = useAccessibleProjects({
    enabled: !!user,
  });

  // Fetch notification count
  const { data: notificationData } = useNotificationCount({ enabled: !!user });

  // Fetch chat unread counts
  const { data: chatUnreadData } = useUnreadCounts({ enabled: !!user });

  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hoveredSpace, setHoveredSpace] = useState<string | null>(null);
  const [IsCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);

  // Member management modal state
  const [memberModal, setMemberModal] = useState<{
    isOpen: boolean;
    entityType: 'workspace' | 'space' | 'folder' | 'project';
    entityId: string;
    entityName: string;
  } | null>(null);

  const showFull = isExpanded || isHovered || isMobileOpen;

  // ✅ FIXED: Filter spaces and projects for current workspace
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

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !currentWorkspace) {
      setCurrentWorkspace(workspaces[0] as any);
    }
  }, [workspaces, currentWorkspace, setCurrentWorkspace]);

  // Auto-expand current space
  useEffect(() => {
    if (currentSpace) {
      setExpandedSpaces((prev) => new Set([...prev, currentSpace.id]));
    }
  }, [currentSpace]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isProjectActive = (projectId: string) =>
    location.pathname.includes(`/project/${projectId}`);

  useEffect(() => {
    console.log('Workspaces:', workspaces);
  }, [workspaces]);

  useEffect(() => {
    console.log('Spaces:', allSpaces);
  }, [allSpaces]);

  useEffect(() => {
    console.log('Projects:', allProjects);
  }, [allProjects]);

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

  // Loading state
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
          onWorkspaceChange={setCurrentWorkspace}
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

            // ✅ MEMBER MANAGEMENT (BUTTON, NOT LINK)
            {
              icon: PersonStandingIcon,
              label: 'Member Management',
              onClick: () => {
                if (!currentWorkspace) return;

                // Set context (optional, for state management)
                setManagementEntity({
                  entityType: 'workspace',
                  entityId: currentWorkspace.id,
                  entityName: currentWorkspace.name,
                });

                // ✅ FIXED: Navigate with URL parameters
                navigate(`/member-management/workspace/${currentWorkspace.id}`);
              },
            },

            { icon: FileText, label: 'Docs', path: '/docs' },
            { icon: BarChart3, label: 'Dashboards', path: '/dashboards' },
          ].map((item) => {
            const Icon = item.icon;

            // ✅ BUTTON ITEM
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

            // ✅ LINK ITEM
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
                        isSpaceExpanded={isSpaceExpanded}
                        isHovered={isHovered}
                        showFull={showFull}
                        currentSpace={currentSpace}
                        projectsLoading={projectsLoading}
                        onToggle={toggleSpace}
                        onMouseEnter={() => setHoveredSpace(space.id)}
                        onMouseLeave={() => setHoveredSpace(null)}
                        setCurrentSpace={setCurrentSpace}
                        setCurrentProject={setCurrentProject}
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

// ✅ FIXED: SpaceItem now receives projects as prop
interface SpaceItemProps {
  space: any;
  projects: any[];
  isSpaceExpanded: boolean;
  isHovered: boolean;
  showFull: boolean;
  currentSpace: any;
  projectsLoading: boolean;
  onToggle: (id: string, e?: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  setCurrentSpace: (space: any) => void;
  setCurrentProject: (project: any) => void;
  setIsCreateProjectModalOpen: (open: boolean) => void;
  isProjectActive: (id: string) => boolean;
  onManageMembers: (
    entityType: 'space' | 'project',
    entityId: string,
    entityName: string,
    e?: React.MouseEvent
  ) => void;
}

const SpaceItem: React.FC<SpaceItemProps> = ({
  space,
  projects,
  isSpaceExpanded,
  isHovered,
  showFull,
  currentSpace,
  projectsLoading,
  onToggle,
  onMouseEnter,
  onMouseLeave,
  setCurrentSpace,
  setCurrentProject,
  setIsCreateProjectModalOpen,
  isProjectActive,
  onManageMembers,
}) => {
  return (
    <div className="mb-0.5">
      {/* Space Item */}
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group
          ${currentSpace?.id === space.id ? 'bg-[#25282c]' : 'hover:bg-[#25282c]'}
          ${!showFull ? 'justify-center' : ''}`}
        onClick={() => {
          setCurrentSpace(space);
          if (showFull) onToggle(space.id);
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {showFull && (
          <button
            onClick={(e) => onToggle(space.id, e)}
            className="p-0.5 rounded hover:bg-[#2a2e33] text-[#6b7280]"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isSpaceExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        )}

        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0"
          style={{
            backgroundColor: `${space.color || '#7c3aed'}20`,
            color: space.color || '#7c3aed',
          }}
        >
          {space.icon ? <span>{space.icon}</span> : <Folder className="w-3.5 h-3.5" />}
        </div>

        {showFull && (
          <>
            <span className="flex-1 text-sm text-[#e5e7eb] truncate">{space.name}</span>

            <div
              className={`flex items-center gap-0.5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            >
              <button
                onClick={(e) => onManageMembers('space', space.id, space.name, e)}
                className="p-1 rounded hover:bg-[#2a2e33] text-[#6b7280] hover:text-white"
                title="Manage members"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSpace(space);
                  setIsCreateProjectModalOpen(true);
                }}
                className="p-1 rounded hover:bg-[#2a2e33] text-[#6b7280] hover:text-white"
                title="Add project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1 rounded hover:bg-[#2a2e33] text-[#6b7280] hover:text-white"
                title="More options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Projects */}
      {showFull && isSpaceExpanded && (
        <div className="ml-5 pl-3 border-l border-[#2a2e33] mt-0.5">
          {projectsLoading ? (
            <div className="space-y-2 py-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-7 bg-[#2a2e33] rounded-md animate-pulse" />
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            projects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                space={space}
                isProjectActive={isProjectActive}
                setCurrentSpace={setCurrentSpace}
                setCurrentProject={setCurrentProject}
                onManageMembers={onManageMembers}
              />
            ))
          ) : (
            <p className="px-2 py-1.5 text-xs text-[#6b7280] italic">No projects</p>
          )}

          <button
            onClick={() => {
              setCurrentSpace(space);
              setIsCreateProjectModalOpen(true);
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-[#6b7280] hover:text-white hover:bg-[#25282c] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ProjectItem Component (unchanged)
interface ProjectItemProps {
  project: any;
  space: any;
  isProjectActive: (id: string) => boolean;
  setCurrentSpace: (space: any) => void;
  setCurrentProject: (project: any) => void;
  onManageMembers: (
    entityType: 'project',
    entityId: string,
    entityName: string,
    e?: React.MouseEvent
  ) => void;
}

const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  space,
  isProjectActive,
  setCurrentSpace,
  setCurrentProject,
  onManageMembers,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={`/project/${project.id || (project as any).ID}/board`}
        onClick={() => {
          setCurrentSpace(space);
          setCurrentProject(project);
        }}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors
          ${
            isProjectActive(project.id)
              ? 'bg-[#7c3aed]/15 text-[#a78bfa]'
              : 'text-[#9ca3af] hover:bg-[#25282c] hover:text-white'
          }`}
      >
        <Hash
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: project.color || space.color }}
        />
        <span className="truncate flex-1">{project.name}</span>
        <span
          className={`text-[10px] font-mono text-[#6b7280] transition-opacity ${
            isHovered || isProjectActive(project.id) ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {project.key}
        </span>
      </Link>

      {isHovered && (
        <button
          onClick={(e) => onManageMembers('project', project.id, project.name, e)}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded bg-[#25282c] hover:bg-[#2a2e33] text-[#6b7280] hover:text-white transition-colors"
          title="Manage members"
        >
          <UserPlus className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default ProjectSidebar;
