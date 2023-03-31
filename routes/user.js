const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require('../middleware/auth')

// @route    PUT api/user/update/
// @desc     Update a User
// @access   Private
router.put("/update/", auth, async (req, res) => {
  try {
    const { name, organizationName, email } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      name: name,
      email: email,
      organizationName: organizationName,
    });

    return res.status(200).json({ msg: "User updated" });
  } catch (error) {
    console.error(error.message);
    return res.status(200).json({ msg: "Server Error" });
  }
});

// @route    DELETE api/user/delete/
// @desc     Delete a User
// @access   Private
router.delete("/delete/", auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    return res.status(200).json({ msg: "User Deleted" });
  } catch (error) {
    console.error(error.message);
    return res.status(200).json({ msg: "Server Error" });
  }
});

// @route    GET api/user/search/?q=""
// @desc     Search for users
// @access   Private
router.get("/search/", auth, async (req, res) => {
  try {
    const query = new RegExp(req.query.q, "gi");

    const users = await User.find({
      $or: [{ name: query }, { email: query }, { organizationName: query }],
    }).select("-password");

    return res.json({
      users,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(200).json({ msg: "Server Error" });
  }
});

module.exports = router;
