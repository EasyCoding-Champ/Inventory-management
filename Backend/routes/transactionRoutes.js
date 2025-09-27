import express from "express";
import { createTransaction, getAllTransactions, getProfitData } from "../controllers/transactionController.js";
import { isAuthenticated } from "../middlewares/user_auth.js";

const transactionRoutes = express.Router();
transactionRoutes.post("/", createTransaction);
transactionRoutes.get("/", getAllTransactions);
transactionRoutes.get("/profit", isAuthenticated, getProfitData);

export default transactionRoutes;
