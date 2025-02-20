// src/components/ui/ConfirmDialog.tsx
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from '../../hooks/useTheme';
import Button from './Button';
import { AlertTriangle, Info, AlertCircle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'warning' | 'success';
  type?: 'danger' | 'warning' | 'info' | 'confirmation';
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  type = 'confirmation',
  loading = false,
}) => {
  const { darkMode } = useTheme();
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  
  // Focus the confirm button when the dialog opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);
  
  // Handle escape key press to close dialog
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  // Handle click outside the dialog to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      // Add a small delay to prevent the dialog from closing immediately when it's opened
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Prevent scrolling when the dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="w-10 h-10 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-10 h-10 text-amber-500" />;
      case 'info':
        return <Info className="w-10 h-10 text-blue-500" />;
      default:
        return <AlertTriangle className="w-10 h-10 text-blue-500" />;
    }
  };
  
  if (!isOpen) return null;
  
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className={`fixed inset-0 ${darkMode ? 'bg-black bg-opacity-75' : 'bg-gray-500 bg-opacity-75'} transition-opacity`} />
      
      {/* Dialog positioning */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        {/* Dialog panel */}
        <div
          ref={dialogRef}
          className={`relative transform overflow-hidden rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} text-left shadow-xl transition-all sm:my-8 sm:max-w-lg w-full`}
        >
          {/* Close button */}
          <button
            type="button"
            className={`absolute right-2 top-2 p-1 rounded-full ${darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'}`}
            onClick={onClose}
          >
            <X size={20} />
          </button>
          
          <div className="p-6">
            <div className="sm:flex sm:items-start">
              {/* Icon */}
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                {getIcon()}
              </div>
              
              {/* Content */}
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className={`text-lg font-medium leading-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {title}
                </h3>
                <div className="mt-2">
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    {message}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="mt-6 sm:mt-6 sm:flex sm:flex-row-reverse">
              <Button
                variant={confirmVariant}
                onClick={onConfirm}
                className="w-full sm:w-auto sm:ml-3"
                loading={loading}
                disabled={loading}
                ref={confirmButtonRef as React.RefObject<HTMLButtonElement>}
              >
                {confirmText}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="mt-3 w-full sm:mt-0 sm:w-auto"
                disabled={loading}
              >
                {cancelText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;