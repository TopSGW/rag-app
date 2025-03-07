import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import TypingIndicator from '../common/TypingIndicator';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'system';
  loading?: boolean;
}

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { wsChat, sendChatMessage, connectionStatus, lastMessage } = useWebSocket();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (lastMessage) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: lastMessage,
          sender: 'bot',
        },
      ]);
      setIsTyping(false);
    }
  }, [lastMessage]);

  const sendMessage = async () => {
    if (inputMessage.trim() === '') return;
  
    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user'
    };
  
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);
  
    sendChatMessage(inputMessage);
    setInputMessage('');
  };
  
  const handleUpload = () => {
    router.push('/repositoryManagement');
  };
  
  const renderMessage = ({ item }: { item: Message }) => {
    return (
      <View style={[
        styles.messageBubble, 
        item.sender === 'user' ? styles.userMessage : 
        item.sender === 'bot' ? styles.botMessage : styles.systemMessage
      ]}>
        <Text style={[
          styles.messageText, 
          item.sender === 'bot' ? styles.botMessageText : 
          item.sender === 'system' ? styles.systemMessageText : null
        ]}>
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
      {isTyping && connectionStatus === 'connected' && <TypingIndicator isVisible={true} />}
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
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#FFD700',
  },
  messageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#000000',
  },
  systemMessageText: {
    color: '#000000',
    fontStyle: 'italic',
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