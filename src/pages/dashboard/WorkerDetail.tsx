// src/pages/dashboard/WorkerDetail.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, MapPin, Mail, Phone, Calendar, Briefcase, Clock } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const WorkerDetail: React.FC = () => {
  const { darkMode } = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const handleBack = () => {
    navigate('/dashboard/workers');
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
          Back to Workers
        </Button>
        
        <h1 className="text-2xl font-semibold">Worker Details</h1>
      </div>
      
      <div className="flex flex-col items-center justify-center py-12">
        <User className={`w-16 h-16 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
        <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Worker detail page coming soon
        </h3>
        <p className={`text-center max-w-md mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          This page is under construction. You'll be able to view and edit worker details and manage their jobsite assignments.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-8">
          <Card>
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 mr-2 text-blue-500" />
              <h3 className="font-medium">Personal Information</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Update name, contact details, and emergency contact information.
            </p>
          </Card>
          
          <Card>
            <div className="flex items-center mb-4">
              <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
              <h3 className="font-medium">Work Assignments</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View and manage jobsite assignments and work schedule.
            </p>
          </Card>
          
          <Card>
            <div className="flex items-center mb-4">
              <Mail className="w-5 h-5 mr-2 text-blue-500" />
              <h3 className="font-medium">Notification Settings</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure how this worker receives weather and jobsite notifications.
            </p>
          </Card>
          
          <Card>
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              <h3 className="font-medium">Activity History</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View notifications sent and jobsite attendance history.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkerDetail;