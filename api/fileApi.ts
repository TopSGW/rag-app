import { 
  FileMetadata, 
  FileResponse, 
  FileList, 
  UploadFileParams,
  ListFilesParams,
  DeleteFileParams,
  ErrorResponse 
} from '@/interfaces/files';
import { getConfig } from './config';
import * as apiClient from '@/utils/apiClient';

class FileAPI {
  private apiPrefix: string;

  constructor() {
    this.apiPrefix = getConfig().apiPrefix;
  }

  private getUrl(path: string): string {
    return `${this.apiPrefix}/files${path}`;
  }

  async uploadFile({ phone_number, repository, file }: UploadFileParams): Promise<FileResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await apiClient.post<FileResponse>(this.getUrl(`/${phone_number}/${repository}`), formData);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }
      throw new Error('Failed to upload file: Unknown error occurred');
    }
  }

  async listFiles({ phone_number, repository }: ListFilesParams): Promise<FileList> {
    try {
      const { data } = await apiClient.get<FileList>(this.getUrl(`/${phone_number}/${repository}`));
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list files: ${error.message}`);
      }
      throw new Error('Failed to list files: Unknown error occurred');
    }
  }

  async deleteFile({ phone_number, repository, filename }: DeleteFileParams): Promise<{ message: string; filename: string }> {
    try {
      const { data } = await apiClient.del<{ message: string; filename: string }>(this.getUrl(`/${phone_number}/${repository}/${filename}`));
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete file: ${error.message}`);
      }
      throw new Error('Failed to delete file: Unknown error occurred');
    }
  }
}

export default FileAPI;