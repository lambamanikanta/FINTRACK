import mongoose from "mongoose";
import { validationResult } from "express-validator";
import { Loan } from "../models/Loan.js";

export async function listLoans(req, res) {
  const filter = { user: req.user.id };
  if (req.query.status === "active" || req.query.status === "paid_off" || req.query.status === "defaulted") {
    filter.status = req.query.status;
  }
  const items = await Loan.find(filter).sort({ startDate: -1 }).lean();
  return res.json({ items });
}

export async function getLoan(req, res) {
  const loan = await Loan.findOne({ _id: req.params.id, user: req.user.id }).lean();
  if (!loan) {
    return res.status(404).json({ message: "Loan not found" });
  }
  return res.json(loan);
}

export async function createLoan(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const {
    title,
    lender,
    principal,
    paidAmount,
    monthlyPayment,
    interestRateAnnual,
    startDate,
    endDate,
    status,
    notes,
  } = req.body;

  const loan = await Loan.create({
    user: req.user.id,
    title,
    lender: lender ?? "",
    principal: Number(principal),
    paidAmount: paidAmount != null ? Number(paidAmount) : 0,
    monthlyPayment: monthlyPayment != null ? Number(monthlyPayment) : 0,
    interestRateAnnual: interestRateAnnual != null ? Number(interestRateAnnual) : 0,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
    status: status || "active",
    notes: notes ?? "",
  });
  return res.status(201).json(loan);
}

export async function updateLoan(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const updates = {};
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.lender !== undefined) updates.lender = req.body.lender;
  if (req.body.principal !== undefined) updates.principal = Number(req.body.principal);
  if (req.body.paidAmount !== undefined) updates.paidAmount = Number(req.body.paidAmount);
  if (req.body.monthlyPayment !== undefined) updates.monthlyPayment = Number(req.body.monthlyPayment);
  if (req.body.interestRateAnnual !== undefined) updates.interestRateAnnual = Number(req.body.interestRateAnnual);
  if (req.body.startDate !== undefined) updates.startDate = new Date(req.body.startDate);
  if (req.body.endDate !== undefined) updates.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;

  const loan = await Loan.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { $set: updates }, {
    new: true,
    runValidators: true,
  });
  if (!loan) {
    return res.status(404).json({ message: "Loan not found" });
  }
  return res.json(loan);
}

export async function deleteLoan(req, res) {
  const result = await Loan.deleteOne({ _id: req.params.id, user: req.user.id });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: "Loan not found" });
  }
  return res.status(204).send();
}

/** Summary: per-loan outstanding summed (active loans only). */
export async function loanSummary(req, res) {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const [row] = await Loan.aggregate([
    { $match: { user: userId, status: "active" } },
    {
      $addFields: {
        loanOutstanding: {
          $max: [{ $subtract: ["$principal", "$paidAmount"] }, 0],
        },
      },
    },
    {
      $group: {
        _id: null,
        outstanding: { $sum: "$loanOutstanding" },
        totalPrincipal: { $sum: "$principal" },
        totalPaid: { $sum: "$paidAmount" },
        count: { $sum: 1 },
      },
    },
  ]);
  return res.json({
    activeCount: row?.count ?? 0,
    totalPrincipal: row?.totalPrincipal ?? 0,
    totalPaid: row?.totalPaid ?? 0,
    outstanding: row?.outstanding ?? 0,
  });
}
