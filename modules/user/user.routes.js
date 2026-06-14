import express from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { allowRoles } from "../../middleware/rbac.middleware.js";
import { getMe } from "./user.controller.js";

const router = express.Router();

router.get("/me", requireAuth, allowRoles("admin", "employee", "user"), getMe);

export default router;