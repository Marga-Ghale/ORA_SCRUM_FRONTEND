// src/hooks/useStatus.ts
import { useEffect } from 'react';
import { UserStatus, useUpdateStatus } from '../useUsers';

// ============================================
// Auto Status Management Hook
// ============================================

export const useAutoStatus = () => {
  const updateStatus = useUpdateStatus();

  useEffect(() => {
    // Set online when component mounts
    updateStatus.mutate('online');

    // Set offline when page unloads
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery during page unload
      const token = localStorage.getItem('token');
      if (token) {
        const data = JSON.stringify({ status: 'offline' });
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon('/api/users/me', blob);
      }
    };

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateStatus.mutate('away');
      } else {
        updateStatus.mutate('online');
      }
    };

    // Handle focus/blur
    const handleFocus = () => updateStatus.mutate('online');
    const handleBlur = () => updateStatus.mutate('away');

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [updateStatus]);
};

// ============================================
// Manual Status Control Hook
// ============================================

export const useManualStatus = () => {
  const updateStatus = useUpdateStatus();

  const setStatus = (status: UserStatus) => {
    updateStatus.mutate(status);
  };

  const setOnline = () => setStatus('online');
  const setOffline = () => setStatus('offline');
  const setAway = () => setStatus('away');
  const setBusy = () => setStatus('busy');

  return {
    setStatus,
    setOnline,
    setOffline,
    setAway,
    setBusy,
    isPending: updateStatus.isPending,
  };
};
