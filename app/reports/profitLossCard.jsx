export default function ProfitLossCard({ salesData }) {
  const revenue = salesData?.totalRevenue || 0;
  const cost = salesData?.totalCost || 0;
  const profit = revenue - cost;

  return (
    <div className="bg-white shadow-md rounded-md p-4 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-600">Revenue</p>
        <p className="text-lg font-bold text-green-600">₹{revenue.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Cost</p>
        <p className="text-lg font-bold text-red-500">₹{cost.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Profit</p>
        <p className="text-lg font-bold text-blue-900">₹{profit.toLocaleString()}</p>
      </div>
    </div>
  );
}