// src/pages/dashboard/ClientDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useSubscription } from '../../hooks/useSubscription';
import { getClient, deleteClient, updateClientStatus } from '../../services/clientService';
import { getClientJobsites } from '../../services/jobsiteService';
import { getClientEmails } from '../../services/emailService';

// Components
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TabNavigation from '../../components/ui/TabNavigation';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Timeline from '../../components/ui/Timeline';
import JobsiteList from '../../components/jobsites/JobsiteList';
import EmailHistoryTable from '../../components/email/EmailHistoryTable';
import UpgradePrompt from '../../components/subscription/UpgradePrompt';

// Icons
import {
  Edit,
  Trash2,
  Mail,
  User,
  Building,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  AlertTriangle,
  ChevronLeft,
  Plus,
  Cloud
} from 'lucide-react';

// Types
import { ClientWithAssociations } from '../../types/client';
import { Jobsite } from '../../types/jobsite';
import { EmailLog } from '../../types/email';

type TabType = 'overview' | 'jobsites' | 'emails' | 'notes';

interface TimelineItem {
  id: string | number;
  title: string;
  description: string;
  icon: JSX.Element;
  timestamp: string;
  status?: 'pending' | 'error' | 'success' | 'warning' | 'info';
}

interface ClientDetailProps {
  isEdit?: boolean;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ isEdit = false }) => {

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const darkMode = theme ? theme.darkMode : false;
  const { showToast } = useToast();
  const { subscription } = useSubscription();
  const [client, setClient] = useState<ClientWithAssociations | null>(null);
  const [jobsites, setJobsites] = useState<Jobsite[]>([]);
  const [emailHistory, setEmailHistory] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const isPremium = subscription.plan === 'premium' || subscription.plan === 'enterprise';
  
  useEffect(() => {
    if (id) {
      fetchClientData(id);
    }
  }, [id]);

  const mapEmailStatusToTimelineStatus = (emailStatus: EmailLog['status']): TimelineItem['status'] => {
    switch (emailStatus) {
      case 'sent':
      case 'delivered':
        return 'success';
      case 'opened':
        return 'info';
      case 'pending':
        return 'pending';
      case 'failed':
        return 'error';
      default:
        return 'info';
    }
  };


  const fetchClientData = async (clientId: string) => {
    try {
      setLoading(true);
      const clientData = await getClient(clientId);
      setClient(clientData);
      
      // Fetch related data
      if (isPremium) {
        const jobsiteData = await getClientJobsites(clientId);
        setJobsites(jobsiteData);
      }
      
      const emailData = await getClientEmails(clientId);
      setEmailHistory(emailData);
    } catch (error) {
      console.error('Error fetching client data:', error);
      showToast('Failed to load client information', 'error');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!id) return;
    
    try {
      await deleteClient(id);
      showToast('Client deleted successfully', 'success');
      navigate('/clients');
    } catch (error) {
      console.error('Failed to delete client:', error);
      showToast('Failed to delete client', 'error');
    } finally {
      setDeleteDialogOpen(false);
    }
  };


  const toggleClientStatus = async () => {
    if (!client || !id) return;

    try {
        setStatusUpdateLoading(true);
        const newStatus = !client.is_active;
        
        // Ensure 'id' is a string and 'newStatus' is explicitly a boolean
        await updateClientStatus(String(id), Boolean(newStatus));

        setClient({
            ...client,
            is_active: newStatus
        });

        showToast(`Client ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (error) {
        console.error('Failed to update client status:', error);
        showToast('Failed to update client status', 'error');
    } finally {
        setStatusUpdateLoading(false);
    }
};


  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User size={16} /> },
    { 
      id: 'jobsites', 
      label: 'Jobsites', 
      icon: <MapPin size={16} />,
      disabled: !isPremium,
      tooltip: !isPremium ? 'Premium feature' : undefined
    },
    { id: 'emails', label: 'Email History', icon: <Mail size={16} /> }, // Missing closing bracket fixed
    { id: 'notes', label: 'Notes', icon: <FileText size={16} /> }
  ];
  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Client Not Found</h2>
        <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          The client you're looking for doesn't exist or has been deleted.
        </p>
        <Button
          as={Link}
          to="/clients"
          variant="primary"
          icon={<ChevronLeft size={16} />}
        >
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteClient}
        title="Delete Client"
        message={`Are you sure you want to delete ${client.name}? This action cannot be undone and all associated data will be permanently removed.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />
      
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          icon={<ChevronLeft size={16} />}
          as={Link}
          to="/clients"
          className="py-1"
        >
          Back to Clients
        </Button>
      </div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-center">
          <div className="mr-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              {client.company ? (
                <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              ) : (
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold">{client.name}</h1>
              <span className={`
                ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${client.is_active 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}
              `}>
                {client.is_active ? (
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
            </div>
            {client.company && (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {client.company}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            icon={<Mail size={16} />}
            as={Link}
            to={`/email?clients=${id}`}
          >
            Send Email
          </Button>
          <Button
            variant={client.is_active ? 'danger' : 'success'}
            icon={client.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
            onClick={toggleClientStatus}
            loading={statusUpdateLoading}
            disabled={statusUpdateLoading}
          >
            {client.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="primary"
            icon={<Edit size={16} />}
            as={Link}
            to={`/clients/${id}/edit`}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 size={16} />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="mt-6 border-b dark:border-gray-700">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as TabType)}
        />
      </div>
      
      {/* Tab Content */}
      <div className="py-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Client Information Card */}
            <Card className="md:col-span-2">
              <h2 className="text-lg font-medium mb-4">Client Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <h3 className="text-sm font-medium mb-1">Contact</h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <Mail className={`h-4 w-4 mt-0.5 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <a 
                          href={`mailto:${client.email}`}
                          className="text-sm hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {client.email}
                        </a>
                      </div>
                    </div>
                    
                    {client.phone && (
                      <div className="flex items-start">
                        <Phone className={`h-4 w-4 mt-0.5 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div>
                          <a 
                            href={`tel:${client.phone}`}
                            className="text-sm hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {client.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {client.company && (
                      <div className="flex items-start">
                        <Building className={`h-4 w-4 mt-0.5 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className="text-sm">{client.company}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {(client.address || client.city || client.state || client.zip_code) && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Address</h3>
                    <div className="flex items-start">
                      <MapPin className={`h-4 w-4 mt-0.5 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div className="text-sm">
                        {client.address && <div>{client.address}</div>}
                        {(client.city || client.state || client.zip_code) && (
                          <div>
                            {[
                              client.city,
                              client.state,
                              client.zip_code
                            ].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Stats</h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <Calendar className={`h-4 w-4 mt-0.5 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div className="text-sm">
                        Added: {new Date(client.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Mail className={`h-4 w-4 mt-0.5 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div className="text-sm">
                        Emails sent: {emailHistory.length}
                      </div>
                    </div>
                    
                    {isPremium && (
                      <div className="flex items-start">
                        <MapPin className={`h-4 w-4 mt-0.5 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div className="text-sm">
                          Jobsites: {jobsites.length}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      {client.is_active ? (
                        <CheckCircle className="h-4 w-4 mt-0.5 mr-2 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 mt-0.5 mr-2 text-red-500" />
                      )}
                      <div className="text-sm">
                        {client.is_active 
                          ? 'Active - Will receive notifications' 
                          : 'Inactive - Notifications disabled'
                        }
                      </div>
                    </div>
                    
                    {client.updated_at && (
                      <div className="flex items-start">
                        <Clock className={`h-4 w-4 mt-0.5 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div className="text-sm">
                          Last updated: {new Date(client.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Recent Activity Card */}
<Card>
  <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
  <Timeline 
    items={[
      ...emailHistory.slice(0, 3).map(email => {
        const status = mapEmailStatusToTimelineStatus(email.status);
        return {
          id: email.id,
          title: 'Email Sent',
          description: email.subject,
          icon: <Mail size={16} />,
          timestamp: email.sentAt,
          status // This is now properly typed from our mapper function
        };
      }),
      {
        id: 'client-created',
        title: 'Client Created',
        description: 'Added to the system',
        icon: <User size={16} />,
        timestamp: client.created_at,
        status: 'success' as const // Use const assertion to narrow the type
      }
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())}
  />
  <div className="mt-4 text-center">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setActiveTab('emails')}
    >
      View Full History
    </Button>
  </div>
</Card>
            
            {/* Notes Section */}
            <Card className="md:col-span-3">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Notes</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Edit size={14} />}
                  as={Link}
                  to={`/clients/${id}/edit`}
                >
                  Edit Notes
                </Button>
              </div>
              
              {client.notes ? (
                <div className={`p-4 rounded-md ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
                </div>
              ) : (
                <div className={`p-4 rounded-md text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No notes have been added for this client.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    icon={<Plus size={14} />}
                    as={Link}
                    to={`/clients/${id}/edit`}
                  >
                    Add Notes
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
        
        {/* Jobsites Tab */}
        {activeTab === 'jobsites' && (
          <>
            {!isPremium ? (
              <UpgradePrompt 
                title="Unlock Multiple Jobsites"
                description="Upgrade to our Premium plan to manage multiple jobsites per client and send location-specific notifications."
                features={[
                  'Manage up to 10 jobsites per client',
                  'Send jobsite-specific weather notifications',
                  'Assign workers to specific jobsites',
                  'Track weather conditions by location'
                ]}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium">Client Jobsites</h2>
                  <Button
                    variant="primary"
                    icon={<Plus size={16} />}
                    as={Link}
                    to={`/jobsites/new?client=${id}`}
                  >
                    Add Jobsite
                  </Button>
                </div>
                
                <JobsiteList 
                  jobsites={jobsites}
                  clientName={client.name}
                  emptyMessage="No jobsites have been added for this client yet."
                />
              </div>
            )}
          </>
        )}
        
        {/* Email History Tab */}
        {activeTab === 'emails' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Email History</h2>
              <Button
                variant="primary"
                icon={<Mail size={16} />}
                as={Link}
                to={`/email?clients=${id}`}
              >
                Send New Email
              </Button>
            </div>
            
            {emailHistory.length > 0 ? (
              <EmailHistoryTable emails={emailHistory} />
            ) : (
              <Card>
                <div className="text-center py-12">
                  <Mail size={40} className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <h3 className="text-lg font-medium mb-2">No emails sent yet</h3>
                  <p className={`max-w-md mx-auto mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No emails have been sent to this client yet. Send a test email or set up automated weather notifications.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="outline"
                      icon={<Mail size={16} />}
                      as={Link}
                      to={`/email?clients=${id}`}
                    >
                      Send Test Email
                    </Button>
                    <Button
                      variant="primary"
                      icon={<Cloud size={16} />}
                      as={Link}
                      to="/weather"
                    >
                      Configure Weather Alerts
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
        
        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Client Notes</h2>
              <Button
                variant="primary"
                icon={<Edit size={16} />}
                as={Link}
                to={`/clients/${id}/edit`}
              >
                Edit Notes
              </Button>
            </div>
            
            <Card>
              {client.notes ? (
                <div className="prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">{client.notes}</div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText size={40} className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <h3 className="text-lg font-medium mb-2">No notes added</h3>
                  <p className={`max-w-md mx-auto mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Add notes about this client to keep track of important information or special requirements.
                  </p>
                  <Button
                    variant="primary"
                    icon={<Plus size={16} />}
                    as={Link}
                    to={`/clients/${id}/edit`}
                  >
                    Add Notes
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetail;