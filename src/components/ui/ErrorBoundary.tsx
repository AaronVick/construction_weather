// src/components/ui/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  section?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.section || 'component'}:`, error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center text-red-600 dark:text-red-400 mb-2">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <h3 className="font-medium">
              {this.props.section 
                ? `Error loading ${this.props.section}` 
                : 'Something went wrong'}
            </h3>
          </div>
          <p className="text-sm text-red-500 dark:text-red-300">
            The application can still be used, but this section couldn't be loaded.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-3 py-1 text-sm bg-red-100 dark:bg-red-800/50 text-red-600 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-700/50 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;