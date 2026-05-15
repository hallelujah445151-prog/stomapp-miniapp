import React from 'react';
import { Order } from '../../types';
import { formatDateTime, formatDeadline, getStatusText, getStatusColor } from '../../utils/formatters';

interface OrderDetailsProps {
  order: Order;
  onEdit?: () => void;
  onClose?: () => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onEdit, onClose }) => {
  const deadline = formatDeadline(order.deadline);
  const statusText = getStatusText(order.status);
  const statusColor = getStatusColor(order.status);

  return (
    <div className="card" style={{ borderLeft: `4px solid ${statusColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
            Заказ #{order.id}
          </h2>
          <div style={{ color: 'var(--tg-theme-hint-color, #999999)', fontSize: '14px' }}>
            Создан: {formatDateTime(order.created_at)}
          </div>
        </div>
        <span
          className="status-badge"
          style={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
            fontSize: '14px',
            padding: '8px 16px'
          }}
        >
          {statusText}
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: 'var(--tg-theme-link-color, #2481cc)' }}>
          {order.work_type}
        </h3>
        {order.patient_name && (
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>👤 Пациент:</span>{' '}
            <strong>{order.patient_name}</strong>
          </div>
        )}
      </div>

      <div style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gap: '12px', fontSize: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>🔢 Количество:</span>
            <strong>{order.quantity} шт.</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>📅 Срок:</span>
            <span style={{ fontWeight: deadline.urgent ? '600' : '400', color: deadline.urgent ? 'var(--danger-color, #f44336)' : 'inherit' }}>
              {deadline.text}
            </span>
          </div>
          {order.doctor_id && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>👨‍⚕️ Врач:</span>
              <strong>ID: {order.doctor_id}</strong>
            </div>
          )}
          {order.technician_id && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>🔧 Техник:</span>
              <strong>ID: {order.technician_id}</strong>
            </div>
          )}
        </div>
      </div>

      {order.description && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--tg-theme-hint-color, #999999)' }}>
            📝 Описание:
          </h4>
          <div style={{ fontSize: '15px', lineHeight: '1.6', backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)', padding: '12px', borderRadius: '8px' }}>
            {order.description}
          </div>
        </div>
      )}

      {order.photo_id && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--tg-theme-hint-color, #999999)' }}>
            📷 Фото заказ-наряда:
          </h4>
          <div style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📸</div>
            <div style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color, #999999)' }}>
              Фото загружено (ID: {order.photo_id.substring(0, 20)}...)
            </div>
          </div>
        </div>
      )}

      {onEdit && (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="button button-secondary" onClick={onClose} style={{ flex: 1 }}>
            ← Назад
          </button>
          <button className="button button-primary" onClick={onEdit} style={{ flex: 1 }}>
            ✏️ Изменить
          </button>
        </div>
      )}
    </div>
  );
};