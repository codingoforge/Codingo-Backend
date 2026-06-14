// scripts/seedProjects.js
// Run: node scripts/seedProjects.js

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

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
    phaseComments: [
      {
        phase:  { type: String },
        text:   { type: String },
        author: { type: String },
        date:   { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

// ── Dhawal's clerkId from MongoDB Atlas ──
const DHAWAL_CLERK_ID = "user_3CFn3vHUlhR8n3hS1LNfjvKG16p";

const testProjects = [
  {
    name: "CodingoForge Landing Page",
    description: "Full redesign of the marketing landing page with animations and SEO optimization.",
    clientClerkId: DHAWAL_CLERK_ID,
    status: "active",
    progress: 65,
    tech: ["React", "Tailwind", "Framer Motion"],
    dueDate: new Date("2026-05-15"),
    budget: 25000,
    paid: 12500,
    trackingPhase: "in_development",
    phaseComments: [
      {
        phase: "accepted",
        text: "Project scoped and approved. Starting design phase next week.",
        author: "Coding Forge",
        date: new Date("2026-04-10"),
      },
      {
        phase: "in_development",
        text: "Hero section and navbar complete. Working on features section now.",
        author: "Coding Forge",
        date: new Date("2026-04-18"),
      },
    ],
  },
  {
    name: "Admin Dashboard Portal",
    description: "Internal dashboard for managing clients, projects, and payments with role-based access.",
    clientClerkId: DHAWAL_CLERK_ID,
    status: "active",
    progress: 40,
    tech: ["React", "Node.js", "MongoDB", "Clerk"],
    dueDate: new Date("2026-06-01"),
    budget: 40000,
    paid: 10000,
    trackingPhase: "accepted",
    phaseComments: [
      {
        phase: "accepted",
        text: "Requirements finalized. Backend API structure ready.",
        author: "Coding Forge",
        date: new Date("2026-04-20"),
      },
    ],
  },
  {
    name: "Mobile App – React Native",
    description: "Cross-platform mobile app for iOS and Android with push notifications.",
    clientClerkId: DHAWAL_CLERK_ID,
    status: "pending",
    progress: 0,
    tech: ["React Native", "Expo", "Firebase"],
    dueDate: new Date("2026-08-01"),
    budget: 60000,
    paid: 0,
    trackingPhase: "requested",
    phaseComments: [],
  },
  {
    name: "E-commerce Store",
    description: "Full-stack e-commerce platform with cart, checkout, and Razorpay integration.",
    clientClerkId: DHAWAL_CLERK_ID,
    status: "completed",
    progress: 100,
    tech: ["Next.js", "Stripe", "PostgreSQL"],
    dueDate: new Date("2026-03-01"),
    budget: 35000,
    paid: 35000,
    trackingPhase: "delivered",
    phaseComments: [
      {
        phase: "shipped",
        text: "Deployed to production. Please review and test checkout flow.",
        author: "Coding Forge",
        date: new Date("2026-02-20"),
      },
      {
        phase: "delivered",
        text: "All feedback addressed. Project officially delivered!",
        author: "Coding Forge",
        date: new Date("2026-03-01"),
      },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Remove existing test projects for this user (clean slate)
    const deleted = await Project.deleteMany({ clientClerkId: DHAWAL_CLERK_ID });
    console.log(`🗑️  Removed ${deleted.deletedCount} existing projects for Dhawal`);

    // Insert fresh test projects
    const inserted = await Project.insertMany(testProjects);
    console.log(`🚀 Inserted ${inserted.length} test projects:`);
    inserted.forEach(p => console.log(`   • ${p.name} [${p.status}] → ${p.trackingPhase}`));

    await mongoose.disconnect();
    console.log("✅ Done! Disconnected from MongoDB.");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();