import React, { useState } from 'react';
import { Order } from '../../types';
import { useStore } from '../../store';
import { Loader, ErrorState } from '../common/Loader';

interface EditOrderFormProps {
  order: Order;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EditOrderForm: React.FC<EditOrderFormProps> = ({ order, onSuccess, onCancel }) => {
  const { updateOrder, isLoading, error } = useStore();
  
  const [formData, setFormData] = useState<Partial<Order>>({
    status: order.status,
    description: order.description,
    patient_name: order.patient_name || '',
    quantity: order.quantity,
    deadline: order.deadline
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.status) {
      alert('Пожалуйста, выберите статус заказа');
      return;
    }

    try {
      await updateOrder(order.id, {
        status: formData.status,
        description: formData.description
      });
      onSuccess?.();
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  if (isLoading) {
    return <Loader text="Сохранение изменений..." />;
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '24px', marginRight: '12px' }}>✏️</span>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
            Редактирование заказа #{order.id}
          </h2>
          <div style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color, #999999)' }}>
            {order.work_type}
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} />}
      
      <form onSubmit={handleSubmit}>
        <label className="label">Статус заказа *</label>
        <select
          className="select"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          required
        >
          <option value="in_progress">🔵 В работе</option>
          <option value="completed">✅ Выполнен</option>
          <option value="cancelled">❌ Отменен</option>
        </select>
        <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999999)', marginBottom: '12px' }}>
          💡 Выберите текущий статус выполнения заказа
        </div>

        <label className="label">Описание</label>
        <textarea
          className="textarea"
          placeholder="Дополнительная информация о заказе..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />
        <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999999)', marginBottom: '12px' }}>
          💡 Опишите детали выполнения или особенности заказа
        </div>

        <div style={{ 
          backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)', 
          padding: '12px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999999)', marginBottom: '8px' }}>
            ℹ️ Информация (только для чтения):
          </div>
          <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
            <div><strong>Вид работы:</strong> {order.work_type}</div>
            <div><strong>Количество:</strong> {order.quantity} шт.</div>
            <div><strong>Срок:</strong> {order.deadline}</div>
            {order.patient_name && <div><strong>Пациент:</strong> {order.patient_name}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" className="button button-secondary" onClick={onCancel} style={{ flex: 1 }}>
            ← Отмена
          </button>
          <button type="submit" className="button button-success" disabled={isLoading} style={{ flex: 1 }}>
            {isLoading ? '💾 Сохранение...' : '💾 Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};