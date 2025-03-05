// src/pages/admin/Users.tsx
import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { collection, query, getDocs, orderBy, limit, startAfter, where, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebaseClient';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  job_title?: string;
  created_at: string;
  subscription_status?: string;
  subscription_plan?: string;
}

const AdminUsers: React.FC = () => {
  const { isLoading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [hasMore, setHasMore] = useState(true);

  const fetchUsers = async (searchTerm = '', status = 'all', lastDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    try {
      setLoading(true);
      
      // Base query
      let userQuery = query(
        collection(db, 'user_profiles'),
        orderBy('created_at', 'desc'),
        limit(10)
      );
      
      // Add pagination if lastDoc is provided
      if (lastDoc) {
        userQuery = query(
          collection(db, 'user_profiles'),
          orderBy('created_at', 'desc'),
          startAfter(lastDoc),
          limit(10)
        );
      }
      
      // Add search filter if provided
      if (searchTerm) {
        // Note: This is a simplified search. In a real app, you might want to use
        // a more sophisticated search solution like Algolia or Elasticsearch
        userQuery = query(
          collection(db, 'user_profiles'),
          where('email', '>=', searchTerm),
          where('email', '<=', searchTerm + '\uf8ff'),
          limit(10)
        );
      }
      
      // Add status filter if provided
      if (status !== 'all') {
        userQuery = query(
          collection(db, 'user_profiles'),
          where('subscription_status', '==', status),
          orderBy('created_at', 'desc'),
          limit(10)
        );
      }
      
      const querySnapshot = await getDocs(userQuery);
      
      // Check if we have more results
      setHasMore(!querySnapshot.empty && querySnapshot.docs.length === 10);
      
      // Set the last visible document for pagination
      if (!querySnapshot.empty) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      } else {
        setLastVisible(null);
      }
      
      // Map the documents to our UserProfile interface
      const userProfiles: UserProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userProfiles.push({
          id: doc.id,
          email: data.email || '',
          full_name: data.full_name || '',
          company: data.company || '',
          job_title: data.job_title || '',
          created_at: data.created_at ? new Date(data.created_at.seconds * 1000).toISOString() : '',
          subscription_status: data.subscription_status || 'none',
          subscription_plan: data.subscription_plan || 'none'
        });
      });
      
      // If this is a new search/filter, replace the users array
      // Otherwise, append to the existing array for pagination
      if (!lastDoc) {
        setUsers(userProfiles);
      } else {
        setUsers((prevUsers) => [...prevUsers, ...userProfiles]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers(searchTerm, filterStatus);
  }, [searchTerm, filterStatus]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchTerm, filterStatus);
  };

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
  };

  // Load more users
  const loadMore = () => {
    if (lastVisible) {
      fetchUsers(searchTerm, filterStatus, lastVisible);
    }
  };

  if (adminLoading || (loading && users.length === 0)) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">User Profiles</h1>
      
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
          
          <div className="w-full md:w-64">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filterStatus}
              onChange={handleFilterChange}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="canceled">Canceled</option>
              <option value="none">No Subscription</option>
            </select>
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
      
      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-800 font-medium text-sm">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.company || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{user.job_title || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 
                          user.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800' : 
                          user.subscription_status === 'canceled' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {user.subscription_status === 'none' ? 'No Subscription' : user.subscription_status}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        {user.subscription_plan === 'none' ? '' : user.subscription_plan}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                        View Details
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        Edit
                      </button>
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

export default AdminUsers;
