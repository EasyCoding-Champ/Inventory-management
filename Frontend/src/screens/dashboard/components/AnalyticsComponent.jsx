import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import axios from "axios";
import { SERVER_URL } from "../../../router";
import "chart.js/auto";

export const AnalyticsComponent = () => {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState([]);
  const [profitData, setProfitData] = useState({ summary: {}, total: {} });
  const [loadingProfit, setLoadingProfit] = useState(true);

  // Fetch Product Summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get(`${SERVER_URL}/api/v1/analytics/summary`);
        setSummaryData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching summary data:", error);
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Pie chart data
  const pieData = {
    labels: summaryData.map(item => item.name),
    datasets: [
      {
        label: "Product Counts",
        data: summaryData.map(item => item.count),
        backgroundColor: [
          "#4CAF50", "#FFC107", "#2196F3", "#FF5722", "#9C27B0", "#00BCD4"
        ],
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Product Summary Table */}
      <div className="col-span-1 bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Product Summary</h2>
        {summaryData.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Product</th>
                <th className="border px-4 py-2 text-left">Count</th>
              </tr>
            </thead>
            <tbody>
  {summaryData.map((item, idx) => (
    <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
      <td className="border px-4 py-2">{item.name}</td>
      <td className="border px-4 py-2">
        {item.count} {item.unit} {/* ✅ no hardcoding */}
      </td>
    </tr>
  ))}
</tbody>
          </table>
        )}
      </div>

      {/* Pie Chart */}
      <div className="col-span-1 bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-xl font-semibold mb-4">All Products (Pie Chart)</h2>
        <Pie data={pieData} />
      </div>
    </div>
  );
};

export default AnalyticsComponent;
