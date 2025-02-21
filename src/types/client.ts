// src/types/client.ts

import { Jobsite } from './jobsite';
import { EmailLog } from './email';

export interface Client {
  id: string;
  name: string;       // Required in schema
  email: string;      // Required in schema
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;  
  is_active: boolean; // Required in schema
  notes?: string;
  created_at: string; 
  updated_at?: string; 
  user_id: string;    
}

export interface ClientWithAssociations extends Client {
  jobsites?: Jobsite[];
  emailHistory?: EmailLog[];
}

export interface ClientFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;  
  is_active: boolean; 
  notes?: string;
  user_id?: string;  // ✅ Added to match `Client`
}



export interface ClientFilters {
  status: 'all' | 'active' | 'inactive';
  dateAdded: 'all' | 'last7days' | 'last30days' | 'last90days';
  sortBy: 'nameAsc' | 'nameDesc' | 'dateAsc' | 'dateDesc';
}



export interface ClientStats {
  total: number;
  active: number;
  inactive: number;
  recentlyAdded: number;
}