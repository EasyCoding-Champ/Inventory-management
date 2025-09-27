import express from "express";
import Customer from "../models/customer_model.js";
import Transaction from "../models/transactions_model.js";

const orderRoutes = express.Router();

// Place order
orderRoutes.post("/place-order", async (req, res) => {
  try {
    const { customer, cart, paidAmount } = req.body;

    // Create customer
    const newCustomer = new Customer({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
    });
    await newCustomer.save();

    // Calculate total and balance
    const totalAmount = cart.reduce((sum, item) => sum + item.totalAmount, 0);
    const balance = totalAmount - (paidAmount || 0);
    const status = balance === 0 ? "Paid" : "Pending";

    // Create transaction
    const newTransaction = new Transaction({
      customer: newCustomer._id,
      products: cart.map((item) => ({
        category: item.category,
        subCategory: item.subCategory,
        childCategory: item.childCategory,
        quantity: item.quantity,
        price: item.price,
        totalAmount: item.totalAmount,
      })),
      totalAmount,
      paidAmount: paidAmount || 0,
      balance,
      status,
    });

    await newTransaction.save();

    res.status(201).json({
      message: "Order placed successfully",
      transaction: newTransaction,
      customer: newCustomer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to place order", error: err.message });
  }
});

export default orderRoutes;
