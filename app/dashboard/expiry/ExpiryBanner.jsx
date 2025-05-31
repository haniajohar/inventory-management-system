import { useState, useEffect } from 'react';

export default function ExpiryBanner({ expiredProducts = [] }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAlertSetup, setEmailAlertSetup] = useState(() => {
    // Check if user has already enabled email alerts
    return localStorage.getItem('emailAlertEnabled') === 'true';
  });

  // Show email setup modal when component first loads and has expired products
  useEffect(() => {
    const isAlertEnabled = localStorage.getItem('emailAlertEnabled') === 'true';
    if (expiredProducts && expiredProducts.length > 0 && !isAlertEnabled) {
      setShowEmailModal(true);
    }
  }, [expiredProducts]);

  // Categorize products by urgency
  const categorizeProducts = () => {
    if (!expiredProducts || expiredProducts.length === 0) {
      return {
        expired: [],
        today: [],
        critical: [],
        warning: []
      };
    }

    const today = new Date();
    const categories = {
      expired: [],
      today: [],
      critical: [], // 1-2 days
      warning: []   // 3-7 days
    };

    expiredProducts.forEach(product => {
      const expiry = new Date(product.expiry_date);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        categories.expired.push(product);
      } else if (diffDays === 0) {
        categories.today.push(product);
      } else if (diffDays <= 2) {
        categories.critical.push(product);
      } else {
        categories.warning.push(product);
      }
    });

    return categories;
  };

  // Send email alert and enable automatic alerts
  const sendEmailAlert = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      
      // Enable automatic daily email alerts
      const enableAutoAlerts = await fetch('http://localhost:5000/api/products/enable-auto-alerts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: true,
          frequency: '24h' // Send every 24 hours
        })
      });

      if (!enableAutoAlerts.ok) {
        throw new Error('Failed to enable automatic alerts');
      }

      // Send immediate email alert
      const response = await fetch('http://localhost:5000/api/products/send-expiry-alert', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          products: (expiredProducts || []).map(p => ({
            id: p.id,
            name: p.product_name,
            expiry_date: p.expiry_date
          }))
        })
      });

      if (response.ok) {
        // Save preference to localStorage so modal never shows again
        localStorage.setItem('emailAlertEnabled', 'true');
        localStorage.setItem('emailAlertEnabledDate', new Date().toISOString());
        
        setEmailAlertSetup(true);
        setShowEmailModal(false);
        
        // Success message
        setTimeout(() => {
          alert('Email alerts enabled! You will now receive automatic daily email alerts for expiring products. This message will not appear again.');
        }, 500);
      } else {
        // Check if it's an email-related error
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 400 && (
          errorData.message?.toLowerCase().includes('email') ||
          errorData.error?.toLowerCase().includes('invalid email') ||
          errorData.message?.toLowerCase().includes('incorrect email')
        )) {
          alert('The email address you entered is incorrect. Please check your email settings and try again.');
        } else if (response.status === 404) {
          alert('Email service not found. Please contact support.');
        } else if (response.status === 401) {
          alert('Authentication failed. Please log in again.');
        } else {
          alert('Failed to send email alert. Please check your email address and try again.');
        }
      }
    } catch (error) {
      console.error('Error setting up email alerts:', error);
      if (error.message.includes('fetch')) {
        alert('Connection error. Please check your internet connection and try again.');
      } else {
        alert('Error setting up email alerts. The email address might be incorrect or there may be a connection issue.');
      }
    }
  };

  const handleSkipAlert = () => {
    // Save skip preference so modal doesn't show again for this session
    localStorage.setItem('emailAlertSkipped', 'true');
    localStorage.setItem('emailAlertSkippedDate', new Date().toISOString());
    
    setEmailAlertSetup(true);
    setShowEmailModal(false);
  };

  if (!expiredProducts || expiredProducts.length === 0) {
    return (
      <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg relative mb-4">
        <div className="flex items-center">
          <span className="text-green-600 mr-2">✅</span>
          <strong className="font-bold">All products are fresh!</strong>
          <span className="ml-2">No products are expiring in the next 7 days.</span>
        </div>
      </div>
    );
  }

  const categories = categorizeProducts();
  const hasUrgentProducts = categories.expired.length > 0 || categories.today.length > 0 || categories.critical.length > 0;

  return (
    <>
      {/* Email Alert Setup Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-red-600 text-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 border-2 border-red-700">
            <div className="text-center">
              <div className="text-6xl mb-4">🚨</div>
              <h2 className="text-2xl font-bold mb-4">Alert Setup</h2>
              <p className="text-lg mb-6 leading-relaxed">
                Do you want to receive automatic daily email alerts for expired products or products that will expire within 7 days?
              </p>
              <p className="text-sm mb-6 opacity-90">
                Once enabled, you'll receive alerts every 24 hours automatically - even when you don't visit this page.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={sendEmailAlert}
                  className="w-full bg-white text-red-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  Yes, Enable Daily Email Alerts
                </button>
                
                <button
                  onClick={handleSkipAlert}
                  className="w-full bg-transparent border-2 border-white text-white font-semibold py-3 px-6 rounded-lg hover:bg-white hover:text-red-600 transition-colors duration-200"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Banner Content */}
      <div className={`border px-4 py-3 rounded-lg relative mb-4 ${
        hasUrgentProducts 
          ? 'bg-red-100 border-red-400 text-red-800' 
          : 'bg-yellow-100 border-yellow-400 text-yellow-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className={`mr-2 ${hasUrgentProducts ? 'text-red-600' : 'text-yellow-600'}`}>
              {hasUrgentProducts ? '🚨' : '⚠️'}
            </span>
            <div>
              <strong className="font-bold">
                {hasUrgentProducts ? 'URGENT: ' : 'Attention: '}
              </strong>
              <span>
                {expiredProducts.length} product{expiredProducts.length !== 1 ? 's' : ''} 
                {hasUrgentProducts ? ' need immediate attention!' : ' expiring soon!'}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`px-3 py-1 rounded text-sm ${
                hasUrgentProducts 
                  ? 'bg-red-200 hover:bg-red-300 text-red-800' 
                  : 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800'
              }`}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 space-y-3">
            {categories.expired.length > 0 && (
              <div className="bg-red-200 p-3 rounded">
                <h4 className="font-semibold text-red-900 mb-2">
                  🚨 EXPIRED ({categories.expired.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {categories.expired.map(product => (
                    <div key={product.id} className="text-sm text-red-800">
                      • {product.product_name} - Expired {Math.abs(Math.ceil((new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)))} days ago
                    </div>
                  ))}
                </div>
              </div>
            )}

            {categories.today.length > 0 && (
              <div className="bg-red-150 p-3 rounded">
                <h4 className="font-semibold text-red-900 mb-2">
                  🚨 EXPIRES TODAY ({categories.today.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {categories.today.map(product => (
                    <div key={product.id} className="text-sm text-red-800">
                      • {product.product_name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {categories.critical.length > 0 && (
              <div className="bg-orange-200 p-3 rounded">
                <h4 className="font-semibold text-orange-900 mb-2">
                  ⚠️ CRITICAL - 1-2 Days ({categories.critical.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {categories.critical.map(product => {
                    const days = Math.ceil((new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={product.id} className="text-sm text-orange-800">
                        • {product.product_name} - {days} day{days !== 1 ? 's' : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {categories.warning.length > 0 && (
              <div className="bg-yellow-200 p-3 rounded">
                <h4 className="font-semibold text-yellow-900 mb-2">
                  ⚠️ WARNING - 3-7 Days ({categories.warning.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {categories.warning.map(product => {
                    const days = Math.ceil((new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={product.id} className="text-sm text-yellow-800">
                        • {product.product_name} - {days} day{days !== 1 ? 's' : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}