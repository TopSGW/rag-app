import { 
  FileMetadata, 
  FileResponse, 
  FileList, 
  UploadFileParams,
  ListFilesParams,
  DeleteFileParams,
  ErrorResponse 
} from '../../types/files';
import { getConfig } from './config';

class FileAPI {
  private baseUrl: string;
  private apiPrefix: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.apiPrefix = getConfig().apiPrefix;
  }

  private getUrl(path: string): string {
    return `${this.baseUrl}${this.apiPrefix}/files${path}`;
  }

  async uploadFile({ phone_number, repository, file }: UploadFileParams): Promise<FileResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(this.getUrl(`/${phone_number}/${repository}`), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.detail);
    }

    return response.json();
  }

  async listFiles({ phone_number, repository }: ListFilesParams): Promise<FileList> {
    const response = await fetch(this.getUrl(`/${phone_number}/${repository}`), {
      method: 'GET',
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.detail);
    }

    return response.json();
  }

  async deleteFile({ phone_number, repository, filename }: DeleteFileParams): Promise<{ message: string; filename: string }> {
    const response = await fetch(this.getUrl(`/${phone_number}/${repository}/${filename}`), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.detail);
    }

    return response.json();
  }
}

export default FileAPI;