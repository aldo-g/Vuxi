export interface AuthFormData {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface AuthState {
  isLoading: boolean;
  error: string | null;
  user: User | null;
}

export interface User {
  id: string;
  Name: string;
  email: string;
}