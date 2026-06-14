/**
 * One-time script to make a user admin by their email.
 *
 * Usage:
 *   node scripts/makeAdmin.js your@email.com
 *
 * Run AFTER that user has signed in at least once (so they exist in MongoDB).
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "../modules/user/user.model.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/makeAdmin.js your@email.com");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

const user = await User.findOneAndUpdate(
  { email },
  { role: "admin" },
  { new: true }
);

if (!user) {
  console.error(`No user found with email: ${email}`);
  console.error("Make sure this user has signed in at least once first.");
  process.exit(1);
}

console.log(`✅ ${user.name || user.email} is now an admin.`);
process.exit(0);