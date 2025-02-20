// src/components/clients/ClientFilters.tsx
import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { ClientFiltersType } from '../../types/filters';

interface ClientFiltersProps {
  filters: ClientFiltersType;
  onChange: (filters: ClientFiltersType) => void;
}

const ClientFilters: React.FC<ClientFiltersProps> = ({ filters, onChange }) => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;

  
  const handleFilterChange = (key: keyof ClientFiltersType, value: string) => {
    onChange({
      ...filters,
      [key]: value
    });
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className={`
            block w-full rounded-md shadow-sm text-sm
            ${darkMode 
              ? 'bg-gray-800 border-gray-700 text-gray-200' 
              : 'bg-white border-gray-300 text-gray-700'}
            focus:ring-blue-500 focus:border-blue-500
          `}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>
      
      {/* Date Added Filter */}
      <div>
        <label className="block text-sm font-medium mb-1">Date Added</label>
        <select
          value={filters.dateAdded}
          onChange={(e) => handleFilterChange('dateAdded', e.target.value)}
          className={`
            block w-full rounded-md shadow-sm text-sm
            ${darkMode 
              ? 'bg-gray-800 border-gray-700 text-gray-200' 
              : 'bg-white border-gray-300 text-gray-700'}
            focus:ring-blue-500 focus:border-blue-500
          `}
        >
          <option value="all">All Time</option>
          <option value="last7days">Last 7 Days</option>
          <option value="last30days">Last 30 Days</option>
          <option value="last90days">Last 90 Days</option>
        </select>
      </div>
      
      {/* Sort By Filter */}
      <div>
        <label className="block text-sm font-medium mb-1">Sort By</label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className={`
            block w-full rounded-md shadow-sm text-sm
            ${darkMode 
              ? 'bg-gray-800 border-gray-700 text-gray-200' 
              : 'bg-white border-gray-300 text-gray-700'}
            focus:ring-blue-500 focus:border-blue-500
          `}
        >
          <option value="nameAsc">Name (A-Z)</option>
          <option value="nameDesc">Name (Z-A)</option>
          <option value="dateAsc">Date Added (Oldest)</option>
          <option value="dateDesc">Date Added (Newest)</option>
        </select>
      </div>
    </div>
  );
};

export default ClientFilters;