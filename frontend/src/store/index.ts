import { create } from 'zustand';
import {
  User,
  Doctor,
  Technician,
  WorkType,
  Order
} from '../types';
import { apiService } from '../services/api';

interface AppState {
  // User
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Data
  doctors: Doctor[];
  technicians: Technician[];
  workTypes: WorkType[];
  orders: Order[];

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Data loading
  loadDoctors: () => Promise<void>;
  loadTechnicians: () => Promise<void>;
  loadWorkTypes: () => Promise<void>;
  loadOrders: (status?: string, technicianId?: number) => Promise<void>;
  loadOrderById: (orderId: number) => Promise<Order | null>;
  refreshData: () => Promise<void>;

  // Orders actions
  createOrder: (order: any) => Promise<void>;
  updateOrder: (orderId: number, order: any) => Promise<void>;
  deleteOrder: (orderId: number) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isLoading: false,
  error: null,
  doctors: [],
  technicians: [],
  workTypes: [],
  orders: [],

  // Basic actions
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Data loading
  loadDoctors: async () => {
    try {
      set({ isLoading: true, error: null });
      const doctors = await apiService.getDoctors();
      set({ doctors, isLoading: false });
    } catch (error) {
      set({ error: 'Не удалось загрузить список врачей', isLoading: false });
      throw error;
    }
  },

  loadTechnicians: async () => {
    try {
      set({ isLoading: true, error: null });
      const technicians = await apiService.getTechnicians();
      set({ technicians, isLoading: false });
    } catch (error) {
      set({ error: 'Не удалось загрузить список техников', isLoading: false });
      throw error;
    }
  },

  loadWorkTypes: async () => {
    try {
      set({ isLoading: true, error: null });
      const workTypes = await apiService.getWorkTypes();
      set({ workTypes, isLoading: false });
    } catch (error) {
      set({ error: 'Не удалось загрузить виды работ', isLoading: false });
      throw error;
    }
  },

  loadOrders: async (status?: string, technicianId?: number) => {
    try {
      set({ isLoading: true, error: null });
      const orders = await apiService.getOrders(status, technicianId);
      set({ orders, isLoading: false });
    } catch (error) {
      set({ error: 'Не удалось загрузить заказы', isLoading: false });
      throw error;
    }
  },

  loadOrderById: async (orderId: number) => {
    try {
      set({ isLoading: true, error: null });
      const order = await apiService.getOrder(orderId);
      
      // Обновляем или добавляем заказ в список
      set(state => ({
        orders: state.orders.some(o => o.id === orderId)
          ? state.orders.map(o => o.id === orderId ? order : o)
          : [...state.orders, order],
        isLoading: false
      }));
      
      return order;
    } catch (error) {
      set({ error: 'Не удалось загрузить заказ', isLoading: false });
      return null;
    }
  },

  refreshData: async () => {
    try {
      set({ isLoading: true, error: null });
      await Promise.all([
        get().loadDoctors(),
        get().loadTechnicians(),
        get().loadWorkTypes(),
        get().loadOrders()
      ]);
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Не удалось обновить данные', isLoading: false });
      throw error;
    }
  },

  // Orders actions
  createOrder: async (order) => {
    try {
      set({ isLoading: true, error: null });
      await apiService.createOrder(order);
      await get().loadOrders();
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Не удалось создать заказ', isLoading: false });
      throw error;
    }
  },

  updateOrder: async (orderId, order) => {
    try {
      set({ isLoading: true, error: null });
      await apiService.updateOrder(orderId, order);
      await get().loadOrders();
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Не удалось обновить заказ', isLoading: false });
      throw error;
    }
  },

  deleteOrder: async (orderId) => {
    try {
      set({ isLoading: true, error: null });
      // TODO: Implement delete API endpoint
      // await apiService.deleteOrder(orderId);
      
      // Удаляем из локального состояния
      set(state => ({
        orders: state.orders.filter(o => o.id !== orderId),
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Не удалось удалить заказ', isLoading: false });
      throw error;
    }
  }
}));