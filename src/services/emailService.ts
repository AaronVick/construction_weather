// src/services/emailService.ts
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import { EmailFormData, EmailLog, EmailTemplate } from '../types/email';
import { Client } from '../types/client';
import { Worker } from '../types/worker';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1';

/**
 * Fetches email logs for a specific client
 */
export async function getClientEmails(clientId: string): Promise<EmailLog[]> {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('client_id', clientId)
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
 * Fetches email templates
 */
export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(formatEmailTemplate);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    throw new Error('Failed to fetch email templates');
  }
}

/**
 * Creates a new email template
 */
export async function createEmailTemplate(template: {
  name: string;
  subject: string;
  body: string;
}): Promise<EmailTemplate> {
  try {
    // Extract variables from template
    const variables = extractTemplateVariables(template.subject + ' ' + template.body);
    
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        name: template.name,
        user_id: user.id,
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
 * Sends emails based on form data
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
    
    // Get email configuration
    const { data: config, error: configError } = await supabase
      .from('system_settings')
      .select('email_config')
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
        formData.scheduledFor
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
 * Sends weather notification emails based on jobsite check
 */
export async function sendWeatherNotifications(
  jobsiteId: string,
  conditions: string[],
  weatherDescription: string
): Promise<{
  clientsNotified: number;
  workersNotified: number;
  logs: EmailLog[];
}> {
  try {
    // Get jobsite data with client and workers
    const { data: jobsite, error: jobsiteError } = await supabase
      .from('jobsites')
      .select(`
        *,
        clients:client_id (id, name, email, is_active),
        assigned_workers:worker_jobsites (
          workers:worker_id (id, name, email, is_active)
        )
      `)
      .eq('id', jobsiteId)
      .single();
      
    if (jobsiteError) throw jobsiteError;
    
    // Check if notification settings are enabled
    const notificationSettings = jobsite.weather_monitoring.notification_settings;
    if (!notificationSettings.notify_client && !notificationSettings.notify_workers) {
      return { clientsNotified: 0, workersNotified: 0, logs: [] };
    }
    
    // Get email configuration
    const { data: config, error: configError } = await supabase
      .from('system_settings')
      .select('email_config')
      .single();
      
    if (configError) throw configError;
    
    const emailConfig = config.email_config;
    
    // Generate email content
    const emailContent = await generateWeatherNotificationEmail(
      jobsite.name,
      conditions,
      weatherDescription,
      emailConfig
    );
    
    const logs: EmailLog[] = [];
    let clientsNotified = 0;
    let workersNotified = 0;
    
    // Send to client if active and notification enabled
    if (
      notificationSettings.notify_client &&
      jobsite.clients.is_active
    ) {
      try {
        const log = await sendSingleEmail(
          {
            id: jobsite.clients.id,
            name: jobsite.clients.name,
            email: jobsite.clients.email,
          },
          emailContent.subject,
          emailContent.body,
          'clients',
          emailConfig
        );
        
        logs.push(log);
        clientsNotified++;
      } catch (error) {
        console.error('Error sending client notification:', error);
        // Add failed log
        logs.push({
          id: `failed-client-${Date.now()}`,
          clientId: jobsite.clients.id,
          clientName: jobsite.clients.name,
          subject: emailContent.subject,
          body: emailContent.body,
          sentAt: new Date().toISOString(),
          status: 'failed',
          trigger: 'weather',
          weatherCondition: conditions.join(', '),
          errorMessage: (error as Error).message,
        });
      }
    }
    
    // Send to workers if active and notification enabled
    if (notificationSettings.notify_workers) {
      const activeWorkers = jobsite.assigned_workers
        .map((assignment: any) => assignment.workers)
        .filter((worker: Worker) => worker.is_active);
        
      for (const worker of activeWorkers) {
        try {
          const log = await sendSingleEmail(
            {
              id: worker.id,
              name: worker.name,
              email: worker.email,
            },
            emailContent.subject,
            emailContent.body,
            'workers',
            emailConfig
          );
          
          logs.push(log);
          workersNotified++;
        } catch (error) {
          console.error('Error sending worker notification:', error);
          // Add failed log
          logs.push({
            id: `failed-worker-${Date.now()}-${worker.id}`,
            workerId: worker.id,
            workerName: worker.name,
            subject: emailContent.subject,
            body: emailContent.body,
            sentAt: new Date().toISOString(),
            status: 'failed',
            trigger: 'weather',
            weatherCondition: conditions.join(', '),
            errorMessage: (error as Error).message,
          });
        }
      }
    }
    
    return {
      clientsNotified,
      workersNotified,
      logs,
    };
  } catch (error) {
    console.error('Error sending weather notifications:', error);
    throw new Error('Failed to send weather notifications');
  }
}

/**
 * Sends a single email and logs it
 */
async function sendSingleEmail(
  recipient: {id: string; email: string; name: string},
  subject: string,
  body: string,
  recipientType: 'clients' | 'workers',
  emailConfig: any,
  scheduledFor?: string
): Promise<EmailLog> {
  try {
    // Replace variables in subject and body
    const personalizedSubject = replaceEmailVariables(subject, {
      name: recipient.name,
      date: new Date().toLocaleDateString(),
      company_name: emailConfig.sender_name,
    });
    
    const personalizedBody = replaceEmailVariables(body, {
      name: recipient.name,
      date: new Date().toLocaleDateString(),
      company_name: emailConfig.sender_name,
    });
    
    // Send email logic would go here (using a service like SendGrid, Mailgun, etc.)
    // For now, we'll just simulate sending and log it
    
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
 * Generates weather notification email
 */
async function generateWeatherNotificationEmail(
  jobsiteName: string,
  conditions: string[],
  weatherDescription: string,
  emailConfig: any
): Promise<{ subject: string; body: string }> {
  try {
    const conditionsText = conditions.join(', ');
    const date = new Date().toLocaleDateString();
    
    const prompt = `
      Create a professional email notifying recipients that outdoor work at the ${jobsiteName} jobsite 
      has been canceled due to ${conditionsText} weather conditions on ${date}.
      
      Weather description:
      ${weatherDescription}
      
      The email should:
      1. Have a clear subject line
      2. Briefly explain why work is canceled
      3. Include the weather description
      4. Mention that recipients will be notified when work resumes
      5. Use a ${emailConfig.tone} tone
      6. Be concise and professional
      7. Sign off as ${emailConfig.sender_name}
      
      ${emailConfig.additional_instructions}
      
      Respond in JSON format with 'subject' and 'body' keys.
    `;

    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing clear, professional workplace communications.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const emailContent = JSON.parse(response.data.choices[0].message.content);
    return {
      subject: emailContent.subject,
      body: emailContent.body,
    };
  } catch (error) {
    console.error('Error generating weather notification email:', error);
    
    // Fallback if API call fails
    const subject = `Weather Alert: Work Canceled at ${jobsiteName} for ${new Date().toLocaleDateString()}`;
    const body = `
      Due to ${conditions.join(', ')} conditions, all work at ${jobsiteName} has been canceled for today.
      
      ${weatherDescription}
      
      You will be notified when work resumes. Please contact your supervisor if you have any questions.
      
      Stay safe,
      ${emailConfig.sender_name}
    `;
    
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
  };
}