import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getApiUrl } from '@/config/api';
import { useAuth } from './AuthContext';
import { router } from 'expo-router';

interface WebSocketContextType {
  wsAuth: WebSocket | null;
  wsChat: WebSocket | null;
  sendChatMessage: (message: string) => void;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  isAnimationEnabled: boolean;
  toggleAnimation: () => void;
  lastMessage: string | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wsAuth, setWsAuth] = useState<WebSocket | null>(null);
  const [wsChat, setWsChat] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(true);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const { getToken, setToken, clearToken, isAuthenticated } = useAuth();

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
    console.log("WebSocket message received:", event.data);
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
  }, [setToken, handleTokenExpiration]);

  const initializeChatWebSocket = useCallback((token: string) => {
    if (wsChat) {
      wsChat.close();
    }

    const websocketUrl = getApiUrl(true);
    setConnectionStatus('connecting');
    const chatWs = new WebSocket(`${websocketUrl}/ws/chat?token=${token}`);

    chatWs.onopen = () => {
      console.log("Chat WebSocket connected");
      setConnectionStatus('connected');
    };

    chatWs.onmessage = handleWebSocketMessage;

    chatWs.onerror = (error) => {
      console.error("Chat WebSocket error:", error);
      setConnectionStatus('disconnected');
    };

    chatWs.onclose = (event) => {
      console.log("Chat WebSocket closed with code:", event.code);
      setConnectionStatus('disconnected');
      if (event.code === 1008) {
        handleTokenExpiration();
      } else {
        setTimeout(() => {
          getToken().then(token => {
            if (token) {
              initializeChatWebSocket(token);
            } else {
              initializeAuthWebSocket();
            }
          });
        }, 3000);
      }
    };

    setWsChat(chatWs);
    setWsAuth(null); // Close auth WebSocket when chat is initialized
  }, [getToken, handleTokenExpiration, handleWebSocketMessage]);

  const initializeAuthWebSocket = useCallback(() => {
    if (wsAuth) {
      wsAuth.close();
    }

    const websocketUrl = getApiUrl(true);
    setConnectionStatus('connecting');
    const authWs = new WebSocket(`${websocketUrl}/ws/auth-dialogue`);
    
    authWs.onopen = () => {
      console.log("Auth WebSocket connected");
      setConnectionStatus('connected');
    };

    authWs.onmessage = handleWebSocketMessage;

    authWs.onerror = (error) => {
      console.error("Auth WebSocket error:", error);
      setConnectionStatus('disconnected');
    };

    authWs.onclose = (event) => {
      console.log("Auth WebSocket closed with code:", event.code);
      setConnectionStatus('disconnected');
      setTimeout(() => initializeAuthWebSocket(), 3000);
    };

    setWsAuth(authWs);
    setWsChat(null); // Close chat WebSocket when auth is initialized
  }, [handleWebSocketMessage]);

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
    };
  }, [initializeWebSockets]);

  const sendChatMessage = useCallback((message: string) => {
    const activeWebSocket = wsChat || wsAuth;
    if (activeWebSocket && activeWebSocket.readyState === WebSocket.OPEN) {
      activeWebSocket.send(JSON.stringify({ user_input: message }));
    } else {
      console.warn("WebSocket not open");
    }
  }, [wsChat, wsAuth]);

  const value = {
    wsAuth,
    wsChat,
    sendChatMessage,
    connectionStatus,
    isAnimationEnabled,
    toggleAnimation,
    lastMessage,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};