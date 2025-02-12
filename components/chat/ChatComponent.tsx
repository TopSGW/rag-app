import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { BACKEND_URL } from '../config/api';

interface Message {
  content: string;
  sender: 'user' | 'bot';
}

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [wsAuth, setWsAuth] = useState<WebSocket | null>(null);
  const [wsChat, setWsChat] = useState<WebSocket | null>(null);
  const { getToken } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Initialize WebSocket connections
    const authWs = new WebSocket(`${BACKEND_URL}/ws/auth-dialogue`);
    setWsAuth(authWs);

    const token = getToken();
    if (token) {
      const chatWs = new WebSocket(`${BACKEND_URL}/ws/chat?token=${token}`);
      setWsChat(chatWs);
    }

    return () => {
      authWs.close();
      if (wsChat) wsChat.close();
    };
  }, [getToken]);

  useEffect(() => {
    if (wsAuth) {
      wsAuth.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status) {
          // Authentication successful, add success message
          setMessages(prev => [...prev, { content: data.message, sender: 'bot' }]);
        } else {
          // Authentication failed, add error message
          setMessages(prev => [...prev, { content: data.message || data.error, sender: 'bot' }]);
        }
      };
    }

    if (wsChat) {
      wsChat.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, { content: data.message, sender: 'bot' }]);
      };
    }
  }, [wsAuth, wsChat]);

  const sendMessage = () => {
    if (inputMessage.trim() === '') return;

    // Add user message to the list
    setMessages(prev => [...prev, { content: inputMessage, sender: 'user' }]);

    // Send message to appropriate WebSocket
    const token = getToken();
    if (!token) {
      wsAuth?.send(JSON.stringify({ user_input: inputMessage }));
    } else {
      wsChat?.send(JSON.stringify({ user_input: inputMessage }));
    }

    setInputMessage('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.sender === 'user' ? styles.userMessage : styles.botMessage]}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
        />
        <Button title="Send" onPress={sendMessage} />
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
    borderRadius: 10,
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
});

export default ChatComponent;