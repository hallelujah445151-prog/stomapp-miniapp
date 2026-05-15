import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { useStore } from '../../store';

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { orders, loadOrders } = useStore();
  
  const handleNavigation = (path: string) => {
    if (location.pathname === path) return;
    
    // Загрузка заказов при навигации
    if (user) {
      loadOrders(user.id, user.role);
    }
    
    navigate(path);
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    const { logout } = useAuthStore.getState();
    logout();
    navigate('/');
    window.location.reload();
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <div className="navigation" style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
        padding: '12px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
        zIndex: '100',
        paddingBottom: '20px'
      }}>
        <button
          className="nav-button"
          onClick={() => handleNavigation('/')}
          style={{
            flex: 1,
            fontSize: '16px',
            background: 'transparent',
            border: 'none',
            color: location.pathname === '/' ? 'var(--tg-theme-button-color, #2481cc)' : 'var(--tg-theme-text-color, #000000)',
            padding: '10px',
            cursor: 'pointer',
            fontWeight: location.pathname === '/' ? '600' : '400'
          }}
        >
          📋 Главная
        </button>
        
        {(user?.role === 'admin' || user?.role === 'doctor') && (
          <button
            className="nav-button"
            onClick={() => handleNavigation('/create')}
            style={{
              flex: 1,
              fontSize: '16px',
              background: 'transparent',
              border: 'none',
              color: location.pathname === '/create' ? 'var(--tg-theme-button-color, #2481cc)' : 'var(--tg-theme-text-color, #000000)',
              padding: '10px',
              cursor: 'pointer',
              fontWeight: location.pathname === '/create' ? '600' : '400'
            }}
          >
            ➕ Новый
          </button>
        )}
        
        <button
          className="nav-button"
          onClick={handleLogoutClick}
          style={{
            fontSize: '14px',
            background: 'var(--tg-theme-button-color, #2481cc)',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: '500',
            marginLeft: '8px'
          }}
        >
          🚪 Выход
        </button>
      </div>

      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '1000',
          padding: '20px'
        }}>
          <div className="card" style={{
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚪</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
              Выход из аккаунта
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color, #999999)', marginBottom: '24px' }}>
              Вы уверены, что хотите выйти из приложения?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="button button-secondary"
                onClick={handleLogoutCancel}
                style={{ flex: 1 }}
              >
                Отмена
              </button>
              <button
                className="button button-primary"
                onClick={handleLogoutConfirm}
                style={{ flex: 1 }}
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};