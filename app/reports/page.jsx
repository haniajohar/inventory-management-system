"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function SalesReportPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  const [salesSummaryByProduct, setSalesSummaryByProduct] = useState([]);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);

  useEffect(() => {
    const fetchSalesData = async () => {
      if (typeof window === 'undefined') return;

      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) {
        console.log('No token found, redirecting to login.');
        router.push('/auth/login');
        return;
      }
      setAuthenticated(true);
      setLoading(true);
      setError(null);

      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        };

        // Fetch Sales Summary by Product
        const summaryResponse = await fetch('http://localhost:5000/api/products/sales/summary-by-product', { headers });
        if (!summaryResponse.ok) {
          if (summaryResponse.status === 401) {
            console.error('Authentication failed during sales summary fetch. Token expired or invalid.');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user_id');
            router.push('/auth/login');
            return;
          }
          throw new Error(`Failed to fetch sales summary: ${summaryResponse.statusText}`);
        }
        const summaryData = await summaryResponse.json();
        setSalesSummaryByProduct(summaryData);

        // Fetch Daily Revenue
        const dailyRevenueResponse = await fetch('http://localhost:5000/api/products/sales/daily-revenue', { headers });
        if (!dailyRevenueResponse.ok) {
          if (dailyRevenueResponse.status === 401) {
            console.error('Authentication failed during daily revenue fetch. Token expired or invalid.');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user_id');
            router.push('/auth/login');
            return;
          }
          throw new Error(`Failed to fetch daily revenue: ${dailyRevenueResponse.statusText}`);
        }
        const dailyRevenueData = await dailyRevenueResponse.json();
        setDailyRevenue(dailyRevenueData);

        // Fetch All Transactions
        const transactionsResponse = await fetch('http://localhost:5000/api/products/sales/all-transactions', { headers });
        if (!transactionsResponse.ok) {
          if (transactionsResponse.status === 401) {
            console.error('Authentication failed during transactions fetch. Token expired or invalid.');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user_id');
            router.push('/auth/login');
            return;
          }
          throw new Error(`Failed to fetch all transactions: ${transactionsResponse.statusText}`);
        }
        const transactionsData = await transactionsResponse.json();
        setAllTransactions(transactionsData);

      } catch (err) {
        console.error('Error fetching sales data:', err);
        setError(err.message || 'Failed to fetch sales data.');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [router]);

  // Data for Sales by Product Bar Chart
  const productSalesData = {
    labels: salesSummaryByProduct.map(s => s.product_name),
    datasets: [
      {
        label: 'Total Quantity Sold',
        data: salesSummaryByProduct.map(s => parseInt(s.total_quantity_sold)), // Parse as int
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Total Revenue ($)',
        data: salesSummaryByProduct.map(s => parseFloat(s.total_revenue)), // Parse as float
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const productSalesOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sales Performance by Product',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Product Name',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantity / Revenue',
        },
      },
    },
  };

  // Data for Daily Revenue Line Chart
  const dailyRevenueChartData = {
    labels: dailyRevenue.map(d => d.sale_date ? new Date(d.sale_date).toLocaleDateString() : 'N/A'),
    datasets: [
      {
        label: 'Daily Revenue ($)',
        data: dailyRevenue.map(d => parseFloat(d.daily_total_revenue)), // Parse as float
        fill: false,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.1,
      },
    ],
  };

  const dailyRevenueOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Total Revenue (Last 30 Days)',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Revenue ($)',
        },
      },
    },
  };

  // Data for Product Revenue Distribution Pie Chart
  const productRevenuePieData = {
    labels: salesSummaryByProduct.map(s => s.product_name),
    datasets: [
      {
        label: 'Revenue Share',
        data: salesSummaryByProduct.map(s => parseFloat(s.total_revenue)), // Parse as float
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };


  if (!authenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-700">{loading ? "Loading sales data..." : "Authenticating..."}</p>
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
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">📊 Sales Report</h1>

      {salesSummaryByProduct.length === 0 && dailyRevenue.length === 0 && allTransactions.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center text-gray-600">
          <p className="text-lg mb-4">No sales data available yet.</p>
          <p className="mb-6">Record some sales to see your reports here!</p>
          <button
            onClick={() => router.push('/sales/record')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold shadow-md"
          >
            Record New Sale
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Total Revenue</h2>
              <p className="text-4xl font-bold text-green-600">
                ${allTransactions.reduce((acc, t) => acc + parseFloat(t.sale_price), 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Total Items Sold</h2>
              <p className="text-4xl font-bold text-blue-600">
                {allTransactions.reduce((acc, t) => acc + parseInt(t.quantity_sold), 0)}
              </p>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Unique Products Sold</h2>
              <p className="text-4xl font-bold text-purple-600">
                {new Set(allTransactions.map(t => t.product_id)).size}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Sales by Product</h2>
              {salesSummaryByProduct.length > 0 ? (
                <Bar data={productSalesData} options={productSalesOptions} />
              ) : (
                <p className="text-gray-500">No product sales summary available.</p>
              )}
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Daily Revenue Trends</h2>
              {dailyRevenue.length > 0 ? (
                <Line data={dailyRevenueChartData} options={dailyRevenueOptions} />
              ) : (
                <p className="text-gray-500">No daily revenue data available.</p>
              )}
            </div>
             <div className="bg-white shadow-lg rounded-lg p-6 col-span-1 lg:col-span-2 flex justify-center">
              <div className="w-full max-w-md"> {/* Adjust max-w-md for sizing */}
                <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">Product Revenue Distribution</h2>
                {salesSummaryByProduct.length > 0 ? (
                  <Pie data={productRevenuePieData} />
                ) : (
                  <p className="text-gray-500 text-center">No product revenue data for pie chart.</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Sales Transactions</h2>
            {allTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity Sold
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sale Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sale Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {transaction.quantity_sold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          ${parseFloat(transaction.sale_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {transaction.sale_date ? new Date(transaction.sale_date).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No recent transactions to display.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
