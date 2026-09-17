import api from './api';

export interface AuthUser {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  delegateCode?: string;
  role: string;
  role_name?: string;
  permissions?: string[];
  has_region_restriction?: boolean;
  region?: string;
  wilaya?: string;
  avatar?: string;
  is_active?: boolean;
  last_login_at?: string;
}

interface LoginResponse {
  user: AuthUser;
  token: string;
}

interface ProfileResponse {
  user: AuthUser;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { username, password });
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<AuthUser> {
    const { data } = await api.get<ProfileResponse>('/auth/me');
    return data.user;
  },

  async updateProfile(profile: { name?: string; email?: string; password?: string; password_confirmation?: string }): Promise<AuthUser> {
    const { data } = await api.put<ProfileResponse>('/auth/profile', profile);
    return data.user;
  },
};
