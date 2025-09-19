import { useState, useEffect, useCallback } from 'react';
import { webSocketService } from '../services/websocketService';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const connect = async () => {
      try {
        await webSocketService.connect();
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'WebSocket connection failed');
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      webSocketService.disconnect();
      setIsConnected(false);
    };
  }, []);

  const subscribe = useCallback((sessionId: string) => {
    webSocketService.subscribe(sessionId);
  }, []);

  const unsubscribe = useCallback((sessionId: string) => {
    webSocketService.unsubscribe(sessionId);
  }, []);

  const addListener = useCallback((event: string, callback: (data: any) => void) => {
    webSocketService.addListener(event, callback);
  }, []);

  const removeListener = useCallback((event: string, callback: (data: any) => void) => {
    webSocketService.removeListener(event, callback);
  }, []);

  return {
    isConnected,
    error,
    subscribe,
    unsubscribe,
    addListener,
    removeListener,
  };
};