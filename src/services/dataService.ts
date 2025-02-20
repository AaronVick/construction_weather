// src/services/dataService.ts
import { supabase } from '../lib/supabaseClient';
import { ClientStats } from '../types/client';
import { JobsiteStats } from '../types/jobsite';
import { WorkerStats } from '../types/worker';
import { NotificationStats } from '../types/notification';

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
  
  // Get assigned workers
  const { count: assigned } = await supabase
    .from('worker_jobsites')
    .select('worker_id', { count: 'exact', head: true })
    .in('jobsite_id', (sb) => 
      sb.from('jobsites').select('id').eq('user_id', userId)
    );
  
  return {
    total: total || 0,
    active: active || 0,
    assigned: assigned || 0,
  };
}

/**
 * Gets notification statistics
 */
async function getNotificationStats(userId: string): Promise<NotificationStats> {
  // Get total notifications sent
  const { count: totalSent } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .in('client_id', (sb) =>
      sb.from('clients').select('id').eq('user_id', userId)
    )
    .or(`worker_id.in.(${
      supabase.from('workers').select('id').eq('user_id', userId).toString()
    })`);
  
  // Get weather notifications sent
  const { count: weatherNotifications } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .in('client_id', (sb) =>
      sb.from('clients').select('id').eq('user_id', userId)
    )
    .or(`worker_id.in.(${
      supabase.from('workers').select('id').eq('user_id', userId).toString()
    })`)
    .eq('trigger', 'weather');
  
  // Get notifications sent in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { count: last30Days } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .in('client_id', (sb) =>
      sb.from('clients').select('id').eq('user_id', userId)
    )
    .or(`worker_id.in.(${
      supabase.from('workers').select('id').eq('user_id', userId).toString()
    })`)
    .gte('sent_at', thirtyDaysAgo.toISOString());
  
  return {
    totalSent: totalSent || 0,
    weatherNotifications: weatherNotifications || 0,
    last30Days: last30Days || 0,
  };
}

/**
 * Gets recent activity
 */
async function getRecentActivity(userId: string): Promise<Array<{
  id: number;
  type: string;
  message: string;
  timestamp: string;
  status: string;
}>> {
  // This is a simplified example - in a real app, you'd aggregate activity from multiple tables
  const { data } = await supabase
    .from('email_logs')
    .select(`
      id,
      trigger,
      subject,
      recipient_name,
      sent_at,
      status
    `)
    .in('client_id', (sb) =>
      sb.from('clients').select('id').eq('user_id', userId)
    )
    .or(`worker_id.in.(${
      supabase.from('workers').select('id').eq('user_id', userId).toString()
    })`)
    .order('sent_at', { ascending: false })
    .limit(10);
  
  if (!data || data.length === 0) {
    return [];
  }
  
  return data.map((log, index) => ({
    id: index + 1, // Use index as ID for demo
    type: log.trigger === 'weather' ? 'weather_alert' : 'email_notification',
    message: `${log.trigger === 'weather' ? 'Weather alert' : 'Email'} sent to ${log.recipient_name}: ${log.subject}`,
    timestamp: log.sent_at,
    status: log.status,
  }));
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
    .in('client_id', (sb) =>
      sb.from('clients').select('id').eq('user_id', userId)
    )
    .or(`worker_id.in.(${
      supabase.from('workers').select('id').eq('user_id', userId).toString()
    })`)
    .gte('sent_at', sixMonthsAgo.toISOString());
  
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