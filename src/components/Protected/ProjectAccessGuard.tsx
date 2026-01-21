// src/components/Protected/ProjectAccessGuard.tsx
import { Navigate, useParams } from 'react-router-dom';
import { useAccessibleSpaces, useAccessibleProjects } from '../../hooks/api/useAccessibleEntities';
import { useAuth } from '../UserProfile/AuthContext';
import { useMemo } from 'react';

export default function ProjectAccessGuard({ children }: { children: React.ReactNode }) {
  const { projectId } = useParams();
  const { user } = useAuth();

  // ✅ Fetch accessible spaces and projects
  const { data: accessibleSpaces, isLoading: spacesLoading } = useAccessibleSpaces({
    enabled: !!user,
  });

  const { data: accessibleProjects, isLoading: projectsLoading } = useAccessibleProjects({
    enabled: !!user,
  });

  // ✅ Check if user can access this specific project
  const canAccessProject = useMemo(() => {
    if (!projectId || !accessibleProjects || !accessibleSpaces) return false;

    // Find the project
    const project = accessibleProjects.find((p) => p.id === projectId);

    if (!project) {
      return false; // Project doesn't exist or user has no access
    }

    // Check if user has access to the project's parent space
    const parentSpace = accessibleSpaces.find((s) => s.id === project.spaceId);

    return !!parentSpace;
  }, [projectId, accessibleProjects, accessibleSpaces]);

  // ✅ Show loading state while checking access
  if (spacesLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  // ✅ Block access and show toast if user cannot access
  if (!canAccessProject) {
    // Show toast notification

    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
