"use client";

import React from "react";

export default function StockInputForm({
  selectedProducts,
  allProducts, // Now receiving allProducts
  stockData,
  setStockData,
  onNext,
  onBack,
}) {
  const handleChange = (productId, field, value) => {
    setStockData((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: Number(value),
      },
    }));
  };

  // Filter allProducts to only include selected ones for display
  const productsToDisplay = allProducts.filter(p => selectedProducts.includes(p.id));

  if (!productsToDisplay || productsToDisplay.length === 0) {
    return (
      <div className="bg-gray-400 shadow rounded-md p-6">
        <p>No products selected or available for input.</p>
        <div className="mt-6 flex justify-between">
          <button onClick={onBack} className="px-4 py-2 bg-gray-400 text-black rounded hover:bg-gray-600">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-400 shadow rounded-md p-6">
      <h2 className="text-2xl font-semibold mb-4">📊 Enter Stock & Sales</h2>

      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b font-medium">
            <th className="py-2">Product</th>
            <th className="py-2">Total In Stock</th>
            <th className="py-2">Total Sold</th>
          </tr>
        </thead>
        <tbody>
          {productsToDisplay.map((product) => ( // Iterate over filtered products
            <tr key={product.id} className="border-b">
              <td className="py-2">{product.product_name}</td> {/* Use product_name */}
              <td className="py-2">
                <input
                  type="number"
                  min="0"
                  value={stockData[product.id]?.stock || ""}
                  onChange={(e) => handleChange(product.id, "stock", e.target.value)}
                  className="border px-2 py-1 rounded w-20"
                />
              </td>
              <td className="py-2">
                <input
                  type="number"
                  min="0"
                  value={stockData[product.id]?.sold || ""}
                  onChange={(e) => handleChange(product.id, "sold", e.target.value)}
                  className="border px-2 py-1 rounded w-20"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="px-4 py-2 bg-gray-400 text-black rounded hover:bg-gray-600">
          ← Back
        </button>
        <button
          onClick={onNext}
          className="px-4 py-2 bg-gray-400 text-black rounded hover:bg-purple-900"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
