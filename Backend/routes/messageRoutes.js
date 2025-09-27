import express from "express";
import { sendDueMessage } from "../controllers/messageController.js";

const router = express.Router();

router.post("/send", sendDueMessage);

export default router;
