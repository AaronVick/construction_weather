// src/services/emailService.ts
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import { EmailFormData, EmailLog, EmailTemplate, EmailConfig } from '../types/email';
import { Client } from '../types/client';
import { Worker } from '../types/worker';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1';

/**
 * Fetches email logs for a specific client
 */
export async function getClientEmails(clientId: string, userId: string): Promise<EmailLog[]> {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', userId) // Filter by user_id
      .order('sent_at', { ascending: false });

    if (error) throw error;

    return data.map(formatEmailLog);
  } catch (error) {
    console.error('Error fetching client emails:', error);
    throw new Error('Failed to fetch email history');
  }
}

/**
 * Extracts variable placeholders from an email template string
 * For example: "Hello {name}, the weather at {jobsite} is {condition}"
 * would extract ["name", "jobsite", "condition"]
 */
function extractTemplateVariables(text: string): string[] {
  const regex = /\{([a-zA-Z0-9_]+)\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

/**
 * Fetches email templates for the logged-in user
 */
export async function getEmailTemplates(userId: string): Promise<EmailTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('user_id', userId) // Filter by user_id
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(formatEmailTemplate);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    throw new Error('Failed to fetch email templates');
  }
}

/**
 * Creates a new email template for the logged-in user
 */
export async function createEmailTemplate(template: {
  name: string;
  subject: string;
  body: string;
  user_id: string; // Added user_id
}): Promise<EmailTemplate> {
  try {
    // Extract variables from template
    const variables = extractTemplateVariables(template.subject + ' ' + template.body);
    
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        name: template.name,
        user_id: template.user_id, // Added user_id
        subject: template.subject,
        body: template.body,
        variables,
      })
      .select()
      .single();

    if (error) throw error;

    return formatEmailTemplate(data);
  } catch (error) {
    console.error('Error creating email template:', error);
    throw new Error('Failed to create email template');
  }
}

/**
 * Sends emails based on form data for the logged-in user
 */
export async function sendEmails(formData: EmailFormData): Promise<{
  successful: number;
  failed: number;
  logs: EmailLog[];
}> {
  try {
    // Get recipients
    let recipients: {id: string; email: string; name: string}[] = [];
    
    if (formData.recipients.type === 'clients') {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email')
        .in('id', formData.recipients.ids)
        .eq('is_active', true);
        
      if (error) throw error;
      recipients = data;
    } else {
      const { data, error } = await supabase
        .from('workers')
        .select('id, name, email')
        .in('id', formData.recipients.ids)
        .eq('is_active', true);
        
      if (error) throw error;
      recipients = data;
    }
    
    if (recipients.length === 0) {
      throw new Error('No active recipients found');
    }
    
    // Get email configuration for the logged-in user
    const { data: config, error: configError } = await supabase
      .from('system_settings')
      .select('email_config')
      .eq('user_id', formData.user_id) // Filter by user_id
      .single();
      
    if (configError) throw configError;
    
    const emailConfig = config.email_config;
    
    // Process emails with OpenAI if needed
    let subject = formData.subject;
    let body = formData.body;
    
    if (emailConfig.use_ai_enhancement) {
      const enhancedContent = await enhanceEmailContent(
        subject,
        body,
        emailConfig.tone,
        emailConfig.additional_instructions
      );
      subject = enhancedContent.subject;
      body = enhancedContent.body;
    }
    
    // Send emails to each recipient
    const results = await Promise.allSettled(
      recipients.map(recipient => sendSingleEmail(
        recipient,
        subject,
        body,
        formData.recipients.type,
        emailConfig,
        formData.scheduledFor,
        formData.user_id // Pass user_id
      ))
    );
    
    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    // Collect email logs
    const logs = results
      .map((result, index) => {
        const recipient = recipients[index];
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // Create failed log entry
          return {
            id: `failed-${Date.now()}-${index}`,
            clientId: formData.recipients.type === 'clients' ? recipient.id : null,
            clientName: formData.recipients.type === 'clients' ? recipient.name : null,
            workerId: formData.recipients.type === 'workers' ? recipient.id : null,
            workerName: formData.recipients.type === 'workers' ? recipient.name : null,
            subject,
            body,
            sentAt: new Date().toISOString(),
            status: 'failed',
            trigger: 'manual',
            errorMessage: result.reason?.message || 'Failed to send email',
            user_id: formData.user_id, // Added user_id
          };
        }
      });
    
    return {
      successful,
      failed,
      logs: logs as EmailLog[],
    };
  } catch (error) {
    console.error('Error sending emails:', error);
    throw new Error('Failed to send emails');
  }
}

/**
 * Sends a single email and logs it for the logged-in user
 */
async function sendSingleEmail(
  recipient: {id: string; email: string; name: string},
  subject: string,
  body: string,
  recipientType: 'clients' | 'workers',
  emailConfig: EmailConfig,
  scheduledFor?: string,
  userId?: string // Added user_id
): Promise<EmailLog> {
  try {
    // Replace variables in subject and body
    const personalizedSubject = replaceEmailVariables(subject, {
      name: recipient.name,
      date: new Date().toLocaleDateString(),
      company_name: emailConfig.senderName,
    });
    
    const personalizedBody = replaceEmailVariables(body, {
      name: recipient.name,
      date: new Date().toLocaleDateString(),
      company_name: emailConfig.senderName,
    });
    
    // Create log entry
    const logEntry = {
      client_id: recipientType === 'clients' ? recipient.id : null,
      worker_id: recipientType === 'workers' ? recipient.id : null,
      subject: personalizedSubject,
      body: personalizedBody,
      recipient_email: recipient.email,
      recipient_name: recipient.name,
      status: scheduledFor ? 'pending' : 'sent',
      scheduled_for: scheduledFor,
      trigger: 'manual',
      sent_at: scheduledFor || new Date().toISOString(),
      user_id: userId, // Added user_id
    };
    
    const { data, error } = await supabase
      .from('email_logs')
      .insert(logEntry)
      .select()
      .single();
      
    if (error) throw error;
    
    return formatEmailLog(data);
  } catch (error) {
    console.error('Error sending single email:', error);
    throw new Error(`Failed to send email to ${recipient.email}: ${(error as Error).message}`);
  }
}

/**
 * Replaces variables in email templates
 */
function replaceEmailVariables(text: string, variables: Record<string, any>): string {
  let result = text;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value?.toString() || '');
  });
  
  return result;
}

/**
 * Enhances email content using OpenAI
 */
async function enhanceEmailContent(
  subject: string,
  body: string,
  tone: string,
  additionalInstructions: string
): Promise<{ subject: string; body: string }> {
  try {
    const prompt = `
      Please enhance the following email while maintaining its core message and intent.
      Use a ${tone} tone and ensure the content is professional and well-structured.
      
      Original subject: ${subject}
      
      Original body:
      ${body}
      
      Additional instructions:
      ${additionalInstructions}
      
      Respond in JSON format with 'subject' and 'body' keys.
    `;

    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email writer that improves emails while keeping the original intent.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const enhancedContent = JSON.parse(response.data.choices[0].message.content);
    return {
      subject: enhancedContent.subject || subject,
      body: enhancedContent.body || body,
    };
  } catch (error) {
    console.error('Error enhancing email content:', error);
    // Return original content if enhancement fails
    return { subject, body };
  }
}

/**
 * Formats email log data from database
 */
function formatEmailLog(data: any): EmailLog {
  return {
    id: data.id,
    clientId: data.client_id,
    clientName: data.recipient_name,
    workerId: data.worker_id,
    workerName: data.recipient_name,
    subject: data.subject,
    body: data.body,
    sentAt: data.sent_at,
    status: data.status,
    trigger: data.trigger,
    weatherCondition: data.weather_condition,
    errorMessage: data.error_message,
    user_id: data.user_id, // Added user_id
  };
}

/**
 * Formats email template data from database
 */
function formatEmailTemplate(data: any): EmailTemplate {
  return {
    id: data.id,
    name: data.name,
    subject: data.subject,
    body: data.body,
    variables: data.variables || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    user_id: data.user_id, // Added user_id
  };
}