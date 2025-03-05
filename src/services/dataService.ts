// src/services/firebaseDataService.ts
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  getCountFromServer,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebaseClient';

/**
 * Get client statistics for the current user
 */
export async function getClientStats() {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Get total clients
    const totalQuery = query(
      collection(db, 'clients'),
      where('user_id', '==', user.uid)
    );
    const totalSnapshot = await getCountFromServer(totalQuery);
    const total = totalSnapshot.data().count;

    // Get active clients
    const activeQuery = query(
      collection(db, 'clients'),
      where('user_id', '==', user.uid),
      where('is_active', '==', true)
    );
    const activeSnapshot = await getCountFromServer(activeQuery);
    const active = activeSnapshot.data().count;

    // Get inactive clients
    const inactiveQuery = query(
      collection(db, 'clients'),
      where('user_id', '==', user.uid),
      where('is_active', '==', false)
    );
    const inactiveSnapshot = await getCountFromServer(inactiveQuery);
    const inactive = inactiveSnapshot.data().count;

    // Get recently added clients (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentQuery = query(
      collection(db, 'clients'),
      where('user_id', '==', user.uid),
      where('created_at', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const recentSnapshot = await getCountFromServer(recentQuery);
    const recentlyAdded = recentSnapshot.data().count;

    return {
      total,
      active,
      inactive,
      recentlyAdded
    };
  } catch (error) {
    console.error('Error fetching client stats:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      recentlyAdded: 0
    };
  }
}

/**
 * Get jobsite statistics for the current user
 */
export async function getJobsiteStats() {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Get total jobsites
    const totalQuery = query(
      collection(db, 'jobsites'),
      where('user_id', '==', user.uid)
    );
    const totalSnapshot = await getCountFromServer(totalQuery);
    const total = totalSnapshot.data().count;

    // Get jobsites with weather monitoring
    const monitoringQuery = query(
      collection(db, 'jobsites'),
      where('user_id', '==', user.uid),
      where('weather_monitoring.enabled', '==', true)
    );
    const monitoringSnapshot = await getCountFromServer(monitoringQuery);
    const withWeatherMonitoring = monitoringSnapshot.data().count;

    // Get jobsites with recent alerts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const alertsQuery = query(
      collection(db, 'weather_checks'),
      where('user_id', '==', user.uid),
      where('notification_sent', '==', true),
      where('created_at', '>=', Timestamp.fromDate(sevenDaysAgo))
    );
    const alertsSnapshot = await getDocs(alertsQuery);
    
    // Get unique jobsite IDs from alerts
    const jobsiteIds = new Set();
    alertsSnapshot.forEach(doc => {
      jobsiteIds.add(doc.data().jobsite_id);
    });
    
    const withRecentAlerts = jobsiteIds.size;

    return {
      total,
      withWeatherMonitoring,
      withRecentAlerts
    };
  } catch (error) {
    console.error('Error fetching jobsite stats:', error);
    return {
      total: 0,
      withWeatherMonitoring: 0,
      withRecentAlerts: 0
    };
  }
}

/**
 * Get worker statistics for the current user
 */
export async function getWorkerStats() {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Get total workers
    const totalQuery = query(
      collection(db, 'workers'),
      where('user_id', '==', user.uid)
    );
    const totalSnapshot = await getCountFromServer(totalQuery);
    const total = totalSnapshot.data().count;

    // Get active workers
    const activeQuery = query(
      collection(db, 'workers'),
      where('user_id', '==', user.uid),
      where('is_active', '==', true)
    );
    const activeSnapshot = await getCountFromServer(activeQuery);
    const active = activeSnapshot.data().count;

    // Get workers assigned to jobsites
    // First, get all worker IDs
    const workersQuery = query(
      collection(db, 'workers'),
      where('user_id', '==', user.uid)
    );
    const workersSnapshot = await getDocs(workersQuery);
    const workerIds = workersSnapshot.docs.map(doc => doc.id);

    // Then count worker_jobsite associations
    let assignedCount = 0;
    if (workerIds.length > 0) {
      // Due to Firestore limitations, we need to check each worker ID individually
      // or use batched queries for large sets
      for (const workerId of workerIds) {
        const assignedQuery = query(
          collection(db, 'worker_jobsites'),
          where('worker_id', '==', workerId)
        );
        const assignedSnapshot = await getCountFromServer(assignedQuery);
        if (assignedSnapshot.data().count > 0) {
          assignedCount++;
        }
      }
    }

    return {
      total,
      active,
      assigned: assignedCount
    };
  } catch (error) {
    console.error('Error fetching worker stats:', error);
    return {
      total: 0,
      active: 0,
      assigned: 0
    };
  }
}

/**
 * Get email statistics for the current user
 */
export async function getEmailStats() {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Get total emails sent
    const totalQuery = query(
      collection(db, 'email_logs'),
      where('user_id', '==', user.uid)
    );
    const totalSnapshot = await getCountFromServer(totalQuery);
    const total = totalSnapshot.data().count;

    // Get emails sent in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentQuery = query(
      collection(db, 'email_logs'),
      where('user_id', '==', user.uid),
      where('sentAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const recentSnapshot = await getCountFromServer(recentQuery);
    const last30Days = recentSnapshot.data().count;

    // Get emails by status
    const sentQuery = query(
      collection(db, 'email_logs'),
      where('user_id', '==', user.uid),
      where('status', '==', 'sent')
    );
    const sentSnapshot = await getCountFromServer(sentQuery);
    const sent = sentSnapshot.data().count;

    const deliveredQuery = query(
      collection(db, 'email_logs'),
      where('user_id', '==', user.uid),
      where('status', '==', 'delivered')
    );
    const deliveredSnapshot = await getCountFromServer(deliveredQuery);
    const delivered = deliveredSnapshot.data().count;

    const openedQuery = query(
      collection(db, 'email_logs'),
      where('user_id', '==', user.uid),
      where('status', '==', 'opened')
    );
    const openedSnapshot = await getCountFromServer(openedQuery);
    const opened = openedSnapshot.data().count;

    const failedQuery = query(
      collection(db, 'email_logs'),
      where('user_id', '==', user.uid),
      where('status', '==', 'failed')
    );
    const failedSnapshot = await getCountFromServer(failedQuery);
    const failed = failedSnapshot.data().count;

    return {
      total,
      last30Days,
      byStatus: {
        sent,
        delivered,
        opened,
        failed
      }
    };
  } catch (error) {
    console.error('Error fetching email stats:', error);
    return {
      total: 0,
      last30Days: 0,
      byStatus: {
        sent: 0,
        delivered: 0,
        opened: 0,
        failed: 0
      }
    };
  }
}

/**
 * Get recent activity for the current user
 */
export async function getRecentActivity(limit = 10) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Get recent clients
    const clientsQuery = query(
      collection(db, 'clients'),
      where('user_id', '==', user.uid),
      where('created_at', '!=', null)
    );
    const clientsSnapshot = await getDocs(clientsQuery);
    const clients = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'client',
      action: 'created',
      name: doc.data().name,
      timestamp: doc.data().created_at instanceof Timestamp 
        ? doc.data().created_at.toDate().toISOString() 
        : doc.data().created_at,
    }));

    // Get recent jobsites
    const jobsitesQuery = query(
      collection(db, 'jobsites'),
      where('user_id', '==', user.uid),
      where('created_at', '!=', null)
    );
    const jobsitesSnapshot = await getDocs(jobsitesQuery);
    const jobsites = jobsitesSnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'jobsite',
      action: 'created',
      name: doc.data().name,
      timestamp: doc.data().created_at instanceof Timestamp 
        ? doc.data().created_at.toDate().toISOString() 
        : doc.data().created_at,
    }));

    // Get recent weather alerts
    const alertsQuery = query(
      collection(db, 'weather_checks'),
      where('user_id', '==', user.uid),
      where('notification_sent', '==', true)
    );
    const alertsSnapshot = await getDocs(alertsQuery);
    
    // For each alert, get the jobsite name
    const alerts = [];
    for (const alertDoc of alertsSnapshot.docs) {
      const jobsiteId = alertDoc.data().jobsite_id;
      const jobsiteRef = doc(db, 'jobsites', jobsiteId);
      const jobsiteSnapshot = await getDoc(jobsiteRef);
      
      if (jobsiteSnapshot.exists()) {
        alerts.push({
          id: alertDoc.id,
          type: 'weather_alert',
          action: 'triggered',
          name: jobsiteSnapshot.data().name,
          timestamp: alertDoc.data().created_at instanceof Timestamp 
            ? alertDoc.data().created_at.toDate().toISOString() 
            : alertDoc.data().created_at,
          conditions: alertDoc.data().conditions_triggered,
        });
      }
    }

    // Combine all activities, sort by timestamp, and limit
    const allActivities = [...clients, ...jobsites, ...alerts]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return allActivities;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}
