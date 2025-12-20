// src/components/ProjectSidebar.tsx
import React, { useState, useEffect } from 'react';
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
  Folder,
  Hash,
  MoreHorizontal,
  BarChart3,
  FileText,
  Zap,
  MessageSquare,
  BellElectric,
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../components/UserProfile/AuthContext';
import { useSpacesByWorkspace } from '../hooks/api/useSpaces';
import { useProjectsBySpace } from '../hooks/api/useProjects';
import { useNotificationCount } from '../hooks/api/useNotifications';
import { useUnreadCounts } from '../hooks/api/useChat';

const ProjectSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const {
    currentWorkspace,
    currentSpace,
    setCurrentSpace,
    setCurrentProject,
    setIsCreateSpaceModalOpen,
    setIsCreateProjectModalOpen,
    isInitializing,
  } = useProject();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch spaces for current workspace
  const { data: spaces, isLoading: spacesLoading } = useSpacesByWorkspace(
    currentWorkspace?.id || '',
    { enabled: !!currentWorkspace?.id }
  );

  // Fetch notification count (for Inbox)
  const { data: notificationData } = useNotificationCount({
    enabled: !!user,
  });

  // Fetch chat unread counts (for Chat)
  const { data: chatUnreadData } = useUnreadCounts({
    enabled: !!user,
  });

  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hoveredSpace, setHoveredSpace] = useState<string | null>(null);

  const showFull = isExpanded || isHovered || isMobileOpen;

  // Check if path is active
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isProjectActive = (projectId: string) =>
    location.pathname.includes(`/project/${projectId}`);

  // Calculate total chat unread count
  const totalChatUnread = chatUnreadData
    ? Object.values(chatUnreadData).reduce((sum, count) => sum + count, 0)
    : 0;

  // Unread notification count
  const unreadNotifications = notificationData?.unread || 0;

  // Auto-expand current space
  useEffect(() => {
    if (currentSpace) {
      setExpandedSpaces((prev) => new Set([...prev, currentSpace.id]));
    }
  }, [currentSpace]);

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

  // Loading state
  if (isInitializing) {
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
        {/* Workspace Header */}
        <div className="p-2 border-b border-[#2a2e33]">
          <button
            className={`w-full flex items-center gap-2.5 p-2 rounded-md hover:bg-[#2a2e33] transition-colors ${!showFull ? 'justify-center' : ''}`}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}
            >
              {currentWorkspace?.name?.[0]?.toUpperCase() || 'W'}
            </div>
            {showFull && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {currentWorkspace?.name || 'Workspace'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-[#6b7280]" />
              </>
            )}
          </button>
        </div>

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
            { icon: Home, label: 'Home', path: '/', badge: undefined },
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
            { icon: CheckSquare, label: 'My Tasks', path: '/my-tasks', badge: undefined },
            { icon: FileText, label: 'Docs', path: '/docs', badge: undefined },
            { icon: BarChart3, label: 'Dashboards', path: '/dashboards', badge: undefined },
          ].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors mb-0.5 group
                  ${active ? 'bg-[#7c3aed]/20 text-[#a78bfa]' : 'text-[#9ca3af] hover:bg-[#25282c] hover:text-white'}
                  ${!showFull ? 'justify-center px-2' : ''}`}
                title={!showFull ? item.label : undefined}
              >
                <div className="relative">
                  <Icon
                    className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-[#a78bfa]' : ''}`}
                  />
                  {/* Badge dot for collapsed sidebar */}
                  {!showFull && item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
                {showFull && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-500 text-white min-w-[20px] text-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Spaces Section */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Section Header */}
          <div className={`sticky top-0 bg-[#1a1d21] z-10 px-2 py-2 ${!showFull ? 'px-1.5' : ''}`}>
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
            ) : spaces && spaces.length > 0 ? (
              spaces.map((space) => {
                const isSpaceExpanded = expandedSpaces.has(space.id);
                const isHovered = hoveredSpace === space.id;

                return (
                  <SpaceItem
                    key={space.id}
                    space={space}
                    isSpaceExpanded={isSpaceExpanded}
                    isHovered={isHovered}
                    showFull={showFull}
                    currentSpace={currentSpace}
                    onToggle={toggleSpace}
                    onMouseEnter={() => setHoveredSpace(space.id)}
                    onMouseLeave={() => setHoveredSpace(null)}
                    setCurrentSpace={setCurrentSpace}
                    setCurrentProject={setCurrentProject}
                    setIsCreateProjectModalOpen={setIsCreateProjectModalOpen}
                    isProjectActive={isProjectActive}
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
    </>
  );
};

// Separate SpaceItem component for better organization
interface SpaceItemProps {
  space: any;
  isSpaceExpanded: boolean;
  isHovered: boolean;
  showFull: boolean;
  currentSpace: any;
  onToggle: (id: string, e?: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  setCurrentSpace: (space: any) => void;
  setCurrentProject: (project: any) => void;
  setIsCreateProjectModalOpen: (open: boolean) => void;
  isProjectActive: (id: string) => boolean;
}

const SpaceItem: React.FC<SpaceItemProps> = ({
  space,
  isSpaceExpanded,
  isHovered,
  showFull,
  currentSpace,
  onToggle,
  onMouseEnter,
  onMouseLeave,
  setCurrentSpace,
  setCurrentProject,
  setIsCreateProjectModalOpen,
  isProjectActive,
}) => {
  // Fetch projects for this specific space
  const { data: projects, isLoading: projectsLoading } = useProjectsBySpace(space.id, {
    enabled: isSpaceExpanded,
  });

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
        {/* Expand Arrow */}
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

        {/* Space Icon */}
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

            {/* Actions on hover */}
            <div
              className={`flex items-center gap-0.5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            >
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
              <Link
                key={project.id}
                to={`/project/${project.id}/board`}
                onClick={() => {
                  setCurrentSpace(space);
                  setCurrentProject(project);
                }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors group
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
                  className={`text-[10px] font-mono text-[#6b7280] opacity-0 group-hover:opacity-100 ${isProjectActive(project.id) ? 'opacity-100' : ''}`}
                >
                  {project.key}
                </span>
              </Link>
            ))
          ) : (
            <p className="px-2 py-1.5 text-xs text-[#6b7280] italic">No projects</p>
          )}

          {/* Add Project */}
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

export default ProjectSidebar;
