// Define types for error handling in API routes
interface ApiError extends Error {
    code?: string;
    status?: number;
    response?: {
      data?: {
        message?: string;
      };
    };
  }