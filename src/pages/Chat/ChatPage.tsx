// src/pages/chat/ChatPage.tsx
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

const ChatPage: React.FC = () => {
  const { channelId } = useParams<{ channelId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Modal states
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateDM, setShowCreateDM] = useState(false);

  // Panel states
  const [showThread, setShowThread] = useState(false);
  const [threadMessage, setThreadMessage] = useState<ChatMessage | null>(null);
  const [showMembers, setShowMembers] = useState(false);

  // Queries
  const { data: channels = [], isLoading: channelsLoading } = useChannels();
  const { data: currentChannel } = useChannel(channelId);
  const { data: messages = [], isLoading: messagesLoading } = useMessages(channelId);
  const { data: unreadCounts = {} } = useUnreadCounts();

  // Mutations
  const sendMessage = useSendMessage();
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const markRead = useMarkChannelRead();

  // Mark channel as read when opened
  useEffect(() => {
    if (channelId && unreadCounts[channelId]) {
      markRead.mutate(channelId);
    }
  }, [channelId]);

  // Close panels when channel changes
  useEffect(() => {
    setShowThread(false);
    setThreadMessage(null);
    setShowMembers(false);
  }, [channelId]);

  const handleSelectChannel = (channel: ChatChannel) => {
    navigate(`/chat/${channel.id}`);
  };

  const handleChannelCreated = (newChannelId: string) => {
    navigate(`/chat/${newChannelId}`);
  };

  const handleSendMessage = (content: string, parentId?: string) => {
    if (!channelId) return;
    sendMessage.mutate({ channelId, content, parentId });
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
    setThreadMessage(message);
    setShowThread(true);
    setShowMembers(false);
  };

  const handleToggleMembers = () => {
    setShowMembers(!showMembers);
    if (!showMembers) {
      setShowThread(false);
    }
  };

  return (
    <>
      <PageMeta title="Chat | ORA SCRUM" description="Team chat and messaging" />

      <div className="h-full flex bg-white dark:bg-[#0d0f11]">
        {' '}
        {/* Channel List Sidebar */}
        <ChannelList
          channels={channels}
          activeChannelId={channelId}
          unreadCounts={unreadCounts}
          onSelectChannel={handleSelectChannel}
          onCreateChannel={() => setShowCreateChannel(true)}
          onCreateDM={() => setShowCreateDM(true)}
          isLoading={channelsLoading}
          currentUserId={''}
        />
        {/* Main Chat Area */}
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
          />
        ) : (
          <EmptyChatState onCreateChannel={() => setShowCreateChannel(true)} />
        )}
        {/* Thread Panel */}
        {currentChannel && (
          <ThreadPanel
            isOpen={showThread}
            onClose={() => {
              setShowThread(false);
              setThreadMessage(null);
            }}
            parentMessage={threadMessage}
            channel={currentChannel}
            currentUserId={user?.id || ''}
            onReact={handleReact}
          />
        )}
        {/* Members Panel */}
        {currentChannel && (
          <ChannelMembersPanel
            isOpen={showMembers}
            onClose={() => setShowMembers(false)}
            channel={currentChannel}
            currentUserId={user?.id || ''}
          />
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
