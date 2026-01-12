var express = require("express");
var router = express.Router();
var Project = require("../models/project");
var User = require("../models/user");

// Middleware to require login
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/users/login");
  }
  next();
}

/* GET projects listing (non-archived). */
router.get("/", async function (req, res, next) {
  try {
    const projects = await Project.find({ archived: { $ne: true } }).populate(
      "leader",
      "ime email"
    );
    res.render("projects/index", { projects: projects });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* GET my projects (as leader, non-archived). */
router.get("/my", requireLogin, async function (req, res, next) {
  try {
    const projects = await Project.find({
      leader: req.session.userId,
      archived: { $ne: true },
    }).populate("leader", "ime email");
    res.render("projects/my", { projects: projects });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* GET member projects (as team member, non-archived). */
router.get("/member", requireLogin, async function (req, res, next) {
  try {
    const projects = await Project.find({
      teamMembers: req.session.userId,
      leader: { $ne: req.session.userId },
      archived: { $ne: true },
    }).populate("leader", "ime email");
    res.render("projects/member", { projects: projects });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* GET archived projects (user was leader or member). */
router.get("/archive", requireLogin, async function (req, res, next) {
  try {
    const projects = await Project.find({
      archived: true,
      $or: [
        { leader: req.session.userId },
        { teamMembers: req.session.userId },
      ],
    }).populate("leader", "ime email");
    res.render("projects/archive", { projects: projects });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* GET new project form. */
router.get("/new", requireLogin, function (req, res, next) {
  res.render("projects/new");
});

/* GET edit project form (for leaders). */
router.get("/:id/edit", requireLogin, async function (req, res, next) {
  try {
    const project = await Project.findById(req.params.id)
      .populate("leader", "ime email")
      .populate("teamMembers", "ime email");
    if (!project) return res.status(404).send("Project not found");

    // Only leader can edit the project fully
    if (
      project.leader &&
      project.leader._id.toString() !== req.session.userId
    ) {
      return res.status(403).send("You are not the leader of this project");
    }

    const users = await User.find({}, "ime email");
    res.render("projects/edit", { project: project, users: users });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* GET member edit form (only finishedWork). */
router.get("/:id/member-edit", requireLogin, async function (req, res, next) {
  try {
    const project = await Project.findById(req.params.id)
      .populate("leader", "ime email")
      .populate("teamMembers", "ime email");
    if (!project) return res.status(404).send("Project not found");

    // Check if user is a team member
    const isMember = project.teamMembers.some(
      (m) => m._id.toString() === req.session.userId
    );
    if (!isMember) {
      return res.status(403).send("You are not a member of this project");
    }

    res.render("projects/member-edit", { project: project });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* POST create new project. */
router.post("/", requireLogin, async function (req, res, next) {
  try {
    const projectData = { ...req.body, leader: req.session.userId };
    const project = new Project(projectData);
    await project.save();
    res.redirect("/projects/my");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

/* POST update project (for leaders). */
router.post("/:id/update", requireLogin, async function (req, res, next) {
  try {
    const existingProject = await Project.findById(req.params.id);
    if (!existingProject) return res.status(404).send("Project not found");

    // Only leader can update
    if (
      existingProject.leader &&
      existingProject.leader.toString() !== req.session.userId
    ) {
      return res.status(403).send("You are not the leader of this project");
    }

    // Handle checkbox for archived
    const updateData = { ...req.body };
    updateData.archived = req.body.archived === "on";

    const project = await Project.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    res.redirect("/projects/my");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

/* POST member update (only finishedWork). */
router.post(
  "/:id/member-update",
  requireLogin,
  async function (req, res, next) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).send("Project not found");

      // Check if user is a team member
      const isMember = project.teamMembers.some(
        (m) => m.toString() === req.session.userId
      );
      if (!isMember) {
        return res.status(403).send("You are not a member of this project");
      }

      // Only update finishedWork
      project.finishedWork = req.body.finishedWork;
      await project.save();
      res.redirect("/projects/member");
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
);

/* POST delete project. */
router.post("/:id/delete", requireLogin, async function (req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).send("Project not found");

    // Only leader can delete
    if (project.leader && project.leader.toString() !== req.session.userId) {
      return res.status(403).send("You are not the leader of this project");
    }

    await Project.findByIdAndDelete(req.params.id);
    res.redirect("/projects/my");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* POST add team member to project. */
router.post("/:id/members", requireLogin, async function (req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).send("Project not found");

    // Only leader can add members
    if (project.leader && project.leader.toString() !== req.session.userId) {
      return res.status(403).send("You are not the leader of this project");
    }

    // Add user ID to team members (but not leader)
    if (req.body.userId && !project.teamMembers.includes(req.body.userId)) {
      // Prevent adding leader as team member
      if (project.leader && req.body.userId === project.leader.toString()) {
        return res.status(400).send("Leader cannot be added as a team member");
      }
      project.teamMembers.push(req.body.userId);
      await project.save();
    }
    res.redirect("/projects/" + req.params.id + "/edit");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

/* POST remove team member from project. */
router.post(
  "/:id/members/:memberId/delete",
  requireLogin,
  async function (req, res, next) {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).send("Project not found");

      // Only leader can remove members
      if (project.leader && project.leader.toString() !== req.session.userId) {
        return res.status(403).send("You are not the leader of this project");
      }

      project.teamMembers = project.teamMembers.filter(
        (m) => m.toString() !== req.params.memberId
      );
      await project.save();
      res.redirect("/projects/" + req.params.id + "/edit");
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
);

/* GET specific project details. */
router.get("/:id", async function (req, res, next) {
  try {
    const project = await Project.findById(req.params.id)
      .populate("leader", "ime email")
      .populate("teamMembers", "ime email");
    if (!project) return res.status(404).send("Project not found");

    const users = await User.find({}, "ime email");
    const isLeader =
      req.session.userId &&
      project.leader &&
      project.leader._id.toString() === req.session.userId;

    res.render("projects/show", {
      project: project,
      users: users,
      isLeader: isLeader,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
