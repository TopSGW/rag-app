import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Text, Dimensions, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import ChatMessage from '@/components/ChatMessage';
import TypingIndicator from '@/components/TypingIndicator';
import { Ionicons } from '@expo/vector-icons';
import { useRepository } from '@/contexts/RepositoryContext';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
};

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const CHAT_HEIGHT = SCREEN_HEIGHT * 0.8;

export default function MainScreen() {
  const { isAuthenticated, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { repositories, createRepository, refreshRepositories } = useRepository();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/biometric');
    } else {
      refreshRepositories();
    }
  }, [isAuthenticated, refreshRepositories]);

  const handleLogout = () => {
    logout();
    router.replace('/biometric');
  };

  const handleUpload = () => {
    router.push('/repositoryManagement');
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        isUser: true,
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInputText('');
      setIsAiTyping(true);

      // Simulate AI response (replace with actual API call)
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "Here's an AI-generated response with markdown support:\n\n**Bold text** and *italic text*\n\n```python\nprint('Hello, World!')\n```",
          isUser: false,
        };
        setMessages((prevMessages) => [...prevMessages, aiResponse]);
        setIsAiTyping(false);
      }, 2000);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatMessage text={item.text} isUser={item.isUser} />
  );

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: false });
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom only when a new message is added
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  if (!isAuthenticated) {
    return null; // or a loading indicator if you prefer
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Copilot</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onLayout={scrollToBottom}
        />
        {isAiTyping && <TypingIndicator />}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
            <Ionicons name="cloud-upload-sharp" size={24} color="black" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything..."
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Ionicons name="send-sharp" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 5,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#060606',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 10,
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
});