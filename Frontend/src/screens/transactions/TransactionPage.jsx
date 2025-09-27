import React, { useState, useEffect } from "react";
import axios from "axios";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import LoadingIndicator from "../../components/LoadingIndicator";
import { SERVER_URL } from "../../router";

export default function TransactionsScreen() {
  const [isLoading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, searchTerm]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER_URL}/api/v1/transactions`, {
        params: {
          page: currentPage,
          itemsPerPage,
          search: searchTerm,
        },
      });
      setTransactions(res.data.data);
      setTotalPages(res.data.pages_count);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="m-5">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-900">Transactions</h1>
        <p className="text-lg text-neutral-600">
          Here are all customer transactions!
        </p>
      </div>
      <br />

      <div className="flex gap-3 items-center justify-between">
        <input
          type="text"
          className="outline-none px-3 py-1 border-neutral-500 border-2 rounded-md text-lg"
          placeholder="Search by customer name or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <br />

      <div className="border rounded-md border-neutral-700">
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse">
            <thead className="border-b text-left">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Customer Name</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Total Amount</th>
                <th className="px-4 py-2">Paid Amount</th>
                <th className="px-4 py-2">Balance</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-2 text-center">
                    <LoadingIndicator />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-2 text-center">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx, idx) => (
                  <tr key={tx._id} className="border-b hover:bg-teal-50 hover:text-teal-700">
                    <td className="px-4 py-2">{idx + 1 + (currentPage - 1) * itemsPerPage}</td>
                    <td className="px-4 py-2">{tx.customerId.name}</td>
                    <td className="px-4 py-2">{tx.customerId.phone}</td>
                    <td className="px-4 py-2">₹{tx.totalAmount}</td>
                    <td className="px-4 py-2">₹{tx.paidAmount}</td>
                    <td className="px-4 py-2">₹{tx.balance}</td>
                    <td className={`px-4 py-2 font-semibold ${tx.balance === 0 ? "text-green-600" : "text-red-600"}`}>
                      {tx.balance === 0 ? "Paid" : "Pending"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between py-2 mx-5">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                className="border rounded-md aspect-square w-10 text-center"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              />
              <h5>Per Page</h5>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="flex gap-2 items-center border rounded-md py-1 text-lg font-semibold px-3 hover:bg-teal-50 hover:text-teal-700 text-center"
              >
                <IoIosArrowBack />
                <span>Prev</span>
              </button>
              <input
                type="number"
                min={1}
                className="border rounded-md aspect-square w-10 text-center"
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
              />
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex gap-2 items-center border rounded-md py-1 text-lg font-semibold px-3 hover:bg-teal-50 hover:text-teal-700 text-center"
              >
                <span>Next</span>
                <IoIosArrowForward />
              </button>
              <h6>Total {totalPages} pages</h6>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
