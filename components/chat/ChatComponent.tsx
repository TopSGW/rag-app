import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';
import { getApiUrl } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { router, Redirect } from 'expo-router';

interface Message {
  content: string;
  sender: 'user' | 'bot';
}

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [wsAuth, setWsAuth] = useState<WebSocket | null>(null);
  const [wsChat, setWsChat] = useState<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const websocketUrl = getApiUrl(true); // Use WebSocket URL
  
    // Set up the authentication WebSocket
    const authWs = new WebSocket(`${websocketUrl}/ws/auth-dialogue`);
    setWsAuth(authWs);
  
    // Define an async function to get the token and set up the chat WebSocket
    const initChatSocket = async () => {
      const token = await getToken(); // Await the resolved token
      if (token) {
        const chatWs = new WebSocket(`${websocketUrl}/ws/chat?token=${token}`);
        setWsChat(chatWs);
      }
    };
  
    // Call the async function
    initChatSocket();
  
    return () => {
      authWs.close();
      if (wsChat) wsChat.close();
    };
  }, [getToken]);

  useEffect(() => {
    if (wsAuth) {
      wsAuth.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, { content: data.message, sender: 'bot' }]);
      };
    }

    if (wsChat) {
      wsChat.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, { content: data.message, sender: 'bot' }]);
      };
    }
  }, [wsAuth, wsChat]);

  const sendMessage = async () => {
    if (inputMessage.trim() === '') return;
  
    // Add user message to the list
    setMessages(prev => [...prev, { content: inputMessage, sender: 'user' }]);
  
    // Await the token value
    const token = await getToken();
    
    if (!token) {
      wsAuth?.send(JSON.stringify({ user_input: inputMessage }));
    } else {
      wsChat?.send(JSON.stringify({ user_input: inputMessage }));
    }
  
    setInputMessage('');
  };

  const handleUpload = () => {
    router.push('/repositoryManagement');
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
  sendButton: {
    width: 50,
    height: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    // position: 'absolute',
    // bottom: 20,
    // right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',

  },
});

export default ChatComponent;