export interface User {
  id: number;
  telegram_id: number;
  name: string;
  role: 'dispatcher' | 'technician' | 'doctor' | 'admin';
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Doctor {
  id: number;
  name: string;
  telegram_id: number;
  is_admin: boolean;
  is_active: boolean;
}

export interface Technician {
  id: number;
  name: string;
  telegram_id: number;
  is_admin: boolean;
  is_active: boolean;
}

export interface WorkType {
  id: number;
  name: string;
  short_name: string;
}

export interface Order {
  id: number;
  doctor_id: number | null;
  technician_id: number | null;
  patient_name: string | null;
  work_type: string;
  quantity: number;
  deadline: string;
  description: string;
  photo_id: string | null;
  created_at: string;
  status: 'in_progress' | 'completed' | 'cancelled';
}

export interface OrderCreate {
  doctor_id: number;
  technician_id: number;
  patient_name: string;
  work_type: string;
  quantity: number;
  deadline: string;
  description?: string;
}

export interface OrderUpdate {
  status?: 'in_progress' | 'completed' | 'cancelled';
  description?: string;
}

export interface Personnel {
  id: number;
  name: string;
  role: 'dispatcher' | 'technician' | 'doctor' | 'admin';
  telegram_id: number;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PersonnelDetail extends Personnel {
  stats: {
    total_orders: number;
    in_progress_orders: number;
    completed_orders: number;
  };
}

export interface PersonnelCreate {
  telegram_id: number;
  name: string;
  role: 'dispatcher' | 'technician' | 'doctor' | 'admin';
  is_admin: boolean;
}

export interface PersonnelUpdate {
  name?: string;
  role?: 'dispatcher' | 'technician' | 'doctor' | 'admin';
  is_admin?: boolean;
  is_active?: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}