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
  ChevronLeft,
} from 'lucide-react';
import { MessageInput } from './MessageInputComponent';
import { ChatChannel, ChatMessage, getChannelDisplayName } from '../../hooks/api/useChat';
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
  onBack?: () => void;
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
  onBack,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showChannelMenu, setShowChannelMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    if (onOpenThread) {
      onOpenThread(message);
    } else {
      setReplyingTo(message);
    }
  };

  const groupedMessages = useMemo(() => {
    const groups: {
      date: string;
      messages: { message: ChatMessage; showAvatar: boolean }[];
    }[] = [];
    let currentDate = '';
    let lastUserId = '';
    let lastMessageTime = 0;

    const sortedMessages = [...messages].reverse();

    sortedMessages.forEach((message) => {
      const messageDate = new Date(message.createdAt);
      const dateKey = messageDate.toDateString();
      const messageTime = messageDate.getTime();

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

      const showAvatar =
        message.userId !== lastUserId || messageTime - lastMessageTime > 5 * 60 * 1000;

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
  const memberCount = channel.memberCount
    ? `${channel.memberCount} member${channel.memberCount !== 1 ? 's' : ''}`
    : undefined;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0d0f11]">
      {/* Channel Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 dark:border-[#2a2e33] bg-white dark:bg-[#0d0f11]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Mobile Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-[#25282c] rounded-lg text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Channel/User Avatar */}
          {channel.type === 'direct' ? (
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs sm:text-sm font-semibold text-white">
                {channel.otherUser?.avatar ? (
                  <img
                    src={channel.otherUser.avatar}
                    alt={displayName || 'User'}
                    className="w-full h-full rounded-lg sm:rounded-xl object-cover"
                  />
                ) : displayName && displayName.length > 0 ? (
                  displayName[0].toUpperCase()
                ) : (
                  '?'
                )}
              </div>
              <Circle className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-green-500 fill-green-500 stroke-white dark:stroke-[#0d0f11] stroke-2" />
            </div>
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-[#25282c] flex items-center justify-center flex-shrink-0">
              <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-[#9ca3af]" />
            </div>
          )}

          {/* Channel Info */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-[180px] md:max-w-none">
                {displayName}
              </h2>
              {channel.isPrivate && (
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 dark:text-[#6b7280] flex-shrink-0" />
              )}
              {isStarred && (
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-[#6b7280] truncate">
              {channel.type === 'direct'
                ? channel.otherUser?.status === 'online'
                  ? 'Online'
                  : 'Offline'
                : memberCount || `${channel.type} channel`}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {/* Video Call (for DMs) - Hidden on mobile */}
          {channel.type === 'direct' && (
            <>
              <button
                className="hidden sm:flex p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-[#25282c] rounded-lg text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Start call"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                className="hidden sm:flex p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-[#25282c] rounded-lg text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Start video call"
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="hidden sm:block w-px h-4 sm:h-5 bg-gray-200 dark:bg-[#2a2e33] mx-0.5 sm:mx-1" />
            </>
          )}

          {/* Members */}
          <button
            onClick={onToggleMembers}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              showMembersActive
                ? 'bg-brand-500/20 text-brand-400'
                : 'hover:bg-gray-100 dark:hover:bg-[#25282c] text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white'
            }`}
            title="View members"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Pinned Messages - Hidden on mobile */}
          <button
            className="hidden sm:flex p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-[#25282c] rounded-lg text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Pinned messages"
          >
            <Pin className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Search - Hidden on mobile */}
          <button
            className="hidden sm:flex p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-[#25282c] rounded-lg text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Search in conversation"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* More Options */}
          <div className="relative">
            <button
              onClick={() => setShowChannelMenu(!showChannelMenu)}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                showChannelMenu
                  ? 'bg-gray-100 dark:bg-[#25282c] text-gray-900 dark:text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-[#25282c] text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white'
              }`}
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Dropdown Menu */}
            {showChannelMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowChannelMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 sm:w-56 bg-white dark:bg-[#25282c] border border-gray-200 dark:border-[#3a3e43] rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                  <button
                    onClick={() => {
                      setIsStarred(!isStarred);
                      setShowChannelMenu(false);
                    }}
                    className="w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-[#e5e7eb] hover:bg-gray-100 dark:hover:bg-[#3a3e43] transition-colors"
                  >
                    <Star
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isStarred ? 'text-yellow-500 fill-yellow-500' : ''}`}
                    />
                    <span>{isStarred ? 'Remove from starred' : 'Add to starred'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMuted(!isMuted);
                      setShowChannelMenu(false);
                    }}
                    className="w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-[#e5e7eb] hover:bg-gray-100 dark:hover:bg-[#3a3e43] transition-colors"
                  >
                    {isMuted ? (
                      <>
                        <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Unmute conversation</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Mute conversation</span>
                      </>
                    )}
                  </button>

                  <div className="h-px bg-gray-200 dark:bg-[#3a3e43] my-1" />

                  <button className="w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-[#e5e7eb] hover:bg-gray-100 dark:hover:bg-[#3a3e43] transition-colors">
                    <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-gray-100 dark:bg-[#25282c] border-b border-gray-200 dark:border-[#2a2e33]">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-[#9ca3af]">
            <BellOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>This conversation is muted</span>
          </div>
          <button
            onClick={() => setIsMuted(false)}
            className="text-[10px] sm:text-xs text-brand-400 hover:text-brand-300 font-medium"
          >
            Unmute
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {' '}
        {isLoading ? (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-2 sm:gap-3 animate-pulse">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gray-200 dark:bg-[#2a2e33]" />
                <div className="flex-1 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-[#2a2e33] rounded w-20 sm:w-24" />
                    <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-[#2a2e33] rounded w-10 sm:w-12" />
                  </div>
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-[#2a2e33] rounded w-3/4" />
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-[#2a2e33] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-6 md:p-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-600/20 flex items-center justify-center mb-3 sm:mb-4">
              <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-brand-400" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-1.5 sm:mb-2 px-2">
              {channel.type === 'direct'
                ? `Start chatting with ${displayName.length > 20 ? displayName.substring(0, 20) + '...' : displayName}`
                : `Welcome to #${displayName.length > 15 ? displayName.substring(0, 15) + '...' : displayName}`}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-[#6b7280] max-w-xs sm:max-w-sm md:max-w-md px-4 leading-relaxed">
              {channel.type === 'direct'
                ? `This is the beginning of your direct message history.`
                : `This is the start of the #${channel.name} channel. Send a message to begin.`}
            </p>
          </div>
        ) : (
          <div className="py-2 sm:py-4">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date Divider */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-[#2a2e33]" />
                  <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-[#6b7280] bg-white dark:bg-[#0d0f11] px-2 whitespace-nowrap">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-[#2a2e33]" />
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
        <div className="flex items-center gap-2 mx-2 sm:mx-3 md:mx-4 px-2 sm:px-3 py-2 bg-gray-100 dark:bg-[#25282c] rounded-t-xl border-l-2 border-brand-500">
          <Reply className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-400 flex-shrink-0" />
          <div className="flex-1 min-w-0 overflow-hidden">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-[#9ca3af] block truncate">
              Replying to{' '}
              <span className="text-gray-900 dark:text-white font-medium">
                {replyingTo.user?.name || 'Unknown'}
              </span>
            </span>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-[#6b7280] truncate max-w-full">
              {replyingTo.content.length > 60
                ? `${replyingTo.content.substring(0, 60)}...`
                : replyingTo.content}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-[#3a3e43] rounded text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white flex-shrink-0"
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
