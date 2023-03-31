const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Issue = require("../models/Issue");
const Project = require("../models/Project");

// @route    POST api/issue/:projectid/create/new
// @desc     Create a Issue
// @access   Private
router.post("/:projectid/create/new", auth, async (req, res) => {
  try {
    const {
      shortSummary,
      description,
      priority,
      estimateInHours,
      assignees,
      status,
    } = req.body;

    let reporter = req.user.id;
    let user = await User.findById(req.user.id, { name: 1 });
    let reporterName = user.name;
    let issue = new Issue({
      shortSummary,
      description,
      priority,
      estimateInHours,
      assignees,
      status,
      reporter,
      reporterName,
      projectId: req.params.projectid,
    });
    await issue.save();
    return res.status(200).json({ msg: "Issue Created" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    GET api/issue/:projectid/issues/all
// @desc     Get all issues of a project
// @access   Private
router.get("/:projectid/issues/all", auth, async (req, res) => {
  try {
    const issues = await Issue.find({ projectId: req.params.projectid });

    return res.status(200).json({
      issues,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    GET api/issue/:projectid/:issueid
// @desc     Get a specific issue
// @access   Private
router.get("/:projectid/:issueid", auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueid);

    return res.status(200).json({
      issue,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    PUT api/issue/update/issue/:issueid
// @desc     Update a issue
// @access   Private
router.put("/update/issue/:issueid", auth, async (req, res) => {
  try {
    let closedOn;
    const {
      shortSummary,
      description,
      priority,
      estimateInHours,
      assignees,
      status,
    } = req.body;

    if (status === "Done") {
      closedOn = new Date().toISOString();

      await Issue.findByIdAndUpdate(req.params.issueid, {
        shortSummary: shortSummary,
        description: description,
        priority: priority,
        estimateInHours: estimateInHours,
        assignees: assignees,
        status: status,
        closedOn: closedOn,
      });
    } else {
      await Issue.findByIdAndUpdate(req.params.issueid, {
        shortSummary: shortSummary,
        description: description,
        priority: priority,
        estimateInHours: estimateInHours,
        assignees: assignees,
        status: status,
        updatedOn: new Date().toISOString(),
        closedOn: "",
      });
    }

    return res.status(200).json({ msg: "Issue Updated" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    DELETE api/issue/delete/issue/:issueid
// @desc     Delete a Issue
// @access   Private
router.delete("/delete/issue/:issueid", auth, async (req, res) => {
  try {
    await Issue.findByIdAndDelete(req.params.issueid);

    return res.status(200).json({ msg: "Issue Deleted" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    GET api/issue/:projectid/download/issues/all
// @desc     Get all issues to download
// @access   Private
router.get("/:projectid/download/issues/all", auth, async (req, res) => {
  try {
    const issues = await Issue.find(
      { projectId: req.params.projectid, status: { $ne: "Done" } },
      { reporter: 0, projectId: 0, comments: 0, description: 0 }
    );

    let downloadIssues = [];

    issues.forEach((issue) => {
      let obj = {
        "Short Summary": issue.shortSummary,
        Reporter: issue.reporterName,
        Priority: issue.priority,
        Status: issue.status,
        "Created On": new Date(issue.createdOn).toDateString(),
        "Estimate (Hours)": issue.estimateInHours,
        Assignees: issue.assignees.map((a) => a.name),
      };

      downloadIssues.push(obj);
    });

    return res.status(200).json({ issues: downloadIssues });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    POST api/issue/:issueid/add/comment/
// @desc     Comment on a issue
// @access   Private
router.post("/:projectid/:issueid/add/comment", auth, async (req, res) => {
  try {
    const { userId, name, commentBody } = req.body;
    let project = await Project.findOne(
      {
        $and: [
          {
            $or: [
              { "clients.id": req.user.id },
              { "companyPeople.id": req.user.id },
            ],
          },
          {
            _id: req.params.projectid,
          },
        ],
      },
      { clients: 1, companyPeople: 1 }
    );

    let user = project.clients.find((c) => c.id.toString() === req.user.id);
    let projectRole = "";
    if (user) {
      projectRole = user.projectRole;
    } else {
      user = project.companyPeople.find((c) => c.id.toString() === req.user.id);
      projectRole = user.projectRole;
    }

    const issue = await Issue.findById(req.params.issueid);
    issue.comments.push({
      userId,
      name,
      projectRole,
      commentBody,
    });

    await issue.save();

    return res.status(200).json({
      msg: "Comment added",
      newComment: {
        _id: issue.comments[0]._id,
        userId,
        name,
        projectRole,
        commentBody,
      },
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    DELETE api/issue/:issueid/delete/comment/:commentid
// @desc     Delete a comment
// @access   Private
router.delete("/:issueid/delete/comment/:commentid", auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueid);

    const newComments = issue.comments.filter(
      (c) => c._id.toString() !== req.params.commentid
    );

    issue.comments = newComments;

    await issue.save();

    return res.status(200).json({ msg: "Comment deleted" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
