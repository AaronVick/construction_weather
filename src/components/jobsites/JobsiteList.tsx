import React from 'react';
import { Jobsite } from '../../types/jobsite';

interface JobsiteListProps {
  jobsites: Jobsite[];
  clientName?: string;
  emptyMessage?: string;
}

const JobsiteList: React.FC<JobsiteListProps> = ({ jobsites, clientName, emptyMessage }) => {
  if (jobsites.length === 0) {
    return <p className="text-gray-500">{emptyMessage || 'No jobsites found.'}</p>;
  }

  return (
    <ul className="space-y-3">
      {jobsites.map((jobsite) => (
        <li key={jobsite.id} className="p-4 border rounded-md">
          <h3 className="font-medium">{jobsite.name}</h3>
          <p className="text-sm text-gray-600">Location: {jobsite.location || 'N/A'}</p>
        </li>
      ))}
    </ul>
  );
};

export default JobsiteList;
