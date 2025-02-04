import {
  Repository,
  RepositoryResponse,
  RepositoryListResponse,
  CreateRepositoryParams,
  UpdateRepositoryParams,
  DeleteRepositoryParams,
  ListRepositoriesParams,
  RepositoryError
} from '@/types/repository';

class RepositoryAPI {
  private baseUrl: string;
  private apiPrefix: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.apiPrefix = '/api/v1';
  }

  private getUrl(path: string): string {
    return `${this.baseUrl}${this.apiPrefix}/repositories${path}`;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json() as RepositoryError;
      throw new Error(errorData.detail || 'An error occurred while processing your request');
    }
    return response.json() as Promise<T>;
  }

  async createRepository({ phone_number, name }: CreateRepositoryParams): Promise<RepositoryResponse> {
    try {
      const response = await fetch(this.getUrl(`/${phone_number}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      return this.handleResponse<RepositoryResponse>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create repository: ${error.message}`);
      }
      throw new Error('Failed to create repository: Unknown error occurred');
    }
  }

  async listRepositories({ phone_number }: ListRepositoriesParams): Promise<Repository[]> {
    try {
      const response = await fetch(this.getUrl(`/${phone_number}`), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await this.handleResponse<RepositoryListResponse>(response);
      return data.repositories;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list repositories: ${error.message}`);
      }
      throw new Error('Failed to list repositories: Unknown error occurred');
    }
  }

  async updateRepository({ phone_number, repository_name, new_name }: UpdateRepositoryParams): Promise<RepositoryResponse> {
    try {
      const response = await fetch(this.getUrl(`/${phone_number}/${repository_name}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: new_name }),
      });

      return this.handleResponse<RepositoryResponse>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update repository: ${error.message}`);
      }
      throw new Error('Failed to update repository: Unknown error occurred');
    }
  }

  async deleteRepository({ phone_number, repository_name }: DeleteRepositoryParams): Promise<{ message: string }> {
    try {
      const response = await fetch(this.getUrl(`/${phone_number}/${repository_name}`), {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      return this.handleResponse<{ message: string }>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete repository: ${error.message}`);
      }
      throw new Error('Failed to delete repository: Unknown error occurred');
    }
  }
}

export default RepositoryAPI;