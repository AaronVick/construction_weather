// src/services/adminService.ts
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
  Timestamp,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  QueryDocumentSnapshot,
  DocumentData,
  FieldPath
} from 'firebase/firestore';
import { db, auth } from '../lib/firebaseClient';
import { 
  AdminUser, 
  AdminRole, 
  AdminPermission, 
  SubscriptionAnalytics,
  SubscriptionMetricsTimeSeries,
  BillingSummary,
  UserGrowthMetrics
} from '../types/admin';
import { Subscription, SubscriptionPlan } from '../types/subscription';

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      console.log('No authenticated user or email found');
      return false;
    }

    console.log('Checking admin status for:', user.email);

    // First, check if the user's email is in the admins collection
    const adminEmailQuery = query(
      collection(db, 'admins'),
      where('email', '==', user.email)
    );
    
    const emailQuerySnapshot = await getDocs(adminEmailQuery);
    const isAdminByEmail = !emailQuerySnapshot.empty;
    
    console.log('Admin by email check result:', isAdminByEmail);
    console.log('Email query snapshot empty?', emailQuerySnapshot.empty);
    
    if (emailQuerySnapshot.empty) {
      console.log('No admin found with email:', user.email);
      
      // Log all admins for debugging
      const allAdminsQuery = query(collection(db, 'admins'));
      const allAdminsSnapshot = await getDocs(allAdminsQuery);
      
      console.log('All admins in database:');
      allAdminsSnapshot.forEach(doc => {
        console.log('Admin:', doc.id, doc.data().email);
      });
    } else {
      console.log('Admin found with email:', user.email);
      emailQuerySnapshot.forEach(doc => {
        console.log('Admin document:', doc.id, doc.data());
      });
    }
    
    return isAdminByEmail;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get the current admin user
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const adminQuery = query(
      collection(db, 'admins'),
      where('email', '==', user.email)
    );
    
    const querySnapshot = await getDocs(adminQuery);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const adminDoc = querySnapshot.docs[0];
    return formatAdminUser({
      id: adminDoc.id,
      ...adminDoc.data()
    });
  } catch (error) {
    console.error('Error fetching admin user:', error);
    return null;
  }
}

/**
 * Get all admin users
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin || !currentAdmin.permissions.includes('manage_admins')) {
      throw new Error('Unauthorized to view admin users');
    }

    const adminsQuery = query(
      collection(db, 'admins'),
      orderBy('created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(adminsQuery);
    
    const admins: AdminUser[] = [];
    querySnapshot.forEach((doc) => {
      admins.push(formatAdminUser({
        id: doc.id,
        ...doc.data()
      }));
    });
    
    return admins;
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
}

/**
 * Create a new admin user
 */
export async function createAdminUser(
  adminData: Omit<AdminUser, 'id' | 'created_at' | 'updated_at'>
): Promise<AdminUser | null> {
  try {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin || !currentAdmin.permissions.includes('manage_admins')) {
      throw new Error('Unauthorized to create admin users');
    }

    const newAdminData = {
      ...adminData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'admins'), newAdminData);
    
    const newAdminDoc = await getDoc(docRef);
    if (!newAdminDoc.exists()) {
      throw new Error('Failed to retrieve created admin user');
    }
    
    return formatAdminUser({
      id: newAdminDoc.id,
      ...newAdminDoc.data()
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return null;
  }
}

/**
 * Update an admin user
 */
export async function updateAdminUser(
  id: string,
  updates: Partial<Omit<AdminUser, 'id' | 'created_at' | 'updated_at'>>
): Promise<AdminUser | null> {
  try {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin || !currentAdmin.permissions.includes('manage_admins')) {
      throw new Error('Unauthorized to update admin users');
    }

    const adminRef = doc(db, 'admins', id);
    
    await updateDoc(adminRef, {
      ...updates,
      updated_at: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(adminRef);
    if (!updatedDoc.exists()) {
      throw new Error('Admin user not found after update');
    }
    
    return formatAdminUser({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error) {
    console.error('Error updating admin user:', error);
    return null;
  }
}

/**
 * Delete an admin user
 */
export async function deleteAdminUser(id: string): Promise<boolean> {
  try {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin || !currentAdmin.permissions.includes('manage_admins')) {
      throw new Error('Unauthorized to delete admin users');
    }

    // Prevent deleting yourself
    if (currentAdmin.id === id) {
      throw new Error('Cannot delete your own admin account');
    }

    const adminRef = doc(db, 'admins', id);
    await deleteDoc(adminRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return false;
  }
}

/**
 * Get subscription analytics
 */
export async function getSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
  try {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin || !currentAdmin.permissions.includes('view_analytics')) {
      throw new Error('Unauthorized to view analytics');
    }

    // Get all subscriptions
    const subscriptionsQuery = query(
      collection(db, 'subscriptions')
    );
    
    const querySnapshot = await getDocs(subscriptionsQuery);
    
    // Initialize analytics
    const analytics: SubscriptionAnalytics = {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      canceledSubscriptions: 0,
      trialSubscriptions: 0,
      mrr: 0,
      arr: 0,
      churnRate: 0,
      planDistribution: {
        basic: 0,
        premium: 0,
        enterprise: 0,
        none: 0
      },
      growthRate: 0,
      averageSubscriptionValue: 0
    };
    
    // Calculate metrics
    let totalRevenue = 0;
    const subscriptions: Subscription[] = [];
    
    querySnapshot.forEach((doc) => {
      const subscription = doc.data() as Subscription;
      subscriptions.push(subscription);
      
      analytics.totalSubscriptions++;
      
      // Count by status
      if (subscription.status === 'active') {
        analytics.activeSubscriptions++;
        
        // Calculate revenue
        let monthlyValue = 0;
        switch (subscription.plan) {
          case 'basic':
            monthlyValue = 29.99;
            break;
          case 'premium':
            monthlyValue = 59.99;
            break;
          case 'enterprise':
            monthlyValue = 199.99;
            break;
          default:
            monthlyValue = 0;
        }
        
        // Adjust for billing cycle
        if (subscription.billing_cycle === 'annually') {
          // Apply annual discount (typically 10-20%)
          monthlyValue = monthlyValue * 0.85;
        }
        
        totalRevenue += monthlyValue;
      } else if (subscription.status === 'canceled') {
        analytics.canceledSubscriptions++;
      } else if (subscription.status === 'trial') {
        analytics.trialSubscriptions++;
      }
      
      // Count by plan
      if (subscription.plan in analytics.planDistribution) {
        analytics.planDistribution[subscription.plan]++;
      }
    });
    
    // Calculate MRR and ARR
    analytics.mrr = totalRevenue;
    analytics.arr = totalRevenue * 12;
    
    // Calculate average subscription value
    analytics.averageSubscriptionValue = analytics.activeSubscriptions > 0 
      ? totalRevenue / analytics.activeSubscriptions 
      : 0;
    
    // Calculate churn rate (simplified)
    analytics.churnRate = analytics.totalSubscriptions > 0 
      ? analytics.canceledSubscriptions / analytics.totalSubscriptions 
      : 0;
    
    // Growth rate would require historical data, so this is a placeholder
    analytics.growthRate = 0;
    
    return analytics;
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    throw error;
  }
}

/**
 * Get subscription metrics time series
 */
export async function getSubscriptionMetricsTimeSeries(
  startDate: Date,
  endDate: Date
): Promise<SubscriptionMetricsTimeSeries[]> {
  try {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin || !currentAdmin.permissions.includes('view_analytics')) {
      throw new Error('Unauthorized to view analytics');
    }

    // This would typically query a pre-aggregated collection
    // For now, we'll return a placeholder
    const metrics: SubscriptionMetricsTimeSeries[] = [];
    
    // Generate placeholder data
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      metrics.push({
        date: currentDate.toISOString().split('T')[0],
        totalSubscriptions: Math.floor(Math.random() * 100) + 50,
        activeSubscriptions: Math.floor(Math.random() * 80) + 40,
        canceledSubscriptions: Math.floor(Math.random() * 20) + 5,
        mrr: Math.floor(Math.random() * 5000) + 2000,
        newSubscriptions: Math.floor(Math.random() * 10) + 1,
        churnedSubscriptions: Math.floor(Math.random() * 5) + 1
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return metrics;
  } catch (error) {
    console.error('Error fetching subscription metrics time series:', error);
    throw error;
  }
}

/**
 * Get billing summary
 */
export async function getBillingSummary(): Promise<BillingSummary> {
  try {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin || !currentAdmin.permissions.includes('manage_billing')) {
      throw new Error('Unauthorized to view billing information');
    }

    // This would typically query Stripe API or a billing collection
    // For now, we'll return a placeholder
    return {
      totalRevenue: 25000,
      pendingInvoices: 5,
      failedInvoices: 2,
      paidInvoices: 120,
      refundedAmount: 500,
      currentMonthRevenue: 3500,
      previousMonthRevenue: 3200,
      revenueGrowth: 9.375 // (3500 - 3200) / 3200 * 100
    };
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    throw error;
  }
}

/**
 * Get user growth metrics
 */
export async function getUserGrowthMetrics(): Promise<UserGrowthMetrics> {
  try {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin || !currentAdmin.permissions.includes('view_analytics')) {
      throw new Error('Unauthorized to view analytics');
    }

    // This would typically query the users collection
    // For now, we'll return a placeholder
    return {
      totalUsers: 150,
      activeUsers: 120,
      newUsersThisMonth: 25,
      newUsersPreviousMonth: 20,
      userGrowthRate: 25, // (25 - 20) / 20 * 100
      conversionRate: 0.15 // 15% conversion rate
    };
  } catch (error) {
    console.error('Error fetching user growth metrics:', error);
    throw error;
  }
}

/**
 * Helper function to format admin user data
 */
function formatAdminUser(data: any): AdminUser {
  // Convert Firestore Timestamps to ISO strings
  const created_at = data.created_at instanceof Timestamp 
    ? data.created_at.toDate().toISOString() 
    : data.created_at;
    
  const updated_at = data.updated_at instanceof Timestamp 
    ? data.updated_at.toDate().toISOString() 
    : data.updated_at;
    
  const lastLogin = data.lastLogin instanceof Timestamp 
    ? data.lastLogin.toDate().toISOString() 
    : data.lastLogin;

  return {
    id: data.id,
    email: data.email,
    firstName: data.firstName || undefined,
    lastName: data.lastName || undefined,
    role: data.role as AdminRole,
    permissions: data.permissions as AdminPermission[],
    lastLogin,
    created_at,
    updated_at,
  };
}
