// pages/dashboard/index.tsx
import ErrorBoundary from '../../components/ErrorBoundary';
import Dashboard from "../../pages/dashboard/Dashboard"; // Adjust path if needed


export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}