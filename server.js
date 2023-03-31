const express = require("express");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 5001;
const connectDB = require("./db/db");
const cors = require("cors");

app.use("/public", express.static("public"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json());
app.use(cors());

connectDB();

app.use("/api/auth/", require("./routes/auth"));
app.use("/api/issue/", require("./routes/issue"));
app.use("/api/project/", require("./routes/project"));
app.use("/api/user/", require("./routes/user"));
app.use("/api/organization", require("./routes/organization"));

app.get("/", (req, res) => {
  res.send("Server Running");
});

app.listen(PORT, () => console.log(`Server started at Port ${PORT}`));
