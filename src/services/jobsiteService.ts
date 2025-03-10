// src/services/firebaseJobsiteService.ts
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import { Jobsite } from '../types/jobsite';
import { auth } from '../lib/firebaseClient';

/**
 * Fetch jobsites associated with a specific client.
 */
export async function getClientJobsites(clientId: string): Promise<Jobsite[]> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const jobsitesQuery = query(
      collection(db, 'jobsites'),
      where('client_id', '==', clientId),
      where('user_id', '==', user.uid)
    );
    
    const querySnapshot = await getDocs(jobsitesQuery);
    
    const jobsites: Jobsite[] = [];
    querySnapshot.forEach((doc) => {
      jobsites.push(formatJobsite({
        id: doc.id,
        ...doc.data()
      }));
    });
    
    return jobsites;
  } catch (error) {
    console.error('Error fetching client jobsites:', error);
    return [];
  }
}

/**
 * Fetch all jobsites for the current user
 */
export async function getAllJobsites(): Promise<Jobsite[]> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const jobsitesQuery = query(
      collection(db, 'jobsites'),
      where('user_id', '==', user.uid)
    );
    
    const querySnapshot = await getDocs(jobsitesQuery);
    
    const jobsites: Jobsite[] = [];
    querySnapshot.forEach((doc) => {
      jobsites.push(formatJobsite({
        id: doc.id,
        ...doc.data()
      }));
    });
    
    return jobsites;
  } catch (error) {
    console.error('Error fetching all jobsites:', error);
    return [];
  }
}

/**
 * Fetch all active jobsites for the current user
 */
export async function getActiveJobsites(): Promise<Jobsite[]> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const jobsitesQuery = query(
      collection(db, 'jobsites'),
      where('user_id', '==', user.uid),
      where('is_active', '==', true)
    );
    
    const querySnapshot = await getDocs(jobsitesQuery);
    
    const jobsites: Jobsite[] = [];
    querySnapshot.forEach((doc) => {
      jobsites.push(formatJobsite({
        id: doc.id,
        ...doc.data()
      }));
    });
    
    return jobsites;
  } catch (error) {
    console.error('Error fetching active jobsites:', error);
    return [];
  }
}

/**
 * Create a new jobsite
 */
export async function createJobsite(jobsite: Omit<Jobsite, 'id' | 'created_at' | 'updated_at'>): Promise<Jobsite | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const jobsiteData = {
      ...jobsite,
      user_id: user.uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'jobsites'), jobsiteData);
    
    // Get the newly created document
    const newJobsiteDoc = await getDoc(docRef);
    if (!newJobsiteDoc.exists()) {
      throw new Error('Failed to retrieve created jobsite');
    }
    
    return formatJobsite({
      id: newJobsiteDoc.id,
      ...newJobsiteDoc.data()
    });
  } catch (error) {
    console.error('Error creating jobsite:', error);
    return null;
  }
}

/**
 * Get a single jobsite by ID
 */
export async function getJobsite(id: string): Promise<Jobsite | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const jobsiteRef = doc(db, 'jobsites', id);
    const jobsiteDoc = await getDoc(jobsiteRef);
    
    if (!jobsiteDoc.exists()) {
      throw new Error('Jobsite not found');
    }
    
    const jobsiteData = jobsiteDoc.data();
    
    // Verify the jobsite belongs to the current user
    if (jobsiteData.user_id !== user.uid) {
      throw new Error('Unauthorized access to jobsite');
    }

    return formatJobsite({
      id: jobsiteDoc.id,
      ...jobsiteData
    });
  } catch (error) {
    console.error(`Error fetching jobsite ${id}:`, error);
    return null;
  }
}

/**
 * Update a jobsite
 */
export async function updateJobsite(
  id: string,
  updates: Partial<Omit<Jobsite, 'id' | 'created_at' | 'updated_at'>>
): Promise<Jobsite | null> {
  try {
    const jobsiteRef = doc(db, 'jobsites', id);
    
    await updateDoc(jobsiteRef, {
      ...updates,
      updated_at: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(jobsiteRef);
    if (!updatedDoc.exists()) {
      throw new Error('Jobsite not found');
    }
    
    return formatJobsite({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error) {
    console.error('Error updating jobsite:', error);
    return null;
  }
}

/**
 * Delete a jobsite
 */
export async function deleteJobsite(id: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Verify ownership before deletion
    const jobsiteRef = doc(db, 'jobsites', id);
    const jobsiteDoc = await getDoc(jobsiteRef);
    
    if (!jobsiteDoc.exists()) {
      throw new Error('Jobsite not found');
    }
    
    if (jobsiteDoc.data().user_id !== user.uid) {
      throw new Error('Unauthorized to delete this jobsite');
    }

    await deleteDoc(jobsiteRef);
  } catch (error) {
    console.error(`Error deleting jobsite ${id}:`, error);
    throw error;
  }
}

/**
 * Helper function to format jobsite data
 */
function formatJobsite(data: any): Jobsite {
  // Convert Firestore Timestamps to ISO strings
  const created_at = data.created_at instanceof Timestamp 
    ? data.created_at.toDate().toISOString() 
    : data.created_at;
    
  const updated_at = data.updated_at instanceof Timestamp 
    ? data.updated_at.toDate().toISOString() 
    : data.updated_at;

  return {
    id: data.id,
    name: data.name,
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    zip_code: data.zip_code || '',
    is_active: data.is_active ?? true,
    client_id: data.client_id,
    weather_monitoring: data.weather_monitoring || {
      enabled: false,
      conditions: [],
      threshold: 0,
      notification_settings: {
        notify_client: false,
        notify_workers: false
      }
    },
    location: data.location || '',
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    notes: data.notes || '',
    created_at: created_at,
    updated_at: updated_at || null,
    user_id: data.user_id,
  };
}
