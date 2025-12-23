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
