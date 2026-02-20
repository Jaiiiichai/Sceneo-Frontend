"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function getToastClasses(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'border-green-500/70 bg-green-900 text-white';
    case 'error':
      return 'border-red-500/70 bg-red-900 text-white';
    default:
      return 'border-gray-500/70 bg-gray-900 text-white';
  }
}

function getTimerClasses(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'bg-green-300';
    case 'error':
      return 'bg-red-300';
    default:
      return 'bg-gray-300';
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(prev => [...prev, { id, message, type }]);

    window.setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto overflow-hidden rounded-xl border-2 shadow-2xl animate-toast-in-right ${getToastClasses(toast.type)}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm font-medium">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="rounded p-1 hover:bg-black/10 transition-colors"
                aria-label="Close notification"
              >
                <X size={16} />
              </button>
            </div>
            <div className={`h-1 w-full origin-left animate-toast-timer ${getTimerClasses(toast.type)}`} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}
