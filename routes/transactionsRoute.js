import express from "express";
import {
  createTransaction,
  deleteTransaction,
  getSummaryByUserId,
  getTransactionsByUserId,
} from "../controllers/transactionController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Place specific routes before parameterized catch-alls to avoid shadowing
router.get("/summary/:userId", requireAuth, getSummaryByUserId);
router.get("/:userId", requireAuth, getTransactionsByUserId);
router.post("/", requireAuth, createTransaction);
router.delete("/:id", requireAuth, deleteTransaction);

export default router;
