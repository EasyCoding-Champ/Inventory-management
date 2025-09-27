import Product from "../models/product_model.js";

// Create Product
export const createProduct = async (req, res) => {
  try {
    const { title, category, subCategory, childCategory, items } = req.body;

    if (!category || !category._id || !category.name) {
      return res.status(400).json({ error: "Category _id and name are required" });
    }
    if (!subCategory || !subCategory.name) {
      return res.status(400).json({ error: "SubCategory name is required" });
    }

    const preparedItems = (items || []).map((item) => ({
      unit: item.unit || "pcs",
      quantity: Number(item.quantity) || 0,
      pricePerUnit: Number(item.pricePerUnit) || 0,
      totalAmount: (Number(item.quantity) || 0) * (Number(item.pricePerUnit) || 0),
    }));

    const product = new Product({
      title,
      category,
      subCategory,
      childCategory: childCategory || undefined,
      items: preparedItems,
      createdBy: req.user._id,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// Get All Products with pagination & search
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, itemsperpage = 10, search = "", categoryId } = req.query;
    const regex = new RegExp(search, "i");

    const query = { title: regex };

    if (categoryId) query["category._id"] = categoryId;

    const skipItems = (page - 1) * itemsperpage;
    const totalCount = await Product.countDocuments(query);
    const pages_count = Math.ceil(totalCount / itemsperpage);

    const products = await Product.find(query)
      .skip(skipItems)
      .limit(Number(itemsperpage))
      .populate("createdBy");

    res.status(200).json({
      data: products,
      pages_count,
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("createdBy");
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Product by ID
export const updateProductById = async (req, res) => {
  try {
    const { title, category, subCategory, childCategory, items } = req.body;

    const updates = {
      title,
      category,
      subCategory,
      childCategory: childCategory || undefined,
    };

    if (items?.length) {
      updates.items = items.map((item) => ({
        unit: item.unit || "pcs",
        quantity: Number(item.quantity) || 0,
        pricePerUnit: Number(item.pricePerUnit) || 0,
        totalAmount: (Number(item.quantity) || 0) * (Number(item.pricePerUnit) || 0),
      }));
      updates.grandTotalAmount = updates.items.reduce((sum, i) => sum + i.totalAmount, 0);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedProduct)
      return res.status(404).json({ error: "Product not found" });

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete Product by ID
export const deleteProductById = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Product hierarchy
export const getProductHierarchy = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category")
      .populate("subCategory")
      .populate("childCategory");

    const hierarchy = {};
    products.forEach((p) => {
      const catName = p.category?.name || "Unknown";
      const subName = p.subCategory?.name || "None";
      if (!hierarchy[catName]) hierarchy[catName] = {};
      if (!hierarchy[catName][subName]) hierarchy[catName][subName] = [];
      hierarchy[catName][subName].push({
        child: p.childCategory?.name || null,
        productId: p._id,
        items: p.items,
      });
    });

    res.json(hierarchy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
