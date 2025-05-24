'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const router = useRouter();

  // State for step control
  const [step, setStep] = useState(1);

  // Auth-related states
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Business-related states
  const [businessType, setBusinessType] = useState('');
  const [trackExpiry, setTrackExpiry] = useState(false);
  const [trackStock, setTrackStock] = useState(false);
  const [trackReport, setTrackReport] = useState(false);

  // Product-related states
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState({
    productName: '',
    quantity: '',
    unit: '',
    expiryDate: '',
    costPrice: '',
  });
  const [editIndex, setEditIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [submissionError, setSubmissionError] = useState('');

  // AI suggestion states
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  // Manual suggestions fallback
  const manualSuggestions = {
    Technology: ['Software Development', 'AI & Machine Learning', 'Cybersecurity'],
    Food: ['Catering Services', 'Online Grocery Store', 'Food Delivery App'],
    Health: ['Fitness Coaching', 'Mental Health App', 'Health Supplements Store'],
    Fashion: ['Online Boutique', 'Sustainable Fashion Brand', 'Custom Apparel Design'],
  };

  useEffect(() => {
    // Check authentication on component mount
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('accessToken');
        const storedUserId = localStorage.getItem('user_id');

        setToken(storedToken);
        setUserId(storedUserId);

        // If either token or user_id is missing, redirect to login
        if (!storedToken || !storedUserId) {
          console.log('Auth check failed, redirecting to login');
          router.push('/auth/login');
        } else {
          setAuthenticated(true);
        }
      }
    };

    checkAuth();
  }, [router]);

  // Navigation functions
  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleNextStep = () => {
    // Validate step completion before allowing navigation
    if (step === 1 && businessType === '') {
      setSubmissionError('Please select whether you are doing business or not.');
      return;
    }
    
    if (step === 2 && products.length === 0) {
      setSubmissionError('Please add at least one product before proceeding.');
      return;
    }
    
    if (step === 3 && !trackExpiry && !trackStock && !trackReport) {
      setSubmissionError('Please select one feature to enable.');
      return;
    }
    
    if (step === 4 && selectedCategory === '') {
      setSubmissionError('Please select a business category.');
      return;
    }
    
    // Clear any previous errors
    setSubmissionError('');
    
    if (step < 4) {
      setStep(step + 1);
    }
  };

  // Handle functions
  const handleYes = () => {
    setBusinessType('yes');
    setSubmissionError(''); // Clear any errors
    setStep(2);
  };

  const handleNo = () => {
    setBusinessType('no');
    setSubmissionError(''); // Clear any errors
    setStep(4);
  };

  const handleNext = () => {
    setLoading(true);

    // Save the user's preferences before redirecting
    saveBusinessPreferences()
      .then(() => {
        if (trackExpiry) {
          router.push('/dashboard/expiry');
        } else if (trackStock) {
          router.push('/inventory');
        } else {
          router.push('/reports');
        }
      })
      .catch(error => {
        console.error('Error saving preferences:', error);
        setSubmissionError('Failed to save preferences. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const saveBusinessPreferences = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products/save-business-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          business_type: businessType,
          track_expiry: trackExpiry,
          track_stock: trackStock,
          track_report: trackReport,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  // Add or update product
  const addProduct = async () => {
    if (product.productName && product.quantity && product.unit) {
      setLoading(true);
      setSubmissionError('');

      try {
        const productData = {
          product_name: product.productName,
          quantity: product.quantity,
          unit: product.unit,
          expiry_date: product.expiryDate,
          cost_price: product.costPrice
        };

        if (editIndex !== null) {
          // Update existing product
          const productToUpdate = products[editIndex];
          const response = await fetch(`http://localhost:5000/api/products/update/${productToUpdate.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(productData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update product');
          }

          // Update local state
          const updated = [...products];
          updated[editIndex] = { ...product, id: productToUpdate.id };
          setProducts(updated);
          setEditIndex(null);
        } else {
          // Add new product
          const response = await fetch('http://localhost:5000/api/products/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(productData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add product');
          }

          const responseData = await response.json();
          
          // Add to local state with server-generated ID
          setProducts((prev) => [...prev, { 
            ...product, 
            id: responseData.id || responseData.product_id || Date.now() 
          }]);
        }

        // Clear form
        setProduct({ productName: '', quantity: '', unit: '', expiryDate: '', costPrice: '' });

      } catch (error) {
        console.error('Error saving product:', error);
        
        if (error.message.toLowerCase().includes('token')) {
          alert('Your session has expired. Please log in again.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user_id');
          router.push('/auth/login');
          return;
        }

        setSubmissionError(error.message || 'Failed to save product. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (index) => {
    setProduct(products[index]);
    setEditIndex(index);
  };

  const handleDelete = async (index) => {
    const productToDelete = products[index];
    
    // Show confirmation dialog
    const confirmDelete = window.confirm(`Are you sure you want to delete "${productToDelete.productName}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    setLoading(true);
    setSubmissionError('');

    try {
      // Delete from database
      const response = await fetch(`http://localhost:5000/api/products/delete/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      // Remove from local state
      const updated = products.filter((_, i) => i !== index);
      setProducts(updated);

      // Reset edit mode if deleting the item being edited
      if (editIndex === index) {
        setEditIndex(null);
        setProduct({ productName: '', quantity: '', unit: '', expiryDate: '', costPrice: '' });
      } else if (editIndex !== null && editIndex > index) {
        // Adjust edit index if necessary
        setEditIndex(editIndex - 1);
      }

      console.log('Product deleted successfully');

    } catch (error) {
      console.error('Error deleting product:', error);
      
      if (error.message.toLowerCase().includes('token')) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user_id');
        router.push('/auth/login');
        return;
      }

      setSubmissionError(error.message || 'Failed to delete product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAllProducts = async () => {
    if (products.length === 0) {
      setSubmissionError('Please add at least one product before submitting.');
      return;
    }

    setLoading(true);
    setSubmissionError('');

    try {
      // Save business info
      const businessInfoResponse = await fetch('http://localhost:5000/api/products/save-business-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          business_type: businessType,
          track_expiry: trackExpiry,
          track_stock: trackStock,
          track_report: trackReport,
        }),
      });

      if (!businessInfoResponse.ok) {
        const businessError = await businessInfoResponse.json();
        throw new Error(businessError.error || 'Failed to save business info');
      }

      console.log('Business info saved successfully');
      console.log('All products are already saved in the database');
      
      // Move to next step
      setStep(3);

    } catch (error) {
      console.error('Submission Error:', error);

      // Handle potential token-related errors
      if (error.message.toLowerCase().includes('token')) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user_id');
        router.push('/auth/login');
        return;
      }

      setSubmissionError(error.message || 'Failed to save data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (e) => {
    const selected = e.target.value;
    setSelectedCategory(selected);

    if (selected) {
      setLoadingSuggestion(true);
      try {
        const response = await fetch('/api/ai-suggestion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: selected }),
        });
        const data = await response.json();
        setAiSuggestion(data.suggestion);
      } catch (error) {
        console.error('Error fetching AI suggestion:', error);
        // Use manual fallback if AI fails
        setAiSuggestion(`Suggested business ideas: ${manualSuggestions[selected].join(', ')}`);
      }
      setLoadingSuggestion(false);
    }
  };

  // Final Step (Thank you or Continue page)
  const handleContinue = () => {
    setStep(1); // Redirect back to the Yes/No page
  };

  const handleFinish = () => {
    router.push('/thank-you'); // Go to Thank You page or display a message
  };

  // Add connection testing function
  const testConnection = async () => {
    setSubmissionError('');
    setConnectionStatus('Testing connection...');

    try {
      console.log('Testing API connection with token:', token ? (token.substring(0, 10) + '...') : 'No token');

      const response = await fetch('http://localhost:5000/api/products/debug-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString()
        }),
      });

      const data = await response.json();
      console.log('Debug connection response:', data);

      if (data.status === 'success') {
        setConnectionStatus('✅ Connection successful! API and database are working.');
      } else if (data.status === 'warning') {
        setConnectionStatus(`⚠️ ${data.message}`);
      } else {
        setConnectionStatus(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus(`❌ Connection failed: ${error.message}. Is your backend server running?`);
    }
  };

  // Show loading state until authentication check completes
  if (!authenticated && typeof window !== 'undefined') {
    return (
      <div className="p-6 max-w-xl w-full bg-white shadow-md rounded-md flex items-center justify-center">
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl w-full bg-white shadow-md rounded-md">
      {/* Navigation Bar */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handlePrevious}
          disabled={step === 1}
          className="bg-gray-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="text-lg font-semibold text-black">
          Step {step} of 4
        </div>
        <button
          onClick={handleNextStep}
          disabled={
            step === 4 || // Last step, no next
            (step === 1 && businessType === '') || // Step 1: Must select Yes/No
            (step === 2 && products.length === 0) || // Step 2: Must have products
            (step === 3 && !trackExpiry && !trackStock && !trackReport) || // Step 3: Must select one feature
            (step === 4 && selectedCategory === '') // Step 4: Must select category
          }
          className="bg-purple-900 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <div className="mb-4 p-2 border rounded bg-gray-50 text-sm">
          {connectionStatus}
        </div>
      )}

      {/* Debug Button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={testConnection}
          className="text-blue-500 underline text-sm"
        >
          Test API Connection
        </button>
      </div>

      {/* Step 1: Business Decision */}
      {step === 1 && (
        <div>
          <h2 className="text-xl text-black font-semibold mb-4">Are you doing a business?</h2>
          
          {submissionError && (
            <div className="mb-4 text-red-500 bg-red-50 p-3 rounded">
              {submissionError}
            </div>
          )}
          
          <div className="space-x-4">
            <button 
              onClick={handleYes} 
              className={`px-6 py-3 rounded-md font-medium ${
                businessType === 'yes' 
                  ? 'bg-purple-900 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-purple-100'
              }`}
            >
              Yes
            </button>
            <button 
              onClick={handleNo} 
              className={`px-6 py-3 rounded-md font-medium ${
                businessType === 'no' 
                  ? 'bg-purple-900 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-purple-100'
              }`}
            >
              No
            </button>
          </div>
          
          {businessType && (
            <div className="mt-4 text-green-600 font-medium">
              ✓ Selection made: {businessType === 'yes' ? 'Yes, I have a business' : 'No, I need business ideas'}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Collect Product Information */}
      {step === 2 && businessType === 'yes' && (
        <div>
          <h2 className="text-xl text-black font-semibold mb-4">Great! Let's collect your products</h2>
          
          {/* Product Form */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-black mb-4">
              {editIndex !== null ? 'Edit Product' : 'Add New Product'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Product Name */}
              <div>
                <label className="block text-black font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  name="productName"
                  placeholder="e.g., Milk"
                  value={product.productName}
                  onChange={handleProductChange}
                  className="w-full px-4 text-black py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-black font-medium mb-1">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  placeholder="e.g., 10"
                  value={product.quantity}
                  onChange={handleProductChange}
                  className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-black font-medium mb-1">Unit *</label>
                <select
                  name="unit"
                  value={product.unit}
                  onChange={handleProductChange}
                  className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Unit</option>
                  <option value="kg">kg</option>
                  <option value="liters">liters</option>
                  <option value="pieces">pieces</option>
                  <option value="boxes">boxes</option>
                </select>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-black font-medium mb-1">Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={product.expiryDate}
                  onChange={handleProductChange}
                  className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Cost Price */}
              <div>
                <label className="block text-black font-medium mb-1">Cost Price</label>
                <input
                  type="number"
                  name="costPrice"
                  placeholder="e.g., 120"
                  value={product.costPrice}
                  onChange={handleProductChange}
                  className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Add Button */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addProduct}
                  disabled={loading || !product.productName || !product.quantity || !product.unit}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
                >
                  {loading ? 'Saving...' : (editIndex !== null ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </div>
          </div>

          {/* Products Table */}
          {products.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-black mb-4">Added Products ({products.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((prod, index) => (
                      <tr key={index} className={editIndex === index ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {prod.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {prod.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {prod.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {prod.expiryDate || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {prod.costPrice || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(index)}
                            disabled={loading}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {editIndex === index ? 'Editing...' : 'Edit'}
                          </button>
                          <button
                            onClick={() => handleDelete(index)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {submissionError && (
            <div className="mb-4 text-red-500 bg-red-50 p-3 rounded">
              {submissionError}
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-4">
            <button
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded text-lg"
              onClick={handleSubmitAllProducts}
              disabled={loading || products.length === 0}
            >
              {loading ? "Submitting..." : `Submit All Products (${products.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Feature Selection */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-black">Select Feature to Enable</h2>
          <p className="text-gray-600 mb-4">Choose one feature that you'd like to focus on:</p>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="feature"
                checked={trackExpiry && !trackStock && !trackReport}
                onChange={() => {
                  setTrackExpiry(true);
                  setTrackStock(false);
                  setTrackReport(false);
                }}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium text-black">Expiry Tracking</div>
                <div className="text-sm text-gray-600">Monitor product expiry dates and get alerts</div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="feature"
                checked={trackStock && !trackExpiry && !trackReport}
                onChange={() => {
                  setTrackExpiry(false);
                  setTrackStock(true);
                  setTrackReport(false);
                }}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium text-black">Stock Monitoring</div>
                <div className="text-sm text-gray-600">Keep track of inventory levels and stock alerts</div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="feature"
                checked={trackReport && !trackExpiry && !trackStock}
                onChange={() => {
                  setTrackExpiry(false);
                  setTrackStock(false);
                  setTrackReport(true);
                }}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium text-black">Progress Reports</div>
                <div className="text-sm text-gray-600">Generate detailed analytics and business reports</div>
              </div>
            </label>
          </div>

          {submissionError && (
            <div className="text-red-500 bg-red-50 p-3 rounded">
              {submissionError}
            </div>
          )}

          <button
            onClick={handleNext}
            className="bg-purple-900 text-white px-6 py-3 rounded-md disabled:opacity-50 text-lg"
            disabled={loading || (!trackExpiry && !trackStock && !trackReport)}
          >
            {loading ? 'Saving...' : 'Continue to Dashboard'}
          </button>
        </div>
      )}

      {/* AI Suggestions Step (If No) */}
      {step === 4 && businessType === 'no' && (
        <div>
          <h2 className="text-xl text-black font-semibold mb-4">Please tell us your business category:</h2>
          
          {submissionError && (
            <div className="mb-4 text-red-500 bg-red-50 p-3 rounded">
              {submissionError}
            </div>
          )}
          
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 mb-4"
          >
            <option value="">Select Category</option>
            <option value="Technology">Technology</option>
            <option value="Food">Food</option>
            <option value="Health">Health</option>
            <option value="Fashion">Fashion</option>
          </select>

          {selectedCategory && (
            <div className="mb-4 text-green-600 font-medium">
              ✓ Category selected: {selectedCategory}
            </div>
          )}

          {loadingSuggestion ? (
            <div className="mt-4 text-blue-600">Loading AI suggestions...</div>
          ) : aiSuggestion ? (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-green-800">
              <strong>AI Suggestion:</strong> {aiSuggestion}
            </div>
          ) : selectedCategory ? (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-blue-800">
              <strong>Suggested business ideas:</strong> {manualSuggestions[selectedCategory]?.join(', ')}
            </div>
          ) : (
            <div className="mt-4 text-gray-600">Select a category to see suggestions</div>
          )}

          <div className="space-x-4 mt-6">
            <button onClick={handleContinue} className="bg-blue-600 text-white px-4 py-2 rounded-md">Continue</button>
            <button onClick={handleFinish} className="bg-green-600 text-white px-4 py-2 rounded-md">Finish</button>
          </div>
        </div>
      )}
    </div>
  );
}