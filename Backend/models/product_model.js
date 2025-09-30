import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    // e.g. cement, rod, ring
    unit: { type: String, default: "pcs" }, // e.g. bag, kg, piece
    quantity: { type: Number, default: 0 }, // count/weight
    totalPurchaseQuantity:{ type: Number, default: 0 },
    pricePerUnit: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // product title

    // dropdown selection
    category: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
      name: { type: String, required: true },
    },
    subCategory: {
      _id: { type: String },
      name: { type: String, required: true },
    },
    childCategory: {
      _id: { type: String },
      name: { type: String },
    },

    // items (cement, rod, ring, etc.)
    items: [ItemSchema],

    // grand total for all items
    grandTotalAmount: { type: Number, default: 0 },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-calc totals before save
ProductSchema.pre("save", function (next) {
  let total = 0;

  this.items = this.items.map((item) => {
    const calcTotal =
      (item.totalPurchaseQuantity || 0) * (item.pricePerUnit || 0);
    item.totalAmount = calcTotal;
    total += calcTotal;
    return item;
  });

  this.grandTotalAmount = total;
  next();
});

const Product = mongoose.model("Product", ProductSchema);

export default Product;
