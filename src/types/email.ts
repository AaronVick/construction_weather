// src/types/email.ts  
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  createdAt: string;
  updatedAt?: string;
}
   
export interface EmailLog {
  id: string;
  clientId?: string | null;
  clientName?: string | null;
  workerId?: string | null;  // Added to support worker emails
  workerName?: string | null; // Added to support worker emails
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'pending' | 'delivered' | 'opened';
  trigger: 'manual' | 'weather' | 'scheduled';
  weatherCondition?: string;
  errorMessage?: string;
}
   
export interface EmailConfig {
  senderName: string;
  senderEmail: string;
  tone: 'professional' | 'casual' | 'friendly' | 'urgent';
  includeWeatherDetails: boolean;
  subjectTemplate: string;
  bodyTemplate: string;
  temperature: number; // ChatGPT temperature (0-1)
  maxTokens: number;
  additionalInstructions: string;
}
   
export interface EmailFormData {
  recipients: {
    type: 'clients' | 'workers';
    ids: string[];
  };
  templateId?: string;
  subject: string;
  body: string;
  includeWeatherDetails: boolean;
  scheduledFor?: string;
  saveAsTemplate?: boolean;
  templateName?: string;
}