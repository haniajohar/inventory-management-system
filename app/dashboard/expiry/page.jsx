"use client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import ExpiryList from "./ExpiryList"; // Your enhanced ExpiryList component
import ExpiryBanner from "./ExpiryBanner"; // Your enhanced ExpiryBanner component
import Navbar from "/components/Navbar";
import Sidebar from "/components/Sidebar";
import Footer from "/components/Footer";

export default function ExpiryPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [expiredProducts, setExpiredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      
      try {
        // Get token - make sure this matches your storage key
        const token = localStorage.getItem("accessToken");
        const userId = localStorage.getItem("user_id");
        
        console.log("Token being sent:", token ? token.substring(0, 10) + '...' : 'No token');
        console.log("User ID:", userId);
        
        // Check if user is authenticated
        if (!token || !userId) {
          console.log('No token or user ID found, redirecting to login');
          router.push('/auth/login');
          return;
        }

        // Make sure the URL matches your backend route structure
        const response = await fetch("http://localhost:5000/api/products/expiry", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          if (response.status === 401) {
            console.log('Unauthorized, redirecting to login');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user_id');
            router.push('/auth/login');
            return;
          }
          
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Expiry data received:', data);

        // Set all products from expiry endpoint
        const allExpiryProducts = data.products || [];
        setProducts(allExpiryProducts);

        // The backend already filters for products expiring within 7 days
        // But let's also filter on frontend for extra safety
        const now = new Date();
        const next7Days = new Date();
        next7Days.setDate(now.getDate() + 7);

        const soonToExpire = allExpiryProducts.filter(product => {
          if (!product.expiry_date) return false;
          const expiryDate = new Date(product.expiry_date);
          return expiryDate >= now.setHours(0,0,0,0) && expiryDate <= next7Days;
        });

        console.log(`Found ${soonToExpire.length} products expiring in the next 7 days`);
        setExpiredProducts(soonToExpire);

      } catch (error) {
        console.error("Failed to fetch expiry products:", error);
        setError(error.message || 'Failed to fetch expiry data');
        
        // If it's a token-related error, redirect to login
        if (error.message.toLowerCase().includes('token') || 
            error.message.toLowerCase().includes('unauthorized')) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user_id');
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [router]);

  // Function to test email configuration
  const testEmailConfig = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch('http://localhost:5000/api/products/test-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setEmailStatus(`✅ Test email sent to ${result.email_sent_to}`);
      } else {
        setEmailStatus('❌ Failed to send test email');
      }
    } catch (error) {
      console.error('Error testing email:', error);
      setEmailStatus('❌ Email test error');
    }
  };

  // Function to refresh data
  const refreshData = () => {
    window.location.reload();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6 min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Expiry Tracker</h1>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <div className="text-gray-600 text-lg">Loading expiry data...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Expiry Tracker</h1>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="text-red-600 mr-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-red-800 font-semibold text-lg">Error loading expiry data</div>
                </div>
                <div className="text-red-700 mb-4">{error}</div>
                <div className="flex space-x-3">
                  <button 
                    onClick={refreshData} 
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard')} 
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        
        <div className="flex-1 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Expiry Tracker</h1>
                <p className="text-gray-600 mt-1">Monitor products nearing expiration</p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={testEmailConfig}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Test Email
                </button>
                <button
                  onClick={refreshData}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>

            {/* Email Status */}
            {emailStatus && (
              <div className={`mb-4 p-3 rounded-lg ${emailStatus.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {emailStatus}
              </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{products.length}</div>
                    <div className="text-gray-600">Total Products Monitored</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{expiredProducts.length}</div>
                    <div className="text-gray-600">Products Expiring Soon</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{products.length - expiredProducts.length}</div>
                    <div className="text-gray-600">Products Safe</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Alert Banner */}
            <ExpiryBanner expiredProducts={expiredProducts} />
            
            {/* Products List */}
            <ExpiryList products={products} />
          </div>
        </div>
      </div>
     
    </div>
  );
}