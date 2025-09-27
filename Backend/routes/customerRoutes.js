import express from "express";
import { getCustomersWithTransactions,updateCustomerPayment,updateCustomerTotal,createCustomer, getAllCustomers } from "../controllers/customerController.js";

const customerRoutes = express.Router();
customerRoutes.get("/with-transactions", getCustomersWithTransactions);

// Update customer payment
customerRoutes.put("/:customerId/pay", updateCustomerPayment);
customerRoutes.put("/:customerId/update-total", updateCustomerTotal)
customerRoutes.post("/", createCustomer);
customerRoutes.get("/", getAllCustomers);

export default customerRoutes;
