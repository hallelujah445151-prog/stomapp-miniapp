import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useAuthStore } from '../store/auth';
import { Header } from '../components/common/Header';
import { OrderCard } from '../components/orders/OrderCard';
import { Loader, EmptyState } from '../components/common/Loader';
import { withRoleProtection } from '../components/auth/RoleBasedAccess';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { orders, loadOrders, isLoading, error } = useStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadOrders(user.id, user.role);
    }
  }, [user, loadOrders]);

  useEffect(() => {
    loadOrders(user?.id ? filter : undefined);
  }, [filter, user]);

  // Фильтрация заказов с учетом роли
  let filteredOrders = filter === 'all' ? orders : orders.filter(order => order.status === filter);
  
  // Для техника показываем только его заказы
  if (user?.role === 'technician') {
    filteredOrders = filteredOrders.filter(order => order.technician_id === user.id);
  }

  // Поиск по заказам
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredOrders = filteredOrders.filter(order => 
      order.work_type.toLowerCase().includes(query) ||
      order.patient_name?.toLowerCase().includes(query) ||
      order.id.toString().includes(query)
    );
  }

  // Сортировка: сначала срочные, потом по дате
  filteredOrders.sort((a, b) => {
    const urgentA = a.status === 'in_progress';
    const urgentB = b.status === 'in_progress';
    if (urgentA && !urgentB) return -1;
    if (!urgentA && urgentB) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const inProgressCount = orders.filter(o => o.status === 'in_progress').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const urgentCount = orders.filter(o => {
    if (o.status !== 'in_progress') return false;
    const deadline = new Date(o.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  }).length;

  const handleOrderClick = (orderId: number) => {
    // Для техника - только свои заказы
    if (user?.role === 'technician') {
      const order = orders.find(o => o.id === orderId);
      if (order?.technician_id !== user.id) {
        alert('У вас нет доступа к этому заказу');
        return;
      }
    }
    navigate(`/order/${orderId}`);
  };

  const getOrdersWord = (count: number): string => {
    const lastTwoDigits = count % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'заказов';
    }
    const lastDigit = count % 10;
    if (lastDigit === 1) {
      return 'заказ';
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      return 'заказа';
    } else {
      return 'заказов';
    }
  };

  // Dashboard с ролевыми ограничениями
  const RoleProtectedDashboard = withRoleProtection(['admin', 'doctor', 'technician'])(() => {
    if (isLoading && orders.length === 0) {
      return <Loader text="Загрузка заказов..." />;
    }

    return (
      <div>
        <Header 
          title={`📋 ${user?.role === 'technician' ? 'Мои заказы' : 'Мои заказы'}`}
          subtitle={`Всего: ${orders.length} | В работе: ${inProgressCount} | Выполнено: ${completedCount}`}
          actions={
            (user?.role === 'admin' || user?.role === 'doctor') && (
              <button 
                className="button button-primary" 
                onClick={() => navigate('/create')}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                ➕ Новый
              </button>
            )
          }
        />

        <div className="container">
          {/* Важные уведомления */}
          {urgentCount > 0 && (
            <div 
              className="card" 
              style={{ 
                backgroundColor: '#fff3e0', 
                border: '2px solid #ff9800',
                marginBottom: '20px',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                    Внимание! Срочные заказы
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    У вас <strong>{urgentCount}</strong> заказов со сроком выполнения в ближайшие 2 дня.
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="card" style={{ backgroundColor: '#ffebee', color: '#f44336', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>❌</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Поиск */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                fontSize: '18px'
              }}>
                🔍
              </span>
              <input
                type="text"
                className="input"
                placeholder="Поиск по заказам (вид работы, пациент, номер)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '44px', fontSize: '15px' }}
              />
            </div>
            {searchQuery && (
              <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999999)', marginTop: '4px' }}>
                💡 Найдено: {filteredOrders.length} {getOrdersWord(filteredOrders.length)}
              </div>
            )}
          </div>

          {/* Фильтры */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999999)', marginBottom: '8px' }}>
              📊 Показать:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                className={`button ${filter === 'all' ? 'button-primary' : 'button-secondary'}`}
                onClick={() => setFilter('all')}
                style={{ 
                  fontSize: '14px', 
                  padding: '10px 18px',
                  minHeight: '40px',
                  fontWeight: filter === 'all' ? '600' : '400'
                }}
              >
                📋 Все <span style={{ 
                  marginLeft: '6px', 
                  padding: '2px 8px', 
                  borderRadius: '10px',
                  fontSize: '12px',
                  backgroundColor: filter === 'all' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'
                }}>{orders.length}</span>
              </button>
              <button
                className={`button ${filter === 'in_progress' ? 'button-primary' : 'button-secondary'}`}
                onClick={() => setFilter('in_progress')}
                style={{ 
                  fontSize: '14px', 
                  padding: '10px 18px',
                  minHeight: '40px',
                  fontWeight: filter === 'in_progress' ? '600' : '400'
                }}
              >
                🔵 В работе <span style={{ 
                  marginLeft: '6px', 
                  padding: '2px 8px', 
                  borderRadius: '10px',
                  fontSize: '12px',
                  backgroundColor: filter === 'in_progress' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'
                }}>{inProgressCount}</span>
              </button>
              <button
                className={`button ${filter === 'completed' ? 'button-primary' : 'button-secondary'}`}
                onClick={() => setFilter('completed')}
                style={{ 
                  fontSize: '14px', 
                  padding: '10px 18px',
                  minHeight: '40px',
                  fontWeight: filter === 'completed' ? '600' : '400'
                }}
              >
                ✅ Выполненные <span style={{ 
                  marginLeft: '6px', 
                  padding: '2px 8px', 
                  borderRadius: '10px',
                  fontSize: '12px',
                  backgroundColor: filter === 'completed' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'
                }}>{completedCount}</span>
              </button>
            </div>
          </div>

          {/* Список заказов */}
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={searchQuery ? '🔍' : '📭'}
              title={searchQuery ? 'Ничего не найдено' : 'Нет заказов'}
              description={
                searchQuery 
                  ? 'Попробуйте изменить параметры поиска' 
                  : filter === 'all' 
                    ? 'У вас пока нет заказов. Создайте первый!' 
                    : `Нет заказов со статусом "${filter === 'in_progress' ? 'В работе' : 'Выполненные'}"`
              }
              action={
                (user?.role === 'admin' || user?.role === 'doctor') && !searchQuery && filter === 'all' && (
                  <button className="button button-primary" onClick={() => navigate('/create')}>
                    ➕ Создать первый заказ
                  </button>
                )
              }
            />
          ) : (
            <>
              <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999999)', marginBottom: '12px' }}>
                💡 Нажмите на заказ для просмотра деталей
              </div>
              {filteredOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onClick={() => handleOrderClick(order.id)}
                  showTechnicianInfo={user?.role === 'technician'}
                />
              ))}
            </>
          )}
        </div>
      </div>
    );
  });

  return <RoleProtectedDashboard />;
};