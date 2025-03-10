// src/pages/admin/Settings.tsx
import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { Box, Tabs, Tab, Paper } from '@mui/material';

// Import settings components
import GeneralSettings from '../../components/admin/settings/GeneralSettings';
import BillingSettings from '../../components/admin/settings/BillingSettings';
import EmailSettings from '../../components/admin/settings/EmailSettings';
import SecuritySettings from '../../components/admin/settings/SecuritySettings';
import AdminUsersSettings from '../../components/admin/settings/AdminUsersSettings';

// Import testing components
import EmailTesting from '../admin/EmailTesting';
import WeatherTesting from '../admin/WeatherTesting';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const AdminSettings: React.FC = () => {
  const { isLoading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<number>(0);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  if (adminLoading) {
    return <LoadingScreen />;
  }
  
  // Add console logging to help debug
  console.log('AdminSettings - Rendering with activeTab:', activeTab);
  
  // Define tabs with their labels
  const tabs = [
    { label: "General", id: "settings-tab-0", component: <GeneralSettings /> },
    { label: "Billing & Subscriptions", id: "settings-tab-1", component: <BillingSettings /> },
    { label: "Email", id: "settings-tab-2", component: <EmailSettings /> },
    { label: "Security", id: "settings-tab-3", component: <SecuritySettings /> },
    { label: "Admin Users", id: "settings-tab-4", component: <AdminUsersSettings /> },
    { label: "Email Testing", id: "settings-tab-5", component: <EmailTesting /> },
    { label: "Weather Testing", id: "settings-tab-6", component: <WeatherTesting /> }
  ];
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="admin settings tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={tab.id}
              label={tab.label} 
              id={tab.id} 
              aria-controls={`settings-tabpanel-${index}`} 
            />
          ))}
        </Tabs>
      </Box>
      
      <Paper elevation={2}>
        {tabs.map((tab, index) => (
          <TabPanel key={`panel-${index}`} value={activeTab} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Paper>
    </Box>
  );
};

export default AdminSettings;
