/**
 * API Utilities for Driver Drowsiness and Emotion Monitoring System
 */

/**
 * Formats an API response with standard fields
 * @param success Whether the request was successful
 * @param data The data to include in the response
 * @param message An optional message
 * @returns Formatted API response object
 */
export function formatApiResponse<T>(
  success: boolean,
  data?: T,
  message?: string
) {
  const response: {
    success: boolean;
    message?: string;
    data?: T;
    timestamp: string;
  } = {
    success,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  if (data !== undefined) {
    response.data = data;
  }

  return response;
}

/**
 * Validates if a string is a valid base64 image
 * @param base64String The base64 string to validate
 * @returns Boolean indicating if the string is a valid base64 image
 */
export function isValidBase64Image(base64String: string): boolean {
  if (!base64String) return false;

  // Check for data URL format
  if (base64String.startsWith('data:image')) {
    // Extract the base64 part
    const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return false;
    base64String = matches[2];
  }

  try {
    // Check if it's valid base64
    return btoa(atob(base64String)) === base64String;
  } catch (err) {
    return false;
  }
}

/**
 * Generates a random ID
 * @returns A random string ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Gets current timestamp in ISO format
 * @returns Current timestamp string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Throttles a function to be called at most once in the specified time period
 * @param func The function to throttle
 * @param limit The time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let inThrottle = false;
  let lastResult: ReturnType<T> | undefined;

  return function(...args: Parameters<T>): ReturnType<T> | undefined {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
    return lastResult;
  };
}

/**
 * Formats a timestamp as a human-readable string
 * @param timestamp The ISO timestamp to format
 * @returns Formatted timestamp string
 */
export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (error) {
    return timestamp;
  }
} 