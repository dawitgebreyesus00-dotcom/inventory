// Token management utility
const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY) || '';
};

export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || '';
};

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const setRefreshToken = (token) => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const removeRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const clearTokens = () => {
  removeToken();
  removeRefreshToken();
};

export const getAuthHeaders = (isJson = false) => {
  const token = getToken();
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// Refresh token function
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');
  
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: refreshToken })
  });
  
  if (!response.ok) {
    clearTokens();
    throw new Error('Failed to refresh token');
  }
  
  const data = await response.json();
  if (data.success && data.accessToken) {
    setToken(data.accessToken);
    return data.accessToken;
  }
  
  throw new Error('Invalid refresh response');
};

// Export as object for named import
export const tokenUtils = {
  getToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  removeToken,
  removeRefreshToken,
  clearTokens,
  getAuthHeaders,
  refreshAccessToken
};