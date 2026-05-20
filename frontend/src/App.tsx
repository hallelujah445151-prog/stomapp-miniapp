import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuthStore } from './store/auth';
import { apiService } from './services/api';
import { PersonnelPage } from './pages/PersonnelPage';
import { ToastProvider } from './components/common/Toast';

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

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({ telegram_id: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { if (isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.telegram_id && !formData.name) {
      setErrorMsg('Введите Telegram ID или ФИО');
      return;
    }
    if (formData.telegram_id && (isNaN(Number(formData.telegram_id)) || Number(formData.telegram_id) < 1)) {
      setErrorMsg('Telegram ID должен быть числом');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await apiService.loginByTelegramId(Number(formData.telegram_id) || undefined as any, formData.name || undefined);
      login({ id: result.user.id, name: result.user.name, telegram_id: String(result.user.telegram_id), role: result.user.role, is_admin: result.user.is_admin });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Ошибка входа');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8F9FA', padding: '20px' }}>
      <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: 'var(--shadow-2)', maxWidth: '400px', width: '100%' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '20px', fontWeight: 500, color: '#202124' }}>StomApp</h1>
        <p style={{ textAlign: 'center', marginBottom: '24px', fontSize: '13px', color: '#5F6368' }}>Войдите по Telegram ID или ФИО</p>
        {errorMsg && <div style={{ background: '#FCE8E6', color: '#C5221F', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{errorMsg}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label className="label">Telegram ID</label>
            <input type="text" className="input" value={formData.telegram_id} onChange={e => setFormData({ ...formData, telegram_id: e.target.value })} placeholder="5563461010" />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label className="label">ФИО</label>
            <input type="text" className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Плюхин Матвей Александрович" />
          </div>
          <button type="submit" disabled={loading} className="button button-primary" style={{ width: '100%', padding: '12px' }}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#80868B' }}>Достаточно заполнить одно из полей</p>
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [reportType, setReportType] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [periodType, setPeriodType] = useState('all');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [expandedDoc, setExpandedDoc] = useState<number|null>(null);
  const [expandedTech, setExpandedTech] = useState<number|null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState(0);
  const [technicianFilter, setTechnicianFilter] = useState(0);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);

  const loadOrdersFromApi = () => {
    apiService.getOrders().then(data => setOrders(data)).catch(()=>{
      if (orders.length === 0) setOrders([{id:1,patient_name:'Нет связи с сервером',work_type:'Проверьте подключение',quantity:0,deadline:'—',created_at:'—',status:'in_progress'}]);
    });
  };

  useEffect(() => { loadOrdersFromApi(); setOrdersLoading(false); }, []);
  useEffect(() => { const i = setInterval(loadOrdersFromApi, 30000); return () => clearInterval(i); }, []);
  useEffect(() => { apiService.getDoctors().then(setDoctors).catch(()=>{}); apiService.getTechnicians().then(setTechnicians).catch(()=>{}); }, []);

  const loadReport = async (type: string) => {
    setReportType(type);
    try {
      if (type === 'doctors') setReportData(await apiService.getReportsByDoctor());
      else if (type === 'technicians') setReportData(await apiService.getReportsByTechnician());
      else if (type === 'urgent') {
        const today = new Date().toISOString().split('T')[0];
        const upcoming = orders.filter((o: any) => o.status === 'in_progress' && o.deadline >= today && o.deadline <= new Date(Date.now()+2*864e5).toISOString().split('T')[0]);
        setReportData(upcoming.length ? upcoming : null);
        if (!upcoming.length) alert('Нет срочных заказов');
      }
      else if (type === 'overdue') {
        apiService.getOverdueOrders().then(data => { setReportData(data.length ? data : null); if (!data.length) alert('Нет просроченных заказов'); }).catch(()=>{});
      }
      else if (type === 'workload') {
        apiService.getWorkload().then(data => setReportData(data)).catch(()=>{});
      }
      else if (type === 'work_types') {
        apiService.getByWorkType().then(data => setReportData(data)).catch(()=>{});
      }
    } catch(e: any) { alert('Ошибка загрузки: ' + (e?.response?.data?.detail || e.message)); }
  };

  const loadPeriodReport = async () => {
    try {
      const data = await apiService.getPeriodReport(periodType, periodStart, periodEnd);
      setReportType('period_result');
      setReportData(data);
    } catch(e: any) { alert('Ошибка: ' + (e?.response?.data?.detail || e.message)); }
  };

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

  const filteredOrders = (filter === 'all' ? orders : orders.filter(o => o.status === filter))
    .filter(o => !searchQuery || o.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) || o.work_type.toLowerCase().includes(searchQuery.toLowerCase()) || String(o.id).includes(searchQuery))
    .filter(o => !doctorFilter || o.doctor_id === doctorFilter)
    .filter(o => !technicianFilter || o.technician_id === technicianFilter);

  return (
    <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px', padding: '16px',
        background: '#fff', borderRadius: '12px',
        boxShadow: 'var(--shadow-1)', border: '1px solid var(--border-light)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 500, color: '#202124' }}>📋 Заказы</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5F6368' }}>
            Привет, {user?.name}! {user?.is_admin ? '👑 ' : ''}{user?.role === 'doctor' ? '👨‍⚕️ Врач' : user?.role === 'technician' ? '🔧 Техник' : '👤 Администратор'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(user?.is_admin || user?.role === 'admin') && (
            <button onClick={e => { e.preventDefault(); handleCreateOrder(); }}
              style={{ padding: '8px 18px', background: '#1A73E8', color: '#fff', border: 'none', borderRadius: '24px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>➕ Новый</button>
          )}
          {user?.is_admin && (
            <button onClick={e => { e.preventDefault(); navigate('/personnel'); }}
              style={{ padding: '8px 18px', background: '#fff', color: '#1A73E8', border: '1px solid #DADCE0', borderRadius: '24px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>👥 Персонал</button>
          )}
          <button onClick={(e) => { e.preventDefault(); const tg=(window as any).Telegram?.WebApp; if(tg){tg.close()}else{localStorage.removeItem('stomapp_user');window.location.href='/login'} }}
            style={{ padding: '8px 18px', background: '#fff', color: '#5F6368', border: '1px solid #DADCE0', borderRadius: '24px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>✕</button>
        </div>
      </div>

      {/* Admin: сводка */}
      {user?.is_admin && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ padding: '12px 16px', background: '#E8F0FE', borderRadius: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: '#202124', border: '1px solid #D2E3FC' }}>
            <span>📋 <b>{orders.length}</b></span>
            <span>🔵 <b>{orders.filter(o=>o.status==='in_progress').length}</b></span>
            <span>✅ <b>{orders.filter(o=>o.status==='completed').length}</b></span>
            <span>🔥 <b>{orders.filter(o=>o.status==='in_progress'&&o.deadline<=new Date(Date.now()+2*864e5).toISOString().split('T')[0]).length}</b></span>
          </div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => loadReport('urgent')} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, border: '1px solid #DADCE0', borderRadius: '24px', cursor: 'pointer', background: reportType==='urgent'?'#FCE8E6':'#fff', color: reportType==='urgent'?'#C5221F':'#5F6368' }}>🔥 Срочные</button>
            <button onClick={() => loadReport('overdue')} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, border: '1px solid #DADCE0', borderRadius: '24px', cursor: 'pointer', background: reportType==='overdue'?'#FCE8E6':'#fff', color: reportType==='overdue'?'#C5221F':'#5F6368' }}>⚠️ Просрочено</button>
            <button onClick={() => { setReportType(reportType==='reports'?'':'reports'); setReportData(null); }} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, border: '1px solid #DADCE0', borderRadius: '24px', cursor: 'pointer', background: (reportType==='reports'||reportType==='doctors'||reportType==='technicians'||reportType==='workload'||reportType==='work_types'||reportType==='period_type'||reportType==='period_dates'||reportType==='period_result')?'#1A73E8':'#fff', color: (reportType==='reports'||reportType==='doctors'||reportType==='technicians'||reportType==='workload'||reportType==='work_types'||reportType==='period_type'||reportType==='period_dates'||reportType==='period_result')?'#fff':'#5F6368' }}>📊 Отчеты</button>
          </div>
          {reportType === 'reports' && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              <button onClick={() => loadReport('doctors')} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, border: '1px solid #DADCE0', borderRadius: '24px', cursor: 'pointer', background: reportType==='doctors'?'#E8F0FE':'#fff', color: reportType==='doctors'?'#1A73E8':'#5F6368' }}>👨‍⚕️ По врачам</button>
              <button onClick={() => loadReport('technicians')} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, border: '1px solid #DADCE0', borderRadius: '24px', cursor: 'pointer', background: reportType==='technicians'?'#E8F0FE':'#fff', color: reportType==='technicians'?'#1A73E8':'#5F6368' }}>🔧 По техникам</button>
              <button onClick={() => loadReport('work_types')} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, border: '1px solid #DADCE0', borderRadius: '24px', cursor: 'pointer', background: reportType==='work_types'?'#E8F0FE':'#fff', color: reportType==='work_types'?'#1A73E8':'#5F6368' }}>📋 По видам работ</button>
              <button onClick={() => { setReportType('period_type'); setReportData(null); }} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, border: '1px solid #DADCE0', borderRadius: '24px', cursor: 'pointer', background: (reportType==='period_type'||reportType==='period_dates'||reportType==='period_result')?'#E8F0FE':'#fff', color: (reportType==='period_type'||reportType==='period_dates'||reportType==='period_result')?'#1A73E8':'#5F6368' }}>📅 За период</button>
            </div>
          )}
          {reportType === 'period_type' && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {[['all','📊 Общий'],['doctors','👨‍⚕️ По врачам'],['technicians','🔧 По техникам'],['work_types','📋 По видам работ']].map(([k,v]) => (
                <button key={k} onClick={() => { setReportType('period_dates'); setPeriodType(k); }} style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#e3f2fd', color: '#1565c0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{v}</button>
              ))}
            </div>
          )}
          {reportType === 'period_dates' && (
            <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                {periodType==='all'?'📊 Общий отчёт':periodType==='doctors'?'👨‍⚕️ По врачам':periodType==='technicians'?'🔧 По техникам':'📋 По видам работ'}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px' }}>с</span>
                <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }} />
                <span style={{ fontSize: '12px' }}>по</span>
                <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }} />
                <button onClick={() => { if(periodStart&&periodEnd) loadPeriodReport(); else alert('Выберите даты'); }}
                  style={{ padding: '6px 14px', backgroundColor: '#1565c0', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>Показать</button>
                <button onClick={() => setReportType('period_type')}
                  style={{ padding: '6px 10px', backgroundColor: '#fff', color: '#888', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>← Назад</button>
              </div>
            </div>
          )}
          {reportData && (
            <div style={{ marginTop: '10px', padding: '16px', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,.08)', border: '1px solid #E8EAED' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                <b style={{ fontSize: '14px', fontWeight: 500, color: '#202124' }}>
                  {reportType === 'doctors' ? '👨‍⚕️ Статистика по врачам' : reportType === 'technicians' ? '🔧 Статистика по техникам' : reportType === 'work_types' ? '📋 Статистика по видам работ' : '🔥 Срочные заказы'}
                </b>
                <button onClick={() => { setReportData(null); setReportType(''); }} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#5F6368' }}>✕</button>
              </div>
              {reportType === 'doctors' && (
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '2px solid #DADCE0', textAlign: 'left', color: '#5F6368' }}><th style={{ padding: '6px', fontWeight: 500 }}>Врач</th><th style={{ padding: '6px', fontWeight: 500 }}>Всего</th><th style={{ padding: '6px', fontWeight: 500 }}>В работе</th><th style={{ padding: '6px', fontWeight: 500 }}>Готово</th></tr></thead>
                  <tbody>{reportData.map((r: any) => (
                    <React.Fragment key={r.id}>
                      <tr onClick={() => setExpandedDoc(expandedDoc===r.id?null:r.id)} style={{ borderBottom: '1px solid #E8EAED', cursor: 'pointer', background: expandedDoc===r.id?'#F8F9FA':'#fff' }}>
                        <td style={{ padding: '6px' }}>{r.name}</td>
                        <td style={{ padding: '6px', fontWeight: 500 }}>{r.total}</td>
                        <td style={{ padding: '6px', color: '#1A73E8' }}>{r.active}</td>
                        <td style={{ padding: '6px', color: '#34A853' }}>{r.done}</td>
                      </tr>
                      {expandedDoc===r.id && r.orders && (
                        <tr><td colSpan={4} style={{ padding: '6px 16px', background: '#F8F9FA', fontSize: '11px' }}>
                          {r.orders.map((o:any) => (
                            <div key={o.id} onClick={() => navigate(`/order/${o.id}`)} style={{ padding: '4px 0', borderBottom: '1px solid #E8EAED', cursor: 'pointer', color: o.status==='completed'?'#34A853':'#5F6368' }}>
                              #{o.id} {o.work_type} — {o.patient_name||'—'} | {o.deadline} | {o.status==='completed'?'✅':'🔵'}
                            </div>
                          ))}
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}</tbody>
                </table>
              )}
              {reportType === 'technicians' && (
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '2px solid #DADCE0', textAlign: 'left', color: '#5F6368' }}><th style={{ padding: '6px', fontWeight: 500 }}>Техник</th><th style={{ padding: '6px', fontWeight: 500 }}>Всего</th><th style={{ padding: '6px', fontWeight: 500 }}>В работе</th><th style={{ padding: '6px', fontWeight: 500 }}>Готово</th></tr></thead>
                  <tbody>{reportData.map((r: any) => (
                    <React.Fragment key={r.id}>
                      <tr onClick={() => setExpandedTech(expandedTech===r.id?null:r.id)} style={{ borderBottom: '1px solid #E8EAED', cursor: 'pointer', background: expandedTech===r.id?'#F8F9FA':'#fff' }}>
                        <td style={{ padding: '6px' }}>{r.name}</td>
                        <td style={{ padding: '6px', fontWeight: 500 }}>{r.total}</td>
                        <td style={{ padding: '6px', color: '#1A73E8' }}>{r.active}</td>
                        <td style={{ padding: '6px', color: '#34A853' }}>{r.done}</td>
                      </tr>
                      {expandedTech===r.id && r.orders && (
                        <tr><td colSpan={4} style={{ padding: '6px 16px', background: '#F8F9FA', fontSize: '11px' }}>
                          {r.orders.map((o:any) => (
                            <div key={o.id} onClick={() => navigate(`/order/${o.id}`)} style={{ padding: '4px 0', borderBottom: '1px solid #E8EAED', cursor: 'pointer', color: o.status==='completed'?'#34A853':'#5F6368' }}>
                              #{o.id} {o.work_type} — {o.patient_name||'—'} | {o.deadline} | {o.status==='completed'?'✅':'🔵'}
                            </div>
                          ))}
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}</tbody>
                </table>
              )}
              {reportType === 'urgent' && reportData.map((o: any) => (
                <div key={o.id} onClick={() => navigate(`/order/${o.id}`)} style={{ padding: '10px', marginBottom: '6px', backgroundColor: '#fff3e0', borderRadius: '6px', border: '1px solid #ffcc80', cursor: 'pointer', fontSize: '13px' }}>
                  <b>#{o.id}</b> {o.work_type} — пациент: {o.patient_name||'—'} | ⏰ {o.deadline}
                </div>
              ))}
              {reportType === 'overdue' && reportData && reportData.map((o: any) => (
                <div key={o.id} onClick={() => navigate(`/order/${o.id}`)} style={{ padding: '10px', marginBottom: '6px', backgroundColor: '#ffebee', borderRadius: '6px', border: '1px solid #ef9a9a', cursor: 'pointer', fontSize: '13px' }}>
                  <b>#{o.id}</b> {o.work_type} — {o.technician_name||'—'} | ⚠️ {o.deadline} | {o.patient_name||'—'}
                </div>
              ))}
              {reportType === 'workload' && (
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}><th style={{ padding: '6px' }}>Техник</th><th style={{ padding: '6px' }}>Активных</th><th style={{ padding: '6px' }}>Ближ. дедлайн</th></tr></thead>
                  <tbody>{reportData.map((r: any) => <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}><td style={{ padding: '6px' }}>{r.name}</td><td style={{ padding: '6px', color: r.active>3?'#c62828':'#1976d2', fontWeight:600 }}>{r.active}</td><td style={{ padding: '6px' }}>{r.next_deadline||'—'}</td></tr>)}</tbody>
                </table>
              )}
              {reportType === 'work_types' && (
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}><th style={{ padding: '6px' }}>Вид работы</th><th style={{ padding: '6px' }}>Всего</th><th style={{ padding: '6px' }}>В работе</th><th style={{ padding: '6px' }}>Готово</th></tr></thead>
                  <tbody>{reportData.map((r: any) => <tr key={r.name} style={{ borderBottom: '1px solid #f0f0f0' }}><td style={{ padding: '6px' }}>{r.name}</td><td style={{ padding: '6px' }}>{r.total}</td><td style={{ padding: '6px', color: '#1976d2' }}>{r.active}</td><td style={{ padding: '6px', color: '#388e3c' }}>{r.done}</td></tr>)}</tbody>
                </table>
              )}
              {reportType === 'period_result' && reportData && (
                <div>
                  <div style={{fontSize:'12px',color:'#888',marginBottom:'10px'}}>📅 {reportData.period.start} — {reportData.period.end}</div>
                  {reportData.doctors && (
                    <details open style={{marginBottom:'12px'}}><summary style={{fontSize:'13px',fontWeight:600,cursor:'pointer',marginBottom:'6px'}}>👨‍⚕️ По врачам</summary>
                      <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}><th style={{ padding: '4px' }}>Врач</th><th style={{ padding: '4px' }}>Всего</th><th style={{ padding: '4px' }}>В работе</th><th style={{ padding: '4px' }}>Готово</th></tr></thead>
                        <tbody>{reportData.doctors.map((r:any)=><tr key={r.id} style={{borderBottom:'1px solid #f0f0f0'}}><td style={{padding:'4px'}}>{r.name}</td><td style={{padding:'4px'}}>{r.total}</td><td style={{padding:'4px',color:'#1976d2'}}>{r.active}</td><td style={{padding:'4px',color:'#388e3c'}}>{r.done}</td></tr>)}</tbody>
                      </table>
                    </details>
                  )}
                  {reportData.technicians && (
                    <details open style={{marginBottom:'12px'}}><summary style={{fontSize:'13px',fontWeight:600,cursor:'pointer',marginBottom:'6px'}}>🔧 По техникам</summary>
                      <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}><th style={{ padding: '4px' }}>Техник</th><th style={{ padding: '4px' }}>Всего</th><th style={{ padding: '4px' }}>В работе</th><th style={{ padding: '4px' }}>Готово</th></tr></thead>
                        <tbody>{reportData.technicians.map((r:any)=><tr key={r.id} style={{borderBottom:'1px solid #f0f0f0'}}><td style={{padding:'4px'}}>{r.name}</td><td style={{padding:'4px'}}>{r.total}</td><td style={{padding:'4px',color:'#1976d2'}}>{r.active}</td><td style={{padding:'4px',color:'#388e3c'}}>{r.done}</td></tr>)}</tbody>
                      </table>
                    </details>
                  )}
                  {reportData.work_types && (
                    <details open style={{marginBottom:'12px'}}><summary style={{fontSize:'13px',fontWeight:600,cursor:'pointer',marginBottom:'6px'}}>📋 По видам работ</summary>
                      <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}><th style={{ padding: '4px' }}>Вид</th><th style={{ padding: '4px' }}>Всего</th><th style={{ padding: '4px' }}>В работе</th><th style={{ padding: '4px' }}>Готово</th></tr></thead>
                        <tbody>{reportData.work_types.map((r:any)=><tr key={r.name} style={{borderBottom:'1px solid #f0f0f0'}}><td style={{padding:'4px'}}>{r.name}</td><td style={{padding:'4px'}}>{r.total}</td><td style={{padding:'4px',color:'#1976d2'}}>{r.active}</td><td style={{padding:'4px',color:'#388e3c'}}>{r.done}</td></tr>)}</tbody>
                      </table>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Поиск */}
      <div style={{ marginBottom: '12px' }}>
        <input type="text" placeholder="🔍 Поиск по пациенту, виду работ, номеру..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', border: '1px solid #DADCE0', borderRadius: '12px', fontSize: '14px', background: '#fff', outline: 'none' }} />
      </div>

      {/* Фильтр по врачу/технику (админ) */}
      {user?.is_admin && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <select value={doctorFilter} onChange={e => setDoctorFilter(Number(e.target.value))} style={{ flex: 1, padding: '8px 12px', border: '1px solid #DADCE0', borderRadius: '8px', fontSize: '13px', background: '#fff' }}>
            <option value={0}>👨‍⚕️ Все врачи</option>
            {doctors.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={technicianFilter} onChange={e => setTechnicianFilter(Number(e.target.value))} style={{ flex: 1, padding: '8px 12px', border: '1px solid #DADCE0', borderRadius: '8px', fontSize: '13px', background: '#fff' }}>
            <option value={0}>🔧 Все техники</option>
            {technicians.map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}

      {/* Filters — Material segmented control */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '16px', background: '#F1F3F4', borderRadius: '12px', padding: '3px' }}>
        {[['all','Все'],['in_progress','В работе'],['completed','Готово']].map(([k,v]) => (
          <button key={k} onClick={() => setFilter(k as any)}
            style={{ flex: 1, padding: '7px 0', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: filter===k?500:400,
              background: filter===k?'#fff':'transparent', color: filter===k?'#1A73E8':'#5F6368',
              boxShadow: filter===k?'0 1px 2px rgba(0,0,0,.08)':'none', cursor: 'pointer', transition: 'all .15s' }}>
            {v} <span style={{fontSize:11,marginLeft:2,opacity:.7}}>{orders.filter(o=>k==='all'?true:o.status===k).length}</span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      {/* Скелетон-загрузка */}
      {ordersLoading ? (
        <div style={{ display: 'grid', gap: '10px' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '16px', borderLeft: '4px solid #eee' }}>
              <div style={{ width: '60%', height: '16px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '4px', marginBottom: '10px' }} />
              <div style={{ width: '80%', height: '13px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ width: '40%', height: '12px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '4px' }} />
            </div>
          ))}
          <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
        </div>
      ) : filteredOrders.length === 0 ? (
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
              style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,.08)', borderLeft: `4px solid ${order.status==='in_progress'?'#FBBC04':order.status==='completed'?'#34A853':'#DADCE0'}`, cursor:'pointer', transition:'box-shadow .15s', overflow:'hidden', border: '1px solid #E8EAED', borderLeftWidth: '4px' }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.12)'}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,.08)'}}
            >
            <div style={{padding:'14px 16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'15px',fontWeight:500,color:'#202124',marginBottom:'2px'}}>#{order.id} — {order.work_type}</div>
                  <div style={{fontSize:'12px',color:'#5F6368'}}>👤 {order.patient_name||'Без пациента'} · 📦 {order.quantity} шт. · ⏰ {order.deadline}</div>
                </div>
                <span style={{padding:'3px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:500,color:'#fff',background:order.status==='in_progress'?'#FBBC04':order.status==='completed'?'#34A853':'#DADCE0',whiteSpace:'nowrap',marginLeft:'8px'}}>
                  {order.status==='in_progress'?'В работе':order.status==='completed'?'Готово':'Отменён'}
                </span>
              </div>
              {(order.doctor_name||order.technician_name)&&(
                <div style={{fontSize:'11px',color:'#80868B',marginBottom:'8px'}}>
                  {order.doctor_name&&<>👨‍⚕️{order.doctor_name}</>}{(order.doctor_name&&order.technician_name)&&' · '}{order.technician_name&&<>🔧{order.technician_name}</>}
                </div>
              )}
              {order.status==='in_progress' && order.deadline < new Date().toISOString().split('T')[0] ? (
                <div style={{fontSize:'11px',color:'#C5221F',background:'#FCE8E6',padding:'4px 8px',borderRadius:'8px',display:'inline-block',marginBottom:'8px'}}>⚠️ Просрочено: {order.deadline}</div>
              ) : order.status==='in_progress' && order.deadline <= new Date(Date.now()+2*864e5).toISOString().split('T')[0] ? (
                <div style={{fontSize:'11px',color:'#E37400',background:'#FEF7E0',padding:'4px 8px',borderRadius:'8px',display:'inline-block',marginBottom:'8px'}}>🔥 Срочно: {order.deadline}</div>
              ) : null}
              <div style={{display:'flex',gap:'6px',marginTop:'4px'}}>
                {order.status==='in_progress'&&(
                  <button onClick={e=>{e.stopPropagation();apiService.updateOrder(order.id,{status:'completed'}).then(()=>loadOrdersFromApi()).catch(()=>{})}}
                    style={{padding:'5px 14px',fontSize:'12px',fontWeight:500,border:'none',borderRadius:'24px',background:'#34A853',color:'#fff',cursor:'pointer'}}>✅ Готово</button>
                )}
                <button onClick={e=>{e.stopPropagation();handleOrderClick(order.id)}}
                  style={{padding:'5px 14px',fontSize:'12px',fontWeight:500,border:'1px solid #DADCE0',borderRadius:'24px',background:'#fff',color:'#5F6368',cursor:'pointer'}}>📋 Детали</button>
              </div>
            </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Photo loader
const OrderPhotoInline: React.FC<{orderId: number}> = ({orderId}) => (
  <div style={{marginTop:12}}><div style={{fontSize:13,fontWeight:600,marginBottom:8,color:'#555'}}>📸 Фото:</div>
    <img src={`/api/orders/${orderId}/photo`} alt="Фото" style={{width:'100%',maxHeight:300,objectFit:'contain',borderRadius:8,border:'1px solid #e0e0e0'}}
      onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
  </div>
);

// Order Details Page
const OrderDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { user } = useAuthStore();
  const orderId = params.id ? parseInt(params.id) : 1;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { apiService.getOrder(orderId).then(setOrder).catch(()=>{}).finally(()=>setLoading(false)); }, [orderId]);

  const markDone = () => {
    if (!confirm('Отметить заказ как выполненный?')) return;
    apiService.updateOrder(orderId, { status: 'completed' }).then(() => { navigate('/'); }).catch(() => alert('Ошибка'));
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>⏳ Загрузка...</div>;
  if (!order) return <div style={{ padding: 40, textAlign: 'center', color: '#c62828' }}>❌ Заказ не найден</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <button onClick={() => navigate('/')} style={{ marginBottom: '20px', padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>← Назад</button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', color: '#333', margin: 0 }}>📋 Заказ #{order.id}</h1>
          <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: 'white', backgroundColor: order.status === 'in_progress' ? '#ff9800' : order.status === 'completed' ? '#4CAF50' : '#9e9e9e' }}>
            {order.status === 'in_progress' ? '🔵 В работе' : order.status === 'completed' ? '✅ Выполнен' : '❌ Отменён'}
          </span>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', lineHeight: '2' }}>
            <div>👤 <strong>Пациент:</strong> {order.patient_name || 'Не указан'}</div>
            <div>🔧 <strong>Вид работы:</strong> {order.work_type}</div>
            <div>📊 <strong>Количество:</strong> {order.quantity} шт.</div>
            <div>👨‍⚕️ <strong>Врач:</strong> {order.doctor_name || order.doctor_id || '—'}</div>
            <div>🔧 <strong>Техник:</strong> {order.technician_name || order.technician_id || '—'}</div>
            <div>⏰ <strong>Дедлайн:</strong> {order.deadline}</div>
            <div>📅 <strong>Создан:</strong> {new Date(order.created_at).toLocaleDateString('ru-RU')}</div>
            {order.description && <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#fff3e0', borderRadius: '6px' }}>📝 <strong>Описание:</strong> {order.description}</div>}
            {order.photo_id && <OrderPhotoInline orderId={order.id} />}
          </div>
        </div>

        {order.status === 'in_progress' && (
          <div style={{ padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px', textAlign: 'center' }}>
            <button onClick={markDone} style={{ padding: '14px 28px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
              ✅ Отметить как выполненный
            </button>
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
    description: '',
    doctor_id: 0,
    technician_id: 0
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [workTypesCr, setWorkTypesCr] = useState<any[]>([]);

  useEffect(() => {
    apiService.getDoctors().then(setDoctors).catch(()=>{});
    apiService.getTechnicians().then(setTechnicians).catch(()=>{});
    apiService.getWorkTypes().then(setWorkTypesCr).catch(()=>{});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctor_id || !formData.technician_id || !formData.work_type || !formData.deadline) {
      alert('Заполните все обязательные поля: врач, техник, вид работы, срок');
      return;
    }
    if (formData.quantity < 1 || formData.quantity > 100) {
      alert('Количество должно быть от 1 до 100');
      return;
    }
    if (formData.deadline < new Date().toISOString().split('T')[0]) {
      alert('Срок выполнения не может быть в прошлом');
      return;
    }
    try {
      const result: any = await apiService.createOrder({
        doctor_id: formData.doctor_id,
        technician_id: formData.technician_id,
        patient_name: formData.patient_name,
        work_type: formData.work_type,
        quantity: formData.quantity,
        deadline: formData.deadline,
        description: formData.description
      });
      if (photoFile) {
        const fd = new FormData(); fd.append('file', photoFile);
        await apiService.uploadPhoto(result.order_id, fd);
      }
      try { await apiService.notifyOrderCreated({ order_id: result.order_id, technician_id: formData.technician_id, doctor_id: formData.doctor_id, work_type: formData.work_type }); } catch {}
      alert('Заказ создан!');
      navigate('/dashboard');
    } catch (e: any) {
      alert('Ошибка: ' + (e?.response?.data?.detail || e.message));
    }
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
                  {workTypesCr.map((wt: any) => (
                    <option key={wt.id} value={wt.name}>{wt.name}</option>
                  ))}
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
                  👨‍⚕️ Врач
                </label>
                <select
                  required
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                >
                  <option value={0}>Выберите врача</option>
                  {doctors.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
                  🔧 Техник
                </label>
                <select
                  required
                  value={formData.technician_id}
                  onChange={(e) => setFormData({ ...formData, technician_id: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                >
                  <option value={0}>Выберите техника</option>
                  {technicians.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

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
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
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
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" onClick={() => handleBack()} style={{ padding: '12px 24px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>← Назад</button>
                <button type="button" onClick={() => handleNext()} style={{ padding: '12px 24px', backgroundColor: '#229ED9', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>Далее →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>
                  📸 Фото (необязательно)
                </label>
                <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} />
              </div>

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
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  React.useEffect(() => {
    // Viewport height fix for mobile
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    window.addEventListener('resize', () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    });

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
      {!isOnline && <div className="slide-down" style={{position:'fixed',top:0,left:0,right:0,zIndex:9999,background:'#f44336',color:'#fff',textAlign:'center',padding:'6px',fontSize:'13px',fontWeight:600}}>Нет подключения к сети</div>}
      <AuthProvider>
        <ToastProvider>
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
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;