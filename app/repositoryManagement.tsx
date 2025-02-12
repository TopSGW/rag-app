import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRepository } from '@/contexts/RepositoryContext';
import { useFileUploader } from '@/hooks/useFileUploader';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';

export default function RepositoryManagementScreen() {
  const { repositories, createRepository, refreshRepositories } = useRepository();
  const fileUploader = useFileUploader();
  const [selectedRepository, setSelectedRepository] = useState<string | null>(null);

  useEffect(() => {
    refreshRepositories();
  }, [refreshRepositories]);

  const handleCreateRepository = async () => {
    const repoName = await new Promise<string>((resolve) => {
      Alert.prompt(
        'Create Repository',
        'Enter repository name:',
        [
          { text: 'Cancel', onPress: () => resolve(''), style: 'cancel' },
          { text: 'OK', onPress: (name) => resolve(name || '') },
        ],
        'plain-text'
      );
    });

    if (repoName) {
      try {
        await createRepository(repoName);
        refreshRepositories();
        Alert.alert('Success', `Repository "${repoName}" created successfully`);
      } catch (error) {
        console.error('Error creating repository:', error);
        Alert.alert('Error', 'Failed to create repository');
      }
    }
  };

  const handleUpload = async (repoId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (result.type === 'success') {
        await fileUploader.uploadFile(repoId, result.uri, result.name);
        Alert.alert('Success', `File ${result.name} uploaded successfully`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload file');
    }
  };

  const renderRepositoryItem = ({ item }: { item: { id: string; name: string } }) => (
    <View style={styles.repositoryItem}>
      <Text style={styles.repositoryName}>{item.name}</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={() => handleUpload(item.id)}>
        <Ionicons name="cloud-upload-sharp" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Repository Management</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={repositories}
        renderItem={renderRepositoryItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
      <TouchableOpacity style={styles.createButton} onPress={handleCreateRepository}>
        <Text style={styles.createButtonText}>Create New Repository</Text>
      </TouchableOpacity>
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
  backButton: {
    padding: 5,
  },
  list: {
    flex: 1,
  },
  repositoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  repositoryName: {
    fontSize: 18,
  },
  uploadButton: {
    padding: 5,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});