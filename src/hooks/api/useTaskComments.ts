// src/hooks/useTaskComments.ts
import { useState } from 'react';
import { api } from '../../lib/api';

export const useTaskComments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // List comments
  const listComments = async (taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/tasks/${taskId}/comments`);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch comments');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add comment
  const addComment = async (taskId: string, content: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(`/tasks/${taskId}/comments`, { content });
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update comment
  const updateComment = async (commentId: string, content: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.put(`/tasks/comments/${commentId}`, { content });
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete comment
  const deleteComment = async (commentId: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/tasks/comments/${commentId}`);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    listComments,
    addComment,
    updateComment,
    deleteComment,
  };
};
