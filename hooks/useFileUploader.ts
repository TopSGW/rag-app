import { useState, useCallback, useRef } from 'react';
import { useFileUpload } from '../contexts/FileUploadContext';
import { FileMetadata } from '../interfaces/files';
import { getConfig } from '../api/config';
import { RepositoryError } from '../interfaces/repository';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseFileUploaderReturn {
  files: FileMetadata[];
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  error: string | null;
  uploadFiles: (files: File[], phoneNumber: string) => Promise<void>;
  deleteFile: (filename: string, phoneNumber: string) => Promise<void>;
  refreshFiles: (phoneNumber: string) => Promise<void>;
  clearError: () => void;
  isFileValid: (file: File) => { valid: boolean; error?: string };
  setCurrentRepository: (repositoryId: number) => void;
  cancelUpload: () => void;
}

export const useFileUploader = (): UseFileUploaderReturn => {
  const {
    files,
    isLoading,
    error,
    uploadFile,
    deleteFile: contextDeleteFile,
    listFiles,
    clearError,
    currentRepository,
    setCurrentRepository: contextSetCurrentRepository
  } = useFileUpload();

  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const isMounted = useRef(true);
  const cancelTokenSource = useRef<AbortController | null>(null);

  // Cleanup on unmount
  const cleanup = () => {
    isMounted.current = false;
    if (cancelTokenSource.current) {
      cancelTokenSource.current.abort();
    }
  };

  const isFileValid = useCallback((file: File) => {
    const config = getConfig();

    if (file.size > config.maxFileSize) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${(
          config.maxFileSize / 1024 / 1024
        ).toFixed(2)}MB`
      };
    }

    if (!config.allowedFileTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${config.allowedFileTypes.join(
          ', '
        )}`
      };
    }

    return { valid: true };
  }, []);

  const uploadFiles = useCallback(
    async (files: File[], phoneNumber: string) => {
      if (!currentRepository) {
        throw new RepositoryError('Please select a repository before uploading files');
      }

      const totalSize = files.reduce((acc, file) => acc + file.size, 0);
      let uploadedSize = 0;

      cancelTokenSource.current = new AbortController();

      try {
        for (const file of files) {
          if (!isMounted.current) return;

          const validation = isFileValid(file);
          if (!validation.valid) {
            throw new RepositoryError(validation.error || 'Invalid file');
          }

          await uploadFile(file, phoneNumber, cancelTokenSource.current.signal);
          
          if (isMounted.current) {
            uploadedSize += file.size;
            setUploadProgress({
              loaded: uploadedSize,
              total: totalSize,
              percentage: Math.round((uploadedSize / totalSize) * 100)
            });
          }
        }
      } catch (error) {
        if (error instanceof RepositoryError) {
          throw error;
        } else if (error instanceof Error) {
          throw new RepositoryError(`Failed to upload files: ${error.message}`);
        } else {
          throw new RepositoryError('An unknown error occurred while uploading files');
        }
      } finally {
        if (isMounted.current) {
          setUploadProgress(null);
        }
        cancelTokenSource.current = null;
      }
    },
    [uploadFile, isFileValid, currentRepository]
  );

  const deleteFile = useCallback(
    async (filename: string, phoneNumber: string) => {
      if (!currentRepository) {
        throw new RepositoryError('Please select a repository before deleting files');
      }
      try {
        await contextDeleteFile(filename, phoneNumber);
      } catch (error) {
        if (error instanceof Error) {
          throw new RepositoryError(`Failed to delete file: ${error.message}`);
        } else {
          throw new RepositoryError('An unknown error occurred while deleting the file');
        }
      }
    },
    [contextDeleteFile, currentRepository]
  );

  const refreshFiles = useCallback(
    async (phoneNumber: string) => {
      if (!currentRepository) {
        throw new RepositoryError('Please select a repository before listing files');
      }
      try {
        await listFiles(phoneNumber);
      } catch (error) {
        if (error instanceof Error) {
          throw new RepositoryError(`Failed to refresh files: ${error.message}`);
        } else {
          throw new RepositoryError('An unknown error occurred while refreshing files');
        }
      }
    },
    [listFiles, currentRepository]
  );

  const setCurrentRepository = useCallback((repositoryId: number) => {
    contextSetCurrentRepository(repositoryId);
  }, [contextSetCurrentRepository]);

  const cancelUpload = useCallback(() => {
    if (cancelTokenSource.current) {
      cancelTokenSource.current.abort();
      cancelTokenSource.current = null;
      setUploadProgress(null);
    }
  }, []);

  return {
    files,
    isUploading: isLoading,
    uploadProgress,
    error,
    uploadFiles,
    deleteFile,
    refreshFiles,
    clearError,
    isFileValid,
    setCurrentRepository,
    cancelUpload
  };
};