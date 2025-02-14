import * as apiClient from '@/utils/apiClient';
import { FileMetadata, FileResponse, FileList } from '@/interfaces/files';

class FileAPI {
  private apiPrefix: string;

  constructor(baseUrl: string) {
    this.apiPrefix = `${baseUrl}/api/v1`;
  }

  private getUrl(path: string): string {
    return `${this.apiPrefix}/files${path}`;
  }

  async uploadFile(phoneNumber: string, repositoryName: string, file: File): Promise<FileResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<FileResponse>(
      this.getUrl(`/${phoneNumber}/${repositoryName}`),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  }

  async listFiles(phoneNumber: string, repositoryName: string): Promise<FileList> {
    const { data } = await apiClient.get<FileList>(this.getUrl(`/${phoneNumber}/${repositoryName}`));
    return data;
  }

  async deleteFile(phoneNumber: string, repositoryName: string, filename: string): Promise<{ message: string }> {
    const { data } = await apiClient.del<{ message: string }>(this.getUrl(`/${phoneNumber}/${repositoryName}/${filename}`));
    return data;
  }
}

export default FileAPI;