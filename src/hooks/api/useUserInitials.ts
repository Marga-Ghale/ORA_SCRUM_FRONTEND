import { useMemo } from 'react';
import { EntityType, useEffectiveMembers } from './useMembers';

// ============================================
// Helpers
// ============================================

const getInitials = (name?: string) => {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '?';

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ============================================
// Hook
// ============================================

export const useUserInitials = (
  entityType: EntityType,
  entityId: string,
  assigneeIds: string[] = []
) => {
  const { data, isLoading } = useEffectiveMembers(entityType, entityId, {
    enabled: Boolean(entityId),
  });

  const initialsByUserId = useMemo(() => {
    const map: Record<string, string> = {};

    // ✅ FIXED: data is already the array, not data.data
    if (!data || assigneeIds.length === 0) {
      return map;
    }

    for (const member of data) {
      const user = member.user;
      if (!user) continue;

      if (assigneeIds.includes(user.id)) {
        map[user.id] = getInitials(user.name);
      }
    }

    return map;
  }, [data, assigneeIds]);

  return {
    initialsByUserId,
    isLoading,
  };
};
