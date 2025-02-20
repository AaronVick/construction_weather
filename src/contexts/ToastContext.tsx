// src/contexts/ToastContext.tsx
import React, { createContext, useState, ReactNode, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: ToastType) => void;
  hideToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [counter, setCounter] = useState(0);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = counter;
    setCounter(prev => prev + 1);
    
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      hideToast(id);
    }, 5000);
  }, [counter]);

  const hideToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      
      {/* Toast display component */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`p-4 rounded-md shadow-md flex items-center justify-between max-w-sm
              ${toast.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : ''}
              ${toast.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' : ''}
              ${toast.type === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100' : ''}
              ${toast.type === 'info' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' : ''}
            `}
          >
            <p>{toast.message}</p>
            <button 
              onClick={() => hideToast(toast.id)}
              className="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};