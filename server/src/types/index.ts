// Core type definitions for the debate platform
export interface ApiConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  apiKey: string;
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
  stance: 'pro' | 'con';
  personality: string;
  instructions: string;
  isActive: boolean;
}

export interface Judge {
  id: string;
  name: string;
  apiConfigId: string;
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
  participantId: string;
  criteria: string;
  score: number;
  maxScore: number;
  comments: string;
  timestamp: Date;
}

export interface DebateResult {
  sessionId: string;
  winner: 'pro' | 'con' | 'tie';
  totalScores: {
    pro: number;
    con: number;
  };
  judgeScores: JudgeScore[];
  summary: string;
  completedAt: Date;
}

// API Request/Response types
export interface CreateDebateRequest {
  topic: string;
  description?: string;
  participantIds: string[];
  judgeIds: string[];
  maxRounds: number;
  maxWordsPerTurn: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'debate_update' | 'new_message' | 'session_status' | 'error' | 'pong' | 'subscribed' | 'unsubscribed';
  payload: any;
}

export interface DebateUpdatePayload {
  sessionId: string;
  status: DebateSession['status'];
  currentRound: number;
  currentTurn: number;
  message?: DebateMessage;
}