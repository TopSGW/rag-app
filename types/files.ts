export interface FileMetadata {
  filename: string;
  original_filename: string;
  file_size: number;
  repository: string;
  phone_number: string;
  mime_type: string;
  path: string;
  upload_date: string;
}

export interface FileResponse {
  message: string;
  file_metadata: FileMetadata;
}

export interface FileList {
  repository: string;
  phone_number: string;
  files: FileMetadata[];
}

export interface ErrorResponse {
  detail: string;
}

// API Request Types
export interface UploadFileParams {
  phone_number: string;
  repository: string;
  file: File;
}

export interface ListFilesParams {
  phone_number: string;
  repository: string;
}

export interface DeleteFileParams {
  phone_number: string;
  repository: string;
  filename: string;
}