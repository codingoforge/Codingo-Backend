import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true },
    description:   { type: String },
    clientClerkId: { type: String, required: true },
    status:        { type: String, enum: ["pending", "active", "paused", "completed"], default: "pending" },
    progress:      { type: Number, default: 0, min: 0, max: 100 },
    tech:          [{ type: String }],
    dueDate:       { type: Date },
    budget:        { type: Number },
    paid:          { type: Number, default: 0 },
    trackingPhase: {
      type: String,
      enum: ["requested", "accepted", "in_development", "shipped", "delivered"],
      default: "requested",
    },
    phaseComments: [{
      phase:  { type: String },
      text:   { type: String },
      author: { type: String },
      date:   { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);