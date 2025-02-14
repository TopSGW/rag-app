import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { FileMetadata } from '../interfaces/files';
import fileApi from '../api/fileApi';

interface FileManagementProps {
  phoneNumber: string;
  repositoryName: string;
  repositoryId: number;
}

const FileManagement: React.FC<FileManagementProps> = ({ phoneNumber, repositoryName, repositoryId }) => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fileList = await fileApi.listFiles(phoneNumber, repositoryName);
      setFiles(fileList.files);
    } catch (error) {
      setError('Failed to load files. Please try again.');
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, repositoryName]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        setIsUploading(true);
        setError(null);
        await fileApi.uploadFile(phoneNumber, repositoryName, file as unknown as File);
        Alert.alert('Success', `File ${file.name} uploaded successfully`);
        loadFiles();
      }
    } catch (error) {
      setError('Failed to upload file. Please try again.');
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  }, [phoneNumber, repositoryName, loadFiles]);

  const handleDeleteFile = useCallback(async (filename: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete the file "${filename}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            setError(null);
            try {
              await fileApi.deleteFile(phoneNumber, repositoryName, filename);
              Alert.alert('Success', `File ${filename} deleted successfully`);
              loadFiles();
            } catch (error) {
              setError('Failed to delete file. Please try again.');
              console.error('Error deleting file:', error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [phoneNumber, repositoryName, loadFiles]);

  const renderFileItem = useCallback(({ item }: { item: FileMetadata }) => (
    <View style={styles.fileItem}>
      <Text style={styles.fileName}>{item.original_filename}</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteFile(item.filename)}
        accessibilityRole="button"
        accessibilityLabel={`Delete file ${item.original_filename}`}
      >
        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  ), [handleDeleteFile]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Files in {repositoryName}</Text>
      {isUploading && (
        <View style={styles.uploadProgress}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.uploadProgressText}>Uploading...</Text>
        </View>
      )}
      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={files}
          renderItem={renderFileItem}
          keyExtractor={(item) => item.filename}
          refreshing={isLoading}
          onRefresh={loadFiles}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No files in this repository</Text>
          }
        />
      )}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handleUpload}
        accessibilityRole="button"
        accessibilityLabel="Upload file"
      >
        <Ionicons name="cloud-upload-outline" size={24} color="#FFFFFF" />
        <Text style={styles.uploadButtonText}>Upload File</Text>
      </TouchableOpacity>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.clearErrorText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  fileName: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
    color: '#666',
  },
  uploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadProgressText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    flex: 1,
  },
  clearErrorText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FileManagement;