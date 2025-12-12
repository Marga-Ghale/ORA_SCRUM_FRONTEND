import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useSidebar } from '../context/SidebarContext';
import { useProject } from '../context/ProjectContext';

const ProjectSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { currentWorkspace, currentSpace, currentProject, setCurrentSpace, setCurrentProject } = useProject();
  const location = useLocation();
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set([currentSpace?.id || '']));

  const isActive = (path: string) => location.pathname === path;
  const showFull = isExpanded || isHovered || isMobileOpen;

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
    { icon: '📊', label: 'Dashboard', path: '/dashboard' },
  ];

  const bottomNavItems = [
    { icon: '👥', label: 'Team', path: '/team' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

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
            OS
          </div>
          {showFull && (
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate">{currentWorkspace.name}</h2>
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
            <button className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}

        {currentWorkspace.spaces.map(space => (
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
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors w-full">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add project</span>
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add Space Button */}
        {showFull && (
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors mt-2">
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
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-medium">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-gray-400 truncate">john@orascrum.com</p>
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
