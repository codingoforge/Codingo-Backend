//modules/admin/admin.routes.js
import express from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { allowRoles } from "../../middleware/rbac.middleware.js";
import { getAllUsers, promoteUser, demoteUser, makeAdmin } from "./admin.controller.js";

const router = express.Router();

// All admin routes require auth + admin role
router.use(requireAuth, allowRoles("admin"));

router.get("/users", getAllUsers);
router.patch("/users/:id/promote", promoteUser);
router.patch("/users/:id/demote", demoteUser);
router.patch("/users/:id/make-admin", makeAdmin);

export default router;