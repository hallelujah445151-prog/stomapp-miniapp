import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { OrderCreate } from '../../types';
import { Loader, ErrorState } from '../common/Loader';

interface CreateOrderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ onSuccess, onCancel }) => {
  const { doctors, technicians, workTypes, createOrder, isLoading, error } = useStore();
  
  const [formData, setFormData] = useState<OrderCreate>({
    doctor_id: 0,
    technician_id: 0,
    patient_name: '',
    work_type: '',
    quantity: 1,
    deadline: '',
    description: ''
  });

  useEffect(() => {
    // Установка даты по умолчанию (завтра)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData(prev => ({
      ...prev,
      deadline: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.doctor_id || !formData.technician_id || !formData.work_type) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      await createOrder(formData);
      onSuccess?.();
    } catch (err) {
      console.error('Error creating order:', err);
    }
  };

  if (isLoading) {
    return <Loader text="Создание заказа..." />;
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: '20px' }}>Создание нового заказа</h2>
      
      {error && <ErrorState message={error} />}
      
      <form onSubmit={handleSubmit}>
        <label className="label">Врач *</label>
        <select
          className="select"
          value={formData.doctor_id}
          onChange={(e) => setFormData({ ...formData, doctor_id: Number(e.target.value) })}
          required
        >
          <option value="">Выберите врача</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name}
            </option>
          ))}
        </select>

        <label className="label">Техник *</label>
        <select
          className="select"
          value={formData.technician_id}
          onChange={(e) => setFormData({ ...formData, technician_id: Number(e.target.value) })}
          required
        >
          <option value="">Выберите техника</option>
          {technicians.map((technician) => (
            <option key={technician.id} value={technician.id}>
              {technician.name}
            </option>
          ))}
        </select>

        <label className="label">Имя пациента</label>
        <input
          type="text"
          className="input"
          placeholder="Имя пациента"
          value={formData.patient_name}
          onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
        />

        <label className="label">Вид работы *</label>
        <select
          className="select"
          value={formData.work_type}
          onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
          required
        >
          <option value="">Выберите вид работы</option>
          {workTypes.map((workType) => (
            <option key={workType.id} value={workType.name}>
              {workType.name}
            </option>
          ))}
        </select>

        <label className="label">Количество *</label>
        <input
          type="number"
          className="input"
          min="1"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
          required
        />

        <label className="label">Срок выполнения *</label>
        <input
          type="date"
          className="input"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          required
        />

        <label className="label">Описание</label>
        <textarea
          className="textarea"
          placeholder="Дополнительная информация"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button type="button" className="button button-secondary" onClick={onCancel}>
            Отмена
          </button>
          <button type="submit" className="button button-primary" disabled={isLoading}>
            Создать заказ
          </button>
        </div>
      </form>
    </div>
  );
};