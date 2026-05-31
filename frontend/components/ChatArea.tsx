import React, { useState, useRef, useEffect } from 'react';
import { Agent, Message } from '../types';
import { ChatMessage } from './ChatMessage';
import { Send, Menu, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { FREE_TIER_LIMIT } from '../constants';

interface ChatAreaProps {
  agent: Agent;
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  onOpenSidebar: () => void;
  isAuthenticated: boolean;
  freeMessagesUsed: number;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ 
  agent, 
  messages, 
  onSendMessage, 
  isTyping,
  onOpenSidebar,
  isAuthenticated,
  freeMessagesUsed
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLimitReached = !isAuthenticated && freeMessagesUsed >= FREE_TIER_LIMIT;
  const inputDisabled = isTyping || isLimitReached;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !inputDisabled) {
      onSendMessage(input.trim());
      setInput('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030712] relative overflow-hidden">
      
      {/* Top Navigation Bar (Mobile & Desktop) */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenSidebar}
            className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-100 flex items-center gap-2">
              {agent.name}
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </span>
            <span className="text-xs text-gray-500">{agent.role}</span>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${agent.themeColor} flex items-center justify-center mb-6 shadow-2xl shadow-${agent.themeColor.split('-')[1]}-500/20`}>
              <SparklesIcon name={agent.iconName} className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Chat with {agent.name}</h2>
            <p className="text-gray-400 leading-relaxed">{agent.description}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} agent={agent} />
          ))
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gradient-to-t from-[#030712] via-[#030712] to-transparent pt-8 shrink-0">
        <div className="max-w-4xl mx-auto relative">
          <form 
            onSubmit={handleSubmit}
            className={`relative flex items-end gap-2 bg-gray-800/50 border rounded-2xl p-2 shadow-lg backdrop-blur-xl transition-all duration-200
              ${isLimitReached ? 'border-red-900/50 bg-red-950/20' : 'border-gray-700/50 focus-within:border-gray-600 focus-within:bg-gray-800/80'}
            `}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={isLimitReached ? "Free tier limit reached. Please login as Admin." : `Message ${agent.name}...`}
              className="w-full max-h-[200px] min-h-[44px] bg-transparent text-gray-100 placeholder-gray-500 resize-none focus:outline-none py-3 px-4 leading-relaxed disabled:opacity-50"
              rows={1}
              disabled={inputDisabled}
            />
            <button
              type="submit"
              disabled={!input.trim() || inputDisabled}
              className={`
                p-3 rounded-xl flex-shrink-0 transition-all duration-200 mb-1 mr-1
                ${input.trim() && !inputDisabled 
                  ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md' 
                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'}
              `}
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-gray-600">AI can make mistakes. Consider verifying important information.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper to render dynamic icon in empty state
const SparklesIcon = ({ name, className }: { name: string, className: string }) => {
  const Icon = (LucideIcons as any)[name] || LucideIcons.Sparkles;
  return <Icon className={className} />;
}
