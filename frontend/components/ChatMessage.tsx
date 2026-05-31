import React from 'react';
import { Message, Agent } from '../types';
import { User, Sparkles, Terminal, Database, Feather } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: Message;
  agent: Agent;
}

const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  Terminal,
  Database,
  Feather,
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, agent }) => {
  const isUser = message.role === 'user';
  const AgentIcon = iconMap[agent.iconName] || Sparkles;

  return (
    <div className={`flex gap-4 w-full ${isUser ? 'justify-end' : 'justify-start'} group`}>
      
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${agent.themeColor} shadow-lg`}>
            <AgentIcon className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`
        max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4
        ${isUser 
          ? 'bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-900/20' 
          : 'bg-gray-800/80 border border-gray-700/50 text-gray-100 rounded-tl-sm shadow-sm'}
      `}>
        {isUser ? (
          <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>
        ) : (
          <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:my-2">
            {message.text ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.text}
              </ReactMarkdown>
            ) : (
              <div className="flex items-center gap-1 h-6">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center border border-gray-600">
            <User className="w-5 h-5 text-gray-300" />
          </div>
        </div>
      )}
    </div>
  );
};
