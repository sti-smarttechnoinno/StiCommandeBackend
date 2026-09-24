'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  onSend: (body: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Écrivez votre message...',
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSend = async () => {
    if (!text.trim() || disabled) return;
    const toSend = text;
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSend(toSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-adjust height up to 120px
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="p-3 border-t border-gray-200/90 bg-white">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-1.5 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/20 transition-all"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent px-3 py-1.5 text-sm resize-none focus:outline-none max-h-[120px] text-gray-900 placeholder:text-gray-400"
        />

        <Button
          type="submit"
          size="sm"
          disabled={!text.trim() || disabled}
          className="rounded-xl h-9 w-9 p-0 bg-red-600 hover:bg-red-700 text-white shrink-0 transition-transform active:scale-95 disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
          <span className="sr-only">Envoyer</span>
        </Button>
      </form>
      <div className="flex justify-between items-center px-1 pt-1.5 text-[10px] text-gray-400 select-none">
        <span>Appuyez sur Entrée pour envoyer, Maj + Entrée pour un saut de ligne</span>
      </div>
    </div>
  );
};
