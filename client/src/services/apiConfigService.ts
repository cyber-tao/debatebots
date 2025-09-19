import { apiClient } from './api';
import { ApiConfig, ApiResponse } from '../types';

export const apiConfigService = {
  // Get all API configurations
  getAll: (): Promise<ApiResponse<ApiConfig[]>> => {
    return apiClient.get('/configs');
  },

  // Get single API configuration
  getById: (id: string): Promise<ApiResponse<ApiConfig>> => {
    return apiClient.get(`/configs/${id}`);
  },

  // Create new API configuration
  create: (config: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ApiConfig>> => {
    return apiClient.post('/configs', config);
  },

  // Update API configuration
  update: (id: string, config: Partial<ApiConfig>): Promise<ApiResponse> => {
    return apiClient.put(`/configs/${id}`, config);
  },

  // Delete API configuration
  delete: (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/configs/${id}`);
  },

  // Test API configuration
  test: (config: Partial<ApiConfig>): Promise<ApiResponse> => {
    return apiClient.post('/configs/test', config);
  },
};