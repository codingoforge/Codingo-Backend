import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    name:    { type: String, default: "" },
    email:   { type: String, default: "", index: true },
    role: {
      type: String,
      enum: ["admin", "employee", "user"],
      default: "user",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);