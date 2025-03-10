// src/pages/admin/Revenue.tsx
import React, { useEffect, useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import LoadingScreen from '../../components/ui/LoadingScreen';

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number[];
  annualRevenue: number;
  averageRevenuePerUser: number;
  revenueByPlan: {
    basic: number;
    premium: number;
    enterprise: number;
  };
  revenueGrowth: number;
}

const AdminRevenue: React.FC = () => {
  const { isLoading, billingSummary, subscriptionAnalytics } = useAdmin();
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate revenue metrics based on billing summary and subscription analytics
  useEffect(() => {
    if (!billingSummary || !subscriptionAnalytics) return;

    setIsCalculating(true);
    
    // In a real application, this would fetch data from the backend
    // For now, we'll generate some sample data based on what we have
    
    // Generate monthly revenue data (last 12 months)
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      // Start with current month revenue and work backwards with some variation
      const baseValue = billingSummary.currentMonthRevenue;
      // Use revenueGrowth from billingSummary instead of growthRate
      const growthFactor = 1 - (billingSummary.revenueGrowth / 100);
      const randomVariation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
      
      return Math.round(baseValue * Math.pow(growthFactor, i) * randomVariation);
    }).reverse();
    
    // Calculate metrics
    const metrics: RevenueMetrics = {
      totalRevenue: billingSummary.totalRevenue,
      monthlyRevenue,
      annualRevenue: monthlyRevenue.reduce((sum, val) => sum + val, 0),
      averageRevenuePerUser: subscriptionAnalytics.activeSubscriptions > 0 
        ? subscriptionAnalytics.mrr / subscriptionAnalytics.activeSubscriptions 
        : 0,
      revenueByPlan: {
        basic: Math.round(subscriptionAnalytics.mrr * 0.4), // 40% from basic
        premium: Math.round(subscriptionAnalytics.mrr * 0.35), // 35% from premium
        enterprise: Math.round(subscriptionAnalytics.mrr * 0.25), // 25% from enterprise
      },
      revenueGrowth: billingSummary.revenueGrowth,
    };
    
    setRevenueMetrics(metrics);
    setIsCalculating(false);
  }, [billingSummary, subscriptionAnalytics]);

  if (isLoading || !revenueMetrics || isCalculating) {
    return <LoadingScreen />;
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get data for the selected timeframe
  const getTimeframeData = () => {
    const monthlyData = revenueMetrics.monthlyRevenue;
    
    switch (timeframe) {
      case 'quarterly':
        return [
          monthlyData.slice(0, 3).reduce((sum, val) => sum + val, 0),
          monthlyData.slice(3, 6).reduce((sum, val) => sum + val, 0),
          monthlyData.slice(6, 9).reduce((sum, val) => sum + val, 0),
          monthlyData.slice(9, 12).reduce((sum, val) => sum + val, 0),
        ];
      case 'yearly':
        return [revenueMetrics.annualRevenue];
      default:
        return monthlyData;
    }
  };

  const timeframeData = getTimeframeData();
  const maxValue = Math.max(...timeframeData);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatCurrency(revenueMetrics.totalRevenue)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Lifetime revenue</p>
        </div>

        {/* Annual Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Annual Revenue</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatCurrency(revenueMetrics.annualRevenue)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Last 12 months</p>
        </div>

        {/* MRR */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Monthly Recurring Revenue</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${
              revenueMetrics.revenueGrowth >= 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {revenueMetrics.revenueGrowth >= 0 ? '+' : ''}
              {revenueMetrics.revenueGrowth.toFixed(1)}%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatCurrency(subscriptionAnalytics?.mrr || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            From {subscriptionAnalytics?.activeSubscriptions || 0} active subscriptions
          </p>
        </div>

        {/* Average Revenue Per User */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Avg. Revenue Per User</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatCurrency(revenueMetrics.averageRevenuePerUser)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Monthly average</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Revenue Trend</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1 text-sm rounded-md ${
                timeframe === 'monthly'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeframe('quarterly')}
              className={`px-3 py-1 text-sm rounded-md ${
                timeframe === 'quarterly'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setTimeframe('yearly')}
              className={`px-3 py-1 text-sm rounded-md ${
                timeframe === 'yearly'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Simple bar chart */}
        <div className="h-64 flex items-end space-x-2">
          {timeframeData.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-indigo-100 rounded-t-md relative" style={{ 
                height: `${(value / maxValue) * 100}%`,
                minHeight: '1rem'
              }}>
                <div className="absolute inset-0 bg-indigo-500 opacity-80 rounded-t-md"></div>
                <div className="absolute top-0 left-0 right-0 -mt-6 text-center text-xs font-medium text-gray-600">
                  {formatCurrency(value)}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {timeframe === 'monthly' && `Month ${12 - index}`}
                {timeframe === 'quarterly' && `Q${4 - index}`}
                {timeframe === 'yearly' && 'Year'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by Plan */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue by Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(revenueMetrics.revenueByPlan).map(([plan, revenue]) => (
            <div key={plan} className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-gray-700 font-medium capitalize">{plan}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(revenue)}
              </p>
              <div className="flex items-center mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      plan === 'basic' ? 'bg-blue-500' :
                      plan === 'premium' ? 'bg-purple-500' : 'bg-indigo-500'
                    }`}
                    style={{
                      width: `${(revenue / (subscriptionAnalytics?.mrr || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="ml-2 text-sm text-gray-500">
                  {Math.round((revenue / (subscriptionAnalytics?.mrr || 1)) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;
