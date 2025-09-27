import express from "express";
import companyModel from "../models/company_model.js";
import { isAuthenticated } from "../middlewares/user_auth.js";

const companyRouter = express.Router();

// GET all categories
companyRouter.get("/", async (req, res, next) => {
  try {
    const categories = await companyModel.find()
      .populate("createdBy")
      .populate("editedBy");
    return res.status(200).json(categories || []);
  } catch (e) {
    next(e);
  }
});

// GET company by ID
companyRouter.get("/:id", async (req, res, next) => {
  try {
    const company = await companyModel.findById(req.params.id)
      .populate("createdBy")
      .populate("editedBy");
    return res.status(200).json(company);
  } catch (e) {
    next(e);
  }
});

// CREATE new company
companyRouter.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { name, subCategories } = req.body;
    const user_id = req.user._id;

    const company = new companyModel({
      name,
      subCategories,
      createdBy: user_id,
    });

    await company.save();
    return res.status(201).json({ message: "Category Created Successfully" });
  } catch (e) {
    next(e);
  }
});

// UPDATE company
companyRouter.patch("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const { name, subCategories } = req.body;
    const editedBy = req.user._id;

    await companyModel.findByIdAndUpdate(req.params.id, {
      $set: { name, subCategories, editedBy },
    });

    return res.status(200).json({ message: "Category Updated Successfully" });
  } catch (e) {
    next(e);
  }
});

// DELETE category
companyRouter.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await companyModel.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({ message: "Category Deleted Successfully" });
  } catch (e) {
    next(e);
  }
});


export default companyRouter;
