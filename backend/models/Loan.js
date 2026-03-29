import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    lender: { type: String, trim: true, default: "" },
    principal: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    monthlyPayment: { type: Number, default: 0, min: 0 },
    interestRateAnnual: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "paid_off", "defaulted"],
      default: "active",
    },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

loanSchema.index({ user: 1, startDate: -1 });

export const Loan = mongoose.model("Loan", loanSchema);
