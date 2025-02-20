// src/components/clients/ClientTable.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../../hooks/useTheme';
import { ClientWithAssociations } from '../../types/client';

// Icons
import { 
  Edit,
  Trash2, 
  Mail, 
  MapPin,
  CheckCircle,
  XCircle,
  ChevronRight,
  Building
} from 'lucide-react';

interface ClientTableProps {
  clients: ClientWithAssociations[];
  selectedClients: string[];
  onSelectClient: (clientId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDelete: (clientId: string) => void;
}

const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  selectedClients,
  onSelectClient,
  onSelectAll,
  onDelete
}) => {
  const { darkMode } = useTheme();
  const allSelected = clients.length > 0 && selectedClients.length === clients.length;
  const someSelected = selectedClients.length > 0 && selectedClients.length < clients.length;
  
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
        <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
          <tr>
            <th scope="col" className="px-4 py-3 w-10">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className={`
                    rounded border-gray-300 text-blue-600 
                    focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}
                  `}
                  checked={allSelected}
                  ref={input => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </div>
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Client
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Contact
            </th>
            <th scope="col" className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Jobsites
            </th>
            <th scope="col" className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Added
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {clients.map((client) => (
            <tr 
              key={client.id}
              className={`
                ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}
                transition-colors
              `}
            >
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className={`
                      rounded border-gray-300 text-blue-600 
                      focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}
                    `}
                    checked={selectedClients.includes(client.id)}
                    onChange={(e) => onSelectClient(client.id, e.target.checked)}
                  />
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    {client.company ? (
                      <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <Link 
                      to={`/clients/${client.id}`}
                      className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {client.name}
                    </Link>
                    {client.company && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {client.company}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${client.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}
                `}>
                  {client.isActive ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </span>
              </td>
              <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <a 
                    href={`mailto:${client.email}`}
                    className="text-sm text-gray-900 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
                  >
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    {client.email}
                  </a>
                  {client.phone && (
                    <a 
                      href={`tel:${client.phone}`}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mt-1"
                    >
                      {client.phone}
                    </a>
                  )}
                </div>
              </td>
              <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap">
                {client.jobsites && client.jobsites.length > 0 ? (
                  <Link
                    to={`/clients/${client.id}/jobsites`}
                    className="text-sm flex items-center hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {client.jobsites.length} jobsite{client.jobsites.length !== 1 ? 's' : ''}
                  </Link>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    No jobsites
                  </span>
                )}
              </td>
              <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                <div className="flex items-center justify-end space-x-2">
                  <Link
                    to={`/clients/${client.id}/edit`}
                    className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                    title="Edit client"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <Link
                    to={`/email?clients=${client.id}`}
                    className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                    title="Send email"
                  >
                    <Mail className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => onDelete(client.id)}
                    className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-500'} transition-colors`}
                    title="Delete client"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Link
                    to={`/clients/${client.id}`}
                    className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors hidden sm:block`}
                    title="View details"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientTable;