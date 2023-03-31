const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    mongoose.connect(process.env.mongoURI);
    console.log("MongoDB Connected...");
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
