import { useState, useEffect } from "react";
import axios from "axios";
import { SERVER_URL } from "../../router";
import "chart.js/auto";

export const SellProfit = () => {
  const [loading, setLoading] = useState(true);
  const [profitData, setProfitData] = useState({ summary: {}, total: {} });
  const [loadingProfit, setLoadingProfit] = useState(true);

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate()); // NEW: optional day filter
  const [statementData, setStatementData] = useState([]);

  const fetchProfitData = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/v1/sellProfit/profit`);
      setProfitData(res.data);
    } catch (err) {
      console.error("Error fetching profit data:", err);
    } finally {
      setLoadingProfit(false);
    }
  };

  const fetchStatement = async () => {
    try {
      const res = await axios.get(
        `${SERVER_URL}/api/v1/sellProfit/statement`,
        { params: { year, month, day: day || undefined } } // send day if selected
      );
      setStatementData(res.data.rows || []);
    } catch (err) {
      console.error("Error fetching statement:", err);
    }
  };

  useEffect(() => {
    fetchProfitData();
    fetchStatement();
  }, [year, month, day]); // re-fetch when day changes

  const downloadStatement = async (format) => {
    try {
      const url = `${SERVER_URL}/api/v1/sellProfit/statement`;
      //const params = { year, month, day: day || undefined, format };
      const params = { year, month, format };
      const response = await axios.get(url, {
        params,
        responseType: format === "pdf" || format === "csv" ? "blob" : "json",
      });

      if (format === "json") {
        setStatementData(response.data.rows || []);
      } else {
        const blob = new Blob([response.data], {
          type:
            format === "pdf"
              ? "application/pdf"
              : "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = `statement_${year}_${month}.${format}`;
        link.click();
      }
    } catch (err) {
      console.error("Error downloading statement:", err);
    }
  };

  return (
    <div className="col-span-1 lg:col-span-2 bg-white rounded-lg shadow-lg p-4 mt-6">
      <h2 className="text-xl font-semibold mb-4">Sell & Profit Summary</h2>

      {/* Year/Month/Day selectors */}
      <div className="flex gap-4 mb-4">
        <div>
          <label>Year: </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border px-2 py-1"
          />
        </div>
        <div>
          <label>Month: </label>
          <input
            type="number"
            min="1"
            max="12"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border px-2 py-1"
          />
        </div>
        <div>
          <label>Day: </label>
          <input
            type="number"
            min="1"
            max="31"
            value={day}
            onChange={(e) => setDay(e.target.value ? Number(e.target.value) : "")}
            className="border px-2 py-1"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadStatement("pdf")}
            className="bg-blue-500 text-white px-4 py-1 rounded"
          >
            Download PDF
          </button>
          {/* <button
            onClick={() => downloadStatement("csv")}
            className="bg-green-500 text-white px-4 py-1 rounded"
          >
            Download CSV
          </button> */}
        </div>
      </div>

      {/* Profit Summary Table */}
      {loadingProfit ? (
        <p>Loading profit data...</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Category</th>
              <th className="border px-4 py-2">Total Sold</th>
              <th className="border px-4 py-2">Total Cost</th>
              <th className="border px-4 py-2">Profit</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(profitData.summary).map((cat, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="border px-4 py-2">{cat}</td>
                <td className="border px-4 py-2">
                  ₹{profitData.summary[cat].totalSoldAmount}
                </td>
                <td className="border px-4 py-2">
                  ₹{profitData.summary[cat].totalCostAmount}
                </td>
                <td className="border px-4 py-2">
                  ₹{profitData.summary[cat].profit}
                </td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-200">
              <td className="border px-4 py-2">Total</td>
              <td className="border px-4 py-2">
                ₹{profitData.total.totalSoldAmount}
              </td>
              <td className="border px-4 py-2">
                ₹{profitData.total.totalCostAmount}
              </td>
              <td className="border px-4 py-2">
                ₹{profitData.total.totalProfit}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Statement Table */}
      <h2 className="text-lg font-semibold mb-2">Statement</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Date</th>
            <th className="border px-4 py-2">Category</th>
            <th className="border px-4 py-2">Quantity</th>
            <th className="border px-4 py-2">Sold</th>
            <th className="border px-4 py-2">Cost</th>
            <th className="border px-4 py-2">Profit</th>
          </tr>
        </thead>
        <tbody>
          {statementData.map((row, idx) => (
            <tr
              key={idx}
              className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
            >
              <td className="border px-4 py-2">{row.Date}</td>
              <td className="border px-4 py-2">{row.Category}</td>
              <td className="border px-4 py-2">{row.Quantity}</td>
              <td className="border px-4 py-2">₹{row.Sold}</td>
              <td className="border px-4 py-2">₹{row.Cost}</td>
              <td className="border px-4 py-2">₹{row.Profit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SellProfit;
