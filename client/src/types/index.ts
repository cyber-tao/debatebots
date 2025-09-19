// Frontend types (matches backend types)
export interface ApiConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  baseUrl?: string;
  model: string;
  parameters: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AiParticipant {
  id: string;
  name: string;
  apiConfigId: string;
  apiConfigName?: string;
  model?: string;
  stance: 'pro' | 'con';
  personality: string;
  instructions: string;
  isActive: boolean;
}

export interface Judge {
  id: string;
  name: string;
  apiConfigId: string;
  apiConfigName?: string;
  model?: string;
  criteria: string[];
  instructions: string;
  isActive: boolean;
}

export interface DebateSession {
  id: string;
  topic: string;
  description?: string;
  participants: AiParticipant[];
  judges: Judge[];
  maxRounds: number;
  maxWordsPerTurn: number;
  status: 'created' | 'running' | 'paused' | 'completed' | 'cancelled';
  currentRound: number;
  currentTurn: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface DebateMessage {
  id: string;
  sessionId: string;
  participantId: string;
  participantName?: string;
  stance?: 'pro' | 'con';
  round: number;
  turn: number;
  content: string;
  wordCount: number;
  timestamp: Date;
}

export interface JudgeScore {
  id: string;
  sessionId: string;
  judgeId: string;
  judgeName?: string;
  participantId: string;
  participantName?: string;
  stance?: 'pro' | 'con';
  criteria: string;
  score: number;
  maxScore: number;
  comments: string;
  timestamp: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateDebateRequest {
  topic: string;
  description?: string;
  participantIds: string[];
  judgeIds: string[];
  maxRounds: number;
  maxWordsPerTurn: number;
}

// UI-specific types
export interface NavItem {
  name: string;
  href: string;
  icon?: any;
  current?: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}