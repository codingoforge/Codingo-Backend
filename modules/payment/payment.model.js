// modules/payment/payment.model.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    clientClerkId: { type: String, required: true },
    projectName:   { type: String, required: true },
    projectId:     { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    amount:        { type: Number, required: true },
    status:        { type: String, enum: ["pending", "paid", "overdue"], default: "pending" },
    date:          { type: Date, default: Date.now },
    invoice:       { type: String },   // URL to invoice PDF/link
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);