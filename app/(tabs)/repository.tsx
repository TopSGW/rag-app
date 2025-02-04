import React from 'react';
import { StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';
import { useAuth } from '@/contexts/AuthContext';
import { useRepository } from '@/contexts/RepositoryContext';
import RepositoryManager from '@/components/RepositoryManager';
import FileUpload from '@/components/FileUpload';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function RepositoryScreen() {
  const { user } = useAuth();
  const { currentRepository } = useRepository();

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>
          Please log in to access repositories
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <Surface style={styles.container}>
      {currentRepository ? (
        <ThemedView style={styles.contentContainer}>
          <ThemedText style={styles.title}>
            Repository: {currentRepository.name}
          </ThemedText>
          <FileUpload 
            phoneNumber={user.phone_number || ''} 
            repository={currentRepository.name}
          />
        </ThemedView>
      ) : (
        <ThemedView style={styles.contentContainer}>
          <ThemedText style={styles.title}>Repositories</ThemedText>
          <RepositoryManager />
        </ThemedView>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#c62828',
  },
});