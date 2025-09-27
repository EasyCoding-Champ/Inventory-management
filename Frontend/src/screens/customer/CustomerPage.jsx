import React, { useState, useEffect } from "react";
import axios from "axios";
import { SERVER_URL } from "../../router";

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCustomersWithTransactions();
  }, []);

  // Fetch only customers who have placed orders
  const fetchCustomersWithTransactions = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/v1/customers/with-transactions`);
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch customers");
    }
  };

  // Open modal to edit payment
  const editPayment = (customer) => {
    setEditingCustomer(customer);
    setPaidAmount(0);
  };

  // Update paid amount
  const updatePayment = async () => {
    if (!editingCustomer) return;
    try {
      setIsLoading(true);
      await axios.put(`${SERVER_URL}/api/v1/customers/${editingCustomer._id}/pay`, {
        paidAmount,
      });
      setEditingCustomer(null);
      setPaidAmount(0);
      fetchCustomersWithTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to update payment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="m-5">
      <h2 className="text-2xl font-semibold mb-4">Customer Transactions</h2>

      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Phone</th>
            <th className="px-4 py-2 border">Total Amount</th>
            <th className="px-4 py-2 border">Total Paid</th>
            <th className="px-4 py-2 border">Total Due</th>
            <th className="px-4 py-2 border">Last Transaction</th>
            <th className="px-4 py-2 border">Status</th>
            <th className="px-4 py-2 border">Action</th>
            <th className="px-4 py-2 border">Message</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(customers) && customers.length > 0 ? (
            customers.map((c) => (
              <tr key={c._id} className="border-b">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.phone}</td>
                <td className="px-4 py-2">₹{c.totalAmount || 0}</td>
                <td className="px-4 py-2">₹{c.totalPaid || 0}</td>
                <td className="px-4 py-2">₹{c.totalDue || 0}</td>
                <td className="px-4 py-2">
                  {c.latestTransaction
                    ? new Date(c.latestTransaction.createdAt).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-2">
                  {c.totalDue === 0 ? (
                    <span className="text-green-600 font-semibold">Paid</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Pending</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => editPayment(c)}
                    className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                  >
                    Update Payment
                  </button>
                </td>
                <td className="px-4 py-2">
                  {c.totalDue > 0 ? (
                    <a
                      href={`https://wa.me/91${c.phone}?text=Dear ${c.name}, your due amount is ₹${c.totalDue}. Please pay at Bhawani Traders.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    >
                      Send Due WhatsApp
                    </a>
                  ) : (
                    <button
                      disabled
                      className="bg-gray-400 text-white px-2 py-1 rounded cursor-not-allowed"
                    >
                      Paid
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center py-4">
                No customer transactions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Edit Payment Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Update Payment</h3>
            <p>
              Customer: <strong>{editingCustomer.name}</strong>
            </p>
            <p>Total Due: ₹{editingCustomer.totalDue || 0}</p>
            <p>
              Last Transaction:{" "}
              {editingCustomer.latestTransaction
                ? new Date(editingCustomer.latestTransaction.createdAt).toLocaleString()
                : "N/A"}
            </p>
            <div className="mt-4">
              <label className="block mb-1">Paid Amount</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingCustomer(null)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={updatePayment}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
