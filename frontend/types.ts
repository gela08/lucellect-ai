export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  iconName: string;
  systemInstruction: string;
  greeting: string;
  themeColor: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface ChatSession {
  agentId: string;
  messages: Message[];
}
