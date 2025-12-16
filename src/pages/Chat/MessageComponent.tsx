// src/pages/chat/MessageComponent.tsx
// ============================================
// Message Component - WhatsApp/iMessage Style
// Own messages on RIGHT, received on LEFT
// ============================================

import { useMemo, useState } from 'react';
import {
  ChatMessage,
  ChatReaction,
  COMMON_REACTIONS,
  formatMessageTime,
} from '../../hooks/api/useChat';
import {
  CheckCheck,
  Edit2,
  MessageSquare,
  MoreHorizontal,
  Reply,
  Smile,
  Trash2,
} from 'lucide-react';

// Helper functions to handle both uppercase and lowercase field names
const getUserName = (user: ChatMessage['user']): string => {
  if (!user) return 'Unknown User';
  return (user as any).Name || (user as any).name || 'Unknown User';
};

const getUserAvatar = (user: ChatMessage['user']): string | null => {
  if (!user) return null;
  return (user as any).Avatar || (user as any).avatar || null;
};

interface GroupedReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  onEdit: (message: ChatMessage) => void;
  onDelete: (messageId: string) => void;
  onReply: (message: ChatMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  currentUserId: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  showAvatar,
  onEdit,
  onDelete,
  onReply,
  onReact,
  currentUserId,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const userName = getUserName(message.user);
  const userAvatar = getUserAvatar(message.user);
  const userInitial = userName[0]?.toUpperCase() || '?';
  const time = formatMessageTime(message.createdAt);

  // Group reactions by emoji
  const groupedReactions = useMemo((): GroupedReaction[] => {
    if (!message.reactions?.length) return [];

    const groups: { [key: string]: GroupedReaction } = {};

    message.reactions.forEach((r: ChatReaction) => {
      if (!groups[r.emoji]) {
        groups[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] };
      }
      groups[r.emoji].count++;
      groups[r.emoji].userIds.push(r.userId);
    });

    return Object.values(groups);
  }, [message.reactions]);

  return (
    <div
      className={`group relative flex gap-3 px-4 py-1 transition-colors ${
        showAvatar ? 'mt-4' : 'mt-0.5'
      } ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {/* Avatar - Only show for received messages */}
      {!isOwn && (
        <div className="w-9 flex-shrink-0">
          {showAvatar && (
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                userInitial
              )}
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Username & Time - Only for received messages with avatar */}
        {showAvatar && !isOwn && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-white">{userName}</span>
            <span className="text-xs text-[#6b7280]">{time}</span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl ${
            isOwn
              ? 'bg-brand-500 text-white rounded-br-md'
              : 'bg-[#25282c] text-[#e5e7eb] rounded-bl-md'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Time & Status for own messages */}
          <div
            className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <span className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-[#6b7280]'}`}>
              {time}
            </span>
            {message.isEdited && (
              <span className={`text-[10px] italic ${isOwn ? 'text-white/70' : 'text-[#6b7280]'}`}>
                (edited)
              </span>
            )}
            {/* Read receipt for own messages */}
            {isOwn && (
              <CheckCheck
                className={`w-3.5 h-3.5 ${message.isEdited ? 'text-white/50' : 'text-white/70'}`}
              />
            )}
          </div>
        </div>

        {/* Reactions */}
        {groupedReactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {groupedReactions.map((reaction) => {
              const hasReacted = reaction.userIds.includes(currentUserId);
              return (
                <button
                  key={reaction.emoji}
                  onClick={() => onReact(message.id, reaction.emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                    hasReacted
                      ? 'bg-brand-500/20 border border-brand-500/50'
                      : 'bg-[#2a2e33] border border-transparent hover:border-[#3a3e43]'
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-[#9ca3af]">{reaction.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Reply count */}
        {message.replyCount && message.replyCount > 0 && (
          <button
            onClick={() => onReply(message)}
            className={`flex items-center gap-1.5 mt-1 text-xs text-brand-400 hover:text-brand-300 transition-colors ${
              isOwn ? 'self-end' : 'self-start'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </span>
          </button>
        )}
      </div>

      {/* Spacer for own messages (to replace avatar space) */}
      {isOwn && <div className="w-9 flex-shrink-0" />}

      {/* Action Bar - Position based on message side */}
      {showActions && (
        <div
          className={`absolute -top-3 flex items-center bg-[#25282c] border border-[#3a3e43] rounded-lg shadow-lg overflow-hidden z-10 ${
            isOwn ? 'left-4' : 'right-4'
          }`}
        >
          {/* Emoji picker trigger */}
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1.5 hover:bg-[#3a3e43] text-[#9ca3af] hover:text-white transition-colors"
              title="Add reaction"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Quick reactions */}
            {showReactions && (
              <div
                className={`absolute top-full mt-1 flex items-center gap-0.5 p-1 bg-[#25282c] border border-[#3a3e43] rounded-lg shadow-xl z-10 ${
                  isOwn ? 'left-0' : 'right-0'
                }`}
              >
                {COMMON_REACTIONS.slice(0, 6).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(message.id, emoji);
                      setShowReactions(false);
                    }}
                    className="p-1.5 hover:bg-[#3a3e43] rounded transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onReply(message)}
            className="p-1.5 hover:bg-[#3a3e43] text-[#9ca3af] hover:text-white transition-colors"
            title="Reply in thread"
          >
            <Reply className="w-4 h-4" />
          </button>

          {isOwn && (
            <>
              <button
                onClick={() => onEdit(message)}
                className="p-1.5 hover:bg-[#3a3e43] text-[#9ca3af] hover:text-white transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(message.id)}
                className="p-1.5 hover:bg-red-500/20 text-[#9ca3af] hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            className="p-1.5 hover:bg-[#3a3e43] text-[#9ca3af] hover:text-white transition-colors"
            title="More"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
