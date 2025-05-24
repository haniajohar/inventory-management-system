"use client";

import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

export default function SalesChart({ salesData }) {
  const weeklySales = salesData?.weeklySales || [
    { day: "Mon", amount: 500 },
    { day: "Tue", amount: 1000 },
    { day: "Wed", amount: 750 },
    { day: "Thu", amount: 1250 },
    { day: "Fri", amount: 900 },
    { day: "Sat", amount: 1100 },
    { day: "Sun", amount: 650 }
  ];

  const data = {
    labels: weeklySales.map(item => item.day),
    datasets: [
      {
        label: "Sales ₹",
        data: weeklySales.map(item => item.amount),
        backgroundColor: "#9333ea", // Purple color
        borderColor: "#7c3aed",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { 
        display: true,
        position: 'top'
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="bg-white shadow-md rounded-md p-4">
      <h2 className="text-lg text-black font-semibold mb-4">Weekly Sales Overview</h2>
      <Bar data={data} options={options} />
    </div>
  );
}