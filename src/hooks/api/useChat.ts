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
  user?: ChatUser;
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
    queryFn: () => apiClient.get<ChatChannel[]>('/chat/channels'),
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
    queryFn: () => apiClient.get<ChatChannel[]>(`/workspaces/${workspaceId}/channels`),
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
  });
}

/**
 * Get channel by target (project, space, team)
 */
export function useChannelByTarget(targetType: string, targetId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.channelByTarget(targetType, targetId!),
    queryFn: () =>
      apiClient.get<ChatChannel>(`/chat/channels/target?type=${targetType}&targetId=${targetId}`),
    enabled: !!targetId,
  });
}

/**
 * Create a new channel
 */
export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      type: string;
      targetId: string;
      workspaceId: string;
      isPrivate?: boolean;
    }) => apiClient.post<ChatChannel>('/chat/channels', data),
    onSuccess: (channel) => {
      toast.success(`Channel "${channel.name}" created`);
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
    },
    onError: () => {
      toast.error('Failed to create channel');
    },
  });
}

/**
 * Create or get a direct message channel
 */
export function useCreateDirectChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: string; workspaceId: string }) =>
      apiClient.post<ChatChannel>('/chat/direct', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
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
    onSuccess: () => {
      toast.success('Channel deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
    },
    onError: () => {
      toast.error('Failed to delete channel');
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
    queryKey: queryKeys.chat.messages(channelId!),
    queryFn: () =>
      apiClient.get<ChatMessage[]>(`/chat/channels/${channelId}/messages?limit=${limit}`),
    enabled: !!channelId,
    staleTime: 10 * 1000,
  });
}

/**
 * Get messages with infinite scroll
 */
export function useInfiniteMessages(channelId: string | undefined) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.chat.messages(channelId!), 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      apiClient.get<ChatMessage[]>(
        `/chat/channels/${channelId}/messages?limit=50&offset=${pageParam}`
      ),
    enabled: !!channelId,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 50) return undefined;
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
    queryFn: () => apiClient.get<ChatMessage[]>(`/chat/messages/${parentId}/thread`),
    enabled: !!parentId,
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
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.chat.messages(channelId) });

      const previousMessages = queryClient.getQueryData<ChatMessage[]>(
        queryKeys.chat.messages(channelId)
      );

      // Add optimistic message
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
      };

      queryClient.setQueryData<ChatMessage[]>(queryKeys.chat.messages(channelId), (old) =>
        old ? [optimisticMessage, ...old] : [optimisticMessage]
      );

      return { previousMessages };
    },
    onError: (_err, { channelId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKeys.chat.messages(channelId), context.previousMessages);
      }
      toast.error('Failed to send message');
    },
    onSettled: (_, __, { channelId, parentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(channelId) });
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.thread(parentId) });
      }
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
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(channelId) });
      toast.success('Message updated');
    },
    onError: () => {
      toast.error('Failed to edit message');
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

      queryClient.setQueryData<ChatMessage[]>(queryKeys.chat.messages(channelId), (old) =>
        old?.filter((m) => m.id !== messageId)
      );

      return { previousMessages };
    },
    onError: (_err, { channelId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKeys.chat.messages(channelId), context.previousMessages);
      }
      toast.error('Failed to delete message');
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
    onSuccess: (_, { channelId }) => {
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
      apiClient.delete(`/chat/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`),
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(channelId) });
    },
  });
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
    queryFn: () => apiClient.get<ChatChannelMember[]>(`/chat/channels/${channelId}/members`),
    enabled: !!channelId,
  });
}

/**
 * Join a channel
 */
export function useJoinChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => apiClient.post(`/chat/channels/${channelId}/join`),
    onSuccess: (_, channelId) => {
      toast.success('Joined channel');
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.members(channelId) });
    },
  });
}

/**
 * Leave a channel
 */
export function useLeaveChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => apiClient.post(`/chat/channels/${channelId}/leave`),
    onSuccess: () => {
      toast.success('Left channel');
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
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
    onSuccess: () => {
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
    queryFn: () => apiClient.get<Record<string, number>>('/chat/unread'),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
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

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Group messages by date
 */
export function groupMessagesByDate(messages: ChatMessage[]): Record<string, ChatMessage[]> {
  const groups: Record<string, ChatMessage[]> = {};

  messages.forEach((message) => {
    const date = new Date(message.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

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

  return groups;
}

/**
 * Get channel display name
 */
export function getChannelDisplayName(channel: ChatChannel, currentUserId?: string): string {
  if (channel.type === 'direct' && channel.otherUser) {
    return channel.otherUser.name;
  }
  return channel.name;
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

// Common emoji reactions
export const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👀'];