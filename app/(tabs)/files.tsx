import React from 'react';
import { ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import FileUpload from '@/components/FileUpload';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useFileUploader } from '@/hooks/useFileUploader';

export default function FilesScreen() {
  const { user } = useAuth();
  const { isUploading, error } = useFileUploader();

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText 
          type="error"
          style={styles.messageText}
          accessibilityRole="alert"
        >
          Please log in to access file management
        </ThemedText>
      </ThemedView>
    );
  }

  if (isUploading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.messageText}>
          Uploading files...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText 
          type="error"
          style={styles.messageText}
          accessibilityRole="alert"
        >
          {error}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <ThemedText 
          type="title" 
          style={styles.title}
          accessibilityRole="header"
          accessibilityLevel={1}
        >
          File Management
        </ThemedText>
        <FileUpload phoneNumber={user.phone_number} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
});