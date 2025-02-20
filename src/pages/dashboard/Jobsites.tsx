// src/pages/dashboard/Jobsites.tsx
import React, { useState } from 'react';
import { Map, CloudRain, Plus } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import Button from '../../components/ui/Button';

const Jobsites: React.FC = () => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  const [loading, setLoading] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Jobsites</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Manage and monitor all your jobsite locations
          </p>
        </div>
        
        <Button
          variant="primary"
          className="flex items-center"
          onClick={() => {}}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Jobsite
        </Button>
      </div>
      
      <div className="flex flex-col items-center justify-center py-12">
        <Map className={`w-16 h-16 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
        <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Jobsites coming soon
        </h3>
        <p className={`text-center max-w-md mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          This page is under construction. Check back soon to manage your jobsites and monitor weather conditions.
        </p>
      </div>
    </div>
  );
};

export default Jobsites;