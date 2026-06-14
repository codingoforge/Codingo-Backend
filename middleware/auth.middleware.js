//middleware/auth.middleware.js
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { findOrCreateUser } from "../modules/user/user.service.js";

const clerkAuth = ClerkExpressRequireAuth();

export const requireAuth = (req, res, next) => {
  clerkAuth(req, res, async () => {
    try {
      const clerkId = req.auth?.userId;
      if (!clerkId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // Find existing user or create from Clerk data — always sets req.user
      req.user = await findOrCreateUser(clerkId);
      next();
    } catch (err) {
      next(err);
    }
  });
};