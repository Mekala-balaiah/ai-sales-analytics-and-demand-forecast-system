const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Analytics = require("../models/Analytics");
const Business = require("../models/Business");
const { generateForecasts } = require("../services/forecastingService");

// Get Analytics Dashboard Data
router.get("/:businessId", authMiddleware, async (req, res) => {
  try {
    const { businessId } = req.params;
    const business = await Business.findOne({ _id: businessId, ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    let analytics = await Analytics.findOne({ businessId });
    if (!analytics) {
      // Empty state
      return res.json({
        totalRevenue: 0,
        totalOrders: 0,
        growthPercent: 0,
        averageOrderValue: 0,
        salesOverTime: [],
        productPerformance: [],
        categoryDistribution: [],
        insights: [],
        predictions: []
      });
    }

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Refresh Forecasts
router.post("/:businessId/forecast", authMiddleware, async (req, res) => {
  try {
    const { businessId } = req.params;
    const business = await Business.findOne({ _id: businessId, ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const updatedAnalytics = await generateForecasts(businessId);
    res.json(updatedAnalytics || {});
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

module.exports = router;
