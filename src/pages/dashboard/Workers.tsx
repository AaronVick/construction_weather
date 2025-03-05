import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, X, Mail, Phone, Calendar, Edit, Trash2 } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { auth, db } from '../../lib/firebaseClient';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import type { Worker } from '../../types/worker';
import { useToast } from '../../hooks/useToast';
import CsvImportModal from '../../components/workers/CsvImportModal';
import { Upload, Download } from 'lucide-react'; 
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

interface AddWorkerFormData {
  name: string;
  email: string;
  phone: string;
  position: string;
  emergency_contact: string;
  notes: string;
}

const Workers: React.FC = () => {
  const theme = useTheme();
  const darkMode = theme ? theme.darkMode : false;
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<AddWorkerFormData>({
    name: '',
    email: '',
    phone: '',
    position: '',
    emergency_contact: '',
    notes: ''
  });
  const [error, setError] = useState<string>('');
  const { showToast } = useToast();  // Add toast
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);  // Add import modal state
  const { user } = useFirebaseAuth();

  // Fetch workers on component mount
  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      if (!user) throw new Error('No authenticated user');

      setLoading(true);
      const workersQuery = query(
        collection(db, 'workers'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(workersQuery);
      const workersData: Worker[] = [];
      
      querySnapshot.forEach((doc) => {
        workersData.push({
          id: doc.id,
          ...doc.data()
        } as Worker);
      });

      setWorkers(workersData);
      setError('');
    } catch (err) {
      console.error('Error fetching workers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workers');
    } finally {
      setLoading(false);
    }
  };

  // Filter workers based on search query
  const filteredWorkers = workers.filter(worker => 
    worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (worker.position || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for CSV import
  const handleImportWorkers = (importedWorkers: Worker[]) => {
    if (importedWorkers && importedWorkers.length > 0) {
      setWorkers(prev => [...importedWorkers, ...prev]);
      showToast(`Successfully imported ${importedWorkers.length} workers`, 'success');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!user) throw new Error('No authenticated user');

      const workerData = {
        user_id: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        position: formData.position || undefined,
        emergency_contact: formData.emergency_contact || undefined,
        notes: formData.notes || undefined,
        is_active: true,
        created_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'workers'), workerData);
      
      // Add new worker to state
      const newWorker: Worker = {
        id: docRef.id,
        ...workerData,
        created_at: new Date().toISOString() // Use current date for UI until refresh
      };
      
      setWorkers(prev => [newWorker, ...prev]);
      
      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: '',
        emergency_contact: '',
        notes: ''
      });
      setIsModalOpen(false);
      showToast('Worker added successfully', 'success');

    } catch (err) {
      console.error('Error adding worker:', err);
      setError(err instanceof Error ? err.message : 'Failed to add worker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Import CSV Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportWorkers}
      />
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
          onClick={() => setIsModalOpen(true)}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workers..."
            className={`block w-full pl-10 pr-3 py-2 rounded-md 
              ${darkMode 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="flex items-center md:w-auto w-full"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="w-5 h-5 mr-2" />
            Import
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center md:w-auto w-full"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </Button>
        </div>
      </div>
      
      <Card>
        <div className="overflow-x-auto">
          {filteredWorkers.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Added</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredWorkers.map((worker) => (
                  <tr key={worker.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{worker.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{worker.email}</div>
                      {worker.phone && (
                        <div className="text-sm text-gray-500">{worker.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {worker.position || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${worker.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {worker.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(worker.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mr-2"
                        onClick={() => {/* TODO: Implement edit */}}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-900"
                        onClick={() => {/* TODO: Implement delete */}}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Loading workers...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className={`w-16 h-16 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                No workers found
              </h3>
              <p className={`text-center max-w-md mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {searchQuery 
                  ? 'No workers match your search criteria.' 
                  : 'Get started by adding your first worker.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  className="flex items-center"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Worker
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={() => setIsImportModalOpen(true)}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Import CSV
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Add Worker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className={`relative w-full max-w-md p-6 rounded-lg shadow-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className={`text-xl font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Add New Worker
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full rounded-md shadow-sm ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full rounded-md shadow-sm ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full rounded-md shadow-sm ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className={`w-full rounded-md shadow-sm ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Emergency Contact
                </label>
                <input
                  type="text"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleInputChange}
                  className={`w-full rounded-md shadow-sm ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full rounded-md shadow-sm ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Worker'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers;
