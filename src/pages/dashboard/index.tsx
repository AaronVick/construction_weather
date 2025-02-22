// pages/dashboard/index.tsx
import ErrorBoundary from '../../components/ErrorBoundary';
import Dashboard from "../../pages/dashboard/Dashboard"; // Adjust path if needed


console.log('Initializing Dashboard page component');

export default function DashboardPage() {
  console.log('Rendering DashboardPage with ErrorBoundary');
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}

