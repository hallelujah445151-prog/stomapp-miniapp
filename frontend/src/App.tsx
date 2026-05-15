import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuthStore } from './store/auth';
import { apiService } from './services/api';

// Login Page
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    telegram_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.telegram_id) {
      setErrorMsg('Введите Telegram ID');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');

    try {
      const result = await apiService.loginByTelegramId(Number(formData.telegram_id));
      login({
        id: result.user.id,
        name: result.user.name,
        telegram_id: String(result.user.telegram_id),
        role: result.user.role,
        is_admin: result.user.is_admin
      });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Ошибка входа. Проверьте Telegram ID.';
      setErrorMsg(msg);
    }

    setLoading(false);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '8px', color: '#333' }}>
          StomApp - Вход
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '13px', color: '#666' }}>
          Введите ваш Telegram ID для входа
        </p>

        {errorMsg && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            ❌ {errorMsg}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
              Telegram ID:
            </label>
            <input
              type="text"
              required
              value={formData.telegram_id}
              onChange={(e) => setFormData({ telegram_id: e.target.value })}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #ddd', 
                borderRadius: '8px',
                fontSize: '16px'
              }}
              placeholder="Например: 176897162"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#ccc' : '#229ED9',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔄 Вход...' : '🚀 Войти'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#999' }}>
          Ваш Telegram ID должен быть в базе сотрудников
        </p>
      </div>
    </div>
  );
};

// Protected Route
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// 404 Page Not Found - keep this one
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>
        🚫
      </div>
      <h1 style={{ marginBottom: '10px', fontSize: '24px', color: '#333' }}>
        Страница не найдена
      </h1>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
        Страница "{window.location.pathname}" не существует
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          padding: '12px 24px',
          backgroundColor: '#229ED9',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        📋 Вернуться на главную
      </button>
    </div>
  );
};

// Loading State
const LoadingState: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh',
    fontSize: '18px',
    color: '#999999'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
      <div>Инициализация...</div>
    </div>
  </div>
);

// Main App Component
function App() {
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    // Telegram WebApp initialization
    if (window.Telegram && window.Telegram.WebApp) {
      const webApp = window.Telegram.WebApp;
      webApp.ready();
      webApp.expand();
      
      const themeParams = webApp.themeParams || {};
      if (themeParams.bg_color) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
      }
      if (themeParams.text_color) {
        document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color);
      }
      if (themeParams.hint_color) {
        document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
      }
    }
    
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return <LoadingState />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <AppInitializer>
            <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><CreateOrder /></ProtectedRoute>} />
              <Route path="/order/:id" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
              <Route path="/personnel" element={<ProtectedRoute><PersonnelPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </AppInitializer>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Auto-login initializer
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { login, isAuthenticated } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isAuthenticated) { setChecked(true); return; }

    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user?.id) { setChecked(true); return; }

    const userId = tg.initDataUnsafe.user.id;
    apiService.loginByTelegramId(userId)
      .then(result => login({ id: result.user.id, name: result.user.name, telegram_id: String(result.user.telegram_id), role: result.user.role, is_admin: result.user.is_admin }))
      .catch(() => setChecked(true));
  }, []);

  if (!checked && !isAuthenticated) return <LoadingState />;
  return <>{children}</>;
};

export default App;