const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Project = require("../models/Project");
const Issue = require("../models/Issue");

// @route    GET api/project/get/:projectid
// @desc     Get a project by id
// @access   Private
router.get("/get/:projectid", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectid);

    if (project) {
      return res.status(200).json({ project });
    }

    return res.status(400).json({ error: "Not found" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    GET api/project/check-user/:emailid/:projectid
// @desc     Check if user exists and if he is involved in current project already or can be involved or not
// @access   Public
router.get("/check-user/:emailid/:projectid", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.emailid }).select(
      "-password"
    );

    if (!user) {
      return res.status(400).json({ error: "User doesn't exist" });
    }
    let project = await Project.findById(req.params.projectid);
    if (!project) {
      return res.status(400).json({ error: "Project doesn't exist" });
    }

    project = await Project.find({
      $and: [
        {
          $or: [
            { "clients.email": req.params.emailid },
            { "companyPeople.email": req.params.emailid },
          ],
        },
        {
          _id: req.params.projectid,
        },
      ],
    });

    if (project.length !== 0) {
      return res.status(400).json({ error: "Already added in this project" });
    }

    const projects = await Project.find({
      $or: [
        { "companyPeople.email": req.params.emailid },
        { "clients.email": req.params.emailid },
      ],
    });

    if (projects.length === 4) {
      return res.status(400).json({
        error:
          "Cannot add to the project. Single user can be involved in only 4 projects at a time",
      });
    }

    return res.status(200).json({ msg: "All Good" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    POST api/project/create/new
// @desc     Create a New Project
// @access   Private
router.post("/create/new", auth, async (req, res) => {
  try {
    const { name, description, url, deadline } = req.body;

    if (req.user.role !== "Company") {
      return res.status(401).json({ error: "Not Authorized" });
    }

    const projectHead = req.user.id;
    const user = await User.findById(req.user.id).select("-password");
    const projectHeadName = user.name;
    let companyPeople = [
      {
        id: req.user.id,
        name: user.name,
        role: user.role,
        projectRole: "",
        email: user.email,
      },
    ];

    const project = new Project({
      name,
      description,
      projectHead,
      projectHeadName,
      url,
      companyPeople,
      deadline,
    });

    await project.save();

    return res.status(200).json({ msg: "Project Created" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    GET api/project/check/project/:projectname
// @desc     Check if Project already exists
// @access   Public
router.get("/check/project/:projectname", async (req, res) => {
  try {
    const project = await Project.findOne({ name: req.params.projectname });

    if (project) {
      return res
        .status(400)
        .json({ error: "Project with this name already exists" });
    }

    return res.status(200).json({ msg: "Project Doesn't exists" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    POST api/project/:projectid/add/member/:emailid
// @desc     Add members to the project
// @access   Private
router.post("/:projectid/add/member/:emailid", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.emailid }).select(
      "-password"
    );
    let project = await Project.findOne({
      $and: [
        {
          $or: [
            { "clients.email": req.params.emailid },
            { "companyPeople.email": req.params.emailid },
          ],
        },
        {
          _id: req.params.projectid,
        },
      ],
    });

    if (project) {
      return res.status(400).json({ error: "Already in the project" });
    }

    project = await Project.findById(req.params.projectid);
    if (user.role === "Client") {
      project.clients.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        projectRole: "",
      });
    } else {
      project.companyPeople.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        projectRole: "",
      });
    }

    await project.save();
    return res.status(200).json({ msg: "Member Added to the project" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    DELETE api/project/:projectid/remove/member/:userid
// @desc     Remove a member from project
// @access   Private
router.delete("/:projectid/remove/member/:emailid", auth, async (req, res) => {
  try {
    let project = await Project.findById(req.params.projectid);

    project.clients = project.clients.filter(
      (c) => c.email !== req.params.emailid
    );

    project.companyPeople = project.companyPeople.filter(
      (cp) => cp.email !== req.params.emailid
    );

    await project.save();

    return res.status(200).json({ msg: "Member Removed" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    GET api/project/get/projects/all
// @desc     Get all the projects in which the user is involved
// @access   Private
router.get("/get/projects/all", auth, async (req, res) => {
  try {
    let projects = [];

    if (req.user.role === "Client") {
      projects = await Project.find({ "clients.id": req.user.id });
    } else {
      projects = await Project.find({
        $or: [
          { "companyPeople.id": req.user.id },
          { projectHead: req.user.id },
        ],
      });
    }

    return res.status(200).json({
      projects,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    PUT api/project/update/:projectid
// @desc     Update project details
// @access   Private
router.put("/update/:projectid", auth, async (req, res) => {
  try {
    const { name, description, url, deadline } = req.body;

    if (req.user.role !== "Company") {
      return res.status(401).json({ error: "Not Authorized" });
    }

    await Project.findByIdAndUpdate(req.params.projectid, {
      name: name,
      description: description,
      url: url,
      deadline: deadline,
    });

    return res.status(200).json({ msg: "Project Updated" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    DELETE api/project/delete/:projectid
// @desc     Delete Project
// @access   Private
router.delete("/delete/:projectid", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectid);

    if (project.projectHead.toString() !== req.user.id) {
      return res.status(401).json({ error: "Not authorized" });
    }

    await Issue.deleteMany({ projectId: req.params.projectid });
    await Project.findByIdAndDelete(req.params.projectid);

    return res.status(200).json({ msg: "Project Deleted" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    PUT api/project/update/:projectid/change-project-head/:emailid
// @desc     Change project head of the project to some other user
// @access   Private
router.put(
  "/update/:projectid/change-project-head/:emailid",
  auth,
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectid);

      const user = await User.findOne(
        { email: req.params.emailid },
        { name: 1 }
      );

      await Project.findByIdAndUpdate(req.params.projectid, {
        projectHead: user.id,
        projectHeadName: user.name,
      });

      return res
        .status(200)
        .json({ msg: "Changed Project Head", newHead: user });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ error: "Server Error" });
    }
  }
);

// @route    PUT api/project/add/role/:projectid/:emailid
// @desc     Add/Update project role of a user
// @access   Private
router.put("/add/role/:projectid/:emailid", auth, async (req, res) => {
  try {
    const { projectRole } = req.body;

    const project = await Project.findById(req.params.projectid);
    project.companyPeople.forEach((cp) => {
      if (cp.email === req.params.emailid) {
        cp.projectRole = projectRole;
      }
    });

    await project.save();
    return res.status(200).json({ msg: "Project role updated!" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    GET api/project/get/company-people/:projectid
// @desc     Get Company members of a project
// @access   Private
router.get("/get/company-people/:projectid", auth, async (req, res) => {
  try {
    const members = await Project.findById(req.params.projectid, {
      companyPeople: 1,
    });

    return res.status(200).json({ members: members.companyPeople });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
