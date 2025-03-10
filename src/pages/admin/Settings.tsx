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
          <Tab label="General" id="settings-tab-0" aria-controls="settings-tabpanel-0" />
          <Tab label="Billing & Subscriptions" id="settings-tab-1" aria-controls="settings-tabpanel-1" />
          <Tab label="Email" id="settings-tab-2" aria-controls="settings-tabpanel-2" />
          <Tab label="Security" id="settings-tab-3" aria-controls="settings-tabpanel-3" />
          <Tab label="Admin Users" id="settings-tab-4" aria-controls="settings-tabpanel-4" />
          <Tab label="Email Testing" id="settings-tab-5" aria-controls="settings-tabpanel-5" />
          <Tab label="Weather Testing" id="settings-tab-6" aria-controls="settings-tabpanel-6" />
        </Tabs>
      </Box>
      
      <Paper elevation={2}>
        <TabPanel value={activeTab} index={0}>
          <GeneralSettings />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <BillingSettings />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <EmailSettings />
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <SecuritySettings />
        </TabPanel>
        
        <TabPanel value={activeTab} index={4}>
          <AdminUsersSettings />
        </TabPanel>
        
        <TabPanel value={activeTab} index={5}>
          <EmailTesting />
        </TabPanel>
        
        <TabPanel value={activeTab} index={6}>
          <WeatherTesting />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminSettings;
