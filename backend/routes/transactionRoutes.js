import { Router } from "express";
import { body, param } from "express-validator";
import {
  createTransaction,
  deleteTransaction,
  getSummary,
  getTimeseries,
  getTransaction,
  listTransactions,
  updateTransaction,
} from "../controllers/transactionController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = Router();

router.use(requireAuth);

const idParam = [param("id").isMongoId(), validateRequest];

const createRules = [
  body("title").trim().notEmpty(),
  body("amount").isFloat({ min: 0 }),
  body("type").isIn(["income", "expense"]),
  body("date").isISO8601(),
  body("medium").optional().trim(),
  body("category").optional().trim(),
];

const updateRules = [
  body("title").optional().trim().notEmpty(),
  body("amount").optional().isFloat({ min: 0 }),
  body("type").optional().isIn(["income", "expense"]),
  body("date").optional().isISO8601(),
  body("medium").optional().trim(),
  body("category").optional().trim(),
];

router.get("/stats/summary", getSummary);
router.get("/stats/timeseries", getTimeseries);
router.get("/", listTransactions);
router.get("/:id", ...idParam, getTransaction);
router.post("/", createRules, validateRequest, createTransaction);
router.patch("/:id", ...idParam, updateRules, validateRequest, updateTransaction);
router.delete("/:id", ...idParam, deleteTransaction);

export default router;
