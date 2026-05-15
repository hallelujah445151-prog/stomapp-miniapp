import React from 'react';
import { formatDeadline, getStatusText, getStatusColor } from '../../utils/formatters';
import { useStore } from '../../store';

interface OrderCardProps {
  order: any;
  onClick: () => void;
  showTechnicianInfo?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onClick, showTechnicianInfo = false }) => {
  const statusColor = getStatusColor(order.status);
  const statusText = getStatusText(order.status);

  const isUrgent = () => {
    if (order.status !== 'in_progress') return false;
    const deadline = new Date(order.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  };

  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: isUrgent() ? '3px solid #ff9800' : '1px solid #e0e0e0',
        backgroundColor: isUrgent() ? '#fff8f0' : '#ffffff',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
      }}
    >
      {/* Заголовок карточки */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: '600' }}>
            Заказ #{order.id}
          </span>
          <span style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            backgroundColor: statusColor,
            color: '#ffffff',
            fontWeight: '500'
          }}>
            {statusText}
          </span>
        </div>
      </div>

      {/* Информация о заказе */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', marginBottom: '6px', color: 'var(--tg-theme-text-color, #000000)' }}>
          <span style={{ fontWeight: '500' }}>👤 Пациент:</span> {order.patient_name || 'Не указан'}
        </div>
        <div style={{ fontSize: '14px', marginBottom: '6px', color: 'var(--tg-theme-text-color, #000000)' }}>
          <span style={{ fontWeight: '500' }}>🔧 Вид работы:</span> {order.work_type}
        </div>
        <div style={{ fontSize: '14px', marginBottom: '6px', color: 'var(--tg-theme-text-color, #000000)' }}>
          <span style={{ fontWeight: '500' }}>📊 Количество:</span> {order.quantity} шт.
        </div>
        <div style={{ fontSize: '14px', marginBottom: '6px', color: 'var(--tg-theme-text-color, #000000)' }}>
          <span style={{ fontWeight: '500' }}>🏰 Дедлайн:</span> {formatDeadline(order.deadline)}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color, #999999)' }}>
          <span style={{ fontWeight: '500' }}>📅 Создан:</span> {new Date(order.created_at).toLocaleDateString('ru-RU')}
        </div>
      </div>

      {/* Информация о технике */}
      {showTechnicianInfo && (
        <div style={{
          borderTop: '1px solid #e0e0e0',
          paddingTop: '12px',
          fontSize: '13px',
          color: 'var(--tg-theme-hint-color, #999999)'
        }}>
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>
            🔧 Ответственный: Техник #{order.technician_id || 'Не назначен'}
          </div>
        </div>
      )}

      {/* Описание */}
      {order.description && (
        <div style={{
          fontSize: '13px',
          color: 'var(--tg-theme-hint-color, #999999)',
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          📝 {order.description}
        </div>
      )}

      {/* Кнопки действий */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }} onClick={(e) => e.stopPropagation()}>
        <button
          className="button button-primary"
          style={{
            flex: 1,
            padding: '10px 16px',
            fontSize: '14px',
            minWidth: '0'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          📋 Подробнее
        </button>
        
        {order.status === 'in_progress' && (
          <button
            className="button button-success"
            style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: '14px',
              minWidth: '0'
            }}
            onClick={(e) => {
              e.stopPropagation();
              const { updateOrder } = useStore.getState();
              updateOrder(order.id, { status: 'completed' });
            }}
          >
            ✅ Готово
          </button>
        )}
      </div>
    </div>
  );
};