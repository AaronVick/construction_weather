// src/types/worker.ts

export interface Worker {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface WorkerStats {
    total: number;
    active: number;
    assigned: number;
  }