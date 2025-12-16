// src/pages/chat/ThreadPanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Hash, Reply, Send, Smile, Paperclip } from 'lucide-react';
import {
  ChatMessage,
  ChatChannel,
  useThreadMessages,
  useSendMessage,
  formatMessageTime,
} from '../../hooks/api/useChat';
import { MessageItem } from './MessageComponent';

interface ThreadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  parentMessage: ChatMessage | null;
  channel: ChatChannel;
  currentUserId: string;
  onReact: (messageId: string, emoji: string) => void;
}

export const ThreadPanel: React.FC<ThreadPanelProps> = ({
  isOpen,
  onClose,
  parentMessage,
  channel,
  currentUserId,
  onReact,
}) => {
  const [replyContent, setReplyContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: replies = [], isLoading } = useThreadMessages(parentMessage?.id);
  const sendMessage = useSendMessage();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [replyContent]);

  const handleSendReply = () => {
    if (!replyContent.trim() || !parentMessage) return;

    sendMessage.mutate({
      channelId: channel.id,
      content: replyContent.trim(),
      parentId: parentMessage.id,
    });

    setReplyContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen || !parentMessage) return null;

  const parentUserName = parentMessage.user?.name || 'Unknown';

  return (
    <div className="w-[400px] h-full flex flex-col bg-[#1a1d21] border-l border-[#2a2e33]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2e33]">
        <div className="flex items-center gap-2">
          <Reply className="w-5 h-5 text-[#9ca3af]" />
          <div>
            <h3 className="text-sm font-semibold text-white">Thread</h3>
            <p className="text-xs text-[#6b7280]">
              <Hash className="inline w-3 h-3 mr-0.5" />
              {channel.name}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#2a2e33] rounded-lg text-[#6b7280] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Parent Message */}
      <div className="p-4 border-b border-[#2a2e33] bg-[#25282c]/50">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
            {parentMessage.user?.avatar ? (
              <img
                src={parentMessage.user.avatar}
                alt={parentUserName}
                className="w-full h-full rounded-lg object-cover"
              />
            ) : (
              parentUserName[0]?.toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-semibold text-white">{parentUserName}</span>
              <span className="text-xs text-[#6b7280]">
                {formatMessageTime(parentMessage.createdAt)}
              </span>
            </div>
            <p className="text-sm text-[#e5e7eb] whitespace-pre-wrap break-words">
              {parentMessage.content}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-[#6b7280]">
          {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
        </p>
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-[#2a2e33]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#2a2e33] rounded w-1/4" />
                  <div className="h-3 bg-[#2a2e33] rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : replies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <p className="text-sm text-[#6b7280]">No replies yet</p>
            <p className="text-xs text-[#6b7280] mt-1">Be the first to reply!</p>
          </div>
        ) : (
          <div className="py-2">
            {replies.map((reply, index) => {
              const showAvatar = index === 0 || reply.userId !== replies[index - 1].userId;
              return (
                <MessageItem
                  key={reply.id}
                  message={reply}
                  isOwn={reply.userId === currentUserId}
                  showAvatar={showAvatar}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onReply={() => {}}
                  onReact={onReact}
                  currentUserId={currentUserId}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reply Input */}
      <div className="p-3 border-t border-[#2a2e33]">
        <div className="flex items-end gap-2 bg-[#25282c] rounded-xl p-2">
          <button className="p-1.5 hover:bg-[#3a3e43] rounded-lg text-[#6b7280] hover:text-white transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply..."
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-[#6b7280] resize-none focus:outline-none text-sm py-1.5 max-h-[120px]"
          />

          <button className="p-1.5 hover:bg-[#3a3e43] rounded-lg text-[#6b7280] hover:text-white transition-colors">
            <Smile className="w-4 h-4" />
          </button>

          <button
            onClick={handleSendReply}
            disabled={!replyContent.trim() || sendMessage.isPending}
            className={`p-1.5 rounded-lg transition-colors ${
              replyContent.trim() && !sendMessage.isPending
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-[#3a3e43] text-[#6b7280] cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
