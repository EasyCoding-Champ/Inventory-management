import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  products: [
    {
      categoryId: String,
      subCategoryId: String,
      childCategoryId: String,
      quantity: Number,
      price: Number,
      totalAmount: Number,
    },
  ],
  totalAmount: Number,
  paidAmount: Number,
  balance: Number,
  status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Transaction", transactionSchema);
