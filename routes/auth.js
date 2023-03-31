const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();
const FRONTEND_URL = process.env.FRONTEND_URL;

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// @route    GET api/auth/
// @desc     Get current user
// @access   Private
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) return res.status(400).json({ error: "User not found!" });

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    POST api/auth/login
// @desc     Login a user
// @access   Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid Credentials" });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(payload, process.env.JWT_SECRET, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    POST api/auth/check-email/registration
// @desc     Check if Email exists and mail link for registration
// @access   Public
router.post("/check-email/registration", async (req, res) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    const payload = {
      user: {
        email: email,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5m" },
      (err, token) => {
        if (err) throw err;
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Registration Link",
          text: `Please click on the link below to register yourself. (Expires in 5 mins) \nLink : ${FRONTEND_URL}register/${token}`,
        });
      }
    );

    return res.status(200).json({ msg: "Registration mail Sent" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    POST api/auth/check-email/forgot-password
// @desc     Check if Email exists and send link to change password via email
// @access   Public
router.post("/check-email/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User doesn't exists" });
    }

    const payload = {
      user: {
        email: email,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5m" },
      (err, token) => {
        if (err) throw err;
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Change Password",
          text: `Please click on the link below to change your password. (Expires in 5 mins)\nLink : ${FRONTEND_URL}change-password/${email}/${token}`,
        });
      }
    );

    return res.status(200).json({ msg: "Change password mail Sent" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    PUT api/auth/change-password
// @desc     Change password
// @access   Private
router.put("/change-password", auth, async (req, res) => {
  try {
    const { email, password } = req.body;

    const salt = await bcrypt.genSalt(10);

    let hashedPassword = await bcrypt.hash(password, salt);

    await User.findOneAndUpdate({ email: email }, { password: hashedPassword });

    return res.status(200).json({ msg: "Password Changed" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

// @route    POST api/auth/register
// @desc     Register a User
// @access   Private
router.post("/register", auth, async (req, res) => {
  try {
    const { name, role, email, password } = req.body;

    let user = new User({
      name,
      role,
      email,
      password,
    });

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(payload, process.env.JWT_SECRET, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
