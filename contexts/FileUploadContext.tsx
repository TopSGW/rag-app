import React, { createContext, useReducer, useContext, ReactNode, useCallback, useRef } from 'react';
import FileService from '../services/fileService';
import { getConfig } from '@/api/config';
import { FileMetadata, FileList } from '../interfaces/files';

interface FileUploadState {
  isLoading: boolean;
  error: string | null;
  files: FileMetadata[];
  currentRepository: string | null;
}

type FileUploadAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILES'; payload: FileMetadata[] }
  | { type: 'ADD_FILE'; payload: FileMetadata }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'SET_REPOSITORY'; payload: string };

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
      // Only update if the repository actually changed
      if (state.currentRepository === action.payload) {
        return state;
      }
      return { ...state, currentRepository: action.payload, files: [] }; // Clear files when repository changes
    default:
      return state;
  }
};

interface FileUploadContextValue extends FileUploadState {
  uploadFile: (file: File, phoneNumber: string) => Promise<void>;
  deleteFile: (filename: string, phoneNumber: string) => Promise<void>;
  listFiles: (phoneNumber: string) => Promise<void>;
  setRepository: (repository: string) => void;
  clearError: () => void;
}

const FileUploadContext = createContext<FileUploadContextValue | undefined>(undefined);

interface FileUploadProviderProps {
  children: ReactNode;
}

export const FileUploadProvider: React.FC<FileUploadProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(fileUploadReducer, initialState);
  const fileService = new FileService();
  const operationInProgress = useRef(false);

  const setRepository = useCallback((repository: string) => {
    dispatch({ type: 'SET_REPOSITORY', payload: repository });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const uploadFile = useCallback(async (file: File, phoneNumber: string) => {
    if (!state.currentRepository) {
      throw new Error('Please select a repository before uploading files');
    }

    if (operationInProgress.current) return;
    operationInProgress.current = true;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await fileService.validateFileSize(file, getConfig().maxFileSize);
      await fileService.validateFileType(file, getConfig().allowedFileTypes);

      const response = await fileService.uploadFile({
        file,
        phone_number: phoneNumber,
        repository: state.currentRepository,
      });

      dispatch({ type: 'ADD_FILE', payload: response.file_metadata });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      operationInProgress.current = false;
    }
  }, [state.currentRepository, fileService]);

  const deleteFile = useCallback(async (filename: string, phoneNumber: string) => {
    if (!state.currentRepository) {
      throw new Error('Please select a repository before deleting files');
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
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      operationInProgress.current = false;
    }
  }, [state.currentRepository, fileService]);

  const listFiles = useCallback(async (phoneNumber: string) => {
    if (!state.currentRepository) {
      throw new Error('Please select a repository before listing files');
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
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
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