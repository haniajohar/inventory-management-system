'use client';
import { useState, useEffect } from 'react';
import { FiMail, FiLock } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Helper function to handle token storage
const storeUserData = (accessToken, userId) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('user_id', userId);
};

// Helper function to get the stored access token
const getAccessToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

// Helper function to refresh the access token
const refreshAccessToken = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/refresh-token', {
      method: 'POST',
      credentials: 'include', // needed for cookies
    });
    
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('accessToken', data.token);
      return data.token;
    } else {
      // If refresh fails, redirect to login
      throw new Error('Failed to refresh token');
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
};

export default function LoginPage() {
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is already logged in on page load
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          // Optional: Verify token with backend
          // const verifyRes = await fetch('http://localhost:5000/api/auth/verify-token', {
          //   headers: { 'Authorization': `Bearer ${token}` }
          // });
          // if (verifyRes.ok) {
            router.push('/dashboard');
          // }
        } catch (err) {
          console.error('Auth verification error:', err);
          // Clear invalid token
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user_id');
        }
      }
    };
    
    checkAuth();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Sending login request with:', { username, password });
      
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // needed for cookies (refresh token)
      });
      
      const data = await res.json();
      console.log('Login response status:', res.status);
      console.log('Login response data:', data);
      
      if (res.ok) {
        // Success path
        if (data.user && data.user.token) {
          // Store both the access token and user ID from the response
          const userId = data.user.id || data.user._id;
          console.log('Storing user data:', { token: data.user.token, userId });
          storeUserData(data.user.token, userId);
          
          // Redirect to dashboard
          router.push('/dashboard');
        } else {
          setError('Login response missing token or user ID');
        }
      } else {
        // Error path
        setError(data.message || 'Login failed');
        console.error('Login failed with status:', res.status);
        console.error('Error details:', data);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network or parsing error: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-300 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-purple-900 p-6 text-white">
          <h1 className="text-2xl font-bold text-center">Welcome Back</h1>
          <p className="text-center text-purple-100 mt-1">Login to your account</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-purple-900" />
              </div>
              <input
                type="username"
                name="username"
                placeholder="Your user name"
                className="w-full pl-10 pr-4 py-2 text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-purple-900" />
              </div>
              <input
                type="password"
                name="password"
                placeholder="Your password"
                className="w-full pl-10 pr-4 py-2 text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-purple-900 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition duration-200"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="px-6 pb-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-purple-900 hover:underline font-medium">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}