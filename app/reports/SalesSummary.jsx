"use client";

import React from "react";

export default function SalesSummary({ recentSales, allProducts }) {
  if (!recentSales || recentSales.length === 0) {
    return (
      <div className="bg-white text-black shadow-md rounded-md p-4">
        <h2 className="text-lg font-semibold mb-2">Recent Sales</h2>
        <p className="text-gray-600">No recent sales data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-black shadow-md rounded-md p-4">
      <h2 className="text-lg font-semibold mb-2">Recent Sales</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Product</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Date</th>
              <th className="py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map((sale) => {
              // Find the product name using product_id from allProducts
              const product = allProducts.find(p => p.id === sale.product_id);
              const productName = product ? product.product_name : 'Unknown Product';
              
              // Format date nicely
              const saleDate = sale.sale_date ? new Date(sale.sale_date) : null;
              const formattedDate = saleDate ? saleDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A';

              return (
                <tr key={sale.id} className="border-b">
                  <td className="py-2">{productName}</td>
                  <td className="py-2">{sale.quantity_sold}</td> {/* Assuming your DB column is quantity_sold */}
                  <td className="py-2">{formattedDate}</td>
                  <td className="py-2">₹{sale.sale_price.toLocaleString()}</td> {/* Assuming your DB column is sale_price */}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
