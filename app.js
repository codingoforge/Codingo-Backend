// app.js — updated with project + payment routes
import express from "express";
import cors from "cors";
import userRoutes    from "./modules/user/user.routes.js";
import projectRoutes from "./modules/project/project.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import currencyRoutes from "./modules/currency/currency.routes.js";


const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://codingoforge.vercel.app",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());

// ── Routes ──
app.use("/api/users",    userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/currency", currencyRoutes);
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || "Server Error" });
});

export default app;