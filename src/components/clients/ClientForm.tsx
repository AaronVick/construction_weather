// src/components/clients/ClientForm.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { createClient, updateClient, getClient } from '../../services/clientService';

// Components

import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

// Types
import { Client, ClientFormData } from '../../types/client';

// Icons
import { Save, X, ArrowLeft, Building, User, Mail, Phone, MapPin, Check } from 'lucide-react';

interface ClientFormProps {
  clientId?: string;
  isEdit?: boolean;
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    console.error('Error fetching user:', error?.message);
    return null;
  }

  return data.user.id;
}

const ClientForm: React.FC<ClientFormProps> = ({ clientId, isEdit = false }) => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;

  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && clientId) {
      fetchClientData(clientId);
    }
  }, [clientId, isEdit]);

  const fetchClientData = async (id: string) => {
    try {
      setLoading(true);
      const client = await getClient(id);
  
      if (client) {
        setFormData({
          name: client.name,
          email: client.email,
          phone: client.phone || '',
          company: client.company || '',
          address: client.address || '',
          city: client.city || '',
          state: client.state || '',
          zip_code: client.zip_code || '',
          is_active: client.is_active,
          notes: client.notes || '',
          user_id: client.user_id, // ✅ Added to match ClientFormData
        });
      } else {
        showToast('Client not found', 'error');
        navigate('/clients');
      }
    } catch (error) {
      console.error('Error fetching client:', error);
      showToast('Failed to load client data', 'error');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Optional but validated if provided
    if (formData.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }
    
    if (formData.zip_code && !/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      newErrors.zip_code = 'Zip code is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }
  
    try {
      setSaving(true);
  
      // Ensure user_id is added before saving
      const userId = await getCurrentUserId(); // Function to fetch current user ID
  
      const clientData = { ...formData, user_id: userId };
  
      if (isEdit && clientId) {
        await updateClient(clientId, clientData);
        showToast('Client updated successfully', 'success');
      } else {
        await createClient(clientData);
        showToast('Client created successfully', 'success');
      }
  
      navigate('/clients');
    } catch (error) {
      console.error('Error saving client:', error);
      showToast(`Failed to ${isEdit ? 'update' : 'create'} client`, 'error');
    } finally {
      setSaving(false);
    }
  };
  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {isEdit ? 'Edit Client' : 'Add New Client'}
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {isEdit 
              ? 'Update client information and preferences' 
              : 'Create a new client to send weather notifications'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/clients')}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<Save size={16} />}
            onClick={handleSubmit}
            loading={saving}
            disabled={saving}
          >
            {isEdit ? 'Update Client' : 'Create Client'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <div className="grid grid-cols-1 gap-6">
            {/* Basic Information Section */}
            <div>
              <h2 className="text-lg font-medium mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Client Name<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`
                        block w-full pl-10 rounded-md shadow-sm text-sm
                        ${darkMode 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'}
                        ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
                      `}
                      placeholder="John Smith"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email Address<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`
                        block w-full pl-10 rounded-md shadow-sm text-sm
                        ${darkMode 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'}
                        ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
                      `}
                      placeholder="john.smith@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`
                        block w-full pl-10 rounded-md shadow-sm text-sm
                        ${darkMode 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'}
                        ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
                      `}
                      placeholder="(123) 456-7890"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-1">
                    Company Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className={`
                        block w-full pl-10 rounded-md shadow-sm text-sm
                        ${darkMode 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'}
                        focus:ring-blue-500 focus:border-blue-500
                      `}
                      placeholder="Acme Construction"
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className={`
                        h-4 w-4 rounded
                        ${darkMode 
                          ? 'bg-gray-800 border-gray-600 text-blue-500' 
                          : 'bg-white border-gray-300 text-blue-600'}
                        focus:ring-blue-500
                      `}
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm">
                      Active (will receive notifications)
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Address Section */}
            <div className="pt-4 border-t dark:border-gray-700">
              <h2 className="text-lg font-medium mb-4">Address Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`
                      block w-full rounded-md shadow-sm text-sm
                      ${darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'}
                      focus:ring-blue-500 focus:border-blue-500
                    `}
                    placeholder="123 Main St"
                  />
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`
                      block w-full rounded-md shadow-sm text-sm
                      ${darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'}
                      focus:ring-blue-500 focus:border-blue-500
                    `}
                    placeholder="New York"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`
                        block w-full rounded-md shadow-sm text-sm
                        ${darkMode 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'}
                        focus:ring-blue-500 focus:border-blue-500
                      `}
                      placeholder="NY"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium mb-1">
                      Zip Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="zip_code"
                        name="zipCode"
                        value={formData.zip_code}
                        onChange={handleInputChange}
                        className={`
                          block w-full pl-10 rounded-md shadow-sm text-sm
                          ${darkMode 
                            ? 'bg-gray-800 border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'}
                          ${errors.zip_code ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
                        `}
                        placeholder="10001"
                      />
                    </div>
                    {errors.zip_code && (
                      <p className="mt-1 text-sm text-red-500">{errors.zip_code}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Information */}
            <div className="pt-4 border-t dark:border-gray-700">
              <h2 className="text-lg font-medium mb-4">Additional Information</h2>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className={`
                    block w-full rounded-md shadow-sm text-sm
                    ${darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'}
                    focus:ring-blue-500 focus:border-blue-500
                  `}
                  placeholder="Add any additional notes about this client..."
                />
              </div>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default ClientForm;