import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { Repository } from '@/types/repository';

import RepositoryManager from '@/components/RepositoryManager';
import FileUpload from '@/components/FileUpload';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function RepositoryScreen() {
  const { user } = useAuth();
  const { currentRepository, setCurrentRepository } = useRepository();

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.messageContainer}>
          <ThemedText style={styles.errorText}>
            Please log in to access repositories
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <Surface style={styles.container}>
      <ThemedView style={styles.contentContainer}>
        {currentRepository ? (
          <>
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                onPress={() => setCurrentRepository(null)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#007AFF" />
                <ThemedText style={styles.backText}>Repositories</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.title}>
                {currentRepository.name}
              </ThemedText>
            </ThemedView>
            <FileUpload 
              phoneNumber={user.phone_number || ''} 
              repository={currentRepository.name}
            />
          </>
        ) : (
          <>
            <ThemedView style={styles.titleContainer}>
              <ThemedText style={styles.title}>Repositories</ThemedText>
            </ThemedView>
            <RepositoryManager />
          </>
        )}
      </ThemedView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  titleContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#c62828',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 20,
  },
});