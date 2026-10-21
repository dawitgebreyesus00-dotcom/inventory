import { getAuthHeaders, refreshAccessToken, clearTokens } from './tokenUtils';

export const apiRequest = async (url, options = {}) => {
  let headers = getAuthHeaders(options.method !== 'GET');
  
  const requestOptions = {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  };

  let response = await fetch(url, requestOptions);
  
  // If token expired, try to refresh
  if (response.status === 401 || response.status === 403) {
    try {
      await refreshAccessToken();
      // Retry with new token
      headers = getAuthHeaders(options.method !== 'GET');
      requestOptions.headers = {
        ...headers,
        ...options.headers
      };
      response = await fetch(url, requestOptions);
    } catch (refreshError) {
      // Refresh failed, redirect to login
      clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }
  
  return response;
};