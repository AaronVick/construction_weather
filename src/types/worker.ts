// src/types/worker.ts

export interface Worker {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string; // Schema shows as 'role'
  is_active: boolean;
  emergency_contact?: any; 
  notes?: string;    
  created_at: string;
  updated_at?: string;
  user_id: string;   
}

  export interface WorkerStats {
    total: number;
    active: number;
    assigned: number;
  }