import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { ApiConfig, ApiResponse } from '../types';

export class ApiConfigController {
  async createConfig(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        provider,
        apiKey,
        baseUrl,
        model,
        parameters = {}
      } = req.body;

      const config: ApiConfig = {
        id: uuidv4(),
        name,
        provider,
        apiKey,
        baseUrl,
        model,
        parameters,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await database.run(
        `INSERT INTO api_configs (id, name, provider, api_key, base_url, model, parameters, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          config.id,
          config.name,
          config.provider,
          config.apiKey,
          config.baseUrl,
          config.model,
          JSON.stringify(config.parameters),
          config.isActive ? 1 : 0,
          config.createdAt.toISOString(),
          config.updatedAt.toISOString()
        ]
      );

      const response: ApiResponse<ApiConfig> = {
        success: true,
        data: { ...config, apiKey: '***' }, // Hide API key in response
        message: 'API config created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating API config:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create API config'
      };
      res.status(500).json(response);
    }
  }

  async getConfigs(req: Request, res: Response): Promise<void> {
    try {
      const configs = await database.all<any>(
        'SELECT id, name, provider, base_url, model, parameters, is_active, created_at, updated_at FROM api_configs ORDER BY created_at DESC'
      );

      const formattedConfigs = configs.map(config => ({
        id: config.id,
        name: config.name,
        provider: config.provider,
        apiKey: '***', // Hide API key in list
        baseUrl: config.base_url,
        model: config.model,
        parameters: JSON.parse(config.parameters),
        isActive: Boolean(config.is_active),
        createdAt: new Date(config.created_at),
        updatedAt: new Date(config.updated_at)
      }));

      const response: ApiResponse<ApiConfig[]> = {
        success: true,
        data: formattedConfigs
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching API configs:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch API configs'
      };
      res.status(500).json(response);
    }
  }

  async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const config = await database.get<any>(
        'SELECT id, name, provider, base_url, model, parameters, is_active, created_at, updated_at FROM api_configs WHERE id = ?',
        [id]
      );

      if (!config) {
        const response: ApiResponse = {
          success: false,
          error: 'API config not found'
        };
        res.status(404).json(response);
        return;
      }

      const formattedConfig = {
        id: config.id,
        name: config.name,
        provider: config.provider,
        apiKey: '***', // Hide API key
        baseUrl: config.base_url,
        model: config.model,
        parameters: JSON.parse(config.parameters),
        isActive: Boolean(config.is_active),
        createdAt: new Date(config.created_at),
        updatedAt: new Date(config.updated_at)
      };

      const response: ApiResponse<ApiConfig> = {
        success: true,
        data: formattedConfig
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching API config:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch API config'
      };
      res.status(500).json(response);
    }
  }

  async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        provider,
        apiKey,
        baseUrl,
        model,
        parameters,
        isActive
      } = req.body;

      const existing = await database.get('SELECT id FROM api_configs WHERE id = ?', [id]);
      if (!existing) {
        const response: ApiResponse = {
          success: false,
          error: 'API config not found'
        };
        res.status(404).json(response);
        return;
      }

      await database.run(
        `UPDATE api_configs SET 
         name = ?, provider = ?, api_key = ?, base_url = ?, model = ?, 
         parameters = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, provider, apiKey, baseUrl, model, JSON.stringify(parameters), isActive ? 1 : 0, id]
      );

      const response: ApiResponse = {
        success: true,
        message: 'API config updated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating API config:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update API config'
      };
      res.status(500).json(response);
    }
  }

  async deleteConfig(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await database.get('SELECT id FROM api_configs WHERE id = ?', [id]);
      if (!existing) {
        const response: ApiResponse = {
          success: false,
          error: 'API config not found'
        };
        res.status(404).json(response);
        return;
      }

      await database.run('DELETE FROM api_configs WHERE id = ?', [id]);

      const response: ApiResponse = {
        success: true,
        message: 'API config deleted successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error deleting API config:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete API config'
      };
      res.status(500).json(response);
    }
  }
}

export default new ApiConfigController();