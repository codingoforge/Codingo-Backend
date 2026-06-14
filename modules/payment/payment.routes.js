// modules/payment/payment.routes.js
import express from "express";
import { allowRoles } from "../../middleware/rbac.middleware.js";
import { getMyPayments } from "./payment.controller.js";

const router = express.Router();

router.get("/", allowRoles("admin", "employee", "user"), getMyPayments);

export default router;

// ─────────────────────────────────────────────────────────────────────────────
// modules/payment/payment.controller.js
// ─────────────────────────────────────────────────────────────────────────────
// import Payment from "./payment.model.js";
//
// export const getMyPayments = async (req, res, next) => {
//   try {
//     const clerkId = req.auth?.userId;
//     const role    = req.auth?.role;
//
//     const payments = role === "admin"
//       ? await Payment.find().sort({ date: -1 })
//       : await Payment.find({ clientClerkId: clerkId }).sort({ date: -1 });
//
//     res.json({ success: true, payments });
//   } catch (err) {
//     next(err);
//   }
// };