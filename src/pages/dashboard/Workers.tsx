// src/pages/dashboard/Workers.tsx
import React, { useState } from 'react';
import { Users, Plus, Search, Filter } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const Workers: React.FC = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Workers</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Manage your crew members and their assignments
          </p>
        </div>
        
        <Button
          variant="primary"
          className="flex items-center"
          onClick={() => {}}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Worker
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input 
            type="text"
            placeholder="Search workers..."
            className={`block w-full pl-10 pr-3 py-2 rounded-md 
              ${darkMode 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
          />
        </div>
        
        <Button variant="outline" className="flex items-center md:w-auto w-full">
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </Button>
      </div>
      
      <Card>
        <div className="flex flex-col items-center justify-center py-12">
          <Users className={`w-16 h-16 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Workers management coming soon
          </h3>
          <p className={`text-center max-w-md mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            This page is under construction. You'll be able to manage all your workers and their jobsite assignments.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Workers;