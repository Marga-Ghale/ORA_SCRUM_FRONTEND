// src/hooks/useTaskActivity.ts
import { useState } from 'react';
import { api } from '../../lib/api';

export const useTaskActivity = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get task activity
  const getActivity = async (taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/tasks/${taskId}/activity`);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch activity');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getActivity,
  };
};
