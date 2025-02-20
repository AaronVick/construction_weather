// src/types/client.ts

import { Jobsite } from './jobsite';
import { EmailLog } from './email';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
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
  zipCode?: string;
  isActive: boolean;
  notes?: string;
}

export interface ClientFilters {
  status: 'all' | 'active' | 'inactive';
  dateAdded: 'all' | 'last7days' | 'last30days' | 'last90days';
  sortBy: 'nameAsc' | 'nameDesc' | 'dateAsc' | 'dateDesc';
}