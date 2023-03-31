const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Organization = require("../models/Organization");
const User = require("../models/User");

// @route     GET /api/organization/check-existence
// @desc      Check if current user is already in a organization
// @access    Private
router.get("/check-existence", auth, async (req, res) => {
  try {
    const organization = await Organization.find({
      $or: [{ "members.id": req.user.id }, { organizationHead: req.user.id }],
    });

    if (organization.length !== 0) {
      return res.status(400).json({ error: "Already in a Organization" });
    } else {
      return res.status(200).json({ msg: "Not in any organization" });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route     POST /api/organization/create
// @desc      Create a Organization
// @access    Private
router.post("/create", auth, async (req, res) => {
  try {
    let organization = await Organization.find({
      $or: [{ "members.id": req.user.id }, { organizationHead: req.user.id }],
    });

    if (organization.length !== 0) {
      return res
        .status(400)
        .json({ error: "Already created the organization" });
    }

    const { name, description } = req.body;
    const user = await User.findById(req.user.id).select("-password");
    const members = [
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    ];

    organization = new Organization({
      name,
      description,
      organizationHead: req.user.id,
      organizationHeadName: user.name,
      members,
    });

    await organization.save();

    return res.status(200).json({ msg: "Organization Created" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route     GET /api/organization/check-user/:emailid
// @desc      Check if user exists and if already in organization
// @access    Public
router.get("/check-user/:organizationid/:emailid", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.emailid }).select(
      "-password"
    );

    if (!user) {
      return res.status(400).json({ error: "User doesn't exist" });
    }

    let organization = await Organization.findById(req.params.organizationid);

    if (!organization) {
      return res.status(400).json({ error: "Organization doesn't exist" });
    }

    organization = await Organization.find({
      $or: [{ "members.id": user.id }, { organizationHead: user.id }],
    });

    if (organization.length !== 0) {
      return res.status(400).json({ error: "Already in a organization" });
    } else {
      return res.status(200).json({ msg: "Not in any organization" });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route     GET /api/organization/my-organization
// @desc      Get the organization in which current user is involved
// @access    Private
router.get("/my-organization", auth, async (req, res) => {
  try {
    const organization = await Organization.find({
      $or: [{ "members.id": req.user.id }, { organizationHead: req.user.id }],
    });

    if (organization.length !== 0) {
      return res.status(200).json({
        organization,
      });
    } else {
      return res.status(400).json({ msg: "Not in any organization" });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route     PUT /api/organization/add/user/:organizationid
// @desc      Add member to the organization
// @access    Public
router.put("/add/user/:organizationid", async (req, res) => {
  try {
    const { email } = req.body;
    let organization = await Organization.findById(req.params.organizationid);
    let member = await User.findOne({ email: email }).select("-password");

    organization.members.push({
      id: member.id,
      name: member.name,
      email: member.email,
    });

    await organization.save();
    return res.status(200).json({ msg: "Member Added" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route     DELETE /api/organization/remove/user/:organizationid/:emailid
// @desc      Remove member from the organization
// @access    Private
router.delete(
  "/remove/user/:organizationid/:emailid",
  auth,
  async (req, res) => {
    try {
      let organization = await Organization.findById(req.params.organizationid);
      let members = organization.members.filter(
        (m) => m.email !== req.params.emailid
      );
      organization.members = members;
      await organization.save();
      return res.status(200).json({ msg: "Member Removed" });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ error: "Server Error" });
    }
  }
);

// @route     PUT /api/organization/change-head/:organizationid
// @desc      Change organization head
// @access    Private
router.put("/change-head/:organizationid", auth, async (req, res) => {
  try {
    const { email } = req.body;
    let organization = await Organization.findById(req.params.organizationid);
    let user = await User.findOne({ email: email }).select("-password");

    organization.organizationHead = user.id;
    organization.organizationHeadName = user.name;

    await organization.save();
    return res.status(200).json({
      msg: "Organization Head Changed",
      newHead: { id: user.id, name: user.name },
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route     PUT /api/organization/update/details/
// @desc      Update organization details
// @access    Private
router.put("/update/details/", auth, async (req, res) => {
  try {
    let organization = await Organization.find({
      $or: [{ "members.id": req.user.id }, { organizationHead: req.user.id }],
    });

    if (organization.length === 0) {
      return res.status(400).json({ error: "Not in a Organization" });
    }

    const { name, description } = req.body;

    await Organization.findByIdAndUpdate(organization[0].id, {
      name: name,
      description: description,
    });

    return res.status(200).json({ msg: "Organization Updated" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route     DELETE /api/organization/delete/:organizationid
// @desc      Delete an organization
// @access    Private
router.delete("/delete/:organizationid", auth, async (req, res) => {
  try {
    await Organization.findByIdAndDelete(req.params.organizationid);
    return res.status(200).json({ msg: "Organization deleted" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route     GET /api/organization/get/members
// @desc      Get organization members
// @access    Private
router.get("/get/members", auth, async (req, res) => {
  try {
    let organizationMembers = await Organization.findOne(
      {
        $or: [{ "members.id": req.user.id }, { organizationHead: req.user.id }],
      },
      { members: 1 }
    );

    return res.status(200).json({ organizationMembers });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
