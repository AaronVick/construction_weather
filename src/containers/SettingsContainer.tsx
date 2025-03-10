import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { db, handleFirebaseError } from '../lib/firebaseClient';
import AccountSettings from '../components/settings/AccountSettings';
import { UserProfileFormData } from '../types/user';
import { useTheme } from '../contexts/ThemeContext';

const SettingsContainer: React.FC = () => {
  const { user, isAuthenticated } = useFirebaseAuth();
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<UserProfileFormData>({
    full_name: '',
    email: user?.email || '',
    zip_code: '',
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) return;
      
      try {
        const userProfileDoc = await getDoc(
          doc(db, 'user_profiles', user.uid)
        );
        
        if (userProfileDoc.exists()) {
          const userData = userProfileDoc.data();
          setFormData({
            full_name: userData?.full_name || '',
            email: userData?.email || user.email || '',
            zip_code: userData?.zip_code || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        const errorInfo = handleFirebaseError(error);
        toast.error(errorInfo.message || 'Failed to load user profile');
      }
    };

    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [user, isAuthenticated]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!user?.uid) {
      toast.error('You must be logged in to save settings');
      return;
    }

    try {
      setLoading(true);
      
      // Reference to user profile document
      const userProfileRef = doc(db, 'user_profiles', user.uid);
      
      // Check if profile exists
      const profileDoc = await getDoc(userProfileRef);
      
      const profileData = {
        full_name: formData.full_name,
        zip_code: formData.zip_code,
        updated_at: new Date().toISOString()
      };
      
      if (profileDoc.exists()) {
        // Update existing profile
        await updateDoc(userProfileRef, profileData);
      } else {
        // Create new profile with all required fields
        await setDoc(userProfileRef, {
          ...profileData,
          user_id: user.uid,
          email: user.email,
          created_at: new Date().toISOString()
        });
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      const errorInfo = handleFirebaseError(error);
      toast.error(errorInfo.message || 'Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Account Settings
      </h1>
      
      <AccountSettings
        darkMode={darkMode}
        formData={formData}
        loading={loading}
        handleInputChange={handleInputChange}
        handleSaveProfile={handleSaveProfile}
      />
      
      {/* Other settings components can be added here */}
    </div>
  );
};

export default SettingsContainer;