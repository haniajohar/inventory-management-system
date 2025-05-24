"use client";

import React from "react";

export default function ProductTable({ selectedProducts, setSelectedProducts, onNext, onBack, allProducts }) {
  const toggleSelection = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  // Display loading message if allProducts is empty or null/undefined
  if (!allProducts || allProducts.length === 0) {
    return (
      <div className="bg-white text-black shadow rounded-md p-6">
        <p>No products found or still loading...</p>
        <div className="mt-6 flex justify-between">
          <button onClick={onBack} className="px-4 py-2 bg-gray-400 text-black rounded hover:bg-purple-900">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-black shadow rounded-md p-6">
      <h2 className="text-2xl font-semibold mb-4">📦 Select Products to Analyze</h2>

      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b font-medium">
            <th className="py-2">Select</th>
            <th className="py-2">Product Name</th>
            <th className="py-2">Quantity</th> {/* Display current quantity from DB */}
            <th className="py-2">Unit</th> {/* Display unit from DB */}
          </tr>
        </thead>
        <tbody>
          {/* Use allProducts from props instead of sampleProducts */}
          {allProducts.map((product) => (
            <tr key={product.id} className="border-b">
              <td className="py-2">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => toggleSelection(product.id)}
                />
              </td>
              <td className="py-2">{product.product_name}</td> {/* Use product_name from DB */}
              <td className="py-2">{product.quantity}</td> {/* Use quantity from DB */}
              <td className="py-2">{product.unit}</td> {/* Use unit from DB */}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="px-4 py-2 bg-gray-400 text-black rounded hover:bg-purple-900">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={selectedProducts.length === 0}
          className={`px-4 py-2 rounded text-black ${
            selectedProducts.length === 0 ? "bg-gray-400" : "bg-purple-900 hover:bg-purple-900"
          }`}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
