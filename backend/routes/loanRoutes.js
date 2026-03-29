import { Router } from "express";
import { body, param } from "express-validator";
import {
  createLoan,
  deleteLoan,
  getLoan,
  listLoans,
  loanSummary,
  updateLoan,
} from "../controllers/loanController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = Router();

router.use(requireAuth);

const idParam = [param("id").isMongoId(), validateRequest];

const createRules = [
  body("title").trim().notEmpty(),
  body("principal").isFloat({ min: 0 }),
  body("startDate").isISO8601(),
  body("lender").optional().trim(),
  body("paidAmount").optional().isFloat({ min: 0 }),
  body("monthlyPayment").optional().isFloat({ min: 0 }),
  body("interestRateAnnual").optional().isFloat({ min: 0 }),
  body("endDate").optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body("status").optional().isIn(["active", "paid_off", "defaulted"]),
  body("notes").optional().trim(),
];

const updateRules = [
  body("title").optional().trim().notEmpty(),
  body("principal").optional().isFloat({ min: 0 }),
  body("startDate").optional().isISO8601(),
  body("lender").optional().trim(),
  body("paidAmount").optional().isFloat({ min: 0 }),
  body("monthlyPayment").optional().isFloat({ min: 0 }),
  body("interestRateAnnual").optional().isFloat({ min: 0 }),
  body("endDate")
    .optional({ nullable: true })
    .custom((v) => v == null || v === "" || !Number.isNaN(Date.parse(v))),
  body("status").optional().isIn(["active", "paid_off", "defaulted"]),
  body("notes").optional().trim(),
];

router.get("/stats/summary", loanSummary);
router.get("/", listLoans);
router.get("/:id", ...idParam, getLoan);
router.post("/", createRules, validateRequest, createLoan);
router.patch("/:id", ...idParam, updateRules, validateRequest, updateLoan);
router.delete("/:id", ...idParam, deleteLoan);

export default router;
