const express = require("express");
const router = express.Router();
const Business = require("../models/Business");
const authMiddleware = require("../middleware/authMiddleware");

// Create Business
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { businessName, industryType } = req.body;
    const business = new Business({
      businessName,
      industryType,
      ownerId: req.user.id
    });
    await business.save();
    res.status(201).json(business);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Get User's Businesses
router.get("/", authMiddleware, async (req, res) => {
  try {
    const businesses = await Business.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Get Single Business
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });
    res.json(business);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Delete Single Business
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    // Clean up parsed data
    const ParsedData = require("../models/ParsedData");
    await ParsedData.deleteMany({ businessId: req.params.id });

    res.json({ message: "Business deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

module.exports = router;
