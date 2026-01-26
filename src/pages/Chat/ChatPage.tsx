import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../components/UserProfile/AuthContext';
import {
  useChannels,
  useChannel,
  useMessages,
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  useAddReaction,
  useRemoveReaction,
  useMarkChannelRead,
  useUnreadCounts,
  ChatChannel,
  ChatMessage,
} from '../../hooks/api/useChat';
import PageMeta from '../../components/common/PageMeta';
import { ChannelList } from './ChannelList';
import { ChatView } from './ChatViewComponent';
import { EmptyChatState } from './EmptyStateComponent';
import { CreateChannelModal } from './CreateChannelModal';
import { CreateDMModal } from './CreateDMModal';
import { ThreadPanel } from './ThreadPanel';
import { ChannelMembersPanel } from './ChannelMembersPanel';
import { useWebSocket } from '../../hooks/api/useWebsocket';
import { setActiveChannel } from '../../lib/activeChannelTracker';

const ChatPage: React.FC = () => {
  const { channelId } = useParams<{ channelId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Sidebar state management
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  // Track active channel for smart notifications
  useEffect(() => {
    setActiveChannel(channelId || null);
    return () => {
      setActiveChannel(null);
    };
  }, [channelId]);

  // Auto-close sidebar on mobile when channel is selected
  useEffect(() => {
    if (channelId && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [channelId]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
        setSidebarMinimized(false);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // WebSocket integration
  const { isConnected, joinRoom, leaveRoom } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'chat_member_removed') {
        const data = message.payload || message.data || {};
        const removedUserId = data.userId as string;
        const affectedChannelId = data.channelId as string;

        if (removedUserId === user?.id && affectedChannelId === channelId) {
          handleChannelDeleted(affectedChannelId);
        }
      }

      if (message.type === 'chat_channel_deleted') {
        const data = message.payload || message.data || {};
        const deletedChannelId = data.channelId as string;
        handleChannelDeleted(deletedChannelId);
      }
    },
  });

  const { data: currentChannel } = useChannel(channelId);

  useEffect(() => {
    if (!currentChannel?.workspaceId || !isConnected) return;

    const workspaceRoom = `workspace:${currentChannel.workspaceId}`;
    console.log('[ChatPage] 🔌 Joining workspace room:', workspaceRoom);
    joinRoom(workspaceRoom);

    return () => {
      console.log('[ChatPage] 👋 Leaving workspace room:', workspaceRoom);
      leaveRoom(workspaceRoom);
    };
  }, [currentChannel?.workspaceId, isConnected, joinRoom, leaveRoom]);

  // Modal states
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateDM, setShowCreateDM] = useState(false);

  // Panel states
  const [showThread, setShowThread] = useState(false);
  const [threadMessage, setThreadMessage] = useState<ChatMessage | null>(null);
  const [showMembers, setShowMembers] = useState(false);

  // Queries
  const { data: channels = [], isLoading: channelsLoading } = useChannels();
  const { data: messages = [], isLoading: messagesLoading } = useMessages(channelId);
  const { data: unreadCounts = {} } = useUnreadCounts();

  // Mutations
  const sendMessage = useSendMessage();
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const { mutate: markAsRead } = useMarkChannelRead();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // On mobile, ensure we don't have multiple panels open
        if (showThread && showMembers) {
          setShowThread(false);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showThread, showMembers]);

  useEffect(() => {
    if (channelId) {
      setActiveChannel(channelId);
      const timer = setTimeout(() => {
        markAsRead(channelId);
      }, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      setActiveChannel(null);
    };
  }, [channelId, markAsRead]);

  // Close panels when channel changes
  useEffect(() => {
    setShowThread(false);
    setThreadMessage(null);
    setShowMembers(false);
  }, [channelId]);

  const handleSelectChannel = (channel: ChatChannel) => {
    navigate(`/chat/${channel.id}`);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleChannelCreated = (newChannelId: string) => {
    navigate(`/chat/${newChannelId}`);
  };

  const handleSendMessage = (content: string, parentId?: string) => {
    if (!channelId || !user) return;

    sendMessage.mutate({
      channelId,
      content,
      parentId,
      currentUserId: user.id,
      currentUser: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  };

  const handleChannelDeleted = (deletedChannelId: string) => {
    if (deletedChannelId === channelId) {
      const remainingChannels = channels.filter((c) => c.id !== deletedChannelId);
      if (remainingChannels.length > 0) {
        navigate(`/chat/${remainingChannels[0].id}`);
      } else {
        navigate('/chat');
      }
    }
  };

  const handleEditMessage = (messageId: string, content: string) => {
    if (!channelId) return;
    editMessage.mutate({ messageId, content, channelId });
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!channelId) return;
    if (window.confirm('Delete this message?')) {
      deleteMessage.mutate({ messageId, channelId });
    }
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (!channelId) return;

    const message = messages.find((m) => m.id === messageId);
    const hasReacted = message?.reactions?.some((r) => r.emoji === emoji && r.userId === user?.id);

    if (hasReacted) {
      removeReaction.mutate({ messageId, emoji, channelId });
    } else {
      addReaction.mutate({ messageId, emoji, channelId });
    }
  };

  const handleOpenThread = (message: ChatMessage) => {
    if (window.innerWidth < 768) {
      // On mobile, close members when opening thread
      setShowMembers(false);
    }
    setThreadMessage(message);
    setShowThread(true);
  };

  const handleToggleMembers = () => {
    if (window.innerWidth < 768) {
      // On mobile, close thread when opening members
      if (!showMembers) {
        setShowThread(false);
        setThreadMessage(null);
      }
    }
    setShowMembers(!showMembers);
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 768) {
      setSidebarMinimized(!sidebarMinimized);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  return (
    <>
      <PageMeta title="Chat | ORA SCRUM" description="Team chat and messaging" />

      <div className="h-full flex bg-white dark:bg-[#0d0f11] relative overflow-hidden">
        {/* Mobile Overlay */}
        {sidebarOpen && window.innerWidth < 768 && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Channel List Sidebar - Responsive Width */}
        <div
          className={`
            fixed md:relative inset-y-0 left-0 z-40 
            bg-white dark:bg-[#0d0f11] 
            border-r border-gray-200 dark:border-[#2a2e33]
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${sidebarMinimized ? 'md:w-16' : 'w-full max-w-[280px] sm:max-w-[320px] md:w-64 lg:w-72'}
          `}
        >
          <ChannelList
            channels={channels}
            activeChannelId={channelId}
            unreadCounts={unreadCounts}
            onSelectChannel={handleSelectChannel}
            onCreateChannel={() => setShowCreateChannel(true)}
            onCreateDM={() => setShowCreateDM(true)}
            isLoading={channelsLoading}
            currentUserId={user?.id || ''}
            isMinimized={sidebarMinimized}
            onToggleMinimize={handleToggleSidebar}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {channelId && currentChannel ? (
            <ChatView
              channel={currentChannel}
              messages={messages}
              isLoading={messagesLoading}
              currentUserId={user?.id || ''}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onReact={handleReact}
              onOpenThread={handleOpenThread}
              onToggleMembers={handleToggleMembers}
              showMembersActive={showMembers}
              onBack={() => setSidebarOpen(true)}
            />
          ) : (
            <EmptyChatState onCreateChannel={() => setShowCreateChannel(true)} />
          )}
        </div>

        {currentChannel && (
          <>
            {/* Thread Panel */}
            <ThreadPanel
              isOpen={showThread && !showMembers}
              onClose={() => {
                setShowThread(false);
                setThreadMessage(null);
              }}
              parentMessage={threadMessage}
              channel={currentChannel}
              currentUserId={user?.id || ''}
              onReact={handleReact}
            />

            {/* Members Panel */}
            <ChannelMembersPanel
              isOpen={showMembers}
              onClose={() => setShowMembers(false)}
              channel={currentChannel}
              currentUserId={user?.id || ''}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <CreateChannelModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        onSuccess={handleChannelCreated}
      />

      <CreateDMModal
        isOpen={showCreateDM}
        onClose={() => setShowCreateDM(false)}
        onSuccess={handleChannelCreated}
      />
    </>
  );
};

export default ChatPage;
