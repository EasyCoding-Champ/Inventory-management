import mongoose from "mongoose";

const childCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  children: [childCategorySchema], // champion, plus, etc.
});

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // cement, rod, ring, etc.
    subCategories: [subCategorySchema], // prism, ultratech, tata, etc.
    createdBy: {
      ref: "User",
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    editedBy: {
      ref: "User",
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

const CategoryModel = mongoose.model("Category", categorySchema);

export default CategoryModel;
