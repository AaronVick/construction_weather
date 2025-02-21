// src/components/dashboard/RecentActivityList.tsx

import React from 'react';

interface Activity {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  status: string;
}

interface RecentActivityListProps {
  activities: Activity[];
}

const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities }) => {
  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">{activity.message}</p>
            <p className="text-xs text-gray-500">
              {new Date(activity.timestamp).toLocaleString()}
            </p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs ${
            activity.status === 'success' ? 'bg-green-100 text-green-800' :
            activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            activity.status === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {activity.status}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivityList;