import React from "react";
import ErrorBoundary from "../../components/ErrorBoundary";
import Dashboard from "./Dashboard"; // Adjust if necessary

console.log("✅ Initializing Dashboard page component");

export default function DashboardPage() {
  console.log("✅ Rendering DashboardPage with ErrorBoundary");

  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
