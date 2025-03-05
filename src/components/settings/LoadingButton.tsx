// src/components/settings/LoadingButton.tsx
import React from 'react';
import Button from '../../components/ui/Button';
import { LucideIcon } from 'lucide-react';

interface LoadingButtonProps {
  loading: boolean;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  className?: string;
  icon?: LucideIcon;
  loadingText: string;
  children: React.ReactNode;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  icon: Icon,
  loadingText,
  children,
}) => {
  return (
    <Button
      variant={variant}
      className={`flex items-center ${className}`}
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 mr-2" />}
          {children}
        </>
      )}
    </Button>
  );
};

export default LoadingButton;
