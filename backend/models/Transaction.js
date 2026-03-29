import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    date: { type: Date, required: true, index: true },
    medium: { type: String, trim: true, default: "Other" },
    category: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, date: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
