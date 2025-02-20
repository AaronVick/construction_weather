// src/services/clientService.ts
import { supabase } from '../lib/supabaseClient';
import { Client } from '../types/client';

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
 * Fetches clients with optional filtering, sorting, and pagination
 */
export async function getClients(
  filters: ClientFilters = {},
  page = 1,
  pageSize = 10
): Promise<ClientsResponse> {
  try {
    const { query, isActive, sortBy = 'name', sortDirection = 'asc' } = filters;
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');
    
    // Start building query
    let queryBuilder = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);
    
    // Apply filters
    if (typeof isActive === 'boolean') {
      queryBuilder = queryBuilder.eq('is_active', isActive);
    }
    
    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`
      );
    }
    
    // Apply sorting
    queryBuilder = queryBuilder.order(sortBy, { ascending: sortDirection === 'asc' });
    
    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    queryBuilder = queryBuilder.range(from, to);
    
    // Execute query
    const { data, error, count } = await queryBuilder;
    
    if (error) throw error;
    
    return {
      data: data.map(formatClient),
      count: count || 0,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching clients:', error);
    return {
      data: [],
      count: 0,
      error: error as Error,
    };
  }
}

/**
 * Fetches a single client by ID
 */
export async function getClientById(id: string): Promise<{
  data: Client | null;
  error: Error | null;
}> {
  try {
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    
    return {
      data: formatClient(data),
      error: null,
    };
  } catch (error) {
    console.error(`Error fetching client with ID ${id}:`, error);
    return {
      data: null,
      error: error as Error,
    };
  }
}

/**
 * Creates a new client
 */
export async function createClient(
  client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{
  data: Client | null;
  error: Error | null;
}> {
  try {
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        company_name: client.companyName,
        notes: client.notes,
        is_active: client.isActive,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      data: formatClient(data),
      error: null,
    };
  } catch (error) {
    console.error('Error creating client:', error);
    return {
      data: null,
      error: error as Error,
    };
  }
}

/**
 * Updates an existing client
 */
export async function updateClient(
  id: string,
  updates: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{
  data: Client | null;
  error: Error | null;
}> {
  try {
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');
    
    // Prepare update object
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.companyName !== undefined) updateData.company_name = updates.companyName;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      data: formatClient(data),
      error: null,
    };
  } catch (error) {
    console.error(`Error updating client with ID ${id}:`, error);
    return {
      data: null,
      error: error as Error,
    };
  }
}

/**
 * Deletes a client
 */
export async function deleteClient(id: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error(`Error deleting client with ID ${id}:`, error);
    return {
      success: false,
      error: error as Error,
    };
  }
}

/**
 * Helper function to format client data from database
 */
function formatClient(data: any): Client {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    address: data.address || null,
    companyName: data.company_name || null,
    notes: data.notes || null,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}