import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/auth';
import { TelegramAuth } from './TelegramAuth';
import { Login } from './Login';

interface AppWrapperProps {
  children: React.ReactNode;
}

export const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Проверяем, открыто ли приложение через Telegram
    const isInTelegram = typeof window !== 'undefined' && (window as any).Telegram && (window as any).Telegram.WebApp;
    
    if (isInTelegram) {
      const webApp = (window as any).Telegram.WebApp;
      
      // Расширяем на полный экран
      if (webApp.expand) {
        webApp.expand();
      }
    }
  }, []);

  // Если пользователь авторизован, показываем приложение
  // Если нет - показываем форму авторизации
  if (!isAuthenticated) {
    if (typeof window !== 'undefined' && (window as any).Telegram && (window as any).Telegram.WebApp) {
      // Открыто через Telegram Mini App
      return <TelegramAuth />;
    } else {
      // Открыто напрямую в браузере
      return <Login onLogin={(userData) => {
        const { login } = useAuthStore.getState();
        login(userData);
      }} />;
    }
  }

  return <>{children}</>;
};