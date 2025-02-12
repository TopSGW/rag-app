export interface Repository {
  id: number;
  name: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export interface RepositoryCreate {
  name: string;
}

export interface RepositoryResponse {
  id: number;
  name: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRepositoryParams {
  phone_number: string;
  name: string;
}

export interface UpdateRepositoryParams {
  phone_number: string;
  repository_name: string;
  new_name: string;
}

export interface DeleteRepositoryParams {
  phone_number: string;
  repository_name: string;
}

export interface ListRepositoriesParams {
  phone_number: string;
}

export interface RepositoryError {
  detail: string;
}