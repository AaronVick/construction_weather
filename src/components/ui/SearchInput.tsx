// src/components/ui/SearchInput.tsx
import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounce?: number;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  debounce = 300,
}) => {
  const { darkMode } = useTheme();
  const [inputValue, setInputValue] = useState(value);

  // Handle debounced input
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(inputValue);
    }, debounce);

    return () => {
      clearTimeout(timer);
    };
  }, [inputValue, debounce, onChange]);

  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
  };

  return (
    <div
      className={`relative flex items-center ${className}`}
    >
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search
          size={18}
          className={darkMode ? 'text-gray-400' : 'text-gray-500'}
        />
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`
          w-full py-2 pl-10 pr-10 
          rounded-md border focus:ring-2 focus:outline-none
          ${
            darkMode
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-blue-600'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500'
          }
        `}
      />
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3"
        >
          <X
            size={18}
            className={`
              ${
                darkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          />
        </button>
      )}
    </div>
  );
};

export default SearchInput;