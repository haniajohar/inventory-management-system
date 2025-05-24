"use client";

import React from "react";

export default function Suggestions({ stockData, selectedProducts, allProducts, onBack }) {
  const calculateSuggestion = (productId) => {
    const data = stockData[productId];
    if (!data) return null;

    const { stock, sold } = data; // Use 'stock' and 'sold' as per StockInputForm
    const product = allProducts.find((prod) => prod.id === productId);
    const productName = product ? product.product_name : 'Unknown Product';

    let suggestion = "";
    const remaining = stock - sold;
    const sellRate = stock > 0 ? ((sold / stock) * 100).toFixed(1) : 0;

    if (sellRate >= 80) {
      suggestion = `🟢 "${productName}" is performing great! Consider restocking.`;
    } else if (sellRate >= 50) {
      suggestion = `🟡 "${productName}" has moderate sales. Monitor trend.`;
    } else { // sellRate < 50
      suggestion = `🔴 "${productName}" has low sales. Consider promotions or reducing stock.`;
    }

    // Add more specific suggestions based on remaining stock
    if (remaining <= 5 && stock > 0) {
        suggestion += ` (Only ${remaining} left in stock!)`;
    } else if (remaining === 0 && stock > 0) {
        suggestion += ` (Out of stock!)`;
    }


    return suggestion;
  };

  const productsWithSuggestions = selectedProducts
    .map((id) => {
      const suggestion = calculateSuggestion(id);
      const product = allProducts.find((p) => p.id === id);
      return suggestion ? { id, name: product ? product.product_name : 'Unknown Product', suggestion } : null;
    })
    .filter(Boolean); // Filter out nulls

  return (
    <div className="bg-white shadow-md rounded-md p-4">
      <h2 className="text-lg font-semibold mb-4">💡 Suggestions</h2>
      <div className="space-y-4">
        {productsWithSuggestions.length > 0 ? (
          productsWithSuggestions.map((item) => (
            <div key={item.id} className="border-b py-2">
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-gray-700">{item.suggestion}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No products selected or no specific suggestions generated.</p>
        )}
      </div>
      <div className="mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-400 text-black rounded hover:bg-gray-500"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
