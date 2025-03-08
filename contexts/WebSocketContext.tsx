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
    console.log('Token expired, clearing token and redirecting to biometric screen');
    await clearToken();
    Alert.alert(
      "Session Expired",
      "Your session has expired. Please sign in again.",
      [{ text: "OK", onPress: () => router.replace('/biometric') }]
    );
  }, [clearToken]);

  const initializeChatWebSocket = useCallback((token: string) => {
    console.log('Initializing chat WebSocket');
    if (wsChat) {
      console.log('Closing existing chat WebSocket');
      wsChat.close();
    }
    setToken(token);
    const websocketUrl = getApiUrl(true);
    console.log('Chat WebSocket URL:', `${websocketUrl}/ws/chat?token=${token}`);
    const chatWs = new WebSocket(`${websocketUrl}/ws/chat?token=${token}`);

    chatWs.onopen = () => {
      console.log('Chat WebSocket connected successfully');
      setConnectionStatus('connected');
      setConnectionError(null);
      retryCount.current = 0;
    };

    chatWs.onmessage = (event) => {
      console.log('Received message on chat WebSocket:', event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          setLastMessage(data.message);
        }
      } catch (error) {
      }
    };

    chatWs.onerror = (error) => {
      setConnectionStatus('error');
      setConnectionError("Failed to connect to chat. Please try again later.");
    };

    chatWs.onclose = (event) => {
      console.log('Chat WebSocket closed:', event.code);
      setConnectionStatus('disconnected');
      if (event.code === 1008) {
        handleTokenExpiration();
      } else {
        setConnectionError("Chat connection closed. Attempting to reconnect...");
        retryWebSocketConnection();
      }
    };

    setWsChat(chatWs);
  }, [getToken, handleTokenExpiration, setConnectionStatus, setToken]);

  const handleWebSocketMessage = useCallback(async (event: MessageEvent) => {
    console.log('Received message on auth WebSocket:', event.data);
    try {
      const data = JSON.parse(event.data);
      
      if (data.token) {
        console.log('Received new token from auth WebSocket, updating chat WebSocket');
        await setToken(data.token);
        if (wsChat && wsChat.readyState === WebSocket.OPEN) {
          wsChat.send(JSON.stringify({ update_token: data.token }));
        } else {
          initializeChatWebSocket(data.token);
        }
      }

      if (data.message) {
        setLastMessage(data.message);
      }

      if (data.error === "Token has expired or is invalid") {
        handleTokenExpiration();
      }
    } catch (error) {
    }
  }, [setToken, handleTokenExpiration, initializeChatWebSocket]);

  const initializeAuthWebSocket = useCallback(() => {
    console.log('Initializing auth WebSocket');
    if (wsAuth) {
      console.log('Closing existing auth WebSocket');
      wsAuth.close();
    }
    const websocketUrl = getApiUrl(true);
    console.log('Auth WebSocket URL:', `${websocketUrl}/ws/auth-dialogue`);
    setConnectionStatus('connecting');
    setConnectionError(null);
    const authWs = new WebSocket(`${websocketUrl}/ws/auth-dialogue`);
    
    authWs.onopen = () => {
      console.log('Auth WebSocket connected successfully');
      setConnectionStatus('connected');
      setConnectionError(null);
      retryCount.current = 0;
    };

    authWs.onmessage = handleWebSocketMessage;

    authWs.onerror = (error) => {
      setConnectionStatus('error');
      setConnectionError("Failed to establish authentication connection. Please check your internet connection and try again.");
    };

    authWs.onclose = (event) => {
      console.log('Auth WebSocket closed:', event.code);
      setConnectionStatus('disconnected');
      setConnectionError("Authentication connection closed. Attempting to reconnect...");
      retryWebSocketConnection();
    };

    setWsAuth(authWs);
  }, [handleWebSocketMessage, setConnectionStatus]);

  const retryWebSocketConnection = useCallback(() => {
    const retryDelay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount.current), MAX_RETRY_DELAY);
    retryCount.current += 1;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    console.log(`Retrying WebSocket connection in ${retryDelay}ms`);
    retryTimeoutRef.current = setTimeout(async () => {
      await initializeWebSockets();
    }, retryDelay);
  }, []);

  const initializeWebSockets = useCallback(async () => {
    console.log('Initializing WebSockets, isAuthenticated:', isAuthenticated);
    const token = await getToken();
    if (token && isAuthenticated) {
      console.log('Token available and authenticated, initializing chat WebSocket');
      initializeChatWebSocket(token);
    } else {
      console.log('No token or not authenticated, initializing auth WebSocket');
      initializeAuthWebSocket();
    }
  }, [getToken, isAuthenticated, initializeChatWebSocket, initializeAuthWebSocket]);

  useEffect(() => {
    console.log('WebSocketProvider useEffect, isAuthenticated:', isAuthenticated);
    initializeWebSockets();
    return () => {
      if (wsAuth) {
        console.log('Closing auth WebSocket');
        wsAuth.close();
      }
      if (wsChat) {
        console.log('Closing chat WebSocket');
        wsChat.close();
      }
      if (retryTimeoutRef.current) {
        console.log('Clearing retry timeout');
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [initializeWebSockets, isAuthenticated]);

  const sendChatMessage = useCallback((message: string) => {
    const activeWebSocket = wsChat || wsAuth;
    if (activeWebSocket && activeWebSocket.readyState === WebSocket.OPEN) {
      console.log('Sending message through', wsChat ? 'chat' : 'auth', 'WebSocket');
      activeWebSocket.send(JSON.stringify({ user_input: message }));
    } else {
      setConnectionError("Unable to send message. Please check your connection and try again.");
      retryWebSocketConnection();
    }
  }, [wsChat, wsAuth, retryWebSocketConnection]);

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