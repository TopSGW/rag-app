import { useState, useCallback, useRef } from 'react';
import { useFileUpload } from '../contexts/FileUploadContext';
import { FileMetadata } from '../interfaces/files';
import { getConfig } from '../api/config';

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
    currentRepository
  } = useFileUpload();

  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const isMounted = useRef(true);

  // Cleanup on unmount
  const cleanup = () => {
    isMounted.current = false;
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
        throw new Error('Please select a repository before uploading files');
      }

      const totalSize = files.reduce((acc, file) => acc + file.size, 0);
      let uploadedSize = 0;

      try {
        for (const file of files) {
          if (!isMounted.current) return;

          const validation = isFileValid(file);
          if (!validation.valid) {
            throw new Error(validation.error);
          }

          await uploadFile(file, phoneNumber);
          
          if (isMounted.current) {
            uploadedSize += file.size;
            setUploadProgress({
              loaded: uploadedSize,
              total: totalSize,
              percentage: Math.round((uploadedSize / totalSize) * 100)
            });
          }
        }
      } finally {
        if (isMounted.current) {
          setUploadProgress(null);
        }
      }
    },
    [uploadFile, isFileValid, currentRepository]
  );

  const deleteFile = useCallback(
    async (filename: string, phoneNumber: string) => {
      if (!currentRepository) {
        throw new Error('Please select a repository before deleting files');
      }
      await contextDeleteFile(filename, phoneNumber);
    },
    [contextDeleteFile, currentRepository]
  );

  const refreshFiles = useCallback(
    async (phoneNumber: string) => {
      if (!currentRepository) {
        throw new Error('Please select a repository before listing files');
      }
      await listFiles(phoneNumber);
    },
    [listFiles, currentRepository]
  );

  return {
    files,
    isUploading: isLoading,
    uploadProgress,
    error,
    uploadFiles,
    deleteFile,
    refreshFiles,
    clearError,
    isFileValid
  };
};