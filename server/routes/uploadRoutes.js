const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middleware/authMiddleware");
const Business = require("../models/Business");
const ParsedData = require("../models/ParsedData");
const Analytics = require("../models/Analytics");
const { parseFileAndDeriveAnalytics } = require("../services/parserService");
const { recalculateAnalyticsFromScratch } = require("../services/analyticsService");

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

// Get List of Uploaded Files for Business
router.get("/:businessId", authMiddleware, async (req, res) => {
  try {
    const { businessId } = req.params;
    const business = await Business.findOne({ _id: businessId, ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const uploads = await ParsedData.find({ businessId })
      .select("fileName fileType uploadedAt records")
      .sort({ uploadedAt: -1 });

    const summary = uploads.map(u => ({
      _id: u._id,
      fileName: u.fileName,
      fileType: u.fileType,
      uploadedAt: u.uploadedAt,
      recordCount: u.records ? u.records.length : 0
    }));

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Delete Specific File Upload and Recalculate Analytics
router.delete("/:businessId/file/:fileId", authMiddleware, async (req, res) => {
  try {
    const { businessId, fileId } = req.params;
    const business = await Business.findOne({ _id: businessId, ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const deleted = await ParsedData.deleteOne({ _id: fileId, businessId });
    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: "File upload not found" });
    }

    const updatedAnalytics = await recalculateAnalyticsFromScratch(businessId);
    res.json({ message: "File deleted and analytics recalculated successfully", analytics: updatedAnalytics });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Reset/Clear All Uploaded Data for Business
router.delete("/:businessId/reset", authMiddleware, async (req, res) => {
  try {
    const { businessId } = req.params;
    const business = await Business.findOne({ _id: businessId, ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    await ParsedData.deleteMany({ businessId });
    
    let analytics = await Analytics.findOne({ businessId });
    if (analytics) {
      analytics.totalRevenue = 0;
      analytics.totalOrders = 0;
      analytics.averageOrderValue = 0;
      analytics.growthPercent = 0;
      analytics.salesOverTime = [];
      analytics.productPerformance = [];
      analytics.categoryDistribution = [];
      analytics.peakDays = [];
      analytics.peakHours = [];
      analytics.insights = [];
      analytics.predictions = [];
      await analytics.save();
    }

    res.json({ message: "All business data has been reset successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

module.exports = router;
