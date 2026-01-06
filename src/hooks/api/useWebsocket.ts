// ✅ FIXED: src/hooks/api/useWebsocket.ts - Handles multiple JSON messages per frame

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../components/UserProfile/AuthContext';
import { queryKeys } from '../../lib/query-client';

export type WebSocketEventType =
  | 'notification'
  | 'notification_count'
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_assigned'
  | 'task_status_changed'
  | 'sprint_started'
  | 'sprint_completed'
  | 'comment_added'
  | 'member_added'
  | 'member_removed'
  | 'user_online'
  | 'user_offline'
  | 'ping'
  | 'pong'
  | 'ack'
  | 'chat_message'
  | 'chat_message_updated'
  | 'chat_message_deleted'
  | 'chat_channel_created'
  | 'chat_channel_updated'
  | 'chat_channel_deleted'
  | 'chat_member_added'
  | 'chat_member_removed'
  | 'chat_reaction_added'
  | 'chat_reaction_removed';

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

  // ✅ FIXED: Extract message processing to separate function
  const processMessage = useCallback(
    (message: WebSocketMessage) => {
      const messageData = message.payload || message.data || {};

      if (
        message.type !== 'ping' &&
        message.type !== 'pong' &&
        message.type !== 'user_online' &&
        message.type !== 'user_offline'
      ) {
        console.log('[WebSocket] Received:', message.type, messageData);
      }

      // Track successful room joins
      if (message.type === 'ack' && messageData.action === 'joined' && messageData.room) {
        joinedRoomsRef.current.add(messageData.room as string);
        console.log('[WebSocket] ✅ Confirmed joined room:', messageData.room);
      }

      if (
        message.type === 'notification' ||
        message.type === 'task_assigned' ||
        message.type === 'task_created' ||
        message.type === 'task_updated' ||
        message.type === 'sprint_started' ||
        message.type === 'sprint_completed' ||
        message.type === 'comment_added'
      ) {
        setLastMessage(message);
      }

      switch (message.type) {
        case 'notification':
        case 'notification_count':
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
          break;

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

        case 'user_online':
        case 'user_offline':
          break;

        case 'ping':
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: 'pong' }));
          }
          break;

        case 'chat_message':
          if (messageData.channelId) {
            queryClient.invalidateQueries({
              queryKey: ['chat', 'messages', messageData.channelId as string],
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.chat.unreadCounts() });
            queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
          }
          break;

        case 'chat_message_updated':
        case 'chat_message_deleted':
          if (messageData.channelId) {
            queryClient.invalidateQueries({
              queryKey: ['chat', 'messages', messageData.channelId as string],
            });
          }
          break;

        case 'chat_channel_created':
        case 'chat_channel_updated':
        case 'chat_channel_deleted':
          queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
          break;

        case 'chat_member_added':
        case 'chat_member_removed':
          if (messageData.channelId) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.chat.members(messageData.channelId as string),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.chat.channels() });
          }
          break;

        case 'chat_reaction_added':
        case 'chat_reaction_removed':
          if (messageData.channelId) {
            queryClient.invalidateQueries({
              queryKey: ['chat', 'messages', messageData.channelId as string],
            });
          }
          break;

        case 'pong':
        case 'ack':
          break;
      }

      onMessage?.(message);
    },
    [queryClient, onMessage]
  );

  // ✅ FIXED: Handle multiple JSON messages separated by newlines
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
