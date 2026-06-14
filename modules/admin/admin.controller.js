//modules/admin/admin.controller.js
import User from "../user/user.model.js";

// GET /api/admin/users — all users sorted newest first
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select("-__v");
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// PATCH /api/admin/users/:id/promote — set role to employee
export const promoteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Cannot change admin role" });
    }

    user.role = "employee";
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to promote user" });
  }
};

// PATCH /api/admin/users/:id/demote — set role back to user
export const demoteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Cannot demote an admin" });
    }

    user.role = "user";
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to demote user" });
  }
};

// PATCH /api/admin/users/:id/make-admin — promote to admin (use carefully)
export const makeAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.role = "admin";
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to make admin" });
  }
};