import { Hash, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

// ProjectItem Component (unchanged)
export interface ProjectItemProps {
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

export const ProjectItem: React.FC<ProjectItemProps> = ({
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
      className="relative group mb-0.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={`/project/${project.id || (project as any).ID}/board`}
        onClick={() => {
          setCurrentSpace(space);
          setCurrentProject(project);
        }}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium 
          transition-all duration-200 group/link
          active:scale-[0.98]
          ${
            isProjectActive(project.id)
              ? 'bg-violet-100 dark:bg-[#7c3aed]/15 text-violet-700 dark:text-[#a78bfa] shadow-sm'
              : 'text-gray-700 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-[#25282c] hover:text-gray-900 dark:hover:text-white'
          }`}
      >
        <div
          className={`p-1 rounded-lg transition-all duration-200
          ${
            isProjectActive(project.id)
              ? 'bg-violet-200 dark:bg-[#7c3aed]/30 scale-105'
              : 'bg-gray-100 dark:bg-[#25282c] group-hover/link:bg-gray-200 dark:group-hover/link:bg-[#2a2e33] group-hover/link:scale-105'
          }`}
        >
          <Hash
            className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 group-hover/link:rotate-12"
            style={{ color: project.color || space.color }}
          />
        </div>
        <span className="truncate flex-1">{project.name}</span>
        <span
          className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-md
            transition-all duration-200
            ${
              isHovered || isProjectActive(project.id)
                ? 'opacity-100 translate-x-0 bg-gray-200 dark:bg-[#2a2e33] text-gray-700 dark:text-[#6b7280]'
                : 'opacity-0 translate-x-2 pointer-events-none'
            }`}
        >
          {project.key}
        </span>
      </Link>

      <button
        onClick={(e) => onManageMembers('project', project.id, project.name, e)}
        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg 
          bg-gray-200 dark:bg-[#25282c] 
          hover:bg-gray-300 dark:hover:bg-[#2a2e33] 
          text-gray-600 dark:text-[#6b7280] 
          hover:text-gray-900 dark:hover:text-white 
          transition-all duration-200 hover:scale-110 active:scale-95
          shadow-sm hover:shadow-md
          ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`}
        title="Manage members"
      >
        <UserPlus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
