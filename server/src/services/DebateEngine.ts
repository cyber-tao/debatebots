import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { 
  DebateSession, 
  AiParticipant, 
  Judge, 
  DebateMessage, 
  JudgeScore, 
  DebateResult,
  ApiConfig
} from '../types';
import { AiServiceFactory } from './AiServiceFactory';

export class DebateEngine extends EventEmitter {
  private session: DebateSession;
  private participants: Map<string, AiParticipant> = new Map();
  private judges: Map<string, Judge> = new Map();
  private apiConfigs: Map<string, ApiConfig> = new Map();
  private isRunning = false;

  constructor(session: DebateSession) {
    super();
    this.session = session;
  }

  async initialize(): Promise<void> {
    // Load participants
    const participantRows = await database.all(
      `SELECT p.*, sp.session_id 
       FROM ai_participants p 
       JOIN session_participants sp ON p.id = sp.participant_id 
       WHERE sp.session_id = ?`,
      [this.session.id]
    );

    for (const row of participantRows) {
      const participant: AiParticipant = {
        id: row.id,
        name: row.name,
        apiConfigId: row.api_config_id,
        stance: row.stance,
        personality: row.personality,
        instructions: row.instructions,
        isActive: Boolean(row.is_active)
      };
      this.participants.set(participant.id, participant);
    }

    // Load judges
    const judgeRows = await database.all(
      `SELECT j.*, sj.session_id 
       FROM judges j 
       JOIN session_judges sj ON j.id = sj.judge_id 
       WHERE sj.session_id = ?`,
      [this.session.id]
    );

    for (const row of judgeRows) {
      const judge: Judge = {
        id: row.id,
        name: row.name,
        apiConfigId: row.api_config_id,
        criteria: JSON.parse(row.criteria),
        instructions: row.instructions,
        isActive: Boolean(row.is_active)
      };
      this.judges.set(judge.id, judge);
    }

    // Load API configs
    const apiConfigIds = new Set([
      ...Array.from(this.participants.values()).map(p => p.apiConfigId),
      ...Array.from(this.judges.values()).map(j => j.apiConfigId)
    ]);

    for (const configId of apiConfigIds) {
      const configRow = await database.get(
        'SELECT * FROM api_configs WHERE id = ?',
        [configId]
      );
      
      if (configRow) {
        const config: ApiConfig = {
          id: configRow.id,
          name: configRow.name,
          provider: configRow.provider,
          apiKey: configRow.api_key,
          baseUrl: configRow.base_url,
          model: configRow.model,
          parameters: JSON.parse(configRow.parameters),
          isActive: Boolean(configRow.is_active),
          createdAt: new Date(configRow.created_at),
          updatedAt: new Date(configRow.updated_at)
        };
        this.apiConfigs.set(config.id, config);
      }
    }
  }

  async startDebate(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Debate is already running');
    }

    this.isRunning = true;
    this.session.status = 'running';
    
    await database.run(
      'UPDATE debate_sessions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['running', this.session.id]
    );

    this.emit('statusChange', { sessionId: this.session.id, status: 'running' });

    try {
      await this.runDebateLoop();
    } catch (error: any) {
      console.error('Debate error:', error);
      this.session.status = 'cancelled';
      await database.run(
        'UPDATE debate_sessions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['cancelled', this.session.id]
      );
      this.emit('error', { sessionId: this.session.id, error: error.message });
    } finally {
      this.isRunning = false;
    }
  }

  async pauseDebate(): Promise<void> {
    this.isRunning = false;
    this.session.status = 'paused';
    
    await database.run(
      'UPDATE debate_sessions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['paused', this.session.id]
    );

    this.emit('statusChange', { sessionId: this.session.id, status: 'paused' });
  }

  async stopDebate(): Promise<void> {
    this.isRunning = false;
    this.session.status = 'completed';
    
    await database.run(
      'UPDATE debate_sessions SET status = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['completed', this.session.id]
    );

    await this.runJudgingPhase();
    this.emit('statusChange', { sessionId: this.session.id, status: 'completed' });
  }

  private async runDebateLoop(): Promise<void> {
    const participants = Array.from(this.participants.values()).filter(p => p.isActive);
    
    for (let round = 1; round <= this.session.maxRounds && this.isRunning; round++) {
      this.session.currentRound = round;
      
      await database.run(
        'UPDATE debate_sessions SET current_round = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [round, this.session.id]
      );

      for (let turn = 0; turn < participants.length && this.isRunning; turn++) {
        this.session.currentTurn = turn + 1;
        const participant = participants[turn];
        
        await database.run(
          'UPDATE debate_sessions SET current_turn = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [turn + 1, this.session.id]
        );

        try {
          const message = await this.generateParticipantResponse(participant, round);
          await this.saveMessage(message);
          
          this.emit('newMessage', { 
            sessionId: this.session.id, 
            message,
            round,
            turn: turn + 1
          });

          // Add small delay between responses
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error generating response for ${participant.name}:`, error);
        }
      }
    }

    if (this.isRunning) {
      await this.stopDebate();
    }
  }

  private async generateParticipantResponse(participant: AiParticipant, round: number): Promise<DebateMessage> {
    const config = this.apiConfigs.get(participant.apiConfigId);
    if (!config) {
      throw new Error(`API config not found for participant ${participant.name}`);
    }

    const aiService = AiServiceFactory.createService(config);
    
    // Get debate context
    const context = await this.getDebateContext(round);
    
    // Create prompt
    const prompt = this.createDebatePrompt(participant, round, context);
    
    const response = await aiService.generateResponse(prompt);
    
    // Enforce word limit
    const limitedContent = aiService.enforceWordLimit(response.content, this.session.maxWordsPerTurn);
    const wordCount = aiService.countWords(limitedContent);

    return {
      id: uuidv4(),
      sessionId: this.session.id,
      participantId: participant.id,
      round,
      turn: this.session.currentTurn,
      content: limitedContent,
      wordCount,
      timestamp: new Date()
    };
  }

  private async getDebateContext(currentRound: number): Promise<string> {
    const messages = await database.all<any>(
      `SELECT dm.*, p.name as participant_name, p.stance 
       FROM debate_messages dm 
       JOIN ai_participants p ON dm.participant_id = p.id 
       WHERE dm.session_id = ? AND dm.round < ? 
       ORDER BY dm.round, dm.turn`,
      [this.session.id, currentRound]
    );

    if (messages.length === 0) {
      return `This is the beginning of a debate on the topic: "${this.session.topic}"`;
    }

    let context = `Previous discussion on topic: "${this.session.topic}"\n\n`;
    
    for (const msg of messages) {
      context += `Round ${msg.round}, ${msg.participant_name} (${msg.stance}): ${msg.content}\n\n`;
    }

    return context;
  }

  private createDebatePrompt(participant: AiParticipant, round: number, context: string): string {
    const baseInstructions = `You are ${participant.name}, participating in a debate with the ${participant.stance} stance on the topic: "${this.session.topic}".

Your personality: ${participant.personality}

Additional instructions: ${participant.instructions}

This is round ${round} of the debate. You have a maximum of ${this.session.maxWordsPerTurn} words for your response.

${context}

Please provide your argument for this round:`;

    return baseInstructions;
  }

  private async saveMessage(message: DebateMessage): Promise<void> {
    await database.run(
      `INSERT INTO debate_messages (id, session_id, participant_id, round, turn, content, word_count, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        message.id,
        message.sessionId,
        message.participantId,
        message.round,
        message.turn,
        message.content,
        message.wordCount,
        message.timestamp.toISOString()
      ]
    );
  }

  private async runJudgingPhase(): Promise<DebateResult> {
    const judges = Array.from(this.judges.values()).filter(j => j.isActive);
    const participants = Array.from(this.participants.values()).filter(p => p.isActive);
    
    const allScores: JudgeScore[] = [];

    for (const judge of judges) {
      for (const participant of participants) {
        try {
          const score = await this.generateJudgeScore(judge, participant);
          await this.saveJudgeScore(score);
          allScores.push(score);
        } catch (error) {
          console.error(`Error generating judge score for ${judge.name}:`, error);
        }
      }
    }

    return this.calculateFinalResult(allScores);
  }

  private async generateJudgeScore(judge: Judge, participant: AiParticipant): Promise<JudgeScore> {
    const config = this.apiConfigs.get(judge.apiConfigId);
    if (!config) {
      throw new Error(`API config not found for judge ${judge.name}`);
    }

    const aiService = AiServiceFactory.createService(config);
    
    // Get all participant messages
    const messages = await database.all<any>(
      `SELECT dm.* FROM debate_messages dm 
       WHERE dm.session_id = ? AND dm.participant_id = ?
       ORDER BY dm.round, dm.turn`,
      [this.session.id, participant.id]
    );

    const participantArguments = messages.map(msg => 
      `Round ${msg.round}: ${msg.content}`
    ).join('\n\n');

    const prompt = `You are ${judge.name}, a judge evaluating a debate on "${this.session.topic}".

Your judging criteria: ${judge.criteria.join(', ')}
Your instructions: ${judge.instructions}

Please evaluate the following participant's performance:
Participant: ${participant.name} (${participant.stance} stance)

Their arguments:
${participantArguments}

Please provide a score from 1-10 and detailed comments explaining your evaluation. Respond in this format:
SCORE: [number from 1-10]
COMMENTS: [detailed explanation]`;

    const response = await aiService.generateResponse(prompt);
    
    // Parse the response
    const scoreMatch = response.content.match(/SCORE:\s*(\d+)/i);
    const commentsMatch = response.content.match(/COMMENTS:\s*(.*)/is);
    
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
    const comments = commentsMatch ? commentsMatch[1].trim() : response.content;

    return {
      id: uuidv4(),
      sessionId: this.session.id,
      judgeId: judge.id,
      participantId: participant.id,
      criteria: judge.criteria.join(', '),
      score: Math.max(1, Math.min(10, score)),
      maxScore: 10,
      comments,
      timestamp: new Date()
    };
  }

  private async saveJudgeScore(score: JudgeScore): Promise<void> {
    await database.run(
      `INSERT INTO judge_scores (id, session_id, judge_id, participant_id, criteria, score, max_score, comments, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        score.id,
        score.sessionId,
        score.judgeId,
        score.participantId,
        score.criteria,
        score.score,
        score.maxScore,
        score.comments,
        score.timestamp.toISOString()
      ]
    );
  }

  private calculateFinalResult(scores: JudgeScore[]): DebateResult {
    const proScores = scores.filter(s => {
      const participant = this.participants.get(s.participantId);
      return participant?.stance === 'pro';
    });

    const conScores = scores.filter(s => {
      const participant = this.participants.get(s.participantId);
      return participant?.stance === 'con';
    });

    const proTotal = proScores.reduce((sum, s) => sum + s.score, 0);
    const conTotal = conScores.reduce((sum, s) => sum + s.score, 0);

    let winner: 'pro' | 'con' | 'tie';
    if (proTotal > conTotal) winner = 'pro';
    else if (conTotal > proTotal) winner = 'con';
    else winner = 'tie';

    const result: DebateResult = {
      sessionId: this.session.id,
      winner,
      totalScores: {
        pro: proTotal,
        con: conTotal
      },
      judgeScores: scores,
      summary: `Final result: ${winner.toUpperCase()} wins with a total score of ${winner === 'pro' ? proTotal : conTotal} vs ${winner === 'pro' ? conTotal : proTotal}`,
      completedAt: new Date()
    };

    this.emit('debateCompleted', result);
    return result;
  }
}

export default DebateEngine;