import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import TypingIndicator from '../common/TypingIndicator';
import ConnectionStatusDialog from '../common/ConnectionStatusDialog';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'system';
  loading?: boolean;
}

// Create a memoized message component to prevent re-renders
const MessageItem = memo(({ item }: { item: Message }) => {
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
});

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { sendChatMessage, connectionStatus, lastMessage } = useWebSocket();
  const prevLastMessageRef = useRef<string | null>(null);
  
  // Add this optimization to prevent unnecessary message updates
  useEffect(() => {
    if (lastMessage && lastMessage !== prevLastMessageRef.current) {
      prevLastMessageRef.current = lastMessage;
      
      setMessages(prev => [
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

  const sendMessage = useCallback(() => {
    if (inputMessage.trim() === '' || connectionStatus !== 'connected') return;
  
    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user'
    };
  
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);
  
    sendChatMessage(inputMessage);
    setInputMessage('');
  }, [inputMessage, connectionStatus, sendChatMessage]);
  
  const handleUpload = useCallback(() => {
    router.push('/repositoryManagement');
  }, []);
  
  // Optimize list rendering with keyExtractor and getItemLayout
  const keyExtractor = useCallback((item: Message) => item.id, []);
  
  // Use onEndReached instead of onContentSizeChange for better scroll performance
  const handleEndReached = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);
  
  // Memoize the render function
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    return <MessageItem item={item} />;
  }, []);

  return (
    <View style={styles.container}>
      <ConnectionStatusDialog />
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderMessage}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        initialNumToRender={15}
      />
      {isTyping && connectionStatus === 'connected' && <TypingIndicator isVisible={true} />}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
          <Ionicons name="cloud-upload-sharp" size={24} color="black" />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, connectionStatus !== 'connected' && styles.disabledInput]}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
          editable={connectionStatus === 'connected'}
        />
        <TouchableOpacity 
          style={[styles.sendButton, connectionStatus !== 'connected' && styles.disabledButton]} 
          onPress={sendMessage}
          disabled={connectionStatus !== 'connected'}
        >
          <Ionicons name="send-sharp" size={24} color={connectionStatus === 'connected' ? "black" : "#999"} />
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
  disabledInput: {
    backgroundColor: '#E5E5EA',
  },
  sendButton: {
    width: 50,
    height: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
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

export default memo(ChatComponent);