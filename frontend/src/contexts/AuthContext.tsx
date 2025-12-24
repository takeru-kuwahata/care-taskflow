import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginCredentials, SignupData } from '../types';
import { mockAuthService } from '../services/api/mockAuthService';

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
    const loadUser = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const currentUser = await mockAuthService.getCurrentUser(token);
          setUser(currentUser);
        } catch (error) {
          localStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await mockAuthService.login(credentials);
    setUser(response.user);
    localStorage.setItem('auth_token', response.token);
  };

  const signup = async (data: SignupData) => {
    const response = await mockAuthService.signup(data);
    setUser(response.user);
    localStorage.setItem('auth_token', response.token);
  };

  const logout = async () => {
    await mockAuthService.logout();
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
