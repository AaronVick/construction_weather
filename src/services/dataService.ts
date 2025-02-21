// src/services/dataService.ts
import { supabase } from '../lib/supabaseClient';
import { ClientStats } from '../types/client';
import { JobsiteStats } from '../types/jobsite';
import { WorkerStats } from '../types/worker';
import { NotificationStats } from '../types/notification';


interface EmailLog {
  id: number;
  trigger: string;
  subject: string;
  recipient_name: string;
  sent_at: string;
  status: string;
}

interface ActivityItem {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  status: string;
}


export interface DashboardData {
  clientStats: ClientStats;
  jobsiteStats: JobsiteStats;
  workerStats: WorkerStats;
  notificationStats: NotificationStats;
  recentActivity: Array<{
    id: number;
    type: string;
    message: string;
    timestamp: string;
    status: string;
  }>;
  weatherAlertMetrics: Array<{
    month: string;
    count: number;
  }>;
}

/**
 * Fetches dashboard data with various metrics and statistics
 */
export async function getDashboardData(): Promise<{
  data: DashboardData | null;
  error: Error | null;
}> {
  try {
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');
    
    // Get client stats
    const clientStats = await getClientStats(user.id);
    
    // Get jobsite stats
    const jobsiteStats = await getJobsiteStats(user.id);
    
    // Get worker stats
    const workerStats = await getWorkerStats(user.id);
    
    // Get notification stats
    const notificationStats = await getNotificationStats(user.id);
    
    // Get recent activity
    const recentActivity = await getRecentActivity(user.id);
    
    // Get weather alert metrics
    const weatherAlertMetrics = await getWeatherAlertMetrics(user.id);
    
    return {
      data: {
        clientStats,
        jobsiteStats,
        workerStats,
        notificationStats,
        recentActivity,
        weatherAlertMetrics,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      data: null,
      error: error as Error,
    };
  }
}

/**
 * Gets client statistics
 */
async function getClientStats(userId: string): Promise<ClientStats> {
  // Get total clients
  const { count: total } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  // Get active clients
  const { count: active } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);
  
  // Get inactive clients
  const { count: inactive } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', false);
  
  // Get recently added clients (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { count: recentlyAdded } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString());
  
  return {
    total: total || 0,
    active: active || 0,
    inactive: inactive || 0,
    recentlyAdded: recentlyAdded || 0,
  };
}

// get active clients
export async function getActiveClients(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching active clients:', error);
    return 0;
  }

  return count || 0;
}




/**
 * Gets jobsite statistics
 */
async function getJobsiteStats(userId: string): Promise<JobsiteStats> {
  // Get total jobsites
  const { count: total } = await supabase
    .from('jobsites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  // Get jobsites with weather monitoring enabled
  const { count: withWeatherMonitoring } = await supabase
    .from('jobsites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('weather_monitoring->>enabled', 'true');
  
  // Get jobsites with active alerts in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { count: withRecentAlerts } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('trigger', 'weather')
    .gte('sent_at', sevenDaysAgo.toISOString());
  
  return {
    total: total || 0,
    withWeatherMonitoring: withWeatherMonitoring || 0,
    withRecentAlerts: withRecentAlerts || 0,
  };
}

/**
 * Gets worker statistics
 */
async function getWorkerStats(userId: string): Promise<WorkerStats> {
  // Get total workers
  const { count: total } = await supabase
    .from('workers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get active workers
  const { count: active } = await supabase
    .from('workers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  // Fetch jobsite IDs first
  const { data: jobsiteIds, error: jobsiteError } = await supabase
    .from('jobsites')
    .select('id')
    .eq('user_id', userId);

  if (jobsiteError || !jobsiteIds) {
    console.error('Error fetching jobsites:', jobsiteError);
    return { total: total || 0, active: active || 0, assigned: 0 };
  }

  // Extract jobsite IDs
  const jobsiteIdList = jobsiteIds.map(j => j.id);

  // Get assigned workers (Only if there are jobsites)
  let assigned = 0;
  if (jobsiteIdList.length > 0) {
    const { count: assignedCount, error: assignedError } = await supabase
      .from('worker_jobsites')
      .select('worker_id', { count: 'exact', head: true })
      .in('jobsite_id', jobsiteIdList);

    if (assignedError) {
      console.error('Error fetching assigned workers:', assignedError);
    } else {
      assigned = assignedCount || 0;
    }
  }

  return {
    total: total || 0,
    active: active || 0,
    assigned: assigned || 0,
  };
}



// get active work
export async function getActiveWorkers(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('workers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching active workers:', error);
    return 0;
  }

  return count || 0;
}



/**
 * Gets notification statistics
 */
async function getNotificationStats(userId: string): Promise<NotificationStats> {
  // Fetch client IDs
  const { data: clientIds, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId);

  if (clientError || !clientIds) {
    console.error('Error fetching client IDs:', clientError);
    return { totalSent: 0, weatherNotifications: 0, last30Days: 0 };
  }

  // Fetch worker IDs
  const { data: workerIds, error: workerError } = await supabase
    .from('workers')
    .select('id')
    .eq('user_id', userId);

  if (workerError || !workerIds) {
    console.error('Error fetching worker IDs:', workerError);
    return { totalSent: 0, weatherNotifications: 0, last30Days: 0 };
  }

  // Extract IDs into arrays
  const clientIdList = clientIds.map(c => c.id);
  const workerIdList = workerIds.map(w => w.id);

  // Fetch total notifications sent
  let totalSent = 0;
  if (clientIdList.length > 0 || workerIdList.length > 0) {
    const { count, error } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .or(clientIdList.length > 0 ? `client_id.in.(${clientIdList.join(',')})` : '')
      .or(workerIdList.length > 0 ? `worker_id.in.(${workerIdList.join(',')})` : '');

    if (error) {
      console.error('Error fetching total notifications:', error);
    } else {
      totalSent = count || 0;
    }
  }

  // Fetch weather notifications sent
  let weatherNotifications = 0;
  if (clientIdList.length > 0 || workerIdList.length > 0) {
    const { count, error } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .or(clientIdList.length > 0 ? `client_id.in.(${clientIdList.join(',')})` : '')
      .or(workerIdList.length > 0 ? `worker_id.in.(${workerIdList.join(',')})` : '')
      .eq('trigger', 'weather');

    if (error) {
      console.error('Error fetching weather notifications:', error);
    } else {
      weatherNotifications = count || 0;
    }
  }

  // Fetch notifications sent in last 30 days
  let last30Days = 0;
  if (clientIdList.length > 0 || workerIdList.length > 0) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count, error } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .or(clientIdList.length > 0 ? `client_id.in.(${clientIdList.join(',')})` : '')
      .or(workerIdList.length > 0 ? `worker_id.in.(${workerIdList.join(',')})` : '')
      .gte('sent_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error fetching notifications in last 30 days:', error);
    } else {
      last30Days = count || 0;
    }
  }

  return {
    totalSent,
    weatherNotifications,
    last30Days,
  };
}


// get pendingEmails
/**
 * Fetches the count of pending emails for a given user.
 */
export async function getPendingEmails(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending emails:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Unexpected error in getPendingEmails:', err);
    return 0;
  }
}

/**
 * Fetches the recent activity of email notifications for a given user.
 */
export async function getRecentActivity(userId: string): Promise<ActivityItem[]> {
  try {
    // Fetch client IDs associated with the user
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId);

    if (clientError) {
      console.error('Error fetching client IDs:', clientError);
      return [];
    }

    const clientIds = clientData?.map(client => client.id) || [];

    // Fetch worker IDs associated with the user
    const { data: workerData, error: workerError } = await supabase
      .from('workers')
      .select('id')
      .eq('user_id', userId);

    if (workerError) {
      console.error('Error fetching worker IDs:', workerError);
      return [];
    }

    const workerIds = workerData?.map(worker => worker.id) || [];

    // Construct email log query
    const query = supabase
      .from('email_logs')
      .select(`
        id,
        trigger,
        subject,
        recipient_name,
        sent_at,
        status
      `)
      .order('sent_at', { ascending: false })
      .limit(10);

    // Apply filters based on user-related clients/workers
    if (clientIds.length > 0) {
      query.in('client_id', clientIds);
    }

    // Use a type-safe approach for filtering worker IDs
    if (workerIds.length > 0) {
      query.or(`worker_id.in.(${workerIds.join(',')})`);
    }

    // Fetch the email logs
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform the data into the expected format
    return (data as EmailLog[]).map((log) => ({
      id: log.id,
      type: log.trigger === 'weather' ? 'weather_alert' : 'email_notification',
      message: `${log.trigger === 'weather' ? 'Weather alert' : 'Email'} sent to ${log.recipient_name}: ${log.subject}`,
      timestamp: log.sent_at,
      status: log.status,
    }));
  } catch (err) {
    console.error('Unexpected error in getRecentActivity:', err);
    return [];
  }
}


/**
 * Gets weather alert metrics over time
 */
async function getWeatherAlertMetrics(userId: string): Promise<Array<{
  month: string;
  count: number;
}>> {
  // Get weather alerts grouped by month for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const { data } = await supabase
  .from('email_logs')
  .select('sent_at')
  .eq('trigger', 'weather')
  .in('client_id', 
    await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .then(result => result.data?.map(client => client.id) || [])
  );
  
  if (!data || data.length === 0) {
    // Return sample data if no actual data
    return getSampleWeatherMetrics();
  }
  
  // Group by month
  const groupedByMonth: Record<string, number> = {};
  
  data.forEach((log) => {
    const date = new Date(log.sent_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = 0;
    }
    
    groupedByMonth[monthKey]++;
  });
  
  // Convert to array and sort by month
  return Object.entries(groupedByMonth)
    .map(([month, count]) => ({
      month: formatMonthLabel(month),
      count,
    }))
    .sort((a, b) => {
      const monthA = getMonthFromLabel(a.month);
      const monthB = getMonthFromLabel(b.month);
      return monthA.localeCompare(monthB);
    });
}

/**
 * Helper function to format month label
 */
function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('default', { month: 'short' });
}

/**
 * Helper function to get original month value from label
 */
function getMonthFromLabel(label: string): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const index = months.indexOf(label);
  return String(index + 1).padStart(2, '0');
}

/**
 * Returns sample weather metrics for demo purposes
 */
function getSampleWeatherMetrics(): Array<{
  month: string;
  count: number;
}> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  return months.map((month) => ({
    month,
    count: Math.floor(Math.random() * 10) + 1, // Random count between 1-10
  }));
}

export {
  getClientStats,
  getJobsiteStats,
  getWorkerStats,
  getNotificationStats,
  getWeatherAlertMetrics
};