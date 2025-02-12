import {
  Repository,
  RepositoryResponse,
  CreateRepositoryParams,
  UpdateRepositoryParams,
  DeleteRepositoryParams,
  ListRepositoriesParams,
  RepositoryError
} from '@/types/repository';
import * as apiClient from '@/utils/apiClient';
import { BACKEND_URL } from '@/config/api';

class RepositoryAPI {
  private apiPrefix: string;

  constructor() {
    this.apiPrefix = '/api/v1';
  }

  private getUrl(path: string): string {
    return `${this.apiPrefix}/repositories${path}`;
  }

  private handleError(error: unknown, action: string): never {
    if (error instanceof Error) {
      throw new Error(`Failed to ${action}: ${error.message}`);
    }
    throw new Error(`Failed to ${action}: Unknown error occurred`);
  }

  async createRepository({ phone_number, name }: CreateRepositoryParams): Promise<RepositoryResponse> {
    try {
      const { data } = await apiClient.post<RepositoryResponse>(this.getUrl(`/${phone_number}`), { name });
      return data;
    } catch (error) {
      this.handleError(error, 'create repository');
    }
  }

  async listRepositories({ phone_number }: ListRepositoriesParams): Promise<Repository[]> {
    try {
      const { data } = await apiClient.get<Repository[]>(this.getUrl(`/${phone_number}`));
      return data || [];
    } catch (error) {
      this.handleError(error, 'list repositories');
    }
  }

  async updateRepository({ phone_number, repository_name, new_name }: UpdateRepositoryParams): Promise<RepositoryResponse> {
    try {
      const { data } = await apiClient.put<RepositoryResponse>(this.getUrl(`/${phone_number}/${repository_name}`), { name: new_name });
      return data;
    } catch (error) {
      this.handleError(error, 'update repository');
    }
  }

  async deleteRepository({ phone_number, repository_name }: DeleteRepositoryParams): Promise<{ message: string }> {
    try {
      const { data } = await apiClient.del<{ message: string }>(this.getUrl(`/${phone_number}/${repository_name}`));
      return data;
    } catch (error) {
      this.handleError(error, 'delete repository');
    }
  }
}

export default RepositoryAPI;