import Transaction from "../models/transactions_model.js";
import Customer from "../models/customer_model.js";
import Product from "../models/product_model.js";

// Create Transaction
export const createTransaction = async (req, res) => {
  try {
    const { customerId, products, paidAmount, totalAmount, balance, status } = req.body;
    const processedProducts = [];
    // Reduce stock based on items array
    for (const item of products) {
      const product = await Product.findById(item.childCategoryId);
      if (!product) continue;

      const productItem = product.items[0];
      if (!productItem) {
        return res.status(400).json({ error: `product not found ${product.childCategory?.name}` });
      }


      if (productItem.quantity < item.quantity) {
        return res.status(400).json({
          error: `Not enough stock for ${product.childCategory?.name}. Available: ${productItem.quantity}`
        });
      }

      productItem.quantity -= item.quantity;
      await product.save();
      // push with unit
      processedProducts.push({
        ...item,
        unit: productItem.unit,
      });
    }

    const transaction = new Transaction({
      customerId,
      products: processedProducts,
      totalAmount,
      paidAmount,
      balance,
      status,
      createdBy: req._id,
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// Get all transactions
export const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, itemsPerPage = 10, search = "" } = req.query;
    const pageNum = parseInt(page);
    const limit = parseInt(itemsPerPage);
    const skip = (pageNum - 1) * limit;

    const query = {};
    if (req.user?._id) {
      query.createdBy = req.user._id;
    }

    if (search) {
      const customers = await Customer.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      query.customerId = { $in: customers.map(c => c._id) };
    }

    const totalCount = await Transaction.countDocuments(query);
    const pages_count = Math.ceil(totalCount / limit);

    const transactions = await Transaction.find(query)
      .populate("customerId", "name phone")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      data: transactions,
      pages_count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get profit data
export const getProfitData = async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);

    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    let totalRevenue = 0;
    let totalCost = 0;

    for (const t of transactions) {
      for (const p of t.products) {
        const product = await Product.findById(p.childCategoryId);
        if (!product) continue;

        const category = product.category?.name?.toLowerCase();
        const productItem = product.items.find(i => i.unit.toLowerCase() === category);
        const costPrice = productItem?.pricePerUnit || 0;

        totalCost += costPrice * p.quantity;
        totalRevenue += p.totalAmount;
      }
    }

    res.json({ totalRevenue, totalCost, profit: totalRevenue - totalCost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
