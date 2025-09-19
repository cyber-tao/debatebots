import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { DebateSession, CreateDebateRequest, ApiResponse, DebateMessage, JudgeScore } from '../types';
import DebateEngine from '../services/DebateEngine';

class DebateController {
  private activeEngines: Map<string, DebateEngine> = new Map();

  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const {
        topic,
        description,
        participantIds,
        judgeIds,
        maxRounds,
        maxWordsPerTurn
      }: CreateDebateRequest = req.body;

      const session: DebateSession = {
        id: uuidv4(),
        topic,
        description,
        participants: [], // Will be populated from database
        judges: [], // Will be populated from database
        maxRounds,
        maxWordsPerTurn,
        status: 'created',
        currentRound: 0,
        currentTurn: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert session
      await database.run(
        `INSERT INTO debate_sessions (id, topic, description, max_rounds, max_words_per_turn, status, current_round, current_turn, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          session.topic,
          session.description,
          session.maxRounds,
          session.maxWordsPerTurn,
          session.status,
          session.currentRound,
          session.currentTurn,
          session.createdAt.toISOString(),
          session.updatedAt.toISOString()
        ]
      );

      // Insert participants
      for (const participantId of participantIds) {
        await database.run(
          'INSERT INTO session_participants (session_id, participant_id) VALUES (?, ?)',
          [session.id, participantId]
        );
      }

      // Insert judges
      for (const judgeId of judgeIds) {
        await database.run(
          'INSERT INTO session_judges (session_id, judge_id) VALUES (?, ?)',
          [session.id, judgeId]
        );
      }

      const response: ApiResponse<DebateSession> = {
        success: true,
        data: session,
        message: 'Debate session created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating debate session:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create debate session'
      };
      res.status(500).json(response);
    }
  }

  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const sessions = await database.all<any>(
        'SELECT * FROM debate_sessions ORDER BY created_at DESC'
      );

      const formattedSessions = sessions.map(s => ({
        id: s.id,
        topic: s.topic,
        description: s.description,
        maxRounds: s.max_rounds,
        maxWordsPerTurn: s.max_words_per_turn,
        status: s.status,
        currentRound: s.current_round,
        currentTurn: s.current_turn,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
        completedAt: s.completed_at ? new Date(s.completed_at) : undefined
      }));

      const response: ApiResponse<any[]> = {
        success: true,
        data: formattedSessions
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching debate sessions:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch debate sessions'
      };
      res.status(500).json(response);
    }
  }

  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const session = await database.get<any>(
        'SELECT * FROM debate_sessions WHERE id = ?',
        [id]
      );

      if (!session) {
        const response: ApiResponse = {
          success: false,
          error: 'Debate session not found'
        };
        res.status(404).json(response);
        return;
      }

      // Get participants
      const participants = await database.all<any>(
        `SELECT p.*, sp.session_id 
         FROM ai_participants p 
         JOIN session_participants sp ON p.id = sp.participant_id 
         WHERE sp.session_id = ?`,
        [id]
      );

      // Get judges
      const judges = await database.all<any>(
        `SELECT j.*, sj.session_id 
         FROM judges j 
         JOIN session_judges sj ON j.id = sj.judge_id 
         WHERE sj.session_id = ?`,
        [id]
      );

      const formattedSession = {
        id: session.id,
        topic: session.topic,
        description: session.description,
        participants: participants.map(p => ({
          id: p.id,
          name: p.name,
          apiConfigId: p.api_config_id,
          stance: p.stance,
          personality: p.personality,
          instructions: p.instructions,
          isActive: Boolean(p.is_active)
        })),
        judges: judges.map(j => ({
          id: j.id,
          name: j.name,
          apiConfigId: j.api_config_id,
          criteria: JSON.parse(j.criteria),
          instructions: j.instructions,
          isActive: Boolean(j.is_active)
        })),
        maxRounds: session.max_rounds,
        maxWordsPerTurn: session.max_words_per_turn,
        status: session.status,
        currentRound: session.current_round,
        currentTurn: session.current_turn,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
        completedAt: session.completed_at ? new Date(session.completed_at) : undefined
      };

      const response: ApiResponse<any> = {
        success: true,
        data: formattedSession
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching debate session:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch debate session'
      };
      res.status(500).json(response);
    }
  }

  async startSession(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const session = await database.get<any>(
        'SELECT * FROM debate_sessions WHERE id = ?',
        [id]
      );

      if (!session) {
        const response: ApiResponse = {
          success: false,
          error: 'Debate session not found'
        };
        res.status(404).json(response);
        return;
      }

      if (session.status !== 'created' && session.status !== 'paused') {
        const response: ApiResponse = {
          success: false,
          error: 'Session cannot be started in its current state'
        };
        res.status(400).json(response);
        return;
      }

      // Create and initialize debate engine
      const engine = new DebateEngine({
        id: session.id,
        topic: session.topic,
        description: session.description,
        participants: [],
        judges: [],
        maxRounds: session.max_rounds,
        maxWordsPerTurn: session.max_words_per_turn,
        status: session.status,
        currentRound: session.current_round,
        currentTurn: session.current_turn,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
        completedAt: session.completed_at ? new Date(session.completed_at) : undefined
      });

      await engine.initialize();
      this.activeEngines.set(id, engine);

      // Start the debate
      engine.startDebate().catch(err => {
        console.error('Debate engine error:', err);
        this.activeEngines.delete(id);
      });

      const response: ApiResponse = {
        success: true,
        message: 'Debate session started successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error starting debate session:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to start debate session'
      };
      res.status(500).json(response);
    }
  }

  async pauseSession(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const engine = this.activeEngines.get(id);
      if (!engine) {
        const response: ApiResponse = {
          success: false,
          error: 'Debate session is not running'
        };
        res.status(400).json(response);
        return;
      }

      await engine.pauseDebate();

      const response: ApiResponse = {
        success: true,
        message: 'Debate session paused successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error pausing debate session:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to pause debate session'
      };
      res.status(500).json(response);
    }
  }

  async stopSession(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const engine = this.activeEngines.get(id);
      if (!engine) {
        const response: ApiResponse = {
          success: false,
          error: 'Debate session is not running'
        };
        res.status(400).json(response);
        return;
      }

      await engine.stopDebate();
      this.activeEngines.delete(id);

      const response: ApiResponse = {
        success: true,
        message: 'Debate session stopped successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error stopping debate session:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to stop debate session'
      };
      res.status(500).json(response);
    }
  }

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const messages = await database.all<any>(
        `SELECT dm.*, p.name as participant_name, p.stance 
         FROM debate_messages dm 
         JOIN ai_participants p ON dm.participant_id = p.id 
         WHERE dm.session_id = ? 
         ORDER BY dm.round, dm.turn`,
        [id]
      );

      const formattedMessages = messages.map(m => ({
        id: m.id,
        sessionId: m.session_id,
        participantId: m.participant_id,
        participantName: m.participant_name,
        stance: m.stance,
        round: m.round,
        turn: m.turn,
        content: m.content,
        wordCount: m.word_count,
        timestamp: new Date(m.timestamp)
      }));

      const response: ApiResponse<any[]> = {
        success: true,
        data: formattedMessages
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching debate messages:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch debate messages'
      };
      res.status(500).json(response);
    }
  }

  async getScores(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const scores = await database.all<any>(
        `SELECT js.*, j.name as judge_name, p.name as participant_name, p.stance 
         FROM judge_scores js 
         JOIN judges j ON js.judge_id = j.id 
         JOIN ai_participants p ON js.participant_id = p.id 
         WHERE js.session_id = ? 
         ORDER BY js.timestamp`,
        [id]
      );

      const formattedScores = scores.map(s => ({
        id: s.id,
        sessionId: s.session_id,
        judgeId: s.judge_id,
        judgeName: s.judge_name,
        participantId: s.participant_id,
        participantName: s.participant_name,
        stance: s.stance,
        criteria: s.criteria,
        score: s.score,
        maxScore: s.max_score,
        comments: s.comments,
        timestamp: new Date(s.timestamp)
      }));

      const response: ApiResponse<any[]> = {
        success: true,
        data: formattedScores
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching judge scores:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch judge scores'
      };
      res.status(500).json(response);
    }
  }

  async exportSession(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get session details
      const session = await database.get<any>(
        'SELECT * FROM debate_sessions WHERE id = ?',
        [id]
      );

      if (!session) {
        const response: ApiResponse = {
          success: false,
          error: 'Debate session not found'
        };
        res.status(404).json(response);
        return;
      }

      // Get participants
      const participants = await database.all<any>(
        `SELECT p.* FROM ai_participants p 
         JOIN session_participants sp ON p.id = sp.participant_id 
         WHERE sp.session_id = ?`,
        [id]
      );

      // Get judges
      const judges = await database.all<any>(
        `SELECT j.* FROM judges j 
         JOIN session_judges sj ON j.id = sj.judge_id 
         WHERE sj.session_id = ?`,
        [id]
      );

      // Get messages
      const messages = await database.all<any>(
        `SELECT dm.*, p.name as participant_name, p.stance 
         FROM debate_messages dm 
         JOIN ai_participants p ON dm.participant_id = p.id 
         WHERE dm.session_id = ? 
         ORDER BY dm.round, dm.turn`,
        [id]
      );

      // Get scores
      const scores = await database.all<any>(
        `SELECT js.*, j.name as judge_name, p.name as participant_name, p.stance 
         FROM judge_scores js 
         JOIN judges j ON js.judge_id = j.id 
         JOIN ai_participants p ON js.participant_id = p.id 
         WHERE js.session_id = ? 
         ORDER BY js.timestamp`,
        [id]
      );

      // Generate Markdown
      const markdown = this.generateMarkdownReport({
        session,
        participants,
        judges,
        messages,
        scores
      });

      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="debate-${id}.md"`);
      res.send(markdown);
    } catch (error) {
      console.error('Error exporting debate session:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to export debate session'
      };
      res.status(500).json(response);
    }
  }

  private generateMarkdownReport(data: any): string {
    const { session, participants, judges, messages, scores } = data;
    
    let markdown = `# Debate Report: ${session.topic}\n\n`;
    
    markdown += `## Session Information\n\n`;
    markdown += `- **Topic**: ${session.topic}\n`;
    if (session.description) {
      markdown += `- **Description**: ${session.description}\n`;
    }
    markdown += `- **Status**: ${session.status}\n`;
    markdown += `- **Rounds**: ${session.current_round}/${session.max_rounds}\n`;
    markdown += `- **Max Words per Turn**: ${session.max_words_per_turn}\n`;
    markdown += `- **Created**: ${new Date(session.created_at).toLocaleString()}\n`;
    if (session.completed_at) {
      markdown += `- **Completed**: ${new Date(session.completed_at).toLocaleString()}\n`;
    }
    markdown += `\n`;

    markdown += `## Participants\n\n`;
    for (const participant of participants) {
      markdown += `### ${participant.name} (${participant.stance.toUpperCase()})\n\n`;
      markdown += `- **Stance**: ${participant.stance}\n`;
      markdown += `- **Personality**: ${participant.personality}\n`;
      markdown += `- **Instructions**: ${participant.instructions}\n\n`;
    }

    markdown += `## Judges\n\n`;
    for (const judge of judges) {
      markdown += `### ${judge.name}\n\n`;
      markdown += `- **Criteria**: ${JSON.parse(judge.criteria).join(', ')}\n`;
      markdown += `- **Instructions**: ${judge.instructions}\n\n`;
    }

    if (messages.length > 0) {
      markdown += `## Debate Transcript\n\n`;
      
      let currentRound = 0;
      for (const message of messages) {
        if (message.round !== currentRound) {
          currentRound = message.round;
          markdown += `### Round ${currentRound}\n\n`;
        }
        
        markdown += `**${message.participant_name} (${message.stance.toUpperCase()}):**\n\n`;
        markdown += `${message.content}\n\n`;
        markdown += `*Word count: ${message.word_count} | ${new Date(message.timestamp).toLocaleString()}*\n\n`;
        markdown += `---\n\n`;
      }
    }

    if (scores.length > 0) {
      markdown += `## Judge Scores\n\n`;
      
      // Calculate totals
      const proScores = scores.filter((s: any) => s.stance === 'pro');
      const conScores = scores.filter((s: any) => s.stance === 'con');
      const proTotal = proScores.reduce((sum: number, s: any) => sum + s.score, 0);
      const conTotal = conScores.reduce((sum: number, s: any) => sum + s.score, 0);
      
      markdown += `### Final Results\n\n`;
      markdown += `- **PRO Total Score**: ${proTotal}\n`;
      markdown += `- **CON Total Score**: ${conTotal}\n`;
      markdown += `- **Winner**: ${proTotal > conTotal ? 'PRO' : conTotal > proTotal ? 'CON' : 'TIE'}\n\n`;

      markdown += `### Detailed Scores\n\n`;
      for (const score of scores) {
        markdown += `**${score.judge_name}** → **${score.participant_name} (${score.stance.toUpperCase()})**\n\n`;
        markdown += `- **Score**: ${score.score}/${score.max_score}\n`;
        markdown += `- **Criteria**: ${score.criteria}\n`;
        markdown += `- **Comments**: ${score.comments}\n\n`;
        markdown += `---\n\n`;
      }
    }

    return markdown;
  }
}

export default new DebateController();