/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/hooks/api/useChat.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';
import { queryKeys } from '../../lib/query-client';

// ============================================
// Types
// ============================================

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'project' | 'space' | 'team' | 'direct';
  targetId: string;
  workspaceId: string;
  createdBy: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  // Computed fields
  unreadCount?: number;
  otherUser?: ChatUser;
  lastMessagePreview?: string;
  lastMessageTime?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  messageType: 'text' | 'file' | 'system';
  metadata?: Record<string, unknown>;
  parentId?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user?: ChatUser;
  reactions?: ChatReaction[];
  replyCount?: number;
}

export interface ChatReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user?: ChatUser;
}

export interface ChatChannelMember {
  id: string;
  channelId: string;
  userId: string;
  joinedAt: string;
  lastRead: string;
  user?: {
    ID: string;        // Match backend
    Email: string;     // Match backend
    Name: string;      // Match backend
    Avatar: string | null;
    Status: string;
  };
}

export interface TypingUser {
  userId: string;
  userName: string;
  channelId: string;
}

// ============================================
// Channel Hooks
// ============================================

/**
 * Get all channels for the current user
 */
export function useChannels() {
  return useQuery({
    queryKey: queryKeys.chat.channels(),
    queryFn: async () => {
      const data = await apiClient.get<ChatChannel[]>('/chat/channels');
      return data || [];
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Get channels for a specific workspace
 */
export function useWorkspaceChannels(workspaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.workspaceChannels(workspaceId!),
    queryFn: async () => {
      const data = await apiClient.get<ChatChannel[]>(`/workspaces/${workspaceId}/chat/channels`);
      return data || [];
    },
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
  });
}

/**
 * Get a single channel by ID
 */
export function useChannel(channelId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.channel(channelId!),
    queryFn: () => apiClient.get<ChatChannel>(`/chat/channels/${channelId}`),
    enabled: !!channelId,
    staleTime: 30 * 1000,
  });
}

/**
 * Get channel by target (project, space, team)
 */
export function useChannelByTarget(targetType: string | undefined, targetId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.channelByTarget(targetType!, targetId!),
    queryFn: () =>
      apiClient.get<ChatChannel>(`/chat/channels/find?type=${targetType}&targetId=${targetId}`),
    enabled: !!targetId && !!targetType,
    retry: false, // Don't retry if channel doesn't exist
  });
}

/**
 * Create a new channel
 */
export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      type: string;
      targetId: string;
      workspaceId: string;
      isPrivate?: boolean;
    }) => {
      const response = await apiClient.post<ChatChannel>('/chat/channels', data);
      return response;
    },
    onSuccess: (channel) => {
      toast.success(`Channel "#${channel.name}" created`);
      // Cache the channel immediately so useChannel can find it
      queryClient.setQueryData(queryKeys.chat.channel(channel.id), channel);
      // Then invalidate to refresh the list
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.all });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || error?.message || 'Failed to create channel';
      
      if (message.includes('duplicate') || message.includes('unique') || message.includes('already exists')) {
        toast.error('A channel with this configuration already exists');
      } else {
        toast.error(message);
      }
      
      throw error;
    },
  });
}
/**
 * Create or get a direct message channel
 */
export function useCreateDirectChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; workspaceId: string }) => {
      const response = await apiClient.post<ChatChannel>('/chat/direct', data);
      return response;
    },
    onSuccess: (channel) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.all });
      // Also set the channel in cache
      queryClient.setQueryData(queryKeys.chat.channel(channel.id), channel);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || error?.message || 'Failed to start conversation';
      toast.error(message);
      throw error;
    },
  });
}

/**
 * Delete a channel
 */
export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => apiClient.delete(`/chat/channels/${channelId}`),
    onSuccess: (_, channelId) => {
      toast.success('Channel deleted');
      // Remove from cache and invalidate
      queryClient.removeQueries({ queryKey: queryKeys.chat.channel(channelId) });
      queryClient.removeQueries({ queryKey: queryKeys.chat.messages(channelId) });
      queryClient.removeQueries({ queryKey: queryKeys.chat.members(channelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to delete channel';
      toast.error(message);
    },
  });
}

/**
 * Update a channel
 */
export function useUpdateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      channelId,
      data,
    }: {
      channelId: string;
      data: { name?: string; isPrivate?: boolean };
    }) => apiClient.put<ChatChannel>(`/chat/channels/${channelId}`, data),
    onSuccess: (channel) => {
      toast.success('Channel updated');
      queryClient.setQueryData(queryKeys.chat.channel(channel.id), channel);
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
    },
    onError: () => {
      toast.error('Failed to update channel');
    },
  });
}

// ============================================
// Message Hooks
// ============================================

/**
 * Get messages for a channel with pagination
 */
export function useMessages(channelId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: queryKeys.chat.messages(channelId!, limit, 0),
    queryFn: async () => {
      const data = await apiClient.get<ChatMessage[]>(
        `/chat/channels/${channelId}/messages?limit=${limit}`
      );
      return data || [];
    },
    enabled: !!channelId,
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000, // Refetch every 15 seconds for new messages
  });
}

/**
 * Get messages with infinite scroll
 */
export function useInfiniteMessages(channelId: string | undefined) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.chat.messages(channelId!), 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const data = await apiClient.get<ChatMessage[]>(
        `/chat/channels/${channelId}/messages?limit=50&offset=${pageParam}`
      );
      return data || [];
    },
    enabled: !!channelId,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 50) return undefined;
      return allPages.flat().length;
    },
    initialPageParam: 0,
  });
}

/**
 * Get thread messages (replies)
 */
export function useThreadMessages(parentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.thread(parentId!),
    queryFn: async () => {
      const data = await apiClient.get<ChatMessage[]>(`/chat/messages/${parentId}/thread`);
      return data || [];
    },
    enabled: !!parentId,
    staleTime: 10 * 1000,
  });
}

/**
 * Send a new message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      channelId,
      content,
      messageType = 'text',
      parentId,
    }: {
      channelId: string;
      content: string;
      messageType?: string;
      parentId?: string;
    }) =>
      apiClient.post<ChatMessage>(`/chat/channels/${channelId}/messages`, {
        content,
        messageType,
        parentId,
      }),
    onMutate: async ({ channelId, content, parentId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.messages(channelId) });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(
        queryKeys.chat.messages(channelId)
      );

      // Optimistically add the new message
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        channelId,
        userId: 'current-user',
        content,
        messageType: 'text',
        parentId,
        isEdited: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reactions: [],
      };

      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(channelId),
        (old) => (old ? [optimisticMessage, ...old] : [optimisticMessage])
      );

      return { previousMessages, channelId };
    },
    onError: (_err, { channelId }, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.chat.messages(channelId),
          context.previousMessages
        );
      }
      toast.error('Failed to send message');
    },
    onSuccess: (newMessage, { channelId, parentId }) => {
      // Update the optimistic message with the real one
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(channelId),
        (old) =>
          old?.map((msg) =>
            msg.id.startsWith('temp-') ? newMessage : msg
          ) || [newMessage]
      );

      // If it's a thread reply, invalidate thread
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.thread(parentId) });
      }

      // Update channels to show latest message
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
    },
    onSettled: (_, __, { channelId }) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(channelId) });
    },
  });
}

/**
 * Edit a message
 */
export function useEditMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
      channelId: string;
    }) => apiClient.put<ChatMessage>(`/chat/messages/${messageId}`, { content }),
    onMutate: async ({ messageId, content, channelId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.messages(channelId) });

      const previousMessages = queryClient.getQueryData<ChatMessage[]>(
        queryKeys.chat.messages(channelId)
      );

      // Optimistically update the message
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(channelId),
        (old) =>
          old?.map((msg) =>
            msg.id === messageId
              ? { ...msg, content, isEdited: true, updatedAt: new Date().toISOString() }
              : msg
          )
      );

      return { previousMessages, channelId };
    },
    onError: (_err, { channelId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.chat.messages(channelId),
          context.previousMessages
        );
      }
      toast.error('Failed to edit message');
    },
    onSuccess: () => {
      toast.success('Message updated');
    },
    onSettled: (_, __, { channelId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(channelId) });
    },
  });
}

/**
 * Delete a message
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId }: { messageId: string; channelId: string }) =>
      apiClient.delete(`/chat/messages/${messageId}`),
    onMutate: async ({ messageId, channelId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.messages(channelId) });

      const previousMessages = queryClient.getQueryData<ChatMessage[]>(
        queryKeys.chat.messages(channelId)
      );

      // Optimistically remove the message
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(channelId),
        (old) => old?.filter((m) => m.id !== messageId)
      );

      return { previousMessages, channelId };
    },
    onError: (_err, { channelId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.chat.messages(channelId),
          context.previousMessages
        );
      }
      toast.error('Failed to delete message');
    },
    onSuccess: () => {
      toast.success('Message deleted');
    },
    onSettled: (_, __, { channelId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(channelId) });
    },
  });
}

// ============================================
// Reaction Hooks
// ============================================

/**
 * Add a reaction to a message
 */
export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
      channelId: string;
    }) => apiClient.post(`/chat/messages/${messageId}/reactions`, { emoji }),
    onMutate: async ({ messageId, emoji, channelId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.messages(channelId) });

      const previousMessages = queryClient.getQueryData<ChatMessage[]>(
        queryKeys.chat.messages(channelId)
      );

      // Optimistically add reaction
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(channelId),
        (old) =>
          old?.map((msg) => {
            if (msg.id === messageId) {
              const newReaction: ChatReaction = {
                id: `temp-${Date.now()}`,
                messageId,
                userId: 'current-user',
                emoji,
                createdAt: new Date().toISOString(),
              };
              return {
                ...msg,
                reactions: [...(msg.reactions || []), newReaction],
              };
            }
            return msg;
          })
      );

      return { previousMessages, channelId };
    },
    onError: (_err, { channelId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.chat.messages(channelId),
          context.previousMessages
        );
      }
    },
    onSettled: (_, __, { channelId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(channelId) });
    },
  });
}

/**
 * Remove a reaction from a message
 */
export function useRemoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
      channelId: string;
    }) =>
      apiClient.delete(
        `/chat/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`
      ),
    onMutate: async ({ messageId, emoji, channelId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.messages(channelId) });

      const previousMessages = queryClient.getQueryData<ChatMessage[]>(
        queryKeys.chat.messages(channelId)
      );

      // Optimistically remove reaction
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(channelId),
        (old) =>
          old?.map((msg) => {
            if (msg.id === messageId) {
              return {
                ...msg,
                reactions: msg.reactions?.filter(
                  (r) => !(r.emoji === emoji && r.userId === 'current-user')
                ),
              };
            }
            return msg;
          })
      );

      return { previousMessages, channelId };
    },
    onError: (_err, { channelId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.chat.messages(channelId),
          context.previousMessages
        );
      }
    },
    onSettled: (_, __, { channelId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(channelId) });
    },
  });
}

/**
 * Toggle a reaction (add if not exists, remove if exists)
 */
export function useToggleReaction() {
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();

  return {
    mutate: ({
      messageId,
      emoji,
      channelId,
      hasReacted,
    }: {
      messageId: string;
      emoji: string;
      channelId: string;
      hasReacted: boolean;
    }) => {
      if (hasReacted) {
        removeReaction.mutate({ messageId, emoji, channelId });
      } else {
        addReaction.mutate({ messageId, emoji, channelId });
      }
    },
    isPending: addReaction.isPending || removeReaction.isPending,
  };
}

// ============================================
// Membership Hooks
// ============================================

/**
 * Get channel members
 */
export function useChannelMembers(channelId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.members(channelId!),
    queryFn: async () => {
      const data = await apiClient.get<ChatChannelMember[]>(
        `/chat/channels/${channelId}/members`
      );
      return data || [];
    },
    enabled: !!channelId,
    staleTime: 60 * 1000,
  });
}

/**
 * Join a channel
 */
export function useJoinChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ channelId, userId }: { channelId: string; userId?: string }) => {
      if (userId) {
        // Adding another user to channel
        return apiClient.post(`/chat/channels/${channelId}/members/add`, { userId });
      }
      // Current user joining
      return apiClient.post(`/chat/channels/${channelId}/join`);
    },
    onSuccess: (_, { channelId }) => {
      toast.success('Member added');
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.members(channelId) });
    },
    onError: () => {
      toast.error('Failed to add member');
    },
  });
}
/**
 * Leave a channel or remove a member
 */
export function useLeaveChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ channelId, userId }: { channelId: string; userId?: string }) => {
      if (userId) {
        // Remove specific user from channel
        return apiClient.post(`/chat/channels/${channelId}/members/remove`, { userId });
      }
      // Current user leaving
      return apiClient.post(`/chat/channels/${channelId}/leave`);
    },
    onSuccess: (_, { channelId }) => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.members(channelId) });
    },
    onError: () => {
      toast.error('Failed to remove member');
    },
  });
}
/**
 * Mark channel as read
 */
export function useMarkChannelRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => apiClient.post(`/chat/channels/${channelId}/read`),
    onMutate: async (channelId) => {
      // Optimistically update unread counts
      const previousCounts = queryClient.getQueryData<Record<string, number>>(
        queryKeys.chat.unreadCounts()
      );

      if (previousCounts) {
        queryClient.setQueryData<Record<string, number>>(
          queryKeys.chat.unreadCounts(),
          { ...previousCounts, [channelId]: 0 }
        );
      }

      return { previousCounts };
    },
    onError: (_err, _channelId, context) => {
      if (context?.previousCounts) {
        queryClient.setQueryData(queryKeys.chat.unreadCounts(), context.previousCounts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.unreadCounts() });
    },
  });
}

// ============================================
// Unread Counts
// ============================================

/**
 * Get all unread counts
 */
export function useUnreadCounts() {
  return useQuery({
    queryKey: queryKeys.chat.unreadCounts(),
    queryFn: async () => {
      const data = await apiClient.get<Record<string, number>>('/chat/unread');
      return data || {};
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

/**
 * Get total unread count across all channels
 */
export function useTotalUnreadCount() {
  const { data: unreadCounts } = useUnreadCounts();

  if (!unreadCounts) return 0;
  return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
}

// ============================================
// Search Hooks
// ============================================

/**
 * Search messages in a channel
 */
export function useSearchMessages(channelId: string | undefined, query: string) {
  return useQuery({
    queryKey: [...queryKeys.chat.messages(channelId!), 'search', query],
    queryFn: async () => {
      const data = await apiClient.get<ChatMessage[]>(
        `/chat/channels/${channelId}/messages/search?q=${encodeURIComponent(query)}`
      );
      return data || [];
    },
    enabled: !!channelId && query.length >= 2,
    staleTime: 60 * 1000,
  });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format message time
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' }) + 
      ` at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format full timestamp for tooltips
 */
export function formatFullTimestamp(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Group messages by date
 */
export function groupMessagesByDate(
  messages: ChatMessage[]
): { date: string; messages: ChatMessage[] }[] {
  const groups: Record<string, ChatMessage[]> = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  messages.forEach((message) => {
    const date = new Date(message.createdAt);
    let key: string;

    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(message);
  });

  // Convert to array and maintain order
  return Object.entries(groups).map(([date, msgs]) => ({
    date,
    messages: msgs,
  }));
}

/**
 * Get channel display name
 */
export function getChannelDisplayName(channel: ChatChannel, _currentUserId?: string): string {
  if (channel.type === 'direct' && channel.otherUser) {
    // Backend returns capitalized "Name" field
    const otherUser = channel.otherUser as any;
    return otherUser.Name || otherUser.name || 'Unknown User';
  }
  return channel.name || 'Unknown Channel';
}
/**
 * Get channel icon
 */
export function getChannelIcon(type: ChatChannel['type']): string {
  switch (type) {
    case 'direct':
      return '👤';
    case 'project':
      return '#';
    case 'space':
      return '📁';
    case 'team':
      return '👥';
    default:
      return '#';
  }
}

/**
 * Check if user has reacted with specific emoji
 */
export function hasUserReacted(
  reactions: ChatReaction[] | undefined,
  userId: string,
  emoji: string
): boolean {
  if (!reactions) return false;
  return reactions.some((r) => r.userId === userId && r.emoji === emoji);
}

/**
 * Get grouped reactions with counts
 */
export function getGroupedReactions(
  reactions: ChatReaction[] | undefined
): { emoji: string; count: number; userIds: string[] }[] {
  if (!reactions?.length) return [];

  const groups: Record<string, { emoji: string; count: number; userIds: string[] }> = {};

  reactions.forEach((r) => {
    if (!groups[r.emoji]) {
      groups[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] };
    }
    groups[r.emoji].count++;
    groups[r.emoji].userIds.push(r.userId);
  });

  return Object.values(groups).sort((a, b) => b.count - a.count);
}

// Common emoji reactions
export const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👀', '✅', '👏'];

// Channel type labels
export const CHANNEL_TYPE_LABELS: Record<ChatChannel['type'], string> = {
  project: 'Project Channel',
  space: 'Space Channel',
  team: 'Team Channel',
  direct: 'Direct Message',
};

// Channel type colors
export const CHANNEL_TYPE_COLORS: Record<ChatChannel['type'], string> = {
  project: '#6366f1', // Indigo
  space: '#8b5cf6', // Purple
  team: '#10b981', // Green
  direct: '#ec4899', // Pink
};