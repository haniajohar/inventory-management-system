"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

export default function InventoryReportPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const fetchInventoryData = async () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('accessToken');
        if (!storedToken) {
          console.log('No token found, redirecting to login.');
          router.push('/auth/login');
          return;
        }
        setAuthenticated(true);

        try {
          setLoading(true);
          setError(null);
          console.log('Fetching products for inventory report...');
          const response = await fetch('http://localhost:5000/api/products/my-products', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (!response.ok) {
            if (response.status === 401) {
              console.error('Authentication failed during inventory fetch. Token expired or invalid.');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('user_id');
              router.push('/auth/login');
              return;
            }
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log('Products fetched for inventory report:', data);
          setProducts(data);
        } catch (err) {
          console.error('Error fetching inventory data:', err);
          setError(err.message || 'Failed to fetch inventory data.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchInventoryData();
  }, [router]);

  // --- Pie Chart Data ---
  const totalQuantity = products.reduce((sum, product) => sum + (product.quantity || 0), 0);

  const pieChartData = {
    labels: products.map(product => product.product_name),
    datasets: [
      {
        label: 'Quantity in Stock',
        data: products.map(product => product.quantity || 0),
        backgroundColor: products.map((_, index) => {
          // Generate a consistent but varied color for each product
          const hue = (index * 137 + 53) % 360; // Random-ish hue distribution
          return `hsl(${hue}, 70%, 60%)`;
        }),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allows flexible sizing
    plugins: {
      legend: {
        position: 'right', // Position legend to the right
        labels: {
          color: '#333', // Darker text for readability
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw;
            const percentage = totalQuantity > 0 ? ((value / totalQuantity) * 100).toFixed(1) : 0;
            return `${label}: ${value} units (${percentage}%)`;
          }
        }
      }
    },
  };

  // --- Line Graph Data (MOCK DATA for trend) ---
  const generateMockHistoricalData = (numDays = 7) => {
    const labels = [];
    const data = [];
    let currentTotal = totalQuantity > 0 ? totalQuantity : 100; // Start with current total or a base if no products

    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

      // Simulate increase/decrease
      const change = Math.floor(Math.random() * 20) - 10; // -10 to +9
      currentTotal = Math.max(0, currentTotal + change); // Ensure quantity doesn't go below 0
      data.push(currentTotal);
    }
    return { labels, data };
  };

  const mockHistoricalData = generateMockHistoricalData();

  const lineChartData = {
    labels: mockHistoricalData.labels,
    datasets: [
      {
        label: 'Total Inventory Quantity (Mock Trend)',
        data: mockHistoricalData.data,
        fill: false,
        borderColor: '#8b5cf6', // Purple color
        tension: 0.1,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#8b5cf6',
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#333',
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw} units`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          color: '#333',
        },
        ticks: {
          color: '#555',
        },
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Quantity',
          color: '#333',
        },
        beginAtZero: true,
        ticks: {
          color: '#555',
        },
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
      },
    },
  };


  if (!authenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-700">{loading ? "Loading inventory data..." : "Authenticating..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 text-red-700 border border-red-400 rounded-md m-4">
        <p>Error: {error}</p>
        <p>Please ensure your backend is running and you are logged in.</p>
        <button
          onClick={() => router.push('/auth/login')}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-200 min-h-screen">
      <h1 className="text-3xl text-purple-900 font-bold mb-6">📦 Inventory Overview</h1>

      {products.length === 0 ? (
        <div className="bg-white shadow rounded-md p-6 text-center text-gray-600">
          <p>No products found in your inventory. Add some products to see your reports!</p>
          <button
            onClick={() => router.push('/products/add')} // Assuming you have an add product page
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Add New Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pie Chart: Quantity Distribution */}
          <div className="bg-white shadow rounded-md p-6 flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold mb-4 text-black">Product Quantity Distribution</h2>
            <div className="w-full max-w-md h-80"> {/* Fixed height for chart */}
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
            <p className="text-gray-700 mt-4">Total Products in Stock: {totalQuantity}</p>
          </div>

          {/* Line Graph: Mock Inventory Trend */}
          <div className="bg-white shadow rounded-md p-6 flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold mb-4 text-black">Total Inventory Trend (Last 7 Days - Mock Data)</h2>
            <div className="w-full max-w-md h-80"> {/* Fixed height for chart */}
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
            <p className="text-gray-700 mt-4 text-sm">
              *This chart uses mock data to illustrate trends. For real historical data, a database table for inventory snapshots is needed.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-gray-400 text-black rounded-md hover:bg-gray-500 font-semibold"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
