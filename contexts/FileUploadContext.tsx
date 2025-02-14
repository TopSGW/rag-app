import React, { createContext, useReducer, useContext, ReactNode, useCallback, useRef, useMemo } from 'react';
import FileService, { FileServiceConfig } from '../services/fileService';
import { getConfig } from '@/api/config';
import { FileMetadata, FileList } from '../interfaces/files';
import { RepositoryError } from '../interfaces/repository';

interface FileUploadState {
  isLoading: boolean;
  error: string | null;
  files: FileMetadata[];
  currentRepository: number | null;
}

type FileUploadAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILES'; payload: FileMetadata[] }
  | { type: 'ADD_FILE'; payload: FileMetadata }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'SET_REPOSITORY'; payload: number };

const initialState: FileUploadState = {
  isLoading: false,
  error: null,
  files: [],
  currentRepository: null,
};

const fileUploadReducer = (state: FileUploadState, action: FileUploadAction): FileUploadState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILES':
      return { ...state, files: action.payload };
    case 'ADD_FILE':
      return { ...state, files: [...state.files, action.payload] };
    case 'REMOVE_FILE':
      return {
        ...state,
        files: state.files.filter((file) => file.filename !== action.payload),
      };
    case 'SET_REPOSITORY':
      if (state.currentRepository === action.payload) {
        return state;
      }
      return { ...state, currentRepository: action.payload, files: [] };
    default:
      return state;
  }
};

interface FileUploadContextValue extends FileUploadState {
  uploadFile: (file: File, phoneNumber: string, signal: AbortSignal) => Promise<void>;
  deleteFile: (filename: string, phoneNumber: string) => Promise<void>;
  listFiles: (phoneNumber: string) => Promise<void>;
  setRepository: (repository: number) => void;
  clearError: () => void;
  getCurrentRepository: () => number | null;
}

const FileUploadContext = createContext<FileUploadContextValue | undefined>(undefined);

interface FileUploadProviderProps {
  children: ReactNode;
}

export const FileUploadProvider: React.FC<FileUploadProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(fileUploadReducer, initialState);
  const config = useMemo(() => getConfig(), []);
  const fileServiceConfig: FileServiceConfig = useMemo(() => ({
    baseUrl: config.baseUrl,
  }), [config.baseUrl]);
  const fileService = useMemo(() => new FileService(fileServiceConfig), [fileServiceConfig]);
  const operationInProgress = useRef(false);

  const setRepository = useCallback((repository: number) => {
    dispatch({ type: 'SET_REPOSITORY', payload: repository });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const getCurrentRepository = useCallback(() => {
    return state.currentRepository;
  }, [state.currentRepository]);

  const uploadFile = useCallback(async (file: File, phoneNumber: string, signal: AbortSignal) => {
    if (!state.currentRepository) {
      throw new RepositoryError('Please select a repository before uploading files');
    }

    if (operationInProgress.current) return;
    operationInProgress.current = true;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await fileService.validateFileSize(file, config.maxFileSize);
      await fileService.validateFileType(file, config.allowedFileTypes);

      const response = await fileService.uploadFile({
        file,
        phone_number: phoneNumber,
        repository: state.currentRepository,
        signal,
      });

      dispatch({ type: 'ADD_FILE', payload: response.file_metadata });
    } catch (error) {
      if (error instanceof RepositoryError) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } else if (error instanceof Error) {
        dispatch({ type: 'SET_ERROR', payload: `Failed to upload file: ${error.message}` });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'An unknown error occurred while uploading the file' });
      }
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      operationInProgress.current = false;
    }
  }, [state.currentRepository, fileService, config.maxFileSize, config.allowedFileTypes]);

  const deleteFile = useCallback(async (filename: string, phoneNumber: string) => {
    if (!state.currentRepository) {
      throw new RepositoryError('Please select a repository before deleting files');
    }

    if (operationInProgress.current) return;
    operationInProgress.current = true;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await fileService.deleteFile({
        filename,
        phone_number: phoneNumber,
        repository: state.currentRepository,
      });

      dispatch({ type: 'REMOVE_FILE', payload: filename });
    } catch (error) {
      if (error instanceof RepositoryError) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } else if (error instanceof Error) {
        dispatch({ type: 'SET_ERROR', payload: `Failed to delete file: ${error.message}` });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'An unknown error occurred while deleting the file' });
      }
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      operationInProgress.current = false;
    }
  }, [state.currentRepository, fileService]);

  const listFiles = useCallback(async (phoneNumber: string) => {
    if (!state.currentRepository) {
      throw new RepositoryError('Please select a repository before listing files');
    }

    if (operationInProgress.current) return;
    operationInProgress.current = true;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await fileService.listFiles({
        phone_number: phoneNumber,
        repository: state.currentRepository,
      });

      dispatch({ type: 'SET_FILES', payload: response.files });
    } catch (error) {
      if (error instanceof RepositoryError) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } else if (error instanceof Error) {
        dispatch({ type: 'SET_ERROR', payload: `Failed to list files: ${error.message}` });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'An unknown error occurred while listing files' });
      }
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      operationInProgress.current = false;
    }
  }, [state.currentRepository, fileService]);

  const value: FileUploadContextValue = {
    ...state,
    uploadFile,
    deleteFile,
    listFiles,
    setRepository,
    clearError,
    getCurrentRepository,
  };

  return (
    <FileUploadContext.Provider value={value}>
      {children}
    </FileUploadContext.Provider>
  );
};

export const useFileUpload = (): FileUploadContextValue => {
  const context = useContext(FileUploadContext);
  if (context === undefined) {
    throw new Error('useFileUpload must be used within a FileUploadProvider');
  }
  return context;
};