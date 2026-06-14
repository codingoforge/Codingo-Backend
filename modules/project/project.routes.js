import express from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { allowRoles } from "../../middleware/rbac.middleware.js";
import { getMyProjects, updateProjectStatus } from "./project.controller.js";

const router = express.Router();

router.get("/", requireAuth, allowRoles("admin", "employee", "user"), getMyProjects);
router.patch("/:id/status", requireAuth, allowRoles("admin"), updateProjectStatus);

export default router;