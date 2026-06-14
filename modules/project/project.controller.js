import Project from "./project.model.js";

// GET /api/projects — user sees own, admin + employee see all
export const getMyProjects = async (req, res, next) => {
  try {
    const clerkId = req.user?.clerkId;
    const role    = req.user?.role;

    const projects = (role === "admin" || role === "employee")
      ? await Project.find().sort({ createdAt: -1 })
      : await Project.find({ clientClerkId: clerkId }).sort({ createdAt: -1 });

    res.json({ success: true, projects });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:id/status — admin only
export const updateProjectStatus = async (req, res, next) => {
  try {
    const { status, trackingPhase } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (status) project.status = status;
    if (trackingPhase) project.trackingPhase = trackingPhase;

    await project.save();

    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};