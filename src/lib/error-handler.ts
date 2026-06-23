// ============================================================
// Centralized Error Handler
// Provides consistent error responses across all API routes
// ============================================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): {
  success: false;
  error: string;
  details?: string;
} {
  // If it's already an ApiError, return it as-is
  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.message,
      details: error.details,
    };
  }

  // If it's a standard Error
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Storage-related errors
    if (message.includes('not configured') || message.includes('r2')) {
      return {
        success: false,
        error: 'Storage not configured. Please contact support.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      };
    }
    
    if (message.includes('credentials') || message.includes('access key')) {
      return {
        success: false,
        error: 'Storage authentication failed. Please contact support.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      };
    }
    
    if (message.includes('network') || message.includes('fetch') || message.includes('etimedout')) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      };
    }
    
    if (message.includes('econnrefused')) {
      return {
        success: false,
        error: 'Connection refused. Please check your network settings.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      };
    }
    
    if (message.includes('bucket') || message.includes('not found')) {
      return {
        success: false,
        error: 'Storage bucket not found. Please contact support.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      };
    }
    
    if (message.includes('permission') || message.includes('access denied')) {
      return {
        success: false,
        error: 'Access denied. Please check storage permissions.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      };
    }
    
    if (message.includes('quota') || message.includes('limit')) {
      return {
        success: false,
        error: 'Storage quota exceeded. Please contact support.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      };
    }
    
    // Database-related errors
    if (message.includes('duplicate') || message.includes('unique constraint')) {
      return {
        success: false,
        error: 'Duplicate entry. This resource already exists.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      };
    }
    
    if (message.includes('foreign key') || message.includes('constraint')) {
      return {
        success: false,
        error: 'Invalid reference. Please check your data.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      };
    }
    
    // Default error
    return {
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    };
  }
  
  // Unknown error type
  return {
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
  };
}

export function getStatusCode(error: unknown): number {
  if (error instanceof ApiError) {
    return error.statusCode;
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('not found')) return 404;
    if (message.includes('unauthorized') || message.includes('auth')) return 401;
    if (message.includes('permission') || message.includes('access denied')) return 403;
    if (message.includes('not configured') || message.includes('r2')) return 503;
    if (message.includes('quota') || message.includes('limit')) return 507;
  }
  
  return 500;
}
