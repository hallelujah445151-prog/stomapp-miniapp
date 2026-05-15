import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useToast } from '../components/common/Toast';
import { Header } from '../components/common/Header';

export const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const { doctors, technicians, workTypes, createOrder, loadDoctors, loadTechnicians, loadWorkTypes, isLoading, error } = useStore();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    doctor_id: 0,
    technician_id: 0,
    patient_name: '',
    work_type: '',
    quantity: 1,
    deadline: '',
    description: ''
  });

  const [step, setStep] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadDoctors(),
          loadTechnicians(),
          loadWorkTypes()
        ]);
        showToast('Данные загружены', 'success', 2000);
      } catch (err) {
        showToast('Ошибка загрузки данных', 'error');
      }
    };
    
    loadData();
    
    // Установка даты по умолчанию (завтра)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData(prev => ({
      ...prev,
      deadline: tomorrow.toISOString().split('T')[0]
    }));
  }, [loadDoctors, loadTechnicians, loadWorkTypes, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.doctor_id || !formData.technician_id || !formData.work_type) {
      showToast('Заполните все обязательные поля', 'warning');
      return;
    }

    try {
      await createOrder(formData);
      showToast('✅ Заказ успешно создан!', 'success');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      showToast('Ошибка при создании заказа', 'error');
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.work_type) {
      showToast('Выберите вид работы', 'warning', 2000);
      return;
    }
    if (step === 2 && (!formData.technician_id || !formData.deadline)) {
      showToast('Заполните обязательные поля', 'warning', 2000);
      return;
    }
    
    const button = document.activeElement as HTMLElement;
    button?.blur();
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  return (
    <div>
      <Header
        title="➕ Создать заказ"
        subtitle={`Шаг ${step} из 3`}
        actions={
          <button 
            className="button button-secondary" 
            onClick={handleBack}
            style={{ padding: '8px 12px', fontSize: '13px' }}
          >
            ✕
          </button>
        }
      />
      
      <div className="container">
        {error && (
          <div className="card" style={{ backgroundColor: '#ffebee', border: '2px solid #f44336', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>❌</span>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Ошибка</div>
                <div style={{ fontSize: '14px' }}>{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Прогресс */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Прогресс заполнения</span>
            <span style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999999)' }}>
              {step}/3
            </span>
          </div>
          <div style={{ height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${(step / 3) * 100}%`,
                backgroundColor: 'var(--primary-color, #2481cc)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        <div className="card fade-in">
          <form onSubmit={handleSubmit}>
            {/* Шаг 1: Выбор работы */}
            {step === 1 && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '32px', marginRight: '12px' }}>🔨</span>
                  <span style={{ fontSize: '20px', fontWeight: '600' }}>Что нужно сделать?</span>
                </div>

                <label className="label">Вид работы *</label>
                <select
                  className="select"
                  value={formData.work_type}
                  onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
                  required
                  style={{ fontSize: '16px', marginBottom: '20px' }}
                >
                  <option value="">👇 Выберите вид работы</option>
                  {workTypes.map((workType) => (
                    <option key={workType.id} value={workType.name}>
                      {workType.name}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999999)', marginBottom: '24px' }}>
                  💡 Выберите из списка или используйте быстрый выбор
                </div>

                {/* Быстрый выбор */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                    Быстрый выбор:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {workTypes.slice(0, 5).map((workType) => (
                      <button
                        key={workType.id}
                        type="button"
                        className="button"
                        style={{
                          backgroundColor: formData.work_type === workType.name ? 'var(--primary-color, #2481cc)' : 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                          color: formData.work_type === workType.name ? 'white' : 'var(--tg-theme-text-color, #000000)',
                          fontSize: '13px',
                          padding: '8px 14px',
                          borderRadius: '20px',
                          border: formData.work_type === workType.name ? '2px solid var(--primary-color, #2481cc)' : '2px solid #e0e0e0'
                        }}
                        onClick={() => {
                          setFormData({ ...formData, work_type: workType.name });
                          showToast(`Выбрано: ${workType.short_name}`, 'info', 1500);
                        }}
                      >
                        {workType.short_name}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button 
                    type="button" 
                    className="button button-secondary" 
                    onClick={nextStep} 
                    style={{ flex: 2, minHeight: '48px' }}
                  >
                    Далее →
                  </button>
                </div>
              </div>
            )}

            {/* Шаг 2: Исполнители */}
            {step === 2 && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '32px', marginRight: '12px' }}>👥</span>
                  <span style={{ fontSize: '20px', fontWeight: '600' }}>Кто выполняет?</span>
                </div>

                <label className="label">Врач *</label>
                <select
                  className="select"
                  value={formData.doctor_id}
                  onChange={(e) => {
                    setFormData({ ...formData, doctor_id: Number(e.target.value) });
                    const doctor = doctors.find(d => d.id === Number(e.target.value));
                    if (doctor) showToast(`Врач: ${doctor.name}`, 'info', 1500);
                  }}
                  required
                >
                  <option value="">👇 Выберите врача</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999999)', marginBottom: '20px' }}>
                  💡 Врач, который направил заказ
                </div>

                <label className="label">Техник *</label>
                <select
                  className="select"
                  value={formData.technician_id}
                  onChange={(e) => {
                    setFormData({ ...formData, technician_id: Number(e.target.value) });
                    const technician = technicians.find(t => t.id === Number(e.target.value));
                    if (technician) showToast(`Техник: ${technician.name}`, 'info', 1500);
                  }}
                  required
                >
                  <option value="">👇 Выберите техника</option>
                  {technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.name}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999999)', marginBottom: '20px' }}>
                  💡 Техник, который будет выполнять работу
                </div>

                <label className="label">Срок выполнения *</label>
                <input
                  type="date"
                  className="input"
                  value={formData.deadline}
                  onChange={(e) => {
                    setFormData({ ...formData, deadline: e.target.value });
                    showToast(`Срок: ${e.target.value}`, 'info', 1500);
                  }}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
                <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999999)', marginBottom: '24px' }}>
                  💡 Выберите дату, когда заказ должен быть готов
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="button" className="button button-secondary" onClick={handleBack} style={{ flex: 1, minHeight: '48px' }}>
                    ← Назад
                  </button>
                  <button 
                    type="button" 
                    className="button button-primary" 
                    onClick={nextStep} 
                    style={{ flex: 2, minHeight: '48px' }}
                    disabled={!formData.technician_id || !formData.deadline}
                  >
                    Далее →
                  </button>
                </div>
              </div>
            )}

            {/* Шаг 3: Детали */}
            {step === 3 && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '32px', marginRight: '12px' }}>📝</span>
                  <span style={{ fontSize: '20px', fontWeight: '600' }}>Детали заказа</span>
                </div>

                <label className="label">Имя пациента</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Имя пациента (необязательно)"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                />
                <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999999)', marginBottom: '20px' }}>
                  💡 Оставьте пустым, если пациент не указан
                </div>

                <label className="label">Количество *</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  max="50"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, Number(e.target.value)) })}
                  required
                />
                <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999999)', marginBottom: '20px' }}>
                  💡 Укажите количество единиц (от 1 до 50)
                </div>

                <label className="label">Описание</label>
                <textarea
                  className="textarea"
                  placeholder="Дополнительная информация о заказе..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
                <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999999)', marginBottom: '24px' }}>
                  💡 Опишите особенности заказа, пожелания или важные детали
                </div>

                {/* Предпросмотр */}
                <div style={{ 
                  backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)', 
                  padding: '16px', 
                  borderRadius: '8px',
                  marginBottom: '24px',
                  border: '1px dashed #ccc'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: 'var(--tg-theme-hint-color, #999999)' }}>
                    👁️ Проверка заказа:
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    <div><strong>Вид работы:</strong> {formData.work_type || 'не выбрано'}</div>
                    <div><strong>Количество:</strong> {formData.quantity} шт.</div>
                    <div><strong>Врач:</strong> {doctors.find(d => d.id === formData.doctor_id)?.name || 'не выбран'}</div>
                    <div><strong>Техник:</strong> {technicians.find(t => t.id === formData.technician_id)?.name || 'не выбран'}</div>
                    <div><strong>Срок:</strong> {formData.deadline || 'не указан'}</div>
                    {formData.patient_name && <div><strong>Пациент:</strong> {formData.patient_name}</div>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="button" className="button button-secondary" onClick={handleBack} style={{ flex: 1, minHeight: '48px' }}>
                    ← Назад
                  </button>
                  <button 
                    type="submit" 
                    className="button button-success" 
                    disabled={isLoading || !formData.quantity} 
                    style={{ flex: 2, minHeight: '48px' }}
                  >
                    {isLoading ? '💾 Создание...' : '✅ Создать заказ'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};