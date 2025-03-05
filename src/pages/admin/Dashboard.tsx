// src/pages/admin/Dashboard.tsx
import React, { useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import LoadingScreen from '../../components/ui/LoadingScreen';

const AdminDashboard: React.FC = () => {
  const { 
    isLoading, 
    subscriptionAnalytics, 
    billingSummary, 
    userGrowthMetrics,
    refreshAnalytics,
    refreshBillingSummary,
    refreshUserMetrics
  } = useAdmin();

  useEffect(() => {
    // Refresh all data when component mounts
    const loadData = async () => {
      await Promise.all([
        refreshAnalytics(),
        refreshBillingSummary(),
        refreshUserMetrics()
      ]);
    };

    loadData();
  }, [refreshAnalytics, refreshBillingSummary, refreshUserMetrics]);

  if (isLoading || !subscriptionAnalytics || !billingSummary || !userGrowthMetrics) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* MRR Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Monthly Recurring Revenue</h3>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              +{billingSummary.revenueGrowth.toFixed(1)}%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ${subscriptionAnalytics.mrr.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            From {subscriptionAnalytics.activeSubscriptions} active subscriptions
          </p>
        </div>

        {/* Total Users Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              +{userGrowthMetrics.userGrowthRate.toFixed(1)}%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {userGrowthMetrics.totalUsers}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {userGrowthMetrics.newUsersThisMonth} new this month
          </p>
        </div>

        {/* Conversion Rate Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Conversion Rate</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {(userGrowthMetrics.conversionRate * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Free to paid conversion
          </p>
        </div>

        {/* Churn Rate Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Churn Rate</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {(subscriptionAnalytics.churnRate * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {subscriptionAnalytics.canceledSubscriptions} canceled subscriptions
          </p>
        </div>
      </div>

      {/* Subscription Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Subscription Plan Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(subscriptionAnalytics.planDistribution)
            .filter(([plan]) => plan !== 'none')
            .map(([plan, count]) => (
              <div key={plan} className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-700 font-medium capitalize">{plan}</h3>
                <div className="flex items-center mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{
                        width: `${(count / subscriptionAnalytics.totalSubscriptions) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm text-gray-500">{count}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Billing Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-gray-700 text-sm">Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ${billingSummary.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-gray-700 text-sm">Current Month</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ${billingSummary.currentMonthRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-gray-700 text-sm">Paid Invoices</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {billingSummary.paidInvoices}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-gray-700 text-sm">Pending Invoices</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {billingSummary.pendingInvoices}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
            onClick={() => window.location.href = '/admin/subscriptions'}
          >
            Manage Subscriptions
          </button>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
            onClick={() => window.location.href = '/admin/users'}
          >
            Manage Users
          </button>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
            onClick={() => window.location.href = '/admin/billing'}
          >
            View Billing Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
