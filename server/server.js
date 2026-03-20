require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const businessRoutes = require("./routes/businessRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/analytics", analyticsRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai_sales_analytics";

mongoose.connect(MONGO_URI).then(() => {
  console.log("Connected to MongoDB.");
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}).catch(err => {
  console.error("MongoDB Connection Error:", err.message);
});
