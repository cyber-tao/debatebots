import { apiClient } from './api';
import { DebateSession, DebateMessage, JudgeScore, CreateDebateRequest, ApiResponse } from '../types';

export const debateService = {
  // Sessions
  sessions: {
    getAll: (): Promise<ApiResponse<DebateSession[]>> => {
      return apiClient.get('/sessions');
    },

    getById: (id: string): Promise<ApiResponse<DebateSession>> => {
      return apiClient.get(`/sessions/${id}`);
    },

    create: (request: CreateDebateRequest): Promise<ApiResponse<DebateSession>> => {
      return apiClient.post('/sessions', request);
    },

    start: (id: string): Promise<ApiResponse> => {
      return apiClient.post(`/sessions/${id}/start`);
    },

    pause: (id: string): Promise<ApiResponse> => {
      return apiClient.post(`/sessions/${id}/pause`);
    },

    stop: (id: string): Promise<ApiResponse> => {
      return apiClient.post(`/sessions/${id}/stop`);
    },

    export: async (id: string): Promise<Blob> => {
      return apiClient.download(`/sessions/${id}/export`);
    },
  },

  // Messages
  messages: {
    getBySession: (sessionId: string): Promise<ApiResponse<DebateMessage[]>> => {
      return apiClient.get(`/sessions/${sessionId}/messages`);
    },
  },

  // Scores
  scores: {
    getBySession: (sessionId: string): Promise<ApiResponse<JudgeScore[]>> => {
      return apiClient.get(`/sessions/${sessionId}/scores`);
    },
  },
};