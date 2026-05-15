import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/common/Header';
import '../styles/global.css';

interface LoginProps {
  onLogin: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [role, setRole] = useState<'technician' | 'doctor' | 'admin'>('technician');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Для демонстрации используем локальное хранилище
      const userData = {
        id: Date.now(),
        name: name,
        telegram_id: telegramId,
        role: role
      };

      // Сохраняем пользователя
      localStorage.setItem('stomapp_user', JSON.stringify(userData));
      onLogin(userData);
      
      // Перенаправляем в зависимости от роли
      if (role === 'technician') {
        navigate('/dashboard');
      } else if (role === 'doctor') {
        navigate('/dashboard');
      } else if (role === 'admin') {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Ошибка входа. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="🔐 Вход в систему" subtitle="StomApp" />
      
      <div className="container" style={{ paddingTop: '20px' }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px' }}>
              📝 Ваше имя:
            </label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите ваше имя"
              required
              style={{ width: '100%', fontSize: '15px', padding: '12px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px' }}>
              🆔 Telegram ID:
            </label>
            <input
              type="text"
              className="input"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="Ваш ID в Telegram"
              required
              style={{ width: '100%', fontSize: '15px', padding: '12px' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '15px' }}>
              👤 Ваша роль:
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`button ${role === 'technician' ? 'button-primary' : 'button-secondary'}`}
                onClick={() => setRole('technician')}
                style={{ flex: 1, fontSize: '14px', padding: '12px' }}
              >
                🔧 Техник
              </button>
              <button
                type="button"
                className={`button ${role === 'doctor' ? 'button-primary' : 'button-secondary'}`}
                onClick={() => setRole('doctor')}
                style={{ flex: 1, fontSize: '14px', padding: '12px' }}
              >
                👨‍⚕️ Врач
              </button>
              <button
                type="button"
                className={`button ${role === 'admin' ? 'button-primary' : 'button-secondary'}`}
                onClick={() => setRole('admin')}
                style={{ flex: 1, fontSize: '14px', padding: '12px' }}
              >
                👤 Администратор
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="button button-primary"
            disabled={loading}
            style={{ 
              width: '100%', 
              fontSize: '16px', 
              padding: '14px',
              backgroundColor: loading ? '#cccccc' : '#229ED9',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔄 Вход...' : '🚀 Войти'}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
            <p style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
              ℹ️ Для Telegram Mini App вы будете автоматически авторизованы через Telegram
            </p>
            <p style={{ color: 'var(--tg-theme-hint-color, #999999)', marginTop: '10px' }}>
              🔑 Введите данные для демонстрации или ожидайте автоматической аутентификации
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};