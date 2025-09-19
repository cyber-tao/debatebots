import { useState, useEffect, useCallback } from 'react';
import { DebateSession, DebateMessage } from '../types';
import { debateService } from '../services/debateService';
import { useWebSocket } from './useWebSocket';

export const useDebateSession = (sessionId: string) => {
  const [session, setSession] = useState<DebateSession | null>(null);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { subscribe, unsubscribe, addListener, removeListener } = useWebSocket();

  // Load session data
  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessionResponse, messagesResponse] = await Promise.all([
        debateService.sessions.getById(sessionId),
        debateService.messages.getBySession(sessionId)
      ]);

      if (sessionResponse.success) {
        setSession(sessionResponse.data!);
      } else {
        setError(sessionResponse.error || 'Failed to load session');
      }

      if (messagesResponse.success) {
        setMessages(messagesResponse.data!);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // WebSocket event handlers
  const handleNewMessage = useCallback((data: any) => {
    if (data.sessionId === sessionId) {
      setMessages(prev => [...prev, data.message]);
    }
  }, [sessionId]);

  const handleStatusChange = useCallback((data: any) => {
    if (data.sessionId === sessionId) {
      setSession(prev => prev ? { ...prev, status: data.status } : null);
    }
  }, [sessionId]);

  const handleDebateUpdate = useCallback((data: any) => {
    if (data.sessionId === sessionId) {
      setSession(prev => prev ? {
        ...prev,
        status: data.status,
        currentRound: data.currentRound,
        currentTurn: data.currentTurn
      } : null);

      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
    
    // Subscribe to WebSocket updates
    subscribe(sessionId);
    addListener('new_message', handleNewMessage);
    addListener('session_status', handleStatusChange);
    addListener('debate_update', handleDebateUpdate);

    return () => {
      unsubscribe(sessionId);
      removeListener('new_message', handleNewMessage);
      removeListener('session_status', handleStatusChange);
      removeListener('debate_update', handleDebateUpdate);
    };
  }, [sessionId, subscribe, unsubscribe, addListener, removeListener, handleNewMessage, handleStatusChange, handleDebateUpdate, loadSession]);

  // Control functions
  const startDebate = async () => {
    try {
      const response = await debateService.sessions.start(sessionId);
      if (!response.success) {
        setError(response.error || 'Failed to start debate');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start debate');
    }
  };

  const pauseDebate = async () => {
    try {
      const response = await debateService.sessions.pause(sessionId);
      if (!response.success) {
        setError(response.error || 'Failed to pause debate');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause debate');
    }
  };

  const stopDebate = async () => {
    try {
      const response = await debateService.sessions.stop(sessionId);
      if (!response.success) {
        setError(response.error || 'Failed to stop debate');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop debate');
    }
  };

  return {
    session,
    messages,
    loading,
    error,
    startDebate,
    pauseDebate,
    stopDebate,
    refresh: loadSession,
  };
};