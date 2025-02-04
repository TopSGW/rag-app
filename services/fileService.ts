import FileAPI from '../lib/api/fileApi';
import { 
  FileMetadata, 
  FileResponse, 
  FileList, 
  UploadFileParams,
  ListFilesParams,
  DeleteFileParams 
} from '../types/files';

class FileService {
  private api: FileAPI;

  constructor(baseUrl: string) {
    this.api = new FileAPI(baseUrl);
  }

  async uploadFile(params: UploadFileParams): Promise<FileResponse> {
    try {
      const response = await this.api.uploadFile(params);
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }
      throw new Error('Failed to upload file: Unknown error occurred');
    }
  }

  async listFiles(params: ListFilesParams): Promise<FileList> {
    try {
      const response = await this.api.listFiles(params);
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list files: ${error.message}`);
      }
      throw new Error('Failed to list files: Unknown error occurred');
    }
  }

  async deleteFile(params: DeleteFileParams): Promise<{ message: string; filename: string }> {
    try {
      const response = await this.api.deleteFile(params);
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete file: ${error.message}`);
      }
      throw new Error('Failed to delete file: Unknown error occurred');
    }
  }

  async validateFileSize(file: File, maxSize: number): Promise<boolean> {
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize} bytes`);
    }
    return true;
  }

  async validateFileType(file: File, allowedTypes: string[]): Promise<boolean> {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
    return true;
  }
}

export default FileService;