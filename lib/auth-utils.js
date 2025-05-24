// auth-utils.js
// Place this file in your lib folder (keep your existing location)

// Store user data in localStorage
export const storeUserData = (accessToken, userId, refreshToken = null) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('user_id', userId);
  
  // Store refresh token if provided
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

// Get the access token from localStorage
export const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

// Get the refresh token from localStorage
export const getRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
};

// Get the user ID from localStorage
export const getUserId = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('user_id');
};

// Check if token is expired (basic check)
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
};

// Check if the user is authenticated with token validation
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('accessToken');
  const userId = localStorage.getItem('user_id');
  
  if (!token || !userId) return false;
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    clearAuth(); // Clear expired tokens
    return false;
  }
  
  return true;
};

// Clear authentication data (logout)
export const clearAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user_id');
};

// Refresh the access token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    
    // Try cookie-based refresh first (your current method)
    let res = await fetch('http://localhost:5000/api/auth/refresh-token', {
      method: 'POST',
      credentials: 'include', // needed for cookies
    });
    
    // If cookie method fails and we have a refresh token, try token-based refresh
    if (!res.ok && refreshToken) {
      res = await fetch('http://localhost:5000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
    
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('accessToken', data.token || data.accessToken);
      
      // Update refresh token if provided
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      return data.token || data.accessToken;
    }
    
    throw new Error('Failed to refresh token');
  } catch (error) {
    console.error('Token refresh error:', error);
    clearAuth(); // Clear invalid tokens
    return null;
  }
};

// Make authenticated API requests with automatic token refresh
export const makeAuthenticatedRequest = async (url, options = {}) => {
  let token = getAccessToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  
  const makeRequest = async (authToken) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...options.headers,
    };
    
    return fetch(url, {
      ...options,
      headers,
    });
  };
  
  try {
    let response = await makeRequest(token);
    
    // If token expired, try to refresh and retry
    if (response.status === 401) {
      console.log('Token expired, attempting to refresh...');
      
      const newToken = await refreshAccessToken();
      if (newToken) {
        response = await makeRequest(newToken);
      } else {
        throw new Error('Failed to refresh authentication token');
      }
    }
    
    return response;
  } catch (error) {
    console.error('Authenticated request failed:', error);
    throw error;
  }
};

// Login helper function
export const login = async (credentials) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include', // for cookies
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }
    
    const data = await response.json();
    
    // Store authentication data
    storeUserData(
      data.accessToken || data.token, 
      data.user?.id || data.userId,
      data.refreshToken
    );
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout helper function
export const logout = async () => {
  try {
    const refreshToken = getRefreshToken();
    
    // Call logout endpoint
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local tokens
    clearAuth();
  }
};

// Debug function
export const debugAuth = () => {
  const token = getAccessToken();
  const userId = getUserId();
  const refreshToken = getRefreshToken();
  const isAuth = isAuthenticated();
  
  console.log('=== Auth Debug Info ===');
  console.log('Access token:', token ? `${token.substring(0, 20)}...` : 'None');
  console.log('Refresh token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'None');
  console.log('User ID:', userId);
  console.log('Is authenticated:', isAuth);
  console.log('Token expired:', token ? isTokenExpired(token) : 'No token');
  
  return { token, userId, refreshToken, isAuthenticated: isAuth };
};