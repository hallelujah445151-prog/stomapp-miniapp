import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuthStore } from './store/auth';
import { apiService } from './services/api';
import { PersonnelPage } from './pages/PersonnelPage';

// Простые интерфейсы без строгих типов
interface Order {
  id: number;
  patient_name: string;
  work_type: string;
  quantity: number;
  deadline: string;
  created_at: string;
  status: string;
  description?: string;
}

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
        role: result.user.role
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

// Dashboard Page
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [filter, setFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1,
      patient_name: 'Иванов Иван',
      work_type: 'Цирконевая коронка',
      quantity: 3,
      deadline: '2026-05-20',
      created_at: '2026-05-14',
      status: 'in_progress'
    },
    {
      id: 2,
      patient_name: 'Петров Петр',
      work_type: 'Металлокерамическая коронка',
      quantity: 1,
      deadline: '2026-05-25',
      created_at: '2026-05-10',
      status: 'completed'
    },
    {
      id: 3,
      patient_name: 'Сидоров Алексей',
      work_type: 'Ортодонтическая шина',
      quantity: 2,
      deadline: '2026-05-22',
      created_at: '2026-05-16',
      status: 'in_progress'
    }
  ]);

  const handleOrderClick = (orderId: number) => {
    navigate(`/order/${orderId}`);
  };

  const handleCreateOrder = () => {
    navigate('/create');
  };

  const handleLogout = () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      logout();
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header with user info and logout */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
            📋 Мои заказы
          </h1>
          <p style={{ margin: '5px 0 0 0 15px', fontSize: '14px', color: '#666' }}>
            Привет, {user?.name}! Роль: {user?.is_admin ? '👑 ' : ''}{user?.role === 'doctor' ? '👨‍⚕️ Врач' : user?.role === 'technician' ? '🔧 Техник' : '👤 Администратор'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {(user?.is_admin || user?.role === 'admin' || user?.role === 'doctor') && (
            <button
              onClick={(e) => { e.preventDefault(); handleCreateOrder(); }}
              style={{ padding: '10px 20px', backgroundColor: '#229ED9', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 2px 4px rgba(34, 197, 94, 0.1)' }}
            >➕ Новый</button>
          )}
          {user?.is_admin && (
            <button
              onClick={(e) => { e.preventDefault(); navigate('/personnel'); }}
              style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}
            >👥 Персонал</button>
          )}
          <button
            onClick={(e) => { e.preventDefault(); handleLogout(); }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            🚪 Выход
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
          📊 Фильтры:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              fontSize: '14px',
              padding: '10px 20px',
              backgroundColor: filter === 'all' ? '#229ED9' : '#fff',
              color: filter === 'all' ? 'white' : '#333',
              border: filter === 'all' ? '#2196F3' : '#ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            📋 Все ({orders.length})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            style={{
              fontSize: '14px',
              padding: '10px 20px',
              backgroundColor: filter === 'in_progress' ? '#229ED9' : '#fff',
              color: filter === 'in_progress' ? 'white' : '#333',
              border: filter === 'in_progress' ? '#2196F3' : '#ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🔵 В работе ({orders.filter(o => o.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            style={{
              fontSize: '14px',
              padding: '10px 20px',
              backgroundColor: filter === 'completed' ? '#229ED9' : '#fff',
              color: filter === 'completed' ? 'white' : '#333',
              border: filter === 'completed' ? '#2196F3' : '#ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ✅ Выполненные ({orders.filter(o => o.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px',
          backgroundColor: '#fff3e0',
          color: '#333',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>
            📭
          </div>
          <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>
            {filter === 'all' ? 'Нет заказов' : `Нет заказов со статусом "${filter === 'in_progress' ? 'В работе' : 'Выполненные'}"`}
          </div>
          {filter === 'all' && (user?.role === 'admin' || user?.role === 'doctor') && (
            <button
              onClick={(e) => { e.preventDefault(); handleCreateOrder(); }}
              style={{
                marginTop: '20px',
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
              ➕ Создать первый заказ
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredOrders.map((order) => (
            <div 
              key={order.id}
              onClick={() => handleOrderClick(order.id)}
              style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: order.status === 'in_progress' ? '2px solid #ff9800' : '1px solid #e0e0e0',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                minHeight: '150px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <span style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                    Заказ #{order.id}
                  </span>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    backgroundColor: order.status === 'in_progress' ? '#ff9800' : order.status === 'completed' ? '#4CAF50' : '#6c757d',
                    color: 'white',
                    fontWeight: '500'
                  }}>
                    {order.status === 'in_progress' && '🔵 В работе'}
                    {order.status === 'completed' && '✅ Выполнено'}
                    '⏳ Ожидает'
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '14px', marginBottom: '8px', color: '#333' }}>
                <div style={{ marginBottom: '4px' }}>
                  👤 <strong>Пациент:</strong> {order.patient_name}
                </div>
                <div style={{ marginBottom: '4px', color: '#666' }}>
                  🔧 <strong>Работа:</strong> {order.work_type}
                </div>
                <div style={{ marginBottom: '4px', color: '#666' }}>
                  📊 <strong>Количество:</strong> {order.quantity} шт.
                </div>
                <div style={{ marginBottom: '4px', color: '#666' }}>
                  ⏰ <strong>Дедлайн:</strong> {order.deadline}
                </div>
                {order.status === 'in_progress' && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px', 
                    backgroundColor: '#fff3e0', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    color: '#ff5722'
                  }}>
                    🔥 Срочный заказ!
                  </div>
                )}
              </div>

              <div style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
                💡 Нажмите для просмотра деталей
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Order Details Page
const OrderDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { user } = useAuthStore();
  const orderId = params.id ? parseInt(params.id) : 1;

  const mockOrder: Order = {
    id: orderId,
    patient_name: 'Иванов Иван',
    work_type: 'Цирконевая коронка на импланте',
    quantity: 3,
    deadline: '2026-05-20',
    created_at: '2026-05-14',
    status: 'in_progress',
    description: 'Срочный заказ для пациента Иванов Иван. Необходимо выполнить работу к 20 мая.'
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '25px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            marginBottom: '20px',
            padding: '10px 15px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ← Назад
        </button>

        <h1 style={{ fontSize: '22px', marginBottom: '20px', color: '#333' }}>
          📋 Заказ #{mockOrder.id}
        </h1>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          marginBottom: '20px' 
        }}>
          <div style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#333' }}>
            📊 Информация о заказе
          </div>
          
          <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>👤 Пациент:</strong> {mockOrder.patient_name}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>🔧 Вид работы:</strong> {mockOrder.work_type}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>📊 Количество:</strong> {mockOrder.quantity} шт.
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>⏰ Дедлайн:</strong> {mockOrder.deadline}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>📅 Статус:</strong> {mockOrder.status === 'in_progress' ? '🔵 В работе' : '✅ Выполнено'}
            </div>
            <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#fff3e0', borderRadius: '6px' }}>
              <strong>📝 Описание:</strong> {mockOrder.description}
            </div>
          </div>
        </div>

        {user?.role === 'technician' ? (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '8px',
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '20px', marginBottom: '10px', color: '#1976D2' }}>
              👤 Это ваш заказ!
            </div>
            <div style={{ fontSize: '14px', color: '#1976D2' }}>
              Нажмите кнопку ниже для изменения статуса на "Выполнено"
            </div>
            <button
              onClick={() => {
                alert('Заказ выполнен!');
                navigate('/dashboard');
              }}
              style={{
                marginTop: '10px',
                padding: '12px 20px',
                backgroundColor: 'white',
                color: '#1976D2',
                border: '2px solid #1976D2',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✅ Отметить как выполнено
            </button>
          </div>
        ) : (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#e8f5e9', 
            borderRadius: '8px',
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '20px', marginBottom: '10px', color: '#4CAF50' }}>
              ✅ Редактирование доступно
            </div>
            <div style={{ fontSize: '14px', color: '#1b5e20' }}>
              Для {user?.role === 'admin' ? 'администраторов' : 'врачей'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Create Order Page
const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    patient_name: '',
    work_type: '',
    quantity: 1,
    deadline: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Create order and navigate back to dashboard
    navigate('/dashboard');
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '25px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0 0,0,0.1)'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            marginBottom: '20px',
            padding: '10px 15px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ← Назад
        </button>

        <h1 style={{ fontSize: '22px', marginBottom: '20px', color: '#333' }}>
          ➕ Создание заказа (Шаг {step}/3)
        </h1>

        {/* Progress indicator */}
        <div style={{ marginBottom: '20px' }}>
          {[1, 2, 3].map(s => (
            <div
              key={s}
              style={{
                display: 'inline-block',
                width: 'calc(33.33% - 10px)',
                height: '8px',
                backgroundColor: s <= step ? '#229ED9' : '#e0e0e0',
                margin: '0 5px',
                borderRadius: '4px'
              }}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
                  📝 Имя пациента
                </label>
                <input
                  type="text"
                  required
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Фамилия Имя Отчество"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
                  🔧 Вид работы
                </label>
                <select
                  required
                  value={formData.work_type}
                  onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Выберите вид работы</option>
                  <option value="Цирконевая коронка">Цирконевая коронка</option>
                  <option value="Керамическая коронка">Керамическая коронка</option>
                  <option value="Временная коронка">Временная коронка</option>
                  <option value="Вкладной протез">Вкладной протез</option>
                  <option value="Бюгельное протезирование">Бюгельное протезирование</option>
                  <option value="Ортодонтическая шина">Ортодонтическая шина</option>
                  <option value="Коронка из циркония">Коронка из циркония</option>
                </select>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => handleNext()}
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
                  Далее →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
                  📊 Количество
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Количество единиц"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
                  ⏰ Срок выполнения
                </label>
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => handleBack()}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ← Назад
                </button>
                <button
                  type="button"
                  onClick={() => handleNext()}
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
                  Далее →
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
                  📝 Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Особые требования, пожелания или другая информация"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => handleBack()}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ← Назад
                </button>
                <button
                  type="submit"
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
                  ✅ Создать заказ
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

// 404 Page Not Found
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
  const [autoLoginDone, setAutoLoginDone] = React.useState(false);

  React.useEffect(() => {
    // Auto-login for Telegram users
    if (!localStorage.getItem('stomapp_user')) {
      const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      if (tgUser?.id) {
        apiService.loginByTelegramId(tgUser.id)
          .then(r => localStorage.setItem('stomapp_user', JSON.stringify({
            id: r.user.id, name: r.user.name, telegram_id: String(r.user.telegram_id),
            role: r.user.role, is_admin: r.user.is_admin
          })))
          .catch(() => {})
          .finally(() => { window.location.reload(); });
        return;
      }
    }
    setAutoLoginDone(true);
  }, []);

  React.useEffect(() => {
    if (!autoLoginDone) return;
    // Telegram WebApp initialization
    if (window.Telegram && window.Telegram.WebApp) {
      const webApp = window.Telegram.WebApp;
      webApp.ready();
      webApp.expand();
      const themeParams = webApp.themeParams || {};
      if (themeParams.bg_color) document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
      if (themeParams.text_color) document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color);
      if (themeParams.hint_color) document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
    }
    setIsInitialized(true);
  }, [autoLoginDone]);

  if (!isInitialized) {
    return <LoadingState />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><CreateOrderPage /></ProtectedRoute>} />
              <Route path="/order/:id" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
              <Route path="/personnel" element={<ProtectedRoute><PersonnelPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;