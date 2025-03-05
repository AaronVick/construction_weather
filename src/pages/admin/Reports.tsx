// src/pages/admin/Reports.tsx
import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import LoadingScreen from '../../components/ui/LoadingScreen';

type ReportType = 'revenue' | 'users' | 'subscriptions' | 'churn' | 'conversion';
type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type FileFormat = 'csv' | 'json' | 'pdf';

const AdminReports: React.FC = () => {
  const { isLoading: adminLoading } = useAdmin();
  const [reportType, setReportType] = useState<ReportType>('revenue');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('monthly');
  const [fileFormat, setFileFormat] = useState<FileFormat>('csv');
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReportUrl, setGeneratedReportUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Report type options
  const reportTypes = [
    { value: 'revenue', label: 'Revenue Report' },
    { value: 'users', label: 'User Growth Report' },
    { value: 'subscriptions', label: 'Subscription Report' },
    { value: 'churn', label: 'Churn Analysis' },
    { value: 'conversion', label: 'Conversion Funnel' },
  ];

  // Time frame options
  const timeFrames = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  // File format options
  const fileFormats = [
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
    { value: 'pdf', label: 'PDF' },
  ];

  // Handle form submission
  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setGeneratedReportUrl(null);

    try {
      // In a real application, this would make an API call to generate the report
      // For now, we'll simulate a delay and then provide a fake download URL
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate a generated report URL
      setGeneratedReportUrl(`/api/reports/${reportType}_${timeFrame}_${startDate}_${endDate}.${fileFormat}`);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle scheduled report creation
  const handleScheduleReport = () => {
    // In a real application, this would set up a scheduled report
    alert('Report scheduled successfully! You will receive it via email according to your selected frequency.');
  };

  if (adminLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Generator */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Generate Report</h2>
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
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
            
            {/* Success Message */}
            {generatedReportUrl && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">Report generated successfully!</p>
                    <div className="mt-2">
                      <a
                        href={generatedReportUrl}
                        download
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Download Report
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleGenerateReport}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Report Type */}
                <div>
                  <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">
                    Report Type
                  </label>
                  <select
                    id="reportType"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                  >
                    {reportTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Time Frame */}
                <div>
                  <label htmlFor="timeFrame" className="block text-sm font-medium text-gray-700">
                    Time Frame
                  </label>
                  <select
                    id="timeFrame"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={timeFrame}
                    onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}
                  >
                    {timeFrames.map((frame) => (
                      <option key={frame.value} value={frame.value}>
                        {frame.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Start Date */}
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                
                {/* End Date */}
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                
                {/* File Format */}
                <div>
                  <label htmlFor="fileFormat" className="block text-sm font-medium text-gray-700">
                    File Format
                  </label>
                  <select
                    id="fileFormat"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={fileFormat}
                    onChange={(e) => setFileFormat(e.target.value as FileFormat)}
                  >
                    {fileFormats.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Submit Button */}
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        
        {/* Scheduled Reports */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Schedule Reports</h2>
            <p className="text-sm text-gray-500 mb-4">
              Set up recurring reports to be delivered to your email automatically.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="scheduleReportType" className="block text-sm font-medium text-gray-700">
                  Report Type
                </label>
                <select
                  id="scheduleReportType"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  defaultValue="revenue"
                >
                  {reportTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
                  Frequency
                </label>
                <select
                  id="frequency"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  defaultValue="weekly"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="emailRecipients" className="block text-sm font-medium text-gray-700">
                  Email Recipients
                </label>
                <input
                  type="text"
                  id="emailRecipients"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="email@example.com, another@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separate multiple emails with commas
                </p>
              </div>
              
              <button
                type="button"
                onClick={handleScheduleReport}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Schedule Report
              </button>
            </div>
          </div>
          
          {/* Recent Reports */}
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Reports</h2>
            
            <ul className="divide-y divide-gray-200">
              <li className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Revenue Report</p>
                    <p className="text-xs text-gray-500">Generated on Mar 1, 2025</p>
                  </div>
                  <a
                    href="#"
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Download
                  </a>
                </div>
              </li>
              <li className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">User Growth Report</p>
                    <p className="text-xs text-gray-500">Generated on Feb 15, 2025</p>
                  </div>
                  <a
                    href="#"
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Download
                  </a>
                </div>
              </li>
              <li className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Subscription Report</p>
                    <p className="text-xs text-gray-500">Generated on Feb 1, 2025</p>
                  </div>
                  <a
                    href="#"
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Download
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
