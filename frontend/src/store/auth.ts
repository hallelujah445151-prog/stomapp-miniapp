import React, { useState, useEffect } from 'react';

// Простая система авторизации без сложных типов
interface User {
  id: number;
  name: string;
  telegram_id?: string;
  role: 'technician' | 'doctor' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {}
});

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Проверяем сохраненные данные
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
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  return context;
};