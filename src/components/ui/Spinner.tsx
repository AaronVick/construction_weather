// src/components/ui/Spinner.tsx
import React from 'react';

interface SpinnerProps {
  size?: number;
  color?: string;
  thickness?: number;
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 24,
  color = 'currentColor',
  thickness = 2,
  speed = 'normal',
  className = '',
}) => {
  const getSpeedClass = () => {
    switch (speed) {
      case 'slow':
        return 'animate-[spin_1.5s_linear_infinite]';
      case 'fast':
        return 'animate-[spin_0.6s_linear_infinite]';
      case 'normal':
      default:
        return 'animate-spin';
    }
  };

  return (
    <svg
      className={`${getSpeedClass()} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r={10 - thickness / 2}
        stroke={color}
        strokeWidth={thickness}
      />
      <path
        className="opacity-75"
        fill="none"
        strokeLinecap="round"
        stroke={color}
        strokeWidth={thickness}
        d={`M12 2 A 10 10 0 0 1 22 12`}
      />
    </svg>
  );
};

export default Spinner;