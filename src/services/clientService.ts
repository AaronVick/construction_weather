// src/services/firebaseClientService.ts
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAt, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import { Client, ClientWithAssociations } from '../types/client';
import { auth } from '../lib/firebaseClient';

export interface ClientFilters {
  query?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'created_at' | 'updated_at';
  sortDirection?: 'asc' | 'desc';
}

export interface ClientsResponse {
  data: Client[];
  count: number;
  error: Error | null;
}

/**
 * Fetch all clients with optional filters
 */
export async function getClients(
  filters: ClientFilters = {},
  page = 1,
  pageSize = 10
): Promise<ClientsResponse> {
  try {
    const { query: searchQuery, isActive, sortBy = 'name', sortDirection = 'asc' } = filters;
    
    // Get authenticated user
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    // Build query
    let clientsQuery = query(
      collection(db, 'clients'),
      where('user_id', '==', user.uid)
    );

    // Apply filters
    if (typeof isActive === 'boolean') {
      clientsQuery = query(clientsQuery, where('is_active', '==', isActive));
    }

    // Apply sorting
    clientsQuery = query(
      clientsQuery, 
      orderBy(sortBy, sortDirection === 'asc' ? 'asc' : 'desc')
    );

    // Get total count
    const countSnapshot = await getCountFromServer(clientsQuery);
    const count = countSnapshot.data().count;

    // Apply pagination
    const startAtIndex = (page - 1) * pageSize;
    if (startAtIndex > 0) {
      // This is a simplified approach - for production, you'd need to implement proper cursor-based pagination
      clientsQuery = query(clientsQuery, limit(startAtIndex + pageSize));
    } else {
      clientsQuery = query(clientsQuery, limit(pageSize));
    }

    // Execute query
    const querySnapshot = await getDocs(clientsQuery);
    
    // Process results
    const clients: Client[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Skip documents that don't match text search (client-side filtering)
      if (searchQuery && !matchesSearch(data, searchQuery)) {
        return;
      }
      
      // Only take the documents we need for the current page
      if (clients.length < pageSize && (startAtIndex === 0 || clients.length >= startAtIndex)) {
        clients.push(formatClient({
          id: doc.id,
          ...data
        }));
      }
    });

    return { 
      data: clients, 
      count, 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching clients:', error);
    return { data: [], count: 0, error: error as Error };
  }
}

/**
 * Helper function to match client data against a search query
 */
function matchesSearch(data: any, searchQuery: string): boolean {
  const query = searchQuery.toLowerCase();
  return (
    (data.name && data.name.toLowerCase().includes(query)) ||
    (data.email && data.email.toLowerCase().includes(query)) ||
    (data.company && data.company.toLowerCase().includes(query))
  );
}

/**
 * Update client status (active/inactive)
 */
export async function updateClientStatus(id: string, isActive: boolean): Promise<Client | null> {
  try {
    const clientRef = doc(db, 'clients', id);
    
    await updateDoc(clientRef, { 
      is_active: isActive, 
      updated_at: serverTimestamp() 
    });
    
    const updatedDoc = await getDoc(clientRef);
    if (!updatedDoc.exists()) {
      throw new Error('Client not found');
    }
    
    return formatClient({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error) {
    console.error(`Error updating client status for ${id}:`, error);
    return null;
  }
}

/**
 * Fetch a single client by ID
 */
export async function getClient(id: string): Promise<ClientWithAssociations | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const clientRef = doc(db, 'clients', id);
    const clientDoc = await getDoc(clientRef);
    
    if (!clientDoc.exists()) {
      throw new Error('Client not found');
    }
    
    const clientData = clientDoc.data();
    
    // Verify the client belongs to the current user
    if (clientData.user_id !== user.uid) {
      throw new Error('Unauthorized access to client');
    }

    return formatClient({
      id: clientDoc.id,
      ...clientData
    });
  } catch (error) {
    console.error(`Error fetching client ${id}:`, error);
    return null;
  }
}

/**
 * Create a new client
 */
export async function createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client | null> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const clientData = {
      ...client,
      user_id: user.uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'clients'), clientData);
    
    // Get the newly created document
    const newClientDoc = await getDoc(docRef);
    if (!newClientDoc.exists()) {
      throw new Error('Failed to retrieve created client');
    }
    
    return formatClient({
      id: newClientDoc.id,
      ...newClientDoc.data()
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return null;
  }
}

/**
 * Delete a client
 */
export async function deleteClient(id: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Verify ownership before deletion
    const clientRef = doc(db, 'clients', id);
    const clientDoc = await getDoc(clientRef);
    
    if (!clientDoc.exists()) {
      throw new Error('Client not found');
    }
    
    if (clientDoc.data().user_id !== user.uid) {
      throw new Error('Unauthorized to delete this client');
    }

    await deleteDoc(clientRef);
  } catch (error) {
    console.error(`Error deleting client ${id}:`, error);
    throw error;
  }
}

/**
 * Update a client
 */
export async function updateClient(
  id: string,
  updates: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>
): Promise<Client | null> {
  try {
    const clientRef = doc(db, 'clients', id);
    
    await updateDoc(clientRef, {
      ...updates,
      updated_at: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(clientRef);
    if (!updatedDoc.exists()) {
      throw new Error('Client not found');
    }
    
    return formatClient({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return null;
  }
}

/**
 * Helper function to format client data
 */
function formatClient(data: any): Client {
  // Convert Firestore Timestamps to ISO strings
  const created_at = data.created_at instanceof Timestamp 
    ? data.created_at.toDate().toISOString() 
    : data.created_at;
    
  const updated_at = data.updated_at instanceof Timestamp 
    ? data.updated_at.toDate().toISOString() 
    : data.updated_at;

  return {
    id: data.id,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    address: data.address || '',
    company: data.company || '',
    notes: data.notes || '',
    is_active: data.is_active ?? true,
    created_at: created_at,
    updated_at: updated_at || null,
    user_id: data.user_id,
  };
}
