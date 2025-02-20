// src/components/ui/Card.tsx
import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  border = true,
  hoverable = false,
  onClick,
}) => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;

  const getPaddingClasses = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'p-3';
      case 'lg':
        return 'p-6';
      case 'md':
      default:
        return 'p-4 sm:p-5';
    }
  };

  const getShadowClasses = () => {
    switch (shadow) {
      case 'none':
        return '';
      case 'sm':
        return darkMode ? 'shadow-sm shadow-gray-900/10' : 'shadow-sm';
      case 'lg':
        return darkMode ? 'shadow-lg shadow-gray-900/10' : 'shadow-lg';
      case 'md':
      default:
        return darkMode ? 'shadow shadow-gray-900/10' : 'shadow';
    }
  };

  return (
    <div
      className={`
        rounded-lg
        ${getPaddingClasses()}
        ${getShadowClasses()}
        ${border ? (darkMode ? 'border border-gray-700' : 'border border-gray-200') : ''}
        ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
        ${hoverable ? (darkMode ? 'hover:bg-gray-750 transition-colors' : 'hover:bg-gray-50 transition-colors') : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;