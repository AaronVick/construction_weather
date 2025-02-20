// src/pages/dashboard/Analytics.tsx
import React, { useState } from 'react';
import { PieChart, BarChart2, Calendar, Download, Filter, RefreshCw, 
         Bell, Mail, Cloud, Clock } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useSubscription } from '../../hooks/useSubscription';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LineChart from '../../components/charts/LineChart';
import UpgradePrompt from '../../components/subscription/UpgradePrompt';

const Analytics: React.FC = () => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  const { subscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'ytd' | 'custom'>('30d');
  
  // If the user is on a basic plan, show upgrade prompt
  if (subscription.plan === 'basic') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Gain insights into your weather monitoring and notification system
          </p>
        </div>
        
        <div className="flex justify-center py-8">
          <div className="max-w-lg w-full">
            <UpgradePrompt
              title="Unlock Advanced Analytics"
              description="Upgrade to our Premium or Enterprise plan to access detailed analytics and reporting features."
              features={[
                'Track weather patterns across all jobsites',
                'Monitor notification effectiveness',
                'Generate custom reports',
                'Export data in multiple formats',
                'View historical trends and forecasts'
              ]}
              targetPlan="premium"
            />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Gain insights into your weather monitoring and notification system
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            className="flex items-center"
            onClick={() => {}}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center"
            onClick={() => {}}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Date Range Selector */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <h2 className="text-lg font-medium mb-4 md:mb-0">Date Range</h2>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={dateRange === '7d' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('7d')}
            >
              Last 7 Days
            </Button>
            <Button
              variant={dateRange === '30d' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('30d')}
            >
              Last 30 Days
            </Button>
            <Button
              variant={dateRange === '90d' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('90d')}
            >
              Last 90 Days
            </Button>
            <Button
              variant={dateRange === 'ytd' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('ytd')}
            >
              Year to Date
            </Button>
            <Button
              variant={dateRange === 'custom' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('custom')}
              className="flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Custom
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Alerts</h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold">167</p>
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
                <span className="inline-block w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-green-500 mr-1"></span>
                +12% from previous period
              </p>
            </div>
            <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        
        <Card>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Emails Sent</h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold">2,451</p>
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
                <span className="inline-block w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-green-500 mr-1"></span>
                +5% from previous period
              </p>
            </div>
            <div className="p-2 rounded-md bg-indigo-100 dark:bg-indigo-900/30">
              <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </Card>
        
        <Card>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Weather Checks</h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold">4,320</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                <span className="inline-block w-4 h-px bg-gray-400 mr-1"></span>
                No change
              </p>
            </div>
            <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
              <Cloud className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>
        
        <Card>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Avg Response Time</h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold">4.2m</p>
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center mt-1">
                <span className="inline-block w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-red-500 mr-1"></span>
                +1.2m from previous period
              </p>
            </div>
            <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">Weather Alerts by Condition</h2>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center"
              onClick={() => {}}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
          
          <div className="h-80">
            {/* This would be the actual chart component */}
            <div className="flex justify-center items-center h-full">
              <PieChart className="w-48 h-48 text-gray-300 dark:text-gray-600" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="inline-block w-3 h-3 rounded-full bg-blue-500 mb-1"></div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rain (42%)</p>
            </div>
            <div className="text-center">
              <div className="inline-block w-3 h-3 rounded-full bg-yellow-500 mb-1"></div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Wind (28%)</p>
            </div>
            <div className="text-center">
              <div className="inline-block w-3 h-3 rounded-full bg-red-500 mb-1"></div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Temperature (18%)</p>
            </div>
            <div className="text-center">
              <div className="inline-block w-3 h-3 rounded-full bg-purple-500 mb-1"></div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Lightning (12%)</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">Email Performance</h2>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Delivered</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Opened</span>
              </div>
            </div>
          </div>
          
          <div className="h-80">
            <LineChart
              data={[
                { date: 'Feb 1', delivered: 98, opened: 72 },
                { date: 'Feb 5', delivered: 145, opened: 98 },
                { date: 'Feb 10', delivered: 132, opened: 87 },
                { date: 'Feb 15', delivered: 165, opened: 118 },
                { date: 'Feb 20', delivered: 187, opened: 142 },
              ]}
              lines={[
                { key: 'delivered', name: 'Delivered', color: '#10b981' },
                { key: 'opened', name: 'Opened', color: '#3b82f6' }
              ]}
              xAxisKey="date"
              height={320}
            />
          </div>
        </Card>
      </div>
      
      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">Alerts by Jobsite</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {}}
            >
              View All
            </Button>
          </div>
          
          <div className="h-80">
            {/* This would be a horizontal bar chart component */}
            <div className="flex justify-center items-center h-full">
              <BarChart2 className="w-48 h-48 text-gray-300 dark:text-gray-600" />
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">Weekly Activity Overview</h2>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center"
              onClick={() => {}}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-xs text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {[5, 3, 8, 6, 4, 2, 1].map((value, index) => (
                <div key={index} className="aspect-square">
                  <div 
                    className={`w-full h-full rounded-md ${getHeatmapColor(value)}`}
                    title={`${value} alerts`}
                  ></div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {[4, 7, 12, 8, 5, 3, 2].map((value, index) => (
                <div key={index} className="aspect-square">
                  <div 
                    className={`w-full h-full rounded-md ${getHeatmapColor(value)}`}
                    title={`${value} alerts`}
                  ></div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {[6, 9, 15, 7, 6, 4, 3].map((value, index) => (
                <div key={index} className="aspect-square">
                  <div 
                    className={`w-full h-full rounded-md ${getHeatmapColor(value)}`}
                    title={`${value} alerts`}
                  ></div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {[8, 11, 9, 10, 7, 2, 1].map((value, index) => (
                <div key={index} className="aspect-square">
                  <div 
                    className={`w-full h-full rounded-md ${getHeatmapColor(value)}`}
                    title={`${value} alerts`}
                  ></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-gray-500 dark:text-gray-400">Less</span>
            <div className="flex space-x-1">
              <div className="w-4 h-4 rounded-sm bg-blue-100 dark:bg-blue-900/20"></div>
              <div className="w-4 h-4 rounded-sm bg-blue-300 dark:bg-blue-700"></div>
              <div className="w-4 h-4 rounded-sm bg-blue-500 dark:bg-blue-500"></div>
              <div className="w-4 h-4 rounded-sm bg-blue-700 dark:bg-blue-300"></div>
              <div className="w-4 h-4 rounded-sm bg-blue-900 dark:bg-blue-100"></div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">More</span>
          </div>
        </Card>
      </div>
      
      {/* Recent Analytics */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Analytics Breakdown</h2>
          <div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              onClick={() => {}}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weather Checks
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alerts Triggered
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emails Sent
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Open Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                { date: 'Feb 20, 2025', checks: 144, alerts: 12, sent: 187, rate: '76%' },
                { date: 'Feb 19, 2025', checks: 144, alerts: 8, sent: 156, rate: '81%' },
                { date: 'Feb 18, 2025', checks: 144, alerts: 15, sent: 203, rate: '72%' },
                { date: 'Feb 17, 2025', checks: 144, alerts: 9, sent: 160, rate: '79%' },
                { date: 'Feb 16, 2025', checks: 144, alerts: 6, sent: 132, rate: '85%' },
              ].map((row, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {row.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {row.checks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {row.alerts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {row.sent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {row.rate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// Helper function for heatmap colors
function getHeatmapColor(value: number): string {
  if (value <= 2) return 'bg-blue-100 dark:bg-blue-900/20';
  if (value <= 5) return 'bg-blue-300 dark:bg-blue-700';
  if (value <= 8) return 'bg-blue-500 dark:bg-blue-500';
  if (value <= 11) return 'bg-blue-700 dark:bg-blue-300';
  return 'bg-blue-900 dark:bg-blue-100';
}

export default Analytics;