import {
  User,
  UserResponse,
  UserError,
  RegisterUserParams,
  UpdatePhoneParams,
  GetUserParams
} from '../../types/user';
import { getConfig } from './config';

class UserAPI {
  private config;

  constructor() {
    this.config = getConfig();
  }

  private getUrl(path: string): string {
    // Ensure path starts with slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.baseUrl}${this.config.apiPrefix}/users${normalizedPath}`;
  }

  private cleanPhoneNumber(phone: string): string {
    if (!phone) return phone;
    const hasPlus = phone.startsWith('+');
    const cleaned = phone.replace(/[^\d]/g, '');
    return hasPlus ? `+${cleaned}` : cleaned;
  }

  async registerUser({ phone_number }: RegisterUserParams): Promise<UserResponse> {
    const cleanedPhone = this.cleanPhoneNumber(phone_number);
    const response = await fetch(this.getUrl('/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone_number: cleanedPhone }),
    });

    if (!response.ok) {
      const error: UserError = await response.json();
      throw new Error(error.detail);
    }

    return response.json();
  }

  async loginUser({ phone_number }: RegisterUserParams): Promise<UserResponse> {
    const cleanedPhone = this.cleanPhoneNumber(phone_number);
    const response = await fetch(this.getUrl('/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone_number: cleanedPhone }),
    });

    if (!response.ok) {
      const error: UserError = await response.json();
      throw new Error(error.detail);
    }

    return response.json();
  }

  async updatePhoneNumber({ user_id, phone_number }: UpdatePhoneParams): Promise<UserResponse> {
    const cleanedPhone = this.cleanPhoneNumber(phone_number);
    const response = await fetch(this.getUrl(`/${user_id}/phone`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone_number: cleanedPhone }),
    });

    if (!response.ok) {
      const error: UserError = await response.json();
      throw new Error(error.detail);
    }

    return response.json();
  }

  async getUser({ user_id }: GetUserParams): Promise<UserResponse> {
    const response = await fetch(this.getUrl(`/${user_id}`), {
      method: 'GET',
    });

    if (!response.ok) {
      const error: UserError = await response.json();
      throw new Error(error.detail);
    }

    return response.json();
  }

  async validatePhoneNumber(phone_number: string): Promise<boolean> {
    const cleanedPhone = this.cleanPhoneNumber(phone_number);
    const phoneRegex = /^\+?\d{9,15}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      throw new Error('Invalid phone number format. Must be between 9 and 15 digits.');
    }
    return true;
  }
}

export default UserAPI;