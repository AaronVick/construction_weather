// src/components/ui/Button.tsx
import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import Spinner from './Spinner';

// Types
type ButtonVariant = 
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'outline'
  | 'ghost';

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  as?: 'button' | 'a' | typeof Link;
  href?: string;
  to?: string;
  external?: boolean;
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  disabled = false,
  as = 'button',
  href,
  to,
  external = false,
  className = '',
  children,
  ...props
}, ref) => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  
  // Determine styles based on variant
  const getVariantClasses = (): string => {
    switch (variant) {
      case 'primary':
        return darkMode
          ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-blue-500/50'
          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-700 text-white focus:ring-blue-500/50';
      case 'secondary':
        return darkMode
          ? 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white focus:ring-gray-500/50'
          : 'bg-gray-600 hover:bg-gray-700 active:bg-gray-700 text-white focus:ring-gray-500/50';
      case 'success':
        return darkMode
          ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white focus:ring-green-500/50'
          : 'bg-green-600 hover:bg-green-700 active:bg-green-700 text-white focus:ring-green-500/50';
      case 'danger':
        return darkMode
          ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white focus:ring-red-500/50'
          : 'bg-red-600 hover:bg-red-700 active:bg-red-700 text-white focus:ring-red-500/50';
      case 'warning':
        return darkMode
          ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white focus:ring-amber-500/50'
          : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-600 text-white focus:ring-amber-500/50';
      case 'info':
        return darkMode
          ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white focus:ring-indigo-500/50'
          : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-700 text-white focus:ring-indigo-500/50';
      case 'outline':
        return darkMode
          ? 'bg-transparent border border-gray-600 hover:border-gray-500 hover:bg-gray-800 text-gray-300 focus:ring-gray-500/30'
          : 'bg-transparent border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 focus:ring-gray-500/30';
      case 'ghost':
        return darkMode
          ? 'bg-transparent text-gray-300 hover:bg-gray-800 focus:ring-gray-500/30'
          : 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500/30';
      default:
        return '';
    }
  };
  
  // Determine styles based on size
  const getSizeClasses = (): string => {
    switch (size) {
      case 'xs':
        return 'text-xs py-1 px-2';
      case 'sm':
        return 'text-sm py-1.5 px-3';
      case 'lg':
        return 'text-base py-2.5 px-5';
      case 'xl':
        return 'text-lg py-3 px-6';
      case 'md':
      default:
        return 'text-sm py-2 px-4';
    }
  };
  
  // Get the appropriate icon and spinner sizes based on button size
  const getIconSize = (): number => {
    switch (size) {
      case 'xs':
        return 14;
      case 'sm':
        return 16;
      case 'lg':
        return 20;
      case 'xl':
        return 24;
      case 'md':
      default:
        return 18;
    }
  };
  
  // Get icon margin classes based on position and whether text is present
  const getIconMarginClasses = (): string => {
    if (!children) return '';
    return iconPosition === 'left' ? 'mr-2' : 'ml-2';
  };
  
  // Combine all classes
  const buttonClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'}
    ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;
  
  // Render spinner if loading
  const renderContent = () => (
    <>
      {loading && (
        <Spinner
          size={getIconSize() * 0.75}
          className={icon && !children ? '' : 'mr-2'}
          color="currentColor"
        />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className={getIconMarginClasses()}>
          {icon}
        </span>
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className={getIconMarginClasses()}>
          {icon}
        </span>
      )}
    </>
  );
  
  // If component should be a Link from react-router
  if (as === Link && to) {
    return (
      <Link
        to={to}
        className={buttonClasses}
        ref={ref as React.Ref<HTMLAnchorElement>}
        {...(props as any)}
      >
        {renderContent()}
      </Link>
    );
  }
  
  // If component should be a regular anchor tag
  if (as === 'a' && href) {
    return (
      <a
        href={href}
        className={buttonClasses}
        ref={ref as React.Ref<HTMLAnchorElement>}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        {...(props as any)}
      >
        {renderContent()}
      </a>
    );
  }
  
  // Default button element
  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      ref={ref as React.Ref<HTMLButtonElement>}
      {...props}
    >
      {renderContent()}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;