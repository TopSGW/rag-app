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
  // Use useRef for values that don't need to trigger re-renders
  const wsAuthRef = useRef<WebSocket | null>(null);
  const wsChatRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageRef = useRef<string | null>(null);
  
  // States that should trigger UI updates
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  
  const { getToken, setToken, clearToken, isAuthenticated } = useAuth();

  // Memoize this function to prevent recreation on every render
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

  const initializeChatWebSocket = useCallback(async (token: string) => {
    console.log('Initializing chat WebSocket');
    if (wsChatRef.current) {
      console.log('Closing existing chat WebSocket');
      wsChatRef.current.close();
    }
    await setToken(token);
    const websocketUrl = getApiUrl(true);
    console.log('Chat WebSocket URL:', `${websocketUrl}/ws/chat?token=${token}`);
    const chatWs = new WebSocket(`${websocketUrl}/ws/chat?token=${token}`);

    chatWs.onopen = () => {
      console.log('Chat WebSocket connected successfully');
      setConnectionStatus('connected');
      setConnectionError(null);
      retryCountRef.current = 0;
    };

    chatWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          lastMessageRef.current = data.message;
          // Only update state if message changes to prevent unnecessary re-renders
          setLastMessage(data.message);
        }
      } catch (error) {
        // Silent error handling
      }
    };

    chatWs.onerror = () => {
      setConnectionStatus('error');
      setConnectionError("Failed to connect to chat. Please try again later.");
    };

    chatWs.onclose = (event) => {
      setConnectionStatus('disconnected');
      if (event.code === 1008) {
        handleTokenExpiration();
      } else {
        setConnectionError("Chat connection closed. Attempting to reconnect...");
        retryWebSocketConnection();
      }
    };

    wsChatRef.current = chatWs;
  }, [getToken, handleTokenExpiration, setToken]);

  const handleWebSocketMessage = useCallback(async (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.token) {
        await setToken(data.token);
        if (wsChatRef.current && wsChatRef.current.readyState === WebSocket.OPEN) {
          wsChatRef.current.send(JSON.stringify({ update_token: data.token }));
        } else {
          initializeChatWebSocket(data.token);
        }
      }

      if (data.message) {
        lastMessageRef.current = data.message;
        setLastMessage(data.message);
      }

      if (data.error === "Token has expired or is invalid") {
        handleTokenExpiration();
      }
    } catch (error) {
      // Silent error handling
    }
  }, [setToken, handleTokenExpiration, initializeChatWebSocket]);

  const initializeAuthWebSocket = useCallback(() => {
    console.log('Initializing auth WebSocket');
    if (wsAuthRef.current) {
      console.log('Closing existing auth WebSocket');
      wsAuthRef.current.close();
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
      retryCountRef.current = 0;
    };

    authWs.onmessage = handleWebSocketMessage;

    authWs.onerror = () => {
      setConnectionStatus('error');
      setConnectionError("Failed to establish authentication connection. Please check your internet connection and try again.");
    };

    authWs.onclose = () => {
      setConnectionStatus('disconnected');
      setConnectionError("Authentication connection closed. Attempting to reconnect...");
      retryWebSocketConnection();
    };

    wsAuthRef.current = authWs;
  }, [handleWebSocketMessage]);

  // Create a stable retryWebSocketConnection function that won't cause re-renders
  const retryWebSocketConnection = useCallback(() => {
    const retryDelay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current), MAX_RETRY_DELAY);
    retryCountRef.current += 1;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    console.log(`Retrying WebSocket connection in ${retryDelay}ms`);
    retryTimeoutRef.current = setTimeout(async () => {
      await initializeWebSockets();
    }, retryDelay);
  }, []);

  // Memoize initializeWebSockets to prevent recreating on every render
  const initializeWebSockets = useCallback(async () => {
    try {
      const token = await getToken();
      if (token && isAuthenticated) {
        await initializeChatWebSocket(token);
      } else {
        initializeAuthWebSocket();
      }
    } catch (error) {
      console.error('Error initializing WebSockets:', error);
      setConnectionError("Failed to initialize connection. Please try again.");
    }
  }, [getToken, isAuthenticated, initializeChatWebSocket, initializeAuthWebSocket]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (wsAuthRef.current) {
        wsAuthRef.current.close();
        wsAuthRef.current = null;
      }
      if (wsChatRef.current) {
        wsChatRef.current.close();
        wsChatRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  // Initialize WebSockets on mount and when authentication status changes
  useEffect(() => {
    initializeWebSockets();
  }, [initializeWebSockets, isAuthenticated]);

  const sendChatMessage = useCallback((message: string) => {
    const activeWebSocket = wsChatRef.current || wsAuthRef.current;
    if (activeWebSocket && activeWebSocket.readyState === WebSocket.OPEN) {
      activeWebSocket.send(JSON.stringify({ user_input: message }));
    } else {
      setConnectionError("Unable to send message. Please check your connection and try again.");
      retryWebSocketConnection();
    }
  }, [retryWebSocketConnection]);

  // Create a stable value object to prevent unnecessary re-renders
  const contextValue = useCallback(() => ({
    wsAuth: wsAuthRef.current,
    wsChat: wsChatRef.current,
    sendChatMessage,
    connectionStatus,
    isAnimationEnabled,
    toggleAnimation,
    lastMessage,
    connectionError,
    initializeWebSockets,
  }), [
    sendChatMessage, 
    connectionStatus, 
    isAnimationEnabled, 
    toggleAnimation, 
    lastMessage, 
    connectionError, 
    initializeWebSockets
  ]);

  return (
    <WebSocketContext.Provider value={contextValue()}>
      {children}
    </WebSocketContext.Provider>
  );
};