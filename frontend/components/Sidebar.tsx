import React from 'react';
import { Agent } from '../types';
import { Sparkles, Terminal, Database, Feather, Settings, Menu, X, LogIn, LogOut } from 'lucide-react';
import { FREE_TIER_LIMIT } from '../constants';

interface SidebarProps {
  agents: Agent[];
  activeAgentId: string;
  onSelectAgent: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isAuthenticated: boolean;
  freeMessagesUsed: number;
  onOpenLogin: () => void;
  onLogout: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  Terminal,
  Database,
  Feather,
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  agents, 
  activeAgentId, 
  onSelectAgent, 
  isOpen, 
  setIsOpen,
  isAuthenticated,
  freeMessagesUsed,
  onOpenLogin,
  onLogout
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-72 bg-gray-900/80 backdrop-blur-xl border-r border-gray-800
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">
              Lucellect
            </h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
            Specialized Agents
          </div>
          
          {agents.map((agent) => {
            const Icon = iconMap[agent.iconName] || Sparkles;
            const isActive = activeAgentId === agent.id;
            
            return (
              <button
                key={agent.id}
                onClick={() => {
                  onSelectAgent(agent.id);
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
                className={`
                  w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-200 text-left group
                  ${isActive 
                    ? 'bg-gray-800/80 shadow-sm border border-gray-700/50' 
                    : 'hover:bg-gray-800/40 border border-transparent hover:border-gray-700/30'}
                `}
              >
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${isActive ? `bg-gradient-to-br ${agent.themeColor} text-white shadow-lg` : 'bg-gray-800 text-gray-400 group-hover:text-gray-200'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                    {agent.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {agent.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer / Settings & Auth */}
        <div className="p-4 border-t border-gray-800/50 space-y-3">
          {!isAuthenticated && (
            <div className="px-3 py-3 bg-gray-800/40 rounded-xl border border-gray-700/50">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-400 font-medium">Free Tier Usage</span>
                <span className="text-gray-300 font-bold">{freeMessagesUsed} / {FREE_TIER_LIMIT}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${freeMessagesUsed >= FREE_TIER_LIMIT ? 'bg-red-500' : 'bg-blue-500'}`} 
                  style={{ width: `${Math.min((freeMessagesUsed / FREE_TIER_LIMIT) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          {isAuthenticated ? (
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
            >
              <LogOut className="w-5 h-5 text-red-400" />
              <span className="font-medium">Logout (Angela)</span>
            </button>
          ) : (
            <button 
              onClick={onOpenLogin}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
            >
              <LogIn className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Admin Login</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
