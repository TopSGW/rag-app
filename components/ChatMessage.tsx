import React from 'react';
import { View, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';

type ChatMessageProps = {
  text: string;
  isUser: boolean;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ text, isUser }) => {
  return (
    <View style={[styles.messageBubble, isUser ? styles.userMessage : styles.botMessage]}>
      <Markdown
        style={isUser ? markdownStyles.user : markdownStyles.bot}
      >
        {text}
      </Markdown>
    </View>
  );
};

const styles = StyleSheet.create({
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    // backgroundColor: '#007AFF',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
});

const markdownStyles = {
  user: {
    body: { color: '#FFFFFF' },
    paragraph: { fontSize: 16 },
    link: { color: '#FFFFFF', textDecorationLine: 'underline' },
    code_inline: { backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' },
    code_block: { backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', padding: 8, borderRadius: 4 },
  },
  bot: {
    body: { color: '#000000' },
    paragraph: { fontSize: 16 },
    link: { color: '#007AFF' },
    code_inline: { backgroundColor: 'rgba(0, 0, 0, 0.05)', color: '#000000' },
    code_block: { backgroundColor: 'rgba(0, 0, 0, 0.05)', color: '#000000', padding: 8, borderRadius: 4 },
  },
};

export default ChatMessage;