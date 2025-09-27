// routes/analyticsRoutes.js
import express from "express";
import ProductModel from "../models/product_model.js";
import Transaction from "../models/transactions_model.js";

const analyticsRoutes = express.Router();

// ✅ GET summary of all products (cement/rod/etc.) using items array
analyticsRoutes.get("/summary", async (req, res) => {
  try {
    const products = await ProductModel.find().populate("category");
const output = [];

products.forEach((product) => {
  const category = product.category?.name || "Unknown";
  const sub = product.subCategory?.name || "NA";
  const child = product.childCategory?.name || "NA";
  const key = `${category}-${sub}-${child}`;

  // Collect per-unit details
  product.items.forEach((i) => {
    output.push({
      name: key,
      count: i.quantity,
      unit: i.unit,   // ✅ pass unit here
    });
  });
});

res.status(200).json(output);
  } catch (error) {
    console.error("Error in /summary:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET profit summary by category using items array
analyticsRoutes.get("/profit", async (req, res) => {
  try {
    const transactions = await Transaction.find({});

    const summary = {};

    for (const transaction of transactions) {
      for (const item of transaction.products) {
        // ✅ Find product using category/sub/child ids
        const product = await ProductModel.findById(item.childCategoryId).populate("category");


        if (!product) continue;

        const category = product.category?.name || "Unknown";

        if (!summary[category]) {
          summary[category] = { totalSoldAmount: 0, totalCostAmount: 0, profit: 0 };
        }

        const soldAmount = item.totalAmount || 0;

        // ✅ cost = pricePerUnit × qty (from items[0] or match by unit if you store it)
        let cost = 0;
        if (product.items.length > 0) {
          const matchingItem = item.unit
            ? product.items.find((i) => i.unit === item.unit)
            : product.items[0]; // fallback to first
          if (matchingItem) {
            cost = (Number(matchingItem.pricePerUnit) || 0) * (Number(item.quantity) || 0);
          }
        }

        summary[category].totalSoldAmount += soldAmount;
        summary[category].totalCostAmount += cost;
        summary[category].profit += soldAmount - cost;
      }
    }

    // ✅ Total aggregation
    const total = Object.values(summary).reduce(
      (acc, val) => {
        acc.totalSoldAmount += val.totalSoldAmount;
        acc.totalCostAmount += val.totalCostAmount;
        acc.totalProfit += val.profit;
        return acc;
      },
      { totalSoldAmount: 0, totalCostAmount: 0, totalProfit: 0 }
    );

    res.status(200).json({ summary, total });
  } catch (err) {
    console.error("Error in /profit:", err);
    res.status(500).json({ error: err.message });
  }
});
export default analyticsRoutes;
