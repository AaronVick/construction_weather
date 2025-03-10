// src/pages/dashboard/WeatherSettings.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useSubscription } from '../../hooks/useSubscription';
// import DashboardLayout from '../../components/layout/DashboardLayout';
import WeatherNotificationSettings from '../../components/weather/WeatherNotificationSettings';
import JobsiteWeatherSettings from '../../components/weather/JobsiteWeatherSettings';
import WeatherHelpDrawer from '../../components/weather/WeatherHelpDrawer';
import Card from '../../components/ui/Card';
import { Jobsite } from '../../types/jobsite';
import { getActiveJobsites } from '../../services/jobsiteService';
import { 
  CloudRain, 
  MapPin, 
  Settings,
  ChevronRight,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

const WeatherSettingsPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [jobsites, setJobsites] = useState<Jobsite[]>([]);
  const [selectedJobsiteId, setSelectedJobsiteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const isPro = subscription?.plan === 'premium' || subscription?.plan === 'enterprise';
  const { jobsiteId } = router.query;
  
  // Fetch jobsites for pro users
  useEffect(() => {
    async function fetchJobsites() {
      if (authLoading || subscriptionLoading) return;
      if (!user || !isPro) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const jobsitesData = await getActiveJobsites();
        setJobsites(jobsitesData);
        
        // If jobsiteId is provided in the URL, select that jobsite
        if (jobsiteId && typeof jobsiteId === 'string') {
          setSelectedJobsiteId(jobsiteId);
        } else if (jobsitesData.length > 0) {
          // Otherwise, select the first jobsite
          setSelectedJobsiteId(jobsitesData[0].id);
        }
      } catch (err) {
        console.error('Error fetching jobsites:', err);
        setError('Failed to load jobsites');
      } finally {
        setLoading(false);
      }
    }
    
    fetchJobsites();
  }, [user, isPro, authLoading, subscriptionLoading, jobsiteId]);
  
  // Handle jobsite selection
  const handleJobsiteSelect = (jobsiteId: string) => {
    setSelectedJobsiteId(jobsiteId);
    
    // Update URL with jobsite ID
    router.push({
      pathname: router.pathname,
      query: { jobsiteId }
    }, undefined, { shallow: true });
  };
  
  // Handle settings saved
  const handleSettingsSaved = () => {
    // Show a success message or refresh data if needed
  };
  
  if (authLoading || subscriptionLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!user) {
    // Redirect to login if not authenticated
    router.push('/login');
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CloudRain className="w-6 h-6 mr-2 text-blue-500" />
            <h1 className="text-2xl font-bold">Weather Notification Settings</h1>
          </div>
          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-800/30 text-blue-600 dark:text-blue-400 rounded-md transition-colors"
            aria-label="Open help"
          >
            <HelpCircle className="w-5 h-5 mr-1" />
            <span>Help</span>
          </button>
        </div>
        
        {/* Help Drawer */}
        <WeatherHelpDrawer 
          isOpen={isHelpOpen} 
          onClose={() => setIsHelpOpen(false)} 
          isPro={isPro} 
        />
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {isPro ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Jobsite Selector (for Pro/Enterprise users) */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <div className="mb-4">
                  <h2 className="text-lg font-medium mb-2">Jobsites</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure weather notifications for specific jobsites
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div 
                    className={`
                      flex items-center justify-between p-3 rounded-md cursor-pointer
                      ${selectedJobsiteId === null 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }
                    `}
                    onClick={() => setSelectedJobsiteId(null)}
                  >
                    <div className="flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      <span>Global Settings</span>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                  
                  {jobsites.map(jobsite => (
                    <div 
                      key={jobsite.id}
                      className={`
                        flex items-center justify-between p-3 rounded-md cursor-pointer
                        ${selectedJobsiteId === jobsite.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }
                      `}
                      onClick={() => handleJobsiteSelect(jobsite.id)}
                    >
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        <span>{jobsite.name}</span>
                      </div>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            
            {/* Settings Panel */}
            <div className="lg:col-span-3">
              {selectedJobsiteId === null ? (
                <WeatherNotificationSettings 
                  onSave={handleSettingsSaved}
                />
              ) : (
                loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <JobsiteWeatherSettings 
                    jobsite={jobsites.find(j => j.id === selectedJobsiteId)!}
                    onSave={handleSettingsSaved}
                  />
                )
              )}
            </div>
          </div>
        ) : (
          // Basic user view (global settings only)
          <WeatherNotificationSettings 
            onSave={handleSettingsSaved}
          />
        )}
      </div>
  );
};

export default WeatherSettingsPage;
