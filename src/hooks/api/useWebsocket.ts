// ✅ ENHANCED: src/hooks/api/useWebsocket.ts
// Added handlers for workspace, space, folder, project CRUD events

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../components/UserProfile/AuthContext';
import { queryKeys } from '../../lib/query-client';
import { NotificationType } from './useNotifications';
import { ChatMessage, ChatReaction } from './useChat';

// ✅ UPDATED: Added entity CRUD event types
export type WebSocketEventType =
  | 'notification'
  | 'notification_count'
  // Task events
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_assigned'
  | 'task_status_changed'
  // Sprint events
  | 'sprint_started'
  | 'sprint_completed'
  // Comment events
  | 'comment_added'
  // Member events
  | 'member_added'
  | 'member_removed'
  // User presence
  | 'user_online'
  | 'user_offline'
  // Connection events
  | 'ping'
  | 'pong'
  | 'ack'
  // Chat events
  | 'chat_message'
  | 'chat_message_updated'
  | 'chat_message_deleted'
  | 'chat_channel_created'
  | 'chat_channel_updated'
  | 'chat_channel_deleted'
  | 'chat_member_added'
  | 'chat_member_removed'
  | 'chat_reaction_added'
  | 'chat_reaction_removed'
  // ✅ NEW: Workspace CRUD events
  | 'workspace_created'
  | 'workspace_updated'
  | 'workspace_deleted'
  // ✅ NEW: Space CRUD events
  | 'space_created'
  | 'space_updated'
  | 'space_deleted'
  // ✅ NEW: Folder CRUD events
  | 'folder_created'
  | 'folder_updated'
  | 'folder_deleted'
  // ✅ NEW: Project CRUD events
  | 'project_created'
  | 'project_updated'
  | 'project_deleted';

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload?: Record<string, unknown>;
  data?: Record<string, unknown>;
  room?: string;
  timestamp?: string;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface RoomOperation {
  action: 'join' | 'leave';
  room: string;
}

// ============================================
// MESSAGE DEDUPLICATION
// ============================================

interface ProcessedMessage {
  id: string;
  timestamp: number;
}

const processedMessages = new Map<string, ProcessedMessage>();
const MESSAGE_DEDUP_WINDOW_MS = 2000; // 2 second window

/**
 * Clean up old processed messages
 */
function cleanupProcessedMessages() {
  const now = Date.now();
  const entriesToDelete: string[] = [];

  processedMessages.forEach((msg, id) => {
    if (now - msg.timestamp > MESSAGE_DEDUP_WINDOW_MS) {
      entriesToDelete.push(id);
    }
  });

  entriesToDelete.forEach((id) => processedMessages.delete(id));
}

function shouldProcessMessage(message: WebSocketMessage): boolean {
  cleanupProcessedMessages();

  const messageData = message.payload || message.data || {};
  const messageId = messageData.messageId as string | undefined;
  const channelId = messageData.channelId as string | undefined;
  const content = messageData.content as string | undefined;
  const entityId = messageData.id as string | undefined;

  // ✅ For chat messages, use messageId if available
  if (message.type === 'chat_message' && messageId) {
    const dedupKey = `chat-msg-${messageId}`;
    if (processedMessages.has(dedupKey)) {
      console.log('[WebSocket] 🚫 Duplicate chat message blocked:', messageId);
      return false;
    }
    processedMessages.set(dedupKey, { id: dedupKey, timestamp: Date.now() });
    return true;
  }

  // ✅ For notifications with ID
  if (message.type === 'notification' && messageData.id) {
    const dedupKey = `notification-${messageData.id}`;
    if (processedMessages.has(dedupKey)) {
      return false;
    }
    processedMessages.set(dedupKey, { id: dedupKey, timestamp: Date.now() });
    return true;
  }

  // ✅ For entity CRUD events (workspace, space, folder, project)
  if (
    message.type.includes('workspace_') ||
    message.type.includes('space_') ||
    message.type.includes('folder_') ||
    message.type.includes('project_')
  ) {
    const dedupKey = `${message.type}-${entityId || Date.now()}`;
    if (processedMessages.has(dedupKey)) {
      console.log('[WebSocket] 🚫 Duplicate entity event blocked:', message.type, entityId);
      return false;
    }
    processedMessages.set(dedupKey, { id: dedupKey, timestamp: Date.now() });
    return true;
  }

  // ✅ Fallback for other messages
  const dedupKey = `${message.type}-${channelId || ''}-${content?.substring(0, 20) || Date.now()}`;
  if (processedMessages.has(dedupKey)) {
    return false;
  }
  processedMessages.set(dedupKey, { id: dedupKey, timestamp: Date.now() });
  return true;
}

// ============================================
// WEBSOCKET HOOK
// ============================================

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;

  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  const pendingOperationsRef = useRef<RoomOperation[]>([]);
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const getWsUrl = useCallback(() => {
    if (!token) return null;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    const baseUrl = apiUrl.replace('/api', '');
    const protocol = baseUrl.startsWith('https') ? 'wss:' : 'ws:';
    const host = baseUrl.replace(/^https?:\/\//, '');
    return `${protocol}//${host}/api/ws?token=${token}`;
  }, [token]);

  const processMessage = useCallback(
    (message: WebSocketMessage) => {
      // ✅ Check if we should process this message (deduplication)
      if (!shouldProcessMessage(message)) {
        console.log('[WebSocket] 🚫 DUPLICATE MESSAGE BLOCKED:', message.type);
        return;
      }

      const messageData = message.payload || message.data || {};

      // ✅ LOG ALL CHAT EVENTS
      if (message.type.startsWith('chat_')) {
        console.group(`[WebSocket] 🔔 ${message.type}`);
        console.log('Raw message:', message);
        console.log('Message data:', messageData);
        console.log('Timestamp:', new Date().toISOString());
        console.groupEnd();
      }

      // ✅ LOG ENTITY CRUD EVENTS
      if (
        message.type.includes('workspace_') ||
        message.type.includes('space_') ||
        message.type.includes('folder_') ||
        message.type.includes('project_')
      ) {
        console.group(`[WebSocket] 📦 ${message.type}`);
        console.log('Entity data:', messageData);
        console.log('Timestamp:', new Date().toISOString());
        console.groupEnd();
      }

      if (
        message.type !== 'ping' &&
        message.type !== 'pong' &&
        message.type !== 'user_online' &&
        message.type !== 'user_offline'
      ) {
        console.log('[WebSocket] Processing:', message.type, messageData);
      }

      // Track successful room joins
      if (message.type === 'ack' && messageData.action === 'joined' && messageData.room) {
        joinedRoomsRef.current.add(messageData.room as string);
        console.log('[WebSocket] ✅ Confirmed joined room:', messageData.room);
      }

      if (message.type === 'notification') {
        setLastMessage(message);
      }

      switch (message.type) {
        case 'notification':
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

          if (messageData && typeof messageData === 'object') {
            const notificationType = messageData.type as string;

            if (notificationType === 'CHAT_MESSAGE') {
              console.group('[WebSocket] 💬 CHAT MESSAGE VIA NOTIFICATION');

              const channelId = (messageData as any).data?.channelId;

              if (channelId) {
                console.log('📍 Invalidating messages for channel:', channelId);

                queryClient.invalidateQueries({
                  queryKey: queryKeys.chat.messages(channelId, 50, 0),
                  refetchType: 'active',
                });

                queryClient.invalidateQueries({
                  queryKey: queryKeys.chat.channels(),
                  refetchType: 'active',
                });

                console.log('✅ Chat queries invalidated');
              }

              console.groupEnd();
            }

            import('../../lib/NotificationToast').then(({ showWebSocketNotificationToast }) => {
              showWebSocketNotificationToast(
                message.type.toUpperCase() as NotificationType,
                messageData
              );
            });
          }
          break;

        case 'notification_count':
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
          break;

        // ============================================
        // ✅ NEW: WORKSPACE CRUD EVENTS
        // ============================================
        case 'workspace_created':
        case 'workspace_updated':
        case 'workspace_deleted':
          console.log('[WebSocket] 🏢 Workspace change:', message.type, messageData);

          // Invalidate all workspace-related queries
          queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.list() });
          queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.my() });
          queryClient.invalidateQueries({ queryKey: queryKeys.members.accessibleWorkspaces() });

          // If specific workspace ID provided, invalidate detail
          if (messageData.id || messageData.workspaceId) {
            const wsId = (messageData.id || messageData.workspaceId) as string;
            queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.detail(wsId) });
          }
          break;

        // ============================================
        // ✅ NEW: SPACE CRUD EVENTS
        // ============================================
        case 'space_created':
        case 'space_updated':
        case 'space_deleted':
          console.log('[WebSocket] 📁 Space change:', message.type, messageData);

          // Invalidate all space-related queries
          queryClient.invalidateQueries({ queryKey: queryKeys.spaces.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.spaces.list() });
          queryClient.invalidateQueries({ queryKey: queryKeys.members.accessibleSpaces() });
          queryClient.invalidateQueries({ queryKey: queryKeys.members.visibleSpaces() });

          // If workspace ID provided, invalidate workspace-specific space list
          if (messageData.workspaceId) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.spaces.byWorkspace(messageData.workspaceId as string),
            });
          }

          // If specific space ID provided, invalidate detail
          if (messageData.id || messageData.spaceId) {
            const spaceId = (messageData.id || messageData.spaceId) as string;
            queryClient.invalidateQueries({ queryKey: queryKeys.spaces.detail(spaceId) });
          }
          break;

        // ============================================
        // ✅ NEW: FOLDER CRUD EVENTS
        // ============================================
        case 'folder_created':
        case 'folder_updated':
        case 'folder_deleted':
          console.log('[WebSocket] 📂 Folder change:', message.type, messageData);

          // Invalidate all folder-related queries
          queryClient.invalidateQueries({ queryKey: queryKeys.folders.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.folders.list() });
          queryClient.invalidateQueries({ queryKey: queryKeys.folders.byUser() });
          queryClient.invalidateQueries({ queryKey: queryKeys.members.accessibleFolders() });

          // If space ID provided, invalidate space-specific folder list
          if (messageData.spaceId) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.folders.bySpace(messageData.spaceId as string),
            });
            queryClient.invalidateQueries({
              queryKey: queryKeys.spaces.folders(messageData.spaceId as string),
            });
          }

          // If specific folder ID provided, invalidate detail
          if (messageData.id || messageData.folderId) {
            const folderId = (messageData.id || messageData.folderId) as string;
            queryClient.invalidateQueries({ queryKey: queryKeys.folders.detail(folderId) });
          }
          break;

        // ============================================
        // ✅ NEW: PROJECT CRUD EVENTS
        // ============================================
        case 'project_created':
        case 'project_updated':
        case 'project_deleted':
          console.log('[WebSocket] 📋 Project change:', message.type, messageData);

          // Invalidate all project-related queries
          queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() });
          queryClient.invalidateQueries({ queryKey: queryKeys.members.accessibleProjects() });

          // If space ID provided, invalidate space-specific project list
          if (messageData.spaceId) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.projects.bySpace(messageData.spaceId as string),
            });
            queryClient.invalidateQueries({
              queryKey: queryKeys.spaces.projects(messageData.spaceId as string),
            });
          }

          // If folder ID provided, invalidate folder-specific project list
          if (messageData.folderId) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.projects.byFolder(messageData.folderId as string),
            });
            queryClient.invalidateQueries({
              queryKey: queryKeys.folders.projects(messageData.folderId as string),
            });
          }

          // If specific project ID provided, invalidate detail
          if (messageData.id || messageData.projectId) {
            const projectId = (messageData.id || messageData.projectId) as string;
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
          }
          break;

        // ============================================
        // TASK EVENTS
        // ============================================
        case 'task_created':
        case 'task_updated':
        case 'task_deleted':
        case 'task_assigned':
        case 'task_status_changed':
          if (messageData.projectId) {
            queryClient.invalidateQueries({
              queryKey: ['tasks', 'project', messageData.projectId],
            });
          }
          if (messageData.sprintId) {
            queryClient.invalidateQueries({
              queryKey: ['tasks', 'sprint', messageData.sprintId],
            });
          }
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
          break;

        case 'sprint_started':
        case 'sprint_completed':
          if (messageData.projectId) {
            queryClient.invalidateQueries({
              queryKey: ['sprints', 'project', messageData.projectId],
            });
          }
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
          break;

        case 'comment_added':
          if (messageData.taskId) {
            queryClient.invalidateQueries({
              queryKey: ['comments', 'task', messageData.taskId],
            });
          }
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
          break;

        // ============================================
        // ✅ MEMBER EVENTS - Also refresh entity lists
        // ============================================
        case 'member_added':
        case 'member_removed':
          console.log('[WebSocket] 👥 Member change:', message.type, messageData);

          // Invalidate member queries
          if (messageData.entityType && messageData.entityId) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.members.effective(
                messageData.entityType as string,
                messageData.entityId as string
              ),
            });
            queryClient.invalidateQueries({
              queryKey: queryKeys.members.direct(
                messageData.entityType as string,
                messageData.entityId as string
              ),
            });
          }

          // ✅ Also invalidate accessible entities since membership changed
          queryClient.invalidateQueries({ queryKey: queryKeys.members.accessibleWorkspaces() });
          queryClient.invalidateQueries({ queryKey: queryKeys.members.accessibleSpaces() });
          queryClient.invalidateQueries({ queryKey: queryKeys.members.accessibleFolders() });
          queryClient.invalidateQueries({ queryKey: queryKeys.members.accessibleProjects() });
          queryClient.invalidateQueries({ queryKey: queryKeys.members.visibleSpaces() });
          break;

        case 'user_online':
        case 'user_offline':
          break;

        case 'ping':
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: 'pong' }));
          }
          break;

        // ============================================
        // CHAT EVENTS
        // ============================================
        case 'chat_message':
          console.group('[WebSocket] 📨 PROCESSING CHAT MESSAGE');

          if (messageData.channelId) {
            const channelId = messageData.channelId as string;

            // ✅ FIX: Extract the actual message from nested structure
            const rawMessage = (messageData as any).message || messageData;

            // ✅ FIX: Normalize user data (backend sends capitalized fields)
            const normalizedMessage: ChatMessage = {
              id: rawMessage.id || rawMessage.ID,
              channelId: rawMessage.channelId || rawMessage.ChannelID,
              userId: rawMessage.userId || rawMessage.UserID,
              content: rawMessage.content || rawMessage.Content,
              messageType: rawMessage.messageType || rawMessage.MessageType || 'text',
              parentId: rawMessage.parentId || rawMessage.ParentID,
              isEdited: rawMessage.isEdited || rawMessage.IsEdited || false,
              createdAt: rawMessage.createdAt || rawMessage.CreatedAt || new Date().toISOString(),
              updatedAt: rawMessage.updatedAt || rawMessage.UpdatedAt || new Date().toISOString(),
              reactions: rawMessage.reactions || rawMessage.Reactions || [],
              user:
                rawMessage.user || rawMessage.User
                  ? {
                      id: rawMessage.user?.id || rawMessage.user?.ID || rawMessage.User?.ID,
                      name: rawMessage.user?.name || rawMessage.user?.Name || rawMessage.User?.Name,
                      email:
                        rawMessage.user?.email || rawMessage.user?.Email || rawMessage.User?.Email,
                      avatar:
                        rawMessage.user?.avatar ||
                        rawMessage.user?.Avatar ||
                        rawMessage.User?.Avatar,
                    }
                  : undefined,
            };

            console.log('📍 Normalized message:', {
              id: normalizedMessage.id,
              userId: normalizedMessage.userId,
              userName: normalizedMessage.user?.name,
              createdAt: normalizedMessage.createdAt,
            });

            const messagesQueryKey = queryKeys.chat.messages(channelId, 50, 0);

            queryClient.setQueryData<ChatMessage[]>(messagesQueryKey, (old) => {
              if (!old) return [normalizedMessage];

              const exists = old.some((msg) => msg.id === normalizedMessage.id);
              if (exists) {
                console.log('⚠️ Message already exists');
                return old;
              }

              console.log('✅ Adding normalized message to cache');
              return [normalizedMessage, ...old];
            });

            queryClient.setQueryData<Record<string, number>>(
              queryKeys.chat.unreadCounts(),
              (old) => {
                const current = old || {};
                return {
                  ...current,
                  [channelId]: (current[channelId] || 0) + 1,
                };
              }
            );

            queryClient.invalidateQueries({
              queryKey: queryKeys.chat.channels(),
              refetchType: 'active',
            });
          }

          console.groupEnd();
          break;

        case 'chat_message_updated':
        case 'chat_message_deleted':
          console.group(`[WebSocket] 🔄 ${message.type}`);

          if (messageData.channelId) {
            const channelId = messageData.channelId as string;
            const messageId = messageData.messageId as string;
            const messagesQueryKey = queryKeys.chat.messages(channelId, 50, 0);

            console.log('Processing message update/delete', {
              channelId,
              messageId,
              type: message.type,
            });

            const beforeUpdate = queryClient.getQueryData<ChatMessage[]>(messagesQueryKey);
            console.log('Messages before update:', beforeUpdate?.length);

            queryClient.setQueryData<ChatMessage[]>(messagesQueryKey, (old) => {
              if (!old) return old;

              if (message.type === 'chat_message_deleted') {
                const filtered = old.filter((msg) => msg.id !== messageId);
                console.log('After delete:', { before: old.length, after: filtered.length });
                return filtered;
              } else {
                const updated = old.map((msg) =>
                  msg.id === messageId ? { ...msg, ...(messageData as Partial<ChatMessage>) } : msg
                );
                console.log('After update: same count but message modified');
                return updated;
              }
            });

            const afterUpdate = queryClient.getQueryData<ChatMessage[]>(messagesQueryKey);
            console.log('Messages after update:', afterUpdate?.length);
          }

          console.groupEnd();
          break;

        case 'chat_channel_created':
        case 'chat_channel_updated':
        case 'chat_channel_deleted':
          console.log('[WebSocket] 📢 Channel update:', message.type);
          queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
          break;

        case 'chat_member_added':
        case 'chat_member_removed':
          if (messageData.channelId) {
            const channelId = messageData.channelId as string;
            console.log('[WebSocket] 👥 Member update:', { channelId, type: message.type });

            queryClient.invalidateQueries({
              queryKey: queryKeys.chat.members(channelId),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
          }
          break;

        case 'chat_reaction_added':
        case 'chat_reaction_removed':
          console.group(`[WebSocket] 😀 ${message.type}`);

          if (messageData.channelId && messageData.messageId) {
            const channelId = messageData.channelId as string;
            const messageId = messageData.messageId as string;
            const messagesQueryKey = queryKeys.chat.messages(channelId, 50, 0);

            console.log('Processing reaction', {
              channelId,
              messageId,
              emoji: messageData.emoji,
              userId: messageData.userId,
            });

            queryClient.setQueryData<ChatMessage[]>(messagesQueryKey, (old) => {
              if (!old) {
                console.log('No messages in cache');
                return old;
              }

              return old.map((msg) => {
                if (msg.id !== messageId) return msg;

                console.log('Found target message, updating reactions');

                if (message.type === 'chat_reaction_added') {
                  const newReaction = messageData.reaction as ChatReaction;
                  const updated = {
                    ...msg,
                    reactions: [...(msg.reactions || []), newReaction],
                  };
                  console.log('Added reaction:', {
                    before: msg.reactions?.length || 0,
                    after: updated.reactions.length,
                  });
                  return updated;
                } else {
                  const emoji = messageData.emoji as string;
                  const userId = messageData.userId as string;
                  const updated = {
                    ...msg,
                    reactions: msg.reactions?.filter(
                      (r) => !(r.emoji === emoji && r.userId === userId)
                    ),
                  };
                  console.log('Removed reaction:', {
                    before: msg.reactions?.length || 0,
                    after: updated.reactions?.length || 0,
                  });
                  return updated;
                }
              });
            });
          }

          console.groupEnd();
          break;
      }

      onMessage?.(message);
    },
    [queryClient, onMessage]
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        // Split by newlines and filter empty lines
        const lines = event.data.split('\n').filter((line: string) => line.trim());

        // Process each JSON message separately
        for (const line of lines) {
          try {
            const message: WebSocketMessage = JSON.parse(line);
            processMessage(message);
          } catch (err) {
            console.error('[WebSocket] Failed to parse message line:', err, 'Line:', line);
          }
        }
      } catch (error) {
        console.error('[WebSocket] Failed to process messages:', error);
      }
    },
    [processMessage]
  );

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    isConnectingRef.current = false;
    setIsConnected(false);
    joinedRoomsRef.current.clear();
  }, []);

  const processPendingOperations = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;

    console.log(`[WebSocket] Processing ${pendingOperationsRef.current.length} pending operations`);

    pendingOperationsRef.current.forEach((op) => {
      const message = { action: op.action, room: op.room };
      wsRef.current?.send(JSON.stringify(message));
      console.log(`[WebSocket] Sent queued ${op.action} for room:`, op.room);
    });

    pendingOperationsRef.current = [];
  }, []);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (!isAuthenticated || !token) {
      console.log('[WebSocket] Not authenticated, skipping connection');
      return;
    }
    if (isConnectingRef.current) {
      console.log('[WebSocket] Already connecting, skipping');
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] Connection in progress');
      return;
    }

    const url = getWsUrl();
    if (!url) {
      console.log('[WebSocket] No URL available');
      return;
    }

    console.log('[WebSocket] Connecting...');
    isConnectingRef.current = true;

    try {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }

      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        if (!isMountedRef.current) return;

        console.log('[WebSocket] ✅ Connected');
        setIsConnected(true);
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
        onConnect?.();

        processPendingOperations();
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onclose = (event) => {
        if (!isMountedRef.current) return;

        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        isConnectingRef.current = false;
        joinedRoomsRef.current.clear();
        onDisconnect?.();

        if (
          autoReconnect &&
          isMountedRef.current &&
          isAuthenticated &&
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          event.code !== 1000
        ) {
          reconnectAttemptsRef.current++;
          console.log(
            `[WebSocket] Reconnecting in ${reconnectInterval / 1000}s... (attempt ${
              reconnectAttemptsRef.current
            }/${maxReconnectAttempts})`
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && isAuthenticated) {
              connect();
            }
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (error) => {
        if (!isMountedRef.current) return;
        console.error('[WebSocket] Error occurred');
        isConnectingRef.current = false;
        onError?.(error);
      };
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      isConnectingRef.current = false;
    }
  }, [
    isAuthenticated,
    token,
    getWsUrl,
    handleMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    processPendingOperations,
  ]);

  const send = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Not connected, message not sent:', message);
    }
  }, []);

  const joinRoom = useCallback(
    (room: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        send({ action: 'join', room });
        console.log('[WebSocket] Sent join for room:', room);
      } else {
        console.log('[WebSocket] Queuing join for room:', room);
        pendingOperationsRef.current.push({ action: 'join', room });
      }
    },
    [send]
  );

  const leaveRoom = useCallback(
    (room: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        send({ action: 'leave', room });
        joinedRoomsRef.current.delete(room);
        console.log('[WebSocket] Left room:', room);
      } else {
        pendingOperationsRef.current = pendingOperationsRef.current.filter(
          (op) => !(op.action === 'join' && op.room === room)
        );
      }
    },
    [send]
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (isAuthenticated && token) {
      connect();
    }

    return undefined;
  }, [isAuthenticated, token, connect]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
    send,
    joinRoom,
    leaveRoom,
  };
}
