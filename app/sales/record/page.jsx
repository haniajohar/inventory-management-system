// frontend/app/sales/record/page.js
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RecordSalePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantitySold, setQuantitySold] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false); // Add submitting state to prevent double submission

  useEffect(() => {
    const checkAuthAndFetchProducts = async () => {
      if (typeof window === 'undefined') return;

      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) {
        console.log('No token found, redirecting to login.');
        router.push('/auth/login');
        return;
      }
      setAuthenticated(true);

      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        };

        const productsResponse = await fetch('http://localhost:5000/api/products/my-products', { headers });
        if (!productsResponse.ok) {
          if (productsResponse.status === 401) {
            console.error('Authentication failed during product fetch. Token expired or invalid.');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user_id');
            router.push('/auth/login');
            return;
          }
          throw new Error(`Failed to fetch products: ${productsResponse.statusText}`);
        }
        const productsData = await productsResponse.json();
        setProducts(productsData);
        
        // Pre-select the first product if available
        if (productsData.length > 0) {
          setSelectedProduct(productsData[0].id.toString()); // Ensure it's a string
        }

      } catch (err) {
        console.error('Error fetching products:', err);
        setSubmitMessage({ type: "error", text: err.message || 'Failed to fetch products.' });
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchProducts();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage({ type: "", text: "" });
    setSubmitting(true); // Prevent double submission

    if (!authenticated) {
      setSubmitMessage({ type: "error", text: "You are not authenticated." });
      router.push('/auth/login');
      setSubmitting(false);
      return;
    }

    // Validation
    if (!selectedProduct || !quantitySold || !salePrice || !saleDate) {
      setSubmitMessage({ type: "error", text: "Please fill in all fields." });
      setSubmitting(false);
      return;
    }

    const quantityNum = parseInt(quantitySold);
    const priceNum = parseFloat(salePrice);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      setSubmitMessage({ type: "error", text: "Quantity sold must be a positive number." });
      setSubmitting(false);
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setSubmitMessage({ type: "error", text: "Sale price must be a positive number." });
      setSubmitting(false);
      return;
    }

    // Check if there's enough stock
    const selectedProductData = products.find(p => p.id.toString() === selectedProduct);
    if (selectedProductData && selectedProductData.quantity < quantityNum) {
      setSubmitMessage({ 
        type: "error", 
        text: `Insufficient stock. Only ${selectedProductData.quantity} ${selectedProductData.unit} available.` 
      });
      setSubmitting(false);
      return;
    }

    const storedToken = localStorage.getItem('accessToken');

    try {
      console.log('Submitting sale data:', {
        product_id: parseInt(selectedProduct),
        quantity_sold: quantityNum,
        sale_price: priceNum,
        sale_date: saleDate,
      });

      const response = await fetch('http://localhost:5000/api/products/sales/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        },
        body: JSON.stringify({
          product_id: parseInt(selectedProduct),
          quantity_sold: quantityNum,
          sale_price: priceNum,
          sale_date: saleDate,
        }),
      });

      const responseData = await response.json();
      console.log('Response from server:', responseData);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user_id');
          router.push('/auth/login');
          return;
        }
        throw new Error(responseData.message || responseData.error || 'Failed to record sale.');
      }

      setSubmitMessage({ type: "success", text: "Sale recorded successfully!" });
      
      // Reset form fields
      setQuantitySold("");
      setSalePrice("");
      setSaleDate(new Date().toISOString().split('T')[0]);
      
      // Refresh products to show updated quantities
      const productsResponse = await fetch('http://localhost:5000/api/products/my-products', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        }
      });
      
      if (productsResponse.ok) {
        const updatedProducts = await productsResponse.json();
        setProducts(updatedProducts);
        if (updatedProducts.length > 0) {
          setSelectedProduct(updatedProducts[0].id.toString());
        }
      }

    } catch (err) {
      console.error('Error recording sale:', err);
      setSubmitMessage({ type: "error", text: err.message || 'Failed to record sale.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!authenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-700">{loading ? "Loading..." : "Authenticating..."}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">➕ Record New Sale</h1>

      {submitMessage.text && (
        <div className={`p-4 mb-4 rounded-md ${submitMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {submitMessage.text}
        </div>
      )}

      <div className="bg-white shadow-lg rounded-lg p-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="product" className="block text-sm font-medium text-gray-700">Product</label>
            <select
              id="product"
              name="product"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
              disabled={submitting}
            >
              {products.length === 0 ? (
                <option value="">No products available. Please add products first.</option>
              ) : (
                <>
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id.toString()}>
                      {product.product_name} ({product.quantity} {product.unit} remaining)
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label htmlFor="quantitySold" className="block text-sm font-medium text-gray-700">Quantity Sold</label>
            <input
              type="number"
              id="quantitySold"
              name="quantitySold"
              value={quantitySold}
              onChange={(e) => setQuantitySold(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              min="1"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700">Sale Price ($)</label>
            <input
              type="number"
              id="salePrice"
              name="salePrice"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              step="0.01"
              min="0.01"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="saleDate" className="block text-sm font-medium text-gray-700">Sale Date</label>
            <input
              type="date"
              id="saleDate"
              name="saleDate"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              max={new Date().toISOString().split('T')[0]}
              required
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || products.length === 0}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              submitting || products.length === 0
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {submitting ? 'Recording Sale...' : 'Record Sale'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/reports" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View Sales Report
          </Link>
        </div>
      </div>
    </div>
  );
}