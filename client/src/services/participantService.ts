import { apiClient } from './api';
import { AiParticipant, Judge, ApiResponse } from '../types';

export const participantService = {
  // AI Participants
  participants: {
    getAll: (): Promise<ApiResponse<AiParticipant[]>> => {
      return apiClient.get('/participants');
    },

    create: (participant: Omit<AiParticipant, 'id'>): Promise<ApiResponse<AiParticipant>> => {
      return apiClient.post('/participants', participant);
    },

    update: (id: string, participant: Partial<AiParticipant>): Promise<ApiResponse> => {
      return apiClient.put(`/participants/${id}`, participant);
    },

    delete: (id: string): Promise<ApiResponse> => {
      return apiClient.delete(`/participants/${id}`);
    },
  },

  // Judges
  judges: {
    getAll: (): Promise<ApiResponse<Judge[]>> => {
      return apiClient.get('/judges');
    },

    create: (judge: Omit<Judge, 'id'>): Promise<ApiResponse<Judge>> => {
      return apiClient.post('/judges', judge);
    },

    update: (id: string, judge: Partial<Judge>): Promise<ApiResponse> => {
      return apiClient.put(`/judges/${id}`, judge);
    },

    delete: (id: string): Promise<ApiResponse> => {
      return apiClient.delete(`/judges/${id}`);
    },
  },
};