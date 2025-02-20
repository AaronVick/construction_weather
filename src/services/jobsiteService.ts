import { supabase } from '../lib/supabaseClient';
import { Jobsite } from '../types/jobsite';

/**
 * Fetch jobsites associated with a specific client.
 */
export async function getClientJobsites(clientId: string): Promise<Jobsite[]> {
  try {
    const { data, error } = await supabase
      .from('jobsites')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching client jobsites:', error);
    return [];
  }
}
