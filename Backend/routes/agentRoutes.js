import express from "express";
import Product from "../models/product_model.js";
import Transaction from "../models/transactions_model.js";
import Customer from "../models/customer_model.js";
import nlp from "compromise";
import { GoogleGenAI } from "@google/genai"; // Updated import

const agentRoutes = express.Router();

// Initialize Google AI Client
const googleClient = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

agentRoutes.post("/", async (req, res) => {
  try {
    const { query } = req.body;

    const products = await Product.find();
    let transactions = await Transaction.find()
      .populate("customerId", "name phone address");

    let matchedCustomer = null;
    let filteredTransactions = transactions;

    if (query) {
      matchedCustomer = await Customer.findOne({
        $or: [
          { name: new RegExp(query, "i") },
          { phone: new RegExp(query, "i") },
        ],
      });

      if (matchedCustomer) {
        filteredTransactions = transactions.filter(
          (t) =>
            t.customerId &&
            t.customerId._id.toString() === matchedCustomer._id.toString()
        );
      }
    }

    const nlpQuery = nlp(query.toLowerCase());

    let shopRelated =
      matchedCustomer ||
      nlpQuery.has("profit") ||
      nlpQuery.has("sales") ||
      nlpQuery.has("paid") ||
      nlpQuery.has("pending") ||
      nlpQuery.has("customer") ||
      nlpQuery.has("stock") ||
      nlpQuery.has("balance");

    let answer = "";
    let summary = null;
    let transactionsData = [];
    let productBalances = [];

    if (shopRelated) {
      // === SHOP AGENT LOGIC ===
      let totalCost = 0,
        totalRevenue = 0,
        totalProfit = 0,
        totalPaid = 0,
        totalPending = 0;

      filteredTransactions.forEach((t) => {
        totalRevenue += t.totalAmount || 0;
        totalPaid += t.paidAmount || 0;
        totalPending += t.balance || 0;

        t.products.forEach((item) => {
          const matchingProduct = products.find(
            (p) => p._id.toString() === item.childCategoryId?.toString()
          );
          if (matchingProduct && matchingProduct.items.length > 0) {
            const costPrice = matchingProduct.items[0].pricePerUnit || 0;
            totalCost += costPrice * item.quantity;
            totalProfit += (item.totalAmount || 0) - costPrice * item.quantity;
          }
        });
      });

      summary = {
        shopName: "Bhawani Traders",
        totalProducts: products.length,
        totalTransactions: filteredTransactions.length,
        totalRevenue,
        totalCost,
        totalProfit,
        totalPaid,
        totalPending,
      };

      const detailedTransactions = filteredTransactions.map((t) => ({
        id: t._id,
        customer: t.customerId?.name || "Unknown",
        phone: t.customerId?.phone || "",
        totalAmount: t.totalAmount,
        paidAmount: t.paidAmount,
        balance: t.balance,
        status: t.status,
        products: t.products.map((p) => ({
          name: p.name,
          childCategoryId: p.childCategoryId,
          quantity: p.quantity,
          unit: p.unit,
          total: p.totalAmount,
        })),
        createdAt: t.createdAt,
      }));

      productBalances = products.map((p) => {
        let totalSold = 0;
        transactions.forEach((t) => {
          t.products.forEach((tp) => {
            if (tp.childCategoryId?.toString() === p._id.toString()) {
              totalSold += tp.quantity;
            }
          });
        });
        const initialQty =
          p.items && p.items.length > 0
            ? p.items[0].totalPurchaseQuantity
            : 0;
        const balanceQty = initialQty - totalSold;
        return {
          productId: p._id,
          name: p.name,
          childCategory: p.childCategory?.name || "N/A",
          initialQty,
          soldQty: totalSold,
          balanceQty,
          unit: p.items[0]?.unit || "",
        };
      });

      if (matchedCustomer) {
        answer = `Showing transactions for customer: ${matchedCustomer.name}`;
      } else if (nlpQuery.has("profit")) {
        answer = `Total Profit: ₹${totalProfit}`;
      } else if (nlpQuery.has("sales") || nlpQuery.has("revenue")) {
        answer = `Total Sales: ₹${totalRevenue}`;
      } else if (nlpQuery.has("paid")) {
        answer = `Total Paid: ₹${totalPaid}`;
      } else if (nlpQuery.has("pending") || nlpQuery.has("due")) {
        answer = `Total Pending: ₹${totalPending}`;
      } else if (nlpQuery.has("customer") || nlpQuery.has("customers")) {
        answer = `We have ${await Customer.countDocuments()} customers.`;
      } else if (nlpQuery.has("stock") || nlpQuery.has("balance")) {
        answer = `Product stock balance:\n${productBalances
          .map(
            (pb) =>
              `${pb.childCategory}: ${pb.balanceQty} ${pb.unit} (Sold: ${pb.soldQty})`
          )
          .join("\n")}`;
      } else {
        answer = "Sorry, I didn’t understand that. Please try another query.";
      }

      transactionsData = detailedTransactions;
    } else {
      // === GOOGLE AI AGENT LOGIC ===
      const googleResponse = await googleClient.models.generateContent({
        model: "gemini-2.0-flash", // Example model
        contents: query
      });

      answer =
        googleResponse?.candidates?.[0]?.content ||
        "No response from Google AI";
    }
    res.json({
      answer,
      summary,
      products: shopRelated ? products : [],
      productBalances,
      transactions: transactionsData,
    });
  } catch (err) {
    console.error("Agent Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default agentRoutes;
