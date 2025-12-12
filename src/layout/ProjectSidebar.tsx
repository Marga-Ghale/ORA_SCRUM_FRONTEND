// src/components/ProjectSidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useSidebar } from '../context/SidebarContext';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../components/UserProfile/AuthContext';

const ProjectSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const {
    currentWorkspace,
    currentSpace,
    currentProject,
    setCurrentSpace,
    setCurrentProject,
    setIsCreateSpaceModalOpen,
    setIsCreateProjectModalOpen,
    isInitializing,
  } = useProject();
  const { user } = useAuth();
  const location = useLocation();
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set([currentSpace?.id || '']));

  const isActive = (path: string) => location.pathname === path;
  const showFull = isExpanded || isHovered || isMobileOpen;

  // Get initials helper
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleSpace = (spaceId: string) => {
    setExpandedSpaces(prev => {
      const next = new Set(prev);
      if (next.has(spaceId)) {
        next.delete(spaceId);
      } else {
        next.add(spaceId);
      }
      return next;
    });
  };

  const mainNavItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '📥', label: 'My Tasks', path: '/my-tasks' },
  ];

  const bottomNavItems = [
    { icon: '👥', label: 'Team', path: '/team' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

  // Loading skeleton
  if (isInitializing) {
    return (
      <aside
        className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 bg-gray-900 text-white h-screen transition-all duration-300 ease-in-out z-50
          ${showFull ? 'w-[260px]' : 'w-[60px]'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0`}
      >
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-700 animate-pulse" />
            {showFull && (
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded animate-pulse mb-1 w-24" />
                <div className="h-3 bg-gray-700 rounded animate-pulse w-16" />
              </div>
            )}
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 bg-gray-900 text-white h-screen transition-all duration-300 ease-in-out z-50
        ${showFull ? 'w-[260px]' : 'w-[60px]'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Workspace Header */}
      <div className={`p-4 border-b border-gray-800 ${!showFull ? 'px-3' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {currentWorkspace?.name?.[0]?.toUpperCase() || 'W'}
          </div>
          {showFull && (
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate">
                {currentWorkspace?.name || 'No Workspace'}
              </h2>
              <p className="text-xs text-gray-400 truncate">Workspace</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Search */}
      {showFull && (
        <div className="px-3 py-3">
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-400 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search...</span>
            <span className="ml-auto text-xs text-gray-500">⌘K</span>
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="px-2 py-2">
        {mainNavItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1
              ${isActive(item.path)
                ? 'bg-brand-500/20 text-brand-400'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
              ${!showFull ? 'justify-center' : ''}
            `}
            title={!showFull ? item.label : undefined}
          >
            <span className="text-base">{item.icon}</span>
            {showFull && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Spaces Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
        {showFull && (
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Spaces
            </span>
            <button
              onClick={() => setIsCreateSpaceModalOpen(true)}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
              title="Add Space"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}

        {/* Show spaces if workspace exists */}
        {currentWorkspace?.spaces && currentWorkspace.spaces.length > 0 ? (
          currentWorkspace.spaces.map(space => (
            <div key={space.id} className="mb-1">
              {/* Space Header */}
              <button
                onClick={() => {
                  toggleSpace(space.id);
                  setCurrentSpace(space);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                  ${currentSpace?.id === space.id ? 'bg-gray-800' : 'hover:bg-gray-800'}
                  ${!showFull ? 'justify-center' : ''}
                `}
                title={!showFull ? space.name : undefined}
              >
                <span
                  className="w-6 h-6 rounded flex items-center justify-center text-xs flex-shrink-0"
                  style={{ backgroundColor: `${space.color}30`, color: space.color }}
                >
                  {space.icon || space.name[0]}
                </span>
                {showFull && (
                  <>
                    <span className="flex-1 text-left text-gray-200 truncate">{space.name}</span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${expandedSpaces.has(space.id) ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              {/* Projects */}
              {showFull && expandedSpaces.has(space.id) && (
                <div className="ml-4 pl-3 border-l border-gray-800 mt-1">
                  {space.projects.map(project => (
                    <Link
                      key={project.id}
                      to={`/project/${project.id}/board`}
                      onClick={() => setCurrentProject(project)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5
                        ${currentProject?.id === project.id
                          ? 'bg-brand-500/20 text-brand-400'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                        }
                      `}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="truncate">{project.name}</span>
                    </Link>
                  ))}
                  <button
                    onClick={() => setIsCreateProjectModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors w-full"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add project</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          // No spaces yet - show current space/project from API
          currentSpace && (
            <div className="mb-1">
              <button
                onClick={() => toggleSpace(currentSpace.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors bg-gray-800
                  ${!showFull ? 'justify-center' : ''}
                `}
              >
                <span
                  className="w-6 h-6 rounded flex items-center justify-center text-xs flex-shrink-0"
                  style={{ backgroundColor: `${currentSpace.color}30`, color: currentSpace.color }}
                >
                  {currentSpace.icon || currentSpace.name[0]}
                </span>
                {showFull && (
                  <>
                    <span className="flex-1 text-left text-gray-200 truncate">{currentSpace.name}</span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${expandedSpaces.has(currentSpace.id) ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              {/* Current Project */}
              {showFull && expandedSpaces.has(currentSpace.id) && currentProject && (
                <div className="ml-4 pl-3 border-l border-gray-800 mt-1">
                  <Link
                    to={`/project/${currentProject.id}/board`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 bg-brand-500/20 text-brand-400"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: currentProject.color }}
                    />
                    <span className="truncate">{currentProject.name}</span>
                    <span className="ml-auto text-xs opacity-60">{currentProject.key}</span>
                  </Link>
                  <button
                    onClick={() => setIsCreateProjectModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors w-full"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add project</span>
                  </button>
                </div>
              )}
            </div>
          )
        )}

        {/* Add Space Button */}
        {showFull && (
          <button
            onClick={() => setIsCreateSpaceModalOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors mt-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Space</span>
          </button>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-800 px-2 py-3">
        {bottomNavItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1
              ${isActive(item.path)
                ? 'bg-brand-500/20 text-brand-400'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
              ${!showFull ? 'justify-center' : ''}
            `}
            title={!showFull ? item.label : undefined}
          >
            <span className="text-base">{item.icon}</span>
            {showFull && <span>{item.label}</span>}
          </Link>
        ))}
      </div>

      {/* User Section */}
      {showFull && (
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-medium text-white">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                getInitials(user?.name || 'U')
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
            </div>
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ProjectSidebar;