import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const BACKEND_URL = "http://inventorydevelop.us-east-2.elasticbeanstalk.com/api";

/**
 * Get API URL based on environment:
 * - Client side (browser): use /api (Vercel proxy)
 * - Server side: use direct backend URL or env variable
 */
function getApiUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side: use Vercel rewrite proxy
    return "/api";
  }
  // Server-side: use env variable or fallback to direct URL
  return process.env.NEXT_PUBLIC_API_URL ?? BACKEND_URL;
}

/**
 * Get auth token from localStorage
 */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Save token to localStorage
 */
export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token.replace("Bearer ", ""));
}

/**
 * Save refresh token to localStorage
 */
export function saveRefreshToken(refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("refreshToken", refreshToken);
}

/**
 * Clear all session data
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

/**
 * Base query configuration with authentication
 */
const baseQuery = fetchBaseQuery({
  baseUrl: "http://inventorydevelop.us-east-2.elasticbeanstalk.com/api",
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

/**
 * Base query with token refresh logic
 */
export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Capture tokens from response headers if present
  if (result.meta?.response) {
    const authHeader = result.meta.response.headers.get('Authorization');
    const refreshHeader = result.meta.response.headers.get('RefreshToken');
    
    if (authHeader) {
      saveToken(authHeader);
    }
    if (refreshHeader) {
      saveRefreshToken(refreshHeader);
    }
  }

  // Handle 401 - try to refresh token
  if (result.error && result.error.status === 401) {
    const refreshToken = typeof window !== "undefined" 
      ? localStorage.getItem("refreshToken") 
      : null;

    if (refreshToken) {
      // Try to refresh the token
      const refreshResult = await baseQuery(
        {
          url: '/account/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.meta?.response) {
        const newToken = refreshResult.meta.response.headers.get('Authorization');
        const newRefreshToken = refreshResult.meta.response.headers.get('RefreshToken');
        
        if (newToken) {
          saveToken(newToken);
          if (newRefreshToken) {
            saveRefreshToken(newRefreshToken);
          }
          // Retry the original request with new token
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh failed - clear session
          clearSession();
          if (typeof window !== "undefined") {
            window.location.href = '/login';
          }
        }
      } else {
        // Refresh failed - clear session
        clearSession();
        if (typeof window !== "undefined") {
          window.location.href = '/login';
        }
      }
    } else {
      // No refresh token - clear session
      clearSession();
      if (typeof window !== "undefined") {
        window.location.href = '/login';
      }
    }
  }

  return result;
};

export default baseQueryWithReauth;