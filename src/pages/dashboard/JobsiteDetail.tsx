// src/pages/dashboard/JobsiteDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Map, 
  ArrowLeft, 
  MapPin, 
  CloudRain, 
  Users, 
  Bell, 
  Edit, 
  ExternalLink, 
  Clipboard, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getJobsite } from '../../services/jobsiteService';
import { Jobsite } from '../../types/jobsite';
import JobsiteWeatherSettings from '../../components/weather/JobsiteWeatherSettings';
import { EmailLog } from '../../types/email';
import { Worker } from '../../types/worker';
import { Notification } from '../../types/notification';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ErrorState } from '../../components/ui/ErrorState';

// Mock data for demonstration
const mockWorkers: Worker[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phone: '555-123-4567', position: 'Foreman', is_active: true, created_at: new Date().toISOString(), user_id: '1' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '555-987-6543', position: 'Equipment Operator', is_active: true, created_at: new Date().toISOString(), user_id: '1' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', phone: '555-456-7890', position: 'Laborer', is_active: true, created_at: new Date().toISOString(), user_id: '1' },
];

const mockNotifications: Notification[] = [
  { id: '1', type: 'weather', title: 'Heavy Rain Alert', message: 'Heavy rain expected tomorrow. Consider rescheduling outdoor work.', read: true, timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', type: 'weather', title: 'High Wind Warning', message: 'Wind speeds exceeding 25mph expected. Secure loose materials.', read: false, timestamp: new Date(Date.now() - 172800000).toISOString() },
  { id: '3', type: 'weather', title: 'Extreme Heat Alert', message: 'Temperatures expected to reach 95°F. Ensure workers stay hydrated.', read: true, timestamp: new Date(Date.now() - 259200000).toISOString() },
];

const JobsiteDetail: React.FC = () => {
  const theme = useTheme();
  const darkMode = theme ? theme.darkMode : false;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [jobsite, setJobsite] = useState<Jobsite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'location' | 'weather' | 'workers' | 'notifications'>('location');
  const [coordinatesCopied, setCoordinatesCopied] = useState(false);
  
  useEffect(() => {
    async function fetchJobsite() {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const jobsiteData = await getJobsite(id);
        
        if (!jobsiteData) {
          throw new Error('Jobsite not found');
        }
        
        setJobsite(jobsiteData);
      } catch (err) {
        console.error('Error fetching jobsite:', err);
        setError('Failed to load jobsite details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchJobsite();
  }, [id]);
  
  const handleBack = () => {
    navigate('/jobsites');
  };
  
  const handleEditJobsite = () => {
    navigate(`/jobsites/edit/${id}`);
  };
  
  const copyCoordinates = () => {
    if (jobsite?.latitude && jobsite?.longitude) {
      navigator.clipboard.writeText(`${jobsite.latitude}, ${jobsite.longitude}`);
      setCoordinatesCopied(true);
      setTimeout(() => setCoordinatesCopied(false), 2000);
    }
  };
  
  const openInMaps = () => {
    if (jobsite?.latitude && jobsite?.longitude) {
      window.open(`https://maps.google.com/?q=${jobsite.latitude},${jobsite.longitude}`, '_blank');
    } else if (jobsite?.address) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(jobsite.address)}`, '_blank');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error || !jobsite) {
    return (
      <ErrorState 
        message={error || 'Jobsite not found'} 
        onRetry={() => window.location.reload()} 
      />
    );
  }
  
  const formatAddress = () => {
    const parts = [];
    if (jobsite.address) parts.push(jobsite.address);
    if (jobsite.city) parts.push(jobsite.city);
    if (jobsite.state) parts.push(jobsite.state);
    if (jobsite.zip_code) parts.push(jobsite.zip_code);
    
    return parts.join(', ');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobsites
          </Button>
          
          <h1 className="text-2xl font-semibold">{jobsite.name}</h1>
        </div>
        
        <Button
          variant="primary"
          size="sm"
          onClick={handleEditJobsite}
          className="flex items-center"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Jobsite
        </Button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-medium mb-2">{jobsite.name}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {formatAddress()}
            </p>
            {(jobsite.latitude && jobsite.longitude) && (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{jobsite.latitude.toFixed(6)}, {jobsite.longitude.toFixed(6)}</span>
                <button 
                  onClick={copyCoordinates}
                  className="ml-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {coordinatesCopied ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Clipboard className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={openInMaps}
              className="flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Maps
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'location' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('location')}
        >
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Location Details
          </div>
        </button>
        
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'weather' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('weather')}
        >
          <div className="flex items-center">
            <CloudRain className="w-4 h-4 mr-2" />
            Weather Monitoring
          </div>
        </button>
        
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'workers' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('workers')}
        >
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Assigned Workers
          </div>
        </button>
        
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'notifications' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('notifications')}
        >
          <div className="flex items-center">
            <Bell className="w-4 h-4 mr-2" />
            Notification History
          </div>
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'location' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-medium mb-4">Location Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Address</h4>
                  <p className="text-gray-600 dark:text-gray-300">{jobsite.address || 'No address provided'}</p>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">City</h4>
                    <p className="text-gray-600 dark:text-gray-300">{jobsite.city || 'No city provided'}</p>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">State</h4>
                    <p className="text-gray-600 dark:text-gray-300">{jobsite.state || 'No state provided'}</p>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">ZIP Code</h4>
                    <p className="text-gray-600 dark:text-gray-300">{jobsite.zip_code || 'No ZIP code provided'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Coordinates</h4>
                  {(jobsite.latitude && jobsite.longitude) ? (
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">
                        Latitude: {jobsite.latitude.toFixed(6)}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        Longitude: {jobsite.longitude.toFixed(6)}
                      </p>
                      <div className="mt-2 flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyCoordinates}
                          className="flex items-center"
                        >
                          <Clipboard className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openInMaps}
                          className="flex items-center"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View in Maps
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">No coordinates available</p>
                  )}
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-gray-600 dark:text-gray-300">{jobsite.notes || 'No notes provided'}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {activeTab === 'weather' && (
          <div>
            <JobsiteWeatherSettings jobsite={jobsite} />
          </div>
        )}
        
        {activeTab === 'workers' && (
          <div>
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Assigned Workers</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {}}
                  className="flex items-center"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Workers
                </Button>
              </div>
              
              {mockWorkers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Position
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Contact
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {mockWorkers.map((worker) => (
                        <tr key={worker.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {worker.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {worker.position || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {worker.email}
                              {worker.phone && (
                                <div>{worker.phone}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              worker.is_active 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {worker.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Workers Assigned</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    There are no workers assigned to this jobsite yet.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => {}}
                  >
                    Assign Workers
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
        
        {activeTab === 'notifications' && (
          <div>
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Notification History</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {}}
                  className="flex items-center"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notification Settings
                </Button>
              </div>
              
              {mockNotifications.length > 0 ? (
                <div className="space-y-4">
                  {mockNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border rounded-lg ${
                        notification.read 
                          ? 'border-gray-200 dark:border-gray-700' 
                          : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          {notification.type === 'weather' && (
                            <CloudRain className="w-5 h-5 text-blue-500" />
                          )}
                          {notification.type === 'system' && (
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                          )}
                          {notification.type === 'info' && (
                            <Bell className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(notification.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Notifications Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    There are no notifications for this jobsite yet.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsiteDetail;
