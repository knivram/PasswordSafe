export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",

  // Validation errors
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_UUID = "INVALID_UUID",

  // Resource errors
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",

  // Server errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",

  // Action-specific errors
  ONBOARDING_FAILED = "ONBOARDING_FAILED",
}

export interface ActionErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    statusCode: number;
  };
}

export interface ActionSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export type ActionResponse<T = unknown> =
  | ActionSuccessResponse<T>
  | ActionErrorResponse;

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(message: string, code: ErrorCode, statusCode: number = 500) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AuthError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.UNAUTHORIZED) {
    const statusCode = code === ErrorCode.FORBIDDEN ? 403 : 401;
    super(message, code, statusCode);
    this.name = "AuthError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.INVALID_INPUT) {
    super(message, code, 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.NOT_FOUND) {
    super(message, code, 404);
    this.name = "NotFoundError";
  }
}

// Helper function to create error responses
export function createErrorResponse(
  error: AppError | Error,
  fallbackCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR
): ActionErrorResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      },
    };
  }

  // Handle unknown errors
  console.error("Unhandled error:", error);
  return {
    success: false,
    error: {
      code: fallbackCode,
      message: "An unexpected error occurred. Please try again later.",
      statusCode: 500,
    },
  };
}

// Helper function to create success responses
export function createSuccessResponse<T>(data: T): ActionSuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

// Higher-order function to wrap server actions with error handling
export function withErrorHandling<TArgs extends unknown[], TReturn>(
  action: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<ActionResponse<TReturn>> {
  return async (...args: TArgs): Promise<ActionResponse<TReturn>> => {
    try {
      const result = await action(...args);
      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse(error as AppError | Error);
    }
  };
}
