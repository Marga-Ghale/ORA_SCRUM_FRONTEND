// src/hooks/useWebSocket.ts
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
  | 'chat_reaction_removed';

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload?: Record<string, unknown>;
  data?: Record<string, unknown>; // Some messages use 'data' instead of 'payload'
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

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectInterval = 5000, // Increased to 5 seconds
    maxReconnectAttempts = 5,
  } = options;

  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectingRef = useRef<boolean>(false); // Prevent multiple simultaneous connections
  const isMountedRef = useRef<boolean>(true); // Track if component is mounted

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  // Get WebSocket URL
  const getWsUrl = useCallback(() => {
    if (!token) return null;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    const baseUrl = apiUrl.replace('/api', '');
    const protocol = baseUrl.startsWith('https') ? 'wss:' : 'ws:';
    const host = baseUrl.replace(/^https?:\/\//, '');

    return `${protocol}//${host}/api/ws?token=${token}`;
  }, [token]);

  // Handle incoming messages
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        const messageData = message.payload || message.data || {};
        
        // Ignore certain message types from logging too much
        if (message.type !== 'ping' && message.type !== 'pong' && message.type !== 'user_online' && message.type !== 'user_offline') {
          console.log('[WebSocket] Received:', message.type, messageData);
        }

        // Only set lastMessage for notification-related messages
        if (message.type === 'notification' || 
            message.type === 'task_assigned' || 
            message.type === 'task_created' ||
            message.type === 'task_updated' ||
            message.type === 'sprint_started' ||
            message.type === 'sprint_completed' ||
            message.type === 'comment_added') {
          setLastMessage(message);
        }

        // Handle different message types
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
            // Optionally handle online/offline status
            // Could update a user presence store here
            break;

          case 'ping':
            // Respond to server ping with pong
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ action: 'pong' }));
            }
            break;
            // Inside the switch (message.type) block:
            

            // Add to the switch (message.type) block in handleMessage:

case 'chat_message':
  // New message received
  if (messageData.channelId) {
    const channelId = messageData.channelId as string;
    // Invalidate all message queries for this channel (partial match)
    queryClient.invalidateQueries({
      queryKey: ['chat', 'messages', channelId],
    });
    // Update unread counts
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.chat.unreadCounts() 
    });
    // Update channels list (for last message preview)
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.chat.channels() 
    });
  }
  break;

case 'chat_message_updated':
  if (messageData.channelId) {
    queryClient.invalidateQueries({
      queryKey: ['chat', 'messages', messageData.channelId as string],
    });
  }
  break;

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
  queryClient.invalidateQueries({ 
    queryKey: queryKeys.chat.channels() 
  });
  break;

case 'chat_member_added':
case 'chat_member_removed':
  if (messageData.channelId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.chat.members(messageData.channelId as string),
    });
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.chat.channels() 
    });
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
            // Server responded to our ping or acknowledged an action
            break;
        }

        onMessage?.(message);
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    },
    [queryClient, onMessage]
  );

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      // Remove event handlers before closing to prevent reconnect
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    isConnectingRef.current = false;
    setIsConnected(false);
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    // Guards to prevent connection issues
    if (!isMountedRef.current) {
      return;
    }

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
      // Close any existing connection
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
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onclose = (event) => {
        if (!isMountedRef.current) return;
        
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        isConnectingRef.current = false;
        onDisconnect?.();

        // Only reconnect if we should
        if (
          autoReconnect &&
          isMountedRef.current &&
          isAuthenticated &&
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          event.code !== 1000 // Normal closure
        ) {
          reconnectAttemptsRef.current++;
          console.log(
            `[WebSocket] Reconnecting in ${reconnectInterval / 1000}s... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
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
  ]);

  // Send message
  const send = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send - not connected');
    }
  }, []);

  // Join a room
  const joinRoom = useCallback(
    (room: string) => {
      send({ action: 'join', room });
    },
    [send]
  );

  // Leave a room
  const leaveRoom = useCallback(
    (room: string) => {
      send({ action: 'leave', room });
    },
    [send]
  );

  // Connect when authenticated
  useEffect(() => {
    isMountedRef.current = true;

    if (isAuthenticated && token) {
      // Small delay to ensure token is ready
      const timeoutId = setTimeout(() => {
        connect();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }

    return undefined;
  }, [isAuthenticated, token, connect]);

  // Cleanup on unmount
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