// src/pages/chat/ChatViewComponent.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Circle,
  Hash,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Pin,
  Reply,
  Search,
  Users,
  X,
  Phone,
  Video,
  Bell,
  BellOff,
  Settings,
  Star,
} from 'lucide-react';
import { MessageInput } from './MessageInputComponent';
import {
  ChatChannel,
  ChatMessage,
  getChannelDisplayName,
} from '../../hooks/api/useChat';
import { MessageItem } from './MessageComponent';

interface ChatViewProps {
  channel: ChatChannel;
  messages: ChatMessage[];
  isLoading: boolean;
  currentUserId: string;
  onSendMessage: (content: string, parentId?: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onOpenThread?: (message: ChatMessage) => void;
  onToggleMembers?: () => void;
  showMembersActive?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  channel,
  messages,
  isLoading,
  currentUserId,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReact,
  onOpenThread,
  onToggleMembers,
  showMembersActive = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showChannelMenu, setShowChannelMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset state when channel changes
  useEffect(() => {
    setEditingMessage(null);
    setReplyingTo(null);
    setShowChannelMenu(false);
  }, [channel.id]);

  const handleSend = (content: string) => {
    if (editingMessage) {
      onEditMessage(editingMessage.id, content);
      setEditingMessage(null);
    } else {
      onSendMessage(content, replyingTo?.id);
      setReplyingTo(null);
    }
  };

  const handleReply = (message: ChatMessage) => {
    // If onOpenThread is provided, open thread panel; otherwise use inline reply
    if (onOpenThread) {
      onOpenThread(message);
    } else {
      setReplyingTo(message);
    }
  };

  // Group messages by date and consecutive user
  const groupedMessages = useMemo(() => {
    const groups: {
      date: string;
      messages: { message: ChatMessage; showAvatar: boolean }[];
    }[] = [];
    let currentDate = '';
    let lastUserId = '';
    let lastMessageTime = 0;

    // Reverse to show oldest first
    const sortedMessages = [...messages].reverse();

    sortedMessages.forEach((message) => {
      const messageDate = new Date(message.createdAt);
      const dateKey = messageDate.toDateString();
      const messageTime = messageDate.getTime();

      // Check if we need a new date group
      if (dateKey !== currentDate) {
        currentDate = dateKey;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let dateLabel: string;
        if (dateKey === today.toDateString()) {
          dateLabel = 'Today';
        } else if (dateKey === yesterday.toDateString()) {
          dateLabel = 'Yesterday';
        } else {
          dateLabel = messageDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          });
        }

        groups.push({
          date: dateLabel,
          messages: [],
        });
        lastUserId = '';
        lastMessageTime = 0;
      }

      // Show avatar if different user or more than 5 minutes gap
      const showAvatar =
        message.userId !== lastUserId ||
        messageTime - lastMessageTime > 5 * 60 * 1000;

      groups[groups.length - 1].messages.push({
        message,
        showAvatar,
      });

      lastUserId = message.userId;
      lastMessageTime = messageTime;
    });

    return groups;
  }, [messages]);

const displayName = getChannelDisplayName(channel, currentUserId) || 'Unknown User';
  const memberCount = channel.type !== 'direct' ? '12 members' : undefined; // Replace with actual count

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0d0f11]">
      {/* Channel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2e33] bg-[#0d0f11]">
        <div className="flex items-center gap-3">
          {/* Channel/User Avatar */}
          {channel.type === 'direct' ? (
  <div className="relative">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white">
      {channel.otherUser?.avatar ? (
        <img
          src={channel.otherUser.avatar}
          alt={displayName || 'User'}
          className="w-full h-full rounded-xl object-cover"
        />
      ) : (
        (displayName && displayName.length > 0 ? displayName[0].toUpperCase() : '?')
      )}
    </div>
    {/* Online status */}
    <Circle className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-green-500 fill-green-500 stroke-[#0d0f11] stroke-2" />
  </div>
) : (
  <div className="w-10 h-10 rounded-xl bg-[#25282c] flex items-center justify-center">
    <Hash className="w-5 h-5 text-[#9ca3af]" />
  </div>
)}

          {/* Channel Info */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">
                {displayName}
              </h2>
              {channel.isPrivate && (
                <Lock className="w-3.5 h-3.5 text-[#6b7280]" />
              )}
              {isStarred && (
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <p className="text-xs text-[#6b7280]">
              {channel.type === 'direct'
                ? channel.otherUser?.status === 'online'
                  ? 'Online'
                  : 'Offline'
                : memberCount || `${channel.type} channel`}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          {/* Video Call (for DMs) */}
          {channel.type === 'direct' && (
            <>
              <button
                className="p-2 hover:bg-[#25282c] rounded-lg text-[#6b7280] hover:text-white transition-colors"
                title="Start call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                className="p-2 hover:bg-[#25282c] rounded-lg text-[#6b7280] hover:text-white transition-colors"
                title="Start video call"
              >
                <Video className="w-5 h-5" />
              </button>
              <div className="w-px h-5 bg-[#2a2e33] mx-1" />
            </>
          )}

          {/* Members */}
          <button
            onClick={onToggleMembers}
            className={`p-2 rounded-lg transition-colors ${
              showMembersActive
                ? 'bg-brand-500/20 text-brand-400'
                : 'hover:bg-[#25282c] text-[#6b7280] hover:text-white'
            }`}
            title="View members"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* Pinned Messages */}
          <button
            className="p-2 hover:bg-[#25282c] rounded-lg text-[#6b7280] hover:text-white transition-colors"
            title="Pinned messages"
          >
            <Pin className="w-5 h-5" />
          </button>

          {/* Search */}
          <button
            className="p-2 hover:bg-[#25282c] rounded-lg text-[#6b7280] hover:text-white transition-colors"
            title="Search in conversation"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* More Options */}
          <div className="relative">
            <button
              onClick={() => setShowChannelMenu(!showChannelMenu)}
              className={`p-2 rounded-lg transition-colors ${
                showChannelMenu
                  ? 'bg-[#25282c] text-white'
                  : 'hover:bg-[#25282c] text-[#6b7280] hover:text-white'
              }`}
              title="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showChannelMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowChannelMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-56 bg-[#25282c] border border-[#3a3e43] rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                  <button
                    onClick={() => {
                      setIsStarred(!isStarred);
                      setShowChannelMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#e5e7eb] hover:bg-[#3a3e43] transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        isStarred ? 'text-yellow-500 fill-yellow-500' : ''
                      }`}
                    />
                    <span>{isStarred ? 'Remove from starred' : 'Add to starred'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMuted(!isMuted);
                      setShowChannelMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#e5e7eb] hover:bg-[#3a3e43] transition-colors"
                  >
                    {isMuted ? (
                      <>
                        <Bell className="w-4 h-4" />
                        <span>Unmute conversation</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-4 h-4" />
                        <span>Mute conversation</span>
                      </>
                    )}
                  </button>

                  <div className="h-px bg-[#3a3e43] my-1" />

                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#e5e7eb] hover:bg-[#3a3e43] transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Channel settings</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Muted Banner */}
      {isMuted && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#25282c] border-b border-[#2a2e33]">
          <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
            <BellOff className="w-4 h-4" />
            <span>This conversation is muted</span>
          </div>
          <button
            onClick={() => setIsMuted(false)}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium"
          >
            Unmute
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        {isLoading ? (
          // Loading Skeleton
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-[#2a2e33]" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-[#2a2e33] rounded w-24" />
                    <div className="h-3 bg-[#2a2e33] rounded w-12" />
                  </div>
                  <div className="h-4 bg-[#2a2e33] rounded w-3/4" />
                  <div className="h-4 bg-[#2a2e33] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-600/20 flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-brand-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {channel.type === 'direct'
                ? `Start chatting with ${displayName}`
                : `Welcome to #${displayName}`}
            </h3>
            <p className="text-sm text-[#6b7280] max-w-md">
              {channel.type === 'direct'
                ? `This is the beginning of your direct message history with ${displayName}.`
                : `This is the start of the #${channel.name} channel. Send a message to begin the conversation.`}
            </p>
          </div>
        ) : (
          // Messages List
          <div className="py-4">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date Divider */}
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 h-px bg-[#2a2e33]" />
                  <span className="text-xs font-medium text-[#6b7280] bg-[#0d0f11] px-2">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-[#2a2e33]" />
                </div>

                {/* Messages in Group */}
                {group.messages.map(({ message, showAvatar }) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    isOwn={message.userId === currentUserId}
                    showAvatar={showAvatar}
                    onEdit={setEditingMessage}
                    onDelete={onDeleteMessage}
                    onReply={handleReply}
                    onReact={onReact}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reply Indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 mx-4 px-3 py-2 bg-[#25282c] rounded-t-xl border-l-2 border-brand-500">
          <Reply className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm text-[#9ca3af]">
              Replying to{' '}
              <span className="text-white font-medium">
                {replyingTo.user?.name || 'Unknown'}
              </span>
            </span>
            <p className="text-xs text-[#6b7280] truncate">
              {replyingTo.content}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-[#3a3e43] rounded text-[#6b7280] hover:text-white flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Input */}
      <MessageInput
        channelName={displayName}
        onSend={handleSend}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
};