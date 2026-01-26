// ============================================
// Message Input Component - Fully Responsive
// ============================================

import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../../hooks/api/useChat';
import { AtSign, Edit2, Paperclip, Send, Smile, X } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  channelName: string;
  onSend: (content: string) => void;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  channelName,
  onSend,
  editingMessage,
  onCancelEdit,
  disabled,
}) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  const handleSubmit = () => {
    if (!content.trim() || disabled) return;
    onSend(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && editingMessage && onCancelEdit) {
      onCancelEdit();
      setContent('');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  // Truncate channel name for placeholder based on screen width
  const getPlaceholder = () => {
    // On very small screens, show shorter placeholder
    if (typeof window !== 'undefined' && window.innerWidth < 360) {
      return channelName.length > 12 ? `${channelName.substring(0, 12)}...` : channelName;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 480) {
      return channelName.length > 16 ? `${channelName.substring(0, 16)}...` : channelName;
    }
    return channelName.length > 25 ? `${channelName.substring(0, 25)}...` : channelName;
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const maxHeight = window.innerWidth < 640 ? 120 : 200;
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
    }
  }, [content]);

  return (
    <div className="p-2 sm:p-3 md:p-4 border-t border-gray-200 dark:border-[#2a2e33] relative bg-white dark:bg-[#0d0f11]">
      {/* Editing indicator */}
      {editingMessage && (
        <div className="flex items-center gap-2 mb-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 dark:bg-[#25282c] rounded-lg">
          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm text-gray-600 dark:text-[#9ca3af] truncate flex-1">
            Editing message
          </span>
          <button
            onClick={onCancelEdit}
            className="p-1 hover:bg-gray-200 dark:hover:bg-[#3a3e43] rounded text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-1 sm:gap-2 bg-gray-100 dark:bg-[#25282c] rounded-xl p-1.5 sm:p-2">
        {/* Attachment button - Show on screens >= 400px */}
        <button
          className="hidden min-[400px]:flex p-1.5 sm:p-2 hover:bg-gray-200 dark:hover:bg-[#3a3e43] rounded-lg text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0"
          title="Attach file"
        >
          <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Text input - Takes remaining space */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${getPlaceholder()}`}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#6b7280] resize-none focus:outline-none text-sm sm:text-base py-1.5 sm:py-2 leading-snug max-h-[120px] sm:max-h-[200px] overflow-y-auto"
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          />
        </div>

        {/* Action buttons container */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {/* Emoji button */}
          <div className="relative">
            <button
              ref={emojiButtonRef}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-1.5 sm:p-2 hover:bg-gray-200 dark:hover:bg-[#3a3e43] rounded-lg transition-colors ${
                showEmojiPicker
                  ? 'bg-gray-200 dark:bg-[#3a3e43] text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Add emoji"
            >
              <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Emoji Picker - Position responsive */}
            <EmojiPicker
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onSelect={handleEmojiSelect}
              position={{ bottom: 50, right: 0 }}
            />
          </div>

          {/* Mention button - Hidden on mobile, show on md+ */}
          <button
            className="hidden md:flex p-1.5 sm:p-2 hover:bg-gray-200 dark:hover:bg-[#3a3e43] rounded-lg text-gray-600 dark:text-[#6b7280] hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Mention someone"
          >
            <AtSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || disabled}
            className={`p-2 sm:p-2.5 rounded-lg transition-all flex-shrink-0 ${
              content.trim() && !disabled
                ? 'bg-brand-500 text-white hover:bg-brand-600 active:scale-95'
                : 'bg-gray-300 dark:bg-[#3a3e43] text-gray-500 dark:text-[#6b7280] cursor-not-allowed'
            }`}
            title="Send message"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Helper text - Hidden on mobile */}
      <p className="hidden md:block mt-2 text-[10px] sm:text-xs text-gray-500 dark:text-[#6b7280] text-center">
        Press{' '}
        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-[#2a2e33] rounded text-[10px]">Enter</kbd>{' '}
        to send,{' '}
        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-[#2a2e33] rounded text-[10px]">
          Shift + Enter
        </kbd>{' '}
        for new line
      </p>
    </div>
  );
};
