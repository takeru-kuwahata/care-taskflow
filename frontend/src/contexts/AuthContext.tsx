import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginCredentials, SignupData } from '../types';
import { authService } from '../services/AuthService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ページロード時にトークンからユーザー情報を復元
    const loadUser = () => {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          const currentUser = JSON.parse(userStr) as User;
          setUser(currentUser);
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  };

  const signup = async (data: SignupData) => {
    const response = await authService.signup(data);
    setUser(response.user);
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
