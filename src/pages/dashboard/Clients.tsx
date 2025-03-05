// src/pages/dashboard/Clients.tsx


import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { getClients, updateClientStatus, deleteClient, createClient } from '../../services/clientService';
import { auth } from '../../lib/firebaseClient';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

// Components
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import ClientTable from '../../components/clients/ClientTable';
import ClientFilters from '../../components/clients/ClientFilters';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CsvImportModal from '../../components/clients/CsvImportModal';


// Icons
import { 
  Plus, 
  UserPlus, 
  FileCog, 
  Upload, 
  Download, 
  Trash2, 
  Users, 
  Filter,
  X,
  Check 
} from 'lucide-react';

// Types
import type { Client, ClientFormData } from '../../types/client';
import type { ClientFiltersType } from '../../types/filters';

interface EmptyStateProps {
  icon: JSX.Element;
  title: string;
  description: string;
  actionText: string;
  onAction: () => void;
}

const defaultClientForm: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  is_active: true,
  notes: ''
};

const Clients: React.FC = () => {
  const theme = useTheme();
  const darkMode = theme ? theme.darkMode : false;
  const { showToast } = useToast();
  const { user } = useFirebaseAuth();
  
  // Main state
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>(defaultClientForm);
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Filter and pagination state
  const [filters, setFilters] = useState<ClientFiltersType>({
    status: 'all',
    dateAdded: 'all',
    sortBy: 'nameAsc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (!user) throw new Error('No authenticated user');

      const newClient = await createClient({
        ...formData,
        user_id: user.uid,
        is_active: true
      });

      if (!newClient) throw new Error('Failed to create client');

      // Update local state
      setClients(prev => [...prev, newClient]);
      applyFilters([...clients, newClient], searchTerm, filters);
      
      // Reset form and close modal
      setFormData(defaultClientForm);
      setIsModalOpen(false);
      showToast('Client added successfully', 'success');
    } catch (err) {
      console.error('Error creating client:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a separate effect to handle client-side filtering
useEffect(() => {
  if (clients.length > 0 && !loading) {
    applyFilters(clients, searchTerm, filters);
  }
}, [clients, searchTerm, filters, loading]);

// Only fetch data when pagination changes or on initial load
useEffect(() => {
  fetchClients();
}, [currentPage, itemsPerPage]);

const fetchClients = async () => {
  try {
    setLoading(true);
    
    // Map UI sort values to API sort values
    let sortBy: 'name' | 'created_at' | 'updated_at' = 'name';
    let sortDirection: 'asc' | 'desc' = 'asc';
    
    switch (filters.sortBy) {
      case 'nameDesc':
        sortBy = 'name';
        sortDirection = 'desc';
        break;
      case 'nameAsc':
        sortBy = 'name';
        sortDirection = 'asc';
        break;
      case 'dateDesc':
        sortBy = 'created_at';
        sortDirection = 'desc';
        break;
      case 'dateAsc':
        sortBy = 'created_at';
        sortDirection = 'asc';
        break;
      default:
        sortBy = 'name';
        sortDirection = 'asc';
    }

    const serviceFilters = {
      query: searchTerm,
      isActive: filters.status === 'all' ? undefined : filters.status === 'active',
      sortBy,
      sortDirection
    };

    const response = await getClients(serviceFilters, currentPage, itemsPerPage);
    
    if (response.error) {
      console.error('Error fetching clients:', response.error);
      showToast('Failed to load clients', 'error');
      return;
    }

    setClients(response.data);
    // Don't set filteredClients directly here, as the useEffect will handle it
    
    // Update page if needed
    const totalItems = response.count;
    const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
      setCurrentPage(1);
    }

  } catch (error) {
    console.error('Failed to fetch clients:', error);
    showToast('Failed to load clients', 'error');
  } finally {
    setLoading(false);
  }
};


  const handleImportClients = (importedClients: any[]) => {
    setClients(prev => [...prev, ...importedClients]);
    applyFilters([...clients, ...importedClients], searchTerm, filters);
  };

  // Filter application
  const applyFilters = (clientList: Client[], search: string, filterOptions: ClientFiltersType) => {
    let result = [...clientList];
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        client => 
          client.name.toLowerCase().includes(searchLower) ||
          client.email.toLowerCase().includes(searchLower) ||
          client.company?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filterOptions.status !== 'all') {
      result = result.filter(client => 
        filterOptions.status === 'active' ? client.is_active : !client.is_active
      );
    }
    
    if (filterOptions.dateAdded !== 'all') {
      const now = new Date();
      let compareDate = new Date();
      
      switch (filterOptions.dateAdded) {
        case 'last7days':
          compareDate.setDate(now.getDate() - 7);
          break;
        case 'last30days':
          compareDate.setDate(now.getDate() - 30);
          break;
        case 'last90days':
          compareDate.setDate(now.getDate() - 90);
          break;
      }
      
      result = result.filter(client => 
        new Date(client.created_at) >= compareDate
      );
    }
    
    switch (filterOptions.sortBy) {
      case 'nameAsc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'dateAsc':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'dateDesc':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    
    setFilteredClients(result);
  };

  // Search and filter handlers
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    applyFilters(clients, term, filters);
  };

  const handleFilterChange = (newFilters: ClientFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
    applyFilters(clients, searchTerm, newFilters);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const idsOnCurrentPage = paginatedClients.map(client => client.id);
      setSelectedClients(idsOnCurrentPage);
    } else {
      setSelectedClients([]);
    }
  };

  const handleSelectClient = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClients([...selectedClients, clientId]);
    } else {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    }
  };

  // Bulk operations
  const handleBulkStatusChange = async (setActive: boolean) => {
    try {
      await Promise.all(
        selectedClients.map(id => updateClientStatus(id, setActive))
      );
      
      const updatedClients = clients.map(client => 
        selectedClients.includes(client.id)
          ? { ...client, is_active: setActive }
          : client
      );
      
      setClients(updatedClients);
      applyFilters(updatedClients, searchTerm, filters);
      
      showToast(
        `${selectedClients.length} clients ${setActive ? 'activated' : 'deactivated'} successfully`,
        'success'
      );
      
      setSelectedClients([]);
    } catch (error) {
      console.error('Failed to update client status:', error);
      showToast('Failed to update clients', 'error');
    }
  };

  // Delete operations
  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    
    try {
      await deleteClient(clientToDelete);
      
      const updatedClients = clients.filter(client => client.id !== clientToDelete);
      setClients(updatedClients);
      applyFilters(updatedClients, searchTerm, filters);
      
      showToast('Client deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete client:', error);
      showToast('Failed to delete client', 'error');
    } finally {
      setClientToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const confirmDelete = (clientId: string) => {
    setClientToDelete(clientId);
    setDeleteConfirmOpen(true);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteClient}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone and all associated data will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />

       {/* CSV Import Modal */}
       <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportClients}
      />
      
      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className={`relative w-full max-w-2xl p-6 mx-4 rounded-lg shadow-xl ${
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
              Add New Client
            </h2>

            {formError && (
              <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
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
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company || ''}
                    onChange={handleInputChange}
                    className={`w-full rounded-md shadow-sm ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  className={`w-full rounded-md shadow-sm ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ''}
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
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state || ''}
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
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code || ''}
                    onChange={handleInputChange}
                    className={`w-full rounded-md shadow-sm ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  value={formData.notes || ''}
                  onChange={handleInputChange}
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
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Client'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Client Management</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            Manage your clients and notification preferences
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="primary"
            icon={<UserPlus size={16} />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Client
          </Button>
          <Button 
            variant="secondary"
            icon={<FileCog size={16} />}
            onClick={() => {}}
          >
            Configure Emails
          </Button>
        </div>
      </div>

      {/* Search and filter bar */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <SearchInput 
              placeholder="Search clients by name, email, or company..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Upload size={16} />}
              onClick={() => setIsImportModalOpen(true)}
              title="Import clients from CSV"
            >
              Import
            </Button>
              <Button
                variant="outline"
                icon={<Download size={16} />}
                title="Export clients to CSV"
              >
                Export
              </Button>
            </div>
          </div>
        </div>
        
        {/* Filter panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <ClientFilters 
              filters={filters}
              onChange={handleFilterChange}
            />
          </div>
        )}
      </Card>

      {/* Client table with actions */}
      <Card>
        {loading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredClients.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title="No clients found"
            description={
              searchTerm || Object.values(filters).some(v => v !== 'all')
                ? "Try adjusting your search or filters"
                : "Get started by adding your first client"
            }
            actionText={searchTerm || Object.values(filters).some(v => v !== 'all') ? "Clear filters" : "Add client"}
            onAction={searchTerm || Object.values(filters).some(v => v !== 'all')
              ? () => {
                  setSearchTerm('');
                  setFilters({
                    status: 'all',
                    dateAdded: 'all',
                    sortBy: 'nameAsc'
                  });
                  applyFilters(clients, '', {
                    status: 'all',
                    dateAdded: 'all',
                    sortBy: 'nameAsc'
                  });
                }
              : () => setIsModalOpen(true)
            }
          />
        ) : (
          <>
            {/* Bulk actions */}
            {selectedClients.length > 0 && (
              <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium pl-2">
                  {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected
                </span>
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleBulkStatusChange(true)}
                  >
                    Enable Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleBulkStatusChange(false)}
                  >
                    Disable Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {}}
                  >
                    Email Selected
                  </Button>
                </div>
              </div>
            )}
            
            {/* Client table */}
            <ClientTable 
              clients={paginatedClients}
              selectedClients={selectedClients}
              onSelectClient={handleSelectClient}
              onSelectAll={handleSelectAll}
              onDelete={confirmDelete}
            />
            
            {/* Pagination */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredClients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} clients
              </div>
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
              <div className="flex items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className={`
                    text-sm rounded-md border-gray-300 
                    ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white text-gray-700'}
                    focus:ring-blue-500 focus:border-blue-500
                  `}
                >
                  {[10, 25, 50, 100].map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Clients;







// import React, { useState, useEffect, useMemo } from 'react';
// import { Link } from 'react-router-dom';
// import { useTheme } from '../../hooks/useTheme';
// import { useToast } from '../../hooks/useToast';
// import { getClients, updateClientStatus, deleteClient } from '../../services/clientService';

// // Components
// import Card from '../../components/ui/Card';
// import Button from '../../components/ui/Button';
// import SearchInput from '../../components/ui/SearchInput';
// import Pagination from '../../components/ui/Pagination';
// import ClientTable from '../../components/clients/ClientTable';
// import ClientFilters from '../../components/clients/ClientFilters';
// import ConfirmDialog from '../../components/ui/ConfirmDialog';
// import EmptyState from '../../components/ui/EmptyState';
// import LoadingSpinner from '../../components/ui/LoadingSpinner';

// // Icons
// import { Plus, UserPlus, FileCog, Upload, Download, Trash2, Users, Filter } from 'lucide-react';

// // Types
// import { Client } from '../../types/client';
// import { ClientFiltersType } from '../../types/filters';

// interface EmptyStateProps {
//   icon: JSX.Element;
//   title: string;
//   description: string;
//   actionText: string;
//   onAction: () => void;
// }

// const Clients: React.FC = () => {
//   const theme = useTheme();
// const darkMode = theme ? theme.darkMode : false;
//   const { showToast } = useToast();
//   const [loading, setLoading] = useState(true);
//   const [clients, setClients] = useState<Client[]>([]);
//   const [filteredClients, setFilteredClients] = useState<Client[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedClients, setSelectedClients] = useState<string[]>([]);
//   const [filters, setFilters] = useState<ClientFiltersType>({
//     status: 'all',
//     dateAdded: 'all',
//     sortBy: 'nameAsc'
//   });
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [showFilters, setShowFilters] = useState(false);
//   const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
//   const [clientToDelete, setClientToDelete] = useState<string | null>(null);


//   useEffect(() => {
//     fetchClients();
//   }, [currentPage, itemsPerPage, searchTerm, filters.status, filters.sortBy]);

//   const fetchClients = async () => {
//     try {
//       setLoading(true);
      
//       // Map UI sort values to API sort values
//       let sortBy: 'name' | 'created_at' | 'updated_at' = 'name';
//       let sortDirection: 'asc' | 'desc' = 'asc';
      
//       switch (filters.sortBy) {
//         case 'nameDesc':
//           sortBy = 'name';
//           sortDirection = 'desc';
//           break;
//         case 'nameAsc':
//           sortBy = 'name';
//           sortDirection = 'asc';
//           break;
//         case 'dateDesc':
//           sortBy = 'created_at';
//           sortDirection = 'desc';
//           break;
//         case 'dateAsc':
//           sortBy = 'created_at';
//           sortDirection = 'asc';
//           break;
//         default:
//           sortBy = 'name';
//           sortDirection = 'asc';
//       }

//       // Convert UI filters to service filters
//       const serviceFilters = {
//         query: searchTerm,
//         isActive: filters.status === 'all' ? undefined : filters.status === 'active',
//         sortBy,
//         sortDirection
//       };

//       const response = await getClients(serviceFilters, currentPage, itemsPerPage);
      
//       if (response.error) {
//         console.error('Error fetching clients:', response.error);
//         showToast('Failed to load clients', 'error');
//         return;
//       }

//       console.log('Fetched clients:', response.data); // Debug log
//       setClients(response.data);
//       setFilteredClients(response.data); // No need for local filtering since API handles it
      
//       // Update total pages based on the count from the response
//       const totalItems = response.count;
//       const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
//       if (currentPage > calculatedTotalPages) {
//         setCurrentPage(1);
//       }

//     } catch (error) {
//       console.error('Failed to fetch clients:', error);
//       showToast('Failed to load clients', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };
  

//   // Apply all filters, search, and sorting
//   const applyFilters = (clientList: Client[], search: string, filterOptions: ClientFiltersType) => {
//     let result = [...clientList];
    
//     // Apply search
//     if (search) {
//       const searchLower = search.toLowerCase();
//       result = result.filter(
//         client => 
//           client.name.toLowerCase().includes(searchLower) ||
//           client.email.toLowerCase().includes(searchLower) ||
//           client.company?.toLowerCase().includes(searchLower)
//       );
//     }
    
//     // Apply status filter
//     if (filterOptions.status !== 'all') {
//       result = result.filter(client => 
//         filterOptions.status === 'active' ? client.is_active : !client.is_active
//       );
//     }
    
//     // Apply date filter
//     if (filterOptions.dateAdded !== 'all') {
//       const now = new Date();
//       let compareDate = new Date();
      
//       switch (filterOptions.dateAdded) {
//         case 'last7days':
//           compareDate.setDate(now.getDate() - 7);
//           break;
//         case 'last30days':
//           compareDate.setDate(now.getDate() - 30);
//           break;
//         case 'last90days':
//           compareDate.setDate(now.getDate() - 90);
//           break;
//       }
      
//       result = result.filter(client => 
//         new Date(client.created_at) >= compareDate
//       );
//     }
    
//     // Apply sorting
//     switch (filterOptions.sortBy) {
//       case 'nameAsc':
//         result.sort((a, b) => a.name.localeCompare(b.name));
//         break;
//       case 'nameDesc':
//         result.sort((a, b) => b.name.localeCompare(a.name));
//         break;
//       case 'dateAsc':
//         result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
//         break;
//       case 'dateDesc':
//         result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
//         break;
//     }
    
//     setFilteredClients(result);
//   };

//   // Handle search input change
//   const handleSearch = (term: string) => {
//     setSearchTerm(term);
//     setCurrentPage(1);
//     applyFilters(clients, term, filters);
//   };

//   // Handle filter changes
//   const handleFilterChange = (newFilters: ClientFiltersType) => {
//     setFilters(newFilters);
//     setCurrentPage(1);
//     applyFilters(clients, searchTerm, newFilters);
//   };

//   // Handle select/deselect all clients
//   const handleSelectAll = (checked: boolean) => {
//     if (checked) {
//       const idsOnCurrentPage = paginatedClients.map(client => client.id);
//       setSelectedClients(idsOnCurrentPage);
//     } else {
//       setSelectedClients([]);
//     }
//   };

//   // Handle select/deselect individual client
//   const handleSelectClient = (clientId: string, checked: boolean) => {
//     if (checked) {
//       setSelectedClients([...selectedClients, clientId]);
//     } else {
//       setSelectedClients(selectedClients.filter(id => id !== clientId));
//     }
//   };

//   // Handle bulk status change (enable/disable selected clients)
//   const handleBulkStatusChange = async (setActive: boolean) => {
//     try {
//       await Promise.all(
//         selectedClients.map(id => updateClientStatus(id, setActive))
//       );
      
//       // Update local state
//       const updatedClients = clients.map(client => 
//         selectedClients.includes(client.id)
//           ? { ...client, isActive: setActive }
//           : client
//       );
      
//       setClients(updatedClients);
//       applyFilters(updatedClients, searchTerm, filters);
      
//       showToast(
//         `${selectedClients.length} clients ${setActive ? 'activated' : 'deactivated'} successfully`,
//         'success'
//       );
      
//       setSelectedClients([]);
//     } catch (error) {
//       console.error('Failed to update client status:', error);
//       showToast('Failed to update clients', 'error');
//     }
//   };

//   // Handle client deletion
//   const handleDeleteClient = async () => {
//     if (!clientToDelete) return;
    
//     try {
//       await deleteClient(clientToDelete);
      
//       // Update local state
//       const updatedClients = clients.filter(client => client.id !== clientToDelete);
//       setClients(updatedClients);
//       applyFilters(updatedClients, searchTerm, filters);
      
//       showToast('Client deleted successfully', 'success');
//     } catch (error) {
//       console.error('Failed to delete client:', error);
//       showToast('Failed to delete client', 'error');
//     } finally {
//       setClientToDelete(null);
//       setDeleteConfirmOpen(false);
//     }
//   };

//   // Confirm client deletion
//   const confirmDelete = (clientId: string) => {
//     setClientToDelete(clientId);
//     setDeleteConfirmOpen(true);
//   };

//   // Pagination
//   const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
//   const paginatedClients = useMemo(() => {
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     return filteredClients.slice(startIndex, startIndex + itemsPerPage);
//   }, [filteredClients, currentPage, itemsPerPage]);

//   return (
//     <div className="space-y-6">
//       {/* Delete confirmation dialog */}
//       <ConfirmDialog
//         isOpen={deleteConfirmOpen}
//         onClose={() => setDeleteConfirmOpen(false)}
//         onConfirm={handleDeleteClient}
//         title="Delete Client"
//         message="Are you sure you want to delete this client? This action cannot be undone and all associated data will be permanently removed."
//         confirmText="Delete"
//         cancelText="Cancel"
//         confirmVariant="danger"
//       />
      
//       {/* Header with actions */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-semibold">Client Management</h1>
//           <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
//             Manage your clients and notification preferences
//           </p>
//         </div>
//         <div className="flex flex-col sm:flex-row gap-2">
//           <Button 
//             variant="primary"
//             icon={<UserPlus size={16} />}
//             as={Link}
//             to="/clients/new"
//           >
//             Add Client
//           </Button>
//           <Button 
//             variant="secondary"
//             icon={<FileCog size={16} />}
//             as={Link}
//             to="/email"
//           >
//             Configure Emails
//           </Button>
//         </div>
//       </div>

//       {/* Search and filter bar */}
//       <Card>
//         <div className="flex flex-col md:flex-row md:items-center gap-4">
//           <div className="flex-1">
//             <SearchInput 
//               placeholder="Search clients by name, email, or company..."
//               value={searchTerm}
//               onChange={handleSearch}
//             />
//           </div>
//           <div className="flex items-center gap-2">
//             <Button
//               variant="outline"
//               icon={<Filter size={16} />}
//               onClick={() => setShowFilters(!showFilters)}
//             >
//               Filters
//             </Button>
//             <div className="flex items-center gap-2">
//               <Button
//                 variant="outline"
//                 icon={<Upload size={16} />}
//                 title="Import clients from CSV"
//               >
//                 Import
//               </Button>
//               <Button
//                 variant="outline"
//                 icon={<Download size={16} />}
//                 title="Export clients to CSV"
//               >
//                 Export
//               </Button>
//             </div>
//           </div>
//         </div>
        
//         {/* Filter panel (collapsible) */}
//         {showFilters && (
//           <div className="mt-4 pt-4 border-t dark:border-gray-700">
//             <ClientFilters 
//               filters={filters}
//               onChange={handleFilterChange}
//             />
//           </div>
//         )}
//       </Card>

//       {/* Client table with actions */}
//       <Card>
//         {loading ? (
//           <div className="py-12 flex justify-center">
//             <LoadingSpinner size="lg" />
//           </div>
//         ) : filteredClients.length === 0 ? (
//           <EmptyState
//   icon={<Users size={48} />}
//   title="No clients found"
//   description={
//     searchTerm || Object.values(filters).some(v => v !== 'all')
//       ? "Try adjusting your search or filters"
//       : "Get started by adding your first client"
//   }
//   actionText={searchTerm || Object.values(filters).some(v => v !== 'all') ? "Clear filters" : "Add client"}
//   onAction={searchTerm || Object.values(filters).some(v => v !== 'all')
//     ? () => {
//         setSearchTerm('');
//         setFilters({
//           status: 'all',
//           dateAdded: 'all',
//           sortBy: 'nameAsc'
//         });
//         applyFilters(clients, '', {
//           status: 'all',
//           dateAdded: 'all',
//           sortBy: 'nameAsc'
//         });
//       }
//     : () => { window.location.href = '/clients/new'; }
//   }
// />

//         ) : (
//           <>
//             {/* Bulk actions */}
//             {selectedClients.length > 0 && (
//               <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md flex flex-wrap items-center gap-2">
//                 <span className="text-sm font-medium pl-2">
//                   {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected
//                 </span>
//                 <div className="ml-auto flex flex-wrap gap-2">
//                   <Button
//                     size="sm"
//                     variant="success"
//                     onClick={() => handleBulkStatusChange(true)}
//                   >
//                     Enable Selected
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="danger"
//                     onClick={() => handleBulkStatusChange(false)}
//                   >
//                     Disable Selected
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="primary"
//                     as={Link}
//                     to={`/email?clients=${selectedClients.join(',')}`}
//                   >
//                     Email Selected
//                   </Button>
//                 </div>
//               </div>
//             )}
            
//             {/* Client table */}
//             <ClientTable 
//               clients={paginatedClients}
//               selectedClients={selectedClients}
//               onSelectClient={handleSelectClient}
//               onSelectAll={handleSelectAll}
//               onDelete={confirmDelete}
//             />
            
//             {/* Pagination */}
//             <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
//               <div className="text-sm text-gray-500 dark:text-gray-400">
//                 Showing {filteredClients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} clients
//               </div>
//               <Pagination 
//                 currentPage={currentPage}
//                 totalPages={totalPages}
//                 onPageChange={setCurrentPage}
//               />
//               <div className="flex items-center">
//                 <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Rows per page:</span>
//                 <select
//                   value={itemsPerPage}
//                   onChange={(e) => {
//                     setItemsPerPage(Number(e.target.value));
//                     setCurrentPage(1);
//                   }}
//                   className={`
//                     text-sm rounded-md border-gray-300 
//                     ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white text-gray-700'}
//                     focus:ring-blue-500 focus:border-blue-500
//                   `}
//                 >
//                   {[10, 25, 50, 100].map(value => (
//                     <option key={value} value={value}>{value}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </>
//         )}
//       </Card>
//     </div>
//   );
// };

// export default Clients;
