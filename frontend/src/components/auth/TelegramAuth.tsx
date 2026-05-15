import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { Header } from '../common/Header';

interface TelegramAuthProps {
  onLogin: (user: any) => void;
}

export const TelegramAuth: React.FC<TelegramAuthProps> = ({ onLogin }) => {
  const { login, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Инициализация Telegram Mini App
    const initTelegram = () => {
      try {
        // Используем Telegram WebApp API
        if (window.Telegram && window.Telegram.WebApp) {
          const webApp = window.Telegram.WebApp;
          
          // Разрешаем Mini App работать в полноэкранном режиме
          webApp.ready();
          webApp.expand();
          
          // Получаем данные пользователя из Telegram
          const initData = webApp.initData;
          const user = initData?.user;
          
          if (user) {
            // Создаем объект пользователя
            const userData = {
              id: user.id || Date.now(),
              name: `${user.first_name} ${user.last_name || ''}`.trim(),
              telegram_id: user.id?.toString(),
              role: 'doctor' as const,
              is_admin: false,
            };
            
            // Авторизуем пользователя
            login(userData);
            setLoading(false);
          } else {
            setLoading(false);
            setError('Нет данных пользователя в Telegram');
          }
        } else {
          setLoading(false);
          setError('Telegram WebApp не доступен');
        }
      } catch (err) {
        console.error('Telegram initialization error:', err);
        setLoading(false);
        setError('Ошибка инициализации Telegram');
      }
    };

    // Ждем загрузки Telegram WebApp API
    const timer = setTimeout(() => {
      initTelegram();
    }, 100);

    return () => clearTimeout(timer);
  }, [login]);

  // Если пользователь уже авторизован, перенаправляем
  useEffect(() => {
    if (user) {
      // Перенаправляем на dashboard
      window.location.href = '/dashboard';
    }
  }, [user]);

  if (loading) {
    return (
      <div>
        <Header title="🔐 Авторизация" subtitle="StomApp" />
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>
            ⏳
          </div>
          <div style={{ fontSize: '16px', color: '#999999' }}>
            Подключение к Telegram...
          </div>
          <div style={{ fontSize: '14px', color: '#999999', marginTop: '10px' }}>
            Пожалуйста, подождите...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="❌ Ошибка авторизации" subtitle="StomApp" />
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>
            ⚠️
          </div>
          <div style={{ fontSize: '16px', color: '#f44336', marginBottom: '16px' }}>
            {error}
          </div>
          <div style={{ fontSize: '14px', color: '#999999' }}>
            Пожалуйста, откройте приложение через Telegram
          </div>
          <button 
            className="button button-primary"
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '12px 24px', fontSize: '16px' }}
          >
            🔄 Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return null; // Будет перенаправлен автоматически
};