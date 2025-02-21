export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  createdAt: string;
  updatedAt?: string;
  user_id: string; // Added to link templates to the logged-in user
}

export interface EmailLog {
  id: string;
  clientId?: string | null;
  clientName?: string | null;
  workerId?: string | null;
  workerName?: string | null;
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'pending' | 'delivered' | 'opened';
  trigger: 'manual' | 'weather' | 'scheduled';
  weatherCondition?: string;
  errorMessage?: string;
  user_id: string; // Added to link email logs to the logged-in user
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
  user_id: string; // Added to link email config to the logged-in user
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
  user_id: string; // Added to link form data to the logged-in user
}