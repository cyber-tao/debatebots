import WebSocket from 'ws';
import { WebSocketMessage, DebateUpdatePayload } from '../types';
import DebateController from '../controllers/DebateController';

export class WebSocketServer {
  private wss: WebSocket.Server;
  private clients: Map<string, Set<WebSocket>> = new Map();

  constructor(server: any) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.initialize();
  }

  private initialize(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('WebSocket client connected');

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        // Remove client from all subscriptions
        this.clients.forEach((clientSet) => {
          clientSet.delete(ws);
        });
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(ws, message.sessionId);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(ws, message.sessionId);
        break;
      case 'ping':
        this.sendMessage(ws, { type: 'pong', payload: {} });
        break;
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private handleSubscribe(ws: WebSocket, sessionId: string): void {
    if (!sessionId) {
      this.sendError(ws, 'Session ID is required for subscription');
      return;
    }

    if (!this.clients.has(sessionId)) {
      this.clients.set(sessionId, new Set());
    }

    this.clients.get(sessionId)!.add(ws);
    this.sendMessage(ws, {
      type: 'subscribed',
      payload: { sessionId }
    });
  }

  private handleUnsubscribe(ws: WebSocket, sessionId: string): void {
    if (this.clients.has(sessionId)) {
      this.clients.get(sessionId)!.delete(ws);
      if (this.clients.get(sessionId)!.size === 0) {
        this.clients.delete(sessionId);
      }
    }

    this.sendMessage(ws, {
      type: 'unsubscribed',
      payload: { sessionId }
    });
  }

  public broadcastToSession(sessionId: string, message: WebSocketMessage): void {
    const clients = this.clients.get(sessionId);
    if (!clients) return;

    const messageString = JSON.stringify(message);
    
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  }

  public broadcastDebateUpdate(sessionId: string, payload: DebateUpdatePayload): void {
    this.broadcastToSession(sessionId, {
      type: 'debate_update',
      payload
    });
  }

  public broadcastNewMessage(sessionId: string, payload: any): void {
    this.broadcastToSession(sessionId, {
      type: 'new_message',
      payload
    });
  }

  public broadcastStatusChange(sessionId: string, payload: any): void {
    this.broadcastToSession(sessionId, {
      type: 'session_status',
      payload
    });
  }

  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'error',
      payload: { error }
    });
  }

  public getClientCount(sessionId?: string): number {
    if (sessionId) {
      return this.clients.get(sessionId)?.size || 0;
    }
    
    let total = 0;
    this.clients.forEach((clientSet) => {
      total += clientSet.size;
    });
    return total;
  }
}

export default WebSocketServer;