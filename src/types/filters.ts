// src/types/filters.ts

export interface ClientFiltersType {
    status: 'all' | 'active' | 'inactive';
    dateAdded: 'all' | 'last7days' | 'last30days' | 'last90days';
    sortBy: 'nameAsc' | 'nameDesc' | 'dateAsc' | 'dateDesc';
  }
  
  export interface WorkerFiltersType {
    status: 'all' | 'active' | 'inactive';
    jobsite: string | 'all'; // jobsite ID or 'all'
    dateAdded: 'all' | 'last7days' | 'last30days' | 'last90days';
    sortBy: 'nameAsc' | 'nameDesc' | 'dateAsc' | 'dateDesc';
  }
  
  export interface JobsiteFiltersType {
    clientId: string | 'all';
    status: 'all' | 'active' | 'inactive';
    weatherMonitoring: 'all' | 'enabled' | 'disabled';
    sortBy: 'nameAsc' | 'nameDesc' | 'dateAsc' | 'dateDesc';
  }
  
  export interface EmailFiltersType {
    status: 'all' | 'sent' | 'delivered' | 'opened' | 'failed' | 'pending';
    recipient: 'all' | 'clients' | 'workers';
    timePeriod: 'all' | 'today' | 'last7days' | 'last30days' | 'last90days';
    sortBy: 'dateDesc' | 'dateAsc' | 'recipientAsc' | 'recipientDesc' | 'statusAsc' | 'statusDesc';
  }