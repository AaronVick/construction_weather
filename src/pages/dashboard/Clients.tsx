// src/pages/dashboard/Clients.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { getClients, updateClientStatus, deleteClient } from '../../services/clientService';

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

// Icons
import { Plus, UserPlus, FileCog, Upload, Download, Trash2, Users, Filter } from 'lucide-react';

// Types
import { Client } from '../../types/client';
import { ClientFiltersType } from '../../types/filters';

const Clients: React.FC = () => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
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

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const fetchedClients = await getClients();
      setClients(fetchedClients);
      applyFilters(fetchedClients, searchTerm, filters);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      showToast('Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters, search, and sorting
  const applyFilters = (clientList: Client[], search: string, filterOptions: ClientFiltersType) => {
    let result = [...clientList];
    
    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        client => 
          client.name.toLowerCase().includes(searchLower) ||
          client.email.toLowerCase().includes(searchLower) ||
          client.company?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (filterOptions.status !== 'all') {
      result = result.filter(client => 
        filterOptions.status === 'active' ? client.isActive : !client.isActive
      );
    }
    
    // Apply date filter
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
        new Date(client.createdAt) >= compareDate
      );
    }
    
    // Apply sorting
    switch (filterOptions.sortBy) {
      case 'nameAsc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'dateAsc':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'dateDesc':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    
    setFilteredClients(result);
  };

  // Handle search input change
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    applyFilters(clients, term, filters);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: ClientFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
    applyFilters(clients, searchTerm, newFilters);
  };

  // Handle select/deselect all clients
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const idsOnCurrentPage = paginatedClients.map(client => client.id);
      setSelectedClients(idsOnCurrentPage);
    } else {
      setSelectedClients([]);
    }
  };

  // Handle select/deselect individual client
  const handleSelectClient = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClients([...selectedClients, clientId]);
    } else {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    }
  };

  // Handle bulk status change (enable/disable selected clients)
  const handleBulkStatusChange = async (setActive: boolean) => {
    try {
      await Promise.all(
        selectedClients.map(id => updateClientStatus(id, setActive))
      );
      
      // Update local state
      const updatedClients = clients.map(client => 
        selectedClients.includes(client.id)
          ? { ...client, isActive: setActive }
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

  // Handle client deletion
  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    
    try {
      await deleteClient(clientToDelete);
      
      // Update local state
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

  // Confirm client deletion
  const confirmDelete = (clientId: string) => {
    setClientToDelete(clientId);
    setDeleteConfirmOpen(true);
  };

  // Pagination
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
            as={Link}
            to="/clients/new"
          >
            Add Client
          </Button>
          <Button 
            variant="secondary"
            icon={<FileCog size={16} />}
            as={Link}
            to="/email"
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
        
        {/* Filter panel (collapsible) */}
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
            actionIcon={searchTerm || Object.values(filters).some(v => v !== 'all') ? <Filter size={16} /> : <Plus size={16} />}
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
              : () => { window.location.href = '/clients/new'; }
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
                    as={Link}
                    to={`/email?clients=${selectedClients.join(',')}`}
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