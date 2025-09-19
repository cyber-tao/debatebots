import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

class Database {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'debates.db');
    this.db = new sqlite3.Database(this.dbPath);
  }

  async init(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    
    // Create tables
    await run(`
      CREATE TABLE IF NOT EXISTS api_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        api_key TEXT NOT NULL,
        base_url TEXT,
        model TEXT NOT NULL,
        parameters TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS ai_participants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        api_config_id TEXT NOT NULL,
        stance TEXT NOT NULL CHECK (stance IN ('pro', 'con')),
        personality TEXT NOT NULL,
        instructions TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (api_config_id) REFERENCES api_configs (id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS judges (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        api_config_id TEXT NOT NULL,
        criteria TEXT NOT NULL,
        instructions TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (api_config_id) REFERENCES api_configs (id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS debate_sessions (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        description TEXT,
        max_rounds INTEGER NOT NULL,
        max_words_per_turn INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'running', 'paused', 'completed', 'cancelled')),
        current_round INTEGER DEFAULT 0,
        current_turn INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS session_participants (
        session_id TEXT NOT NULL,
        participant_id TEXT NOT NULL,
        PRIMARY KEY (session_id, participant_id),
        FOREIGN KEY (session_id) REFERENCES debate_sessions (id),
        FOREIGN KEY (participant_id) REFERENCES ai_participants (id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS session_judges (
        session_id TEXT NOT NULL,
        judge_id TEXT NOT NULL,
        PRIMARY KEY (session_id, judge_id),
        FOREIGN KEY (session_id) REFERENCES debate_sessions (id),
        FOREIGN KEY (judge_id) REFERENCES judges (id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS debate_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        participant_id TEXT NOT NULL,
        round INTEGER NOT NULL,
        turn INTEGER NOT NULL,
        content TEXT NOT NULL,
        word_count INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES debate_sessions (id),
        FOREIGN KEY (participant_id) REFERENCES ai_participants (id)
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS judge_scores (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        judge_id TEXT NOT NULL,
        participant_id TEXT NOT NULL,
        criteria TEXT NOT NULL,
        score INTEGER NOT NULL,
        max_score INTEGER NOT NULL,
        comments TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES debate_sessions (id),
        FOREIGN KEY (judge_id) REFERENCES judges (id),
        FOREIGN KEY (participant_id) REFERENCES ai_participants (id)
      )
    `);

    // Create indexes for better performance
    await run(`CREATE INDEX IF NOT EXISTS idx_debate_messages_session ON debate_messages(session_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_judge_scores_session ON judge_scores(session_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_sessions_status ON debate_sessions(status)`);
  }

  get instance(): sqlite3.Database {
    return this.db;
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Helper methods for common database operations
  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
}

export const database = new Database();
export default Database;