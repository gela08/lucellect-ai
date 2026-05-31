import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { LoginModal } from './components/LoginModal';
import { AGENTS, FREE_TIER_LIMIT, ADMIN_PASSCODE } from './constants';
import { Message } from './types';
import { createChatSession } from './services/geminiService';
import { Chat } from '@google/genai';

export default function App() {
  const [activeAgentId, setActiveAgentId] = useState<string>(AGENTS[0].id);
  const [sessions, setSessions] = useState<Record<string, Message[]>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth & Limits State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [freeMessagesUsed, setFreeMessagesUsed] = useState(0);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Ref to hold the active Gemini Chat instances per agent
  const chatRefs = useRef<Record<string, Chat>>({});

  const activeAgent = AGENTS.find(a => a.id === activeAgentId) || AGENTS[0];
  const currentMessages = sessions[activeAgentId] || [];

  // Load auth state from local storage on mount
  useEffect(() => {
    const auth = localStorage.getItem('lucellect_auth') === 'true';
    const used = parseInt(localStorage.getItem('lucellect_used') || '0', 10);
    setIsAuthenticated(auth);
    setFreeMessagesUsed(used);
  }, []);

  // Initialize chat session when agent changes
  useEffect(() => {
    if (!chatRefs.current[activeAgentId]) {
      chatRefs.current[activeAgentId] = createChatSession(activeAgent.systemInstruction);
    }
    
    // Initialize greeting if no messages exist for this agent
    setSessions(prev => {
      if (!prev[activeAgentId] || prev[activeAgentId].length === 0) {
        return {
          ...prev,
          [activeAgentId]: [{
            id: Date.now().toString(),
            role: 'model',
            text: activeAgent.greeting,
            timestamp: Date.now()
          }]
        };
      }
      return prev;
    });
  }, [activeAgentId, activeAgent.systemInstruction, activeAgent.greeting]);

  const handleLogin = (passcode: string) => {
    // Ensure ADMIN_PASSCODE exists and matches the input
    if (ADMIN_PASSCODE && passcode === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      localStorage.setItem('lucellect_auth', 'true');
      setIsLoginModalOpen(false);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('lucellect_auth');
  };

  const handleSendMessage = useCallback(async (text: string) => {
    const chat = chatRefs.current[activeAgentId];
    if (!chat) return;

    const userMsgId = Date.now().toString();
    const modelMsgId = (Date.now() + 1).toString();

    // 1. Add user message
    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      text,
      timestamp: Date.now()
    };

    // Check Free Tier Limit
    if (!isAuthenticated && freeMessagesUsed >= FREE_TIER_LIMIT) {
      const limitMsg: Message = {
        id: modelMsgId,
        role: 'model',
        text: 'Free tier limit reached. Please login as Admin to continue using Lucellect AI.',
        timestamp: Date.now()
      };
      setSessions(prev => ({
        ...prev,
        [activeAgentId]: [...(prev[activeAgentId] || []), userMessage, limitMsg]
      }));
      setIsLoginModalOpen(true);
      return;
    }

    // 2. Add empty model message for streaming
    const initialModelMessage: Message = {
      id: modelMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isStreaming: true
    };

    setSessions(prev => ({
      ...prev,
      [activeAgentId]: [...(prev[activeAgentId] || []), userMessage, initialModelMessage]
    }));

    setIsTyping(true);

    // Increment usage if not authenticated
    if (!isAuthenticated) {
      const newUsed = freeMessagesUsed + 1;
      setFreeMessagesUsed(newUsed);
      localStorage.setItem('lucellect_used', newUsed.toString());
    }

    let retries = 0;
    const maxRetries = 3;
    let success = false;

    while (retries < maxRetries && !success) {
      try {
        const stream = await chat.sendMessageStream({ message: text });
        
        for await (const chunk of stream) {
          setSessions(prev => {
            const currentAgentMessages = prev[activeAgentId] || [];
            const updatedMessages = [...currentAgentMessages];
            const lastMessageIndex = updatedMessages.length - 1;
            
            if (updatedMessages[lastMessageIndex].id === modelMsgId) {
              updatedMessages[lastMessageIndex] = {
                ...updatedMessages[lastMessageIndex],
                text: updatedMessages[lastMessageIndex].text + chunk.text
              };
            }
            
            return {
              ...prev,
              [activeAgentId]: updatedMessages
            };
          });
        }
        success = true;
      } catch (error: any) {
        console.error(`Error sending message (attempt ${retries + 1}):`, error);
        retries++;
        
        if (retries >= maxRetries) {
          setSessions(prev => {
            const currentAgentMessages = prev[activeAgentId] || [];
            const updatedMessages = [...currentAgentMessages];
            const lastMessageIndex = updatedMessages.length - 1;
            
            if (updatedMessages[lastMessageIndex].id === modelMsgId) {
              updatedMessages[lastMessageIndex] = {
                ...updatedMessages[lastMessageIndex],
                text: "I encountered an error processing your request after multiple attempts. Please try again later.",
                isStreaming: false
              };
            }
            return { ...prev, [activeAgentId]: updatedMessages };
          });
        } else {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retries - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    setIsTyping(false);
    // Remove streaming flag
    setSessions(prev => {
      const currentAgentMessages = prev[activeAgentId] || [];
      const updatedMessages = [...currentAgentMessages];
      const lastMessageIndex = updatedMessages.length - 1;
      
      if (updatedMessages[lastMessageIndex].id === modelMsgId) {
        updatedMessages[lastMessageIndex] = {
          ...updatedMessages[lastMessageIndex],
          isStreaming: false
        };
      }
      return { ...prev, [activeAgentId]: updatedMessages };
    });
  }, [activeAgentId, isAuthenticated, freeMessagesUsed]);

  return (
    <div className="flex h-screen w-full bg-[#030712] text-gray-100 overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar 
        agents={AGENTS} 
        activeAgentId={activeAgentId} 
        onSelectAgent={setActiveAgentId}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isAuthenticated={isAuthenticated}
        freeMessagesUsed={freeMessagesUsed}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />
        
        <ChatArea 
          agent={activeAgent}
          messages={currentMessages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isAuthenticated={isAuthenticated}
          freeMessagesUsed={freeMessagesUsed}
        />
      </main>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={handleLogin} 
      />
    </div>
  );
}
