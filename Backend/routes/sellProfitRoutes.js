import express from "express";
import ProductModel from "../models/product_model.js";
import Transaction from "../models/transactions_model.js";
import { Parser as Json2csvParser } from "json2csv";
import PDFDocument from "pdfkit";

const sellProfitRoutes = express.Router();

// ✅ Profit Summary with optional date filter
sellProfitRoutes.get("/profit", async (req, res) => {
  try {
    const { year, month } = req.query;

    const startDate = year && month
      ? new Date(year, month - 1, 1)
      : new Date(0);
    const endDate = year && month
      ? new Date(year, month, 0, 23, 59, 59)
      : new Date();

    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const summary = {};

    for (const transaction of transactions) {
      for (const item of transaction.products) {
        const product = await ProductModel.findById(item.childCategoryId).populate("category");

        if (!product) continue;

        const category = product.category?.name || "Unknown";

        if (!summary[category]) {
          summary[category] = { totalSoldAmount: 0, totalCostAmount: 0, profit: 0 };
        }

        const soldAmount = Number(item.totalAmount) || 0;

        let cost = 0;
        if (product.items.length > 0) {
          const matchingItem = item.unit
            ? product.items.find((i) => i.unit === item.unit)
            : product.items[0];
          if (matchingItem) {
            cost = (Number(matchingItem.pricePerUnit) || 0) * (Number(item.quantity) || 0);
          }
        }

        summary[category].totalSoldAmount += soldAmount;
        summary[category].totalCostAmount += cost;
        summary[category].profit += soldAmount - cost;
      }
    }

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

// ✅ Monthly Statement with CSV/PDF download
sellProfitRoutes.get("/statement", async (req, res) => {
  try {
    const { year, month, day, format } = req.query;

    let monthNum = Number(month);
    if (!monthNum || monthNum < 1 || monthNum > 12) {
      monthNum = new Date().getMonth() + 1; // fallback to current month
    }
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[monthNum - 1];

    if (!year || !month) {
      return res.status(400).json({ error: "Year and month are required" });
    }

    // Set date range
    let startDate = new Date(year, month - 1, 1, 0, 0, 0);
    let endDate = new Date(year, month, 0, 23, 59, 59);

    if (day) {
      startDate = new Date(year, month - 1, day, 0, 0, 0);
      endDate = new Date(year, month - 1, day, 23, 59, 59);
    }

    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const rows = [];

    for (const transaction of transactions) {
      for (const item of transaction.products) {
        const product = await ProductModel.findById(item.childCategoryId).populate("category");
        if (!product) continue;

        const category = product.category?.name || "Unknown";
        const quantity = Number(item.quantity) || 0;
        const sold = Number(item.totalAmount) || 0;

        let cost = 0;
        if (product.items.length > 0) {
          const matchingItem = item.unit
            ? product.items.find((i) => i.unit === item.unit)
            : product.items[0];
          if (matchingItem) {
            cost = (Number(matchingItem.pricePerUnit) || 0) * quantity;
          }
        }

        rows.push({
          Date: transaction.createdAt.toISOString().split("T")[0],
          Category: category,
          Quantity: quantity,
          Sold: sold,
          Cost: cost,
          Profit: sold - cost
        });
      }
    }

    // ✅ PDF output
    if (format === "pdf") {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=statement_${year}_${monthName}${day ? "_" + day : ""}.pdf`
      );
      doc.pipe(res);

      // HEADER
      doc.fontSize(20).text("Bhawani Traders", { align: "center" });
      doc.fontSize(12).text("Address: LadhPur BathuaBazar", { align: "center" });
      doc.fontSize(12).text("Phone: 761877164", { align: "center" });
      doc.moveDown();
      doc.fontSize(14).text(
        `Statement for ${day ? `Day ${day}` : `Month ${monthName}`} of ${year}`,
        { align: "center" }
      );
      doc.moveDown();

      // Table setup
      const tableTop = doc.y + 10;
      const columnWidths = [80, 100, 60, 60, 60, 60];
      const headers = ["Date", "Category", "Quantity", "Sold", "Cost", "Profit"];
      const startX = 50;
      let y = tableTop;

      // Draw cell with border
      function drawCell(x, y, w, h, text, align = "left", color = "black", bold = false) {
        doc.rect(x, y, w, h).stroke();
        if (bold) doc.font("Helvetica-Bold"); else doc.font("Helvetica");
        doc.fillColor(color).fontSize(10).text(text, x + 5, y + 5, {
          width: w - 10,
          align
        });
        doc.fillColor("black");
        doc.font("Helvetica");
      }

      // Header row
      let x = startX;
      headers.forEach((h, i) => {
        drawCell(x, y, columnWidths[i], 20, h, "center", "blue", true);
        x += columnWidths[i];
      });
      y += 20;

      // Group by category
      const grouped = rows.reduce((acc, row) => {
        if (!acc[row.Category]) acc[row.Category] = [];
        acc[row.Category].push(row);
        return acc;
      }, {});

      for (const category in grouped) {
        const catRows = grouped[category];

        for (const row of catRows) {
          let x = startX;
          drawCell(x, y, columnWidths[0], 20, row.Date, "center");
          x += columnWidths[0];
          drawCell(x, y, columnWidths[1], 20, row.Category, "center");
          x += columnWidths[1];
          drawCell(x, y, columnWidths[2], 20, row.Quantity.toString(), "right");
          x += columnWidths[2];
          drawCell(x, y, columnWidths[3], 20, String(row.Sold), "right");
          x += columnWidths[3];
          drawCell(x, y, columnWidths[4], 20, String(row.Cost), "right");
          x += columnWidths[4];
          drawCell(x, y, columnWidths[5], 20, String(row.Profit), "right");
          y += 20;

          if (y > doc.page.height - 50) {
            doc.addPage();
            y = 50;
          }
        }

        // Subtotal for category
        const subtotal = catRows.reduce(
          (acc, r) => {
            acc.Quantity += r.Quantity;
            acc.Sold += r.Sold;
            acc.Cost += r.Cost;
            acc.Profit += r.Profit;
            return acc;
          },
          { Quantity: 0,Sold: 0, Cost: 0, Profit: 0 }
        );

        let xSub = startX;
        drawCell(xSub, y, columnWidths[0], 20, "");
        xSub += columnWidths[0];
        drawCell(xSub, y, columnWidths[1], 20, "Subtotal", "center", "green", true);
        xSub += columnWidths[1];
        drawCell(xSub, y, columnWidths[2], 20, String(subtotal.Quantity),"right", "green");
        xSub += columnWidths[2];
        drawCell(xSub, y, columnWidths[3], 20, String(subtotal.Sold), "right", "green");
        xSub += columnWidths[3];
        drawCell(xSub, y, columnWidths[4], 20, String(subtotal.Cost), "right", "green");
        xSub += columnWidths[4];
        drawCell(xSub, y, columnWidths[5], 20, String(subtotal.Profit), "right", "green");
        y += 25;
      }

      // Grand Total
      const totals = rows.reduce(
        (acc, row) => {
          acc.Quantity += row.Quantity;
          acc.Sold += row.Sold;
          acc.Cost += row.Cost;
          acc.Profit += row.Profit;
          return acc;
        },
        { Quantity: 0,Sold: 0, Cost: 0, Profit: 0 }
      );

      let xTot = startX;
      drawCell(xTot, y, columnWidths[0], 25, "");
      xTot += columnWidths[0];
      drawCell(xTot, y, columnWidths[1], 25, "GRAND TOTAL", "center", "red", true);
      xTot += columnWidths[1];
      drawCell(xTot, y, columnWidths[2], 25, String(totals.Quantity), "right", "red", true);
      xTot += columnWidths[2];
      drawCell(xTot, y, columnWidths[3], 25, String(totals.Sold), "right", "red", true);
      xTot += columnWidths[3];
      drawCell(xTot, y, columnWidths[4], 25, String(totals.Cost), "right", "red", true);
      xTot += columnWidths[4];
      drawCell(xTot, y, columnWidths[5], 25, String(totals.Profit), "right", "red", true);

      // FOOTER
      doc.moveDown(2);
      doc.fontSize(10).text("Generated by Bhawani Traders", { align: "center" });

      doc.end();
      return;
    }

    res.status(200).json({ rows });
  } catch (err) {
    console.error("Error in /statement:", err);
    res.status(500).json({ error: err.message });
  }
});
export default sellProfitRoutes;
