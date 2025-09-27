import mongoose from "mongoose";
import Customer from "../models/customer_model.js";
import Transaction from "../models/transactions_model.js";

// Create Customer
export const createCustomer = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const customer = new Customer({
      name,
      phone,
      address,
      createdBy: req._id,
    });

    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all Customers
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ createdBy: req._id });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get customers with transactions
export const getCustomersWithTransactions = async (req, res) => {
  try {
    const customers = await Customer.aggregate([
      {
        $lookup: {
          from: "transactions",
          localField: "_id",
          foreignField: "customerId",
          as: "transactions",
        },
      },
      { $match: { "transactions.0": { $exists: true } } }, // only customers with transactions
      {
        $addFields: {
          totalAmount: { $sum: "$transactions.totalAmount" },
          totalPaid: { $sum: "$transactions.paidAmount" },
          totalDue: {
            $subtract: [
              { $sum: "$transactions.totalAmount" },
              { $sum: "$transactions.paidAmount" },
            ],
          },
          latestTransaction: {
            $arrayElemAt: [
              {
                $slice: [
                  {
                    $reverseArray: {
                      $sortArray: { input: "$transactions", sortBy: { createdAt: 1 } },
                    },
                  },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          phone: 1,
          email: 1,
          totalAmount: 1,
          totalPaid: 1,
          totalDue: 1,
          "latestTransaction._id": 1,
          "latestTransaction.totalAmount": 1,
          "latestTransaction.paidAmount": 1,
          "latestTransaction.balance": 1,
          "latestTransaction.status": 1,
          "latestTransaction.createdAt": 1,
        },
      },
    ]);

    res.status(200).json(customers);
  } catch (error) {
    console.error("Error fetching customers with transactions:", error);
    res.status(500).json({ error: "Failed to fetch customers with transactions" });
  }
};

// export const getCustomersWithTransactions = async (req, res) => {
//   try {
//     // Fetch all customers who have at least one transaction
//     const customers = await Customer.aggregate([
//       {
//         $lookup: {
//           from: "transactions", // collection name in MongoDB
//           localField: "_id",
//           foreignField: "customerId",
//           as: "transactions",
//         },
//       },
//       { $match: { "transactions.0": { $exists: true } } }, // only those with transactions
//       {
//         $project: {
//           name: 1,
//           phone: 1,
//           email: 1,
//           totalPaid: { $sum: "$transactions.paidAmount" },
//           totalAmount: { $sum: "$transactions.totalAmount" },
//           totalDue: { $subtract: [{ $sum: "$transactions.totalAmount" }, { $sum: "$transactions.paidAmount" }] },
//         },
//       },
//     ]);

//     res.json(customers);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to fetch customers", error: err.message });
//   }
// };

// Update payment
export const updateCustomerPayment = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { paidAmount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    if (!paidAmount || paidAmount <= 0) {
      return res.status(400).json({ message: "Invalid paid amount" });
    }

    const transactions = await Transaction.find({ customerId }).sort({ createdAt: 1 });

    if (!transactions.length) {
      return res.status(404).json({ message: "No transactions found for this customer" });
    }

    let remaining = paidAmount;

    for (let tx of transactions) {
      if (remaining <= 0) break;

      const balance = (tx.totalAmount || 0) - (tx.paidAmount || 0);

      if (balance > 0) {
        const payment = Math.min(balance, remaining);
        tx.paidAmount = (tx.paidAmount || 0) + payment;
        tx.balance = (tx.totalAmount || 0) - tx.paidAmount;
        tx.status = tx.balance === 0 ? "Paid" : "Pending";
        await tx.save();
        remaining -= payment;
      }
    }

    res.json({ message: "Payment updated successfully" });
  } catch (err) {
    console.error("Update Payment Error:", err);
    res.status(500).json({ message: "Failed to update payment", error: err.message });
  }
};

export const updateCustomerTotal = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { products, paidAmount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    // Fetch existing customer
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    // Fetch all existing transactions
    const transactions = await Transaction.find({ customerId });

    // Calculate existing totals
    const totalPaidSoFar = transactions.reduce((sum, tx) => sum + (tx.paidAmount || 0), 0);
    const totalAmountSoFar = transactions.reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);

    // Calculate new transaction totals
    const newTotalAmount = products.reduce((sum, p) => {
      // Each product should have quantity, price, totalAmount
      const productTotal = p.totalAmount || (p.quantity * p.price) || 0;
      return sum + productTotal;
    }, 0);

    const newBalance = totalAmountSoFar + newTotalAmount - (totalPaidSoFar + (paidAmount || 0));

    // Create new transaction
    const transaction = new Transaction({
      customerId,
      products: products.map(p => ({
        categoryId: p.categoryId,
        subCategoryId: p.subCategoryId,
        childCategoryId: p.childCategoryId,
        name: p.name,          // Add child name for reference
        unit: p.unit || "Unit", // Unit (Bag/Kg/etc.)
        price: p.price,
        quantity: p.quantity,
        totalAmount: p.totalAmount || (p.quantity * p.price)
      })),
      totalAmount: newTotalAmount,
      paidAmount: paidAmount || 0,
      balance: newBalance,
      status: newBalance === 0 ? "Paid" : "Pending",
      createdBy: req._id
    });

    await transaction.save();

    res.status(200).json({
      message: "Order updated successfully",
      totalAmount: totalAmountSoFar + newTotalAmount,
      totalPaid: totalPaidSoFar + (paidAmount || 0),
      balance: newBalance
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};