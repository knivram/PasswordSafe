import {
  AppError,
  type ActionResponse,
  type ActionErrorResponse,
} from "./errors";

/**
 * Helper function to handle server action responses in TanStack Query
 * This function checks if the response is an error and throws it for proper error handling
 */
export function handleActionResponse<T>(response: ActionResponse<T>): T {
  if (!response.success) {
    // Create an error object that TanStack Query can handle
    const error = new AppError(
      response.error.message,
      response.error.code,
      response.error.statusCode
    );

    throw error;
  }

  return response.data;
}

/**
 * Type guard to check if a response is an error response
 */
export function isErrorResponse<T>(
  response: ActionResponse<T>
): response is ActionErrorResponse {
  return !response.success;
}

/**
 * Helper to extract error information from a caught error in TanStack Query
 */
export function getErrorInfo(error: unknown): {
  message: string;
  code?: string;
  statusCode?: number;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as AppError).code,
      statusCode: (error as AppError).statusCode,
    };
  }

  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}
