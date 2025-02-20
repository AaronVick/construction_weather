export interface TimelineItem {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode; // Ensure it's React.ReactNode
    timestamp: string;
    status: 'pending' | 'error' | 'success' | 'warning' | 'info';
  }
  