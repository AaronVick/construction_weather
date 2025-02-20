// src/components/ui/ConfirmDialog.tsx
import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useTheme } from '../../hooks/useTheme';
import Button from './Button';
import { XCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'warning';
  loading?: boolean;
  children?: React.ReactNode; // Add support for children
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
  loading = false,
  children
}) => {
  const { darkMode } = useTheme();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={loading ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`w-full max-w-md transform overflow-hidden rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } p-6 text-left align-middle shadow-xl transition-all`}
              >
                <div className="absolute top-4 right-4">
                  <button
                    type="button"
                    className={`text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400`}
                    onClick={onClose}
                    disabled={loading}
                  >
                    <span className="sr-only">Close</span>
                    <XCircle size={24} />
                  </button>
                </div>

                <Dialog.Title
                  as="h3"
                  className={`text-lg font-semibold leading-6 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {title}
                </Dialog.Title>

                {/* Show message if provided and no children */}
                {message && !children && (
                  <div className="mt-2">
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {message}
                    </p>
                  </div>
                )}

                {/* Render children if provided */}
                {children && <div className="mt-2">{children}</div>}

                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    {cancelText}
                  </Button>
                  <Button
                    variant={confirmVariant}
                    onClick={onConfirm}
                    loading={loading}
                  >
                    {confirmText}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ConfirmDialog;