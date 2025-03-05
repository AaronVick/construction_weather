// src/pages/admin/Subscriptions.tsx
import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { collection, query, getDocs, orderBy, limit, startAfter, where, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebaseClient';
import { Subscription } from '../../types/subscription';

const AdminSubscriptions: React.FC = () => {
  const { isLoading: adminLoading } = useAdmin();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  const pageSize = 10;

  // Load initial subscriptions
  useEffect(() => {
    loadSubscriptions();
  }, [filterStatus, filterPlan]);

  // Load subscriptions from Firestore
  const loadSubscriptions = async (searchValue = '') => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query
      let subscriptionsQuery = query(
        collection(db, 'subscriptions'),
        orderBy('created_at', 'desc'),
        limit(pageSize)
      );

      // Apply status filter
      if (filterStatus !== 'all') {
        subscriptionsQuery = query(
          collection(db, 'subscriptions'),
          where('status', '==', filterStatus),
          orderBy('created_at', 'desc'),
          limit(pageSize)
        );
      }

      // Apply plan filter
      if (filterPlan !== 'all') {
        subscriptionsQuery = query(
          collection(db, 'subscriptions'),
          where('plan', '==', filterPlan),
          orderBy('created_at', 'desc'),
          limit(pageSize)
        );
      }

      // Apply both filters
      if (filterStatus !== 'all' && filterPlan !== 'all') {
        subscriptionsQuery = query(
          collection(db, 'subscriptions'),
          where('status', '==', filterStatus),
          where('plan', '==', filterPlan),
          orderBy('created_at', 'desc'),
          limit(pageSize)
        );
      }

      const querySnapshot = await getDocs(subscriptionsQuery);
      
      // Check if we have more results
      setHasMore(querySnapshot.docs.length === pageSize);
      
      // Set the last visible document for pagination
      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      } else {
        setLastVisible(null);
      }

      // Format and set subscriptions
      const formattedSubscriptions: Subscription[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        formattedSubscriptions.push({
          id: doc.id,
          user_id: data.user_id,
          plan: data.plan,
          status: data.status,
          billing_cycle: data.billing_cycle,
          price_id: data.price_id,
          customer_id: data.customer_id,
          start_date: data.start_date?.toDate?.()?.toISOString() || '',
          end_date: data.end_date?.toDate?.()?.toISOString() || null,
          trial_end: data.trial_end?.toDate?.()?.toISOString() || null,
          next_billing_date: data.next_billing_date?.toDate?.()?.toISOString() || '',
          cancellation_date: data.cancellation_date?.toDate?.()?.toISOString() || null,
          payment_method: data.payment_method || null,
          features: data.features || {},
          created_at: data.created_at?.toDate?.()?.toISOString() || '',
          updated_at: data.updated_at?.toDate?.()?.toISOString() || null,
          currentPeriodEnd: data.currentPeriodEnd || '',
        });
      });

      // Filter by search term if provided
      const filteredSubscriptions = searchValue
        ? formattedSubscriptions.filter(
            (sub) =>
              sub.user_id.toLowerCase().includes(searchValue.toLowerCase()) ||
              sub.customer_id?.toLowerCase().includes(searchValue.toLowerCase())
          )
        : formattedSubscriptions;

      setSubscriptions(filteredSubscriptions);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  // Load more subscriptions (pagination)
  const loadMoreSubscriptions = async () => {
    if (!lastVisible) return;

    try {
      setIsLoading(true);
      setError(null);

      // Build query with startAfter for pagination
      let subscriptionsQuery = query(
        collection(db, 'subscriptions'),
        orderBy('created_at', 'desc'),
        startAfter(lastVisible),
        limit(pageSize)
      );

      // Apply status filter
      if (filterStatus !== 'all') {
        subscriptionsQuery = query(
          collection(db, 'subscriptions'),
          where('status', '==', filterStatus),
          orderBy('created_at', 'desc'),
          startAfter(lastVisible),
          limit(pageSize)
        );
      }

      // Apply plan filter
      if (filterPlan !== 'all') {
        subscriptionsQuery = query(
          collection(db, 'subscriptions'),
          where('plan', '==', filterPlan),
          orderBy('created_at', 'desc'),
          startAfter(lastVisible),
          limit(pageSize)
        );
      }

      // Apply both filters
      if (filterStatus !== 'all' && filterPlan !== 'all') {
        subscriptionsQuery = query(
          collection(db, 'subscriptions'),
          where('status', '==', filterStatus),
          where('plan', '==', filterPlan),
          orderBy('created_at', 'desc'),
          startAfter(lastVisible),
          limit(pageSize)
        );
      }

      const querySnapshot = await getDocs(subscriptionsQuery);
      
      // Check if we have more results
      setHasMore(querySnapshot.docs.length === pageSize);
      
      // Set the last visible document for pagination
      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      } else {
        setLastVisible(null);
      }

      // Format and append subscriptions
      const formattedSubscriptions: Subscription[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        formattedSubscriptions.push({
          id: doc.id,
          user_id: data.user_id,
          plan: data.plan,
          status: data.status,
          billing_cycle: data.billing_cycle,
          price_id: data.price_id,
          customer_id: data.customer_id,
          start_date: data.start_date?.toDate?.()?.toISOString() || '',
          end_date: data.end_date?.toDate?.()?.toISOString() || null,
          trial_end: data.trial_end?.toDate?.()?.toISOString() || null,
          next_billing_date: data.next_billing_date?.toDate?.()?.toISOString() || '',
          cancellation_date: data.cancellation_date?.toDate?.()?.toISOString() || null,
          payment_method: data.payment_method || null,
          features: data.features || {},
          created_at: data.created_at?.toDate?.()?.toISOString() || '',
          updated_at: data.updated_at?.toDate?.()?.toISOString() || null,
          currentPeriodEnd: data.currentPeriodEnd || '',
        });
      });

      // Filter by search term if provided
      const filteredSubscriptions = searchTerm
        ? formattedSubscriptions.filter(
            (sub) =>
              sub.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
              sub.customer_id?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : formattedSubscriptions;

      setSubscriptions((prev) => [...prev, ...filteredSubscriptions]);
    } catch (err) {
      console.error('Error loading more subscriptions:', err);
      setError('Failed to load more subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadSubscriptions(searchTerm);
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get plan badge class
  const getPlanBadgeClass = (plan: string) => {
    switch (plan) {
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (adminLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="canceled">Canceled</option>
                <option value="past_due">Past Due</option>
                <option value="trial">Trial</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>

            {/* Plan Filter */}
            <div>
              <label htmlFor="plan-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Plan
              </label>
              <select
                id="plan-filter"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
              >
                <option value="all">All Plans</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>

          {/* Search */}
          <div>
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                placeholder="Search by user ID or customer ID"
                className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 border-b border-red-200">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Plan
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Billing Cycle
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Start Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Next Billing
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Customer ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {subscription.user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanBadgeClass(
                          subscription.plan
                        )}`}
                      >
                        {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                          subscription.status
                        )}`}
                      >
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subscription.billing_cycle.charAt(0).toUpperCase() +
                        subscription.billing_cycle.slice(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(subscription.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(subscription.next_billing_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subscription.customer_id || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {hasMore && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={loadMoreSubscriptions}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubscriptions;
