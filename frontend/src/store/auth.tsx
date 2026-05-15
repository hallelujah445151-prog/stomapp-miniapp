import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  telegram_id?: string;
  role: 'technician' | 'doctor' | 'admin';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: () => {},
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('stomapp_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser) as User;
        setUser(userData);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Error loading user:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('stomapp_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('stomapp_user');
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthStore = () => {
  const context = React.useContext(AuthContext);
  return context;
};

useAuthStore.getState = () => {
  const savedUser = localStorage.getItem('stomapp_user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  return {
    user,
    isAuthenticated: !!user,
    logout: () => {
      localStorage.removeItem('stomapp_user');
      window.location.reload();
    }
  };
};