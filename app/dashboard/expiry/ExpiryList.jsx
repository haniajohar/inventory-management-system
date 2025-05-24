import { useState } from 'react';

export default function ExpiryList({ products }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Function to get urgency level and color
  const getUrgencyLevel = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { level: 'EXPIRED', color: 'bg-red-600', textColor: 'text-red-600', days: Math.abs(diffDays) };
    } else if (diffDays === 0) {
      return { level: 'TODAY', color: 'bg-red-500', textColor: 'text-red-500', days: 0 };
    } else if (diffDays <= 2) {
      return { level: 'CRITICAL', color: 'bg-red-400', textColor: 'text-red-500', days: diffDays };
    } else if (diffDays <= 5) {
      return { level: 'WARNING', color: 'bg-orange-400', textColor: 'text-orange-600', days: diffDays };
    } else {
      return { level: 'CAUTION', color: 'bg-yellow-400', textColor: 'text-yellow-600', days: diffDays };
    }
  };

  // Function to handle product click
  const handleProductClick = async (product) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`http://localhost:5000/api/products/my-products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const allProducts = await response.json();
        const fullProductData = allProducts.find(p => p.id === product.id);
        setSelectedProduct(fullProductData || product);
        setShowModal(true);
      } else {
        setSelectedProduct(product);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setSelectedProduct(product);
      setShowModal(true);
    }
  };

  // Function to send email alert
  const sendEmailAlert = async (product) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch('http://localhost:5000/api/products/send-expiry-alert', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.product_name,
          expiry_date: product.expiry_date
        })
      });

      if (response.ok) {
        alert(`Email alert sent for ${product.product_name}!`);
      } else {
        alert('Failed to send email alert. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email alert:', error);
      alert('Error sending email alert. Please check your connection.');
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h2 className="text-lg font-medium mb-4">Products Nearing Expiry</h2>
      
      {products.length > 0 ? (
        <div className="space-y-3">
          {products.map((product) => {
            const urgency = getUrgencyLevel(product.expiry_date);
            
            return (
              <div 
                key={product.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleProductClick(product)}
              >
                {/* Status Indicator */}
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${urgency.color} animate-pulse`}></div>
                  <div>
                    <div className="font-medium text-gray-900">{product.product_name}</div>
                    <div className="text-sm text-gray-500">
                      Qty: {product.quantity} {product.unit}
                      {product.cost_price && (
                        <span> • Cost: ${product.cost_price}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expiry Info and Actions */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${urgency.textColor}`}>
                      {urgency.level === 'EXPIRED' ? 'EXPIRED' : 
                       urgency.level === 'TODAY' ? 'EXPIRES TODAY' :
                       `${urgency.days} day${urgency.days !== 1 ? 's' : ''} left`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(product.expiry_date).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sendEmailAlert(product);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Alert
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg">✅ No products nearing expiry</div>
          <div className="text-sm">All your products are fresh!</div>
        </div>
      )}

      {/* Product Details Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Product Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Product Name</label>
                <div className="text-lg">{selectedProduct.product_name}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantity</label>
                  <div>{selectedProduct.quantity}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Unit</label>
                  <div>{selectedProduct.unit}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Expiry Date</label>
                <div className={`${getUrgencyLevel(selectedProduct.expiry_date).textColor} font-medium`}>
                  {new Date(selectedProduct.expiry_date).toLocaleDateString()}
                </div>
              </div>
              
              {selectedProduct.cost_price && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Cost Price</label>
                  <div>${selectedProduct.cost_price}</div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <label className="font-medium">Created</label>
                  <div>{new Date(selectedProduct.created_at).toLocaleDateString()}</div>
                </div>
                {selectedProduct.updated_at && (
                  <div>
                    <label className="font-medium">Updated</label>
                    <div>{new Date(selectedProduct.updated_at).toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => sendEmailAlert(selectedProduct)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Send Email Alert
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}