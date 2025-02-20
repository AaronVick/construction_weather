// src/pages/dashboard/JobsiteDetail.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Map, ArrowLeft, MapPin, CloudRain, Users, Settings, AlertTriangle, Bell } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const JobsiteDetail: React.FC = () => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const handleBack = () => {
    navigate('/dashboard/jobsites');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobsites
        </Button>
        
        <h1 className="text-2xl font-semibold">Jobsite Details</h1>
      </div>
      
      <div className="flex flex-col items-center justify-center py-12">
        <Map className={`w-16 h-16 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
        <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Jobsite detail page coming soon
        </h3>
        <p className={`text-center max-w-md mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          This page is under construction. You'll be able to view detailed weather data and manage settings for this location.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-8">
          <Card>
            <div className="flex items-center mb-4">
              <MapPin className="w-5 h-5 mr-2 text-blue-500" />
              <h3 className="font-medium">Location Details</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View and update location information including address, coordinates, and access details.
            </p>
          </Card>
          
          <Card>
            <div className="flex items-center mb-4">
              <CloudRain className="w-5 h-5 mr-2 text-blue-500" />
              <h3 className="font-medium">Weather Monitoring</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure weather alerts and notification settings for this jobsite.
            </p>
          </Card>
          
          <Card>
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              <h3 className="font-medium">Assigned Workers</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage crew assignments and contact information for this location.
            </p>
          </Card>
          
          <Card>
            <div className="flex items-center mb-4">
              <Bell className="w-5 h-5 mr-2 text-blue-500" />
              <h3 className="font-medium">Notification History</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View past weather alerts and notification history for this jobsite.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobsiteDetail;