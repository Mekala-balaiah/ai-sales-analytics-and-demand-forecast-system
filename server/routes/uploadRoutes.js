const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middleware/authMiddleware");
const Business = require("../models/Business");
const ParsedData = require("../models/ParsedData");
const { parseFileAndDeriveAnalytics } = require("../services/parserService");

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.post("/:businessId", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { businessId } = req.params;
    const business = await Business.findOne({ _id: businessId, ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileExt = path.extname(req.file.originalname).toLowerCase().replace(".", "");

    // Let the Background service parse the file, calculate analytics, and store it.
    // For this prototype, we'll do it synchronously.
    const result = await parseFileAndDeriveAnalytics(req.file, businessId, fileExt);

    res.json({ message: "File uploaded and processed successfully", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error during upload", error: err.message });
  } finally {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete processed file:", err);
        else console.log("Cleaned up processed file from uploads directory:", req.file.path);
      });
    }
  }
});

module.exports = router;
