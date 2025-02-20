// src/components/ui/Tooltip.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../hooks/useTheme';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  maxWidth?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  maxWidth = '200px'
}) => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const childRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };
  
  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };
  
  // Update position when tooltip visibility changes
  useEffect(() => {
    if (isVisible && childRef.current && tooltipRef.current) {
      const childRect = childRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;
      
      // Calculate position based on tooltip position preference
      switch (position) {
        case 'top':
          top = childRect.top - tooltipRect.height - 8;
          left = childRect.left + (childRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'right':
          top = childRect.top + (childRect.height / 2) - (tooltipRect.height / 2);
          left = childRect.right + 8;
          break;
        case 'bottom':
          top = childRect.bottom + 8;
          left = childRect.left + (childRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = childRect.top + (childRect.height / 2) - (tooltipRect.height / 2);
          left = childRect.left - tooltipRect.width - 8;
          break;
      }
      
      // Ensure tooltip is within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Adjust horizontal position if needed
      if (left < 10) {
        left = 10;
      } else if (left + tooltipRect.width > viewportWidth - 10) {
        left = viewportWidth - tooltipRect.width - 10;
      }
      
      // Adjust vertical position if needed
      if (top < 10) {
        top = 10;
      } else if (top + tooltipRect.height > viewportHeight - 10) {
        top = viewportHeight - tooltipRect.height - 10;
      }
      
      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Clone child element to add event handlers and ref
  const childWithHandlers = React.cloneElement(children, {
    ref: childRef,
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
  });
  
  // Determine arrow position classes
  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent';
      case 'right':
        return 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-r-transparent';
      case 'bottom':
        return 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-l-transparent';
    }
  };
  
  return (
    <>
      {childWithHandlers}
      
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={`
            fixed z-50 max-w-xs pointer-events-none
            px-2 py-1 text-xs font-medium rounded shadow-md
            ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'}
            transition-opacity duration-150
            ${isVisible ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            maxWidth
          }}
          role="tooltip"
        >
          <div 
            className={`
              absolute w-0 h-0
              border-solid border-[6px]
              ${darkMode ? 'border-gray-800' : 'border-gray-900'}
              ${getArrowClasses()}
            `}
          />
          {content}
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;