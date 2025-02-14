import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';
import RepositoryAPI from '../api/repositoryApi';
import { Repository, RepositoryError } from '../interfaces/repository';
import { useAuth } from '../contexts/AuthContext';
import { BACKEND_URL } from '@/config/api';
import ErrorBoundary from '@/components/ErrorBoundary';
import FileManagement from '@/components/FileManagement';

const repositoryApi = new RepositoryAPI();

function RepositoryManagementScreen() {
  const { getToken } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [user, setUser] = useState<{ id: number; phone_number: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [repoModalVisible, setRepoModalVisible] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [refreshingRepos, setRefreshingRepos] = useState(false);
  const [creatingRepo, setCreatingRepo] = useState(false);
  const [repoDetailsLoading, setRepoDetailsLoading] = useState(false);

  const fetchUser = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Error', 'User token is missing. Please log in.');
      setUserLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${BACKEND_URL}/get_user`, {
        params: { token }
      });
      console.log(response.data);
      setUser(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching user info:', error.response?.data || error.message);
        if (error.response?.status === 422) {
          Alert.alert('Error', 'Invalid token format. Please log in again.');
        } else if (error.response?.status === 401) {
          Alert.alert('Error', 'Authentication failed. Please log in again.');
        } else {
          Alert.alert('Error', 'Failed to fetch user info. Please try again.');
        }
      } else {
        console.error('Error fetching user info:', error);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setUserLoading(false);
    }
  };

  const loadRepositories = useCallback(async (showRefreshing = false) => {
    const token = await getToken();

    if (!token) {
      Alert.alert('Error', 'Authentication token is missing. Please log in again.');
      return;
    }

    if (showRefreshing) {
      setRefreshingRepos(true);
    } else {
      setLoading(true);
    }

    try {
      const repos = await repositoryApi.listRepositories(token);
      setRepositories(repos);
    } catch (error) {
      if (error instanceof RepositoryError) {
        Alert.alert('Error', error.message);
      } else {
        console.error('Error loading repositories:', error);
        Alert.alert('Error', 'Failed to load repositories. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshingRepos(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadRepositories();
    }
  }, [user, loadRepositories]);

  const confirmCreateRepository = useCallback(async () => {
    setRepoModalVisible(false);
    const token = await getToken();
    if (!token) {
      Alert.alert('Error', 'Authentication token is missing. Please log in again.');
      return;
    }
    if (!newRepoName.trim()) {
      Alert.alert('Error', 'Repository name cannot be empty.');
      return;
    }
    setCreatingRepo(true);
    try {
      const newRepo = await repositoryApi.createRepository({name: newRepoName}, token);
      setRepositories((prevRepos) => [...prevRepos, newRepo]);
      Alert.alert('Success', `Repository "${newRepoName}" created successfully`);
      setNewRepoName('');
    } catch (error) {
      if (error instanceof RepositoryError) {
        Alert.alert('Error', error.message);
      } else {
        console.error('Error creating repository:', error);
        Alert.alert('Error', 'Failed to create repository. Please try again.');
      }
    } finally {
      setCreatingRepo(false);
    }
  }, [newRepoName, getToken]);

  const cancelCreateRepository = useCallback(() => {
    setRepoModalVisible(false);
    setNewRepoName('');
  }, []);

  const handleSelectRepository = useCallback(async (repository: Repository) => {
    setRepoDetailsLoading(true);
    const token = await getToken();
    if (!token) {
      Alert.alert('Error', 'Authentication token is missing. Please log in again.');
      setRepoDetailsLoading(false);
      return;
    }
    try {
      const repoDetails = await repositoryApi.getRepositoryDetails(repository.id, token);
      setSelectedRepository(repoDetails);
    } catch (error) {
      if (error instanceof RepositoryError) {
        Alert.alert('Error', error.message);
      } else {
        console.error('Error fetching repository details:', error);
        Alert.alert('Error', 'Failed to fetch repository details. Please try again.');
      }
    } finally {
      setRepoDetailsLoading(false);
    }
  }, [getToken]);

  const renderRepositoryItem = useCallback(({ item }: { item: Repository }) => (
    <TouchableOpacity
      style={[
        styles.repositoryItem,
        selectedRepository?.id === item.id && styles.selectedRepository,
      ]}
      onPress={() => handleSelectRepository(item)}
      accessibilityRole="button"
      accessibilityLabel={`Select repository ${item.name}`}
    >
      <Text style={styles.repositoryName}>{item.name}</Text>
    </TouchableOpacity>
  ), [selectedRepository, handleSelectRepository]);

  if (userLoading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={repoModalVisible}
        onRequestClose={() => setRepoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create Repository</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter repository name"
              value={newRepoName}
              onChangeText={setNewRepoName}
              accessibilityLabel="Enter repository name"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={cancelCreateRepository}
                accessibilityRole="button"
                accessibilityLabel="Cancel creating repository"
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={confirmCreateRepository}
                accessibilityRole="button"
                accessibilityLabel="Confirm creating repository"
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
            {creatingRepo && <ActivityIndicator size="small" color="#007AFF" />}
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>Repository Management</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <View style={styles.content}>
          <View style={styles.repositoryList}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Repositories</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => loadRepositories(true)}
                accessibilityRole="button"
                accessibilityLabel="Refresh repositories"
              >
                <Ionicons name="refresh" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={repositories}
              renderItem={renderRepositoryItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshingRepos}
                  onRefresh={() => loadRepositories(true)}
                  accessibilityLabel="Pull to refresh repositories"
                />
              }
            />
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setRepoModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Create new repository"
            >
              <Text style={styles.createButtonText}>Create New Repository</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.fileManagement}>
            {repoDetailsLoading ? (
              <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
            ) : selectedRepository && user ? (
              <FileManagement
                phoneNumber={user.phone_number}
                repositoryName={selectedRepository.name}
                repositoryId={selectedRepository.id}
              />
            ) : (
              <Text style={styles.noSelectionText}>Select a repository to manage files</Text>
            )}
          </View>
        </View>
      )}
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
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  repositoryList: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  fileManagement: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
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
  selectedRepository: {
    backgroundColor: '#e6f2ff',
  },
  repositoryName: {
    fontSize: 18,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 15,
    fontWeight: 'bold',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 10,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  noSelectionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default function RepositoryManagementScreenWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <RepositoryManagementScreen />
    </ErrorBoundary>
  );
}