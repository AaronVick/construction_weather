// src/pages/dashboard/Jobsites.tsx

import React, { useState, useEffect } from 'react';
import { Map, CloudRain, Plus, Lock, Loader2, X, Check } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useSubscription } from '../../hooks/useSubscription';
import { db } from '../../lib/firebaseClient';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import type { Jobsite, WeatherMonitoringSettings, JobsiteFormData } from '../../types/jobsite';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

interface Client {
  id: string;
  name: string;
}

const defaultWeatherSettings: WeatherMonitoringSettings = {
  isEnabled: false,
  checkTime: '07:00',
  alertThresholds: {
    rain: { enabled: true, thresholdPercentage: 50 },
    snow: { enabled: true, thresholdInches: 1 },
    wind: { enabled: true, thresholdMph: 20 },
    temperature: { enabled: true, thresholdFahrenheit: 32 },
  },
  notificationSettings: {
    notifyClient: true,
    notifyWorkers: true,
    notificationLeadHours: 12,
  },
};

const Jobsites: React.FC = () => {
  const theme = useTheme();
  const darkMode = theme ? theme.darkMode : false;
  const [loading, setLoading] = useState(true);
  const [jobsites, setJobsites] = useState<Jobsite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { subscription } = useSubscription();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState<JobsiteFormData>({
    name: '',
    clientId: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    isActive: true,
    notes: '',
    weatherMonitoring: defaultWeatherSettings,
  });
  const { user } = useFirebaseAuth();

  const hasPremiumAccess = subscription?.plan === 'premium';

  useEffect(() => {
    fetchJobsites();
    fetchClients();
  }, []);

  const fetchJobsites = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const jobsitesQuery = query(
        collection(db, 'jobsites'),
        where('user_id', '==', user.uid),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(jobsitesQuery);
      const jobsitesData: Jobsite[] = [];
      
      querySnapshot.forEach((doc) => {
        jobsitesData.push({
          id: doc.id,
          ...doc.data()
        } as Jobsite);
      });

      setJobsites(jobsitesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching jobsites:', err);
      setError('Failed to load jobsites');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      if (!user) {
        throw new Error('No authenticated user');
      }

      const clientsQuery = query(
        collection(db, 'clients'),
        where('user_id', '==', user.uid),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(clientsQuery);
      const clientsData: Client[] = [];
      
      querySnapshot.forEach((doc) => {
        clientsData.push({
          id: doc.id,
          name: doc.data().name
        });
      });

      setClients(clientsData);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleWeatherSettingChange = (setting: string, value: boolean | number) => {
    setFormData((prev) => ({
      ...prev,
      weatherMonitoring: {
        ...prev.weatherMonitoring,
        alertThresholds: {
          ...prev.weatherMonitoring.alertThresholds,
          [setting]: {
            ...prev.weatherMonitoring.alertThresholds[
              setting as keyof typeof prev.weatherMonitoring.alertThresholds
            ],
            enabled:
              typeof value === 'boolean'
                ? value
                : prev.weatherMonitoring.alertThresholds[
                    setting as keyof typeof prev.weatherMonitoring.alertThresholds
                  ].enabled,
            [typeof value === 'boolean' ? 'enabled' : 'threshold']: value,
          },
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        throw new Error('No authenticated user');
      }

      const jobsiteData = {
        user_id: user.uid,
        name: formData.name,
        client_id: formData.clientId,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        is_active: formData.isActive,
        weather_monitoring: formData.weatherMonitoring,
        notes: formData.notes,
        created_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'jobsites'), jobsiteData);
      
      // Add new jobsite to state
      const newJobsite: Jobsite = {
        id: docRef.id,
        ...jobsiteData,
        created_at: new Date().toISOString() // Use current date for UI until refresh
      } as Jobsite;
      
      setJobsites((prev) => [...prev, newJobsite]);
      setIsModalOpen(false);
      setFormData({
        name: '',
        clientId: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        isActive: true,
        notes: '',
        weatherMonitoring: defaultWeatherSettings,
      });
    } catch (err) {
      console.error('Error adding jobsite:', err);
      setError(err instanceof Error ? err.message : 'Failed to add jobsite');
    } finally {
      setLoading(false);
    }
  };

  if (!hasPremiumAccess) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Jobsites</h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Manage and monitor all your jobsite locations
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 max-w-2xl w-full text-center">
            <Lock className={`w-16 h-16 mb-4 mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <h3 className="text-xl font-semibold mb-3">Premium Feature</h3>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Multiple jobsite management is available for premium subscribers. Upgrade your plan to access this feature.
            </p>
            <Link
              to="/subscription"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Premium Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading jobsites...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600 dark:text-red-400">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/20 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Jobsites</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Manage and monitor all your jobsite locations
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Jobsite
        </Button>
      </div>

      {jobsites.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
          <Map className={`w-16 h-16 mb-4 mx-auto ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className="text-lg font-medium mb-2">No jobsites yet</h3>
          <p className={`max-w-md mx-auto mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Get started by adding your first jobsite location to monitor weather conditions.
          </p>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Add Your First Jobsite
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {jobsites.map((jobsite) => (
            <Link key={jobsite.id} to={`/jobsites/${jobsite.id}`} className="block">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      {jobsite.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {[jobsite.city, jobsite.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div
                    className={`p-2 rounded-full ${
                      jobsite.is_active
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <Map
                      className={`w-5 h-5 ${
                        jobsite.is_active
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center text-sm">
                  <CloudRain
                    className={`w-4 h-4 mr-2 ${
                      jobsite.weather_monitoring.isEnabled
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  />
                  <span
                    className={
                      jobsite.weather_monitoring.isEnabled
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }
                  >
                    {jobsite.weather_monitoring.isEnabled ? 'Monitoring active' : 'Monitoring disabled'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Jobsite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
          <div
            className={`relative w-full max-w-2xl p-6 mx-4 rounded-lg shadow-xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Add New Jobsite
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form fields for jobsite details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Jobsite Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full rounded-md shadow-sm ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Client *
                  </label>
                  <select
                    name="clientId"
                    required
                    value={formData.clientId}
                    onChange={handleInputChange}
                    className={`w-full rounded-md shadow-sm ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional fields for address, city, state, zip code, and notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full rounded-md shadow-sm ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full rounded-md shadow-sm ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full rounded-md shadow-sm ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    required
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className={`w-full rounded-md shadow-sm ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full rounded-md shadow-sm ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Weather monitoring settings */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Weather Monitoring Settings
                </h3>
                {/* Weather monitoring form fields */}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Jobsite'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobsites;
