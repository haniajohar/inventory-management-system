"use client";

import React from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  BarElement, 
  CategoryScale, 
  LinearScale, 
  Tooltip, 
  Legend,
  ArcElement 
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

export default function AnalysisResults({ selectedProducts, stockData, allProducts, onBack, onNext }) {
  // Create analysis data for selected products
  const dataRows = selectedProducts.map((id) => {
    const product = allProducts.find((p) => p.id === id);
    const productName = product ? product.product_name : 'Unknown Product';
    const actualQuantity = product ? product.quantity : 0;
    const costPrice = product ? (product.cost_price || 35) : 35;
    
    const stock = stockData[id]?.stock || 0;
    const sold = stockData[id]?.sold || 0;
    const remaining = stock - sold;
    const sellRate = stock > 0 ? ((sold / stock) * 100).toFixed(1) : 0;
    
    // Calculate financial metrics
    const revenue = sold * (costPrice * 1.4); // 40% markup
    const cost = sold * costPrice;
    const profit = revenue - cost;
    const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
    
    return { 
      id, 
      name: productName, 
      actualQuantity,
      stock, 
      sold, 
      remaining, 
      sellRate: parseFloat(sellRate),
      revenue: Math.round(revenue),
      cost: Math.round(cost),
      profit: Math.round(profit),
      profitMargin: parseFloat(profitMargin),
      costPrice
    };
  });

  // Sort by sell rate for better visualization
  const sortedData = [...dataRows].sort((a, b) => b.sellRate - a.sellRate);

  // Bar chart data for stock vs sold
  const barChartData = {
    labels: sortedData.map((item) => item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name),
    datasets: [
      {
        label: "Total Stock",
        data: sortedData.map((item) => item.stock),
        backgroundColor: "#60a5fa",
        borderColor: "#3b82f6",
        borderWidth: 1,
      },
      {
        label: "Sold",
        data: sortedData.map((item) => item.sold),
        backgroundColor: "#34d399",
        borderColor: "#10b981",
        borderWidth: 1,
      },
      {
        label: "Remaining",
        data: sortedData.map((item) => item.remaining),
        backgroundColor: "#fbbf24",
        borderColor: "#f59e0b",
        borderWidth: 1,
      },
    ],
  };

  // Doughnut chart for revenue distribution
  const doughnutData = {
    labels: sortedData.map((item) => item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name),
    datasets: [
      {
        label: "Revenue Share",
        data: sortedData.map((item) => item.revenue),
        backgroundColor: [
          "#8b5cf6", "#06d6a0", "#f72585", "#4cc9f0", "#7209b7",
          "#f77f00", "#fcbf49", "#d62828", "#003566", "#0077b6"
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { 
        position: "top",
        labels: {
          font: { size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.dataset.label === "Revenue Share") {
              return `${context.label}: ₹${context.parsed.toLocaleString()}`;
            }
            return `${context.dataset.label}: ${context.parsed}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 11 }
        }
      },
      x: {
        ticks: {
          font: { size: 11 },
          maxRotation: 45
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { 
        position: "right",
        labels: {
          font: { size: 10 },
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ₹${context.parsed.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Generate performance-based suggestions
  const generateSuggestions = (item) => {
    const suggestions = [];
    
    if (item.sellRate >= 80) {
      suggestions.push(`🟢 "${item.name}" is a top performer! Consider restocking soon.`);
      if (item.remaining <= 5) {
        suggestions.push(`⚠️ Only ${item.remaining} units left - urgent restocking needed.`);
      }
    } else if (item.sellRate >= 50) {
      suggestions.push(`🟡 "${item.name}" has moderate performance. Monitor trends.`);
      if (item.remaining > item.sold * 2) {
        suggestions.push(`📦 Consider promotional strategies to move excess inventory.`);
      }
    } else if (item.sellRate >= 20) {
      suggestions.push(`🟠 "${item.name}" has low sales. Consider price adjustments or promotions.`);
    } else {
      suggestions.push(`🔴 "${item.name}" is underperforming. Review pricing, placement, or consider discontinuing.`);
    }

    // Profit margin suggestions
    if (item.profitMargin < 20) {
      suggestions.push(`💰 Low profit margin (${item.profitMargin}%) - consider price optimization.`);
    } else if (item.profitMargin > 50) {
      suggestions.push(`💎 Excellent profit margin (${item.profitMargin}%) - maintain current strategy.`);
    }

    return suggestions;
  };

  // Calculate totals
  const totals = dataRows.reduce((acc, item) => ({
    revenue: acc.revenue + item.revenue,
    cost: acc.cost + item.cost,
    profit: acc.profit + item.profit,
    totalStock: acc.totalStock + item.stock,
    totalSold: acc.totalSold + item.sold
  }), { revenue: 0, cost: 0, profit: 0, totalStock: 0, totalSold: 0 });

  const overallProfitMargin = totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : 0;
  const overallSellRate = totals.totalStock > 0 ? ((totals.totalSold / totals.totalStock) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white shadow rounded-md p-6 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📈 Performance Analysis</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-blue-600 font-medium">Total Revenue</p>
            <p className="text-xl font-bold text-blue-800">₹{totals.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <p className="text-green-600 font-medium">Total Profit</p>
            <p className="text-xl font-bold text-green-800">₹{totals.profit.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <p className="text-purple-600 font-medium">Profit Margin</p>
            <p className="text-xl font-bold text-purple-800">{overallProfitMargin}%</p>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <p className="text-orange-600 font-medium">Overall Sell Rate</p>
            <p className="text-xl font-bold text-orange-800">{overallSellRate}%</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Stock Analysis</h3>
          <Bar data={barChartData} options={chartOptions} />
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Revenue Distribution</h3>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      {/* Detailed Table */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Detailed Performance Metrics</h3>
        <table className="min-w-full text-sm border border-gray-200">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="py-3 px-4 font-semibold border-r">Product</th>
              <th className="py-3 px-4 font-semibold border-r">DB Qty</th>
              <th className="py-3 px-4 font-semibold border-r">Stock</th>
              <th className="py-3 px-4 font-semibold border-r">Sold</th>
              <th className="py-3 px-4 font-semibold border-r">Remaining</th>
              <th className="py-3 px-4 font-semibold border-r">Sell Rate</th>
              <th className="py-3 px-4 font-semibold border-r">Revenue</th>
              <th className="py-3 px-4 font-semibold border-r">Profit</th>
              <th className="py-3 px-4 font-semibold">Margin</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr key={item.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="py-3 px-4 font-medium border-r">{item.name}</td>
                <td className="py-3 px-4 border-r text-gray-600">{item.actualQuantity}</td>
                <td className="py-3 px-4 border-r">{item.stock}</td>
                <td className="py-3 px-4 border-r text-green-600 font-medium">{item.sold}</td>
                <td className="py-3 px-4 border-r">{item.remaining}</td>
                <td className="py-3 px-4 border-r">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.sellRate >= 80 ? 'bg-green-100 text-green-800' :
                    item.sellRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                    item.sellRate >= 20 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.sellRate}%
                  </span>
                </td>
                <td className="py-3 px-4 border-r text-blue-600 font-medium">₹{item.revenue.toLocaleString()}</td>
                <td className="py-3 px-4 border-r text-green-600 font-medium">₹{item.profit.toLocaleString()}</td>
                <td className="py-3 px-4">
                  <span className={`${item.profitMargin >= 30 ? 'text-green-600' : item.profitMargin >= 20 ? 'text-yellow-600' : 'text-red-600'} font-medium`}>
                    {item.profitMargin}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Suggestions Section */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">💡 Actionable Insights</h3>
        <div className="space-y-3">
          {sortedData.map((item) => {
            const suggestions = generateSuggestions(item);
            return (
              <div key={item.id} className="bg-white p-3 rounded border-l-4 border-blue-400">
                <h4 className="font-medium text-gray-800 mb-1">{item.name}</h4>
                {suggestions.map((suggestion, idx) => (
                  <p key={idx} className="text-sm text-gray-700 mb-1">{suggestion}</p>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={onBack}
          className="flex items-center px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          ← Back to Stock Input
        </button>
        <button
          onClick={onNext}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          View Detailed Suggestions →
        </button>
      </div>
    </div>
  );
}