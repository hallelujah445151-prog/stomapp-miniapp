import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../common/Header';
import { useAuthStore } from '../../store/auth';
import '../styles/global.css';

export const Registration: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    telegram_id: '',
    role: 'doctor' as 'technician' | 'doctor' | 'admin',
    clinic: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Для демонстрации используем локальное хранение
      const userData = {
        id: Date.now(),
        ...formData
      };

      localStorage.setItem('stomapp_user', JSON.stringify(userData));
      login(userData);
      
      // Перенаправляем в зависимости от роли
      if (userData.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Ошибка регистрации. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="📝 Регистрация" subtitle="StomApp" showLogout={false} />
      
      <div className="container" style={{ paddingTop: '20px' }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
              📋 Регистрация пользователя
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color, #999999)', textAlign: 'center' }}>
              Заполните форму для создания аккаунта
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px' }}>
              👤 ФИО:
            </label>
            <input
              type="text"
              name="name"
              className="input"
              value={formData.name}
              onChange={handleChange}
              placeholder="Введите ваше ФИО"
              required
              style={{ width: '100%', fontSize: '15px', padding: '12px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px' }}>
              🆔 Telegram ID:
            </label>
            <input
              type="text"
              name="telegram_id"
              className="input"
              value={formData.telegram_id}
              onChange={handleChange}
              placeholder="Ваш ID в Telegram"
              required
              style={{ width: '100%', fontSize: '15px', padding: '12px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px' }}>
              🏥 Клиника/Лаборатория:
            </label>
            <input
              type="text"
              name="clinic"
              className="input"
              value={formData.clinic}
              onChange={handleChange}
              placeholder="Название клиники"
              style={{ width: '100%', fontSize: '15px', padding: '12px' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '15px' }}>
              👤 Ваша роль:
            </label>
            <select
              name="role"
              className="input"
              value={formData.role}
              onChange={handleChange}
              style={{ width: '100%', fontSize: '15px', padding: '12px' }}
            >
              <option value="doctor">👨‍⚕️ Врач</option>
              <option value="technician">🔧 Техник</option>
              <option value="admin">👤 Администратор</option>
            </select>
            <p style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999999)', marginTop: '8px' }}>
              * Роль администратора требует подтверждения
            </p>
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
            {loading ? '🔄 Регистрация...' : '✅ Зарегистрироваться'}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
            <p style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
              Уже есть аккаунт?
            </p>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate('/login')}
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              🔑 Войти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};