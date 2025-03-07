// src/pages/dashboard/Settings.tsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useToast } from '../../hooks/useToast';
import { db, auth } from '../../lib/firebaseClient';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, updatePassword, signOut } from 'firebase/auth';
import { SettingsTab, SettingsFormData, UserProfile } from '../../components/settings/types';

// Import components
import SettingsSidebar from '../../components/settings/SettingsSidebar';
import AccountSettings from '../../components/settings/AccountSettings';
import NotificationSettings from '../../components/settings/NotificationSettings';
import SecuritySettings from '../../components/settings/SecuritySettings';
import AppearanceSettings from '../../components/settings/AppearanceSettings';

const Settings: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useFirebaseAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<SettingsFormData>({
    full_name: user?.displayName || '',
    email: user?.email || '',
    zip_code: '',
    notification_email: true,
    notification_summary: false,
    notification_marketing: false,
    current_password: '',
    new_password: '',
    confirm_password: '',
    time_format: '12h',
    temp_unit: 'F',
    language: 'en'
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const profileQuery = query(
          collection(db, 'user_profiles'),
          where('user_id', '==', user.uid)
        );

        const querySnapshot = await getDocs(profileQuery);
        
        if (!querySnapshot.empty) {
          const profileData = querySnapshot.docs[0].data() as UserProfile;
          profileData.id = querySnapshot.docs[0].id;
          setUserProfile(profileData);
          
          // Update form data with profile information
          setFormData(prev => ({
            ...prev,
            full_name: user.displayName || '',
            email: user.email || '',
            zip_code: profileData.zip_code || '',
            notification_email: profileData.notification_channels?.email || true,
            notification_summary: profileData.notification_channels?.summary || false,
            notification_marketing: profileData.notification_channels?.marketing || false,
            time_format: profileData.preferences?.time_format || '12h',
            temp_unit: profileData.preferences?.temp_unit || 'F',
            language: profileData.preferences?.language || 'en'
          }));
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Handle input changes for form fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target as HTMLInputElement;
    const fieldName = id === 'full-name' ? 'full_name' : 
                     id === 'zip-code' ? 'zip_code' : id;
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Handle user sign out
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      showToast('Failed to sign out', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save user profile information
  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Update display name in Firebase Auth
      await updateProfile(user, {
        displayName: formData.full_name
      });

      // Get or create user profile document
      const profileQuery = query(
        collection(db, 'user_profiles'),
        where('user_id', '==', user.uid)
      );

      const querySnapshot = await getDocs(profileQuery);
      
      const profileData = {
        full_name: formData.full_name,
        zip_code: formData.zip_code,
        user_id: user.uid,
        notification_channels: {
          email: formData.notification_email,
          summary: formData.notification_summary,
          marketing: formData.notification_marketing
        },
        updated_at: serverTimestamp()
      };

      if (querySnapshot.empty) {
        // Create new profile
        await setDoc(doc(collection(db, 'user_profiles')), {
          ...profileData,
          created_at: serverTimestamp()
        });
      } else {
        // Update existing profile
        const profileDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'user_profiles', profileDoc.id), profileData);
      }

      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update user password
  const handleUpdatePassword = async () => {
    if (formData.new_password !== formData.confirm_password) {
      showToast('New passwords do not match', 'error');
      return;
    }

    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      await updatePassword(user, formData.new_password);

      showToast('Password updated successfully', 'success');
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch (error) {
      console.error('Error updating password:', error);
      showToast('Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save user notification preferences
  const handleSaveNotifications = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const profileQuery = query(
        collection(db, 'user_profiles'),
        where('user_id', '==', user.uid)
      );

      const querySnapshot = await getDocs(profileQuery);
      
      if (querySnapshot.empty) {
        // Create new profile with notification settings
        await setDoc(doc(collection(db, 'user_profiles')), {
          user_id: user.uid,
          notification_channels: {
            email: formData.notification_email,
            summary: formData.notification_summary,
            marketing: formData.notification_marketing
          },
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      } else {
        // Update existing profile
        const profileDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'user_profiles', profileDoc.id), {
          notification_channels: {
            email: formData.notification_email,
            summary: formData.notification_summary,
            marketing: formData.notification_marketing
          },
          updated_at: serverTimestamp()
        });
      }

      showToast('Notification preferences updated', 'success');
    } catch (error) {
      console.error('Error updating notifications:', error);
      showToast('Failed to update notification preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save user appearance settings
  const handleSaveAppearance = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const profileQuery = query(
        collection(db, 'user_profiles'),
        where('user_id', '==', user.uid)
      );

      const querySnapshot = await getDocs(profileQuery);
      
      if (querySnapshot.empty) {
        // Create new profile with appearance settings
        await setDoc(doc(collection(db, 'user_profiles')), {
          user_id: user.uid,
          preferences: {
            time_format: formData.time_format,
            temp_unit: formData.temp_unit,
            language: formData.language
          },
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      } else {
        // Update existing profile
        const profileDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'user_profiles', profileDoc.id), {
          preferences: {
            time_format: formData.time_format,
            temp_unit: formData.temp_unit,
            language: formData.language
          },
          updated_at: serverTimestamp()
        });
      }

      showToast('Appearance settings updated', 'success');
    } catch (error) {
      console.error('Error updating appearance settings:', error);
      showToast('Failed to update appearance settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Common props for all settings components
  const settingsProps = {
    darkMode,
    formData,
    loading,
    handleInputChange,
    handleSaveProfile,
    handleSaveNotifications,
    handleUpdatePassword,
    handleSaveAppearance,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          Manage your account settings and preferences
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <SettingsSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleSignOut={handleSignOut}
          loading={loading}
          darkMode={darkMode}
        />
        
        {/* Main Content */}
        <div className="md:col-span-3 space-y-6">
          {activeTab === 'account' && <AccountSettings {...settingsProps} />}
          {activeTab === 'notifications' && <NotificationSettings {...settingsProps} />}
          {activeTab === 'security' && <SecuritySettings {...settingsProps} />}
          {activeTab === 'appearance' && (
            <AppearanceSettings {...settingsProps} toggleDarkMode={toggleDarkMode} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
