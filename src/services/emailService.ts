// src/services/emailService.ts
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebaseClient';
import { EmailTemplate, EmailLog } from '../types/email';

/**
 * Get all email templates for the current user
 */
export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const templatesQuery = query(
      collection(db, 'email_templates'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(templatesQuery);
    
    const templates: EmailTemplate[] = [];
    querySnapshot.forEach((doc) => {
      templates.push(formatEmailTemplate({
        id: doc.id,
        ...doc.data()
      }));
    });
    
    return templates;
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return [];
  }
}

/**
 * Get a single email template by ID
 */
export async function getEmailTemplate(id: string): Promise<EmailTemplate | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const templateRef = doc(db, 'email_templates', id);
    const templateDoc = await getDoc(templateRef);
    
    if (!templateDoc.exists()) {
      throw new Error('Email template not found');
    }
    
    const templateData = templateDoc.data();
    
    // Verify the template belongs to the current user
    if (templateData.user_id !== user.uid) {
      throw new Error('Unauthorized access to email template');
    }

    return formatEmailTemplate({
      id: templateDoc.id,
      ...templateData
    });
  } catch (error) {
    console.error(`Error fetching email template ${id}:`, error);
    return null;
  }
}

/**
 * Create a new email template
 */
export async function createEmailTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const templateData = {
      ...template,
      user_id: user.uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'email_templates'), templateData);
    
    // Get the newly created document
    const newTemplateDoc = await getDoc(docRef);
    if (!newTemplateDoc.exists()) {
      throw new Error('Failed to retrieve created email template');
    }
    
    return formatEmailTemplate({
      id: newTemplateDoc.id,
      ...newTemplateDoc.data()
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    return null;
  }
}

/**
 * Update an email template
 */
export async function updateEmailTemplate(
  id: string,
  updates: Partial<Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>>
): Promise<EmailTemplate | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const templateRef = doc(db, 'email_templates', id);
    
    // Verify ownership before update
    const templateDoc = await getDoc(templateRef);
    if (!templateDoc.exists()) {
      throw new Error('Email template not found');
    }
    
    if (templateDoc.data().user_id !== user.uid) {
      throw new Error('Unauthorized to update this email template');
    }
    
    await updateDoc(templateRef, {
      ...updates,
      updated_at: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(templateRef);
    if (!updatedDoc.exists()) {
      throw new Error('Email template not found after update');
    }
    
    return formatEmailTemplate({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    return null;
  }
}

/**
 * Delete an email template
 */
export async function deleteEmailTemplate(id: string): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const templateRef = doc(db, 'email_templates', id);
    
    // Verify ownership before deletion
    const templateDoc = await getDoc(templateRef);
    if (!templateDoc.exists()) {
      throw new Error('Email template not found');
    }
    
    if (templateDoc.data().user_id !== user.uid) {
      throw new Error('Unauthorized to delete this email template');
    }
    
    await deleteDoc(templateRef);
    return true;
  } catch (error) {
    console.error(`Error deleting email template ${id}:`, error);
    return false;
  }
}

/**
 * Get emails for a specific client
 */
export async function getClientEmails(clientId: string, limitCount: number = 50): Promise<EmailLog[]> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const logsQuery = query(
      collection(db, 'email_logs'),
      where('user_id', '==', user.uid),
      where('clientId', '==', clientId),
      orderBy('sentAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(logsQuery);
    
    const logs: EmailLog[] = [];
    querySnapshot.forEach((doc) => {
      logs.push(formatEmailLog({
        id: doc.id,
        ...doc.data()
      }));
    });
    
    return logs;
  } catch (error) {
    console.error(`Error fetching emails for client ${clientId}:`, error);
    return [];
  }
}

/**
 * Get email logs for the current user
 */
export async function getEmailLogs(limitCount: number = 50): Promise<EmailLog[]> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const logsQuery = query(
      collection(db, 'email_logs'),
      where('user_id', '==', user.uid),
      orderBy('sentAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(logsQuery);
    
    const logs: EmailLog[] = [];
    querySnapshot.forEach((doc) => {
      logs.push(formatEmailLog({
        id: doc.id,
        ...doc.data()
      }));
    });
    
    return logs;
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return [];
  }
}

/**
 * Log an email send
 */
export async function logEmailSend(log: Omit<EmailLog, 'id' | 'sent_at'>): Promise<EmailLog | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const logData = {
      ...log,
      user_id: user.uid,
      sentAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'email_logs'), logData);
    
    // Get the newly created document
    const newLogDoc = await getDoc(docRef);
    if (!newLogDoc.exists()) {
      throw new Error('Failed to retrieve created email log');
    }
    
    return formatEmailLog({
      id: newLogDoc.id,
      ...newLogDoc.data()
    });
  } catch (error) {
    console.error('Error logging email send:', error);
    return null;
  }
}

/**
 * Helper function to format email template data
 */
function formatEmailTemplate(data: any): EmailTemplate {
  // Convert Firestore Timestamps to ISO strings
  const createdAt = data.createdAt instanceof Timestamp 
    ? data.createdAt.toDate().toISOString() 
    : data.createdAt;
    
  const updatedAt = data.updatedAt instanceof Timestamp 
    ? data.updatedAt.toDate().toISOString() 
    : data.updatedAt;

  return {
    id: data.id,
    name: data.name,
    subject: data.subject,
    body: data.body,
    variables: data.variables || [],
    createdAt,
    updatedAt,
    user_id: data.user_id,
  };
}

/**
 * Helper function to format email log data
 */
function formatEmailLog(data: any): EmailLog {
  // Convert Firestore Timestamp to ISO string
  const sentAt = data.sentAt instanceof Timestamp 
    ? data.sentAt.toDate().toISOString() 
    : data.sentAt;

  return {
    id: data.id,
    clientId: data.clientId || null,
    clientName: data.clientName || null,
    workerId: data.workerId || null,
    workerName: data.workerName || null,
    subject: data.subject,
    body: data.body,
    sentAt,
    status: data.status,
    trigger: data.trigger || 'manual',
    weatherCondition: data.weatherCondition,
    errorMessage: data.errorMessage,
    user_id: data.user_id,
  };
}
