import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { AiParticipant, Judge, ApiResponse } from '../types';

export class ParticipantController {
  // AI Participants
  async createParticipant(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        apiConfigId,
        stance,
        personality,
        instructions
      } = req.body;

      const participant: AiParticipant = {
        id: uuidv4(),
        name,
        apiConfigId,
        stance,
        personality,
        instructions,
        isActive: true
      };

      await database.run(
        `INSERT INTO ai_participants (id, name, api_config_id, stance, personality, instructions, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          participant.id,
          participant.name,
          participant.apiConfigId,
          participant.stance,
          participant.personality,
          participant.instructions,
          participant.isActive ? 1 : 0
        ]
      );

      const response: ApiResponse<AiParticipant> = {
        success: true,
        data: participant,
        message: 'AI participant created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating AI participant:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create AI participant'
      };
      res.status(500).json(response);
    }
  }

  async getParticipants(req: Request, res: Response): Promise<void> {
    try {
      const participants = await database.all<any>(
        `SELECT p.*, c.name as api_config_name, c.model 
         FROM ai_participants p 
         JOIN api_configs c ON p.api_config_id = c.id 
         ORDER BY p.name`
      );

      const formattedParticipants = participants.map(p => ({
        id: p.id,
        name: p.name,
        apiConfigId: p.api_config_id,
        apiConfigName: p.api_config_name,
        model: p.model,
        stance: p.stance,
        personality: p.personality,
        instructions: p.instructions,
        isActive: Boolean(p.is_active)
      }));

      const response: ApiResponse<any[]> = {
        success: true,
        data: formattedParticipants
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching AI participants:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch AI participants'
      };
      res.status(500).json(response);
    }
  }

  async updateParticipant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        apiConfigId,
        stance,
        personality,
        instructions,
        isActive
      } = req.body;

      const existing = await database.get('SELECT id FROM ai_participants WHERE id = ?', [id]);
      if (!existing) {
        const response: ApiResponse = {
          success: false,
          error: 'AI participant not found'
        };
        res.status(404).json(response);
        return;
      }

      await database.run(
        `UPDATE ai_participants SET 
         name = ?, api_config_id = ?, stance = ?, personality = ?, 
         instructions = ?, is_active = ?
         WHERE id = ?`,
        [name, apiConfigId, stance, personality, instructions, isActive ? 1 : 0, id]
      );

      const response: ApiResponse = {
        success: true,
        message: 'AI participant updated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating AI participant:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update AI participant'
      };
      res.status(500).json(response);
    }
  }

  async deleteParticipant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await database.get('SELECT id FROM ai_participants WHERE id = ?', [id]);
      if (!existing) {
        const response: ApiResponse = {
          success: false,
          error: 'AI participant not found'
        };
        res.status(404).json(response);
        return;
      }

      await database.run('DELETE FROM ai_participants WHERE id = ?', [id]);

      const response: ApiResponse = {
        success: true,
        message: 'AI participant deleted successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error deleting AI participant:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete AI participant'
      };
      res.status(500).json(response);
    }
  }

  // Judges
  async createJudge(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        apiConfigId,
        criteria,
        instructions
      } = req.body;

      const judge: Judge = {
        id: uuidv4(),
        name,
        apiConfigId,
        criteria,
        instructions,
        isActive: true
      };

      await database.run(
        `INSERT INTO judges (id, name, api_config_id, criteria, instructions, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          judge.id,
          judge.name,
          judge.apiConfigId,
          JSON.stringify(judge.criteria),
          judge.instructions,
          judge.isActive ? 1 : 0
        ]
      );

      const response: ApiResponse<Judge> = {
        success: true,
        data: judge,
        message: 'Judge created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating judge:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create judge'
      };
      res.status(500).json(response);
    }
  }

  async getJudges(req: Request, res: Response): Promise<void> {
    try {
      const judges = await database.all<any>(
        `SELECT j.*, c.name as api_config_name, c.model 
         FROM judges j 
         JOIN api_configs c ON j.api_config_id = c.id 
         ORDER BY j.name`
      );

      const formattedJudges = judges.map(j => ({
        id: j.id,
        name: j.name,
        apiConfigId: j.api_config_id,
        apiConfigName: j.api_config_name,
        model: j.model,
        criteria: JSON.parse(j.criteria),
        instructions: j.instructions,
        isActive: Boolean(j.is_active)
      }));

      const response: ApiResponse<any[]> = {
        success: true,
        data: formattedJudges
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching judges:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch judges'
      };
      res.status(500).json(response);
    }
  }

  async updateJudge(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        apiConfigId,
        criteria,
        instructions,
        isActive
      } = req.body;

      const existing = await database.get('SELECT id FROM judges WHERE id = ?', [id]);
      if (!existing) {
        const response: ApiResponse = {
          success: false,
          error: 'Judge not found'
        };
        res.status(404).json(response);
        return;
      }

      await database.run(
        `UPDATE judges SET 
         name = ?, api_config_id = ?, criteria = ?, instructions = ?, is_active = ?
         WHERE id = ?`,
        [name, apiConfigId, JSON.stringify(criteria), instructions, isActive ? 1 : 0, id]
      );

      const response: ApiResponse = {
        success: true,
        message: 'Judge updated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating judge:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update judge'
      };
      res.status(500).json(response);
    }
  }

  async deleteJudge(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await database.get('SELECT id FROM judges WHERE id = ?', [id]);
      if (!existing) {
        const response: ApiResponse = {
          success: false,
          error: 'Judge not found'
        };
        res.status(404).json(response);
        return;
      }

      await database.run('DELETE FROM judges WHERE id = ?', [id]);

      const response: ApiResponse = {
        success: true,
        message: 'Judge deleted successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error deleting judge:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete judge'
      };
      res.status(500).json(response);
    }
  }
}

export default new ParticipantController();