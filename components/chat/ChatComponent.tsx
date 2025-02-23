import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, Alert } from 'react-native';
import { getApiUrl } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import TypingIndicator from '../common/TypingIndicator';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  loading?: boolean;
}

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [wsAuth, setWsAuth] = useState<WebSocket | null>(null);
  const [wsChat, setWsChat] = useState<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { getToken, setToken, clearToken } = useAuth();

  // Initialize Chat WebSocket (defined first so auth function can call it)
  const initializeChatWebSocket = useCallback((token: string) => {
    const websocketUrl = getApiUrl(true);
    const chatWs = new WebSocket(`${websocketUrl}/ws/chat?token=${token}`);
    chatWs.onopen = () => {
      console.log("Chat WebSocket connected");
    };

    chatWs.onmessage = (event) => {
      console.log("Chat message received:", event.data);
      const data = JSON.parse(event.data);
      if (data.error === "Token has expired or is invalid") {
        handleTokenExpiration();
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.loading ? { ...msg, content: data.message, loading: false } : msg
          )
        );
      }
    };

    chatWs.onerror = (error) => {
      console.error("Chat WebSocket error:", error);
    };

    chatWs.onclose = (event) => {
      console.log("Chat WebSocket closed with code:", event.code);
      if (event.code === 1008) {
        // Token expired or invalid
        handleTokenExpiration();
      } else {
        // Attempt reconnection after a delay
        setTimeout(() => {
          getToken().then(token => {
            if (token) {
              initializeChatWebSocket(token);
            }
          });
        }, 3000);
      }
    };

    setWsChat(chatWs);
  }, [getApiUrl, getToken]);

  // Initialize Auth WebSocket
  const initializeAuthWebSocket = useCallback(async () => {
    const websocketUrl = getApiUrl(true);
    const authWs = new WebSocket(`${websocketUrl}/ws/auth-dialogue`);
    
    authWs.onopen = () => {
      console.log("Auth WebSocket connected");
    };

    authWs.onmessage = async (event) => {
      console.log("Auth message received:", event.data);
      const data = JSON.parse(event.data);
      if (data.token) {
        await setToken(data.token);
        initializeChatWebSocket(data.token);
      }
      setMessages((prev) =>
        prev.map((msg) =>
          msg.loading ? { ...msg, content: data.message, loading: false } : msg
        )
      );
    };

    authWs.onerror = (error) => {
      console.error("Auth WebSocket error:", error);
    };

    authWs.onclose = (event) => {
      console.log("Auth WebSocket closed with code:", event.code);
      Alert.prompt("Server connection failed!")
      // Optionally add reconnection logic for auth WebSocket if needed.
    };

    const token = await getToken();
    if(token) {
      initializeChatWebSocket(token);
    }

    setWsAuth(authWs);
  }, [getApiUrl, setToken, initializeChatWebSocket]);

  // Initialize WebSocket connections once on mount
  useEffect(() => {
    initializeAuthWebSocket();
    return () => {
      wsAuth?.close();
      wsChat?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTokenExpiration = async () => {
    await clearToken();
    Alert.alert(
      "Session Expired",
      "Your session has expired. Please sign in again.",
      [{ text: "OK", onPress: () => router.replace('/biometric') }]
    );
  };

  const sendMessage = async () => {
    if (inputMessage.trim() === '') return;
  
    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user'
    };
  
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'bot',
      loading: true
    };
  
    setMessages(prev => [...prev, newMessage, loadingMessage]);
  
    const token = await getToken();
    console.log("Sending message with token:", token);
  
    // If no token, use auth websocket instead
    if (!token) {
      if (wsAuth && wsAuth.readyState === WebSocket.OPEN) {
        wsAuth.send(JSON.stringify({ user_input: inputMessage }));
      } else {
        console.warn("Auth WebSocket not open");
      }
      setInputMessage('');
      return;
    }
  
    // If token exists, ensure the chat websocket is open before sending
    if (wsChat) {
      if (wsChat.readyState === WebSocket.OPEN) {
        wsChat.send(JSON.stringify({ user_input: inputMessage }));
      } else if (wsChat.readyState === WebSocket.CONNECTING) {
        // Wait until open, then send the message
        wsChat.onopen = () => {
          console.log("Chat WebSocket is now open. Sending buffered message.");
          wsChat.send(JSON.stringify({ user_input: inputMessage }));
        };
      } else {
        console.warn("Chat WebSocket not open");
      }
    } else {
      console.warn("Chat WebSocket instance is null");
    }
    setInputMessage('');
  };
  
  const handleUpload = () => {
    router.push('/repositoryManagement');
  };
  
  const renderMessage = ({ item }: { item: Message }) => {
    if (item.loading) {
      return <TypingIndicator />;
    }
    return (
      <View style={[styles.messageBubble, item.sender === 'user' ? styles.userMessage : styles.botMessage]}>
        <Text style={[styles.messageText, item.sender === 'bot' ? styles.botMessageText : null]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
          <Ionicons name="cloud-upload-sharp" size={24} color="black" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send-sharp" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060606',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 20,
    marginVertical: 5,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendButton: {
    width: 50,
    height: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatComponent;
