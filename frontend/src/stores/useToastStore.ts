import { create } from 'zustand';
import { ToastType } from '../components/UI/Toast/Toast';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
}

interface ToastActions {
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

type ToastStore = ToastState & ToastActions;

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = {
      id,
      duration: 4000,
      ...toast,
    };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  
  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// Convenience functions
export const toast = {
  success: (message: string, duration?: number) => 
    useToastStore.getState().addToast({ type: 'success', message, duration }),
  
  error: (message: string, duration?: number) => 
    useToastStore.getState().addToast({ type: 'error', message, duration }),
  
  warning: (message: string, duration?: number) => 
    useToastStore.getState().addToast({ type: 'warning', message, duration }),
  
  info: (message: string, duration?: number) => 
    useToastStore.getState().addToast({ type: 'info', message, duration }),
};