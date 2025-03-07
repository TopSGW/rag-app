import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { getApiUrl } from '@/config/api';
import { useAuth } from './AuthContext';
import { router } from 'expo-router';

interface WebSocketContextType {
  wsAuth: WebSocket | null;
  wsChat: WebSocket | null;
  sendChatMessage: (message: string) => void;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  isAnimationEnabled: boolean;
  toggleAnimation: () => void;
  lastMessage: string | null;
  connectionError: string | null;
  initializeWebSockets: () => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wsAuth, setWsAuth] = useState<WebSocket | null>(null);
  const [wsChat, setWsChat] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(true);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { getToken, setToken, clearToken, isAuthenticated } = useAuth();
  const retryCount = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleAnimation = useCallback(() => {
    setIsAnimationEnabled((prev) => !prev);
  }, []);

  const handleTokenExpiration = useCallback(async () => {
    await clearToken();
    Alert.alert(
      "Session Expired",
      "Your session has expired. Please sign in again.",
      [{ text: "OK", onPress: () => router.replace('/biometric') }]
    );
  }, [clearToken]);

  const handleWebSocketMessage = useCallback(async (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.token) {
        await setToken(data.token);
        initializeChatWebSocket(data.token);
      }

      if (data.message) {
        try {
          const parsedMessage = JSON.parse(data.message);
          if (parsedMessage.instruction) {
            setLastMessage(parsedMessage.instruction);
          } else {
            setLastMessage(data.message);
          }
        } catch (error) {
          setLastMessage(data.message);
        }
      }

      if (data.error === "Token has expired or is invalid") {
        handleTokenExpiration();
      }
    } catch (error) {
      // Silently handle parsing errors
    }
  }, [setToken, handleTokenExpiration]);

  const debounceSetConnectionStatus = useCallback((status: 'connected' | 'disconnected' | 'connecting' | 'error') => {
    setTimeout(() => {
      setConnectionStatus(status);
    }, 300);
  }, []);

  const initializeChatWebSocket = useCallback((token: string) => {
    if (wsChat) {
      wsChat.close();
    }

    const websocketUrl = getApiUrl(true);
    debounceSetConnectionStatus('connecting');
    setConnectionError(null);
    const chatWs = new WebSocket(`${websocketUrl}/ws/chat?token=${token}`);

    chatWs.onopen = () => {
      debounceSetConnectionStatus('connected');
      setConnectionError(null);
      retryCount.current = 0;
    };

    chatWs.onmessage = handleWebSocketMessage;

    chatWs.onerror = () => {
      debounceSetConnectionStatus('error');
      setConnectionError("Failed to connect to chat. Please try again later.");
    };

    chatWs.onclose = (event) => {
      debounceSetConnectionStatus('disconnected');
      if (event.code === 1008) {
        handleTokenExpiration();
      } else {
        setConnectionError("Connection closed. Attempting to reconnect...");
        retryWebSocketConnection();
      }
    };

    setWsChat(chatWs);
    setWsAuth(null); // Close auth WebSocket when chat is initialized
  }, [getToken, handleTokenExpiration, handleWebSocketMessage, debounceSetConnectionStatus]);

  const initializeAuthWebSocket = useCallback(() => {

    const websocketUrl = getApiUrl(true);
    debounceSetConnectionStatus('connecting');
    setConnectionError(null);
    const authWs = new WebSocket(`${websocketUrl}/ws/auth-dialogue`);
    
    authWs.onopen = () => {
      debounceSetConnectionStatus('connected');
      setConnectionError(null);
      retryCount.current = 0;
    };

    authWs.onmessage = handleWebSocketMessage;

    authWs.onerror = () => {
      debounceSetConnectionStatus('error');
      setConnectionError("Failed to establish authentication connection. Please check your internet connection and try again.");
    };

    authWs.onclose = () => {
      debounceSetConnectionStatus('disconnected');
      setConnectionError("Authentication connection closed. Attempting to reconnect...");
      retryWebSocketConnection();
    };

    setWsAuth(authWs);
    setWsChat(null); // Close chat WebSocket when auth is initialized
  }, [handleWebSocketMessage, debounceSetConnectionStatus]);

  const retryWebSocketConnection = useCallback(() => {
    const retryDelay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount.current), MAX_RETRY_DELAY);
    retryCount.current += 1;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryTimeoutRef.current = setTimeout(async () => {
      const token = await getToken();
      if (token && isAuthenticated) {
        initializeChatWebSocket(token);
      } else {
        initializeAuthWebSocket();
      }
    }, retryDelay);
  }, [getToken, isAuthenticated, initializeChatWebSocket, initializeAuthWebSocket]);

  const initializeWebSockets = useCallback(async () => {
    const token = await getToken();
    if (token && isAuthenticated) {
      initializeChatWebSocket(token);
    } else {
      initializeAuthWebSocket();
    }
  }, [getToken, isAuthenticated, initializeChatWebSocket, initializeAuthWebSocket]);

  useEffect(() => {
    initializeWebSockets();
    return () => {
      wsAuth?.close();
      wsChat?.close();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [initializeWebSockets]);

  const sendChatMessage = useCallback((message: string) => {
    const activeWebSocket = wsChat || wsAuth;
    if (activeWebSocket && activeWebSocket.readyState === WebSocket.OPEN) {
      activeWebSocket.send(JSON.stringify({ user_input: message }));
    } else {
      setConnectionError("Unable to send message. Please check your connection and try again.");
    }
  }, [wsChat, wsAuth]);

  const value: WebSocketContextType = {
    wsAuth,
    wsChat,
    sendChatMessage,
    connectionStatus,
    isAnimationEnabled,
    toggleAnimation,
    lastMessage,
    connectionError,
    initializeWebSockets,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};