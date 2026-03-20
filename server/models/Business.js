const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  industryType: { type: String },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Business", businessSchema);
