import { supabase } from '../lib/supabaseClient';
import { Client, ClientWithAssociations } from '../types/client';

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
    const { query, isActive, sortBy = 'name', sortDirection = 'asc' } = filters;
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');
    
    let queryBuilder = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (typeof isActive === 'boolean') queryBuilder = queryBuilder.eq('is_active', isActive);
    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`
      );
    }

    // Sorting & Pagination
    queryBuilder = queryBuilder.order(sortBy, { ascending: sortDirection === 'asc' })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await queryBuilder;
    if (error) throw error;

    return { data: data.map(formatClient), count: count || 0, error: null };
  } catch (error) {
    console.error('Error fetching clients:', error);
    return { data: [], count: 0, error: error as Error };
  }
}

/**
 * Fetch a single client by ID
 */
export async function getClient(id: string): Promise<ClientWithAssociations | null> {
  try {
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

    return formatClient(data);
  } catch (error) {
    console.error(`Error fetching client ${id}:`, error);
    return null;
  }
}

/**
 * Update client status (active/inactive)
 */
export async function updateClientStatus(id: string, isActive: boolean): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('clients')
      .update({ is_active: isActive })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error(`Error updating client status for ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new client
 */
export async function createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...client,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return formatClient(data);
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting client ${id}:`, error);
    throw error;
  }
}

export async function updateClient(
  id: string,
  updates: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating client:', error);
    return null;
  }
}


/**
 * Helper function to format client data
 */
function formatClient(data: any): Client {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    address: data.address || null,
    company: data.company || null,
    notes: data.notes || null,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
