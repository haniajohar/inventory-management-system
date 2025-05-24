import { useState } from 'react';

export default function ExpiryBanner({ expiredProducts }) {
  const [showDetails, setShowDetails] = useState(false);

  // Categorize products by urgency
  const categorizeProducts = () => {
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

  // Send bulk email alert
  const sendBulkAlert = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch('http://localhost:5000/api/products/send-bulk-expiry-alert', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          products: expiredProducts.map(p => ({
            id: p.id,
            name: p.product_name,
            expiry_date: p.expiry_date
          }))
        })
      });

      if (response.ok) {
        alert('Bulk email alert sent successfully!');
      } else {
        alert('Failed to send bulk email alert.');
      }
    } catch (error) {
      console.error('Error sending bulk alert:', error);
      alert('Error sending bulk email alert.');
    }
  };

  if (expiredProducts.length === 0) {
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
          
          <button
            onClick={sendBulkAlert}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            Send Alert Email
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
  );
}