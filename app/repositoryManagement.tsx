import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useFileUploader } from '@/hooks/useFileUploader';
import RepositoryAPI from '@/lib/api/repositoryApi';
import { Repository } from '@/types/repository';
import { FileMetadata } from '@/types/files';
import { useAuth } from '@/contexts/AuthContext'; // Assuming you have an AuthContext for user information

const API_BASE_URL = 'http://your-api-base-url'; // Replace with your actual API base URL
const repositoryApi = new RepositoryAPI(API_BASE_URL);

export default function RepositoryManagementScreen() {
  const { user } = useAuth(); // Assuming this hook provides the user's phone number
  const { files, isUploading, uploadProgress, error, uploadFiles, deleteFile, refreshFiles, clearError } = useFileUploader();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    if (!user?.phone_number) {
      Alert.alert('Error', 'User information is missing. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      const repos = await repositoryApi.listRepositories({ phone_number: user.phone_number });
      setRepositories(repos);
    } catch (error) {
      console.error('Error loading repositories:', error);
      Alert.alert('Error', 'Failed to load repositories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepository = async () => {
    if (!user?.phone_number) {
      Alert.alert('Error', 'User information is missing. Please log in again.');
      return;
    }

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
      setLoading(true);
      try {
        const newRepo = await repositoryApi.createRepository({ phone_number: user.phone_number, name: repoName });
        setRepositories([...repositories, newRepo]);
        Alert.alert('Success', `Repository "${repoName}" created successfully`);
      } catch (error) {
        console.error('Error creating repository:', error);
        Alert.alert('Error', `Failed to create repository: ${(error as Error).message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpload = async (repository: Repository) => {
    if (!user?.phone_number) {
      Alert.alert('Error', 'User information is missing. Please log in again.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        await uploadFiles([file as unknown as File], user.phone_number);
        Alert.alert('Success', `File ${file.name} uploaded successfully`);
        if (selectedRepository && selectedRepository.id === repository.id) {
          refreshFiles(user.phone_number);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', `Failed to upload file: ${(error as Error).message}`);
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!user?.phone_number) {
      Alert.alert('Error', 'User information is missing. Please log in again.');
      return;
    }

    try {
      await deleteFile(filename, user.phone_number);
      Alert.alert('Success', `File ${filename} deleted successfully`);
      refreshFiles(user.phone_number);
    } catch (error) {
      console.error('Error deleting file:', error);
      Alert.alert('Error', `Failed to delete file: ${(error as Error).message}`);
    }
  };

  const renderRepositoryItem = ({ item }: { item: Repository }) => (
    <TouchableOpacity 
      style={styles.repositoryItem}
      onPress={() => {
        setSelectedRepository(item);
        if (user?.phone_number) {
          refreshFiles(user.phone_number);
        }
      }}
    >
      <Text style={styles.repositoryName}>{item.name}</Text>
      <TouchableOpacity 
        style={styles.uploadButton} 
        onPress={() => handleUpload(item)}
        accessibilityLabel={`Upload file to ${item.name} repository`}
      >
        <Ionicons name="cloud-upload-sharp" size={24} color="#007AFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderFileItem = ({ item }: { item: FileMetadata }) => (
    <View style={styles.fileItem}>
      <Text style={styles.fileName}>{item.filename}</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteFile(item.filename)}
        accessibilityLabel={`Delete file ${item.filename}`}
      >
        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Repository Management</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      {loading || isUploading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <>
          <FlatList
            data={repositories}
            renderItem={renderRepositoryItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
          />
          {selectedRepository && (
            <>
              <Text style={styles.sectionTitle}>Files in {selectedRepository.name}</Text>
              <FlatList
                data={files}
                renderItem={renderFileItem}
                keyExtractor={(item) => item.id}
                style={styles.fileList}
              />
            </>
          )}
        </>
      )}
      {uploadProgress && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${uploadProgress.percentage}%` }]} />
          <Text style={styles.progressText}>{`${uploadProgress.percentage}%`}</Text>
        </View>
      )}
      <TouchableOpacity 
        style={styles.createButton} 
        onPress={handleCreateRepository}
        accessibilityLabel="Create new repository"
      >
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 15,
    backgroundColor: '#f8f8f8',
  },
  fileList: {
    flex: 1,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  fileName: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 5,
  },
  progressBar: {
    height: 20,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CD964',
  },
  progressText: {
    position: 'absolute',
    right: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
});