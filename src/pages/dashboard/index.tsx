// pages/dashboard/index.tsx
import ErrorBoundary from '../components/ErrorBoundary';

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}