// src/pages/admin/Billing.tsx
import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { collection, query, getDocs, orderBy, limit, startAfter, where, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebaseClient';

interface BillingRecord {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  payment_method: string;
  description: string;
  created_at: string;
  invoice_url?: string;
  receipt_url?: string;
}

const AdminBilling: React.FC = () => {
  const { isLoading: adminLoading, billingSummary } = useAdmin();
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [hasMore, setHasMore] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  const fetchBillingRecords = async (
    searchTerm = '', 
    status = 'all', 
    range = 'month',
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null
  ) => {
    try {
      setLoading(true);
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      if (range === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (range === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (range === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      }
      
      // Base query
      let billingQuery = query(
        collection(db, 'billing_history'),
        orderBy('created_at', 'desc'),
        limit(10)
      );
      
      // Add date range filter
      billingQuery = query(
        collection(db, 'billing_history'),
        where('created_at', '>=', startDate),
        orderBy('created_at', 'desc'),
        limit(10)
      );
      
      // Add pagination if lastDoc is provided
      if (lastDoc) {
        billingQuery = query(
          collection(db, 'billing_history'),
          where('created_at', '>=', startDate),
          orderBy('created_at', 'desc'),
          startAfter(lastDoc),
          limit(10)
        );
      }
      
      // Add search filter if provided
      if (searchTerm) {
        billingQuery = query(
          collection(db, 'billing_history'),
          where('user_email', '>=', searchTerm),
          where('user_email', '<=', searchTerm + '\uf8ff'),
          orderBy('user_email'),
          orderBy('created_at', 'desc'),
          limit(10)
        );
      }
      
      // Add status filter if provided
      if (status !== 'all') {
        billingQuery = query(
          collection(db, 'billing_history'),
          where('status', '==', status),
          orderBy('created_at', 'desc'),
          limit(10)
        );
      }
      
      const querySnapshot = await getDocs(billingQuery);
      
      // Check if we have more results
      setHasMore(!querySnapshot.empty && querySnapshot.docs.length === 10);
      
      // Set the last visible document for pagination
      if (!querySnapshot.empty) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      } else {
        setLastVisible(null);
      }
      
      // Map the documents to our BillingRecord interface
      const records: BillingRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          user_id: data.user_id || '',
          user_email: data.user_email || '',
          amount: data.amount || 0,
          currency: data.currency || 'USD',
          status: data.status || 'pending',
          payment_method: data.payment_method || '',
          description: data.description || '',
          created_at: data.created_at ? new Date(data.created_at.seconds * 1000).toISOString() : '',
          invoice_url: data.invoice_url,
          receipt_url: data.receipt_url
        });
      });
      
      // If this is a new search/filter, replace the records array
      // Otherwise, append to the existing array for pagination
      if (!lastDoc) {
        setBillingRecords(records);
      } else {
        setBillingRecords((prevRecords) => [...prevRecords, ...records]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching billing records:', err);
      setError('Failed to load billing records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBillingRecords(searchTerm, filterStatus, dateRange);
  }, [searchTerm, filterStatus, dateRange]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBillingRecords(searchTerm, filterStatus, dateRange);
  };

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
  };

  // Handle date range change
  const handleDateRangeChange = (range: 'week' | 'month' | 'year') => {
    setDateRange(range);
  };

  // Load more records
  const loadMore = () => {
    if (lastVisible) {
      fetchBillingRecords(searchTerm, filterStatus, dateRange, lastVisible);
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100); // Assuming amount is in cents
  };

  if (adminLoading || (loading && billingRecords.length === 0)) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Billing Management</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatCurrency(billingSummary?.totalRevenue || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Lifetime revenue</p>
        </div>

        {/* Pending Invoices */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Pending Invoices</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {billingSummary?.pendingInvoices || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Awaiting payment</p>
        </div>

        {/* Failed Invoices */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Failed Invoices</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {billingSummary?.failedInvoices || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Payment failures</p>
        </div>

        {/* Refunded Amount */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Refunded Amount</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatCurrency(billingSummary?.refundedAmount || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total refunds</p>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-1 rounded-md text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </form>
          
          <div className="w-full md:w-48">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filterStatus}
              onChange={handleFilterChange}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleDateRangeChange('week')}
              className={`px-3 py-2 text-sm rounded-md ${
                dateRange === 'week'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => handleDateRangeChange('month')}
              className={`px-3 py-2 text-sm rounded-md ${
                dateRange === 'month'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => handleDateRangeChange('year')}
              className={`px-3 py-2 text-sm rounded-md ${
                dateRange === 'year'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Year
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Billing Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {billingRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No billing records found
                  </td>
                </tr>
              ) : (
                billingRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.user_email}</div>
                      <div className="text-xs text-gray-500">{record.user_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{record.description}</div>
                      <div className="text-xs text-gray-500">{record.payment_method}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(record.amount, record.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${record.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          record.status === 'failed' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {record.invoice_url && (
                        <a 
                          href={record.invoice_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Invoice
                        </a>
                      )}
                      {record.receipt_url && (
                        <a 
                          href={record.receipt_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Receipt
                        </a>
                      )}
                      {!record.invoice_url && !record.receipt_url && (
                        <span className="text-gray-400">No documents</span>
                      )}
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
              onClick={loadMore}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBilling;
