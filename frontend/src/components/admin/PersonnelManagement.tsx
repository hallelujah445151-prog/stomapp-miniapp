import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Personnel, PersonnelDetail } from '../../types';
import { useToast } from '../common/Toast';
import { Header } from '../common/Header';
import { Loader, EmptyState } from '../common/Loader';

type Role = 'admin' | 'doctor' | 'technician' | 'dispatcher';

interface PersonnelManagementProps {
  role?: Role;
}

export const PersonnelManagement: React.FC<PersonnelManagementProps> = ({ role }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState<PersonnelDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadPersonnel();
  }, [role]);

  const loadPersonnel = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getPersonnel(role);
      setPersonnel(data);
      setIsLoading(false);
    } catch (error) {
      showToast('Ошибка загрузки персонала', 'error');
      setIsLoading(false);
    }
  };

  const loadPersonnelDetail = async (personnelId: number) => {
    try {
      const detail = await apiService.getPersonnelDetail(personnelId);
      setSelectedPersonnel(detail);
      setShowEditModal(true);
    } catch (error) {
      showToast('Ошибка загрузки деталей', 'error');
    }
  };

  const getRoleIcon = (role: string): string => {
    switch (role) {
      case 'admin': return '👑';
      case 'doctor': return '👨‍⚕️';
      case 'technician': return '🔧';
      case 'dispatcher': return '📋';
      default: return '👤';
    }
  };

  const getRoleText = (role: string): string => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'doctor': return 'Врач';
      case 'technician': return 'Техник';
      case 'dispatcher': return 'Диспетчер';
      default: return role;
    }
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'admin': return '#f44336';
      case 'doctor': return '#2196f3';
      case 'technician': return '#ff9800';
      case 'dispatcher': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  if (isLoading) {
    return <Loader text="Загрузка персонала..." />;
  }

  return (
    <>
      <Header
        title={role ? `${getRoleText(role)}ы` : 'Персонал'}
        subtitle={`Всего: ${personnel.length}`}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="button button-secondary" onClick={() => navigate('/')} style={{ padding: '8px 12px', fontSize: '14px' }}>← Назад</button>
            {!role && (
              <button className="button button-primary" onClick={() => setShowCreateModal(true)} style={{ padding: '8px 16px', fontSize: '14px' }}>➕ Добавить</button>
            )}
          </div>
        }
      />

      <div className="container">
        {personnel.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Персонал не найден"
            description={
              role
                ? `Нет сотрудников с ролью "${getRoleText(role)}"`
                : 'Добавьте первого сотрудника в систему'
            }
            action={
              !role && (
                <button className="button button-primary" onClick={() => setShowCreateModal(true)}>
                  ➕ Добавить сотрудника
                </button>
              )
            }
          />
        ) : (
          personnel.map((person) => (
            <div
              key={person.id}
              className="card clickable"
              onClick={() => loadPersonnelDetail(person.id)}
              style={{
                border: person.is_active ? '1px solid #e0e0e0' : '2px dashed #bdbdbd',
                opacity: person.is_active ? 1 : 0.6
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '28px' }}>{getRoleIcon(person.role)}</span>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>
                        {person.name}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999999)' }}>
                        Telegram ID: {person.telegram_id}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: getRoleColor(person.role),
                        color: 'white'
                      }}
                    >
                      {getRoleText(person.role)}
                    </span>

                    {person.is_admin && (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: '#f44336',
                          color: 'white'
                        }}
                      >
                        Админ
                      </span>
                    )}

                    {!person.is_active && (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: '#9e9e9e',
                          color: 'white'
                        }}
                      >
                        Неактивен
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999999)', marginTop: '8px' }}>
                    Создан: {new Date(person.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>

                <button
                  className="button button-secondary"
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                  onClick={(e) => { e.stopPropagation(); loadPersonnelDetail(person.id); }}
                >✏️</button>
                {!person.is_active && (
                  <button
                    className="button button-success"
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try { await apiService.approvePersonnel(person.id); loadPersonnel(); showToast('Пользователь одобрен', 'success'); }
                      catch { showToast('Ошибка', 'error'); }
                    }}
                  >✅</button>
                )}
                <button
                  className="button button-danger"
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm(`Удалить сотрудника «${person.name}»? Заказы останутся.`)) return;
                    try { await apiService.deletePersonnel(person.id); loadPersonnel(); showToast('Сотрудник удалён', 'success'); }
                    catch { showToast('Ошибка удаления', 'error'); }
                  }}
                >🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно создания сотрудника */}
      {showCreateModal && (
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
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              ➕ Новый сотрудник
            </h3>

            <CreatePersonnelForm
              onSuccess={() => {
                setShowCreateModal(false);
                loadPersonnel();
                showToast('Сотрудник создан', 'success');
              }}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}

      {/* Модальное окно редактирования сотрудника */}
      {showEditModal && selectedPersonnel && (
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
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              ✏️ Редактирование сотрудника
            </h3>

            <EditPersonnelForm
              personnel={selectedPersonnel}
              onSuccess={() => {
                setShowEditModal(false);
                setSelectedPersonnel(null);
                loadPersonnel();
                showToast('Данные обновлены', 'success');
              }}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedPersonnel(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

// Компонент формы создания сотрудника
const CreatePersonnelForm: React.FC<{ onSuccess: () => void; onCancel: () => void }> = ({ onSuccess, onCancel }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    telegram_id: '',
    name: '',
    role: 'technician' as Role,
    is_admin: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.telegram_id || !formData.name) {
      showToast('Заполните все обязательные поля', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      await apiService.createPersonnel({
        telegram_id: Number(formData.telegram_id),
        name: formData.name,
        role: formData.role,
        is_admin: formData.is_admin
      });
      onSuccess();
    } catch (error) {
      showToast('Ошибка создания сотрудника', 'error');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label className="label">Telegram ID *</label>
      <input
        type="number"
        className="input"
        placeholder="Введите Telegram ID"
        value={formData.telegram_id}
        onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
        required
      />

      <label className="label">Имя сотрудника *</label>
      <input
        type="text"
        className="input"
        placeholder="ФИО сотрудника"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <label className="label">Роль *</label>
      <select
        className="select"
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
        required
      >
        <option value="technician">🔧 Техник</option>
        <option value="doctor">👨‍⚕️ Врач</option>
      </select>

      <label className="label">Права администратора</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <input
          type="checkbox"
          checked={formData.is_admin}
          onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
          style={{ width: '20px', height: '20px' }}
        />
        <span style={{ fontSize: '14px' }}>Дать права администратора</span>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" className="button button-secondary" onClick={onCancel} style={{ flex: 1 }}>
          Отмена
        </button>
        <button type="submit" className="button button-primary" disabled={isLoading} style={{ flex: 1 }}>
          {isLoading ? 'Создание...' : 'Создать'}
        </button>
      </div>
    </form>
  );
};

// Компонент формы редактирования сотрудника
const EditPersonnelForm: React.FC<{ personnel: PersonnelDetail; onSuccess: () => void; onCancel: () => void }> = ({ personnel, onSuccess, onCancel }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: personnel.name,
    role: personnel.role,
    is_admin: personnel.is_admin,
    is_active: personnel.is_active
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      await apiService.updatePersonnel(personnel.id, formData);
      onSuccess();
    } catch (error) {
      showToast('Ошибка обновления данных', 'error');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Статистика */}
      <div style={{
        backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999999)', marginBottom: '8px' }}>
          📊 Статистика:
        </div>
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <div>Всего заказов: {personnel.stats.total_orders}</div>
          <div>В работе: {personnel.stats.in_progress_orders}</div>
          <div>Выполнено: {personnel.stats.completed_orders}</div>
        </div>
      </div>

      <label className="label">Имя сотрудника</label>
      <input
        type="text"
        className="input"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />

      <label className="label">Роль</label>
      <select
        className="select"
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
      >
        <option value="technician">🔧 Техник</option>
        <option value="doctor">👨‍⚕️ Врач</option>
      </select>

      <label className="label">Статус</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          style={{ width: '20px', height: '20px' }}
        />
        <span style={{ fontSize: '14px' }}>Активный сотрудник</span>
      </div>

      <label className="label">Права администратора</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <input
          type="checkbox"
          checked={formData.is_admin}
          onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
          style={{ width: '20px', height: '20px' }}
        />
        <span style={{ fontSize: '14px' }}>Дать права администратора</span>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" className="button button-secondary" onClick={onCancel} style={{ flex: 1 }}>
          Отмена
        </button>
        <button type="submit" className="button button-primary" disabled={isLoading} style={{ flex: 1 }}>
          {isLoading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
};