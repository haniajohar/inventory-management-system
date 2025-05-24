import { useState } from "react";

export default function ProductModal({ onClose, onProductAdded, editingProduct = null }) {
  const [formData, setFormData] = useState({
    product_name: editingProduct?.product_name || '',
    quantity: editingProduct?.quantity || '',
    unit: editingProduct?.unit || '',
    expiry_date: editingProduct?.expiry_date ? 
      new Date(editingProduct.expiry_date).toISOString().split('T')[0] : '',
    cost_price: editingProduct?.cost_price || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Prepare data for API
      const apiData = {
        product_name: formData.product_name,
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        expiry_date: formData.expiry_date || null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      };

      const url = editingProduct 
        ? `http://localhost:5000/api/products/update/${editingProduct.id}`
        : 'http://localhost:5000/api/products/add';
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Product saved successfully:', result);

      // Call the callback to refresh the product list
      if (onProductAdded) {
        onProductAdded();
      }

      // Close the modal
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-md shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="product_name"
              placeholder="Enter product name"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.product_name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              placeholder="Enter quantity"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.quantity}
              onChange={handleChange}
              min="0"
              step="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit *
            </label>
            <select
              name="unit"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.unit}
              onChange={handleChange}
              required
            >
              <option value="">Select Unit</option>
              <option value="pieces">Pieces</option>
              <option value="kg">Kilograms</option>
              <option value="g">Grams</option>
              <option value="liters">Liters</option>
              <option value="ml">Milliliters</option>
              <option value="boxes">Boxes</option>
              <option value="bottles">Bottles</option>
              <option value="packets">Packets</option>
              <option value="units">Units</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiry_date"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.expiry_date}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost Price
            </label>
            <input
              type="number"
              name="cost_price"
              placeholder="Enter cost price"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.cost_price}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? 'Saving...' : (editingProduct ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}