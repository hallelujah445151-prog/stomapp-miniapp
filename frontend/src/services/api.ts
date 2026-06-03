import axios from 'axios';
import {
  User,
  Doctor,
  Technician,
  WorkType,
  Order,
  OrderCreate,
  OrderUpdate,
  Personnel,
  PersonnelDetail,
  PersonnelCreate,
  PersonnelUpdate
} from '../types';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '/api';

const getAuthToken = (): string => {
  const user = localStorage.getItem('stomapp_user');
  if (user) {
    try { return JSON.parse(user).token || 'test_token'; } catch { return 'test_token'; }
  }
  return 'test_token';
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${getAuthToken()}`;
  return config;
});

export const apiService = {
  // Auth
  async loginByTelegramId(telegramId?: number, name?: string): Promise<{ access_token: string; user: User }> {
    const body: any = {};
    if (telegramId) body.telegram_id = telegramId;
    if (name) body.name = name;
    const response = await api.post('/auth/login', body);
    return response.data;
  },

  async getUserProfile(): Promise<User> {
    const response = await api.get('/user/profile');
    return response.data.user;
  },

  // Orders
  async getOrders(status?: string, technicianId?: number): Promise<Order[]> {
    const params: any = {};
    if (status) params.status = status;
    if (technicianId) params.technician_id = technicianId;
    
    const response = await api.get('/orders', { params });
    return response.data.orders;
  },

  async getOrder(orderId: number): Promise<Order> {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  async createOrder(order: OrderCreate): Promise<{order_id: number}> {
    const response = await api.post('/orders', order);
    return response.data;
  },

  async updateOrder(orderId: number, order: OrderUpdate): Promise<void> {
    await api.put(`/orders/${orderId}`, order);
  },

  // References (from database)
  async getDoctors(): Promise<Doctor[]> {
    const response = await api.get('/references/doctors');
    return response.data.doctors;
  },

  async getTechnicians(): Promise<Technician[]> {
    const response = await api.get('/references/technicians');
    return response.data.technicians;
  },

  async getWorkTypes(): Promise<WorkType[]> {
    const response = await api.get('/references/work-types');
    return response.data.work_types;
  },

  // Personnel Management (Admin only)
  async getPersonnel(role?: string): Promise<Personnel[]> {
    const params: any = {};
    if (role) params.role = role;
    
    const response = await api.get('/personnel', { params });
    return response.data.personnel;
  },

  async getPersonnelDetail(personnelId: number): Promise<PersonnelDetail> {
    const response = await api.get(`/personnel/${personnelId}`);
    return response.data.personnel;
  },

  async createPersonnel(personnel: PersonnelCreate): Promise<{ message: string; personnel_id: number }> {
    const response = await api.post('/personnel', personnel);
    return response.data;
  },

  async updatePersonnel(personnelId: number, personnel: PersonnelUpdate): Promise<void> {
    await api.put(`/personnel/${personnelId}`, personnel);
  },

  async deletePersonnel(personnelId: number): Promise<void> {
    await api.delete(`/personnel/${personnelId}`);
  },

  async approvePersonnel(personnelId: number): Promise<void> {
    await api.put(`/personnel/${personnelId}/approve`);
  },

  // Reports
  async getReportsSummary(): Promise<{total:number,in_progress:number,completed:number,urgent:number}> {
    const response = await api.get('/reports/summary');
    return response.data;
  },
  async getReportsByDoctor(): Promise<any[]> {
    const response = await api.get('/reports/by-doctor', { params: { details: true } });
    return response.data;
  },
  async getReportsByTechnician(): Promise<any[]> {
    const response = await api.get('/reports/by-technician', { params: { details: true } });
    return response.data;
  },

  // Photo upload
  async uploadPhoto(orderId: number, formData: FormData): Promise<void> {
    await api.post(`/orders/${orderId}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  // Notifications
  async notifyOrderCreated(data: Record<string, any>): Promise<void> {
    await api.post('/notify/order-created', data);
  },

  // Reminders
  async getUpcomingReminders(days?: number): Promise<any[]> {
    const response = await api.get('/reminders/upcoming', { params: { days: days || 3 } });
    return response.data.reminders;
  },
  async getOverdueOrders(): Promise<any[]> {
    const response = await api.get('/reminders/overdue');
    return response.data.overdue;
  },

  // Workload
  async getWorkload(): Promise<{id:number,name:string,active:number,next_deadline:string}[]> {
    const response = await api.get('/reports/workload');
    return response.data.workload;
  },

  async getByWorkType(): Promise<any[]> {
    const response = await api.get('/reports/by-work-type', { params: { details: true } });
    return response.data;
  },

  async getPeriodReport(type: string, start: string, end: string): Promise<any> {
    const response = await api.get('/reports/period', { params: { report_type: type, start, end, details: true } });
    return response.data;
  }
};

export default api;